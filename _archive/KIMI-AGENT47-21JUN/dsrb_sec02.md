## 2. Global Regulatory Convergence — One Platform, All Frameworks

The single most important strategic fact about operational resilience regulation in 2025 is this: frameworks developed in isolation over a decade are converging on the same five requirements. The EU's Digital Operational Resilience Act (DORA) entered into force on January 17, 2025 [^873^]. Australia's CPS 230, effective July 1, 2025, was explicitly modeled on DORA [^857^]. Singapore's MAS TRM Notice became legally binding in May 2024 with enforcement metrics that command board attention [^856^]. The US FFIEC CAT sunsets on August 31, 2025, forcing a transition to NIST CSF 2.0 [^870^]. Germany's BAIT faces full repeal by December 2026 as DORA supersedes it [^890^].

For institutions operating across even two jurisdictions, compliance is an exercise in multi-dimensional mapping — tracking overlapping obligations, divergent timelines, and subtly different definitions of the same control. Those that recognize the convergence pattern can architect a unified resilience program that satisfies multiple regulators simultaneously.

This section maps the ten major frameworks, identifies the five universal requirements, and provides a sequenced go-to-market priority framework.

### 2.1 The 10 Major Frameworks

#### 2.1.1 EU: DORA (January 2025) + TIBER-EU (Updated February 2025)

The EU Digital Operational Resilience Act (Regulation 2022/2554) is the most comprehensive operational resilience regulation ever enacted. It applies to over 22,000 financial entities across the European Union and, critically, extends extraterritorially to non-EU ICT service providers that serve them [^871^]. DORA's scope covers five pillars: ICT risk management, incident reporting, resilience testing, third-party risk management, and information sharing.

Article 26 of DORA mandates Threat-Led Penetration Testing (TLPT) for all "significant entities" at least every three years, with the Commission Delegated Regulation (EU) 2025/1190 specifying the Regulatory Technical Standards effective July 8, 2025 [^873^]. The TLPT requirement is not a paper exercise. It demands live production system testing by accredited Threat Intelligence Providers (TIPs) and Red Team Testers (RTTs), with purple-teaming debriefs now made mandatory under the 2025 standards [^864^].

The ECB updated TIBER-EU in February 2025 to align fully with DORA's TLPT RTS [^862^], introducing mandatory purple-teaming, updated terminology (replacing "White Team" with "Control Team"), and simplified national adoption procedures [^873^]. Tests span 9-12 months for the full lifecycle with 10-12 weeks of active testing, covering at minimum three threat scenarios addressing confidentiality, integrity, and availability [^864^]. Every significant EU financial institution must now manage a continuous TLPT lifecycle on a triennial cycle at minimum — a complex orchestration challenge across multiple member state entities.

#### 2.1.2 UK: CBEST (Bank of England, 2014) + GBEST (Global Extension)

CBEST (Threat Intelligence-Led Penetration Testing) was the world's first central bank-led cybersecurity testing framework when the Bank of England launched it in 2014 [^863^]. Developed in partnership with CREST (Council of Registered Ethical Security Testers), CBEST established the template that TIBER-EU and, subsequently, DORA TLPT would follow. CBEST targets the UK's Systemically Important Financial Institutions (SIFIs) and operates through a structured five-phase lifecycle: initiation, threat intelligence, penetration testing, detection and response assessment, and remediation [^858^].

What distinguishes CBEST from other frameworks is its accreditation rigor. Both Threat Intelligence Providers and penetration testers must hold specific CREST certifications — CCTIM (Certified Threat Intelligence Manager), CCSAM (Certified Simulated Attack Manager), and CCSAS (Certified Simulated Attack Specialist) — and must be CBEST-accredited by the Bank of England itself [^858^]. This creates a constrained provider market and a high bar for test quality that has made CBEST the global gold standard for intelligence-led testing.

GBEST (Global Benchmark for Enhanced Security Testing) extends the CBEST methodology internationally as a voluntary benchmark for non-UK institutions [^863^]. While CBEST carries UK regulatory force, GBEST provides the same testing rigor as a market-driven standard. For institutions in jurisdictions without mandatory threat-led testing regimes, GBEST offers a stepping stone toward TIBER-EU or DORA TLPT compliance. The Bank of England has confirmed that CBEST aligns with DORA's TLPT requirements, meaning institutions with existing CBEST programs have a migration path rather than a replacement requirement.

