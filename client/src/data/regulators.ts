// regulators.ts — CSOAI Regulator Atlas dataset.
//
// The major AI-governance and cyber regimes, each with the top tools an org
// needs and the next key dates/movements. Encoded from established framework
// knowledge as of mid-2026; ALWAYS verify against primary sources before you
// rely on a specific date — the Atlas page also pulls live Sovereign commentary
// so the read stays current. Volatile items (US executive orders, Canada AIDA)
// are marked status "shifting".
//
// This is the structured spine the Council assistant acts on: each regime maps to CSOAI
// coverage (Hive slug + Layer 0 tooling) so "comply once, crosswalk everywhere".

export type RegStatus = "in-force" | "phasing-in" | "voluntary" | "proposed" | "shifting";

export type Regime = {
  slug: string;
  name: string;
  region: string;
  authority: string;
  kind: "ai" | "cyber" | "data";
  status: RegStatus;
  summary: string;
  topTools: string[];          // the 7 capabilities an org needs to comply
  nextDates: { date: string; event: string }[]; // upcoming movements
  csoai: string;               // how CSOAI covers it

  /**
   * Link into the Framework Hive.
   *
   * INVARIANT (enforced by client/src/data/regulators.test.ts): every value set
   * here MUST resolve against HIVE in hive-frameworks.ts. Set it only when the
   * Hive page actually exists.
   *
   * ABSENT MEANS "NOT IN THE HIVE YET", and the Atlas says so in words. Until
   * 2026-08-26 five regimes — Colorado, China, UK, Canada and Singapore, i.e.
   * every non-EU jurisdiction on the Atlas — carried a hiveSlug for a Hive page
   * that was never written. Nothing checked, so the Atlas rendered an
   * "Open in the Hive →" button for each and a regulator arriving from any of
   * those five countries hit a hard 404. A link is a claim that something is
   * there; do not make the claim without the page.
   */
  hiveSlug?: string;
};

