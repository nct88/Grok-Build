# Security review — pre-release 0.5.20

**Date:** 2026-08-06  
**Scope:** Desktop shell changes (Phases A–D) + packaging

## Threat model (local desktop)

| Trust boundary | Assumption |
|----------------|------------|
| Renderer | Untrusted (markdown/XSS from model output) |
| Main process | Trusted OS user; holds auth tokens |
| `grok` CLI | Trusted local binary; full agent power when connected |
| Network | Only explicit https (billing, update feed, openExternal) |

This is a **coding agent desktop**: intentional command execution in the project workspace. Goal is **containment** (no silent full-disk / credential leak / scheme abuse), not sandboxing untrusted tenants.

## Findings & fixes (this pass)

| Severity | Issue | Fix |
|----------|--------|-----|
| **High** | `fs:readText` / `listDir` / `readFileBase64` had **no workspace check** — any path readable | `assertWorkspacePath` on all FS IPC |
| **High** | `fs:writeText` only checked when workspace set; weak prefix match | Unified guard + size cap 8MB |
| **High** | `shell:openExternal` accepted any scheme (`file:`, etc.) | http(s) only via `assertSafeExternalUrl` |
| **Medium** | `shell:openPath` any path | Workspace guard |
| **Medium** | Tools `runCli` could pass arbitrary `grok` args (`agent stdio`, `-p`) | First-arg allowlist + block agent stdio / -p |
| **Medium** | Jobs board returned full stdout to renderer list | List redacted; detail via `jobs:get` |
| **Medium** | Job `cwd` could be client-supplied | Forced to open workspace |
| **Low** | Auth profile exposed `authPath` | Removed from IPC payload |
| **Low** | Telemetry meta could log long strings | Scrub keys + length cap |
| **Low** | Open IDE file deep-link outside workspace | Guarded; ignore illegal file |
| **Low** | Base64 attach any file type | Images only |
| **Info** | Terminal still runs arbitrary commands in **workspace cwd** | By design for agent shell; requires open project |

## Residual risk (accepted)

1. **Interactive agent (`grok agent stdio`)** — full tool power per permission mode (user-controlled).  
2. **Terminal / headless jobs** — can run shell in project (local power-user product).  
3. **Update feed URL** — user-configured HTTP(S) fetch (supply chain if user points to malicious JSON).  
4. **allowOutside workspace** — intentional opt-in; still blocks credential paths under `~/.grok`.  
5. **Artifacts / job store on disk** — may contain code or model output; local userData only.

## Positive controls already present

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`  
- CSP on `index.html` (`script-src 'self'`, `worker-src 'self'`)  
- Auth tokens only in main (`readAuthEntry`); usage API never returns token to renderer  
- Markdown renderer escapes HTML (safe subset)  
- Telemetry opt-in, local-only, no network  
- Architecture check forbids renderer model HTTP / agent loop reimplementation  

## Verification

```powershell
npm run check
```

Includes security unit gates in `scripts/e2e-desktop.mjs`.

## Sign-off for 0.5.20 ship

After fixes above: **acceptable for local release 0.5.20** (unsigned Windows builds; SmartScreen may warn).
