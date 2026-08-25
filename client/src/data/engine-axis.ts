/**
 * Engine Axis — one measurement engine signs all crossings.
 * CSOAI (body) + MEOK (public head) = SovOS.
 *
 * GSPC core: 13 axes in AXES (governance, safety, provenance…).
 * Financial axes 18–25: extension nerves — PLANNED/SPEC until frozen banks publish.
 * Register: MEASURED / UNMEASURED / REPORTED / DESIGN — never blended.
 */
import type { AxisStatus } from "@/lib/gspcAxes";
import { STACK_STATS, BOND_MARKET_REPORTED_T, type StackRegister } from "@/lib/stackHonesty";

export type BondMarketLayer = {
  id: string;
  name: string;
  sizeT: number;
  speed: string;
  friction: string;
  entry: "low" | "high" | "very-high" | "maximum";
  note: string;
};

/** REPORTED industry context — not CSOAI measurement */
export const BOND_MARKET_LAYERS: BondMarketLayer[] = [
  { id: "sovereign", name: "Sovereign (Govt)", sizeT: 60, speed: "T+1", friction: "Political, not technical", entry: "low", note: "Central banks self-clear — don't fight here" },
  { id: "ig-corp", name: "Investment Grade Corp", sizeT: 35, speed: "T+2", friction: "Dealer networks, relationship trust", entry: "high", note: "Compliance layer replaces relationship trust (DESIGN)" },
  { id: "high-yield", name: "High Yield / Junk", sizeT: 3, speed: "T+2", friction: "Illiquidity, opacity, fraud", entry: "very-high", note: "Provenance + identity credentials (PARTIAL repos)" },
  { id: "municipal-sme", name: "Municipal / SME", sizeT: 4, speed: "T+2–T+5", friction: "Minimum lots, no coverage", entry: "maximum", note: "Fractional minimum — core design thesis" },
  { id: "structured", name: "Structured / ABS", sizeT: 28, speed: "T+2–T+7", friction: "Complexity, no standardization", entry: "high", note: `${STACK_STATS.hiveFrameworks}-framework hive crosswalk (catalogued)` },
];

export type AttackVector = {
  id: string;
  slug: string;
  title: string;
  problem: string;
  solution: string;
  designNote: string;
  register: StackRegister;
  mcpSlugs: string[];
  eunomiaUri: string;
};

