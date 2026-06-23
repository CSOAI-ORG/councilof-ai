export interface CVE {
  id: string;
  cvss: number;
  description: string;
  date?: string;
}

export interface Competitor {
  slug: string;
  name: string;
  category: string;
  funding?: string;
  pricing: string;
  g2?: string;
  threat: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  weakness: string;
  killMove: string;
  cves: CVE[];
  churnTriggers: string[];
  sources: { label: string; url?: string }[];
}

export const COMPETITORS: Competitor[] = [
  {
    slug: "vanta",
    name: "Vanta",
    category: "Compliance automation",
    funding: "$150M+",
    pricing: "$10K–$80K+/yr",
    g2: "4.7",
    threat: "CRITICAL",
    weakness:
      "50%+ renewal hikes and a confirmed cross-customer data exposure in May 2025 affecting ~400 organisations (names, roles, MFA configs).",
    killMove: "Transfer in 5 minutes, pay a tenth of the price, and keep the same SOC 2 evidence.",
    cves: [],
    churnTriggers: [
      "Renewal price hikes 30–500%",
      "Cross-customer data exposure",
      "Support tier inequality",
      "50–60% actual automation coverage",
    ],
    sources: [
      { label: "G2" },
      { label: "Reddit r/compliance" },
      { label: "Public breach reporting, May 2025" },
    ],
  },
  {
    slug: "drata",
    name: "Drata",
    category: "Compliance automation",
    funding: "$200M+",
    pricing: "$7.5K–$50K+/yr",
    g2: "4.8",
    threat: "CRITICAL",
    weakness:
      "40%+ renewals and shallow integrations that confirm a connection exists but do not map controls to AI risk registers.",
    killMove: "Map 13+ frameworks directly to your AI systems, not just checkbox connections.",
    cves: [],
    churnTriggers: [
      "40%+ renewals",
      "Shallow integrations",
      "Framework overlap nightmare",
      "Manual work remains 60–70%",
    ],
    sources: [{ label: "G2" }, { label: "HackerNews" }],
  },
  {
    slug: "servicenow",
    name: "ServiceNow IRM",
    category: "Enterprise GRC",
    funding: "Public",
    pricing: "$50K–$500K+/yr",
    g2: "4.4",
    threat: "HIGH",
    weakness:
      "Four unauthenticated CVSS 9.8 RCEs in 18 months and deployment timelines measured in quarters, not minutes.",
    killMove: "Deploy a 12-minute MCP instead of a 12-month implementation.",
    cves: [
      { id: "CVE-2025-12420", cvss: 9.8, description: "Unauthenticated admin impersonation", date: "2025" },
      { id: "CVE-2026-0542", cvss: 9.8, description: "RCE in AI Platform sandbox", date: "2026" },
      { id: "CVE-2024-4879", cvss: 9.8, description: "Unauthenticated RCE", date: "2024" },
      { id: "CVE-2024-5217", cvss: 9.8, description: "Unauthenticated RCE", date: "2024" },
      { id: "CVE-2024-8923", cvss: 9.8, description: "Unauthenticated RCE", date: "2024" },
    ],
    churnTriggers: [
      "$50K–$500K+ entry price",
      "12–24 month implementation",
      "Systemic security failures",
    ],
    sources: [{ label: "NVD / CVE databases" }, { label: "G2" }],
  },
  {
    slug: "credo-ai",
    name: "Credo AI",
    category: "AI governance",
    funding: "$42M",
    pricing: "$40K–$150K+/yr",
    g2: "4.0",
    threat: "CRITICAL",
    weakness:
      "Governance-layer only with no runtime enforcement, simulation, or agentic control plane.",
    killMove: "28 hives + 47 agents give you governance, runtime enforcement, and simulation in one layer.",
    cves: [],
    churnTriggers: [
      "Single domain coverage",
      "No runtime security",
      "No agent simulation",
    ],
    sources: [{ label: "G2" }],
  },
  {
    slug: "rsa-archer",
    name: "RSA Archer",
    category: "Enterprise GRC",
    funding: "Private equity",
    pricing: "$75K–$500K+/yr",
    g2: "3.9",
    threat: "MEDIUM",
    weakness: "15+ CVEs, legacy complexity, and a 3.9 G2 rating that reflects implementation pain.",
    killMove: "Modern stack, no CVEs, and one-tenth the cost.",
    cves: [
      { id: "CVE-2025-50572", cvss: 8.8, description: "CSV injection → arbitrary code", date: "2025" },
    ],
    churnTriggers: [
      "15+ CVEs",
      "Complex implementation",
      "Low G2 satisfaction",
    ],
    sources: [{ label: "NVD" }, { label: "G2" }],
  },
  {
    slug: "microsoft-purview",
    name: "Microsoft Purview",
    category: "Data governance",
    funding: "Public",
    pricing: "Included in M365 E5",
    g2: "N/A",
    threat: "CRITICAL",
    weakness:
      "Bundle lock-in and M365-only coverage: useless if your AI stack spans AWS, GCP, or sovereign infrastructure.",
    killMove: "Open source, any cloud, sovereign deployment, no bundle ransom.",
    cves: [],
    churnTriggers: [
      "M365-only",
      "Bundle lock-in",
      "No sovereign deployment",
    ],
    sources: [{ label: "Microsoft pricing" }],
  },
  {
    slug: "onetrust",
    name: "OneTrust",
    category: "Privacy / GRC",
    funding: "$400M+",
    pricing: "$10K–$300K+/yr",
    g2: "4.2",
    threat: "HIGH",
    weakness:
      "22–80% mid-contract price increases and a privacy-first posture that misses AI runtime enforcement.",
    killMove: "Predictable pricing, AI-native controls, and no mid-contract surprises.",
    cves: [],
    churnTriggers: [
      "22–80% mid-contract price increases",
      "Privacy-led, AI-runtime gap",
      "Complex renewal negotiations",
    ],
    sources: [{ label: "TrustRadius" }, { label: "G2" }],
  },
  {
    slug: "ibm-openpages",
    name: "IBM OpenPages",
    category: "Enterprise GRC",
    funding: "Public",
    pricing: "$40K–$1.5M+/yr",
    g2: "4.1",
    threat: "MEDIUM",
    weakness: "12–24 month implementation timelines and a CVSS 9.4 HTTP parameter pollution flaw.",
    killMove: "AI governance in weeks, not years, with no legacy CVEs.",
    cves: [
      { id: "CVE-2025-7783", cvss: 9.4, description: "HTTP Parameter Pollution", date: "2025" },
    ],
    churnTriggers: [
      "12–24 month implementation",
      "High entry price",
      "Legacy architecture",
    ],
    sources: [{ label: "NVD" }, { label: "G2" }],
  },
  {
    slug: "noma-security",
    name: "Noma Security",
    category: "AI security",
    funding: "$132M",
    pricing: "Enterprise",
    g2: "N/A",
    threat: "CRITICAL",
    weakness: "$132M in funding but no visible production users or public verification yet.",
    killMove: "We are live and certifying systems today; they are still fundraising.",
    cves: [],
    churnTriggers: ["No public customer proof", "Enterprise-only waitlists"],
    sources: [{ label: "Funding databases" }],
  },
  {
    slug: "geordie-ai",
    name: "Geordie AI",
    category: "AI security",
    funding: "$36.5M",
    pricing: "Enterprise",
    g2: "N/A",
    threat: "CRITICAL",
    weakness:
      "Well-funded AI security point solution with no open protocol, no certification layer, and no public verify mechanism.",
    killMove: "Open protocols, signed certificates, and public verification that customers can check in seconds.",
    cves: [],
    churnTriggers: ["Closed platform", "No certification layer", "Enterprise-only"],
    sources: [{ label: "Funding databases" }],
  },
  {
    slug: "braintrust",
    name: "Braintrust",
    category: "AI evaluation",
    funding: "$124M",
    pricing: "Usage-based",
    g2: "N/A",
    threat: "HIGH",
    weakness:
      "Evaluation-centric platform; strong on LLM testing but lacks cross-regulatory compliance, certifications, and GRC depth.",
    killMove: "Move from model testing to full regulatory attestation with one platform.",
    cves: [],
    churnTriggers: ["No compliance certification layer", "Usage-based cost uncertainty"],
    sources: [{ label: "Funding databases" }],
  },
  {
    slug: "witnessai",
    name: "WitnessAI",
    category: "AI security",
    funding: "$85.5M",
    pricing: "Enterprise",
    g2: "N/A",
    threat: "CRITICAL",
    weakness:
      "Agent security point solution with no public governance framework crosswalk or open verification standard.",
    killMove: "Agent security + governance + signed proof, all in one Layer 0 stack.",
    cves: [],
    churnTriggers: ["No public framework crosswalk", "Closed verification"],
    sources: [{ label: "Funding databases" }],
  },
];

export const TRANSFER_SUPPORTED_PLATFORMS = [
  "Vanta",
  "Drata",
  "ServiceNow",
  "Credo AI",
  "Sprinto",
  "Scrut Automation",
  "Hyperproof",
  "Secureframe",
  "OneTrust",
  "AuditBoard",
  "IBM OpenPages",
  "RSA Archer",
  "MetricStream",
  "Workiva",
  "LogicGate",
];

export function getCompetitorBySlug(slug: string): Competitor | undefined {
  return COMPETITORS.find((c) => c.slug === slug);
}

export function getCompetitorSlugs(): string[] {
  return COMPETITORS.map((c) => c.slug);
}
