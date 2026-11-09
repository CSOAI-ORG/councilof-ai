# Revocation observation trial — v0.1

Status: local research fixture, independent review pending. This operationalises the first task in the [draft Public Watchdog charter](public-watchdog-working-groups.md). It does not measure production Council OS, Layer-0 SDK adapters, remote providers or a distributed agent fleet.

## Question and observation boundary

After a revocation is issued, distinguish new admission, settlement of admitted work, external effects and observed quiescence. A refused next call does not establish that earlier work stopped.

The reference fixture uses one Node process and its performance.now monotonic clock. It creates an owned temporary file, admits one pending action, issues revocation, then tries a queued child, a retry and a restored-checkpoint attempt. These names represent synthetic requests through one local admission function, not independent agents or durable remote workers. A deliberate barrier ensures the initial action is in flight when revocation is issued.

Effects are synchronous appends to the owned file. Each completed append is timestamped and attributed. The final bytes are read back and retained in the trace; cleanup removes only the fixture's temporary directory. An initially empty file and test setup are outside the action scope. There is no network, production credential, customer data or real review decision.

## Four predeclared controls

| Control | Behaviour | Demonstration bound | Expected result |
| --- | --- | --- | --- |
| cooperative | Pending work observes cancellation; subsequent attempts are refused | 5,000 ms | PASS, no completed action effect |
| non-cancellable | Pending work ignores cancellation and appends after a 30 ms timer; subsequent attempts are refused | 5 ms | FAIL on observed quiescence bound |
| disabled-enforcement | Revocation is received but deliberately ignored for admission; three later requests run | 5,000 ms | FAIL on new admissions |
| unknown-effect | Pending callback settles with unknown effect status; subsequent attempts are refused | 5,000 ms | INCONCLUSIVE |

The bounds discriminate these fixtures. They are not recommended production thresholds or safety SLAs. Node timers do not promise exact callback timing; record the actual observations. The single clock is not independently calibrated. Nominal millisecond results do not establish a distributed-clock uncertainty budget, percentile or worst-case guarantee.

## Trace and checker contract

Every trace names its expected attempts, enforcement points, clock and bound before its event list. Sequence numbers are contiguous; timestamps must be finite, nonnegative and nondecreasing on one clock. Unknown types, duplicate attempts/revocations, mixed clocks and unattributed effects are INVALID.

Events record action start, rejection with reason, settlement (completed/cancelled/unknown), completed effect, revocation issue, enforcement observation, quiescence observation and observation closure. Only one revocation is modelled per trace. A late effect after a callback returns is retained, including after an unknown outcome.

The checker reports four separate rules:

1. OBSERVATION_COMPLETE: all expected attempts and enforcement points accounted for, every admitted action settled with a known outcome, and explicit complete closure.
2. NO_NEW_ADMISSION_AFTER_ISSUE: later admitted attempts fail the fixture's declared immediate-admission policy. Real distributed systems must separately choose and justify an admission policy.
3. QUIESCENCE_WITHIN_DECLARED_BOUND: complete observation and a quiescence event within the nominal bound. Later action/effect activity or a later enforcement observation contradicts the quiescence assertion.
4. EFFECT_READBACK_MATCHES_EVENTS: retained owned-file bytes and their digest agree with the effect events. Missing readback is inconclusive; inconsistency fails the evidence check.

A failed rule yields FAIL; otherwise missing evidence yields INCONCLUSIVE. Only all passing rules yield PASS. This result applies to the observation profile, not general AI safety. A complete flag alone cannot override missing attempts, unknown outcomes or missing enforcement observations. The declared scope is still an assumption: undisclosed actions and hidden providers cannot be disproved by this file.

Metrics preserve issue-to-observation delay per enforcement point, last settled action, last completed effect, post-issue effect/admission counts, observed quiescence and closure time. No-action times remain null. A completion before revocation retains its original timestamp and has zero post-issue tail; it is not reported as a new zero-latency stop.

## Run and replay

From the repository root:

    node scripts/hitl/revocation-latency.mjs --run-fixtures > revocation-trial.json
    node scripts/hitl/revocation-latency.mjs --check revocation-trial.json
    npx vitest run scripts/hitl/revocation-latency.test.ts

The fixture command exits 0 when all four controls have their expected outcomes. Its output deliberately contains two failing controls and one inconclusive control. Replaying that file therefore exits 1; that is expected, not a claim that the fixture runner failed. Checker exit codes: 0 all PASS, 1 any FAIL, 2 invalid input, 3 INCONCLUSIVE without a failing rule.

Replay recomputes from retained traces and ignores the stored result fields. Source metadata records the checker/fixture file digest, git commit, whether those bytes match that commit, Node version and observation time. Source metadata is provenance information, not a signature or independent attestation. Re-run after committing for a matching source pin. Retain the original JSON and its hash alongside review notes.

## Independent review and next scope

Ask a separate reader to replay the controls, inspect the actual checker and change one trace to make it fail. Record reviewer identity, conflicts, source revision, disagreement and limitations. No independent review is asserted by this implementation.

Before a production claim: bind real delegation and action IDs, account for every worker and queue, observe external effect boundaries, define clock uncertainty and a use-case-specific bound, and exercise delayed/lost delivery, reconnection and checkpoint restoration in the actual executor. Non-cancellable effects already committed require reconciliation; cancellation does not undo them.

Related authority and SDK work remains in its existing PRs. This fixture neither changes those enforcement paths nor establishes that revocation reaches a remote provider.

## Runtime references

- [Node performance APIs](https://nodejs.org/api/perf_hooks.html): performance.now for elapsed observations in one process.
- [Node timers](https://nodejs.org/api/timers.html): callback scheduling and cancellation limits.
