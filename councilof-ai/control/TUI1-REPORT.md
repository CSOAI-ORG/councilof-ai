# TUI 1 — Canonical Integrator Checkpoint
## Date: 2026-09-11T12:30Z
## Branch: control/canonical-state-20260911

---

## Execution Ledger

| TUI | Branch | State | Commits | Merge Ready |
|-----|--------|-------|---------|-------------|
| TUI 1 | control/canonical-state-20260911 | IN_PROGRESS | this file | — |
| TUI 2 | finance/full-spread-20260911 | VERIFIED | 3 (`2e86463`, `a9d0e49`, `73cce7d`) | YES — fast-forward |
| TUI 3 | models/verified-expansion-20260911 | EMPTY | 0 (identical to main) | NO — no work |
| TUI 4 | agents/discovery-consolidation-20260911 | EMPTY | 0 (identical to main) | NO — no work |
| TUI 5 | trust/anchor-completion-20260911 | VERIFIED | 1 (`ad42e56`) | YES — fast-forward |
| TUI 6 | (no dedicated branch) | INCOMPLETE | — | NO |

---

## Coverage Denominators

| Metric | Value | State |
|--------|-------|-------|
| Stablecoins indexed | 425 | INDEXED (DefiLlama) |
| Asset-chain entries | ~1,640 | INDEXED |
| Chains reported | 211 | INDEXED |
| Chains with active supply | 177 | INDEXED |
| Total supply | $310.8B | INDEXED |

---

## Deep Measurement Numerators

| Chain | Contracts | State |
|-------|-----------|-------|
| Ethereum | 11 | DEEP_MEASURED |
| Base | 1 (USDC) | DEEP_MEASURED |
| Arbitrum | 2 (USDC, USDT) | DEEP_MEASURED |
| Ethereum (tokenized) | 1 (USDY) | DEEP_MEASURED |
| XRPL | 1 (legacy USD) | DEEP_MEASURED |
| XRPL (RLUSD) | 1 | NO_ISSUED_SUPPLY |
| Stellar | 0 | NO_HOLDERS_FOUND |
| **Total** | **15** | **DEEP_MEASURED** |
| **Remaining** | **410** | **INDEXED only** |

---

## Production Hashes and Deployment

| Surface | URL | Status | Notes |
|---------|-----|--------|-------|
| Main site | councilof.ai | HTTP 200 | Next.js SPA |
| llms.txt | councilof.ai/llms.txt | HTTP 200 | 44 lines, 22 axes |
| Agent card | .well-known/agent-card.json | HTTP 200 | v1.1.0 |
| MCP | councilof.ai/mcp | LIVE | 12 tools, streamable-http |
| A2A | councilof.ai/api/a2a | LIVE | 11 methods |
| x402 | .well-known/x402.json | LIVE | 9 resources |
| Feed | councilof.ai/feed.xml | HTTP 200 | RSS 2.0 |
| Sitemap | councilof.ai/sitemap.xml | HTTP 200 | Dated 2026-09-11 |

---

## Signatures, Roots and Witnesses

| Layer | State | Identifier |
|-------|-------|------------|
| Card signatures (Ed25519) | 371/371 verified | DID: did:web:csoai.org |
| Public Merkle root | 167 cards included | root.json |
| Historical corpus | 335 cards | /signed/card_index.json |
| Rekor witness | WITNESSED | log index 2791822965 |
| OTS | STAMPED_PENDING_BITCOIN | submitted |
| Base EAS | INCOMPLETE | ~$0.01, owner gate |
| XRPL memo | INCOMPLETE | ~$0.00001, owner gate |

---

## Branch Reconciliation

### Clean merge-ready (fast-forward):
- `finance/full-spread-20260911` — 3 commits, 10 files (TUI 2 financial measurement)
- `trust/anchor-completion-20260911` — 1 commit, 12 files (TUI 5 anchor specs)
- `origin/fix/smoke-live-route-map` — 2 commits (e2e improvements)
- `origin/fix/e2e-smoke-cloudflare-403` — 1 commit (User-Agent fix)
- `origin/chore/untrack-egginfo-dsstore` — 1 commit (cleanup)

### Empty branches (identical to main):
- `models/verified-expansion-20260911` — NO WORK
- `agents/discovery-consolidation-20260911` — NO WORK
- `codex/runpod-a100-cost-guard` — NO WORK

### Needs merge resolution:
- `lane/engine-pod-pusher` — 45 ahead / 11 behind, conflict on sim-matrix.yml

---

## Revenue State

| Classification | Amount | Notes |
|---------------|--------|-------|
| EXTERNAL_CUSTOMER | 0.02 USDC | 1 external payer |
| INTERNAL_SELF_FUNDED | 5 settlements | Excluded from revenue |
| ZERO_VALUE_PROBE | 4 | Excluded |
| **Total revenue** | **0.02 USDC** | **Effectively zero** |

---

## Claims Rejected or Corrected

1. XRPL RLUSD: prior $1.03B/41,200 holders → $0/0 holders
2. Deep measurement: prior 17 → 15 (FDUSD/DOLA contracts return 0x)
3. Tokenized funds: BUIDL/USDG/USD1 not measurable via standard totalSupply()
4. Stellar: no holders found, format change suspected
5. Revenue: internal tests excluded; external = 0.02 USDC

---

## Costs

| Item | Cost | Source |
|------|------|--------|
| Deep measurement RPC | $0 | Public endpoints |
| DefiLlama API | $0 | Public API |
| XRPL queries | $0 | Public cluster |
| Stellar queries | $0 | Public Horizon |
| Base EAS anchor | ~$0.01 | NOT executed |
| XRPL memo anchor | ~$0.00001 | NOT executed |
| **Total spend** | **$0** | — |

---

## Unresolved Blockers

1. Signing key — card production
2. Root ceremony — Merkle inclusion
3. NIST AI 300 deadline — Sep 16 (5 days), owner gate
4. Stale directory listings (Glama, awesome-mcp-servers)
5. HF dataset not published
6. Kaggle — no dataset
7. XRPL RLUSD discrepancy with DefiLlama
8. FDUSD/DOLA contract investigation needed

---

*TUI 1 — Canonical Integrator | Branch: control/canonical-state-20260911*
