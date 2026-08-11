/**
 * Phase A1 — batch stream deltas onto animation frames / interval.
 * Callers push raw chunks; flush coalesces UI work (~40ms).
 */
(() => {
  /**
   * @param {{ intervalMs?: number, onFlush: (pending: { assistant: string, thought: string, segments: Array<{kind:"assistant"|"thought",text:string}> }) => void }} opts
   */
  function createStreamBatcher(opts) {
    const intervalMs = opts.intervalMs ?? 40;
    let pendingAssistant = "";
    let pendingThought = "";
    /** @type {Array<{kind:"assistant"|"thought",text:string}>} */
    let pendingSegments = [];
    let timer = 0;
    let raf = 0;
    let closed = false;

    function schedule() {
      if (closed || timer || raf) return;
      // Prefer rAF for paint alignment; fall back to interval if tab backgrounded
      if (typeof requestAnimationFrame === "function") {
        raf = requestAnimationFrame(() => {
          raf = 0;
          // coalesce multiple frames within intervalMs
          timer = window.setTimeout(() => {
            timer = 0;
            flush();
          }, intervalMs);
        });
      } else {
        timer = window.setTimeout(() => {
          timer = 0;
          flush();
        }, intervalMs);
      }
    }

    function flush() {
      if (closed) return;
      if (!pendingAssistant && !pendingThought) return;
      const payload = {
        assistant: pendingAssistant,
        thought: pendingThought,
        segments: pendingSegments,
      };
      pendingAssistant = "";
      pendingThought = "";
      pendingSegments = [];
      opts.onFlush(payload);
    }

    /** @param {"assistant"|"thought"} kind @param {string} chunk */
    function pushSegment(kind, chunk) {
      const last = pendingSegments[pendingSegments.length - 1];
      if (last?.kind === kind) last.text += chunk;
      else pendingSegments.push({ kind, text: chunk });
    }

    return {
      /** @param {string} chunk */
      pushAssistant(chunk) {
        if (!chunk) return;
        pendingAssistant += chunk;
        pushSegment("assistant", chunk);
        schedule();
      },
      /** @param {string} chunk */
      pushThought(chunk) {
        if (!chunk) return;
        pendingThought += chunk;
        pushSegment("thought", chunk);
        schedule();
      },
      /** @param {"assistant"|"thought"} kind */
      hasPending(kind) {
        return pendingSegments.some((segment) => segment.kind === kind && segment.text);
      },
      /** Force immediate flush (turn end, disconnect). */
      flushNow() {
        if (timer) {
          clearTimeout(timer);
          timer = 0;
        }
        if (raf && typeof cancelAnimationFrame === "function") {
          cancelAnimationFrame(raf);
          raf = 0;
        }
        flush();
      },
      clear() {
        pendingAssistant = "";
        pendingThought = "";
        pendingSegments = [];
        if (timer) {
          clearTimeout(timer);
          timer = 0;
        }
        if (raf && typeof cancelAnimationFrame === "function") {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      dispose() {
        closed = true;
        this.clear();
      },
    };
  }

  globalThis.GrokStreamBatcher = { create: createStreamBatcher };
})();
