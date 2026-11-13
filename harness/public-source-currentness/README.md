# Public-source byte-currentness research

11 November 2026. A disjoint follow-through to #4176/#4180, not another numerical replay, model, memory store, publisher or authority system. The existing numerical/Kaggle and Cloudflare inference lanes remain untouched.

This operator-fixed check reads one public Hugging Face repository head, reads a single named source file at that immutable head, then reads the head again. It requires unchanged head during the observation and exact approved source bytes. Unrelated later commits with unchanged selected bytes can match. Changed bytes are HOLD; unavailable, cached, incomplete or raced observations are UNKNOWN. A network failure is not evidence the source changed.

The registry and clock are not supplied by a web visitor. No caller URL/path/hash/clock, private token, storage binding, model invocation or action is accepted. GET-only preview expires on 12 November 2026 at 06:00 UTC. The preview is not a production route or a new scheduler.

## Actual local checks before publication

Python 3.13.5 and Node 22.16.0 agree on all 71 frozen synthetic cases. Python rejects nine malformed operator locks. Three deliberately weakened guards fail the intended verdict assertions. Decision projection SHA-256: `7bca61d08b199e480783b18c36b1da67e45be9c6b8b7e18bb05074ef14bc4163`. Fixture SHA-256: `7192cae7efc77beecde219b902d72240e374bd0b574b0acb2e920c0b9d1efa3a`.

The first candidate exposed five Python/JavaScript disagreements for integer-valued JSON numbers. Python's guard was corrected to the same safe-integer semantics while still refusing booleans and fractions. Earlier failures remain retained; this is a candidate integration defect, not an asserted incident in a deployed model.

Reproduce from this directory:

```sh
mkdir -p results
python3 -B tests/build_vectors.py
python3 -B tests/run_python.py
python3 -B tests/mutation_controls.py
node tests/run_node.mjs
```

## Meaning and limits

A positive result is `MATCH_AT_OBSERVATION`, never a certificate, authority grant, source-truth claim, model score or live-serving proof. The transport relies on the public provider's TLS/metadata and a deployment-supplied expected hash. Missing Age does not prove absence of all upstream caching. Two head reads are not an atomic lease: unobserved A-B-A changes remain possible, and the source may change after observation. Recheck at any consequential boundary under the existing authenticated owner.

These diagnostics are not a new canonical evidence schema. An adopting owner should reference the raw observation through the existing `csoai.evidence-event/0.1` pipeline, preserving PARTIAL/null and the separate authority-effect profile. No such adoption is inferred from this candidate.

HF/Kaggle execution, Cloudflare preview publication and post-publication checks must each be separately read back. No completed remote execution or deployment is claimed by this initial source commit. No protected production project or branch is modified.
