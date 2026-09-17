# A verification method should have to show it can return a negative result

**Contribution to the Shared AI Findings Exchange (SAFE) request for comments**
Open Secure AI Alliance, Linux Foundation

CSOAI Ltd (Council of AI), Companies House 16939677, 3rd Floor, 86-90 Paul Street, London EC2A 4NE
17 September 2026 · nicholas@csoai.org · https://councilof.ai

This document is the citable form of our contribution. It is published here because our GitHub
account is presently not visible to logged-out visitors, so an issue filed from it could not be
read or cited by the people it is meant for. That defect is ours and is with GitHub Support under
ticket 4720908.

---

## What this adds that the existing issues do not

Three open issues already cover adjacent instrument failures, and we are not restating them:

- **#4** asks a verification method to declare its fail-open modes and its noise floor. That is the
  case where no real check ran, or where the movement is smaller than the measurement error.
- **#10** asks a method to disclose systematic mislabel classes: a confident, well-formed verdict
  that is reliably wrong on a recognisable class of inputs.
- **#11** asks that preserved evidence carry an integrity property, not merely be retained.

The failure we are reporting is none of those, and it is invisible to all three.

**The check ran. The verdict was well-formed. The verdict was correct. And the result was
worthless, because the item could not have produced any other verdict.**

## The instance

On 14 September 2026 we withdrew 44 of our own signed measurement results.

Every signature verified. Every evidence check passed. The binding between the evaluated model, the
frozen question bank, the grader and the resulting measurement was intact in all four directions.
Nothing in our provenance chain was broken, and nothing in it could have told us anything was
wrong.

The defect was upstream of the method. In one grader configuration, each prompt offered a single
permitted answer. The grader therefore could not mark anything wrong, and all 44 results read an
accuracy of 1. Twenty-six of them had been published as measurements at a sample size of 30.

The instrument was not failing open. It was not systematically mislabelling. It was working exactly
as specified, against items whose answer space made a negative outcome impossible.

Withdrawal ledger: https://councilof.ai/interop/mill-cards-signed/WITHDRAWN.jsonl
Correction C-2026-0914-01, in a public record of 56 entries: https://councilof.ai/api/corrections

## The proposed requirement

**A reproducible verification method should have to declare its discriminating power: evidence that
this method, on this corpus, has actually returned a negative result.**

Concretely, one of the following, stated in the record:

1. **Observed negatives.** The method returned at least one negative verdict on the corpus in
   question, and the record carries the count and the denominator. A method that has returned
   nothing but passes across its whole corpus is reporting an unfalsified claim, not a verified one.
2. **A designed-to-fail control.** A control input constructed to fail was run through the same
   method in the same configuration, and did fail. The record carries the control and its result.

If neither is available, the method's result is reported as **not discriminating**, which is a
distinct state from pass and from fail.

## Why a signature cannot substitute for this

This matters specifically for SAFE because SAFE's value rests on shared evidence being trustworthy
enough to become a control.

A signature proves that particular bytes have not changed since a particular key signed them. It
proves nothing about whether the check behind those bytes could ever have come out differently. Our
44 records are the demonstration: every cryptographic and structural property held, and the content
was empty. Had those records entered a shared exchange, they would have contributed 44 confident
green data points toward controls, and every integrity mechanism in the pipeline would have
endorsed them.

The same argument applies to evidence preservation. Preserving prompts, traces, tool calls, logs,
configurations and versions, as the RFC requires, would have preserved all 44 of these perfectly. A
reader would have had complete evidence of a measurement that measured nothing.

## What we are not asking for

We are not asking SAFE to adopt our implementation, our vocabulary or our corpus. We are not a
member of the alliance and we are not seeking endorsement of anything we publish.

We measure and we never certify. We issue no conformity marks, we do not sell a grade, and
verification of anything we publish is free permanently. We have no product that this requirement
would advantage. We are proposing it because we shipped the failure it prevents, in public, with
our name on it.

## Our own exposure, stated plainly

The instance above is our error, not someone else's. It ran for a period before we caught it, the
26 published measurements were wrong for that period, and we found it ourselves rather than being
told. The withdrawn files remain online, unedited, beside a ledger row naming each one, because we
do not edit a signed record: we supersede or withdraw it and keep both. That record currently holds
953 supersessions and 44 withdrawals.

If the alliance would find a walk through the rows useful, we will provide it, and we would rather
the case be used than the credit.

---

*Figures in this document were read from the live endpoints cited beside them on 17 September 2026.
Each can be re-read at those addresses.*
