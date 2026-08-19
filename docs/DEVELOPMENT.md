# Development

## Requirements

- Node.js 20 or newer
- npm
- Grok CLI available on `PATH`, in `%USERPROFILE%\.grok\bin`, or through
  `GROK_EXECUTABLE`

## Run from source

```powershell
git clone https://github.com/nct88/Grok-Build-Desktop.git
cd Grok-Build-Desktop
npm install
npm start
```

`npm start` builds the ACP and session packages, stamps the development
Electron executable and opens Grok Build Desktop. `npm run desktop` remains
as a compatibility alias.

## Verify

```powershell
npm run check
```

Generated output belongs in ignored directories such as `dist/`, `.build/`
and package-level `dist/` folders.
