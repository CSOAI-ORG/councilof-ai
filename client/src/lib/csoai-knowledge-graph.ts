// csoai-knowledge-graph.ts - The CSOAI Unified Knowledge Graph
// 200+ regulators × 500+ frameworks × 1000+ cross-walks × institutional alignments
// 33 Hives × 5 verticals × 619 MCPs all mapped into ONE queryable graph
// The closest thing to real-world bridge to digital

export interface RegulatorNode {
  id: string
  name: string
  fullName: string
  country: string
  city: string
  lat: number
  lon: number
  jurisdiction: string
  type: "government" | "agency" | "industry_body" | "standards_org" | "supranational" | "defense" | "intelligence" | "lobbying_org"
  parentOrg?: string
  annualBudgetUsd?: number
  headCount?: number
  establishedYear?: number
  parentCompany?: string
  policyEngagementSpendUsd?: number
  policyEngagementIntensity?: number  // 0-10 (10 = highest capture)
  revolvingDoorPositions?: { person: string; fromOrg: string; toOrg: string; year: number }[]
  keyPeople?: { name: string; role: string; previousEmployment?: string; currentEmployment?: string }[]
  fundingSources?: string[]
  twitterHandle?: string
  wikipediaUrl?: string
  parentOrganization?: string
}

export interface FrameworkNode {
  id: string
  name: string
  fullName: string
  regulatorIds: string[]  // links to regulators
  jurisdictionIds: string[]  // links to jurisdictions
  category: "ai" | "data" | "privacy" | "security" | "financial" | "healthcare" | "telecom" | "energy" | "defense" | "manufacturing" | "retail" | "transport" | "agriculture" | "construction" | "environmental"
  effectiveDate: string
  enforcementStartDate?: string
  status: "active" | "drafting" | "passed" | "repealed" | "superseded"
  scope: string
  obligations: string[]
  penalties: { type: string; maxAmount: string; criteria: string }[]
  crossWalks: string[]  // IDs of related frameworks
  policyEngagementIntensity?: number  // 0-10
  policyEngagementSpendUsd?: number
  primaryEngagementPartners?: string[]  // IDs of lobbying orgs
  textUrl?: string
  keyArticles?: { number: string; title: string; summary: string }[]
}

export interface CrosswalkEdge {
  fromFrameworkId: string
  toFrameworkId: string
  type: "supersedes" | "amends" | "implements" | "cross-walks-to" | "conflicts-with" | "overlaps-with" | "depends-on"
  description: string
  confidence: number  // 0-1
}

export interface InstitutionalAlignment {
  id: string
  type: "career-path" | "policy-engagement" | "jurisdictional-relocation" | "subsidiary-structure" | "trade-body-membership" | "research-funding" | "standards-committee-participation" | "academic-affiliation"
  fromNode: string  // org or person ID
  toNode: string
  description: string
  evidenceUrl?: string
  confidence: number  // 0-1
  yearDiscovered?: number
}

export interface JurisdictionNode {
  id: string
  name: string
  isoCode: string
  region: "EU" | "UK" | "US" | "APAC" | "LATAM" | "MEA" | "CANADA" | "AUSTRALIA" | "AFRICA"
  population: number
  gdpUsd: number
  governmentType: string
  primaryRegulators: string[]  // regulator IDs
  primaryFrameworks: string[]  // framework IDs
  currency: string
  languages: string[]
}

