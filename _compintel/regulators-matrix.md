# AI-Governance + Cybersecurity Regulatory Matrix

**Compiled:** 2026-07-02 · **Analyst:** Claude (research sweep, primary + authoritative secondary sources)
**Legend:** ✅ VERIFIED = seen in an authoritative/primary source (regulator, official register, ISO, NIST, gov.uk, whitehouse.gov, or law-firm alert citing same). 🔶 INFERENCE = triangulated from multiple secondary sources / analyst reasoning, not confirmed against a primary text.

> ⚠️ **Biggest 2026 shift:** the EU **"Digital Omnibus"** (proposed 19 Nov 2025; political agreement 7 May 2026) *delayed* AI Act high-risk deadlines and is *simplifying* GDPR/Data Act/NIS2. Any "Aug 2 2026 high-risk countdown" framing is now stale — high-risk Annex III moved to **2 Dec 2027**. This is the single most important correction for our pitch.

---

## 1. NIST AI RMF (+ AI 600-1 Generative AI Profile)

- **(a) Region:** USA (voluntary; de-facto global baseline)
- **(b) Mandate (1 line):** Voluntary framework to Govern / Map / Measure / Manage AI risk across the lifecycle; AI 600-1 profile adds GenAI-specific risks (hallucination, prompt injection, training-data privacy, harmful content). ✅ VERIFIED
- **(c) TOP 7 tools/capabilities to comply:**
  1. AI system inventory / use-case registry (Map)
  2. AI risk assessment + impact assessment engine (Map/Measure)
  3. Model evaluation / red-teaming / benchmarking (Measure)
  4. Continuous monitoring & drift/performance telemetry (Manage)
  5. Governance policy + roles/accountability register (Govern)
  6. Documentation / model cards / traceability & provenance (Govern/Manage)
  7. Incident response + feedback loop for AI failures (Manage)
- **(d) NEXT 7 dates/movements (2026-2028):**
  1. ✅ **Dec 16 2025** — NIST IR 8596 "Cyber AI Profile" preliminary draft published
  2. ✅ **Jan 30 2026** — Cyber AI Profile comment period closed (45-day window)
  3. ✅ **Apr 7 2026** — NIST concept note: AI RMF Profile for Trustworthy AI in *Critical Infrastructure*
  4. 🔶 **2026 (H2)** — expected Initial Public Draft of Cyber AI Profile (IR 8596) after comment review
  5. 🔶 **2026-2027** — Critical-Infrastructure AI RMF Profile drafting
  6. 🔶 **Ongoing** — shift from foundational guidance → operational, sector-specific profiles
  7. 🔶 Alignment work so CSF 2.0 + AI RMF + Cyber AI Profile are "used together"
- **Sources:** nist.gov/itl/ai-risk-management-framework · nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf · csrc.nist.gov/pubs/ir/8596/iprd · nist.gov/news-events/news/2025/12/draft-nist-guidelines-rethink-cybersecurity-ai-era

---

## 2. NIST CSF 2.0

- **(a) Region:** USA (voluntary; global de-facto)
- **(b) Mandate:** Cybersecurity outcomes across **6 functions — GOVERN (new), Identify, Protect, Detect, Respond, Recover** — 106 subcategories/22 categories; scope expanded beyond critical infra to all sectors, heavy governance + supply-chain emphasis. ✅ VERIFIED
- **(c) TOP 7 tools/capabilities:**
  1. Governance / risk-management strategy & policy register (GOVERN — 31 subcats)
  2. Asset + supplier/third-party inventory (Identify — supply-chain risk)
  3. Identity & access management + data security controls (Protect)
  4. Continuous monitoring / SIEM / detection (Detect)
  5. Incident response playbooks (Respond)
  6. Backup / recovery / business-continuity (Recover)
  7. Maturity-tier self-assessment (Tier 1-4) + control-mapping/crosswalk tooling
