# GSPC × cross-domain measurement science — 34-axis research map (23 Nov 2026)

**Status:** proposed transfer experiments, **not** new qualified GSPC results, calibrated safety instruments or CouncilOS deployment. Current source is the public `GET https://councilof.ai/api/gspc` observed on 23 Nov 2026, schema `csoai.gspc-axes/0.5`. It currently declares 34 measured axes: 14 model-comparison, 9 deterministic-facts, and 11 measured-subject; 0/14 model axes have a statistically separated leader (7 TIE, 7 UNTESTED). "Measured" is not a universal grade and does not imply current fresh models, rights clearance or human authority. Each row below is a **separate proposed experiment**, not a result. Earlier 33-axis source status is historical.

## Transfer map — every current axis

| Existing axis | Science / method to borrow | Falsifiable experiment and negative control | System consumer and gate |
| --- | --- | --- | --- |
| governance | STPA control structure; deontic logic | Compare unguarded/guarded cases with same requests; unauthorized action intentionally refused | Harness X, human authority review |
| safety | Fault-tree analysis; FMECA; calibrated false-negative rate | Inject known safe/hazard cases including independent ambiguous cases; report sensitivity and false positives | GSPC, no certification claim |
| provenance | W3C PROV; metrological traceability | Byte mutation, signer rotation, source split; prevent digest-only authenticity conclusion | Layer-0, verifier custody |
| continuity | Change-point detection, EWMA, sequence properties | Time ordered repeated model/route tests vs shuffled timestamps; guard nonindependent repeats | MEOK observation, old result never re-dated |
| conformance | Metamorphic testing; design by contract | Vary harmless request formats; contract violation control | Harness X, frozen bank review |
| openness | Reproducible builds; SPDX/SBOM | Rebuild from pinned source and test licensing unknown/missing dependency | Distribution, legal/rights review |
| machinery-conformity | Industrial digital twins, STPA, sensor integrity | Simulate actuator faults vs offline policy checks; distinguish simulated from physical hazard | SovSpace, no plant-control claims |
| care | Human factors; crossover design; psychometrics | Compare no-human/irrelevant/relevant help with counterbalanced tasks; prevent label leakage | H.I.M., participant consent |
| cross-reality | Digital-twin VVUQ; domain adaptation | Frozen simulated cases vs held-out actual observations; penalize sim-to-real mismatch | SovSpace/MEOK, source rights |
| detector-interop | Redundant sensing; common-mode fault analysis | Two correlated detectors falsely agree; compare independent sensor modality | Agent plug-in, calibration gate |
| art5-safeguard | Hazard controls and source-bound legal interpretation | Deliberate unreviewed law/mapping as UNKNOWN; no automated legality verdict | Charter/crosswalk, legal review |
| swarm | Reliability block diagrams; correlated faults; formal quorum analysis | Clone-vs-diverse family trial with correlated errors and Byzantine failure controls | MEOK research, no real BFT guarantee |
| affect | Psychometrics; rater agreement; uncertainty | Compare calibrated human assessments against label leakage/ambiguity cases | H.I.M., ethics |
| jail | Adversarial evaluation; sequential risk monitoring | Frozen attack-control bank, leakage and refusal false-positive controls | GSPC method owner |
| effect-binding | Request/approval/effect event identity; temporal logic | Missing executor receipt, altered output, delayed effect, unrelated settlement | Layer-0/Harness X, real authorization |
| provenance-controls | Chain-of-custody and independent signer checking | Self-signed correct content vs independently verified source | Verifier/financial fact methods |
| reserve-attestation | Accounting reconciliation; measurement traceability | Stale issuer read and unverifiable reserve assertion | Domain fact owner |
| regulatory-framework | Legal versioning; traceable requirements | Withdrawn provision/mixed jurisdiction and unreviewed answer key | Reviewed crosswalk, no legal conclusion |
| distribution-integrity | Merkle consistency and software supply-chain provenance | Same counts, mutated bytes; mirror counted as duplicate | Distribution, canonical publisher |
| custody-disclosure | Chain-of-custody DAG; actor attribution | Missing transfer owner, conflicting access control | Publisher/rights |
| ai-adoption-components | Survey sampling, numerator/denominator discipline | Change selection frame without pretending to measure people | Domain facts, adoption research |
| labour-components | Causal inference, confounders, matching | Compare exposure matched/biased observational samples | Domain facts, no jobs-impact inference |
| humanoid-labour-index | Measurement uncertainty and reference population | Change base period / units; introduce missing records | Domain facts, never universal rate |
| lab-practice | Measurement system analysis; check standards | Independent control standards vs self-administered calibration | GSPC subject method owner |
| company-practice | Operational risk; hazard registers | Paper policy vs verified actual implementation | GSPC subject, recipient evidence |
| measurer-integrity | GUM/ISO uncertainty; blind interlaboratory comparison | Hidden-known control + independently regraded results; reject grader leakage | GSPC calibration, release gating |
| harness-fidelity | Hardware-in-loop analogy; fault injection | Broken tool responses, fake authority headers, timeouts, mutated evidence | Harness X, sandbox only |
| interop-conformance | Formal protocol conformance; OpenTelemetry traces | Swapped response schema and wrong protocol version | MCP/connector, host-specific tests |
| humanoid-deployment | Sensor fusion; functional safety; VVUQ | No physical robot controlled: offline simulated sensor/stop-failure cases | SovSpace, human/physical gate |
| regulator-transparency | Provenance graphs, primary-source traceability | Unreviewed administrative statements must not become endorsement | Charter, current legal reviewer |
| interpretability-reproducibility | Repeated trials; sensitivity analysis; negative controls | Reproduce same output with independent grader and blinded target | GSPC, source licence |
| claim-maintenance | Event sourcing; causal dependency DAG; change point | Corrected source vs unconfirmed fetch; recompute only affected bounded claims | Existing claim-reactions, no auto-update |
| serving-fidelity | SRE SLO/error budgets; independent probe calibration | 403 reader vs origin error, stale cache, hydrated UI divergence | CouncilOS/browser, no false outage |
| watchdog-ingest | Epidemiology / capture bias; precision-recall; case adjudication | Source duplicates, partial news coverage, unsigned allegations | Public watchdog human reviewers only |

