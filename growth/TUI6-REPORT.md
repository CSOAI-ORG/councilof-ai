# TUI-6 — Human Distribution and Revenue Proof (Oct 7 2026 Refresh)

**Generated:** 2026-10-07T04:30:00Z
**Branch:** growth/verified-launch-20260911
**Prior:** TUI-6 (Sep 11) + TUI-5 (Sep 13)

---

## Revenue — Verified Live Oct 7

Source: `GET https://councilof.ai/api/revenue` (REVENUE_KV settled:tx:* records)

| Metric | Value | Source |
|--------|-------|--------|
| External customer revenue | **$0.03 USDC** | REVENUE_KV (30000 atomic, 6dp on Base) |
| Distinct non-self payers | **2** | REVENUE_KV settled:tx:* |
| Repeat non-self payers | **0** | No wallet settled twice with non-zero amount |
| Self-settlements | 22 | EXCLUDED (INTERNAL_SELF_FUNDED) |
| Zero-value settlements | 8 | EXCLUDED (ZERO_VALUE_PROBE) |
| Records unreadable | 0 | — |

### SKU Breakdown

| SKU | Count | Status | Source |
|-----|-------|--------|--------|
| SKU-1 (issuances) | 13 | MEASURED | REVENUE_KV |
| SKU-2 (proofs) | 1 | MEASURED | REVENUE_KV |
| SKU-3 (licences) | null | UNMEASURED | counters.json |

### Settlement Classification

| Class | Count | Revenue |
|-------|-------|---------|
| EXTERNAL_CUSTOMER | 2 | $0.03 |
| INTERNAL_SELF_FUNDED | 22 | $0.00 (excluded) |
| ZERO_VALUE_PROBE | 8 | $0.00 (excluded) |

### Payer Doors

| Door | Payers |
|------|--------|
| art50/marking-evidence | 1 |
| eunomia-data?feed=1 | 1 |

### Correction from TUI-6 (Sep 11)

TUI-6 reported $0.00 external revenue and 0 settlements. As of Oct 7, the live API reports **$0.03 from 2 distinct non-self payers**. The 22 self-settlements and 8 zero-value probes are correctly excluded. This is the first non-zero external revenue.

### Revenue Gates

| Gate | Status | Meaning |
|------|--------|---------|
| 0 for 30 days | NOT TRIGGERED | Revenue exists; shape/price may be right |
| ≥1 repeat | NOT MET | 0 repeat payers |
| ≥5 distinct in 30d | NOT MET | 2 distinct payers |

**Honest statement:** CSOAI has $0.03 external customer revenue from 2 payers. No repeat buyer yet. The scale gate (≥1 repeat OR ≥5 distinct in 30d) is not met. Revenue is earned on issuance, assembly, and a durable signature — never a grade.

---

## Claims Register — Verified Oct 7

Source: `public/claims-register.json` (20 claims total)

| Status | Count | IDs |
|--------|-------|-----|
| Live | 6 | CR-001, CR-005, CR-010, CR-013, CR-015, CR-019 |
| Retired | 6 | CR-007, CR-008, CR-009, CR-011, CR-014, CR-017 |
| Planned | 6 | CR-002, CR-004, CR-006, CR-012, CR-016, CR-018 |
| Devnet | 1 | CR-003 |
| Unmeasured | 1 | CR-020 |

### Live Claims

| ID | Claim | Evidence |
|----|-------|----------|
| CR-001 | Every card signed Ed25519, verifiable offline | /gspc-verify, /signed/card_index.json, did.json |
| CR-005 | Layer 0 = identity + signing + attestation | /layer0 |
| CR-010 | GSPC board live, machine-readable, reports UNMEASURED honestly | /api/gspc, /gspc-verify |
| CR-013 | Grading deterministic; no model judges another model | /methodology |
| CR-015 | Professional Indemnity Insurance £5M | /trust-center |
| CR-019 | Rating the Raters 001: ARC-AGI-2 recomputed | /rating-the-raters |

### Retired Claims (with reason)

| ID | Claim | Reason |
|----|-------|--------|
| CR-007 | 33-seat BFT council | Retracted under DR-0007; rho=1, n_eff=1 |
| CR-008 | CSOAI certifies/accredits | Measurement only, never certification |
| CR-009 | Mutual recognition with named regulators | No such agreements exist |
| CR-011 | Live component probing on /status | Route quarantined for content review |
| CR-014 | £20M scholarship fund | Never existed on any surface |
| CR-017 | "GDPR Compliant" badge | Reworded to self-assessed posture |

