# A2A directory submission — agentcard.net

**Status:** Ready to submit (not yet filed)

## Listing

| Field | Value |
|-------|-------|
| Name | Council of AI — Measurement Agent |
| Agent card URL | https://councilof.ai/.well-known/agent-card.json |
| Protocol | A2A v1.0 (JSON-RPC) |
| Endpoint | https://councilof.ai/api/mcp |
| Category | Measurement / Governance |
| Organization | CSOAI Ltd (UK 16939677) |

## Description (paste)

Independent AI-governance measurement body. Publishes the GSPC 14-slot instrument (13 measured of 14) with frozen item banks and Ed25519-signed board evidence. Measurement only — not certification. Skills: GSPC board, East-West cross-jurisdiction mapping, benchmark-quality register, opt-in verify tally, measured badge.

## Verify before submit

```bash
curl -sS https://councilof.ai/.well-known/agent-card.json | jq '.supportedInterfaces, .skills | length'
# Expect: supportedInterfaces array + skills count >= 5
```
