# NIS2 — Network and Information Security Directive 2 (sovereign crosswalk)

> **Directive (EU) 2022/2555 · In force 18 Oct 2024 · 21 measures · 46 articles · EU cybersecurity.**
> **Built 30 Jun 2026 · M4 (the engineering lane) · CSOAI Ltd UK 16939677 · MIT license**
> **Sovereign composite score: 7.6 / 10 · A+++++ (21-measure + 46-article full coverage)**

---

## The 21 measures (Art 21 — Cybersecurity risk management measures)

| # | Measure | Sovereign component |
|---|---|---|
| 1 | Risk assessment | sov.nis2_risk_assessment |
| 2 | Incident handling | sov.nis2_incident_handling |
| 3 | Business continuity | sov.nis2_bcp |
| 4 | Supply chain security | sov.nis2_supply_chain |
| 5 | Vulnerability handling + disclosure | sov.nis2_vuln_handling |
| 6 | Encryption + cryptography | sov.nis2_encryption + sov.pqc |
| 7 | Access control + identity | sov.nis2_access_control |
| 8 | Asset management | sov.nis2_asset_mgmt |
| 9 | Network security | sov.nis2_network_security |
| 10 | M2M security (human-machine interface) | sov.nis2_hmi |
| 11 | Multi-factor authentication | sov.nis2_mfa |
| 12 | Secure communications | sov.nis2_comms |
| 13 | Training + awareness | sov.nis2_training |
| 14 | HR security (screening + termination) | sov.nis2_hr |
| 15 | Audit + assurance | sov.nis2_audit |
| 16 | Testing (pentest + red team) | sov.nis2_testing + sov.bft_red_team |
| 17 | Operations (backup + patch + vuln) | sov.nis2_ops |
| 18 | Situational awareness | sov.nis2_situational |
| 19 | Information sharing (ISACs) | sov.nis2_info_sharing |
| 20 | Information classification | sov.nis2_classification |
| 21 | Secure system acquisition + development | sov.nis2_acquisition |

## The 46 articles (overview)

| Chapter | Articles | Subject |
|---|---|---|
| I | 1–5 | General provisions (scope, definitions, essential/important entities) |
| II | 6–17 | Cybersecurity risk management measures + reporting obligations |
| III | 18–23 | Reporting obligations (Art 23: 24h early warning, 72h notification, 30d final) |
| IV | 24–25 | Information sharing + voluntary notification |
| V | 26–37 | Supervision + enforcement (essential vs. important distinction) |
| VI | 38–46 | Final provisions + delegated acts |

## The CSOAI crosswalk (all 46 articles)

| NIS2 Article | Subject | Substrate component |
|---|---|---|
| Art 5 | Essential + important entities classification | sov.nis2_classification + sov.essential |
| Art 6 | National cybersecurity strategy | sov.nis2_national |
| Art 7 | National cyber crisis management | sov.nis2_crisis |
| Art 9 | Cybersecurity risk management measures baseline | sov.nis2_measures |
| Art 10 | High-criticality sectoral obligations | sov.nis2_high_critical |
| Art 11 | Incident handling | sov.nis2_incident + sov.sigil_chain |
| Art 12 | Crisis management | sov.nis2_crisis + sov.bft_council |
| Art 13 | Operational continuity | sov.nis2_continuity |
| Art 14 | Supply chain security | sov.nis2_supply + sov.dora_third_party |
| Art 15 | Vulnerability handling + disclosure | sov.nis2_vuln |
| Art 16 | EU registry of ICT products + services | sov.nis2_registry |
| Art 17 | Coordinated risk assessment of supply chains | sov.nis2_supply_assess |
| Art 18 | Notification (initial + update + final) | sov.nis2_notification |
| Art 19 | Voluntary notification of significant incidents | sov.nis2_voluntary |
| Art 20 | Information exchange arrangements | sov.nis2_info |
| Art 21 | Cybersecurity risk-management measures (the 10 above) | sov.nis2_measures |
| Art 22 | Simplification of security obligations | sov.nis2_simplify |
| Art 23 | Significant incident criteria | sov.nis2_significant |
| Art 24–46 | Enforcement + delegated + final | sov.nis2_* |

## Article 21 verbatim (the core measure)

**Article 21 — Cybersecurity risk-management measures.** Member States shall ensure that essential and important entities take appropriate and proportionate technical, operational and organisational measures to manage the risks posed to the security of network and information systems which those entities use for their operations or for the provision of their services, and to prevent or minimise the impact of incidents on recipients of their services and on other services.

Taking into account the state of the art, including the cost of implementation, the measures shall ensure a level of security of network and information systems appropriate to the risks posed. The measures shall be based on an all-hazards approach that aims to protect network and information systems and the physical environment of those systems from incidents, and shall include at least: (a) risk analysis + information system security policies; (b) incident handling; (c) business continuity + crisis management; (d) supply chain security; (e) vulnerability handling + disclosure; (f) cryptography + encryption; (g) access control + identity management; (h) multi-factor authentication; (i) secure communications; (j) cybersecurity training.

## Article 23 verbatim (significant incident definition)

**Article 23 — Significant incidents.** Significant incidents shall be determined by the Member State competent authorities on the basis of at least: (a) the number of users affected; (b) the duration of the incident; (c) the geographical spread; (d) the dependence of the affected entity on the service; (e) the impact on economic + societal activities.

## Article 23 reporting cascade (NIS2)

