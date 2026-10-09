# SAFE RFC follow-up — recipient-side audit

**Audited:** 21 September 2026  
**Scope:** local draft only; no mailbox, recipient, or public artifact was changed.

## Evidence checked

- The pinned Hugging Face note resolves at commit `c6021da678f886bf3c4eeb74a8b096661a03dfc0`, is **4,529 bytes**, and hashes to `2a61e0457b1637ccef5be67aaa652669715ce974df6427512e9a0899f8c074e4`.
- The note calls itself an **unsigned discussion contribution** and says it elaborates SAFE's existing verification-method requirement without requesting adoption or endorsement.
- Mike's invitation stated that RFC feedback was accepted **through 21 September**. His later reply introduced Stephano as the working-group/RFC contact; it did not establish that Stephano had already accepted or advanced CSOAI's note.

## Required recipient-facing fixes

| Draft line | Finding | Replace with |
|---|---|---|
| 11 | “thank you for taking the technical contribution forward” attributes an action that the thread does not establish. | “Stephano, thank you for being included in the discussion.” |
| 13 | “As CSOAI scales” and “alongside the live service” are vague and unnecessary. They can read as promotional rather than explaining the linked copy. | “For this contribution, we have published a version-pinned public copy of the note. It is provided for discussion and does not replace the Alliance's normal repository, governance process or authoritative record.” |
| 22 | The request omits the note's **input domain** and adds “aggregation or coverage consistency” and “admission policy,” which are not needed for this SAFE contribution. | “For a claimed defensive outcome, the record should identify the check, its version, relevant configuration and input domain, together with evidence that the same check and applicable configuration distinguish a relevant failure from an acceptable case. That evidence should retain expected and observed outcomes and an accessible evidence reference. Verifying a signature, reproducing an outcome, and establishing the completeness, independence or accuracy of inputs remain separate questions.” |
| 28 | Asking recipients to confirm whether the email can be routed makes the message sound procedurally uncertain. The email itself should stand as the dated contribution. | “If the feedback window has already closed, please treat this as a dated contribution for the next appropriate discussion rather than a request to reopen it. For any follow-on discussion, I would be grateful for a pointer to the group's preferred forum.” |

## Verified wording that should remain

- The public link, exact SHA-256, byte count, and “unsigned discussion note” label are accurate.
- The no-endorsement / no-adoption boundary is accurate and professionally framed.
- The discussion of unavailable, restricted, unresolved, contradictory, and stochastic evidence follows the pinned note.
- No GitHub suspension or posting problem is mentioned. Keep it that way.

## Send-time gate

The agreement-signature sentence remains dependent on Nicholas's statement being true at send time. Local records conflict about whether a comparable reply was previously sent, so the live Sent thread must be checked immediately before any send to avoid a duplicate. This audit does not establish delivery, routing, acceptance, or adoption.

**Verdict:** Apply the four replacements above; then the draft is recipient-ready, subject to the live Sent-thread, recipient/body, link/digest, agreement-status, and explicit-send-confirmation checks.
