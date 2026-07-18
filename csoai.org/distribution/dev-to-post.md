Title: EU AI Act Annex III high-risk deadline: DELAYED 16 months to 2 Dec 2027

Tags: eu-ai-act, compliance, mcp, sovereign-ai, watermarking, c2pa

Body:

The 7 May 2026 EU Digital Omnibus Act political agreement delayed the EU AI Act Annex III high-risk AI provisions from 2 Aug 2026 to 2 Dec 2027.

The catch: **Article 50 transparency + watermarking is NOT delayed** — still bites in 36 days (2 Aug 2026).

## The deadlines (sourced from EUR-Lex CELEX:32024R1689)

| Date | Event | Status |
|---|---|---|
| 2 Aug 2026 | Article 50 transparency + watermarking | **36 days — NOT DELAYED** |
| 2 Dec 2027 | Annex III high-risk | 523 days — DELAYED 16 months |
| 2 Aug 2028 | Annex I product-safety | 767 days — DELAYED 12 months |

## Why this matters

Every compliance vendor is still saying "37 days to cliff" and creating panic. We have the delay built into our tooling.

## What we built

- `eu-ai-act-compliance-mcp` — open-source (Apache-2.0) MCP with the correct deadlines
- `article50_passport_issue` — C2PA watermarked passport for the 36-day window
- `orgkernel_*` — 3-layer audit (L1/L2/L3 Ed25519)
- `federated_rag` — single-call RAG over 1,232 vault files + 341 MCPs

19 published MCPs at github.com/CSOAI-ORG. Sovereign substrate v2.0.0. 2,500+ OLM samples.

## Try it

```bash
# Get the Article 50 deadline
curl -X POST http://localhost:3101/mcp -H "Content-Type: application/json" -d '{
  "jsonrpc": "2.0", "id": "1", "method": "tools/call",
  "params": {"name": "deadline_check", "arguments": {}}
}'

# Issue a passport
curl -X POST http://localhost:3101/mcp -H "Content-Type: application/json" -d '{
  "jsonrpc": "2.0", "id": "1", "method": "tools/call",
  "params": {"name": "article50_passport_issue", "arguments": {
    "content_type": "image", "content_hash": "sha256:...",
    "provider": "anthropic", "interaction_type": "generative",
    "watermarked": true, "deployed_to": ["DE","FR","NL"]
  }}
}'
```

## The cliff moved

We are the only compliance vendor that knows.

---

Built by sovereign substrate v2.0.0. Apache-2.0. github.com/CSOAI-ORG