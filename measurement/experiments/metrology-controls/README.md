# GSPC × MEOK — metrology and industrial reliability transfer experiment

**Status: offline, synthetic, source-declared research only.** This path is intentionally **outside** the signed 34-axis GSPC board, public-root publisher, permission/approval plane, MEOK runtime, and production safety controls. No regulatory assertion or physical safety monitoring is performed.

## Research thesis

Nuclear plants, transmission operators, aerospace engineers and accredited laboratories distinguish: (1) the subject being monitored, (2) the measuring instrument, (3) the instrument's calibration/check standard, (4) the observed change, (5) the alarm/diagnosis, (6) the authorised response, and (7) whether it worked. GSPC currently measures many subjects; its next opportunity is to prove the reliability of its own *measuring apparatus*. A green source build, a valid signature, an actual first-publication time and a verified external effect are distinct observations.

### Transfer map to GSPC / MEOK / Human Council

| Industrial/scientific practice | Transferable mechanism | GSPC/MEOK experiment | What it **doesn't** establish |
|---|---|---|---|
| NIST metrology: reference standards, traceability, uncertainty budgets | Calibrate measurement instrument against independently characterised known inputs; keep Type A/Type B uncertainty separate | Frozen signed grader sentinel bank; reference/label custody, grader revision and calibration uncertainty per axis | An internal hash is not a NIST calibration, independent signer or correct answer |
| NIST Shewhart/CUSUM/EWMA control charts | Control a *time-ordered check-standard stream*, detect isolated excursions and sustained small mean shifts | Run deterministic known-answer sentinels across evaluator revisions and alert for grading drift | An alarm is not a causal diagnosis; tuning needs empirical false-positive/average-run-length evaluation |
| Nuclear IAEA equipment-reliability and defence-in-depth | Identify safety-critical components, monitor ageing/availability, periodically test protection layers | Treat policy parser, grader, signer, public API, proof witness, HITL receipt and receiver as separate barriers with periodic self-tests | More layers are not automatically independent; common-cause failures defeat identical layers |
| NERC disturbance/event recording | Preserve time-synchronised pre-event, during-event and post-event traces with loss, clock and missingness indicators | Model input / decision / policy check / human authorisation / tool effect / recipient receipt captured as individually verifiable events | Signing the event log cannot establish an unobserved physical or third-party effect |
| NASA FMEA / fault-tree / hazard analysis | Model fault propagation and common-cause failures, not only performance averages | Failure paths: leaking answer key; stale source; forged timestamp; failed delivery; colluding graders; duplicate event | FTA needs validated probabilities before it quantifies real-world failure risk |
| MergeKit TIES/DARE/SLERP | Combine compatible model weight deltas or tensors into a new candidate | Pin base/parents, create a **candidate only**, compare held-out GSPC runs before and after, and measure paired changes + error correlation | No proof of model alignment, safety, independence, authenticity or human authority; cannot 'merge' signed cards or reviewer signatures |
| Inter-laboratory proficiency tests | Independent teams measure identical blinded standards; compare agreement, systematic bias and method drift | Two implementations / two custodians / two bank sets; report adjudication and same-answer leakage checks | Two machines running the same code are not independent institutions |

Primary sources:
- IAEA, *Safety of Nuclear Power Plants: Commissioning and Operation*: https://nucleus.iaea.org/sites/nss-oui/Published%20Collections/m_75d87c76-77bf-4e42-b516-3b55ca01bd2b/m_75d87c76-77bf-4e42-b516-3b55ca01bd2b__42_0.Html
- IAEA, *Good Practices in Implementing Plant and Equipment Reliability Programmes in Operating Nuclear Power Plants* (2026): https://doi.org/10.61092/iaea.aig0-aa1s
- NIST, measurement process statistical control: https://itl.nist.gov/div898/handbook/mpc/section2/mpc2.htm
- NIST, CUSUM charts: https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc323.htm
- NIST, metrological traceability: https://www.nist.gov/metrology/metrological-traceability
- NIST AI RMF, Measure: https://airc.nist.gov/airmf-resources/playbook/measure/
- NERC PRC-002 disturbance monitoring overview: https://www.nerc.com/standards/reliability-standards/prc/prc-002-5
- NASA, hazard analyses and fault trees: https://nodis3.gsfc.nasa.gov/displayAll.cfm?Internal_ID=N_PR_8715_0003_&page_name=ALL
- MergeKit methods: https://github.com/arcee-ai/mergekit/blob/main/docs/merge_methods.md
- Conformal change detection: https://proceedings.mlr.press/v152/vovk21b.html

