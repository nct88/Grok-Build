# Distribution notes — Windows

## Channels

| Channel | Use |
|---------|-----|
| **NSIS setup** | `Grok-Build-Setup-<ver>.exe` — Start Menu + Desktop shortcut |
| **Portable exe** | Single-file extractor (re-extracts each run — slower) |
| **Zip / win-unpacked** | Prefer for durable install via `scripts/run-portable.ps1` |
| **Update** | `dist/<ver>/update/` + `apply-update.ps1` (asar + packages) |
| **Feed** | `dist/latest.json` — local path by default; set public URL in Settings |

## Code signing & SmartScreen (unsigned builds)

Current releases ship **without** Authenticode code signing (`signAndEditExecutable: false` is intentional for icon stamp compatibility).

**Expected first-run behavior:**

1. Windows SmartScreen / Defender may show **“Windows protected your PC”** or similar.
2. User can choose **More info → Run anyway** (or unblock the file properties).
3. After first successful run, warnings usually stop for that file hash on that machine.

An unsigned status alone is not evidence that a build is malicious or safe. Verify the
artifact against its release `MANIFEST.json` hash before running it. For public or
enterprise distribution:

1. Obtain an Authenticode certificate (EV preferred for reputation).
2. Sign `Grok Build.exe`, Setup, and portable wrappers **after** packaging (do **not** rcedit the NSIS/portable 7z wrappers — destroys payload; only stamp the app exe via `afterPack`).
3. Optional: submit to Microsoft SmartScreen portal for reputation.

Until then: document the warning in release notes and keep `docs/COMPLETE.md` honest about unsigned status.

## Build an immutable local candidate

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\publish-release.ps1 -Version <semver>
```

## Publish to GitHub Releases

Commit and push the version, release notes and source changes before tagging:

```powershell
npm run check
git add -A
git commit -m "release: Grok Build <semver>"
git push origin main
```

Run the GitHub publisher in preflight mode first, then publish:

```powershell
npm run release:github -- -Version <semver> -DryRun
npm run release:github -- -Version <semver>
```

The publisher requires a clean default branch synchronized with `origin`, matching source/manifest versions, release notes at `docs/releases/<semver>.md`, and artifact hashes matching `MANIFEST.json`. It creates and pushes annotated tag `v<semver>`, publishes the GitHub Release as latest, and uploads Setup, Portable EXE, Portable ZIP and the manifest. Existing tags and releases are never overwritten.

Unsigned artifacts are rejected by default. `-AllowUnsigned` is an explicit maintainer-authorized exception and must retain the SmartScreen warning in the release notes:

```powershell
npm run release:github -- -Version <semver> -AllowUnsigned
```

## Update feed (DIY)

Host a JSON file:

```json
{
  "version": "0.5.27",
  "url": "https://example.com/Grok-Build-0.5.27-win32-x64-portable.exe",
  "notes": "Release notes…"
}
```

Set **Update feed URL** in Settings. App compares semver and offers the download URL (user installs manually unless you wire a custom apply path).

## Release checklist

- [ ] `product/VERSION` == root `package.json` version == desktop `package.json`
- [ ] `npm run check` green
- [ ] Icons stamped (taskbar not default Electron)
- [ ] Connect path: `grok [flags] agent stdio`
- [ ] Open IDE resolves install paths (no single-drive hardcode only)
- [ ] SmartScreen note in release notes if still unsigned
- [ ] Public distribution is authorized under `LICENSE` or a separate written agreement
- [ ] Public artifacts pass `-PublicRelease` HTTPS + Authenticode gates
- [ ] `dist/latest.json` + MANIFEST written by publish script
- [ ] Release notes exist at `docs/releases/<version>.md`
- [ ] `npm run release:github -- -Version <version> -DryRun` passes
- [ ] Release commit is pushed and `HEAD` matches `origin/main`
- [ ] Annotated tag and GitHub Release point to the verified release commit
- [ ] GitHub assets match Setup, Portable EXE, Portable ZIP and MANIFEST names
