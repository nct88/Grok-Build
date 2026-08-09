/**
 * Phase A2 — virtualized timeline over GrokEventStore.
 * Windowed DOM when item count is large; always mounts live streaming nodes.
 */
(() => {
  const VIRTUAL_THRESHOLD = 64;
  const OVERSCAN = 10;
  const EST = {
    user: 72,
    assistant: 140,
    thought: 48,
    step: 28,
    error: 64,
    review: 52,
    foot: 24,
    empty: 100,
    tool: 56,
    tool_group: 52,
    permission: 88,
  };

  /**
   * @param {HTMLElement} root
   * @param {{
   *   store: ReturnType<typeof globalThis.GrokEventStore.create>,
   *   showReasoning?: () => boolean,
   *   openExternal?: (href: string) => void,
   *   onReview?: (meta: object) => void,
   *   onPermission?: (requestId: string, optionId: string) => void,
   *   resolveMediaSrc?: (src: string) => Promise<string|null>,
   *   resolveMedia?: (src: string) => Promise<{url:string,path?:string,mimeType?:string,kind?:string}|null>,
   *   onMediaActivate?: (info: object) => void,
   *   onMediaContext?: (info: object, pos: {x:number,y:number}) => void,
   *   emptyTitle?: () => string,
   *   emptyBody?: () => string,
   * }} opts
   */
  function createTimelineView(root, opts) {
    const store = opts.store;
    const off = globalThis.GrokOffthread;
    const md = globalThis.GrokMarkdown;
    const slash = globalThis.GrokSlashCommands;

    root.classList.add("timeline", "tl-virtual");
    root.innerHTML = `
      <div class="tl-spacer tl-spacer-top" aria-hidden="true"></div>
      <div class="tl-window"></div>
      <div class="tl-spacer tl-spacer-bottom" aria-hidden="true"></div>
    `;
    const spacerTop = root.querySelector(".tl-spacer-top");
    const spacerBottom = root.querySelector(".tl-spacer-bottom");
    const windowEl = root.querySelector(".tl-window");

    /** @type {Map<number, HTMLElement>} */
    const nodeMap = new Map();
    /** @type {Map<number, number>} */
    const heightCache = new Map();
    let stickToBottom = true;
    let renderScheduled = false;
    let disposed = false;

    function estimateHeight(item) {
      if (heightCache.has(item.id)) return heightCache.get(item.id);
      const base = EST[item.kind] || 48;
      const lines = Math.ceil((item.text || "").length / 90);
      return base + Math.min(400, Math.max(0, lines - 2) * 16);
    }

    function measure(el, id) {
      if (!el) return;
      const h = el.getBoundingClientRect().height;
      if (h > 0) heightCache.set(id, h);
    }

    function isNearBottom() {
      return root.scrollHeight - root.scrollTop - root.clientHeight < 80;
    }

    function scrollEnd(force) {
      if (!force && !stickToBottom) return;
      requestAnimationFrame(() => {
        root.scrollTop = root.scrollHeight;
      });
    }

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function placeholderSvg(label, sub) {
      const a = label || "Loading…";
      const b = sub || "";
      return (
        "data:image/svg+xml," +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140"><rect fill="#1a1a1a" width="100%" height="100%"/><text x="50%" y="${b ? "45%" : "50%"}" fill="#888" font-size="12" text-anchor="middle" dy=".3em">${a}</text>${b ? `<text x="50%" y="62%" fill="#666" font-size="10" text-anchor="middle">${b}</text>` : ""}</svg>`,
        )
      );
    }

    /**
     * @param {HTMLElement} mediaEl
     * @param {{ kind: string, rawSrc: string, displayUrl?: string|null, filePath?: string|null, mimeType?: string|null, alt?: string }} info
     */
    function bindMediaChrome(mediaEl, info) {
      mediaEl.classList.add("media-interactive");
      mediaEl.title = "Click to enlarge · Right-click for more";
      const getInfo = () => ({
        kind: info.kind,
        rawSrc: info.rawSrc,
        displayUrl: info.displayUrl || mediaEl.getAttribute("src") || "",
        filePath: info.filePath || "",
        mimeType: info.mimeType || "",
        alt: info.alt || "",
      });
      mediaEl.addEventListener("click", (e) => {
        // Let native video controls work for play/scrub; only enlarge on poster/body click outside controls is hard —
        // double-click / click when not interacting with controls: use click on card chrome for video enlarge via button
        if (info.kind === "video" && e.target?.closest?.("video")) {
          // single click on video = play; use double-click to enlarge
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        opts.onMediaActivate?.(getInfo());
      });
      if (info.kind === "video") {
        mediaEl.addEventListener("dblclick", (e) => {
          e.preventDefault();
          e.stopPropagation();
          opts.onMediaActivate?.(getInfo());
        });
      }
      mediaEl.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        opts.onMediaContext?.(getInfo(), { x: e.clientX, y: e.clientY });
      });
    }

    async function resolveRef(ref) {
      if (ref.src.startsWith("data:") || /^https?:\/\//i.test(ref.src)) {
        return {
          url: ref.src,
          path: "",
          mimeType: ref.kind === "video" ? "video/mp4" : "image/png",
          kind: ref.kind,
        };
      }
      if (opts.resolveMedia) {
        const meta = await opts.resolveMedia(ref.src);
        if (meta?.url) {
          return {
            url: meta.url,
            path: meta.path || "",
            mimeType: meta.mimeType || "",
            kind: meta.kind || ref.kind,
          };
        }
        return null;
      }
      if (opts.resolveMediaSrc) {
        const url = await opts.resolveMediaSrc(ref.src);
        return url ? { url, path: "", mimeType: "", kind: ref.kind } : null;
      }
      return null;
    }

    function mountMediaStrip(el, item) {
      if (item.streaming) return;
      const refs =
        item.meta?.media ||
        (slash?.extractMediaRefs ? slash.extractMediaRefs(item.text || "") : []);
      if (!refs?.length) return;
      let strip = el.querySelector(".media-strip");
      if (!strip) {
        strip = document.createElement("div");
        strip.className = "media-strip";
        el.appendChild(strip);
      }
      strip.innerHTML = "";
      for (const ref of refs.slice(0, 8)) {
        const card = document.createElement("div");
        card.className = "media-card";
        card.dataset.rawSrc = ref.src;
        card.dataset.kind = ref.kind || "image";

        if (ref.kind === "video") {
          const v = document.createElement("video");
          v.className = "media-video media-broken";
          v.controls = true;
          v.preload = "metadata";
          v.playsInline = true;
          // Placeholder — local paths must be resolved (CSP blocks file://)
          card.appendChild(v);
          const applyVideo = (meta) => {
            if (!v.isConnected) return;
            if (meta?.url) {
              v.src = meta.url;
              v.classList.remove("media-broken");
              v.dataset.filePath = meta.path || "";
              bindMediaChrome(v, {
                kind: "video",
                rawSrc: ref.src,
                displayUrl: meta.url,
                filePath: meta.path || "",
                mimeType: meta.mimeType || "video/mp4",
                alt: ref.alt || "",
              });
              // Context menu also on card (controls eat some events)
              card.oncontextmenu = (e) => {
                e.preventDefault();
                opts.onMediaContext?.(
                  {
                    kind: "video",
                    rawSrc: ref.src,
                    displayUrl: meta.url,
                    filePath: meta.path || "",
                    mimeType: meta.mimeType || "video/mp4",
                    alt: ref.alt || "",
                  },
                  { x: e.clientX, y: e.clientY },
                );
              };
            } else {
              v.classList.add("media-broken");
              v.removeAttribute("src");
            }
          };
          if (ref.src.startsWith("data:") || /^https?:\/\//i.test(ref.src)) {
            applyVideo({ url: ref.src, path: "", mimeType: "video/mp4" });
          } else {
            resolveRef(ref).then(applyVideo);
          }
        } else {
          const img = document.createElement("img");
          img.className = "media-img";
          img.alt = ref.alt || "image";
          img.loading = "lazy";
          img.dataset.rawSrc = ref.src;
          img.src = placeholderSvg("Loading…");
          card.appendChild(img);
          const applySrc = (meta) => {
            if (!img.isConnected) return;
            const url = typeof meta === "string" ? meta : meta?.url;
            const filePath = typeof meta === "object" && meta ? meta.path || "" : "";
            const mimeType =
              typeof meta === "object" && meta ? meta.mimeType || "image/png" : "image/png";
            if (url) {
              img.src = url;
              img.classList.remove("media-broken");
              img.dataset.filePath = filePath;
              bindMediaChrome(img, {
                kind: "image",
                rawSrc: ref.src,
                displayUrl: url,
                filePath,
                mimeType,
                alt: ref.alt || "",
              });
              card.oncontextmenu = (e) => {
                e.preventDefault();
                opts.onMediaContext?.(
                  {
                    kind: "image",
                    rawSrc: ref.src,
                    displayUrl: url,
                    filePath,
                    mimeType,
                    alt: ref.alt || "",
                  },
                  { x: e.clientX, y: e.clientY },
                );
              };
            } else {
              img.classList.add("media-broken");
              img.src = placeholderSvg("Preview failed", "Right-click for options");
              bindMediaChrome(img, {
                kind: "image",
                rawSrc: ref.src,
                displayUrl: "",
                filePath: "",
                mimeType: "",
                alt: ref.alt || "",
              });
            }
          };
          if (ref.src.startsWith("data:")) {
            applySrc({ url: ref.src, path: "", mimeType: "image/png" });
          } else if (/^https?:\/\//i.test(ref.src)) {
            img.onerror = () => {
              resolveRef(ref).then(applySrc);
            };
            img.src = ref.src;
            bindMediaChrome(img, {
              kind: "image",
              rawSrc: ref.src,
              displayUrl: ref.src,
              filePath: "",
              mimeType: "image/png",
              alt: ref.alt || "",
            });
          } else {
            resolveRef(ref).then(applySrc);
          }
        }
        const cap = document.createElement("div");
        cap.className = "media-cap";
        const name =
          (ref.alt || ref.src || "").replace(/\\/g, "/").split("/").pop() || "";
        cap.textContent = name;
        cap.title = ref.src;
        // Enlarge button for videos (single-click plays)
        if (ref.kind === "video") {
          const zoomBtn = document.createElement("button");
          zoomBtn.type = "button";
          zoomBtn.className = "media-zoom-btn";
          zoomBtn.textContent = "Enlarge";
          zoomBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const v = card.querySelector("video");
            opts.onMediaActivate?.({
              kind: "video",
              rawSrc: ref.src,
              displayUrl: v?.src || "",
              filePath: v?.dataset?.filePath || "",
              mimeType: "video/mp4",
              alt: ref.alt || "",
            });
          };
          card.appendChild(zoomBtn);
        }
        card.appendChild(cap);
        strip.appendChild(card);
      }
    }

    function hydrateImages(el) {
      for (const img of el.querySelectorAll("img.md-img[data-raw-src], img.md-img")) {
        const raw =
          img.getAttribute("data-raw-src") ||
          img.dataset?.rawSrc ||
          img.getAttribute("src") ||
          "";
        if (!raw) continue;
        if (img.dataset.mediaBound === "1") continue;
        img.dataset.mediaBound = "1";
        const apply = (meta) => {
          if (!img.isConnected) return;
          const url = typeof meta === "string" ? meta : meta?.url;
          const filePath = typeof meta === "object" && meta ? meta.path || "" : "";
          if (url) {
            img.src = url;
            img.dataset.filePath = filePath;
          }
          bindMediaChrome(img, {
            kind: "image",
            rawSrc: raw,
            displayUrl: url || img.src,
            filePath,
            mimeType: (typeof meta === "object" && meta?.mimeType) || "image/png",
            alt: img.alt || "",
          });
        };
        if (raw.startsWith("data:") || /^https?:\/\//i.test(raw)) {
          apply({ url: raw, path: "", mimeType: "image/png" });
          continue;
        }
        if (opts.resolveMedia) {
          opts.resolveMedia(raw).then(apply);
        } else if (opts.resolveMediaSrc) {
          opts.resolveMediaSrc(raw).then((url) => apply(url ? { url, path: "" } : null));
        }
      }
    }

    function bindAssistantContent(el, item, structured) {
      const text = item.text || "";
      if (!text) {
        el.textContent = "";
        return;
      }
      // Streaming: plain/fast path to avoid markdown thrash every frame
      if (item.streaming || !structured) {
        el.classList.add("md-body");
        el.classList.remove("md-structured");
        // Light markdown only when idle stream chunks are large-ish
        if (!item.streaming && md?.setStructuredContent) {
          md.setStructuredContent(el, text, opts.openExternal);
          hydrateImages(el);
          mountMediaStrip(el, item);
        } else {
          el.textContent = text;
        }
        return;
      }
      if (off?.renderMarkdownHtml) {
        const gen = item.id;
        el.dataset.mdPending = "1";
        off.renderMarkdownHtml(text).then((html) => {
          if (disposed || el.dataset.itemId !== String(gen)) return;
          delete el.dataset.mdPending;
          off.applyStructuredHtml(el, html, opts.openExternal);
          hydrateImages(el);
          mountMediaStrip(el, item);
          measure(el, item.id);
        });
      } else if (md?.setStructuredContent) {
        md.setStructuredContent(el, text, opts.openExternal);
        hydrateImages(el);
        mountMediaStrip(el, item);
      } else {
        el.textContent = text;
        mountMediaStrip(el, item);
      }
    }

    function createNode(item) {
      if (item.kind === "thought" && opts.showReasoning && !opts.showReasoning()) {
        const hidden = document.createElement("div");
        hidden.className = "tl-item tl-hidden";
        hidden.dataset.itemId = String(item.id);
        hidden.hidden = true;
        return hidden;
      }

      if (item.kind === "user") {
        const d = document.createElement("div");
        d.className = "msg user tl-item";
        d.dataset.itemId = String(item.id);
        d.textContent = item.text || "";
        const atts = item.meta?.attachments || [];
        if (atts.length) {
          const strip = document.createElement("div");
          strip.className = "media-strip user-atts";
          for (const a of atts.slice(0, 6)) {
            if (a.mimeType?.startsWith("image/") && a.data) {
              const img = document.createElement("img");
              img.className = "media-img";
              img.alt = a.name || "attachment";
              img.src = `data:${a.mimeType};base64,${a.data}`;
              strip.appendChild(img);
            } else {
              const chip = document.createElement("span");
              chip.className = "attach-chip";
              chip.textContent = a.name || "file";
              strip.appendChild(chip);
            }
          }
          d.appendChild(strip);
        }
        return d;
      }
      if (item.kind === "assistant") {
        const d = document.createElement("div");
        d.className = "msg assistant tl-item";
        d.dataset.itemId = String(item.id);
        bindAssistantContent(d, item, !item.streaming);
        return d;
      }
      if (item.kind === "thought") {
        const d = document.createElement("details");
        d.className = "thought thought-card tl-item";
        d.open = Boolean(item.meta?.open) || Boolean(item.streaming);
        d.dataset.itemId = String(item.id);
        const preview = (item.text || "").slice(0, 80).replace(/\s+/g, " ");
        d.innerHTML = `<summary><span class="thought-label">Thinking</span><span class="thought-preview">${escapeHtml(preview)}${(item.text || "").length > 80 ? "…" : ""}</span></summary><div class="body"></div>`;
        d.querySelector(".body").textContent = item.text || "";
        return d;
      }
      if (item.kind === "tool_group") {
        const d = document.createElement("details");
        d.className = "tool-group thought-card tl-item";
        const tools = item.meta?.tools || [];
        const running = tools.some(
          (t) => t.status === "running" || t.status === "pending",
        );
        d.open = item.meta?.open !== false && (running || Boolean(item.meta?.open));
        if (item.meta?.closed && !running) d.open = false;
        d.dataset.itemId = String(item.id);
        const done = tools.filter((t) => t.status === "completed" || t.status === "done").length;
        const failed = tools.filter((t) => t.status === "failed" || t.status === "error").length;
        const preview =
          tools.length <= 1
            ? tools[0]?.title || "Tool"
            : `${tools.length} steps` +
              (running ? " · running" : failed ? ` · ${failed} failed` : done ? ` · ${done} done` : "");
        d.innerHTML = `<summary class="tool-group-sum">
          <span class="tool-status" data-status="${running ? "running" : failed ? "failed" : "completed"}"></span>
          <span class="thought-label">Tools</span>
          <span class="thought-preview">${escapeHtml(preview)}</span>
        </summary><div class="tool-group-body"></div>`;
        const body = d.querySelector(".tool-group-body");
        for (const t of tools) {
          const row = document.createElement("div");
          row.className = "tool-group-row";
          row.innerHTML = `
            <span class="tool-status" data-status="${escapeHtml(t.status || "done")}"></span>
            <span class="tool-group-row-title">${escapeHtml(t.title || "Tool")}</span>
            <span class="tool-status-text">${escapeHtml(t.status || "")}</span>`;
          if (t.path) {
            const rev = document.createElement("button");
            rev.type = "button";
            rev.className = "review-btn tool-review-btn";
            rev.textContent = "Review";
            rev.onclick = (ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              opts.onReview?.({
                path: t.path,
                oldText: t.oldText,
                newText: t.newText,
              });
            };
            row.appendChild(rev);
          }
          if (t.detail) {
            const det = document.createElement("div");
            det.className = "tool-group-row-detail";
            det.textContent = String(t.detail).slice(0, 400);
            row.appendChild(det);
          }
          body.appendChild(row);
        }
        d.addEventListener("toggle", () => {
          // keep user open/closed preference in store if possible via nothing — local only
        });
        return d;
      }
      if (item.kind === "tool") {
        // Legacy single tool card (history) — keep compact closed when done
        const d = document.createElement("details");
        d.className = "tool-card tl-item";
        d.open = item.meta?.status === "running" || item.meta?.status === "pending";
        d.dataset.itemId = String(item.id);
        const status = item.meta?.status || "done";
        const title = item.text || item.meta?.title || "Tool";
        const kind = item.meta?.kind || "";
        d.innerHTML = `
          <summary class="tool-card-sum">
            <span class="tool-status" data-status="${escapeHtml(status)}"></span>
            <span class="tool-title">${escapeHtml(title)}</span>
            ${kind ? `<span class="tool-kind">${escapeHtml(kind)}</span>` : ""}
            <span class="tool-status-text">${escapeHtml(status)}</span>
          </summary>
          <div class="tool-card-body">${escapeHtml(item.meta?.detail || "")}</div>`;
        if (item.meta?.path) {
          const rev = document.createElement("button");
          rev.type = "button";
          rev.className = "review-btn tool-review-btn";
          rev.textContent = "Review";
          rev.onclick = (ev) => {
            ev.preventDefault();
            opts.onReview?.({
              path: item.meta.path,
              oldText: item.meta.oldText,
              newText: item.meta.newText,
            });
          };
          d.querySelector(".tool-card-body")?.appendChild(rev);
        }
        return d;
      }
      if (item.kind === "permission") {
        const d = document.createElement("div");
        d.className = "perm-card tl-item";
        d.dataset.itemId = String(item.id);
        const resolved = Boolean(item.meta?.resolved);
        const title = item.text || "Permission required";
        d.innerHTML = `
          <div class="perm-card-head">
            <span class="perm-badge">Permission</span>
            <strong class="perm-title">${escapeHtml(title)}</strong>
            ${item.meta?.kind ? `<span class="perm-kind">${escapeHtml(item.meta.kind)}</span>` : ""}
          </div>
          <div class="perm-card-actions"></div>`;
        const actions = d.querySelector(".perm-card-actions");
        if (resolved) {
          actions.innerHTML = `<span class="perm-resolved">${escapeHtml(item.meta?.resultLabel || "Resolved")}</span>`;
        } else {
          for (const opt of item.meta?.options || []) {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "perm-btn" + (/allow|accept|yes/i.test(opt.name) ? " primary" : "");
            b.textContent = opt.name;
            b.onclick = () => opts.onPermission?.(item.meta.requestId, opt.optionId);
            actions.appendChild(b);
          }
          const cancel = document.createElement("button");
          cancel.type = "button";
          cancel.className = "perm-btn ghost";
          cancel.textContent = "Cancel";
          cancel.onclick = () => opts.onPermission?.(item.meta.requestId, "__cancel__");
          actions.appendChild(cancel);
        }
        return d;
      }
      if (item.kind === "step") {
        const d = document.createElement("div");
        d.className = "step tl-item";
        d.dataset.itemId = String(item.id);
        d.textContent = item.text || "";
        return d;
      }
      if (item.kind === "error") {
        const d = document.createElement("div");
        d.className = "msg error tl-item";
        d.dataset.itemId = String(item.id);
        d.textContent = item.text || "";
        return d;
      }
      if (item.kind === "review") {
        const d = document.createElement("div");
        d.className = "review-chip tl-item";
        d.dataset.itemId = String(item.id);
        const path = String(item.meta?.path || item.text || "");
        const basen = path.replace(/\\/g, "/").split("/").pop() || path;
        const count = item.meta?.editCount || 1;
        d.innerHTML = `<span><strong>${count} file</strong> · ${escapeHtml(basen)}</span>`;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "review-btn";
        btn.textContent = "Review";
        btn.onclick = () => opts.onReview?.(item.meta || {});
        d.appendChild(btn);
        return d;
      }
      if (item.kind === "foot") {
        const d = document.createElement("div");
        d.className = "time-foot tl-item";
        d.dataset.itemId = String(item.id);
        d.textContent = item.text || "";
        return d;
      }
      if (item.kind === "empty") {
        const d = document.createElement("div");
        d.className = "empty-hero tl-item";
        d.dataset.itemId = String(item.id);
        d.innerHTML = `<h2>${escapeHtml(opts.emptyTitle?.() || "project")}</h2><p>${escapeHtml(opts.emptyBody?.() || "")}</p>`;
        return d;
      }
      const d = document.createElement("div");
      d.className = "step tl-item";
      d.dataset.itemId = String(item.id);
      d.textContent = item.text || "";
      return d;
    }

    function updateNode(el, item) {
      if (item.kind === "assistant") {
        bindAssistantContent(el, item, !item.streaming);
        return;
      }
      if (item.kind === "thought") {
        const body = el.querySelector(".body");
        if (body) body.textContent = item.text || "";
        const preview = el.querySelector(".thought-preview");
        if (preview) {
          const p = (item.text || "").slice(0, 80).replace(/\s+/g, " ");
          preview.textContent = p + ((item.text || "").length > 80 ? "…" : "");
        }
        if (item.streaming) el.open = true;
        return;
      }
      if (item.kind === "tool_group") {
        // Rebuild group body (tool list changes often)
        const fresh = createNode(item);
        el.replaceWith(fresh);
        nodeMap.set(item.id, fresh);
        return;
      }
      if (item.kind === "tool") {
        const st = el.querySelector(".tool-status");
        const stt = el.querySelector(".tool-status-text");
        const title = el.querySelector(".tool-title");
        if (st) st.dataset.status = item.meta?.status || "done";
        if (stt) stt.textContent = item.meta?.status || "done";
        if (title) title.textContent = item.text || item.meta?.title || "Tool";
        return;
      }
      if (item.kind === "permission" || item.kind === "tool") {
        const fresh = createNode(item);
        el.replaceWith(fresh);
        nodeMap.set(item.id, fresh);
        return;
      }
      if (item.kind === "user" || item.kind === "step" || item.kind === "error" || item.kind === "foot") {
        el.textContent = item.text || "";
      }
    }

    function visibleRange() {
      const items = store.items;
      const n = items.length;
      if (n === 0) return { start: 0, end: 0, top: 0, bottom: 0, full: true };

      if (n < VIRTUAL_THRESHOLD) {
        return { start: 0, end: n, top: 0, bottom: 0, full: true };
      }

      const scrollTop = root.scrollTop;
      const viewH = root.clientHeight || 600;
      let acc = 0;
      let start = 0;
      for (let i = 0; i < n; i++) {
        const h = estimateHeight(items[i]);
        if (acc + h >= scrollTop) {
          start = i;
          break;
        }
        acc += h;
        start = i;
      }
      start = Math.max(0, start - OVERSCAN);
      let top = 0;
      for (let i = 0; i < start; i++) top += estimateHeight(items[i]);

      let end = start;
      let used = 0;
      while (end < n && used < viewH + OVERSCAN * 40) {
        used += estimateHeight(items[end]);
        end++;
      }
      end = Math.min(n, end + OVERSCAN);

      // Always include streaming tail
      const streamIds = new Set(
        [store.streamAssistantId, store.streamThoughtId].filter((x) => x != null),
      );
      if (streamIds.size) {
        for (let i = 0; i < n; i++) {
          if (streamIds.has(items[i].id)) {
            start = Math.min(start, i);
            end = Math.max(end, i + 1);
          }
        }
      }

      let bottom = 0;
      for (let i = end; i < n; i++) bottom += estimateHeight(items[i]);
      return { start, end, top, bottom, full: false };
    }

    function render() {
      if (disposed) return;
      renderScheduled = false;
      const items = store.items;
      const range = visibleRange();

      spacerTop.style.height = range.full ? "0px" : `${range.top}px`;
      spacerBottom.style.height = range.full ? "0px" : `${range.bottom}px`;

      const want = new Set();
      for (let i = range.start; i < range.end; i++) {
        want.add(items[i].id);
      }

      // Remove off-window nodes
      for (const [id, el] of nodeMap) {
        if (!want.has(id)) {
          el.remove();
          nodeMap.delete(id);
        }
      }

      // Ensure order: rebuild window children in range order
      const frag = document.createDocumentFragment();
      const ordered = [];
      for (let i = range.start; i < range.end; i++) {
        const item = items[i];
        let el = nodeMap.get(item.id);
        if (!el) {
          el = createNode(item);
          nodeMap.set(item.id, el);
        } else if (item.streaming || item.kind === "assistant" || item.kind === "thought") {
          // stream updates handled separately; still ok
        }
        ordered.push(el);
      }
      // Only replace if structure changed
      let needsRebuild = ordered.length !== windowEl.childNodes.length;
      if (!needsRebuild) {
        for (let i = 0; i < ordered.length; i++) {
          if (windowEl.childNodes[i] !== ordered[i]) {
            needsRebuild = true;
            break;
          }
        }
      }
      if (needsRebuild) {
        for (const el of ordered) frag.appendChild(el);
        windowEl.replaceChildren(frag);
      }

      for (const el of ordered) {
        const id = Number(el.dataset.itemId);
        measure(el, id);
      }

      if (stickToBottom) scrollEnd(true);
    }

    function scheduleRender() {
      if (renderScheduled || disposed) return;
      renderScheduled = true;
      requestAnimationFrame(render);
    }

    function patchStream(item) {
      let el = nodeMap.get(item.id);
      if (!el) {
        scheduleRender();
        return;
      }
      updateNode(el, item);
      measure(el, item.id);
      if (stickToBottom || isNearBottom()) {
        stickToBottom = true;
        scrollEnd(true);
      }
    }

    function finalizeItem(item) {
      const el = nodeMap.get(item.id);
      if (el && item.kind === "assistant") {
        bindAssistantContent(el, item, true);
        measure(el, item.id);
      } else if (el) {
        updateNode(el, item);
      } else {
        scheduleRender();
      }
      if (stickToBottom) scrollEnd(true);
    }

    const unsub = store.subscribe((change) => {
      if (change.type === "reset") {
        nodeMap.clear();
        heightCache.clear();
        windowEl.replaceChildren();
        stickToBottom = true;
        scheduleRender();
        return;
      }
      if (change.type === "append") {
        scheduleRender();
        return;
      }
      if (change.type === "stream" && change.item) {
        if (change.full) scheduleRender();
        else patchStream(change.item);
        return;
      }
      if (change.type === "finalize" && change.item) {
        finalizeItem(change.item);
        return;
      }
      if (change.type === "update" && change.item) {
        const el = nodeMap.get(change.item.id);
        if (el) updateNode(el, change.item);
        else scheduleRender();
        measure(nodeMap.get(change.item.id), change.item.id);
        // Tool groups grow in place — keep stick-to-bottom so final answer stays visible
        if (stickToBottom) scrollEnd(true);
      }
    });

    root.addEventListener(
      "scroll",
      () => {
        stickToBottom = isNearBottom();
        if (store.length >= VIRTUAL_THRESHOLD) scheduleRender();
      },
      { passive: true },
    );

    return {
      render: scheduleRender,
      scrollEnd: () => {
        stickToBottom = true;
        scrollEnd(true);
      },
      dispose() {
        disposed = true;
        unsub();
        nodeMap.clear();
      },
    };
  }

  globalThis.GrokTimelineView = { create: createTimelineView, VIRTUAL_THRESHOLD };
})();
