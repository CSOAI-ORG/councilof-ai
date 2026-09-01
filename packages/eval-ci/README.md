# packages/eval-ci

Continuous eval as CI (J32): when a **frozen bank / prompt set / grader** changes, re-run
that axis and emit a **QUEUED delta card** — signed later by GHA `#card-attestation-1`, never
a laptop, never a Hub mill.

Two halves, one real gate:

## 1. Bank pin + fail-on-silent-edit — **REAL**

`bank.lock.json` pins the sha256 of each watched bank (and names the grader files).
`check_bank.py` recomputes every pin and **fails the PR** when a bank's bytes changed but its
pin did not — a *silent* edit. A missing pinned bank fails **closed** ("cannot check" is never
a pass). Prove the gate itself works: `python3 packages/eval-ci/check_bank.py --selftest`.

To change a bank you MUST update its pin in the same PR: a visible, reviewable diff that
declares the change and triggers the re-run + delta card.

## 2. Re-run + delta card — shape REAL, number UNCHECKABLE in CI

`emit_delta.py` writes a `card-v0` (`surface: eval.delta`, `sig_ed25519: null`) carrying the
new `bank_sha256` and the delta SHAPE. In CI there is no GPU model, so `delta_accuracy` is
honestly **UNCHECKABLE** and listed in `unmeasured[]`; pass `--before/--after` from a real run
to fill it. The recorded bank pin is the auditable fact either way.

```bash
sh packages/eval-ci/run.sh gspc-axis   # gate, then emit QUEUED delta card
```

`.github/workflows/eval-ci.yml` runs the selftest, enforces the gate, and uploads the queued
card. Signing stays on GHA `#card-attestation-1`.
