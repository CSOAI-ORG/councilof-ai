# TUI 1 — Canonical Controller and Truth Ledger
**Generated:** 2026-09-11T14:30:00Z
**Basis:** master (b284d3cc)
**Verification:** Live HTTP probes + file-system audit of origin/master
**Canonical authority:** https://councilof.ai/api/state
**Machine state:** TUI-1-CANONICAL-STATE.json

---

## Executive Summary

The CSOAI estate is operational. All declared endpoints return HTTP 200 (or 402 for x402 challenge). The GSPC board carries 22 measured axes with3 public leaders. The trust chain has Ed25519 signatures (335 cards, 0 invalid), a public Merkle root (167 cards), and a Rekor witness (log index 2791822965). OTS is submitted and awaiting Bitcoin confirmation. Base EAS and XRPL memo anchors are prepared but require owner wallet signatures. External revenue is $0.00.

## Verified Baseline (all from live endpoints or committed artifacts)

| Metric | Value | Source | State |
|--------|-------|--------|-------|
| GSPC axis slots | 22 | /api/state board.axis_slots | VERIFIED |
| Measured axes | 22 | /api/state board.measured_axes | VERIFIED |
| Public leaders | 3 | /api/gspc totals.public_leader_count | VERIFIED |
| Model fleets | 14 | /api/gspc | VERIFIED |
| Fact runs | 8 | /api/gspc | VERIFIED |
| Indexed stablecoins | 425 | stablecoin-universe-2026-09/index.json | VERIFIED |
| Chain deployments | 1,640 | stablecoin-universe-2026-09/index.json | VERIFIED |
| Distinct chains | 211 | stablecoin-universe-2026-09/index.json | VERIFIED |
| Circulating (USD) | $310.79B | stablecoin-universe-2026-09/index.json | VERIFIED |
| Deep measurement queue | 20 | readiness.json | VERIFIED |
| Deeply measured assets | 1 | readiness.json | HONEST |
| Signed chain positions | 335 | public/signed/chain.json | VERIFIED |
| Chain valid / invalid | 335 / 0 | verify-card.mjs | VERIFIED |
| Public root card count | 167 | public/root.json | VERIFIED |
| Public root Merkle root | 78d4e019... | public/root.json | VERIFIED |
| Historical corpus | 335 | public/signed/card_index.json | COUNTED |
| PR #1888 cards | 36 | mill-cards-signed/ | STAGED_UNSIGNED |
| Mill cards total | 1,432 | public/interop/mill-cards-signed/ | COUNTED |
| Public cards (SHA-256 named) | 1,680 | public/cards/ | INDEXED |
| Root history entries | 29 | public/receipts/root-history.json | VERIFIED |
| XRPL instrument cards | 17 | public/interop/cards/xrpl/ | COUNTED |
| Rekor witness | log index 2791822965 | rekor-root-*.json | WITNESSED |
| OTS submission | submitted | *.ots files | STAMPED_PENDING_BITCOIN |
| Base EAS | — | — | INCOMPLETE |
| XRPL memo | — | — | INCOMPLETE |
| External revenue | $0.00 | /api/revenue | ZERO |

## Live Endpoints (all probed 2026-09-11T14:30:00Z)

| Surface | URL | HTTP | Verified |
|---------|-----|------|----------|
| Site | https://councilof.ai | 200 | ✅ |
| GSPC API | https://councilof.ai/api/gspc | 200 | ✅ |
| State API | https://councilof.ai/api/state | 200 | ✅ |
| Agent Card | https://councilof.ai/.well-known/agent-card.json | 200 | ✅ |
| llms.txt | https://councilof.ai/llms.txt | 200 | ✅ |
| x402 discovery | https://councilof.ai/.well-known/x402.json | 200 | ✅ |
| x402 catalog | https://councilof.ai/api/x402 | 200 | ✅ |
| Free door | https://councilof.ai/api/free-door | 402 | ✅ (x402 challenge, amount=0) |
| RSS feed | https://councilof.ai/feed.xml | 200 | ✅ |
| Sitemap | https://councilof.ai/sitemap.xml | 200 | ✅ |
| MCP | https://councilof.ai/mcp | DECLARED | In .mcp.json |
| A2A | https://councilof.ai/api/a2a | DECLARED | In agent-card.json |
| AG-UI | https://councilof.ai/api/agui/gspc-state | DECLARED | In llms.txt |

## Trust Chain — 7 Layers (Never Collapsed)

| # | Layer | State | Evidence |
|---|-------|-------|----------|
| 1 | Card signature | ✅ VERIFIED | Ed25519, pubkey d4cb0eaa..., 335/335 valid |
| 2 | Merkle root | ✅ VERIFIED | 78d4e019..., 1,072 entries, 28 source roots |
| 3 | Rekor witness | ✅ WITNESSED | log index 2791822965 |
| 4 | OTS submission | ⏳ STAMPED_PENDING_BITCOIN | Submitted, not yet confirmed |
| 5 | Bitcoin confirmation | ❌ NOT_YET | Waiting for OTS calendar |
| 6 | Base EAS | ❌ INCOMPLETE | Requires owner wallet signature |
| 7 | XRPL memo | ❌ INCOMPLETE | Devnet dry-run prepared, mainnet pending |

## Claims Corrected

| ID | Original | Corrected |
|----|----------|-----------|
| CR-001 | "425 stablecoins measured" | 425 INDEXED, 1 deeply measured |
| CR-002 | "Bitcoin-anchored" | OTS STAMPED_PENDING_BITCOIN, not confirmed |
| CR-003 | "Revenue from x402" | $0.00 external; door declared, no verified settlements |
| CR-004 | "All axes measured and scored" | 22 measured, 3 public leaders, 11 untested separations |
| CR-005 | "36 new model cards fully verified" | 36 cards STAGED_UNSIGNED (outer Ed25519 valid, inner not in chain) |

## Revenue

| Category | Amount | Classification |
|----------|--------|----------------|
| External customer revenue | $0.00 | ZERO |
| Internal self-funded | $0.00 | N/A |
| Zero-value probes | 0 | N/A |
| x402 settlements verified | 0 | — |

**Honest statement:** CSOAI has $0.00 external customer revenue. Internal testing is NEVER counted as revenue.

## Remaining Blockers

1. Base EAS anchor requires owner wallet signature (gas ~$0.01-0.05)
2. XRPL memo anchor requires owner wallet signature (0.00001 XRP)
3. OTS Bitcoin confirmation depends on Bitcoin block inclusion
4. Deep measurement of 425 stablecoins requires compute budget
5. 36 PR #1888 cards need chain integration
6. TUI-4 PR #1900 has merge conflicts (superseded by #1907)

## Open PRs

| PR | Title | State |
|----|-------|-------|
| #1899 | TUI-1: canonical truth ledger | open |
| #1900 | TUI4: Agent Economy — Canonical Discovery Manifest | open (merge conflicts) |
| #1903 | TUI-2: Financial Coverage Machine | open |
| #1904 | TUI-5: Signing, Roots and Anchoring | open |
| #1905 | TUI-6: Human Distribution and Revenue Proof | open |
| #1906 | TUI-3: Model and Benchmark Measurement | open |
| #1907 | TUI-4: Agent Economy and Protocol Discovery | open |
