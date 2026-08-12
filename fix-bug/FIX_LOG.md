# FIX / CHANGE LOG

## 2026-08-12 — Fast README language switch with deployment parity gate

- Symptom: the repository displayed Vietnamese and English together in selected README sections, but GitHub has no native per-repository language switch and visitors could not open a clean single-language document.
- Resolution: keep `README.md` as the complete Vietnamese page, add a complete `README.en.md`, and place reciprocal Vietnamese/English controls at the top of both files.
- Prevention: the release contract now verifies reciprocal relative links, current version, matching section counts, English-content completeness and exact parity of all four release download URLs; the GitHub publisher executes that contract before publishing.
- Verification: focused release-contract check, full root gate, remote README link inspection and GitHub-rendered link targets.

## 2026-08-12 — Bilingual Vietnamese–English GitHub release content

- Symptom: the public README was primarily Vietnamese while the `v0.5.30` GitHub Release body was English-only, and the deployment workflow did not prevent future single-language release notes.
- Resolution: present the public project/download/release workflow and the 0.5.30 release notes in Vietnamese and English, add a reusable side-by-side release template, and make the GitHub publisher reject notes missing either language marker or the parallel translation table.
- Verification: release-contract gate, publisher PowerShell syntax, full root check, GitHub Release body comparison and marker/table checks against the remote release.

## 2026-08-12 — Reproducible GitHub Release publishing workflow

- Symptom: local release candidates had to be tagged and uploaded with ad-hoc GitHub CLI commands, while README download links and repository visibility text could remain on the previous release.
- Resolution: add a guarded GitHub publisher with dry-run support, synchronized branch/version checks, manifest hash verification, annotated tag creation, deterministic asset upload and post-publication asset verification; update README and distribution documentation to the 0.5.30 release.
- Safety: existing tags/releases are never overwritten; unsigned executables fail unless a maintainer explicitly supplies `-AllowUnsigned`, and release notes must retain the SmartScreen warning.
- Verification: `npm run release:github -- -Version 0.5.30 -AllowUnsigned -DryRun`, root `npm run check`, remote commit/tag comparison and GitHub Release asset inspection.

## 2026-08-11 — Grok Build Desktop 0.5.30 local release candidate

- Includes Codex-like session layout, ordered live reasoning/tool/answer flow, safe restoration of persisted `summary_text` reasoning, flat Plan/diff/review surfaces, framed Markdown tables, compact-window right-panel hiding, and navigable blue local paths with a context menu.
- Release scope: Desktop primary app only; the separate Grok Build IDE repository is unchanged.
- Distribution: local unsigned candidate with portable executable, portable ZIP, NSIS installer, hot-update channel and SHA-256 manifest. GitHub Release 0.5.29 remains the latest published download until 0.5.30 artifacts are explicitly uploaded.
- Verification target: root `npm run check`, packaged 1000×640 layout render, release contract and manifest integrity.

## 2026-08-11 — Navigable local paths in completed session answers (0.5.30)

- Symptom: absolute and project-relative paths in completed assistant Markdown remained raw text; explicit Markdown file links were styled but had no local navigation behavior.
- Resolution: hydrate finalized assistant text nodes into square blue path markers while excluding URLs, prose slash-pairs, code spans, code fences and diff content. Left-click reveals the item in its containing folder; right-click opens a viewport-safe localized menu for reveal, open and copy actions. Relative paths resolve against the active project before using the existing guarded shell IPC.
- Security: no new filesystem IPC or permission was added; existing workspace containment, outside-workspace setting and credential-file blocks remain authoritative.
- Verification: unit coverage exercises absolute/relative detection plus URL/prose false positives. Visual interaction coverage verifies blue treatment, left-click reveal, right-click menu, open action and menu containment at 1440×900 and compact 1000×640.

## 2026-08-11 — Flat session surfaces and framed Markdown tables (0.5.30)

- Symptom: Plan, file-diff/tool and review items used gray rounded card surfaces; completed Markdown tables rendered as aligned text without a visible grid in the production worker path.
- Root cause: session surface classes carried `background`, border and radius chrome, while the off-thread Markdown renderer emitted a bare `.md-table` that did not match the main renderer's `.md-table-wrap` contract or table styles.
- Resolution: flatten Plan, legacy/live tool containers, diff shells and review rows while retaining semantic diff colors and action affordances; standardize both Markdown renderers on `.md-table-wrap`; add a square outer frame, header treatment, cell grid and horizontal overflow for tables.
- Verification: the visual harness proves live output remains plain text while streaming, every finalized answer becomes `md-structured`, raw `##`/`**`/pipe-table markers disappear after `turn_complete`, Plan/diff/review surfaces are transparent with zero radius, and Markdown tables have an outer/cell frame. Unit coverage checks the main and worker table markup contracts.

