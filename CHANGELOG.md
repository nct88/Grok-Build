# Changelog

Public, versioned changes for Grok Build Desktop.

## 0.5.34 — 2026-08-13

- Moved the project folder picker from the conversation header to sit on the top-left of the composer, just above the message box.

Release details are maintained in `docs/releases/0.5.34.md`.

## 0.5.33 — 2026-08-13

- Kept the composer project and left sidebar on the same open folder after sending a message, and refreshed project chat history when a turn completes.
- Added automatic Grok CLI version and model detection, with an in-app prompt that runs `grok update`.
- Moved Usage next to Effort in the composer while keeping the Settings usage panel.
- Set Effort to `low` / `medium` / `high` / `xhigh` with `high` as the default and `xhigh` for grok-4.6+, and removed `(default)` from the model chip.
- Moved the project folder picker to the top-left of the chat frame.

Release details are maintained in `docs/releases/0.5.33.md`.

## 0.5.32 — 2026-08-12

- Added direct drag-and-drop of an individual chat from one project to another.
- Restricted project reordering to the project header so dragging a nested chat cannot move the whole project group.
- Added clear light/dark drop-target feedback and localized drag accessibility text.
- Preserved the Move menu as a keyboard-friendly fallback.

Release details are maintained in `docs/releases/0.5.32.md`.

## 0.5.31 — 2026-08-12

- Kept the composer project picker, sidebar project, active tab and restored session timeline synchronized.
- Added safe movement of an existing chat between projects, including persisted session metadata.
- Localized dynamic Tool and Review surfaces when Vietnamese is enabled.
- Improved local folder/file links, including paths containing spaces and source-line suffixes.
- Added a localized right-click menu for copying or selecting ordinary session content.
- Kept internal runtime bundles in `extraResources` while classifying workspace links as build-only dependencies, avoiding Windows junction traversal during packaging.

Release details are maintained in `docs/releases/0.5.31.md`.

## 0.5.30 — 2026-08-12

- Added a Codex-aligned session timeline with restored reasoning summaries.
- Added framed Markdown tables, flat tool/review surfaces and responsive right-panel hiding.
- Added navigable local paths with folder actions.
- Standardized source startup as `npm install` followed by `npm start`.
- Added a centered English/Vietnamese language switch to both README pages.

Release details are maintained in `docs/releases/0.5.30.md`.
