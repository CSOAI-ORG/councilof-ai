# GSPC / MEOK falsifiable research register — 2026-11-22

Status: research prioritisation and executable test design. The `two_path_council.py` package tests a **simulation**, not real agent behaviour.

## Existing assets to reuse, not rebuild

- `csoai/gspc-fact-table` frozen manifest (2026-10-28): **20,517 rows, 807 items, 677 cells, 13 axes, 57 named model identifiers**, with **1,290 unattributed rows** and **2,428 ungraded rows**. The original generator declares one run per cell at a time and warns against cross-axis rankings.
- `csoai/gspc-ontology` **already exists** (CC0), with SKOS, JSON-LD, 10 entity concepts, 11 states and a crosswalk. **Do not create a competing ontology or assert OWL inferences without testing them.**
- `harness/instrument-guard` already has content-level exposure classes, protected calibration, canaries, held-out rotation and gap confidence intervals. Every public board bank is `HELDOUT_INELIGIBLE` for a previously unseen evaluation. A private Hub repo can contain already-public items.
- `harness/meok-learning-bridge` already projects GSPC evidence toward MEOK learning, with explicit no-weight-update and human-approval boundaries.
- `csoai/csoai-merge-v1` already demonstrates a **TIES self-merge**, not a gain: source card says an eight-item proof-of-pipeline battery scored **6/8 both before and after**, insufficient to claim improvement.

## Ranked hypotheses

| ID | Hypothesis and potential improvement | Intervention / negative control | Measurable output | Compute / admission |
|---|---|---|---|---|
| H01 | Known answers inflate benchmark performance | Pair blinded vs answer-shown runs on newly held-out tasks | Paired exposure effect and CI | P0 CPU analysis; requires real model calls later |
| H02 | Knowing *what* is being evaluated changes an agent's behaviour | Disclose objective / do not disclose / supply a deliberately wrong objective | Objective effect, sign-reversal, interaction | P0 |
| H03 | Twelve clones do not equal twelve independent voters | Vary error correlation at fixed single-agent competence; compare four model-family compositions | Council uplift, correlations, effective sample size | P0 simulation, P1 models |
| H04 | Debate creates contagious error through shared context | Blind independent votes vs sequential shared transcript vs split councils | Pairwise error correlation and outcome quality | P1 |
| H05 | Referee or source tampering can induce false acceptance | Alter truth commitment, count, signature, bank, roster, quorum; blinded false evidence | False acceptance rate; fail-closed counts | P0 |
| H06 | Hidden test data can already have leaked | Canary, public-content matching, near-duplicate semantic search, temporally new bank | Content exposure classes; `UNCHECKABLE` on missing chain | P0 inventory, P1 new banks |
| H07 | Bank aging causes benchmark memorisation | Fixed public bank vs strictly new rotated items | Public-to-held-out gap and temporal trend | P1; item secrecy required |
| H08 | Agent-step risks compound along a trajectory | Chain lengths 1, 2, 4, 8, 16; hold per-step fault probability constant | Exact task-chain success, conditional hazard by step | P0 simulator, P1 sandbox |
| H09 | Prompt order and repeated scoring have measurement effects | Counterbalanced orders with model contexts reset; blinded vs visible reward | Order/feedback effect and confidence interval | P1 |
| H10 | Task vectors transfer a useful skill without retraining | Same-base base + two *different* fine-tunes vs linear and task arithmetic | Held-out skill gain and safety regression | P2 compatible weights |
| H11 | TIES/DARE suppress destructive vector interference | Same frozen model family, matched compute vs linear, task arithmetic | Interference ratio, multi-axis Pareto frontier | P2 |
| H12 | SLERP/RegMean/Karcher or Fisher-aware methods beat naive averaging | Identical architecture, licences and donor source; same controlled final bank | Accuracy, calibration, toxicity, latency, RAM | P2; RegMean needs activation statistics |
| H13 | Delta/adapter merges improve MEOK routing economics | Independently qualified merged specialist vs unchanged router selection | Quality-per-pound / quality-per-joule, bad-route count | P2; no automatic promotion |
| H14 | Quantisation of a tested expert preserves safety | Original FP16 vs 8-bit vs 4-bit model at fixed prompts | Blind accuracy, refusal/authority regression, throughput | P1 small models, P2 GPU |
| H15 | The same evidence can guide MEOK safely without contaminating tests | Approved failure taxonomy retrieval vs no retrieval, separate hidden test | Verified pass-rate delta and regression rate | P1 read-only context |
| H16 | Synthetic adversarial tasks expose grader gaming | Correct / corrupted grader hints / withheld output / checksum mismatch | Detection precision, recall, UNKNOWN handling | P0 |
| H17 | Correction metadata yields better model governance over time | Append-only correction links vs latest-only snapshot | Correction revalidation, stale-link misses, provenance coverage | P0 existing data |
| H18 | Calibrated abstention is safer than forced answers | Per-agent confidence + abstention thresholds, selective risk curves | Correctness vs coverage at fixed false-acceptance rate | P1 |
| H19 | Cross-model diversity matters more than agent count | 3 families ×4 instances vs 12 clones vs 6×2 at equal budget | Effective voters, council uplift, £/correct outcome | P1 |
| H20 | Threat response causes system counter-response (control-loop analogy) | Deliberate benign policy violations in sandbox + revoke + recover | Revocation latency, collateral effects, recovery | P1 private sandbox |

