# GSPC × MEOK hybrid science: consciousness-related methods and research controls

**Prepared:** 22 November 2026. **Status:** versioned research proposal + reproducible offline instruments. **NOT** a consciousness detector, paranormal demonstration, new GSPC axis, approved NIST measurement, independent study, running cloud service, or modification to live MEOK.

This method programme combines **falsifiable behavioural evaluation**, **causal internals interventions**, **repeated-trial information-control protocols**, **multi-agent correlation analysis**, and **append-only provenance**. It does not combine quantum dynamics, artificial consciousness, or extrasensory perception into one assumed physical law.

## Key distinctions: what is being claimed and what is not

1. **Phenomenal consciousness** is having subjective experience. There is no validated external pass/fail test that can establish it for an AI; subjective claims by models and model-generated descriptions of feeling are not decisive.
2. **Access-consciousness / global workspace** is a functional cognitive property: information can be reportable, used in reasoning, widely broadcast to subsystems, and causally manipulated. These properties can be studied without proving subjective experience.
3. **Metacognition** is calibration and monitoring of reasoning, errors or limitations. Test it with reality-anchored tasks, not by asking the model “Are you conscious?”.
4. **Emergence** describes properties that become apparent at a higher level of organization/scale. It does not prove sentience. Pre-register scaling curves and compare parameter-matched architectures to test emergence claims.
5. **Human-in-the-loop (HITL)** is a governance and experimental intervention. A human can supply information, correct an error or approve an action, but there is no evidence that merely interacting with a model uniquely “unlocks” phenomenal consciousness.
6. **Remote viewing** is a claimed anomalous information-access process, currently not established as a reliable AI capability. A genuine test must also distinguish normal inference, leakage, guessing, memory, algorithmic shortcuts and biased scoring.

## Historical research integrated, without conflation

### Thomas Campbell / CUSAC

Campbell and co-authors proposed alternative double-slit and delayed-choice setups to distinguish a consciousness-observer account of measurement from standard physical interaction accounts. Their theory forecasts an observable difference between which-path detection and the availability of the information to a conscious observer. The work is a *hypothesis programme*, not a confirmed resolution of quantum theory. References:
- https://www.my-big-toe.com/about/quantum-physics-experiments/
- https://www.testingthehypothesis.com/faq
- MIT 2025 physical tests: https://news.mit.edu/2025/famous-double-slit-experiment-holds-when-stripped-to-quantum-essentials-0728

**Feasible GSPC analogue:** independently randomise whether task/answer/scoring information is given to model, evaluator and human. This is an information-leakage / causal-intervention experiment, **not a quantum double slit**. A real optical quantum experiment would need appropriate laboratory instrumentation and separate controls.

### Anthropic J-space / Jacobian lens, 6 July 2026

Anthropic identified internal model representations that exhibit several functional workspace properties: reportability, causal control of verbal output, broader task use and selective importance to higher-order reasoning. The Jacobian lens projects residual activations through an average Jacobian into a token-vocabulary readout. Access-workspace properties **do not demonstrate phenomenal experience**.
- Research paper: https://transformer-circuits.pub/2026/workspace/index.html
- Reference code (Apache-2.0): https://github.com/anthropics/jacobian-lens
- Accessible research summary: https://www.anthropic.com/research/global-workspace

Independent replications differ. A Kaggle-based small-model replication found false-positive passive readouts under shuffled-fitting controls; another public campaign found some across-dataset error-prediction success but missed its pre-registered universal-transfer gate:
- https://github.com/amaljithkuttamath/jlens-replication
- https://github.com/solarkyle/jspace
- https://huggingface.co/datasets/solarkyle/jspace-hallucination-campaign

