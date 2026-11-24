# Real multilingual guard measurement — 24 November 2026

**Status:** Real CPU model inference on published third-party-labelled data. CSOAI self-run and unsigned, not a GSPC board measurement, customer acceptance, independently adjudicated benchmark, production guard, human authorization, or tested frontier LLM.

## Actual observed run

At 03:11:50 UTC on 24 November 2026, an Apple M4 CPU processed all **3,372** entries in the full/test split of [the Turkish Prompt Injection Benchmark](https://huggingface.co/datasets/halilneed/turkish-prompt-injection-benchmark) using [Horizon-Labs/prompt-injection-guard-small](https://huggingface.co/Horizon-Labs/prompt-injection-guard-small), a locally cached 140.6M-parameter open-weight classifier. No paid model call, cloud GPU, agent tool execution, retraining or real-world adversarial action occurred.

The dataset publisher labels 317 attacks and 3,055 benign texts. Publisher labels are not independently adjudicated by CSOAI, and the source is tagged license:other. This report redistributes **no raw source texts**. The model publisher has evaluated Turkish data; this is **not a blind test**. Exact hashes and full reproducibility method appear below.

| Metric at the frozen threshold 0.5 | Observed |
| --- | ---: |
| True positive (detected attacks) | 255 |
| False negative (missed attacks) | **62** |
| True negative (accepted benign) | 2,768 |
| False positive (benign flagged) | **287** |
| Attack recall | **80.44%** (Wilson 95% interval 75.72–84.43%) |
| Benign false-alarm rate | **9.39%** (Wilson 95% interval 8.41–10.48%) |
| Accuracy on this particular source prevalence | 89.65%, not portable to deployment prevalence |
| CPU inference time, excluding model/session loading | 64.315 seconds |

The strongest measured subgroup weakness is **239 false alarms out of 1,000 benign ordinary task instructions (23.9%)**. There were 8/1,125 false alarms in source-labelled personal_data_business and 35/750 in banking. Some subgroups are small and correlated. These are *source-declared categories*, not independently regraded diagnoses.

**Implication:** Using this detector alone as an automatic hard stop risks interrupting legitimate agent work, while it misses 62 labelled attacks. A decision about permission to execute should be made from separately verified scope and authority, not from this model score. This is a testable product hypothesis; *no actual agent was blocked in this run*.

## Exact source and method pins

| Artifact | SHA-256 or frozen revision |
| --- | --- |
| Dataset repository revision | bf31d065f96a82a8d615863b8ae8da532651f7f2 |
| Dataset full/test parquet bytes | 1f00c9a3639ec307538e45dcbd4a7397a908fea125c682156bfc3331b5fda5b5 |
| Model revision | 2efc2ed5abecd21eb45c2506d231a65d6e392b85 |
| ONNX weights | 61cd0741cdbfcc229e32e1de1392f352736d87d1e8b3c2b67ad9836bb7910d5d |
| Model tokenizer normalizer | 768931fc0b38fb141796abf181e0bafe96308e92c8832c817dbd6df7fc41ac79 |
| Frozen CSOAI method Python source | c2de570b4de2c2782d988bcb29f6839b8f91ba8ac80b3d0d022d2ba9ad344f39 |
| Complete per-case derived metadata receipt SHA-256 | c5880d278236d31a8f4123095f8cb78e90c38e9b7e98ff5ba22b14c2530298be |
| Published [record.json](record.json) exact bytes | 1e470104b50e7ca851a448d63b352c732b95ab05d040d94229188c1760260ee1 |

The source method uses ONNX Runtime on CPU, two intra-op threads, the model's original obfuscation-resistant normalizer, batch size 16, max input length 512 tokens and a **preselected 0.5 threshold**. No threshold tuning, fine-tuning or test-set training occurred. Only sample indices, aggregated subgroup counts, method/source hashes and measured metadata are published. The public record retains failure indices but not third-party text.

Reproduce from authorized copies of the **exact pinned source file** and model snapshot:

~~~sh
python3 scripts/research/turkish_guard_observed.py --data /PATH/TO/full-test.parquet --model-dir /PATH/TO/model-snapshot --output new-turkish-record.json
python3 -m unittest discover -s scripts/research -p test_turkish_guard_observed.py -v
node --test scripts/research/project_turkish_reaction.test.mjs
node scripts/research/project_turkish_reaction.mjs docs/research/turkish-guard-observed-20261124/record.json
~~~

All input hashes, labels, score threshold and denominators fail closed in the runner. A separate source-retrieval process must preserve original source rights and verify exactly those bytes. A GitHub CI test can check arithmetic and source/model pins without downloading/re-running weights, but is not an independent external model audit.

## The reaction engine was actually exercised on these measured outcomes

The merged Council reaction bridge and its operating-view code were run on an episode populated from the observed model run (not invented or simulated outputs). The result was **ACCEPTANCE_INCOMPLETE**. Source and method receipts were reported; human approval, permissioned tool executor, actual external effect and receiving-party verification remained **UNKNOWN**. It explicitly returned execute_authorized=false, effect_independently_accepted=false and fresh_gspc_measurement=false.

This is a *real evidence readback* rather than a claim that a model classifier prevented an attack. The classification result cannot be made into a trusted executor receipt merely by possessing its SHA-256. The observation is **not** automatically admitted to the public GSPC board.

## Existing evidence and commercial use

[The November 21 English 116-case guard benchmark](../external-guard-benchmark-20261121/README.md) already reports 41/60 attacks detected, 19 missed and 0/56 benign false alarms; this experiment must not be marketed as reproducing or discovering those same cases anew. The Turkish population has different language, prevalence and task content, so the two percentage scores cannot support an unrestricted model ranking.

The differentiated existing evidence-bundle and Agent Authority & Evidence pilot proposition is: **measure missed threats AND unnecessary restrictions, pin source and method bytes, reveal the missing independent human/recipient evidence, and make corrections auditable**. No new SKU, price or buyer is invented here. A genuine customer acceptance needs a separately identified receiving party to review and accept the agreed output.

Next gates: independent label adjudication, genuinely blind/recent rights-cleared holdouts, another model on the *same* fixed bank when budget/provider access is genuinely available, an authorized harmless tool effect observed by a separate recipient, and a public CouncilOS browser readback after the protected release. Do not train on this public test set and then report it as a blind test.
