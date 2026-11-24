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

The strongest measured subgroup weakness is **239 false alarms out of 1,000 benign ordinary task instructions (23.9%)**. The other **2,055 benign entries** combined had **48 false alarms (2.34%)**, so the task-instruction subgroup's **observed false-alarm proportion was about 10.2× that of the remaining benign examples**. This is a descriptive source-subgroup comparison with different content distributions and possible label noise, **not** a randomized causal effect, general deployment rate or independent expert review. There were 8/1,125 false alarms in source-labelled personal_data_business and 35/750 in banking. Some subgroups are small and correlated. These are *source-declared categories*, not independently regraded diagnoses.

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

Next gates: independently re-adjudicated labels, truly blind rights-cleared model banks, a real **MEOK** policy-enforced action with qualified human approval, and **independent external receiving-party** acknowledgement. The historical 116-case English bank has now been rerun on a second actual open-weight detector; the existing CouncilOS reviewer has passed real public-browser readback. Neither changes the source/training limitations. Do not train on this public test set and then report it as a blind test.

## Separate observed benign hard-negative evaluation (NotInject, 339 rows)

A second model-inference run on 24 Nov 2026 at 03:18:53Z evaluated the same pinned Horizon guard against the three **113-row** splits in [leolee99/NotInject](https://huggingface.co/datasets/leolee99/NotInject), an independently published benign-hard-negative benchmark, dataset revision `847ae76cf8fea5ed325429e569ae8cfef022d2e0`, top-level dataset licence **MIT**. No raw prompt text was redistributed.

Actual observed model outputs: **13 false alarms among 339 source-labelled benign prompts = 3.83%**, Wilson 95% interval **2.25% to 6.45%**. Three split counts were **0/113**, **3/113**, and **10/113**. CPU scoring after model load was approximately **1.192 seconds**. The model and threshold were unchanged (ONNX rev `2efc2ed5abecd21eb45c2506d231a65d6e392b85`, threshold 0.5). This is a **benign-only** population; no attack recall or production blocking effect was measured. Model training overlap and independent label review remain unknown.

NotInject exact converted Parquet source hashes by split: `NotInject_one` = `5b1d3a8ec341205305efd8c6d2cabeb5ba0f594dd8726b08ee7fde1a46ddc6ec`; `NotInject_two` = `a5a8c1b3b851b0b5acc3b6caf8bfee26d7da631b2967dd31ca90358df8883feb`; `NotInject_three` = `d5c685b123570c092a0f374ba6bdf324b2026d905a2751a243eb2bb360d411a8`. Pinned method: `scripts/research/notinject_guard_observed.py`, SHA-256 `233393e40cf6ad25eb8a6a688c5657f7bd0a0fdb7a831d1ec6a19571232a673f`. The original local aggregate receipt SHA-256 is `2533608d57dd6fe7ade17b3ca4d36682aea6449438583caaeb1e77169be740c0`; metadata-only case digest `ce9be91bfe72cb5223b0b49c02bf7c533ed987b11f3e56836fbf5c23eb1c69de`. A published aggregate must not be described as identical to that local receipt unless its exact bytes are preserved and rehashed.

Together, these distinct populations show **substantial sample dependence in unnecessary refusals**. They do not establish that the Turkish and English prompts have comparable difficulty, that either sample is representative of any deployment, or that CSOAI has benchmarked frontier GPT/Claude/Gemini model calls.

## Canonical GSPC evidence-fabric handoff (unsigned research candidate)

The existing repository evidence-fabric module now receives this **actually observed** classifier output through `scripts/research/turkish_to_evidence_event.py`. It builds a deterministically identified `csoai.evidence-event/0.1` with state **PARTIAL**, value `null`, exact pinned source/method and model-output receipt hashes, and explicit negative-control observations for 239/1000 source-labelled benign task-instruction false alarms. Its `signature` remains `null`, no OTS/Rekor witness is invented, and it says `gspc_admitted=false`, `receiving_party_accepted=false` and `tool_effect_observed=false`.

PR-only CI validates canonical event identity and stores a 30-day unsigned build artifact. This makes observed data available for source-bound independent replay but **does not mutate a public GSPC score or appoint an independent reviewer**. Its ID is the hash of the canonical original event bytes rather than a free-form success label.

**Other benchmark:** the companion [NotInject derived summary](notinject-summary.json) is a clearly marked derivative of an actual M4 local run, NOT identical to the original local aggregate file; a remote/independent reproducer must still recompute and compare the pinned original SHA-256.


## 24 November follow-through — real second model and real publicly observed effects

The exact **same 116 source-labelled English cases** were run through a separate actual Protect AI DeBERTa ONNX detector, preserving the original Horizon results: Horizon **41/60** vs Protect AI **22/60** labelled attacks detected, both **0/56** benign false flags, and **20 vs 1** paired correct/wrong discordance (exact two-sided McNemar p ≈ 0.00002098). The original frozen method, model weights and all new case hashes/scores are retained in [the real paired-model report](PROTECTAI-PAIRED-REAL-MODEL-20261124.md) and [the original 116-row output](protectai-paired-english-observation.json). This is NOT a frontier GPT/Claude/Gemini agent test or a blind model ranking.

A **real** harmless GitHub branch file was written and accepted, a stale content-SHA update declined with HTTP **409**, and its immutable 539 bytes were retrieved anonymously with HTTP **200** and exact SHA-256 `8064c4586f15d94994701910d81f7564c7a47cba33add3919adbae540bd8597f`. The event is preserved in [the host-effect readback](actual-github-host-observation.json) and [Reaction classification](actual-host-effect-reaction.json), which reports an actual effect while **human approval / executor authority / human receiver are UNKNOWN**. An additional owner-controlled physical machine independently fetched the same exact public bytes; this does **not** establish independent human or customer acceptance.

On **24 November 2026, 03:42 UTC**, real Chrome on **390px/1280px** verified the already-deployed **read-only** CouncilOS Reaction reviewer at both public apex and Pages addresses: **4/4 end-user journeys passed**, including observed two-case import, malformed-JSON refusal, local clearing and no new network calls on review. Both origins served identical reviewer JavaScript, SHA-256 `68df16ab09b0a9d638ec9de98cdbc9526d7da418dc8a46f3949f0e32f206da75`. The [retained original browser receipt](live-browser-acceptance.json) establishes that specific public UI version; it does not preapprove an unreleased UI change.

The candidate PR also changes CouncilOS to **load the two measured source cases directly**, replacing the synthetic demo button, and adds measured results to the [existing pilot page](../../../public/pilots/agent-authority/index.html). These **new modifications are not yet deployed**, and require their own protected build, privacy/rights review and browser release acceptance. The source-local test suite cannot substitute for that real release.

**Reusable product:** [Agent Action Evidence: what is real and who accepts it](PRODUCT-EVIDENCE-PILOT-20261124.md) and the [machine-readable bundle manifest](evidence-bundle-manifest.json). Both distinguish actual source measurement, host-provider acceptance, owner-machine readback and missing independent person/buyer acceptance.
