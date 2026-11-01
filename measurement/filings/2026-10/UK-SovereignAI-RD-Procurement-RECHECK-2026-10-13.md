# Re-read, 13 Oct 2026: UK Sovereign AI R&D Procurement Scheme (Challenge 4)

This note replaces the facts in [the 14 Sep prep notes](../2026-09/UK-SovereignAI-RD-Procurement-EOI-DRAFT.md). Those notes are listed by digest in two timestamped indexes, so they are left as they are. Nothing was submitted. No form was filled in.

Not legal advice. Listing a scheme here is not a statement that CSOAI will apply to it.

## What it is

- A procurement competition for an R&D services contract. It is not a consultation and it is not a grant. The guidance says: "This Scheme is a competitive procurement mechanism."
- Run by the Sovereign AI Fund. The scheme privacy notice names the Department for Business, Innovation, Science and Trade (BIST) as data controller and DSIT as the former one. The form still gives a dsit.gov.uk contact address. The NCSC is the challenge owner for Challenge 4 only.
- Two steps before any decision. Step 1 is an Expression of Interest (EOI) form, to join the Approved Supplier List. Step 2 is a Full Application on Flexigrant, by invitation after approval.

## Dates, as printed in the guidance the site links today

| Batch | Opens | Proposal due | Outcome |
|---|---|---|---|
| 1 | 15 September 2026 | 16 October 2026 | 13 November 2026 |
| 2 | 14 November 2026 | 31 December 2026 | 29 January 2027 |
| 3 | 30 January 2027 | 26 February 2027 | 31 March 2027 |

No hour is printed for any date. The EOI has no closing date. The guidance asks for it "at least two weeks before" a deadline and aims to answer "within two weeks of submission".

## Sources read on 13 Oct 2026 (UTC)

| Source | Read | Result |
|---|---|---|
| `https://www.sovereignai.gov.uk/compute-strategic-assets` | 08:08:43Z | 200, redirected to `/offer-beyond-investment` |
| Guidance PDF linked from that page today (`…6a91bbc9a127f0cbf855eab5_88997fa6…_Competition Guidance SovAI Procurement .pdf`) | 08:09:08Z, and again from a second machine at 08:16:16Z | 200, 11 pages, created 20 Sep 2026, sha256 `3085f011a7ca6aa3…` both times |
| Guidance PDF at the address the 14 Sep notes and the calendar cited | 08:08:44Z | 200, 10 pages, created 28 Aug 2026, sha256 `d06481138bc8c040…`. Still served, no longer linked from the page |
| EOI form "Sovereign AI Schemes Application" (definition only, read-only) | 08:09:47Z | 200, 34 questions, last modified 2026-10-12T15:15:44Z |
| Scheme privacy notice PDF | 08:13Z | 200 |
| gov.uk press release, published 31 August 2026 | 08:08:44Z | 200 |
| Find a Tender notice 035079-2026 | 08:08:44Z | 403 again. **Not read** |

## What changed since the 14 Sep notes

| 14 Sep notes | 13 Oct reading |
|---|---|
| Official page `/compute-strategic-assets` | Redirects to `/offer-beyond-investment` |
| Guidance PDF address | A different file is linked now. The old address still answers with the old file, so a re-read of the stored link alone looks fresh and is not |
| "Once you are an Approved Supplier, you can submit your Full Application at any time" | Now "in line with the Competition Dates". Each batch has an opening date |
| Eligibility list | One line added: "The lead applicant must carry out at least 50% of the work." |
| "The EOI checks five things" | Seven in the current guidance. Added: which challenge you intend to address, and a confirmation that no more than 50% of the work can be subcontracted |
| "The form's questions were not visible" | Read. The procurement path asks for: legal entity, organisation type, overseas parent, company number, headcount, address, what the organisation does (700 characters), applicant name and email, the challenge, the focus area, a focus-area explanation with UK impact (1,500 characters), then yes/no confirmations and declarations |
| Focus area "5. AI Trust, Safety & Assurance" | The guidance still prints that name. The form prints "5. AI Trust, Integrity & Assurance" |
| "EOI by about 2 Oct for Batch 1" (derived) | That day has passed. This lane found no record that an EOI was filed. The mailbox was not read: UNVERIFIED |
| The gov.uk article's "up to £5 million" | Not found on today's page. The guidance figures stand: minimum £250,000, maximum £10 million per project |
| Board: "22 axis · 22 measured", "2 of 14 … both TIE, 12 UNTESTED" | Stale. Read `totals.public_count` and `totals.separation_public_count` at `/api/gspc` on the day |
| Corrections record: 49 entries | Stale. Read the length of `corrections` at `/api/corrections` on the day |
| Methodology DOI 10.5281/zenodo.21991104 | `/api/gspc` reports `doi_status: UNAVAILABLE` since 29 Sep 2026. Do not cite it. Cite `https://councilof.ai/methodology/` |
| Signed card index: 335, all verifying | Same. `node verify-card.mjs --all` printed `VALID 335 · INVALID 0 · UNCHECKABLE 0` at 08:16:16Z |
| CSOAI Ltd, Companies House 16939677, registered office | Same on the Companies House register at 08:10:31Z (it adds "England" to the address) |

## Still true from the 14 Sep notes

- The "do not claim" list. No customers, revenue, partnerships or adoption are claimed. We measure; we do not issue marks.
- The board does not measure deployed agents in an operational setting. One axis added on 22 Sep 2026 probes tool-call servers at the boundary; its own note says it is not a security claim about any vendor.
- Whether to apply at all is the owner's decision. The yes/no confirmations and declarations on the form are the owner's own statements.
