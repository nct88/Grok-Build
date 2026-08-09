/**
 * Composer slash helpers — TUI-aligned shortcuts for Desktop.
 * globalThis.GrokSlashCommands
 */
(() => {
  /**
   * @typedef {{
   *   codingDataRetentionOptOut?: boolean|null,
   *   imagineVideoBlocked?: boolean,
   * }} SlashContext
   */

  /**
   * Preflight copy for Imagine video (privacy opt-out / ZDR).
   * @param {SlashContext} [ctx]
   */
  function imagineVideoPreflightNote(ctx) {
    if (ctx?.imagineVideoBlocked || ctx?.codingDataRetentionOptOut === true) {
      return (
        `PREFLIGHT (Desktop): coding_data_retention_opt_out is true on this account. ` +
        `image_to_video will almost certainly fail with HTTP 400 "upload_url" / ZDR. ` +
        `Do NOT invent a .mp4 path. Tell the user to open Grok TUI → /privacy → Opt in to ` +
        `coding data retention, re-login Desktop, then retry. Still create/deliver the still frame if useful.\n\n`
      );
    }
    return "";
  }

  /** @type {{ id: string, label: string, hint?: string, insert: string, expand?: (arg: string, ctx?: SlashContext) => string }[]} */
  const COMMANDS = [
    {
      id: "imagine",
      label: "/imagine",
      hint: "Generate an image",
      insert: "/imagine ",
      expand: (arg) => {
        const d = String(arg || "").trim();
        if (!d) {
          return (
            "Use the Imagine skill and image_gen tool to create an image. " +
            "Ask me for a short description if needed."
          );
        }
        return (
          `Use the Imagine skill and the image_gen tool to generate an image.\n` +
          `Description: ${d}\n` +
          `Choose a sensible aspect_ratio. After generating, report the saved file path clearly ` +
          `so it can be previewed (prefer writing under the project or a user-visible path; ` +
          `session paths like images/1.jpg are fine).`
        );
      },
    },
    {
      id: "imagine-video",
      label: "/imagine-video",
      hint: "Generate a short video (needs privacy Opt in)",
      insert: "/imagine-video ",
      expand: (arg, ctx) => {
        const d = String(arg || "").trim();
        const pre = imagineVideoPreflightNote(ctx);
        if (!d) {
          return (
            pre +
            "Use the Imagine skill and the image_to_video (or reference_to_video) tools to create a short video. " +
            "Default: ONE 6s clip. Ask me for a short description if needed. Report every saved path (images/… and videos/…)."
          );
        }
        return (
          pre +
          `Use the Imagine skill and available video tools to create a short video.\n` +
          `Description: ${d}\n` +
          `Default: ONE clip only (unless I ask for multi-shot / longer narrative).\n` +
          `Pipeline:\n` +
          `1) Prefer 6s @ 480p. Aspect ratio comes from the source image (e.g. 1:1).\n` +
          `2) Create a strong first frame with image_gen (or image_edit from a reference I already have / attached).\n` +
          `3) Animate with image_to_video (image + short present-tense motion prompt, 1–2 sentences). ` +
          `Use reference_to_video only if I explicitly ask or the shot needs multiple refs.\n` +
          `4) After success, report the full saved paths for the frame and the .mp4 so the desktop can preview ` +
          `(images/… and videos/… are fine).\n` +
          `If image_to_video fails with Zero Data Retention / upload_url / HTTP 400:\n` +
          `- Stop; do not invent multi-shot FFmpeg workarounds or fake .mp4 paths.\n` +
          `- Explain: usually coding data retention is Opt out (/privacy → Opt in) OR team ZDR is Active (Console → Disable).\n` +
          `- Still deliver any still frame path that was created.`
        );
      },
    },
    {
      id: "usage",
      label: "/usage",
      hint: "Open usage in Settings",
      insert: "/usage",
      expand: null, // handled by UI
    },
    {
      id: "settings",
      label: "/settings",
      hint: "Open Settings",
      insert: "/settings",
      expand: null,
    },
    {
      id: "marketplace",
      label: "/marketplace",
      hint: "Open plugin marketplace",
      insert: "/marketplace",
      expand: null,
    },
    {
      id: "plugins",
      label: "/plugins",
      hint: "Open plugins panel",
      insert: "/plugins",
      expand: null,
    },
  ];

  /**
   * Detect `/command rest` at start of prompt.
   * @param {string} text
   * @returns {{ id: string, arg: string, raw: string } | null}
   */
  function parseLeadingSlash(text) {
    const s = String(text || "").trim();
    const m = s.match(/^\/([a-zA-Z][\w-]*)(?:\s+([\s\S]*))?$/);
    if (!m) return null;
    return { id: m[1].toLowerCase(), arg: (m[2] || "").trim(), raw: s };
  }

  /**
   * Expand known slash for agent prompt, or return UI action.
   * @param {string} text
   * @param {SlashContext} [ctx]
   * @returns {{ kind: 'prompt', text: string, id?: string } | { kind: 'ui', action: string } | { kind: 'passthrough', text: string }}
   */
  function resolveSlash(text, ctx) {
    const parsed = parseLeadingSlash(text);
    if (!parsed) return { kind: "passthrough", text: String(text || "") };
    const cmd = COMMANDS.find((c) => c.id === parsed.id);
    if (!cmd) return { kind: "passthrough", text: String(text || "") };
    if (!cmd.expand) {
      return { kind: "ui", action: cmd.id };
    }
    return {
      kind: "prompt",
      id: cmd.id,
      text: cmd.expand(parsed.arg, ctx || {}),
    };
  }

  /**
   * Slash menu while typing `/...` at start.
   * @param {string} value
   * @param {number} caret
   */
  function menuForInput(value, caret) {
    const text = String(value ?? "");
    const pos = Math.max(0, Math.min(Number(caret) || 0, text.length));
    // Only when line starts with /
    if (!text.startsWith("/")) return null;
    // No menu if caret left the first token area beyond first space + long arg (still show filtered)
    const before = text.slice(0, pos);
    if (before.includes("\n")) return null;
    const m = before.match(/^\/([\w-]*)$/);
    if (!m) return null; // after space, hide menu (user is typing args)
    const q = m[1].toLowerCase();
    const items = COMMANDS.filter(
      (c) => !q || c.id.startsWith(q) || c.label.slice(1).startsWith(q),
    );
    if (!items.length) return null;
    return { query: q, start: 0, end: pos, items };
  }

  /**
   * Extract image/video file refs from assistant text for preview.
   * @param {string} text
   * @returns {{ kind: 'image'|'video', src: string, alt?: string }[]}
   */
  function extractMediaRefs(text) {
    const s = String(text || "");
    /** @type {{ kind: 'image'|'video', src: string, alt?: string }[]} */
    const out = [];
    const seen = new Set();
    const push = (kind, src, alt) => {
      let u = String(src || "").trim().replace(/^['"`]+|['"`]+$/g, "");
      if (!u) return;
      // Skip doc placeholders (e.g. path.png examples, <project>, ellipsis)
      if (/[<>…]|\.\.\./.test(u)) return;
      if (/^(path|file|image|example)\.(png|jpe?g|gif|webp)$/i.test(u)) return;
      // Keep %3A / %5C in session folder names — main resolves on disk as-is
      u = u.replace(/^file:\/\//i, "").replace(/^\/([A-Za-z]:)/, "$1");
      if (!/[\\/]/.test(u) && !u.startsWith("data:") && !/^https?:/i.test(u)) {
        if (
          !/^\d+\.(png|jpe?g|gif|webp|mp4|webm|mov)$/i.test(u) &&
          !/^(images|videos)[\\/]/i.test(u)
        ) {
          return;
        }
      }
      const key = `${kind}:${u}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ kind, src: u, alt: alt || "" });
    };

    // Markdown images ![alt](url) — may also wrap video paths
    const mdImg = /!\[([^\]]*)\]\(([^)\n]+)\)/g;
    let m;
    while ((m = mdImg.exec(s))) {
      const src = m[2].trim().replace(/^<|>$/g, "");
      const isVid = /\.(mp4|webm|mov)(\?|$)/i.test(src);
      push(isVid ? "video" : "image", src, m[1]);
    }

    // Markdown / HTML-ish links to media [label](path.png)
    const mdLink =
      /\[([^\]]*)\]\(([^)\n]+\.(?:png|jpe?g|gif|webp|bmp|svg|mp4|webm|mov)(?:\?[^)\s]*)?)\)/gi;
    while ((m = mdLink.exec(s))) {
      const src = m[2].trim();
      const isVid = /\.(mp4|webm|mov)(\?|$)/i.test(src);
      push(isVid ? "video" : "image", src, m[1]);
    }

    // file:// or absolute / relative paths ending with media ext
    const pathRe =
      /(?:^|[\s`'"(\[])((?:[A-Za-z]:[\\/]|\/|file:\/\/|\.\/|\.\.\/|images[\\/]|videos[\\/]|~\/|\.grok[\\/])[^\s`'")\]]+\.(?:png|jpe?g|gif|webp|bmp|svg|mp4|webm|mov))/gi;
    while ((m = pathRe.exec(s))) {
      const isVid = /\.(mp4|webm|mov)$/i.test(m[1]);
      push(isVid ? "video" : "image", m[1]);
    }

    // Bare session-relative: images/1.jpg, videos/1.mp4
    const relImg =
      /(?:^|[\s`'"(\[])((?:images|\.\/images)[\\/][^\s`'")\]]+\.(?:png|jpe?g|gif|webp|bmp|svg|mp4|webm|mov))/gi;
    while ((m = relImg.exec(s))) {
      const isVid = /\.(mp4|webm|mov)$/i.test(m[1]);
      push(isVid ? "video" : "image", m[1]);
    }
    const relVid =
      /(?:^|[\s`'"(\[])((?:videos|\.\/videos)[\\/][^\s`'")\]]+\.(?:mp4|webm|mov))/gi;
    while ((m = relVid.exec(s))) {
      push("video", m[1]);
    }

    // data:image
    const dataRe = /(data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+)/g;
    while ((m = dataRe.exec(s))) {
      push("image", m[1]);
    }

    return out.slice(0, 16);
  }

  globalThis.GrokSlashCommands = {
    COMMANDS,
    parseLeadingSlash,
    resolveSlash,
    menuForInput,
    extractMediaRefs,
    imagineVideoPreflightNote,
  };
})();