## 2026-08-11 — Hide the right panel on narrow Desktop windows (0.5.30)

- Symptom: at the compact 1000×640 viewport, the optional Files/Review panel remained visible as an overlay and reduced the usable conversation area.
- Resolution: below or at 1180 CSS pixels, hide the right panel, its splitter, and its unavailable title-bar toggle. The stored panel preference is unchanged, so the panel returns automatically when the window becomes wide enough.
- Regression gate: both Desktop visual harnesses now require the panel and toggle to have `display: none`, a zero-width panel box, a usable composer, and no horizontal overflow at 1000×640.

## 2026-08-11 — Codex-like Desktop session reasoning and timeline (0.5.30)

- Symptom: live thought and answer chunks could be reordered by batching, completed tool rows could remain expanded, the empty-state hero could remain above a new conversation, and reopening a Grok CLI session omitted its saved reasoning summaries.
- Root cause: the stream batcher kept separate thought/assistant buffers instead of preserving segment order; the completed-tool update did not close its details element; the empty state was not cleared at send time; and the transcript parser intentionally skipped `reasoning` records.
- Resolution: preserve ordered stream segments, flush thoughts before answers, collapse completed tools, clear the hero on send, synchronize the agent reasoning context, and restore only Grok CLI `summary_text` reasoning records as closed thought rows. Encrypted reasoning payloads remain excluded from renderer data and the DOM.
- UI alignment: moved the Desktop surface to Codex-like neutral dark/light tokens, a centered 780 px reading column, compact reasoning/tool rows, right-aligned user bubbles, quieter three-pane chrome, and a floating rounded composer with compact-window drawer coverage checks.
- Verification: root `npm run check` passed architecture, packaging, brand, release, 25 automated tests, and dark/light visual gates at 1440×900 plus compact 1000×640. The visual harness verified 3 live thought rows, 2 completed tool rows, 2 persisted thought rows, correct timeline order, no orphan `Thinking`, no encrypted ciphertext, and no overflow.

## Unreleased — Repository hygiene for generated and superseded local files

- Symptom: Git tracked a machine-specific Electron development executable path, an outdated root-level CSS copy, duplicate logo files, and unreferenced prototype/raw media totaling 9.51 MiB.
- Root cause: the initial repository import included local runtime metadata and exploratory assets that are outside the current Desktop source, branding, test, and release pipelines.
- Resolution: add exact ignore rules and remove the 10 confirmed files from Git tracking while preserving their local copies.
- Preserved inputs: the canonical Fluffy masters, processed icon matrix, packaged PNG/ICO, renderer logo, documented fallbacks, report documents, and release manifests remain tracked.
- Verification: tracked-reference and duplicate-hash audits, `git check-ignore`, `git diff --check`, and the root `npm run check` gate.

## Unreleased — GitHub preflight security hardening

- Blocked HTTP(S) URLs containing embedded usernames or passwords before they reach the OS browser and added a regression case to the desktop security gate.
- Hardened repository exclusions for local releases, build caches, runtime evidence containing account UI, environment files, cookie stores, auth files, private keys, and disposable scratch files.
- Removed the remaining hard-coded local Windows username from a disposable helper; source scans found no real API key, access token, refresh token, cookie database, or private key in the publishable Desktop tree.

## 2026-08-09 — Distinct Grok Build icon direction (0.5.29)

- Changed Grok Build only to a faceless black-left/white-right Fluffy with centered inverse “grok” lettering; Grok Build IDE 1.0.6 remains white-left/black-right for immediate taskbar and shortcut differentiation.
- Added a deterministic neutral-luminance inversion generator and preserved the IDE-direction source reference so the readable word is never mirrored and chroma residue cannot return.
- Updated the brand regression gate to require the two opposing directions plus synchronized PNG, ICO, renderer/About, executable, portable, and installer assets.
- Published immutable local unsigned candidate `dist/0.5.29` after the 24-test suite, source and packaged About render, release contract, and direct 32px icon extraction from the app, portable, and installer all passed.

## 2026-08-09 — Shared split Fluffy branding (0.5.28)

- Adopted the same faceless split white/black Fluffy with inverse centered “grok” lettering used by Grok Build IDE 1.0.6.
- Updated the canonical master, processed size matrix, renderer/About logo, Windows ICO, development executable stamping, portable, and installer sources.
- The icon generator now preserves connected white fur whenever the source already has transparent corners instead of treating it as removable canvas.
- Added a mandatory brand gate for alpha, split color coverage, chroma cleanup, 10 PNG sizes, 9-frame ICO, and renderer/build synchronization.
- Published immutable local unsigned candidate `dist/0.5.28`; the full check suite and packaged About-layout gate passed, and the app, portable, and installer executables expose the same split Fluffy icon.

