# CSOAI Framework Ground-Truth Register

> The rule: **the platform may only state a regulatory fact that is in this register, traced to a primary source.** No LLM jargon, no invented dates. We read each framework fully, verify every claim on our pages against the official text, mark it verified, then move to the next. Truth is the product.

**Status key:** ✅ verified against primary source · 🟡 stated on-platform, needs primary-source pass · ⬜ not yet covered

Last pass: 2026-07 (live web verification of the EU/cyber/global cluster).

---

## Verified this session (✅)

| Framework | Key verified facts | Primary source | CSOAI surface |
|---|---|---|---|
| **EU AI Act — Art. 50** | Transparency obligations + enforcement apply **2 Aug 2026**; legacy generative systems have until **2 Dec 2026** for machine-readable marking (AI Omnibus, May 2026); fines up to **€15M or 3%** turnover | ec.europa.eu digital-strategy; artificialintelligenceact.eu | `/article-50`, `/readiness`, `/crosswalk` |
| **EU AI Act — GPAI** | GPAI rules in force since **2 Aug 2025**; models on market before then have until **2 Aug 2027** | artificialintelligenceact.eu/implementation-timeline | `/ai-governance`, `/gpai` |
| **Cyber Resilience Act** | In force **10 Dec 2024**; conformity-body rules **11 Jun 2026**; **reporting 11 Sep 2026** (24h early warning / 72h notification via Single Reporting Platform → CSIRT+ENISA); main obligations **11 Dec 2027**; fines up to **€15M or 2.5%** | digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act | `/cra` |
| **NIS2** | Transposition deadline **Oct 2026**; common incident-reporting templates adopted **May 2026**; 24h/72h reporting; management personally accountable; ~65% overlap with DORA | nis-2-directive.com; EC | `/nis2`, `/dora` |
| **DORA** | Active enforcement **2026**; Register of Information is the priority audit target; TLPT/TIBER-EU; Reg. (EU) 2022/2554 | regulation-dora.eu; EC | `/dora` |
| **US — Colorado** | Original AI Act (SB 24-205) **repealed 14 May 2026** → replaced by ADMT law **SB 189**, effective **1 Jan 2027** (60-day cure, AG-only) | kslaw.com; ailawsbystate.com | `/colorado-ai-act`, `/us-ai-regulation` |
| **US — Texas** | TRAIGA (HB 149) **in force 1 Jan 2026** | kslaw.com | `/texas-ai-act` |
| **US — California** | AI Transparency Act + GenAI Training-Data Transparency Act **in force 1 Jan 2026** | ailawsbystate.com | `/california-ai-law` |
| **US — federal** | No omnibus law; TAKE IT DOWN Act enacted; deregulatory EOs (2025-26); state-led | whitecase.com AI Watch | `/us-ai-regulation` |
| **South Korea** | Basic AI Act **in force Jan 2026**, extraterritorial | sumsub.com; iapp.org | `/south-korea-ai-act` |
| **China** | GenAI Measures + synthetic-content ID rules (labelling from **1 Sep 2025**) | sumsub.com | `/china-ai-law` |
| **NIST AI RMF** | Voluntary framework, **NIST AI 100-1**, published **26 Jan 2023**. Core = **4 functions** GOVERN · MAP · MEASURE · MANAGE → categories → subcategories. Crosswalk cells verified at function level (subcategory numbers indicative). | nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf; airc.nist.gov | `/crosswalk`, `/nist-vs-eu-ai-act` |
| **ISO/IEC 42001:2023** | AIMS standard: requirements in **clauses 4–10**; **Annex A = 38 controls across 9 control objectives** (AI policy, internal org, resources, impact assessment, AI system life cycle, **data**, information for interested parties, responsible use, third-party). **Annex B = implementation guidance** (not controls). SoA required. **Fixed drift:** crosswalk previously cited Annex B for control domains → corrected to **Annex A**. | iso.org/obp (81230); isms.online | `/crosswalk`, `/guides/iso-42001`, `/iso-42001-vs-eu-ai-act` |
| **GDPR** | Reg. **(EU) 2016/679**, applicable **25 May 2018**. Key refs used in crosswalk verified: Art. **5** (principles), **6** (lawfulness), **9** (special categories), **13–14** (info to provide), **22** (automated decisions / profiling), **35** (DPIA). | eur-lex (2016/679) | `/crosswalk`, `/eu-ai-act-vs-gdpr` |
| **China TC260** | National Information Security Standardization Technical Committee. **AI Safety Governance Framework v2.0 released 15 Sep 2025** (v1.0 Sep 2024); **TC260-003-2024** = Basic Security Requirements for Generative AI Service; "Law + Standard" dual-drive. | onetrust.com; gaicc.org; twobirds.com | `/frameworks/tc260`, `TC260Guide` |
| **FedRAMP RFC-0024 / OSCAL** | RFC-0024 (Rev5 machine-readable packages). **New authorizations must adopt machine-readable/OSCAL by 30 Sep 2026**; grace period ends **30 Sep 2027** (non-compliant loses authorization). OSCAL = NIST machine-readable format (2016). | fedramp.gov/rfcs/0024; paramify.com | `/fedramp`, `/oscal` |

---

## Needs a primary-source pass (🟡 — next in the loop)

| Framework | On-platform at | Do next |
|---|---|---|
| ~~NIST AI RMF~~ | — | ✅ **verified — see table above** (26 Jan 2023, 4 functions) |
| ~~ISO/IEC 42001~~ | — | ✅ **verified — see table above** (clauses 4–10 + Annex A 38 controls; drift fixed) |
| ~~GDPR~~ | — | ✅ **verified — see table above** (2016/679, Art. 5/6/9/13-14/22/35) |
| ~~China TC260~~ | — | ✅ **verified — see table above** (Framework v2.0, 15 Sep 2025; TC260-003-2024) |
| ~~FedRAMP RFC-0024 / OSCAL~~ | — | ✅ **verified — see table above** (30 Sep 2026 → 30 Sep 2027) |
| **UK** | `/uk-ai-regulation` | Verify the 5 principles + AISI status |
| **Canada AIDA** | `/canada-aida` | Confirm current legislative status (flagged uncertain) |
| **Singapore** | `/singapore-ai-governance` | Verify Model AI Gov Framework + AI Verify |
| **MiCA / MiFID II / DORA-adjacent** | crosswalk | Verify article refs |

---

## The loop (how we keep it 100%)

1. Take the next 🟡, read the **official primary text** (not summaries).
2. Check **every** date/obligation our pages state against it.
3. Correct any drift on-platform; add the verified facts + source here; flip to ✅.
4. The globe, Sovereign, account reports and demos may cite only ✅ rows (🟡 must carry an "indicative — verify" flag).
5. Re-pass ✅ rows quarterly (regs move — Colorado already proved that).

*Every correction compounds: the platform gets more true, and the demos get more unbeatable.*
