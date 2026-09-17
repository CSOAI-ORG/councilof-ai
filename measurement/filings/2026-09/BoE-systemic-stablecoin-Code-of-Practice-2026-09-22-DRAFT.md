# DRAFT — not submitted

Supersedes `BoE-systemic-stablecoin-draft-Code-of-Practice-DRAFT.md` (the 14 Sep Q4-only
stub, marked "LOW RELEVANCE"). That stub is superseded because the draft Code of Practice
itself — which the stub did not read — contains rule text we can comment on directly under
Q1, Q2 and Q3. Do not file both.

## Verified docket

| Field | Value |
|---|---|
| Regulator | Bank of England — FMI Directorate, Payments Policy Team |
| Exact title | **Sterling-denominated systemic stablecoins** — policy statement and consultation on the draft Code of Practice. The consulted instrument is **"The Bank of England Systemic Stablecoin Issuer Code of Practice"** (draft, 38 pages, Appendix 4 of the publication). |
| Reference | The Bank gives this publication **no CP/PS number**. It is cited by title and date: policy statement and consultation, published **22 June 2026**. There is no "CP26/xx" on the page or in the PDF. The only quotable identifier besides the title is the email alias the Bank set up for it, `CP-systemicstablecoin@bankofengland.co.uk`. |
| Official URL | https://www.bankofengland.co.uk/paper/2026/ps/sterling-denominated-systemic-stablecoin |
| Draft Code (PDF) | https://www.bankofengland.co.uk/-/media/boe/files/paper/2026/draft-code-of-practice-for-sterling-denominated-stablecoin-issuer.pdf |
| Closing date (verified at source) | **22 September 2026 — CONFIRMED, not moved, not closed.** Section 4 of the publication, verbatim: "The consultation period for this publication closes on 22 September 2026." Retrieved by anonymous GET 2026-09-17, HTTP 200, 758,178 bytes, body non-empty, no redirect. |
| Submission route (verified) | Section 4 gives three routes, verbatim: (a) **web form** — https://app.keysurvey.co.uk/f/41845750/3a2f/ (anonymous GET 200, 612,377 bytes); (b) **email `CP-systemicstablecoin@bankofengland.co.uk`**; (c) **post** — FMID Payments Policy Team, Bank of England, 20 Moorgate, London, EC2R 6DA. |
| Consent-to-publish | Section 4: "please tell us whether or not you consent to the Bank publishing your name, and/or the name of your organisation". The draft below states consent. Change it if the owner prefers not. |
| Questions | Q1–Q5, published at §3.2 of the publication. Full text in the next table. The Bank states: "The Bank welcomes responses to any questions but does not expect respondents to provide an answer to every question." |
| Owner step | Nick: (1) proofread the plain-text body; (2) re-check the evidence `content_id` is unchanged; (3) send by email to `CP-systemicstablecoin@bankofengland.co.uk` **on or before 22 September 2026**, or paste into the web form; (4) do not also file the superseded stub. |
| Work order | #045 (re-opened and completed) |

### The paper's actual questions (verbatim, §3.2)

| Q | Text | Our answer |
|---|---|---|
| Q1 | "Do you have any feedback on whether the proposed rules in the draft Code of Practice appropriately reflect and give effect to the policy set out in this paper?" | **Suggestions 1 and 2** |
| Q2 | "Do you have any comments on how the way the proposed rules give effect to the policy set out in this paper impact financial stability and commercial considerations (including business model viability)?" | **Suggestion 1** (second half — the cross-issuer signal) |
| Q3 | "Do you have any comments on any operational constraints associated with implementing our proposed rules?" | **Suggestion 2** (burden note) |
| Q4 | "Do you have any other comments or feedback on our proposed rules?" | **Suggestion 3** + the datapoint |
| Q5 | Equality Act 2010 / protected characteristics. | No response — we hold no evidence. |

### What changed since our planning note (read before quoting anything)

Two things in the owner's brief are out of date, because the June 2026 publication moved them:

- The **60/40 split is gone.** The Bank revised it to **70/30** — 70% short-term UK government
  debt securities (residual maturity up to 6 months), 30% unremunerated Bank of England
  deposits. Verbatim: "We have adjusted our position to settle on bringing the central bank
  deposit requirement down to 30%". The draft Code defines "central bank money minimum" as
  "an amount of central bank money at least equal in value to 30% of the systemic stablecoin
  product total."
- The **individual holding cap is gone.** Verbatim: "we will not implement per-coin holding
  limits for individuals and businesses, recognising the significant operational challenges".
  It is replaced by a **temporary issuance guardrail** at the product level: Annex G, 1.1 —
  "A systemic issuer must not issue systemic stablecoins in a systemic stablecoin product
  where the relevant systemic stablecoin product total exceeds £40 billion."