- **(d) NEXT 7 dates/movements:**
  1. ✅ **Feb 2024** — CSF 2.0 published (baseline)
  2. ✅ **Dec 2025 / Jan 2026** — Cyber AI Profile *extends* CSF 2.0 to AI (see #1)
  3. 🔶 2026 — organizations mapping legacy CSF 1.1 programs to 2.0 GOVERN function
  4. 🔶 2026-2027 — CSF used as the spine that AI RMF + Cyber AI Profile plug into
  5-7. 🔶 No hard statutory dates (voluntary); movement is via sector overlays/profiles
- **Sources:** nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf · nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.1299.pdf

---

## 3. EU AI Act (Reg. (EU) 2024/1689) — incl. GPAI Codes + Omnibus

- **(a) Region:** EU (extraterritorial — applies to providers/deployers serving the EU)
- **(b) Mandate:** Risk-tiered AI regulation (prohibited / high-risk / limited-transparency / minimal); high-risk needs risk mgmt, data governance, logging, human oversight, conformity assessment; GPAI models have transparency/copyright duties, systemic-risk models add safety/security obligations. ✅ VERIFIED
- **(c) TOP 7 tools/capabilities:**
  1. AI system classification / risk-tiering engine (incl. Annex III mapping)
  2. Conformity assessment + technical documentation (Annex IV) generator
  3. Data governance / training-data quality & provenance records
  4. Logging / event-recording + traceability (auto-logs)
  5. Human-oversight controls + instructions-for-use
  6. Transparency / synthetic-content labelling & watermarking (Art. 50)
  7. Post-market monitoring + serious-incident reporting; GPAI: model cards, copyright policy, systemic-risk evals/red-teaming
- **(d) NEXT 7 dates (post-Omnibus, 7 May 2026 agreement):**
  1. ✅ **2 Aug 2025** — GPAI model obligations + governance + penalties in force (unchanged)
  2. ✅ **2 Dec 2026** — Art. 50(2) watermarking/synthetic-content disclosure (delayed from Aug 2026; grace period cut 6mo→3mo); chatbot transparency ~Aug 2026; "nudifier"/CSAM prohibitions extended
  3. ✅ **2 Dec 2027** — HIGH-RISK Annex III standalone systems (delayed 16 months from 2 Aug 2026) 🚨 KEY CHANGE
  4. ✅ **2 Aug 2027** — GPAI models placed on market before 2 Aug 2025 must reach compliance
  5. ✅ **2 Aug 2028** — high-risk AI embedded in Annex I regulated products (delayed from Aug 2027)
  6. 🔶 **2026** — Omnibus text finalization (trilogue → adoption) after 7 May 2026 political agreement
  7. ✅ **2 Aug 2028** — Commission evaluation of AI Office + voluntary codes
- **GPAI Code of Practice:** ✅ Final version published **10 Jul 2025**; voluntary; signatories incl. OpenAI, Anthropic, Google, Mistral; 3 chapters (Transparency, Copyright, Safety & Security). Safety chapter binds systemic-risk models (o3, Claude 4 Opus, Gemini 2.5 Pro class).
- **Sources:** digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai · artificialintelligenceact.eu/implementation-timeline · verifywise.ai/blog/eu-ai-act-omnibus-what-changed · whitecase.com (Digital Omnibus) · code-of-practice.ai · lw.com (GPAI obligations in force)

---

## 4. EU DORA (Reg. (EU) 2022/2554)

- **(a) Region:** EU (financial entities + their ICT providers)
- **(b) Mandate:** ICT risk management, incident reporting, digital operational resilience testing, ICT third-party risk mgmt for financial sector. Applied since **17 Jan 2025**. ✅ VERIFIED
- **(c) TOP 7 tools/capabilities:**
  1. ICT risk management framework + governance
  2. Register of Information (ROI) — all ICT third-party arrangements in ESA template
  3. ICT-related incident classification + reporting workflow
  4. Digital operational resilience testing program
  5. Threat-Led Penetration Testing (TLPT) capability (TIBER-EU aligned)
  6. Third-party / concentration-risk monitoring (incl. CTPP oversight)
  7. Contractual controls / exit strategies for critical ICT providers
- **(d) NEXT 7 dates/movements:**
  1. ✅ **17 Jan 2025** — DORA applies (baseline)
  2. ✅ **8 Jul 2025** — TLPT RTS (Del. Reg. 2025/1190) directly applicable
  3. ✅ **Nov 2025** — first 19 designated Critical ICT Third-Party Providers (AWS, Google, MS, Oracle, SAP, Deutsche Telekom, …)
  4. ✅ **Ref date 31 Dec 2025** — 2026 Register of Information cycle reference date
  5. ✅ **Late 2026 / early 2027** — first TLPT notifications issued to entities
  6. 🔶 **2026** — enforcement posture "interventionist" (evidence, not remediation plans); ROI data-quality a major failure point (only 6.5% passed 2024 dry-run)
  7. 🔶 Post-notification clock: 3mo to initiation docs, 6mo to scope spec, ≥12wk red-team, purple-teaming mandatory
- **Sources:** eiopa.europa.eu/digital-operational-resilience-act-dora_en · regulation-dora.eu · surecloud.com/resource-hub/dora-compliance-guide

---

## 5. EU NIS2 (Directive (EU) 2022/2555)

- **(a) Region:** EU (essential + important entities across ~18 sectors)
- **(b) Mandate:** Cyber risk-management measures (Art. 21 — 10 measures), incident reporting (24h/72h/1mo), management accountability, supply-chain security. ✅ VERIFIED
- **(c) TOP 7 tools/capabilities:**
  1. Risk-management measures program (Art. 21 ten measures)
  2. Multi-stage incident reporting (24h early warning / 72h notification / 1-month final) to national CSIRT
  3. Asset + supply-chain security management
  4. Business continuity / crisis management
  5. Vulnerability handling & disclosure
  6. Management-body oversight + accountability (personal liability)
  7. Entity classification logic (Essential vs Important) + registration
- **(d) NEXT 7 dates/movements:**
  1. ✅ **17 Oct 2024** — transposition deadline (only BE, HR, IT, LT met it)
  2. ✅ **7 May 2025** — Commission escalated reasoned opinions vs 19 member states
  3. ✅ **By May 2026** — 22 of 27 states adopted; FR, IE, LU, NL, ES still in procedure
  4. ✅ **2026** — grace period ended; active supervision by national authorities
  5. 🔶 Penalties live: Essential €10M/2% turnover; Important €7M/1.4%
  6. 🔶 **2026** — Digital Omnibus proposes NIS2 *simplification* amendments (in play)
  7. 🔶 Ongoing CJEU referral risk for non-transposing states
- **Sources:** digital-strategy.ec.europa.eu/en/policies/nis2-directive · ecs-org.eu (transposition tracker) · twobirds.com · whitecase.com

---

## 6. GDPR (Reg. (EU) 2016/679)

- **(a) Region:** EU (extraterritorial)
- **(b) Mandate:** Lawful basis, data-subject rights, DPIAs, breach notification (72h), Art. 22 automated-decision safeguards, accountability. Now the primary live lever for AI enforcement in the EU. ✅ VERIFIED
- **(c) TOP 7 tools/capabilities:**
  1. Records of Processing Activities (RoPA) / data mapping
  2. Lawful-basis + consent management
  3. Data-subject rights request handling (DSAR)
  4. DPIA (Data Protection Impact Assessment) tooling — incl. AI/high-risk processing
  5. Breach detection + 72h notification workflow
  6. Automated-decision-making (Art. 22) safeguards + transparency
  7. Cross-border transfer mechanisms (SCCs/adequacy) + vendor DPAs
- **(d) NEXT 7 dates/movements:**
  1. ✅ **19 Nov 2025** — Commission proposes GDPR "simplification" in Digital Omnibus
  2. ✅ **20 Jan 2026** — EDPB/EDPS Joint Opinion on Digital Omnibus on AI
  3. ✅ **11 Feb 2026** — EDPB/EDPS Joint Opinion on Digital Omnibus Regulation (GDPR)
  4. 🔶 **2026** — Omnibus GDPR/AI-training-data + ePrivacy amendments negotiated (contested; civil-society pushback)
  5. 🔶 **Ongoing** — DPAs actively fining/prohibiting AI systems under existing GDPR
  6. 🔶 AI-training-data & pseudonymization definitions under revision in Omnibus
  7. 🔶 Data Act interplay amendments (also in Omnibus package)
- **Sources:** iapp.org (Commission proposes reforms GDPR/AI Act) · lw.com (Digital Omnibus) · taylorwessing.com · insideprivacy.com (EDPB/EDPS opinion)

---

## 7. UK — JSP 936 / DSIT AI framework / ICO / Cyber Essentials

- **(a) Region:** UK
- **(b) Mandate (multi-instrument):**
  - **JSP 936 "Dependable AI in Defence"** (MoD, v1.0 Nov 2024; v1.1 current) — ethical/governance/assurance directive across AI lifecycle for defence incl. RAS. ✅ VERIFIED
  - **DSIT Code of Practice for the Cyber Security of AI** (Jan 2025) + Implementation Guide — secure-AI-development principles; builds on NCSC Guidelines for Secure AI Development (Nov 2023). ✅ VERIFIED
  - **ICO** — data-protection regulator, AI/automated-decision guidance. **Cyber Essentials** — NCSC baseline cert (5 controls). 🔶
- **(c) TOP 7 tools/capabilities:**
  1. AI assurance / lifecycle governance (JSP 936: quality, safety, security)
  2. Secure-AI-development controls (DSIT code — design/dev/deploy/maintain)
  3. AI risk & ethics assessment + accountable-owner register
  4. ICO-aligned DPIA + automated-decision transparency
  5. Cyber Essentials 5 controls (firewalls, secure config, access control, malware, patching)
  6. Supply-chain / model-provenance assurance
  7. Cyber Governance Code of Practice (board-level accountability)
- **(d) NEXT 7 dates/movements:**
  1. ✅ **Nov 2024** — JSP 936 v1.0 issued (v1.1 now current)
  2. ✅ **Jan 2025** — DSIT AI Cyber Security Code of Practice + Implementation Guide published
  3. 🔶 **2026** — Code of Practice expected to feed a global standard (ETSI) / voluntary→baseline
  4. 🔶 **2026** — UK data-protection reform (DUAA) implementation affecting ICO guidance
  5. 🔶 UK's principles-based / pro-innovation stance vs EU (no single AI Act)
  6. 🔶 Ongoing Cyber Essentials scheme updates (annual NCSC refresh)
  7. 🔶 JSP 936 = the "assurance gap" wedge (validating vendor deployment-ready claims)
- **Sources:** gov.uk JSP 936 part 1 · assets.publishing.service.gov.uk JSP936_Part1.pdf · gov.uk/ai-cyber-security-code-of-practice · Implementation_Guide PDF

---

## 8. ISO/IEC 42001 (+ ISO/IEC 27001:2022)

- **(a) Region:** International (voluntary certification)
- **(b) Mandate:**
  - **42001:2023** — world's first AI Management System (AIMS) standard: responsible AI, risk/impact assessment, data & model governance, transparency, traceability, continual monitoring. ✅ VERIFIED
  - **27001:2022** — ISMS standard; 93 controls in 4 themes, 11 new controls. ✅ VERIFIED
- **(c) TOP 7 tools/capabilities:**
  1. AI Management System (policy, objectives, roles) — 42001 clauses
  2. AI risk + AI impact assessment (Annex A/B controls)
  3. Data & model governance / lifecycle records
  4. ISMS (27001) — Statement of Applicability + risk treatment
  5. Continual monitoring + internal audit + management review
  6. Control mapping / crosswalk (42001 ↔ 27001 ↔ NIST ↔ EU AI Act)
  7. Evidence collection / audit-readiness automation
- **(d) NEXT 7 dates/movements:**
  1. ✅ **31 Oct 2025** — ISO 27001:2013→:2022 transition deadline PASSED (2013 certs expired) 🚨
  2. ✅ **2026** — 42001 certifications accelerating (BSI, DNV, A-LIGN, Schellman offering)
  3. ✅ **2026** — EN ISO/IEC 42001:2026 (European adoption) referenced — likely harmonization path for EU AI Act
  4. 🔶 42001 positioned as the de-facto "how to comply with EU AI Act" management layer
  5. 🔶 Growing customer/procurement demand for 42001 as trust signal
  6-7. 🔶 Ongoing Annex A control refinement; sector guidance
- **Sources:** iso.org/standard/42001 · iso.org/home/insights-news/resources/iso-42001-explained · lrqa.com (27001 transition) · standards.iteh.ai (EN ISO/IEC 42001:2026)

---

## 9. US FedRAMP (+ Rev5 / 20x) & DoD Impact Levels (+ CMMC 2.0)

- **(a) Region:** USA federal / DoD
- **(b) Mandate:** FedRAMP = standardized cloud security authorization for federal agencies (Rev5 baselines; "20x" modernization = machine-readable/continuous). DoD CC SRG Impact Levels IL2/IL4/IL5/IL6 (DISA) for DoD CUI/NSS. CMMC 2.0 = contractor cyber maturity for CUI. ✅ VERIFIED
- **(c) TOP 7 tools/capabilities:**
  1. NIST 800-53 Rev5 control implementation + SSP
  2. Continuous monitoring ( conMon) + machine-readable authorization packages (20x/OSCAL)
  3. 3PAO / C3PAO assessment readiness
  4. POA&M (Plan of Action & Milestones) management
  5. Boundary/data-flow + inventory documentation
  6. CUI protection controls (NIST 800-171) for CMMC L2
  7. Multi-tenant isolation / FIPS crypto / IL-specific segregation
- **(d) NEXT 7 dates/movements:**
  1. ✅ **10 Nov 2025** — CMMC Phase 1 (L1/L2 self-assessment on certain contracts)
  2. ✅ **30 Sep 2026** — FedRAMP Rev5 machine-readable authorization package initial deadline
  3. ✅ **10 Nov 2026** — CMMC Phase 2 (mandatory C3PAO L2 certification default for CUI contracts) 🚨
  4. ✅ **30 Sep 2027** — FedRAMP Rev5 hard final deadline (non-compliant authorizations revoked)
  5. 🔶 **2026-2027** — FedRAMP "20x" continuous-authorization rollout
  6. 🔶 DoD IL authorizations continue via DISA CC SRG (separate from FedRAMP 20x)
  7. 🔶 CMMC phased applicability tied to specific solicitations (not blanket)
- **Sources:** github.com/FedRAMP/community discussions · schellman.com (DoD IL4/IL5) · secondfront.com · secureframe.com/hub/cmmc · strikegraph.com (Phase 2 Nov 2026)

---

## 10. US SEC Cyber Disclosure + Federal AI EO/OMB (2026-current)

- **(a) Region:** USA
- **(b) Mandate:**
  - **SEC cyber rule** (eff. 18 Dec 2023): material cyber incident → Form 8-K Item 1.05 within 4 business days; annual Reg S-K Item 106 governance disclosure. ✅ VERIFIED
  - **Federal AI policy:** OMB M-25-21 (agency AI use) + M-25-22 (AI procurement), 3 Apr 2025, implementing EO 14179 (23 Jan 2025). Two Trump EOs Dec 2025 + Jun 2026 reshaping federal AI + state pre-emption. ✅ VERIFIED
- **(c) TOP 7 tools/capabilities:**
  1. Materiality-determination process for cyber incidents (documented, prompt)
  2. 8-K Item 1.05 4-business-day disclosure workflow
  3. Board-level cyber governance + Item 106 annual disclosure
  4. Incident detection + forensics + severity scoring
  5. (Federal) Chief AI Officer + enterprise AI strategy + public use-case inventory
  6. (Federal) minimum risk-management practices for "high-impact" AI
  7. (Federal) AI procurement documentation (M-25-22)
- **(d) NEXT 7 dates/movements:**
  1. ✅ **23 Jan 2025** — EO 14179 "Removing Barriers to American Leadership in AI"
  2. ✅ **3 Apr 2025** — OMB M-25-21 + M-25-22 issued (rescind M-24-18)
  3. ✅ **11 Dec 2025** — Trump EO on national AI policy framework + state-law pre-emption
  4. ✅ **2 Jun 2026** — EO "Promoting Advanced AI Innovation and Security" (frontier-model cyber mandates + voluntary framework)
  5. ✅ **through May 2026** — ~78 Item 1.05 8-K filings analyzed; first AI-root-cause filing (CBFV)
  6. 🔶 **2026** — federal push to pre-empt state AI laws (litigation likely)
  7. 🔶 SEC posture: narrower, less aggressive cyber enforcement under new admin
- **Sources:** whitehouse.gov/presidential-actions/2026/06 · hunton.com (OMB M-25-21) · v-comply.com (SEC 2026) · lawfaremedia.org · cfr.org

---

## 11. Sector rules — HIPAA · PCI DSS 4.0.1 · SOX

### HIPAA Security Rule
- **(a)** USA healthcare · **(b)** Safeguards for ePHI; **NPRM (6 Jan 2025)** would make encryption + MFA mandatory (remove "addressable"), 72h incident reporting, annual pen-testing, BA oversight. ✅ VERIFIED
- **(c) TOP 7:** encryption at rest/in transit · MFA everywhere touching ePHI · asset inventory + network map · annual pen-test/vuln scan · 72h incident reporting · BA oversight/contracts · risk analysis + written policies
- **(d) Dates:** ✅ NPRM 6 Jan 2025 · ✅ comment period closed 7 Mar 2025 · 🔶 final rule targeted Spring 2026 **but NOT published as of Jun 2026** (industry pushback, ~$9B year-1 cost estimate) · 🔶 current Security Rule remains in effect · 🔶 uncertain final-rule timing under current admin
- **Sources:** hhs.gov/hipaa/for-professionals/security/hipaa-security-rule-nprm · hipaajournal.com/new-hipaa-regulations

### PCI DSS v4.0.1
- **(a)** Global (card payment) · **(b)** 12 requirements protecting cardholder data; v4.x adds 64 new reqs. ✅ VERIFIED
- **(c) TOP 7:** MFA for all CDE access · targeted risk analyses · anti-phishing/e-commerce script integrity (req 6.4.3/11.6.1) · continuous authenticated vuln scanning · access governance/least-privilege · encryption + key management · logging/monitoring
- **(d) Dates:** ✅ **31 Mar 2025** — all 51 future-dated reqs now MANDATORY (all 64 validated in assessments) 🚨 (v4.0.1 June-2024 revision did NOT change this date) · 🔶 2026 = first full assessment cycles against complete v4.x · 🔶 ongoing v4.x FAQ/guidance
- **Sources:** blog.pcisecuritystandards.org (future-dated reqs; v4.0.1) · guidepointsecurity.com

### SOX (ICFR / ITGC)
- **(a)** USA public companies · **(b)** Internal control over financial reporting; ITGCs (access, change mgmt, ops) underpin §404. 🔶
- **(c) TOP 7:** access controls/SoD · change management · IT ops/backup monitoring · control evidence/testing · audit trail & log integrity · risk & controls matrix (RCM) · **AI/ITGC over AI-in-finance tooling** (emerging)
- **(d) Dates:** 🔶 no new statutory dates; movement = auditors extending ITGC scope to AI-driven financial systems + automation of control testing (2026 trend)
- **Sources:** (analyst inference; no primary 2026 SOX instrument found in sweep — treat as 🔶)

---

## 12. NEW 2026 instruments — US State AI Laws

- **Colorado AI Act (SB24-205):** ✅ Amended by **SB 189 (14 May 2026)** — effective date delayed **June 2026 → 1 Jan 2027**; risk-based duty-of-care, impact assessments, risk-mgmt-program obligations SCALED BACK/eliminated. Enforcement delayed. 🚨
- **Texas TRAIGA (Responsible AI Governance Act):** ✅ signed 22 Jun 2025; **in effect 1 Jan 2026**. Prohibits AI for behavioral manipulation, discrimination, CSAM/unlawful deepfakes, constitutional-rights infringement; creates regulatory sandbox + AI Advisory Council. AG-enforced.
- **California:** ✅ multiple laws effective **1 Jan 2026** — AB 853 (AI Transparency Act), SB 53 (Transparency in Frontier AI Act — frontier-model safety/disclosure), AB 2013 (training-data disclosure), AB 316/325/489/621. Labeling, provenance, frontier risk governance.
- **Federal wildcard:** ✅ Trump EO (11 Dec 2025) seeks to PRE-EMPT state AI laws → litigation/uncertainty over CO/CA/TX enforceability through 2026-2027.
- **Sources:** hunton.com (CO delay to 2027) · mofo.com (CO reset) · lw.com (TRAIGA) · nortonrosefulbright.com (TRAIGA Jan 1) · natlawreview.com (CA 2026 laws) · kslaw.com (state laws + EO disruption)

---

## APPENDIX — Cross-cutting synthesis

### The 7 tool-capabilities that RECUR most across regulations → our product core
1. **AI/asset system inventory + use-case registry** (NIST RMF, CSF, EU AI Act, ISO 42001, DORA ROI, OMB M-25-21)
2. **Risk / impact assessment engine** (RMF, CSF GOVERN, EU AI Act, ISO 42001, GDPR DPIA, HIPAA, SOX RCM, CO/CA)
3. **Continuous monitoring + telemetry / drift & performance** (RMF Manage, CSF Detect, DORA, FedRAMP conMon, PCI, 42001)
4. **Logging / traceability / provenance + evidence collection** (EU AI Act Art.12, CSF, ISO, FedRAMP OSCAL, PCI, SOX audit trail) — *signed/immutable audit = our moat*
5. **Incident detection + tiered reporting workflow** (SEC 4-day, NIS2 24/72h, DORA, HIPAA 72h, GDPR 72h, PCI)
6. **Governance / policy / accountable-owner register + board oversight** (CSF GOVERN, EU AI Act, ISO 42001, NIS2 mgmt liability, SEC Item 106, OMB CAIO)
7. **Control mapping / crosswalk across frameworks** (42001↔27001↔NIST↔EU AI Act↔SOC2) + conformity/audit-readiness automation

> Nick's differentiators — **Ed25519-signed offline-verifiable audit trail** and **no-single-vendor / BFT-governed attestation** — map directly onto #4 and #6, which are the highest-recurrence, lowest-commoditized capabilities. That is the wedge.

### 5 MOST URGENT upcoming dates (all frameworks)
1. **10 Nov 2026** — CMMC 2.0 Phase 2: mandatory C3PAO Level-2 certification becomes default for DoD CUI contracts. ✅
2. **2 Dec 2026** — EU AI Act Art. 50 synthetic-content/watermarking disclosure in force (grace period cut to 3mo); chatbot transparency + nudifier/CSAM prohibitions. ✅
3. **30 Sep 2026** — FedRAMP Rev5 machine-readable (OSCAL) authorization package initial deadline. ✅
4. **Late 2026 / early 2027** — first DORA TLPT notifications issue to EU financial entities (starts the 3mo/6mo/12wk clock). ✅
5. **1 Jan 2027** — Colorado AI Act (as amended by SB 189) now takes effect (pushed from Jun 2026). ✅
   *(Runner-up, biggest structural signal: **2 Dec 2027** EU AI Act high-risk Annex III — delayed 16 months by the Omnibus.)*
