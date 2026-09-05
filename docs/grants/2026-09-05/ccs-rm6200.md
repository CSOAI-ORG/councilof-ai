# CCS/GCA RM6200 Artificial Intelligence DPS — supplier appointment — 2026-09-05

Target: https://www.gca.gov.uk/agreements/RM6200 · Supplier portal: https://supplierregistration.cabinetoffice.gov.uk/dps/RM6200 · Facts: `FACTS-2026-09-05.json`

## Status

| | |
|---|---|
| Open now | **OPEN.** A Dynamic Purchasing System: "Registration is free and there is no limit on the number of suppliers who can join this DPS Marketplace." Start 03/08/22, **end 23/02/29** (portal page; gca.gov.uk says extended from 04/11/2026). Crown Commercial Service became the Government Commercial Agency on 1 April 2026; documents still say CCS. |
| Deadline | none — continuous appointment until 23/02/2029 |
| Lots | one: "Lot 1: Artificial Intelligence (AI)", with **filter categories** instead of lots (below) |
| Sign-in | **Password account on the Supplier Registration Service** (run by NQC Ltd for the Cabinet Office; "Access as a Supplier → login/register"; MFA topic present in Help). Not OAuth. **Owner creates it.** |
| Cost | free to register; a management levy applies only to orders won (DPS Schedule 5) |
| Fit | **FITS as a listing** for the *Data and Analytics* / *Augmented Decision Making* filters in the *AI Discovery* and *Licensing, Customisation and Support* scopes. A listing is not a win: buyers shortlist by filter and "run a further competition"; a research brief cites ~23% of G-Cloud 13 suppliers ever winning a call-off. |

## What a supplier must have (read from the schedules on gca.gov.uk, 2026-09-05)

| Requirement | Source | CSOAI today | Gap / owner action |
|---|---|---|---|
| Company identity: Companies House number, DUNS number (the portal pulls name/address from Dun & Bradstreet) | portal Help: "We pull all financial data, including organisation name and headquarters address from the Dun & Bradstreet database" | CH **16939677**, registered office 3rd Floor 86-90 Paul Street, London EC2A 4NE | **DUNS: look up / request free at https://www.dnb.co.uk/duns-number/lookup.html** (owner; needs the company email) |
| Insurance from the DPS Start Date: **PI £1,000,000; public liability £1,000,000; employers' liability £5,000,000**, maintained 6 years after End Date; evidence within 15 working days of each renewal | Joint Schedule 3 (Insurance Requirements) v1.0 | none held | Buy PI + PL before appointment. EL: the schedule's wording is unconditional; a company with no employees has no statutory EL duty — ask the broker for the standard combined micro-SME policy that includes it, or state the position in the application. **Money → owner.** |
| Cyber Essentials (Basic or Plus): "shall provide a copy of this to CCS **at award of the first contract**", renewed each anniversary | DPS Schedule 9 (Cyber Essentials Scheme) | not held; IASME Cyber Essentials fee is already in the owner queue (due 14 Sep) | Not needed to be appointed; needed before the first order. Complete the IASME self-assessment. |
| Standards "or equivalent": ISO 9001, ISO 14001, WCAG 2.1 AA, ISO 27001, open-standards principles, Data Ethics Framework, Guidelines for AI Procurement | DPS Schedule 1 (Specification) §1.5 | no ISO certificates; WCAG and open standards are met in practice; public corrections record + signed bytes are the QMS in substance | Answer "equivalent" honestly (below); never claim a certificate not held |
| Minimum standards of reliability; financial standing; grounds for exclusion | Joint Schedule 9; DPS Schedule 2 (Application) — the bid pack and "Read First RM6200 – DPS Needs" are **behind the supplier login** | one-director company, one financial year | Owner downloads the bid pack after registering; the questionnaire answers below are drafted to the public schedules |
| Mandatory service requirements: Innovation, Standards, Security, Vetting of Supplier Staff, Ordering, Knowledge Transfer, Environmental, Sustainability, Social Value | DPS Schedule 1 §1.3 | — | statements below |

## What a buyer sees

The buyer registers, filters the supplier pool (scope → type of AI → sector), exports a shortlist ("valid for 2 working days only"), then invites the shortlist to a **further competition** with an Order Form + Order Schedules (specification, pricing details, security, service levels). At DPS level the buyer sees the supplier's name and filter selections — **no prices** (pricing is DPS Schedule 3 / Order Schedule 5, given per competition). Buyer guide: https://assets.gca.gov.uk/wp-content/uploads/RM6200-Artificial-Intelligence-Buyer-Guide-v2-8.odt

## How a micro-SME measurement body bids

