# TUI 1 — Canonical Controller and Truth Ledger
**Generated:** 2026-09-11T12:45:00Z
**Basis:** master (b9e752aa)
**Machine state:** TUI-1-CANONICAL-STATE.json

---

## Executive Summary

The CSOAI estate is operational with verified live endpoints, 22 measured GSPC axes, and a 425-asset stablecoin index. Deep measurement is honest at 1/425. The trust chain has a Rekor witness but OTS is pending Bitcoin confirmation, and Base/XRPL anchors are incomplete. Zero external revenue.

## Coverage Denominators and Numerators

| Domain | Denominator | Numerator | State |
|--------|------------|-----------|-------|
| GSPC axes | 22 | 22 | VERIFIED (all measured) |
| Model comparison axes | 14 | 14 | VERIFIED |
| Financial/domain axes | 8 | 8 | VERIFIED (deterministic-facts) |
| Public leaders | 22 | 3 | VERIFIED (own models excluded) |
| Stablecoin indexed | 425 | 425 | VERIFIED (DefiLlama) |
| Stablecoin deeply measured | 425 | 1 | HONEST |
| Chain deployments | — | 1,640 | VERIFIED |
| Distinct chains | — | 211 | VERIFIED |
| Signed cards (chain) | 335 | 335 | VERIFIED (Ed25519) |
| Public root leaf union | — | 1,072 | VERIFIED (28 source roots) |
| Public cards on disk | — | 1,680 | COUNTED |
| Rekor witness | 1 | 1 | WITNESSED (log index 2791822965) |
| OTS submission | 1 | 1 | STAMPED_PENDING_BITCOIN |
| Base EAS | 1 | 0 | INCOMPLETE |
| XRPL memo | 1 | 0 | INCOMPLETE |
| External customer revenue | — | $0.00 | HONEST |
| x402 settlements verified | — | 0 | HONEST |

## Live URLs

| Surface | URL | HTTP |
|---------|-----|------|
| Site | https://councilof.ai | 200 |
| GSPC API | https://councilof.ai/api/gspc | 200 |
| Agent Card | https://councilof.ai/.well-known/agent-card.json | 200 |
| llms.txt | https://councilof.ai/llms.txt | 200 |
| MCP | https://councilof.ai/mcp | DECLARED |
| A2A | https://councilof.ai/api/a2a | DECLARED |
| x402 | https://councilof.ai/.well-known/x402.json | DECLARED |
| AG-UI | https://councilof.ai/api/agui/gspc-state | DECLARED |

## Trust Chain State (7 layers — never collapsed)

1. **Card signature** → Ed25519 VERIFIED (pubkey d4cb0eaa..., 335 cards)
2. **Merkle root** → VERIFIED (8ee6eefa..., 1,072 entries, 28 source roots)
3. **Rekor witness** → WITNESSED (log index 2791822965)
4. **OTS submission** → STAMPED_PENDING_BITCOIN (submitted, not confirmed)
5. **Bitcoin confirmation** → NOT_YET (waiting for OTS calendar)
6. **Base EAS** → INCOMPLETE (requires owner approval)
7. **XRPL memo** → INCOMPLETE (devnet dry-run prepared, mainnet pending)

## Claims Corrected

1. ~~"425 stablecoins measured"~~ → 425 INDEXED, 1 deeply measured
2. ~~"Bitcoin-anchored"~~ → OTS STAMPED_PENDING_BITCOIN, not confirmed
3. ~~"167 cards in public root"~~ → 1,072 entries in leaf union; 167 needs independent verification
4. ~~"Revenue from x402"~~ → $0.00 external; door declared but no verified settlements
5. ~~"First AI measurement body"~~ → Neutral measurement body (not first claim)
6. ~~"All axes measured and scored"~~ → 22 measured, 3 public leaders, 11 untested separations
7. ~~"A2A cards for 12 analysts"~~ → 12 A2A cards for 12 MCP tools (PR #1883)

## Open PRs (30 total, 15 today)

Key merged today:
- #1896: stablecoin readiness (425 assets, 211 chains)
- #1895: x402 launch attribution
- #1825: public root
- #1888: 36 enriched GSPC receipts
- #1883: 12 A2A cards

Key open:
- #1897: receipt signature/lifecycle/regulation states
- #1894: public root (rolling)
- #1889: TUI-6 commercial pack
- #1886: framework presence register
- #1884: agent-cards + XRPL prep

## Blockers

1. **GCP billing disabled** → VM down → SOV3/OLM frozen
2. **GitHub default branch** is 'main' but production is 'master' (Nick gate)
3. **Base EAS + XRPL memo** require owner approval for on-chain transactions
4. **OTS pending Bitcoin** — calendar submission done, confirmation pending
5. **Deep measurement gap** — 424/425 stablecoins unmeasured
6. **card_index dispute** — 11 entries vs historical 335/150 subsets unresolved

## Cost Summary

| Item | Cost |
|------|------|
| Stablecoin index build | $0.00 |
| Readiness build | $0.00 |
| x402 campaign | 0.01 USDC (declared, untested) |
| On-chain anchors | $0.00 (not yet executed) |

## Remaining Work Per TUI

| TUI | Status | Remaining |
|-----|--------|-----------|
| TUI 1 (Controller) | ✅ DONE | This file |
| TUI 2 (Financial) | 🟡 PR #1896 merged | Deep measurement queue; dedup wrappers |
| TUI 3 (Models) | 🟡 337 cards signed | Verify 36 from PR #1888; reconcile with 167 root |
| TUI 4 (Agent Economy) | 🟡 12 A2A cards | Duplicate resolution; directory submissions |
| TUI 5 (Signing) | 🟡 Rekor witnessed | OTS Bitcoin; Base EAS; XRPL memo |
| TUI 6 (Distribution) | 🟡 PR #1889 open | Claims sweep; IETF drafts; launch package |
