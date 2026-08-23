/**
 * Bond Venturi — COBOL (fed/batch) → Eunomia (metabolic boundary) → A2A (fasted/stream).
 */
import { STACK_STATS } from "@/lib/stackHonesty";

export type BondOpening = {
  id: string;
  slug: string;
  title: string;
  headline: string;
  problem: string;
  solution: string;
  revenue: string;
  eunomiaUri: string;
  mcpSlugs: string[];
  href?: string;
};

/** COBOL legacy concept → A2A agent concept → MCP bridge */
export const COBOL_A2A_ROSETTA: { cobol: string; a2a: string; mcp: string; eunomiaUri: string }[] = [
  { cobol: "Batch job schedule", a2a: "Agent task queue", mcp: "bft-progress-council-mcp", eunomiaUri: "eunomia://consensus/bft-vote" },
  { cobol: "Mainframe audit log", a2a: "C2PA provenance chain", mcp: "proofof-ai-mcp", eunomiaUri: "eunomia://law/provenance" },
  { cobol: "Role-based access control", a2a: "Agent card credentials", mcp: "agent-identity-trust-mcp", eunomiaUri: "eunomia://identity/did-verify" },
  { cobol: "Regulatory reporting", a2a: "Real-time compliance probe", mcp: "iso-42001-ai-mcp", eunomiaUri: "eunomia://compliance/iso42001" },
  { cobol: "Data entry clerk", a2a: "LLM reasoning engine", mcp: "care-membrane-mcp", eunomiaUri: "eunomia://safety/care-ethics" },
  { cobol: "Overnight reconciliation", a2a: "Atomic settlement (DvP)", mcp: "meok-coinbase-x402-receipt-mcp", eunomiaUri: "eunomia://compute/x402-settle" },
  { cobol: "SWIFT / FIX message", a2a: "A2A agent negotiation", mcp: "agent-x402-paywall-mcp", eunomiaUri: "eunomia://compute/payg" },
];

