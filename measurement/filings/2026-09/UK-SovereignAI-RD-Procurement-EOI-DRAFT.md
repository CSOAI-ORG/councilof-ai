# DRAFT — not submitted · prep notes for an Expression of Interest (no form was opened or submitted)

| Field | Value |
|---|---|
| Body | UK Sovereign AI Fund. The scheme privacy notice names the Department for Business, Innovation, Science and Trade (BIST) as data controller. The gov.uk announcement lists HM Treasury and Cabinet Office. |
| Ref | **Sovereign AI R&D Procurement Scheme**: Stage 1 Expression of Interest (Approved Supplier List) → Stage 2 Full Application (Flexigrant) → Stage 3 decision |
| Official URL | https://www.sovereignai.gov.uk/compute-strategic-assets · Competition Guidance PDF https://cdn.prod.website-files.com/699b76e1c0f6def91adc6c77/6a91bbc9a127f0cbf855eab5_Competition%20Guidance%20SovAI%20Procurement%20.pdf · gov.uk news (31 Aug 2026) https://www.gov.uk/government/news/100-million-competition-to-back-british-ai-companies-to-fix-public-services |
| Dates (verified) | EOI is **rolling**: "Companies may apply to join the Approved Supplier List at any time… should submit their EOI at least two weeks before the any competition deadline they are intending to apply to." Competition batches: **"Batch 1: Submit your proposal by 16 October 2026 to receive an outcome on 13 November 2026."** Batch 2: 31 Dec 2026. Batch 3: 26 Feb 2027. For Batch 1 the EOI therefore needs to land by about **2 October 2026**, a date *derived* from the two-week rule, not printed. Guidance PDF retrieved 2026-09-14T10:37:43Z; site page HTTP 200 at 10:35:49Z. |
| Submission route | Microsoft Forms EOI linked as "Apply now" on https://www.sovereignai.gov.uk/compute-strategic-assets (forms.cloud.microsoft …ResponsePage.aspx?id=BXCsy8EC60O0l-ZJLRst2Ag2K3Ch…). Full application on Flexigrant, by invitation after approval. |
| Owner step | Nick: (1) decide whether to apply at all (this is a procurement bid, not a consultation); (2) open the MS Form yourself; its questions were **not** visible to this lane, so map the notes below onto them; (3) submit by about 2 Oct 2026 to be eligible for Batch 1. |
| Work order | #049 |

**Premise check for the dispatch.**

- The "£100M" figure is right: "Up to £100 million is allocated across the lifetime of the Scheme."
- Calling it an "NCSC £100M scheme" is **wrong**. The scheme is Sovereign AI's. The NCSC is named only as the challenge owner of **Challenge 4: "Enabling safe AI agent adoption"**.
- "MS Forms" is right for the EOI, and "Flexigrant" is right for the full application. "Oct 16 batch" is right.
- "~2 Oct" is consistent with the two-week rule but is not a published date.
- Contract sizes: minimum £250,000, maximum £10 million, "most contracts will be around £1 million to 3 million" (guidance PDF). The gov.uk article's "up to £5 million" is superseded by the guidance.
- The Find a Tender notice 035079-2026 ("Request for Information: Sovereign AI R&D Procurement") returned HTTP 403 to this lane at 2026-09-14T10:35:50Z and was **not read**.
- The separate *Strategic Assets Programme* (grants) closed after its 5 June 2026 window. It is not this scheme.

---

## Stage 1 EOI — what the guidance says is checked, with draft answers

The guidance (§"How to Apply", Stage 1) says the EOI checks five things, assessed pass/fail:

**1. Alignment with a Sovereign AI Focus Area.** Proposed: **5. AI Trust, Safety & Assurance.**
> CSOAI Ltd builds open, reproducible measurement of AI system behaviour: frozen public test banks, deterministic grading (no model grades another), statistical separation testing, and signed result records that a third party can verify. Relevant to Challenge 4 ("an evidence-based, operational, and ideally automated risk management approach for CISOs… for specific agents in specific contexts"): we would research measurement methods that give a CISO per-agent, per-context evidence (what was tested, on which test set, with what uncertainty, and what was *not* tested) rather than a pass/fail badge. Our tooling is published open source, and the Challenge text says "Solutions that support wide-scale adoption, such as those built on open-source frameworks, will be preferred."

**2. UK-registered business.**
> CSOAI Ltd, Companies House 16939677, registered office 3rd Floor, 86-90 Paul Street, London EC2A 4NE.

**3. Project delivered in the UK.**
> Yes. Owner to confirm where staff and compute would sit. Our current measurement runs use cloud GPU providers, so state honestly where compute would be located, and whether UK-hosted compute would be used for the project.

**4. Understanding that this is R&D.**
> Confirmed. The proposal would be research and development of measurement methods for AI agents. It would not be the sale of an existing product.

**5. Initial due diligence.**
> Owner to answer the form's own questions directly. Do not pre-draft.

### Evidence that may be cited (public, verifiable, as read 2026-09-14)

- Live measurement board: https://councilof.ai/api/gspc: "22 axis · 22 measured" (`totals.public_count`); 2 of 14 model-comparison axes have a separation determination (both TIE), 12 UNTESTED (`limitations[0]`).
- Signed card index: https://councilof.ai/signed/card_index.json: 335 signed cards (`n_cards`), all verifying under `did:web:csoai.org#card-attestation-1`.
- Public corrections record: https://councilof.ai/api/corrections: 49 entries (`corrections`).
- Methodology DOI: 10.5281/zenodo.21991104 (`/api/gspc` → `doi`).

### Do not claim (doctrine)

- No customers, revenue, partnerships, adoption or endorsements.
- Nothing is "certified", "assured" or "compliant". Say *measured*, and say *UNMEASURED* where that is the state.
- Do not describe an agent-security capability that has not been built. The board measures model behaviour on frozen banks; it does **not** today measure deployed agents in operational context. A Challenge 4 proposal would be R&D *toward* that, and the form should say so.
- Do not quote the Ministers' statements in the gov.uk article.

---

## Internal notes

- No account was created and no form was opened.
- The AI-assistance disclosure belongs in whatever the form allows, e.g. "AI assistance was used in preparing this submission; all statements were reviewed by the director."
