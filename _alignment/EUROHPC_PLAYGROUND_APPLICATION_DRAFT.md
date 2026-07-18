# EuroHPC AI Factories — Playground access: application draft (CSOAI Ltd)

**Why this first:** 5,000 GPU hours · **access in 2 working days** · **free** · **no competitive selection** ·
**industry-only (academics are redirected — being a non-academic business is an ADVANTAGE)** ·
**SMEs may commercially exploit the outcome** and keep their data and models.
**UK eligibility: SETTLED** — the UK is a EuroHPC Participating State (35th, joined May 2024; on EuroHPC's own list).

- **Access modes:** https://www.eurohpc-ju.europa.eu/ai-factories/ai-factories-access-modes_en
- **Questions / eligibility confirmation:** `aif.access@eurohpc-ju.europa.eu`
- **Need:** VAT number (+ a PIC for some routes). Civilian purposes only. AI Act compliance required.
- **Systems:** LUMI-G, MareNostrum 5 ACC, Leonardo Booster, Vega, MeluXina, Discoverer.
- **Next step up once you're a known user:** **Fast Lane — 50,000 GPU hrs, 4 working days.**

---

## PROJECT TITLE
Independent, attestable evaluation of governance-specialised language models

## ORGANISATION
CSOAI LTD — UK-registered micro SME. Companies House no.: **16939677** (Active, inc. 2 January 2026)
Registered address: 3rd Floor, 86-90 Paul Street, London, England, EC2A 4NE
VAT: **NOT VAT-REGISTERED** — pre-revenue, below the £90k UK threshold (confirmed by Nick 2026-07-17). This is
normal and legal; do NOT voluntarily register just to unlock this. → send `EUROHPC_ELIGIBILITY_EMAIL.md` to
aif.access@eurohpc-ju.europa.eu to confirm a Companies House number suffices.
PIC: **[free from EU Funding & Tenders portal — ask in the same email whether it's needed for Playground]**
Lead: Nicholas Templeman (director).

## ACTIVITY TYPE
**Research and experimental development.** (NOT product deployment — no client inference will run on the
resource. This is model training and evaluation research.)

## OBJECTIVES (what the 5,000 GPU hours are for)
1. **Train** governance-specialised language models (7B–14B class, open-weights base, LoRA/QLoRA) on a curated
   corpus of AI-governance and regulatory instruction data.
2. **Evaluate** them on a held-out governance battery — regulatory grounding, citation-correctness, and refusal
   of unsafe requests — against general-purpose baselines.
3. **Research the verification problem directly:** measure how reliably an independent evaluator can detect a
   model gaming its own evaluation (reward-hacking / proxy-intent gap), using tamper-evident signed decision logs.
4. **Publish** the evaluation methodology, results and model card openly — **including negative results.**

## WHY AI FACTORY ACCESS ADDS VALUE (the decisive question — we have measured evidence)
This is not speculative. We have **measured** our ceiling on free/consumer compute:
- On free-tier T4 GPUs we can only train **0.5B–3B** LoRA adapters. We trained three. They ground on law but are
  **not capable enough for reliable regulatory citation**.
- We tested whether combining several smaller models could substitute for one larger one. **It cannot** — a
  mixture-of-agents over three architecturally-diverse models, synthesised by a 120B aggregator, beat the best
  single model on only **4 of 15** held-out governance questions. Committee-of-small-models is a measured dead end.
- **Therefore the capability step-change requires training at a scale only an AI Factory provides.** 5,000 GPU
  hours is precisely the increment between "grounds on law" and "reliably citable."
- We are bootstrapped with no VC backing; hyperscaler credit tiers at this scale are gated to VC-backed
  companies. Public AI infrastructure is the route by which a UK SME can perform this research at all.

## EUROPEAN / PUBLIC VALUE
- **AI Act alignment:** outputs support Article 12 (logging) and Article 50 (transparency) compliance tooling
  for SMEs — lowering the compliance cost that currently falls hardest on small European businesses.
- **Open outputs:** methodology, battery and model card published; negative results included.
- **Independent assurance:** the research targets a structural gap — *a model vendor cannot independently attest
  to its own behaviour.* Independent, attestable evaluation is a public good no frontier vendor can supply for itself.

## COMPLIANCE
- **Civilian purposes only.** An enforced hard-stop layer refuses weapons-targeting and mass-surveillance
  categories — implemented and tested, not aspirational.
- **Data:** our own curated governance corpus + openly-licensed datasets (Apache/MIT/CC-BY only).
  Non-commercially-licensed data deliberately excluded. **No personal data** is used in training.
- **AI Act:** the work is itself compliance research; every decision is Ed25519-signed and offline-verifiable.

## RESOURCES REQUESTED
5,000 GPU hours (Playground), 1–3 months. Preferred system: any AIF GPU partition (LUMI-G / MareNostrum 5 ACC /
Leonardo Booster suitable). No funding requested.

---
## HONEST NOTES BEFORE SUBMITTING
1. **Fill the VAT + Companies House numbers.** Check whether a PIC is needed for your chosen route.
2. **Keep it R&D.** The scope explicitly excludes routine product deployment — do not describe client inference.
3. **Lead with the measured evidence** (3B ceiling; 4/15 MoA null). Most applicants *assert* they need compute;
   you can *evidence* it. That is the strongest paragraph you have.
4. **Do not overclaim.** No "emergence", no "1.6T", no "531 MCPs". The measured facts are stronger and survive scrutiny.
5. **Email `aif.access@eurohpc-ju.europa.eu` first** if any eligibility doubt — costs nothing, 2-day turnaround anyway.
6. **Then Fast Lane (50k hrs)** once you're a known user — same shape, 4 working days.
