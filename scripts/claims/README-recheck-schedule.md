# Bounded offline recheck advice (proposed)

`recheck_schedule.py` proposes a bounded work queue from the existing
`csoai.claim-reactions/0.1` projection and explicit caller scheduling policy. It is
an incremental consumer of the current reaction path. It adds no case store,
canonical claim state, event schema, source ingestion, scheduled job or executor.
Nothing is rechecked, corrected, signed or published. Adoption and production
operation are not established by these files.

## Run

Python 3.11+ standard library on Linux; no dependencies or network are needed:

```sh
python3 scripts/claims/recheck_schedule.py \
  scripts/claims/tests/fixtures/live-reactions.json \
  scripts/claims/tests/fixtures/example-policy.json \
  --as-of 2026-11-07T12:00:00Z
```

The result is JSON on stdout. Invalid input produces `status: REJECTED` and exit
code 2. The caller can supply `--projection-sha256 HEX` to pin exact input bytes.
A matching digest is not a signature, provenance proof or independent verification.
The CLI reads only regular files, refuses final-path symlinks/FIFOs/devices and
limits each input to 4 MiB. The imported function expects already bounded parsed
objects. Its projection/claim/graph list limits are 20,000/2,000/20,000.

## Existing projection contract

Input must use the existing reaction schema, `source_verification: VERIFIES`,
`since_exclusive: -1`, contiguous `event_seq` starting at zero, and matching
`n_events`, `by_state` and `n_counter_reaction_required`. This is structural
validation of a complete upstream assertion. The scheduler does **not** fetch or
authenticate the feed, signed head or source bytes. A malicious caller can forge
an internally consistent projection; byte pinning does not fix that trust boundary.
Use the existing verified feed/projection path before this consumer.

Exact duplicate event rows collapse; conflicting sequence numbers reject the
input. Duplicate JSON object keys are rejected. Subject-wide `*` rows, baselines
and receipts do not invent claim-level work. Missing matching claim evidence or
an observation timestamp defers work. Only lowercase 16- or 64-hex sealed subject
identifiers are supported. No subject names, source text or report text are needed.

The output retains event sequence, observation time, reaction enum, delivery
receipt enum and counter-reaction flag. Free-text reasons/checks and arbitrary
upstream or policy fields are not echoed. Original projection bytes are identified
by a SHA-256 digest in CLI output. Advisory ordering describes work items; it does
not score, rank or establish the quality, truth or compliance of a claimant.

## Caller policy contract

`example-policy.json` demonstrates the format. Its costs, provider, method and
weights are illustrative, not measured live facts. Its four successful-check
timestamps are unknown; the captured `CONFIRMED` states are not used to fabricate
them.

| Field | Meaning |
| --- | --- |
| `budget_units`, `max_items` | Hard per-invocation caps; zero is allowed. Units are work estimates, not currency. |
| `allowed_provider_ids` | Explicit scheduling allowlist; source access/reuse rights and reviewer authority remain `NOT_ASSESSED`. |
| `exploration_slots` | Unknown-history slots reserved after mandatory work; default 1. |
| `max_wait_seconds` | Explicit pending work reaching this wait becomes mandatory; default 604800. |
| `dependencies` | Optional `[parent, child]` identifier edges; only supplied edges are counted. |
| `max_dependency_count` | Known descendant count cap, 0–128; default 32. Cycles and scan effort are bounded. |
| `claims` | Exact `(subject_sealed_id, claim_ref)` policy rows. One method per claim per invocation. |

Every claim row requires `method_version`, `provider_id`, positive integer
`estimated_cost_units` and `max_age_seconds`. Optional fields are UTC timestamps
`last_success_at`, `first_pending_at`, `deadline_at`, `retry_at`; integer
`impact_weight` 1–100; boolean `known_stale`, `dependency_graph_complete`; and
identifier `dependency_root`. Timestamps must end in `Z`. A successful check and
pending-since history must come from the caller's evidence, not the scheduler.
Conflicting duplicate claim policies, including different method versions for one
claim, reject the invocation. Caller dependencies, costs and impact are assertions,
not discovered coverage or causal effects. A capped/incomplete graph stays explicit.