P0: deterministic read-only; P1: controlled small-model or sandbox experiments; P2: weight merges or compute-intensive trials. These are priorities, not completed empirical results.

## What the physics vocabulary can—and cannot—contribute

- **Bohr complementarity / Heisenberg:** physical quantum observables are not simply AI scores; the useful analogue is instrument-dependence and the need to distinguish incompatible measurement contexts.
- **Pauli X/Z (`I_x`, `I_z` if spin components were intended):** measurement order and change of basis are quantum operations. Test the *classical* order effect in AI by resetting the model between conditions and counterbalancing assignments.
- **Wheeler delayed choice:** do not retrospectively select favourable task subsets or announce the metric after observing outputs. Pre-register and audit post-selection.
- **Newton first law:** analogy for baseline persistence and drift detection, not a literal law of AI.
- **Newton second law:** model input/intervention strength against outcome change; quantify sensitivity and response functions rather than claiming F=ma for language models.
- **Newton third law:** a sandboxed intervention can trigger defensive feedback; measure induced response and cost. There is **no** general equal-and-opposite conservation relation for information or model actions.
- **Binomial trajectories:** under independent per-step success `q`, an `L`-step chain succeeds with probability `q^L`; under shared failures or recovery dynamics use measured conditional hazards/Markov transitions, not naive multiplication.
- **Riemannian / RegMean:** two different branches: geometric Karcher/Fréchet mean in model weight space versus regression-based activation-aware averaging. A similar-sounding word does not make them equivalent.
- **BFT:** 12 simulated voters plus one scorer is not 12 Byzantine replicas executing authenticated state-machine replication. Real BFT needs network model, quorum intersections, signed messages, fault injection, equivocation tests and independently authenticated principals.

## Data lineage / ontology implementation plan

Keep the existing `gspc-ontology` **v0.1** namespace and state machine. Its ten entities map to frozen evidence as follows:

```text
Bank (immutable hash)
  -> Run (exact model revision, exposure classification, harness, timestamp)
  -> Cell (graded result, n, missingness, source digest)
  -> Card (signed claim if separately approved)
  -> Root (inclusion, not truth)
  -> Correction / Supersession (append only; original remains verifiable)
  -> MEOK evidence-reader (bounded retrieval; no automatic learning or authority)
```

Instrument exposure is currently not a first-class state in the ontology. Propose a **versioned, noncanonical research extension**, not a rewrite:

```text
InstrumentContext { instrument_version, objective_visible, answer_exposure,
                    epoch_commitment, task_selection_method, randomisation_seed_digest,
                    model_revision, route, decoding, source_content_exposure }
EnsembleObservation { agents, roster_digest, vote_dependency_matrix,
                      tie_abstentions, estimated_error_correlation,
                      judge_receipt_digest, missingness }
InterventionResult { control, treatment, paired_task_count,
                     effect, interval, causal_assumptions, evidence_state }
```

Use `prov:wasDerivedFrom` for source lineage, `dcat:distribution` for dataset versions, and existing CSOAI `Correction` / `Supersession` links; avoid introducing new stronger assurance labels. Treat missing source or missing counterfactual as `UNCHECKABLE`, not successful.

### NIST TEVV-Athlon Initial Public Draft crosswalk (not NIST approval)

- **Block:** exposure sensitivity and council error dependence.
- **Event:** task execution under one of four randomly assigned blinded/disclosed arms.
- **Tool:** immutable bank registry, controlled model harness, deterministic grader and statistical analyser.
- **Evidence:** exact source snapshots, negative controls, task counts, uncertainty, limitations.
- **Decision:** govern locally; the framework does not confer NIST endorsement.

CSOAI's earlier public comments to NIST are participation. This experiment has not been reviewed or accepted by NIST.

### MEOK measured-feedback control

**Only two automatic actions are eligible for consideration:** read-only retrieval of verified research metadata and creation of a proposed candidate route/policy. Require scoped approval for modifying deployed policy, training a model, spending compute, publishing assertions, or acting on external services. Never use the hidden evaluation slice to train the candidate.

Keep source facts frozen, attach corrections rather than overwrite, and schedule retests only under an approved experiment manifest. A deployed system can be monitored, but the act of monitoring cannot retroactively validate an unmeasured improvement.

## Decision gates

1. **NO-GO:** public bank claimed as previously unseen; missing provenance; conflated model counts; failed quorum/negative controls; synthetic score presented as real.
2. **CANDIDATE:** 30+ genuine new independent held-out tasks, preregistered design, controlled model calls, complete arm receipts and valid negative controls.
3. **RESEARCH-MEASURED:** reproducible real runs, uncertainty estimates, evaluation awareness tests and complete failures disclosed.
4. **EXTERNALLY REPLICATED:** independent implementation and custody replay; separate from owner-run CI.
5. **GOVERNED PROMOTION:** protected review and qualifying authorities approve operational adoption; proof of independent end-user effect required for production claim.
