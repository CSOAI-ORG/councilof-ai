// ecosystem.ts — the CSOAI account dataset (the "spine" of the Distribution Hive).
// ORG-LEVEL, PUBLIC data only. Every account is a real, public organisation; fields
// are factual-public or explicitly "unknown" (never invented). `play` is a PRE-RECON
// HYPOTHESIS until an account report is run (see docs/DISTRIBUTION_HIVE.md).
// This same dataset feeds the globe, Sov Space, Sovereign and leads.

export type Play = "align" | "absorb" | "integrate" | "displace";
export type AccountType = "regulator" | "government" | "fortune100" | "fortune500" | "sector";
export type Posture = "sets-rules" | "none" | "emerging" | "mature" | "unknown";

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  region: string;
  country: string;
  hq: [number, number];               // [lng, lat] → globe pin
  jurisdictions: string[];
  frameworks: string[];               // in-scope regimes (derived from sector + jurisdiction)
  sector?: string;                    // optional: banking|health|pharma|defence|ai-lab|energy|telecom|insurance
  posture: Posture;
  currentVendor: string;              // "unknown" unless genuinely public
  play: Play;                         // hypothesis until recon
  source: string;                     // public source (their official domain)
};

// Seed: real public regulators/authorities (play = align — we implement their frameworks)
// + a few globally-known public enterprises (play = hypothesis, vendor unknown).
export const ECOSYSTEM: Account[] = [
  { id: "eu-ai-office", name: "European AI Office", type: "regulator", region: "EU", country: "Belgium", hq: [4.35, 50.85], jurisdictions: ["eu"], frameworks: ["eu-ai-act"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "digital-strategy.ec.europa.eu" },
  { id: "nist", name: "NIST", type: "regulator", region: "US", country: "USA", hq: [-77.22, 39.14], jurisdictions: ["us"], frameworks: ["nist-ai-rmf"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "nist.gov" },
  { id: "ico-uk", name: "ICO (UK)", type: "regulator", region: "UK", country: "United Kingdom", hq: [-2.24, 53.34], jurisdictions: ["uk"], frameworks: ["uk-principles", "gdpr"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "ico.org.uk" },
  { id: "enisa", name: "ENISA", type: "regulator", region: "EU", country: "Greece", hq: [23.73, 37.98], jurisdictions: ["eu"], frameworks: ["nis2", "cra"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "enisa.europa.eu" },
  { id: "bafin", name: "BaFin", type: "regulator", region: "EU", country: "Germany", hq: [8.68, 50.11], jurisdictions: ["eu"], frameworks: ["dora", "nis2"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "bafin.de" },
  { id: "mas-sg", name: "Monetary Authority of Singapore", type: "regulator", region: "APAC", country: "Singapore", hq: [103.85, 1.28], jurisdictions: ["sg"], frameworks: ["mas-feat", "iso-42001"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "mas.gov.sg" },
  { id: "cnil", name: "CNIL", type: "regulator", region: "EU", country: "France", hq: [2.35, 48.86], jurisdictions: ["eu"], frameworks: ["gdpr", "eu-ai-act"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "cnil.fr" },
  { id: "korea-msit", name: "Ministry of Science & ICT (Korea)", type: "regulator", region: "APAC", country: "South Korea", hq: [127.4, 36.48], jurisdictions: ["kr"], frameworks: ["kr-basic-ai-act"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "msit.go.kr" },
  { id: "uk-aisi", name: "UK AI Safety Institute", type: "regulator", region: "UK", country: "United Kingdom", hq: [-0.13, 51.51], jurisdictions: ["uk"], frameworks: ["uk-principles", "frontier-safety"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "aisi.gov.uk" },
  { id: "us-ftc", name: "US Federal Trade Commission", type: "regulator", region: "US", country: "USA", hq: [-77.03, 38.89], jurisdictions: ["us"], frameworks: ["ftc-act", "us-federal"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "ftc.gov" },
  { id: "edpb", name: "European Data Protection Board", type: "regulator", region: "EU", country: "Belgium", hq: [4.35, 50.85], jurisdictions: ["eu"], frameworks: ["gdpr", "eu-ai-act"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "edpb.europa.eu" },
  { id: "de-bsi", name: "BSI (Germany)", type: "regulator", region: "EU", country: "Germany", hq: [7.12, 50.73], jurisdictions: ["eu"], frameworks: ["nis2", "cra", "iso-27001"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "bsi.bund.de" },
  { id: "fr-anssi", name: "ANSSI (France)", type: "regulator", region: "EU", country: "France", hq: [2.31, 48.86], jurisdictions: ["eu"], frameworks: ["nis2", "cra"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "cyber.gouv.fr" },
  { id: "it-garante", name: "Garante (Italy)", type: "regulator", region: "EU", country: "Italy", hq: [12.48, 41.9], jurisdictions: ["eu"], frameworks: ["gdpr", "eu-ai-act"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "garanteprivacy.it" },
  { id: "es-aesia", name: "AESIA (Spain)", type: "regulator", region: "EU", country: "Spain", hq: [-8.41, 43.37], jurisdictions: ["eu"], frameworks: ["eu-ai-act"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "aesia.gob.es" },
  { id: "ca-opc", name: "Office of the Privacy Commissioner (Canada)", type: "regulator", region: "Americas", country: "Canada", hq: [-75.7, 45.42], jurisdictions: ["ca"], frameworks: ["pipeda", "aida"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "priv.gc.ca" },
  { id: "au-oaic", name: "OAIC (Australia)", type: "regulator", region: "APAC", country: "Australia", hq: [151.21, -33.87], jurisdictions: ["au"], frameworks: ["au-privacy", "au-ai-ethics"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "oaic.gov.au" },
  { id: "jp-ppc", name: "Personal Information Protection Commission (Japan)", type: "regulator", region: "APAC", country: "Japan", hq: [139.75, 35.68], jurisdictions: ["jp"], frameworks: ["appi", "jp-ai-guidelines"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "ppc.go.jp" },
  { id: "cn-cac", name: "Cyberspace Administration of China", type: "regulator", region: "APAC", country: "China", hq: [116.38, 39.9], jurisdictions: ["cn"], frameworks: ["tc260", "genai-measures"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "cac.gov.cn" },
  { id: "sg-imda", name: "IMDA / PDPC (Singapore)", type: "regulator", region: "APAC", country: "Singapore", hq: [103.85, 1.29], jurisdictions: ["sg"], frameworks: ["model-ai-gov", "ai-verify"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "imda.gov.sg" },
  { id: "br-anpd", name: "ANPD (Brazil)", type: "regulator", region: "Americas", country: "Brazil", hq: [-47.93, -15.78], jurisdictions: ["br"], frameworks: ["lgpd", "br-ai-bill"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "gov.br/anpd" },
  { id: "sa-sdaia", name: "SDAIA (Saudi Arabia)", type: "regulator", region: "MENA", country: "Saudi Arabia", hq: [46.68, 24.71], jurisdictions: ["sa"], frameworks: ["sa-ai-ethics", "pdpl"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "sdaia.gov.sa" },
  { id: "in-meity", name: "MeitY (India)", type: "regulator", region: "APAC", country: "India", hq: [77.21, 28.61], jurisdictions: ["in"], frameworks: ["dpdp-act", "in-ai-advisory"], posture: "sets-rules", currentVendor: "n/a", play: "align", source: "meity.gov.in" },
  // Enterprises / ideal demographic — posture & vendor left honest ("unknown" pending recon)
  { id: "ent-eu-bank", name: "[EU G-SIB bank]", type: "fortune500", region: "EU", country: "—", hq: [-0.09, 51.51], jurisdictions: ["eu", "uk"], frameworks: ["eu-ai-act", "dora", "nis2", "gdpr"], posture: "unknown", currentVendor: "unknown", play: "integrate", source: "pending-recon" },
  { id: "ent-us-health", name: "[US health system]", type: "fortune500", region: "US", country: "USA", hq: [-87.63, 41.88], jurisdictions: ["us"], frameworks: ["hipaa", "nist-ai-rmf", "co-admt"], posture: "unknown", currentVendor: "unknown", play: "absorb", source: "pending-recon" },
  { id: "ent-ai-lab", name: "[Frontier AI lab]", type: "sector", region: "US", country: "USA", hq: [-122.42, 37.77], jurisdictions: ["us", "eu"], frameworks: ["eu-ai-act-gpai", "nist-ai-rmf"], posture: "mature", currentVendor: "internal", play: "integrate", source: "pending-recon" },
  { id: "ent-eu-insurer", name: "[EU insurer]", type: "fortune500", region: "EU", country: "—", hq: [8.54, 47.37], jurisdictions: ["eu"], frameworks: ["eu-ai-act", "dora", "solvency-ii"], posture: "unknown", currentVendor: "unknown", play: "integrate", source: "pending-recon" },

  // Real Fortune-100 public organisations (org-level firmographics; posture/vendor UNKNOWN
  // until per-account recon — scored as 'modeled'). Source = each org's official domain.
  { id: "jpmorgan", name: "JPMorgan Chase", type: "fortune100", region: "US", country: "USA", hq: [-73.98, 40.75], jurisdictions: ["us", "eu"], frameworks: ["dora", "eu-ai-act", "nist-ai-rmf", "gdpr"], sector: "banking", posture: "mature", currentVendor: "internal", play: "integrate", source: "jpmorganchase.com/about/technology/news/ai-and-model-risk-governance — dedicated firmwide Model Risk Governance function + Explainable AI Center of Excellence, public as of 2026" },
  { id: "bofa", name: "Bank of America", type: "fortune100", region: "US", country: "USA", hq: [-80.84, 35.23], jurisdictions: ["us"], frameworks: ["nist-ai-rmf", "us-state-ai"], sector: "banking", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "bankofamerica.com" },
  { id: "citigroup", name: "Citigroup", type: "fortune100", region: "US", country: "USA", hq: [-74.01, 40.71], jurisdictions: ["us", "eu"], frameworks: ["dora", "eu-ai-act", "nist-ai-rmf"], sector: "banking", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "citigroup.com" },
  { id: "unitedhealth", name: "UnitedHealth Group", type: "fortune100", region: "US", country: "USA", hq: [-93.46, 44.93], jurisdictions: ["us"], frameworks: ["hipaa", "nist-ai-rmf", "co-admt"], sector: "health", posture: "mature", currentVendor: "internal", play: "integrate", source: "unitedhealthgroup.com/uhg/what-we-do/artificial-intelligence/ai-responsible-use.html — Responsible AI Guiding Principles + a cross-functional AI review board, public as of 2026" },
  { id: "cvshealth", name: "CVS Health", type: "fortune100", region: "US", country: "USA", hq: [-71.51, 42.00], jurisdictions: ["us"], frameworks: ["hipaa", "nist-ai-rmf"], sector: "health", posture: "emerging", currentVendor: "unknown", play: "integrate", source: "cvshealth.com — exec-quoted public commitment to responsible-AI guardrails (no AI in clinical diagnosis/claims-denial decisions per company statements); no dedicated internal program name found, kept modeled not verified" },
  { id: "pfizer", name: "Pfizer", type: "fortune100", region: "US", country: "USA", hq: [-73.97, 40.75], jurisdictions: ["us", "eu"], frameworks: ["eu-ai-act-highrisk", "gxp-ai", "nist-ai-rmf"], sector: "pharma", posture: "mature", currentVendor: "internal", play: "integrate", source: "pfizer.com/news/articles/three_principles_of_responsibility_for_artificial_intelligence_ai_in_healthcare — published Responsible AI Principles, public as of 2026" },
  { id: "microsoft", name: "Microsoft", type: "fortune100", region: "US", country: "USA", hq: [-122.13, 47.64], jurisdictions: ["us", "eu"], frameworks: ["eu-ai-act-gpai", "nist-ai-rmf", "iso-42001"], sector: "ai-lab", posture: "mature", currentVendor: "internal", play: "integrate", source: "microsoft.com/en-us/ai/responsible-ai — Responsible AI Standard v2 enforced via the Office of Responsible AI, aligned to NIST AI RMF, public as of 2026" },
  { id: "alphabet", name: "Alphabet (Google)", type: "fortune100", region: "US", country: "USA", hq: [-122.08, 37.42], jurisdictions: ["us", "eu"], frameworks: ["eu-ai-act-gpai", "nist-ai-rmf", "iso-42001"], sector: "ai-lab", posture: "mature", currentVendor: "internal", play: "integrate", source: "abc.xyz — AI Principles + Frontier Safety Framework + a new Board Risk & Compliance Committee (est. per FY2026 DEF 14A), public as of 2026" },
  { id: "exxonmobil", name: "ExxonMobil", type: "fortune100", region: "US", country: "USA", hq: [-96.94, 32.86], jurisdictions: ["us"], frameworks: ["nist-ai-rmf", "us-state-ai"], sector: "energy", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "corporate.exxonmobil.com" },
  { id: "lockheed", name: "Lockheed Martin", type: "fortune100", region: "US", country: "USA", hq: [-77.10, 38.98], jurisdictions: ["us"], frameworks: ["nist-ai-rmf", "itar-ear", "nato-ai"], sector: "defence", posture: "mature", currentVendor: "internal", play: "integrate", source: "lockheedmartin.com/en-us/careers/campaigns/2025/laic.html — first aerospace/defence contractor to adopt DoD Ethical AI Principles + internal AI governance council, public as of 2025-2026" },
  { id: "att", name: "AT&T", type: "fortune100", region: "US", country: "USA", hq: [-96.80, 32.78], jurisdictions: ["us"], frameworks: ["nist-ai-rmf", "us-state-ai"], sector: "telecom", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "about.att.com" },
  { id: "elevance", name: "Elevance Health", type: "fortune100", region: "US", country: "USA", hq: [-86.16, 39.77], jurisdictions: ["us"], frameworks: ["hipaa", "nist-ai-rmf", "co-admt"], sector: "insurance", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "elevancehealth.com" },
  { id: "wellsfargo", name: "Wells Fargo", type: "fortune100", region: "US", country: "USA", hq: [-122.40, 37.79], jurisdictions: ["us"], frameworks: ["nist-ai-rmf", "us-state-ai"], sector: "banking", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "wellsfargo.com" },
  { id: "goldmansachs", name: "Goldman Sachs", type: "fortune100", region: "US", country: "USA", hq: [-74.01, 40.71], jurisdictions: ["us", "eu"], frameworks: ["dora", "eu-ai-act", "nist-ai-rmf"], sector: "banking", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "goldmansachs.com" },
  { id: "morganstanley", name: "Morgan Stanley", type: "fortune100", region: "US", country: "USA", hq: [-73.98, 40.77], jurisdictions: ["us", "eu"], frameworks: ["dora", "eu-ai-act", "nist-ai-rmf"], sector: "banking", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "morganstanley.com" },
  { id: "amex", name: "American Express", type: "fortune100", region: "US", country: "USA", hq: [-74.01, 40.72], jurisdictions: ["us"], frameworks: ["nist-ai-rmf", "pci-dss"], sector: "finance", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "americanexpress.com" },
  { id: "cigna", name: "The Cigna Group", type: "fortune100", region: "US", country: "USA", hq: [-72.73, 41.83], jurisdictions: ["us"], frameworks: ["hipaa", "nist-ai-rmf"], sector: "insurance", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "cigna.com" },
  { id: "hca", name: "HCA Healthcare", type: "fortune100", region: "US", country: "USA", hq: [-86.79, 36.15], jurisdictions: ["us"], frameworks: ["hipaa", "nist-ai-rmf"], sector: "health", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "hcahealthcare.com" },
  { id: "mckesson", name: "McKesson", type: "fortune100", region: "US", country: "USA", hq: [-96.94, 32.86], jurisdictions: ["us"], frameworks: ["hipaa", "nist-ai-rmf"], sector: "health", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "mckesson.com" },
  { id: "humana", name: "Humana", type: "fortune100", region: "US", country: "USA", hq: [-85.76, 38.25], jurisdictions: ["us"], frameworks: ["hipaa", "nist-ai-rmf"], sector: "insurance", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "humana.com" },
  { id: "jnj", name: "Johnson & Johnson", type: "fortune100", region: "US", country: "USA", hq: [-74.45, 40.49], jurisdictions: ["us", "eu"], frameworks: ["eu-ai-act-highrisk", "gxp-ai", "nist-ai-rmf"], sector: "pharma", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "jnj.com" },
  { id: "merck", name: "Merck & Co.", type: "fortune100", region: "US", country: "USA", hq: [-74.28, 40.61], jurisdictions: ["us", "eu"], frameworks: ["eu-ai-act-highrisk", "gxp-ai", "nist-ai-rmf"], sector: "pharma", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "merck.com" },
  { id: "abbvie", name: "AbbVie", type: "fortune100", region: "US", country: "USA", hq: [-87.84, 42.31], jurisdictions: ["us", "eu"], frameworks: ["eu-ai-act-highrisk", "gxp-ai"], sector: "pharma", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "abbvie.com" },
  { id: "meta", name: "Meta Platforms", type: "fortune100", region: "US", country: "USA", hq: [-122.15, 37.48], jurisdictions: ["us", "eu"], frameworks: ["eu-ai-act-gpai", "nist-ai-rmf", "gdpr"], sector: "ai-lab", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "meta.com" },
  { id: "nvidia", name: "NVIDIA", type: "fortune100", region: "US", country: "USA", hq: [-121.96, 37.37], jurisdictions: ["us", "eu"], frameworks: ["eu-ai-act-gpai", "nist-ai-rmf", "iso-42001"], sector: "ai-lab", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "nvidia.com" },
  { id: "ibm", name: "IBM", type: "fortune100", region: "US", country: "USA", hq: [-73.72, 41.11], jurisdictions: ["us", "eu"], frameworks: ["eu-ai-act", "nist-ai-rmf", "iso-42001"], sector: "ai-lab", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "ibm.com" },
  { id: "oracle", name: "Oracle", type: "fortune100", region: "US", country: "USA", hq: [-97.74, 30.27], jurisdictions: ["us", "eu"], frameworks: ["eu-ai-act", "nist-ai-rmf"], sector: "ai-lab", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "oracle.com" },
  { id: "chevron", name: "Chevron", type: "fortune100", region: "US", country: "USA", hq: [-121.96, 37.78], jurisdictions: ["us"], frameworks: ["nist-ai-rmf"], sector: "energy", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "chevron.com" },
  { id: "verizon", name: "Verizon", type: "fortune100", region: "US", country: "USA", hq: [-74.01, 40.71], jurisdictions: ["us"], frameworks: ["nist-ai-rmf", "us-state-ai"], sector: "telecom", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "verizon.com" },
  { id: "rtx", name: "RTX (Raytheon)", type: "fortune100", region: "US", country: "USA", hq: [-77.09, 38.88], jurisdictions: ["us"], frameworks: ["nist-ai-rmf", "itar-ear", "nato-ai"], sector: "defence", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "rtx.com" },
  { id: "boeing", name: "Boeing", type: "fortune100", region: "US", country: "USA", hq: [-77.09, 38.89], jurisdictions: ["us"], frameworks: ["nist-ai-rmf", "itar-ear"], sector: "defence", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "boeing.com" },
  { id: "northrop", name: "Northrop Grumman", type: "fortune100", region: "US", country: "USA", hq: [-77.17, 38.88], jurisdictions: ["us"], frameworks: ["nist-ai-rmf", "itar-ear", "nato-ai"], sector: "defence", posture: "unknown", currentVendor: "unknown", play: "integrate", source: "northropgrumman.com" },
];

// The fixed testing rubric axes (see DISTRIBUTION_HIVE.md §4).
export const RUBRIC = [
  "Framework coverage", "Agentic governance", "Verifiable proof",
  "Live tooling", "Enforcement timing", "Sovereignty / data", "Integration effort",
];

export const PLAY_META: Record<Play, { label: string; tone: string }> = {
  align: { label: "Align — implement their framework", tone: "text-teal-300 border-teal-400/30" },
  absorb: { label: "Absorb — be their platform", tone: "text-emerald-300 border-emerald-400/30" },
  integrate: { label: "Integrate — the layer under them", tone: "text-sky-300 border-sky-400/30" },
  displace: { label: "Displace — clean house", tone: "text-amber-300 border-amber-400/30" },
};
