# Grok Build

**Agent desktop** over the official **Grok CLI** (`grok agent stdio` + **ACP**).  
Optional companion: **Grok Build IDE** (separate Code-OSS install).

> **CLI-as-core · UI-as-surface** — the agent loop, tools, auth, and sessions live in Grok CLI (`~/.grok`). This app is a product-quality surface, not a VS Code reskin and not a second agent runtime.

**Ship line:** see [`product/VERSION`](product/VERSION) (desktop package version follows the monorepo root).

```text
Grok Build Desktop (Electron)
    → AgentSupervisor (main)
        → packages/acp-client (GrokClient)
            → grok agent stdio     ← owns intelligence / tool loop
                → ~/.grok          ← auth, sessions, skills
```

---

## Products

| Product | Role | Location |
|---------|------|----------|
| **Grok Build** | Primary agent desktop (this monorepo) | `apps/desktop` |
| **Grok Build IDE** | Optional full editor (Code-OSS) | Separate tree / install — **not** vendored here |
| **Grok CLI** | Official agent engine (required) | `grok` on PATH or `GROK_EXECUTABLE` |

Default Windows install paths: [`docs/INSTALL_PATHS.md`](docs/INSTALL_PATHS.md).

| App | Default dir | Executable |
|-----|-------------|------------|
| Grok Build | `%LOCALAPPDATA%\Programs\Grok Build\` | `Grok Build.exe` |
| Grok Build IDE | `%LOCALAPPDATA%\Programs\Grok Build IDE\` | `Grok Build IDE.exe` |

---

## Features (desktop v1 surface)

- Streaming chat, thinking / plan, markdown timeline  
- Tool cards, permissions, model / effort / mode  
- Files + **Review** (accept/reject, **hunk-level**)  
- Interactive **terminal** + ACP reverse where applicable  
- Session tabs, history replay, export / delete  
- **Manager**: headless jobs (`grok -p`), artifacts, worktree UI  
- MCP / plugins forms aligned with CLI flags  
- Theme light / dark / system · **i18n EN / VI**  
- Usage / plan limit (same billing source as CLI `/usage`)  
- Multi-slot agent foundation (primary + optional parallel)  
- **Open IDE** deep-link for current workspace  
- Portable + NSIS + hot-update channel  

---

## Repository layout

```text
Grok-Build/
├─ apps/desktop/           primary product (Electron)
├─ packages/acp-client/    ACP client + Node FS host
├─ packages/sessions/      local session index
├─ dist/                   local build output (not always in git)
├─ docs/                   architecture, distribution, marketing
├─ product/                VERSION, product identity
└─ scripts/                dev, publish, e2e, architecture checks
```

---

## Requirements

- **Node.js** ≥ 20 (develop / build)  
- **Windows x64** for current packaged builds  
- **Grok CLI** installed and authenticated (`grok login`)  

Resolve order for the CLI: `GROK_EXECUTABLE` → PATH → `%USERPROFILE%\.grok\bin\grok.exe`.

---

## Run (development)

```powershell
cd <your-clone>\Grok-Build
npm install
npm run desktop
# or: powershell -File scripts\dev-desktop.ps1
# or: desktop.cmd
```

---

## Quality gates

```powershell
npm run check          # architecture + packaging + e2e unit suite
npm test               # e2e only
# $env:GROK_E2E_LIVE=1; npm test   # optional live grok --version
```

Hard rules (enforced by `check:arch`):

- Agent loop only in **Grok CLI**  
- Renderer never spawns agent processes or calls model HTTP APIs  
- Desktop uses **ACP** via `packages/acp-client` only  
- No full Code-OSS tree in this monorepo  

---

## Release packages (Windows)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File scripts\publish-release.ps1 -Version <semver>
```

Example channels after publish (replace `<ver>`):

| Channel | Path |
|---------|------|
| **Portable exe** | `dist/<ver>/portable/Grok-Build-<ver>-win32-x64-portable.exe` |
| **Portable zip** (recommended durable install) | `dist/<ver>/portable/Grok-Build-<ver>-win32-x64.zip` |
| **NSIS setup** | `dist/<ver>/install/Grok-Build-Setup-<ver>.exe` |
| **Hot update** | `dist/<ver>/update/` + `apply-update.ps1` |
| **Feed** | `dist/latest.json` |

Helpers:

```powershell
npm run portable              # install zip → LocalAppData Programs + launch
npm run portable:shortcut     # + Desktop shortcut
```

Windows builds are often **unsigned** — SmartScreen may warn on first run.  
Details: [`docs/DISTRIBUTION.md`](docs/DISTRIBUTION.md).

---

## Optional IDE

Full editor lives **outside** this monorepo (e.g. local IDE project or installed under LocalAppData).

From the desktop: **Open IDE** resolves:

1. Settings → IDE path  
2. Env `GROK_BUILD_IDE`  
3. Default install / common locations  

If missing, the app can show a download placeholder until a public IDE release URL is configured.

---

## Docs

| Doc | Content |
|-----|---------|
| [Architecture](docs/ARCHITECTURE.md) | Layers, AgentSupervisor, packaging rules |
| [Roadmap](docs/ROADMAP.md) | Ship line, P0–P2, next |
| [Distribution](docs/DISTRIBUTION.md) | Channels, signing, SmartScreen |
| [Install paths](docs/INSTALL_PATHS.md) | Desktop + IDE discovery |
| [Release status](docs/COMPLETE.md) | Feature inventory |
| [Social launch copy (VI/EN)](docs/marketing/SOCIAL_LAUNCH_VI.md) | Posts for social networks |
| [GitHub release helper](docs/marketing/GITHUB_RELEASE_AND_REPO.md) | About, topics, release body |
| [Release notes 1.0 draft](docs/marketing/release-notes-1.0.md) | GH Release template |

---

## Philosophy

```text
Surface (Desktop / IDE / TUI)
    → Protocol (ACP)
        → Core (Grok CLI)
            → Host (FS, shell, auth, sessions)
```

Grok Build Desktop optimizes the **surface**: speed, review safety, sessions, jobs, localization — without forking the intelligence layer.

---

## License

Copyright (c) 2026 Grok Build contributors. All rights reserved. See
[LICENSE](LICENSE). No open-source license is granted for this repository.

Third-party components remain subject to their own licenses and notices.

## Disclaimer

Grok CLI and Grok models are products of their respective owners (xAI / Grok ecosystem).  
This repository provides an **independent desktop surface** that launches and speaks to the official CLI via ACP. Not affiliated unless explicitly stated.
