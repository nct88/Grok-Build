# Grok Build Desktop — Functional Audit

**Date:** 2026-08-06  
**CLI under test:** `grok 0.2.118`  
**App package:** 0.5.9+ (audit of source + live CLI probes)  
**Method:** Static IPC/UI map + `grok --help` / subcommand help + non-interactive spawn probes.  
**Not a substitute for full E2E in Electron UI** — items marked *needs UI E2E* require manual click-through after fixes.

Legend: **OK** = wired + CLI shape valid · **PARTIAL** = works with caveats · **BROKEN** = fails against current CLI/UI · **DEAD** = present but not useful

---

## 1. Core agent (ACP)

| Feature | Status | Evidence | Fix path |
|---------|--------|----------|----------|
| Connect (`agent:connect` → `grok … agent stdio`) | **PARTIAL** | Args order `grok [flags] agent stdio` is correct. Permission map fixed 0.5.8 (`ask`→`default`). Auth requires prior `grok login`. | Keep normalizePermissionMode; surface stderr on fail; block connect if unauthenticated with clear CTA |
| Disconnect | **OK** | IPC + `client.stop()` | — |
| Prompt / streaming deltas | **OK** (code) | `agent:prompt`, events `assistant_delta` / `thought_delta` | UI E2E after connect |
| Cancel turn | **OK** | Menu Escape + `agent:cancel` (composer Stop removed 0.5.9) | Optional: show Stop only while `busy` |
| New session | **OK** (code) | `agent:newSession` ACP | Needs connected |
| Model / effort config | **PARTIAL** | Filled from `session_config`; layout persist; chip UI | If agent omits options, chip stays placeholder |
| Agent mode chip | **PARTIAL** | Hidden until `session_modes` | OK by design |
| Permission modes | **PARTIAL** | CLI values aligned 0.5.8. Native dialog on tool perm. Chat only logs step (no in-chat buttons) | Optional in-chat approve UI |
| Permission `plan` / `acceptEdits` auto-rules | **PARTIAL** | Heuristic kind matching for acceptEdits | Validate against real tool kinds |
| Plan dock | **OK** (code) | `plan` event → `#planDock` | UI E2E |
| Usage chip | **OK** (code) | `usage` / `token_usage` | Depends on agent events |
| Queue when busy | **OK** (code) | `promptQueue` + bar | UI E2E |
| Attach files / paste image | **PARTIAL** | pickFiles + base64 path; Electron File.path on drop | Web File without path may skip non-image |
| Resume session (`--resume` + loadSession) | **PARTIAL** | loadSession may fail if agent lacks capability; catch continues | Show whether load vs resume-only |
| Session list / history | **OK** (code) | `listLocalSessions` under GROK_HOME | Needs HOME/GROK_HOME (app sets GROK_HOME) |
| Export / delete session | **OK** (code) | IPC handlers present | UI E2E |
| Transcript load into chat | **PARTIAL** | `readTranscript` on open | Format may be lossy |

---

## 2. Left sidebar / shell chrome

| Feature | Status | Evidence | Fix path |
|---------|--------|----------|----------|
| New Conversation | **OK** (code) | newSession + clear timeline | — |
| Conversation History | **OK** (code) | refreshHistory list | — |
| Connect button | **OK** | same as agent connect | — |
| Tools → CLI panel | **OK** navigation | switchPanel tools | Content of CLI mostly power-user / broken (see §4) |
| Projects / open folder | **OK** | pickWorkspace + state | — |
| Theme | **OK** | setTheme + localStorage layout | — |
| Settings modal | **OK** (code) | saveSettings persist state | Several CLI flags only apply next connect |
| About | **OK** | version/paths | — |
| Update check | **PARTIAL** | Needs feed URL; else “not configured” | Ship default feed or hide until set |
| Sidebar version/meta | **REMOVED** | 0.5.7 | Intentional |
| Open IDE | **BROKEN** (product) | **Hardcoded** `H:\projects\grok-build-ide` in app.js + menu | Resolve from settings / common install paths / hide if missing |
| Splitters resize | **OK** | pointer drag + layout save | — |
| Drag-drop onto composer | **PARTIAL** | images + path files | — |

---

## 3. Right panel

### 3.1 Files

| Feature | Status | Evidence | Fix path |
|---------|--------|----------|----------|
| List workspace root | **OK** | `fs:listDir` | Hidden dotfiles; 200 cap |
| Preview text file | **OK** | `fs:readText` 2MB cap | Binary/large = truncated message |
| Open on agent edit | **OK** (code) | workspace_edit → openInEditor | — |

### 3.2 Review