Neither is quoted in the response body, but do not let a proofreader reinstate "60/40" or
"holding cap" from memory.

---

## Response body — paste from here (plain text, no formatting)

**To:** CP-systemicstablecoin@bankofengland.co.uk

**Subject:** Response to the consultation on the draft Systemic Stablecoin Issuer Code of Practice (closes 22 September 2026) — CSOAI Ltd

```
Response to the consultation on the draft Bank of England Systemic Stablecoin Issuer
Code of Practice

Respondent: CSOAI Ltd, registered in England and Wales, Companies House 16939677,
3rd Floor, 86-90 Paul Street, London EC2A 4NE. Contact: nicholas@csoai.org.
We consent to the Bank publishing our name and the name of our organisation.

Who we are, and what we are not. CSOAI is an independent measurement body. We publish
rule-graded facts about public disclosures at https://councilof.ai. We measure; we do not
certify. We issue no marks, ratings or scores for any institution, we give no advice, and we
have no commercial relationship with any stablecoin issuer, with the Bank, or with the FCA.
We hold no position, of any kind, in any digital asset. Nothing below is a comment on any
named firm.

An AI assistant helped draft this response. A person at CSOAI reviewed it before sending,
read the draft Code of Practice in full, and checked every quotation and every figure against
its published source.

We answer Q1, Q2, Q3 and Q4. We make no response to Q5.

We have three suggestions. All three are narrow, all three are about the same thing - making
sure that when something does not happen, the Bank can tell why it did not happen - and none
of them changes the calibration of any requirement in the draft Code.


Suggestion 1 (Q1 and Q2): in Safeguarding 3.22, separate "unable to" from "materially
fails to".

Safeguarding 3.22 requires a systemic issuer to "notify the Bank in writing without delay"
if, among other things:

  "(2) it is unable to, or materially fails to, carry out an internal safeguarding
   reconciliation in accordance with 3.6;
   (3) it is unable to, or materially fails to, conduct an external safeguarding
   reconciliation in accordance with 3.11;
   (4) it is unable to, or materially fails to, identify and resolve discrepancies following
   an internal or external safeguarding reconciliation or otherwise".

Each of those limbs carries two different facts under one notification, and the rule does not
require the issuer to say which one applies.

The two facts are not alike. "Materially fails to" describes an issuer that had what it needed
and did not do the work: a control failure inside the firm. "Unable to" describes an issuer
that could not do the work because an input did not arrive. For the external reconciliation
that distinction is structural rather than hypothetical, because 3.11 makes the issuer compare
its own balances against "the statement or other form of confirmation issued by the third
party with whom that account is held". If the custodian or bank does not issue that statement,
the issuer is unable to perform the comparison however well run it is. The draft Code reinforces
the point at 3.7, which forbids substituting third-party records for internal ones in the
internal reconciliation: the dependency on an outside party is deliberately confined to 3.11,
and 3.22(3) is where a failure of that dependency surfaces.

We suggest that a notification under 3.22(2) to (4) be required to state which limb is engaged,
and that where it is "unable to", the notification identify the input that was missing and the
third party that was to have supplied it. This asks for nothing the issuer does not already
know at the moment it makes the notification.

On Q2 and financial stability. The reason we think this is worth the two extra lines is that
the aggregate signal, not the single notification, is the one that matters. Several systemic
issuers may depend on the same custodian, the same settlement bank or the same confirmation
process. If one issuer's notification is indistinguishable in kind from another's, a run of
"unable to" notifications arriving from different issuers in the same week reads as a
coincidence of unrelated control failures rather than as one shared operational dependency
under strain. Distinguishing the limb and naming the missing input is what lets the Bank see
a concentration. It costs an issuer nothing, because a firm in that position is not being
asked to assess anything - only to report which of two things happened to it.

A smaller, related point on the record schema. Safeguarding 3.17 requires records "for each
internal safeguarding reconciliation and external safeguarding reconciliation", listing the
time and date, the actions taken, the outcome of the calculations, and "whether any
discrepancies were identified and, if so, what actions were taken". Every item presupposes
that the reconciliation happened. A reconciliation that was due under 3.5 or 3.9 and did not
take place produces no record at all under 3.17, so the record series shows a gap that looks
the same as a gap caused by anything else. We suggest 3.17 also require a record where a
scheduled reconciliation did not occur, stating which limb of 3.22 applied.

We note that the same "either/or" construction appears elsewhere in the draft Code and is
harmless there, because the required response is identical whichever limb applies: Capital and
Reserves 8.1 ("it does not comply ... or ... it is reasonably likely that it will not comply")
leads to the same credible plan under 8.2, and Temporary Issuance Guardrail 1.2 ("exceeds, or
is reasonably expected to exceed, £40 billion") leads to the same notification and plan under
1.2(1) and (2). Our point is specific to 3.22, where the two limbs point at different causes,
in different organisations, calling for different supervisory follow-up.


Suggestion 2 (Q1 and Q3): require the superseded version of a modified record to be retained.

Safeguarding 3.23 provides that an issuer "must retain any record made under this Part for a
period of five years starting from the later of: (1) the date it was created; or (2) if it has
been modified since the date it was created, the date it was most recently modified."
Temporary Issuance Guardrail 2.2 is drafted identically.

As written, this preserves the current state of a record for five years and restarts the clock
whenever the record changes. It does not require the pre-modification state to survive. A
reconciliation record from 3.17, or a guardrail record from 2.1, can therefore be amended and
the earlier version need not exist anywhere. Since the purpose of these records is to let the
issuer, an administrator or the Bank reconstruct what was known and when, the version that was
relied on at the time is the one most likely to be wanted.

We suggest adding, to 3.23 and to Guardrail 2.2, that where a record is modified the superseded
version is retained for the same period, together with the date of each modification.

On operational constraints (Q3), we think the burden here is genuinely small and should not be
overstated: this is a storage and write-discipline requirement, not a new calculation, a new
system or a new judgement. It requires no new data to be gathered. In our own published
measurement files we record an as-of timestamp and a content hash for each run so that a later
change to the file is detectable without keeping every copy; a content hash is one low-cost way
to satisfy a requirement of this kind, though the Bank may well prefer a simpler versioning
rule, and we express no view on which mechanism is right.


Suggestion 3 (Q4): make the disclosure gap the Bank has reserved the power to close an
observable one.

Section 3.1.2 of the publication states that "The Bank intends, as a primary measure, to rely
on FCA's proposed disclosure requirements for stablecoin issuers recognised as systemic under
the Bank's part of the regime", and that "if and where necessary to address gaps that the Bank
determines require additional disclosures, the Bank will apply its own supplementary disclosure
requirements to systemic issuers." The publication also records that under the FCA's proposals
"certain core information, such as backing assets, must be updated every three months."

That reserved power depends on the Bank being able to determine that a gap exists. A gap in a
public disclosure is only determinable if the disclosure can be located at a stable address,
carries a date, and can be compared against its own earlier state. If the disclosure moves, is
undated, or is silently edited, the difference between "this issuer disclosed nothing" and "we
could not find what this issuer disclosed" disappears - and those are not the same finding.

We suggest that, when the Bank comes to set any supplementary requirement, it consider
requiring for each systemic issuer: a stable published location for backing-asset disclosures;
an explicit as-of date on each disclosure; and some means by which a reader can tell whether a
published disclosure was later changed, such as retained prior versions or a published content
hash. We make no suggestion about what the disclosure should contain. This is only about
whether the Bank's own future assessment will have something checkable to look at.


One datapoint from our published evidence, with its limits.

We offer one measurement, and we set out plainly what it does not show.

On 7 September 2026 we ran a rule-graded check on 16 stablecoin and tokenised-asset issuer
accounts on a public ledger (the XRP Ledger). None is a sterling-denominated systemic
stablecoin; none is recognised or regulated under the regime this consultation concerns. The
single question asked of each was narrow: is third-party reserve-attestation language present
on the issuer's own public page? The published result is at

  https://councilof.ai/interop/financial-measure-run-reserve-attestation.json

with as_of 2026-09-07T11:30:35Z and content_id
be700eb070cd3cd5d49019d0f74cd3461ae2c6fe4341b862a046b497b07fa6b7. The tally over the 16:

  PASS 3         - attestation language found on a retrieved page
  FAIL 4         - page retrieved, no attestation language present
  UNCHECKABLE 9  - no issuer-declared page could be located or retrieved

Our grading rule is that an unreachable page is UNCHECKABLE and is never counted as FAIL. That
rule is the reason we raise Suggestion 1 at all: we found in our own work that collapsing
"we could not look" into "we looked and it was absent" destroys the only signal that tells you
whether the problem is at the subject or at the observer.

The limits of this datapoint are as follows, and they are severe. It is a fact about language
on a web page and nothing more. It is not a finding about reserve adequacy, backing-asset
quality, solvency or compliance; the published file records risk_verdict UNMEASURED, because we
have not measured risk. Sixteen accounts is a small set and was not sampled to be
representative, and the sixteen accounts belong to only ten distinct issuers, so they are not
sixteen independent observations: one issuer accounts for four of the nine UNCHECKABLE, and
two of the four FAIL results are the same page, which is hosted by a party other than the
issuer. It concerns no UK issuer and no issuer within the Bank's remit, and a recognised
systemic issuer under this regime would be subject to requirements none of these instruments
face. We offer it for one reason only: in a small, real set, more than half could not be
checked from public sources at all, and that is the condition Suggestion 3 is about.


Q5 (Equality Act 2010). No response. We hold no evidence bearing on impacts on persons who
share protected characteristics, and we do not wish to speculate.


We would be glad to answer any question about the measurement cited above in writing.

CSOAI Ltd
nicholas@csoai.org
https://councilof.ai
```

