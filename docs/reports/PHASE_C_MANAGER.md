# Phase C — Manager lite (Antigravity-inspired)

**Status:** implemented (2026-08-06)  
**Depends on:** Phase A (shell perf), Phase B (tabs, palette, review)

## Delivered

| ID | Item | Implementation |
|----|------|----------------|
| **C1** | Task board | Right panel **Manager** — queue headless tasks, status board, cancel |
| **C2** | Artifacts panel | **Artifacts** tab — plans auto-saved, job outputs, notes; detail + open IDE |
| **C3** | Background jobs + inbox | `jobRunner.cjs` via `grok -p`; toast + Inbox list; persist under userData |
| **C4** | Open IDE deep-link | `openIde({ workspace, file, line, column })` → VS Code `-g file:line` |
| **C5** | Worktree isolation UI | Manager worktree list/show/rm/gc; job form `--worktree` / `--worktree-ref` |

## Architecture

```text
Renderer Manager UI
  → IPC jobs:* / artifacts:* / worktree:*
Main
  → JobRunner (spawn grok -p, max 2 concurrent)
  → ArtifactStore (JSON under userData/manager)
  → grok worktree CLI
  → openIde deep-link
```

**Not** multi-process interactive ACP (still one chat agent). Background tasks are **headless single-turn** (`-p`) so they do not steal the interactive session. Optional worktree keeps file edits isolated.

## Files

```
apps/desktop/src/jobRunner.cjs
apps/desktop/src/artifactStore.cjs
apps/desktop/src/main.cjs      (IPC + openIde opts)
apps/desktop/src/preload.cjs
apps/desktop/renderer/app.js   (Manager UI)
apps/desktop/renderer/index.html
apps/desktop/renderer/styles.css
docs/reports/PHASE_C_MANAGER.md
```

## How to use

1. Open a project → Panel → **Manager**
2. Enter task prompt; optional **worktree name** + base ref
3. **Queue task** → board shows `queued` → `running` → `done`
4. Toast + **Inbox** when finished → click to open output in **Artifacts**
5. Live chat **Plan** dock also writes a plan artifact
6. **Open IDE** / dbl-click file path → IDE with workspace (+ file:line when set)

## Manual tests

1. Queue job without worktree on a small repo → completes → inbox toast  
2. Queue with worktree name → CLI receives `--worktree`  
3. Cancel a running/queued job  
4. Artifacts: Save plan, clear, open in IDE  
5. Worktrees: Refresh list, select id into job form  
6. Open IDE with file preview open → args include `-g`

## Limits / later

- Max 2 concurrent headless jobs  
- No multi-interactive ACP fleet (would need AgentSupervisor pool)  
- Worktree **create** still via Connect `--worktree` / CLI (grok creates on session start)  
- Hunk-level artifacts / browser screenshots not in scope  
