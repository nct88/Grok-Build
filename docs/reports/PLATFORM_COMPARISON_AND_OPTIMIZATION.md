# Báo cáo nghiên cứu: Nền tảng mã nguồn & chiến lược tối ưu Grok Build

**Ngày:** 2026-08-06  
**Phạm vi:** So sánh **Grok Build** · **OpenAI Codex** · **Anthropic Claude Code** · **Google Antigravity**  
**Mục tiêu:** Làm rõ mô hình “CLI core + UI shell”, cách mỗi sản phẩm xử lý mã nguồn/agent, và đề xuất lộ trình tối ưu UI + hiệu năng cho Grok Build Desktop.

> **Phương pháp:** Đối chiếu mã nguồn monorepo Grok Build (`apps/desktop`, `packages/acp-client`), tài liệu kiến trúc nội bộ, reverse-engineering/public architecture (Codex App Server, Claude agent loop, Google Antigravity blog), và chuẩn mở ACP/MCP.  
> **Lưu ý:** Codex / Claude / Antigravity là sản phẩm đóng/phân tầng; kết luận dựa trên tài liệu công khai và pattern quan sát được, không phải full source dump nội bộ.

---

## 1. Câu trả lời ngắn (executive summary)

### 1.1 Có “lấy từ CLI để build giao diện riêng” không?

| Sản phẩm | Mô hình cốt lõi | UI / surface |
|----------|-----------------|--------------|
| **Grok Build Desktop** | **CLI-as-backend** qua `grok agent stdio` + **ACP** | Electron thin shell (chat, files, terminal, settings) |
| **OpenAI Codex** | **CLI / App Server (Rust) as backend** — cùng binary `codex` cho CLI, IDE, desktop, web | Electron app “command center”; VS Code ext; CLI TUI |
| **Claude Code** | **Một agent loop thống nhất** (`queryLoop`) — CLI interactive, headless `-p`, SDK, IDE/Desktop | TUI (Ink), Desktop app, IDE plugins — **cùng engine** |
| **Google Antigravity** | **IDE-first / agent platform** — fork VS Code (modified) + Agent Manager + Gemini | Editor View + Manager Surface; không phải “thin wrapper CLI thuần” |

**Kết luận chính:**

1. **Đúng với Grok Build, Codex, Claude:** trí tuệ agent (tool loop, filesystem, shell, model I/O, permission, session) sống ở **core/CLI (hoặc app-server process)**; desktop/IDE **không re-implement** agent — chúng là **surface** (render + orchestration UI + IPC host).
2. **Antigravity khác một nấc:** đây là **agentic IDE platform** (editor + terminal + browser + multi-agent manager), nền tảng là **Code-OSS / VS Code fork**, không chỉ “giao diện bọc CLI”.
3. **Grok Build Desktop** đã chọn đúng pattern công nghiệp 2025–2026:  
   `Electron UI → packages/acp-client (GrokClient) → grok agent stdio → ~/.grok sessions/auth`  
   Roadmap nội bộ cũng ghi UX reference: **Antigravity + Codex**.

### 1.2 “Xử lý mã nguồn” nghĩa là gì trong các tool này?

Không phải “compile source của user thành binary product”, mà là **pipeline agentic** trên codebase user:

```text
User intent
  → Context assembly (files, git, memory, AGENTS.md / rules)
  → Model plan / tool calls
  → Host actions (read/write, shell, browser, MCP)
  → Observe (stdout, diffs, screenshots, artifacts)
  → Compact / memory → next turn
```

Mỗi sản phẩm tối ưu **nơi** chạy loop đó và **cách** surface hiển thị kết quả.

---

## 2. Kiến trúc so sánh chi tiết

