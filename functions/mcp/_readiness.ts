/**
 * MCP adapter for the free tool `framework_readiness` (2026-11-02, lane csoai-frontend-consol).
 *
 * WHAT IT IS. A deterministic readiness checklist over nine governance frameworks. The caller names
 * one framework and optionally a sector and a role; the tool returns, for each checklist item, the
 * published provision it is keyed to, a plain-words requirement summary, the evidence that would
 * show readiness for it, and the question it opens for the caller's own compliance function.
 *
 * WHAT IT IS NOT. It runs no model, fetches nothing, scores nothing and certifies nothing: there is
 * no score, no pass/fail, no status word for the caller's state. It measures nothing about the
 * caller — it lays out what evidence WOULD be measured. A checklist is preparation, never a
 * determination; the output says so in a not_a_certification field and in the header line.
 *
 * WHY FRESH CODE. The estate's earlier framework MCP scaffolds (meok-active-systems mcp-*) carry
 * placeholder logic ("audit": "placeholder", score 0.0) and are not a source for anything public.
 * This module was written from the frameworks' published provisions; where a provision summary could
 * be wrong in a detail, the item opens the question instead of asserting an answer.
 *
 * DETERMINISM. Pure functions over the arguments: no clock, no network, no randomness. The same
 * arguments always produce byte-identical structured content, so a caller can cache it and quote it.
 */
import type { McpToolResult } from "./_handlers";

export const READINESS_TOOL_NAMES = new Set(["framework_readiness"]);

type Item = {
  id: string;
  /** The published provision the item is keyed to (regulation/directive article or standard clause). */
  provision: string;
  /** Plain-words summary of what the provision asks for. Not legal advice. */
  requirement: string;
  /** The evidence that would show readiness for this item, ready to be measured or collected. */
  evidence_suggested: string;
  /** The question this item opens for the caller's own compliance function. */
  opens_question: string;
};

type Framework = {
  id: string;
  label: string;
  /** One sentence on what the instrument is. */
  what: string;
  /** Published sources a reader can check without an account. */
  provenance: string[];
  items: Item[];
};

