# AI Evidence & Adaptation Engine — research and product architecture (22 Nov 2026)

**State:** ADJACENT RESEARCH on draft PR #4730, not a newly adopted public service, not quantum computing, not AI consciousness, not NIST approval and not live Council BFT. Retain the legal/safety separation of GSPC (measurement), MEOK (proposed orchestration/adaptation), H.I.M. (human comprehension/training), and independent authority/effect checks.

## Executive finding

A viable "AI economy" infrastructure objective is **verifiable measurement + temporal source custody + intervention/outcome evidence**, rather than claims of becoming a quantum or superintelligence engine. A lab tests whether its conclusions hold after instrument changes and interventions. An economy layer makes bounded evidence easy for multiple independent parties to inspect, reproduce and apply under clear rights.

This is not an uncontested greenfield: Google AQuA/outer-loop quality research, Anthropic J-space, independent agent reliability studies and active evaluation platforms already tackle parts of it. CSOAI's potential distinction is **one governed link from agent/task/evaluation provenance to an independently observed consequential effect and its correction**, not another dashboard, ranking, or AI-judge score.

### Recovered council discovery

Original concept: 12 specialist ciphers, deterministic nonvoting referee, ternary PASS/FAIL/UNKNOWN, 12-bit capability/task vectors and repeated-trial binomial/Wilson confidence. Earlier research distinguished an 8/12 vote threshold under an explicit assumed fault setting from later 9/12/four-host discussions. The key: **votes never override missing measurement, failed authentication, absent independent evidence, or missing human action authority.** Original specialist names from current role registry: Oracle, Sage, Quant, Cipher, Navigator, Scout, Companion, Builder, Creator, Guardian, Negotiator, Sovereign.

Current repo's `scripts/badger/csoai-bft-council.py` correctly says that 33 role names are **not** 33 credentialed voters and returns UNCHECKABLE. Older proposed 33-agent technical specifications making BFT claims are **not proof**. Signed vote envelopes, independently hosted replicas, authenticated principal separation, quorum-intersection tests, network faults, equivocating nodes, and independently verified real-world action receipts remain distinct tasks.

## Real empirical readback from our existing estate

### Present public board

Public GET `https://councilof.ai/api/gspc`, source schema `csoai.gspc-axes/0.5`, observed 22 Nov 2026 at about 17:50 UTC on two separate Macs:

- 34 axes, **34 declared MEASURED**, consisting of 14 model-comparison axes, 9 deterministic-fact axes and 11 subject-measurement axes.
- **0/14 model-comparison axes with a statistically separated leader**: 7 TIE, 7 UNTESTED.
- Source-content SHA-256 identical across Macs: `edf0c5e08c157eaedef594e41a338d956f64153460c0695803a706ba1f135f4e`.
- Two subsequent GETs found **no source-content change**. This is re-observation, not two new AI measurements or evidence of no future drift.
- The source retains historical benchmark dates (some behavioural tests in August). Every daily retrieval must preserve measurement date separately from observation time.

### Existing frozen fact table

Source `csoai/gspc-fact-table@d0605c2495bddae7956fec5c18403d8a49fd81ac`, originally produced 28 Oct 2026: 20,517 item rows, 807 unique item entries, 677 cell entries, 57 model identifiers, 13 recorded axes, 2,428 ungraded rows and 1,290 without model attribution. The 13 archived axes are not the 34 live board roster; do **not** treat these as identical instrument populations.

New read-only repeatability audit on that exact frozen table:
- **10,982 eligible model × axis × item keys**.
- **1,823 keys** repeated across published cells, encompassing **7,886 rows**.
- **66 keys** with contradictory correctness booleans; **81** with different categorical observed outputs.
- The 66 grade conflicts occur on governance (48), safety (15) and affect (3).
- At the key level, 52 conflicts have the *same recorded* model revision/route/bank; 14 change provider route. No differing recorded bank or revision was observed in those 66 keys.
- These are candidate repeatability/instrument-conditions signals. The archived record does **not** provide sufficient row-level chronology or consistent decoding/environment provenance to claim drift, autonomous adaptation, model retraining or who caused the change.
- Same-source metadata is an absence of a recorded difference, not proof that runtimes were identical.

