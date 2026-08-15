# DPIA — Data Protection Impact Assessment

## CSO AI LTD (UK 16939677) — Human Arena for AI Governance Measurement

**Assessment Date:** 15 August 2026
**Version:** 0.1 (draft for review, not yet submitted)
**Template:** EDPB Guidelines 1/2026 (adopted 16 April 2026), harmonised DPIA template (14 April 2026)

---

### 1. Data Controller

- **Controller:** CSO AI LTD, registered in England and Wales, company no. 16939677
- **DPO (to appoint):** [TBD — required under UK GDPR Art. 37(1)(b) if large-scale processing of special category data]
- **ICO registration:** [TBD — required before data collection commences]

### 2. Purpose & Lawful Basis

**Purpose:** The human arena collects AI-vs-human and human-vs-human paired preference data. Human participants interact with AI models (and optionally other humans) in gamified tasks; their choices, response texts, and demographic metadata are recorded to produce signed measurement evidence for AI governance — specifically, the 13 GSPC axes.

**Lawful basis (UK GDPR):**
- Article 6(1)(a): Consent (explicit opt-in, per-session, withdrawable)
- Article 6(1)(f): Legitimate interest (the measurement body's core function — producing independent AI-governance evidence — constitutes a legitimate interest)
- **Special category data (if demographics collected):** Article 9(2)(a) — explicit consent

**No PII collection:** The arena design explicitly avoids collecting names, email addresses, IP addresses (hashed server-side, not stored), or government identifiers. Participant identifiers are pseudonymous (Prolific participant IDs for paid cohorts; random session tokens for free cohorts).

### 3. Data Categories

| Category | Collected? | Basis | Retention |
|---|---|---|---|
| AI-vs-human preference judgments | Yes | Consent | Indefinite (signed measurement record) |
| Free-text responses | Yes | Consent | Indefinite (research value) |
| Age bracket (18-24 / 25-34 / etc.) | Yes | Consent / Legitimate interest | Indefinite (demographic fairness analysis) |
| Country of residence | Yes | Legitimate interest | Indefinite (per-jurisdiction analysis) |
| Pseudonymous session ID | Yes | Functional | 30 days post-session |
| Prolific participant ID (paid cohort) | Yes | Contract | Duration of Prolific study + 30 days |
| IP address | **No** | — | Hashed server-side only, log-purged within 24h |
| Email / name / government ID | **No** | — | Not collected |

### 4. Processing Operations

1. Arena client (browser) collects task responses and behavioural metadata (timestamps, choices, text).
2. Server signs every turn as a measurement artifact (Ed25519, RFC 8032 §7.1) and stores the signed record in the chain log.
3. The raw chain log is the durable measurement record. Analytics (aggregate scores, GNN cross-synthesis) read from signed records only.
4. No individual-participant profiling, no automated decisions producing legal effects.
5. Pay participants via Prolific (paid cohort only) — Prolific handles payment PII; CSO AI LTD receives pseudonymous participant IDs only.

### 5. Risk Assessment

#### Design risk (inherent to the processing)

| Risk | Likelihood | Severity | Mitigation |
|---|---|---|---|
| Free-text responses contain incidental PII | Medium | Medium | On-screen instruction: "Do not include your name, email, or location." Automated regex scan for email/phone patterns; flag and redact before chain write. |
| Re-identification from response style | Low | Low | Pseudonymous IDs, no metadata linkage to identity. |
| Arena data used to train a Council-owned model | N/A (structural) | Maximum | **Firewall:** sigil chain writes are append-only and measurement-scoped. The GNN analytics module reads outcomes but NEVER trains a model. Separate repo per estate firewall doctrine. |
| Prolific participant de-anonymisation | Low | Medium | Prolific IDs are pseudonymous; CSO AI LTD receives only the participant ID (no name/email). Active Prolific study duration only. |

#### Incident risk (data breach scenarios)

| Incident | Likelihood | Impact | Response |
|---|---|---|---|
| Chain-log endpoint exposed without authentication | Low | Medium | Sigil chain file is append-only on a private backend. Public /api/gspc endpoint serves aggregate counts only. |
| Prolific API key compromise | Low | High | Key stored in sealed secrets manager, rotated on detection. Incident response: Prolific notified within 24h; affected participants informed via Prolific. |

### 6. AI Act §26(9) — Transparency Obligations

The arena is a human-vs-AI measurement instrument, not a deployable AI system itself. However, the AI models under test may be high-risk under EU AI Act Annex III in certain domains. To comply with §26(9) (information obligations for deployers of high-risk AI systems):

- The arena client displays a pre-task notice: "You are interacting with [model name]. Your responses form part of a signed measurement record. No inference is made about you personally. You can withdraw at any time."
- Model provenance is tracked per task (model name, version, provider, OMS manifest hash where available).

### 7. DPO & Stakeholder Consultation

- **DPO:** To be appointed before live data collection.
- **ICO consultation:** Not yet performed — required if the residual risk after mitigations remains high. The current design (no PII, pseudonymous-only) targets residual risk LOW.
- **Ethics review:** Partner university IRB approval required for SONA-pool recruitment; independent ethics advisor recommended for direct-to-public recruitment.

### 8. Review & Sign-off

- **Draft date:** 15 August 2026
- **Review cycle:** Pre-launch (before any human-in-the-loop data collection), then annually
- **Triggers for early review:** change of controller, new data category, Prolific replacement, arena expansion to jurisdictions with different adequacy status
- **Controller sign-off:** [Nicholas Templeman, Director — pending]
- **DPO sign-off:** [TBD]
- **Next review:** Before arena launch to public participants

---

**Honest caveat:** This is a structural DPIA drafted against the EDPB template. It identifies the controller and the processing, lays out the risks and mitigations, and flags the DPO+ICO gaps honestly. It is **not signed** — the controller must review, appoint a DPO, and complete ICO registration before this DPIA can be considered effective.