const FRAMEWORKS: Framework[] = [
  {
    id: "eu-ai-act",
    label: "EU AI Act (Regulation (EU) 2024/1689)",
    what: "The EU's horizontal AI law: obligations that phase in by risk tier and by actor role, with transparency duties already in force.",
    provenance: [
      "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
      "https://artificialintelligenceact.eu/ (independent implementation tracker)",
    ],
    items: [
      {
        id: "euai-1",
        provision: "Article 50 (transparency obligations)",
        requirement:
          "Tell people when they interact with an AI system where that is required, and mark synthetic audio/image/video/text output in a machine-readable way where the system generates it.",
        evidence_suggested:
          "An inventory of user-facing AI touchpoints with the disclosure each one shows, plus the marking step in the content-generation pipeline and where its marker can be read back.",
        opens_question:
          "Which of your deployed outputs count as synthetic content under the article, and who verifies the marker survives export and re-upload?",
      },
      {
        id: "euai-2",
        provision: "Article 9 (risk-management system)",
        requirement:
          "Run a continuous, iterative, documented risk-management process across the system's lifecycle for high-risk systems: identify, estimate, evaluate, treat and re-test residual risk.",
        evidence_suggested:
          "A dated risk-management file per in-scope system showing iterations over time, the hazards considered, and the residual-risk sign-offs.",
        opens_question:
          "Which systems in your portfolio are high-risk under Article 6 / Annex III, and who owns the file when the system is updated?",
      },
      {
        id: "euai-3",
        provision: "Article 10 (data and data governance)",
        requirement:
          "Document the training, validation and testing data sets: design choices, provenance, relevance, and examination for biases that could lead to prohibited discrimination.",
        evidence_suggested:
          "Dataset records (origin, licence, collection method, known gaps) plus the bias-examination results and what was changed because of them.",
        opens_question:
          "Where did each dataset actually come from, and is the bias examination re-run when the deployment population differs from the training population?",
      },
      {
        id: "euai-4",
        provision: "Articles 12 and 19 (record-keeping)",
        requirement:
          "Enable automatic event logging over the system's lifetime and keep the logs at least six months (or as agreed) for high-risk systems.",
        evidence_suggested:
          "A log specification per system: which events, what fields, retention period, and where an auditor can read one back.",
        opens_question:
          "Do the logs capture enough for post-incident reconstruction, and do retention periods respect the data-protection floor at the same time?",
      },
      {
        id: "euai-5",
        provision: "Article 14 (human oversight)",
        requirement:
          "Design high-risk systems so a competent person can oversee them: understand limits, remain aware of automation bias, interpret output correctly, and stop or override the system.",
        evidence_suggested:
          "The oversight roles, the stop/override mechanism demonstrated working, and training records for the people holding those roles.",
        opens_question:
          "In practice, can the operator actually intervene mid-run, or only after the fact — and does anyone rehearse it?",
      },
      {
        id: "euai-6",
        provision: "Articles 15 and 72 (accuracy, robustness, post-market monitoring)",
        requirement:
          "Measure accuracy and robustness against declared metrics, resist attempts to alter use or performance, and run a post-market monitoring plan that feeds incidents back.",
        evidence_suggested:
          "The declared metrics with current results, and the post-market monitoring plan with its data sources and review cadence.",
        opens_question:
          "What metric threshold triggers re-evaluation or withdrawal, and who is watching the monitors?",
      },
      {
        id: "euai-7",
        provision: "Articles 16-17 vs 26 (provider vs deployer duties)",
        requirement:
          "Providers carry quality-management and technical-documentation duties; deployers carry use-side duties (instructions followed, input data relevant, human oversight, logs kept, workers informed, DPIA where required).",
        evidence_suggested:
          "A role map: for each system, who the provider is, who the deployer is, and which duties each has accepted in writing.",
        opens_question:
          "Where you deploy someone else's system, have you actually received the instructions and documentation the deployer duties assume you were given?",
      },
    ],
  },
  {
    id: "dora",
    label: "DORA (Regulation (EU) 2022/2554)",
    what: "The EU's digital operational resilience act for financial entities: ICT risk, incident reporting, resilience testing and third-party oversight.",
    provenance: [
      "https://eur-lex.europa.eu/eli/reg/2022/2554/oj",
      "https://www.eiopa.europa.eu/digital-operational-resilience-act-dora_en",
    ],
    items: [
      {
        id: "dora-1",
        provision: "Articles 5-6 (ICT risk-management framework and governance)",
        requirement:
          "Have a sound, comprehensive, documented ICT risk framework, with management-body accountability for it and a role assigned for ICT third-party risk.",
        evidence_suggested:
          "The framework document with version history, the management-body minutes that approved it, and the named risk-function owner.",
        opens_question:
          "Does the framework actually constrain procurement and change decisions, or does it live beside them?",
      },
      {
        id: "dora-2",
        provision: "Articles 8-10 (ICT systems, backup, continuity)",
        requirement:
          "Identify and document ICT-supported business functions and systems; have backup and restore capability and a business-continuity policy, tested.",
        evidence_suggested:
          "The ICT asset/function inventory, backup-restore test results with restore times, and continuity test reports.",
        opens_question:
          "When was the last restore actually performed end-to-end, and did it meet the recovery objectives you published?",
      },
      {
        id: "dora-3",
        provision: "Articles 17-23 (incident classification and reporting)",
        requirement:
          "Classify ICT incidents against defined materiality thresholds and report major ones to authorities on the regulatory timeline (initial, intermediate, final).",
        evidence_suggested:
          "The classification matrix as applied to past incidents, and a drill record showing a report assembled inside the timeline.",
        opens_question:
          "Could you assemble a defensible major-incident report in hours, not days — and who speaks to the authority?",
      },
      {
        id: "dora-4",
        provision: "Articles 24-27 (digital operational resilience testing)",
        requirement:
          "Run a testing programme proportionate to the entity, up to threat-led penetration testing (TLPT) for significant entities at least every three years.",
        evidence_suggested:
          "The test plan and evidence of completed tests, findings tracked to closure, and TLPT scheduling where applicable.",
        opens_question:
          "Which findings from the last test round are still open, and does the register say why?",
      },
      {
        id: "dora-5",
        provision: "Articles 28-30 (third-party risk and the register of information)",
        requirement:
          "Manage ICT third-party risk across the whole lifecycle and keep a register of information on all ICT third-party arrangements, at entity and consolidated levels.",
        evidence_suggested:
          "The register of information (contracts, criticality, subcontractors, locations) and the exit strategies for critical providers.",
        opens_question:
          "Can you name every fourth party your critical providers rely on, and what happens if a critical one fails next week?",
      },
      {
        id: "dora-6",
        provision: "Article 29-44 (oversight of critical ICT third-party providers)",
        requirement:
          "If you ARE an ICT third-party provider to financial entities, expect designation, oversight and possible sanction at entity level; contracts must enable it.",
        evidence_suggested:
          "The contract clauses that enable oversight and access, and the self-assessment against the oversight criteria.",
        opens_question:
          "For providers: which of your contracts predate DORA and have never been renegotiated to carry the required clauses?",
      },
    ],
  },
  {
    id: "nis2",
    label: "NIS2 (Directive (EU) 2022/2555)",
    what: "The EU's network-and-information-security directive: minimum cybersecurity risk-management measures and incident reporting for essential and important entities.",
    provenance: [
      "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      "https://digital-strategy.ec.europa.eu/en/policies/nis2-directive",
    ],
    items: [
      {
        id: "nis2-1",
        provision: "Articles 18 and 20 (registration and governance)",
        requirement:
          "Register with the competent authority where required, and ensure management bodies approve and can be trained on the cybersecurity risk measures, with liability for infringement.",
        evidence_suggested:
          "The registration record (or a documented position on why the entity is out of scope), and management-body training attendance.",
        opens_question:
          "Has the entity determined in writing whether it is in scope, and on what classification reasoning?",
      },
      {
        id: "nis2-2",
        provision: "Article 21(2)(a)-(b) (risk analysis, incident handling)",
        requirement:
          "Apply risk-analysis and information-system-security policies, and handle incidents: prevention, detection, response, recovery — with the Article 23 reporting timeline (early warning within 24 hours, notification within 72, final report within a month).",
        evidence_suggested:
          "The policies as applied, an incident log with classification, and a timed tabletop that produced each report stage.",
        opens_question:
          "Who can declare an incident at 3 a.m. without asking, and is the early-warning template pre-filled?",
      },
      {
        id: "nis2-3",
        provision: "Article 21(2)(c) (business continuity, backups, crisis management)",
        requirement:
          "Maintain business continuity under attack (backup management, disaster recovery, crisis management) with backups tested and, where appropriate, isolated/offline copies.",
        evidence_suggested:
          "Backup test records including a restore from an isolated copy, and the crisis-management runbook with roles.",
        opens_question:
          "Would a ransomware event that reaches the backup console still leave you a restorable copy?",
      },
      {
        id: "nis2-4",
        provision: "Article 21(2)(d)-(e) (supply-chain security, secure development)",
        requirement:
          "Address security in the supply chain including the relationship with direct suppliers and service providers, and apply security in network/system acquisition, development and maintenance, including vulnerability handling and disclosure.",
        evidence_suggested:
          "Supplier security assessments, contractual security clauses, a vulnerability-disclosure policy, and the development lifecycle's security gates.",
        opens_question:
          "Which critical suppliers have never been assessed, and is there a disclosure route someone actually monitors?",
      },
      {
        id: "nis2-5",
        provision: "Article 21(2)(f)-(g) (effectiveness assessment, cyber hygiene)",
        requirement:
          "Policies and procedures to assess the effectiveness of the measures, and basic cyber-hygiene practices and training.",
        evidence_suggested:
          "Audit/assessment results mapped to the measures, and the hygiene baseline (patching, least privilege, MFA coverage) with trend data.",
        opens_question:
          "How do you measure that a control works, not just that it exists?",
      },
      {
        id: "nis2-6",
        provision: "Article 21(2)(h)-(j) (cryptography, access, asset management)",
        requirement:
          "Use cryptography and encryption policies; security around HR, access control and asset management; multi-factor authentication and secured communication channels where appropriate.",
        evidence_suggested:
          "The crypto policy, MFA coverage statistics, the asset register's freshness, and joiner/mover/leaver access reviews.",
        opens_question:
          "When did someone last review whether every standing privilege is still needed?",
      },
    ],
  },
  {
    id: "gdpr",
    label: "GDPR (Regulation (EU) 2016/679)",
    what: "The EU's data-protection regulation: lawful processing, data-subject rights, and specific duties around automated decision-making that AI systems routinely touch.",
    provenance: [
      "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
      "https://edpb.europa.eu/ (guidance of the European Data Protection Board)",
    ],
    items: [
      {
        id: "gdpr-1",
        provision: "Articles 5-6 and 9 (principles, lawful basis, special categories)",
        requirement:
          "Process lawfully, fairly and transparently for specified purposes with a documented lawful basis per processing activity; special-category data (health, biometrics) needs a separate Article 9 condition.",
        evidence_suggested:
          "The processing inventory with its basis per purpose, and the Article 9 analysis wherever biometric or health data enters an AI pipeline.",
        opens_question:
          "Was the basis for each AI use actually chosen, or did it inherit whatever the original collection used?",
      },
      {
        id: "gdpr-2",
        provision: "Articles 13-14 (transparency)",
        requirement:
          "Tell people, at collection or within a month, what is processed, why, on what basis, retained how long, and shared with whom — in concise, accessible language.",
        evidence_suggested:
          "The notices mapped to the processing inventory, with the dates of the last review of each.",
        opens_question:
          "Do the notices describe the AI-driven inferences about people, or only the raw fields collected?",
      },
      {
        id: "gdpr-3",
        provision: "Article 22 (automated decision-making)",
        requirement:
          "Where a decision is based solely on automated processing with legal or similarly significant effects, provide safeguards: the person's right to human intervention, an explanation, and to contest.",
        evidence_suggested:
          "The ADM inventory (which decisions, what effects), the human-review route, and a worked example of a contest actually handled.",
        opens_question:
          "Is any review by a human meaningful, or does the human rubber-stamp the model — and how would you show the difference?",
      },
      {
        id: "gdpr-4",
        provision: "Articles 25 and 35 (data protection by design, DPIA)",
        requirement:
          "Build in data-protection principles by design and default; carry out a DPIA where processing is likely high-risk — which large-scale profiling and systematic evaluation typically is.",
        evidence_suggested:
          "DPIAs for the high-risk AI processing, with residual-risk decisions and mitigation records dated before launch.",
        opens_question:
          "Was the DPIA done before deployment, or reconstructed after — and what did it change?",
      },
      {
        id: "gdpr-5",
        provision: "Articles 28 and 30 (processors, records)",
        requirement:
          "Use processor contracts with the required content, and keep records of processing activities available to the authority.",
        evidence_suggested:
          "The processor register with contract dates and clauses checked, and the Article 30 records' last-reviewed date.",
        opens_question:
          "Which AI vendors process personal data for you under a contract signed before anyone checked its processor clauses?",
      },
      {
        id: "gdpr-6",
        provision: "Articles 32-34 (security, breach notification)",
        requirement:
          "Apply security measures appropriate to the risk (including pseudonymisation and encryption); notify the authority within 72 hours of becoming aware of a personal-data breach, and people where the risk is high.",
        evidence_suggested:
          "The security measures per system, and a breach-drill record showing the 72-hour clock being met.",
        opens_question:
          "Would an AI-specific breach (training data leak, model inversion) even be recognised as a personal-data breach in your process?",
      },
    ],
  },
  {
    id: "iso-27001",
    label: "ISO/IEC 27001:2022",
    what: "The international standard for an information-security management system: risk-driven controls selected and operated inside a managed, audited cycle.",
    provenance: [
      "https://www.iso.org/standard/27001",
      "https://www.iso27001security.com/ (independent control reference)",
    ],
    items: [
      {
        id: "iso-1",
        provision: "Clauses 4-6 (context, leadership, ISMS planning)",
        requirement:
          "Define ISMS scope from organisational context and interested parties, get leadership commitment, and run risk assessment and risk-treatment planning (Clause 6.1.2-6.1.3).",
        evidence_suggested:
          "The scope statement, the risk-assessment method in use, and the risk register with treatment owners.",
        opens_question:
          "Does the scope honestly cover the AI/ML estate — training pipelines, feature stores, model registries — or only classic IT?",
      },
      {
        id: "iso-2",
        provision: "Clause 6.1.3(d) (Statement of Applicability)",
        requirement:
          "Maintain a Statement of Applicability: which Annex A controls apply, why, whether implemented, and how. The document an external audit reads first.",
        evidence_suggested:
          "A current SoA with justification per included/excluded control and implementation status that matches reality.",
        opens_question:
          "Do the SoA's exclusions still hold, or were controls excluded because nobody got round to them? (Holding an SoA is preparation; an audit verdict is a different thing entirely.)",
      },
      {
        id: "iso-3",
        provision: "Clauses 7-9 (support, operation, performance evaluation)",
        requirement:
          "Provide competence and awareness, operational control, monitoring and measurement, internal audit (9.2) and management review (9.3).",
        evidence_suggested:
          "The internal-audit schedule and findings, monitoring metrics with owners, and the last management review's decisions.",
        opens_question:
          "Are the metrics reviewed by anyone empowered to change the system, or filed and forgotten?",
      },
      {
        id: "iso-4",
        provision: "Annex A.5 (organisational controls)",
        requirement:
          "Organisational controls: policies, roles, threat intelligence, cloud services (5.23), and supplier relationships including 5.19-5.22 on supplier security in the ICT supply chain.",
        evidence_suggested:
          "The policy set with review dates, the supplier-assessment records, and the cloud-service agreements inventory.",
        opens_question:
          "Which supplier in your chain holds the most sensitive data with the weakest assessment on file?",
      },
      {
        id: "iso-5",
        provision: "Annex A.6 and A.8 (people, technological controls)",
        requirement:
          "People controls (screening, awareness 6.3) and technological controls: secure development (8.25-8.31), logging (8.15), configuration (8.9), data leakage prevention, test data, and change management (8.32).",
        evidence_suggested:
          "Secure-development gate records, logging coverage per system, and configuration baselines with drift handling.",
        opens_question:
          "Where do ML notebooks and experiments bypass the development pipeline's controls, and is that risk accepted in writing?",
      },
      {
        id: "iso-6",
        provision: "Clause 10 (improvement)",
        requirement:
          "Act on nonconformities with corrective action, and continually improve the ISMS.",
        evidence_suggested:
          "The corrective-action log with closure evidence and dates, showing repeat issues being designed out.",
        opens_question:
          "What did the last incident change in the system itself, as opposed to in a document?",
      },
    ],
  },
  {
    id: "nist-csf",
    label: "NIST Cybersecurity Framework 2.0",
    what: "The US NIST framework organising cybersecurity outcomes into six functions (Govern, Identify, Protect, Detect, Respond, Recover), used as a profile-based maturity map rather than a pass/fail audit.",
    provenance: [
      "https://www.nist.gov/cyberframework",
      "https://nvlpubs.nist.gov/nistpubs/CSIP/NIST.CSIP.29.pdf (implementation examples)",
    ],
    items: [
      {
        id: "csf-1",
        provision: "CSF 2.0 Function GV (Govern)",
        requirement:
          "Establish and monitor cybersecurity risk-management strategy, expectations and policy: organisational context, roles and authority, resources, and supply-chain risk governance.",
        evidence_suggested:
          "The cybersecurity policy set, the risk-appetite statement, and the governance record showing oversight happening on a cadence.",
        opens_question:
          "Can the person accountable for cyber risk actually allocate budget, or only escalate?",
      },
      {
        id: "csf-2",
        provision: "Function ID (Identify)",
        requirement:
          "Understand the asset inventory (including AI/data assets), the risk the organisation carries, and improvement opportunities.",
        evidence_suggested:
          "The asset inventory covering models, datasets and pipelines as first-class assets, and the risk register mapped to it.",
        opens_question:
          "Would your inventory find a model trained by a team that left eighteen months ago, still serving traffic?",
      },
      {
        id: "csf-3",
        provision: "Function PR (Protect)",
        requirement:
          "Safeguards to ensure delivery of critical services: identity and access control, data security, platform security, technology resilience.",
        evidence_suggested:
          "Access-control coverage statistics, data-handling controls per classification tier, and resilience test results.",
        opens_question:
          "Which production service could a single compromised laptop reach, and has that path been tested?",
      },
      {
        id: "csf-4",
        provision: "Function DE (Detect)",
        requirement:
          "Continuous monitoring and analysis to identify adverse events and anomalies, including anomalous behaviour of people and systems.",
        evidence_suggested:
          "Monitoring coverage per critical asset, alert-to-response time statistics, and the last detection actually caught in the wild.",
        opens_question:
          "What is your mean time to detect a compromised service account, measured, not estimated?",
      },
      {
        id: "csf-5",
        provision: "Function RS (Respond)",
        requirement:
          "Act on detected incidents: execution of the response plan, communication with stakeholders, incident reporting, analysis and mitigation.",
        evidence_suggested:
          "The response plan with roles, stakeholder-contact readiness, and the post-incident reports from real exercises.",
        opens_question:
          "Do regulators, customers and the board each have a prepared, current communication route for the same incident?",
      },
      {
        id: "csf-6",
        provision: "Function RC (Recover)",
        requirement:
          "Restore operations and integrity after an incident: recovery plan execution, restoration of damaged assets, and incorporating lessons into the identity and protect functions.",
        evidence_suggested:
          "Recovery-time records from tests, integrity-verification steps for restored data and models, and the lessons register.",
        opens_question:
          "After a model-poisoning incident, what proves the restored model is the clean one?",
      },
    ],
  },
  {
    id: "soc2",
    label: "SOC 2 (AICPA Trust Services Criteria)",
    what: "The AICPA attestation framework: a report against selected Trust Services Criteria (security is mandatory; availability, confidentiality, processing integrity and privacy are optional).",
    provenance: [
      "https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-trust-services",
      "https://www.aicpa.org/ (Trust Services Criteria 2017, revised 2022)",
    ],
    items: [
      {
        id: "soc2-1",
        provision: "Report scope (criteria selection)",
        requirement:
          "Decide which Trust Services Criteria the report covers: security is always included; availability, confidentiality, processing integrity and privacy only where the commitments warrant them.",
        evidence_suggested:
          "A written scope decision mapping each optional criterion to the system's actual commitments to customers.",
        opens_question:
          "Does the scope reflect what customers were promised in contracts and marketing, or what was easiest to evidence?",
      },
      {
        id: "soc2-2",
        provision: "CC1-CC3 (control environment, communication, risk assessment)",
        requirement:
          "Demonstrate the control environment (integrity, competence, accountability), quality information and communication flows, and risk assessment including fraud considerations.",
        evidence_suggested:
          "The org's control-owner map, the communication records of control changes, and the risk-assessment documentation.",
        opens_question:
          "Who owns each control in practice — a named person, or a committee nobody can name a member of?",
      },
      {
        id: "soc2-3",
        provision: "CC4-CC5 (monitoring and control activities)",
        requirement:
          "Ongoing and separate evaluations of controls, plus control activities implemented through policies and technologies with appropriate segregation.",
        evidence_suggested:
          "The monitoring calendar with findings, and the policy-to-technology mapping showing each control is enforced somewhere.",
        opens_question:
          "Which controls exist as PDFs but are not enforced by any system?",
      },
      {
        id: "soc2-4",
        provision: "CC6.1-CC6.8 (logical and physical access)",
        requirement:
          "Restrict logical and physical access: provisioning/deprovisioning, authentication strength, removal on termination, and physical protections for in-scope facilities.",
        evidence_suggested:
          "Joiner/mover/leaver evidence with timestamps, MFA coverage, and the termination-to-revocation interval distribution.",
        opens_question:
          "What is your worst recorded deprovisioning delay, and was the cause fixed?",
      },
      {
        id: "soc2-5",
        provision: "CC7.1-CC7.5 and CC8.1 (operations, change management)",
        requirement:
          "Operate detection and response for vulnerabilities and incidents, and control changes: authorisation, testing, approval before deployment.",
        evidence_suggested:
          "Vulnerability-remediation SLA performance, the change records with approvals, and incident timelines.",
        opens_question:
          "Can an emergency change bypass approval, and does that bypass get reviewed afterwards every time?",
      },
      {
        id: "soc2-6",
        provision: "CC9.1 and evidence period (risk mitigation, audit readiness)",
        requirement:
          "Mitigate risks from vendors and business disruption, and assemble point-in-time evidence across the review period for the auditor's sampling.",
        evidence_suggested:
          "The vendor-risk register, continuity arrangements, and an evidence folder structured per criterion across the period.",
        opens_question:
          "If the auditor sampled any day of the period at random, would the evidence for that day exist?",
      },
    ],
  },
  {
    id: "pci-dss",
    label: "PCI DSS v4.0",
    what: "The payment-card industry data-security standard: twelve requirement families securing cardholder data, with the v4.x emphasis on continuous validation and targeted risk analyses.",
    provenance: [
      "https://www.pcisecuritystandards.org/standards/pci-dss/",
      "https://www.pcisecuritystandards.org/document_library/ (official standard and SAQs)",
    ],
    items: [
      {
        id: "pci-1",
        provision: "Requirements 1-2 (network security, secure configurations)",
        requirement:
          "Install and maintain network security controls, and apply secure configurations everywhere — no vendor defaults, with a documented hardening standard.",
        evidence_suggested:
          "Network diagrams with data-flow paths for cardholder data, the configuration standard, and recent configuration-scan results.",
        opens_question:
          "Can you draw, today, every path cardholder data takes — including through any AI service that touches transaction text?",
      },
      {
        id: "pci-2",
        provision: "Requirements 3-4 (account data protection)",
        requirement:
          "Protect stored account data (render PAN unreadable, minimise retention) and encrypt transmission over open, public networks.",
        evidence_suggested:
          "The data-retention table per store, the encryption standards in force, and the last key-rotation record.",
        opens_question:
          "Which logs, backups or analytics stores hold PAN longer than the documented retention, unencrypted?",
      },
      {
        id: "pci-3",
        provision: "Requirements 5-6 (malware, secure development)",
        requirement:
          "Protect systems from malware and develop and maintain secure systems and software: inventory of custom software, vulnerability management, secure-development lifecycle, and public-web-application protections.",
        evidence_suggested:
          "The custom-software inventory, patch/vuln SLA performance, and the secure-development gate records.",
        opens_question:
          "Does the payment code ever call a model or third-party API with request data that could carry card data?",
      },
      {
        id: "pci-4",
        provision: "Requirements 7-8 (access, authentication)",
        requirement:
          "Restrict access by business need-to-know, assign unique IDs, and require strong authentication — MFA for access into the cardholder data environment, with a documented exception process.",
        evidence_suggested:
          "The role-to-access matrix with last review, MFA coverage statistics, and the exception log.",
        opens_question:
          "Who has standing access to cardholder data that their current role no longer justifies?",
      },
      {
        id: "pci-5",
        provision: "Requirements 9-10 (physical security, logging and monitoring)",
        requirement:
          "Restrict physical access to systems and cardholder data, and log and monitor all access: audit logs with synchronised time, retained per policy, with failure detection.",
        evidence_suggested:
          "The log coverage map per requirement-10 event type, retention proof, and the time-sync check records.",
        opens_question:
          "If logging fails on a critical system tonight, when would anyone notice — and by what alarm?",
      },
      {
        id: "pci-6",
        provision: "Requirements 11-12 (testing, policy, third parties)",
        requirement:
          "Test security regularly (including penetration testing and change/tamper detection), maintain a security policy with targeted risk analyses, and manage third-party service providers with due diligence and a maintained register.",
        evidence_suggested:
          "The penetration-test reports with remediation tracking, the targeted-risk-analysis documents justifying custom frequencies, and the TPSP register.",
        opens_question:
          "For each custom frequency you use in place of the default, where is the documented risk analysis that justifies it?",
      },
    ],
  },
  {
    id: "cra",
    label: "Cyber Resilience Act (Regulation (EU) 2024/2847)",
    what: "The EU's product-safety law for software: products with digital elements must meet security requirements through their support period, with vulnerability reporting duties phasing in from late 2026 and full application from December 2027.",
    provenance: [
      "https://eur-lex.europa.eu/eli/reg/2024/2847/oj",
      "https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act",
    ],
    items: [
      {
        id: "cra-1",
        provision: "Annex I §1 (secure by default, attack-surface minimisation)",
        requirement:
          "Design products with digital elements to be secure by default: minimal attack surface, no hard-coded credentials, secure configuration, protection against unauthorised access.",
        evidence_suggested:
          "The secure-configuration baseline shipped with the product, a credentials audit of images and repos, and the attack-surface notes per release.",
        opens_question:
          "Does the shipped default require a user to weaken security to get the product working? If so, that is the finding.",
      },
      {
        id: "cra-2",
        provision: "Article 13 and Annex II (technical documentation, support period)",
        requirement:
          "Maintain technical documentation of the product's cybersecurity, and provide security updates for at least the declared support period (expected to be stated and no shorter than the regulation's floor).",
        evidence_suggested:
          "The documentation index per product, and the published support-period statement with the update cadence behind it.",
        opens_question:
          "Is the support period long enough for the product's real life in customers' hands, and is it written anywhere a buyer can read it?",
      },
      {
        id: "cra-3",
        provision: "Article 14 (vulnerability and incident handling)",
        requirement:
          "Run vulnerability handling and coordinated disclosure for the support period, ship fixes free of charge, and report actively exploited vulnerabilities and severe incidents to ENISA/CSIRT on the regulated timeline (phasing in from September 2026).",
        evidence_suggested:
          "The published disclosure policy with a contact that is monitored, the fix-SLA record per severity, and a drill of the 24-hour early-warning report.",
        opens_question:
          "Who triages a report of an actively exploited vulnerability at the weekend, and can they ship inside the timeline?",
      },
      {
        id: "cra-4",
        provision: "Annex I §1 (risk assessment through the lifecycle)",
        requirement:
          "Carry out and maintain a cybersecurity risk assessment for the product, updated throughout development and the support period as threats change.",
        evidence_suggested:
          "The risk assessment with its revision history tied to releases and to real threat intelligence.",
        opens_question:
          "What event triggers a re-assessment — a release, a new CVE class, or a customer report — and is that written down?",
      },
      {
        id: "cra-5",
        provision: "Articles 15-19 and 28-30 (evaluation routes, marking, declaration)",
        requirement:
          "Follow the evaluation route the product class requires — internal control or third-party review for higher classes — and carry the required marking with the EU declaration and instructions for use.",
        evidence_suggested:
          "The product-class determination with its reasoning, the chosen route's plan, and the instructions-for-use draft including security-relevant guidance.",
        opens_question:
          "Which class does each product actually fall into — has anyone determined that in writing, or is it assumed? (This tool does not assess it.)",
      },
      {
        id: "cra-6",
        provision: "Annex I §2 and Annex II (protections in use, supplied information)",
        requirement:
          "Protect availability, integrity and authenticity of data and functions in use, limit resource exhaustion, and supply users the information needed for secure use and decommissioning.",
        evidence_suggested:
          "The secure-use and decommissioning instructions, and the resource-exhaustion test notes (denial-of-service resilience).",
        opens_question:
          "What must a customer do to decommission safely — wipe keys, revoke tokens, de-register instances — and is it documented as steps, not prose?",
      },
    ],
  },
];

