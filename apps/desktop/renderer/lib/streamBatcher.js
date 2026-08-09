/**
 * Phase A1 — batch stream deltas onto animation frames / interval.
 * Callers push raw chunks; flush coalesces UI work (~40ms).
 */
(() => {
  /**
   * @param {{ intervalMs?: number, onFlush: (pending: { assistant: string, thought: string }) => void }} opts
   */
  function createStreamBatcher(opts) {
    const intervalMs = opts.intervalMs ?? 40;
    let pendingAssistant = "";
    let pendingThought = "";
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
      };
      pendingAssistant = "";
      pendingThought = "";
      opts.onFlush(payload);
    }

    return {
      /** @param {string} chunk */
      pushAssistant(chunk) {
        if (!chunk) return;
        pendingAssistant += chunk;
        schedule();
      },
      /** @param {string} chunk */
      pushThought(chunk) {
        if (!chunk) return;
        pendingThought += chunk;
        schedule();
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
