# MEOK 12-Framework Crosswalk — Master Compliance Matrix

**Source:** Hand-drafted by JEEVES (RALPH MODE). UK English. Comprehensive, technical. The master compliance matrix.

---

## 1. EU AI Act

- **Scope:** All AI systems deployed in the EU or whose outputs affect EU citizens.
- **Key Articles:** Article 5 (prohibited), Article 6 (high-risk), Article 9 (risk management), Article 10 (data governance), Article 13 (transparency), Article 14 (human oversight), Article 15 (accuracy, robustness, cybersecurity), Article 50 (transparency for non-high-risk).
- **Annexes:** Annex III (high-risk use cases), Annex IV (technical documentation).
- **MEOK MCPs:** eu-ai-act-compliance-mcp (Article 50 + Annex IV), meok-governance-engine-mcp (cross-framework mapping).

## 2. UK AI Bill

- **Scope:** In parliamentary draft (H2 2026 expected). Will regulate frontier AI developers + deployers of high-risk AI in the UK.
- **Key Principles:** 5 AISI voluntary commitments (safety case, third-party eval, info sharing, vuln disclosure, watermarking).
- **MEOK MCPs:** uk-ai-bill-compliance-mcp (readiness assessment, 100-point rubric), meok-governance-engine-mcp.

## 3. DORA (Digital Operational Resilience Act)

- **Scope:** Financial services ICT risk management in the EU. Applies from 17 Jan 2025.
- **5 Pillars:** ICT risk management, ICT-related incident reporting, digital operational resilience testing, managing of ICT third-party risk, information and intelligence sharing.
- **MEOK MCPs:** dora-compliance-mcp (5-pillar audit, 24h/72h incident classification).

## 4. NIS2 (Network and Information Security Directive 2)

- **Scope:** Cybersecurity for essential + important entities in the EU. Applies from 18 Oct 2024. 18,000+ entities in scope.
- **Article 21 (10 Measures):** Risk analysis, incident handling, business continuity, supply chain security, vuln handling, cryptography, access control, asset management, training, secure comms.
- **MEOK MCPs:** nis2-compliance-mcp (Article 21 10 measures, 24h incident reporting).

## 5. ISO 42001 (AI Management System)

- **Scope:** International standard for establishing, implementing, maintaining, and continually improving an AI management system. Issued Dec 2023.
- **Annex A Controls:** Governance, risk management, data AI lifecycle, human oversight, transparency, fairness, security, privacy.
- **MEOK MCPs:** iso-42001-ai-mcp (audit for Annex A controls).

## 6. GDPR DPIA (Data Protection Impact Assessment)

- **Scope:** EU General Data Protection Regulation. Article 35 (high-risk processing). Applies to AI systems processing personal data.
- **MEOK MCPs:** gdpr-compliance-ai-mcp (DPIA generation, data subject rights handling, breach notification).

## 7. HIPAA (Health Insurance Portability and Accountability Act)

- **Scope:** US healthcare. PHI (Protected Health Information) handling. Applies to health plans, clearinghouses, providers.
- **MEOK MCPs:** hipaa-compliance-mcp (safeguards, PHI handling, BAA generator).

## 8. SOC 2 (Service Organization Control 2)

- **Scope:** Trust Service Criteria for technology companies. Security, availability, processing integrity, confidentiality, privacy.
- **MEOK MCPs:** soc2-compliance-ai-mcp (audit-trail for SOC 2; MEOK doesn't issue the cert itself).

## 9. NIST AI RMF (Risk Management Framework)

- **Scope:** US federal AI deployers. Voluntary framework: Map → Measure → Manage → Govern.
- **MEOK MCPs:** nist-rmf-ai-mcp (risk profile, impact mapping).

## 10. AISI (UK AI Safety Institute Voluntary Commitments)

- **Scope:** UK frontier model developers. 5 commitments: safety case, third-party eval, info sharing, vuln disclosure, watermarking.
- **MEOK Alignment:** MEOK provides tooling for 3rd-party eval (BFT council), info sharing (SOV3 sigil chain), vuln disclosure (security.txt), watermarking (Ed25519 certs).

## 11. CAISI (California AI Safety Institute Voluntary Capabilities)

- **Scope:** US (California) frontier model developers. Similar to AISI.
- **MEOK Alignment:** MEOK provides tooling for 3rd-party eval, info sharing, vuln disclosure, watermarking for US-facing AI deployments.

## 12. Montreal / Toronto Declarations

- **Scope:** Ethical AI principles. Montreal (10 principles: well-being, autonomy, justice, privacy, knowledge, democracy, sustainability, responsibility, auditability, feasibility). Toronto (right to equality, non-discrimination, due process). 
- **MEOK Alignment:** Maternal Covenant (care-as-generative-principle for AI alignment) absorbs these ethical principles at layer 0.

---

**This matrix informs the 32-server MCP compliance fleet and the 4-day signed Ed25519 attestation.**
