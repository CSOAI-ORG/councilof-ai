# x402 settlement census

Buyer's-eye measurement of conformant x402 hosts: one purchase per host, one moment, self excluded. Measurement, not certification.

## Files

- `x402-settlement-census-<date>.jsonl` / `.summary.json`: the SETTLE pass rows and summary written by `scripts/grants/x402-settlement-census.py` (SETTLE=1 sends real USDC; DRY is the default).
- `x402-settlement-census-dry-<date>.jsonl` / `.summary.json`: the DRY pass (challenge terms only, nothing signed or sent).

## Analysis (Move B)

- `scripts/grants/x402_census_analysis.py` reads the two jsonl files and writes `x402-settlement-census-<date>.analysis.json` and `.analysis.md`; the md is rendered from the json, so no figure in it is typed by hand.
- Covers outcome shares, REFUSED histograms (status code, response shape), latency percentiles, payTo concentration (Gini/HHI), the take-and-refuse set with tx hashes, MISMATCH detail, DRY-vs-SETTLE drift, x402 version split, delivered-bytes distribution and a spend reconciliation.
- Verify: `python3 scripts/grants/x402_census_analysis.py --check` recomputes both artefacts and exits non-zero if the committed files differ from the rows (stdlib only, deterministic, no network).
- REFUSED is not proof of bad faith: a host may rate-limit, require an account, or have changed terms between the challenge and the retry.
- One purchase per host, one moment. A single refusal is not a pattern; the second round next week is what makes it one.

## Rounds and deltas (W1 — the time series)

A single census is a snapshot. `x402-census/` gives every census the same shape so two of them can be
diffed, and the diff is the thing nobody else publishes: a Bazaar listing does not move when a host
stops answering paid requests.

```
docs/product/x402-census/rounds/<round_id>/settle.jsonl   the paid pass
docs/product/x402-census/rounds/<round_id>/dry.jsonl      the DRY pass minutes earlier
docs/product/x402-census/rounds/<round_id>/round.json     the manifest — every number derived
docs/product/x402-census/rounds/<round_id>/analysis.{json,md}
docs/product/x402-census/deltas/<from>-vs-<to>.{json,jsonl,md}
public/interop/x402-census/{index.json,rounds/,deltas/,leaves/}
```

- `scripts/grants/x402_census_round.py` — one round: import or run, derive, `--check`, `--press`,
  `--hf-readme`, `--selftest`. The paid pass runs only when `SETTLE=1` is already in the environment;
  the script never reads or prints `X402_PAYER_KEY`.
- `scripts/grants/x402_census_delta.py` — two rounds in, one delta out. `--check`, `--selftest`.
- `harness/x402-census/build_cards.py --round-id <id>` — one card-v0 leaf per **PAID** row
  (DELIVERED, REFUSED and MISMATCH alike: a refused purchase is still an observation). Each leaf is
  ≤3 KB, carries its evidence URIs, and is `UNMEASURED` with its own observation count against n≥30.
- Contracts: `public/schema/x402-census-round-v1.json`, `public/schema/x402-census-delta-v1.json`.
  Both are enforced by the producers' own `--check`, and both selftests prove the validator can fail.
- Surfaces: `/interop/x402-census/` (HTML + `accept: application/json`) and
  `/feeds/x402-census.xml`, listed on `/feeds`.
- Reader-facing: `W1-WHAT-A-BUYER-GETS.md` (the 60-second verification recipe, who else measures
  this, and the honest limits) and `W1-48H-RUNBOOK.md`.

### Round 2026-09-06 and the loose files above it

`rounds/2026-09-06/{settle,dry}.jsonl` are **byte-for-byte copies** of
`x402-settlement-census-2026-09-06.jsonl` and `x402-settlement-census-dry-2026-09-06.jsonl`, imported
so the first round has the same shape as every round after it. The loose files stay where they are
because `x402_census_analysis.py --check` and the published grant packs pin those paths. Both copies
carry their sha256 in their respective manifests — compare them rather than trusting this sentence:

```bash
jq -r '.rows.settle.sha256' docs/product/x402-census/rounds/2026-09-06/round.json
jq -r '.inputs.settle_jsonl.sha256' docs/product/x402-settlement-census-2026-09-06.analysis.json
```

No leaves are committed for round 2026-09-06. The same 316 purchases are already published as the
104 cards under `public/interop/x402-census-cards/`, and staging a second set for the same event
would fork one corpus into two — see `council-os/CARD-CORPORA.md` for why that is the defect this
estate is most practised at committing.
