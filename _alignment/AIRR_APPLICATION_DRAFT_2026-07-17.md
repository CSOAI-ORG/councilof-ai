# UKRI AIRR Rapid Access — application draft (CSOAI Ltd)

**Portal:** https://portal-airr.isambard.ac.uk/login/ (register there — templates are on the portal)
**Contact for guidance:** airr@ukri.org
**Ask:** 20,000 GPU hours (Isambard-AI GH200), used within 3 months. No funding requested.

## The 3 assessment criteria (light-touch, weekly, ≤2 weeks to access)
1. Objectives within AIRR scope? → **map to gov missions + eligible activity**
2. Does AIRR access **add value**? → **prove free tiers are insufficient (we have measured evidence)**
3. Compliance concerns? → **pre-empt them (we have hard-stops + signed audit)**

---

## PROJECT TITLE
Sovereign: a governance-specialised language model with cryptographic provenance for UK AI assurance

## GOVERNMENT MISSIONS ADDRESSED
- **Public safety** (primary) — AI assurance and safety governance. The project develops a model specialised in
  identifying and enforcing AI-safety and regulatory obligations, with a hard-coded refusal layer and an
  audit trail. Safer AI deployment across UK industry is the direct output.
- **Economic growth** (secondary) — UK SMEs face EU AI Act, DORA, NIS2 and GDPR obligations with no affordable
  compliance tooling. Lowering that compliance cost is a direct growth enabler for UK businesses exporting to the EU.

## ELIGIBLE ACTIVITY
**Experimental development** (pre-market-launch). Training and evaluating a governance-specialised model that is
not yet launched as a product.

## PROJECT OBJECTIVES (what we will do with 20,000 GH200 hours)
1. Train a governance-specialised LLM (7B–32B class) on a curated corpus of AI-governance and regulatory
   instruction data, at a scale that is currently impossible for us.
2. Evaluate it against a held-out governance battery (regulatory grounding, citation-correctness,
   refusal of unsafe requests) versus general-purpose baselines.
3. Publish the evaluation results and model card openly, including negative results.

## WHY AIRR ACCESS ADDS VALUE (criterion 2 — the decisive one)
We have **measured evidence**, not speculation, that free/consumer compute is the binding constraint:
- On free-tier T4 GPUs we can only train **0.5B–3B** LoRA adapters. We have trained these (three models) and
  they ground on law but are **not capable enough** for reliable regulatory citation.
- We tested whether combining several small models could substitute for one large one — **it cannot**:
  a mixture-of-agents over three architecturally-diverse models beat a single larger model on only
  **4 of 15** held-out governance questions. Committee-of-small-models is a measured dead end.
- **Conclusion: capability here requires training at a scale only a GH200-class machine provides.** 20,000 GPU
  hours is precisely the step-change between "grounds on law" and "reliably citable" — the difference between a
  research artefact and a usable UK assurance tool.
- We are bootstrapped with no VC backing; the hyperscaler credit tiers that would fund this are gated to
  VC-backed companies. AIRR is the route by which a UK SME can do this work at all.

## COMPLIANCE (criterion 3 — pre-empted)
- **No dual-use / kinetic scope.** The project has an explicit, enforced hard-stop layer refusing
  weapons-targeting, mass-surveillance and related categories. This is implemented and tested, not aspirational.
- **Data:** training data is our own curated governance corpus plus openly-licensed datasets
  (Apache/MIT/CC-BY only). Non-commercial-licensed data is deliberately excluded.
- **Provenance:** every model decision is Ed25519-signed and offline-verifiable — an auditable trail by design.
- **Outputs:** evaluation results and model card published openly, including negative results.
- **No personal data** is used in training.

## ORGANISATION
- **CSOAI LTD** — UK registered. Companies House no.: **16939677** (Active) · Incorporated **2 January 2026**
- Registered address: 3rd Floor, 86-90 Paul Street, London, England, EC2A 4NE
- Size: micro business
- Project lead: Nicholas Templeman — director, contract with the organisation of longer duration than the project

---

## HONEST NOTES BEFORE YOU SUBMIT
1. **The strongest thing in this application is the negative result.** Most applicants assert they need compute.
   You can *evidence* it: 3B is your ceiling, and you proved committees-of-small don't substitute. Lead with that.
2. **Keep it pre-market-launch.** The scope is R&D *prior to* market launch — frame the model as experimental
   development, not as an existing product being scaled.
3. **Don't overclaim.** No "1.6T", no "emergence", no "531 MCPs". The measured facts are stronger and they'll hold
   up to scrutiny. Everything in this draft is true and defensible.
4. **You can apply more than once** — no limit per organisation. If this one's scoped tight and lands, a second
   application for the eval/red-team phase is legitimate.
5. **Ask them first if unsure:** airr@ukri.org — a pre-submission question costs nothing and signals seriousness.
6. **The 3-month clock starts at award** and cannot be deferred — only apply when you're ready to actually run.
   Preferred start can be up to 1 month after submission.
