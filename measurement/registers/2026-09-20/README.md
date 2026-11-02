# Chainlink oracle-boundary evidence pack — 2026-09-20 register

**Status: `CANDIDATE_UNMEASURED`.** Goal 2 intake: what oracle evidence establishes and what
it does not. This is a measurement register — not an endorsement, integration or partnership
claim, canonical-oracle claim, price feed, rating, or compliance conclusion. No wallet,
transaction, purchase, or token transfer was used or is needed.

Pattern copied from the 2026-09-19 token-evidence-twin register (Goal 1 precedent, which
already pins `token:link` identity — cited, not duplicated).

## Artifacts

| file | role |
|---|---|
| `chainlink-oracle-evidence-canary.json` | subjects manifest; pending proof states; boundary axioms; promotion rules |
| `chainlink-oracle-source-observations.json` | 10 observations (7 observed, 3 explicitly UNCHECKABLE), each with locator, retrieved_at, bytes, sha256 |
| `chainlink-oracle-raw/<sha256>.bin` | content-addressed frozen source bytes |
| `chainlink-oracle-claims.jsonl` | 11 frozen claim rows: provenance, exact excerpt + excerpt sha256, raw sha256, assertion class (ISSUER_ASSERTION / ON_CHAIN_OBSERVATION / THIRD_PARTY_PLATFORM_METADATA), independent-checkability verdict, existing-axis mapping; unsupported fields null |
| `chainlink-oracle-vectors.json` | 1 positive control + 7 negative boundary vectors (stale data, wrong feed, wrong chain, missing round metadata, divergent venue inputs, valid signature over false assertion, PoR beyond boundary), each with a falsification condition |
| `chainlink-oracle-gaps-rejections.json` | 7 gaps (PoR docs 404, feed UI 429, status page unreachable, node signatures invisible, config fields not on readable path, governance unmeasured, single-RPC seat) + 6 rejections |
| `chainlink-oracle-instrument-proposal.json` | instrument rows mapped to existing axes `provenance-controls` and `reserve-attestation` only; frozen-registry denominator, n ≥ 30 per ADR-002 precedent; blocking conditions for MEASURED |
| `chainlink-oracle-proof-attempts.json` | honest proof-layer log: ed25519 / Rekor / OTS / root all NOT_ATTEMPTED with reasons |
| `chainlink-feed-bank.jsonl` + `chainlink-feed-bank-manifest.json` | complete denominator: 253 unique Ethereum-mainnet feeds parsed from the frozen registry page; filter-stage counts reconcile (4412 → 3908 wrong-chain + 1 testnet-marked + 250 duplicate-proxy + 253 bank); bank sha256 pinned |
| `chainlink-cross-rpc-replay.json` | GAP-07 closure: publicnode + drpc agree byte-for-byte at pinned block 26015635 (same block hash, same reads); cloudflare-eth.com failure preserved; one-seat residual recorded |
| `chainlink-grader-smoke-eth-usd.json` | grader-execution proof (NOT a measurement run): all five control facts PASS on the frozen canary; price_truth and risk_verdict UNMEASURED |
| `chainlink-bank-readbacks.json` | pinned-block (26015664) readbacks for all 253 feeds; 759 calls, 750 observed / 9 UNCHECKABLE (reverts+empty preserved); every row hash-chained to frozen batch bytes |
| `chainlink-oracle-boundary-run-unsigned.json` | full-bank candidate run: 253/253 attempted, denominator reconciled; identity 232P/14F/7U, decimals 246P/7U, freshness 231P/15F/7U, round-metadata 246P/7U; CONTENT_ADDRESSED_UNSIGNED, content_id over canonical bytes |
| `chainlink-por-naming-normalization-DRAFT.md` | UNRULED draft policy for the 14 abbreviation-family identity FAILs; re-grade only after a pinned, pre-ruled normalization |
| `../../public/interop/chainlink-oracle-boundary-2026-09/` | one unsigned card-v0 atom staging the run for the board signer (passes `staged_leaves._check`; dir enumerated in `STAGED_DIRS` on this branch only — submission is not acceptance) |
| `tools/collect_chainlink_oracle_evidence.py` | read-only collector (stdlib) |
| `tools/build_chainlink_oracle_claims.py` | deterministic claims builder (no network) |
| `tools/build_chainlink_feed_bank.py` | frozen-registry → feed-bank parser (no network) |
| `tools/replay_chainlink_cross_rpc.py` | pinned-block cross-RPC replay (read-only) |
| `tools/grade_chainlink_oracle_boundary.py` | deterministic grader (`--smoke` on the canary) |
| `tools/collect_chainlink_bank_readbacks.py` | pinned-block batched readback collector for the full bank (read-only) |
| `tools/run_chainlink_bank_run.py` | full-bank run driver → unsigned candidate run artifact |
| `tools/validate_chainlink_oracle_evidence.py` | offline validator with drift guards (no network) |

## Rerun (another operator)

```bash
cd <repo root>
python3 tools/collect_chainlink_oracle_evidence.py   # re-fetch + freeze (overwrites observations; frozen rows supersede, never edit)
python3 tools/build_chainlink_oracle_claims.py       # rebuild claims JSONL from frozen bytes
python3 tools/build_chainlink_feed_bank.py           # rebuild the 253-feed denominator bank
python3 tools/replay_chainlink_cross_rpc.py          # pinned-block cross-RPC agreement
python3 tools/collect_chainlink_bank_readbacks.py    # pinned-block readbacks, all 253 feeds
python3 tools/run_chainlink_bank_run.py              # full-bank candidate run (unsigned)
python3 tools/grade_chainlink_oracle_boundary.py --smoke   # grader smoke on the ETH/USD canary
python3 tools/validate_chainlink_oracle_evidence.py  # offline invariants + drift guards; exit 0 = PASS
```

Note: re-running the collector changes sha256s and timestamps; the validator's drift
guards (bank hash, grader hash, proof-attempt artifact hash) will then require the
dependent artifacts to be rebuilt in the order above — this is intentional.

Any re-run that changes a sha256 supersedes the previous observation set by appending a new
register entry — frozen rows are never edited.

## Load-bearing boundary

A valid signature — node, publisher, or CSOAI Ed25519 — proves provenance of bytes, never
price truth. Vector `NEG-06-valid-signature-false-assertion` is the test construction for
this; signature verdict and assertion verdict are separate fields, never merged.