### 2.1 Sơ đồ lớp (layer model)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  SURFACE LAYER (UI — khác nhau mạnh giữa các tool)                        │
│  Terminal TUI │ Desktop Electron │ IDE panel │ Web │ Manager multi-agent  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │  Protocol (ACP / App-Server / SDK / IPC)
┌───────────────────────────────▼─────────────────────────────────────────┐
│  AGENT CORE (logic chung — CLI / App Server / queryLoop)                 │
│  Session · Prompt · Tools · Permissions · Compaction · MCP · Skills      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │  Host capabilities
┌───────────────────────────────▼─────────────────────────────────────────┐
│  HOST / RUNTIME                                                          │
│  FS · Shell/PTY · Git · Browser · Sandbox · Keychain · Telemetry         │
└─────────────────────────────────────────────────────────────────────────┘
```

| Lớp | Grok Build | Codex | Claude Code | Antigravity |
|-----|------------|-------|-------------|-------------|
| Surface | Electron thin shell | Electron + CLI + IDE + Web | TUI + Desktop + IDE + SDK | Editor + Manager (VS Code fork) |
| Bridge | **ACP JSON-RPC stdio** | **App Server** (stdio/WS/HTTP+SSE) | **Cùng queryLoop**; IDE/SDK adapters | IDE host + agent runtime (Gemini) |
| Core | Official `grok` CLI | Rust `codex` binary | Claude Code engine | Antigravity agents + Gemini 3 |
| Host FS | Node host trong acp-client + Electron | Rust + Node main | CLI process + hooks | IDE FS + terminal + browser |
| Multi-agent | Single session (hiện tại) | Multi-thread / parallel agents (app) | Subagents / parallel in product | **Manager Surface** (core product) |
| Protocol mở | **ACP** first-class | App Server (+ ACP-compatible surfaces) | ACP adapters tồn tại trong ecosystem | Platform riêng; multi-model |

### 2.2 Grok Build (monorepo này)

**Nguồn sự thật (source of truth):**

| Thành phần | Vai trò |
|------------|---------|
| `grok` CLI (official, ngoài repo) | Agent intelligence, auth SuperGrok, tools, sessions `~/.grok` |
| `packages/acp-client` | Spawn `grok … agent stdio`, parse ACP events, Node FS host |
| `packages/sessions` | Đọc/liệt kê session local |
| `apps/desktop` | Electron main/preload/renderer — **chỉ shell UX** |

```text
apps/desktop (Electron)
    → packages/acp-client (GrokClient)
        → grok agent stdio (official CLI)
            → ~/.grok sessions / auth / models
```

**Hệ quả kiến trúc (quan trọng cho tối ưu):**

- Desktop **không** chứa tạo agent loop → mỗi cải tiến CLI (model, tools, compaction) tự “lan” vào Desktop.
- Hiệu năng agent ≈ hiệu năng **CLI + model + I/O host**, không phải React/CSS.
- UI chỉ tối ưu **latency cảm nhận**: streaming render, permission UX, session list, diff review, terminal, queue.
- Product boundary rõ (Agents.md): **không** nhét Code-OSS vào repo này; IDE full-stack nằm tree riêng (`grok-build-ide`).

### 2.3 OpenAI Codex — “CLI-as-backend” hoàn chỉnh

Pattern đã reverse-engineer công khai (Codex desktop):

```text
Renderer (React)  ──IPC──►  Electron Main (Node)
                               │
                               │ spawn / WS
                               ▼
                         codex app-server (Rust CLI binary)
                               │
                               ▼
                         OpenAI API + local tools (git, PTY, MCP, SQLite)
