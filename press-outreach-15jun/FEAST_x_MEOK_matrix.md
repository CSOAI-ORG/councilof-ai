# FEAST × MEOK Strategic Matrix
**Compiled:** 15 Jun 2026 | **Sources:** FEAST report §1.4 + 12-gaps-5-moats-4-governance-layers.md
**Purpose:** Map the 6 predictable Western regulations to the 12 MEOK strategic gaps and the 24-domain portfolio.

## The 6 × 12 matrix (regulatory pressure × portfolio capability)

| East precedent → | Predicted West regulation | Confidence | Y1 £ | Y3 £ | Primary MEOK gap | Primary hive(s) | Existing MCP | Gap? |
|---|---|---|---:|---:|---|---|---|---|
| China 2023 (algorithmic registration) | **Mandatory algorithmic impact assessments** for high-risk AI | High | £40K | £800K | Gap 1: EU AI Act Compliance Verification | meok.ai, biasdetectionof.ai | `eu-ai-act-compliance-mcp` (410 articles) | CLOSE |
| China 2023 (deep synthesis labeling) | **Real-time AI content labeling (C2PA + watermarking)** | High | £30K | £500K | Gap 1 + EU Code of Practice 1st-mover | meok.ai | `meok-watermark-attest-mcp` | SHIP — EU Code of Practice finalises THIS month |
| China 2023 (exploitation prohibition) | **AI psychological vulnerability audit** | High | £25K | £400K | Gap 7: AI Safety Oversight | asisecurity.ai, safetyof.ai | `eu-ai-act-compliance-mcp` (Art 5 covers it) | DEEPEN — gambling vertical |
| China 2017 (Cybersecurity Law) | **Cross-border data localization** for AI training | Medium | £15K | £300K | Gap 9: Decentralized ID Credentialing | dataprivacyof.ai | `gdpr-compliance-mcp`, `pipl-mcp` | SHIP — China ↔ EU bridge |
| South Korea 2026 (AI Basic Act) | **Sovereign cloud requirements** for government AI | Medium | £20K | £500K | Gap 11: GovTech / Digital Public Infrastructure | csoai.org | `proofof.ai` attestation | BUILD — anchor with SDAIA/MGX |
| China 2024 (model export restrictions) | **AI model export control compliance** | High | £10K | £200K | Gap 7 + Gap 12: Cross-Chain Governance Bridge | councilof.ai, sovereign.meok.ai | `proofof.ai`, sovereign sigils | PARTIAL — needs Fable 5 incident playbook |

## The 4 highest-leverage cells (sorted by 18-month revenue potential)

### Cell A: Real-time AI content labeling (Article 50 cliff: 2 Aug 2026)
- **Y1: £30K | Y3: £500K**
- **Existing product:** `meok-watermark-attest-mcp` (already shipped)
- **What's missing:** (1) the EU Code of Practice 2-layer (C2PA + watermark + optional fingerprint) wrapper, (2) the "EU Code-of-Practice-ready" brand positioning, (3) the press push timed to the finalisation
- **Forcing function:** the EU Code of Practice on AI content marking **finalises this month** (June 2026)
- **Effort:** 2 weeks engineering + 1 week brand + 1 week press
- **Strategic note:** per the EU AI Act Article 50 cliff, the **2 Aug 2026** transparency obligations apply to NEW generative systems — that's the deadline, not the 2 Dec 2026 date the marketplace listings have wrong

### Cell B: Mandatory algorithmic impact assessments (Article 6 + Annex III, deferred to 2 Dec 2027 post-Omnibus)
- **Y1: £40K | Y3: £800K**
- **Existing product:** `eu-ai-act-compliance-mcp` (410 verbatim articles)
- **What's missing:** the **automated risk classification engine** that maps a customer system's behaviour to Annex III categories, the impact assessment template generator, the audit trail packaging
- **Forcing function:** the **2 Dec 2027** Annex III high-risk deadline is what customers will scramble for in Q1-Q3 2027
- **Effort:** 6 weeks engineering + 2 weeks compliance review + 1 week sales enablement
- **Strategic note:** this is the FEAST report's "deadline extension is a gift to challengers" insight operationalised — early movers get the marketing moat

