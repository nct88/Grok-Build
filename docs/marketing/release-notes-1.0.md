# Grok Build 1.0.0

Agent **desktop** built on the official **Grok CLI** (`grok agent stdio` + ACP).  
Not a VS Code reskin. Optional **Grok Build IDE** is a separate install.

## Highlights

- Streaming chat, thinking / plan, markdown
- Tool cards + permission controls
- Files + Review (accept / reject, hunk-level)
- Interactive terminal
- Session tabs, history, export
- Manager: headless jobs (`grok -p`), artifacts, worktree UI
- MCP / plugins forms aligned with CLI flags
- Theme light / dark / system · i18n EN / VI
- Usage / plan limit (same billing source as CLI `/usage`)
- Multi-slot agent foundation (primary + parallel)
- Open IDE deep-link to current workspace
- Portable + NSIS + hot-update channel

## Architecture

```text
Desktop (Electron)
  → AgentSupervisor
    → @grok-build/acp-client
      → grok agent stdio   ← owns agent loop
        → ~/.grok auth & sessions
```

## Requirements

- Windows x64
- Grok CLI installed (`grok` on PATH, `%USERPROFILE%\.grok\bin\grok.exe`, or `GROK_EXECUTABLE`)
- Authenticated CLI (`grok login` or equivalent)

## Downloads

| Channel | Recommended use |
|---------|-----------------|
| **Installer (NSIS)** | Start Menu + Desktop shortcut |
| **Portable zip** | Fixed folder install (preferred over single-file portable) |
| **Portable exe** | Quick try (re-extracts each launch — slower) |
| **Hot update** | Apply `app.asar` + packages onto existing install |

> **SmartScreen:** builds may be **unsigned**. First run: *More info → Run anyway*.

## Optional: Grok Build IDE

Separate Code-OSS product. Default:

`%LOCALAPPDATA%\Programs\Grok Build IDE\Grok Build IDE.exe`

From desktop: **Open IDE** (opens current workspace).

## Docs

- `README.md` — overview & dev
- `docs/ARCHITECTURE.md` — layering rules
- `docs/DISTRIBUTION.md` — packaging & signing
- `docs/INSTALL_PATHS.md` — install discovery
