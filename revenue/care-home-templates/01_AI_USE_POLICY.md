# AI Use Policy — [HOME NAME]

**Version:** 1.0
**Effective date:** [DATE]
**Owner:** [Manager / Registered Manager / Compliance Lead]
**Review cadence:** Quarterly
**Linked attestation cert:** [auto-populated from MEOK API on first quarterly attestation]

---

## 1. Purpose

This policy sets out how [HOME NAME] uses Artificial Intelligence (AI) tools in the care of residents and the running of the home. It exists to:

(a) Comply with UK GDPR (in particular Article 22 on automated decision-making and Article 9 on special-category data);
(b) Anticipate UK AI Bill 2026 disclosure obligations as transposition continues;
(c) Provide CQC inspectors, insurers, and commissioners with auditable evidence of responsible AI use;
(d) Protect residents, families, and staff from harms arising from AI tool failures or misuse.

This policy applies to **every member of staff, contractor, agency worker, volunteer, and visiting professional** who interacts with AI tools in or on behalf of [HOME NAME].

---

## 2. What counts as "AI" under this policy

For the avoidance of doubt, AI under this policy includes (but is not limited to):

- **Care planning + medication scheduling tools** that recommend doses, timing, or interventions
- **Fall detection and resident-monitoring sensors** with automated alerting (camera-based, wearable, or mat-based)
- **Family communication apps** that auto-summarise resident wellbeing or generate daily updates
- **Rota / staffing tools** that optimise shifts or recommend agency cover
- **Voice assistants** (Alexa, Google Assistant, etc.) deployed in resident or staff-facing areas
- **Document drafting tools** (ChatGPT, Claude, Copilot, etc.) used by staff for care plans, letters, or reports
- **Predictive analytics dashboards** that forecast occupancy, staffing needs, or resident outcomes
- **Translation tools** used in resident or family communication
- **Any third-party SaaS tool whose marketing materials describe "AI", "machine learning", "smart", or "intelligent" features**

If you are unsure whether a tool counts as AI, **assume yes** and consult the [Manager / Compliance Lead].

---

## 3. AI Tool Register (live document — see Appendix A)

[HOME NAME] maintains a register of every AI tool in use. The register records:

- Tool name + supplier + contract reference
- Purpose (specific use-case in this home)
- Categories of personal data processed (with reference to GDPR Article 9 special-category data where applicable)
- Risk classification: **Low / Medium / High** (see §4)
- Date of last review
- Review owner
- Whether resident / family consent has been obtained where required

**A tool is not permitted in [HOME NAME] until it has been entered in the register.**

---

## 4. Risk classification

Each tool is classified at registration:

- **Low risk** — administrative tools that do not affect resident care decisions and do not process resident personal data (e.g. staff rota optimisation tools used on staff data only).
- **Medium risk** — tools that process resident personal data but where final decisions remain with named human staff (e.g. care planning tools where the staff member reviews + signs off recommendations).
- **High risk** — tools where the AI output may directly affect resident care without timely human review (e.g. automated medication dispensers, fall detection with automated escalation, behaviour-prediction tools influencing restraint decisions).

**High-risk tools require:**
- Documented Article 22 GDPR review (right not to be subject to automated decision-making)
- Specific resident / family consent where data is special-category
- Quarterly review (not annual)
- Recorded human-oversight protocol — who reviews what output, how often, what triggers escalation

---

## 5. Staff responsibilities

Every staff member who uses an AI tool in [HOME NAME] must:

1. Have completed the [HOME NAME] AI Literacy Training (see §7) before first use
2. Use the tool only for its registered purpose
3. Not enter resident personal data into AI tools that have not been registered (this includes general-purpose chatbots like ChatGPT for drafting care notes)
4. Report any tool malfunction, unexpected output, or near-miss to the [Manager / Compliance Lead] within 24 hours
5. Not override AI-generated recommendations on high-risk tools without recording the override + reason in the resident's care plan