export const BOND_OPENINGS: BondOpening[] = [
  {
    id: "opening-1",
    slug: "cobol-a2a",
    title: "COBOL-to-A2A translation layer",
    headline: "The Rosetta Stone — wrap, don't replace",
    problem: "COBOL batches overnight (T+2). A2A agents negotiate in milliseconds. They don't speak the same language.",
    solution: `${STACK_STATS.mcpServers} MCP servers as translator: batch job → agent queue, audit log → C2PA chain, RBAC → agent cards. Banks keep COBOL; Eunomia wraps it (SPEC).`,
    revenue: "$50K–$500K per bank integration · recurring compliance monitoring",
    eunomiaUri: "eunomia://finance/cobol-a2a",
    mcpSlugs: ["bft-progress-council-mcp", "proofof-ai-mcp", "agent-identity-trust-mcp"],
    href: "/legacy",
  },
  {
    id: "opening-2",
    slug: "t0-settlement",
    title: "T+2 → T+0 atomic settlement",
    headline: "USDC on Base as the cash leg",
    problem: "Tokenized bonds settle in seconds; cash still moves through legacy rails (T+2).",
    solution: "Eunomia bond router: COBOL core reads legacy, A2A agent card writes back, smart contract atomic DvP — USDC/JPM Coin on Base, MiCA-verified.",
    revenue: "0.05% per transaction · $500 on $1M trade",
    eunomiaUri: "eunomia://finance/atomic-dvp",
    mcpSlugs: ["meok-coinbase-x402-receipt-mcp", "meok-x402-wrap-mcp", "agent-x402-paywall-mcp"],
    href: "/payg",
  },
  {
    id: "opening-3",
    slug: "human-agent-handoff",
    title: "Human-to-agent handoff in bond trading",
    headline: "BFT council as the transition protocol",
    problem: "Regulators won't let AI trade $10M bonds unsupervised. Humans can't process 1,000 RFQs/second.",
    solution: "Mandate → BFT council (liquidity + compliance + counterparty) → A2A execution → C2PA sign-off → T+0 settlement.",
    revenue: "SaaS seat + per-trade routing fee · Bloomberg terminal for the A2A era",
    eunomiaUri: "eunomia://finance/bft-handoff",
    mcpSlugs: ["bft-progress-council-mcp", "proofof-ai-mcp", "agent-identity-trust-mcp"],
    href: "/instruments/framework/bft-vote",
  },
  {
    id: "opening-4",
    slug: "sme-issuance",
    title: "SME bond issuance via fractionalization",
    headline: "25 domains as the issuance factory",
    problem: "Traditional bonds: $100K minimum. SMEs locked out.",
    solution: "Tokenized bonds from $100. Each issuance auto-routes: ISO 42001 risk, care-ethics, provenance, investor KYC.",
    revenue: "2% issuance fee + 0.1% annual servicing · Stripe for SME debt",
    eunomiaUri: "eunomia://finance/sme-bond",
    mcpSlugs: ["iso-42001-ai-mcp", "care-membrane-mcp", "proofof-ai-mcp", "agent-identity-trust-mcp"],
    href: "/instruments",
  },
  {
    id: "opening-5",
    slug: "agent-credit",
    title: "AI agent credit scoring",
    headline: "SBT credentials as bond ratings",
    problem: "Moody's/S&P: slow, opaque, human-biased.",
    solution: "Agent reputation on-chain: Watchdog Level 5, CEASAI certified, BFT council member — credential graph replaces credit rating.",
    revenue: "$10K/month per institutional investor · rating data subscription",
    eunomiaUri: "eunomia://finance/agent-rating",
    mcpSlugs: ["agent-identity-trust-mcp"],
    href: "/instruments/framework/did-verify",
  },
  {
    id: "opening-6",
    slug: "eat-framework",
    title: "The COBOL EAT framework",
    headline: "Batch-to-stream metabolic architecture",
    problem: "COBOL 'eats' once a day — batch ingest, overnight process, morning reconcile. A2A 'fasts' continuously — atomic by design.",
    solution: "Eunomia is the stomach lining: absorbs COBOL batch, breaks into verifiable transactions, feeds A2A bloodstream in real-time.",
    revenue: "Infrastructure margin on every conversion across the venturi",
    eunomiaUri: "eunomia://finance/venturi",
    mcpSlugs: ["bft-progress-council-mcp", "meok-coinbase-x402-receipt-mcp"],
    href: "/venturi",
  },
  {
    id: "opening-7",
    slug: "engine-axis",
    title: "Engine axis as the Y-axis of finance",
    headline: "Engine axis — trust density on every crossing",
    problem: "Every instrument moves human→agent on X (time/velocity). Y (trust/compliance) must be climbed before settlement.",
    solution: "Eunomia IS the Y-axis design: read COBOL trails, verify A2A identity, arbitrate disputes, attest compliance, settle atomically (mostly SPEC/GAP today).",
    revenue: "Protocol routing fee on every trusted crossing",
    eunomiaUri: "eunomia://finance/engine-axis",
    mcpSlugs: ["proofof-ai-mcp", "agent-identity-trust-mcp", "bft-progress-council-mcp", "iso-42001-ai-mcp", "meok-coinbase-x402-receipt-mcp"],
    href: "/instruments",
  },
];

/** BFT handoff phases for bond trading */
export const BFT_HANDOFF_PHASES = [
  { phase: 1, actor: "Human", action: "Trader sets mandate — e.g. Buy $5M UK gilts, max 4.5% yield" },
  { phase: 2, actor: "BFT Council", action: "3 agents vote: liquidity finder, compliance checker, counterparty verifier" },
  { phase: 3, actor: "A2A", action: "Agents negotiate across venues (OpenYield, MarketAxess, Tradeweb)" },
  { phase: 4, actor: "Human", action: "C2PA attestation sent for cryptographic sign-off" },
  { phase: 5, actor: "Settlement", action: "T+0 atomic DvP via USDC on Base — both legs or neither" },
];
