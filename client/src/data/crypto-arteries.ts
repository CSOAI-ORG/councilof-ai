/**
 * Crypto arteries — Stake · Slash · Bond · Pay · DAO
 * Crypto is the blood, not the skin. USDC on Base already started; weave into every artery.
 *
 * Status: shipped = repo + site copy exists · partial = repo only · gap = design only
 */
export type CryptoOpeningStatus = "shipped" | "partial" | "gap";

export type CryptoOpening = {
  id: string;
  slug: string;
  title: string;
  mechanic: string;
  revenue: string;
  eunomiaUri: string;
  mcpSlugs: string[];
  status: CryptoOpeningStatus;
  eatLens: string;
};

export const SIGNING_LAYER = [
  {
    type: "Identity sign",
    mechanic: "DID private key proves who acted",
    repo: "agent-identity-trust-mcp",
    eunomiaUri: "eunomia://identity/did-verify",
    status: "shipped" as const,
  },
  {
    type: "Attestation sign",
    mechanic: "C2PA certificate proves output verified",
    repo: "proofof-ai-mcp",
    eunomiaUri: "eunomia://law/provenance",
    status: "shipped" as const,
  },
  {
    type: "Consensus sign",
    mechanic: "BFT council votes with cryptographic signatures",
    repo: "bft-progress-council-mcp",
    eunomiaUri: "eunomia://consensus/bft-vote",
    status: "shipped" as const,
  },
  {
    type: "Transaction sign",
    mechanic: "Smart contract / x402 micro-settlement at route boundary",
    repo: "meok-coinbase-x402-receipt-mcp",
    eunomiaUri: "eunomia://compute/x402-settle",
    status: "partial" as const,
  },
];

/** Micro-payment flow — users top up once; router signs automatically */
export const CRYPTO_MICRO_FLOW = [
  { event: "Player action / bond trade / assess call", amount: "0.05 USDC", to: "NPC / treasury / attest pool" },
  { event: "Cloud burst (RunPod)", amount: "0.02 USDC", to: "GPU host" },
  { event: "Safety probe (care-membrane)", amount: "0.01 USDC", to: "Watchdog SBT holder" },
  { event: "Bond to safety pool", amount: "0.01 USDC", to: "Slash insurance reserve" },
];

