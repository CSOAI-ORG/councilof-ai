# nat-csoai-evidence: NeMo Agent Toolkit evaluator for signed evidence

Apache-2.0. This is a `nat.components` plugin that registers the evaluator `_type: csoai_evidence`. For each dataset item it does two things:

1. It verifies a CSOAI signed evidence bundle **offline** against a pinned DID document. The bundle is made of `batch.json`, `batch.signed.json`, `events.jsonl` and one `event_id`.
2. It reports that event's state word. The state is CONSISTENT, DIVERGENT, PARTIAL, UNMEASURED, UNCHECKABLE or NOT_DISCRIMINATING.

If any byte of the bundle was changed, the result is INVALID. If the signing key is not pinned, the result is UNVERIFIABLE_KEY.

**No score.** Every item's `score` is `None`, so `average_score` is `None`. The evaluator's `reasoning` carries the OTel `gen_ai.evaluation.result` attributes, and `score.value` is absent unless a number was actually measured.

**Errors are not zeros.** NAT's `BaseEvaluator` records an evaluator error as a score of 0.0. This plugin does not subclass it. An error here is reported as UNCHECKABLE with no score.

```sh
pip install nvidia-nat nvidia-nat-eval[full] && pip install -e .
python3 fixtures/make_fixtures.py
nat eval --config_file fixtures/eval.yml --skip_workflow
python3 -m pytest -q tests
```

The fixtures are signed with a **published test key** (its seed is in `make_fixtures.py`), so they attest nothing. There are five items, and each must return its expected result:

- CONSISTENT
- DIVERGENT
- UNMEASURED
- INVALID, for a one-word edit to the events
- UNVERIFIABLE_KEY, for a key that is not pinned

This plugin is our code. NVIDIA holds the toolkit, and this is not an NVIDIA integration.