```

**Điểm thiết kế đáng học:**

1. **Cùng core cho mọi surface** — CLI, desktop, VS Code, web dùng App Server.
2. **Renderer “dumb”** — business logic ở main + Rust; UI chỉ invoke RPC (~70 IPC methods: git, automation, files, skills…).
3. **Git-native context** — worktree snapshot, PR workflow, merge-base; không chỉ “mở folder”.
4. **Persistence tách tầng** — SQLite UI (Node) vs conversation (Rust) để tránh lock.
5. **Automation/cron local** — inbox + scheduled agents (gần “Manager Surface” của Antigravity).
6. **Electron vẫn chấp nhận** — tradeoff ship nhanh đa nền tảng (macOS/Windows).

**Khác Grok Build hiện tại:** Codex đầu tư sâu **App Server protocol riêng + git platform + automation DB**; Grok Build lean hơn, dựa **ACP stdio** + thin shell.

### 2.4 Anthropic Claude Code — “one loop, many surfaces”

Từ phân tích agent-systems (public research 2026):

- **Một** `queryLoop()` cho interactive TUI, headless `claude -p`, Agent SDK, IDE/Desktop.
- Chỉ **rendering + interaction** đổi theo surface (Ink components vs Desktop chrome).
- Permission/hooks phong phú ở application layer; session compaction mạnh (spill-to-disk, memory dài ngày).
- Desktop = same agent, different surface (slash → buttons, diffs inline, multi-session sidebar).

**Khác Grok Build:** Claude productize **SDK + hooks lifecycle** rất sâu; Grok Build Desktop chủ yếu surface ACP events đã có từ CLI.

### 2.5 Google Antigravity — IDE platform, không phải thin CLI shell

Từ Google Developers Blog + phân tích industry:

- **Không** chỉ bọc CLI: **agentic development platform**.
- Nền tảng: **heavily modified VS Code / Code-OSS**.
- Hai surface:
  - **Editor View** — IDE + inline AI (sync).
  - **Manager Surface** — mission control multi-agent async (workspaces, artifacts, review).
- Agents hoạt động trên **editor + terminal + browser** (verify bằng Artifacts: plans, screenshots, recordings).
- Multi-model (Gemini 3 Pro + option Claude/GPT-OSS trong preview).

**Khác Grok Build:** Antigravity = **full IDE + orchestration**; Grok Build Desktop = **agent command center** (Codex-like lean) + **Open IDE** sang product riêng. Roadmap Grok Build đã **cố ý** out-of-scope cloud Sites/PR inbox kiểu Antigravity.

---

## 3. Bảng so sánh chức năng & UX (góc nhìn tối ưu product)

| Khía cạnh | Grok Build Desktop | Codex App | Claude Desktop/Code | Antigravity |
|-----------|--------------------|-----------|---------------------|-------------|
| Agent core | Grok CLI + ACP | Codex App Server | Claude queryLoop | Gemini agents + IDE host |
| Multi-session UI | History sidebar | Thread/workspace heavy | Multi-session | Manager multi-agent |
| Diff / review | Review panel (LCS-ish) | Strong PR/git review | Inline diffs | Artifacts + editor |
| Terminal | PTY host trong Electron | node-pty + agent tools | CLI-native | Integrated terminal |
| Permissions | Mode chips + dialog | App + sandbox | Hooks + modes | Review policy / artifacts |
| MCP / plugins | Form + CLI flags | Native MCP in binary | Strong MCP ecosystem | Platform tools + browser |
| Parallel agents | Hạn chế (1 connect) | Parallel agents (app) | Subagents | **First-class** Manager |
| Browser verify | Không (core) | Hạn chế / cloud | Computer use (product lines) | **Built-in browser** |
| IDE deep edit | Open external IDE | Open 16 editors + VS Code bridge | IDE plugins | **In-process editor** |
| Bundle philosophy | Thin (~portable 72MB+) | Electron + Rust CLI | CLI + Desktop | Full IDE (lớn hơn) |
| UX reference fit | Codex + Antigravity (docs) | — | — | — |

---

## 4. “Nền tảng xử lý mã nguồn” — cơ chế kỹ thuật

### 4.1 Các khối dùng chung (industry standard 2026)

| Khối | Việc làm | Grok Build hiện trạng |
|------|----------|------------------------|
| **Workspace root** | CWD / project bound | Pick folder + state `desktop-state.json` |
| **Context packing** | File reads, globs, ignore | CLI-side (agent tools) |
| **Edit apply** | Patch / write | ACP tool + FS host |
| **Shell tools** | Run commands, observe | CLI + desktop Terminal panel |
| **Permission gate** | Human-in-the-loop | Modes + dialog |
| **Session memory** | Transcript, resume | `~/.grok` + sessions package |
| **Rules / memory files** | AGENTS.md, skills | CLI Grok Build conventions |
| **MCP** | External tools | CLI MCP + UI forms |
| **Compaction** | Truncate long context | CLI-side (surface only shows stream) |

### 4.2 Protocol landscape

```text
MCP  = tool servers (capabilities for agents)
ACP  = agent ↔ editor/client (stdio JSON-RPC)  ← Grok Desktop uses this
App Server (Codex) = bidirectional agent harness API across surfaces
LSP  = language servers (analogy historical cho ACP)
```

**Grok Build chọn ACP** → tương thích ecosystem (Zed, JetBrains ACP, Devin Desktop multi-agent, vscode-acp…). Đây là hướng **đúng và bền** hơn tự invent protocol riêng (trừ khi scale như OpenAI App Server).

### 4.3 Phân loại “độ sâu product”

```text
Level 0  Chat web only
Level 1  CLI agent (TUI)
Level 2  Thin desktop over CLI/ACP          ← Grok Build Desktop (hiện tại)
Level 3  App Server + multi-surface + git platform  ← Codex mature
Level 4  Full agentic IDE + multi-agent manager     ← Antigravity
```

**Khuyến nghị chiến lược:**  
Giữ **Level 2–3 hybrid** (không nhảy Level 4 trong monorepo này). Đẩy **Level 3 features** (multi-session orchestration, git-native review, automation inbox) trên shell Electron; giữ **Level 4** ở `grok-build-ide` nếu cần.

---

## 5. Điểm mạnh / điểm yếu Grok Build so với đối thủ

### 5.1 Điểm mạnh

1. **Architecture đúng chuẩn:** CLI core + ACP + thin Electron — giống Codex/Claude surface strategy.
2. **Không gánh VS Code trong primary product** — startup/memory tốt hơn Antigravity-class.
3. **Session/auth/model/effort** bám CLI → parity với TUI khi connect đúng.
4. **Portable/NSIS ship path** đã có; product identity (icon, AUMI) đang hoàn thiện.
5. **Ranh giới rõ** với IDE riêng — tránh dual-maintenance Code-OSS trong repo.

### 5.2 Khoảng trống so với Codex / Claude / Antigravity

| Khoảng trống | Đối thủ làm gì | Impact UX |
|--------------|----------------|-----------|
| Multi-agent parallel | Codex app, Antigravity Manager | User chờ 1 agent tuần tự |
| Artifact-first review | Antigravity Artifacts | Khó tin agent khi chỉ log tool |
| Git/PR native | Codex git IPC | Review/ship chậm hơn |
| Structured composer | Codex ProseMirror | Diff/tool cards kém mượt |
| App Server ổn định | Codex bidirectional API | ACP stream đủ nhưng ít RPC domain |
| Automation/inbox | Codex rrule + inbox | Không có background tasks |
| Browser verify | Antigravity | Không E2E UI verify trong shell |
| Renderer architecture | React+state machines | Vanilla `app.js` monolithic → khó scale UI |
| Process isolation | Sandbox Codex/Claude | Phụ thuộc CLI sandbox |
| Lazy UI / virtual list | Codex 433 chunks | Timeline dài có thể lag |

### 5.3 Rủi ro hiệu năng thực tế (desktop)

| Nguồn | Hiện tượng | Mức |
|-------|------------|-----|
| Electron + Chromium | RAM baseline | Trung bình (chấp nhận được Level 2) |
| DOM timeline streaming | Jank khi delta dày | Cao nếu không batch/virtualize |
| Spawn `grok` cold start | Connect chậm | Trung bình — warm keep-alive giúp |
| Main process sync I/O | UI freeze nếu FS/IPC chặn | Trung bình |
| Full transcript re-render | Memory balloon | Cao session dài |
| Multiple PTYs | CPU | Thấp–TB |

**Lưu ý:** 80% “cảm giác mạnh mẽ” đến từ **CLI model latency + tool quality**, 20% từ **UI plumbing**. Tối ưu UI không thay model — nhưng UI kém sẽ **phá** cảm nhận model tốt.

---

## 6. Lộ trình tối ưu Grok Build (UI + tính năng + hiệu năng)

Ưu tiên theo **ROI / đúng architecture** (không fork Antigravity).

### Phase A — Performance & stability shell ✅ **SHIPPED** (2026-08-06)

See `docs/reports/PHASE_A_PERF.md` for file map and test checklist.

| # | Việc | Status |
|---|------|--------|
| A1 | Batch stream render (rAF / ~40ms) | ✅ `streamBatcher.js` |
| A2 | Virtualize timeline (≥64 items) | ✅ `timelineView.js` |
| A3 | Keep-alive / reconnect | ✅ warm reuse + auto-reconnect in `main.cjs` |
| A4 | Off-main markdown/diff | ✅ `contentWorker.js` + `offthread.js` |
| A5 | Structured event store | ✅ `eventStore.js` |
| A6 | IPC surface (status/reconnect) | ✅ preload + handlers |

### Phase B — UX parity Codex (command center) ✅ **SHIPPED** (2026-08-06)

See `docs/reports/PHASE_B_UX.md`.

| # | Việc | Status |
|---|------|--------|
| B1 | Multi-session tabs (snapshot + session switch) | ✅ one ACP process |
| B2 | Tool cards + collapsible thought | ✅ |
| B3 | Diff review v2 Accept/Reject + side-by-side | ✅ |
| B4 | Command palette Ctrl/Cmd+K | ✅ |
| B5 | Permission inline cards | ✅ no native dialog |
| B6 | Usage bar polish | ✅ |
| B7 | Git status strip | ✅ |

### Phase C — Light “Manager” (Antigravity-inspired) ✅ **SHIPPED** (2026-08-06)

See `docs/reports/PHASE_C_MANAGER.md`.

| # | Việc | Status |
|---|------|--------|
| C1 | Task board (headless jobs + worktree) | ✅ Manager panel |
| C2 | Artifacts panel | ✅ plans + job outputs |
| C3 | Background jobs queue + inbox | ✅ `jobRunner` + toast |
| C4 | Open IDE deep-link file:line | ✅ `-g` Code-family |
| C5 | Worktree isolation UI | ✅ list/show/rm/gc + job flags |

### Phase D — Platform hardening ✅ **SHIPPED** (2026-08-06)

See `docs/reports/PHASE_D_HARDENING.md`. Commands: `npm run check`, `npm test`.

| # | Việc | Status |
|---|------|--------|
| D1 | Architecture guardrails (no agent loop in Electron) | ✅ `check:arch` |
| D2 | Thin control plane (health/capabilities) | ✅ not full App Server |
| D3 | E2E suite (unit + contract + optional live) | ✅ `npm test` |
| D4 | Opt-in local telemetry latency buckets | ✅ Settings |
| D5 | Packaging icon stamp contract | ✅ `check:packaging` |

### Phase E — Những gì *không* nên làm trong repo này

| Không làm | Lý do |
|-----------|--------|
| Nhúng full Code-OSS | Agents.md; product bloat; dual-edit |
| Replicate Antigravity browser+editor in-process | Scope IDE; cannibalize grok-build-ide |
| Duplicate agent loop in Node | Drift vs CLI; double bugs |
| rcedit lên NSIS/portable wrappers | Phá payload (đã chứng minh) |

---

## 7. Kiến trúc mục tiêu đề xuất (Target architecture)

```text
┌──────────────────────────────────────────────────────────────┐
│  Renderer (UI)                                               │
│  - Event store + virtual timeline                            │
│  - Tool cards / plan / artifacts / multi-session tabs        │
│  - Command palette · permission cards · git strip            │
│  ZERO agent business logic                                   │
└────────────────────────┬─────────────────────────────────────┘
                         │ typed IPC (registry, Zod-like)