## 2026-08-08 — P1 runtime and release readiness (0.5.27)

- Upgraded the packaged runtime from Electron 34.5.1 to 43.3.0 and electron-builder 25.1.8 to 26.15.3; the complete dependency audit now reports zero vulnerabilities.
- Upgraded Playwright 1.56.1 to 1.62.1 and resolved the Electron executable through the workspace package instead of assuming a nested `node_modules` layout.
- Removed the Node `DEP0190` warning from the visual gate and verified both source and packaged layouts at 1000×640.
- Stamped `Grok Build.exe` with Grok Build product/file metadata as well as the icon, eliminating the visible `ProductName=Electron` fallback.
- Added explicit all-rights-reserved license/distribution metadata and release-contract checks; public publishing remains gated on HTTPS and Authenticode.
- Published immutable local unsigned candidate `dist/0.5.27` with portable, installer, and update channels; 0.5.26 remains preserved as an intermediate candidate.

## 2026-08-08 — P0 release hardening (0.5.25)

- Release versions are immutable: publishing aborts when `dist/<version>` already exists and never prunes older releases.
- Portable, installer, and update artifacts are mandatory; incomplete channels now fail the release.
- Manifest entries use portable relative paths; `latest.json` uses a relative URL or an explicit release base.
- Removed the build-machine fallback path from the hot-update helper.
- At the supported minimum window width, the right tools drawer is constrained to the timeline so the title, status, and composer remain visible and usable.
- Added `packaging.json` and a release-contract gate to `npm run check`.

## 2026-08-07 — Projects / Recents (Codex-style)

- **Chat without project:** allowed. Agent cwd = `~/.grok/desktop-recents` (not listed as a project).
- **Sidebar:** chats nest **under** the active project row (or under **No project** for recents) — not a separate section below the list.
- **Composer:** project chip (left of permission) — No project / recent projects / Open folder…
- `app:setWorkspace`, `agent:connect` accepts empty root → recents; `onConnected` does not save recents path as `workspaceRoot`.

## 2026-08-07 — Imagine video privacy preflight + media UX baked in

- Root cause of “video never works”: account `coding_data_retention_opt_out: true` → API 400 `output.upload_url` (message says ZDR even when team ZDR is Disabled).
- `readAuthProfile` exposes `codingDataRetentionOptOut`, `imagineVideoBlocked`, `imagineVideoReady`, `imagineVideoHint`.
- `/imagine-video` expands with preflight note; `send()` refreshes auth and adds a timeline step when blocked.
- Settings → Account → Imagine video status + Refresh; cannot flip privacy from Desktop (use Grok `/privacy`).
- Media: lightbox, context menu (copy/folder), video resolve via blob, session `videos/`, size limits image 12MB / video 64MB.
- Timeline: tool_group + stream split (answer below tools).

## 2026-08-07 — Timeline order: tools group + answer below tools

- Bug: assistant stream stayed one bubble; tools appended after it; later deltas updated the *first* bubble → final answer sat **above** long tool lists (scroll up to read).
- Fix: `eventStore.pushDelta` starts a **new** assistant bubble if anything was appended after the live stream (tools/steps).
- Tools collapsed into one **Tools** details group (like Thinking); closes when model writes again / turn ends.
- `turn_complete` forces scroll to bottom.

## 2026-08-07 — Fix Imagine preview: encoded session paths

- Root cause: `decodeURIComponent` on full path turned  
  `…/sessions/E%3A%5Cprojects%5CGrok-Build/…/images/2.jpg` into invalid  
  `…/sessions/E:\projects\Grok-Build/…` (folder name on disk is encoded).
- Fix: keep path as-is; `mediaPreviewCandidates` also resolves `images/N.jpg` under  
  `~/.grok/sessions/<encoded-workspace>/…/images/`.
- Tests cover encoded session path + relative `images/2.jpg`.

## 2026-08-07 — Fix npm run desktop SyntaxError (JSDoc `**/`)

- `main.cjs` block comment contained `sessions/**/images` — `**/` closed the comment early → `Unexpected identifier 'and'`.
- Reworded comment; desktop loads again.

## 2026-08-07 — Thin app-wide scrollbars at column edges