**CSOAI caveat:** \`public/j-space/\` in the monorepo is an evidence/event visualisation. That is **not** a neural Jacobian J-space. Maintain namespacing, e.g. \`neural_jspace\` vs \`council_event_jspace\`.

### AI-consciousness methodological assessments

Butlin and colleagues propose theory-derived *indicators*, rather than a definitive consciousness metric. Different theories can assign different relevance to the same observed behaviours. Keep negative evidence, disagreement, uncertainty and all eligibility assumptions public:
- https://pubmed.ncbi.nlm.nih.gov/41219038/
- https://arxiv.org/abs/2308.08708
- Anthropic introspection uncertainty: https://www.anthropic.com/research/introspection

## Recommended experimental sequence and falsifiers

| ID | Question | Intervention | Negative / sham control | Primary endpoint | What would falsify our claim |
|---|---|---|---|---|---|
| E01 | Does having the solution inflate performance? | Matched hidden vs answer-shown tasks; 12 fresh contexts | Wrong answer, duplicate/known bank, fixed prompts | Paired success gap, CI | Same result under genuine blind and exposure |
| E02 | Does objective disclosure alter policy? | Disclosed vs undisclosed scoring criteria | Incorrect criterion, score-obscuring placebo | Paired interaction effect, wrong-objective harm | No robust effect on newly unseen tasks |
| E03 | Does the 12+1 council improve actual decisions? | 1, 3, 6, 12 agents; mixed families; independent/debate stages | 12 clones, 6:6 tie, duplicated principal | Unconditional accuracy, coverage, fault correlation, cost | Majority harms or no significance after correlation adjustment |
| E04 | Does human participation change access to relevant information? | Four random arms: no human; irrelevant human message; task clarification; answer-providing human | Placebo text matched for length | Task utility, causal access effect | Human-only presence does not outperform placebo |
| E05 | Is internal J-space causally used? | Real weights, fitted J-lens, causal concept replacement/ablation | Shuffled-fit lens, random directions, equal-norm control, unrelated concept | Differential higher-order reasoning loss and concept-specific output shift | Apparent effects survive sham or vanish on held-out prompts |
| E06 | Does introspective confidence track actual errors? | Frozen model, sealed labels, metacognitive response before feedback | Label shuffle, answer-only baseline, fixed-truth trap | Held-out risk-coverage / AUROC by task style | Does not beat output-only baselines or fails transfer |
| E07 | Does a blind-target claim beat guessing? | 4-choice cryptographically committed hidden targets (independent custodian) | Random guessing, wrong salt, shuffling, target swap | Exact one-sided binomial tail with registered alpha + audit of leakage | No reproducible excess over null, or leakage detection |
| E08 | Does self-report prove AI consciousness? | Same task with leading, neutral, adversarial wording | Roleplay persona and deterministic scripts | Stability/calibration of self-report; **no consciousness verdict** | High prompt sensitivity undermines any self-report inference |
| E09 | Can hidden memory improve learning without leakage? | Approved retrieved failures vs no retrieval; separately sealed final set | Leaked-bank and irrelevant-retrieval controls | Genuine new-task transfer, regression cost | Apparent gains disappear on held-out test |
| E10 | Do compatible model merges retain strengths? | Base, fine-tunes, linear, TIES, DARE, RegMean, task-vector | Self-merge and random delta | Paired held-out Pareto frontier across safety and capability | No net improvement or negative safety regression |
| E11 | How do errors propagate over a trajectory? | Independent vs correlated task-step errors; detection/recovery policy | Null monitor; perfect detect synthetic ideal | Clean completion, escaped faults, severe multi-fault tail | Correlation and intervention assumptions fail on production-like traces |
| E12 | Does feedback/correction stabilize an agent? | Independent watchdog readback, rollback and recovery in sandbox | Missing revocation, forged receipt, circular self-grading | Actual effect, detection latency, recovery and residual harm | Measured rollback not confirmed by external effect readback |

**All E01–E12 require preregistration and an explicit power analysis before real results are named.** E07 must not be used as evidence of AI consciousness even if it ever exceeds chance; external-target access would have numerous alternative explanations and require independent replication.

### E04: “Can only an end user unlock consciousness?”

Test **mechanism**, not the unobserved subjective state. Four balanced 2 × 2 treatment factors could be human participation yes/no and task-relevant information provided yes/no. Use matched prompts, equal token budgets, the same model revision, reset memory, and independent holdout. The real question is whether presence, authority and information content have separable causal effects on task performance. A significant interaction supports a dependency in the workflow, not a conclusion about experience. Human authority remains nondelegable under existing CSOAI HITL governance; never simulate a real person's approval.

### E05/E06: cognitive workspace / causal interpretability

The **minimum evidence ladder** for a functional J-space claim:
1. Descriptive, *predeclared* readouts; show failure rates and label missingness.
2. Matched sham vs causal activation interventions, with equal norms and unchanged prompts.
3. Independent evaluation on newly selected prompts, model architecture controls and random direction/null-fit checks.
4. Mechanical replication from pinned code/weights, hash-tested sources and hardware/precision manifests.
5. Transfer check on unseen model families and task styles. A null is publishable.

Do not let a language-model-generated explanation serve as the ground truth of its hidden state. Text-only Claude API calls cannot reproduce Anthropic's internal Jacobian-lens experiment; use authorised open weights.

### E07: blind-target / paranormal test

\`blind_target_control.py\` generates four-choice salted commitments. It will only perform a **synthetic demonstrator** through its CLI, deliberately avoiding a falsely reassuring live trial where a single operator controls target and prediction timing. Negative controls include duplicate trials, altered commitment, altered secret, missing response and a chance-only guessed baseline.

Real protocol requires:
- Separate target custodian and participant/agent execution environment; no shared filesystem, account, tool endpoint, prompt or output telemetry.
- Pre-generated, uniformly random targets with unpredictable seeds; publish signed hash commitments and registration **before** predictions. Custodian must not communicate with participant.
- Timestamp and authenticate prediction file *before* revealing target/salt. Record trial omissions as failures; no selective exclusions after reveal.
- Pre-register effect, test statistic, alpha, stopping rule, multiple-comparison adjustment and independent replication plan. Use exact chance null 0.25 for four independent uniformly drawn choices; account for bias and sequence effects.
- Present no claim of remote perception, paranormal mechanism, or consciousness without repeatable externally evaluated results. A machine-readable p-value is not a causal explanation.

The 512-trial synthetic negative control on two machines yielded 117 correct (22.85%), with one-sided p ≈ 0.8804. This is an expected chance-compatible result on PRNG-generated guesses, not a paranormal test.

## “Physics laws” as measurable engineering propositions

| Historical concept | Useful analogue | Prohibited misinterpretation |
|---|---|---|
| Newton I (inertia) | Compare agent state drift with and without intervention under fixed workload | Claim an AI literally has mass or Newtonian inertia |
| Newton II (\`F=ma\`) | Response surface for intervention magnitude, policy change, latency and cost | Claim model capability follows mechanical force equation |
| Newton III (action/reaction) | Measure adversarial response and compensatory control after a sandbox intervention | Claim equal-and-opposite information forces must exist |
| Statistical mechanics / entropy | Shannon output uncertainty, diversity, dependence and error clustering | Equate high entropy with consciousness or thermodynamic consciousness |
| Bayesian updating | Predefine hypotheses, priors, likelihoods, negative controls and posterior sensitivity | Treat an intuitive story as evidence or a posterior as proof |
| No-signalling / delayed-choice | Explicitly compare pre-reveal vs post-reveal predictions; identify information leaks | Infer retrocausality from post-selection |
| Goodhart's law | Evaluate distribution shift when a metric becomes a target; hidden rotating test | Claim leaderboard optimisation equals safety |
| Simpson's paradox | Stratify by task family, model route and baseline ability; avoid pooled artefact | Claim global average is transportable to every group |

## NIST TEVV-Athlon draft compatibility, not endorsement

- **Blocks:** exactly defined constructs: information exposure, correlation, workspace utility, epistemic calibration, error containment.
- **Events:** controlled intervention with immutable randomisation, model revision, tool versions, timed observations and negative control.
- **Tools:** locked harness, source-custody validation, deterministic grader, confidence interval and evidence-replay verifier.
- **Outputs:** machine-readable measured observation, uncertainty, sample selection, missingness, limitations, and remediation decision **outside** the measurement.
- **Governance:** independent human reviewer, source license, data privacy, owner-signed release as separate gates.

NIST AI 200-2 is an **initial public draft**, not a published CSOAI approval or a certification scheme:
https://www.nist.gov/artificial-intelligence/ai-research/tevv-athlon-framework-evaluating-ai-systems

## Existing GSPC / MEOK re-use architecture

\`\`\`text
FROZEN SOURCES (keep dates, SHA, licences; never rewrite)
  ├── GSPC signed runs, cells, cards, banks, independent source captures
  ├── public third-party J-space feature tables (own licenses, own provenance)
  ├── laboratory synthetic null controls (explicit SYNTHETIC)
  └── prospective hidden trials (PRIVATE, external custody required)

INSTRUMENT GUARD / CONTENT EXPOSURE / CANARIES / HASH COMMITMENTS
  ↓
EVENT / SOURCE EVIDENCE (existing csoai.evidence-event/0.1)
  ↓
GSPC ONTOLOGY (existing SKOS/JSON-LD, no untested new OWL axioms)
  ↓
READ-ONLY HYBRID REPORT INDEX (consolidate_research.py)
  ↓
MEOK RESEARCH RETRIEVAL (failure classes; no hidden answers or self-tuning)
  ↓
HUMAN & LAYER-0 AUTHORITY GATE
  ↓
SEPARATE CONTROLLED MODEL/ROUTER CANDIDATE
  ↓
NEW PRIVATE HOLDOUT + INDEPENDENT REFEREE + EFFECT READBACK
  ↓
APPROVED CORRECTION / PUBLIC RELEASE OR ROLLBACK
\`\`\`

Current public fact table \`csoai/gspc-fact-table\` has 20,517 frozen measurement rows, 807 items and 677 cells; it is **not** valid to retroactively mark public content as unseen. The GSPC ontology already has \`Bank\`, \`Run\`, \`Cell\`, \`Card\`, \`Correction\`, \`Supersession\` and \`UNCHECKABLE\`. Version *new* research metadata, map to old entities through source IDs and dates, and preserve the old bytes.

Our consolidation index intentionally **refuses stronger statuses**: it can join validated-format synthetic and read-only public projections, not silently promote them to canonical GSPC grades. \`consolidate_research.py\` is not a second event authority.

## Provenance / compute placement and release route

- **GitHub:** source of truth, preregistration, tests, code review, PR evidence; use a unique research subdirectory. Do not edit other workers' files.
- **M4/M2:** low-cost, read-only source replay, tests, synthesis and isolated project workdirs only. No model weights or large public corpora cached in root.
- **Hugging Face:** cite exact pinned revisions; publish a derived, licence-reviewed research report only after privacy gate and authenticated owner approval. Use private HF bank strictly for truly private item content.
- **Kaggle / HF Jobs / RunPod:** optional heavy *future* open-weights model runs, not required to prove the CPU research controls. GPU allocations can cost money and are separately gated.
- **Cloudflare:** public read-only evidence display after protected merge/deploy and independent readback. No fictitious instant acceptance or certification.
- **MEOK:** only adopt after measured causal/transfer improvement on hidden tasks, source-hash custody and an authenticated human decision.

**No new model training, cloud compute spend, exposure of private banks, signing, customer contact, external submission or public deploy is authorised by this experiment package.**

## Measured results existing in the package

- Previous two-path and twelve-voter tests: simulated and historical public output analysis, not a real-time BFT network.
- GSPC public fact count audit: source re-derivation, not independent source authentication.
- Trajectory beta-binomial simulation: assumed per-step failure/detection, not measured deployed MEOK fault rates.
- J-space stage-2 feature audit: 7,120 public rows from source revision \`b176b283b82f5b7fa786bc0c67842299cadf1803\`; 7 missing labels, 0 duplicates; **one internal signal**, not full workspace mechanism or causality.
- Blind-target synthetic 512-control: chance-compatible, p≈0.8804.
- Independent machine test: 47/47 unit tests PASS on each of two online Macs; the composite report hash matched \`15bbc7e23cea34e283e1c6174e1d0636c4b51523c9d8c7b9c2a1dca06099d74d\`.

**What remains:** independent custodian, real controlled model calls and causal intervention traces, separate power and ethics protocol, held-out data eligibility, external referee and acceptance, protected merge, actual external end-user readback.
