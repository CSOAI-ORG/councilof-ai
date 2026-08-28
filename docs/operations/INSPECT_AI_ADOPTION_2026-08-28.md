# Inspect AI adoption — note (roadmap #4, measurement)

Primary harness = Inspect AI (UK AISI, MIT; companion evals corpus MIT/Apache with
per-eval dataset licenses). Capability baselines = lm-evaluation-harness (MIT).
Adversarial axes = garak + PyRIT. HELM (Apache-2.0) scenarios where holistic.

Rules (doctrine):
- Sign EVERY run as a MEASUREMENT: preimage includes `config_digest` (sha256 of the
  Inspect config JSON) + `instrument_version` (Inspect + eval versions) + bank hash.
- Language: "measured with Inspect AI" is fine; "Inspect-certified" is a doctrine
  violation. Never claim a tool's authority as ours.
- New axes declared UNMEASURED + rubric first (financial-axes grammar).
- Adoption gate: 10-fixture cross-verify Inspect output vs the existing gold-run
  pipeline (jail/containment) before it becomes the default runner.

Status: DECISION recorded (fleet paste); adoption doc this file; gate + fixtures queued.

## Executable contract (landed)

`harness/arena/measurement_card.py` implements this signed-MEASUREMENT format: it binds
`instrument` (name + version, e.g. `inspect_ai@0.3.47`), `config_digest` (sha256 of the run
config JSON), and `rows_digest` (bank/rows hash) into a JCS-v2
(`preimage_rule: "jcs-rfc8785"`) preimage, signed over the canonical body bytes exactly as
`public/signed/verify-card.mjs` checks. Verified: emitted cards verify VALID via the
dispatch, tamper returns INVALID with the hash mismatch shown, stripping the preimage rule
returns INVALID (dispatch is load-bearing).

```
python3 harness/arena/measurement_card.py --config <run-config.json> \
    --rows-digest <sha256 of rows> --instrument inspect_ai --instrument-version <v> \
    --axis <axis> --n <n> --accuracy <acc> --key <ed25519> --out card.json
```

The adoption gate (10-fixture cross-verify vs the gold-run pipeline) uses this verifier as
its stranger-checkable half.
