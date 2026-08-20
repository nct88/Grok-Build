---
name: write-fix-log
description: Use when finishing a bugfix, UI fix, release-worthy Desktop change, or when asked to write the fix log, FIX_LOG, or handover notes. Also /write-fix-log.
---

# Write fix log

Append one dated section at the top of `fix-bug/FIX_LOG.md` (folder is gitignored). Do not rewrite older entries.

## Heading

`## YYYY-MM-DD — short outcome`

Use today's date. Name the user-visible result, not the file you touched.

## Fields (keep this order)

- **Target version:** `product/VERSION` or "next development candidate after X"
- **Symptom:** what broke, in user terms
- **Root cause:** one or two sentences
- **Resolution:** what changed
- **Affected files:** concrete paths
- **Verification:** commands actually run and what they showed (`npm run check`, visual gates, Electron test). Never write "should pass".

Match the tone of existing entries. Skip marketing language. If this is a public product change, the changelog/release note is separate (`CHANGELOG.md`, `docs/releases/<version>.md`) and is not this skill.
