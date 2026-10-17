# CSOAI / SAFE-GALC synthetic record and link fixture v0.1

This is a review-only follow-on to `../synthetic-retry-v0.1/`. It answers Gary Gayle's request on OpenSecureAIAlliance/RFCs PR 39 (comment 6111832569, 2026-10-11): make the record and link mappings explicit, and keep `NOT_EVALUATED` for the proposed comparisons.

All records, identifiers, times, states, approvals, people and effects are **invented**. No SAFE-GALC verifier was run. This is not a demonstration of execution, authority, human participation, custody, signature verification or SAFE adoption.

The candidate was read at commit `b5c12f358fc281fc4beec1528a8db4d125edd879` of PR 39. Section numbers below are that document's.

## Files

- scenario-input.json: one lifecycle in the candidate's own record and link terms. It carries no `evaluations` and no `overall_result`.
- verification-context.json: the declared synthetic evidence the records cite. Separate from the input.
- expected-output.json: counts and positions we expect to find. It holds no SAFE-GALC property result.
- record-link-mapping.json: where each assertion sits (record, field, link, evidence) and each gap we found. Every comparison is `NOT_EVALUATED`.
- build_scenario.py: the producer of scenario-input.json. It computes the digests.
- validate_fixture.py: local structural checks with tampered negative controls.
- MANIFEST.sha256: SHA-256 of the files above and this README.

## The scenario

One proposal. A first decision lapses. An attempt under it is denied. A second, separate decision allows a later attempt. Dispatch happens and completion is not established. A sink read later fits the expected state. The affected party contests the impact, twice, about one reported state. An early assessment is superseded by a later one; both are kept.

| Record | Type | What it holds |
|---|---|---|
| proposal-1 | `proposal` | The proposal actually presented. Holds the before-state, the context read and the idempotency key. |
| determination-1 | `governance_determination` | First decision, bound to proposal-1 by identity and digest. Window 00:00:10 to 00:01:10. One use. |
| enforcement-1 | `enforcement_event` | The denied attempt. determination-1 is presented at 00:05:00, after its window. The evidence is fresh; the permission is not. Rejected, `determination_expired`. No execution record follows. |
| determination-2 | `governance_determination` | A second decision on the same proposal, issued separately on a second approval. Window 00:06:00 to 00:07:00. determination-1 is left as it was. |
| enforcement-2 | `enforcement_event` | The later attempt, accepted under determination-2. Presented parameters differ from proposed parameters, so the two digests are unequal. Its own containment check cites the method and both operands. |
| execution-1 | `execution_result` | Dispatch under enforcement-2. `result_status` is `unknown`. No completion time. No retry. |
| reconciliation-1 | `reconciliation_result` | Early assessment: `missing`. Carries source finding F1 (`external_effect_status: unknown`). |
| observation-1 | `observation` | A machine read of the sink record. It satisfies the expected predicate. |
| observation-2 | `observation` | The later human reaction: the affected party reports the resulting state and contests the impact. |
| observation-3 | `observation` | The same report again, about the same reported state. A second observation, not a second failure. |
| reconciliation-2 | `reconciliation_result` | Corrected assessment: `conflicting`. Supersedes reconciliation-1 and keeps it. Carries source finding F2 (`external_effect_status: observed`). |

Links: `evaluates` from each determination to the proposal; `enforces` from each enforcement event to its determination; `attempts` from the execution result to enforcement-2 only; `observes` from each observation to the execution result; one `reconciles` for each record a reconciliation compared; `supersedes` from reconciliation-2 to reconciliation-1. Every link carries the digest of both ends.

## Record and link positions

These are the five positions named in the 11 October reply.

