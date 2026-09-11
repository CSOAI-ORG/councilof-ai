# TUI 6 — Revenue and Outside Signals Report
## Branch: trust/anchor-completion-20260911
## Generated: 2026-09-11T13:00Z

---

## Three Offers

### Offer 1: Stablecoin Change and Corrections Feed

| Field | Value |
|-------|-------|
| Attribution ID | `OFFER-STABLECOIN-FEED-20260911` |
| Price | $199/mo |
| Content | Full firehose: all fields, all families, history, alerts |
| Free tier | Current facts, methods, verification, RSS (zero cost) |
| Paid tier | Signed evidence, replay, inclusion proofs |
| Endpoint | `councilof.ai/feed` (paid subscription) |
| State | DEFINED — not yet sold |

### Offer 2: Regulation Deadline and Evidence Crosswalk

| Field | Value |
|-------|-------|
| Attribution ID | `OFFER-REGULATION-CROSSWALK-20260911` |
| Price SME | GBP 99/mo |
| Price Enterprise | GBP 999/mo |
| Content | Art 50 marking verification, EU AI Act crosswalk |
| State | DEFINED — not yet sold |

### Offer 3: MCP/A2A/x402 Trust Receipt

| Field | Value |
|-------|-------|
| Attribution ID | `OFFER-TRUST-RECEIPT-20260911` |
| Price | $499/mo |
| Content | Per-server trust data, MCP Trust Board API |
| State | DEFINED — not yet sold |

---

## Revenue State

| Classification | Amount | Count | Notes |
|---------------|--------|-------|-------|
| EXTERNAL_CUSTOMER | 0.02 USDC | 1 payer | Single external payment |
| INTERNAL_SELF_FUNDED | 5 settlements | 5 | Excluded from revenue |
| ZERO_VALUE_PROBE | 4 probes | 4 | Excluded |
| SKU_ISSUANCE | 3 SKUs | 3 | Excluded |
| **Total external revenue** | **0.02 USDC** | **1** | **Effectively zero** |

**Revenue = zero.** 0.02 USDC from one external payer is below any meaningful threshold. Internal self-settlements are excluded per policy.

---

## x402 Infrastructure

| Field | Value |
|-------|-------|
| Scheme | exact |
| Network | Base (eip155:8453) |
| Asset | USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Pay-to | `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31` |
| Offer | 0.01 USDC through 11 October 2026 |
| Free door | Zero cost |
| Resources | 9 (1 free + 8 paid) |
| Facilitator | Configured |
| Offer receipt | JWS/EdDSA, DID signer |

---

## x402 0.01 USDC Test

**Status:** NOT EXECUTED (owner gate)
**Target:** `request_attestation` for `llama3.2:3b`
**Classification:** Would be `INTERNAL_SELF_FUNDED`
**Revenue impact:** Zero (self-payment)

The infrastructure is ready. The challenge, verification, settlement, transaction, delivered resource, and attribution receipts would all be preserved. Revenue remains zero regardless of outcome.

---

## Attribution Pipeline

| Source | ID | State |
|--------|-----|-------|
| MCP Registry | `ATTR-MCP-REGISTRY` | Active |
| awesome-mcp-servers | `ATTR-AWESOME-MCP` | Active |
| Glama.ai | `ATTR-GLAMA` | Active |
| Direct | `ATTR-DIRECT` | Active |
| Promotion | `ATTR-PROMOTION` | 8 seed settlements (0.08 USDC) |

Each settlement produces signed receipt with: `payer_address`, `amount`, `source`, `timestamp`, `proof_sha256`.

---

## IETF Drafts

| Draft | Status | Date |
|-------|--------|------|
| `draft-templeman-scitt-frimming-space-00` | PUBLISHED | Sep 4, 2026 (91 pages) |
| A2A signed-receipts/v1 SCITT profile | PLANNED | Before IETF 127 (Nov 14-20) |

CSOAI's founder is a published IETF SCITT contributor. The draft is cited in llms.txt and agent-card.json.

---

## Outreach Preparation

**Target:** At most 15 targeted, evidence-first contacts across:
1. Financial risk teams (stablecoin coverage)
2. Data providers (measurement infrastructure)
3. Agent infrastructure (MCP/A2A/x402 trust)

**Principles:**
- No bulk email, automated DMs, repeated directory submissions, or promotional bot replies
- Evidence-first: lead with measured facts, not claims
- Each contact gets distinct attribution ID

**Scale gate:** Only after evidence gates pass AND one of:
- One attributable outside buyer plus repeat intent; OR
- Two written pilot acceptances at stated price

**Current state:** No outreach sent. No outside buyers. No pilot acceptances. Revenue = zero.

---

## Revenue Claims

| Claim | Status |
|-------|--------|
| "Customer revenue" | FALSE — 0.02 USDC is a single probe, not customer revenue |
| "Paid pilots" | FALSE — zero |
| "External buyers" | FALSE — zero |
| "Revenue" | 0.02 USDC — below any meaningful threshold |

---

## Blockers

1. No external buyers
2. No pilot acceptances
3. Revenue = 0.02 USDC (effectively zero)
4. x402 test not executed (owner gate)
5. Outreach not sent (owner gate)

---

*TUI 6 — Revenue and Outside Signals | Branch: trust/anchor-completion-20260911*