export const REGIMES: Regime[] = [
  {
    slug: "eu-ai-act", name: "EU AI Act", region: "European Union", authority: "European Commission · AI Office · national authorities",
    kind: "ai", status: "phasing-in",
    summary: "The first comprehensive, binding, risk-tiered AI law. Prohibited practices, high-risk obligations, transparency duties, and GPAI rules — phasing in through 2027.",
    topTools: [
      "Risk classification engine (prohibited / high-risk / limited / minimal)",
      "Conformity assessment + CE-marking workflow (Art. 43)",
      "Technical documentation pack (Annex IV)",
      "Fundamental Rights Impact Assessment (FRIA, Art. 27)",
      "Event logging & traceability (Art. 12)",
      "Human-oversight controls (Art. 14)",
      "Post-market monitoring + serious-incident reporting (Art. 72/73)",
    ],
    nextDates: [
      { date: "2 Dec 2026", event: "Art. 50 transparency duties apply (moved from Aug 2026 by the Digital Omnibus — verify final text)" },
      { date: "Q3–Q4 2026", event: "GPAI Code of Practice adherence reviewed; AI Office guidance expands" },
      { date: "2 Dec 2027", event: "High-risk Annex III obligations apply (Digital Omnibus timeline)" },
      { date: "2026–27", event: "Harmonised CEN/CENELEC standards finalised for high-risk conformity" },
      { date: "ongoing", event: "AI Office enforcement of GPAI systemic-risk models (>10^25 FLOP)" },
      { date: "ongoing", event: "Member-State penalty regimes + market-surveillance authorities stand up" },
      { date: "2028+", event: "Commission review of Annex III scope + prohibited-practice list" },
    ],
    csoai: "Full obligation map, FRIA + conformity workflow, Art. 12 logging signed to Layer 0, and a live deadline clock. Comply once — crosswalk to NIST + ISO 42001. (Dates track the 2026 Digital Omnibus — verify against the final published text.)",
    hiveSlug: "eu-ai-act",
  },
  {
    slug: "nist-ai-rmf", name: "NIST AI RMF", region: "United States", authority: "NIST (voluntary framework)",
    kind: "ai", status: "voluntary",
    summary: "The AI Risk Management Framework 1.0 plus the Generative AI Profile — voluntary, function-based (Govern, Map, Measure, Manage). With EO 14110 revoked (Jan 2025), the operative US federal baseline is OMB M-25-21 (which rescinded and replaced M-24-10 in April 2025) + NIST AI RMF, layered with state law (Colorado, California).",
    topTools: [
      "Govern/Map/Measure/Manage program scaffold",
      "AI system inventory + context mapping",
      "Bias & fairness measurement suite",
      "Model cards + data sheets",
      "Adversarial testing / red-teaming",
      "Incident + near-miss tracking",
      "Third-party / supply-chain risk controls",
    ],
    nextDates: [
      { date: "ongoing", event: "GenAI Profile (NIST-AI-600-1) adoption across agencies + vendors" },
      { date: "2026", event: "Sector crosswalks + NIST assurance guidance expand" },
      { date: "in effect", event: "OMB M-25-21 governs federal agencies' AI use (CAIOs, risk practices) — rescinded and replaced M-24-10 in Apr 2025; EO 14110 revoked Jan 2025" },
      { date: "ongoing", event: "Federal procurement + M-25-21 increasingly reference RMF conformance" },
      { date: "2026–27", event: "Alignment work between RMF and ISO/IEC 42001 controls" },
      { date: "1 Jan 2027", event: "State AI laws begin to bite (e.g. Colorado SB 26-189 / ADMT)" },
      { date: "ongoing", event: "CISA + sector guidance for AI in critical infrastructure" },
    ],
    csoai: "The Govern/Map/Measure/Manage scaffold as a live program, model cards + bias audits, red-team logging — mapped to EU AI Act so one evidence set serves both.",
    hiveSlug: "nist-ai-rmf",
  },
  {
    slug: "iso-42001", name: "ISO/IEC 42001", region: "Global", authority: "ISO/IEC · accredited certification bodies",
    kind: "ai", status: "in-force",
    summary: "The first certifiable AI management system standard (2023). The 'ISO 27001 for AI' — auditable, globally recognised, and increasingly demanded in enterprise procurement.",
    topTools: [
      "AI Management System (AIMS) documentation",
      "Statement of Applicability (Annex A controls)",
      "AI risk assessment + treatment plan",
      "AI system impact assessment",
      "Lifecycle & data-governance controls",
      "Internal audit + management review",
      "Continual improvement / nonconformity log",
    ],
    nextDates: [
      { date: "ongoing", event: "Rising enterprise + government procurement demand for 42001 certification" },
      { date: "2026", event: "Guidance standards (42005 impact assessment, 42006 audit) mature" },
      { date: "ongoing", event: "42001 ↔ EU AI Act conformity mapping tightens" },
      { date: "2026–27", event: "Accredited certification-body capacity expands globally" },
      { date: "ongoing", event: "Integration with ISO 27001 / 27701 management systems" },
      { date: "2027+", event: "First scheduled review cycle of the standard" },
      { date: "ongoing", event: "Sector profiles (health, finance) emerging" },
    ],
    csoai: "AIMS + Statement of Applicability generated from your controls, impact assessments, and audit logs — exportable and signed. One certification, mapped across regimes.",
    hiveSlug: "iso-42001",
  },
  {
    slug: "gdpr", name: "GDPR", region: "European Union", authority: "EDPB · national DPAs",
    kind: "data", status: "in-force",
    summary: "The data-protection backbone AI systems must respect — lawful basis, purpose limitation, automated-decision rights (Art. 22), and DPIAs where processing is high-risk.",
    topTools: [
      "Records of Processing Activities (RoPA)",
      "Data Protection Impact Assessment (DPIA)",
      "Lawful-basis + consent management",
      "Art. 22 automated-decision safeguards",
      "Data-subject-request (DSAR) workflow",
      "Data minimisation + retention controls",
      "Cross-border transfer mechanism (SCCs/adequacy)",
    ],
    nextDates: [
      { date: "ongoing", event: "DPAs scrutinising training-data scraping + generative AI" },
      { date: "2026", event: "EDPB opinions on AI models & personal data mature" },
      { date: "ongoing", event: "GDPR ↔ EU AI Act interplay clarified for high-risk systems" },
      { date: "ongoing", event: "Enforcement on biometric + emotion-recognition data" },
      { date: "2026", event: "GDPR procedural regulation streamlining cross-border cases" },
      { date: "ongoing", event: "Automated-decision case law (Art. 22) expanding" },
      { date: "ongoing", event: "Rising fines for AI-driven profiling failures" },
    ],
    csoai: "DPIA + RoPA generation, Art. 22 safeguards, and DSAR workflows — with the EU AI Act FRIA sharing evidence so you don't assess twice.",
    hiveSlug: "gdpr",
  },
  {
    slug: "colorado-ai-act", name: "Colorado AI framework (SB 26-189 / ADMT)", region: "United States · Colorado", authority: "Colorado Attorney General",
    kind: "ai", status: "phasing-in",
    summary: "Originally the first comprehensive US state AI law (SB 24-205 — a duty of reasonable care against algorithmic discrimination in consequential decisions), but repealed and replaced in May 2026 by SB 26-189, a scaled-back ADMT framework that drops the duty of care and impact-assessment mandates. Effective 1 Jan 2027. The requirements below reflect the original SB 24-205 regime.",
    topTools: [
      "High-risk consequential-decision inventory",
      "Algorithmic-discrimination risk management program",
      "Consumer notice + explanation workflow",
      "Impact assessments (annual + on material change)",
      "Right-to-appeal / human review path",
      "AG disclosure of discovered discrimination",
      "Developer↔deployer documentation exchange",
    ],
    nextDates: [
      { date: "1 Jan 2027", event: "SB 26-189 (ADMT framework) takes effect — repealed & replaced the original SB 24-205 AI Act, dropping its duty of care and impact-assessment mandates" },
      { date: "2026", event: "AG rulemaking under the scaled-back ADMT framework" },
      { date: "ongoing", event: "Other US states watching Colorado's pivot away from the EU-style model" },
      { date: "ongoing", event: "Interaction with NIST RMF as the reasonable-care benchmark" },
      { date: "2026–27", event: "Enforcement posture + safe-harbour clarifications" },
      { date: "ongoing", event: "Business-community amendments debated in legislature" },
      { date: "TBD", event: "Possible federal preemption discussions — status shifting" },
    ],
    csoai: "Consequential-decision inventory, algorithmic-discrimination testing, and consumer-notice + appeal workflows — reusing your NIST/EU evidence.",
    // No hiveSlug: there is no Framework Hive page for this regime. It used to
    // carry hiveSlug: "colorado-ai-act", which rendered an "Open in the Hive" button
    // onto a 404. The Atlas now states the gap instead of linking to nothing.
  },
  {
    slug: "nis2", name: "NIS2 Directive", region: "European Union", authority: "National cyber authorities · ENISA",
    kind: "cyber", status: "in-force",
    summary: "The EU's expanded cybersecurity directive — risk-management measures, incident reporting, and management accountability for essential and important entities across 18 sectors.",
    topTools: [
      "Asset + supply-chain risk register",
      "Cyber risk-management measures (Art. 21)",
      "24h/72h incident-reporting workflow",
      "Business continuity + backup controls",
      "Vulnerability disclosure + patch management",
      "Management-body oversight + training",
      "Supply-chain security assessments",
    ],
    nextDates: [
      { date: "ongoing", event: "National transposition + enforcement ramping (deadline was Oct 2024)" },
      { date: "2026", event: "Registration of essential/important entities completed across states" },
      { date: "ongoing", event: "Implementing acts on technical + methodological requirements" },
      { date: "ongoing", event: "First enforcement actions + management-liability tests" },
      { date: "2026–27", event: "Alignment with CRA + DORA for overlapping entities" },
      { date: "ongoing", event: "ENISA guidance + sectoral thresholds refined" },
      { date: "ongoing", event: "Cross-border incident coordination via CSIRTs network" },
    ],
    csoai: "Cyber risk register, incident-reporting clock, and supply-chain assessments — plus cyber self-scan so you can test controls, not just document them.",
    hiveSlug: "nis2",
  },
  {
    slug: "dora", name: "DORA", region: "European Union", authority: "ESAs (EBA/ESMA/EIOPA) · national regulators",
    kind: "cyber", status: "in-force",
    summary: "The Digital Operational Resilience Act — ICT risk management, incident reporting, resilience testing, and third-party (incl. cloud/AI) oversight for EU financial entities.",
    topTools: [
      "ICT risk-management framework",
      "ICT-incident classification + reporting",
      "Digital operational resilience testing (incl. TLPT)",
      "ICT third-party register + concentration risk",
      "Contractual clauses for critical ICT providers",
      "Business-continuity + response/recovery plans",
      "Board-level ICT governance",
    ],
    nextDates: [
      { date: "ongoing", event: "Full application in effect (since Jan 2025) — supervisory ramp-up" },
      { date: "2026", event: "Register-of-information submissions + oversight of critical TPPs" },
      { date: "ongoing", event: "Threat-led penetration testing (TLPT) cycles begin for larger entities" },
      { date: "ongoing", event: "RTS/ITS technical standards bedding in" },
      { date: "2026–27", event: "Designation + oversight of critical ICT third parties" },
      { date: "ongoing", event: "Cross-mapping with NIS2 for dual-scope entities" },
      { date: "ongoing", event: "AI-vendor dependency treated as ICT third-party risk" },
    ],
    csoai: "ICT risk framework, incident classification, and third-party (AI/cloud) register — resilience testing evidence signed to Layer 0.",
    hiveSlug: "dora",
  },
  {
    slug: "cra", name: "Cyber Resilience Act", region: "European Union", authority: "European Commission · market surveillance",
    kind: "cyber", status: "phasing-in",
    summary: "Mandatory cybersecurity requirements for products with digital elements — secure-by-design, vulnerability handling, and CE-marking for hardware + software across the EU market.",
    topTools: [
      "Product security risk assessment",
      "Secure-by-design + secure-by-default controls",
      "SBOM (software bill of materials)",
      "Coordinated vulnerability disclosure process",
      "Security update / patch delivery mechanism",
      "Conformity assessment + CE marking",
      "Actively-exploited-vuln + incident reporting",
    ],
    nextDates: [
      { date: "Sept 2026", event: "Vulnerability + incident reporting obligations begin to apply" },
      { date: "Dec 2027", event: "Full CRA obligations apply for products with digital elements" },
      { date: "2026", event: "Harmonised standards + guidance for essential requirements" },
      { date: "ongoing", event: "Notified-body capacity for conformity assessment builds out" },
      { date: "2026–27", event: "SBOM tooling + attestation expectations mature" },
      { date: "ongoing", event: "Overlap handling with AI Act for AI-enabled products" },
      { date: "ongoing", event: "Open-source steward obligations clarified" },
    ],
    csoai: "SBOM + secure-by-design checklist, CVD process, and conformity workflow — with cyber self-scan checking your product surface for the evidence.",
    hiveSlug: "cra",
  },
  {
    slug: "china-ai", name: "China AI Rules (TC260 / GenAI Measures)", region: "China", authority: "CAC · TC260",
    kind: "ai", status: "in-force",
    summary: "Interim Measures for Generative AI plus TC260 standards and content-labelling rules — security assessments, training-data governance, and provider registration.",
    topTools: [
      "Algorithm + service filing/registration",
      "Security self-assessment",
      "Training-data + content governance",
      "AI-generated-content labelling",
      "Real-name + content-moderation controls",
      "Personal-information protection (PIPL) alignment",
      "Incident + illegal-content handling",
    ],
    nextDates: [
      { date: "ongoing", event: "AI-generated-content labelling rules in effect + enforced" },
      { date: "2026", event: "New TC260 national standards on GenAI security published" },
      { date: "ongoing", event: "Algorithm-filing enforcement + provider registration" },
      { date: "ongoing", event: "Data-export + PIPL interplay for AI services" },
      { date: "2026–27", event: "Sectoral rules (finance, health, autonomous) expand" },
      { date: "ongoing", event: "Deep-synthesis + deepfake provisions enforced" },
      { date: "ongoing", event: "Cross-border AI service restrictions evolve" },
    ],
    csoai: "Filing/registration checklist, security self-assessment, and content-labelling controls mapped to the same evidence spine as EU/US.",
    // No hiveSlug: there is no Framework Hive page for this regime. It used to
    // carry hiveSlug: "china-ai", which rendered an "Open in the Hive" button
    // onto a 404. The Atlas now states the gap instead of linking to nothing.
  },
  {
    slug: "uk-ai", name: "UK AI Regulation", region: "United Kingdom", authority: "DSIT · sector regulators (ICO, FCA, CMA, Ofcom)",
    kind: "ai", status: "shifting",
    summary: "A principles-based, pro-innovation approach delivered through existing regulators, with a possible AI bill for the most capable models under active debate.",
    topTools: [
      "Cross-sector principle mapping (safety, transparency, fairness, accountability, contestability)",
      "Regulator-specific compliance (ICO/FCA/CMA/Ofcom)",
      "AI assurance + audit techniques",
      "Algorithmic transparency records (ATRS for public sector)",
      "DPIA / data-protection alignment (UK GDPR)",
      "Model risk + governance documentation",
      "Incident + harm reporting",
    ],
    nextDates: [
      { date: "2026", event: "Direction on a UK AI bill for frontier models — status shifting, verify" },
      { date: "ongoing", event: "AI Safety Institute evaluations of frontier models" },
      { date: "ongoing", event: "Sector regulators publishing AI strategic approaches" },
      { date: "2026", event: "Algorithmic Transparency Recording Standard scaling in public sector" },
      { date: "ongoing", event: "ICO guidance on AI + data protection updated" },
      { date: "ongoing", event: "International interoperability (EU/US) positioning" },
      { date: "TBD", event: "Statutory footing decisions for the AI Safety Institute" },
    ],
    csoai: "The five cross-sector principles as a live checklist, regulator mapping, and assurance evidence — bridged to EU/ISO so UK-first orgs stay portable.",
    // No hiveSlug: there is no Framework Hive page for this regime. It used to
    // carry hiveSlug: "uk-ai", which rendered an "Open in the Hive" button
    // onto a 404. The Atlas now states the gap instead of linking to nothing.
  },
  {
    slug: "canada-aida", name: "Canada AIDA / AI policy", region: "Canada", authority: "ISED · Office of the AI & Data Commissioner (proposed)",
    kind: "ai", status: "shifting",
    summary: "The Artificial Intelligence and Data Act (part of Bill C-27) did not pass before Parliament was prorogued; Canada's statutory AI direction is being reset — track the voluntary code meanwhile.",
    topTools: [
      "Voluntary Code of Conduct (generative AI) alignment",
      "High-impact-system identification",
      "Risk mitigation + monitoring plan",
      "Transparency + disclosure records",
      "Human oversight measures",
      "Bias + harm assessment",
      "PIPEDA / privacy alignment",
    ],
    nextDates: [
      { date: "2026", event: "New legislative direction post-C-27 — status shifting, verify" },
      { date: "ongoing", event: "Voluntary Code of Conduct adoption by developers" },
      { date: "ongoing", event: "Provincial (Quebec Law 25) privacy interplay" },
      { date: "2026", event: "Federal consultation on a revised AI framework" },
      { date: "ongoing", event: "Alignment signalling with EU AI Act + NIST" },
      { date: "TBD", event: "Standing up an AI & Data Commissioner function" },
      { date: "ongoing", event: "Public-sector AI directive updates" },
    ],
    csoai: "Voluntary-Code alignment now, structured so you flip to statutory obligations the moment Canada's framework lands — no rework.",
    // No hiveSlug: there is no Framework Hive page for this regime. It used to
    // carry hiveSlug: "canada-aida", which rendered an "Open in the Hive" button
    // onto a 404. The Atlas now states the gap instead of linking to nothing.
  },
  {
    slug: "singapore-ai", name: "Singapore Model AI Governance", region: "Singapore", authority: "IMDA · PDPC",
    kind: "ai", status: "voluntary",
    summary: "A practical, voluntary framework — the Model AI Governance Framework (incl. Generative AI) plus AI Verify testing toolkit — widely used as an implementation template across APAC.",
    topTools: [
      "Model AI Governance Framework mapping",
      "AI Verify testing + reporting toolkit",
      "Risk-based deployment controls",
      "Data governance + PDPA alignment",
      "Human-in-the-loop design patterns",
      "Transparency + stakeholder communication",
      "Incident management",
    ],
    nextDates: [
      { date: "ongoing", event: "AI Verify + GenAI evaluation sandbox expansion" },
      { date: "2026", event: "Updated GenAI governance guidance + testing standards" },
      { date: "ongoing", event: "Cross-border interoperability work (ASEAN + global)" },
      { date: "ongoing", event: "Sectoral guidelines (finance/health) from MAS + others" },
      { date: "2026–27", event: "AI Verify Foundation tooling ecosystem grows" },
      { date: "ongoing", event: "Alignment with ISO 42001 for certification-minded firms" },
      { date: "ongoing", event: "Public-sector AI adoption playbooks" },
    ],
    csoai: "Model Framework mapping + AI Verify-style testing evidence, bridged to ISO 42001 so a Singapore deployment ports globally.",
    // No hiveSlug: there is no Framework Hive page for this regime. It used to
    // carry hiveSlug: "singapore-ai", which rendered an "Open in the Hive" button
    // onto a 404. The Atlas now states the gap instead of linking to nothing.
  },
];

export const REGION_GROUPS = ["European Union", "United States", "United Kingdom", "China", "Singapore", "Canada", "Global"];

export function regimesByKind(kind: "ai" | "cyber" | "data") {
  return REGIMES.filter((r) => r.kind === kind);
}
