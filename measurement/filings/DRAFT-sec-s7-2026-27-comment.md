# DRAFT — comment on Regulation Crypto Assets, File No. S7-2026-27

**Status: DRAFT. Not filed. Do not submit without the step named at the end.**
Prepared 17 September 2026. Comments due 20 October 2026.

---

## What we could not read, stated first

We have not read the full proposing release. The SEC-issued PDF and the Federal Register version
were not retrievable by us on 17 September 2026; the Federal Register redirected our request to an
access-control page. This draft is built on the components the Commission publishes on its own
rulemaking page: two offering exemptions, principles-based disclosures, continued application of
the antifraud and antimanipulation provisions, and a conditional safe harbour from the term
investment contract.

**A comment written without reading the release is not a comment we should file.** The action item
at the end says so.

---

## The comment

### Who is commenting

CSOAI Ltd (Council of AI), Companies House 16939677, 3rd Floor, 86-90 Paul Street, London EC2A 4NE,
United Kingdom.

We are an independent measurement body. We publish signed, publicly re-checkable measurements of
how AI models behave. We are not registered with the Commission or with any financial regulator, we
hold no client assets, we operate no venue, we issue no securities and we have no client with an
interest in this rulemaking. We measure and we never certify; verification of anything we publish
is free permanently. We take no position on whether the proposed exemptions should be adopted, on
their dollar thresholds, or on the scope of the safe harbour.

We comment on one narrow question, on which we have direct operating experience and an error of our
own to disclose: **what makes a disclosed claim checkable by someone who trusts neither the party
making it nor the party that evaluated it.**

An AI assistant helped prepare this comment; a person at CSOAI reviewed it. Every figure can be
checked at the address given beside it. We consent to publication of our name and this comment.

### 1. Principles-based disclosure needs a recomputability property, not a format

A disclosure regime that is principles-based rather than prescriptive puts the weight on whether a
reader can test what was disclosed. We suggest the distinction that matters is not how a claim is
formatted but whether a reader can arrive at the same number from published inputs without
contacting the issuer.

In our own domain we implement this as follows, and offer it only as a worked shape. Every
measurement we publish names, by SHA-256, the frozen question set it was produced against and the
grading program that produced it, and publishes the per-item rows. A reader fetches the question
set, recomputes its hash, checks it against the hash in the signed record, recounts the score from
the rows, and either reaches our number or does not. Nothing in that path requires our servers, our
cooperation or our permission.

The general property, stated without reference to our implementation: **a claim is checkable when
the inputs it was computed from are identified by content, not by name, and are retrievable
independently of the party making the claim.** A claim identified by name alone cannot be checked,
because the name can be pointed at different content later.

### 2. A third-party evaluation cited in a disclosure should have to show it could have failed

This is the substance of our comment and it comes from our own failure.

Issuers under a principles-based regime will cite third-party assessments, audits, evaluations and
scores. Those citations will carry weight precisely because they come from someone other than the
issuer.

On 14 September 2026 we withdrew 44 of our own signed measurement results. Every cryptographic
signature verified. Every structural check passed. The identification of inputs described in
section 1 was intact in every one of them. The results were nonetheless worthless: in one grading
configuration each question offered a single permitted answer, so nothing could be marked wrong,
and all 44 reported a perfect score. Twenty-six of them had been published as measurements.

We publish that failure rather than having edited it away. The withdrawn records remain online,
unedited, beside a ledger row naming each one, because we supersede or withdraw a signed record and
never revise it. That record holds 953 supersessions and 44 withdrawals, and our published
correction register holds 56 entries against ourselves.

- Withdrawal ledger: https://councilof.ai/interop/mill-cards-signed/WITHDRAWN.jsonl
- Correction register: https://councilof.ai/api/corrections

The lesson generalises beyond our field. **An evaluation that has never returned a negative result,
and cannot show it was capable of one, provides an investor with no information.** It is not fraud,
nothing in it is false, and every integrity property a reader might test will hold.

We therefore suggest that where a disclosure relies on a third-party evaluation, the useful question
is not whether the evaluator is accredited but whether the evaluation discloses either that it
produced a negative result on the population in question, with the denominator, or that a control
constructed to fail was run and did fail. Absent either, the evaluation is better characterised to
investors as untested than as passed.

### 3. Antifraud reaches false statements; it does not reach empty ones

The proposal retains the antifraud and antimanipulation provisions, which is plainly right. We note
only the gap those provisions do not close, because our own case sits squarely in it.

Nothing we published on 14 September was false. Every statement of fact in those 44 records was
accurate: the model was that model, the questions were those questions, the program was that
program, and the score was correctly computed. A reader applying every test available to them would
have found no misstatement. The records were empty, not untrue.

An investor protection framework that relies on the absence of false statements will not catch this
class, and it will become more common as evaluation of AI systems is increasingly cited in
offerings. We raise it as a gap to be aware of, not as a proposal that the Commission legislate a
solution.

### 4. What we are not asking for

We are not asking the Commission to recognise, accredit or reference CSOAI or any measurement body,
ours included. We do not seek a role in the regime. We do not sell assurance, and a requirement of
the kind described above would not advantage us commercially, because we give our measurements away
and charge nothing to verify them.

We are commenting because we shipped the failure the suggestion prevents, in public, with our name
on it, and we think that experience is worth more to the Commission than an opinion would be.

---

## Before this is filed

1. **Read the full proposing release.** Retrieve the SEC-issued PDF directly and read it. The
   comment must respond to what the Commission actually asked, and must cite the specific requests
   for comment it answers. The Federal Register blocked our automated request; fetch it by hand.
2. **Re-verify every figure at the moment of filing.** The supersession, withdrawal and correction
   counts move. Read them from the live endpoints on the day.
3. **Decide whether to file at all.** A comment from a non-US, non-registered body on a US
   rulemaking is unusual. It is defensible here because we are offering operating experience and
   disclosing our own error rather than advocating an outcome. That remains the owner's judgement.
4. **Submit through the Commission's own comment route**, not by email, and keep the receipt.
