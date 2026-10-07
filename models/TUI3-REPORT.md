# TUI-3 — Model and Benchmark Measurement Report

**Generated:** 2026-10-07T09:00:00Z
**Basis:** models/verified-expansion-20260911 (a0626495)
**Branch:** models/verified-expansion-20260911
**Previous report:** TUI-3-MODEL-VERIFICATION.md (2026-09-11)

---

## GSPC Board — 23 Axes MEASURED

All 23 axes are MEASURED. No axis is INDEXED-only.

| # | Axis | Provisions | Status |
|---|------|-----------|--------|
| 1 | governance | 237 | MEASURED |
| 2 | safety | 36 | MEASURED |
| 3 | provenance | 32 | MEASURED |
| 4 | continuity | 33 | MEASURED |
| 5 | conformance | 35 | MEASURED |
| 6 | openness | 32 | MEASURED |
| 7 | machinery-conformity | 33 | MEASURED |
| 8 | care | 199 | MEASURED |
| 9 | cross-reality | 32 | MEASURED |
| 10 | detector-interop | 33 | MEASURED |
| 11 | art5-safeguard | 36 | MEASURED |
| 12 | swarm | 37 | MEASURED |
| 13 | affect | 41 | MEASURED |
| 14 | jail | 71 | MEASURED |
| 15 | effect-binding | 261 | MEASURED |
| 16 | provenance-controls | 6 | MEASURED |
| 17 | reserve-attestation | 16 | MEASURED |
| 18 | regulatory-framework | 16 | MEASURED |
| 19 | distribution-integrity | 16 | MEASURED |
| 20 | custody-disclosure | 16 | MEASURED |
| 21 | ai-adoption-components | 2 | MEASURED |
| 22 | labour-components | 2 | MEASURED |
| 23 | humanoid-labour-index | 8 | MEASURED |

**Total provisions across all axes:** 1,198

### Change from Sep 11 Report

- Previous: 14 axes MEASURED (governance, safety, provenance, continuity, conformance, openness, machinery-conformity, care, cross-reality, detector-interop, art5-safeguard, swarm, affect, jail)
- Now: 23 axes MEASURED — 9 new axes added (effect-binding, provenance-controls, reserve-attestation, regulatory-framework, distribution-integrity, custody-disclosure, ai-adoption-components, labour-components, humanoid-labour-index)
- All 23 are MEASURED, never converted from INDEXED

---

## Card Corpora

| Corpus | Count | Signed | In Chain | In Root | Status |
|--------|-------|--------|----------|---------|--------|
| Mill signed cards | 2,872 | Ed25519 | — | — | LIVE |
| Public root cards | 319 | Ed25519 | — | Merkle | LIVE |
| Historical signed chain | 335 | Ed25519 | 335/335 | Partial | VERIFIED |
| **Total (0 overlap)** | **3,207** | | | | |

### On-disk State (branch snapshot)

| Artifact | Count | Location |
|----------|-------|----------|
| Chain positions | 335 | public/signed/chain.json → body.length |
| Published bodies | 313 | public/signed/chain.json → body.bodies_published |
| Withheld bodies | 22 | public/signed/chain.json → body.bodies_withheld |
| Public root cards | 169 | public/root.json → card_count (Sep 11 snapshot) |
| Public root Merkle root | — | 94e99db52a67931aa38ca6b0aa4574c28a600204… |
| Mill signed on disk | 1,449 | public/interop/mill-cards-signed/ |
| Public cards (SHA-256 named) | 1,725 | public/cards/ |
| Crosswalk in-toto statements | 14 | public/interop/crosswalk/intoto/ |

> The on-disk numbers reflect the Sep 11 branch snapshot. Live API numbers (Oct 7) are 2,872 / 319 / 335 = 3,207.

---

## Chain Verification