export const CRYPTO_OPENINGS: CryptoOpening[] = [
  {
    id: "crypto-1",
    slug: "stake-to-route",
    title: "Stake-to-route (validator economy)",
    mechanic: "bft-progress-council-mcp → PoS: stake to run router nodes, earn on verified routes, slash on unsafe routes.",
    revenue: "5% of all routing fees · community runs infra",
    eunomiaUri: "eunomia://crypto/stake-route",
    mcpSlugs: ["bft-progress-council-mcp", "agent-identity-trust-mcp"],
    status: "partial",
    eatLens: "Staking = fasting capital for clarity (yield). Slashing = autophagy.",
  },
  {
    id: "crypto-2",
    slug: "bond-to-list",
    title: "Bond-to-list (vendor lock)",
    mechanic: "agent-identity-trust-mcp + bond contract: vendors post USDC, arena pass keeps bond, care-membrane fail slashes to victims.",
    revenue: "2% management fee on bond pool · Lloyd's for algorithms",
    eunomiaUri: "eunomia://crypto/bond-list",
    mcpSlugs: ["agent-identity-trust-mcp", "care-membrane-mcp", "meok-x402-wrap-mcp"],
    status: "partial",
    eatLens: "Bond = stored metabolic reserve. Slash = burn bad tissue.",
  },
  {
    id: "crypto-3",
    slug: "pay-per-attestation",
    title: "Pay-per-attestation (compliance SKUs)",
    mechanic: "proofof-ai-mcp C2PA certs priced per tier: 0.01 USDC basic → 500 USDC full audit trail.",
    revenue: "Every regulation = new attestation SKU",
    eunomiaUri: "eunomia://crypto/attest-pay",
    mcpSlugs: ["proofof-ai-mcp", "meok-x402-wrap-mcp", "iso-42001-ai-mcp"],
    status: "partial",
    eatLens: "Each attestation = one digested nutrient (low-entropy proof packet).",
  },
  {
    id: "crypto-4",
    slug: "data-dao",
    title: "Data DAO (eval marketplace)",
    mechanic: "Arena traces from MEOK/gspc-arena → DAO sells eval data; gamers mine traces, vendors discount fees, red team bounties.",
    revenue: "DAO sells datasets to labs · revenue to players",
    eunomiaUri: "eunomia://crypto/data-dao",
    mcpSlugs: ["bft-progress-council-mcp"],
    status: "gap",
    eatLens: "Arena = fed state (raw play). Dataset = fasted distillate.",
  },
  {
    id: "crypto-5",
    slug: "agent-wallets",
    title: "Agent wallets (MEOK NPC metabolism)",
    mechanic: "MEOK NPCs: receive per call, spend on RunPod, stake to safety bond, save for memory upgrade.",
    revenue: "NPCs as economic agents · popular companions accumulate compute",
    eunomiaUri: "eunomia://crypto/agent-wallet",
    mcpSlugs: ["agent-token-budget-mcp", "agent-x402-paywall-mcp", "eudi-wallet-mcp"],
    status: "partial",
    eatLens: "Wallet = cellular metabolism. Each call = one heartbeat.",
  },
  {
    id: "crypto-6",
    slug: "compute-futures",
    title: "Compute futures (tokenized GPU)",
    mechanic: "RunPod + crypto: GPU-hour tokens (A100-JAN27) tradeable — CME of AI compute.",
    revenue: "Spread on futures · miners hedge · gamers hedge spikes",
    eunomiaUri: "eunomia://crypto/gpu-futures",
    mcpSlugs: ["agent-token-budget-mcp"],
    status: "gap",
    eatLens: "Futures = pre-digesting compute cost (fasting ahead of demand).",
  },
  {
    id: "crypto-7",
    slug: "sbt-credentials",
    title: "SBT credentials (soulbound reputation)",
    mechanic: "Watchdog / CEASAI certs as non-transferable on-chain credentials — Moody's of AI agents.",
    revenue: "$10K/mo institutional access to verified talent pool",
    eunomiaUri: "eunomia://crypto/sbt",
    mcpSlugs: ["agent-identity-trust-mcp", "eudi-wallet-mcp"],
    status: "partial",
    eatLens: "SBT = fixed identity cell — cannot be grafted (non-transferable).",
  },
  {
    id: "crypto-8",
    slug: "prediction-markets",
    title: "Prediction markets (arena betting)",
    mechanic: "Pre-arena markets on model outcomes — vig on volume, arena data as oracle.",
    revenue: "Sportsbook with structural data advantage (honesty gate publishes losses)",
    eunomiaUri: "eunomia://crypto/predict",
    mcpSlugs: ["bft-progress-council-mcp", "care-membrane-mcp"],
    status: "gap",
    eatLens: "Market = entropy before block. Settlement = consensus clarity.",
  },
  {
    id: "crypto-9",
    slug: "rug-insurance",
    title: "Rug-pull insurance",
    mechanic: "Bond pool + smart refunds: vendor delist → auto USDC refund; safety breach → bond pays victims.",
    revenue: "10% of staking rewards → insurance pool · Moody's + AIG of AI",
    eunomiaUri: "eunomia://crypto/insurance",
    mcpSlugs: ["insurance-verification-mcp", "meok-coinbase-x402-receipt-mcp", "proofof-ai-mcp"],
    status: "partial",
    eatLens: "Insurance pool = glycogen reserve for systemic shock.",
  },
  {
    id: "crypto-10",
    slug: "eunomia-token",
    title: "EUNOMIA token (reserve currency)",
    mechanic: "Utility across 5 layers: routing fees (EUN discount), staking, governance, data access, agent survival reserve.",
    revenue: "Protocol value capture — not company equity",
    eunomiaUri: "eunomia://crypto/eun",
    mcpSlugs: ["agent-x402-paywall-mcp", "bft-progress-council-mcp"],
    status: "gap",
    eatLens: "Token = ketone body of the network — portable fuel across all organs.",
  },
];

/** Bond market × crypto — the deepest convergence */
export const BOND_CRYPTO_BRIDGE = {
  thesis:
    "COBOL legacy was built for humans batching trust. A2A was built for agents streaming trust. " +
    "Neither was built for the other. Eunomia engine axis removes friction: read batch, emit stream, settle atomically, sign everything.",
  cobolRole: "Fed state — T+2 batch, overnight reconcile, relationship trust",
  a2aRole: "Fasted state — T+0 atomic, cryptographic trust",
  cryptoRole: "Blood — USDC cash leg, x402 micro-pay, bond slash, stake slash",
  venturiRole: "Stomach lining — converts without killing the host",
};
