# AI-evaluation universe — coverage map

This release separates the size of the public AI-evaluation universe from what CSOAI has
actually MEASURED.

`index.json` was built by querying the GitHub API for each reader and counting task and
scenario definitions from the repository tree at its default branch. Each source entry
records the SHA-256 of the exact API response observed during the run, so every figure
can be re-fetched and compared.

## Reading the numbers

- `stars_observed` is a **popularity signal, not a capability measurement**. It is recorded
  because it is observable and cheap, not because it means anything about quality.
- `count` is a **measured** number: a tree count at a pinned branch, with the response
  digest beside it. A count that could not be read is null, never 0.
- `readers_not_located` records readers that were looked for and not found, with the
  endpoints queried and their HTTP status. The absence is a measurement.
- Upstream listings are **INDEXED**, not measurements by us. Nothing here is signed, rooted,
  anchored, scored or certified by appearing in this file.

## What CSOAI has measured

The live board declares **33 axis slots**, of which **23 are MEASURED** and 10 are declared with no run behind them.

Each axis must move through the same state ladder:

`DISCOVERED → INDEXED → OBSERVED → MEASURED → SIGNED → ROOTED → ANCHORED`

An axis declared but unmeasured is a visible gap. It is never a zero, and it is
never a failure of the axis.

## The gaps on our side

Each one is quoted from the live board by field path, so it can be re-quoted
without trusting this file. An unmeasured axis is a visible gap: it is never a
zero, and it is never a failure of the axis.

- **The whole subject axis family is declared and unmeasured: lab practice, company practice, measurer integrity, harness fidelity, interop conformance, humanoid deployment, regulator transparency, interpretability/reproducibility, claim maintenance and serving fidelity.**
  - `/api/gspc totals.by_family.subject.measured` = 0 · MEASURED=0
- **No model-comparison axis separates a leader, so the board states TIE and UNTESTED rather than a ranking.**
  - `/api/gspc totals.separated_leads` = 0 · SEPARATED_LEADS=0
- **Most deterministic-fact run artifacts are content-addressed but unsigned, so the evidence chain for those axes rests on identity of bytes, not on a signer.**
  - `/api/gspc totals.financial_run_attestations.ed25519_signed` = 2 · PARTIALLY_SIGNED
- **Three measured axes carry no public leader, because the named leader holds no signed per-model card in the public card index. The axis stays MEASURED; the unverifiable leader claim is dropped rather than invented.**
  - `/api/gspc totals.uncarded_leaders_dropped` = 3 · LEADER_DROPPED
- **Our own specialist models are excluded from public leader attribution on eight axes, so the public board reports external leaders only. This is a governance rule, not a measurement gap, and it is stated rather than hidden.**
  - `/api/gspc totals.own_leaders_excluded` = 8 · OWN_MODELS_EXCLUDED
- **The board's scale is declared slots, not a published catalogue of task definitions. Readers here that publish task directories are not comparable to us by count; the comparison is in what is published, not how many rows there are.**
  - `/api/gspc totals.axes` = 33 · DECLARED_SLOTS

## Rebuild

```sh
python3 scripts/build_ai_eval_gap_map.py
```

The generated `snapshot_sha256` covers the JSON body before that field is added.
Each source entry separately records the SHA-256 of the exact response bytes
observed during the run.
