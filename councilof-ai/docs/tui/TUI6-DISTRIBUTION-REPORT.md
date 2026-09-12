# TUI 6 — Distribution, Revenue and Human Awareness — REPORT
## Date: 2026-09-12

---

## Executive Summary

**TUI 6 audited distribution surfaces, revenue state, outreach readiness and attribution.**

All7 distribution surfaces are live. The x402 payment rail is live on Base (eip155:8453). One self-funded settlement exists (0.01 USDC, classified as INTERNAL_SELF_FUNDED).26 outreach contacts are prepared but all HOLD until endpoints return 200. Revenue from external customers is zero.

### Verified Baseline

| Surface | Status | Size |
|---------|--------|------|
| feed.xml | LIVE | 8,107 bytes |
| sitemap.xml | LIVE | 85,947 bytes |
| llms.txt | LIVE | 16,139 bytes |
| agent-card.json | LIVE | 11,049 bytes |
| did.json | LIVE | 5,059 bytes |
| x402.json | LIVE | 12,380 bytes |
| scitt.json | LIVE | 3,132 bytes |
| robots.txt | LIVE | 5,922 bytes |

### Revenue State

| Metric | Value |
|--------|-------|
| External customer revenue | **$0** |
| Self-funded settlements | 1 (0.01 USDC on Base) |
| Settlement classification | INTERNAL_SELF_FUNDED |
| Settlement txHash | 0x60172f43ca... |
| Settlement date | 2026-09-11T13:30:53Z |
| x402 rail mode | LIVE |
| x402 network | eip155:8453 (Base) |
| Free door | LIVE (api/free-door) |
| Paid resources | 8 (2 issuance + 6 assembly) |

---

## 1. Three Offers — Mapped to x402 Resources

### Offer 1: Stablecoin Change and Corrections Feed

| Resource | URL | Price |
|----------|-----|-------|
| RWA asset evidence | /api/rwa/evidence?asset=RLUSD | issuance |

### Offer 2: Regulation Deadline and Evidence Crosswalk

| Resource | URL | Price |
|----------|-----|-------|
| Evidence bundle | /api/evidence-bundle?obligation=article-50&bundle=1 | assembly |
| Signed data feed | /api/eunomia-data?feed=1 | assembly |
| Art.50 marking evidence | /api/art50/marking-evidence?url=... | assembly |

### Offer 3: MCP/A2A/x402 Trust Receipt

| Resource | URL | Price |
|----------|-----|-------|
| Request attestation | /api/request-attestation?subject=... | issuance |
| Inclusion proof | /api/proof?bundle=1 | assembly |
| Historical batch | /api/receipts/batch?from=... | assembly |

### Free Door

| Resource | URL | Price |
|----------|-----|-------|
| Free door | /api/free-door | $0 |

---

## 2. Outreach Contacts — 26 Prepared

### Segment Summary

| Segment | Description | Contacts | Status |
|---------|-------------|----------|--------|
| A | EU-facing generative-AI providers (Art 50) | 8 | DRAFT — HOLD |
| B | Grants / public-good submissions | 4 | DRAFT — HOLD |
| C | Commissioned attestation (insurers, auditors) | 4 | DRAFT — HOLD |
| D | Distribution / partnership | 1 | DRAFT — HOLD |
| E | Signed feed licence (GRC platforms) | 7 | DRAFT — HOLD |
| Posted | FedRAMP RFC comment | 1 | POSTED 2026-09-04 |

### Contact List

| # | Contact | Segment | Status |
|---|---------|---------|--------|
| 01 | Armilla AI | C | DRAFT — HOLD until endpoint 200 |
| 02 | AIUC/Schellman | C/E | DRAFT — HOLD until endpoint 200 |
| 03 | Munich Re aiSure | C | DRAFT — HOLD until endpoint 200 |
| 04 | Relm Insurance | A+C | DRAFT — HOLD until endpoint 200 |
| 05 | Enzai | E | DRAFT — HOLD until endpoint 200 |
| 06 | Vanta | E | DRAFT — HOLD until endpoint 200 |
| 07 | Drata | E | DRAFT — HOLD until endpoint 200 |
| 08 | Credo AI | E | DRAFT — HOLD until endpoint 200 |
| 09 | Paramify/RegScale | E | DRAFT — HOLD until endpoint 200 |
| 10 | Epoch AI | C | DRAFT — HOLD until endpoint 200 |
| 11 | Black Forest Labs | A | DRAFT — HOLD until endpoint 200 |
| 12 | Mistral AI | A | DRAFT — HOLD until endpoint 200 |
| 13 | Photoroom | A | DRAFT — HOLD until endpoint 200 |
| 14 | Kittl | A | DRAFT — HOLD until endpoint 200 |
| 15 | Argil | A | DRAFT — HOLD until endpoint 200 |
| 16 | ElevenLabs | A | DRAFT — HOLD until endpoint 200 |
| 17 | Synthesia | A | DRAFT — HOLD until endpoint 200 |
| 18 | Stability AI | A | DRAFT — HOLD until endpoint 200 |
| 20 | Stellar Community Fund | B | DRAFT — HOLD |
| 21 | Circle Developer Grants | B/D | DRAFT — HOLD |
| 22 | Arbitrum Questbook | B | DRAFT — HOLD |
| 23 | XRPL Grants | B | BLOCKED — no form |
| 24 | FedRAMP RFC-0032 | E/D | POSTED 2026-09-04 |
| 25 | Armilla partner form | C/E | DRAFT — HOLD |
| 26 | AIUC-1 contributor form | E | DRAFT — HOLD |

