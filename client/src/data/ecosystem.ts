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
  // Enterprises / ideal demographic — posture & vendor left honest ("unknown" pending recon)
  { id: "ent-eu-bank", name: "[EU G-SIB bank]", type: "fortune500", region: "EU", country: "—", hq: [-0.09, 51.51], jurisdictions: ["eu", "uk"], frameworks: ["eu-ai-act", "dora", "nis2", "gdpr"], posture: "unknown", currentVendor: "unknown", play: "integrate", source: "pending-recon" },
  { id: "ent-us-health", name: "[US health system]", type: "fortune500", region: "US", country: "USA", hq: [-87.63, 41.88], jurisdictions: ["us"], frameworks: ["hipaa", "nist-ai-rmf", "co-admt"], posture: "unknown", currentVendor: "unknown", play: "absorb", source: "pending-recon" },
  { id: "ent-ai-lab", name: "[Frontier AI lab]", type: "sector", region: "US", country: "USA", hq: [-122.42, 37.77], jurisdictions: ["us", "eu"], frameworks: ["eu-ai-act-gpai", "nist-ai-rmf"], posture: "mature", currentVendor: "internal", play: "integrate", source: "pending-recon" },
  { id: "ent-eu-insurer", name: "[EU insurer]", type: "fortune500", region: "EU", country: "—", hq: [8.54, 47.37], jurisdictions: ["eu"], frameworks: ["eu-ai-act", "dora", "solvency-ii"], posture: "unknown", currentVendor: "unknown", play: "integrate", source: "pending-recon" },
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