| Feature | Status | Evidence | Fix path |
|---------|--------|----------|----------|
| Collect diffs | **OK** (code) | tool_update / workspace_edit | — |
| Diff preview | **OK** (code) | showDiff | Line-level only, not full LCS UI polish |

### 3.3 Terminal

| Feature | Status | Evidence | Fix path |
|---------|--------|----------|----------|
| Start interactive shell | **OK** (code) | `term:startShell` + InteractiveShell | — |
| Send line / Stop | **OK** (code) | writeShell / stopShell | — |
| One-shot `term:run` fallback | **OK** (code) | if shell not started | — |
| ACP reverse terminal (agent tools) | **OK** (code) | TerminalHost merged into ACP host | Needs connected agent + tool |

### 3.4 CLI hub (why “show everything”)

Built for **CLI parity dump**, not daily UX. Most users only need Files/Review/Terminal + Connect.

| Button / form | Status | Evidence (grok 0.2.118) | Fix path |
|---------------|--------|-------------------------|----------|
| Doctor | **OK** | `grok doctor` works | — |
| Login | **BROKEN** in-app | Non-interactive hang: prints device URL, waits auth; `stdio: ignore`, 60s kill | Special-case: parse URL → `openExternal`, long timeout; or CTA “run `grok login` in terminal” |
| Logout | **OK** | `grok logout` non-interactive | Confirm dialog before wipe |
| Version | **OK** | `grok --version` via `data-cli="--version"` | — |
| MCP list | **OK** | `grok mcp list` | Ensure GROK_HOME in env (app sets it) |
| MCP add stdio | **OK** shape | Matches `grok mcp add name -- cmd…` examples | — |
| MCP add HTTP/SSE | **PARTIAL** | CLI wants `mcp add --transport http NAME URL`; app used `--url` (accidentally worked once) | Use official shape |
| MCP remove/enable/disable | **OK** | subcommands exist | — |
| Worktree list | **OK** | `grok worktree list` | — |
| **Worktree start** | **BROKEN** | **`start` is not a subcommand** (only list/show/rm/gc/db). Worktree create is top-level `-w/--worktree` on session | Remove Start; document Settings “Worktree launch”; optional connect with `--worktree` |
| Worktree rm | **OK** shape | `worktree rm <IDS>` | Pass ids not free text only |
| Plugin list | **OK** | `plugin list` | — |
| **Plugin install `--yes`** | **BROKEN** | `unexpected argument '--yes'`; flag is **`--trust`** | Replace `--yes` → `--trust` |
| **Plugin uninstall `--yes`** | **BROKEN** | same | Drop `--yes` |
| Plugin enable/disable | **OK** | flags match | — |

---

## 4. Login / Logout (product meaning)

| | Login | Logout |
|--|-------|--------|
| **Purpose** | Authenticate Grok CLI to xAI (OAuth / device code). Credentials under `~/.grok`. | Clear cached credentials. |
| **Not** | Not “app account UI”; not ACP Connect itself. | Not disconnect ACP only. |
| **In app today** | Effectively **non-functional** (waits browser confirm, no stdin, short timeout). | **Works** if user accepts wiping auth. |
| **Recommended UX** | Primary: detect unauthenticated on connect → button “Sign in” opens device flow properly. Secondary: docs “run `grok login`”. | Confirm + run `grok logout` + status. |

---

## 5. Packaging / runtime

| Feature | Status | Notes |
|---------|--------|-------|
| Portable / install / update channels | **OK** pipeline | `publish-release.ps1` |
| ACP SDK in portable | **OK** since 0.5.3 | `bundle.mjs` |
| Auto-connect last project | **OK** (code) | settings flag |
| Native menu | **OK** | Open IDE path still wrong |

---

## 6. Priority fix backlog

1. **P0** — Plugin flags (`--trust` / drop `--yes`); Worktree Start remove or rewire to `--worktree` on connect.  
2. **P0** — Login: device-code open browser + long wait, or honest “not supported in-app”.  
3. **P1** — Open IDE: configurable path / detect install / hide.  
4. **P1** — MCP HTTP args to official CLI shape.  
5. **P2** — CLI panel: collapse advanced forms; default tabs Files/Review/Terminal only.  
6. **P2** — Permission UI in chat; busy-only Stop.  
7. **P2** — Update feed default; auth preflight on connect.

---

## 7. What actually works for a normal user path

1. Install/portable with `grok` on machine and **already logged in** (`grok login` once in terminal).  
2. Open project → Connect (permission Default / Full access).  
3. Chat, attachments, Review diffs, Files preview, Terminal.  
4. History resume/export.  
5. Doctor / Version / MCP list in CLI tab.  

**Do not rely on:** in-app Login, Worktree Start, Plugin Install/Uninstall (pre-fix), Open IDE hardcode, Update without feed URL.
