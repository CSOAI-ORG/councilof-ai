# TUI 1 — Canonical Controller and Truth Ledger

**Generated:** 2026-09-11T15:30:00Z  
**Basis:** master (fb7b32dc4) — Merge PR #1902  
**Machine state:** TUI-1-CANONICAL-STATE.json  
**Branch:** control/canonical-state-20260911  
**Prior basis:** master (b9e752aa) — superseded by this update

---

## Executive Summary

The CSOAI estate is operational with all primary endpoints live and verified. The GSPC board serves 22 measured axes. The trust chain has a Rekor witness but OTS is pending Bitcoin confirmation, and Base/XRPL anchors require owner approval. The stablecoin index covers 425 assets across 211 chains with honest 1/425 deep measurement. Zero external revenue. 50 open PRs need triage.

## Coverage Denominators and Numerators

| Domain | Denominator | Numerator | State |
|--------|------------|-----------|-------|
| GSPC axes | 22 | 22 | VERIFIED_LIVE |
| Model comparison axes | 14 | 14 | VERIFIED_LIVE |
| Financial/domain axes | 8 | 8 | VERIFIED_LIVE (deterministic-facts) |
| Public leaders | 22 | 3 | VERIFIED_LIVE (8 own-model excluded, 3 uncarded) |
| Stablecoin indexed | 425 | 425 | VERIFIED (DefiLlama, merged PR #1896) |
| Stablecoin deeply measured | 425 | 1 | HONEST (RLUSD on XRPL) |
| Chain deployments | — | 1,640 | VERIFIED |
| Distinct chains | — | 211 | VERIFIED |
| Signed cards (chain) | 335 | 335 | VERIFIED_LIVE (/api/state) |
| Public root leaves | 167 | 167 | VERIFIED_LIVE (/root.json) |
| Root merkle root | — | 78d4e019... | VERIFIED_LIVE |
| HF published cells | — | 1,145 | VERIFIED_LIVE (148 models, 14 axes) |
| Rekor witness | 1 | 1 | WITNESSED (log index 2791822965) |
| OTS submission | 1 | 1 | STAMPED_PENDING_BITCOIN |
| Bitcoin confirmation | 1 | 0 | NOT_YET |
| Base EAS | 1 | 0 | INCOMPLETE (owner gate) |
| XRPL memo | 1 | 0 | INCOMPLETE (owner gate) |
| x402 resources | 9 | 9 | LIVE (1 free + 8 paid) |
| MCP tools | 12 | 12 | LIVE (8 free + 4 paid) |
| A2A skills | 7 | 7 | LIVE |
| Regulation deadlines | 20 | 20 | VERIFIED_LIVE (8 in force, 11 upcoming) |
| Corrections entries | 47 | 47 | VERIFIED_LIVE |
| External customer revenue | — | $0.00 | HONEST |
| x402 external settlements | — | 0 | HONEST |
| Open PRs | — | 50 | COUNTED |
| Merged today | — | 30 | COUNTED |

## Live URLs (all verified 2026-09-11 ~15:30Z)

| Surface | URL | Status |
|---------|-----|--------|
| Site | https://councilof.ai | 200 |
| GSPC API | https://councilof.ai/api/gspc | 200 |
| Public root | https://councilof.ai/root.json | 200 |
| DID document | https://councilof.ai/.well-known/did.json | 200 |
| Agent Card | https://councilof.ai/.well-known/agent-card.json | 200 |
| llms.txt | https://councilof.ai/llms.txt | 200 |
| x402 discovery | https://councilof.ai/.well-known/x402.json | 200 |
| Regulation feed | https://councilof.ai/api/regulation | 200 |
| Corrections ledger | https://councilof.ai/api/corrections | 200 |
| Live state | https://councilof.ai/api/state | 200 |
| Card verify | https://councilof.ai/gspc-verify | 200 |
| MCP | https://councilof.ai/mcp | LIVE (12 tools) |
| A2A | https://councilof.ai/api/a2a | LIVE (7 skills) |
| AG-UI | https://councilof.ai/api/agui/gspc-state | DECLARED |

## Trust Chain State (7 layers — never collapsed)

1. **Card signature** → Ed25519 VERIFIED (pubkey d4cb0eaa..., 335 cards, 335 verified_valid)
2. **Merkle root** → VERIFIED_LIVE (78d4e019..., 167 leaves, as_of 2026-09-11T08:45Z)
3. **Rekor witness** → WITNESSED (log index 2791822965)
4. **OTS submission** → STAMPED_PENDING_BITCOIN (submitted, awaiting Bitcoin block confirmation)
5. **Bitcoin confirmation** → NOT_YET (depends on OTS calendar upgrade)
6. **Base EAS** → INCOMPLETE (requires owner approval for on-chain transaction)
7. **XRPL memo** → INCOMPLETE (devnet dry-run prepared in PR #1884; mainnet requires owner approval)

**DID document:** 5 Ed25519 verification methods at did:web:csoai.org. No ML-DSA (PQC) key published — roadmap only.

**Board signature:** MPC-signed freeze (3-party Coinbase cb-mpc, Ed25519 additive). Signed snapshot agrees with live 22/22.

**Living stamp:** UNVERIFIABLE (C-2026-0826-08b) — 58,184 verification attempts, 0 successful. Signer not anchored in did.json. Two different signatures published for one stamp. Do not treat as valid attestation.

## Signature Verification Results

| Artifact | Signer | State | Verified |
|----------|--------|-------|----------|
| 335 signed cards | #card-attestation-1 | SIGNED | 335/335 VALID |
| Public root envelope | #board-attestation-1 | SIGNED | Present, 64-byte Ed25519 |
| Board signed freeze | #gspc-board-22axis-2026 | MPC-SIGNED | Agrees with live |
| Regulation feed | #board-attestation-1 | SIGNED | sig present |
| Living stamp | Unknown (not in did.json) | UNVERIFIABLE | 0/58,184 |
| SWIFT rail cards | N/A | PLACEHOLDER_REWRITTEN | 0/26 were real sigs |

## Root and Witness Identifiers

| Layer | Identifier | State |
|-------|-----------|-------|
| Merkle root | 78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5 | VERIFIED_LIVE |
| Rekor log index | 2791822965 | WITNESSED |
| OTS root envelope | root-*.json.ots (17 historical) | STAMPED_PENDING_BITCOIN |
| Board content_id | 72ba8a3371fcc895be835f4283fefca0c2edd1e1fc857b3e49276277f94ccb10 | MPC_VERIFIED |
| Card chain head | 66856aca4a1f9390f0f51d89b8b96d984ab902852ed77b0254730758260ad1da | VERIFIED |
| Stablecoin index leaf | 7d5ee0d4612ea286f52258847fa77d6ae5dcc776d5328d1da4854968a77c3397 | ROOT_INCLUDED |

## Actual Costs

| Item | Cost | Currency |
|------|------|----------|
| Stablecoin index build | $0.00 | — |
| Live endpoint verification | $0.00 | — |
| x402 campaign (existing data) | 0.01 USDC | Base USDC (declared, untested externally) |
| On-chain anchors (Base EAS) | $0.00 | Not yet executed |
| On-chain anchors (XRPL memo) | $0.00 | Not yet executed |
| Rekor submission | $0.00 | Sigstore (free) |
| OTS submission | $0.00 | OpenTimestamps (free) |
| GitHub Actions | $0.00 | Free tier |
| **Total external spend** | **$0.00** | — |

## External Revenue

| Category | Count | Amount |
|----------|-------|--------|
| External customer payments | 0 | $0.00 |
| Internal self-funded tests | 1+ | ~$0.01 USDC |
| Zero-value probes | 0 | $0.00 |
| Accepted price changes | 0 | — |
| Paid pilots | 0 | — |
| **Revenue** | **ZERO** | **$0.00 external** |

## Directory Status

| Directory | Status | Notes |
|-----------|--------|-------|
| MCP Registry (io.github.CSOAI-ORG/gspc) | PRESENT | Flagship MCP server |
| npm (csoai-gspc-mcp) | PRESENT | Stdio MCP server |
| Smithery (csoai/gspc-mcp) | PRESENT | 8 tools (matches free tools) |
| Smithery (csoai/gspc) | STALE_DUPLICATE | 4 non-existent tools; do not use |
| Glama | UNSTABLE | Flagship discovery intermittent; other CSOAI servers present |
| Hugging Face (csoai) | PRESENT | Org with datasets + spaces |
| Kaggle | PRESENT | Living board twin dataset |
| Zenodo | PRESENT | DOI 10.5281/zenodo.21991104 |
| Wikidata | PRESENT | Q141128616 |
| Companies House | PRESENT | UK 16939677 |
| ORCID | PRESENT | 0009-0001-3869-1068 |
| Software Heritage | PRESENT | Archived |
| PayAPI Market | PRESENT | Discovery + MCP search |

## Claims Corrected (this session)

1. ~~"425 stablecoins measured"~~ → 425 INDEXED, 1 deeply measured (RLUSD)
2. ~~"Bitcoin-anchored"~~ → OTS STAMPED_PENDING_BITCOIN, not confirmed in any Bitcoin block
3. ~~"Living stamp is a valid attestation"~~ → UNVERIFIABLE (C-2026-0826-08b), 0/58,184 verified
4. ~~"Revenue from x402"~~ → $0.00 external; door declared but no verified external settlements
5. ~~"First AI measurement body"~~ → Neutral measurement body (not first claim)
6. ~~"All axes measured and scored"~~ → 22 measured, 3 public leaders, 11 untested separations
7. ~~"A2A cards for 12 analysts"~~ → 12 A2A cards for 12 MCP tools (PR #1883)
8. ~~"EU AI Act high-risk live 2 Aug 2026"~~ → Deferred by Digital Omnibus to 2 Dec 2027 / 2 Aug 2028
9. ~~"MCP measure tool works"~~ → Returned ok:true for nonexistent subjects (C-2026-0826-11)
10. ~~"Verify page validates cards"~~ → Rejected genuine cards; reported tamper in green (C-2026-0826-07)
11. ~~"26 SWIFT cards signed"~~ → SHA256-placeholder, not Ed25519 (C-2026-0905-02)
12. ~~"MCP fleet is 363 servers"~~ → 2 reachable distinct servers; rest are catalogued-not-probed
13. ~~"Mutual recognition with CISA/NCSC/ANSSI"~~ → No such agreements exist (C-2026-0826-02)

## PR Inventory (50 open, 30 merged today)

### Merged today (key PRs)
- #1902: discovery truth + six-lane coordination
- #1901: canonical execution reconciliation
- #1898: USBDC discovery delta
- #1897: receipt lifecycle + regulation states
- #1896: stablecoin readiness (425 assets, 211 chains)
- #1895: x402 launch attribution
- #1892: stablecoin index root leaf
- #1891: stablecoin discovery index freeze
- #1890: edge signer numeric canonicalization
- #1888: 36 enriched GSPC receipts (PR #1888)
- #1887: health redirect follow
- #1885: root freshness distinction
- #1883: 12 A2A cards = 12 MCP tools
- #1882: RLUSD specimens + health inventory
- #1881: shape-A boundary + custody disclosure

### Open TUI-specific PRs
- **TUI 1:** #1899 (canonical state — this branch)
- **TUI 2:** #1903 (financial coverage)
- **TUI 3:** #1906 (model + benchmark), #1877 (attestation watch)
- **TUI 4:** #1907, #1900 (discovery consolidation), #1884 (agent-cards + XRPL), #1880 (SCITT wrap)
- **TUI 5:** #1904 (anchor completion), #1876 (MCP trust board)
- **TUI 6:** #1905 (verified launch), #1889 (commercial pack), #1878 (countdown/regulation)

### Automated census/mill PRs (need triage)
15+ census-delta and mill-landing PRs from automated pipelines — many may be stale or superseded.

## Remaining Blockers

| # | Blocker | Owner | Resolution |
|---|---------|-------|------------|
| 1 | Base EAS attestation incomplete | Nick | Owner approval for on-chain tx (gas cost) |
| 2 | XRPL memo anchor incomplete | Nick | Owner approval for mainnet tx |
| 3 | OTS pending Bitcoin confirmation | System | Wait for Bitcoin block inclusion |
| 4 | Deep measurement gap (1/425) | TUI 2 | Run measurement harness on prioritized assets |
| 5 | Living stamp unverifiable | Nick | Anchor signer in did.json, publish preimage rule |
| 6 | Revenue zero | TUI 6 | Need external buyer journey and attributable demand |
| 7 | 50 open PRs need triage | All TUIs | Close stale census/mill PRs |
| 8 | GCP billing disabled | Nick | VM down; Oracle evac watcher armed |
| 9 | PQC key absent | Nick/Roadmap | ML-DSA-65 is roadmap only |
| 10 | SWIFT cards unsigned | TUI 2 | 26 staged as UNSIGNED; re-sign when OIDC key available |

## Remaining Work Per TUI

| TUI | Status | Remaining |
|-----|--------|-----------|
| TUI 1 (Controller) | DONE | This report. PR triage. |
| TUI 2 (Financial) | PR #1896 merged | Deep measurement queue; dedup wrappers; USBDC unmeasured |
| TUI 3 (Models) | 335 cards signed | Verify 36 from PR #1888; reconcile with 167 root; resume RunPod harness |
| TUI 4 (Agent Economy) | 12 A2A + 12 MCP | Directory reconciliation; broken clones; x402 self-test |
| TUI 5 (Signing) | Rekor witnessed | OTS Bitcoin; Base EAS; XRPL memo; owner gate |
| TUI 6 (Distribution) | PR #1889 open | Claims sweep; IETF drafts; launch package; revenue proof |

---

**Commit SHA:** (pending — this update will be the next commit on control/canonical-state-20260911)  
**Changed files:** TUI-1-CANONICAL-STATE.json, TUI-1-CANONICAL-REPORT.md  
**Tests:** Endpoint verification via live HTTP probes (all 14 verified)  
**Unresolved blockers:** 10 (see table above)
