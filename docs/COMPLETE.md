# Grok Build Desktop — release status

## Current: **0.5.30**

Phases A–D + security pass + tight icons + model seed (`grok-4.5`) + **P0–P1 platform** + **P2 polish** (hunks, git/PR, slots UI, @file, auth preflight, local update feed).

### Artifacts

| Channel | Path |
|---------|------|
| Installer | `dist/0.5.30/install/Grok-Build-Setup-0.5.30.exe` |
| Portable | `dist/0.5.30/portable/Grok-Build-0.5.30-win32-x64-portable.exe` |
| Zip | `dist/0.5.30/portable/Grok-Build-0.5.30-win32-x64.zip` |
| Update | `dist/0.5.30/update/` |
| Manifest | `dist/0.5.30/MANIFEST.json` · `dist/latest.json` |

### Included (summary)

- **A** Stream batch, virtual timeline, event store, warm reconnect, off-thread markdown/diff  
- **B** Session tabs, tool/permission cards, diff accept/reject, Ctrl+K, git strip  
- **C** Manager jobs (`grok -p`), artifacts, worktree UI, IDE deep-link  
- **D** Architecture checks, control plane, E2E `npm test`, local telemetry, packaging stamp  
- **Security 0.5.20** Workspace FS sandbox, http(s)-only external URLs, CLI allowlist, credential path block, redacted job lists  
- **P0–P1** `AgentSupervisor` (multi-slot), `launchArgs` / `productPaths` / `ipcContract`, expanded e2e, docs sync  
- **P2** Hunk accept/reject, richer git strip + Create PR, slot strip UI, `@file` mentions, auth preflight, local `latest.json` update probe
- **0.5.30** Codex-like session timeline, restored reasoning summaries, framed Markdown tables, flat tool/review surfaces, responsive right-panel hiding and navigable local paths

### Verify

```powershell
npm run check
```

### Security notes

See `docs/reports/SECURITY_REVIEW_0.5.20.md`.  
Unsigned Windows build — SmartScreen may warn on first run. Details: `docs/DISTRIBUTION.md`.
