# Contributing to Awesome MEOK MCP Servers

Thank you for your interest in expanding the MEOK MCP fleet listing.

## Adding a new MEOK MCP

1. Fork this repo
2. Edit `README.md`
3. Add an entry in the appropriate section under the format:
   ```
   - [package-name](https://pypi.org/project/package-name/) — One-line description.
   ```
4. Open a PR

## What we accept

- Live, working MEOK MCPs (verified via PyPI + GitHub)
- One-line descriptions that name the actual tool verbs (NOT "MCP server for X")
- Regulation-specific MCPs (EU AI Act, DORA, NIS2, etc.)

## What we don't accept

- Stale / broken links
- Boilerplate descriptions ("MCP server for X. Supports Y, Z. By MEOK AI Labs.")
- Duplicate entries

## Ordering

Within each section, packages are ordered by:
1. **Regulation cliff proximity** (EU AI Act 2 Aug 2026 first)
2. **Weekly PyPI downloads** (higher first)
3. **Alphabetical** as tiebreaker
