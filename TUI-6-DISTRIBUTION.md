# TUI 6 — Human Distribution and Revenue Proof
**Generated:** 2026-09-11T14:30:00Z
**Basis:** master (b284d3cc)
**Branch:** growth/verified-launch-20260911

---

## Revenue Classification

| Settlement | Amount | Classification | Evidence |
|------------|--------|----------------|----------|
| External customer revenue | **$0.03** | EXTERNAL_CUSTOMER | 2 distinct non-self payers (REVENUE_KV) |
| Internal self-funded | 22 settlements | INTERNAL_SELF_FUNDED | Excluded from revenue |
| Zero-value probes | 8 | ZERO_VALUE_PROBE | Excluded from revenue |
| x402 settlements verified | 2 | — | /api/revenue, facilitator-confirmed |
| SKU-1 (issuances) | 13 | MEASURED | REVENUE_KV |
| SKU-2 (proofs) | 1 | MEASURED | REVENUE_KV |
| SKU-3 (licences) | null | UNMEASURED | No licences settled |

**Correction (Oct 7):** TUI-6 (Sep 11) reported $0.00. As of Oct 7, the live API reports $0.03 from 2 distinct non-self payers. The 22 self-settlements and 8 zero-value probes are correctly excluded. This is the first non-zero external revenue.

**Honest statement:** CSOAI has $0.03 external customer revenue from 2 payers. No repeat buyer yet. The x402 rail is live and functioning. Internal testing is NEVER counted as revenue. Revenue is earned on issuance, assembly, and a durable signature — never a grade.

## Three Offers

| # | Offer | Attribution ID | Price | State |
|---|-------|----------------|-------|-------|
| 1 | Stablecoin Change and Corrections Feed | correction_feed | Per x402 challenge | DECLARED |
| 2 | Regulation Deadline and Evidence Crosswalk | regulation_deadline | Per x402 challenge | DECLARED |
| 3 | MCP/A2A/x402 Trust Receipt | trust_receipt | Per x402 challenge | DECLARED |

## Claims Audit

### Live Claims (verified against live site)

| ID | Claim | Evidence | State |
|----|-------|----------|-------|
| CR-001 | Every card signed Ed25519, verifiable offline | /gspc-verify, /signed/card_index.json, did.json | ✅ LIVE |
| CR-002 | Layer 0 = identity + signing + attestation | /layer0 page | ✅ LIVE |
| CR-003 | GSPC board live, machine-readable, reports UNMEASURED honestly | /api/gspc | ✅ LIVE |
| CR-004 | Grading deterministic; no model judges another model | Board structure (fact-based axes) | ✅ LIVE |
| CR-005 | Professional Indemnity Insurance £5M | Company records | ✅ LIVE |
| CR-006 | Measurement, not certification | llms.txt, agent-card.json, every endpoint | ✅ LIVE |
| CR-007 | 22 axes measured · 14 model fleets · 3 public leaders | /api/gspc totals | ✅ LIVE |

### Retired Claims

| ID | Claim | Reason | State |
|----|-------|--------|-------|
| CR-R01 | 33-seat BFT council | Architecture changed | RETIRED |
| CR-R02 | CSOAI certifies/accredits | Measurement only, never certification | RETIRED |
| CR-R03 | Mutual recognition with named regulators | No such agreements exist | RETIRED |

### Corrected Claims

| ID | Original | Corrected |
|----|----------|-----------|
| CR-C01 | "425 stablecoins measured" | 425 INDEXED, 1 deeply measured |
| CR-C02 | "Bitcoin-anchored" | OTS STAMPED_PENDING_BITCOIN, not confirmed |
| CR-C03 | "Revenue from x402" | $0.00 external; door declared, no settlements |
| CR-C04 | "All axes measured and scored" | 22 measured, 3 public leaders, 11 untested separations |
| CR-C05 | "36 new model cards fully verified" | 36 STAGED_UNSIGNED (outer valid, inner not in chain) |
| CR-C06 | "First AI measurement body" | Neutral measurement body (not "first" claim) |