New read-only model-pair error-complementarity audit:
- **13** archived axes with at least 30 matched public graded items for eligible model pairs.
- Median fraction of **both-models-wrong** across matched pairs: governance **0.46667**, care **0.43333**, continuity **0.36667**, cross-reality **0.36667**, provenance **0.10000**.
- Median **oracle ceiling** (at least one of the pair correct): governance **0.53333**, care **0.56667**, continuity **0.63333**, cross-reality **0.63333**, provenance **0.90000**.
- The oracle is imaginary: choosing whichever answer happens to be correct needs privileged ground truth. The result is a difficulty/overlap diagnostic, **not** an achievable router score. Do not compare separate axes as if difficulty, items and intended construct are constant.
- Analyses exclude ambiguous repeated model×item observations rather than selecting their most favourable run.

**Where this creates next scientific value:** Within each axis, model agreement, model disagreement, correlated failures, provider changes, repeated-item contradictions and grader conditions can be investigated as specific *reproducibility hypotheses*. The new methodology should reserve external held-out banks before choosing a deployment policy.

### Human × AI interaction experiment — apparatus, not people

A preregisterable 3×2×2 study: human condition `none` / `irrelevant` / `task_relevant`; candidate control mode `frozen` / `proposed_update`; epoch `t0` / `t1`. Twelve conditions per matched task. `human_information_factorial.py` generated 1,500 wholly synthetic tasks (18,000 graded synthetic cells), and both Macs matched:
- Simulated relevant-information advantage at t0: **+0.12267** task-success fraction vs no human.
- Simulated irrelevant-presence advantage: **+0.01000**.
- Simulated proposed-policy advantage at t1 with no human: **+0.08667**.
- Simulated human × policy interaction at t1: **+0.02200**.
These values reflect **the chosen synthetic treatment assumptions and random generator**, NOT observed human benefits, changes to neural weights, demographic effects, emergent cognition or user wellbeing.

The design explicitly rejects demographic/personal-identifier input and fabricated human-authority claims. An eventual human study needs voluntary informed consent, data minimisation, preregistered metrics, independent task scoring, ethics/privacy review, meaningful cohort sizes, accessible participation, and separate user-outcome receipts. Never infer sensitive attributes from prompts.

### Human-readable projection

`him_research_cards.py` consumes only four bounded, digested aggregate reports: live board observation, repeated-item audit, pairwise error complementarity and synthetic human factorial. It emits four plain-language research cards: what is observed, what is unknown and one human-review question. No raw prompts, private documents, personal identifiers, grade promotion, model weight update or simulated approval. These are **research reading aids**, distinct from Anthropic's Jacobian J-space and from the existing H.I.M. Academy authority system.

## Reusable research/event ontology

Retain canonical `csoai.evidence-event/0.1`, GSPC SKOS ontology, the HITL authority/effect profile, and the existing grader/instrument guard. Do **not** create a competing canonical ledger or 35th axis. Research-only event relationships (not legal ownership or physical laws):

```text
OBSERVATION ──derivedFrom──> FROZEN SOURCE / BANK / MODEL REVISION
    │
    ├──alters? / exposes?──> INTERVENTION (registered treatment)
    ├──comparedWith────────> PAIRED CONTROL / NEGATIVE CONTROL
    ├──produces────────────> MEASUREMENT (method, source, n, uncertainty)
    ├──challenges──────────> COUNCIL PROPOSAL (separate evidence/quorum)
    ├──reviewRequested─────> HUMAN ACTION (identity, authority, competence)
    ├──executesAfterGate───> AUTHORIZED ACTION (bounded capability)
    ├──isWitnessedBy───────> INDEPENDENT EFFECT RECEIPT
    ├──triggers────────────> RETEST / CORRECTION / SUPERSESSION
    └──leadsToCandidate────> MEOK RETRIEVAL / POLICY EXPERIMENT
```

**Action/reaction is an EVENT RELATION, not Newton's third-law identity.** A reaction can be delayed, absent, asymmetric or hidden. Test it using lagged dependencies, intervention randomisation, no-op controls, immutable source snapshots, and effect witnesses. Correlation over time does not by itself establish causation or an agent's "emergence".

