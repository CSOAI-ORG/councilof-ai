# RunPod measurement intake rehearsal — 23 September 2026

Observed at 06:00 UTC. This is a private, read-only-source rehearsal. It has **not** admitted a measurement to GSPC, signed a card, anchored bytes, or published an output.

## Retained candidate

- Worker run: `20260922T172802.802805Z-5b2843c213`
- Subject: `ollama:llama3.2:3b@sha256:a80c4f17acd55265feec403c7aef86be0c25983ab279d83f3bcd3abbcb5b8b72`
- Axis: `continuity`; 33 attempted, 33 graded, 13 correct, reported accuracy `0.3939`
- Original `run.json`: 2,105 bytes; SHA-256 `c7861fc955d4f898c3db79c093f94c6d30063440bd03f1011522cab458c1bd24`
- Original `items.jsonl`: 49,600 bytes; SHA-256 `e65d1d20267e1df6c57036c70bacca20d2ef11a38308732f0926f37209088ab9`
- Original `card-unsigned.json`: 1,118 bytes; file SHA-256 `4caa909cc56590f6dc06e4b63edd8182ee4157d67736abb2111cfa2282f99003`
- Card body ID and original `run.card_sha256`: `421bd455e9b6806cb588f55844308fda90f604156f72234a630285a8e60a26ec`
- Canonical unsigned-wrapper SHA-256 (excluding final LF): `1e78c30bd6f41075bbfedf250f619c2342cae42d014f13d7a6feeae4bb927b6f`
- Frozen bank allowlist SHA-256: `0699565600b41b5cfc8950df7b22d83a8dd23eac2254e916ef05b7f76f6ded5f`

## Gate result

The pre-fix offline verifier accepted the closed three-file source and frozen-bank allowlist, then rejected `CARD_HASH_MISMATCH`: deployed worker release `091a616a` wrote the card body ID into `run.card_sha256`, while the intake required the whole-wrapper digest. A **simulation on a separate copy** changing only that manifest field passed the remaining semantics. No source bytes were rewritten.

The narrow compatibility fix in [PR #2673](https://github.com/CSOAI-ORG/councilof-ai/pull/2673), commit `1268073294b64e63275552318df96ff2fe81ac71`, accepts either the exact canonical wrapper digest or the exact recomputed body ID. All existing strict wrapper, subject, bank, transcript, score and pin checks remain. Unknown digest values still fail. The receipt explicitly records `canonical-body-id-legacy`, the actual wrapper digest and the original run-file hash.

Against the **original copied bytes**, the patched existing intake produced private `VERIFIED_QUARANTINE` bundle `2bc364df79b13e03bff7deab27d1ef4be9dcc97cf55c3475051feb7c304ab8e6`. The existing selector staged one cell with zero problems; the existing lander put one unsigned card and one receipt into a private temporary inbox, zero skips. None of these writes reached the production sign inbox or public estate. The private receipt file SHA-256 is `9462b07e0bb3d42f52efd3c276876aef1c32809a23f3344e2ed4b3064166e023`.

Validation: 39 targeted intake, landing and chain determinism tests passed; `git diff --check` passed. PR status at 06:00 UTC: OPEN, MERGEABLE, no checks reported. Production next step is review and controlled installation of the verifier, then a fresh intake from original run bytes before any separate signing decision.

This is a freshness/evidence-path repair, not a new axis or new model/axis cell. The source tree already contains a signed continuity card for this subject from a different 14 September run (`signed-continui-509c0b136260.json`); that older card has no independent admission field. Across the 85 fully graded candidates in the 05:45 UTC quality snapshot, every model/axis pair also has at least one signed card in the source tree. Source presence alone does not establish current public deployment or independent admission.