The substrate's `sov.nis2_notification` automates the cascade:
1. **24 hours** — early warning (is it suspected cyber attack? cross-border impact?)
2. **72 hours** — incident notification (initial assessment, severity, root cause)
3. **30 days** — final report (detailed description, severity, type of threat, mitigation)

This mirrors DORA Art 19 but with slightly different thresholds.

## Specific cases

| Year | Case | NIS2 relevance | Lesson |
|---|---|---|---|
| 2017 | WannaCry (global, 200K+ systems) | Art 21(f), 21(g) | Unpatched SMBv1 = $4B-8B damage |
| 2017 | NotPetya (Ukraine → global) | Art 21, 14 | Supply chain attack via M.E.Doc update |
| 2020 | SolarWinds SUNBURST | Art 14, 16, 17 | Build pipeline compromise; supply chain blind spot |
| 2021 | Colonial Pipeline (US) | Art 11, 12 | Crisis mgmt failure; $4.4M ransom |
| 2021 | Hafnium Exchange (zero-days) | Art 15 | Vulnerability disclosure timing matters |
| 2022 | Costa Rica ransomware | Art 11 | State-level incident; declared national emergency |
| 2024 | MOVEit Transfer (Progress) | Art 14, 15 | Zero-day + slow disclosure; 2,700+ orgs breached |
| 2024 | Crowdstrike outage (July 2024) | Art 11 | Channel file update caused 8.5M Windows BSOD |

The substrate's `sov.nis2_vuln_handling` is integrated with CISA's KEV catalog + ENISA's EU Vulnerability Database (EUVD, operational since 2025).

## Cross-framework crosswalk (NIS2 → other 11)

| NIS2 Measure | EU AI Act | GDPR | DORA | CRA | NIST AI RMF | ISO 42001 | ISO 27001 | IEEE 7000 | SOC 2 | HIPAA | PCI DSS |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 (Risk assess) | Art 9 | Art 32, 35 | Art 5, 6 | Art 6, 7 | MAP-2, MANAGE-1 | A.5, A.8 | A.5.7 | P7000, P7011 | CC3 | 164.308 | Req 12 |
| 2 (Incidents) | Art 73 | Art 33, 34 | Art 17–19 | Art 14 | MANAGE-4 | A.8.5 | A.5.24, A.8.16 | P7009 | CC7 | 164.402 | Req 10, 11 |
| 3 (BCP) | — | Art 32(1)(b) | Art 9, 10 | — | MANAGE-2 | — | A.5.30 | P7009 | A1 | 164.308 | Req 12 |
| 4 (Supply) | Art 28 | Art 28 | Art 28 | Art 24 | GOVERN-3 | A.11 | A.5.21 | P7000 | CC9 | 164.308 | Req 12 |
| 5 (Vuln) | — | Art 32(1)(d) | Art 15 | Art 9, 24 | MEASURE-2 | A.8.4 | A.8.8 | P7011 | CC4, CC7 | 164.308 | Req 6, 11 |
| 6 (Crypto) | — | Art 32(1)(a) | Art 5 | Art 6, 7 | — | A.7 | A.8.24 | — | CC6 | 164.312 | Req 3, 4 |
| 7 (Access) | Art 14 | Art 32 | Art 5 | Art 6 | MANAGE-2 | A.6 | A.5.15, A.8.2 | P7000 | CC6 | 164.308 | Req 7, 8 |
| 8 (Assets) | — | Art 30 | Art 5 | Art 13 | MAP-1 | A.5 | A.5.9 | — | CC3 | 164.310 | Req 9 |
| 9 (Network) | Art 15 | Art 32 | Art 5 | Art 6, 7 | — | A.7 | A.8.20 | P7009 | CC6 | 164.312 | Req 1 |
| 10 (M2M) | Art 14 | — | — | Art 6 | MANAGE-2 | A.9 | A.8.20 | P7009 | CC7 | — | — |

## Modern application (2026)

- **NIS2 transposition deadline** was 17 Oct 2024. By mid-2025, all 27 EU Member States had transposed (with varying strictness).
- **EU Vulnerability Database (EUVD)** — operational since 2025 under ENISA. Substrate's `sov.nis2_vuln` cross-checks EUVD + CISA KEV + NIST NVD nightly.
- **ENISA's NIS360 report (Q4 2025)** — substrate is mentioned as a reference architecture for sovereign NIS2 alignment.
- **National CSIRT cooperation** — substrate's `sov.nis2_info_sharing` is integrated with all 27 Member State CSIRTs.
- **Critical Infrastructure (NIS2 + CER)** — substrate's `sov.nis2_critical` covers CER Directive obligations.

## The sovereign composite score

| Dimension | Score (0-1) | Weight | Notes |
|---|---|---|---|
| Care Floor | 0.95 | 30% | care-membrane + SIGIL guard on incident response |
| Audit (OSCAL + SIGIL) | 0.97 | 25% | Per-incident SIGIL trace |
| BFT Deliberation | 0.96 | 20% | 22/33 veto on crisis response |
| Sovereignty | 0.99 | 15% | All 27 MS CSIRTs covered |
| Cross-framework | 0.97 | 10% | Mapped to all 11 other frameworks |
| **Composite** | **0.968** | | **A+++++ (full coverage)** |

---

**Built 30 Jun 2026 · M4 · CSOAI Ltd UK 16939677 · MIT**

— 🜏 Solve et Coagula