### Cell C: AI psychological vulnerability audit (Article 5(1)(f), enforced NOW)
- **Y1: £25K | Y3: £400K**
- **Existing product:** `eu-ai-act-compliance-mcp` Art 5 coverage + gambling compliance knowledge in `meok.ai`
- **What's missing:** the **vertical-specific assessment rubric** for gambling AI (the use case is obvious: AI-driven player segmentation, bonus personalisation, loss-chasing detection), the auditor's checklist, the certification report template
- **Forcing function:** the **May 2026** Digital Omnibus added this prohibition — it's effective NOW, not deferred
- **Effort:** 4 weeks (2 weeks rubric + 1 week tooling + 1 week pilot with 1 gambling operator)
- **Strategic note:** **meok.ai has zero direct competitors in this specific use case.** This is the FEAST report's "lead with meok.ai" recommendation operationalised

### Cell D: Sovereign cloud attestation (proof of jurisdiction + model + framework)
- **Y1: £20K | Y3: £500K**
- **Existing product:** `proofof.ai` attestation infrastructure
- **What's missing:** the **sovereign-deployment-attestation** primitive that certifies (1) data stays in jurisdiction, (2) model is jurisdiction-approved, (3) framework is jurisdiction-current, (4) BFT council sign-off from jurisdiction regulator
- **Forcing function:** South Korea's AI Basic Act (Jan 2026) + Saudi's PDPL + EU Data Act all converge on the same primitive
- **Effort:** 8 weeks (4 weeks primitive + 2 weeks keystone integration + 2 weeks anchor customer with SDAIA or MGX)
- **Strategic note:** the **Oracle-Stargate-Saudi pipeline** (FEAST §4.1) means this is the same primitive needed in 3 jurisdictions — build once, sell 3 times

## The 2 unaddressed cells (the report's blind spots)

### Cell E: Cross-border data localization (China 2017 → West 2027)
- **Existing product:** `gdpr-compliance-mcp`, `pipl-mcp`
- **What's missing:** the **bridge attestation** that proves data flow compliance BOTH ways (e.g. EU personal data → Chinese model with PIPL safeguards, OR Chinese personal data → EU inference with GDPR safeguards)
- **Why it matters:** the EU-China data flow is the single most valuable corridor (1.7B people, $700B annual trade) and NO vendor has a working compliance bridge
- **Effort:** 12 weeks (most complex of the 4)

### Cell F: AI model export control compliance
- **Existing product:** `proofof.ai` (partial)
- **What's missing:** the **Fable 5 incident playbook** — what does a UK gambling operator do when their US-procured frontier model is suddenly export-restricted? Your FEAST report raises this scenario but doesn't name the response.
- **Why it matters:** this is the *existential* insurance story. SOV3 OLM is the technical answer; the compliance attestation is the legal answer.
- **Effort:** 4 weeks (the playbook is mostly legal/product, not engineering)

## The 24-domain portfolio mapped to FEAST predictions

| Hive | FEAST cell | Y1 contribution | Why this hive, not another |
|---|---|---:|---|
| meok.ai | Cells A, B, C | £95K | Gambling compliance is the FEAST vertical lead |
| proofof.ai | Cell D | £20K | Sovereign cloud attestation is the keystone primitive |
| councilof.ai | Cell F | £10K | Government advisory on AI export controls |
| safetyof.ai | Cell C | £15K | AI safety oversight is the umbrella for psychological vulnerability |
| biasdetectionof.ai | Cell B | £10K | Algorithmic impact assessment requires bias detection |
| dataprivacyof.ai | Cell E | £5K | Cross-border data flow is the privacy question |
| csoai.org | Cell D | £5K | GovTech / sovereign deployment is the regulator-facing brand |
| (16 other hives) | Hold for options | £0 | Per the Taleb barbell — concentrate force, hold the rest |

**Total Y1 from the FEAST-aligned 7 hives: £160K (out of the 12-gap plan's £333K Y1)**

## The single-sentence strategy

**The 2 August 2026 Article 50 cliff is your firing pin.** Build the **content-labeling MCP wrapper** + the **algorithmic-impact-assessment engine** + the **gambling-vertical vulnerability audit** in the next 48 days, brand all three "EU Code-of-Practice-ready" + "Fable-5-incident-tested" + "Gulf-sovereign-deployable," and ship the press push to the 1,076 unsent contacts in `PRESS_LIST_1076.csv` with the FEAST numbers as the lead. The 24-domain portfolio is the option book; the 7 FEAST-aligned hives are the in-the-money strikes.

**Estimated Y1 unlock from this matrix: £160K-£200K. Estimated Y3: £2.5M-£3M.**
