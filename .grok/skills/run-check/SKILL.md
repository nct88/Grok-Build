---
name: run-check
description: Use when claiming a Desktop change is complete, fixed, ready to PR, or passing, and before commit or release. Also /run-check.
---

# Run check

Run from the repo root:

```powershell
npm run check
```

That is architecture, packaging, brand, release contract, tests, and visual gates.

## Rules

- Claim pass only after this command (or the subset that covers the change) finishes and the output is green.
- UI/layout work also needs `verify-ui`. A green unit file is not a visual gate.
- If `npm run check` is too heavy mid-loop, run the smallest matching script (`npm run check:arch`, `npm run check:visual`, `node scripts/test-slash-commands.mjs`) then run the full gate before "done".
- Paste or summarize actual failures. Do not invent results.
