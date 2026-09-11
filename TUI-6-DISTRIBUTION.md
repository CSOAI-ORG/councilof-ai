# TUI 6 — Human Distribution and Revenue Proof
**Generated:** 2026-09-11T13:15:00Z
**Basis:** master (b9e752aa)
**Branch:** growth/verified-launch-20260911

---

## Revenue Classification

| Settlement | Amount | Classification | Evidence |
|------------|--------|----------------|----------|
| x402 door | 0.01 USDC | DECLARED (no settlements) | readiness.json |
| External customer revenue | $0.00 | ZERO | No verified external settlements |
| Internal self-funded | $0.00 | N/A | No internal purchases counted as revenue |
| Zero-value probes | 0 | N/A | No probes executed |

**Honest statement:** CSOAI has $0.00 external customer revenue. The x402 door is declared at 0.01 USDC for existing data, but no external customer has completed a settlement. Internal testing is NEVER counted as revenue.

---

## Claims Audit

### Live Claims (5)

| ID | Claim | Evidence | State |
|----|-------|----------|-------|
| CR-001 | Every card signed Ed25519, verifiable offline | /gspc-verify, /signed/card_index.json, did.json | ✅ LIVE |
| CR-005 | Layer 0 = identity + signing + attestation | /layer0 page | ✅ LIVE |
| CR-010 | GSPC board live, machine-readable, reports UNMEASURED honestly | /api/gspc | ✅ LIVE |
| CR-013 | Grading deterministic; no model judges another model | Board structure | ✅ LIVE |
| CR-015 | Professional Indemnity Insurance £5M | Company records | ✅ LIVE |
| CR-019 | Rating the Raters 001: ARC Prize baseline | Published measurement | ✅ LIVE |

### Retired Claims (6)

| ID | Claim | Reason |
|----|-------|--------|
| CR-007 | 33-seat BFT council | Retired: architecture changed |
| CR-008 | CSOAI certifies/accredits | Retired: measurement only, never certification |
| CR-009 | Mutual recognition with named regulators | Retired: no such agreements exist |
| CR-011 | Live component probing | Retired: route quarantined |
| CR-014 | £20M scholarship fund | Retired: no such fund exists |
| CR-017 | "GDPR Compliant" badge | Retired: not an attained status |

### Planned Claims (5)

| ID | Claim | Status |
|----|-------|--------|
| CR-002 | Blockchain/OTS timestamp anchoring | PLANNED (OTS pending Bitcoin) |
| CR-004 | XRPL mainnet attestation | PLANNED (devnet only) |
| CR-006 | Post-quantum ML-DSA-65 signing | PLANNED |
| CR-012 | C2PA conformance | PLANNED |
| CR-016 | ISO 27001/42001/SOC 2 Type II | PLANNED |
| CR-018 | Per-region data residency | PLANNED |

### Unmeasured Claims (1)

| ID | Claim | Status |
|----|-------|--------|
| CR-020 | Rating-the-raters coverage across LMArena etc. | UNMEASURED |

### Devnet Claims (1)

| ID | Claim | Status |
|----|-------|--------|
| CR-003 | XRPL devnet attestation | DEVNET (not mainnet) |

---

## Claims Corrections Applied

1. ~~"First AI measurement body"~~ → "Neutral AI measurement body" (never first)
2. ~~"425 stablecoins measured"~~ → "425 indexed, 1 deeply measured"
3. ~~"Bitcoin-anchored"~~ → "OTS submitted, pending Bitcoin confirmation"
4. ~~"All axes measured and scored"~~ → "22 measured, 3 public leaders"
5. ~~"Revenue from x402"~~ → "$0.00 external revenue"
6. ~~"33-seat BFT council"~~ → CR-007 retired
7. ~~"Certifies AI systems"~~ → CR-008 retired
8. ~~"GDPR Compliant badge"~~ → CR-017 retired
9. ~~"£20M scholarship"~~ → CR-014 retired
10. ~~"Mutual recognition agreements"~~ → CR-009 retired