export const ATTACK_VECTORS: AttackVector[] = [
  {
    id: "v1",
    slug: "cash-leg",
    title: "Cash leg bottleneck",
    problem: "Tokenized bonds settle in seconds; cash still moves T+2 via correspondent banking.",
    solution: "Atomic DvP design — bond token + stablecoin locked; release both or neither. Compliance probes at boundary (iso-42001, BFT council).",
    designNote: "Scenario: 0.05% per settlement — not priced or live",
    register: "DESIGN",
    mcpSlugs: ["meok-coinbase-x402-receipt-mcp", "meok-x402-wrap-mcp", "iso-42001-ai-mcp", "bft-progress-council-mcp"],
    eunomiaUri: "eunomia://finance/atomic-dvp",
  },
  {
    id: "v2",
    slug: "relationship-trust",
    title: "Relationship trust gap",
    problem: "Bond trading often requires long dealer relationships — excludes SMEs, new funds, AI agents.",
    solution: "agent-identity-trust-mcp + credential graph replace relationship trust with cryptographic trust (repo exists; bank pilots not live).",
    designNote: "Permissionless market thesis — not deployed",
    register: "PARTIAL",
    mcpSlugs: ["agent-identity-trust-mcp", "eudi-wallet-mcp", "iso-42001-ai-mcp"],
    eunomiaUri: "eunomia://identity/did-verify",
  },
  {
    id: "v3",
    slug: "illiquidity",
    title: "Illiquidity premium",
    problem: "SME bonds trade infrequently; wide bid-ask because no continuous market.",
    solution: "A2A market makers — care-membrane ethics probe, BFT consensus pricing, C2PA-attested quotes (DESIGN).",
    designNote: "Spread capture scenario — arena data not wired to bond pricing",
    register: "DESIGN",
    mcpSlugs: ["care-membrane-mcp", "bft-progress-council-mcp", "proofof-ai-mcp"],
    eunomiaUri: "eunomia://safety/care-ethics",
  },
  {
    id: "v4",
    slug: "regulatory-arbitrage",
    title: "Regulatory fragmentation",
    problem: "Global funds need separate compliance stacks for EU, UK, US, China rules.",
    solution: `${STACK_STATS.hiveFrameworks}-framework hive crosswalk — one MCP call, one C2PA certificate. Compliance as router function.`,
    designNote: "Crosswalk is catalogued; single attestation not frozen",
    register: "PARTIAL",
    mcpSlugs: ["iso-42001-ai-mcp"],
    eunomiaUri: "eunomia://compliance/crosswalk",
  },
  {
    id: "v5",
    slug: "default-resolution",
    title: "Default resolution latency",
    problem: "Bond defaults can take months and significant legal cost.",
    solution: "Smart contract + BFT council arbitration design — covenant breach → cure period → vote → collateral distribution.",
    designNote: "Arbitration fees scenario — smart contracts are stub only",
    register: "GAP",
    mcpSlugs: ["bft-progress-council-mcp", "proofof-ai-mcp", "insurance-verification-mcp"],
    eunomiaUri: "eunomia://consensus/bft-vote",
  },
  {
    id: "v6",
    slug: "data-monetization",
    title: "Data monetization engine",
    problem: "Terminal data incumbents charge heavily for bond market data.",
    solution: "Routed trades could generate compliance scores (regulators), anonymized patterns, safety datasets. MEOK arena as eval source (DESIGN).",
    designNote: "Data licensing scenario — no live marketplace",
    register: "DESIGN",
    mcpSlugs: ["proofof-ai-mcp"],
    eunomiaUri: "eunomia://benchmark/governance",
  },
  {
    id: "v7",
    slug: "agent-economy",
    title: "Agent economy",
    problem: "AI agents cannot easily hold bank accounts, sign legal docs, or own bonds today.",
    solution: "Agent wallets + credentials — MEOK NPCs as economic training ground (PARTIAL: wallet MCP repos exist).",
    designNote: "Staking / market-making scenario — not end-to-end on councilof.ai",
    register: "PARTIAL",
    mcpSlugs: ["agent-token-budget-mcp", "agent-identity-trust-mcp", "agent-x402-paywall-mcp"],
    eunomiaUri: "eunomia://crypto/agent-wallet",
  },
];

/** Financial extension axes — slots 18–25 on the engine axis */
export type FinancialAxis = {
  slot: number;
  axis: string;
  domain: string;
  metaphor: string;
  function: string;
  bridgeTarget: string;
  status: StackRegister;
  mcpSlugs: string[];
  eunomiaUri: string;
  repo?: string;
};

