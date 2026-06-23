import catalog from "@/data/data-catalog.json";
import type { DataCatalogEntry } from "@/types/data-catalog";

export interface HiveDefinition {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  categoryMatches: string[];
  useCase: string;
  color: string;
}

export const HIVES: HiveDefinition[] = [
  {
    slug: "security",
    name: "Security Hive",
    tagline: "Threat intelligence, CVEs, and adversarial signals",
    description:
      "The Security Hive starter pack surfaces open-source threat intelligence feeds that CSOAI agents use for vulnerability triage, attack-pattern modelling, and compliance boundary enforcement.",
    categoryMatches: ["CYBERSECURITY"],
    useCase:
      "Feed NVD + CISA KEV + MITRE ATT&CK into the Security Hive. Agents correlate CVEs with your asset inventory, rank risk via EPSS, and emit Alarm pheromones when active exploitation is detected.",
    color: "#f87171",
  },
  {
    slug: "finance",
    name: "Finance Hive",
    tagline: "Filings, rates, entities, crypto, and sanctions",
    description:
      "Open financial and business data for trading, risk scoring, entity resolution, and sanctions screening — all $0 annual cost.",
    categoryMatches: ["FINANCIAL", "TRADE", "COMPANY"],
    useCase:
      "Combine SEC EDGAR, FRED, GLEIF, OFAC, and OpenSanctions to build a live entity-risk graph. Finance Hive agents screen counterparties, track macro shifts, and settle micro-transactions over x402.",
    color: "#34d399",
  },
  {
    slug: "governance",
    name: "Governance Hive",
    tagline: "Regulations, cases, controls, and enforcement",
    description:
      "The regulatory knowledge base that powers CSOAI's 13-framework engine, cross-jurisdiction gap analysis, and Ed25519 sigil attestations.",
    categoryMatches: ["REGULATORY", "GOVERNMENT"],
    useCase:
      "Ingest EUR-Lex SPARQL, NIST OSCAL, the Secure Controls Framework, and CourtListener. Governance Hive agents map new obligations to controls, detect drift, and sign compliance proofs.",
    color: "#a78bfa",
  },
  {
    slug: "research",
    name: "Research Hive",
    tagline: "Papers, patents, climate, health, and knowledge graphs",
    description:
      "Academic, scientific, and statistical datasets for R&D agents, innovation scouting, and evidence-based policy drafting.",
    categoryMatches: ["ACADEMIC", "GOVERNMENT", "GEOGRAPHIC"],
    useCase:
      "Connect arXiv, Semantic Scholar, OpenAlex, USPTO, and WHO GHO. Research Hive agents track emerging science, map patent landscapes, and generate citation-backed briefs.",
    color: "#38bdf8",
  },
  {
    slug: "operations",
    name: "Operations Hive",
    tagline: "Companies, logistics, geography, and trade flows",
    description:
      "Entity, location, and movement data for logistics, supply-chain resilience, and infrastructure-aware agents.",
    categoryMatches: ["COMPANY", "GEOGRAPHIC", "TRADE"],
    useCase:
      "Merge OpenCorporates, GLEIF, OpenStreetMap, UN Comtrade, and Sentinel imagery. Operations Hive agents verify supply chains, route assets, and audit cross-border flows.",
    color: "#fbbf24",
  },
  {
    slug: "creative",
    name: "Creative Hive",
    tagline: "Culture, content, and knowledge exploration",
    description:
      "Open data for generative canvases, cultural analytics, and trend-aware creative agents.",
    categoryMatches: ["ACADEMIC", "GOVERNMENT"],
    useCase:
      "Use Wikidata, DBpedia, and Common Crawl samples as creative reference fuel. Creative Hive agents ground campaigns in verified facts and real-world signals.",
    color: "#f472b6",
  },
];

export function getHiveEntries(slug: string): DataCatalogEntry[] {
  const hive = HIVES.find((h) => h.slug === slug);
  if (!hive) return [];
  return catalog.entries.filter((e) =>
    hive.categoryMatches.some((m) => e.category.toLowerCase().includes(m.toLowerCase()))
  );
}

export function getHive(slug: string): HiveDefinition | undefined {
  return HIVES.find((h) => h.slug === slug);
}

export interface ProtocolDataMapping {
  slug: string;
  dataKeywords: string[];
  explanation: string;
}

