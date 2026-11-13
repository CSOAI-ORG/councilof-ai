# subject-axis live run — 2026-10-27

**Measurement only. Never a certification, a rank, or a grade.**

This directory holds a real, dated, re-runnable measurement of two things, taken on 2026-10-27 against public
endpoints. It is **unsigned**: no card is minted, no board number changes, no axis moves to MEASURED by this file.

## What is here

| File | What it is |
|---|---|
| `claim-maintenance.wave2-20261027.json` | Wave 2 of the claim-maintenance re-read. The 77 public claim URLs of the 2026-10-24 baseline, each fetched **twice, 30 s apart**, so a page's own per-request churn is separated from a change. |
| `bank-<axis>-live-20261027.json` | Five **real** frozen banks: `measurer-integrity`, `interop-conformance`, `humanoid-deployment`, `interpretability-reproducibility`, `company-practice`. Every item carries the digest of bytes actually served, a recomputed canonical digest, and a must-fail negative control (one corrupted content digest per item, which must stop verifying). |
| `subject-axis-live-run-20261027.json` | The run summary: gate status per axis, the class census, and the blockers that keep each axis UNMEASURED. |
| `subject-axis-live-run.mjs` | The runner. `method_sha256` in every artefact is the sha256 of this file, so a changed method changes the digest and the artefact cannot silently outlive its code. |

## How to re-run

```
node subject-axis-live-run.mjs
```

It needs only outbound HTTPS to public endpoints. It writes into `out/` next to itself.

## What the numbers are, and what they are not

- **Claim-maintenance wave 2:** 77 subjects, **75 reachable**, n≥30 gate **met**, negative control **DISCRIMINATING**.
  Against wave 1 (2026-10-24): 13 unchanged, **62 raw-byte changed**, 1 withdrawn, 1 unreachable. Across the two reads
  of this run, 71 pages were text-stable and 4 were text-unstable.
- **The measurement does not claim the 62 deltas are material.** Wave 1 captured a raw sha256 and never an
  extracted-text digest, so a raw delta cannot be resolved into "the visible text changed" versus "the page changed
  elsewhere". The text digests captured here are the baseline that lets **wave 3** attribute materiality exactly.
  Materiality itself is a human adjudication and is not automated.
- **The class-level census is the primary statistic** of each bank: five counts per axis, each the share of reachable
  subjects whose public bytes carry that class. No threshold is needed to read it, and the headline bar (3-of-5) was
  fixed after this run's data was seen — it is a description of this run, not a pre-registered measurement. A score of
  exactly 0 or 1 is refused by the estate's G2 rule; two of the five axes hit 1.000 at every bar, which is reported
  rather than hidden.
- **A refusal is a state.** Unreachable and withdrawn claims are recorded in their own columns and are never converted
  to a zero, a failure, or a score.
- **No third party is named from a delta** without human release approval.

## Why the 2026-10-25 banks are not here

The 2026-10-25 subject-axis banks (`bank-<axis>-20261025.json` elsewhere in the estate) generate their metric values
by formula and verify only bytes the builder itself minted. Promoting them would publish a measurement of a hash
function. They remain `CANDIDATE_FINDING` and are deliberately excluded from this directory. The finding, with the
file and line, is in the catalogue.
