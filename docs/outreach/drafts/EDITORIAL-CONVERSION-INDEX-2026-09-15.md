# Editorial Conversion — Outreach Index 2026-09-15

**Lane:** Editorial conversion (Claude)
**Status:** All drafts complete. Not sent. The owner sends.

---

## Deliverables

### Media Pack
- `docs/outreach/drafts/MEDIA-PACK-2026-09-15.md` — complete media pack with verified metrics

### Editor Pitches (5)
| # | Outlet | Angle | File |
|---|--------|-------|------|
| 1 | The Register | Self-correction as credibility engine | `pitch-01-the-register-2026-09-15.md` |
| 2 | CoinDesk | Stablecoin measurement, x402 payments | `pitch-02-coindesk-2026-09-15.md` |
| 3 | Ars Technica | Open-source MCP/A2A tools | `pitch-03-ars-technica-2026-09-15.md` |
| 4 | The Information | Pre-revenue infrastructure | `pitch-04-the-information-2026-09-15.md` |
| 5 | TechCrunch | Open-source AI governance | `pitch-05-techcrunch-2026-09-15.md` |

### Design Partner Approaches (5)
| # | Target | Angle | File |
|---|--------|-------|------|
| 1 | AI Labs | Measurement infrastructure for model cards | `design-partner-01-ai-labs-2026-09-15.md` |
| 2 | Compliance Teams | Machine-readable evidence | `design-partner-02-compliance-2026-09-15.md` |
| 3 | Stablecoin Issuers | Independent measurement | `design-partner-03-stablecoins-2026-09-15.md` |
| 4 | MCP Client Developers | AI governance tools | `design-partner-04-mcp-clients-2026-09-15.md` |
| 5 | Insurance/Reinsurance | AI risk evidence | `design-partner-05-insurance-2026-09-15.md` |

---

## Verified metrics used in all pitches

| Metric | Value | Proof command |
|--------|-------|---------------|
| Signed cards | 335 | `curl -s https://councilof.ai/api/press.json \| jq .signed_cards.indexed` |
| Root leaves | 305 | `curl -s https://councilof.ai/api/press.json \| jq .public_root.leaves` |
| Corrections | 53 | `curl -s https://councilof.ai/api/corrections \| jq '.corrections\|length'` |
| A2A agents | 12 | `curl -s https://councilof.ai/.well-known/agents/index.json \| jq .count` |
| MCP tools | 13 (9 free, 4 metered) | `curl -s https://councilof.ai/.well-known/mcp.json \| jq .measured` |
| External payers | 1 | `curl -s https://councilof.ai/api/press.json \| jq .commercial_evidence.outside_payers` |
| Settled USDC | 0.02 | `curl -s https://councilof.ai/api/press.json \| jq .commercial_evidence.settled_usdc_atomic` |

---

## Rules followed

- All numbers carry proof commands
- No claims of certification, compliance, approval, or "first"
- Revenue stated as 0.02 USDC (pre-revenue)
- 53 corrections = 53 times we were wrong
- All drafts to `docs/outreach/drafts/` — owner sends
- No fabricated adoption claims

---

*Measurement, not certification. Verification is free and needs no account.*
