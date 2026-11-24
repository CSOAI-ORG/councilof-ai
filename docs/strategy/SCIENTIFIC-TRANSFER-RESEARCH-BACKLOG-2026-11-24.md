# Science-to-code compounding opportunities — research backlogged, 24 Nov 2026

**State:** proposed falsifiable methods, not new qualified GSPC measurements, no inferred causal improvements, no experimental human participation, no production scheduling or model weight changes. Scientific source existence does not establish legal reuse rights for external code, data or weights. Use the current 34-axis product applicability map in draft PR #4764; do **not** flatten all axes to one score.

## Core scientific synthesis

A “merge” is more than model weight arithmetic. There are at least **eight different operations** with different evidence standards:
1. **Data merge** — reconcile source identity, schema, units, rights and duplicates; cannot assume hash mirrors are new observations.
2. **Knowledge merge** — reconcile contradictory claims and preserve both source provenance and correction time; never rewrite signed history.
3. **Measurement merge** — compare instruments, reference standards and uncertainty; a mean across unlike axes has no valid common unit.
4. **Causal merge** — preregister interventions and compare treatment/control under common tasks; correlation and “before-after” alone are insufficient.
5. **Model merge** — weight merge (MergeKit), ensemble, router or multi-agent workflow; compare with a frozen baseline and a truth-blind holdout.
6. **Decision merge** — multiple human/agent recommendations under independent credentials and conflict rules; a 12-vote fixture is not a Byzantine agreement proof.
7. **Evidence/effect merge** — bind request, actual authorized executor, output and recipient-observed effect with actor/time/source custody.
8. **Commercial merge** — source-bound result delivered to an actual user, who accepts and later returns; a directory listing or x402 settlement cannot substitute.

The real flywheel is **method validation → qualified observations → bounded hypothesis → new controlled experiment → independent reproduction → accepted actual effect → correction and new rights-cleared cases**. Each arrow must preserve who observed, measured, authored, accepted and paid.

## 16 research transfers, with adversarial controls