const FRAMEWORK_IDS = FRAMEWORKS.map((f) => f.id);

/** The accepted framework ids, exported for surfaces that validate against the same enum
 *  (the A2A skill framework-readiness validates here before calling readinessResult). */
export const READINESS_FRAMEWORK_IDS: string[] = FRAMEWORK_IDS;

/**
 * A small, honest sector pointer: which of the nine frameworks COMMONLY bind the sector. It is a
 * pointer to help the caller order their work, never a determination that a framework does or does
 * not apply — scope depends on the entity, the member state and the activity, and only the caller's
 * own analysis (or counsel) can settle that.
 */
const SECTOR_HINTS: Record<string, { frameworks: string[]; why: string }> = {
  finance: { frameworks: ["dora", "pci-dss", "gdpr", "cra", "iso-27001"], why: "payment and ICT-resilience duties typically sit alongside data-protection ones in finance" },
  healthcare: { frameworks: ["gdpr", "eu-ai-act", "iso-27001", "nis2"], why: "health data is special-category under GDPR, and clinical AI usually draws Annex III duties" },
  insurance: { frameworks: ["dora", "gdpr", "eu-ai-act", "iso-27001"], why: "insurance is a financial sector under DORA, and pricing models draw AI-Act scrutiny" },
  energy: { frameworks: ["nis2", "iso-27001", "cra"], why: "energy is an essential-entity sector under NIS2, with OT product duties under the CRA" },
  transport: { frameworks: ["nis2", "eu-ai-act", "cra"], why: "transport entities are typically essential under NIS2, and safety components draw AI-Act and CRA duties" },
  government: { frameworks: ["nis2", "eu-ai-act", "iso-27001"], why: "public-sector entities carry NIS2 measures and AI-Act deployer duties" },
  manufacturing: { frameworks: ["cra", "nis2", "iso-27001"], why: "connected products are CRA's subject matter, and plants are classic NIS2 territory" },
  technology: { frameworks: ["cra", "eu-ai-act", "soc2", "iso-27001"], why: "software vendors face CRA duties, and enterprise buyers ask for SOC 2 / 27001 evidence" },
  retail: { frameworks: ["pci-dss", "gdpr"], why: "card payments and customer profiling are the binding pair in retail" },
};

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim().toLowerCase() : undefined;
}

