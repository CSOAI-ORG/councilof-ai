# TUI2 LANE ALIGNMENT — 2026-10-07 (JEEVES / finance lane)

**For every commander on this desktop: this is the TUI-2 financial-coverage source of truth. Do not create parallel counts.**

## Authoritative state (branch `finance/full-spread-20260911`, PR #13)

| Fact | Value | Source |
|---|---|---|
| Canonical file | `finance/canonical-asset-graph.json` **v6.5-waveB-complete** | PR #13 head `8ab0e36a` → `d9fd14a9` pending |
| SHA-256 (canonical) | `e682489a6b8f747512b58cebab97ecca46e573187b5343db54ae8ec6b1b10904` | computed 2026-10-07 |
| Stablecoin index | **429 assets** (grew from 425 during monitoring — use 429, not 425) | live DefiLlama |
| Chains with active supply | **175** (211 is the stale Sep-11 listed figure) | live DefiLlama |
| Total supply | $314.8B | live DefiLlama |
| Deep-measured | **122 of 429** (primary deployment; UNSIGNED; 0 in root) — reconciled 122/14/293, supply coverage 99.6% | batch files 1–6 + reconciliation |
| Deep-priority queue | **14** remaining (all reason-documented, retry when endpoints return) | canonical v6.6 |
| UNMEASURED-with-reason | **13** (Sui endpoints 403, Stellar issuer mismatch, legacy no-address tokens, no ERC20 totalSupply, non-EVM) | `deep-measurement-batch5-waveB-20261007.json` |
| Signed evidence packs | **0 of 429** — deep ≠ signed | honesty rule |

## Claims that are now STALE — owners please refresh

1. **"425 stablecoins indexed across 211 chains"** (Sep-11 baseline, TUI6 launch pack, website, PR #8 body) → live is **429 / 175-active-chains (211 listed)**. Drift detected by my freshness monitor; 4 new assets (FRNT, USDx, OUSD, QEURO) measured same-day.
2. **"167 cards in public root"** (Sep-11 baseline) → live `councilof.ai/root.json` reports **319 cards**, merkle `47277a6f…` (as_of 2026-09-30). TUI1 controller should refresh.
3. **PR #8 body "42 measured/383 indexed"** → CONTRADICTED (32 card files; denominator 429 now).
4. **Anchor specs** (`councilof-ai/anchoring/*.json`) target root `78d4e019` (167 cards) → stale vs live `47277a6f` (319). My refreshed, spend-capped versions: `finance/anchor-refresh-20261007.json` + executable `finance/execute-anchor-{base,xrpl}.py`.
5. **Rekor entry**: live-verified logIndex 2791822965, but entry `data.hash 2cb07249…` vs `rekor-state.json` label `62a1931b…` — relationship unverified → **TUI5 reconcile** (flagged, not asserted as error).

## Symbol collisions found (affects anyone keying by ticker)

- **GUSD**: Gemini USD ≠ Gate USD (index entry). Card measured Gemini; index = Gate (320M minted).
- **USDB**: Blast native ≠ USDBridge/Tempo (index entry).
- Key everything by **DefiLlama ID**, never by symbol (5 projects share the USDS ticker).

## Automation I own (do not duplicate — declare yours in this file's PR if overlapping)

| Job | ID | Cadence | Scope |
|---|---|---|---|
| TUI2 anchor funding watchdog | `122788ed77c5` | 2h ×24 | auto-fires owner-approved anchor scripts when signers funded (caps enforced); keeps :8777 signing page alive |
| TUI2 evidence heartbeat | `ba47d82b92c5` | 6h ×8 | OTS→confirmed milestone, Rekor alive, root card-count drift (silent otherwise) |
| TUI2 freshness monitor | `f057e20df9f9` | 12h ×4 | index/root drift; agent summarises only on change |

**Delivery note (2026-10-07):** all three jobs were switched `deliver=all` → **`deliver=origin`** after fleet-wide `deliver=all` failures ("no delivery target resolved" — sibling TUI-3/4 jobs show `delivery_failed`). Do not trust `deliver=all` in this environment; `origin` and `local` both verified working.

**Overlap note for TUI1:** hourly `root/OTS integrity check` (`3338156b17b7`) already watches root+OTS. Mine adds Rekor liveness + the OTS-confirmed *milestone* and is silent-when-clean — consolidate into the controller if you prefer one watcher.

## Lane boundaries I respect

- No git worktrees on the Mac (owner rule 7 Oct 2026) — my working copy is a plain clone at `/tmp/pr8-audit` (scratch, prunable; all durable scripts under `~/.hermes/scripts/tui2/`).
- Never push to protected master; all my work flows through PR #13 on my branch.
- No email / forms / publicity / credentials; spend only within the owner's approved caps (Base ≤$0.05, XRPL fee ≤100 drops, budget $100).
- OTS state = `STAMPED_PENDING_BITCOIN` (never "confirmed"). Rekor = `WITNESSED`. Deep ≠ measured-signed.

## Open offer to the estate

I have a **working, verified OTS re-stamp flow** (proved today on the live root.json: valid proof, 4/4 calendars pending). The red deploy gate (`art50-target-index.json` OTS mismatch per PLAN-48H) can be re-stamped the moment the owning lane approves — I will not touch those bytes uninvited.

## Findings for other lanes

- **Venturi/GSPC real-time feed** (owner asked): board is programmatic at `councilof.ai/api/gspc` — live 23/23 axes measured, 0/14 separated, 7 TIE, 7 UNTESTED (fetched 2026-10-07T07:38Z). A per-axis facts JSON poll is the clean integration; staged as Wave-C item.
- **csoai-standing-cycle** was paused 11:28 today after `mirror FAILED_OR_BLOCKED exit=75` + lock contention — not mine, flagging so the owner/commander knows it's dark.
- Disk at **5GB free (98%)** — continuous batches should clean caches soon (`~/Library/Caches/*` is regenerable per memory note).
