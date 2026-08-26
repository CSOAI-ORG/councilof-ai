// competitors.ts — CSOAI competitor battlecards.
//
// Compiled from a live web-research pass (mid-2026, cited). Figures are from
// public sources and are indicative — verify before quoting in procurement.
// Each card ends with the CSOAI wedge: the specific reason we win that deal.

export type Battlecard = {
  slug: string;
  name: string;
  positioning: string;
  facts: string[];        // dated, cited facts
  strengths: string[];
  weaknesses: string[];   // where they're beatable
  wedge: string;          // how CSOAI wins
  sources: { label: string; url: string }[];
};

export const BATTLECARDS: Battlecard[] = [
  {
    slug: "vanta",
    name: "Vanta",
    positioning: "Automated security-compliance leader (SOC 2 / ISO 27001) pivoting hard into AI-driven trust and agent governance.",
    facts: [
      "$150M Series D at a $4.15B valuation (Jul 2025); ~$504M raised total since 2021.",
      "16,000+ customers; surpassed $300M ARR in 2026 (tripled since 2024).",
      "Named a Leader in The Forrester Wave: GRC Platforms, Q2 2026; 2026 CNBC Disruptor 50.",
      "Authored AARM — an open spec for governing autonomous AI agents at runtime.",
      "Vanta Government Cloud received FedRAMP 20x Moderate authorization.",
      "ISO 42001 offering: ~70 pre-built controls, ~95% document templates, 2–4 week audit readiness.",
    ],
    strengths: ["Fastest path to SOC 2 / ISO 27001 / ISO 42001 audit readiness", "Huge integration + evidence-automation ecosystem", "Strong brand + enterprise trust"],
    weaknesses: [
      "Evidence-collection model doesn't map cleanly to EU AI Act documentation + classification obligations (they aren't observable from infrastructure).",
      "Closed SaaS, per-seat pricing (~$10k–50k+/yr) — prices out most SMBs.",
      "Security-first DNA; AI-governance depth is bolted on, not native.",
    ],
    wedge: "CSOAI is AI-governance-native and open-source: we cover the EU AI Act documentation/classification duties Vanta's infra-evidence model can't, the designed council reasons rather than checklists, and the open core + free tier reaches the SMBs Vanta's pricing excludes. Every verdict is Ed25519-signed, not just evidence-collected.",
    sources: [
      { label: "Vanta $150M Series D (BusinessWire, Jul 2025)", url: "https://www.businesswire.com/news/home/20250723901336/en/" },
      { label: "Vanta hits $300M ARR (Fortune, Apr 2026)", url: "https://fortune.com/2026/04/29/exclusive-vanta-arr-300-million-sequoia-shadow-ai-claude-cursor/" },
      { label: "Vanta vs EU AI Act fit (Difinity buyer's guide, 2026)", url: "https://difinity.ai/blog/best-ai-governance-platforms" },
    ],
  },
  {
    slug: "credo-ai",
    name: "Credo AI",
    positioning: "Responsible-AI governance specialist — policy-to-technical-control mapping for enterprises and government.",
    facts: [
      "No. 6 in Applied AI on Fast Company's Most Innovative Companies 2026 (alongside Google, Nvidia, OpenAI, Anthropic).",
      "Named in Gartner's Market Guide for AI Governance Platforms (2025).",
      "Public customers include Mastercard, Booz Allen Hamilton, and US federal programmes.",
      "Pre-built policy packs for EU AI Act, NIST AI RMF, ISO 42001, SOC 2 with audit-ready evidence.",
      "Enterprise pricing, typically ~$75k+/yr.",
    ],
    strengths: ["Genuine AI-governance focus + policy→control mapping", "Strong analyst + brand recognition", "Deep EU AI Act / NIST / ISO content"],
    weaknesses: [
      "Enterprise-only pricing (~$75k+) — no realistic path for SMBs or startups.",
      "US-headquartered / CLOUD Act exposure raised as a concern for EU-sovereignty buyers.",
      "Closed platform; governance you can't fork or self-host.",
    ],
    wedge: "CSOAI matches the framework depth (EU AI Act, NIST, ISO 42001 crosswalked in the Hive) but delivers it open-source, self-hostable, and sovereignty-first — plus the designed multi-provider council and Layer 0 signing. Free training + certification and a fair PAYG tier open it to the 99% Credo's price point can't serve.",
    sources: [
      { label: "Credo AI — Fast Company 2026 + product", url: "https://www.credo.ai/" },
      { label: "Credo AI EU / CLOUD Act sovereignty concern (sota.io, 2026)", url: "https://sota.io/blog/credo-ai-eu-alternative-gdpr-cloud-act-ai-governance-2026" },
      { label: "AI Governance buyer comparison (Modulos, 2026)", url: "https://www.modulos.ai/best-ai-governance-platforms/" },
    ],
  },
  {
    slug: "onetrust",
    name: "OneTrust",
    positioning: "Mature privacy/GRC platform with AI governance as a module — best for orgs already inside the OneTrust ecosystem.",
    facts: [
      "Last valued at $4.5B (Jul 2023, $150M round led by Generation Investment Management).",
      "14,000+ customers, including 75%+ of the Fortune 100; on track to surpass $500M ARR, FCF-positive.",
      "2026: added real-time AI governance — AI agent discovery, AI policy library, runtime guardrail enforcement.",
      "AI Governance sold as a sales-led add-on, typically ~$30k–80k/yr on top of existing subscription; US-hosted.",
    ],
    strengths: ["Consolidation play for existing OneTrust privacy/GDPR customers", "Mature workflow + inventory tooling", "Huge Fortune-100 install base"],
    weaknesses: [
      "Reviewers: not very user-friendly; heavy post-implementation work left to the client.",
      "Requires internal governance maturity + training to realise value; complex for non-technical stakeholders.",
      "AI governance is a module bolted onto a privacy platform, not purpose-built; add-on pricing on top of an already-costly base.",
    ],
    wedge: "CSOAI is purpose-built for AI + cyber governance, not a privacy-platform add-on — and it's usable without a consulting project. The Council assistant does the work (classify, assess, sign) instead of leaving 'after-implementation work' to the client, and the open-source core + free tier means no stacked add-on bills. Cyber self-scan lets teams test their own systems too — one OS, not three modules.",
    sources: [
      { label: "OneTrust real-time AI governance (SiliconANGLE, Mar 2026)", url: "https://siliconangle.com/2026/03/09/onetrust-expands-platform-real-time-ai-governance-agent-oversight-capabilities/" },
      { label: "OneTrust business breakdown + valuation (Contrary Research)", url: "https://research.contrary.com/company/onetrust" },
      { label: "OneTrust AI Governance reviews (Gartner Peer Insights, 2026)", url: "https://www.gartner.com/reviews/product/onetrust-ai-governance" },
    ],
  },
];

// Market context (public 2026 analyses — indicative, verify for procurement).
export const MARKET = {
  size2026: "~$418M",
  size2025: "~$308M",
  cagr: "~20%",
  note: "Gartner calls AI governance a billion-dollar market now forming; 30+ tools crowd the space and the SME segment is the fastest-growing, most underserved slice. CSOAI moat: Wilson intervals on frozen banks with published n and separation — rivals rarely disclose CIs. Labour/AI-economy indices stay UNMEASURED (scores never sold) until INDEX-METHOD freezes a bank.",
  sources: [
    { label: "Grand View Research — AI Governance Market", url: "https://www.grandviewresearch.com/industry-analysis/ai-governance-market-report" },
    { label: "Gartner — global AI regulations fuel billion-dollar market (Feb 2026)", url: "https://www.gartner.com/en/newsroom/press-releases/2026-02-17-gartner-global-ai-regulations-fuel-billion-dollar-market-for-ai-governance-platforms" },
  ],
};