#### 2.1.3 US: NIST CSF 2.0 (February 2024) + FFIEC CAT (Sunset August 2025)

The American regulatory landscape is in forced transition. The FFIEC CAT, used by examiners as the de facto assessment baseline since 2015, will be removed from the FFIEC website on August 31, 2025 [^870^]. The FFIEC determined not to update CAT to reflect NIST CSF 2.0 or CISA Cybersecurity Performance Goals [^875^].

The recommended replacement, NIST Cybersecurity Framework 2.0, published February 26, 2024, introduces a sixth core function: **Govern (GV)** [^893^], with 31 subcategories elevating cybersecurity governance to a standalone pillar [^884^]. The Supply Chain Risk Management category (GV.SC) contains 10 subcategories, reflecting heightened focus on third-party risk that aligns directly with DORA Article 28 and CPS 230's Material Service Provider requirements [^887^]. With 54% global adoption according to Fortra's 2025 survey, CSF 2.0 has become the de facto international standard [^909^]. The NCUA will continue supporting its ACET tool (based on CAT) for credit unions [^874^], creating a bifurcated landscape even within the US.

#### 2.1.4 Australia: APRA CPS 230 (Effective July 2025)

APRA CPS 230 is the newest major framework in the global operational resilience architecture. Effective July 1, 2025, it consolidates and replaces two previous standards — CPS 231 (Outsourcing) and CPS 232 (Business Continuity Management) — into a single comprehensive framework [^855^]. CPS 230 applies to all APRA-regulated entities: banks, insurers, and superannuation trustees.

CPS 230 is explicitly modeled on DORA but takes a broader approach. Where DORA focuses specifically on ICT risk, CPS 230 encompasses all operational risk — ICT and non-ICT alike [^905^]. This broader scope means that compliance programs designed for CPS 230 will satisfy DORA's ICT-specific requirements but not vice versa. The framework requires board and senior management direct accountability for operational resilience, notification to APRA within 72 hours for material incidents, comprehensive Material Service Provider management extending to fourth-party suppliers, and integrated scenario testing [^855^].

APRA retains the right to inspect service providers directly — a power that mirrors DORA's oversight of critical ICT third-party providers but extends more broadly. For global institutions operating in both Australia and the EU, CPS 230's broader scope should be the design anchor, with DORA's ICT-specific requirements treated as a subset.

#### 2.1.5 Singapore: MAS TRM (Binding Since May 2024)

Singapore's Technology Risk Management framework operates through a two-tier structure: the TRM Guidelines (principles-based, revised January 2021) and the legally binding Notices — specifically FSM N21, effective May 10, 2024 [^856^]. The Notice mandates six requirements: a framework for identifying critical systems, high availability efforts, a Recovery Time Objective of no more than 4 hours for critical systems, 1-hour incident notification to MAS, a root cause analysis report within 14 days, and IT controls to protect customer information [^856^].

The enforcement data commands attention. Between July 2023 and December 2024, MAS opened 163 enforcement cases, secured 33 criminal convictions, and levied $4.4 million in financial penalties plus $7.16 million in civil penalties [^854^]. The Financial Services and Markets Bill increased maximum penalties for data breaches to $1 million per incident [^854^].

The 2021 TRM revision significantly increased cyber-focused content ("cyber" appears 74 times versus 4 in the 2013 version) [^853^]. Singapore's CTREX Panel, established September 2024, further bolsters best practices. For institutions operating in ASEAN, MAS TRM compliance is increasingly a license to operate.

#### 2.1.6 Germany: BAIT (Full Repeal December 2026)

BAIT (Bankaufsichtliche Anforderungen an die IT), BaFin's circular setting out supervisory IT requirements for German banks, is being systematically dismantled as DORA supersedes national frameworks. The timeline is precise: DORA applied directly in Germany from January 17, 2025; VAIT, KAIT, and ZAIT (the insurance, asset management, and payment services equivalents) were repealed on January 16, 2025; BAIT Chapter 11 was removed in December 2024; and full BAIT repeal is scheduled for December 31, 2026 [^890^].

