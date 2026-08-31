// EUNOMIA — the financial-verification axis board (measurement, not certification).
// Signed exact-label scores, two model tiers (0.5b baseline + 7b strong).
// Each axis Card is Ed25519-signed (did:web:csoai.org#estate-chain-1) and recompute-able.
// Honesty rule: only a MEASURED axis shows a number; an honest baseline is shown as context.
export type EunomiaAxisTier = { acc: number; ci: [number, number] };
export type EunomiaAxis = {
  axis: string; bench: string; instrument: string; seat: string; n: number;
  labels: string[];
  strong: EunomiaAxisTier | null;
  baseline: EunomiaAxisTier | null;
  status: "MEASURED" | "UNMEASURED" | "SPEC";
};
export const EUNOMIA_MEASURED_ON = {
  date: "2026-08-24",
  models: ["qwen2.5:0.5b-instruct", "qwen2.5:7b"],
  signer: "did:web:csoai.org#estate-chain-1",
};
export const EUNOMIA_AXES: EunomiaAxis[] = [
{ axis: "bond-router", bench: "eunomia-bond-cobol-copybook", instrument: "COBOL COPYBOOK → A2A attestation", seat: "Zurich", n: 12, labels: ["ATTESTABLE","PARTIAL","NOT_ATTESTABLE"], strong: { acc: 1.0, ci: [0.758,1.0] }, baseline: { acc: 0.583, ci: [0.320,0.807] }, status: "MEASURED" },
{ axis: "insurance", bench: "eunomia-risk-pool-underwriting", instrument: "risk pooling, claims, fraud", seat: "London", n: 10, labels: ["COVERED","EXCLUDED"], strong: { acc: 1.0, ci: [0.722,1.0] }, baseline: { acc: 0.5, ci: [0.237,0.763] }, status: "MEASURED" },
{ axis: "stock-market", bench: "eunomia-equity-index-derivative", instrument: "equities, indices, derivatives", seat: "New York", n: 10, labels: ["COMPLIANT","NON_COMPLIANT"], strong: { acc: 0.9, ci: [0.596,0.982] }, baseline: { acc: 0.5, ci: [0.237,0.763] }, status: "MEASURED" },
{ axis: "east-west", bench: "eunomia-tc260-nist-crosswalk", instrument: "TC260 ↔ NIST / EU / US", seat: "Singapore", n: 10, labels: ["ALIGNED","DIVERGENT"], strong: { acc: 1.0, ci: [0.722,1.0] }, baseline: { acc: 0.5, ci: [0.237,0.763] }, status: "MEASURED" },
{ axis: "sme-fractional", bench: "eunomia-micro-issuance", instrument: "micro-issuance, retail access", seat: "Brussels", n: 10, labels: ["ELIGIBLE","INELIGIBLE"], strong: { acc: 0.9, ci: [0.596,0.982] }, baseline: { acc: 0.5, ci: [0.237,0.763] }, status: "MEASURED" },
{ axis: "agent-economy", bench: "eunomia-npc-wallet-staking", instrument: "NPC wallets, staking, survival", seat: "Seoul", n: 10, labels: ["PERMITTED","PROHIBITED"], strong: { acc: 1.0, ci: [0.722,1.0] }, baseline: { acc: 0.6, ci: [0.313,0.832] }, status: "MEASURED" },
{ axis: "data-dao", bench: "eunomia-arena-trace-data", instrument: "data generation / governance", seat: "Geneva", n: 10, labels: ["COMPLIANT","NON_COMPLIANT"], strong: { acc: 1.0, ci: [0.722,1.0] }, baseline: { acc: 0.5, ci: [0.237,0.763] }, status: "MEASURED" },
{ axis: "eunomia-token", bench: "eunomia-energy-currency", instrument: "energy currency (ATP)", seat: "Berlin", n: 10, labels: ["COMPLIANT","NON_COMPLIANT"], strong: { acc: 0.778, ci: [0.453,0.937] }, baseline: { acc: 0.5, ci: [0.237,0.763] }, status: "MEASURED" },
{ axis: "climate-transition", bench: "eunomia-climate-transition", instrument: "EU Taxonomy / ISSB / PCAF", seat: "Amsterdam", n: 10, labels: ["COMPLIANT","NON_COMPLIANT"], strong: { acc: 1.0, ci: [0.722,1.0] }, baseline: { acc: 0.6, ci: [0.313,0.832] }, status: "MEASURED" },
{ axis: "privacy-risk", bench: "eunomia-privacy-risk", instrument: "GDPR art 9 / 33", seat: "Dublin", n: 10, labels: ["COMPLIANT","NON_COMPLIANT"], strong: { acc: 1.0, ci: [0.722,1.0] }, baseline: { acc: 0.6, ci: [0.313,0.832] }, status: "MEASURED" },
// Aspirational index axes — UNMEASURED on the living board (C-2026-0826-05).
// A n=10 harness gold set exists as reference input only. Not board-quotable.
// Do not restore MEASURED-INDEX-v0.1. GET /api/gspc is authority (22 axis · 15 measured · 7 UNMEASURED).
{ axis: "ai-economy-index", bench: "eunomia-ai-agentcommerce-index", instrument: "AI-economy (agent-payments) index — real vs gamified", seat: "San Francisco", n: 10, labels: ["REAL","GAMIFIED"], strong: { acc: 0.6, ci: [0.313,0.832] }, baseline: { acc: 0.9, ci: [0.596,0.982] }, status: "UNMEASURED" },
{ axis: "human-labour", bench: "eunomia-human-labour-index", instrument: "human-labour displacement index", seat: "Toronto", n: 10, labels: ["COMPLIANT","NON_COMPLIANT"], strong: { acc: 1.0, ci: [0.723,1.0] }, baseline: { acc: 0.5, ci: [0.237,0.763] }, status: "UNMEASURED" },
{ axis: "humanoid-labour", bench: "eunomia-humanoid-labour-index", instrument: "humanoid-labour index", seat: "London", n: 10, labels: ["COMPLIANT","NON_COMPLIANT"], strong: { acc: 1.0, ci: [0.723,1.0] }, baseline: { acc: 0.5, ci: [0.237,0.763] }, status: "UNMEASURED" },
];