export const FINANCIAL_AXES: FinancialAxis[] = [
  { slot: 18, axis: "bond-router", domain: "Bond Router", metaphor: "Aorta", function: "COBOL batch → A2A stream → atomic settle", bridgeTarget: "GET /api/finance/bond-crossing — synthetic pilot (MEASURED)", status: "MEASURED", mcpSlugs: ["bft-progress-council-mcp", "proofof-ai-mcp", "meok-coinbase-x402-receipt-mcp"], eunomiaUri: "eunomia://finance/cobol-a2a", repo: "eunomia-bond-router" },
  { slot: 19, axis: "insurance-engine", domain: "Insurance Engine", metaphor: "Lymphatic", function: "Risk pooling, claims attestation, fraud probes", bridgeTarget: "/insurers evidence pack (MEASURED board + REPORTED baselines)", status: "PLANNED", mcpSlugs: ["insurance-verification-mcp", "care-membrane-mcp", "iso-42001-ai-mcp"], eunomiaUri: "eunomia://compliance/insurance", repo: "eunomia-insurance-engine" },
  { slot: 20, axis: "stock-market", domain: "Stock Market Axis", metaphor: "Pulse", function: "Equities, indices, derivatives attestation", bridgeTarget: "Equity T+0 rail + index constituent probes", status: "PLANNED", mcpSlugs: ["iso-42001-ai-mcp", "proofof-ai-mcp"], eunomiaUri: "eunomia://finance/equity-index", repo: "eunomia-bond-router" },
  { slot: 21, axis: "east-west-bridge", domain: "East-West Bridge", metaphor: "Corpus callosum", function: "TC260 ↔ NIST ↔ EU AI Act crosswalk", bridgeTarget: `${STACK_STATS.hiveFrameworks} hive frameworks · ceasai.org`, status: "PLANNED", mcpSlugs: ["iso-42001-ai-mcp", "agent-identity-trust-mcp"], eunomiaUri: "eunomia://compliance/crosswalk", repo: "eunomia-east-west-bridge" },
  { slot: 22, axis: "sme-fractional", domain: "SME Fractional", metaphor: "Capillaries", function: "Micro-issuance, retail access, $100 lots", bridgeTarget: "Municipal / SME bond layer (max entry)", status: "SPEC", mcpSlugs: ["care-membrane-mcp", "agent-identity-trust-mcp"], eunomiaUri: "eunomia://finance/sme-bond", repo: "eunomia-bond-router" },
  { slot: 23, axis: "agent-economy", domain: "Agent Economy", metaphor: "Mitochondria", function: "NPC wallets, staking, survival economics", bridgeTarget: "MEOK arenas · agent-token-budget-mcp", status: "PARTIAL", mcpSlugs: ["agent-token-budget-mcp", "agent-x402-paywall-mcp", "agent-identity-trust-mcp"], eunomiaUri: "eunomia://crypto/agent-wallet", repo: "eunomia-agent-economy" },
  { slot: 24, axis: "data-dao", domain: "Data DAO", metaphor: "Bone marrow", function: "Arena traces, compliance incidents, eval marketplace", bridgeTarget: "gspc-arena · MEOK player economics", status: "GAP", mcpSlugs: ["bft-progress-council-mcp", "proofof-ai-mcp"], eunomiaUri: "eunomia://crypto/data-dao", repo: "eunomia-data-dao" },
  { slot: 25, axis: "eunomia-token", domain: "EUNOMIA Token", metaphor: "ATP", function: "Routing fees, staking, governance reserve (DESIGN)", bridgeTarget: "Protocol layer — not company equity", status: "GAP", mcpSlugs: ["agent-x402-paywall-mcp", "bft-progress-council-mcp"], eunomiaUri: "eunomia://crypto/eun", repo: "eunomia-data-dao" },
];

/**
 * Labour / AI-economy companion indices — candidates on the same honesty rail.
 * Declared UNMEASURED publicly (/indices). Never overwrite MEASURED slot 18.
 * Never fuse into GSPC cells. See labourIndices.ts · docs/EAT_PLAYBOOK.md
 */
export const CONTEXT_FIREWALL_INDICES: {
  slug: string;
  title: string;
  status: "UNMEASURED";
  candidacy: string;
  path: string;
  firewall: string;
}[] = [
  {
    slug: "ai-economy",
    title: "AI Economy Index",
    status: "UNMEASURED",
    candidacy: "Companion to slot 23 (agent-economy) — not a fused score",
    path: "/indices/ai-economy",
    firewall: "Contextual only — never SHA-256/Ed25519 grading input",
  },
  {
    slug: "human-labour",
    title: "Human Labour Index",
    status: "UNMEASURED",
    candidacy: "Financial-extension candidate (GAP adjacency slots 24–25)",
    path: "/indices/human-labour",
    firewall: "Contextual only — never SHA-256/Ed25519 grading input",
  },
  {
    slug: "humanoid-labour",
    title: "Humanoid Labour Index",
    status: "UNMEASURED",
    candidacy: "Machinery-conformity adjacency + financial-extension candidate",
    path: "/indices/humanoid-labour",
    firewall: "Contextual only — never SHA-256/Ed25519 grading input",
  },
];

/** Legacy extension axes — merged into FINANCIAL_AXES; kept for API compat */
export type ExtensionAxis = {
  axis: string;
  bench: string;
  status: AxisStatus;
  instrument: string;
  task: string;
  markets: string[];
  mcpSlugs: string[];
  eunomiaUri: string;
};

export const EXTENSION_AXES: ExtensionAxis[] = FINANCIAL_AXES.map((f) => ({
  axis: f.axis,
  bench: `${f.domain.replace(/\s/g, "")}Bench`,
  status: (f.status === "MEASURED" || f.status === "UNMEASURED" || f.status === "SPEC" || f.status === "PLANNED"
    ? f.status
    : "PLANNED") as AxisStatus,
  instrument: f.function,
  task: f.bridgeTarget,
  markets: [f.domain.toLowerCase()],
  mcpSlugs: f.mcpSlugs,
  eunomiaUri: f.eunomiaUri,
}));

