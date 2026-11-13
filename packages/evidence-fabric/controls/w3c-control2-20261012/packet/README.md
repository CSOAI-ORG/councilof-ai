# W3C control2 reproduction candidate

Prepared 12 October 2026. This is a private, public-shareable candidate, not a published artifact.
It carries the exact four pinned Python source files, three original fixtures, all eighteen fixture inputs for six cases, a portable helper derivative, and the full recorded 21-case native result matrix.
The historical result came from the separately hashed original private helper. The portable helper has only static review and has not been executed. Publication, live readback and independent external replay remain open.

## Recorded observation

Source pin: a730cd2f4ddc65ea72e53d44577d929db45f9e38.
Checker revision: sha256:3ec9dded61cb085522e3b6dbc59fc1349fa4c4d3e5de88164d0e25f658d87f67.
Baseline config digest: 07d791d1fb7ae96addc18a93904fcb6965b6663acd17857d835c9781e16c2595.
The original run observed exactly 21 selected cases once each: 7 pass, 13 fail, 1 inconclusive, 0 void, 0 not-exercised.
Both source and expected answers were available to the operator; this is neither blind nor independent evaluation.
This is one fixed PYTHONHASHSEED=0 run over historical 30 September fixtures, with network blocked before checker imports/calls.
The original environment records Python 3.11.8 and cryptography 50.0.2. These are observed versions, not a minimum compatibility claim or complete dependency lock.

For each of payload-digest, artifact-digest and ed25519-signature, only its matching isolated fixture changes state.
State-unchanged counts are 4/5 for every rule. Full native-return-unchanged counts are respectively 3/5, 4/5 and 4/5.
When payload-digest is relaxed, the old signed-payload multi-guard case remains fail but changes cause from payload-digest to artifact-digest.
The missing-key case is separate, unrelaxed and inconclusive/key-not-in-did-document; its DID configuration differs.
See per-rule-comparisons.json for every pair, evidence reference and digest. observations.json preserves native (state, cause) tuples as JSON arrays with corresponding named fields.
This is our operator format, not an asserted upstream nativeCaseArray wire format.

## Contents and carried evidence

recorded-packet.json contains the redacted historical result and exact fixture bytes in base64. All input_packet_refs in its observations resolve within that file.
observations.json repeats the exact recorded native rows for easy comparison; their container references resolve in recorded-packet.json.
fixtures/ carries all six sets of artifact, signed record and DID bytes (18 named inputs, including duplicates).
replay/ carries the exact original four source files, three original fixtures and the modified helper.
Original source/fixture public URIs, byte counts, SHA-256 and Git blob bindings are in recorded-packet.json provenance.
The original executed helper is absent by design: its digest and byte count are referenced, and its private operator paths are removed from the separately hashed portable derivative.
All original and mutated fixture bytes are carried. Original checker/source code is carried and publicly referenced. The portable helper is carried; the original private helper is referenced by digest only. No result or input is silently substituted.
STAGED_MANIFEST.json is not shipped as an executed-input binding because its historical helper entry is stale (11156 bytes rather than the executed 15356 bytes).
original-executed-input-manifest.json records all eight actual before/after immutable input digests, including the actual original helper digest.
portable-replay-input-manifest.json separately binds all eight portable replay inputs.
fixture-input-manifest.json lists all eighteen fixture inputs in ascending POSIX path order.
selected-cases.json carries all 21 exact original selectors in execution order.
MANIFEST.json binds the final public candidate files, excluding itself. Every file digest is SHA-256 of the exact carried bytes.
JSON files use json.dumps(ensure_ascii=False, sort_keys=True, indent=2) plus one LF. Manifest entries use Python sorted paths without locale collation.
The SHA-256 of selected-cases.json binds the counted selector list; the SHA-256 of fixture-input-manifest.json binds the counted corpus input list. Both appear in MANIFEST.json.

## Proposed reproduction command; not yet runtime-validated

Use a fresh writable copy of replay/ for every run; do not run the preserved historical helper or overwrite the prepared artifact.
Provide a Python 3.11.8 environment with cryptography 50.0.2 already installed. Installation is outside this offline helper; no dependency wheel/lock is carried.
From that fresh replay/ directory, invoke:

    PYTHONHASHSEED=0 python3 -B run_control2.py

python3 must select that environment. The helper writes an exclusive RUN_STARTED.json marker before any checker call and refuses to repeat in the same directory.
It generates its own result.json, packet.json and derived-fixtures/. Compare those against the recorded fixture digests, selected cases and native outcomes.
New timestamps, interpreter/platform metadata, command text, helper digest and its enclosing packet/result digests are expected to differ; do not present them as the original result bytes.
The derivative keeps source pins, guarded mutation recipes, network block, fixed-seed requirement, 21-case inventory, expected answers and checker calls unchanged.
A full raw byte identity between original and portable helper is expressly false; exact changes and identities are in MODIFICATIONS.json.
No checker import, helper execution or new observation occurred during preparation of this candidate.

## Interpretation and remaining gates

Mutation offsets are zero-based byte offsets in the original UTF-8 signed record: payload_sha256 offset1113 changes ASCII9 to0; sig_ed25519 offset961 changes ASCII2 to0. The artifact mutation appends one LF.
The original multi-guard fixture is the recorded output of the pinned public mutator. Missing-key DID bytes come from the original copied document with verificationMethod=[] and the declared JSON formatting.
Frozen fixture signatures do not establish present signer authority, revocation state or key control. Carried local_verification values and timestamps are historical, especially in mutated controls.
The results do not establish full specification conformance, an independent implementation, W3C endorsement, customer acceptance or revenue.
Source/publication authority and normal release capacity remain gates. Private preparation is complete only after static review; publication and external reproducibility remain unfinished.
Preserve NOTICE.md and LICENSES/ plus all original notices when distributing; see MODIFICATIONS.json for labelled changes.
