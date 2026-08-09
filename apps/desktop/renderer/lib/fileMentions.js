/**
 * P2 — @file mention autocomplete for composer.
 * globalThis.GrokFileMentions
 */
(() => {
  /**
   * Find @query at caret in textarea value.
   * @param {string} value
   * @param {number} caret
   * @returns {{ start: number, end: number, query: string } | null}
   */
  function findMentionAt(value, caret) {
    const text = String(value ?? "");
    const pos = Math.max(0, Math.min(Number(caret) || 0, text.length));
    // Walk back to @ (not part of email-ish: require start or whitespace before @)
    let i = pos - 1;
    while (i >= 0 && !/\s/.test(text[i])) {
      if (text[i] === "@") {
        const before = i === 0 ? " " : text[i - 1];
        if (/\s/.test(before) || i === 0) {
          const query = text.slice(i + 1, pos);
          if (/^[\w./\\-]*$/.test(query)) {
            return { start: i, end: pos, query };
          }
        }
        return null;
      }
      i -= 1;
      if (pos - i > 80) break;
    }
    return null;
  }

  /**
   * Filter relative paths by query (basename + path).
   * @param {string[]} paths
   * @param {string} query
   * @param {number} [limit]
   */
  function filterPaths(paths, query, limit = 12) {
    const q = String(query || "").toLowerCase().replace(/\\/g, "/");
    const list = (paths || []).map((p) => String(p).replace(/\\/g, "/"));
    if (!q) return list.slice(0, limit);
    const scored = [];
    for (const p of list) {
      const base = p.split("/").pop() || p;
      const pl = p.toLowerCase();
      const bl = base.toLowerCase();
      let score = -1;
      if (bl === q) score = 100;
      else if (bl.startsWith(q)) score = 80;
      else if (bl.includes(q)) score = 60;
      else if (pl.includes(q)) score = 40;
      if (score >= 0) scored.push({ p, score });
    }
    scored.sort((a, b) => b.score - a.score || a.p.length - b.p.length);
    return scored.slice(0, limit).map((s) => s.p);
  }

  /**
   * Insert mention text at range.
   * @returns {{ value: string, caret: number }}
   */
  function insertMention(value, start, end, relativePath) {
    const text = String(value ?? "");
    const path = String(relativePath || "").replace(/\\/g, "/");
    const insert = `@${path} `;
    const next = text.slice(0, start) + insert + text.slice(end);
    return { value: next, caret: start + insert.length };
  }

  /**
   * Flatten listDir-style tree to relative paths (files only, shallow + one level).
   * @param {{ name: string, path: string, isDirectory?: boolean }[]} entries
   * @param {string} workspaceRoot
   */
  function entriesToRelPaths(entries, workspaceRoot) {
    const root = String(workspaceRoot || "").replace(/\\/g, "/").replace(/\/$/, "");
    const out = [];
    for (const e of entries || []) {
      if (e.isDirectory) continue;
      let p = String(e.path || e.name || "").replace(/\\/g, "/");
      if (root && p.toLowerCase().startsWith(root.toLowerCase() + "/")) {
        p = p.slice(root.length + 1);
      } else if (root && p.toLowerCase() === root.toLowerCase()) {
        continue;
      } else {
        p = e.name || p;
      }
      if (p && !p.startsWith(".")) out.push(p);
    }
    return out;
  }

  globalThis.GrokFileMentions = {
    findMentionAt,
    filterPaths,
    insertMention,
    entriesToRelPaths,
  };
})();