export type BridgeLayer = {
  id: string;
  title: string;
  subtitle: string;
  diagram: string;
  register: StackRegister;
  mcpSlugs: string[];
};

export const BRIDGE_LAYERS: BridgeLayer[] = [
  {
    id: "cobol-a2a",
    title: "Bridge 1 — COBOL ↔ A2A",
    subtitle: "The digestive system — batch meal → real-time energy",
    register: "SPEC",
    mcpSlugs: ["bft-progress-council-mcp", "proofof-ai-mcp", "care-membrane-mcp", "agent-identity-trust-mcp"],
    diagram: `COBOL MAINFRAME (batch — T+2)
     │
     ├── Ingests: End-of-day trades, settlements, records
     │
     └── Eunomia wrapper (venturi — nutrient extraction)
              │
              ├── Parses COBOL COPYBOOK → JSON (SPEC: cobol-a2a-bridge-mcp)
              ├── Generates C2PA attestation (proofof-ai-mcp)
              ├── Maps user IDs → DIDs (agent-identity-trust-mcp)
              └── Scores via care-membrane probe
                    │
                    └── A2A AGENTS (stream — T+0)
                          ├── Bond market makers
                          ├── Insurance underwriters
                          ├── Stock traders
                          └── MEOK NPCs (economic agents)`,
  },
  {
    id: "banks-insurance",
    title: "Bridge 2 — Banks ↔ Insurance",
    subtitle: "The circulatory system — greed + fear = measured pricing",
    register: "DESIGN",
    mcpSlugs: ["iso-42001-ai-mcp", "care-membrane-mcp", "bft-progress-council-mcp", "insurance-verification-mcp"],
    diagram: `Bank issues SME loan
     → iso-42001-ai-mcp assesses AI risk
Insurer prices coverage
     → care-membrane-mcp checks ethical use
Dispute
     → bft-progress-council-mcp arbitrates
Claim (DESIGN)
     → smart contract from bond collateral (stub)

Friction is the force. The engine measures conflict — it does not eliminate it.
/insurers publishes MEASURED evidence; pricing is not live here.`,
  },
  {
    id: "east-west",
    title: "Bridge 3 — East ↔ West",
    subtitle: "The corpus callosum — algorithmic trust across jurisdictions",
    register: "PARTIAL",
    mcpSlugs: ["iso-42001-ai-mcp", "agent-identity-trust-mcp"],
    diagram: `TC260 (China)          hive crosswalk          NIST RMF (US)
     │                         │                         │
     └──── iso-42001-ai-mcp probe ──── C2PA attestation ──┘
                    │
              EU AI Act overlay
                    │
         agent-identity-trust-mcp (GDPR-aware identity)

${STACK_STATS.hiveFrameworks} frameworks catalogued in hive-frameworks.
Single frozen crosswalk attestation: PLANNED.`,
  },
  {
    id: "stocks-bonds",
    title: "Bridge 4 — Stocks ↔ Bonds",
    subtitle: "The respiratory system — oxygen and carbon dioxide exchange",
    register: "DESIGN",
    mcpSlugs: ["proofof-ai-mcp", "bft-progress-council-mcp", "iso-42001-ai-mcp"],
    diagram: `Bond yield spike → equity risk premium adjusts → proofof-ai-mcp attests shift (DESIGN)
Stock volatility → safe-haven bond flows → bft-progress-council-mcp circuit breaker vote (DESIGN)
MEOK arena sentiment → feeds credit + equity models (PARTIAL: arena exists, finance wire gap)

Flywheel thesis: stock data improves bond pricing; bond stability improves equity confidence;
both generate MEOK training data — loop not closed yet.`,
  },
];

export type DomainFlywheel = {
  id: string;
  title: string;
  from: string;
  steps: string[];
  register: StackRegister;
};