export function readinessResult(args: Record<string, unknown>): {
  state: "OK" | "BAD_ARGUMENTS";
  error?: string;
  payload?: Record<string, unknown>;
} {
  const framework = str(args.framework);
  if (!framework || !FRAMEWORK_IDS.includes(framework)) {
    return {
      state: "BAD_ARGUMENTS",
      error:
        'Pass "framework" as one of: ' +
        FRAMEWORK_IDS.map((f) => `"${f}"`).join(", ") +
        '. Optional: "sector" (a word like finance or healthcare) and "role" (a free-text word for your position, e.g. deployer or provider).',
    };
  }
  const fw = FRAMEWORKS.find((f) => f.id === framework)!;
  const sector = str(args.sector);
  const role = str(args.role);
  const hint = sector ? SECTOR_HINTS[sector] : undefined;

  const payload: Record<string, unknown> = {
    state: "OK",
    framework: fw.id,
    framework_label: fw.label,
    what_this_is: fw.what,
    // The header line the text content leads with. The doctrine sentence is in the field name AND
    // the words: a checklist lays out evidence to gather; it never states the caller's status.
    header:
      "A readiness checklist — measures readiness against published provisions; it does not certify compliance.",
    not_a_certification: true,
    not_legal_advice: true,
    item_count: fw.items.length,
    items: fw.items,
    provenance: fw.provenance,
    ...(sector ? { sector } : {}),
    ...(hint
      ? {
          sector_note: `For sector "${sector}": ${hint.frameworks.join(", ")} ${hint.why}. A pointer, not a determination of scope.`,
          sector_frameworks: hint.frameworks,
        }
      : sector
        ? { sector_note: `No sector hint is held for "${sector}"; the checklist below is unchanged by it.` }
        : {}),
    ...(role ? { role, role_note: `Role recorded for your notes; item emphasis between provider-side and deployer-side duties is your call to verify — the tool does not determine it.` } : {}),
    how_to_use: [
      "Work item by item: read the requirement, then check whether the suggested evidence exists and is current.",
      "Each item's opens_question is the part a checklist cannot answer — take it to your compliance function or counsel.",
      "Where you have evidence, the estate's verify tools (verify_card, verify_inclusion) can check artefacts you publish against our signed records.",
    ],
  };
  return { state: "OK", payload };
}