All institutions subject to DORA Sections 5-15 or 16 are now excluded from BAIT's scope [^890^]. The German Act on the Digitization of the Financial Market (FinmadiG), adopted in December 2024, extended DORA's scope further. Non-CRR institutions — financial service institutions that fall outside the Capital Requirements Regulation — must comply by January 1, 2027.

BAIT's 12-chapter structure covering IT strategy, governance, risk management, information security, operational security, identity management, ICT operations, projects, application development, outsourcing, external procurement, and business continuity [^892^] will be replaced by DORA's five-pillar architecture. For German institutions, the transition is not a choice but a countdown. Those that have not yet begun mapping BAIT controls to DORA requirements are already behind.

### 2.2 The 5 Universal Convergent Requirements

Across all ten frameworks and six jurisdictions, five requirements appear without exception. These are not superficial similarities — they represent structural convergence on what regulators worldwide believe constitutes operational resilience. A platform that addresses these five requirements comprehensively can serve any jurisdiction, any framework, any institution.

#### 2.2.1 Board-Level Governance

Every framework places direct, non-delegable accountability for operational resilience at the board level. DORA requires management body approval of the ICT risk management framework [^871^]. CBEST mandates board-level reporting and supervisor oversight [^858^]. TIBER-EU's Control Team includes senior leadership with regulator oversight [^862^]. NIST CSF 2.0's Govern function makes cybersecurity governance a standalone pillar [^884^]. APRA CPS 230 specifies "direct accountability" [^855^]. MAS TRM requires board and senior management to be "actively involved" [^853^]. BAIT demands quarterly board reporting and ICT competency [^886^].

The convergence is clear: operational resilience is no longer an IT department matter. It is a board matter. The implication for platform design is that any solution must produce board-ready outputs — dashboards, risk postures, compliance attestations — that directors can consume without technical mediation.

#### 2.2.2 Threat Intelligence Integration

Threat intelligence is the connective tissue between frameworks. CBEST was built on intelligence-led testing from inception [^863^]. TIBER-EU requires threat intelligence to drive all scenarios, with the TIP producing a Targeted Threat Intelligence Report before testing begins [^859^]. DORA's TLPT RTS mandates at least three threat scenarios covering confidentiality, integrity, and availability [^864^]. NIST CSF 2.0's GV.RM includes threat landscape awareness [^884^]. APRA CPS 230 requires scenario testing informed by threat intelligence [^855^]. MAS TRM mandates real-time monitoring [^853^].

A unified platform must ingest threat intelligence from multiple sources and map it to test scenarios, control gaps, and risk assessments across all applicable frameworks simultaneously.

#### 2.2.3 Third-Party Risk Management

Third-party risk has moved from advisory to mandatory across every jurisdiction. DORA Article 28 mandates oversight of critical ICT third-party providers with specific contractual requirements [^871^]. NIST CSF 2.0 dedicates 10 subcategories to supply chain risk in GV.SC [^887^]. APRA CPS 230 extends oversight to fourth-party suppliers [^855^]. MAS TRM's fourth pillar is dedicated to third-party risk [^853^]. FFIEC CAT's Domain 4 addressed External Dependency Management [^899^]. Even CBEST now provides guidance on third-party scenarios [^858^].

#### 2.2.4 Incident Reporting

Incident reporting timelines are where jurisdictional differences are most acute — and where a unified platform delivers the greatest compliance value. DORA requires initial notification within 24 hours, intermediate reporting within 72 hours, and final reporting within one month [^871^]. APRA CPS 230 requires 72-hour notification for material incidents [^855^]. MAS TRM mandates 1-hour notification to MAS with a 14-day root cause analysis report [^856^]. NIST CSF 2.0's Respond function (RS.CO) addresses reporting coordination [^911^]. The table below summarizes the reporting landscape:

| Jurisdiction / Framework | Initial Notification | Follow-Up Report | Root Cause Analysis | Key Differentiator |
|---|---|---|---|---|
| **EU (DORA)** | 24 hours [^871^] | 72 hours (intermediate) | 1 month (final) | Three-tier cascading reports; applies to ICT-related incidents |
| **Australia (CPS 230)** | 72 hours [^855^] | As required by APRA | Included in incident management | Materiality threshold; broader than ICT-only |
| **Singapore (MAS TRM)** | 1 hour [^856^] | Ongoing updates | 14 days | Fastest globally; applies to all "relevant incidents" |
| **UK (CBEST)** | Within remediation plan | Detection & Response assessment | Board-level report | Embedded in TLPT lifecycle, not standalone |
| **US (NIST CSF 2.0)** | Per organizational policy | RS.CO coordination | After-action review | Voluntary standard; no statutory timeline |

