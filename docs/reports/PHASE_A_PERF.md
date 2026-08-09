# Phase A — Performance & stability shell

**Status:** implemented (2026-08-06)  
**Scope:** Grok Build Desktop renderer + main process

## Delivered

| ID | Item | Implementation |
|----|------|----------------|
| **A1** | Batch stream render | `renderer/lib/streamBatcher.js` — rAF + ~40ms coalesce of `assistant_delta` / `thought_delta` |
| **A2** | Virtualize timeline | `renderer/lib/timelineView.js` — windowed DOM when ≥64 items; spacers + overscan; streaming nodes always patched |
| **A3** | Keep-alive / reconnect | `main.cjs` — warm process reuse (same workspace + launch fingerprint); auto-reconnect up to 3×; `agent:status` / `agent:reconnect` |
| **A4** | Off-main markdown/diff | `renderer/lib/workers/contentWorker.js` + `offthread.js` — Worker for markdown HTML + LCS diff; main-thread fallback |
| **A5** | Event store | `renderer/lib/eventStore.js` — append-only items + stream buffers; UI is derived view |
| **A6** | IPC surface | Preload documents agent API; status/reconnect handlers; renderer stays free of spawn/process logic |

## Files

```
apps/desktop/renderer/lib/eventStore.js
apps/desktop/renderer/lib/streamBatcher.js
apps/desktop/renderer/lib/timelineView.js
apps/desktop/renderer/lib/offthread.js
apps/desktop/renderer/lib/workers/contentWorker.js
apps/desktop/renderer/app.js          (wired)
apps/desktop/renderer/index.html      (script order)
apps/desktop/renderer/styles.css      (.tl-virtual / spacers)
apps/desktop/src/main.cjs             (warm + reconnect)
apps/desktop/src/preload.cjs          (status / reconnect)
```

## Behaviour notes

- **Streaming:** deltas accumulate in batcher → store `pushDelta` → timeline patches live node with `textContent` (no full markdown every token). On `turn_complete`, markdown is applied (worker when available).
- **History paint:** `eventStore.loadTurns` + one virtualized render pass.
- **Connect twice:** second Connect on same project reuses process (`reused: true`) unless launch flags changed or `forceRestart`.
- **Crash:** unexpected `state:error` after a live session schedules reconnect with backoff.

## Manual test checklist

1. Connect → send message → stream feels smooth (no UI freeze on long answers).
2. Connect again without disconnect → status “warm” / step “Reused running agent process”.
3. Open long session (100+ msgs) → scroll stays responsive.
4. Review a large edit → diff panel opens without jank (worker path).
5. Kill `grok` process while connected → UI shows reconnect attempts.

## Out of scope (Phase B+)

Multi-session tabs, command palette, artifact board, git strip.