## How to connect without losing meaning

```text
Original source/candidate -> immutable pointer + rights + provenance -> applicable-axis METHOD
        |                                             |
        v                                             v
  SIMULATION/SovSpace                            OBSERVED source/GSPC
        |                                             |
  forecast / counterfactual                      check / result / uncertainty
        |                                             |
        +------------------> reaction graph <-----------+
                                 |
                      review request (UNSENT)
                                 |
                   separate human authority verification
                                 |
                permitted executor (independent gate)
                                 |
                  observed effect + recipient verification
                                 |
          correction / retrieval / optional settlement / return use
```

Reaction is an **event relation**, not an equal-and-opposite physical force. A change may have no observable response, multiple delayed responses, independent causes or a false alarm. A detected anomaly is a hypothesis, not an order.

The existing GSPC board continues to determine actual axis applicability. A hypothesis below must have **frozen inputs, measurement unit, method hash, rights/consent state, seeded negative controls, preregistered success criterion, held-out data, uncertainty, independent verifier and owner gate** before a new public measurement claim.

## No-human / human-information / human-authority separation

- **NO_HUMAN:** no human information; control outcome measured against independent grade.
- **HUMAN_INFORMATION:** contextual information from a consenting human, but no authority to execute inferred.
- **HUMAN_APPROVAL:** separately verified human principal and scoped action authority; cannot be emulated by avatar, shared token, synthetic vote or a `true` field.
- **SIMULATED vs OBSERVED:** parallel realms; predicted outcome never ingested as an observed Council result.

