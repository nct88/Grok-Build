# Phase D — Platform hardening

**Status:** implemented (2026-08-06)

## Delivered

| ID | Item | Implementation |
|----|------|----------------|
| **D1** | No agent loop in Electron | `scripts/check-architecture.mjs` + `docs/ARCHITECTURE.md` |
| **D2** | Thin control plane | `apps/desktop/src/controlPlane.cjs` + `app:health` / `app:controlPlane` |
| **D3** | E2E suite | `scripts/e2e-desktop.mjs` (`npm test`); optional `GROK_E2E_LIVE=1` |
| **D4** | Opt-in telemetry | `telemetry.cjs` + Settings checkbox + latency summary |
| **D5** | Packaging icon pattern | `scripts/check-packaging.mjs`; verified package.json contract |

## Commands

```powershell
npm run check:arch
npm run check:packaging
npm test                 # offline suite
# $env:GROK_E2E_LIVE=1; npm test   # includes grok --version
npm run check            # all of the above
```

## Telemetry (local only)

1. Settings → Behavior → enable **Performance metrics**
2. Connect + chat to collect samples
3. **Show latency summary** → p50/p95 for connect / first token / tools / turn / jobs
4. Data under `userData/telemetry/` — never uploaded by the app

## Control plane snapshot (example)

```json
{
  "health": {
    "agentLoopOwner": "grok-cli",
    "protocol": "acp-stdio",
    "connectionState": "connected"
  },
  "capabilities": {
    "surfaces": ["chat-acp", "jobs-headless", "..."],
    "forbidden": ["agent-loop-in-electron", "model-api-from-renderer"]
  }
}
```

## Files

```
apps/desktop/src/telemetry.cjs
apps/desktop/src/controlPlane.cjs
apps/desktop/src/main.cjs          (marks + IPC)
apps/desktop/src/preload.cjs
apps/desktop/renderer/...          (settings UI)
scripts/check-architecture.mjs
scripts/check-packaging.mjs
scripts/e2e-desktop.mjs
docs/ARCHITECTURE.md
docs/reports/PHASE_D_HARDENING.md
```

## Explicit non-goals (still Phase E)

- Full multi-surface App Server binary (Codex-style) — control plane is enough for now
- Remote telemetry / crash analytics SaaS
- Playwright full UI E2E (can add later on top of this suite)