export async function readinessToolResult(args: Record<string, unknown>): Promise<McpToolResult> {
  const r = readinessResult(args);
  if (r.state === "BAD_ARGUMENTS" || !r.payload) {
    return {
      content: [{ type: "text", text: `BAD_ARGUMENTS — ${r.error}` }],
      structuredContent: { state: "BAD_ARGUMENTS", error: r.error, not_a_certification: true },
      isError: true,
    };
  }
  const p = r.payload;
  const lines: string[] = [
    String(p.header),
    "",
    `${p.framework_label} — ${p.item_count} items.`,
    String(p.what_this_is),
  ];
  if (p.sector_note) lines.push("", String(p.sector_note));
  if (p.role_note) lines.push("", String(p.role_note));
  lines.push("");
  for (const item of p.items as Item[]) {
    lines.push(`${item.id} · ${item.provision}`);
    lines.push(`  Requirement (summary, not the legal text): ${item.requirement}`);
    lines.push(`  Evidence that would show readiness: ${item.evidence_suggested}`);
    lines.push(`  Opens the question: ${item.opens_question}`);
    lines.push("");
  }
  lines.push("Sources a reader can check without an account:");
  for (const s of p.provenance as string[]) lines.push(`  ${s}`);
  lines.push("", "A checklist is preparation, never a determination: nothing here states or implies the caller's status under any framework. Not legal advice.");
  return {
    content: [{ type: "text", text: lines.join("\n") }],
    structuredContent: p,
    isError: false,
  };
}
