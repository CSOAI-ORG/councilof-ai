# Council of AI — assurance fault-injection digital twin (24 Nov 2026)

**Status: SYNTHETIC NEGATIVE CONTROL, NOT PRODUCTION EXECUTION OR HUMAN VERIFICATION.**

This is an intentionally small, deterministic **fault-tree laboratory** inspired by nuclear defence-in-depth, NASA FMEA, IEC 61508-style independent barriers, distributed idempotency, and operational telemetry. It does not attack a system, alter a database, invoke a real agent, issue any permission, verify a third-party receipt, sign evidence or change Council policy. It demonstrates why an end-to-end safety claim cannot be inferred from an AI grader, a role vote, a valid signature or a receipt-like object alone.

## System under test and actual blind spots

```
source + GSPC grader + calibration/freshness
  -> candidate evidence under frozen version
  -> independent human approval (actual identity/authority, if real)
  -> executor validates: authority, scope, revocation, idempotency
  -> bounded action
  -> receiving system observes the resulting change
  -> independent audit readback, correction and release decision
```

A full trusted system requires checks at **each** link; our twin **cannot** supply external trust or simulate signed evidence authenticity by setting a Boolean. It can only falsify unsafe logical assumptions and exercise the shape of the workflow.

The initial pilot model uses 12 strict Boolean inputs:
- four source-declared *synthetic* authority facts (identity validity, scope, revocation, freshness);
- three independent executor check toggles (scope, revocation and replay);
- whether the idempotency key has been replayed;
- simulated effect attempt;
- synthetic recipient observation and supposed independence;
- instrument evidence freshness.

The exhaustive sweep varies **10 factors** (2^10 = 1,024 cases), holding `effect_attempted` and `measurement_fresh` true to focus on authority/receiver logic. It records all failure/unknown outcomes rather than counting only successful paths. Unit tests separately inject no-effect attempts and stale measurements.

Each report is labelled `SYNTHETIC_...`; machine-readable fields explicitly say `actual_recipient_effect_verified=false`, `actual_human_authority_verified=false`, `source_signature_verified=false`, and `production_policy_mutated=false`.

## Acceptance cases — scope matters more than happy-path accuracy

| Injected condition | What should happen in our *model* | What a real-system evaluation additionally requires |
| --- | --- | --- |
| Proper authority, live scope, all executor checks, independent simulated receipt | Synthetic allowed action with simulated receipt | Customer-controlled sandbox and independent receiver-origin readback |
| Missing or expired authority | No effect | Authoritative identity and expiry check by actual executor |
| Wrong scope or revoked authority; enforcement on | No effect | Independent proof that the real executor blocked attempt and nothing changed |
| Wrong scope + executor ignores scope | **CONTROL BREACH** | Real logs and external receiver check; immediate incident handling if real |
| Revoked + executor ignores revocation | **CONTROL BREACH** | Real revocation-epoch evidence |
| Replayed key with idempotency enforcement | Block repeated effect | Real durable deduplication storage and concurrent replay negative tests |
| Replayed key + replay enforcement disabled | **CONTROL BREACH** | Recipient-side deduplication/atomic effects, not only gateway memory |
| Effect allowed but recipient observation absent, forged or self-issued | **UNCHECKABLE** | Receiver-controlled proof source independent of the caller |
| Good receiver path but stale grader | **UNCHECKABLE** | Source-pinned check standard and independent instrument-control interval |

## Common-cause analysis: why 'three barriers' can still be one failure

The helper `correlated_failure_probability(p,q,n)` implements an explicitly hypothetical mixture:

```
P(all n barriers fail) = q + (1-q) p^n
```

where **q** means a common cause completely defeats every barrier and **p** is the remaining conditionally independent per-barrier failure chance. This is **not** empirical correlation estimation, Byzantine consensus math, a real safety-integrity-level calculation, or an estimate of GSPC's council failure rate.

**Illustrative parameters:** p=0.05 per barrier, q=0.02 common cause, n=3:
- Independent-only `p³=0.000125` (0.0125%);
- Mixture `0.02 + 0.98 × 0.000125 = 0.0201225` (2.01225%);
- The common cause increases the *illustrative* all-failure risk about **161-fold**, despite the same number of nominal barriers.

A single leaked answer key, shared underlying provider, copied grader, reused signing principal or common network authority could produce dependence in a real system. But the mere possibility does not quantify it. To estimate actual risks, freeze representative traces, expose independent-error/covariance matrices, test separate signer/reviewer custody and run sustained fault injection with confidence intervals, not binary toy examples.

## Reproduce without live services

From repository root:

```bash
python3 measurement/experiments/assurance-fault-twin/test_fault_twin.py
python3 measurement/experiments/assurance-fault-twin/fault_twin.py \
  --output /tmp/csoai-fault-twin-synthetic.json
```

Both use the Python standard library, no tokens, no external network access, no model provider, no delegated tool permissions, no physical I/O and no synthetic identities presented as real. The workflow retains an artifact with exact byte SHA-256; its hashes are integrity identifiers, not independent attestation.

## What to connect next — only after human decisions

1. Read existing evidence-event/authority-effect schemas and write a **lossless, validated adapter** to this *simulation input*, without introducing a competing canonical event ontology.
2. Capture approved real sandbox executor outcomes with a qualified owner and approved privacy/retention plan; source pins for model, tool, grader and execution environment.
3. Add recipient-origin before/after state digest and independently delegated verifier; force `UNKNOWN` when absent, no synthetic green condition.
4. Test an independent check-standard bank for the grader and confirm field false-alarm rates before using drift alerts to block release.
5. Run matched control-versus-fault trials, idempotency concurrency, partial failure, network partitions, double execution and clock-skew. Measure observed containment and time-to-recovery, not just predicted paths.
6. A merged model from MergeKit is **only a model candidate**. Evaluate a pinned held-out GSPC bank and compare overlapping errors and common dependencies, never merge provenance receipts or claim BFT consensus by model agreement.
7. Integrate OTLP event context from existing Phoenix/Langfuse-style collectors *without* raw secret/prompt leakage; layer signed evidence on top of instrument traces.

**Release boundary:** no GSPC 35th axis, root refresh, regulation claim, executor code change, human council appointment, customer pilot acceptance, real settlement or externally verified effect follows from this study. No automatic root/freshness gate bypass.

Sources: [NIST AI RMF Measure](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/), [IAEA Equipment Reliability](https://doi.org/10.61092/iaea.aig0-aa1s), [NASA fault protection and assurance](https://sma.nasa.gov/sma-disciplines/safety), [OpenTelemetry Events](https://opentelemetry.io/docs/specs/semconv/general/events/), [Temporal workflow execution](https://docs.temporal.io/workflow-execution), [Council authority-effect SOW template](../../../docs/commercial/AGENT-AUTHORITY-PILOT-SOW-TEMPLATE.md), [Council metrology controls](../metrology-controls/README.md).
