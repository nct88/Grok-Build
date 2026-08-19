# Grok Build Desktop — default install paths (Windows)

Keep Desktop + IDE discovery in sync with `apps/desktop/src/productPaths.cjs` → `PRODUCT_PATHS` and `product/PRODUCT_IDENTITY.md`.

## Grok Build Desktop (agent desktop)

| Item | Value |
|------|--------|
| Product full name | **Grok Build Desktop** |
| Windows product name | **Grok Build** |
| Default install dir | `%LOCALAPPDATA%\Programs\Grok Build\` |
| Default executable | `Grok Build.exe` |
| Alt names | `GrokBuild.exe` |
| Portable helper | `scripts/run-portable.ps1` installs here |
| App state | `%APPDATA%\@grok-build\desktop\` |
| CLI auth / sessions | `%USERPROFILE%\.grok\` |

Full path example:

```text
C:\Users\<you>\AppData\Local\Programs\Grok Build\Grok Build.exe
```

## Grok Build IDE (optional editor shell)

| Item | Value |
|------|--------|
| Product name | **Grok Build IDE** |
| Default install dir | `%LOCALAPPDATA%\Programs\Grok Build IDE\` |
| Default executable | `Grok Build IDE.exe` |
| Fallback exe names | `GrokBuildIDE.exe`, `Code.exe` |
| Env override | `GROK_BUILD_IDE` = folder or full path to `.exe` |
| Settings override | Settings → **IDE path** |

Full path example:

```text
C:\Users\<you>\AppData\Local\Programs\Grok Build IDE\Grok Build IDE.exe
```

### Open IDE button behavior

1. Resolve `.exe` (settings → env → default install → Program Files → dev trees **only if** they contain a runnable exe).
2. If found: **spawn** the exe (not “open folder”), pass current workspace as the first argument.
3. If not found: show in-app dialog → **Download IDE** (placeholder URL until landing page / GitHub release is set).

### Download URL

- Default: `https://github.com/nct88/Grok-Build-IDE/releases/latest`
- Override: set `ideDownloadUrl` in desktop state.

## Installer / release notes

- NSIS / portable builds should target the paths above so detection works without user config.
- Do not treat a bare source checkout as “installed” unless a built `.exe` exists inside.