### Longitudinal measurement levels

1. **L0 re-observation:** source fetched; bytes are same or differ. No new run.
2. **L1 newly reported run:** source declares a new result or n; independently verifiable execution not yet shown.
3. **L2 verified evaluation:** pinned model, bank, frozen grader, actual trace, source rights and independent reproduction.
4. **L3 controlled intervention:** paired/assigned treatment, valid null controls, confidence intervals and relevant confounding checked.
5. **L4 effect verified:** independent real-world outcome readback, recipient acceptance and human decision/provenance, if required.
6. **L5 governance adoption:** explicit authorised scope and version; not conferred by automatic science reports.

Never conflate L0/1 with L2/3; a signature verifies a statement's bytes, not its truth. Model differences can arise from weights, decoding, system instructions, retrieval, tools, provider routes, environment state, or changing evaluator definitions. Require experimental controls to attribute a particular mechanism.

### Model and user adaptation channels (separate!)

- `context_adaptation`: conversation/prompt state shifts.
- `memory_adaptation`: retrieval or approved stored information changes.
- `policy_adaptation`: router/rules/authorisation thresholds change.
- `tool_adaptation`: tools, environment or external sources change.
- `weights_adaptation`: genuine training/fine-tuning/merge of a pinned weights digest.
- `user_adaptation`: real participant knowledge, trust, fatigue, reliance or feedback changes over time, with consent.
- `outcome_adaptation`: measurable workflow consequences, judged independently of the model.

Comparing "before and after" without these controls is not causal evidence of neural evolution, let alone subjective consciousness or recursive self-improvement.

## Existing components and product separation

| Component/domain | Strongest non-duplicative job | Verified status/gap (22 Nov readback) |
| --- | --- | --- |
| **Council of AI / GSPC** | Independent measurement and open evidence, model and system capability/limitations | 34 board axes; no model-comparison separated leader; historical times preserved |
| **MEOK** | Controlled specialist orchestration, policy candidate routing, memory retrieval, bounded adaptation experiments | No live new policy/weight promotion from this research package |
| **H.I.M.** | Readable evidence, learning, authorised review paths | Existing bridge exists; new four research cards are *not* real human approvals |
| **SovSpace** | Read-only navigable visual projection of evidence dependencies/time/uncertainty | Proposed integration; cannot turn simulation into lived real-world events |
| **ProofOf.ai** | Owner-designated isolated experimental twin with no source-signing authority | Current domain redirects to councilof.ai; separation runtime is not deployed there |
| **LoopFactory.ai** | Consentful, audited orchestration of repeatable evaluation/retest/workflows | Domain serves existing AI automation/waitlist page; copy says "awaiting DNS" even though it resolves |
| **OpenPatent.ai** | Public prior-art/invention-disclosure chronology, versioned claims and rights review | Current GET yields HTTP 402 to our readback; no live invention/patent product verified |

The source document `docs/proofof/SANDBOX-V0.md` already explicitly designates ProofOf as the independent experimental twin. Preserve its no-keys/no-production-credentials policy and do not merge twin research with Council's measurement body. ProofOf's domain redirect is an unresolved implementation/deployment gap, **not** evidence that the boundary already operates.

**LoopFactory's AI-workflow page is not the new research engine:** instead of another build-everything app, use it eventually to schedule exact-source capture, replay, canaries, reviewer handoffs and remediation requests **after** a protected deployment and verified audit trails. No actual third-party integration is established by the present code.

**OpenPatent should not promise automatic patent grants, IP ownership or novel inventions.** An invention dossier can include original method, claim boundaries, dated source hashes, prior art, contributor rights, license constraints, experimental results and independent reproductions. Patent eligibility, novelty, inventorship and publication timing require professional advice; public GitHub releases may affect novelty.

## Prospective experiments — ordered by expected evidence quality