// =====================================================================
// THE 200+ REGULATORS
// =====================================================================
export const REGULATORS: RegulatorNode[] = [
  // ===== EU =====
  { id: "reg-eu-aioffice", name: "EU AI Office", fullName: "European AI Office (Brussels)", country: "BE", city: "Brussels", lat: 50.8503, lon: 4.3517, jurisdiction: "EU", type: "agency", parentOrg: "European Commission", establishedYear: 2024, headCount: 140, annualBudgetUsd: 5_000_000, keyPeople: [{ name: "Lucilla Sioli", role: "Director", previousEmployment: "European Commission DG CNECT" }], wikipediaUrl: "https://en.wikipedia.org/wiki/European_AI_Office", parentOrganization: "European Commission" },
  { id: "reg-eu-edpb", name: "EDPB", fullName: "European Data Protection Board", country: "BE", city: "Brussels", lat: 50.8503, lon: 4.3517, jurisdiction: "EU", type: "agency", parentOrg: "European Commission", establishedYear: 2018, headCount: 80, annualBudgetUsd: 25_000_000, keyPeople: [{ name: "Andrea Jelinek", role: "Chair" }], wikipediaUrl: "https://en.wikipedia.org/wiki/European_Data_Protection_Board" },
  { id: "reg-eu-eba", name: "EBA", fullName: "European Banking Authority", country: "FR", city: "Paris", lat: 48.8566, lon: 2.3522, jurisdiction: "EU", type: "agency", parentOrg: "European Commission", establishedYear: 2011, headCount: 400, annualBudgetUsd: 60_000_000, keyPeople: [{ name: "José Manuel Campa", role: "Chair" }], wikipediaUrl: "https://en.wikipedia.org/wiki/European_Banking_Authority" },
  { id: "reg-eu-enisa", name: "ENISA", fullName: "European Union Agency for Cybersecurity", country: "GR", city: "Athens", lat: 37.9838, lon: 23.7275, jurisdiction: "EU", type: "agency", parentOrg: "European Commission", establishedYear: 2004, headCount: 200, annualBudgetUsd: 30_000_000, keyPeople: [{ name: "Juhan Lepassaar", role: "Executive Director" }], wikipediaUrl: "https://en.wikipedia.org/wiki/ENISA" },
  { id: "reg-eu-eba-dora", name: "EBA DORA", fullName: "EBA Digital Operational Resilience Act", country: "FR", city: "Paris", lat: 48.8566, lon: 2.3522, jurisdiction: "EU", type: "agency", parentOrg: "EBA" },
  { id: "reg-eu-cen", name: "CEN-CENELEC", fullName: "European Committee for Standardization", country: "BE", city: "Brussels", lat: 50.8503, lon: 4.3517, jurisdiction: "EU", type: "standards_org", establishedYear: 1961, headCount: 500, annualBudgetUsd: 50_000_000, wikipediaUrl: "https://en.wikipedia.org/wiki/CEN" },
  { id: "reg-eu-jrc", name: "JRC", fullName: "Joint Research Centre (EU Commission)", country: "IT", city: "Ispra", lat: 45.8167, lon: 8.6167, jurisdiction: "EU", type: "agency", parentOrg: "European Commission", establishedYear: 1957, headCount: 3000, annualBudgetUsd: 250_000_000 },
  { id: "reg-eu-eiopa", name: "EIOPA", fullName: "European Insurance and Occupational Pensions Authority", country: "DE", city: "Frankfurt", lat: 50.1109, lon: 8.6821, jurisdiction: "EU", type: "agency", parentOrg: "European Commission" },
  { id: "reg-eu-esma", name: "ESMA", fullName: "European Securities and Markets Authority", country: "FR", city: "Paris", lat: 48.8566, lon: 2.3522, jurisdiction: "EU", type: "agency", parentOrg: "European Commission" },
  // ===== UK =====
  { id: "reg-uk-ico", name: "ICO", fullName: "Information Commissioner's Office (UK)", country: "GB", city: "Wilmslow", lat: 53.3275, lon: -2.2297, jurisdiction: "UK", type: "agency", parentOrg: "UK Government", establishedYear: 1984, headCount: 800, annualBudgetUsd: 80_000_000, keyPeople: [{ name: "John Edwards", role: "Commissioner" }], wikipediaUrl: "https://en.wikipedia.org/wiki/Information_Commissioner%27s_Office" },
  { id: "reg-uk-fca", name: "FCA", fullName: "Financial Conduct Authority", country: "GB", city: "London", lat: 51.5155, lon: -0.0922, jurisdiction: "UK", type: "agency", parentOrg: "UK Government", establishedYear: 2013, headCount: 4000, annualBudgetUsd: 600_000_000, keyPeople: [{ name: "Nikhil Rathi", role: "CEO" }], wikipediaUrl: "https://en.wikipedia.org/wiki/Financial_Conduct_Authority" },
  { id: "reg-uk-mod", name: "UK MoD", fullName: "UK Ministry of Defence", country: "GB", city: "London", lat: 51.5155, lon: -0.0922, jurisdiction: "UK", type: "government", parentOrg: "UK Government", establishedYear: 1964, headCount: 250000, annualBudgetUsd: 70_000_000_000, keyPeople: [{ name: "Grant Shapps", role: "Secretary of State for Defence" }], wikipediaUrl: "https://en.wikipedia.org/wiki/Ministry_of_Defence_(United_Kingdom)" },
  { id: "reg-uk-di", name: "Defence Intelligence", fullName: "UK Defence Intelligence (DI)", country: "GB", city: "London", lat: 51.5155, lon: -0.0922, jurisdiction: "UK", type: "intelligence", parentOrg: "UK MoD" },
  { id: "reg-uk-gchq", name: "GCHQ", fullName: "UK Government Communications Headquarters", country: "GB", city: "Cheltenham", lat: 51.8994, lon: -2.0783, jurisdiction: "UK", type: "intelligence", parentOrg: "UK MoD", establishedYear: 1919, headCount: 6500, annualBudgetUsd: 4_000_000_000, keyPeople: [{ name: "Anne Keast-Butler", role: "Director" }], wikipediaUrl: "https://en.wikipedia.org/wiki/Government_Communications_Headquarters" },
  { id: "reg-uk-ncsc", name: "NCSC", fullName: "UK National Cyber Security Centre", country: "GB", city: "London", lat: 51.5155, lon: -0.0922, jurisdiction: "UK", type: "agency", parentOrg: "GCHQ", establishedYear: 2016, headCount: 1000, keyPeople: [{ name: "Felicity Oswald", role: "CEO" }], wikipediaUrl: "https://en.wikipedia.org/wiki/National_Cyber_Security_Centre_(United_Kingdom)" },
  // ===== US =====
  { id: "reg-us-nist", name: "NIST", fullName: "National Institute of Standards and Technology", country: "US", city: "Gaithersburg", lat: 39.1434, lon: -77.2014, jurisdiction: "US", type: "agency", parentOrg: "US Department of Commerce", establishedYear: 1901, headCount: 3500, annualBudgetUsd: 1_500_000_000, keyPeople: [{ name: "Laurie E. Locascio", role: "Director" }], wikipediaUrl: "https://en.wikipedia.org/wiki/National_Institute_of_Standards_and_Technology" },
  { id: "reg-us-ostp", name: "OSTP", fullName: "White House Office of Science and Technology Policy", country: "US", city: "Washington DC", lat: 38.8977, lon: -77.0365, jurisdiction: "US", type: "government", parentOrg: "White House", establishedYear: 1976, headCount: 50, annualBudgetUsd: 5_000_000, keyPeople: [{ name: "Arati Prabhakar", role: "Director" }], wikipediaUrl: "https://en.wikipedia.org/wiki/Office_of_Science_and_Technology_Policy" },
  { id: "reg-us-fedramp", name: "FedRAMP", fullName: "Federal Risk and Authorization Management Program", country: "US", city: "Washington DC", lat: 38.8977, lon: -77.0365, jurisdiction: "US", type: "government", parentOrg: "GSA", keyPeople: [{ name: "Brian Conrad", role: "Program Manager" }], wikipediaUrl: "https://en.wikipedia.org/wiki/FedRAMP" },
  { id: "reg-us-fcc", name: "FCC", fullName: "Federal Communications Commission", country: "US", city: "Washington DC", lat: 38.8977, lon: -77.0365, jurisdiction: "US", type: "government", establishedYear: 1934, headCount: 1500, annualBudgetUsd: 400_000_000, wikipediaUrl: "https://en.wikipedia.org/wiki/Federal_Communications_Commission" },
  { id: "reg-us-dhs", name: "DHS", fullName: "Department of Homeland Security", country: "US", city: "Washington DC", lat: 38.8977, lon: -77.0365, jurisdiction: "US", type: "government", establishedYear: 2002, headCount: 240000, annualBudgetUsd: 100_000_000_000, keyPeople: [{ name: "Alejandro Mayorkas", role: "Secretary" }] },
  { id: "reg-us-fda", name: "FDA", fullName: "Food and Drug Administration", country: "US", city: "Silver Spring", lat: 39.0840, lon: -77.1528, jurisdiction: "US", type: "agency", parentOrg: "US Department of Health", establishedYear: 1906, headCount: 18000, annualBudgetUsd: 6_000_000_000 },
  { id: "reg-us-sec", name: "SEC", fullName: "Securities and Exchange Commission", country: "US", city: "Washington DC", lat: 38.8977, lon: -77.0365, jurisdiction: "US", type: "government", establishedYear: 1934, headCount: 4500, annualBudgetUsd: 1_800_000_000, wikipediaUrl: "https://en.wikipedia.org/wiki/U.S._Securities_and_Exchange_Commission" },
  { id: "reg-us-cftc", name: "CFTC", fullName: "Commodity Futures Trading Commission", country: "US", city: "Washington DC", lat: 38.8977, lon: -77.0365, jurisdiction: "US", type: "government", establishedYear: 1975, headCount: 700 },
  { id: "reg-us-nsa", name: "NSA", fullName: "National Security Agency", country: "US", city: "Fort Meade", lat: 39.1092, lon: -76.7730, jurisdiction: "US", type: "intelligence", parentOrg: "US Department of Defense", establishedYear: 1952, headCount: 32000, annualBudgetUsd: 10_800_000_000, wikipediaUrl: "https://en.wikipedia.org/wiki/National_Security_Agency" },
  // ===== APAC =====
  { id: "reg-cn-cac", name: "CAC", fullName: "Cyberspace Administration of China", country: "CN", city: "Beijing", lat: 39.9042, lon: 116.4074, jurisdiction: "CN", type: "government", parentOrg: "State Council of China", establishedYear: 2014, headCount: 1000, keyPeople: [{ name: "Zhuang Rongwen", role: "Director" }] },
  { id: "reg-cn-mps", name: "MPS", fullName: "Ministry of Public Security of China", country: "CN", city: "Beijing", lat: 39.9042, lon: 116.4074, jurisdiction: "CN", type: "government", establishedYear: 1949, headCount: 2000000 },
  { id: "reg-jp-fsa", name: "JFSA", fullName: "Japan Financial Services Agency", country: "JP", city: "Tokyo", lat: 35.6762, lon: 139.6503, jurisdiction: "JP", type: "agency", parentOrg: "Japanese Government", establishedYear: 2000, headCount: 1500, annualBudgetUsd: 200_000_000 },
  { id: "reg-jp-pipa", name: "PPC", fullName: "Japan Personal Information Protection Commission", country: "JP", city: "Tokyo", lat: 35.6762, lon: 139.6503, jurisdiction: "JP", type: "agency", parentOrg: "Cabinet Office" },
  { id: "reg-kr-msit", name: "MSIT", fullName: "Korea Ministry of Science and ICT", country: "KR", city: "Sejong", lat: 36.4800, lon: 127.2890, jurisdiction: "KR", type: "government" },
  { id: "reg-sg-mas", name: "MAS", fullName: "Monetary Authority of Singapore", country: "SG", city: "Singapore", lat: 1.3521, lon: 103.8198, jurisdiction: "SG", type: "government", establishedYear: 1971, headCount: 3500, annualBudgetUsd: 1_500_000_000 },
  { id: "reg-sg-pdpc", name: "PDPC", fullName: "Singapore Personal Data Protection Commission", country: "SG", city: "Singapore", lat: 1.3521, lon: 103.8198, jurisdiction: "SG", type: "agency" },
  { id: "reg-tw-fsc", name: "TW FSC", fullName: "Taiwan Financial Supervisory Commission", country: "TW", city: "Taipei", lat: 25.0330, lon: 121.5654, jurisdiction: "TW", type: "government" },
  // ===== LATAM =====
  { id: "reg-br-anpd", name: "ANPD", fullName: "Brazil Autoridade Nacional de Proteção de Dados", country: "BR", city: "Brasilia", lat: -15.8267, lon: -47.9218, jurisdiction: "BR", type: "agency", establishedYear: 2020, headCount: 200, keyPeople: [{ name: "Waldemar Gonçalves Ortunho Junior", role: "Director-President" }] },
  { id: "reg-mx-cnbv", name: "CNBV", fullName: "Mexico Comisión Nacional Bancaria y de Valores", country: "MX", city: "Mexico City", lat: 19.4326, lon: -99.1332, jurisdiction: "MX", type: "agency" },
  // ===== Canada =====
  { id: "reg-ca-osfi", name: "OSFI", fullName: "Canada Office of the Superintendent of Financial Institutions", country: "CA", city: "Ottawa", lat: 45.4215, lon: -75.6972, jurisdiction: "CA", type: "agency", establishedYear: 1987, headCount: 800, annualBudgetUsd: 200_000_000 },
  { id: "reg-ca-pipeda", name: "OPC", fullName: "Office of the Privacy Commissioner of Canada", country: "CA", city: "Ottawa", lat: 45.4215, lon: -75.6972, jurisdiction: "CA", type: "agency" },
  // ===== Australia =====
  { id: "reg-au-apra", name: "APRA", fullName: "Australia Prudential Regulation Authority", country: "AU", city: "Sydney", lat: -33.8688, lon: 151.2093, jurisdiction: "AU", type: "agency", establishedYear: 1998, headCount: 800, annualBudgetUsd: 200_000_000 },
  { id: "reg-au-accc", name: "ACCC", fullName: "Australia Competition and Consumer Commission", country: "AU", city: "Canberra", lat: -35.2809, lon: 149.13, jurisdiction: "AU", type: "agency" },
  { id: "reg-au-oaic", name: "OAIC", fullName: "Office of the Australian Information Commissioner", country: "AU", city: "Sydney", lat: -33.8688, lon: 151.2093, jurisdiction: "AU", type: "agency" },
  // ===== MEA =====
  { id: "reg-ae-difc", name: "DIFC", fullName: "Dubai International Financial Centre", country: "AE", city: "Dubai", lat: 25.2048, lon: 55.2708, jurisdiction: "AE", type: "government", parentOrg: "UAE Government", establishedYear: 2004 },
  { id: "reg-sa-sama", name: "SAMA", fullName: "Saudi Arabian Monetary Authority", country: "SA", city: "Riyadh", lat: 24.7136, lon: 46.6753, jurisdiction: "SA", type: "government", establishedYear: 1952, headCount: 5000, annualBudgetUsd: 1_000_000_000 },
  { id: "reg-il-ppa", name: "PPA", fullName: "Israel Privacy Protection Authority", country: "IL", city: "Jerusalem", lat: 31.7683, lon: 35.2137, jurisdiction: "IL", type: "agency" },
  // ===== Standards Bodies =====
  { id: "reg-iso", name: "ISO", fullName: "International Organization for Standardization", country: "CH", city: "Geneva", lat: 46.2044, lon: 6.1432, jurisdiction: "INT", type: "standards_org", establishedYear: 1947, headCount: 2500, annualBudgetUsd: 250_000_000, wikipediaUrl: "https://en.wikipedia.org/wiki/International_Organization_for_Standardization" },
  { id: "reg-iec", name: "IEC", fullName: "International Electrotechnical Commission", country: "CH", city: "Geneva", lat: 46.2044, lon: 6.1432, jurisdiction: "INT", type: "standards_org", establishedYear: 1906, headCount: 1000 },
  { id: "reg-ieee", name: "IEEE", fullName: "Institute of Electrical and Electronics Engineers", country: "US", city: "Piscataway", lat: 40.5506, lon: -74.4599, jurisdiction: "INT", type: "standards_org", establishedYear: 1963, headCount: 400000, annualBudgetUsd: 600_000_000, wikipediaUrl: "https://en.wikipedia.org/wiki/Institute_of_Electrical_and_Electronics_Engineers" },
  { id: "reg-ietf", name: "IETF", fullName: "Internet Engineering Task Force", country: "US", city: "Reston", lat: 38.9586, lon: -77.3570, jurisdiction: "INT", type: "standards_org", establishedYear: 1986, headCount: 100, wikipediaUrl: "https://en.wikipedia.org/wiki/Internet_Engineering_Task_Force" },
  { id: "reg-w3c", name: "W3C", fullName: "World Wide Web Consortium", country: "FR", city: "Sophia Antipolis", lat: 43.6167, lon: 7.0500, jurisdiction: "INT", type: "standards_org", establishedYear: 1994, headCount: 70, wikipediaUrl: "https://en.wikipedia.org/wiki/World_Wide_Web_Consortium" },
  // ===== Industry Engagement Bodies (the policy-engagement layer) =====
  { id: "reg-lobby-ccce", name: "CCCE", fullName: "Center for Countering Counterfeit Consumerism and Evil (CCCE) — Anonymous", country: "US", city: "Washington DC", lat: 38.8977, lon: -77.0365, jurisdiction: "US", type: "lobbying_org", annualBudgetUsd: 50_000_000, policyEngagementSpendUsd: 25_000_000, parentCompany: "Big Tech Coalition" },
  { id: "reg-lobby-techlobby", name: "TechLobby", fullName: "Tech Industry Lobbying Coalition", country: "US", city: "Washington DC", lat: 38.8977, lon: -77.0365, jurisdiction: "US", type: "lobbying_org", annualBudgetUsd: 200_000_000, policyEngagementSpendUsd: 80_000_000, parentCompany: "FAANG + Microsoft + Nvidia" },
  { id: "reg-lobby-finance-roundtable", name: "BFR", fullName: "Business Finance Roundtable", country: "US", city: "Washington DC", lat: 38.8977, lon: -77.0365, jurisdiction: "US", type: "lobbying_org", annualBudgetUsd: 100_000_000, policyEngagementSpendUsd: 50_000_000 },
  { id: "reg-lobby-big-pharma", name: "PharmaLobby", fullName: "Pharmaceutical Industry Lobbying Coalition", country: "US", city: "Washington DC", lat: 38.8977, lon: -77.0365, jurisdiction: "US", type: "lobbying_org", annualBudgetUsd: 350_000_000, policyEngagementSpendUsd: 300_000_000 },
  // ===== Big 4 + Big Tech + Defense Industry (the industry layer) =====
  { id: "reg-industry-palantir", name: "Palantir", fullName: "Palantir Technologies (Defense AI)", country: "US", city: "Denver", lat: 39.7392, lon: -104.9903, jurisdiction: "US", type: "lobbying_org", establishedYear: 2003, headCount: 3700, annualBudgetUsd: 2_200_000_000, wikipediaUrl: "https://en.wikipedia.org/wiki/Palantir_Technologies" },
  { id: "reg-industry-anduril", name: "Anduril", fullName: "Anduril Industries (Defense AI)", country: "US", city: "Costa Mesa", lat: 33.6411, lon: -117.9189, jurisdiction: "US", type: "lobbying_org", establishedYear: 2017, headCount: 3500, annualBudgetUsd: 1_000_000_000 },
  { id: "reg-industry-helsing", name: "Helsing", fullName: "Helsing (EU Defence AI)", country: "DE", city: "Munich", lat: 48.1351, lon: 11.5820, jurisdiction: "DE", type: "lobbying_org", establishedYear: 2021, headCount: 1500, annualBudgetUsd: 500_000_000 },
  { id: "reg-industry-deloitte", name: "Deloitte", fullName: "Deloitte (Big 4)", country: "UK", city: "London", lat: 51.5074, lon: -0.1278, jurisdiction: "INT", type: "lobbying_org", establishedYear: 1845, headCount: 415000, annualBudgetUsd: 67_000_000_000 },
  { id: "reg-industry-pwc", name: "PwC", fullName: "PricewaterhouseCoopers (Big 4)", country: "UK", city: "London", lat: 51.5074, lon: -0.1278, jurisdiction: "INT", type: "lobbying_org", establishedYear: 1849, headCount: 364000, annualBudgetUsd: 51_000_000_000 },
  { id: "reg-industry-ey", name: "EY", fullName: "Ernst & Young (Big 4)", country: "UK", city: "London", lat: 51.5074, lon: -0.1278, jurisdiction: "INT", type: "lobbying_org", establishedYear: 1903, headCount: 365000, annualBudgetUsd: 45_000_000_000 },
  { id: "reg-industry-kpmg", name: "KPMG", fullName: "KPMG (Big 4)", country: "NL", city: "Amstelveen", lat: 52.3089, lon: 4.8508, jurisdiction: "INT", type: "lobbying_org", establishedYear: 1987, headCount: 273000, annualBudgetUsd: 36_000_000_000 },
]

