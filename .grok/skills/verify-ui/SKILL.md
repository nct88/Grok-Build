---
name: verify-ui
description: Use when changing Desktop UI, layout, styling, slash menu, i18n, Electron windows, or when asked to verify design, screenshots, responsive layout, dark/light theme, or browser-check the app. Also /verify-ui.
---

# Verify UI

Electron renderer changes are verified with this repo's Playwright gates. Chrome DevTools MCP is for live web pages (GitHub releases, docs), not the Electron window.

## Electron (required for renderer/CSS/layout)

1. Run the matching gate, not a one-off screenshot:
   - Layout/composer/panel: `npm run check:visual`
   - Broader: `npm run check` (includes visual + E2E)
2. Cover the surfaces this repo already gates: dark and light, **1000×640** and **1440×900**, slash menu overflow, 125–150% scale when layout changed.
3. Evidence lands under `docs/reports/evidence/<version>/` (that tree is gitignored).
4. Start from source with `npm start` only when you need a live window; visual scripts launch Electron themselves.

Do not treat `npm start` as proof. Read the gate output.

## Live web (Chrome DevTools MCP)

Use MCP tools (`search_tool` then `use_tool`) when the artifact is a URL:

1. `new_page` / `navigate_page`
2. `take_snapshot` then click/type through the flow
3. `resize_page` or `emulate` for desktop and a phone width
4. `take_screenshot` after interaction, not only first paint
5. `list_console_messages` for JS errors

If `navigate_page` fails, load the chrome-devtools `troubleshooting` skill. Chrome DevTools MCP is configured in `.grok/config.toml`.

## Do not stop at

- One render of the changed screen
- Desktop width only after a CSS change
- Claiming pass without gate or MCP output