- Replace Windows default scroll chrome with monochrome thin thumbs (`--scroll-size: 5px` ≈ 1/3 default).
- Chat: timeline is full-width scroller (scrollbar on outer right of conversation); messages stay max-width centered in `.tl-window`.
- Global webkit/Firefox scrollbar styling; hide up/down buttons; stable gutter on main scroll areas.

## 2026-08-07 — Inline preview for Imagine images (~/.grok/sessions)

- Bug: generated images live under `~/.grok/sessions/.../images/` outside workspace → `readFileBase64` sandbox failed → only clickable links, no inline preview.
- Fix: `assertMediaPreviewPath` + IPC `fs:readMediaPreview` allows session/temp media (blocks credentials).
- Client resolve prefers readMediaPreview; better path extract (markdown links, images/, decodeURI).
- CSP: img-src/media-src allow data + https; loading/broken placeholders in timeline.

## 2026-08-07 — Sprint: Imagine slash + media timeline + e2e

- Composer slash menu: `/imagine`, `/imagine-video`, `/settings`, `/usage`, `/marketplace`, `/plugins`.
- Expand imagine prompts for agent (Imagine skill + image_gen / image_to_video pipeline).
- Timeline media strip + markdown images; resolve local paths via readFileBase64.
- User message attachment thumbnails; e2e for slash + media extract.

## 2026-08-07 — Fix microphone permission denied (voice mic)

- Electron had no `setPermissionRequestHandler` → Chromium always denied mic (`not-allowed`).
- Main: allow `media`/`audio` on session; macOS `askForMediaAccess('microphone')`.
- Renderer: `getUserMedia({ audio })` first (triggers OS grant), keep stream while listening.
- On deny: open Windows `ms-settings:privacy-microphone` + clearer VI/EN help.

## 2026-08-07 — Marketplace tab + voice mic on composer

- Tools panel: **Marketplace** tab (catalog from `~/.grok/marketplace-cache`, search, install `--trust`, add/remove/update sources).
- Plugins tab: update / update-all / details; jump to Marketplace.
- Composer: **mic** next to Send uses Web Speech API (STT → prompt). MCP `voice` is TTS-only (`list_voices`), not dictation.
- IPC `plugin:catalog` + `marketplaceCatalog.cjs`.

## 2026-08-07 — Remove sidebar “Connected / Connect” button

- Button only triggered quiet warm-reconnect after live; looked like dead UI when labeled “Đã kết nối”.
- Removed sidebar row; connection status remains header status chip.
- Connect still via auto-connect on open project, first message send, menu Agent → Connect, ⌘K.
- Sidebar nav is only History + Tools (+ New chat).

## 2026-08-07 — Sidebar nav selection + remove left inset bar

- Bug: after Connect, **Đã kết nối** always looked selected even when History/Tools active — `.side-btn.connected` used the same filled background as `.active`.
- Fix: `.connected` is status-only (label + tiny icon dot); selection chrome only via exclusive `.active` / `aria-current`.
- Removed left `box-shadow: inset 2px 0 0` selection bars on sidebar, settings tabs, tools/rtab/history active states.

## 2026-08-07 — Fix update banner JSON BOM under account

- Error under profile: `Unexpected token '﻿', "﻿{ "v"... is not valid JSON`.
- Cause: `dist/latest.json` written with UTF-8 BOM by PowerShell `Set-Content -Encoding UTF8`; bootstrap `checkUpdate` failed and painted message under account name.
- Fix: `readJsonFile` / `stripBom` in main; publish script writes JSON without BOM; strip existing latest.json; quiet launch only shows banner when update available.

## 2026-08-07 — Fix Chat-on-Chat double tab strip

- Root cause: session tabs painted lone **"Chat"** chip, and after Connect agent-slots strip force-showed another **"Chat"** (primary process).
- Session tabs: with 1 conversation only show compact **"+"** (no Chat chip); full tab rail when ≥2 tabs.
- Agent slots: hidden unless ≥2 processes; labels **Primary agent** / **Parallel agent** (never "Chat").
- Align agent-slots max-width with chat column.

## 2026-08-07 — P2 polish (hunks, git, slots UI, @file, auth, updates)

- Review: per-hunk Accept/Reject + Accept all / Reject all (`lib/diffHunks.js`).
- Git strip: short hash, dirty file list tooltip, upstream, Create PR browser link; IPC `git:createPr`.
- Agent slot strip UI (`lib/agentSlotsUi.js`) + command palette spawn parallel.
- Composer `@file` autocomplete (`lib/fileMentions.js`).
- Connect requires signed-in profile (preflight CTA).
- Update check falls back to local `dist/latest.json` when feed URL empty.
- E2E: diffHunks, fileMentions, gitStatus P2.

## 2026-08-07 — P0–P1 platform (docs, modules, AgentSupervisor, e2e)

