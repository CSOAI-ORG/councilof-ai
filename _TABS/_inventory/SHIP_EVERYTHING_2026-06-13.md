# MEOK Ship-Everything Status (2026-06-13 PM23)

**The single source of truth for "are we done" across all 341 packages.**

## What's done

| Channel | Status | # packages |
|---------|--------|-----------|
| PyPI publish | LIVE | 298/341 |
| server.json schema-valid | DONE | 341/341 |
| server.json version-aligned with PyPI | DONE | 341/341 |
| mcp-name in README | DONE | 341/341 |
| scorecard badge in README | DONE | 340/340 (canonical form) |
| 7/7 scoreboard surfaces | DONE | 340/340 (proofof.ai = 100%) |
| glama.json | DONE | 341/341 |
| smithery.yaml | DONE | 342/341 |
| acp.json + a2a agent.json + llms.txt | DONE | 340/340 |
| A2A AgentCard (.well-known/agent.json) | DONE | 340/340 |
| /verify meter wire (_server_meter_check) | DONE | 341/341 |
| auth_middleware.py metered | DONE | 219/219 |
| Apify Actor directories (template + 14 packages) | DONE | 14/14 |
| 35 compliance landing pages on meok.ai/dist | DONE | 35/35 |
| 30 practitioner guides on meok.ai/guides | DONE | 30/30 |
| awesome-meok-mcp curated repo | DONE | 1/1 |
| punkpeye/awesome-mcp-servers PR | NOT DONE | 0/1 |
| OWASP / NIST / IAPP / ENISA submissions | NOT DONE | 0/4 |
| Apify Actor push to apify.com store | NOT DONE | 0/14 |
| MCP registry (registry.modelcontextprotocol.io) | **0/300** (PHANTOM-CORRECTED) | NEED AUTH |

## The 1 thing that needs auth

**mcp-publisher login github** — every other path is auth-free.

When you do the device flow click (latest code: EBA3-83D5), the JWT has 5-min TTL. Then run:

```bash
mcp-publisher login github && \
  /opt/homebrew/bin/python3.11 /Users/nicholas/clawd/mcp-marketplace/_scorecard/publish_registry_v2.py
```

It publishes 300 packages in parallel, expected ~3 minutes. Idempotent — re-run for any failures.

If the JWT dies mid-batch (likely), re-login + re-run. v2 distinguishes AUTH-EXPIRED from real-fail.

## The 3 hard gates (Nick's lane)

1. **csga_global npm password change** (30 sec) — kills 8 tokens, releases 192 squatted packages
2. **PyPI per-PROJECT throttle** (24-48h wait OR Trusted Publisher OR support tickets) — unblocks 22 phantoms + 40 first-publish
3. **Vercel KV create** in meok-metering (2 min UI) — activates 200/day cap

## Master doc

Full execution trace: `/Users/nicholas/clawd/_TABS/_inventory/OPENMCP_EXECUTION_2026-06-13.md`
