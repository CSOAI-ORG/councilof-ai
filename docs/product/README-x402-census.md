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
