# Grok Build product identity

| Field | Value |
|---|---|
| Primary app | **Grok Build** (agent desktop) |
| Version line | see `product/VERSION` / package.json |
| Runtime | Official `grok` CLI via ACP |
| Shell | Electron (`apps/desktop`) — **not** Code-OSS |
| Optional IDE | **Grok Build IDE** (separate install) |

## Default install (Windows)

See full table: [`docs/INSTALL_PATHS.md`](../docs/INSTALL_PATHS.md)

| App | Install dir | Executable |
|---|---|---|
| **Grok Build** | `%LOCALAPPDATA%\Programs\Grok Build\` | `Grok Build.exe` |
| **Grok Build IDE** | `%LOCALAPPDATA%\Programs\Grok Build IDE\` | `Grok Build IDE.exe` |

## User data

| App | Data |
|---|---|
| Grok Build desktop | Electron `userData` (`%APPDATA%\@grok-build\desktop\`) + `~/.grok` (CLI) |
| Grok Build IDE | Code-OSS / product data under its own userData |