- Docs synced to **0.5.21** (README, ROADMAP, COMPLETE, STATUS, ARCHITECTURE).
- Extracted main modules: `launchArgs.cjs`, `productPaths.cjs`, `agentSupervisor.cjs`, `ipcContract.cjs`.
- Multi-slot ACP foundation (max 2): IPC `agent:slots` / `spawnSlot` / `setActiveSlot` / `stopSlot`.
- Architecture gate validates preload IPC coverage; e2e covers supervisor + launchArgs + version.
- `docs/DISTRIBUTION.md` — unsigned Windows / SmartScreen notes + release checklist.
- Renderer: `lib/domHelpers.js` shared escapeHtml/basen/stripAnsi.

## 2026-08-06 — Monochrome UI + shared icons + VI/EN

- Palette: black / gray / white only (light & dark); no blue/green/amber accents.
- Single SVG icon set: `renderer/lib/icons.js` (stroke 16×16, currentColor).
- i18n: `renderer/lib/i18n.js` — toggle EN↔VI via sidebar badge button.
- Theme toggle uses sun/moon from same icon set.
- Usage settings: two cards (Session / Plan) with rows + progress bar.
- Code blocks keep mono font; diffs use gray intensity not color.

## 2026-08-06 — Settings: fixed modal size (no tab resize)

- Settings card fixed `height: min(560px, 88vh)`; body fills remaining via flex.
- Panels are absolute + internal scroll so switching tabs no longer resizes the dialog.

## 2026-08-06 — Settings: 2-column tabs layout

- Settings modal: left nav tabs (Environment / Agent / Behavior / Account / Usage), right content panel.
- Usage fetches only when the Usage tab is selected.

## 2026-08-06 — Icon fix: keep white mark + real Windows ICO

- Bug1: bg key wiped **white logo strokes** (treated all white as canvas).
- Fix1: **edge flood-fill only** — outer white canvas transparent; white mark kept.
- Bug2: taskbar still Electron — PNG dump / broken 125-byte ICO.
- Fix2: classic multi-size **BMP-in-ICO** (16…256), valid for rcedit/NSIS; force rcedit.
- Rebuild **0.5.19**. Delete old shortcuts + reinstall.

## 2026-08-06 — Proper logo processing (not raw PNG dump)

- User feedback: raw 3000×3000 PNG made taskbar icon tiny / wrong.
- Pipeline: key near-white → transparent, crop content, square pad ~6%, resize 16…256 + 512.
- Outputs: `logo/processed/*`, `build/icon.png`, multi-size `build/icon.ico`.
- Rebuild **0.5.18**. Delete old Desktop shortcuts before installing.

## 2026-08-06 — Windows icon.ico for taskbar / desktop shortcut

- PNG-only packaging left Electron default icon on .exe / taskbar / Start.
- Generate multi-size `build/icon.ico` (16–256) from `logo/grok-app.png` via System.Drawing.
- `win.icon` + `app.setAppUserModelId` + BrowserWindow `icon`; rebuild **0.5.17**.
- If old icon still shows: delete old shortcuts, reinstall, or clear Windows icon cache.

## 2026-08-06 — Official logo + clean dist rebuild 0.5.16

- Source of truth: `logo/grok-app.png` (black rounded tile + white mark).
- `generate-icon.mjs` copies → `apps/desktop/build/icon.png` (no blue placeholder).
- About modal uses `renderer/assets/logo.png`.
- Cleared all `dist/` version trees; published **0.5.16** portable / setup / zip / update.

## 2026-08-06 — Open IDE: launch app, not folder + install paths

- Bug: `shell.openPath` opened IDE **folder** (source tree) instead of the IDE app.
- Fix: resolve `Grok Build IDE.exe` under default install, spawn with workspace arg.
- Not installed → modal + Download (placeholder URL). Text-only Open IDE button.
- Document defaults: `docs/INSTALL_PATHS.md` + `PRODUCT_PATHS` in main.

## 2026-08-06 — Split Model + Effort chips next to Permission

- Composer toolbar left: Permission | Model | Effort | Mode (if any); right: Send only.
- Model and Effort are separate dropdowns (no combined "Model · High" chip).

## 2026-08-06 — Hide empty Connect sessions from Recent

- Cause: each Connect/auto-connect creates an ACP session shell; `num_chat_messages` can be 3 with only system rows and no title → UI showed UUID like `019fd646-5…`.
- Fix: sessions package sets `messageCount: 0` unless there is a real user title (history / generated_title / summary). Renderer also skips UUID-fallback titles.

## 2026-08-06 — Polished Lucide-style icons

