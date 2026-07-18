---
name: audit
description: Full audit of a business — sites, code, Stripe, MCPs, gaps
---

Run a comprehensive audit of the specified business:

1. **Site Check** — HTTP status of all related domains and pages
2. **Code Review** — Check for uncommitted changes, broken imports, TODO items
3. **Stripe Check** — Verify products and pricing match what's advertised
4. **MCP Check** — Verify PyPI packages are published and installable
5. **Content Check** — Scan for stale dates, broken links, inconsistencies
6. **Security Check** — Look for exposed keys, missing auth, open endpoints
7. **Gap Analysis** — What's missing compared to competitors?

Present findings as a prioritized list with severity ratings.

Usage: /audit meok OR /audit cobolbridge OR /audit councilof
