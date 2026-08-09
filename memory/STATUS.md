# Status — release 0.5.25

## Artifacts

| Channel | Path |
|---|---|
| Portable | `dist\0.5.25\portable\Grok-Build-0.5.25-win32-x64-portable.exe` |
| Install | `dist\0.5.25\install\Grok-Build-Setup-0.5.25.exe` |
| Update | `dist\0.5.25\update\` + `apply-update.ps1` |
| Feed | `dist\latest.json` |

## P0–P1 (2026-08-07)

- Modular main: `launchArgs.cjs`, `productPaths.cjs`, `agentSupervisor.cjs`, `ipcContract.cjs`
- Multi-slot agent foundation (primary + 1 parallel)
- E2E expanded; architecture check covers IPC preload contract
- Docs and immutable release contract synced to 0.5.25

## P2 (2026-08-07)

- Hunk-level Review accept/reject (`diffHunks.js`)
- Git strip: hash, dirty files tooltip, Create PR; `git:createPr`
- Agent slot strip UI + palette spawn
- Composer `@file` mentions
- Connect auth preflight; local `dist/latest.json` update check
- E2E: 18 tests green

## Publish

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\publish-release.ps1 -Version 0.5.25
```

## Gates

```powershell
npm run check
```