| | Assertion | Position in the candidate | Records | Links | Gap we found |
|---|---|---|---|---|---|
| M1 | Proposal-bound decision | governance_determination (section 8.4), linked by evaluates to the exact proposal identity and digest | proposal-1, determination-1, determination-2 | evaluates-1, evaluates-2 | The schema's determinationData has no field named for the evaluated scope or for revalidation conditions. We read the scope through proposal_ref and put revalidation triggers in material_change_invalidators. determinationData has no field for the decision maker's own authority basis. We listed it in authority_evidence_refs beside the approval. |
| M2 | Enforcement and execution: accepting a determination, attempting an operation and completing it stay apart | enforcement_event and execution_result (sections 8.5 and 8.6), linked by enforces and attempts | enforcement-1, enforcement-2, execution-1 | enforces-1, enforces-2, attempts-1 | none found |
| M3 | Subsequent human reaction that reports resulting state or impact | observation (section 8.7), linked by observes, with attributable provenance, method and limitations | observation-2, observation-3 | observes-2, observes-3 | observationData has no field that says the observer is a person. We used the free-text role on the principal. Neither report requests a new action, so the new-proposal branch is not instantiated. |
| M4 | Assessment and correction: the later finding names what it supersedes; the earlier finding and all observations are kept | reconciliation_result (section 8.8) with supersedes (section 9) | reconciliation-1, reconciliation-2 | reconciles-1 to reconciles-11, supersedes-1 | The base lifecycle in the candidate vectors carries one reconciles link, to the observation. We wrote one reconciles link for each record in record_refs. Which is intended? |
| M5 | external_effect_status stays in its schema-identified source payload with its original meaning and evidence basis | the source payload, identified by its own schema id and digest; here carried in the extensions member of the reconciliation_result record | reconciliation-1, reconciliation-2 | none | No v0.1 typed link joins a lifecycle record to a source payload that is not itself a lifecycle record. transforms needs a record at both ends, so the payload rides in extensions. The conversion from external_effect_status to any GALC field or property was not evaluated. In this fixture the source value is observed while result_status is unknown and the reconciliation result is conflicting. |

`external_effect_status` is kept in the source finding, under the finding's own schema id and digest. It is not copied into any candidate field. In this fixture the source value is `observed` while the execution `result_status` is `unknown` and the reconciliation `result` is `conflicting`. None of the three is derived from another.

## The proposed comparisons

The six comparisons, as posted on PR 39 on 11 October:

- **C1.** Evaluate containment with the declared method and preserved operands; unequal hashes alone do not establish an out-of-scope action.
- **C2.** Distinguish current authority from expired/revoked authority, a materially changed proposal/baseline, and apparent approval with an unestablished authority basis.
- **C3.** Retain a denied attempt beside a separately approved later attempt; cancellation acknowledgement is distinct from evidenced enforcement or termination.
- **C4.** Preserve uncertainty after dispatch; reconnection does not establish retry permission.
- **C5.** Bind closure to the exact operation, evidence and verification context; matching bytes or a reviewer label alone does not establish independence.
- **C6.** Keep contested human impact visible despite technical success, and distinguish repeated observations of one obligation failure from failures of distinct obligations.

None was run. The table shows, part by part, whether this fixture has records for it and where they are.