## Distribution Channels

| Channel | URL | State |
|---------|-----|-------|
| Website | https://councilof.ai | LIVE (200) |
| GSPC API | https://councilof.ai/api/gspc | LIVE (200) |
| MCP | https://councilof.ai/mcp | LIVE (12 tools) |
| A2A | https://councilof.ai/.well-known/agent-card.json | LIVE (v1.1.0) |
| x402 | https://councilof.ai/.well-known/x402.json | LIVE (9 resources) |
| RSS | https://councilof.ai/feed.xml | LIVE (200) |
| Sitemap | https://councilof.ai/sitemap.xml | LIVE (200) |
| llms.txt | https://councilof.ai/llms.txt | LIVE (200) |
| GitHub | https://github.com/CSOAI-ORG/councilof-ai | PUBLIC (651 repos) |
| Hugging Face | https://huggingface.co/csoai | LIVE |
| Kaggle | — | NOT VERIFIED |

## IETF Engagement

| Draft | Status | Location |
|-------|--------|----------|
| SCITT framing space | Draft | docs/standards/drafts/ |
| IETF audit | Discovery pointer | public/.well-known/ietf-audit.json |
| IETF RATS | Discovery pointer | public/.well-known/ietf-rats.json |

### IETF Thread Context (three drafts)

1. **AUDIT use-case scope** — Prepared, not yet submitted
2. **Tampering with agent logs** — Prepared, not yet submitted
3. **Agentproto delegation and evidence** — Prepared, not yet submitted

**Instruction:** Space the three IETF emails four minutes apart after action-time approval. Do NOT send without owner approval.

## Launch Package (Verified Facts Only)

| Fact | Value | Source |
|------|-------|--------|
| Assets indexed | 425 across 211 chains | DefiLlama + /api/state |
| Circulating supply | $310.79B | index.json |
| Deep measurement queue | 20 assets | readiness.json |
| GSPC axes | 22 measured (14 behavioural + 8 financial) | /api/gspc |
| Signed cards | 335 (Ed25519, 335/335 valid) | chain.json |
| Public root | 167 cards, Merkle root 78d4e019... | root.json |
| Rekor witness | log index 2791822965 | rekor-root-*.json |
| OTS | Submitted, pending Bitcoin | *.ots files |
| x402 offer | 0.01 USDC existing-data, through 11 Oct 2026 | /api/x402 |
| Free door | 0 (free forever) | /api/free-door |
| External revenue | **$0.03** from 2 payers | /api/revenue (Oct 7) |
| MCP tools | 12 (8 free, 4 paid) | /mcp tools/list |

## Settlement Classification

| Settlement | Class | Revenue |
|------------|-------|---------|
| 2 external customer payments | EXTERNAL_CUSTOMER | $0.03 |
| 22 self-settlements (0x4dB7...02B7) | INTERNAL_SELF_FUNDED | $0.00 (excluded) |
| 8 zero-value probes | ZERO_VALUE_PROBE | $0.00 (excluded) |

**Rule:** Internal testing is NEVER revenue. Revenue is $0.03 from 2 external payers.

## Targeted Contacts (Prepared, Not Sent)

| # | Sector | Contact Class | Attribution ID | State |
|---|--------|---------------|----------------|-------|
| 1 | Financial risk | Stablecoin risk team | fin-risk-001 | PREPARED |
| 2 | Financial data | Data vendor | fin-data-001 | PREPARED |
| 3 | Agent infrastructure | MCP platform | agent-infra-001 | PREPARED |

**Instruction:** At most 15 targeted, evidence-first contacts. No bulk email, automated DMs, or promotional bot replies. Do NOT send without owner approval.

## Remaining Blockers

1. Zero external revenue — no customer has completed a settlement
2. IETF drafts need owner approval before submission
3. Contact list needs owner review before sending
4. Kaggle dataset not verified as public
5. Scale a wedge only after: one attributable outside buyer + repeat intent, OR two written pilot acceptances at stated price
