# GSPC × MEOK: Towards an Evidence-and-Adaptation Infrastructure for the AI Economy

**Research white paper · Version 0.1 · 23 November 2026**

Council of AI / CSOAI · Open methodology and source-linked results · CC-BY-4.0 narrative

**Research status:** independently reproducible code and limited source re-analysis; not peer reviewed, externally certified or deployed as a live integrated service.

## Abstract

The AI economy will need more than measurements of model outputs at one instant. An organisation relying on models or agents needs to know which model and dataset revision ran, what a human was shown, which rule applied, how strongly errors correlated, what changed after interventions, whether the change persisted, and whether an external party actually received the intended effect. We propose a bounded **Evidence-and-Adaptation Engine** composed of GSPC measurement, MEOK candidate orchestration, a deterministic source-checking referee, readable H.I.M. human-review projections, and read-only SovSpace evidence navigation.

We report five classes of existing evidence: a publisher-declared 34-axis public board; re-analysis of a frozen public 20,517-row fact table; a controlled rule-referee demonstration; a 97-entry correction-timing audit; and a source-level replication that uncovered answer-key exposure in a historical 3-around-1 council experiment. We distinguish these from synthetic 12-voter, long-trajectory and human-information studies and from a limited retrospective transfer study of published J-space features. There is no demonstrated quantum computation, AI consciousness, independent Byzantine consensus, recursive self-improvement, or real-user causal benefit in these reports.

The core result is methodological: **a verified chain of claims, versions, rules, human authorities, and independently observed consequences is more reusable than a static score**. Whether this infrastructure materially improves operations is a falsifiable, prospective question.

## 1. What we mean by an AI economy measurement

A leaderboard condenses a model's performance under a specific task sample and grader. This is useful, but not the same as proof that the model will complete a real workflow safely, cost-effectively or consistently. Production outcomes depend on model weights, prompts, retrieval, tools, session history, decoding, provider route, operator instructions, user knowledge, policy, time and external systems.

We propose to describe a measured episode by the identity tuple:

\[
E = (\text{task},\ \text{bank revision},\ \text{model revision},\ \text{route},
     \text{decoding},\ \text{policy},\ \text{tool state},\ \text{human condition},
     \text{grader},\ \text{time},\ \text{observed outcome})
\]

A claim without these fields cannot be attributed cleanly to a change in neural weights, human input, provider route, retrieval or evaluation instrument. The minimum tuple can be smaller for a narrowly defined claim, but missing variables must be disclosed, not guessed.

A timestamp also has a type: **source-created time**, **model-run time**, **first public-service observation**, **signed-artifact time**, **witnessed commitment time**, and **external-effect time** are distinct. They should never be collapsed to one “event date”.

## 2. Existing estate and boundary conditions

