# P2 polish — implementation notes

**Date:** 2026-08-07  
**Baseline:** 0.5.21 (+ source; rebuild dist to ship)

## Delivered

| Item | Implementation |
|------|----------------|
| **Hunk-level accept/reject** | `renderer/lib/diffHunks.js` + Review panel hunk cards |
| **Richer git strip** | short hash, dirty file tooltip, upstream, Create PR link |
| **PR helpers** | `git:createPr` (gh) + browser `createPrUrl` for GitHub/GitLab |
| **Agent slot UI** | `agentSlots` strip + palette “Spawn parallel agent” |
| **@file mentions** | Type `@` in composer → filter workspace files |
| **Auth preflight** | Connect blocked with CTA if not signed in |
| **Update feed default** | Empty URL → read local `dist/latest.json` |
| **Libs** | `fileMentions.js`, `agentSlotsUi.js`, `diffHunks.js` |

## How to use

### Hunk review
1. Agent edits a file → Review panel  
2. Open file → hunk cards with Accept / Reject per hunk  
3. Accept all / Reject all still on toolbar  

### Parallel agent
1. Connect primary chat  
2. Slot strip appears (or ⌘K → “Spawn parallel agent”)  
3. `+` spawns second `grok agent stdio` (max 2)  
4. Click chip to set active slot; `×` stops parallel  

### @file
Type `@` then filter path; Enter/Tab inserts `@relative/path `.

### Updates
Settings → Check update works without remote URL if `dist/latest.json` exists after publish.

## Tests

```powershell
npm run check
```

Includes: diffHunks, fileMentions, gitStatus P2 helpers.

## Deferred (later)

- Hunk staging without immediate write  
- Full `gh pr create` UI form  
- Playwright Electron UI e2e  
- Further `app.js` domain split  