┌────────────────────────▼─────────────────────────────────────┐
│  Electron Main                                               │
│  - Window · state · PTY · FS · settings · Open IDE           │
│  - AgentSupervisor: N × GrokClient                           │
│  - Job queue / inbox (optional)                               │
└────────────────────────┬─────────────────────────────────────┘
                         │ ACP stdio × N
┌────────────────────────▼─────────────────────────────────────┐
│  grok CLI (official) — single intelligence source            │
│  tools · models · MCP · sessions · auth · compaction         │
└──────────────────────────────────────────────────────────────┘
```

**Nguyên tắc:** *Same core as TUI; desktop only multiplies surfaces and orchestration.*

---

## 8. Ma trận ưu tiên triển khai (gợi ý backlog)

| Priority | Item | Effort | Impact | Depends |
|----------|------|--------|--------|---------|
| P0 | Stream batch + virtual timeline | M | High perf | — |
| P0 | AgentSupervisor reconnect / error UX | S | High trust | — |
| P1 | Multi-session tabs | M | High UX | Supervisor |
| P1 | Diff review accept/reject | M | High UX | — |
| P1 | Permission cards in-chat | S | High UX | — |
| P2 | Command palette | S | Medium | — |
| P2 | Git status strip | S | Medium | git CLI |
| P2 | Artifacts panel | M | High trust | CLI outputs |
| P3 | Background job inbox | L | Differentiator | Supervisor |
| P3 | Worktree multi-agent board | L | Antigravity-lite | Worktree CLI |
| P4 | Optional App-Server wrapper | L | Ecosystem | Protocol design |

---

## 9. Kết luận nghiên cứu

1. **Có:** Grok Build Desktop, Codex, Claude Code đều theo mô hình **core agent (CLI/App Server) + surface UI riêng**. Giao diện **không** chứa tạo “bộ não” — chỉ host protocol + render + orchestration.
2. **Antigravity** đi xa hơn: **IDE fork + multi-agent Manager + browser verify** — đây là **platform**, không phải thin shell. Grok Build **không nên** copy full stack; nên **mượn UX patterns** (artifacts, mission control lite).
3. **Xử lý mã nguồn** = agentic loop trên workspace (tools + observe + compact), protocol hóa bằng **ACP/MCP/App Server**, không phải “build source user”.
4. **Đường tối ưu Grok Build hiệu năng mạnh nhất:**
   - Giữ CLI làm core (parity + tốc độ ship).
   - Làm shell **nhanh, multi-session, artifact-first, git-aware**.
   - Không phình thành VS Code; IDE deep nằm product phụ.
5. **Thành công đo bằng:** time-to-first-token UI mượt, tool-roundtrip rõ, multi-task không block, review tin cậy — không đo bằng “giống Antigravity 100%”.

---

## 10. Tài liệu tham chiếu

### Nội bộ repo
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md` (UX refs: Antigravity + Codex)
- `docs/reports/FUNCTIONAL_AUDIT.md`
- `Agents.md`
- `apps/desktop`, `packages/acp-client`, `packages/sessions`

### Công khai (ecosystem)
- OpenAI Codex App / App Server architecture (CLI-as-backend, multi-surface)
- Anthropic Claude Code / Desktop (single queryLoop, multi-surface)
- Google Antigravity developers blog (Editor + Manager, artifacts)
- Agent Client Protocol (ACP) overview — agent ↔ editor stdio
- Model Context Protocol (MCP) — tool servers

---

## 11. Phụ lục — Checklist audit nhanh cho từng release

- [ ] Connect path: `grok [flags] agent stdio` vẫn đúng
- [ ] First token latency p50/p95 (telemetry opt-in)
- [ ] Timeline 1k messages scroll ≥ 60fps target
- [ ] Permission modes map 1:1 CLI
- [ ] Usage chip matches CLI weekly credits
- [ ] Session resume/load không crash silent
- [ ] Portable + NSIS sizes sane; icons stamped (exe only)
- [ ] Open IDE resolves install paths (không hardcode 1 drive)
- [ ] No agent logic duplicated in renderer

---

*Báo cáo này là living document — cập nhật khi CLI Grok đổi protocol hoặc khi Phase A–C ship.*
