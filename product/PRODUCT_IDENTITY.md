# Grok Build product identity

Use these names consistently in source, docs, and GitHub. Do not treat
Desktop and IDE as the same product.

| Field | Grok Build Desktop | Grok Build IDE |
|---|---|---|
| Product full name | **Grok Build Desktop** | **Grok Build IDE** |
| This repository | yes (`apps/desktop`) | no — separate product |
| GitHub repository | [`nct88/Grok-Build-Desktop`](https://github.com/nct88/Grok-Build-Desktop) | [`nct88/Grok-Build-IDE`](https://github.com/nct88/Grok-Build-IDE) |
| Clone URL | `https://github.com/nct88/Grok-Build-Desktop.git` | `https://github.com/nct88/Grok-Build-IDE.git` |
| Runtime | Official **Grok CLI** via ACP | Official **Grok CLI** via ACP |
| Shell | Electron (`apps/desktop`) — **not** Code-OSS | Code-OSS + Grok Build Workbench |
| Windows product name | **Grok Build** | **Grok Build IDE** |
| Windows executable | `Grok Build.exe` | `Grok Build IDE.exe` |
| Default install dir | `%LOCALAPPDATA%\Programs\Grok Build\` | `%LOCALAPPDATA%\Programs\Grok Build IDE\` |

The Windows product name for Desktop stays **Grok Build** so existing
installs, Start Menu shortcuts, and IDE “Open Grok Build” discovery keep
working. Docs and GitHub always say **Grok Build Desktop**.

Never write **Grok Build CLI**. The engine is the official **Grok CLI**.

## Default install (Windows)

See the full table: [`docs/INSTALL_PATHS.md`](../docs/INSTALL_PATHS.md)

| App | Install dir | Executable |
|---|---|---|
| **Grok Build Desktop** | `%LOCALAPPDATA%\Programs\Grok Build\` | `Grok Build.exe` |
| **Grok Build IDE** | `%LOCALAPPDATA%\Programs\Grok Build IDE\` | `Grok Build IDE.exe` |

## User data

| App | Data |
|---|---|
| Grok Build Desktop | Electron `userData` (`%APPDATA%\@grok-build\desktop\`) + `~/.grok` (CLI) |
| Grok Build IDE | Code-OSS product data under its own userData + `~/.grok` (CLI) |
