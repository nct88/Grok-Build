# Grok Build 1.0 + Grok Build IDE — bộ nội dung đăng mạng xã hội

> **Mục đích:** Tham khảo copy khi đăng Facebook, LinkedIn, X (Twitter), Threads, Discord, Reddit, blog.  
> **Giọng:** Rõ, tự hào có căn cứ kỹ thuật, không “hype rỗng”.  
> **Sự thật cốt lõi (nên giữ):** Trí tuệ agent nằm ở **Grok CLI** chính thức; Desktop & IDE là **surface** do bạn xây trên CLI/ACP — không reinvent agent loop trong Electron.

---

## 1. One-liner (dùng cho bio / caption ngắn)

**VI**

> Grok Build 1.0 — desktop agent & IDE riêng, dựng trên Grok CLI chính thức. Chat, tool, file, terminal, review code — một engine, nhiều surface.

**EN**

> Grok Build 1.0 — a custom agent desktop & IDE built on the official Grok CLI. One intelligence engine. Multiple surfaces.

---

## 2. Elevator pitch (30 giây)

**VI**

Mình không reskin VS Code rồi gắn chatbot.  
Mình dựng **Grok Build** — shell desktop agent mỏng trên **`grok agent stdio` + ACP** — và **Grok Build IDE** (Code-OSS) để mở workspace khi cần editor đầy đủ.

Cùng một CLI, cùng auth `~/.grok`, cùng session.  
Desktop lo chat / tool / review / terminal / manager jobs.  
IDE lo soạn code.  
Agent loop vẫn thuộc Grok CLI — đúng pattern Codex / Claude Code: **CLI là core, UI là surface**.

**EN**

I didn’t reskin VS Code and bolt on a chatbot.  
I built **Grok Build** — a thin agent desktop over official **`grok agent stdio` + ACP** — plus **Grok Build IDE** (Code-OSS) when you need a full editor.

Same CLI. Same `~/.grok` auth. Same sessions.  
Desktop handles chat, tools, review, terminal, headless jobs.  
IDE handles editing.  
The agent loop stays in the Grok CLI — CLI-as-core, UI-as-surface.

---

## 3. Bài dài (Facebook / LinkedIn / blog) — tiếng Việt

### Tiêu đề gợi ý

1. Grok Build 1.0: mình build desktop agent & IDE riêng trên Grok CLI  
2. Không chỉ “chat với AI” — Grok Build là surface agent đầy đủ cho workflow code  
3. Từ CLI đến Desktop + IDE: hành trình build Grok Build 1.0

### Nội dung (copy/paste, chỉnh ảnh & link repo)

---

**Grok Build 1.0** — desktop agent + IDE, dựng trên **Grok CLI** chính thức.

Mình muốn một thứ rõ ràng hơn “mở web chat rồi copy-paste code”:

- Agent **thật sự** làm việc trên folder project  
- Permission / model / mode điều khiển được  
- Diff review, terminal, session, multi-task  
- Và khi cần editor đầy đủ → mở **Grok Build IDE** một click  

### Mình đã xây gì?

#### 1) Grok Build (Agent Desktop)
Shell Electron mỏng. Không nhét VS Code vào monorepo.

**Runtime:** `grok agent stdio` qua **ACP** (Agent Client Protocol).  
Desktop **không** tự chạy model HTTP, **không** tự viết agent loop — CLI lo intelligence; app lo UX.

**Surface chính:**
- Chat stream, thinking, plan, markdown  
- Tool cards + permission  
- Files + Review (accept/reject, hunk-level)  
- Terminal interactive  
- Session tabs, history, export  
- Manager: job headless (`grok -p`), artifacts, worktree  
- MCP / plugins (form bám flag CLI)  
- Theme sáng/tối, i18n EN/VI  
- Usage / plan limit (cùng nguồn billing CLI)  
- Multi-slot agent foundation (primary + parallel)  
- Open IDE → deep-link workspace  

#### 2) Grok Build IDE
IDE riêng (Code-OSS product), cài song song:

- `%LOCALAPPDATA%\Programs\Grok Build IDE\`  
- Desktop resolve path + mở project hiện tại  

Agent desktop và IDE **bổ sung** nhau — không gộp thành một monolit khó bảo trì.

### Vì sao kiến trúc này quan trọng?

Nhiều tool AI code 2025–2026 đi theo mô hình:

```text
UI surface  →  protocol  →  CLI / agent core  →  FS · shell · auth · sessions
```

Codex, Claude Code, Grok CLI đều nghiêng về **một core thông minh + nhiều surface**.  
Grok Build chọn đúng hướng đó từ đầu:

```text
Grok Build Desktop (Electron)
    → AgentSupervisor
        → acp-client (GrokClient)
            → grok agent stdio   ← owns the agent loop
                → ~/.grok (auth, sessions, skills…)