export const DOMAIN_FLYWHEELS: DomainFlywheel[] = [
  {
    id: "meok-csoai",
    title: "MEOK → CSOAI (sensory loop)",
    from: "MEOK players interact with NPCs",
    register: "PARTIAL",
    steps: [
      "Generates emotional reasoning + negotiation traces",
      "SOV3 / care-membrane learns human negotiation patterns",
      "CSOAI improves safety probes on signed GSPC axes",
      "Better compliance evidence → more institutional interest (DESIGN)",
      "More capital → better MEOK NPCs → loop",
    ],
  },
  {
    id: "bonds-insurance",
    title: "Bonds → Insurance (capital loop)",
    from: "Bond router processes issuance (DESIGN)",
    register: "DESIGN",
    steps: [
      "Real-time default probability data (not live)",
      "Insurance engine prices coverage from signed evidence",
      "More SMEs insured → more issuance thesis",
      "More data → better pricing → lower rates → loop",
    ],
  },
  {
    id: "east-west",
    title: "East → West (trust loop)",
    from: "Cross-border institution accepts CSOAI attestation (DESIGN)",
    register: "DESIGN",
    steps: [
      "UK bank accepts attestation because signed, not because of jurisdiction",
      "More East-West trade thesis",
      "More cross-border data",
      "Better hive crosswalk coverage",
      "More institutions trust the bridge → loop",
    ],
  },
  {
    id: "cobol-a2a",
    title: "COBOL → A2A (metabolic loop)",
    from: "COBOL batch generates overnight report",
    register: "SPEC",
    steps: [
      "Wrapper converts to real-time stream (first repo: cobol-a2a-bridge-mcp)",
      "A2A agents react in milliseconds (DESIGN)",
      "Better pricing, lower spreads thesis",
      "More volume → more wrapper investment → loop",
    ],
  },
];

/** What exists today vs what is DESIGN — honest moat table */
export type GovernanceCapability = {
  capability: string;
  status: StackRegister;
  evidence: string;
};

export const GOVERNANCE_CAPABILITIES: GovernanceCapability[] = [
  { capability: "Signed GSPC measurement board", status: "MEASURED", evidence: "GET /api/gspc · Ed25519 · Wilson intervals" },
  { capability: "291 MCP servers catalogued", status: "SHIPPED", evidence: "mcpRegistry.json · /api/mcp · /mcp/:slug" },
  { capability: "C2PA / provenance attestation", status: "PARTIAL", evidence: "proofof-ai-mcp repo · not on every finance route" },
  { capability: "Care ethics in routing", status: "PARTIAL", evidence: "care-membrane-mcp · wired on governance paths" },
  { capability: "BFT council arbitration", status: "PARTIAL", evidence: "bft-progress-council-mcp · Council Lobby integration" },
  { capability: "Gaming-trained economic agents", status: "PARTIAL", evidence: "MEOK arenas · NPC wallet MCPs · finance wire gap" },
  { capability: "East-West regulatory crosswalk", status: "PARTIAL", evidence: `${STACK_STATS.hiveFrameworks} hive frameworks · single attestation PLANNED` },
  { capability: "COBOL → A2A bridge", status: "SPEC", evidence: "docs/cobol-a2a-bridge-mcp.md · repo not shipped" },
  { capability: "Atomic DvP settlement", status: "GAP", evidence: "POST /api/finance/settle returns stub" },
  { capability: "Bond / insurance / equity extension axes", status: "PLANNED", evidence: "Slots 18–25 on this page — no frozen banks" },
];

export const BRIDGE_REPOS = [
  { name: "eunomia-bond-router", role: "COBOL ↔ A2A", modules: ["cobol-parser", "a2a-agent-cards", "atomic-settlement", "compliance-bridge"], status: "SPEC" as StackRegister },
  { name: "eunomia-insurance-engine", role: "Risk ↔ Capital", modules: ["risk-probe", "claims-oracle", "pool-governance", "sme-micro-policies"], status: "PLANNED" as StackRegister },
  { name: "eunomia-east-west-bridge", role: "TC260 ↔ NIST", modules: ["tc260-translator", "nist-rmf-mapper", "eu-ai-act-connector", "dispute-arbitration"], status: "PLANNED" as StackRegister },
  { name: "eunomia-agent-economy", role: "NPCs ↔ Markets", modules: ["npc-wallets", "staking-contracts", "reputation-sbt", "slash-conditions"], status: "PARTIAL" as StackRegister },
  { name: "eunomia-data-dao", role: "Domains ↔ Data market", modules: ["arena-traces", "gaming-behavior", "compliance-incidents", "marketplace"], status: "GAP" as StackRegister },
];