---

## URL check — anonymous GET, 2026-09-17

Every URL appearing in the body above, fetched with `curl -sS -L -X GET`, no cookies, no
session, no authentication:

| URL | Status | Bytes | Content-Type | Redirect |
|---|---|---|---|---|
| https://councilof.ai/interop/financial-measure-run-reserve-attestation.json | **200** | 6,606 | application/json | none |
| https://councilof.ai | **200** | 258,765 | text/html | none |

URLs used to verify the docket but **not** cited in the body:

| URL | Status | Bytes | Content-Type |
|---|---|---|---|
| https://www.bankofengland.co.uk/paper/2026/ps/sterling-denominated-systemic-stablecoin | **200** | 758,178 | text/html |
| https://www.bankofengland.co.uk/-/media/boe/files/paper/2026/draft-code-of-practice-for-sterling-denominated-stablecoin-issuer.pdf | **200** | 476,023 | application/pdf |
| https://app.keysurvey.co.uk/f/41845750/3a2f/ | **200** | 612,377 | text/html |

No github.com URL appears anywhere in this filing.

## Internal notes (do not paste)

- Evidence re-fetched live 2026-09-17. `tally` = `{"PASS": 3, "FAIL": 4, "UNCHECKABLE": 9}`,
  `n` = 16, `status` = MEASURED, `risk_verdict` = UNMEASURED, `as_of` = 2026-09-07T11:30:35Z,
  `content_id` = be700eb070cd3cd5d49019d0f74cd3461ae2c6fe4341b862a046b497b07fa6b7. Arithmetic
  re-derived from the `measured` array, not copied from `tally`: 3 + 4 + 9 = 16 = len(measured).
  sha256 of the served bytes on 2026-09-17 was
  d70d5288e5513d3a47b6e908ca2c24430c450b44c042ed437b9df52889388bd9 — that is the byte hash,
  not the `content_id`, and is recorded here only so a later drift is detectable. Do not paste it.
