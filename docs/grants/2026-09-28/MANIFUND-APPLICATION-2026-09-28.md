# Manifund public proposal: DRAFT, NOT SUBMITTED

Status: HELD. Owner asks: (1) create the Manifund account as Nicholas Templeman / CSOAI Ltd; (2) rewrite every section below in your own voice; (3) confirm or change the two budget figures; (4) fill the one field marked OWNER; (5) publish the project page yourself. Nothing here has been posted.

Lane: grants-20260928. Every figure below was read from a live endpoint on 2026-09-28 between 13:07Z and 13:45Z. Before publishing, re-read each endpoint and replace any figure that has moved. Never add the three card corpora together.

Why Manifund: anyone can create a public proposal. Manifund's donor FAQ lists, among the services donors use it for, "Fiscal sponsorship, for non-501c3 entities, including individuals, for-profits, and international organizations", described as a lightweight sponsorship "where we remit funds after reviewing" the proposal (manifund.org/about/donor-faq). CSOAI Ltd is a for-profit UK company, so the grant would go through that route and Manifund's due diligence. Its donor FAQ says "We typically ask donors to cover a 5% ops & fiscal sponsorship fee on donations."

---

## Form fields

- **Title:** Independent, recomputable measurements of AI model behaviour: settle the untested axes and add a second verifier
- **Subtitle:** Signed, offline-checkable measurement records that anyone can recompute. We measure what models do; we issue no marks or labels.
- **Cause areas:** Technical AI safety; AI governance
- **Location:** United Kingdom (CSOAI Ltd, Companies House 16939677)
- **Minimum funding:** USD 6,000 (owner confirms)
- **Funding goal:** USD 36,000 (owner confirms)
- **Decision deadline:** 2026-12-31 (owner confirms)

---

## Project summary

Council of AI (councilof.ai) publishes measurements of what AI models and agent tools actually do, as records that a reader can check without trusting us. Each record is signed with Ed25519, the signing key is published at a did:web identity, and a verifier script ships with the data. We measure; we issue no marks of conformity, no pass/fail labels and no league tables, and verification is free.

The public board today reads **"23 axis · 23 measured"**, and it carries its own caveat, which we quote with it: **"0 of 14 model-comparison axes separated a leader · 8 TIE · 6 UNTESTED"** (GET https://councilof.ai/api/gspc, field totals). Six of the fourteen behavioural axes have never had a separation test. Without one, a reader cannot tell whether a point-estimate lead on those axes is a measured difference or noise.

This project funds the work that turns those six UNTESTED axes into a determination (SEPARATED or TIE, whichever the data says), re-runs the behavioural axes on current frontier models, and builds a second, independent verifier so the signed records are no longer checked only by code we wrote.

## What are this project's goals? How will you achieve them?

**Goal 1: settle the six UNTESTED axes.** For each, publish the paired test (McNemar where the design is paired), the per-item rows, the Wilson interval and the resulting state. TIE stays TIE; UNTESTED is never folded into TIE. Done when GET /api/gspc shows 14 of 14 model-comparison axes with a published separation determination, each linked to its rows.

**Goal 2: re-run the behavioural axes on the current frontier fleet.** Same frozen banks, same deterministic grader, new models, results published as signed records under a new date. Done when each re-run has its rows and a signed record, and any axis whose state changed carries a dated entry in the public corrections ledger.

**Goal 3: a second, independent verifier.** A clean-room implementation, in a second language, of the published verification rule (canonical JSON, Ed25519 over the raw bytes, key resolved from the did:web document). Done when both verifiers agree on every record in the signed card index, and any disagreement is published as a finding rather than patched quietly.

**Goal 4: an outside review of the signing and verification path.** A reviewer with no stake in the result reads the signing code, the key handling and the verification rule, and the review is published in full, including anything it finds.

## How will this funding be used?

Indicative split of the USD 36,000 goal (owner confirms every line):

| Line | Amount | What it buys |
|---|---|---|
| Model access for the re-runs | USD 6,000 | API usage to run the frozen banks on current frontier models (Goal 2), with the per-item rows kept |
| Separation tests and publication | USD 8,000 | maintainer time for Goal 1: tests, rows, signed records, corrections entries |
| Second verifier | USD 10,000 | a contracted implementer who has not seen our verifier code (Goal 3) |
| External review | USD 12,000 | an independent reviewer for Goal 4, report published unedited |

At the USD 6,000 minimum we deliver Goal 1 only: the six separation determinations, published with their rows.

## Who is on your team? What's your track record on similar projects?

OWNER: write this section in your own words (role, background, who else works on the project).

Track record the reader can check today, each figure read from a live endpoint on 2026-09-28:

- **Signed card index:** 335 signed cards, all 335 verify (GET https://councilof.ai/api/state, field card_chain.bodies_verified_valid, kind "measured"). Verifier: https://councilof.ai/signed/verify-card.mjs. Guide: https://councilof.ai/signed/HOW-TO-VERIFY.md.
- **Public Merkle root:** 310 leaves, as_of 2026-09-28T07:32:07Z, root c2ab6d59… (https://councilof.ai/root.json). This is a separate corpus from the signed card index, with zero overlap. The two counts are never added.
- **Corrections ledger:** 78 dated public corrections, with a signature that checks as VALID (GET https://councilof.ai/api/corrections). The same ledger states that time-to-correct is unmeasured for most entries. That gap is part of the record, and closing it is future work.
- **Methodology record:** DOI 10.5281/zenodo.21991104.
- **Open data:** 127 open datasets on Hugging Face under https://huggingface.co/csoai (read via GET https://councilof.ai/api/momentum).
- **Standards drafts:** two individual Internet-Drafts at the IETF, draft-templeman-scitt-framing-space and draft-templeman-scitt-measurement-capsule (https://datatracker.ietf.org). Individual drafts carry no IETF standing.

How the work is done: much of the engineering runs through AI coding agents under the founder's direction. Every public number is read from a live endpoint and carries its source, so a reader can re-check it.

## What happens if the project does not succeed?

- **The separation tests may all come back TIE.** That is still a result. The board would then say, with evidence, that on these banks no model separated from the rest. We would publish that exactly as found.
- **The second verifier may disagree with the first.** Each disagreement is either a defect in our records or an ambiguity in our published rule. Either way it goes into the corrections ledger with a date, and the rule is tightened.
- **The external review may find defects in the signing path.** They are published with the review and corrected under the same ledger.
- **Frontier model access may be refused or rate-limited.** We would re-run on the models we can reach, and state the missing ones as UNMEASURED rather than estimating them.

The main risk is under-delivery on Goal 2 if API usage per bank runs above the estimate. The minimum-funding tier is scoped to Goal 1 so that it completes regardless.

## How much money have you raised in the last 12 months, and from where?

OWNER: state the true figure and its sources. On file, not a raise: one application under assessment (DSIT AI Growth Lab, reference AGLLS\140, submitted 2026-08-18, no decision yet).

---

## Owner checklist before publishing

1. Re-read GET /api/gspc, /api/state, /root.json, /api/corrections and /api/momentum, and replace any figure that has moved.
2. Rewrite in your own voice. The section headings above paraphrase Manifund's template, so use the headings the form shows you.
3. Confirm the two budget figures and the decision deadline.
4. Run the outward gate on the final text (lane grants-20260928, docs/grants/2026-09-28/gate_drafts.py) and publish only at 100%.