---

## GSPC Board — Verified Live Oct 7

Source: `GET https://councilof.ai/api/gspc` (totals)

| Metric | Value |
|--------|-------|
| Total axes | 23 |
| Measured axes | 23 (0 unmeasured) |
| Model comparisons | 14 |
| Fact runs | 9 |
| Separated leads | 0 |
| Ties | 7 |
| Untested separations | 7 |
| Public leaders | 9 (externally led) |
| Own leaders excluded | 8 (on 8 axes) |
| Items (rows behind board) | 1,230 |
| Model fleets | 14 |
| Mean accuracy (leader) | 0.6505 |
| Mean fleet mean | 0.5447 |

### Living Stamp Status

**UNVERIFIABLE** (C-2026-0826-08). 58,184 reproduction attempts, 0 verified. Two conflicting signatures, signer not in did.json, axes re-snapshotted after signature date. Published at `/corrections/living-stamp-unverifiable.json`.

---

## Distribution Surfaces — Verified Oct 7

| Surface | URL | Status | Evidence |
|---------|-----|--------|----------|
| Website | councilof.ai | LIVE | Cloudflare Pages |
| GSPC API | councilof.ai/api/gspc | LIVE (200) | Verified via curl |
| A2A agent card | /.well-known/agent-card.json | LIVE (200, a2a+json) | Verified via curl |
| x402 discovery | /.well-known/x402.json | LIVE (200) | Verified via curl |
| llms.txt | /llms.txt | LIVE (200) | Verified via curl |
| OpenAPI | /openapi.json | LIVE | 98 paths, 126 operations |
| Revenue API | /api/revenue | LIVE | Returns MEASURED data |
| Corrections | /api/corrections | ACTIVE | Living stamp correction Oct 6 |

### External Platforms

| Platform | State | Notes |
|----------|-------|-------|
| GitHub | PUBLIC | 651 repos (CSOAI-ORG) |
| Hugging Face | LIVE | huggingface.co/csoai |
| Kaggle | NOT VERIFIED | Not confirmed public |
| PyPI | 68 packages | csoai-* namespace |
| Glama | 333 indexed (66 official) | MCP directory |
| MCP Registry | 500 indexed, 238 runnable | mcp-server-search |

### Zenodo — BLOCKED

DOI 10.5281/zenodo.21991104 has been **UNAVAILABLE** since Sep 29, 2026. Account blocked by Zenodo as spam after bulk-published 54 datasets at ~15-second intervals. Appeal pending. DOIs are kept as permanent names; no surface links them as available. Correction: C-2026-0929-09.

---

## Corrections Ledger — Active

Source: `public/corrections/`

| ID | Subject | Date | Status |
|----|---------|------|--------|
| C-2026-0826-08 | Living board stamp UNVERIFIABLE | 2026-08-26 (restated 08-28) | Published |

The corrections ledger is live and append-only. Every defect found is published, never hidden.

---

## PR Status

| PR | Title | State | CI |
|----|-------|-------|----|
| #1888 | mill: stage 36 enriched GSPC receipts | MERGED | — |
| #2847 | TUI-1 v2: canonical state rebuild — 26-day gap closed | OPEN | All 11 checks SUCCESS |

---

## Remaining Blockers

1. **Revenue at $0.03** — 2 payers, 0 repeats. Scale gate not met.
2. **Zenodo blocked** — appeal pending since Sep 29.
3. **Living stamp unverifiable** — needs re-sign with published key.
4. **Kaggle** — not verified as public.
5. **IETF drafts** — prepared, not submitted (owner approval required).
6. **Outreach contacts** — prepared, not sent (owner approval required).

---

## Honest Assessment

CSOAI has moved from $0.00 to $0.03 in external revenue. This is real but not a product. The x402 rail works. Two strangers paid. Neither paid twice. The board measures 23 axes honestly, reports UNMEASURED where it has nothing, and corrects its own defects publicly. The claims register is clean: 6 live, 6 retired with reasons, 6 planned and labelled planned, 1 devnet, 1 unmeasured.

The next honest milestone is a repeat buyer or 5 distinct payers in 30 days.