## Implemented pilot: offline check-standard instrument

`check_standard.py` accepts only a local JSON check-standard stream and an explicit UTC observation cut-off. The baseline mean and standard deviation are supplied by a separately pinned *source-declared* calibration document: **they are never estimated from the evaluated readings**. Readings are ordered, accompanied by distinct raw-source digests and separate measurement/observation times. The tool refuses stale calibration, future data, replayed source digests, duplicate IDs, gaps, non-finite numbers and unknown fields.

It calculates standardised residuals `z_t = (x_t - μ_0)/σ_0`, two-sided CUSUM recursions `C⁺_t = max(0,C⁺_(t-1) + z_t - k)` and `C⁻_t = max(0,C⁻_(t-1) - z_t - k)`, and a Shewhart single-reading threshold `|z_t| ≥ L`. All thresholds are **preselected demonstration values**, not calibrated family-wise false-alarm guarantees. For a real deployment, hold out independent no-drift sequences, quantify false-alarm frequency/average run length with serial correlation, and freeze an approved control plan.

Outputs: `STABLE_ON_CHECK_STANDARD`, `ALARM` (human review only), or `UNCHECKABLE` (fail closed). Exit codes 0, 3, 4 respectively. No cloud access, model weights, signing tokens, public boards, deployment actions or automation.

Run tests with `python3 measurement/experiments/metrology-controls/test_check_standard.py`. For local read-only execution, write your JSON input outside the repository and execute:

```bash
python3 measurement/experiments/metrology-controls/check_standard.py \
  --input /path/to/known-check-standard.json \
  --now 2026-11-23T09:30:00Z
```

No example fixture is claimed to be a real calibrated instrument. Synthetic tests include a clean control, single spike, persistent upward/downward shift, duplicate source, future clock, missing time window, source replay and expired calibration.

## Further experimental hypotheses — preregister *before* using live GSPC results

1. **Instrument drift without model drift:** sentinel grader disagreement changes over time while frozen raw model outputs remain identical. Test with held-out labels; expected action: quarantine grader changes, not penalise models.
2. **Common-mode referee failure:** twelve apparently agreeing council seats share answer-bearing metadata. Blind all answer-choice fields and compare a genuinely independent custodian; no 12/12 accuracy claim without a blind run.
3. **Evidence latency as a distribution:** use paired detected/observed/first-served/published/witnessed/received timestamps; preserve interval censoring and missingness rather than imputing exact dates.
4. **Receiver effect gap:** a valid emitted signed receipt need not imply an external receiver acted. Reconcile request ID to recipient-origin response/acknowledgment, without self-issued 'external' receipts.
5. **Conservation-law consistency:** test algebraic invariants for counts, signed-card inclusion, index totals and source-to-wrapper transformations; anomalies reveal broken accounting, not necessarily AI harm.
6. **MergeKit safety Pareto:** paired, held-out GSPC bank of base/parent/merged candidates. Quantify task accuracy, calibrated uncertainty, category-specific harm, correlation and regression under the same prompt/bank. An accuracy gain with more correlated harmful errors is not an unconditional improvement.
7. **Time-to-detect vs false alarms:** compare Shewhart, EWMA, CUSUM and e-process change detection under preregistered sequential null streams, shift scenarios and feedback loops. Report power, false alarm frequency, detection delay, resource cost and distribution-shift assumptions.
8. **Instrument calibration intercomparison:** run independent open-source graders, blind source labels, publish disagreement and adjudication results with distinct custodian identities; same code on two Macs is repeatability, not lab independence.
9. **Missingness as a first-class measurement:** quantify missing source, unreadable sensor, unknown approval and omitted recipients; never treat missing as a negative observation or silently drop records.
10. **Early-warning indicators:** explore variance/autocorrelation/spectral change as possible impending degradation signals in controlled systems; do not call these validated leading indicators without prospective evidence.
11. **Counterfactual interventions:** use A/B or matched intervention methods to distinguish whether a security policy *caused* a reduction in bad outcomes from a coincidental change in workload composition.
12. **Assurance case:** bind safety claim → hazard/assumption → test result → signed input → human reviewer → deploy → observed receiving-party effect. The chain must explicitly show every unmeasured link.

## Release and authority boundary

Do not add this pilot to the 34-axis board or regulatory freshness release gate without reviewed construct validity, independent check-standard custody, uncertainty analysis, false-alarm validation, threat model, source signing and human approvals. Never weaken the existing 14-day card-freshness policy or use a new root timestamp to rewrite older measurements. All safety outcomes remain unverified until tested in the relevant actual operational context.
