# Grok Build — Agent Instructions

## Product

| Item | Path |
|---|---|
| **Primary app** | `apps/desktop` — Electron + `grok agent stdio` (no VS Code) |
| **ACP package** | `packages/acp-client` |
| **Optional IDE** | Separate tree: `H:\projects\grok-build-ide` (not vendored here) |
| **Memory** | `H:\projects\.grok-build` + `memory/` |

## Do not

- Re-add a full Code-OSS tree under this repo
- Ship VS Code portables as “Grok Build” primary
- Dual-edit `H:\projects\grok-code`

## Commands

```powershell
cd H:\projects\Grok-Build
npm install
npm run desktop
# or:
powershell -File scripts\dev-desktop.ps1
```

Requires Grok CLI (`grok` on PATH, `~\.grok\bin\grok.exe`, or `GROK_EXECUTABLE`).

## Layout

```text
apps/desktop          UI shell (main modules: agentSupervisor, launchArgs, productPaths, ipcContract)
packages/acp-client   GrokClient + Node FS host
packages/sessions     local session index
dist/                 portable / NSIS / update channels
docs/                 roadmap + architecture + DISTRIBUTION
scripts/              dev-desktop, publish-release, e2e, check-architecture
```

## Gates

```powershell
npm run check
```

## Projects / Recents (Desktop) — Codex-aligned

| Area | Behavior |
|---|---|
| **Projects** | Real folders only; folder icon + dim title; chats nested under **each** project; empty = “No chats” / “Không có cuộc trò chuyện nào” |
| **+** | Header right of Projects — open folder |
| **Order** | First opened on top; new append bottom; drag-and-drop reorder |
| **Recents / Gần đây** | Separate section under Projects — no-project chats only (never a “No project” row inside Projects) |
| **Composer** | Chip “Choose project” / “Chọn dự án” when none selected |

Chat without project still works (agent cwd `~/.grok/desktop-recents`).

## Imagine media (Desktop)

| Feature | Notes |
|---|---|
| `/imagine` | Expands to `image_gen` prompt; preview via `fs:readMediaPreview` (session `images/`) |
| `/imagine-video` | Needs **privacy Opt in** (`coding_data_retention_opt_out: false` in `~/.grok/auth.json`). Opt out → API 400 `upload_url`/ZDR-style; Desktop preflight warns. Team ZDR must be Disabled. |
| Timeline | Click image → lightbox; right-click → copy / open folder; video uses blob resolve + `videos/` |
| Tools order | Tools collapse into one group; final assistant answer streams **below** tools |

Privacy is account-side (Grok TUI `/privacy`), not an app toggle we can flip from Electron.
