# TUI-2 OWNER INTAKE — 2026-10-07 (decisions needed today)

Everything below is **pre-staged and verified this session**. Nothing executes without your action-time approval. Costs are hard-capped in-script; budget approved $100, actual lane spend $0.00.

## Decisions

| # | Decision | Action you take | Cost | Readiness (verified today) | After approval |
|---|---|---|---|---|---|
| 1 | **Sign Base EAS anchor** | Open `http://127.0.0.1:8777/index.html` → Connect → Register → Attest → Verify | ≤ **$0.05** gas (script cap) | Page **HTTP 200**; calldata targets LIVE root `47277a6f…` (319 cards), not stale `78d4e0…` | Attestation on Base; I verify + record tx hash, then heartbeat monitors it |
| 2 | **Fund Base signer** (alternative to #1) | Send **0.001 ETH** to `0xdf6144DBb0b7F5b52279b8ba781Cfc1Bd3Ec3910` | gas ≤ $0.05 (cap enforced) | Funding watchdog `122788ed77c5` runs every 2h, **deliver=origin** (verified — sibling `deliver=all` jobs are failing delivery); last run 16:28, balance 0 | Watchdog auto-executes `execute-anchor-base.py` (live-root + cost guards) and reports the tx here |
| 3 | **Fund XRPL signer** | Send **10.01 XRP** to `rfCXrFoNgRfS9LnwELbKWm1f6omKrZiwo3` | fee ≤ 100 drops (script cap) | Account currently **not found** (unfunded); `execute-anchor-xrpl.py` staged durable | Watchdog executes memo anchor to the same live root; reports hash |
| 4 | **Merge PR #13** | Review + merge `CSOAI-ORG/sovos-harness#13` | $0 | **OPEN / MERGEABLE**, head verified remote==local at each push, all checks green (10 commits after today’s reconciliation push) | Lane work lands on master via normal PR flow (never direct push) |
| 5 | **x402 existing-data offer** (expires **2026-10-11**) | Renew / reprice / let lapse — 0.01 USDC door | decision only | Standing-cycle telemetry: `api/free-door` 30d=6 settlements, reliability 100; `api/request-attestation` reliability 88 (defect flagged) | Direction to TUI-4 lane; I don't touch doors (lane boundary) |

## What you do NOT need to decide

- Measurement work: continuing under standing "go" — canonical now **reconciled 429/429, one explicit state per asset** (see below).
- Endpoint drift: freshness monitor auto-detects; queue retry fires when endpoints return.

## Reconciliation result (the "measured/indexed" deliverable)

- **429 indexed = 122 DEEP_MEASURED + 14 UNMEASURED_REASON_DOCUMENTED + 293 INDEXED_METADATA_ONLY** — zero overlaps, every asset exactly one state, sum verified.
- Supply-weighted deep coverage: **$313.6B of $314.9B (99.6%)**; remaining unmeasured supply $1.0B (retry queue 14) + $0.3B metadata-only.
- Reconciliation **caught and fixed**: two ≥$400M assets were sitting metadata-only (USDX $683M → now deep; USDN $409M → now deep, with identity divergence `XTN.` rename + indexed-supply staleness recorded).
- Artifacts: `finance/measured-indexed-reconciliation-20261007.json` (SHA `3cb597e4…`), canonical v6.6 (SHA `ff1fdf44…`), batch6-recon (SHA appended).
- Claims explicitly rejected: "425 deep measured" (0 signed packs), "425 indexed" (live 429).

## Evidence-chain states (never collapsed into one word)

Card signature: **UNSIGNED** (0 packs) · Public root: **319 cards**, merkle `47277a6f…` · Rekor: **WITNESSED** idx `2791822965` · OTS: **STAMPED_PENDING_BITCOIN** · Base EAS: **PREPARED_NOT_SUBMITTED** · XRPL memo: **PREPARED_NOT_SUBMITTED**.