/** Two heads, one body — SovOS flywheel */
export const SOVOS_FLYWHEEL = {
  csoai: {
    label: "CSOAI — the body",
    role: "Measurement, governance, insurance evidence, government, academy — not certification",
    surfaces: ["councilof.ai", "/insurers", "/gspc-scoreboard", "/academy", "/legacy", "/venturi", "/engine-axis"],
    signs: "Ed25519 measurement cards · C2PA attestations · GSPC axes",
  },
  meok: {
    label: "MEOK — the public head",
    role: "Gaming, NPC agents, arenas, consumer AI, domain skins",
    surfaces: ["meok.ai", "MEOK arenas", "NPC wallets", "domain bonds (FishKeeper, GrabHire, MuckAway)"],
    signs: "Agent wallets · x402 micro-pay · arena eval data",
  },
  sovos: {
    label: "SovOS — one engine",
    role: "Flywheel solves friction in the middle: frozen training → signed measurement → live routing",
    loop: [
      "Government / insurance sort the frozen training & evidence problem (Layer 0 — PARTIAL)",
      `GSPC measures ${STACK_STATS.gspcAxesMeasured}/${STACK_STATS.gspcAxesTotal} core axes + ${FINANCIAL_AXES.length} financial extension axes (PLANNED)`,
      "Eunomia routes COBOL batch → A2A stream → atomic settle (SPEC → GAP)",
      "MEOK generates eval data; CSOAI signs it; both feed the same engine (PARTIAL)",
    ],
  },
};

/** DESIGN scenarios — not forecasts */
export const REVENUE_PROJECTION = [
  { stream: "Bank integrations (wrapper)", y1: "$2M", y3: "$15M", y5: "$50M", register: "DESIGN" as StackRegister },
  { stream: "Settlement fees (0.05%)", y1: "$500K", y3: "$10M", y5: "$65M", register: "DESIGN" as StackRegister },
  { stream: "Compliance SaaS", y1: "$1M", y3: "$8M", y5: "$25M", register: "DESIGN" as StackRegister },
  { stream: "Data licensing", y1: "$500K", y3: "$5M", y5: "$20M", register: "DESIGN" as StackRegister },
  { stream: "SME issuance (2%)", y1: "$200K", y3: "$3M", y5: "$15M", register: "DESIGN" as StackRegister },
  { stream: "Agent staking (5% pool)", y1: "$0", y3: "$2M", y5: "$10M", register: "DESIGN" as StackRegister },
];

export const ENGINE_AXIS_DIAGRAM = `                    Y-AXIS: EUNOMIA VERIFICATION
                    (Trust density — ${STACK_STATS.mcpServers} MCP servers catalogued)
                           ↑
                    ┌──────┴──────┐
                    │   COBOL     │  Honey · batch · T+2
                    │  ┌─────┐    │
                    │  │Venturi│   │  Wrap · attest · sign
                    │  └─────┘    │
                    │   A2A       │  Steam · stream · T+0
                    └─────────────┘
                           │
    HUMAN ◄────────────────┼────────────────► AGENT
         X-AXIS: TIME / VELOCITY
              The diagonal: speed AND trust — simultaneously.
              Governance safety on every crossing (when wired).`;

export const COBOL_SYMBIOSIS = `COBOL MAINFRAME (Honey)
├── Batch job 11pm → settlement instructions
├── EUNOMIA WRAPPER (Venturi — SPEC)
│   ├── Read batch output as it writes to disk
│   ├── C2PA attestation per instruction (proofof-ai-mcp)
│   ├── COBOL user ID → DID mapping (agent-identity-trust-mcp)
│   └── care-membrane probe per row
└── A2A AGENT LAYER (Steam — DESIGN)
    ├── Verified, attested, scored instructions
    ├── Counterparty negotiation (ms)
    └── Atomic DvP (POST /api/finance/settle — stub)`;

export const FIRST_REPO_SPEC = {
  name: "CSOAI-ORG/cobol-a2a-bridge-mcp",
  modules: ["parsers", "attestations", "identity", "compliance", "tests"],
  description: "Atomic unit — one COPYBOOK → one JSON → one C2PA attestation. Then scale.",
  register: "SPEC" as StackRegister,
};