1. Appointment (free): register → complete the DPS Needs questionnaire → select filters → appointed. Being appointed is the product listing.
2. Wait for a further competition in the chosen filters; respond with a capability statement + Order Schedule 5 pricing. Our offer in a competition is the SKU set in `docs/product/` (commission card, evidence bundle, EU AI Act pack, receipts batch, provider-diff feed, signed data feed) — measurement receipts a buyer can verify, not consultancy days.
3. Never bid the *Medical AI Technology* filter (MHRA/CE-marking regime) or *End-to-end Partnerships* (implementation liability we do not carry).

## Application — the DPS Needs answers, ready to paste

(The exact questionnaire is in the login-gated bid pack; these answers follow the public schedules. Measurement language only; pricing is given per competition, never here.)

**Organisation** — CSOAI LTD · Companies House 16939677 · registered office 3rd Floor 86-90 Paul Street, London EC2A 4NE · trading as Council of AI, https://councilof.ai · contact nicholas@csoai.org · SME (micro) · DUNS: ________ (owner) · VAT: ________ (owner, if registered).

**Filter Category 1 – Scope of Engagement:** ☑ AI Discovery · ☑ Licensing, Customisation and Support · ☐ End-to-end Partnerships
**Filter Category 2 – Type of AI:** ☑ Data and Analytics · ☑ Augmented Decision Making · ☐ AI Applications · ☐ Virtual Assistants and Chatbots · ☐ Medical AI Technology
**Filter Category 4 – Sector:** ☑ Central Government · ☑ Devolved Administration · ☑ Local Government · ☑ Not-for-profit · ☐ Blue Light · ☐ Health

**Capability statement (what we supply)**
Council of AI is an independent AI-governance *measurement* body. We do not certify, rank for sale, or build AI systems. We supply signed, dated, recomputable measurement cards about the behaviour of AI models and systems — 22 axes currently on the public board ("22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate.", https://councilof.ai/api/gspc, read 2026-09-05) — plus evidence bundles mapped to obligations a public buyer must evidence (EU AI Act Articles 50 and 53, DORA), all verifiable for free by the buyer's own staff with an open-source verifier (PyPI `csoai-gspc`, npm `csoai-gspc-mcp`). Under *AI Discovery* we help a buyer decide what to measure before buying; under *Licensing, Customisation and Support* we license the signed data feeds and MCP endpoint and run commissioned measurements against the buyer's own item bank.

**Data Ethics Framework / Guidelines for AI Procurement** — Every published number is derived from a frozen item bank graded by rule, with the bank's hash, the as-of and the signature on the card; every mistake is recorded in a public, CC-BY-4.0 corrections record (46 entries, https://councilof.ai/api/corrections). Methodology: DOI 10.5281/zenodo.21991104.

**Standards (Schedule 1 §1.5), stated honestly**
- ISO 9001 / ISO 10007: no certificate. Equivalent controls: version-controlled, signed artefacts; CI gates that refuse unsigned or altered signed bytes; public corrections record; DOI-registered snapshots.
- ISO 27001: no certificate. Equivalent controls: signing keys issued via OIDC to the edge and never stored in files; single-purpose throwaway keys for payments; public disclosure address; Cyber Essentials self-assessment in progress (required before first order, Schedule 9).
- ISO 14001: no certificate; no premises, no fleet; compute is rented and released.
- WCAG 2.1 AA and Open Standards Principles: met — HTML/JSON surfaces, no proprietary formats, every API public and documented.
- Security / vetting: sole director, UK resident; BPSS-level checks available on order.

**Insurance (Joint Schedule 3)** — PI £1m, PL £1m: ☐ in place before DPS Start Date (owner to bind). EL £5m: ☐ included in combined policy / ☐ statement that the company has no employees.

**Cyber Essentials (Schedule 9)** — Basic certificate to be provided at award of the first Order Contract; self-assessment through IASME in progress.

**Social Value / Environmental / Sustainability** — All measurement data is published openly (CC-BY-4.0) so public bodies and researchers can reuse it without buying; corrections are public; compute is rented per run with no idle estate.

**Knowledge transfer** — every deliverable is a verifiable artefact plus the open-source tool to verify it; a buyer never depends on us to re-check what we sold them.

**Grounds for exclusion / financial standing** — none apply; first accounts due per Companies House; one director.

## Owner line

Register at https://supplierregistration.cabinetoffice.gov.uk/dps/RM6200 → "Access as a Supplier" (password account + MFA), get the DUNS number, bind PI/PL insurance, then paste the answers above. Deadline: none (open to 23/02/2029); Cyber Essentials only before the first order.