Staff who breach this policy may be subject to disciplinary action.

---

## 6. Resident + family rights

Every resident (and their nominated representative) has the right to:

- **Be informed** that an AI tool is used in their care, what it does, and what data it processes
- **Refuse** AI-tool-assisted care where reasonable alternatives exist
- **Request human review** of any AI-influenced care decision (GDPR Article 22)
- **Access** personal data processed by AI tools (GDPR Article 15 Subject Access Request)
- **Request rectification** of inaccurate AI-generated records (Article 16)
- **Request erasure** within the limits of clinical retention obligations (Article 17)

The [HOME NAME] Resident Information Pack contains a plain-English summary of these rights. Each new resident receives the pack within 7 days of admission.

---

## 7. Staff AI Literacy Training

Before any staff member uses an AI tool in their role at [HOME NAME], they must complete:

- **AI Literacy Module 1 (30 min)** — what AI is, how it can fail, what to do when it does
- **GDPR Refresher Module (30 min)** — special-category data, consent, breach reporting
- **Tool-specific module** for any high-risk tool they will operate

Training completion is logged in the [HOME NAME] AI Literacy Training Log (see template `03_STAFF_AI_TRAINING_LOG.md`). The log is auditor-ready and reviewed quarterly.

---

## 8. Incident handling

Any of the following must be reported to the [Manager / Compliance Lead] within 24 hours:

- Tool malfunction affecting resident care or data
- AI-generated output that could have caused harm if acted on (a "near-miss")
- Suspected personal data breach via an AI tool
- Resident or family complaint about AI tool use
- Staff member finding an AI tool was used outside its registered purpose

Material breaches (those affecting resident safety or special-category data) are reported to the ICO within 72 hours per UK GDPR Article 33.

---

## 9. Tool retirement

Any AI tool found to be:

- Persistently producing inaccurate output
- Unable to demonstrate GDPR-compliant data handling on supplier review
- Subject to a regulatory enforcement action against the supplier
- Replaced by a better internal alternative

shall be retired within 30 days. Resident records held by the retired tool's supplier must be either transferred or deleted per the home's data retention policy.

---

## 10. Quarterly review + signed attestation

Every quarter, the [Manager / Compliance Lead] reviews:

- The full AI Tool Register (any new tools? retired tools? changes in risk?)
- Staff training log (any new starters? overdue refreshers?)
- Incident log
- Any new UK regulation (AI Bill, GDPR updates, CQC guidance, sector-specific guidance)

The review concludes with a signed self-attestation generated via MEOK AI Labs (`meok-attestation-api`). The signed cert and verification URL are filed with the home's compliance records.

---

## 11. Linked documents

- `02_GDPR_CARE_HOME_NOTICE.md` — privacy notice for residents + families
- `03_STAFF_AI_TRAINING_LOG.md` — staff training register template
- `04_QUARTERLY_SELF_ATTESTATION.md` — attestation generation guide

---

## 12. Authority + signature

This policy is approved by:

**Name:** [Registered Manager]
**Date:** [DATE]
**Signature:** [_____________________]

**Next review date:** [DATE + 3 months]

---

## Appendix A — AI Tool Register template

| # | Tool name | Supplier | Purpose | Risk class | Personal data processed | Consent obtained | Last reviewed | Owner |
|---|---|---|---|---|---|---|---|---|
| 1 | | | | Low / Med / High | | Yes / No / N/A | | |
| 2 | | | | | | | | |
| 3 | | | | | | | | |
| 4 | | | | | | | | |
| 5 | | | | | | | | |

---

**Document control**

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | [DATE] | [Manager] | Initial policy adoption |

---

*This template is provided by MEOK AI Labs (CSOAI LTD, UK Companies House 16939677) as part of the Care Home Compliance Pack. It is not legal advice. Care homes should review this policy with their DPO and/or solicitor before adoption.*
