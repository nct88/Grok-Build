# Architecture

```text
apps/desktop (Electron surface)
    → AgentSupervisor (main) — 1–N slots
        → packages/acp-client (GrokClient per slot)
            → grok agent stdio (official CLI)   ← owns agent loop / intelligence
                → ~/.grok sessions / auth
```

## Main process modules (P0–P1)

| Module | Role |
|--------|------|
| `main.cjs` | Window, IPC handlers, wiring |
| `agentSupervisor.cjs` | Multi-slot ACP lifecycle, warm reuse, reconnect |
| `launchArgs.cjs` | Permission aliases + CLI flag builder |
| `productPaths.cjs` | Desktop/IDE install discovery |
| `ipcContract.cjs` | Invoke/event channel list for preload gates |
| `security.cjs` | Workspace / URL / CLI allowlist |
| `jobRunner.cjs` / `artifactStore.cjs` | Manager headless jobs |
| `controlPlane.cjs` | Health + capabilities snapshot |
| `telemetry.cjs` | Opt-in local latency buckets |

## Hard rules (Phase D1)

| Rule | Why |
|------|-----|
| **Agent loop lives only in `grok` CLI** | Single intelligence source; desktop is a surface |
| **Renderer never spawns processes / calls model HTTP APIs** | Security + architecture boundary |
| **Desktop uses ACP stdio via `packages/acp-client`** | No second GrokClient class in desktop |
| **No Code-OSS tree in this monorepo** | IDE is optional separate product |
| **Windows: `signAndEditExecutable: false` + `afterPack` rcedit stamp** | Avoid winCodeSign symlink failures; stamp app exe only |

Enforce with:

```powershell
npm run check:arch
npm run check:packaging
npm test
```

## AgentSupervisor (P1)

- **Primary slot** — interactive chat (default; warm reuse + auto-reconnect)
- **Parallel slot** — optional second `grok agent stdio` (max 2 total)
- IPC: `agent:slots`, `agent:spawnSlot`, `agent:setActiveSlot`, `agent:stopSlot`
- Prompt/cancel/session APIs target the **active** slot
- Headless multi-task still uses Manager `jobRunner` (`grok -p`), not extra interactive slots

## Control plane (Phase D2)

Thin host API — **not** a full Codex App Server:

- `app:health` / `app:controlPlane` — connection, executable, capabilities, slots
- Headless jobs (`jobRunner`) wrap `grok -p`; interactive chat stays ACP
- Future optional App-Server can wrap the same CLI without changing renderer contracts

## Telemetry (Phase D4)

Opt-in, **local only** (userData). Metrics:

- `connect_ms`
- `first_token_ms`
- `tool_roundtrip_ms`
- `prompt_to_complete_ms`
- `job_ms`

Settings → Behavior → “Performance metrics (local only)”.

## Packaging icons (Phase D5)

```text
win.signAndEditExecutable = false
afterPack = build/stamp-win-icon.cjs   # rcedit Grok Build.exe only
nsis.installerIcon = build/icon.ico
# NEVER rcedit Setup/portable wrappers (destroys 7z payload)
```

## Optional IDE

`H:\projects\grok-build-ide` / `%LOCALAPPDATA%\Programs\Grok Build IDE` is a **separate** Code-OSS product.  
Not a submodule of this monorepo.
