# Claim-maintenance promotion review — held after evidence correction

Updated 30 October 2026. The earlier promotion recommendation is superseded by this review.
The 28 October wave remains unchanged as historical evidence; its reported `n_valid = 174`
must not be used as the admission denominator.

## What the audit found

The earlier runner read both original and revised registries: 182 rows represented 91 distinct
claims across 37 source URLs. It also applied visible-text extractor 2 to every source digest.
That mixed legacy extractor 1 baselines with extractor 2 and treated raw-byte baselines,
including PDFs and package metadata, as web-page text. Claim Maintenance v0.2 §6.3.1 requires
comparison with the same extractor and §5.6 requires preservation of digest coverage.

Text absent from an extracted response is not sufficient evidence of withdrawal. A redirect,
template change, access challenge or different rendering can also remove it from that read.
The previous runner additionally stopped its timeout after response headers, leaving the body
read unbounded. Its six historical-file tests checked arithmetic and provenance fields; they
did not exercise these defects.

## Corrected execution

The existing producer, `scripts/measurements/claim-maintenance-wave.mjs`, now:

- Verifies explicit registry supersession links and artifact integrity, selects one active
  baseline per subject identifier and claim ID, and retains its complete registry lineage.
- Uses each baseline's declared digest coverage and extractor. A missing extractor means
  frozen rule 1. Unknown readers, unsupported encodings and malformed artifacts are held.
- Fetches each distinct URL once, with a 20-second deadline covering headers and body and an
  8 MiB body limit. HTTP failures and incomplete bodies never become comparable observations.
- Freezes source files and input registries before fetching. Complete response bodies are
  retained by SHA-256 for offline replay, with timestamps and per-source outcomes.
- Reports `UNCHANGED`, `CHANGED`, `UNREACHABLE` or `UNCOMPARABLE` as observations. It records
  text absence separately and makes no withdrawal, truth, materiality or silent-change verdict.
- Refuses to overwrite an existing run, and refuses replay if bytes, rows, denominators or
  frozen methods disagree. Neither a run nor a replay can promote a board axis.

The fresh M4 run completed at **2026-10-30T05:03:22.782Z**:

| Quantity | Result |
|---|---:|
| Registry rows inspected | 182 |
| Distinct active claims | 91 |
| Distinct sources attempted | 37 |
| Comparable claims | 87 |
| Comparable sources | 35 |
| Unchanged source representations | 26 claims |
| Changed source representations | 61 claims |
| Unreachable | 4 claims across 2 sources |
| Rejected active artifacts | 0 |

The four unreachable claims returned HTTP 404. Those reads are not withdrawal adjudications.
Multiple claims share a fetched page; 87 is not a count of independent subjects.

Result: `public/interop/claim-maintenance-wave-2026-10-30.json`.
Frozen input SHA-256: `825245659b672120d2ddab3047b2f70971f230d861aaab2317f5b5488d470c90`.
All 91 rows replayed, including 87 comparable observations. Raw third-party response bodies
are retained privately on the execution host; the public JSON alone does not reproduce them.

## What remains before admission

1. Define and freeze the source-edit disclosure procedure, including evidence locations,
   observation windows, missed-disclosure uncertainty and reviewer disagreement. Artifact
   conflict disclosures are a different concept. Absence of a located disclosure is not proof
   of a silent change.
2. Define withdrawal evidence beyond text absence and retain human adjudication where required.
3. Review the sampling unit, shared-source dependence and what this convenience corpus supports.
4. Complete independent review and the existing authorized signing/admission process against
   the exact method, inputs and result. A machine-generated review label is not human approval.

The board definition and frozen specification remain in force. The earlier proposal to promote
four outcomes by dropping the fifth requirement is withdrawn. The new observation is useful
evidence toward completion; it does not itself close the declared axis.

## Validation

Run the functional and historical-integrity suites:

```sh
node --test scripts/measurements/claim-maintenance-wave-v02.node-test.mjs \
  scripts/measurements/claim-maintenance-wave.node-test.mjs
```

Replay uses the original result and its adjacent `.evidence` directory:

```sh
node scripts/measurements/claim-maintenance-wave.mjs --replay /private/run/wave.json
```

The historical 28 October result is preserved byte for byte. Its old counts and outcome labels
are historical output, not current eligibility or a factual withdrawal finding.