export const PROTOCOL_DATA_MAPPINGS: ProtocolDataMapping[] = [
  {
    slug: "mcp",
    dataKeywords: ["MCP", "CVE", "NVD", "CISA", "MITRE", "SEC", "EDGAR", "FRED", "GLEIF", "OpenSanctions"],
    explanation:
      "MCP servers in the Security, Finance, and Governance Hives draw on these feeds to answer tool calls with real-world data.",
  },
  {
    slug: "a2a",
    dataKeywords: ["EUR-Lex", "NIST", "OSCAL", "GDPR", "CourtListener", "Wikidata", "OpenAlex"],
    explanation:
      "A2A task delegation between Governance and Research Hive agents relies on shared regulatory and knowledge-graph sources.",
  },
  {
    slug: "x402",
    dataKeywords: ["SEC", "EDGAR", "FRED", "CoinGecko", "Alpha Vantage", "OFAC", "GLEIF", "World Bank"],
    explanation:
      "Every x402 micro-transaction can be enriched with SEC filings, macro indicators, and entity/sanctions checks before settlement.",
  },
  {
    slug: "did",
    dataKeywords: ["GLEIF", "OpenCorporates", "OpenOwnership", "Wikidata", "PermID"],
    explanation:
      "DID resolution and agent passports are anchored in global entity graphs and beneficial-ownership records.",
  },
  {
    slug: "aip",
    dataKeywords: ["NIST", "OSCAL", "MITRE", "CISA", "GDPR", "OpenSanctions"],
    explanation:
      "Agent Identity Protocol credentials carry attestations backed by security and compliance datasets.",
  },
  {
    slug: "wimse",
    dataKeywords: ["NIST", "CISA", "MITRE", "CVE", "EPSS"],
    explanation:
      "Workload identity tokens are issued with threat-context from CVE and adversary-TTP feeds.",
  },
  {
    slug: "agt",
    dataKeywords: ["NIST", "OSCAL", "MITRE", "GDPR", "OpenSanctions"],
    explanation:
      "Agent Gateway Transfer validates crossing agents against governance and threat-intel graphs.",
  },
  {
    slug: "ap2",
    dataKeywords: ["SEC", "EDGAR", "FRED", "GLEIF", "OFAC", "CoinGecko"],
    explanation:
      "AP2 payment agents pre-check counterparties with filings, rates, and sanctions data.",
  },
  {
    slug: "ucp",
    dataKeywords: ["SEC", "EDGAR", "FRED", "World Bank", "IMF", "OpenSanctions"],
    explanation:
      "Universal Commerce Protocol flows are validated against macro, entity, and sanctions signals.",
  },
];

export function getDatasetsForProtocol(slug: string): DataCatalogEntry[] {
  const mapping = PROTOCOL_DATA_MAPPINGS.find((m) => m.slug === slug);
  if (!mapping) return [];
  const keywords = mapping.dataKeywords.map((k) => k.toLowerCase());
  return catalog.entries.filter((e) =>
    keywords.some(
      (k) =>
        e.name.toLowerCase().includes(k) ||
        (e.keyData && e.keyData.toLowerCase().includes(k)) ||
        (e.format && e.format.toLowerCase().includes(k))
    )
  );
}

export const PACK_DATA_MAPPINGS: { slug: string; dataKeywords: string[]; explanation: string }[] = [
  {
    slug: "eu-ai-act",
    dataKeywords: ["EUR-Lex", "GDPR", "NIST", "OSCAL", "CourtListener", "OpenSanctions"],
    explanation: "EU AI Act compliance requires EU law, GDPR enforcement precedent, and control crosswalks.",
  },
  {
    slug: "brand-distribution",
    dataKeywords: ["USPTO", "EPO", "OpenAlex", "arXiv", "Wikidata", "OpenStreetMap"],
    explanation: "Brand authority and distribution intelligence use patent, research, and geographic signals.",
  },
  {
    slug: "agentic-finance",
    dataKeywords: ["SEC", "EDGAR", "FRED", "GLEIF", "OFAC", "CoinGecko", "World Bank"],
    explanation: "Agentic finance pre-checks trades against filings, macro data, entities, and sanctions.",
  },
];

export function getDatasetsForPack(slug: string): DataCatalogEntry[] {
  const mapping = PACK_DATA_MAPPINGS.find((m) => m.slug === slug);
  if (!mapping) return [];
  const keywords = mapping.dataKeywords.map((k) => k.toLowerCase());
  return catalog.entries.filter((e) =>
    keywords.some(
      (k) =>
        e.name.toLowerCase().includes(k) ||
        (e.keyData && e.keyData.toLowerCase().includes(k)) ||
        (e.format && e.format.toLowerCase().includes(k))
    )
  );
}
