# Grok Build Desktop — roadmap

**Current ship line: 0.5.29**  
Agent shell over **Grok CLI / ACP**. UX references: Antigravity + Codex.

## Status: feature-complete for product v1 (+ P0–P1 platform)

All planned agent-desktop surfaces are implemented (Phases A–D).  
**P0–P1 (2026-08-07):** docs sync, main-process modularization, IPC contract, AgentSupervisor multi-slot foundation, expanded e2e.

### Ship

```text
dist/0.5.29/portable/Grok-Build-0.5.29-win32-x64-portable.exe
dist/0.5.29/install/Grok-Build-Setup-0.5.29.exe
```

Dev: `scripts/dev-desktop.ps1` · gates: `npm run check`

### Included

- ACP agent, sessions, history replay, export/delete
- Permission / model / effort / mode, full launch flags
- Markdown, thinking, plan, usage chips (CLI weekly credits)
- Attach / paste / drag-drop / queue
- Files, Review (accept/reject), Terminal (interactive + ACP reverse)
- Manager: headless jobs (`grok -p`), artifacts, worktree UI
- MCP / plugins CLI forms (aligned to CLI flags)
- Theme light/dark/system, i18n EN/VI, About, update feed check
- App menu + keyboard shortcuts · Open IDE deep-link
- **AgentSupervisor** — warm reuse + optional parallel slot (max 2)
- Portable + NSIS + update channel

### P0–P1 delivered (platform)

| Item | Status |
|------|--------|
| Docs / version consistency (README, COMPLETE, STATUS) | ✅ |
| Extract `launchArgs` / `productPaths` / `ipcContract` from main | ✅ |
| `AgentSupervisor` multi-slot foundation | ✅ |
| E2E: supervisor, IPC contract, version, launchArgs | ✅ |
| Architecture gate for preload IPC coverage | ✅ |
| Distribution notes (unsigned / SmartScreen) | ✅ |

### P2 delivered (polish)

| Item | Status |
|------|--------|
| Hunk-level accept/reject | ✅ |
| Richer git strip + Create PR link | ✅ |
| Agent slot switcher UI | ✅ |
| Composer `@file` mentions | ✅ |
| Auth preflight on Connect | ✅ |
| Local update feed fallback | ✅ |

### Next (optional)

- Split `renderer/app.js` further by domain
- Playwright full UI smoke (Electron)
- Hosted update CDN + optional code signing
- Hunk staging (defer write) · full `gh pr create` form

### Out of scope (not CLI/ACP product)

- Antigravity cloud: Sites, PR inbox, scheduled cloud tasks
- VS Code marketplace / full debug IDE (use Open IDE → grok-build-ide)
- Agent loop reimplementation inside Electron
- Embedding full Code-OSS in this monorepo

### Update feed format

```json
{ "version": "0.5.27", "url": "https://…/Grok-Build-0.5.27-win32-x64-portable.exe", "notes": "…" }
```
