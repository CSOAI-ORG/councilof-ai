# Methods, reproduction and publication policy

**Research release 2026-11-23.** The exact source documents and tests live in
[the Council monorepo](https://github.com/CSOAI-ORG/councilof-ai/tree/master/measurement/experiments/two-path-council).
This Hugging Face dataset includes *original narrative and aggregate metadata only*.
It does not contain raw GSPC secret bank labels, model prompts, third-party training
records, personal attributes, signing keys or private customer information.

## Types of evidence — do not silently promote one to another

- \`PUBLIC_SOURCE_OBSERVATION\`: a publisher's own public machine surface was read;
  existence/bytes may be authenticated, but no new model evaluation is implied.
- \`RETROSPECTIVE_PUBLIC_REUSE\`: a published bank/feature table was re-analysed with
  pinned source revisions; not a new independent held-out run.
- \`RETROSPECTIVE_OWNER_SOURCE_AUDIT\`: owner-held original source and result file
  were examined; internal consistency/signature checks do not prove external signer custody.
- \`PUBLIC_SOURCE_RULE_TEST\`: a public source-count claim was checked with a
  deterministic function, *not* a real authenticated 12-member council.
- \`RETROSPECTIVE_SOURCE_RECOMPUTATION\`: arithmetic derived independently from
  source fields; source timestamps still require outside deployment verification.
- \`SYNTHETIC\`: an assumption-controlled fake experiment, with no real participants,
  model calls or observed downstream effects.

The HF dataset table has one record per aggregate metric. Its rows are **not
independent statistical observations** and must not be summed as a new cohort.

## Reproduce the frozen GSPC study

Pin \`csoai/gspc-fact-table\` to
\`d0605c2495bddae7956fec5c18403d8a49fd81ac\`. Never substitute the latest
main revision without labelling a new run.

\`\`\`sh
cd measurement/experiments/two-path-council
OPENBLAS_NUM_THREADS=1 python3 -B -m unittest discover -s . -p 'test_*.py'
python3 -B audit_public_fact_ontology.py
python3 -B repeated_observations.py
python3 -B error_complementarity.py
python3 -B human_information_factorial.py --demo --tasks 1500
python3 -B stage1_stage2_transfer.py --help
node --test test_audit_historical_triad.mjs
\`\`\`

For the original 3-around-1 source-level audit, the final script accepts
**only an owner-authorised local original script and the matching signed JSON**
as \`--source\` and \`--record\`. The test suite's fixtures are synthetic and
do not need the private owner machine. The audit does not run the original
source's model, signing-key or networking logic.

## Reproduce the corrections observation

\`\`\`sh
python3 scripts/verify_corrections_signature.py --file saved-public-response.json --out checked.json
python3 scripts/corrections_publication_observer.py \
  --response saved-public-response.json --signature-check checked.json \
  --out readback.json --otlp-out readback.otlp.json
python3 scripts/corrections_latency.py --file saved-public-response.json
\`\`\`

The signature verifier resolves the public \`did:web:csoai.org\` document. It
must find a matching content ID and Ed25519 signature before a receipt is
released. This proves byte/key consistency, not an independently accepted
remedial outcome. \`readback.observed_at\` is **when this program read the public
response**, not the first publication time for an individual correction.

## How to interpret uncertainty

- A 12/12 score with a visible answer key is not held-out performance.
- A simulated causal coefficient is a property of the simulation's rules.
- A correlation of outcomes across historical public items cannot isolate
  model-weight adaptation from changed prompts, tools, routes or graders.
- Paired model votes are not independent principals; a 12-role registry is not
  proof of authenticated Byzantine fault tolerance.
- The absence of repeated model errors in a small bank does not establish an
  asymptotic guarantee or general safety.
- The existing historical grade field is not replaced by a new ad hoc grader.
- To measure end-user effects, observe actual consent, authority, execution,
  external acceptance, and task quality as separate records.

## Publish and verification rules

The publisher lives in
\`scripts/hf/publish_evidence_adaptation.py\`. It packages only this directory
from **protected master** after the research source and historical correction
note have merged. Its exact publication payload must pass
\`scripts/privacy/publication_gate.py\`, and it emits a content SHA-256 manifest
binding the GitHub source commit and file digests.

Publication uses the existing protected-master \`HF_TOKEN\` GitHub secret only
during reviewed protected-master source publication (or explicit manual re-dispatch). Never expose it to pull-request jobs, logs,
the Mac shell history, or the dataset. The publishing program confirms the
Hugging Face commit SHA and retrieves the exact uploaded files for SHA-256
verification. A failed upload or failed byte-for-byte replay is a failed
release, not a successful publication.

No GitHub merge or HF upload automatically adopts a new model measurement
state, approved human reviewer, OTS/Bitcoin inclusion or public-root signature.

## Correction and supersession

Preserve historical signed bytes. When a result is shown to be limited, publish
a dated correction or supersession with the exact original source identity,
failure mode, scope, and independently testable replacement hypothesis.
[Historical referee issue #4737](https://github.com/CSOAI-ORG/councilof-ai/issues/4737)
is the governing tracked limitation for the October 2026 perfect-score claim.

A static screenshot of 100% accuracy or a reproduced p-value is not adequate
proof that the hidden evaluation was blind. The confidence of the public
statement must never exceed the evidence state of the underlying source.
