# Contributing to Grok Build Desktop

This repository is **Grok Build Desktop** (`nct88/Grok-Build-Desktop`).
Grok Build IDE lives in [`nct88/Grok-Build-IDE`](https://github.com/nct88/Grok-Build-IDE).
The agent engine is the official **Grok CLI**, not a second runtime.

## Development

```powershell
npm install
npm start
```

Run the repository gate before opening a pull request:

```powershell
npm run check
```

Keep credentials, Grok sessions, generated reports, build output and release
artifacts out of Git. Update `CHANGELOG.md` and the matching
`docs/releases/<version>.md` file for public product changes.