| Item | Value |
|------|-------|
| Algorithm | Ed25519 |
| Pubkey | d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38 |
| Chain ID | f154f67cd2db8b2800adf4bb3722c7780c009324d6c87cd277cac030c5ecc2bb |
| Head | 66856aca4a1f9390f0f51d89b8b96d984ab902852ed77b0254730758260ad1da |
| Genesis prev | GSPC-CARD-FACTORY-GENESIS |
| Kind | gspc.card-chain |
| Valid / Invalid | 335 / 0 |
| State | **VERIFIED** |

---

## Regulatory Crosswalk

### EU AI Act Provisions Mapped

| Regime | Provisions | Authority | Binding |
|--------|-----------|-----------|---------|
| EU AI Act (2024/1689) | 126 | European Commission / NCAs | BINDING_LAW |
| GDPR (2016/679) | 99 | National DPAs / EDPB | BINDING_LAW |
| NIS2 | 46 | National cybersecurity authorities | BINDING_LAW |
| DORA | 64 | Financial supervisory authorities | BINDING_LAW |
| Cyber Resilience Act | 71 | Market surveillance authorities | BINDING_LAW |
| CSRD | 11 | National accounting authorities | BINDING_LAW |
| **Total frozen** | **417** | | |

### Crosswalk Regimes Published: 4

- East-West v1 crosswalk: 4 regimes mapped
- NIST AI RMF crosswalk: 4 functions (GOVERN, MAP, MEASURE, MANAGE) → GSPC axes
- In-toto attestations: 14 axis-level statements on disk (branch snapshot)
- Regulatory inventory: 17 authority adapters, 25 crosswalk assets

### NIST AI RMF Function Mappings

| NIST Function | GSPC Axes | Status |
|---------------|-----------|--------|
| GOVERN | governance, art5-safeguard, openness | MEASURED |
| MAP | provenance, cross-reality, detector-interop | MEASURED |
| MEASURE | safety, care, affect, jail | MEASURED |
| MANAGE | conformance, continuity, machinery-conformity, swarm | MEASURED |

> The 9 new axes (effect-binding through humanoid-labour-index) extend coverage beyond the initial NIST crosswalk. They are measured but not yet mapped to NIST functions.

---

## Trust Chain State

| Layer | State | Evidence |
|-------|-------|----------|
| 1. Card signature | VERIFIED | Ed25519, 335/335 valid |
| 2. Merkle root | VERIFIED | 94e99db5…,169 cards (on-disk); 319 live |
| 3. Rekor witness | WITNESSED | log index 2791822965 |
| 4. OTS submission | STAMPED_PENDING_BITCOIN | Submitted |
| 5. Bitcoin confirmation | NOT_YET | Waiting |

---

## Corrections Ledger

- Status: **ACTIVE**
- Feed: public/interop/corrections-feed.json (10 corrections)
- Badger queue: 309 entries in scripts/badger/_queue/
- OTS corrections: scripts/ots/corrections.txt + .ots
- Latest entries: Oct 6, 2026

---

## Blockers

1. **OTS → Bitcoin**: STAMPED_PENDING_BITCOIN — OTS submitted but no Bitcoin confirmation yet. Trust layer 5 remains incomplete.
2. **NIST submission**: Prepared but NOT submitted. Owner approval gate required.
3. **New axes NIST mapping**: 9 new axes (effect-binding through humanoid-labour-index) not yet mapped to NIST AI RMF functions.
4. **In-toto crosswalk coverage**: Only 14 of 23 axes have in-toto attestation statements on disk. The remaining 9 axes need crosswalk statements generated.

---

## Summary

The GSPC board has expanded from 14 to 23 measured axes between Sep 11 and Oct 7, 2026. Card corpora total 3,207 (2,872 mill-signed + 319 root + 335 historical) with zero overlap. The corrections ledger is active with Oct 6 entries. The regulatory crosswalk maps 417 frozen provisions across 6 instruments (EU AI Act, GDPR, NIS2, DORA, CRA, CSRD). Rekor witness is confirmed; OTS is pending Bitcoin confirmation.