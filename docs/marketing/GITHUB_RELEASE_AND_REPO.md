# GitHub — README companion, About, Release notes

Dùng file này khi **cập nhật repo GitHub** (About, Topics, Release 1.0, Issues templates).  
README chính của repo: [`../../README.md`](../../README.md).

---

## 1. GitHub About (sidebar)

**Description (≤ 350 chars):**

```text
Grok Build — agent desktop over official Grok CLI (ACP). Optional Grok Build IDE. Chat, tools, review, terminal, sessions, headless jobs. CLI-as-core, UI-as-surface.
```

**VI (nếu dùng description song ngữ ở website):**

```text
Grok Build — desktop agent trên Grok CLI (ACP) + IDE tuỳ chọn. Chat, tool, review, terminal, session, job headless.
```

**Website:** `[landing hoặc docs URL — optional]`  
**Topics (labels):**

```text
grok
grok-cli
ai-coding
agent
electron
acp
developer-tools
desktop-app
code-review
typescript
```

---

## 2. Release title & tag

| Field | Suggestion |
|-------|------------|
| Tag | `v1.0.0` *(hoặc `v0.5.23` nếu chưa bump semver marketing)* |
| Title | `Grok Build 1.0.0 — Agent Desktop` |
| Target | Windows x64 (NSIS + portable) |

> **Lưu ý version:** Monorepo có thể đang ở `0.5.x` feature-complete v1. Khi public “1.0”, nên **bump** `product/VERSION` + package.json + publish, **hoặc** ghi rõ “Product family 1.0 / desktop build 0.5.x”. Đừng trộn hai con số trên GitHub title.

---

## 3. GitHub Release body (copy)

### Option A — tag `v1.0.0` (marketing 1.0)

```markdown
# Grok Build 1.0.0

Agent **desktop** built on the official **Grok CLI** (`grok agent stdio` + ACP).  
Not a VS Code reskin. Optional **Grok Build IDE** is a separate install.

## Highlights

- Streaming chat, thinking / plan, markdown
- Tool cards + permission controls
- Files + Review (accept / reject, hunk-level)
- Interactive terminal
- Session tabs, history, export
- Manager: headless jobs (`grok -p`), artifacts, worktree UI
- MCP / plugins forms aligned with CLI flags
- Theme light / dark / system · i18n EN / VI
- Usage / plan limit (same billing source as CLI `/usage`)
- Multi-slot agent foundation (primary + parallel)
- Open IDE deep-link to current workspace
- Portable + NSIS + hot-update channel

## Architecture

```text
Desktop (Electron)
  → AgentSupervisor
    → @grok-build/acp-client
      → grok agent stdio   ← owns agent loop
        → ~/.grok auth & sessions
```

## Requirements

- Windows x64
- [Grok CLI](https://grok.com) installed (`grok` on PATH, `~/.grok\bin\grok.exe`, or `GROK_EXECUTABLE`)
- `grok login` (or equivalent auth)

## Downloads

| Channel | File |
|---------|------|
| **Installer (NSIS)** | `Grok-Build-Setup-1.0.0.exe` |
| **Portable (single exe)** | `Grok-Build-1.0.0-win32-x64-portable.exe` |
| **Portable (zip, recommended)** | `Grok-Build-1.0.0-win32-x64.zip` |
| **Hot update** | `update/` + `apply-update.ps1` |

> **SmartScreen:** builds may be **unsigned**. First run: *More info → Run anyway*. See `docs/DISTRIBUTION.md`.

## Install tips

```powershell
# From a checkout after placing artifacts under dist\
npm run portable
npm run portable:shortcut
```

Or run the NSIS setup and launch **Grok Build** from Start Menu.

## Optional: Grok Build IDE

Separate Code-OSS product (not in this monorepo tree).  
Default path: `%LOCALAPPDATA%\Programs\Grok Build IDE\Grok Build IDE.exe`  
From desktop: **Open IDE** (passes current workspace).

## Verify (developers)

```powershell
npm install
npm run check
```

## What’s next

- Hosted update CDN + optional Authenticode signing
- Broader OS targets if demand
- Further renderer modularization / UI smoke tests

## Links

- Architecture: `docs/ARCHITECTURE.md`
- Distribution: `docs/DISTRIBUTION.md`
- Install paths: `docs/INSTALL_PATHS.md`
```

### Option B — tag matches ship (`v0.5.23`) but title mentions product 1.0

```markdown
# Grok Build Desktop 0.5.23 (Product surface v1)

Feature-complete **v1 agent desktop** on Grok CLI / ACP.  
See README for architecture. Artifacts under `dist/0.5.23/`.

[... reuse Highlights + Requirements from Option A, fix filenames to 0.5.23 ...]
```

---

## 4. Repo root files GitHub expects

| File | Status in this monorepo |
|------|-------------------------|
| `README.md` | Updated for public landing |
| `LICENSE` | **Add if missing** before public open-source claim |
| `SECURITY.md` | Optional; point to security review + how to report |
| `CONTRIBUTING.md` | Optional for early public |
| `.github/ISSUE_TEMPLATE` | Optional |
| `docs/` | Keep architecture + distribution |

---

## 5. First commit / push checklist (public)

1. [ ] Remove or gitignore secrets (`auth.json`, local paths with personal data in docs if any)  
2. [ ] `dist/` — usually **do not** commit large exes; attach on **Releases**  
3. [ ] Scrub absolute paths (`E:\projects\...`, `H:\projects\...`) from public docs where possible  
4. [ ] Set `ideDownloadUrl` / Download IDE link when release exists  
5. [ ] LICENSE chosen (MIT / Apache-2.0 / proprietary)  
6. [ ] README badges optional (build, license, release)  
7. [ ] Create Release with binaries from `dist/<ver>/`  
8. [ ] Pin About description + topics  

---

## 6. Short “What’s Grok Build?” for Discussions / Wiki

**Grok Build** is a Windows-first **agent desktop** for the official Grok CLI. It speaks **ACP** to `grok agent stdio`, so the model/tool loop stays in the CLI while the app provides chat, review, terminal, sessions, and job management. **Grok Build IDE** is an optional companion editor (Code-OSS), opened from the desktop with the current project.

---

## 7. Suggested GitHub labels

```text
bug
enhancement
documentation
packaging
security
ide
acp
windows
good first issue
```

---

## 8. Sample `gh` commands

```powershell
# Create release (after bumping to 1.0.0 and building)
gh release create v1.0.0 `
  --title "Grok Build 1.0.0 — Agent Desktop" `
  --notes-file docs/marketing/release-notes-1.0.md `
  "dist/1.0.0/install/Grok-Build-Setup-1.0.0.exe" `
  "dist/1.0.0/portable/Grok-Build-1.0.0-win32-x64.zip" `
  "dist/1.0.0/portable/Grok-Build-1.0.0-win32-x64-portable.exe"
```

*(Tạo `release-notes-1.0.md` bằng cách copy Option A ở trên nếu cần file tách.)*

---

*Cập nhật link download IDE và license trước khi public rộng.*
