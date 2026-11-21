# Council of AI — first-party open-model guard replay (21 November 2026)

**Status: reproducible first-party research observation. Not a certification, an external benchmark, a live threat-prevention service, or an admitted GSPC board measurement.**

We ran an Apache-2.0 open-source prompt-injection classifier with a pinned ONNX model directly on Council-controlled CPU equipment. The experiment used eight predeclared synthetic cases: four ordinary messages and four injected instructions attempting to override an agent workflow.

Observed for this exact small sample: **4/4 injected texts classified as injection; 4/4 benign texts classified as safe.** These are synthetic examples selected by our team and visible in the fixtures; they are not a third-party test, an estimate of real-world attack detection, or evidence that a prohibited tool effect was stopped.

## What was executed

- Model: https://huggingface.co/Horizon-Labs/prompt-injection-guard-small, author Horizon-Labs (not our model; no vendor endorsement).
- Frozen model revision: 2efc2ed5abecd21eb45c2506d231a65d6e392b85.
- Quantised ONNX weights SHA-256: 61cd0741cdbfcc229e32e1de1392f352736d87d1e8b3c2b67ad9836bb7910d5d.
- Normalizer SHA-256: 768931fc0b38fb141796abf181e0bafe96308e92c8832c817dbd6df7fc41ac79.
- Threshold: 0.5. Runtime on M4: ONNX Runtime 1.26.0, Transformers 5.5.0, CPU only.
- Retained record.json and event.json contain this observation and an unsigned csoai.evidence-event/0.1. Each case points to the input via SHA-256 digest; cleartext fixture inputs are in scripts/research/firstparty-guard-cases.json.
- No real target/tool action, human review, external witness, GSPC admission or independent institutional assessment occurred.

## Reproduce and verify

Verify retained results and per-case outcomes without installing the model:

~~~sh
python3 -m unittest discover -s scripts/research -p test_firstparty_guard_replay.py -v
python3 scripts/research/firstparty-guard-replay.py verify \
  --result docs/research/firstparty-guard-20261121/record.json \
  --event docs/research/firstparty-guard-20261121/event.json
~~~

Run fresh inference with Python 3.12+, CPU and sufficient disk/RAM:

~~~sh
python3 -m pip install onnxruntime==1.26.0 huggingface-hub==1.19.0 \
  transformers==5.5.0 tokenizers==0.22.2 numpy==2.3.5
python3 scripts/research/firstparty-guard-replay.py run \
  --result new-record.json --event new-event.json
python3 scripts/research/firstparty-guard-replay.py verify \
  --result new-record.json --event new-event.json
~~~

The workflow .github/workflows/self-run-open-model-guard-sample.yml replays on a GitHub-hosted runner, retains false alarms/misses and full receipts, uploads artifacts, and verifies report integrity in a second job. It runs weekly only after the reviewed workflow is merged to the default branch. A separate-job verifier checks report arithmetic and evidence identity but does not independently rerun the neural inference.

## Layered synthetic effect demonstration

A second **actual owned-file test** has now composed the 8 pinned classifier decisions with the existing Council-of-AI synthetic HITL approval-to-effect executor. In this small controlled run:

- Four benign examples passed the detector and triggered four separately observed, *synthetically authorised* local file effects.
- Four injected examples were held before invoking the executor, so these are explicitly labelled NOT_DISPATCHED rather than pretending an independent observer watched a denied execution.
- A forced classifier-bypass negative control was sent to the existing wrong-scope host authority path and was **DENIED with NO_EFFECT**.
- A simulated false-negative branch also reaches host denial. A simulated false-positive branch prevents an otherwise permitted synthetic effect. These are regression checks, not additional classifier-model observations.
- The saved composition has **zero observed unauthorised file effects** within its exact synthetic fixture population. This does not establish real-world threat prevention, human approval, institutional independence or complete coverage.

Retained output: [layered-demo.json](layered-demo.json). Re-run with the pinned classifier result:

~~~sh
node scripts/research/composed-guard-effect-demo.mjs --selftest
node scripts/research/composed-guard-effect-demo.mjs --run \
  docs/research/firstparty-guard-20261121/record.json \
  scripts/research/firstparty-guard-cases.json \
  new-layered-demo.json
node scripts/research/composed-guard-effect-demo.mjs --verify \
  docs/research/firstparty-guard-20261121/record.json \
  scripts/research/firstparty-guard-cases.json \
  new-layered-demo.json
~~~

The synthetic action scope comes from [`firstparty-action-scope.json`](../../../scripts/research/firstparty-action-scope.json), **not** the example's known injection label. A regression test changes an attack's requested action to a permitted action after a model miss and confirms the action can still execute. Host scope is not a semantic safety guarantee. The sample's tool requests are preselected by the research author; a real LLM has not proposed or executed them.

The broader [116-case published-source evaluation](../external-guard-benchmark-20261121/README.md) found **19 false negatives among 60 labelled injections** at threshold 0.5; it is not an unseen holdout. Those misses enter a hashed, non-training review register, rather than disappearing behind the eight selected examples.

The model predicts; the existing exact-authority host fixture checks execution. This is the architectural division between an external detector and MEOK's future operating enforcement. The real human authority, distributed lease and production-specific tool binding remain unqualified.

## GSPC and MEOK interpretation

This qualifies a small classifier integration, not general safety. MEOK should treat model detection as a signal and separately enforce exact-action host authorisation at tool dispatch. GSPC may measure participating revisions under a frozen method, but these eight examples are not admitted to a live GSPC axis. A public threat-prevention claim requires pinned models, independent held-out samples, failure and false-positive denominators, real forbidden-action observations and reproducible outside review.

**No commercial customer is required to execute this Council-owned research pipeline.**