| Part | What it says | Status | Records present | Where | Gap we found |
|---|---|---|---|---|---|
| C1a | Declared method and preserved operands | `NOT_EVALUATED` | yes | enforcement-2, execution-1, proposal-1 | enforcementData.checks holds a check name, a result and evidence_refs. It has no field for the comparison method or its operands, so all three ride in evidence_refs. |
| C1b | Unequal hashes alone do not establish an out-of-scope action | `NOT_EVALUATED` | yes | enforcement-2, proposal-1 | The pass on scope_containment is the enforcement point's own supplied claim. We did not run the declared method. |
| C2a | Current authority apart from expired authority | `NOT_EVALUATED` | yes | determination-1, determination-2, enforcement-1, enforcement-2 | none found |
| C2b | Refreshed evidence does not restore expired permission or extend its window | `NOT_EVALUATED` | yes | enforcement-1 | none found |
| C2c | Revoked authority | `NOT_EVALUATED` | no | determination-1, determination-2, enforcement-2 | No revocation occurs in this fixture. |
| C2d | Materially changed proposal or baseline | `NOT_EVALUATED` | no | determination-2, enforcement-2, proposal-1 | No proposal or baseline changes in this fixture. A changed proposal would be a new proposal record with its own determination. Whether it sits in the same lifecycle envelope is not decided here. |
| C2e | Apparent approval with an unestablished authority basis | `NOT_EVALUATED` | no | determination-1, determination-2 | Every authority item here is declared available, so the unestablished case is not instantiated. |
| C3a | Denied attempt retained beside a separately approved later attempt | `NOT_EVALUATED` | yes | enforcement-1, enforcement-2 | determination-2 does not use supersedes on determination-1. determination-1 lapsed by its own interval. Is a supersedes link expected here? |
| C3b | Cancellation acknowledgement apart from evidenced enforcement or termination | `NOT_EVALUATED` | no | execution-1 | No cancellation occurs in this fixture. We found no v0.1 record type, acceptance_outcome or result_status value for a cancellation acknowledgement. |
| C4a | Uncertainty after dispatch is preserved | `NOT_EVALUATED` | yes | execution-1, reconciliation-1, reconciliation-2 | none found |
| C4b | Reconnection does not establish retry permission | `NOT_EVALUATED` | no | determination-2, enforcement-2, execution-1 | No retry or reconnection occurs in this fixture. The retry case is in synthetic-retry-v0.1, in our own record names. We found no v0.1 position for a reconnection event. Open question 7 in section 22 covers retry identifiers. |
| C5a | Closure bound to the exact operation and evidence | `NOT_EVALUATED` | yes | reconciliation-2 | none found |
| C5b | Closure bound to the verification context | `NOT_EVALUATED` | no | envelope | reconciliationData has no field for the identity of the verification context. We carry the context digest in an envelope extension. Nothing binds a reconciliation record to it. |
| C5c | Matching bytes or a reviewer label alone does not establish independence | `NOT_EVALUATED` | no | envelope, observation-1, reconciliation-2 | Independence is not claimed anywhere in this fixture, so there is no claim to test. |
| C6a | Contested human impact stays visible despite technical success | `NOT_EVALUATED` | yes | observation-1, observation-2, reconciliation-2 | v0.1 reconciliation results have no value for a state predicate that is met while the reported impact is contested. The synthetic reconciler wrote conflicting with observation_conflict. Is matched with a recorded limitation the intended position? |
| C6b | Repeated observations of one obligation failure apart from failures of distinct obligations | `NOT_EVALUATED` | yes | observation-2, observation-3 | v0.1 has no obligation identifier. The only position we found is equality of the observed_state id and digest. The distinct-obligations case is not instantiated. |

## What was checked

- Every record digest is recomputed from the record's `data` member. Every reference and every link must carry that digest.
- Links must have the source and target record types of section 9, and must agree with the references inside the records.
- The fixture's own assertions: the two determinations bind one proposal and do not overlap; the denied attempt has no execution record; an `unknown` execution has no completion time; both reaction observations and the earlier reconciliation are kept; the source finding is present and not copied into a candidate field; an accepted attempt with unequal parameter digests cites a declared method and both operands.
- Every field, link and evidence item named in record-link-mapping.json exists. Every status in it is `NOT_EVALUATED`.
- Each negative control tampers with the fixture and must be rejected under a named rule.
- Optional: the scenario input is validated against the candidate's JSON Schema, unmodified, at the commit above. The schema requires `evaluations` and `overall_result`. This input has neither, by design. The check passes only when those two absences are the schema's only objections. It needs the `jsonschema` package and a working date-time format checker; without them it is reported as skipped, `NOT_EVALUATED`.

The dated output of these checks is in `../RUN-RECEIPT-2026-10-13.txt`.

## What was not checked

- No SAFE-GALC property was evaluated. No comparison was run. No overall result exists.
- The containment method is declared and not run. The `pass` on `scope_containment` is the synthetic enforcement point's own claim.
- Digests are real SHA-256 values under a local rule (keys sorted, compact, UTF-8). No RFC 8785 claim is made. They show the references agree with each other and nothing more.
- No signature, time proof, anchoring, custody, independence or real person exists here. Records say `unanchored`, custody `never_provided`, independence `not_claimed`.
- The candidate's own harness reads its own vectors file, so this fixture was not put through it.

Run: python3 validate_fixture.py   (and: python3 build_scenario.py --check)