- The concentration limits in the body were derived from the `measured` array on 2026-09-17 and
  are exact, not estimates: 16 accounts / 10 distinct issuers (Ripple, Ondo Finance, Braza Bank,
  Societe Generale-FORGE, Bitstamp, GateHub, Circle, Quantoz, Schuman Financial, Republic of
  Palau); GateHub contributes 4 of the 9 UNCHECKABLE; the 2 Braza Bank FAILs share one
  `page_sha256` on a domain belonging to another party. An earlier drafting of this line said
  "five of the sixteen" resolve to a third party's page - that was wrong, the true figure is
  two, and it was corrected before this file was committed. Re-derive from the array if the
  evidence file is ever regenerated; do not carry any of these figures forward on trust.
- Every quotation in the body was taken from text extracted from the 38-page draft Code PDF and
  from the publication page, not from a summary. Quoted provisions: Safeguarding 3.5, 3.7, 3.9,
  3.11, 3.17, 3.22, 3.23; Capital and Reserves 8.1, 8.2; Temporary Issuance Guardrail 1.2, 2.1,
  2.2; publication §3.1.2, §3.2, §4.
- No prices, no revenue, no funding claim, no traction claim.
- No regulator is described as endorsing, reviewing or working with CSOAI.
- No meeting, call or demonstration is offered. Written follow-up only.
- No named Bank official is quoted or addressed.
- No card-corpus counts are used, and no GSPC board totals are used.
- The only currency figure in the response body is "£40 billion", inside a verbatim quotation of
  the Bank's own Temporary Issuance Guardrail 1.2. It is a regulatory threshold in the consulted
  text, not a price, a fee or any figure of ours. The body states no price and no fee, and makes
  no revenue or funding claim of any kind.
- The 30% / 70% backing split is recorded in the internal sections above only, so that a
  proofreader does not reinstate the superseded 60/40 split or the abandoned individual holding
  cap from memory. Neither appears in the response body.