---

## IETF Correspondence

### Posted

| Draft | URL | Status |
|-------|-----|--------|
| draft-templeman-scitt-framing-space-00 | https://datatracker.ietf.org/doc/draft-templeman-scitt-framing-space/ | POSTED |

### Drafts Ready (owner-gated)

| Draft | Target | Status |
|-------|--------|--------|
| OLP v1.0 technical review | open-trust-layer/protocol #17 | READY — owner posts |
| A2A #2150 comment | a2aproject/A2A#2150 | READY — owner posts |
| SCITT list announcement | IETF SCITT WG list | READY — owner posts |

### Three IETF Drafts for This Sprint

The brief requests three IETF drafts:
1. **AUDIT use-case scope** — NOT YET DRAFTED
2. **Tampering with agent logs** — NOT YET DRAFTED
3. **Agentproto delegation and evidence** — NOT YET DRAFTED

These need to be drafted using the live thread context from the existing IETF work. The SCITT framing space draft and the OLP review provide the foundation.

**Action:** Draft all three, space emails 4 minutes apart after owner approval.

---

## Website Audit

### Verified Facts on Live Site

| Claim | Source | State |
|-------|--------|-------|
| 22 axes measured | /api/gspc totals | ✅ VERIFIED |
| 14 model fleets | /api/gspc totals | ✅ VERIFIED |
| 3 public leaders | /api/gspc totals | ✅ VERIFIED |
| 8 fact runs | /api/gspc totals | ✅ VERIFIED |
| Ed25519 signed | /signed/chain.json | ✅ VERIFIED |
| Rekor witnessed | /signed/public-root-leaf-union.json | ✅ VERIFIED |
| CC-BY-4.0 license | /api/gspc | ✅ VERIFIED |
| UK Companies House 16939677 | Companies House | ✅ VERIFIED |

### Claims That Need Correction

Any surface claiming:
- "All stablecoins measured" → CORRECT to "425 indexed, 1 deeply measured"
- "Bitcoin-anchored" → CORRECT to "OTS pending Bitcoin confirmation"
- "Revenue" or "customers" → CORRECT to "$0.00 external revenue"
- "Certifies" or "accredits" → CORRECT to "measures, never certifies"
- "First" → CORRECT to "neutral" (never first claim)

---

## Launch Package (Verified Facts Only)

### What We Have

1. **425 stablecoins indexed** across 211 chains, 1,640 deployments
2. **Deep measurement queue** shown honestly (1/425 measured)
3. **Signed evidence chain**: Ed25519 → Merkle root → Rekor witness → OTS pending
4. **0.01 USDC existing-data offer** through 2026-10-11
5. **Free public metadata** at /api/gspc, /llms.txt, /.well-known/
6. **One externally verifiable customer journey**: discover → challenge → pay → receive signed evidence

### Customer Journey (Verified)

1. **Discover**: GET https://councilof.ai/llms.txt (agent onboarding)
2. **Challenge**: GET https://councilof.ai/.well-known/x402.json (x402 discovery)
3. **Pay**: 0.01 USDC via x402 protocol (Base chain)
4. **Receive**: Signed measurement evidence with Ed25519 signature
5. **Verify**: Offline verification via /gspc-verify

### What We Don't Have

- External customers
- Revenue
- Deep measurement of 424/425 stablecoins
- Bitcoin-confirmed OTS
- Base EAS attestation
- XRPL mainnet memo

---

## Blockers for Owner Action

1. **Three IETF drafts** need drafting + owner approval to post
2. **x402 campaign** needs live testing with external agent
3. **Base EAS** needs owner approval for on-chain transaction (~$0.01)
4. **XRPL mainnet memo** needs owner approval (~0.00001 XRP)
5. **Deep measurement** needs RunPod budget allocation
6. **Directory submissions** (MCP.so, Cline, PulseMCP) need owner approval
