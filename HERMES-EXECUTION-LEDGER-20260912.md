# HERMES — Execution Ledger
**Generated:** 2026-09-12T04:25:00Z
**Master basis:** 4bb4c4446 (PR #1941)
**Operator:** JEEVES (MiMoCode)

## Estate Summary

### Live Production State (verified this session)

| Surface | State | Evidence |
|---------|-------|----------|
| GSPC API | LIVE | 22 axes, 22 measured, 14 fleets, 3 leaders |
| Root.json | LIVE | 169 cards, as_of 2026-09-11T12:45Z |
| Card index | LIVE | 335 cards, pubkey d4cb0eaa... |
| Mill cards (signed) | 1,493 on disk | 80 with run_id (5%), 1,413 legacy |
| MCP server | LIVE | 12 tools (8 free + 4 paid), SSE transport |
| A2A Agent Card | LIVE | v1.1.0, 7 skills |
| x402 catalog | LIVE | Base mainnet, USDC, EIP-155:8453 |
| RSS | LIVE | Fresh 2026-09-11 |
| Sitemap | LIVE | lastmod 2026-09-12 |
| llms.txt | LIVE | Substantive, honest |

### TUI 1 — Canonical Harness, Signing and Anchoring

| Item | State | Detail |
|------|-------|--------|
| Provenance-bound cards | 36/1,493 (2.4%) | 36 lifecycle-correct OIDC receipts from PR #1929 |
| Legacy cards (no run_id) | 1,413 | Historical cards without provenance binding |
| OIDC signing rounds | 6 (merged today) | All via GHA, no laptop signing |
| Ed25519 verification | 335/335 valid | Historical corpus verified |
| Merkle root | 169 leaves | as_of 2026-09-11 |
| Rekor witness | log index 2791822965 | Witnessed |
| OTS | STAMPED_PENDING_BITCOIN | Awaiting confirmation |
| Base EAS | INCOMPLETE | Owner wallet needed |
| XRPL memo | INCOMPLETE | Owner wallet needed |
| Readers on master | evm-erc20-reader.mjs, xrpl-trustline-reader.mjs, stellar-asset-reader.mjs | From PR #1926 |

### TUI 2 — Global Financial and Asset Index

| Item | State | Detail |
|------|-------|--------|
| Stablecoins indexed | 425 | DefiLlama API |
| Chain deployments | 1,640 | Across 211 chains |
| RLUSD Ethereum | $1,369,732,628 | Block 25958897, MEASURED |
| RLUSD Base | $100,278 | Block 51171026, MEASURED |
| RLUSD XRPL | ~$920,663,999 | Ledger 106912784, MEASURED |
| USDC Ethereum | $50,409,423,446 | Block 25958897, MEASURED |
| USDT Ethereum | $88,306,028,997 | Block 25954285, MEASURED |
| DAI Ethereum | $4,586,676,885 | Block 25954285, MEASURED |
| BUIDL Ethereum | $212,069,346 | Block 25958897, MEASURED (tokenized fund) |
| Stellar | AMBIGUOUS | Lookalike tokens, no verified issuer |
| Archive directories | 59 | EVM chain snapshots |
| EVM reader | LIVE | Reproducible, block-pinned |

### TUI 3 — Models, Benchmarks and Regulatory Crosswalks

| Item | State | Detail |
|------|-------|--------|
| PR #1888 cards verified | 36/36 | Ed25519, sha256(body), DID, size, n=30 |
| Lifecycle-correct OIDC | 36 cards | signature_state=SIGNED, run_id bound |
| Regulation-linked | 5 | EU AI Act Art.5(1)(a)-(g) + Art.9-15 |
| Regulation-unlinked | 31 | NO_REGULATION_SCORE each |
| NIST AI RMF crosswalk | DRAFT | GOVERN/MAP/MEASURE/MANAGE mapped |
| GSPC axes | 22 | 14 behavioural + 8 financial/domain |
| Model fleets | 14 | On live board |
| Public leaders | 3 | Derived from GSPC |

### TUI 4 — x402, MCP and Agent-Economy Interoperability

| Item | State | Detail |
|------|-------|--------|
| MCP server | LIVE | 12 tools, SSE transport, v1.4.2 |
| A2A Agent Card | LIVE | v1.1.0, 7 skills |
| x402 catalog | LIVE | Base mainnet, USDC |
| x402 discovery | PASS | Free door + request-attestation |
| x402 payment | OWNER GATE | Needs funded wallet |
| npm version | 0.2.1 | Stale vs live 0.2.2 |
| MCP registry | 1.4.0 | Stale vs live 1.4.2 |
| MCP.so | LISTED | PR #1931 merged |
| Directory probes | 3 live, 6 catalogued-not-probed | MCP registry stale since Aug 27 |

### TUI 5 — Council OS and Master GSPC Board

| Item | State | Detail |
|------|-------|--------|
| Website claims | "22 measured" × 5 | Honest |
| Repo topics | 37 repos remediated | 0 remaining with zero topics |
| GitHub pins | STALE | 6 MCP repos, flagships not pinned (web UI only) |
| HF collection | NOT CREATED | No auth token |
| Kaggle dataset | PREPARED | 425 rows, not published (owner gate) |
| RSS | LIVE | Fresh 2026-09-11 |
| Sitemap | LIVE | lastmod 2026-09-12 |
| llms.txt | LIVE | Substantive |

### TUI 6 — Distribution, Revenue and Human Awareness

| Item | State | Detail |
|------|-------|--------|
| External revenue | $0.00 | ZERO |
| Contacts prepared | 15 | Across 3 classes |
| Contacts sent | 0 | Owner gate |
| Offers declared | 3 | Feed, Crosswalk, Trust Receipt |
| IETF drafts | CONTEXT PREPARED | 3 threads, not submitted |
| Attribution tracking | settlement-attribution.json | Ready |

## Yield Analysis

| Lane | Verified cells | Subjects covered | Signatures | External users | Independent payments | Cost |
|------|---------------|-----------------|------------|----------------|---------------------|------|
| TUI 1 | 1,493 cards | — | 1,493 Ed25519 | — | — | £0 |
| TUI 2 | 7 measurements | 7 assets | — | — | — | £0 |
| TUI 3 | 36 receipts | 11 models | 36 Ed25519 | — | — | £0 |
| TUI 4 | 12 tools | 1 MCP server | — | — | — | £0 |
| TUI 5 | 37 repos | 37 repos | — | — | — | £0 |
| TUI 6 | 15 contacts | 3 offers | — | — | — | £0 |
| **Total** | **1,598** | **56** | **1,529** | **0** | **0** | **£0** |

## Contradictions Detected

1. **Card disk-to-index gap**: 1,493 on disk vs 335 in index (1,158 gap). Superseded cards are on disk but not in the live index.
2. **Provenance binding**: Only 36/1,493 (2.4%) cards have run_id. The remaining 1,413 are legacy cards without provenance.
3. **MCP registry version**: 1.4.0 in registry vs 1.4.2 live. npm: 0.2.1 vs 0.2.2 live.
4. **Website "22 measured"**: Accurate for the board (22 axes measured) but could be confused with "22 models measured" — the dual-number quoting in llms.txt handles this correctly.
5. **Stellar measurements**: AMBIGUOUS — cannot verify RLUSD or USDC issuers on Stellar from public data alone.

## Remaining Owner Gates

1. **Fund wallet + execute 0.01 USDC Base payment** (TUI 4)
2. **Swap GitHub profile pins via web UI** (TUI 5)
3. **Publish Kaggle dataset** (prepared, awaiting approval) (TUI 5)
4. **Publish npm 0.2.2 + MCP registry 1.4.2** (TUI 4/5)
5. **Approve and send 15 targeted contacts** (TUI 6)
6. **Submit IETF drafts** (TUI 6)
7. **Base EAS + XRPL memo anchors** (TUI 1)

## Next Three Highest-Yield Actions

1. **Merge provenance-bound signing into more cards** — extend the 36 lifecycle-correct cards to cover more models/axes
2. **Expand on-chain measurements** — measure remaining top-5 stablecoins and tokenized funds with full provenance
3. **Fix MCP registry + npm version drift** — publish 1.4.2 and 0.2.2 to close the directory gap
