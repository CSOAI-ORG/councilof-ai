// The Hive dataset — everything a CISO, legislator or compliance lead needs about a
// framework, collected in one place. Each entry links to its full clause-by-clause
// crosswalk in frameworks-content.ts (/frameworks/:slug) for depth.

export type HiveStatus = "Binding" | "Treaty" | "Voluntary" | "Standard" | "Cyber";
export type HiveFramework = {
  slug: string;
  name: string;
  authority: string;
  seat: string;
  lat: number;
  lng: number;
  status: HiveStatus;
  effective: string;
  deadline?: string; // ISO date for the next hard deadline
  deadlineLabel?: string;
  summary: string;
  whoMustComply: string[];
  keyObligations: { t: string; d: string }[];
  penalties: string;
  sectors: string[];
  threats: string[];
  crosswalk: string[];
  csoaiArticles: string;
  mcp: string[];
};

export const HIVE: HiveFramework[] = [
  {
    slug: "eu-ai-act", name: "EU AI Act", authority: "European Commission / AI Office", seat: "Brussels, EU", lat: 50.85, lng: 4.35,
    status: "Binding", effective: "1 Aug 2024 (phased)", deadline: "2026-08-02", deadlineLabel: "GPAI + transparency obligations apply",
    summary: "The first comprehensive, binding AI law. Risk-tiered (unacceptable / high / limited / minimal), with GPAI model rules and heavy transparency duties. Extraterritorial — applies to any provider putting AI on the EU market.",
    whoMustComply: ["Providers & deployers of AI in the EU", "GPAI model providers globally", "Importers, distributors, product manufacturers"],
    keyObligations: [
      { t: "Risk classification", d: "Classify every system: prohibited, high-risk (Annex III), limited or minimal." },
      { t: "High-risk conformity", d: "Risk management, data governance, logging, human oversight, accuracy & robustness, technical documentation." },
      { t: "Transparency (Art. 50)", d: "Disclose AI interaction, label deepfakes and AI-generated content." },
      { t: "GPAI duties", d: "Model documentation, copyright policy, systemic-risk evals for frontier models." },
    ],
    penalties: "Up to €35M or 7% of global annual turnover for prohibited-practice breaches.",
    sectors: ["Healthcare", "Finance", "HR / hiring", "Critical infrastructure", "Law enforcement", "Education"],
    threats: ["Biometric mass surveillance", "Unsafe high-risk automation", "Undisclosed deepfakes", "Frontier / systemic model risk"],
    crosswalk: ["GDPR", "ISO 42001", "NIST AI RMF", "Council of Europe AI Convention"],
    csoaiArticles: "Charter Art. 2, 17, 24, 33, 39", mcp: ["eu-ai-act-classifier-mcp", "annex-iii-checker-mcp"],
  },
  {
    slug: "nist-ai-rmf", name: "NIST AI RMF", authority: "US NIST", seat: "Gaithersburg, US", lat: 39.14, lng: -77.22,
    status: "Voluntary", effective: "Jan 2023 (v1.0) + GenAI Profile 2024",
    summary: "The de-facto US risk-management baseline. Four functions — Govern, Map, Measure, Manage — plus the Generative AI Profile. Voluntary but referenced by US federal procurement and state law.",
    whoMustComply: ["US federal agencies & contractors (de-facto)", "Any org wanting a recognised US risk baseline"],
    keyObligations: [
      { t: "Govern", d: "Culture, roles, accountability and policy for AI risk." },
      { t: "Map", d: "Context, capabilities and impacts of each AI system." },
      { t: "Measure", d: "Quantitative & qualitative evaluation of trustworthiness." },
      { t: "Manage", d: "Prioritise, respond to and monitor risks over the lifecycle." },
    ],
    penalties: "No direct fines — but the baseline for federal contracts and a defensible standard in US litigation.",
    sectors: ["Federal / government", "Defense", "Finance", "Healthcare", "Critical infrastructure"],
    threats: ["Model drift & degradation", "Bias & disparate impact", "GenAI hallucination / misuse", "Supply-chain model risk"],
    crosswalk: ["EU AI Act", "ISO 42001", "FedRAMP / OSCAL"],
    csoaiArticles: "Charter Art. 11, 21, 24, 39", mcp: ["nist-rmf-profile-mcp", "genai-profile-mcp"],
  },
  {
    slug: "iso-42001", name: "ISO/IEC 42001", authority: "ISO/IEC", seat: "Geneva, CH", lat: 46.2, lng: 6.14,
    status: "Standard", effective: "Dec 2023",
    summary: "The certifiable AI Management System (AIMS) standard — the 'ISO 27001 for AI'. A Plan-Do-Check-Act management system organisations can be audited and certified against.",
    whoMustComply: ["Any org seeking certifiable AI governance", "Vendors needing enterprise/procurement trust"],
    keyObligations: [
      { t: "AI policy & objectives", d: "Documented AIMS aligned to organisational context." },
      { t: "AI impact assessment", d: "Assess impacts on individuals, groups and society." },
      { t: "Controls (Annex A)", d: "Data, lifecycle, transparency, human oversight controls." },
      { t: "Continual improvement", d: "Internal audit, management review, corrective action." },
    ],
    penalties: "None — but certification is increasingly required in enterprise & public RFPs.",
    sectors: ["SaaS / technology", "Finance", "Healthcare", "Public sector", "Manufacturing"],
    threats: ["Ungoverned model lifecycle", "Undocumented data provenance", "Vendor trust gaps"],
    crosswalk: ["EU AI Act", "NIST AI RMF", "ISO 42005", "GDPR"],
    csoaiArticles: "Charter Art. 2, 17, 21, 47", mcp: ["iso-42001-aims-mcp", "annex-a-controls-mcp"],
  },
  {
    slug: "gdpr", name: "GDPR", authority: "EU / national DPAs", seat: "Brussels, EU", lat: 50.85, lng: 4.36,
    status: "Binding", effective: "25 May 2018",
    summary: "The EU data-protection regime. For AI, Article 22 (automated decision-making), DPIAs for high-risk processing, and data-subject rights are the pressure points.",
    whoMustComply: ["Any org processing EU residents' personal data", "AI systems making automated decisions about people"],
    keyObligations: [
      { t: "Lawful basis", d: "Establish and document a lawful basis for processing." },
      { t: "Art. 22 safeguards", d: "Human intervention & explanation for solely-automated decisions." },
      { t: "DPIA", d: "Data Protection Impact Assessment for high-risk processing." },
      { t: "Data-subject rights", d: "Access, rectification, erasure, portability, objection." },
    ],
    penalties: "Up to €20M or 4% of global annual turnover.",
    sectors: ["All sectors handling personal data", "AdTech", "HR", "Healthcare", "Finance"],
    threats: ["Unlawful profiling", "Opaque automated decisions", "Cross-border data misuse"],
    crosswalk: ["EU AI Act", "Council of Europe AI Convention", "ISO 42001"],
    csoaiArticles: "Charter Art. 11, 12, 22, 33, 43, 47", mcp: ["gdpr-article-checker-mcp", "gdpr-dpia-generator-mcp"],
  },
  {
    slug: "cra", name: "EU Cyber Resilience Act (CRA)", authority: "European Commission", seat: "Brussels, EU", lat: 50.85, lng: 4.34,
    status: "Cyber", effective: "In force 2024 (obligations phase to 2027)", deadline: "2027-12-11", deadlineLabel: "Full CRA obligations apply",
    summary: "Binding cybersecurity requirements for products with digital elements — including AI-enabled software and connected devices. Secure-by-design, vulnerability handling and CE-mark conformity.",
    whoMustComply: ["Manufacturers of products with digital elements sold in the EU", "AI/software vendors, IoT & connected-device makers"],
    keyObligations: [
      { t: "Secure by design", d: "Cybersecurity built in across the product lifecycle." },
      { t: "Vulnerability handling", d: "Coordinated disclosure and free security updates." },
      { t: "SBOM & documentation", d: "Software bill of materials and technical documentation." },
      { t: "Incident reporting", d: "Report actively exploited vulnerabilities to ENISA within 24h." },
    ],
    penalties: "Up to €15M or 2.5% of global annual turnover.",
    sectors: ["Software / SaaS", "IoT & devices", "Industrial / OT", "Automotive", "Medical devices"],
    threats: ["Supply-chain compromise", "Unpatched vulnerabilities", "AI model / weight tampering", "Exploited connected devices"],
    crosswalk: ["NIS2", "DORA", "EU AI Act", "ISO 42001"],
    csoaiArticles: "Charter Art. 2, 21, 39 (Rainbow Stack)", mcp: ["cra-sbom-mcp", "vuln-disclosure-mcp"],
  },
  {
    slug: "nis2", name: "NIS2 Directive", authority: "EU / national CSIRTs", seat: "Brussels, EU", lat: 50.84, lng: 4.36,
    status: "Cyber", effective: "Transposition Oct 2024",
    summary: "EU-wide cybersecurity baseline for essential and important entities. Risk management, incident reporting and management accountability — with AI systems in scope where they support essential services.",
    whoMustComply: ["Essential & important entities (energy, transport, health, digital, water…)", "Their key ICT/AI suppliers"],
    keyObligations: [
      { t: "Risk-management measures", d: "Policies, crypto, access control, supply-chain security." },
      { t: "Incident reporting", d: "Early warning within 24h, full report within 72h." },
      { t: "Management accountability", d: "Boards liable; must approve and oversee cyber measures." },
      { t: "Supply-chain security", d: "Assess and manage supplier & service-provider risk." },
    ],
    penalties: "Up to €10M or 2% of global turnover (essential entities).",
    sectors: ["Energy", "Transport", "Health", "Water", "Digital infrastructure", "Public administration"],
    threats: ["Critical-infrastructure attack", "Ransomware", "Supply-chain intrusion", "AI-assisted intrusion"],
    crosswalk: ["CRA", "DORA", "NIST AI RMF"],
    csoaiArticles: "Charter Art. 21, 39 (Rainbow Stack)", mcp: ["nis2-incident-mcp", "supply-chain-risk-mcp"],
  },
  {
    slug: "dora", name: "DORA (Digital Operational Resilience Act)", authority: "EU / ESAs", seat: "Brussels, EU", lat: 50.86, lng: 4.35,
    status: "Cyber", effective: "17 Jan 2025",
    summary: "Binding ICT & operational-resilience regime for EU financial entities — including AI models used in finance. ICT risk management, incident reporting, resilience testing and third-party (cloud/AI) oversight.",
    whoMustComply: ["Banks, insurers, investment firms, crypto-asset providers", "Their critical ICT/AI third parties"],
    keyObligations: [
      { t: "ICT risk framework", d: "Board-owned ICT risk management across the lifecycle." },
      { t: "Resilience testing", d: "Regular testing incl. threat-led penetration testing." },
      { t: "Incident reporting", d: "Classify and report major ICT-related incidents." },
      { t: "Third-party oversight", d: "Register of, and controls over, critical ICT/AI providers." },
    ],
    penalties: "Regulator-set; critical third parties face fines up to 1% of daily worldwide turnover per day.",
    sectors: ["Banking", "Insurance", "Investment", "Crypto / digital assets", "Payments"],
    threats: ["Financial-system outage", "Model-driven trading failure", "Cloud concentration risk", "ICT third-party compromise"],
    crosswalk: ["NIS2", "CRA", "NIST AI RMF"],
    csoaiArticles: "Charter Art. 21, 39", mcp: ["dora-ict-risk-mcp", "resilience-test-mcp"],
  },
  {
    slug: "hipaa", name: "HIPAA", authority: "US HHS / OCR", seat: "Washington DC, US", lat: 38.9, lng: -77.04,
    status: "Binding", effective: "1996 (Security Rule 2005)",
    summary: "US health-data protection. For AI, governs PHI used to train or run clinical/administrative models — access controls, audit trails, minimum-necessary and breach notification.",
    whoMustComply: ["Covered entities (providers, plans, clearinghouses)", "Business associates incl. AI vendors handling PHI"],
    keyObligations: [
      { t: "Safeguards", d: "Administrative, physical & technical safeguards for PHI." },
      { t: "Minimum necessary", d: "Limit PHI use/disclosure to what's required." },
      { t: "Audit controls", d: "Log access to PHI in AI pipelines." },
      { t: "Breach notification", d: "Notify within 60 days of a breach of unsecured PHI." },
    ],
    penalties: "Up to $1.9M per violation category per year; criminal penalties possible.",
    sectors: ["Healthcare providers", "Health plans", "Health-tech / AI diagnostics", "Pharma"],
    threats: ["PHI exfiltration", "Model memorisation of patient data", "Unauthorised secondary use"],
    crosswalk: ["GDPR", "NIST AI RMF", "EU AI Act"],
    csoaiArticles: "Charter Art. 22, 33, 47", mcp: ["hipaa-phi-scanner-mcp"],
  },
  {
    slug: "council-of-europe-ai-convention", name: "Council of Europe AI Convention", authority: "Council of Europe", seat: "Strasbourg, EU", lat: 48.57, lng: 7.75,
    status: "Treaty", effective: "Opened for signature Sep 2024",
    summary: "The first binding international AI treaty — human rights, democracy and rule of law. Signed by EU, UK, US, and others; becomes law domestically as Parties ratify.",
    whoMustComply: ["States that ratify (then their public & private actors via domestic law)"],
    keyObligations: [
      { t: "Human dignity & autonomy", d: "Protect fundamental rights across the AI lifecycle." },
      { t: "Transparency & oversight", d: "Identifiability of AI and meaningful oversight." },
      { t: "Accountability & remedies", d: "Responsibility for harms and effective remedies." },
      { t: "Equality & privacy", d: "Non-discrimination and personal-data protection." },
    ],
    penalties: "Enforced via each Party's domestic law once ratified.",
    sectors: ["Government", "Justice / law enforcement", "All rights-affecting AI"],
    threats: ["Rights-violating automation", "Democratic manipulation", "Discriminatory systems"],
    crosswalk: ["EU AI Act", "GDPR", "UNESCO AI Ethics"],
    csoaiArticles: "Charter Art. 1, 17, 22, 24, 39", mcp: ["coe-cite-mcp"],
  },
  {
    slug: "uk-aisi", name: "UK AI Safety / AISI", authority: "UK AI Safety Institute / DSIT", seat: "London, UK", lat: 51.5, lng: -0.12,
    status: "Voluntary", effective: "2023 → ongoing",
    summary: "UK's principles-based, regulator-led approach plus the AI Safety Institute for frontier-model evaluation. Pro-innovation, sector-regulator enforcement rather than a single AI act (for now).",
    whoMustComply: ["Frontier model developers (voluntary evals)", "Firms under existing UK sector regulators"],
    keyObligations: [
      { t: "Five principles", d: "Safety, transparency, fairness, accountability, contestability." },
      { t: "Frontier evals", d: "Pre-deployment safety testing with AISI for frontier models." },
      { t: "Sector rules", d: "Comply via existing regulators (ICO, FCA, MHRA…)." },
    ],
    penalties: "Via existing sector regulators (e.g. ICO fines under UK GDPR).",
    sectors: ["Frontier AI labs", "Finance", "Healthcare", "Public sector"],
    threats: ["Frontier model misuse", "Systemic capability risk", "Sector-specific harm"],
    crosswalk: ["EU AI Act", "NIST AI RMF", "ISO 42001"],
    csoaiArticles: "Charter Art. 2, 17, 21, 50", mcp: ["uk-aisi-eval-mcp"],
  },
  {
    slug: "korea-ai-basic-act", name: "Korea AI Basic Act", authority: "Republic of Korea / MSIT", seat: "Seoul, KR", lat: 37.57, lng: 126.98,
    status: "Binding", effective: "Enacted 2025 — applies Jan 2026", deadline: "2026-01-01", deadlineLabel: "AI Basic Act takes effect",
    summary: "Asia's first comprehensive national AI law. Defines 'high-impact' and generative AI, transparency labelling, and government promotion + safety duties.",
    whoMustComply: ["Providers of high-impact & generative AI in Korea", "Foreign providers serving the Korean market"],
    keyObligations: [
      { t: "High-impact duties", d: "Risk management and human oversight for high-impact AI." },
      { t: "Transparency", d: "Notify users of AI and label generative outputs." },
      { t: "Safety measures", d: "Lifecycle safety and incident response." },
    ],
    penalties: "Administrative fines; corrective orders from MSIT.",
    sectors: ["Technology", "Manufacturing", "Public services", "Content / media"],
    threats: ["Unlabelled generative content", "High-impact automation harm"],
    crosswalk: ["EU AI Act", "Singapore Agentic AI"],
    csoaiArticles: "Charter Art. 17, 33, 39", mcp: ["korea-ai-act-mcp"],
  },
  {
    slug: "singapore-agentic-ai", name: "Singapore Model AI / Agentic", authority: "IMDA / PDPC", seat: "Singapore, SG", lat: 1.35, lng: 103.8,
    status: "Voluntary", effective: "Model Framework 2019 → Agentic guidance 2024",
    summary: "Practical, testing-led governance — the Model AI Governance Framework plus AI Verify and emerging agentic-AI guidance. Trusted APAC baseline.",
    whoMustComply: ["Any org deploying AI in Singapore/APAC (voluntary)", "Vendors seeking AI Verify testing"],
    keyObligations: [
      { t: "Governance structures", d: "Clear internal accountability for AI decisions." },
      { t: "Risk-based ops", d: "Human-in-the-loop calibrated to impact." },
      { t: "AI Verify testing", d: "Technical testing + process checks toolkit." },
    ],
    penalties: "Voluntary; PDPA fines apply where personal data is involved.",
    sectors: ["Finance", "Technology", "Public sector", "Logistics"],
    threats: ["Ungoverned agentic autonomy", "Opaque model behaviour"],
    crosswalk: ["ISO 42001", "NIST AI RMF", "Korea AI Basic Act"],
    csoaiArticles: "Charter Art. 21, 33, 43", mcp: ["ai-verify-mcp", "agentic-guardrail-mcp"],
  },
  {
    slug: "iso-42005", name: "ISO/IEC 42005 (AI Impact Assessment)", authority: "ISO/IEC", seat: "Geneva, CH", lat: 46.21, lng: 6.14,
    status: "Standard", effective: "2025",
    summary: "The companion standard to ISO 42001 — how to conduct and document AI system impact assessments on individuals and society across the lifecycle.",
    whoMustComply: ["Orgs running ISO 42001 AIMS", "Anyone needing a defensible AI impact assessment"],
    keyObligations: [
      { t: "Impact scoping", d: "Define scope, stakeholders and potential impacts." },
      { t: "Assessment process", d: "Identify, analyse and document impacts & mitigations." },
      { t: "Lifecycle review", d: "Revisit as the system and context change." },
    ],
    penalties: "None — evidentiary support for ISO 42001 and EU AI Act conformity.",
    sectors: ["All ISO 42001 adopters", "Public sector", "Healthcare", "Finance"],
    threats: ["Unassessed societal impact", "Blind-spot harms"],
    crosswalk: ["ISO 42001", "EU AI Act", "NIST AI RMF"],
    csoaiArticles: "Charter Art. 24, 33", mcp: ["iso-42005-impact-mcp"],
  },
  {
    slug: "oecd-ai-principles", name: "OECD AI Principles", authority: "OECD", seat: "Paris, FR", lat: 48.85, lng: 2.35,
    status: "Voluntary", effective: "2019 (updated 2024)",
    summary: "The soft-law baseline shaping allied AI policy — inclusive growth, human-centred values, transparency, robustness and accountability. The reference point most national frameworks build on.",
    whoMustComply: ["Adhering governments (46+) shaping national policy", "Orgs wanting an internationally-recognised baseline"],
    keyObligations: [
      { t: "Human-centred values", d: "Respect rule of law, human rights and democratic values." },
      { t: "Transparency", d: "Meaningful disclosure to foster understanding & contestation." },
      { t: "Robustness & safety", d: "Function safely across the lifecycle." },
      { t: "Accountability", d: "Actors accountable for proper functioning." },
    ],
    penalties: "None — foundational to binding regimes worldwide.",
    sectors: ["Government / policy", "All sectors (baseline)"],
    threats: ["Fragmented national rules", "Race-to-the-bottom governance"],
    crosswalk: ["EU AI Act", "UNESCO AI Ethics", "NIST AI RMF"],
    csoaiArticles: "Charter Art. 1, 17, 21", mcp: ["oecd-principles-mcp"],
  },
  {
    slug: "unesco-ai-ethics", name: "UNESCO AI Ethics Recommendation", authority: "UNESCO", seat: "Paris, FR", lat: 48.85, lng: 2.31,
    status: "Voluntary", effective: "2021 (194 member states)",
    summary: "The most widely-adopted global AI ethics instrument — proportionality, human oversight, fairness, sustainability, and a Readiness Assessment + Ethical Impact Assessment methodology.",
    whoMustComply: ["194 UNESCO member states (policy)", "Public bodies applying its RAM/EIA tools"],
    keyObligations: [
      { t: "Ethical impact assessment", d: "Assess AI against the 10 core principles." },
      { t: "Human oversight", d: "Humans retain final responsibility." },
      { t: "Sustainability", d: "Weigh environmental and societal impact." },
    ],
    penalties: "None — a normative global baseline.",
    sectors: ["Government", "Education", "Culture", "Public services"],
    threats: ["Global ethics fragmentation", "Sustainability blind spots"],
    crosswalk: ["OECD AI Principles", "Council of Europe AI Convention", "EU AI Act"],
    csoaiArticles: "Charter Art. 1, 24, 36", mcp: ["unesco-eia-mcp"],
  },
];

export function getHive(slug: string): HiveFramework | undefined { return HIVE.find((h) => h.slug === slug); }
export const HIVE_STATUS_COLOR: Record<HiveStatus, string> = {
  Binding: "#ef4444", Treaty: "#a855f7", Voluntary: "#f59e0b", Standard: "#0ea5e9", Cyber: "#f43f5e",
};
