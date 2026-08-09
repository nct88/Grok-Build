# Grok Build vs Grok Build IDE

Two **product surfaces** (Antigravity-style split). One Code-OSS binary + workbench for now; **UI, copy, layout, and status bar** treat them as separate products.

| | **Grok Build** | **Grok Build IDE** |
|---|---|---|
| Product id | `grok-build` | `grok-build-ide` |
| Role | Agent desktop | Full IDE |
| Primary UI | Conversation rail + chat + **Open Grok Build IDE** | Explorer / editor / terminal; compact agent panel |
| Switch | Status bar + webview button | Status bar + **Open Grok Build** |
| Default | Yes (`grokBuild.defaultProduct`) | Optional |

## Commands

| Command | Action |
|---|---|
| `Grok Build: Open Grok Build` | Agent desktop surface |
| `Grok Build: Open Grok Build IDE` | Classic IDE surface |
| `Grok Build: Toggle Grok Build ↔ Grok Build IDE` | Flip |

## Settings

- `grokBuild.defaultProduct`: `grok-build` \| `grok-build-ide`
- `grokBuild.agentFirstLayout`: prefer agent desktop when no last-used product

## Honest UI reality

**Grok Build is still Code-OSS / VS Code under the hood.**  
What you see (tabs, editor chrome, title bar) is the workbench shell — not a custom Electron app like Antigravity 2.5.

| Layer | Antigravity 2.5 | Grok Build 1.x |
|---|---|---|
| Shell | Custom agent desktop app | **Code-OSS workbench** |
| Agent UI | First-class native surface | Extension **webview** in secondary sidebar |
| IDE | Separate **Antigravity IDE** app | Same binary, **Grok Build IDE** chrome mode |

**Agent mode (1.0.1+)** only *hides* classic chrome (Activity Bar, Explorer sidebar, bottom panel, compact menu) so chat dominates. It does **not** replace the VS Code window frame.

## Future (true dual installers / non-VS-Code shell)

Optional later:
- two `product.json` flavors / two EXEs with separate `dataFolderName`
- or a dedicated agent Electron shell that embeds only editor widgets
- Runtime agent remains `grok agent stdio` + ACP for both