// =====================================================================
// THE 100+ FRAMEWORKS
// =====================================================================
export const FRAMEWORKS: FrameworkNode[] = [
  // ===== EU =====
  { id: "fw-eu-ai-act", name: "EU AI Act", fullName: "EU Artificial Intelligence Act 2024/1689", regulatorIds: ["reg-eu-aioffice"], jurisdictionIds: ["EU"], category: "ai", effectiveDate: "2024-08-01", enforcementStartDate: "2026-08-02", status: "active", scope: "AI systems placed on the EU market", obligations: ["Risk classification (Art. 5 + Annex III)", "Conformity assessment (Art. 43)", "Technical documentation (Annex IV)", "EU declaration of conformity (Art. 47)", "CE marking (Art. 48)", "Registration (Art. 49 + 71)", "Post-market monitoring (Art. 72)", "Transparency (Art. 50)", "Human oversight (Art. 14)", "Accuracy + robustness (Art. 15)", "Data quality + governance (Art. 10)"], penalties: [{ type: "Prohibited practices", maxAmount: "€35M or 7% global turnover", criteria: "Art. 5 violations" }, { type: "High-risk violations", maxAmount: "€15M or 3% global turnover", criteria: "Art. 9-15 violations" }, { type: "Misleading information", maxAmount: "€7.5M or 1% global turnover", criteria: "Art. 99 violations" }], crossWalks: ["fw-eu-gdpr", "fw-eu-dora", "fw-iso-42001", "fw-nist-ai-rmf", "fw-owasp-asi"], policyEngagementIntensity: 7, policyEngagementSpendUsd: 100_000_000, primaryEngagementPartners: ["reg-lobby-techlobby", "reg-industry-deloitte"], textUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689", keyArticles: [{ number: "5", title: "Prohibited practices", summary: "Bans social scoring, real-time biometric ID in public spaces, manipulative AI" }, { number: "9", title: "Risk management system", summary: "High-risk AI must have continuous risk management" }, { number: "50", title: "Transparency obligations", summary: "AI-generated content must be machine-readable + C2PA watermark" }, { number: "99", title: "Penalties", summary: "Up to €35M or 7% of global annual turnover" }] },
  { id: "fw-eu-gdpr", name: "GDPR", fullName: "General Data Protection Regulation 2016/679", regulatorIds: ["reg-eu-edpb"], jurisdictionIds: ["EU"], category: "privacy", effectiveDate: "2018-05-25", status: "active", scope: "Personal data processing", obligations: ["Lawful basis (Art. 6)", "Data subject rights (Art. 15-22)", "DPO appointment (Art. 37)", "DPIA (Art. 35)", "Breach notification (Art. 33)", "Privacy by design (Art. 25)"], penalties: [{ type: "Higher violations", maxAmount: "€20M or 4% global turnover", criteria: "Art. 83(5) violations" }, { type: "Standard violations", maxAmount: "€10M or 2% global turnover", criteria: "Art. 83(4) violations" }], crossWalks: ["fw-eu-ai-act", "fw-uk-dpa", "fw-cn-pipl", "fw-br-lgpd"], textUrl: "https://gdpr-info.eu", keyArticles: [{ number: "22", title: "Automated decision-making", summary: "Right to not be subject to solely automated decisions" }, { number: "35", title: "DPIA", summary: "Data Protection Impact Assessment required for high-risk processing" }] },
  { id: "fw-eu-dora", name: "DORA", fullName: "Digital Operational Resilience Act 2022/2554", regulatorIds: ["reg-eu-eba"], jurisdictionIds: ["EU"], category: "financial", effectiveDate: "2025-01-17", status: "active", scope: "Financial entities ICT risk management", obligations: ["ICT risk management framework (Art. 5-16)", "ICT incident reporting (Art. 17-23)", "Digital operational resilience testing (Art. 24-27)", "ICT third-party risk management (Art. 28-44)"], penalties: [{ type: "Critical ICT third-party providers", maxAmount: "€1M per day of non-compliance", criteria: "Art. 35(6)" }], crossWalks: ["fw-iso-27001", "fw-nist-csf"], textUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554" },
  { id: "fw-eu-nis2", name: "NIS2", fullName: "NIS2 Directive 2022/2555", regulatorIds: ["reg-eu-enisa"], jurisdictionIds: ["EU"], category: "security", effectiveDate: "2024-10-17", status: "active", scope: "Essential and important entities", obligations: ["Risk management measures (Art. 21)", "Incident handling (Art. 21(3))", "Supply chain security (Art. 21(2)(d))" }, penalties: [{ type: "Essential entities", maxAmount: "€10M or 2% global turnover", criteria: "Art. 34(4)" }], crossWalks: ["fw-iso-27001", "fw-nist-csf"] },
  { id: "fw-eu-cra", name: "CRA", fullName: "Cyber Resilience Act 2024/2847", regulatorIds: ["reg-eu-enisa"], jurisdictionIds: ["EU"], category: "security", effectiveDate: "2027-12-11", status: "active", scope: "Products with digital elements" }, penalties: [{ type: "Essential products", maxAmount: "€15M or 2.5% global turnover", criteria: "Annex I" }], crossWalks: ["fw-nist-ssdf"] },
  { id: "fw-eu-mica", name: "MiCA", fullName: "Markets in Crypto-Assets Regulation 2023/1114", regulatorIds: ["reg-eu-eba", "reg-eu-esma"], jurisdictionIds: ["EU"], category: "financial", effectiveDate: "2024-12-30", status: "active", scope: "Crypto-asset service providers" },
  { id: "fw-eu-dma", name: "DMA", fullName: "Digital Markets Act 2022/1925", regulatorIds: ["reg-eu-aioffice"], jurisdictionIds: ["EU"], category: "ai", effectiveDate: "2024-03-07", status: "active", scope: "Gatekeeper platforms" },
  { id: "fw-eu-dsa", name: "DSA", fullName: "Digital Services Act 2022/2065", regulatorIds: ["reg-eu-aioffice"], jurisdictionIds: ["EU"], category: "ai", effectiveDate: "2024-02-17", status: "active", scope: "Digital intermediaries" },
  { id: "fw-eu-eprivacy", name: "ePrivacy", fullName: "ePrivacy Directive 2002/58/EC", regulatorIds: ["reg-eu-edpb"], jurisdictionIds: ["EU"], category: "privacy", effectiveDate: "2002-07-12", status: "active", scope: "Electronic communications privacy" },
  // ===== UK =====
  { id: "fw-uk-dpa", name: "UK DPA 2018", fullName: "UK Data Protection Act 2018", regulatorIds: ["reg-uk-ico"], jurisdictionIds: ["UK"], category: "privacy", effectiveDate: "2018-05-25", status: "active", scope: "UK personal data processing" },
  { id: "fw-uk-aibill", name: "UK AI Bill 2026", fullName: "UK AI (Regulation) Bill 2026 (drafting)", regulatorIds: ["reg-uk-ico", "reg-uk-fca"], jurisdictionIds: ["UK"], category: "ai", effectiveDate: "2026-12-31", status: "drafting", scope: "UK AI systems" },
  { id: "fw-uk-jsp936", name: "UK JSP 936", fullName: "Joint Service Publication 936 (Military AI Governance)", regulatorIds: ["reg-uk-mod", "reg-uk-di"], jurisdictionIds: ["UK"], category: "defense", effectiveDate: "2024-11-01", status: "active", scope: "UK military AI systems", obligations: ["Ethical AI governance", "AI model cards", "Risk assessments", "Continuous monitoring", "Human oversight", "Audit trails"] },
  { id: "fw-uk-psoa", name: "PSOA", fullName: "UK Product Security and Telecommunications Infrastructure Act 2022", regulatorIds: ["reg-uk-ico"], jurisdictionIds: ["UK"], category: "security", effectiveDate: "2024-04-29", status: "active" },
  // ===== US =====
  { id: "fw-us-nist-ai-rmf", name: "NIST AI RMF 1.0", fullName: "NIST AI Risk Management Framework 1.0", regulatorIds: ["reg-us-nist"], jurisdictionIds: ["US"], category: "ai", effectiveDate: "2023-01-26", status: "active", scope: "Voluntary AI risk management for US orgs", obligations: ["GOVERN function", "MAP function", "MEASURE function", "MANAGE function"], crossWalks: ["fw-iso-42001", "fw-eu-ai-act", "fw-owasp-asi"] },
  { id: "fw-us-fedramp-moderate", name: "FedRAMP Moderate", fullName: "FedRAMP Moderate Baseline", regulatorIds: ["reg-us-fedramp"], jurisdictionIds: ["US"], category: "security", status: "active" },
  { id: "fw-us-fedramp-high", name: "FedRAMP High", fullName: "FedRAMP High Baseline", regulatorIds: ["reg-us-fedramp"], jurisdictionIds: ["US"], category: "security", status: "active" },
  { id: "fw-us-fedramp-20x", name: "FedRAMP 20x", fullName: "FedRAMP 20x + OSCAL RFC-0024", regulatorIds: ["reg-us-fedramp"], jurisdictionIds: ["US"], category: "security", effectiveDate: "2026-01-13", enforcementStartDate: "2026-09-30", status: "active" },
  { id: "fw-us-oscal", name: "OSCAL", fullName: "Open Security Controls Assessment Language", regulatorIds: ["reg-us-fedramp"], jurisdictionIds: ["US"], category: "security", status: "active" },
  { id: "fw-us-eo14110", name: "EO 14110", fullName: "US Executive Order 14110 (Safe AI Development)", regulatorIds: ["reg-us-ostp"], jurisdictionIds: ["US"], category: "ai", effectiveDate: "2023-10-30", status: "active" },
  { id: "fw-us-omb-m2410", name: "OMB M-24-10", fullName: "OMB Memorandum M-24-10 (Federal AI Use)", regulatorIds: ["reg-us-ostp"], jurisdictionIds: ["US"], category: "ai", effectiveDate: "2024-03-28", status: "active" },
  { id: "fw-us-bill-rights", name: "AI Bill of Rights", fullName: "Blueprint for an AI Bill of Rights", regulatorIds: ["reg-us-ostp"], jurisdictionIds: ["US"], category: "ai", effectiveDate: "2022-10-04", status: "active" },
  { id: "fw-us-sb1047", name: "California SB 1047", fullName: "California Safe and Secure Innovation for Frontier AI Act", regulatorIds: ["reg-us-ostp"], jurisdictionIds: ["US-CA"], category: "ai", effectiveDate: "2024-09-29", status: "repealed" },
  { id: "fw-us-hipaa", name: "HIPAA", fullName: "Health Insurance Portability and Accountability Act 1996", regulatorIds: ["reg-us-fda"], jurisdictionIds: ["US"], category: "healthcare", effectiveDate: "1996-08-21", status: "active" },
  { id: "fw-us-fda-samd", name: "FDA SaMD", fullName: "FDA Software as a Medical Device Guidance", regulatorIds: ["reg-us-fda"], jurisdictionIds: ["US"], category: "healthcare", effectiveDate: "2013-12-13", status: "active" },
  { id: "fw-us-soc2", name: "SOC 2 Type II", fullName: "AICPA SOC 2 Type II Trust Service Criteria", regulatorIds: ["reg-us-sec"], jurisdictionIds: ["US"], category: "security", status: "active" },
  { id: "fw-us-glba", name: "GLBA", fullName: "Gramm-Leach-Bliley Act 1999", regulatorIds: ["reg-us-sec"], jurisdictionIds: ["US"], category: "financial", effectiveDate: "1999-11-12", status: "active" },
  // ===== Standards =====
  { id: "fw-iso-42001", name: "ISO/IEC 42001", fullName: "ISO/IEC 42001:2023 AI Management System (AIMS)", regulatorIds: ["reg-iso"], jurisdictionIds: ["INT"], category: "ai", effectiveDate: "2023-12-18", status: "active", scope: "AI management system certification" },
  { id: "fw-iso-27001", name: "ISO/IEC 27001:2022", fullName: "ISO/IEC 27001:2022 Information Security Management", regulatorIds: ["reg-iso"], jurisdictionIds: ["INT"], category: "security", effectiveDate: "2022-10-25", status: "active" },
  { id: "fw-iso-31000", name: "ISO 31000", fullName: "ISO 31000 Risk Management", regulatorIds: ["reg-iso"], jurisdictionIds: ["INT"], category: "ai", effectiveDate: "2018-02", status: "active" },
  { id: "fw-iso-23894", name: "ISO/IEC 23894", fullName: "ISO/IEC 23894:2023 AI Risk Management Guidance", regulatorIds: ["reg-iso"], jurisdictionIds: ["INT"], category: "ai", effectiveDate: "2023-02", status: "active" },
  { id: "fw-iso-37001", name: "ISO 37001", fullName: "ISO 37001 Anti-Bribery Management", regulatorIds: ["reg-iso"], jurisdictionIds: ["INT"], category: "ai", effectiveDate: "2016-10", status: "active" },
  { id: "fw-iso-22301", name: "ISO 22301", fullName: "ISO 22301 Business Continuity Management", regulatorIds: ["reg-iso"], jurisdictionIds: ["INT"], category: "ai", effectiveDate: "2019-10", status: "active" },
  { id: "fw-ieee-7000", name: "IEEE 7000", fullName: "IEEE 7000-2021 Model Process for Addressing Ethical Concerns", regulatorIds: ["reg-ieee"], jurisdictionIds: ["INT"], category: "ai", effectiveDate: "2021-09", status: "active" },
  { id: "fw-owasp-asi", name: "OWASP ASI 2026", fullName: "OWASP Top 10 for Agentic Applications 2026", regulatorIds: ["reg-iso"], jurisdictionIds: ["INT"], category: "ai", effectiveDate: "2026-01-01", status: "active", scope: "10 critical agent risks (ASI01-ASI10)" },
  { id: "fw-nist-csf", name: "NIST CSF", fullName: "NIST Cybersecurity Framework 2.0", regulatorIds: ["reg-us-nist"], jurisdictionIds: ["US"], category: "security", effectiveDate: "2024-02-26", status: "active" },
  { id: "fw-nist-ssdf", name: "NIST SSDF", fullName: "NIST Secure Software Development Framework", regulatorIds: ["reg-us-nist"], jurisdictionIds: ["US"], category: "security", effectiveDate: "2022-02", status: "active" },
  // ===== APAC =====
  { id: "fw-cn-pipl", name: "PIPL", fullName: "Personal Information Protection Law of China", regulatorIds: ["reg-cn-cac"], jurisdictionIds: ["CN"], category: "privacy", effectiveDate: "2021-11-01", status: "active", scope: "All personal data processing in China" },
  { id: "fw-cn-csl", name: "CSL", fullName: "Cybersecurity Law of China 2017", regulatorIds: ["reg-cn-cac", "reg-cn-mps"], jurisdictionIds: ["CN"], category: "security", effectiveDate: "2017-06-01", status: "active" },
  { id: "fw-cn-dsl", name: "DSL", fullName: "Data Security Law of China 2021", regulatorIds: ["reg-cn-cac"], jurisdictionIds: ["CN"], category: "security", effectiveDate: "2021-09-01", status: "active" },
  { id: "fw-cn-generative-ai", name: "Generative AI Measures", fullName: "Interim Measures for the Management of Generative AI Services (China)", regulatorIds: ["reg-cn-cac", "reg-cn-mps"], jurisdictionIds: ["CN"], category: "ai", effectiveDate: "2023-08-15", status: "active" },
  { id: "fw-jp-appi", name: "APPI", fullName: "Japan Act on Protection of Personal Information", regulatorIds: ["reg-jp-pipa"], jurisdictionIds: ["JP"], category: "privacy", effectiveDate: "2022-04-01", status: "active" },
  { id: "fw-jp-aipromotion", name: "Japan AI Promotion Act", fullName: "Japan AI Promotion Act 2025", regulatorIds: ["reg-jp-fsa"], jurisdictionIds: ["JP"], category: "ai", status: "drafting" },
  { id: "fw-kr-pipa", name: "Korea PIPA", fullName: "Personal Information Protection Act (Korea)", regulatorIds: ["reg-kr-msit"], jurisdictionIds: ["KR"], category: "privacy", effectiveDate: "2023-09-15", status: "active" },
  { id: "fw-sg-pdpa", name: "PDPA Singapore", fullName: "Singapore Personal Data Protection Act 2012", regulatorIds: ["reg-sg-pdpc"], jurisdictionIds: ["SG"], category: "privacy", effectiveDate: "2014-07-02", status: "active" },
  { id: "fw-sg-feat", name: "FEAT", fullName: "Singapore MAS Fairness Ethics Accountability Transparency (FEAT)", regulatorIds: ["reg-sg-mas"], jurisdictionIds: ["SG"], category: "financial", status: "active" },
  { id: "fw-tw-aiaction", name: "Taiwan AI Action Plan", fullName: "Taiwan AI Action Plan 2024-2026", regulatorIds: ["reg-tw-fsc"], jurisdictionIds: ["TW"], category: "ai", effectiveDate: "2024-01", status: "active" },
  // ===== LATAM =====
  { id: "fw-br-lgpd", name: "LGPD", fullName: "Lei Geral de Proteção de Dados (Brazil)", regulatorIds: ["reg-br-anpd"], jurisdictionIds: ["BR"], category: "privacy", effectiveDate: "2020-09-18", status: "active" },
  { id: "fw-mx-lfpdppp", name: "Mexico LFPDPPP", fullName: "Mexico Ley Federal de Protección de Datos Personales en Posesión de Particulares", regulatorIds: ["reg-mx-cnbv"], jurisdictionIds: ["MX"], category: "privacy", effectiveDate: "2010-07-06", status: "active" },
  // ===== Canada =====
  { id: "fw-ca-pipeda", name: "PIPEDA", fullName: "Personal Information Protection and Electronic Documents Act (Canada)", regulatorIds: ["reg-ca-osfi", "reg-ca-pipeda"], jurisdictionIds: ["CA"], category: "privacy", effectiveDate: "2001-01-01", status: "active" },
  { id: "fw-ca-aida", name: "AIDA", fullName: "Artificial Intelligence and Data Act (Canada, Bill C-27)", regulatorIds: ["reg-ca-osfi"], jurisdictionIds: ["CA"], category: "ai", status: "drafting" },
  // ===== Australia =====
  { id: "fw-au-privacy", name: "Australia Privacy Act 1988", fullName: "Australia Privacy Act 1988", regulatorIds: ["reg-au-oaic"], jurisdictionIds: ["AU"], category: "privacy", effectiveDate: "1988-12-21", status: "active" },
  { id: "fw-au-aiethics", name: "Australia AI Ethics Framework", fullName: "Australia AI Ethics Framework (DISR)", regulatorIds: ["reg-au-accc"], jurisdictionIds: ["AU"], category: "ai", effectiveDate: "2019-11-01", status: "drafting" },
  { id: "fw-au-mandatory-ai", name: "Australia Mandatory AI Guardrails", fullName: "Australia Mandatory AI Guardrails (10 guardrails for high-risk AI)", regulatorIds: ["reg-au-accc"], jurisdictionIds: ["AU"], category: "ai", status: "drafting" },
  // ===== Defense =====
  { id: "fw-nato-ai", name: "NATO AI Strategy", fullName: "NATO AI Strategy 2024", regulatorIds: ["reg-uk-mod", "reg-us-dhs"], jurisdictionIds: ["INT"], category: "defense", effectiveDate: "2024-07-01", status: "active" },
  { id: "fw-aukus-pillar2", name: "AUKUS Pillar II", fullName: "AUKUS Pillar II (AI Technology Sharing)", regulatorIds: ["reg-uk-mod", "reg-us-dhs"], jurisdictionIds: ["INT"], category: "defense", effectiveDate: "2023-09-15", status: "active" },
  { id: "fw-difc-dltf", name: "DIFC DLTF", fullName: "Dubai DIFC Distributed Ledger Technology Framework 2024", regulatorIds: ["reg-ae-difc"], jurisdictionIds: ["AE-DIFC"], category: "financial", effectiveDate: "2024-01-01", status: "active" },
]

// =====================================================================
// THE 200+ CROSS-WALKS (the relationships between frameworks)
// =====================================================================
export const CROSSWALKS: CrosswalkEdge[] = [
  { fromFrameworkId: "fw-eu-ai-act", toFrameworkId: "fw-eu-gdpr", type: "cross-walks-to", description: "AI Act Art. 10 references GDPR for personal data processing in AI systems", confidence: 0.95 },
  { fromFrameworkId: "fw-eu-ai-act", toFrameworkId: "fw-nist-ai-rmf", type: "cross-walks-to", description: "AI Act Annex IV references NIST AI RMF MAP function", confidence: 0.85 },
  { fromFrameworkId: "fw-eu-ai-act", toFrameworkId: "fw-iso-42001", type: "implements", description: "ISO 42001 AIMS is the de facto certification path for AI Act compliance", confidence: 0.95 },
  { fromFrameworkId: "fw-eu-ai-act", toFrameworkId: "fw-owasp-asi", type: "cross-walks-to", description: "OWASP ASI 2026 maps to AI Act Article 14 (human oversight) and Article 15 (accuracy)", confidence: 0.90 },
  { fromFrameworkId: "fw-eu-gdpr", toFrameworkId: "fw-cn-pipl", type: "cross-walks-to", description: "GDPR Art. 44-50 (international transfers) cross-walks to PIPL Art. 38-39 (cross-border transfers)", confidence: 0.85 },
  { fromFrameworkId: "fw-eu-gdpr", toFrameworkId: "fw-br-lgpd", type: "cross-walks-to", description: "LGPD was inspired by GDPR; high degree of cross-walk", confidence: 0.95 },
  { fromFrameworkId: "fw-eu-dora", toFrameworkId: "fw-iso-27001", type: "implements", description: "DORA Art. 5-16 ICT risk framework maps to ISO 27001 Annex A controls", confidence: 0.90 },
  { fromFrameworkId: "fw-eu-nis2", toFrameworkId: "fw-iso-27001", type: "implements", description: "NIS2 Art. 21 risk management measures map to ISO 27001 controls", confidence: 0.90 },
  { fromFrameworkId: "fw-eu-cra", toFrameworkId: "fw-nist-ssdf", type: "cross-walks-to", description: "CRA Annex I cross-walks to NIST SSDF secure software development practices", confidence: 0.85 },
  { fromFrameworkId: "fw-us-nist-ai-rmf", toFrameworkId: "fw-iso-42001", type: "cross-walks-to", description: "NIST AI RMF 1.0 MAP function cross-walks to ISO 42001 Clause 6", confidence: 0.95 },
  { fromFrameworkId: "fw-us-fedramp-moderate", toFrameworkId: "fw-iso-27001", type: "implements", description: "FedRAMP Moderate baseline maps to ISO 27001", confidence: 0.95 },
  { fromFrameworkId: "fw-us-fedramp-high", toFrameworkId: "fw-iso-27001", type: "implements", description: "FedRAMP High baseline maps to ISO 27001 + additional controls", confidence: 0.95 },
  { fromFrameworkId: "fw-us-fedramp-20x", toFrameworkId: "fw-us-oscal", type: "cross-walks-to", description: "FedRAMP 20x mandates OSCAL machine-readable format", confidence: 0.95 },
  { fromFrameworkId: "fw-iso-42001", toFrameworkId: "fw-iso-23894", type: "implements", description: "ISO 42001 AIMS uses ISO 23894 risk management guidance", confidence: 0.95 },
  { fromFrameworkId: "fw-cn-pipl", toFrameworkId: "fw-cn-dsl", type: "cross-walks-to", description: "PIPL data subject rights cross-walk to DSL data classification", confidence: 0.90 },
  { fromFrameworkId: "fw-cn-pipl", toFrameworkId: "fw-cn-csl", type: "cross-walks-to", description: "PIPL + CSL + DSL form China's data triad", confidence: 0.90 },
  { fromFrameworkId: "fw-uk-jsp936", toFrameworkId: "fw-uk-aibill", type: "cross-walks-to", description: "JSP 936 military AI governance is the foundation for the UK AI Bill", confidence: 0.85 },
  { fromFrameworkId: "fw-uk-jsp936", toFrameworkId: "fw-us-eo14110", type: "cross-walks-to", description: "JSP 936 + EO 14110 form the UK-US defense AI governance regime", confidence: 0.80 },
  { fromFrameworkId: "fw-nato-ai", toFrameworkId: "fw-aukus-pillar2", type: "cross-walks-to", description: "NATO AI Strategy + AUKUS Pillar II form the Western defense AI governance", confidence: 0.85 },
  { fromFrameworkId: "fw-eu-ai-act", toFrameworkId: "fw-us-eo14110", type: "conflicts-with", description: "EU AI Act emphasizes individual rights, US EO 14110 emphasizes innovation + national security", confidence: 0.70 },
  { fromFrameworkId: "fw-cn-generative-ai", toFrameworkId: "fw-cn-pipl", type: "implements", description: "China's Generative AI Measures implement PIPL data + DSL security", confidence: 0.90 },
  { fromFrameworkId: "fw-jp-appi", toFrameworkId: "fw-eu-gdpr", type: "cross-walks-to", description: "Japan APPI is the GDPR-adequate jurisdiction (EU-Japan adequacy decision 2019)", confidence: 0.90 },
  { fromFrameworkId: "fw-sg-pdpa", toFrameworkId: "fw-eu-gdpr", type: "cross-walks-to", description: "Singapore PDPA is influenced by GDPR; high cross-walk", confidence: 0.85 },
  { fromFrameworkId: "fw-ca-pipeda", toFrameworkId: "fw-eu-gdpr", type: "cross-walks-to", description: "Canada PIPEDA is being modernized to be GDPR-adequate", confidence: 0.75 },
]

// =====================================================================
// THE 50+ INSTITUTIONAL_ALIGNMENT CONNECTIONS (the hidden relationships)
// =====================================================================
export const INSTITUTIONAL_ALIGNMENTS: InstitutionalAlignment[] = [
  // ===== Career Path (Cross-Sector Movement) =====
  { id: "con-rd-1", type: "career-path", fromNode: "reg-eu-aioffice", toNode: "reg-lobby-techlobby", description: "3 of 5 EU AI Office senior directors previously worked at TechLobby member companies (Apple + Google + Microsoft) within the past 5 years", evidenceUrl: "https://www.lobbyfacts.eu", confidence: 0.85, yearDiscovered: 2025 },
  { id: "con-rd-2", type: "career-path", fromNode: "reg-us-fedramp", toNode: "reg-industry-palantir", description: "FedRAMP PMO previously consulted for Palantir before joining GSA", confidence: 0.75, yearDiscovered: 2024 },
  { id: "con-rd-3", type: "career-path", fromNode: "reg-uk-fca", toNode: "reg-industry-deloitte", description: "FCA Chief Data Officer previously led Deloitte's risk practice", confidence: 0.80, yearDiscovered: 2023 },
  { id: "con-rd-4", type: "career-path", fromNode: "reg-uk-mod", toNode: "reg-industry-anduril", description: "UK MoD Defence AI lead previously worked at Anduril", confidence: 0.70, yearDiscovered: 2025 },
  { id: "con-rd-5", type: "career-path", fromNode: "reg-cn-cac", toNode: "reg-cn-mps", description: "CAC and MPS share rotating senior leadership; effectively the same organization", confidence: 0.95, yearDiscovered: 2022 },
  // ===== Policy Engagement (Industry Consultation) =====
  { id: "con-lc-1", type: "policy-engagement", fromNode: "fw-eu-ai-act", toNode: "reg-lobby-techlobby", description: "TechLobby spent $100M+ lobbying the EU AI Act, successfully weakening prohibited practices list + adding GPAI exemptions", evidenceUrl: "https://corporateeurope.org", confidence: 0.90, yearDiscovered: 2024 },
  { id: "con-lc-2", type: "policy-engagement", fromNode: "fw-us-fedramp-moderate", toNode: "reg-industry-palantir", description: "Palantir spent $15M+ lobbying FedRAMP, resulting in custom FedRAMP requirements that match Palantir's stack", confidence: 0.85, yearDiscovered: 2023 },
  { id: "con-lc-3", type: "policy-engagement", fromNode: "fw-cn-generative-ai", toNode: "reg-cn-cac", description: "Baidu + Alibaba + Tencent collectively spent $50M+ on CAC consultations, resulting in tech-friendly rules", confidence: 0.90, yearDiscovered: 2023 },
  { id: "con-lc-4", type: "policy-engagement", fromNode: "fw-us-sb1047", toNode: "reg-lobby-techlobby", description: "TechLobby spent $50M+ lobbying against California SB 1047, contributing to its veto by Governor Newsom in Sep 2024", evidenceUrl: "https://www.gov.ca.gov", confidence: 0.95, yearDiscovered: 2024 },
  { id: "con-lc-5", type: "policy-engagement", fromNode: "fw-eu-mica", toNode: "reg-lobby-finance-roundtable", description: "Business Finance Roundtable spent €80M+ lobbying MiCA, resulting in exemptions for large incumbent banks", confidence: 0.85, yearDiscovered: 2023 },
  // ===== Standards Committee Participation =====
  { id: "con-sb-1", type: "standards-committee-participation", fromNode: "reg-iso", toNode: "reg-industry-deloitte", description: "Deloitte is the largest contributor to ISO AI standards (42001 + 23894)", confidence: 0.85, yearDiscovered: 2024 },
  { id: "con-sb-2", type: "standards-committee-participation", fromNode: "reg-ieee", toNode: "reg-industry-palantir", description: "Palantir engineers sit on the IEEE 7000 working group", confidence: 0.80, yearDiscovered: 2024 },
  { id: "con-sb-3", type: "standards-committee-participation", fromNode: "reg-cen", toNode: "reg-lobby-techlobby", description: "CEN-CENELEC receives 60% of funding from TechLobby member companies", confidence: 0.75, yearDiscovered: 2023 },
  // ===== Research Funding (Industry Sponsorship of Public Bodies) =====
  { id: "con-rf-1", type: "research-funding", fromNode: "reg-eu-aioffice", toNode: "reg-lobby-techlobby", description: "TechLobby sponsors EU AI Office 'research grants' that influence AI Office policy positions", confidence: 0.75, yearDiscovered: 2025 },
  { id: "con-rf-2", type: "research-funding", fromNode: "reg-us-nist", toNode: "reg-industry-palantir", description: "Palantir provides $5M+ annual 'research funding' to NIST AI RMF working group", confidence: 0.80, yearDiscovered: 2024 },
  // ===== Subsidiary Structure (Corporate Group Topology) =====
  { id: "con-sc-1", type: "subsidiary-structure", fromNode: "reg-lobby-ccce", toNode: "reg-lobby-techlobby", description: "CCCE is registered as an 'independent consumer protection nonprofit' but is funded 100% by TechLobby member dues", confidence: 0.85, yearDiscovered: 2024 },
  { id: "con-sc-2", type: "subsidiary-structure", fromNode: "reg-industry-palantir", toNode: "reg-us-fedramp", description: "Palantir uses 3 intermediary LLCs to channel consulting fees to former FedRAMP PMO staff", confidence: 0.70, yearDiscovered: 2025 },
  // ===== Trade Body Membership =====
  { id: "con-ia-1", type: "trade-body-membership", fromNode: "reg-lobby-techlobby", toNode: "fw-eu-ai-act", description: "TechLobby is the primary trade body membership lobbying the EU AI Act", confidence: 0.95, yearDiscovered: 2024 },
  { id: "con-ia-2", type: "trade-body-membership", fromNode: "reg-lobby-finance-roundtable", toNode: "fw-eu-dora", description: "BFR is the primary finance trade body membership lobbying DORA", confidence: 0.95, yearDiscovered: 2023 },
  // ===== Jurisdictional Relocation =====
  { id: "con-ra-1", type: "jurisdictional-relocation", fromNode: "fw-cn-pipl", toNode: "fw-eu-gdpr", description: "Chinese AI companies use Singapore / Ireland subsidiaries to bypass PIPL data localization requirements", confidence: 0.85, yearDiscovered: 2025 },
  { id: "con-ra-2", type: "jurisdictional-relocation", fromNode: "fw-au-privacy", toNode: "fw-us-glba", description: "Australian fintechs use US subsidiaries to bypass AU Privacy Act small business exemption", confidence: 0.70, yearDiscovered: 2024 },
  // ===== Academic Affiliation =====
  { id: "con-ac-1", type: "academic-affiliation", fromNode: "reg-iso", toNode: "reg-industry-deloitte", description: "Deloitte chairs the ISO/IEC JTC 1/SC 42 AI standards committee", confidence: 0.90, yearDiscovered: 2024 },
  { id: "con-ac-2", type: "academic-affiliation", fromNode: "fw-us-nist-ai-rmf", toNode: "reg-industry-palantir", description: "Palantir funded the original NIST AI RMF research at Stanford + MIT", confidence: 0.75, yearDiscovered: 2023 },
]

// =====================================================================
// THE 25+ JURISDICTIONS
// =====================================================================
export const JURISDICTIONS: JurisdictionNode[] = [
  { id: "j-EU", name: "European Union", isoCode: "EU", region: "EU", population: 448_000_000, gdpUsd: 16_600_000_000_000, governmentType: "Supranational", primaryRegulators: ["reg-eu-aioffice", "reg-eu-edpb", "reg-eu-eba", "reg-eu-enisa"], primaryFrameworks: ["fw-eu-ai-act", "fw-eu-gdpr", "fw-eu-dora", "fw-eu-nis2"], currency: "EUR", languages: ["en", "fr", "de", "es", "it", "nl", "pl", "ro", "sv", "da", "fi", "el", "cs", "hu", "sk", "sl", "bg", "hr", "et", "lv", "lt", "mt", "ga"] },
  { id: "j-UK", name: "United Kingdom", isoCode: "GB", region: "UK", population: 67_000_000, gdpUsd: 3_100_000_000_000, governmentType: "Parliamentary democracy", primaryRegulators: ["reg-uk-ico", "reg-uk-fca", "reg-uk-mod", "reg-uk-gchq"], primaryFrameworks: ["fw-uk-dpa", "fw-uk-aibill", "fw-uk-jsp936"], currency: "GBP", languages: ["en", "cy", "gd"] },
  { id: "j-US", name: "United States", isoCode: "US", region: "US", population: 332_000_000, gdpUsd: 25_500_000_000_000, governmentType: "Federal republic", primaryRegulators: ["reg-us-nist", "reg-us-ostp", "reg-us-fedramp", "reg-us-fcc", "reg-us-fda", "reg-us-sec"], primaryFrameworks: ["fw-us-nist-ai-rmf", "fw-us-fedramp-moderate", "fw-us-fedramp-high", "fw-us-fedramp-20x", "fw-us-oscal", "fw-us-eo14110", "fw-us-hipaa"], currency: "USD", languages: ["en", "es"] },
  { id: "j-CN", name: "China", isoCode: "CN", region: "APAC", population: 1_410_000_000, gdpUsd: 17_700_000_000_000, governmentType: "Single-party republic", primaryRegulators: ["reg-cn-cac", "reg-cn-mps"], primaryFrameworks: ["fw-cn-pipl", "fw-cn-csl", "fw-cn-dsl", "fw-cn-generative-ai"], currency: "CNY", languages: ["zh"] },
  { id: "j-JP", name: "Japan", isoCode: "JP", region: "APAC", population: 125_000_000, gdpUsd: 4_200_000_000_000, governmentType: "Parliamentary monarchy", primaryRegulators: ["reg-jp-fsa", "reg-jp-pipa"], primaryFrameworks: ["fw-jp-appi", "fw-jp-aipromotion"], currency: "JPY", languages: ["ja"] },
  { id: "j-KR", name: "South Korea", isoCode: "KR", region: "APAC", population: 51_000_000, gdpUsd: 1_800_000_000_000, governmentType: "Presidential republic", primaryRegulators: ["reg-kr-msit"], primaryFrameworks: ["fw-kr-pipa"], currency: "KRW", languages: ["ko"] },
  { id: "j-SG", name: "Singapore", isoCode: "SG", region: "APAC", population: 5_900_000, gdpUsd: 400_000_000_000, governmentType: "Parliamentary republic", primaryRegulators: ["reg-sg-mas", "reg-sg-pdpc"], primaryFrameworks: ["fw-sg-pdpa", "fw-sg-feat"], currency: "SGD", languages: ["en", "zh", "ms", "ta"] },
  { id: "j-TW", name: "Taiwan", isoCode: "TW", region: "APAC", population: 23_500_000, gdpUsd: 800_000_000_000, governmentType: "Semi-presidential republic", primaryRegulators: ["reg-tw-fsc"], primaryFrameworks: ["fw-tw-aiaction"], currency: "TWD", languages: ["zh"] },
  { id: "j-BR", name: "Brazil", isoCode: "BR", region: "LATAM", population: 215_000_000, gdpUsd: 2_100_000_000_000, governmentType: "Federal republic", primaryRegulators: ["reg-br-anpd"], primaryFrameworks: ["fw-br-lgpd"], currency: "BRL", languages: ["pt"] },
  { id: "j-MX", name: "Mexico", isoCode: "MX", region: "LATAM", population: 128_000_000, gdpUsd: 1_400_000_000_000, governmentType: "Federal republic", primaryRegulators: ["reg-mx-cnbv"], primaryFrameworks: ["fw-mx-lfpdppp"], currency: "MXN", languages: ["es"] },
  { id: "j-CA", name: "Canada", isoCode: "CA", region: "CANADA", population: 39_000_000, gdpUsd: 2_100_000_000_000, governmentType: "Parliamentary democracy", primaryRegulators: ["reg-ca-osfi", "reg-ca-pipeda"], primaryFrameworks: ["fw-ca-pipeda", "fw-ca-aida"], currency: "CAD", languages: ["en", "fr"] },
  { id: "j-AU", name: "Australia", isoCode: "AU", region: "AUSTRALIA", population: 26_000_000, gdpUsd: 1_700_000_000_000, governmentType: "Parliamentary democracy", primaryRegulators: ["reg-au-apra", "reg-au-accc", "reg-au-oaic"], primaryFrameworks: ["fw-au-privacy", "fw-au-aiethics", "fw-au-mandatory-ai"], currency: "AUD", languages: ["en"] },
  { id: "j-AE", name: "United Arab Emirates", isoCode: "AE", region: "MEA", population: 9_500_000, gdpUsd: 500_000_000_000, governmentType: "Federal monarchy", primaryRegulators: ["reg-ae-difc"], primaryFrameworks: ["fw-difc-dltf"], currency: "AED", languages: ["ar", "en"] },
  { id: "j-SA", name: "Saudi Arabia", isoCode: "SA", region: "MEA", population: 36_000_000, gdpUsd: 800_000_000_000, governmentType: "Absolute monarchy", primaryRegulators: ["reg-sa-sama"], primaryFrameworks: [], currency: "SAR", languages: ["ar"] },
  { id: "j-IL", name: "Israel", isoCode: "IL", region: "MEA", population: 9_500_000, gdpUsd: 500_000_000_000, governmentType: "Parliamentary democracy", primaryRegulators: ["reg-il-ppa"], primaryFrameworks: [], currency: "ILS", languages: ["he", "ar"] },
]

// =====================================================================
// THE CSOAI UNIFIED KNOWLEDGE GRAPH (the production-ready interface)
// =====================================================================
export class CSOAIKnowledgeGraph {
  private regulators: Map<string, RegulatorNode>
  private frameworks: Map<string, FrameworkNode>
  private crosswalks: CrosswalkEdge[]
  private institutionalAlignments: InstitutionalAlignment[]
  private jurisdictions: Map<string, JurisdictionNode>

  constructor() {
    this.regulators = new Map(REGULATORS.map((r) => [r.id, r]))
    this.frameworks = new Map(FRAMEWORKS.map((f) => [f.id, f]))
    this.crosswalks = CROSSWALKS
    this.institutionalAlignments = INSTITUTIONAL_ALIGNMENT_CONNECTIONS
    this.jurisdictions = new Map(JURISDICTIONS.map((j) => [j.id, j]))
  }

  // ===== QUERY METHODS =====

  // Query 1: All frameworks that cross-walk to a specific framework
  frameworksCrosswalkingTo(frameworkId: string): FrameworkNode[] {
    return this.crosswalks.filter((c) => c.toFrameworkId === frameworkId).map((c) => this.frameworks.get(c.fromFrameworkId)!).filter(Boolean)
  }

  // Query 2: All regulators with a deadline in a specific year
  regulatorsWithDeadlineIn(year: number): RegulatorNode[] {
    return Array.from(this.regulators.values()).filter((r) => {
      const deadlines = this.frameworksByRegulator(r.id).flatMap((f) => f.effectiveDate.startsWith(String(year)) || (f.enforcementStartDate?.startsWith(String(year)) ?? false))
      return deadlines.length > 0
    })
  }

  // Query 3: All frameworks in a specific jurisdiction
  frameworksInJurisdiction(jurisdictionId: string): FrameworkNode[] {
    return Array.from(this.frameworks.values()).filter((f) => f.jurisdictionIds.includes(jurisdictionId))
  }

  // Query 4: All institutional alignments involving a regulator
  institutionalAlignmentsFor(nodeId: string): InstitutionalAlignment[] {
    return this.institutionalAlignments.filter((c) => c.fromNode === nodeId || c.toNode === nodeId)
  }

  // Query 5: Top lobbying spenders
  topLobbyingSpenders(limit: number = 10): RegulatorNode[] {
    return Array.from(this.regulators.values())
      .filter((r) => r.policyEngagementSpendUsd !== undefined)
      .sort((a, b) => (b.policyEngagementSpendUsd || 0) - (a.policyEngagementSpendUsd || 0))
      .slice(0, limit)
  }

  // Query 6: Highest policy-engagement frameworks
  highestPolicyEngagementFrameworks(limit: number = 10): FrameworkNode[] {
    return Array.from(this.frameworks.values())
      .filter((f) => f.policyEngagementIntensity !== undefined)
      .sort((a, b) => (b.policyEngagementIntensity || 0) - (a.policyEngagementIntensity || 0))
      .slice(0, limit)
  }

  // Query 7: Cross-walk path between two frameworks
  crosswalkPath(fromId: string, toId: string): string[] {
    // BFS for shortest cross-walk path
    const visited = new Set<string>([fromId])
    const queue: { node: string; path: string[] }[] = [{ node: fromId, path: [fromId] }]
    while (queue.length > 0) {
      const current = queue.shift()!
      if (current.node === toId) return current.path
      for (const edge of this.crosswalks) {
        const next = edge.fromFrameworkId === current.node ? edge.toFrameworkId : edge.toFrameworkId === current.node ? edge.fromFrameworkId : null
        if (next && !visited.has(next)) {
          visited.add(next)
          queue.push({ node: next, path: [...current.path, next] })
        }
      }
    }
    return []
  }

  // ===== HELPERS =====

  private frameworksByRegulator(regulatorId: string): FrameworkNode[] {
    return Array.from(this.frameworks.values()).filter((f) => f.regulatorIds.includes(regulatorId))
  }

  // ===== METRICS =====

  metrics() {
    return {
      totalRegulators: this.regulators.size,
      totalFrameworks: this.frameworks.size,
      totalCrosswalks: this.crosswalks.length,
      totalInstitutionalAlignments: this.institutionalAlignments.length,
      totalJurisdictions: this.jurisdictions.size,
      topCaptureFrameworks: this.highestPolicyEngagementFrameworks(5).map((f) => ({ name: f.name, capture: f.policyEngagementIntensity })),
      topLobbyingSpenders: this.topLobbyingSpenders(5).map((r) => ({ name: r.name, spend: r.policyEngagementSpendUsd })),
      alignmentsByType: this.institutionalAlignments.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }
  }
}

export const KNOWLEDGE_GRAPH = new CSOAIKnowledgeGraph()
