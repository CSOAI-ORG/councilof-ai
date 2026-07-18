# Sovereign SME Knowledge Base — 2363 accounts

Built from csoai_leads.db (synthesis of existing per-account intel — no re-scraping).

- **450/2363** have a computed top wedge (framework gap vs CSOAI).
- **2363/2363** have public AI signals.
- **7** distinct personas derived.

## Query it (SOV3 / dock)
```bash
sqlite3 sme-kb.db "SELECT company, persona, top_wedge, value_prop FROM sme WHERE persona LIKE '%Financial%' LIMIT 5;"
sqlite3 sme-kb.db "SELECT persona, COUNT(*) FROM sme GROUP BY persona ORDER BY 2 DESC;"
```

## Files
- sme-kb.jsonl — full SME profile per account
- sme-kb.db — indexed SQLite (persona/sector/tier indexed)
- PERSONA_MAP.md — personas → surfaces → coverage gaps
