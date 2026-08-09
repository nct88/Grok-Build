/**
 * P2 — hunk grouping + partial apply for Review accept/reject.
 * Pure helpers; no DOM. globalThis.GrokDiffHunks
 */
(() => {
  /**
   * Group LCS rows into hunks. Contiguous non-context lines form a hunk;
   * isolated context does not. Hunks include up to 2 context lines before/after for display.
   * @param {{ t: string, l: string }[]} rows
   * @returns {{ id: number, rows: { t: string, l: string, globalIndex: number }[], start: number, end: number }[]}
   */
  function groupHunks(rows) {
    const list = Array.isArray(rows) ? rows : [];
    /** @type {{ id: number, rows: any[], start: number, end: number }[]} */
    const hunks = [];
    let i = 0;
    let id = 0;
    while (i < list.length) {
      if (list[i].t === "ctx") {
        i += 1;
        continue;
      }
      // expand back for leading context
      let start = i;
      let ctxBack = 0;
      while (start > 0 && list[start - 1].t === "ctx" && ctxBack < 2) {
        start -= 1;
        ctxBack += 1;
      }
      let end = i;
      while (end < list.length && list[end].t !== "ctx") {
        end += 1;
      }
      // skip pure-empty noise
      let j = end;
      let ctxFwd = 0;
      while (j < list.length && list[j].t === "ctx" && ctxFwd < 2) {
        j += 1;
        ctxFwd += 1;
      }
      const slice = [];
      for (let k = start; k < j; k++) {
        slice.push({ t: list[k].t, l: list[k].l, globalIndex: k });
      }
      // only create if has add or del
      if (slice.some((r) => r.t === "add" || r.t === "del")) {
        hunks.push({ id: id++, rows: slice, start, end: j });
      }
      i = end > i ? end : i + 1;
      // skip past trailing ctx we already included
      while (i < j) i += 1;
    }
    return hunks;
  }

  /**
   * Build file text from LCS rows + per-hunk decisions.
   * - accept: keep add lines, drop del
   * - reject / pending: keep del lines, drop add
   * - ctx always kept
   * @param {{ t: string, l: string }[]} rows
   * @param {{ id: number, rows: { globalIndex: number }[] }[]} hunks
   * @param {Record<number, 'accept'|'reject'>} decisions
   * @returns {string}
   */
  function applyHunkDecisions(rows, hunks, decisions) {
    /** @type {Map<number, 'accept'|'reject'>} */
    const byIndex = new Map();
    for (const h of hunks || []) {
      const d = decisions[h.id] === "accept" ? "accept" : "reject";
      for (const r of h.rows) {
        if (r.t === "add" || r.t === "del") {
          byIndex.set(r.globalIndex, d);
        }
      }
    }
    const out = [];
    const list = Array.isArray(rows) ? rows : [];
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      if (r.t === "ctx") {
        out.push(r.l);
        continue;
      }
      const d = byIndex.get(i) || "reject";
      if (r.t === "del" && d !== "accept") out.push(r.l);
      if (r.t === "add" && d === "accept") out.push(r.l);
    }
    return out.join("\n");
  }

  /**
   * Stats for UI.
   * @param {{ t: string }[]} rows
   */
  function diffStats(rows) {
    let add = 0;
    let del = 0;
    for (const r of rows || []) {
      if (r.t === "add") add += 1;
      if (r.t === "del") del += 1;
    }
    return { add, del, hunks: 0 };
  }

  /**
   * Accept all / reject all convenience.
   * @param {number} count
   * @param {'accept'|'reject'} decision
   */
  function decideAll(count, decision) {
    /** @type {Record<number, 'accept'|'reject'>} */
    const d = {};
    for (let i = 0; i < count; i++) d[i] = decision;
    return d;
  }

  globalThis.GrokDiffHunks = {
    groupHunks,
    applyHunkDecisions,
    diffStats,
    decideAll,
  };
})();