For an institution operating in even two of these jurisdictions, a single incident may trigger multiple overlapping reporting obligations with different timelines, different content requirements, and different materiality thresholds. The operational risk of missing a notification window is measured in regulatory penalties and reputational damage. Automation is not optional — it is essential.

#### 2.2.5 Regular Testing

All frameworks mandate regular, structured testing of security controls, incident response capabilities, and business continuity plans. DORA requires TLPT every three years for significant entities [^862^]. CBEST operates on a risk-based frequency determined by PRA supervision [^858^]. APRA CPS 230 requires integrated scenario testing with annual business continuity plan effectiveness reviews [^855^]. MAS TRM mandates penetration testing and disaster recovery testing [^853^]. BAIT requires simulated attacks and annual BCP effectiveness reviews [^886^]. NIST CSF 2.0's Govern function (GV.OV) mandates continuous improvement through regular oversight [^884^].

The testing convergence creates an opportunity for "test once, satisfy many" — a single TLPT exercise, properly scoped and documented, can generate evidence for DORA, CPS 230, MAS TRM, and NIST CSF 2.0 simultaneously. The key is platform-based evidence management that maps test outputs to each framework's specific evidentiary requirements.

### 2.3 Go-To-Market Priority Map

The convergence pattern reveals a clear sequencing logic for institutions building cross-border operational resilience capabilities and for the platforms that serve them. The following priority map is based on regulatory deadline urgency, market size, framework alignment, and enforcement intensity.

| Priority | Market | Framework(s) | Rationale | Addressable Institutions | Timeline Urgency |
|---|---|---|---|---|---|
| **1 — Immediate** | **European Union** | DORA + TIBER-EU | Largest unified market; extraterritorial reach; TLPT RTS enforcement begins July 2025; 22,000+ entities under scope | 22,000+ financial entities + non-EU ICT providers | **Critical — live** |
| **2 — Near-term** | **Australia** | APRA CPS 230 | Explicitly modeled on DORA; enables rapid product extension; broad scope (all operational risk) | 500+ APRA-regulated banks, insurers, super funds | **High — effective Jul 2025** |
| **3 — Active** | **Singapore** | MAS TRM | Legally binding since May 2024; aggressive enforcement (163 cases, $11.5M penalties); ASEAN gateway | 1,500+ MAS-regulated institutions | **High — enforcing now** |
| **4 — Transition** | **United States** | NIST CSF 2.0 (post-FFIEC CAT) | Forced CAT-to-CSF migration creates disruption/opportunity; largest individual market; 10,000+ institutions | 10,000+ financial institutions | **Medium — transition window through 2026** |
| **5 — Strategic** | **United Kingdom** | CBEST + evolving post-Brexit regime | CBEST confers methodological credibility; Bank of England influence on global standards; post-Brexit divergence risk | UK SIFIs + CBEST-aligned global firms | **Medium — stable but evolving** |

The sequencing logic is straightforward. The EU offers the largest addressable market with the most urgent deadlines and greatest extraterritorial leverage — non-EU technology providers serving EU financial institutions must comply with DORA regardless of location [^871^]. Australia's CPS 230 alignment with DORA enables rapid product extension, and its broader scope (all operational risk, not just ICT) makes it the more comprehensive design standard [^905^]. Singapore's enforcement intensity and role as the ASEAN financial hub make it a high-priority market despite smaller size [^854^]. The US CAT-to-CSF transition creates disruption opportunity, but CSF 2.0's voluntary nature reduces urgency [^870^]. The UK remains strategically important due to CBEST's methodological influence, though post-Brexit divergence introduces uncertainty.

The recommendation for institutions: architect compliance programs around CPS 230's broadest-in-class scope, map to DORA's ICT-specific requirements, add Singapore's 1-hour notification capability, and position for NIST CSF 2.0 adoption in the US. A platform handling this sequence can address every other framework as a derivative. The convergence reflects a global consensus on operational resilience in an era of systemic digital risk — the institutions and platforms that recognize this pattern first will define the standard.