- Replaced crude 16×16 hand paths with Lucide-style 24×24 outline pack (stroke 1.75).
- Better attach (paperclip), send (plane), effort (bolt), model spark, sun/moon, etc.
- Model chip shows effort icon when effort is set; menu sections use icons.

## 2026-08-06 — Light theme contrast + clean EN/VI copy

- Light: hard-coded dark surfaces (`#0a0a0a` terminal, `#222` hovers) caused black-on-black buttons.
- All hover/surface colors use `--hover` / tokens; terminal dock follows theme.
- Primary buttons always `send-bg` + `send-fg` pair.
- i18n rewritten: short consistent labels; VI formal/product tone (no mixed slang).

## 2026-08-06 — Usage: use /billing?format=credits (CLI SuperGrok weekly)

- Bug: Settings used plain `GET /billing` → monthly pool 3566/15000 (~24%), not CLI weekly %.
- CLI/account use `GET /billing?format=credits` → `creditUsagePercent`, `USAGE_PERIOD_TYPE_WEEKLY`, `productUsage` (GrokBuild).
- Fix main `fetchPackageUsage` to call `format=credits`; show SuperGrok weekly limit + Grok Build product %.

## 2026-08-06 — Settings Usage matches TUI `/usage`

- TUI shows **session** tokens/cost/model calls + **plan** Weekly/Monthly limit % and next reset.
- Earlier UI only showed monthly credit cards (wrong shape).
- Now: read latest `updates.jsonl` `params.update.usage` (costUsdTicks/1e10) + `/billing` + `/settings` tier.
- Report text mirrors TUI layout (Input/Output/Total/Model calls/API time/Cost + limit % + Next reset + Credits).

## 2026-08-06 — Settings: Package usage (/usage)

- Settings → **Package usage** shows plan credits (used / limit / remaining / period).
- Source: `GET https://cli-chat-proxy.grok.com/v1/billing` (+ `/user`), same as TUI `/usage`.
- IPC `app:getUsage` keeps auth token in main; renderer gets sanitized numbers only.
- Buttons: Refresh usage, Manage billing → `https://grok.com?_s=usage`.

## 2026-08-06 — Durable portable run

- Problem: single-file `*-portable.exe` re-extracts every launch (slow/fragile).
- Add `scripts/run-portable.ps1` + npm `portable` / `portable:shortcut`.
- Installs zip or `win-unpacked` once to `%LOCALAPPDATA%\Programs\Grok Build`, checks Grok CLI, optional Desktop shortcut.

## 2026-08-06 — agent:connect "Choose a valid project folder first"

