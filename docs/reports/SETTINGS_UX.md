# Settings UX restructure

**Date:** 2026-08-06

## Goals

- Product chrome (not raw CLI flag dump)
- Fixed two-column modal (unchanged footprint)
- CLI launch args still produced on Connect via `connectOpts()` / `buildLaunchArgs()`

## Tabs

| Tab | Content |
|-----|---------|
| **General** | Theme, auto-connect, show reasoning, local telemetry |
| **Project** | CLI path (readonly), workspace (readonly), IDE path, update feed |
| **Agent** | Sandbox select, web search, outside-project access, max turns, memory, worktree, tools mode, extra rules |
| **Account** | Sign-in / out, disconnect, updates, about |
| **Usage** | Session + plan usage (unchanged cards) |

## CLI mapping (Agent tab)

| UI control | Storage / launch |
|------------|------------------|
| Sandbox select | `sandbox` → `--sandbox` (empty = omit) |
| Allow web search (checked) | `disableWebSearch: false` (unchecked → `--disable-web-search`) |
| Max turns select / custom | `maxTurns` → `--max-turns` if > 0 |
| Cross-session memory | `experimentalMemory` → `--experimental-memory` |
| Use worktree + name / ref | `worktree`, `worktreeRef` → `--worktree` / `--worktree-ref` |
| Tools: all / allow / deny | `tools` or `deniedTools` comma list |
| Extra rules textarea | `rules` → `--rules` |
| Allow outside project | `allowOutside` (desktop FS host only) |

## Files

- `renderer/index.html` — panel markup  
- `renderer/styles.css` — groups, hints, tool chips  
- `renderer/app.js` — load/save + control wiring  
- `renderer/lib/i18n.js` — EN/VI labels  
- `src/main.cjs` — `worktreeRef` on launch + state  
