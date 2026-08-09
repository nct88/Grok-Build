# P1 stability and release-readiness — 2026-08-08

## Outcome

P1 follow-up is complete for the directly evidenced startup and release-readiness gaps found after P0.

- **Grok Build Desktop is now 0.5.27.** The packaged Electron runtime and executable metadata changed, so new immutable candidates were produced instead of modifying 0.5.25; intermediate 0.5.26 remains preserved.
- **Grok Build IDE is now 1.0.3.** A new immutable local unsigned candidate was built because startup/runtime behavior changed.

## Desktop 0.5.27

### Resolved

- Removed the public-release license TODO from `README.md`.
- Added a conservative all-rights-reserved `LICENSE`; this does not claim or grant an open-source license.
- Added license/distribution assertions to the release contract.
- Corrected stale 0.5.21 examples in distribution and roadmap documentation.
- Reworded the unsigned-build guidance so it does not treat unsigned status as proof of safety; users are directed to verify manifest hashes.
- Upgraded Electron **34.5.1 → 43.3.0**, electron-builder **25.1.8 → 26.15.3**, and Playwright **1.56.1 → 1.62.1**.
- Removed the Playwright/Node `DEP0190` warning and made the visual harness resolve Electron correctly whether npm hoists or nests the workspace dependency.
- Stamped the unpacked application executable with `ProductName=Grok Build`, version 0.5.27, Grok Build description/company/copyright, and the correct original filename; it no longer exposes Electron product metadata in Windows properties.

### Evidence

- `npm run check`: **24 passed, 0 failed**.
- Architecture, packaging, release contract, security, unit/E2E, and visual gates passed.
- Source and Electron-43 packaged visual evidence passed at 1000×640; the packaged render was inspected directly at `docs/reports/evidence/0.5.27/desktop-packaged-1000x640.png`.
- Full `npm audit` (including packaging/runtime tools): **0 vulnerabilities**.

The final immutable 0.5.27 hashes are:

| Artifact | SHA-256 |
|---|---|
| Portable EXE | `5C26F012A585232BF443A8E41B0DF52AB8F2CBBBF57CEF1D800D17947D892C0D` |
| Portable ZIP | `DD8AF8E36F3A9A7EB80DDCFD22B4FB3437356339FCBBB26811F543430A623A9A` |
| Installer | `CF594BAD26916B214A5F587286BB6A0981C302D4E13E683408230D2BD77078E0` |

## Grok Build IDE 1.0.3

### Resolved

- Fresh installs start in **Grok Build IDE**, not the separate Grok Build agent-desktop surface.
- Agent-first startup is opt-in; an existing persisted product choice is still respected.
- Initial webview HTML now derives product class, title, and rail identity from the layout service, preventing a wrong-product first frame.
- Removed invalid extension-level `files.hotExit` configuration defaults while retaining `files.hotExit: onExitAndWindowClose` in the portable user profile.
- Added regression tests covering product defaults, the valid hot-exit location, and pre-persisted-state fallbacks.

### Evidence

- Typecheck/build/release contract: passed.
- Vitest: **61 passed across 14 files**.
- Responsive visual gate: **4 scenarios passed** at 240×720, 390×720, 600×900, and 600×900 at 150%.
- The dark 150% and light narrow renders were inspected directly; composer, cards, menus, labels, and product identity remain readable without clipping.
- Portable verification passed first extraction, cached second launch, missing-file repair, extension registry, and portable settings.
- Packaged runtime activated `local-grok-workbench.grok-build-workbench` for both `onStartupFinished` and `onView:grokBuild.chat`.
- Folder open reused the existing application window.
- Runtime log scan: **no** `Cannot register configuration defaults` / `files.hotExit` warning.
- `npm audit --omit=dev`: **0 vulnerabilities**.

### Immutable artifacts

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `Grok-Build-IDE-1.0.3-win32-x64-portable.exe` | 247,351,229 | `E6A4339BC02F76FC903A8070B10A973D42502DDC0748DFC97D566261086412F7` |
| `Grok-Build-IDE-1.0.3-win32-x64-portable.zip` | 236,153,657 | `4F30B45BE1C2A2CE4F1F00879B56B1041261DCC7B88E5B5F680DB7AE597B75C7` |
| `Grok-Build-IDE-Setup-1.0.3.exe` | 159,724,871 | `FC0030412CD0F73D67895EF7A71382CDC62F6A850BDF77E2D0637ECBF77EBB2E` |
| `grok-build-workbench-1.0.3.vsix` | 140,161 | `11FC283EFC49AE2D8112F922330F9E02FFF3196642D19FFD50F7A5BE9B8AF7E7` |

Release status is `local-unsigned-candidate`; the manifests contain relative paths and `dist/latest.json` points to 1.0.3.

## Remaining external release gates

These are not source defects and were not bypassed:

- Public HTTPS hosting/update CDN.
- Authenticode signing and publisher certificate reputation.
- Explicit authorization for any Desktop distribution beyond the rights stated in `LICENSE`.

The release scripts continue to reject public publishing without HTTPS and valid signatures.
