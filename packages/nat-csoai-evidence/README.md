# nat-csoai-evidence: NeMo Agent Toolkit evaluator for signed evidence

Apache-2.0. This is a `nat.components` plugin that registers the evaluator `_type: csoai_evidence`. For each dataset item it does two things:

1. It verifies a CSOAI signed evidence bundle **offline** against a pinned DID document. The bundle is made of `batch.json`, `batch.signed.json`, `events.jsonl` and one `event_id`.
2. It reports that event's state word: CONSISTENT, DIVERGENT, PARTIAL, UNMEASURED, UNCHECKABLE or NOT_DISCRIMINATING.

If any byte of the bundle was changed, the result is INVALID. If the signing key is not pinned, the result is UNVERIFIABLE_KEY.

## Install

```sh
pip install "nat-csoai-evidence[eval]"                    # nvidia-nat-core + nvidia-nat-eval[full] >= 1.9 (the [eval] extra brings what the nat eval command needs, incl. langchain-core, which nvidia-nat-eval 1.9.0 imports but does not declare)
curl -o did.json https://csoai.org/.well-known/did.json    # pin the issuer's keys
```

In your NAT eval config:

```yaml
eval:
  evaluators:
    evidence:
      _type: csoai_evidence
      did_json: ./did.json
```

```sh
nat eval --config_file eval.yml --skip_workflow
```

Each dataset item's generated answer is a signed-evidence bundle. The source distribution carries a five-item fixture set (`fixtures/`), signed with a **published test key** so it attests nothing. Each item returns its expected result: CONSISTENT, DIVERGENT, UNMEASURED, INVALID (a one-word edit to the events), UNVERIFIABLE_KEY (a key that is not pinned).

**No score.** Every item's `score` is `None`, so `average_score` is `None`. The evaluator's `reasoning` carries the OTel `gen_ai.evaluation.result` attributes, and `score.value` is absent unless a number was actually measured.

**Errors are not zeros.** NAT's `BaseEvaluator` records an evaluator error as a score of 0.0. This plugin does not subclass it. An error here is reported as UNCHECKABLE with no score.

**Limit.** VALID shows who signed these bytes. It does not show that any claim inside is true.

This plugin is our code. NVIDIA holds the toolkit; this is not an NVIDIA integration and no NVIDIA team has reviewed it. More: https://councilof.ai/connect/
