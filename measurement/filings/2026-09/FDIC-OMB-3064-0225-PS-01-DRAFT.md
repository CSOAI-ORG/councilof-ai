# DRAFT — not submitted

| Field | Value |
|---|---|
| Regulator | U.S. Federal Deposit Insurance Corporation (FDIC) |
| Ref | **OMB Control No. 3064-0225**, Notice and request for comment: *Reporting Forms and Instructions Associated With Requirements and Standards for FDIC-Supervised Permitted Payment Stablecoin Issuers* (Forms PS-01, PS-01a and quarterly forms). FR Doc. 2026-14589, 91 FR 45274, published 2026-07-20. FDIC FIL-38-2026 (17 Jul 2026). regulations.gov document FDIC-2026-1321-0001. |
| Official URL | https://www.federalregister.gov/documents/2026/07/20/2026-14589/reporting-forms-and-instructions-associated-with-requirements-and-standards-for-fdic-supervised · https://www.fdic.gov/news/financial-institution-letters/2026/genius-act-proposed-reporting-forms-and-instructions-fdic |
| Closing date (verified) | **18 September 2026.** FR text: "DATES: Comments must be submitted on or before September 18, 2026." FR API `comments_close_on: 2026-09-18`, retrieved 2026-09-14T10:35:46Z; FDIC FIL page HTTP 200 at 2026-09-14T10:35:47Z. |
| Submission route | (a) FDIC website https://www.fdic.gov/resources/regulations/federal-register-publications/; (b) email comments@fdic.gov, with **the collection's name and number in the subject line**; (c) mail to Michelle Mire, Senior Attorney, MB-3072, FDIC, 550 17th Street NW, Washington, DC 20429. "All comments should refer to the relevant OMB control number." A copy may also go to the OMB desk officer for the FDIC (OIRA). |
| Owner step | Nick: (1) proofread; (2) confirm §3's evidence URL still returns the same `content_id`; (3) submit via the FDIC site or email **by 18 Sep 2026**; (4) **do not also file** `measurement/draft-fdic-omb-3064-0225-comment-HONEST-2026-09-13.md` or `docs/filings/FDIC-PASTE-2026-09-18.md` (see reconciliation below). |
| Work order | #043 |

## Reconciliation with the existing FDIC drafts (read before filing)

The dispatch named "PS-01/PS-01a, Fri 18 Sep". That matches this docket exactly. The two earlier drafts should **not** be filed as they stand:

1. **Wrong subject.** Both are headed "RIN 3064-AG25: Safekeeping of Digital Assets". Their body comments on "a written custody agreement" for digital assets held by insured banks. OMB 3064-0225 concerns **weekly and quarterly reporting forms for permitted payment stablecoin issuers** and says nothing about custody agreements. Filed under 3064-0225, that text would not answer anything the notice asks. I did not verify whether RIN 3064-AG25 exists as a separate open docket; a Federal Register API query returned nothing, and absence from one query proves nothing.
2. **Unsupported numbers.** "425 stablecoins indexed … across 211 blockchain networks (source: /api/state)": live `/api/state` (read 2026-09-14T10:37Z) contains no field with the value 425, 1,640 or 211. "Public root cards 291" is stale (live `/api/state` → `public_root.card_count` = 298, as_of 2026-09-14T03:12:56Z) and belongs to a different card corpus.
3. **Out-of-bounds claim.** The earlier draft's fact table includes a revenue line. Filings carry no revenue claims.

This draft replaces both for docket 3064-0225.

---

## Comment body (paste from here)

**Subject (email):** Comment — Reporting Forms and Instructions for FDIC-Supervised Permitted Payment Stablecoin Issuers, OMB Control No. 3064-0225

CSOAI Ltd (England and Wales, Companies House 16939677; 3rd Floor, 86-90 Paul Street, London EC2A 4NE; nicholas@csoai.org) is an independent measurement body. We publish rule-graded facts about public disclosures at https://councilof.ai. **Measurement, not certification.** We rate no issuer, give no advice, and comment on no specific institution. We have no commercial relationship with any issuer or with the FDIC. **An AI assistant helped draft this comment. A person at CSOAI reviewed it, and every number is linked to its public source.**

The notice invites comment on "whether items should be modified, removed, or added" to Forms PS-01 and PS-01a, and on "(c) ways to enhance the quality, utility, and clarity of the information to be collected". We offer three narrow suggestions and one datapoint.

**1. Distinguish "zero" from "not available" in reserve-asset items (Schedule C of PS-01 and PS-01a).** A weekly figure left blank, reported as zero, or unobtainable by the issuer that week means three different things. We suggest the instructions require each Schedule C item to be reported as a value or with an explicit "not available" code and a reason. This improves utility without raising reporting burden, because the issuer already knows which case applies.

**2. Record which third-party attestation, if any, the weekly figures reconcile to.** PS-01 is confidential. Issuers also publish reserve information to holders. We suggest a Schedule C memorandum item naming (a) the attesting firm, (b) the as-of date of the most recent third-party reserve report the issuer has published, and (c) an identifier of that report, such as its URL and a content hash. Supervisors could then reconcile confidential weekly figures against the public report without a separate request. A content hash also shows whether the public report was later changed.

**3. Keep a machine-readable, versioned form definition.** If the forms or instructions change, a versioned, machine-readable item dictionary (item identifier, definition, unit, revision date) makes weekly series comparable across revisions. It also supports the notice's point (d) on "automated collection techniques".

**Datapoint: public attestation surfaces vary widely and often cannot be checked.** We ran a rule-graded check on 16 stablecoin and tokenised-asset issuer accounts on a public ledger (XRP Ledger). The question: is third-party reserve-attestation language present on the issuer's own public page? Result, as published in https://councilof.ai/interop/financial-measure-run-reserve-attestation.json (`as_of` 2026-09-07T11:30:35Z, `content_id` be700eb070cd3cd5d49019d0f74cd3461ae2c6fe4341b862a046b497b07fa6b7):

- **PASS 3**: attestation language found
- **FAIL 4**: page reachable, no attestation language
- **UNCHECKABLE 9**: no issuer-declared page could be located or reached; never counted as FAIL

This is a narrow fact about **language on a web page**. It is not a finding about reserve adequacy, which we do not measure (the file records `"risk_verdict": "UNMEASURED"`). It concerns no FDIC-supervised issuer in particular, and PPSIs under the proposed rule may differ. We offer it because more than half of this small set could not be checked from public sources at all. That is some support for suggestion 2: a supervisor-side pointer to the specific attestation relied on.

— CSOAI Ltd, nicholas@csoai.org

---

## Internal notes (do not paste)

- Every number in the body is from one file (`tally`, `n`, `as_of`, `content_id`), re-read 2026-09-14T10:37:48Z.
- Instrument names are deliberately omitted, so this is not a comment on any specific issuer.
- No named-official quotes are used. No card-corpus counts are used.
