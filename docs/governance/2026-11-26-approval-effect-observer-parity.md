# Approval-to-effect observer parity — 26 November 2026

## Scope and baseline
Council master `07ccfc585ac8d47f4cd55e36d0ea291ad778f47c`, existing merged HITL demonstrator (#4296 and subsequent repairs). This is an isolated, synthetic-principal fixture using real local filesystem effects. No production authorisation, external observer, customer data, or independent institutional review is claimed.

## Findings
In six deterministic controls, the authority document was altered after a valid fixture execution, a new test pin was calculated, and the unsigned receipt's authority digest was changed accordingly. The admission gate reported the respective authority contradiction, while historical readback returned EFFECT_READBACK_MATCHED. The controls cover revoked authority, stale watch, mismatched epoch, wrong resource scope, authority issued after approval, and unsupported role. This is a readback semantic mismatch under a caller-supplied test pin, not evidence of a compromised external trust root.

Extracted shared authority-appraisal rules; use them in admission and historical readback at the receipt's recorded time. Replay is admission-only. Exclusive-write races return a structured denial; write failures preserve unknown outcome and known effect presence, without automatic retry.

## Executed results
- Original suite on M4 / Node v26.0.0: 22/22.
- Expanded suite on unchanged master: 24/31 pass, 7 fail (six authority contradictions and receipt-write I/O failure). Race and process-kill controls already passed on the observed baseline run.
- Expanded suite on candidate M4 / Node v26.0.0: 31/31 pass.
- Exact candidate source on second Mac / Node v22.16.0: 31/31 pass.
- Eight concurrent processes: one success, seven structured replay denials, one marker row.
- Actual SIGKILL after effect creation and before receipt creation: existing bytes preserved, observer UNCHECKABLE, repeat admission DENIED.
- Injected EIO at receipt write: EXECUTION_OUTCOME_UNKNOWN, effect_written true; observer UNCHECKABLE; no retry.
- Candidate source SHA-256: 5821cbf57985f3df9fc3ea59b573b1a1c3eea331d78838f3c6167734037d7658
- Expanded suite SHA-256: e012ea61bcb0c996756099dee73767c254b39ed63707ac49c22e7362ebc58151

Reproduce from repository root: `node --test harness/hitl/approval-effect-demo.test.mjs`.

## Boundaries
Separate local process is not independently administered observation. Test principal is not a human. Recorded execution time is not externally authenticated. This is not a power-loss durability claim, general exactly-once remote execution, a new GSPC score, compliance certification, or production permission. A production pilot still needs externally managed authority, current revocation, pinned trust, independent effect observation, and a receiver that verifies the complete evidence chain. Do not repair missing receipts by inventing an effect or rewriting history.
