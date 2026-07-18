# PyPI Publish — Pending (Throttled)

**Status:** BLOCKED on PyPI rate limit (429 Too Many Requests) for the `MEOK_AI_Labs` publisher account.
**Last attempt:** 27 Jun 2026 08:00 BST
**Package:** `meok-emerald-tablet-mcp` v1.0.0 — fully built + tested + ready

## Why blocked

PyPI's per-publisher rate limit kicked in (HTTP 429). Cause: today's Mavis factory burst
(290+ PyPI packages pushed this week from the same publisher account) hit the daily limit.
The legacy upload endpoint (`https://upload.pypi.org/legacy/`) is throttling.

## What's ready to fire

```bash
cd ~/clawd/mcp-marketplace/meok-emerald-tablet-mcp
twine upload dist/*
```

This will succeed once PyPI's publisher throttle clears (typically hours, sometimes overnight).

## Diagnostic evidence

- `twine check dist/*` → PASSED (both wheel + sdist)
- `pip install --break-system-packages .` → ✅ local install OK
- `pytest tests/` → **22/22 PASS**
- 4 consecutive `twine upload` attempts (0s / 75s / 5min / 15min waits) → all **HTTP 429**
- `https://pypi.org/pypi/meok-emerald-tablet-mcp/json` → `{"message": "Not Found"}` (not yet on PyPI)

## Suggested follow-up

1. Wait until PyPI's publisher throttle clears (try again in 2-4 hours)
2. If still throttled tomorrow, check https://status.python.org/ for PyPI incidents
3. As a last resort, publish under a different (fresh) PyPI account — but loses the MEOK_AI_Labs publisher continuity

## Once published

- Smithery auto-discovers within 24h (no manual action needed)
- The 28 existing MEOK_AI_Labs package listings will get a 29th entry
- `pip install meok-emerald-tablet-mcp` works worldwide
- MCP marketplace auto-catalog (already wired) picks it up immediately

**SIGIL:** digest `6be33541`, signature `fc2d450c...` (chained)