GSPC already publishes a measured-axis board, public fact archives, an ontology of cards and correction/supersession states, and canonical graders/instrument guards. MEOK already has experimental orchestration, memory and policy designs. The Council repository already contains \`csoai.evidence-event/0.1\`, signatures and root/witness plumbing, as well as H.I.M. Academy training components. Our work builds **read-only research sidecars** and does not supersede the canonical grader \`harness/gspc-top100/mill_hub_queue.py\`, signed board admissions, protected governance or actual human authorisation.

The public \`GET /api/gspc\` readback on 22–23 November 2026 returned **34 axes**, all marked \`MEASURED\` in the publisher's board state. Fourteen were model-comparison axes, **zero with separated leaders** at that retrieval (seven TIE and seven UNTESTED). These labels are source declarations with historical underlying experiment dates, not evidence that 34 new model measurements occurred on 23 November.

The research programme must not promote \`RESEARCH\`, \`SYNTHETIC\`, \`PUBLIC_SOURCE_OBSERVATION\` or \`UNVERIFIED\` into a qualified \`MEASURED\` claim without an actual new experiment and the original approval gates.

## 3. Actual results and careful interpretation

### 3.1. Historical item-level variation

We pinned the public fact table \`csoai/gspc-fact-table@d0605c2495bddae7956fec5c18403d8a49fd81ac\`, which contained **20,517 archived measurement rows, 807 items and 677 cell records**. Our read-only join found **10,982 eligible unique model × axis × item keys** and **1,823 keys observed repeatedly** across cells. Among those repeated keys, **66 differed in recorded correctness** and **81 differed in recorded outputs**. By category, correctness conflicts were governance (48), safety (15) and affect (3). Of the 66, 52 had the same *recorded* model revision/provider route/bank and 14 involved route variation.

The observation establishes that historical records can disagree even where a model name and task label match. It **does not** prove temporal model drift: the source lacks sufficient per-row timing and full decoding/runtime provenance. Nor does it prove model weights self-modified, a safety failure reached a real user, or a routing intervention would resolve any conflict. Multiple archive cells may use different operational contexts; these are candidates for prospective reproducibility controls.

An independent GSPC integration release train handles a different, larger 53,847-row observation source with a different denominator. These counts are **not pooled** with the pinned 20,517-row bank. The population, grader and revision must remain attached to every reported denominator.

### 3.2. Error dependence between model outputs

Among eligible, matched **public historical** model pairs, we measured how often both models were wrong. The median pairwise jointly-wrong proportions included governance **0.46667**, care **0.43333**, continuity **0.36667**, cross-reality **0.36667** and provenance **0.10000**. These are *different task families* and cannot be ranked as equivalent measures of risk.

The complementary “either model was correct” quantity is an **oracle upper bound**: a chooser who already knows the answer could always select the correct model whenever at least one succeeds. A deployable referee cannot use that privileged answer. It must be evaluated on a fresh bank with hidden ground truth and independent evidence.

A crucial prospective hypothesis is that **separately trained families plus a source-checking, abstaining referee** may reduce correlated failures relative to twelve identical instances at a matched compute budget. The current retrospective data do not establish that improvement.

### 3.3. Deterministic source-checking vs votes

We implemented a small, read-only “12+1” *rule* referee using the publicly served GSPC JSON. A false claim of **one separated model-comparison leader** was rejected after independent source counting even when twelve **unverified, synthetic** advisory positions all favoured that false claim. A true claim that the board had 34 axes was accepted even with zero advisory support.

This verifies deterministic rule execution and explicit refusal to let unsupported votes override source facts. It does not call twelve independent models, authenticate a quorum, prove BFT, verify the origin of the GSPC publisher, or make a human decision.

The older Council ruling design is more appropriate than “majority decides truth”: registered code and pinned bytes decide measured states, while reviewer agents challenge rule applicability, source integrity, reproducibility and whether proposed public wording exceeds its evidence. Human authority to execute remains separate.

### 3.4. The historical 3-around-1 perfect-score limitation

We recovered and examined the original **26 October 2026** \`meok-backward-3around1.mjs\` and its matching signed result on an authorised owner device. The result reported 20 source-authored frozen-ledger tasks plus twelve local Ollama (\`qwen3:1.7b\`) tasks. The local model-only synthesiser answered **9/12**, while the deterministic centre referee answered **12/12**. The combined historical headline was **32/32**, with an associated McNemar calculation.

The original code supplies each centre-referee task with one of three metadata fields: \`newest_active_option\`, \`genesis_floor\` or \`synthesized_option\`. **On 12/12 tasks, that field contains the correct A/B/C/D answer choice**. We extracted the original referee function without executing its key-loading or original model calls and forced all three model-seat outputs to incorrect choices:

| Counterfactual condition | Correct referee outputs |
| --- | ---: |
| All three seats wrong, answer-bearing task metadata retained | 12/12 |
| All three seats wrong, answer-bearing task metadata removed | 0/12 |

The original Ed25519 signature verifies with the *public key included in the historical record*; the internal evidence digest also reproduces. This attests to consistency under that embedded key, not independent signer identity, hidden-label separation or scientific validity.

**Therefore the 32/32 score is a source-specific rule-selection demonstration, not proof that a blinded council independently solved every task.** Publication correction and new blind validation are tracked at [GitHub issue #4737](https://github.com/CSOAI-ORG/councilof-ai/issues/4737). The original signed bytes should be preserved with a dated qualification, not silently altered.

### 3.5. Correction timing and provenance

The public corrections ledger contained **97 source-maintained entries** on 23 November 2026. Its current time coverage was **two exact source-declared detection-to-publication intervals, five upper bounds, and ninety unknowns**. The two exact durations were 4,600 seconds and 294,635 seconds. Their correct conventional median is **149,617.5 seconds**. The older API calculation selected the larger of the two; the correction is in a protected code PR at the time of this paper. This does **not** establish a representative operating SLA: only two entries have the necessary timestamp precision, and the times need independent deployment evidence.

At **01:02:28 UTC, 23 November 2026**, a separate source observer fetched the public endpoint, successfully verified its content against the published DID/Ed25519 key and captured the source body content digest \`cabc99524da2b43ead7b1eca23d2ac40b9e2fb8d6533a609e998596a8fe6ae36\`. Its readback receipt SHA-256 is \`63161ff111247b281e929a7a974e56a239436b6f9c0673e2a22540c8b4f20838\`.

That readback proves **public accessibility at observation time**. A source commit, OTel log, Sigstore/Rekor inclusion proof or OTS Bitcoin timestamp can authenticate a different property—such as existence of committed bytes or a witness time bound—but does not automatically establish *when each correction first appeared publicly*. Exact correction-to-root inclusion and deploy-to-response linkage require separate proofs.

### 3.6. J-space and human-information hypotheses

A fixed logistic transfer baseline trained on published Stage 1 third-party J-space features and evaluated on published Stage 2 features obtained approximate aggregate AUROCs of **0.64993 output-only**, **0.59118 workspace-only**, and **0.61995 combined**. These are a limited retrospective CPU baseline: they neither reproduce every original publisher model nor establish a general result that internal states are useless. They do not demonstrate a subjective AI experience.

An independently coded **synthetic** 3×2×2 human-information / candidate-policy / period factorial over 1,500 matched tasks produced a simulated relevant-information effect of **+0.12267** at t0, an irrelevant-presence effect of **+0.01000**, a candidate-policy effect of **+0.08667** at t1 without human information and a human×policy interaction of **+0.02200**. These are generated consequences of *chosen simulation assumptions*, not evidence about real users, populations or model weight training.

No claim of human-AI cognitive co-evolution or recursive self-improvement follows. Those ideas require genuine consenting participants, independent outcomes and verified change channels.

### 3.7. Three-arm MEOK adaptation: why a small apparent gain is not yet evidence of learning

A separate **historical exploratory MEOK comparison**, reported in November but not independently reproduced in this release, described three arms on 24 held-out questions: (A) frozen Qwen2.5-0.5B with full records, (B) a LoRA-adapted model with the same records, and (C) the frozen model retrieving the most recent record. Reported totals were 8/24, 7/24 and 9/24 respectively. A follow-up numerical-stability/precision diagnostic reported 8/24 for its comparison baseline/adapter and 11/24 for compact retrieval. **The original item-level paired predictions and training-run artifacts were not recoverable during this review; these figures are historical reports, not new independently verified results.** In particular, the 11/24 diagnostic must not be pooled as though it used the same numerical conditions as the original arms.

A useful exact mathematical check is possible even *conditional* on the reported 8/24 versus 11/24 scores being measured on the same 24 tasks. Let `x` be the number of tasks both arms answered correctly. The possible overlap is `0 <= x <= 8`; retrieval-only gains are `11-x`, baseline-only gains are `8-x`. Enumerating **all nine possible overlaps** and applying the exact two-sided paired McNemar/binomial test yields **p between 0.25 and approximately 0.647606**. Even the most favourable matching (three gains, zero regressions) does not reach the conventional 0.05 threshold. For 8/24 versus 9/24, the exact two-sided p-value is **1.0 at every possible matching**. No confidence interval or hypothesis test establishes superiority from these aggregate scores; the observations are too small, and the precision change introduces a confound in the diagnostic.

The scientific next experiment therefore requires an **identical sealed task bank**, frozen source and model revisions, the same decoding and numeric precision for each arm, item-level predictions and validity flags (including NaNs/invalid outputs), per-case tool and retrieval traces, paired gain/loss accounting, repeat seeds, latency/cost, and a truly withheld answer key. A fourth, **sham/latest-record retrieval negative control** can help distinguish newer information from simple prompt length or route effects. Predeclare the primary metric and statistical test; keep human authorisation and externally verified downstream effects outside the model-learning score. Do not promote adapter weights, retrieval policies or model claims on this retrospective comparison.

## 4. A prospective research model

An evidence cycle has **separable actors and states**:

1. **Subject:** model/agent/app, task and exact runtime revisions.
2. **Instrument:** declared evaluation bank, grader and measurement purpose.
3. **Observer:** captures source, time and negative controls; does not confer authority.
4. **Referee:** checks specified rules and proofs; abstains on missing evidence.
5. **Human:** a specifically qualified, consenting and authorised reviewer where required.
6. **Executor:** a separately scoped permitted tool/action.
7. **Witness:** independently confirms the downstream effect for the intended receiving party.
8. **Correction:** appends a new superseding record, without rewriting the historical one.
9. **Learning candidate:** proposes new retrieval, policy or training paths to MEOK under an independent held-out gate.

In event terms:

\`\`\`
source E0 --observed_as--> O0 --evaluated_under--> R0
                                  |
                                  +--challenged_by--> independent referee review
                                  |
                                  +--authorised_by--> qualified human [when required]
                                  |
                                  +--executed_as--> bounded action A1
                                                       |
                                                       +--witnessed_as--> effect E1
                                                       +--otherwise------> HOLD / UNCHECKABLE
retest R1 --compared_with--> R0 --corrected_by--> supersession S1
\`\`\`

“Action/reaction” here is a **recorded relationship**: it is not Newton's third law. Feedback loops can have lag, amplification, hysteresis, omitted observations and asymmetric effects. Lagged observational correlations alone do not demonstrate causal intervention.

### Model change must be classified before analysis

- **Context adaptation:** the prompt/session history changes; model weights need not.
- **Retrieval adaptation:** stored memory/index/search results change.
- **Tool adaptation:** available tools, routes, credentials or external data change.
- **Control-policy adaptation:** guard/routing thresholds or human procedures change.
- **Weight adaptation:** training, fine-tuning or merging yields a new verified weights digest.
- **Human adaptation:** observed learner skill, reliance, trust or fatigue changes under consent.
- **Outcome adaptation:** independently observed work consequences change.

A before/after accuracy number without these separations is **not evidence of neural self-improvement**. A functional J-space-like human evidence view is distinct from direct measurement of a model's internal neural representation. Neither is proof of phenomenal consciousness.

## 5. Registered experimental programme: falsifiable, not aspirational

**Experiment A — repeatability under controlled conditions.** Rerun the same pinned model, identical decoding and fresh rights-cleared tasks with fixed and alternate provider routes. Stratify task difficulty. Pre-register the primary endpoint as per-item success disagreement, not only mean accuracy. Use independent grading and report abstentions and cost. A null route effect would falsify a strong route-variability claim.

**Experiment B — value of evidence-conditioned council.** Compare single model, 12 homogeneous replicas, 12 diverse models, vote-only aggregation and a source-checking referee on the **same hidden tasks**, with equalised cost. Pre-register source custody, randomised answer positions, missing-source controls, adversarial unanimous false-vote cases and explicit \`UNCHECKABLE\`. The referee must not see or encode the answer key. Report coverage and unconditional accuracy separately. A verified failure to improve relative to cost-matched baselines would falsify a claimed gain.

**Experiment C — human input vs mere presence.** Recruit consenting, appropriately qualified adult participants for clearly bounded, low-risk work tasks. Randomise (none / irrelevant presence / task-relevant information) × (frozen / candidate policy) × (time epoch), counterbalance repeated tasks, minimise personal data, disclose source and scoring. Outcomes include independently checked work quality, task duration, correction burden, user confidence calibration and retention. Do not infer sensitive demographic groups from prompts. Study ethics and privacy must be approved before live participation.

**Experiment D — adaptation and hidden transfer.** Compare frozen policy, approved MEOK retrieval and a candidate policy/weights change on an untouched final set. Require pinned source and weight digests, a controlled ablation isolating retrieval from weights, no final-set training, and a qualified promotion gate. Report regression cases including canary failures, not only aggregate uplift.

**Experiment E — verified downstream effect.** Choose one real, permissioned, bounded workflow. Prove the authorised human or principal, scoped executor, actual call effect and receiving-party acceptance independently. A successful HTTP 200, signed receipt or synthetic “customer succeeded” string alone cannot satisfy this test.

Every experiment must include the original pre-registration, instrument eligibility, sample-size justification, uncertainties, rights and privacy review, negative controls, code/release digest and any failed runs. A significant p value on a constructed, answer-exposed source cannot replace these requirements.

## 6. What the existing industry already does

Evaluation services, model cards, observability, training telemetry, OpenTelemetry, OpenLineage, agent reliability research, interpretability and safety studies already cover parts of this problem. The Council's plausible contribution is **a verifiable composition of them**, not a claim to have invented model evaluation.

Useful standards touchpoints include W3C PROV-O for relations between entities/activities/agents, DCAT for dataset lineage, OTel for operational events, OCSF/SARIF/in-toto for evidence carriers, NIST's developing TEVV-Athlon framework for measurement-event design, and source-conditioned AI oversight. Following a standard does not imply formal endorsement by its authors.

The most defensible prospective advantage is a **versioned collection of independently replayable failure modes, correction histories, calibrated error dependencies, human-authority checks and witnessed operational effects**. No commercial or intellectual-property monopoly is established merely by publishing this paper or public data.

## 7. Product boundaries and value

- **GSPC / Council of AI:** methodology, independent measurement identity, controlled instrument admission, quality-limited public evidence.
- **MEOK:** safe retrieval of qualified evidence, candidate specialist routing and proposed—not automatically deployed—adaptation.
- **H.I.M.:** readable evidence cards, learning tasks and actual qualified human review once identity and authority are proven.
- **SovSpace:** time- and dependency-aware *projections* that clearly mark source, simulation, missing evidence and real effects.
- **ProofOf.ai:** logically and operationally isolated experimental twin without access to live signing keys.
- **LoopFactory.ai:** permissioned scheduling of source captures, regression reruns, evidence-dependent holds and authorised actions.
- **OpenPatent.ai:** dated invention and prior-art dossier workflow, subject to inventor rights, licences and professional review, not automated patent grant.

Potential buyers can evaluate a concrete unit of value: lower escaped error rates, correctly routed tasks, time saved for verified work, reduced re-audit effort, repeatable corrections and trustworthy acceptance receipts. Downloads, internal tests and self-reported institutional participation do not demonstrate such customer outcomes.

## 8. Governance and a publication contract

Research readbacks should carry:

\`\`\`json
{
  "evidence_state": "RETROSPECTIVE_PUBLIC_REUSE | SYNTHETIC | PUBLIC_SOURCE_OBSERVATION",
  "source_revision": "immutable reference or unknown",
  "source_digest": "SHA-256 where actually computed",
  "measured_at": "source timestamp or UNRECORDED",
  "read_at": "independent consumer timestamp",
  "published_at": "independently established or UNRECORDED",
  "grading_rule": "pinned version or NOT_RUN",
  "human_approval": "NOT_ESTABLISHED unless specifically evidenced",
  "effect_receipt": "ABSENT unless independently checked",
  "limits": ["required, nonempty"]
}
\`\`\`

This illustrative object is a **research presentation contract**, not a new competing official \`csoai.evidence-event/0.1\` protocol. Qualified events should reuse the established provenance schema, signer authorities and supersession path. A report generator may restate verified evidence; it may not promote itself into an authoritative result.

## 9. Conclusion

The measurable opportunity is to turn disconnected measurements into a reliable, time-aware **infrastructure of constraints, explanations, interventions and witnessed effects**. The strongest immediate findings are (1) archived result variation that motivates reproducibility tests; (2) explicit correlations in model failure patterns; (3) a working source-rule referee that ignores unsupported votes; (4) a demonstrable historical answer-key leakage defect; and (5) precise gaps in correction-publication timing.

These are modest but falsifiable steps. The right next achievement is not a claim of artificial superintelligence or emergent consciousness. It is an independent hidden-bank council experiment, a genuine qualified human decision, a witnessed end-user effect, and transparent publication of what succeeds and what fails.

## Sources and reproducibility anchors

1. Council of AI, [GSPC public board](https://councilof.ai/api/gspc); live source readback, 22–23 November 2026.
2. Council of AI, [GSPC frozen public fact table](https://huggingface.co/datasets/csoai/gspc-fact-table), pinned revision \`d0605c2495bddae7956fec5c18403d8a49fd81ac\`.
3. Council of AI, [corrections API](https://councilof.ai/api/corrections); DID-verified 23 Nov readback, signed body content SHA \`cabc99524da2b43ead7b1eca23d2ac40b9e2fb8d6533a609e998596a8fe6ae36\`.
4. Council of AI, [historical 3-around-1 research flaw and correction issue](https://github.com/CSOAI-ORG/councilof-ai/issues/4737).
5. Council of AI, [GSPC × MEOK research source, test suites and docs](https://github.com/CSOAI-ORG/councilof-ai/tree/master/measurement/experiments/two-path-council), protected source branch originally PR #4730.
6. Anthropic, [Global Workspace / J-space research](https://www.anthropic.com/research/global-workspace). Functional internal representation analysis is not a consciousness test.
7. NIST, [TEVV-Athlon AI evaluation framework](https://www.nist.gov/artificial-intelligence/ai-research/tevv-athlon-framework-evaluating-ai-systems). Referenced for methodology only, without endorsement.
8. W3C, [PROV-O provenance ontology](https://www.w3.org/TR/prov-o/).
9. OpenTelemetry, [semantic conventions](https://opentelemetry.io/docs/specs/semconv/), telemetry transport and meaning distinct from independent public-service proof.

**Disclosure:** Some analyses reuse the Council's own previously published data. A second run by two owner-controlled Macs is useful machine-to-machine reproducibility, not independent outside scientific replication. Simulations are labelled as such. The reported research is not a legal, regulatory or standards-body certification.
