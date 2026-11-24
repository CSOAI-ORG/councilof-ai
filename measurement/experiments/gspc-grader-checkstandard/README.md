# GSPC safety-label grader — frozen REAL-source check-standard v1

**Status:** reproducible, source-pinned instrument-only experiment; **NOT** a calibration certificate, independent gold labels, a model-safety measurement, a signed board admission, or a human-authorised effect. November 24, 2026.

## Why a real check-standard

GSPC already has a canonical \`harness/gspc-top100/mill_hub_queue.py::read_label\` that scores whether a response contains a parseable final label. The factory's previous permissive substring parser once mistook a label-menu echo for an answer. A new regression exposed a separate unclosed \`<think>\` handling ambiguity; it is being corrected under [PR #4800](https://github.com/CSOAI-ORG/councilof-ai/pull/4800).

The existing \`measurement/experiments/metrology-controls/\` Shewhart/CUSUM project is a **synthetic demonstration**, not an actual GSPC reference bank. This check-standard closes a narrower but important gap: a **frozen set of actual archived model-response bytes**, with source/row hashes, plus a declared literal-response oracle and independent synthetic mutation controls. A locked check-standard is run against the production parser each day *after merging*.

## Source and custody

| Item | Pinned value |
| --- | --- |
| Public dataset | \`csoai/gspc-fact-table\` |
| Exact Hub revision | \`d0605c2495bddae7956fec5c18403d8a49fd81ac\` |
| Frozen file | \`gspc_cells.jsonl\` |
| Descriptor bytes SHA256 | \`68dfb5b07b01c2cd1929aa506d667b77eb00e600f0df42b3463860c1e6a85f47\` |
| Original archive scope | 677 SHA-matched source-cell files, 20,517 joined rows |
| Real safety-lane raw outputs available | 5,580 |
| Selected real distinct response strings | **26**, source-verified from **9 model identifiers** |
| Gold classes | 1 exact \`COMPLY\`, 1 exact \`REFUSE\`, 24 distinct strings containing neither label |
| Synthetic metamorphic canaries | 11, including 4 malformed-reasoning cases |
| Frozen reference manifest exact file SHA256 | \`84f525f62613a074d7cc66cb6b1cc282a70f6b9a3188f9db114d4f0cdce48fbf\` |

The actual raw responses **never appear** in \`data/real-source-reference-v1.json\`. It stores only source file names, exact source-file hashes, row indices, SHA256 of each response, source-model-identifier hashes, the selection rule and declared reference label. The daily runner verifies every selected source against the pinned descriptor and input hashes before calling the exact canonical grader.

### How the reference is set

Two distinct real reference outputs exactly equal the labels \`COMPLY\` and \`REFUSE\`. The other 24 distinct outputs are small (at most 1,000 characters) and contain **neither** label, so they are unambiguously unparseable according to the limited literal-format specification. All other outputs, including those containing label words amid prose or complex formatting, are **excluded rather than silently adjudicated**.

The reference oracle was declared by source-format logic, **not independently judged by human reviewers**. Repetitions of the exact string \`COMPLY\` are not treated as independent control patterns; exactly **26 unique raw strings** are measured. This sample estimates *no* field error rate, recall, model capability, causal safety risk, or performance on all archived responses.

Additional canaries are clearly **synthetically transformed**, never presented as real model outputs. They test permitted \`Answer: LABEL\` and properly closed reasoning, plus forbidden menu echo, incomplete \`<think>\` and stray reasoning tags.

## Verified two-version experiment on M4

Using the identical frozen reference manifest and the exact canonical grader files:

| Evaluated instrument | Source SHA256 | 26 real historical references | 11 synthetic controls |
| --- | --- | --- | --- |
| Current master at observation | \`670004aab55d5834f70f96b89b8fc7904a52f584cc9f37f7ae275b55c1a21cbe\` | 26 matched | **4 failures** |
| Candidate from PR #4800 | \`7bcb22038c57fe8d42db958da5318f9d0c98c87e646e690ec5e7fbc64a6bd1d5\` | 26 matched | **0 failures** |

This is a *known-source differential test* of parser controls, not proof that source-code changes improve AI behaviour or that a third party approved the method. No data was backdated and no historical signed card rewritten.

## Reproduce

In the full Council checkout (contains public/interop/mill-evidence) use the **pinned frozen descriptor**:

\`\`\`bash
python3 measurement/experiments/gspc-grader-checkstandard/test_check_standard.py

curl --fail --location --max-time 35 \
  'https://huggingface.co/datasets/csoai/gspc-fact-table/resolve/d0605c2495bddae7956fec5c18403d8a49fd81ac/gspc_cells.jsonl' \
  -o /tmp/gspc_cells.jsonl

python3 measurement/experiments/gspc-grader-checkstandard/check_standard.py \
  --descriptors /tmp/gspc_cells.jsonl \
  --source-root public/interop/mill-evidence \
  --observed-at 2026-11-24T01:50:00Z \
  --report /tmp/gspc-check-standard-report.json
\`\`\`

The example observation time above is historic. **Use the real current UTC clock when running later.** \`check_standard.py\` rejects a changed descriptor SHA. On a controlled reference-inventory rebuild only, \`--build-reference\` regenerates a manifest; never modify the committed reference as part of a daily check. A change requires an explicit protocol version and review.

The [daily research workflow](../../../.github/workflows/gspc-real-grader-check-standard.yml) runs at 11:12 UTC after merge, with zero provider/LLM requests. It uses a source-pinned GET of the public descriptor, reads the public source cells in the checkout, creates a bounded summary and retains an unsigned research artifact for 45 days. Source unavailable/tampered => **UNCHECKABLE**; parser mismatch => **ALARM**; both fail the scheduled job. No production cards, CouncilOS authority or policy are changed.

## Open gaps before genuine metrological calibration

1. Have independent qualified annotators label a new, held-out and privacy-reviewed bank spanning easy, ambiguous, malformed, multilingual, refusal, and tool-call formats, with inter-rater disagreement and an adjudication process.
2. Independently determine the relevant *measurand*: format extraction error, answer correctness, false/true alarms, and downstream effect are **different measurements**. Keep the reference procedure independent from the instrument under test.
3. Pre-register the selection and calibration window, source and grader provenance, sample design, cluster/dependence, failure cost and sensitivity thresholds. Run prospective observations with adequate statistical power.
4. Use stable negative controls and perturbations, randomised controlled release candidate comparisons, and calibrated uncertainty/false-alarm estimates. Only then consider source-specific Shewhart/CUSUM integration. A repeated historic fixture cannot estimate new real-world drift.
5. Add real MEOK tool enforcement tests in a customer-approved sandbox and independent receiving-party readback. No automatic or artificial human Council approval.
6. Before NIST submission, follow [NIST Metrology Center submission guidance](https://airc.nist.gov/metrology/how-to-submit/); inclusion, if ever accepted, would not constitute NIST endorsement.

Industrial analogy: a calibrated check standard must be separable from the device it checks. A source-pinned literal oracle is a **useful first instrument control**, but is not yet an independently traceable reference standard.

Further inspiration: [NIST metrology](https://airc.nist.gov/metrology/), [NASA prognostics repository](https://www.nasa.gov/intelligent-systems-division/discovery-and-systems-health/pcoe/pcoe-data-set-repository/), [NERC event-analysis method](https://www.nerc.com/our-work/reports), [OpenTelemetry Events](https://opentelemetry.io/docs/specs/semconv/general/events/).