---

## 3. Distribution Metrics

### Hugging Face

| Metric | Value |
|--------|-------|
| Datasets | 100+ |
| Spaces | 39 |
| Collections | 7 |
| Total downloads (top5) | 12,281 |
| Top dataset | gspc-boards (4,383 downloads) |

### Kaggle

| Metric | Value |
|--------|-------|
| Active datasets | 2 |
| csoai-gspc-living-board | 68 downloads |
| csoai-stablecoin-index-reproducibility | NEW |

### GitHub

| Metric | Value |
|--------|-------|
| Public repos | 651 |
| Followers | 8 |
| Pinned repos | 6 (MCP repos) |
| councilof-ai stars | 1 |
| gspc-board stars | 1 |

---

## 4. Revenue Classification

| Settlement | Amount | Classification | Evidence |
|------------|--------|----------------|----------|
| 0x60172f43ca... | 0.01 USDC | INTERNAL_SELF_FUNDED | self=true, payer=payTo address |

**Revenue from external customers: $0**

The self-settlement proves the x402 plumbing works end-to-end:
- Discovery: x402.json is live
- Price challenge: 402 response with payment required
- Settlement: USDC on Base (eip155:8453)
- Delivery: Signed receipt JWS
- Attribution: self=true flag
- Replay: receipt verifiable via /api/receipts/verify

---

## 5. Claims Rejected or Corrected

| Claim | Correction |
|-------|------------|
| "Revenue from settlement" | INTERNAL_SELF_FUNDED — self-payment, not external revenue |
| "28 outreach contacts sent" | 26 prepared, 0 sent (all HOLD until endpoint 200) |
| "IndexNow submitted" | No IndexNow endpoint (404) |
| "Google Search Console verified" | No verification file (404) |
| "All endpoints 200" | x402 endpoints return 402 (paid) — correct behavior |

---

## 6. Unresolved Blockers

| Blocker | Severity | Owner Action |
|---------|----------|--------------|
| Outreach contacts all HOLD | P1 | Endpoints need to return 200 for paid resources |
| No external revenue | P1 | Send outreach after endpoints verified |
| IndexNow not submitted | P2 | Submit sitemap to IndexNow |
| Google Search Console not verified | P2 | Add verification meta tag |
| XRPL grants blocked (no form) | P2 | Monitor for form availability |
| HF canonical collection missing top2 datasets | P2 | Add gspc-boards + gspc-hub-cards |

---

## 7. Cost Accounting

| Item | Cost | Funding Source |
|------|------|----------------|
| x402 self-test | 0.01 USDC | CSOAI own wallet |
| Distribution surfaces | $0 | Free public URLs |
| HF/Kaggle/GitHub | $0 | Free platforms |
| **Total actual spend** | **0.01 USDC** | Self-funded |
| **External revenue** | **$0** | No external customers |

---

## 8. Tests Run

1. ✅ feed.xml live (8,107 bytes, HTTP 200)
2. ✅ sitemap.xml live (85,947 bytes, HTTP 200)
3. ✅ llms.txt live (16,139 bytes, HTTP 200)
4. ✅ agent-card.json live (11,049 bytes, HTTP 200)
5. ✅ did.json live (5,059 bytes, HTTP 200)
6. ✅ x402.json live (12,380 bytes, HTTP 200)
7. ✅ scitt.json live (3,132 bytes, HTTP 200)
8. ✅ robots.txt live (5,922 bytes, HTTP 200)
9. ✅ x402 rail mode LIVE
10. ✅ Free door returns 200
11. ✅ Paid resources return 402
12. ✅ Self-settlement recorded (0.01 USDC, INTERNAL_SELF_FUNDED)
13. ✅ Receipt JWS signed by board-attestation-1
14. ✅26 outreach contacts prepared
15. ✅5 segments defined with artefact mapping
16. ✅ No ambiguous revenue claims
17. ✅ Revenue classified as INTERNAL_SELF_FUNDED

---

## 9. Today's Success Condition

> "Every published measurement has a discovery path, clear free value, a paid next step and measurable attribution."

| Requirement | Status |
|-------------|--------|
| Discovery path | ✅ feed.xml, sitemap, llms.txt, HF, Kaggle, GitHub |
| Free value | ✅ Free door (api/free-door), board, verify, lookup |
| Paid next step | ✅ x402 resources (8 paid doors) |
| Measurable attribution | ⚠️ No IndexNow, no Google Search Console, no external analytics |

---

*Measurement, not certification. Revenue is zero from external customers. Self-settlement proves plumbing only.*
