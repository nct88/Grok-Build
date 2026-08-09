# Grok Build 1.0 Roadmap

Target UX reference: agent-first desktop (conversation primary, editor secondary) similar in *feel* to Antigravity 2.0 / Cursor — implemented on **Grok CLI + ACP**, not by cloning third-party binaries.

## Phase A — Dual product surfaces (done)

- [x] Product home `H:\projects\Grok-Build` + app name **Grok Build 1.0**
- [x] Junction `ide` → `grok-build-ide`
- [x] **Grok Build** (agent desktop) vs **Grok Build IDE** (full IDE) — UI + content split
- [x] Rail: New Conversation / History / Projects / Open Grok Build IDE
- [x] Masthead **Open Grok Build IDE** (and reverse **Open Grok Build**)
- [x] Status bar product indicator + switch
- [x] Commands + `grokBuild.defaultProduct`
- [x] Extension rebuild `dist/extension.cjs` (1.0.0)
- [ ] Optional later: two installers / two `dataFolderName` (true dual EXE)

## Phase B — Conversation rail

- [x] Activity bar: Conversations (sessions tree)
- [x] **New Conversation** primary action
- [x] History list always one click away
- [ ] Optional recent projects list

## Phase C — Stream polish

- [ ] Multi-file “N files · Review” summary chip
- [ ] Turn timing labels
- [ ] Walkthrough / plan cards refined
- [ ] Cross-dedupe ACP diff + filesystem write

## Phase D — Artifacts

- [ ] Optional `~/.grok-build/brain/<sessionId>/`
- [ ] Walkthrough markdown cards from plan/summary

## Phase E — Scheduled tasks

- [ ] Local schedule → prompt into session (v1)

## Non-goals for 1.0

- Unpacking or rebranding Antigravity / Gemini / Codeium stacks
- Embedding the Rust agent inside Electron
- Full CLI admin surface in GUI