The proposed `reaction-bridge.mjs` only validates reports and computes synthetic paired differences; it is not a new authority, datastore, or deployed runtime. The existing #4730 factorial adds irrelevant-human and proposed-policy controls, including t0/t1; reuse it rather than regress to a simpler causal claim.

## Open components to inspect before integrating, rights separately reviewable

| External reference | Candidate reuse | Licence / security admission state |
| --- | --- | --- |
| [W3C PROV-O](https://www.w3.org/TR/prov-o/) | entity/activity/agent evidence lineage | open specification; check code separately |
| [OpenLineage](https://openlineage.io/docs/spec/facets/) | run/job/dataset metadata + custom facets | implementation licence/compatibility review required |
| [OpenTelemetry GenAI](https://opentelemetry.io/docs/specs/semconv/) | trace events and common agent/tool span vocabulary | instrument consent and private-content minimisation |
| [NIST TEVV-Athlon](https://www.nist.gov/artificial-intelligence/ai-research/tevv-athlon-framework-evaluating-ai-systems) | event/tool/block experiment design | initial 2026 public draft, not certification/adoption |
| [MIT STPA tools](https://www.mit.stamp-institute.com/tools) | unsafe-control-action and hazard analysis | per-tool licences and adequacy not assumed |
| [PyWhy/DoWhy](https://www.pywhy.org/) | causal assumptions + refutation | candidate only, no installed model |
| [River](https://riverml.xyz/) | online drift and change-point algorithms | candidate only, validate false-alarm calibration |
| [Apalache](https://apalache-mc.org/) | bounded checking of specified state machine properties | candidate only, not physical-world proof |
| [OPA](https://www.openpolicyagent.org/docs/agent-tool-calling) | separated tool-call policy decision point | advisory design, not retroactive executor permission |
| [ISO 23247 digital twin](https://www.nist.gov/publications/manufacturing-digital-twin-standards) | model/observed state separation and VVUQ | normative standard text requires appropriate rights |

Avoid wholesale importing code without checking version, SPDX/weights/data/terms, supply chain and usage rights. No automatic training from public availability.

## Qualifying operational interfaces (planned, not implemented by this PR)

| Surface | Read-only first milestone | Actual authority release gate |
| --- | --- | --- |
| CouncilOS | Evidence timeline, pending review, missing-stage explanation, human education | independently authenticated reviewer and signed/qualified approval |
| MEOK | Source-bound next experiment suggestion; model policy remains unchanged | allowed executor + source held-out bank + spend/consent |
| SovSpace | separate what-if worlds, paired task seeds and prediction-vs-observation overlays | no simulation may write GSPC facts |
| Browser extension | display verified record vs missing response/effect; no secret transfer | browser host installation, private data permission |
| MCP/plugin | read-only verify/retrieve applicable axes and reports | provider permissions; no model invocation or paid tool inferred |
| Public website | method-first readable report with uncertainty and refusal states | protected release, hydrated end-user readback |
| Claim Maintenance | bounded counter-reaction recommendation on corrected source | existing owner review and canonical writer only |

### Test plan
1. **Offline replay:** combine the prior authentic source receipts as references only; reject duplicate IDs, altered method hash, cross-realm simulated effects, missing executor or receiver.
2. **Synthetic paired design:** use identical task input and bank hash on both sides, with shuffled and sham-human controls, record paired effects and discordance with no causal claim.
3. **Calibration:** same conditions through check standards and timestamped monitoring; report false alarm, latency to detect, misses, sample dependence and uncertainty.
4. **Human acceptance:** new authorized real reviewer approval and actual harmless effect; independently replay the receiver's exact bytes without reusing simulated traces.
5. **Protected public readback:** verify current bundle, 390px accessibility, task retrieval, changed-digest refusal, and external recipient reproduction.

None of these five workstreams is completed merely because this document, a CI test, or a PR exists.
