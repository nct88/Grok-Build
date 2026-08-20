# Grok Build Desktop workspace

This repository is **Grok Build Desktop** (`nct88/Grok-Build-Desktop`). The agent engine is the official **Grok CLI** over ACP. Desktop is a surface only.

- Do not add a second agent runtime, Code-OSS, or model HTTP from the renderer.
- Product names: `product/PRODUCT_IDENTITY.md`. Architecture: `docs/ARCHITECTURE.md`.
- Root `AGENTS.md` is gitignored. Always-on rules live in `.grok/rules/`. Slash skills live in `.grok/skills/` (Desktop catalog reads only that folder and `%GROK_HOME%/skills`).
- UI, layout, styling, routing, or renderer work: load `verify-ui` and exercise the change. A single screenshot is not verification.
- Browser, MCP, Figma, Canva, MongoDB, Cloudflare, or plugin tools: load `use-mcp` before calling those servers.
- After a fix or release-worthy change: load `write-fix-log`.
- Before claiming complete, passing, or ready to ship: load `run-check` and report the command output.