```

**Hệ quả:**
- Update model/tool/skill ở CLI → desktop hưởng lợi  
- Bảo mật: renderer không spawn process / không gọi API model  
- Session & login thống nhất với TUI  

### Ai nên dùng?

- Dev muốn **agent desktop** mượt hơn TUI, vẫn bám Grok CLI  
- Ai cần **review diff + terminal + session** trong một cửa sổ  
- Ai muốn **IDE riêng** khi code nặng, không ép mọi thứ vào chat  

### Cài nhanh (Windows)

1. Cài / login **Grok CLI** (`grok login`)  
2. Cài **Grok Build** (NSIS setup hoặc portable zip)  
3. (Tuỳ chọn) cài **Grok Build IDE**  
4. Mở folder project → Connect → chat  

> Build Windows hiện có thể **chưa code-sign** → SmartScreen cảnh báo lần đầu là expected (More info → Run anyway).

### Thông điệp cuối

Mình không cố “clone ChatGPT Desktop”.  
Mình build **control surface** cho agent coding trên Grok — minh bạch, tách lớp, mở rộng được.

**Grok Build 1.0** = Desktop agent + IDE option + CLI core.  
Một engine. Nhiều cửa sổ. Workflow của dev.

🔗 Repo / release: `[điền link GitHub]`  
📦 Download: `[điền link release / portable]`  
🧵 Thread kỹ thuật: `[nếu có]`

#GrokBuild #GrokCLI #AICoding #DevTools #Electron #ACP #OpenSource

---

## 4. Bài dài — English (LinkedIn / X long / Reddit)

### Title ideas

- Grok Build 1.0: agent desktop + IDE on the official Grok CLI  
- CLI-as-core, UI-as-surface — how I shipped Grok Build  
- Not a VS Code reskin: building an agent surface the right way  

### Body

---

**Grok Build 1.0** is a custom **agent desktop** and optional **IDE**, built on the official **Grok CLI** — not a chatbot glued onto a code editor.

### What it is

**Grok Build (Desktop)**  
A thin Electron shell over `grok agent stdio` via **ACP**.  
The agent loop, tools, auth, and sessions live in the CLI (`~/.grok`). The desktop is a product-quality surface: streaming chat, permissions, file review (including hunks), terminal, session tabs, headless Manager jobs, MCP/plugin forms, EN/VI, light/dark, usage, and multi-slot foundations.

**Grok Build IDE**  
A separate Code-OSS install for full editing. Desktop can open the current workspace with one click. Two products, one ecosystem — no bloated monorepo with a full IDE tree inside the agent app.

### Why this architecture

Modern agent tools (Codex, Claude Code, Grok) converge on:

```text
Surface → Protocol → Agent core (CLI) → Host (FS, shell, auth)
```

So Grok Build never reimplements intelligence in Electron:

```text
Desktop → AgentSupervisor → acp-client → grok agent stdio → ~/.grok
```

You get CLI upgrades for free, a security boundary (renderer doesn’t spawn agents or call model HTTP), and the same login/sessions as the TUI.

### Who it’s for

Developers who want a dedicated Grok agent workspace — chat + tools + review + terminal — with an optional full IDE when editing gets heavy.

### Status note

Desktop is **feature-complete for the v1 product surface**. Windows builds may be **unsigned** (SmartScreen on first run). Requires Grok CLI on PATH / configured path.

🔗 GitHub: `[link]`  
📦 Releases: `[link]`

#GrokBuild #Grok #AICoding #DeveloperTools #Electron #ACP

---

## 5. Thread X / Twitter (VI) — 8–10 tweets

**1/**  
Mình ship **Grok Build 1.0**: desktop agent + IDE riêng, dựng trên **Grok CLI** chính thức — không reskin VS Code, không nhét agent loop vào Electron.

**2/**  
Kiến trúc:

```
Desktop (Electron)
  → ACP client
    → grok agent stdio
      → ~/.grok
