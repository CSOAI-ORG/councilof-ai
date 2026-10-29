### Acceptance examples for R1/R3/R5: distinguish a released call from its external effect

Building on this issue's existing four-way taxonomy, CSOAI suggests a small additional evidence distinction: **an in-scope, authorized request can have an unconfirmed external outcome**. This does not require another authority model or another conformance verdict.

The authorization decision, scope comparison, invocation attempt, provider acknowledgement, and evidence of the external effect answer different questions. A timeout is not proof that an action did not happen; a successful acknowledgement is not always proof of delivery. Scope conformance can be known while the outcome remains unknown.

Suggested supplementary record semantics:

- Bind each attempt and each effect observation to the same stable logical `action_id`. Keep attempt identifiers distinct; a retry is not automatically a second completed action.
- Record `external_effect_status` independently of the scope determination. Suggested illustrative values: `confirmed`, `unconfirmed`, `conflicting`, and `not_applicable`. They are not official SAFE vocabulary.
- Name the effect being checked, the evidence source, method/version and observation time. An acknowledgement can confirm receipt by a service while leaving downstream delivery unconfirmed. Do not promote one claim into the other.
- Preserve event time separately from collector receipt time and disclose uncertainty. Later evidence should append a superseding determination, not silently rewrite what was known earlier.
- Keep references to credential scope and validity, not reusable tokens, private keys or session cookies. Access-controlled evidence can remain unavailable to a particular reviewer without becoming a successful verification.

**Proposed synthetic acceptance cases, not reported execution results:**

| Fixture | Expected interpretation |
| --- | --- |
| Valid authorization, matching attempted request, no effect evidence | Scope may be consistent; external effect remains unconfirmed. Do not label delivery completed. |
| Provider acknowledges queueing but no destination receipt exists | Queue acceptance is confirmed; destination delivery is not. |
| Timeout followed by a matching destination receipt | Preserve the timeout; append confirmed effect with its evidence and time. Do not infer that timeout meant non-execution. |
| Retried request produces two observations of the same provider operation ID | Preserve both observations; do not count two completed effects solely from two receipts. |
| A valid signature accompanies an inaccessible effect-evidence reference | Record signature integrity separately; the external-effect claim remains unverified for that reviewer. |
| Two observations conflict about the same effect | Retain both and report conflict, not whichever looks more favourable. |

One deliberately minimal example, **not an official schema or an incident record**:

```json
{
  "example_only": true,
  "action_id": "synthetic:notification-01",
  "attempt_id": "synthetic:attempt-01",
  "scope_determination": "match",
  "scope_method": "synthetic:exact-action-comparison/v1",
  "acknowledged_effect": "accepted_for_processing",
  "external_effect_under_review": "delivered_to_destination",
  "external_effect_status": "unconfirmed",
  "external_effect_evidence_ref": null,
  "unresolved_questions": ["Was the notification delivered?"]
}
```

This complements #29's delegation lineage and #34's coverage disclosure. It also makes our discriminating-control concern in #32 concrete: consumers should be tested against an authorized-but-unconfirmed case, not only completed happy-path examples.

Would this distinction fit best as linked evidence-profile guidance for R1/R3/R5? The intent is to preserve your existing four outcomes for authority/scope while preventing a separate unsupported completion claim.

Nicholas Templeman, CSOAI

Methodological feedback with synthetic examples only; no private incident data, membership claim or certification claim. No endorsement or adoption is implied.
