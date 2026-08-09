# P0–P1 implementation notes

**Date:** 2026-08-07  
**Baseline:** 0.5.21  
**Gates:** `npm run check`

## Goals

From product audit backlog:

1. Sync docs to current version  
2. Split main monolith into modules  
3. Expand e2e / IPC contract coverage  
4. AgentSupervisor multi-client foundation  
5. Document unsigned Windows / SmartScreen  

## Delivered

### Modules

| File | Purpose |
|------|---------|
| `apps/desktop/src/launchArgs.cjs` | Pure CLI flag helpers |
| `apps/desktop/src/productPaths.cjs` | Install path discovery + Open IDE launch |
| `apps/desktop/src/agentSupervisor.cjs` | Multi-slot GrokClient lifecycle |
| `apps/desktop/src/ipcContract.cjs` | Preload ↔ main channel contract |

### IPC (new)

- `agent:slots` / `agent:spawnSlot` / `agent:setActiveSlot` / `agent:stopSlot`
- Preload: `agentSlots`, `spawnAgentSlot`, `setActiveAgentSlot`, `stopAgentSlot`

### Tests

- launchArgs aliases + fingerprint  
- AgentSupervisor warm reuse + max slots (fake ACP)  
- IPC preload coverage  
- productPaths layout  
- version consistency (package / PRODUCT / COMPLETE)  

### Docs

- README, ROADMAP, COMPLETE, STATUS, ARCHITECTURE, DISTRIBUTION, INSTALL_PATHS  

## Deferred (still optional)

- Full split of `renderer/app.js` (~4k LOC)  
- Playwright Electron UI e2e  
- Slot switcher UI chrome (API ready)  
- Code signing pipeline  

## Functional audit note

`FUNCTIONAL_AUDIT.md` (2026-08-06, 0.5.9+) listed broken Login / plugin `--yes` / worktree start — those were fixed in subsequent 0.5.x FIX_LOG entries. Re-validate with live UI when shipping a public build; static contract is covered by e2e + arch.
