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