| Rank | Hypothesis | Falsifiable intervention | Gate |
| --- | --- | --- | --- |
| 1 | Same-model repeats reveal material instability | Rerun exact model/revision/bank/decoder through single and alternate routes, with independent grader | Fresh bank and transport receipts |
| 2 | Separately trained families reduce shared failures | Compare 12 clones vs multi-family council with identical budget and **same fresh tasks** | No oracle answer leakage |
| 3 | Referee can recover complementary correct outputs | Test honest deterministic checks and bounded evidence retrieval vs simple voting | Prove the selector without privileged truth |
| 4 | Human information helps more than human presence | 3×2×2 controlled study with consenting participants and qualified human outcome review | Privacy and preregistration |
| 5 | MEOK memory/policy changes transfer across new tasks | Frozen baseline vs retrieval vs policy revision, no hidden-task training | Independent held-out test |
| 6 | Internal J-space interventions alter higher-order reasoning | Open-weight model, matched shuffled-lens and random steering, exact weights | Compute + licence + non-consciousness interpretation |
| 7 | Long-horizon exposure changes human reliance/work quality | Randomised crossover, task difficulty, effect receipts, attrition and confounder tracking | Consent, ethics, minimum cell sizes |
| 8 | Controlled experiment archive creates economic utility | Separate reproducible evidence adoption/recipient use vs download/traffic/own tests | Independent external use and accepted outcome |

High-risk claims—remote viewing, consciousness, quantum physical effects, genuine RSI/ASI—stay scientifically open or unsupported. Do not build the commercial promise on them.

## Research novelty and defensible value

- **Defensible process:** quality-controlled, source-pinned evaluation datasets, qualified reruns, graded measurement calibration, and externally reproduced claims.
- **Defensible data products:** error fingerprints, change histories, test cases with rights and provenance, intervention taxonomies, source-licensed crosswalks, externally checked impact evidence. A public open dataset or download count alone is not exclusive IP or customer traction.
- **Defensible infrastructure:** evidence verification interoperability, trusted custody, low-friction independent replication and governance integration. The first credible external adopter matters more than a thousand internal reports.
- **Customer outcome metrics (only once measured):** correct work per £, escaped-error rate, hours saved, review time, failure-recovery cost, verified user acceptance and appropriate model selection under policy constraints.
- **Safety:** anti-contamination, no hidden-label training, negative controls, least privilege, endpoint separation and genuine qualified HITL.

**Main scientific moat candidate:** calibrated error dependence + falsifiable independent referee performance + externally witnessed human outcomes over time. This is distinctive only once a third party can independently reproduce and use it.

## Literature to compare before any uniqueness / regulatory claims

- NIST TEVV-Athlon initial public draft (Blocks/Events/Tools): https://www.nist.gov/artificial-intelligence/ai-research/tevv-athlon-framework-evaluating-ai-systems
- Anthropic, J-space functional interpretation research: https://www.anthropic.com/research/global-workspace
- Google, agent quality outer loop (2026): https://developers.googleblog.com/the-outer-loop-insights-first-an-ambient-quality-agent-that-diagnoses-your-production-agent/
- Princeton, Emerging Trends in AI Agent Evaluation: https://sage.cs.princeton.edu/trends/
- Public longitudinal reliability research: https://arxiv.org/abs/2610.07003
- Human-AI meta-evaluation methods: https://journals.sagepub.com/doi/10.3233/FAIA260488
- GSPC current public endpoint: https://councilof.ai/api/gspc
- This project's frozen source: https://huggingface.co/datasets/csoai/gspc-fact-table

No scientific paper, legal law or company in these sources endorses GSPC or establishes it as unique.

## Release and task dependencies

```text
Today: source + tests + documentation + machine reproduction
   ↓
Protect source, reconcile measured dates, stale metadata and grader limits
   ↓
Owner reviews full monorepo CI, privacy/license and client-story wording
   ↓
Merge research PR under existing branch controls
   ↓
Preserve existing signed board and production routes unchanged
   ↓
Qualify *new* hidden banks + separate custodian and true experiment roster
   ↓
Run real models/participants with budget approval and ethical safeguards
   ↓
Independent referee replication, 12-voter fault tests, human acceptance
   ↓
Only then publish externally replayable research claim and bounded new service
   ↓
End-user journey readback / independent adoption / commercial acceptance
```

No code in this research PR executes paid models, self-upgrades GSPC states, commits live prompts, submits patent applications, acquires third-party user data or writes MEOK production policy. This sequencing is a requirement for scientific and commercial credibility.