- **Symptom:** `Error invoking remote method 'agent:connect': Error: Choose a valid project folder first.`
- **Root cause:** `desktop-state.json` had `workspaceRoot: H:\projects\Grok-Build` (folder gone; project now on `E:\`). Auto-connect called `fs.existsSync` → throw with a vague message. Renderer `connect()` also ignored the resolved path and always sent `workspaceRoot` (stale/null possible).
- **Fix:** bootstrap drops missing workspace/recent paths; connect error names the missing path; renderer connects with the resolved folder; local state pointed at `E:\projects\Grok-Build`.

## 2026-08-06 — Chat disabled after Connect/New + remove expand junk

- After Connect / New session chat went dead: `autoSize()` set inline height that collapsed the box; empty-hero card grid looked like unsolicited expansion.
- Removed textarea `resize: vertical`; autoSize is no-op; fixed 56px min height; unlockChatInput after connect/new/clear/session.
- Empty state reduced to 2 lines (no suggest cards). No more unsolicited chat chrome.

## 2026-08-06 — Fix cannot click/type chat & terminal

- Root cause: `body.resizing * { user-select: none !important }` could stick after splitter drag and block Electron text inputs; hidden `<select class="sr-only">` could intercept clicks.
- Fix: never apply user-select:none to inputs; force-clear resizing on pointerup/blur; sr-only `pointer-events: none`; composer/term z-index + focus helpers; modal.hidden pointer-events none.

## 2026-08-06 — Codex layout + resume + chat input

- **Layout**: main stack = chat + collapsible right panel; **terminal docked bottom** (toggle), not a right tab.
- Toggles: header **Panel** / **Terminal** (Ctrl+P / Ctrl+T); panel × close.
- **Chat input**: composer flex-fixed, textarea pointer-events/user-select, min-height; parent overflow chain fixed so footer not pushed off-screen.
- **Resume**: no silent `newSession` on resume (acp-client); no `clear_conversation` wipe; `paintTranscript` after Open.
- **Model menu**: section “Models / Reasoning effort”; skip duplicate empty “Model” rows.
- Build **0.5.12**.

## 2026-08-06 — Profile footer + 2-col Settings + real auth

- Sidebar bottom: **Login** when signed out; when signed in show **first_name last_name**, menu: email → Settings → Logout.
- Auth from real `~/.grok/auth.json` (no tokens to renderer): `app:getAuthProfile` / `login` / `logout`.
- Login opens OAuth/device URL in browser (5 min); Logout runs `grok logout` + disconnect ACP.
- Settings: 2-column grid (Environment | Agent | Behavior | Account); Save/Check update/Disconnect/Login/Logout wired; IDE path editable.
- Verified profile parse on machine (loggedIn + names from auth.json).

## 2026-08-06 — Functional audit + fix broken CLI hub bindings

- Full functional audit completed before release (OK / PARTIAL / BROKEN checks).
- Verified vs `grok 0.2.118`: `worktree start` does not exist; `plugin … --yes` invalid (`--trust` / no flag).
- Fixes: worktree list/show only; plugin install `--trust`; MCP HTTP official args; login opens device URL + 5min; Open IDE path discovery; GROK_HOME+HOME in env.

## 2026-08-06 — UI: remove composer Stop next to Send

- Stop beside Send was redundant (looked idle/useless when not running).
- Cancel still via **Escape** and menu **Cancel Turn**.

## 2026-08-06 — Fix ACP connect: invalid --permission-mode 'ask'

- Symptom: `error: invalid value 'ask' for '--permission-mode'`; ACP connection closed.
- Cause: UI/main used non-CLI values `ask` / `full`; grok CLI only accepts
  `default | acceptEdits | auto | dontAsk | bypassPermissions | plan`.
- Fix: `normalizePermissionMode()` in main + renderer; map `ask→default`,
  `full→bypassPermissions`; UI options match CLI; layout migration on load.
- Verified against `grok agent --help` / `grok --help`.

## 2026-08-06 — UI: remove sidebar version / grok.exe meta

- Removed bottom sidebar lines `Grok Build x.y.z` + `grok.exe` (`#meta`).
- Version / CLI path remain only in **About**.

## 2026-08-05 — UI: single border-radius token (no 999px pills)

- Removed all `border-radius: 999px` / ad-hoc radii (4–18px).
- One token: `--radius: 8px` on dark + light themes; all chrome uses `var(--radius)`.
- Exception: inner code-card pre stays `0`.

## 2026-08-05 — UI polish 0.5.5: Codex chips, permission, button soft

- Composer dropdowns out of sync: native selects replaced with ghost chips; model/effort/permission persisted in layout and re-applied after `session_config`.
- Permission redesigned Codex-style (icon + label + menu, no elevated select bg): Default / Auto / Plan / Full access…
- Model + Effort combined into one chip (`Model · High`).
- Soften side buttons, pills, Open IDE, send/stop — less chrome, no heavy fills.
- Release **0.5.5**.

## 2026-08-05 — UI polish 0.5.4: right panel scroll, single model, no composer titles

- Right bar (Files/Review/Terminal/CLI) had no vertical scroll when content overflowed → `.rpanel { overflow-y: auto }` + tools `editor-body` flex fix.
- Chat composer showed two model-like dropdowns (Model + always-visible Mode Default) → hide Mode until agent advertises session modes.
- Remove Permission/Model/Effort/Mode title labels above selects; compact toolbar with tooltips only.
- Release **0.5.4** portable / install / update.

## 2026-08-05 — Fix 0.5.3: portable missing @agentclientprotocol/sdk

- Symptom: connect failed with `ERR_MODULE_NOT_FOUND: @agentclientprotocol/sdk` under portable Temp extract path.
- Cause: extraResources only shipped `acp-client/dist` without bundling npm deps; dynamic import could not resolve the SDK.
- Fix: esbuild `packages/acp-client/dist/bundle.mjs` (SDK inlined); main prefers `bundle.mjs` over `index.js`.
- Republish portable / install / update as **0.5.3**.

## 2026-08-05 — Release 0.5.2: portable + install + update channels

- `scripts/publish-release.ps1` orchestrates electron-builder **portable** + **NSIS install** + **hot update** pack
- Layout: `dist/0.5.2/{portable,install,update}` + `MANIFEST.json` + `dist/latest.json`
- Portable: `Grok-Build-0.5.2-win32-x64-portable.exe` (~72 MB) + zip
- Install: `Grok-Build-Setup-0.5.2.exe` (~72 MB)
- Update: `app.asar` + `packages/` + `apply-update.ps1` (replace resources on existing install)
- Rebuild: `npm run release` or `publish-release.ps1 -Version x.y.z`

## 2026-08-05 — Desktop 0.5.1 polish: theme, menu, updates, about

- Light/dark/system theme (`data-theme` + `nativeTheme`) with toggle + Settings
- App menu File/Edit/View/Agent/Help with shortcuts
- Optional update feed check (`latest.json` schema) + banner
- About modal; update URL in settings
- Portable rebuild `Grok-Build-0.5.1-win32-x64-portable.exe`

## 2026-08-05 — Desktop 0.5: feature-complete agent shell

- Full launch flags in Settings: sandbox, tools, denied, worktree, rules, max turns, web search, memory, allow outside, auto-connect, show reasoning
- ACP mode select, usage/token chips, thinking details blocks
- Session Open / Export MD / Delete on history rows
- MCP HTTP/SSE add + enable/disable; plugin install/uninstall/enable/disable
- Shortcuts Ctrl+Enter/N/L/, Escape; drag-drop files/images; auto-connect
- Icon `build/icon.png`; portable `Grok-Build-0.5.0-win32-x64-portable.exe`
- ROADMAP marked complete for v1 agent desktop (`docs/COMPLETE.md`)

## 2026-08-05 — Desktop 0.4: transcript replay, interactive shell, MCP/worktree forms, portable

- **Resume session**: load `chat_history.jsonl` into timeline then ACP resume
- **Interactive shell**: long-lived cmd/bash with stdin (Start shell → type commands)
- **MCP forms**: add stdio server / remove by name via `grok mcp`
- **Worktree forms**: start (named/auto) / remove via `grok worktree`
- **electron-builder** portable: `dist/desktop/Grok-Build-0.4.0-win32-x64-portable.exe` (~72 MB)
  - `signAndEditExecutable: false` to avoid winCodeSign symlink privilege errors on Windows
- Zip fallback: `dist/desktop/Grok-Build-0.4.0-win32-x64.zip`

## 2026-08-05 — Desktop 0.3: terminal, paste image, queue, LCS diff, CLI hub

- ACP **reverse-terminal** host (`terminalHost.cjs`) + `enableTerminal: true`
- UI **Terminal** panel: run shell in workspace cwd, stream output
- **Paste image** → base64 ACP attachment; file pick images also base64
- **Prompt queue** while agent running (auto-drain on turn_complete)
- **LCS line diff** in Review panel
- CLI hub buttons: doctor, login, logout, version, mcp list, worktree list, plugin list
- Version line desktop **0.3** features (package still 0.2.0 monorepo)

## 2026-08-05 — Desktop 0.2: CLI feature pass + Antigravity/Codex UX

- Goal: integrate CLI/ACP features; UI closer to Antigravity + Codex refs in `temp/`.
- Added `@grok-build/sessions` (list `~/.grok/sessions`, runGrokCli).
- Desktop: resizable columns; Projects + Recent chats; markdown assistant; plan dock;
  attach files; Review/Files/CLI side panels; Permission/Model/Effort; doctor/login/logout/version;
  resume session; connect launch flags; native permission dialog.
- Honest gaps remain: terminal reverse-RPC, image base64, MCP/worktree GUI, electron-builder.

## 2026-08-05 — Cleanup dist + ide

- Removed **`dist/1.0.0` + `dist/1.0.1`** (~1.8 GB Code-OSS portables; legacy VS Code era).
- Removed **`ide\` junction** to `grok-build-ide` (IDE is optional external repo only).
- Deleted obsolete scripts: `apply-product-1.0`, `build-1.0`, `build-ide-optional`, `publish-to-product-dist`.
- `dist/` kept as empty placeholder + README for future electron-builder output.
- Open IDE → opens `H:\projects\grok-build-ide` or installed Grok Build IDE if present.

## 2026-08-05 — Monorepo reset: CLI desktop primary

### Problem
VS Code / Code-OSS shell made “Grok Build 1.0” look and feel like VS Code; dual product skins did not deliver Antigravity-class agent desktop.

### Resolution
- Restructured `H:\projects\Grok-Build` as monorepo:
  - `packages/acp-client` — GrokClient + Node FS host (from workbench ACP)
  - `apps/desktop` — Electron agent UI (no VS Code chrome)
  - `ide` junction kept only as **optional** Grok Build IDE
- Removed superseded VS Code-era roadmap material from the active repository tree.
- Primary run: `npm run desktop` / `scripts/dev-desktop.ps1`
- IDE builds moved to `scripts/build-ide-optional.ps1`

### Follow-ups
- Session history UI, Monaco diff, electron-builder portable
- Optionally rewire workbench to import `@grok-build/acp-client`