## Selection and evidence boundaries

1. Due hard deadlines, historical recheck triggers and wait-limit promotion form
   the mandatory tier. Deadline order, longest wait, heuristic priority and stable
   identifier ties make selection deterministic.
2. Failed source observations propose `SOURCE_RETRY`, never a finding that the
   source changed. They require an explicit `retry_at`; backoff remains binding
   even when a deadline is overdue. Historical retry and recheck triggers remain
   unresolved in this interface. Later `NO_CHANGE` or delivery receipts do not
   establish same-source/method resolution. A future resolution contract needs
   source-bound completion evidence; no second resolution store is added here.
3. Unknown successful-check history receives the exploration reserve. Caller
   `first_pending_at` enables oldest-pending selection and wait-limit promotion.
   An in-memory invocation cannot promise starvation freedom without that history
   or under overload, backoff, missing evidence or disallowed providers.
4. Remaining due work uses an exact rational ordering heuristic:
   `min(age / max_age, 4) × impact_weight × (1 + bounded known descendants) / cost`.
   Remaining capacity may serve additional unknown-history work. This is an
   uncalibrated work-ordering policy, not probability, expected information gain,
   monetary value or a claim-quality score.

Budget and item caps are never exceeded. Due mandatory items that cannot fit are
reported `UNFUNDED_MANDATORY`; blocked mandatory items retain their blocking reason.
The result counts both unmet mandatory work and due deadlines not selected. A
deadline is a scheduling constraint to expose, not a promise to violate the budget.

Selection preserves `STALE`/`UNKNOWN`; it never marks a claim fresh or claims a
successful check. `NOT_DUE` only means the supplied age policy has not elapsed.
Delivery receipts remain receipts even beside a retry or recheck requirement.
Provider allowlisting does not establish source rights or human permission.

## Validation and replay

```sh
python3 -m unittest discover -s scripts/claims/tests -p 'test_recheck_schedule.py' -v
python3 scripts/claims/tests/replay_schedule.py
npx vitest run scripts/claims/recheck_schedule.test.ts
```

The Vitest wrapper is collected by the existing PR unit gate over `scripts`. It
runs the Python boundaries/CLI, imports the actual existing TS reaction derivation
for the retained events, and compares a deterministic synthetic replay with its
checked-in result. It adds no CI workflow or package change. The standalone
`tests/validate_projection.mjs` offers the same retained-source reproduction under
Node 24 native TypeScript support. Neither reproduction authenticates a signature.

The live public capture on 2026-11-07 contains nine retained September events:
seven `NO_CHANGE`, one `BASELINE_ONLY`, one `DELIVERY_RECEIPT`, and zero recheck
triggers. It reproduces from the existing TS function and retained raw events.
Capture/source blob provenance is in `tests/fixtures/provenance.json`. This proves
fixture compatibility, not active source coverage, live checking or impact.

The replay is a separate **invented** periodic-maintenance world: three fixed
seeds, 48 hourly steps per seed, 20 claims, budget 12 and six items per step.
Hidden changes and scripted check success/failure are generated independently of
strategy. The simulator alone records synthetic successful checks in the next
policy input. All strategies share mandatory ordering, exploration and caps; only
discretionary due ordering differs. Retry/recheck semantics are tested separately.

| Synthetic aggregate | Bounded advice | Oldest first | Round robin |
| --- | ---: | ---: | ---: |
| Work cost units spent | 1318 | 1292 | 1308 |
| Scripted successful checks | 468 | 464 | 472 |
| Scripted failed checks | 48 | 43 | 39 |
| Hidden weighted stale claim-steps | 1684 | 1696 | 1730 |
| Missed policy deadline claim-steps | 0 | 2 | 2 |
| Unknown claim-steps | 14 | 14 | 14 |
| Maximum pending wait, hours | 4 | 4 | 4 |

These small differences occur at different actual spend despite identical budget
limits. They do not establish superiority, actual freshness improvement, return
on spend, source reliability or business value. The next useful experiment is a
held-out historical replay with source-bound successful/failed reads, observed
costs, independently labelled meaningful changes and a preregistered metric.
No production claim is justified before that comparison.