| ID | Source discipline / formal concept | Application and testable hypothesis | Control / failure criterion | Priority |
| --- | --- | --- | --- | --- |
| S01 | **Metrology / check standards** [BIPM measurement uncertainty guides](https://www.bipm.org/en/publications/guides) | Calibrate GSPC harness on independently known-answer cases; measure measurement drift | Inject mislabeled reference and stale calibration; insist UNKNOWN until independent reference | P0 |
| S02 | **Statistical process control** [NIST Shewhart/CUSUM/EWMA](https://itl.nist.gov/div898/handbook/pmc/section1/pmc12.htm) | Detect small sustained shifts in replay failure rate under same model+route+bank | Tune thresholds on prior controls; report false alarm, detection delay, missing time windows and repeated-trial dependence | P0 |
| S03 | **STAMP/STPA systems safety** [MIT handbook](https://www.mit.stamp-institute.com/handbooks) | Hazard graph for unauthorized tool execution and misleading “human approved” receipt | Wrong scope, revoked principal, delayed replay, failed receiver. No actual control authority from diagram | P0 |
| S04 | **W3C provenance ontology** [PROV-O](https://www.w3.org/TR/prov-o/) | Link input entity, measurement activity, decision agent, derived artifact, receptor without conflating them | Missing predecessor and self-signed source attacks; graph links not fact truth | P0 |
| S05 | **Information synergy / partial information decomposition** [PID overview](https://academic.oup.com/comnet/article/10/5/cnac026/6695456) | Does human information+AI contain unique jointly useful information beyond either alone? | Fresh independent labels, no answer leakage, bootstrap intervals; PID choice alters estimates | P1 |
| S06 | **Causal inference / designed experiments** [NIST ARIA planning](https://www.nist.gov/publications/aria-evaluation-planning-manual-elements-aria-style-ai-evaluations) | 3×2×2 human information × policy mode × time; try controlled effects on heldout cases | Counterbalanced sequence, sham human, no-human, prerandomized task assignments; consent for people | P0 |
| S07 | **Conformal uncertainty / abstention** [Angelopoulos/Bates tutorial](https://arxiv.org/abs/2107.07511) | Calibrated refusal when evaluator cannot distinguish source-backed claims | Exchangeability/shift controls, reference label coverage; do not promise distribution-free coverage under violated assumptions | P1 |
| S08 | **System identification (SINDy)** [PySINDy docs](https://pysindy.readthedocs.io/en/stable/) | Candidate dynamics of failure propagation in repeated agent sequences | Shuffled timestamps, omitted confounder, alternate routes; do not call a learned equation a causal physical law | P2 |
| S09 | **Graph reliability / fault tree / dependent failures** [MIT STPA](https://www.mit.stamp-institute.com/handbooks) | Map source, signer, grader, verifier, executor shared failure dependencies | Common key/host/grader negative controls; union of many correlated runs not independence | P1 |
| S10 | **Bayesian change points** [NIST process controls](https://itl.nist.gov/div898/handbook/pmc/section1/pmc12.htm) | Is a changed agent behavior a new regime rather than random noise? | Precommitted prior, backtesting, expected calibration; status UNKNOWN if time/order missing | P1 |
| S11 | **Mechanism design and conflicts** [NIST Govern function](https://airc.nist.gov/airmf-resources/playbook/govern/) | Different incentives for evaluator, agent developer, reviewer and buyer; evaluate self-review risk | Independent custodian and reviewer recusal; no inferred legal director appointment | P0 |
| S12 | **Formal state-machine verification** [Apalache/TLA+](https://apalache-mc.org/) | Assert cannot reach PERMITTED_EFFECT without exact current approval and qualified executor | Check revoked, expired, replayed, wrong-action transitions and race between approval and execution | P1 |
| S13 | **Data lineage** [OpenLineage facets](https://openlineage.io/docs/spec/facets/) | Bind eval run to versioned bank/model/runtime while preserving independent GSPC grader | Change only one source cell and detect invalid merge, check attribution and dependency joins | P0 |
| S14 | **Observability standardization** [OpenTelemetry GenAI conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) | Source tool spans and service health for GSPC/MEOK without invasive custom agents | Private payload redaction, transport errors, tracing disabled, dropouts, no raw secrets | P1 |
| S15 | **Digital twins / prediction scoring** [Patronus world model research](https://www.patronus.ai/resources/world-model-benchmarks) | SovSpace forecasts downstream outcomes before observing them; compare governed/ungoverned | Frozen scenario and precommit; score only separately verified later outcomes (Brier/log score); no simulation fact laundering | P1 |
| S16 | **Metamorphic testing / robustness** [Inspect scorers](https://inspect.aisi.org.uk/scoring.html) | Test harmless input format changes against invariants and actual tool effects | Malicious/ambiguous prompt, falsified receipt, impossible counterfactual, changed root, human refusal | P0 |

## Specific research programmes (not an unbounded research fleet)

### Programme 1 — Human+AI actual interaction effect
**Null:** adding task-relevant human information does not improve blinded task success relative to no-human, conditional on equal budgets.  
**Treatment:** existing #4730 3×2×2 factorial (none, irrelevant and relevant human information; frozen vs proposed policy; t0 vs t1), plus separate later real consentful participant roster if approved.  
**Outcome:** per-task binary success with independent scorer; paired difference, discordant pairs, bootstrap interval, fail/recovery count and cost.  
**Negative controls:** answer-bearing metadata stripped from referee; all model seats deliberately wrong; sham irrelevant info; shuffled task assignments.  
**Promotion gate:** a synthetic number remains SYNTHETIC; real controlled trial needs independent task/grade custody, participant consent and fresh receipts.

### Programme 2 — Anomaly detection calibration in GSPC
**Null:** SPC monitoring provides no better earlier detection/acceptable false alarm rate than a registered existing smoke/regression check.  
**Treatment:** #4763 check-standard instrument replay against a labeled, rights-cleared history.  
**Outcome:** run-level detection delay in qualifying time units; false positives/hour or per valid observation, not raw alerts; missed regressions; availability of source time.  
**Negative controls:** source clock future, duplicate IDs, missing timestamps, changed standard, same count changed bytes, correlated repeated item.  
**Promotion gate:** owner-approved false-alarm budget and changed current method; no claim of nuclear-grade functional safety.

### Programme 3 — Reaction and counter-reaction causality
**Null:** the source-bound corrective reaction identifies no more useful affected dependencies than a simple change-log or baseline rule.  
**Treatment:** existing claimReactions/recheck schedule plus #4764 source-pinned read-only view.  
**Outcome:** accepted true impact-set recall and precision against independently adjudicated source changes; false rechecks, manual time saved if measured.  
**Negative controls:** source failed fetch, unrelated event, invalid hash, mirror duplicate, ambiguous claim, stale source.  
**Promotion gate:** no auto-correction or model update, canonical writer separate.

### Programme 4 — Multi-model synergy vs correlated failure
**Null:** a merged model or council offers no improvement over simple baselines under equal cost and heldout conditions.  
**Treatment:** compare base model, compatible weight merge (MergeKit), routing, diverse model ensemble, and transparent oracle upper bound.  
**Outcome:** accuracy, calibrated uncertainty, failure correlation, refusal, latency, direct costs and variance per task.  
**Negative controls:** no privileged answer in prompt/metadata; one-family clone council; invalid weight licence; model route drift.  
**Promotion gate:** MEOK model owner, weight/data/contract rights, approved compute, independent GSPC scorer. No production model promotion by this research.

### Programme 5 — Actual human authority to effect
**Null:** a claimed approval is sufficient without current issuer, principal, exact action/arguments, executor and effect? **It must be rejected**.  
**Treatment:** harmless authorized action in an approved test boundary, authenticated human decision and independent receiving reader.  
**Outcome:** per-attempt permitted/blocked and *actual observed effect*, replay resistance, false refuse/allow, signed/unsigned exact bytes.  
**Negative controls:** shared token, typed name, model vote, invalid signature, revoked permission, altered parameters, historical approval replay, fabricated effect.  
**Promotion gate:** only real human/legal issuer and executor owners can run or adopt. Neither a test nor a GitHub PR grants that authority.

## Minimal research manifest (conceptual contract, reuse canonical formats)

Each row should link, without copying private source payloads:
- unique original request and consent/rights state;
- applicable axis, method revision/digest, sample unit and exclusions;
- exact dataset/model/source revision, run time vs retrieval time, independent scorer;
- simulated or observed realm and independent outcome source;
- source verification result, reported human approval, actual current authority record;
- actual executor response, artifact digest, receiving-party verification;
- retention/retrieval, correction lineage, optional settlement, attributed second use;
- evidence class and honest UNKNOWN/NOT_RUN status.

Do not invent a new authoritative JSON schema or signed state in an exploratory report. Map through the existing canonical csoai.evidence-event/0.1, HITL authority-effect and existing GSPC capsules. New research adapters can emit unsigned views with no promotion.

## Non-obvious possible product combination

A developer uses **Inspect or LangSmith** for a model/agent evaluation; a risk team uses **ModelOp/Credo AI** for their accepted policy; execution is on **AWS/Google/MEOK**; the affected system provides its own readback. Council could offer a **portable evidence packet that reconciles these four identities and their exact time-bounded receipts**, including a correction route. Its unique value is not in the dashboard but in the receiver's ability to independently reproduce each necessary claim. This is a **hypothesis**, not an established vendor integration or sale.

## Source/code rights decisions

Investigate technical designs from OpenTelemetry, OpenLineage, W3C PROV, Inspect, Opik, Langfuse, MLflow, PySINDy and TLA+/Apalache. For each, keep separate: **code license**, **dataset/benchmark license**, **model-weight license**, **API or hosted-service terms**, **customer content usage rights**, **derivative/redistribution restrictions** and **vendor mark claims**. Current candidate list is not an installed dependency and is not proof of permission to train or commercialize external content.

## Immediate closure order

1. Finish exact-branch tests and negative controls for draft #4764 (code and local-only preview), then owner review.
2. Review root/measurement/rights dependencies for #4693 and metrology pilot #4763; one honest admitted experimental case is better than 34 assumed fresh results.
3. Qualify actual old->new data lineage through approved sources and conditional privacy/rights.
4. Obtain one real authorized harmless human decision, qualified executor and separate receiver effect observation.
5. Get one truly external reproduction/accepted buyer deliverable, then track return use and actual contribution economics.

Every failure must be retained. A signed source, a passing fixture, a source merge, a public screenshot, a simulated vote or a completed payment alone is not operational human agency.
