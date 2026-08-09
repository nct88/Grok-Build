# Sprint next — implementation log

**Date:** 2026-08-07  
**Order:** P0 smoke → Imagine path → e2e expand → light polish

## Done this sprint

### P0
- `npm run check` green (baseline + new tests)
- Mic permission handlers already shipped (prior turn)

### P1 Imagine path
- Composer **slash menu**: `/imagine`, `/imagine-video`, `/settings`, `/usage`, `/marketplace`, `/plugins`
- `/imagine …` / `/imagine-video …` expand to agent prompts that load **Imagine skill** + tools
- Timeline: markdown images, media strip from paths, user attachment thumbs
- Local images resolved via `fs:readFileBase64` → data URL (workspace sandbox)

### P1 e2e
- Tests for slash expand, media extract, markdown images

### P2 light
- Placeholder text mentions `/imagine`
- This report + FIX_LOG entry

## Manual test checklist

```powershell
npm run desktop
```

1. Type `/` → menu appears; pick `/imagine a blue robot`
2. Send → user bubble shows slash text; agent gets expanded prompt
3. When agent returns `![…](path.png)` or a path, preview appears in timeline
4. Attach/paste image → thumb under user message
5. `/settings` `/marketplace` run UI without agent

## Still optional later

- Playwright Electron launch smoke
- Code signing / public update CDN
- Full TUI `/settings` parity
