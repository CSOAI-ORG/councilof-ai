# TUI 6 — Outreach Contacts (Prepared, NOT Sent)
## Generated: 2026-09-11T13:15Z
## Status: PREPARED — owner approval required before sending

---

## Principles

- At most 15 targeted, evidence-first contacts
- No bulk email, automated DMs, repeated directory submissions, or promotional bot replies
- Each contact gets distinct attribution ID
- Scale only after evidence gates pass (one buyer + repeat intent OR two pilot acceptances)

---

## Contact Pool (15 contacts across 3 prospect classes)

### Class A: Financial Risk Teams (5 contacts)

| # | Attribution ID | Prospect | Role | Evidence Lead | Price |
|---|---------------|----------|------|---------------|-------|
| A1 | `OUTREACH-A1-STABLECOIN-RISK` | Major stablecoin issuer risk team | Head of Risk | 425 stablecoins indexed, 15 deep-measured, attestation gaps documented | $199/mo feed |
| A2 | `OUTREACH-A2-EXCHANGE-COMPLIANCE` | Top-10 crypto exchange compliance | Compliance Officer | Cross-chain supply verification, RLUSD measurement | $199/mo feed |
| A3 | `OUTREACH-A3-DEFI-PROTOCOL` | Top-5 DeFi protocol risk | Risk Lead | Chain-level supply data, bridge risk registry | $199/mo feed |
| A4 | `OUTREACH-A4-ASSET-MANAGER` | Digital asset fund manager | Portfolio Manager | Tokenized fund data (BUIDL, USDY, USYC), NAV verification | $199/mo feed |
| A5 | `OUTREACH-A5-BANK-STABLECOIN` | Bank-issued stablecoin team | Product Lead | SWIFT cohort data (26 institutions), ISO 20022 mapping | $199/mo feed |

### Class B: Data Providers (5 contacts)

| # | Attribution ID | Prospect | Role | Evidence Lead | Price |
|---|---------------|----------|------|---------------|-------|
| B1 | `OUTREACH-B1-DEFILLAMA` | DefiLlama team | Data Lead | XRPL RLUSD discrepancy ($1.03B vs $0), measurement methodology | Partnership |
| B2 | `OUTREACH-B2-COINGECKO` | CoinGecko stablecoin desk | Data Analyst | Deep measurement with raw hashes, block-level verification | Partnership |
| B3 | `OUTREACH-B3-MESSARI` | Messari research | Research Analyst | Signed measurement cards, Ed25519 verification, 371 cards | $199/mo feed |
| B4 | `OUTREACH-B4-THEBLOCK` | The Block Data Dashboard | Data Lead | Cross-chain supply verification, correction lineage | $199/mo feed |
| B5 | `OUTREACH-B5-CHAINALYSIS` | Chainalysis compliance data | Product Manager | Real-time supply monitoring, attestation gap detection | $199/mo feed |

### Class C: Agent Infrastructure (5 contacts)

| # | Attribution ID | Prospect | Role | Evidence Lead | Price |
|---|---------------|----------|------|---------------|-------|
| C1 | `OUTREACH-C1-MCP-REGISTRY` | MCP Registry maintainers | Maintainer | 12 tools verified, canonical manifest, directory reconciliation | Free partnership |
| C2 | `OUTREACH-C2-X402-FOUNDATION` | x402 Foundation | Member Relations | Live x402 on Base, 9 resources, offer receipt verified | $499/mo Trust Board |
| C3 | `OUTREACH-C3-AGENT-PLATFORM` | Agent platform (e.g. LangChain) | Integration Lead | A2A Agent Card v1.1.0, 4 skills, MCP+SDK parity | $499/mo Trust Board |
| C4 | `OUTREACH-C4-AI-VERIFY` | AI Verify Foundation | Technical Lead | 22-axis measurement, NIST AI 300 submission, EU AI Act crosswalk | $499/mo Trust Board |
| C5 | `OUTREACH-C5-OPENSSF` | OpenSSF (LF) | Security Lead | Ed25519 signing, Rekor witness, model supply chain verification | Partnership |

---

## Contact Template (Evidence-First)

```
Subject: Verified stablecoin measurement — [SPECIFIC EVIDENCE POINT]

[Name],

I'm writing because [SPECIFIC RELEVANT EVIDENCE] directly addresses 
[SPECIFIC PAIN POINT].

What we've measured:
- [2-3 bullet points of exact, verifiable facts with numbers]
- All signed under Ed25519, rooted in Merkle, witnessed by Rekor

The attached [feed sample / card sample / crosswalk] is verifiable:
- Every record has source, block, raw hash, and replay instructions
- 371 cards SHA-256 + Ed25519 verified
- Correction model: every error has a dated correction link

Current pricing: [PRICE] — x402 USDC on Base, or free metadata.

If this is relevant to your [team/workflows], I can send a signed 
sample card and the live verification walkthrough.

[Name]
CSOAI Ltd (UK 16939677)
nicholas@csoai.org
```

---

## Attribution Tracking Fields

Per contact, track:

| Field | Description |
|-------|-------------|
| `attribution_id` | Unique ID from table above |
| `sent_at` | ISO timestamp when sent |
| `channel` | email / LinkedIn / GitHub / direct |
| `opened` | boolean |
| `replied` | boolean |
| `reply_content` | summary of reply |
| `free_verification` | boolean — did they use free door? |
| `x402_challenge` | boolean — did they attempt paid access? |
| `x402_settlement` | boolean — did they pay? |
| `settlement_amount` | USDC amount |
| `repeat_settlement` | boolean |
| `sample_requested` | boolean |
| `price_accepted` | boolean |
| `pilot_started` | boolean |

---

## Revenue Gate

Do not scale until:
- One attributable outside buyer plus repeat intent; OR
- Two written pilot acceptances at stated price

Current state: 0 outreach sent. 0 buyers. 0 pilots. Revenue = 0.02 USDC.

---

## What NOT to Do

- No bulk email
- No automated DMs
- No repeated directory submissions
- No promotional bot replies
- No claims of "first," "safe," "compliant" without evidence

---

*TUI 6 — Outreach Contacts | Prepared but NOT sent — owner approval required*
