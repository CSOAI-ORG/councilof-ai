# CSOAI Media Pack — September 2026

**Status: DRAFT. Not sent. The owner sends.**
**Verified before drafting:** All numbers below carry the command that checks them.

---

## One-line description

Council of AI independently measures public claims and system behaviour, publishes signed machine-readable evidence, preserves corrections, and makes the evidence reusable through web, MCP, A2A and x402 interfaces.

## What CSOAI does (three sentences)

CSOAI is an independent AI-governance measurement body. It publishes signed measurement cards for AI systems across 22 axes, anchors the evidence in Bitcoin via OpenTimestamps and Sigstore's Rekor transparency log, and makes every artifact machine-readable through MCP, A2A and x402 protocols. Verification is free and needs no account.

## Key facts (verified)

| Claim | Proof command |
|-------|---------------|
| 335 signed measurement cards | `curl -s https://councilof.ai/api/press.json \| jq .signed_cards.indexed` |
| 305 Merkle-committed root leaves | `curl -s https://councilof.ai/api/press.json \| jq .public_root.leaves` |
| 53 published corrections | `curl -s https://councilof.ai/api/corrections \| jq '.corrections\|length'` |
| 12 A2A agent cards | `curl -s https://councilof.ai/.well-known/agents/index.json \| jq .count` |
| 13 MCP tools (9 free, 4 metered) | `curl -s https://councilof.ai/.well-known/mcp.json \| jq .measured` |
| 1 external payer, 0.02 USDC settled | `curl -s https://councilof.ai/api/revenue \| jq .commercial_evidence` |
| OTS-anchored Merkle root | `curl -s https://councilof.ai/api/press.json \| jq .public_root` |
| DOI: 10.5281/zenodo.21991104 | `curl -s https://councilof.ai/api/gspc \| jq -r .doi` |

## What CSOAI does NOT claim

- Not certification, accreditation, or compliance assessment
- Not a grade for sale — verification is free
- Not the only measurement body — independently verifiable means anyone can check
- Revenue of 0.02 USDC — pre-revenue, not post-revenue
- 53 corrections means 53 times we were wrong and published the fix

## Protocol surfaces

| Surface | URL | Status |
|---------|-----|--------|
| Web | https://councilof.ai | Live |
| MCP | https://councilof.ai/mcp | 13 tools |
| A2A | /.well-known/agents/index.json | 12 cards |
| x402 | Base USDC settlement rail | Live |
| RSS | /feeds/cards.xml, /feeds/corrections.xml | Live |
| DID | did:web:csoai.org | Live |

## Company

CSOAI Ltd, UK Companies House 16939677. Trading as Council of AI.

## License

CC-BY-4.0. All measurement artifacts, schemas, and verification tools.

## Contact

hello@councilof.ai. Nicholas Templeman, director.

---

*Measurement, not certification. Verification is free and needs no account.*
