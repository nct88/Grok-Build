# Phase B — UX parity (Codex command center)

**Status:** implemented (2026-08-06)  
**Depends on:** Phase A (event store, timeline, stream batcher)

## Delivered

| ID | Item | Notes |
|----|------|--------|
| **B1** | Multi-session tabs | Tab rail under header; per-tab timeline snapshot; `+` / New chat → `session/new`; history opens in tab |
| **B2** | Tool cards | Collapsible `.tool-card` with status dot; thought cards with preview |
| **B3** | Diff review v2 | Unified + side-by-side; **Accept** / **Reject** writes via `fs:writeText` |
| **B4** | Command palette | `Ctrl/Cmd+K` or header ⌘K |
| **B5** | Permission inline | Main no longer uses native dialog; chat `.perm-card` + `agent:resolvePermission` |
| **B6** | Usage polish | Mini bar + compact token labels |
| **B7** | Git status strip | Branch · dirty · ahead/behind · optional `gh` PR link |

## Architecture note (B1)

Still **one ACP `GrokClient` process** (warm reuse from Phase A). Tabs switch ACP sessions (`loadSession` / `newSession`) and keep **UI snapshots** so switching is instant. True parallel multi-process agents remain a later option (AgentSupervisor pool).

## Files

```
apps/desktop/renderer/lib/sessionTabs.js
apps/desktop/renderer/lib/commandPalette.js
apps/desktop/src/gitStatus.cjs
apps/desktop/src/main.cjs          (permission queue, git:status, fs:writeText)
apps/desktop/src/preload.cjs
apps/desktop/renderer/lib/timelineView.js  (tool / permission / thought)
apps/desktop/renderer/lib/eventStore.js    (update / findLast)
apps/desktop/renderer/app.js
apps/desktop/renderer/index.html
apps/desktop/renderer/styles.css
```

## Manual tests

1. Connect → send message → tool events appear as cards (not only plain steps).
2. Permission mode Default → agent asks permission → approve from chat card.
3. Edit file → Review → Side / Accept / Reject.
4. `Ctrl+K` → Connect / New chat / Theme…
5. Git repo open → strip shows branch; dirty count after edit.
6. `+` tab → new session; switch tabs without losing messages.

## Out of scope (later)

- N parallel `grok` processes
- Hunk-level (line) accept/reject
- Full PR create flow
