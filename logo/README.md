# Grok Build — official logo

| File | Role |
|------|------|
| **`fluffy-grok-white-left-source.png`** | Preserved IDE-direction reference — white left / black right |
| **`fluffy-grok-master.png`** | **Primary Grok Build icon source** — faceless black-left/white-right Fluffy with inverse “grok” |
| **`grok-main-logo.png`** | Previous furry Grok tile (fallback) |
| **`grok-app.png`** | Legacy source (fallback if main missing) |
| **`processed/`** | **Build-ready** masters after crop + resize |

## Do not ship the raw source as the app icon

The raw logo is design art (often large with padding).  
Packaging must **process** it:

1. Key near-white / empty canvas → **transparent** (when present)
2. **Crop** to the mark / tile content
3. **Square pad** with a small safe margin
4. **Resize** to standard sizes (16…256, plus 512)
5. Write **`icon.ico` multi-size** for Windows exe / taskbar / Start menu

## Pipeline

```text
logo/fluffy-grok-master.png
        │
        ▼  node apps/desktop/build/generate-icon.mjs
        │     → generate-icon.ps1 (Windows)
        │
        ├── logo/processed/app-icon-master.png
        ├── logo/processed/icon-{16…512}.png
        ├── apps/desktop/build/icon.png   (256)
        ├── apps/desktop/build/icon.ico   (16…256)  ← win.icon
        └── apps/desktop/renderer/assets/logo.png
```

`scripts/generate-desktop-brand-master.ps1` deterministically inverts the neutral reference so Grok Build is black-left/white-right while Grok Build IDE remains white-left/black-right.

Release: `scripts/publish-release.ps1` runs the icon generator automatically.

## Dev (`npm start`)

Windows taskbar icons are tied to the **process EXE name**. Stock `electron.exe` is heavily cached.

Dev launch now uses a **stamped copy**:

```text
…/electron/dist/GrokBuild-dev.exe   ← icon.ico stamped via rcedit
npm start  →  npm run desktop  →  node build/run-dev.cjs  →  GrokBuild-dev.exe .
```

```powershell
# After changing logo/grok-main-logo.png — close Grok first, then:
powershell -File scripts/apply-app-icon.ps1

# That stamps:
#   - Dev host GrokBuild-dev.exe (npm start)
#   - Installed %LOCALAPPDATA%\Programs\Grok Build\Grok Build.exe
#   - Desktop + Start Menu shortcuts

# If taskbar still stale (Windows IconCache):
powershell -File scripts/refresh-win-icon-cache.ps1
# Unpin Grok from taskbar, open again, re-pin.
```

**Note:** Desktop shortcut often targets the *installed* app, not `npm start`.
Stamping only `electron.exe` will not change that shortcut.

## Windows note

Packaged builds: ICO is stamped onto `Grok Build.exe` via `afterPack` (`stamp-win-icon.cjs`).  
PNG-only dumps often keep the default Electron icon.