```

CLI = brain. UI = hands & eyes.

**3/**  
Desktop có gì: stream chat, thinking/plan, tool + permission cards, files, **diff review (cả hunk)**, terminal, session tabs, Manager jobs (`grok -p`), MCP/plugins, EN/VI, light/dark, usage.

**4/**  
**Grok Build IDE** = Code-OSS product cài riêng. Cần editor nặng → Open IDE từ desktop, mở đúng workspace. Agent app không phình thành IDE monolit.

**5/**  
Sao không “chat trong VS Code là đủ”?  
Mình muốn **control surface** cho agent: queue prompt, multi-session, review an toàn, job headless, deep-link IDE khi cần — giống hướng Codex/Antigravity nhưng bám Grok CLI.

**6/**  
Security boundary cứng:
- Renderer không spawn process model  
- Workspace FS sandbox  
- External URL http(s) only  
- CLI allowlist  

Agent vẫn là process `grok` bạn tin cậy.

**7/**  
Windows: NSIS setup + portable zip + hot-update asar.  
Unsigned → SmartScreen lần đầu (expected). Login bằng `grok login` như TUI.

**8/**  
Nếu bạn đang dùng Grok CLI và muốn “cửa sổ sản phẩm” thay vì chỉ terminal — đây là surface mình build.

Repo / download: `[link]`  
#GrokBuild #AICoding

**9/ (optional CTA)**  
Feedback welcome: UX, install path, IDE handoff, usage panel. Mình iterate trên chính Grok Build.

---

## 6. Thread X — English (short)

**1/** Shipping **Grok Build 1.0**: agent desktop + optional IDE, built on the official **Grok CLI** (`grok agent stdio` + ACP). CLI owns the brain. UI owns the surface.

**2/** Desktop: streaming chat, tools/permissions, file review (hunks), terminal, sessions, headless jobs, MCP forms, EN/VI, usage. IDE: separate Code-OSS install, one-click from desktop.

**3/** No VS Code tree inside the agent monorepo. No reimplemented agent loop in Electron. Same `~/.grok` auth/sessions as the TUI.

**4/** Pattern: Surface → ACP → CLI core. Same industry shape as Codex/Claude Code-style stacks — applied to Grok.

**5/** Requires Grok CLI. Windows builds may be unsigned (SmartScreen). Links: `[repo]` `[release]`

---

## 7. Caption ngắn (Instagram / Threads / Facebook status)

**VI — 500 ký tự**

Grok Build 1.0 🚀  
Desktop agent + IDE, build trên Grok CLI thật (ACP), không reskin VS Code.  
Chat · tool · review diff · terminal · session · job headless · Open IDE.  
Một engine. Nhiều surface.  
Link: `[…]`  
#GrokBuild #AICoding #DevTools

**EN**

Grok Build 1.0 — agent desktop & IDE on the official Grok CLI.  
Chat, tools, review, terminal, sessions, headless jobs — CLI-as-core.  
`[link]`

---

## 8. Discord / community announcement

```text
**Grok Build 1.0** is up for testers / early adopters.

What:
• **Grok Build** — Electron agent desktop over official `grok agent stdio` (ACP)
• **Grok Build IDE** — optional Code-OSS shell; open workspace from desktop

Not:
• Not a VS Code fork inside the agent repo
• Not a reimplemented model loop in Electron

Need:
• Grok CLI installed + `grok login`
• Windows x64 for current packages

Download: <release url>
Issues / feedback: <github issues>
Docs: README + docs/ARCHITECTURE.md
```

---

## 9. Reddit-style (r/LocalLLaMA, r/programming, r/chatgpt… chỉnh sub)

**Title:** I built Grok Build 1.0 — agent desktop + IDE surface on the official Grok CLI (ACP)

**Body sketch:**

- Problem: TUI is powerful but I wanted a product surface (review, sessions, jobs, IDE handoff).  
- Approach: Electron thin client → ACP → `grok agent stdio`; IDE is separate install.  
- Features: [bullet list from section 3].  
- Honest limits: needs Grok CLI/account; Windows packages may be unsigned; not a full cloud multi-agent suite.  
- Links + “happy to answer architecture questions”.

---

## 10. Gợi ý visual (kèm post)

| # | Ảnh / clip | Nội dung |
|---|------------|----------|
| 1 | Hero | Logo Grok Build + tagline “CLI core · Desktop surface · Optional IDE” |
| 2 | Architecture | Sơ đồ 3 lớp (Desktop → ACP → CLI) |
| 3 | Chat stream | Tool cards + thinking + final answer |
| 4 | Review | Diff accept/reject / hunk |
| 5 | Settings Usage | Plan limit bar (light + dark) |
| 6 | Open IDE | Desktop → IDE cùng workspace |
| 7 | Install | Setup / portable / `npm run portable` |

**Alt text mẫu:** “Grok Build desktop showing agent chat with tool cards and file review panel.”

---

## 11. Hashtag & tagging

**VI/EN chung:**  
`#GrokBuild` `#Grok` `#GrokCLI` `#AICoding` `#AgenticCoding` `#DevTools` `#Electron` `#ACP` `#OpenSource` `#IndieHackers`

**Tag (nếu phù hợp, không spam):** xAI / Grok ecosystem accounts, devtool communities.

---

## 12. Checklist trước khi đăng

- [ ] Link GitHub + Release đúng  
- [ ] Screenshot bản **0.5.23+** / **1.0** (usage bar, review, theme)  
- [ ] Ghi rõ **cần Grok CLI**  
- [ ] Ghi rõ SmartScreen nếu build unsigned  
- [ ] Không claim “thay thế VS Code” — IDE là **optional companion**  
- [ ] Không claim tự host model nếu vẫn dùng Grok cloud account  

---

## 13. Câu trả lời comment thường gặp

| Câu hỏi | Trả lời gọn |
|---------|-------------|
| Khác Grok web/TUI? | Desktop là surface product: review, terminal, sessions, jobs, IDE handoff — cùng CLI core. |
| Có offline local model? | Phụ thuộc Grok CLI / account; app không embed model riêng. |
| Open source? | `[điền license + repo visibility]` |
| macOS / Linux? | Windows ship trước; multi-OS roadmap nếu public. |
| Có ăn cắp code VS Code? | Desktop **không** nhúng Code-OSS. IDE (nếu ship) là product Code-OSS **tách repo**, optional. |
| An toàn? | Renderer sandbox + CLI allowlist; agent vẫn process `grok` user đã cài. |

---

*File này chỉ là copy tham khảo — chỉnh tên version, link, license cho khớp release thật trước khi public.*
