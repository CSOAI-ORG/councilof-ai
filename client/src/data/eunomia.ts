// EUNOMIA — the financial-verification axis board (measurement, not certification).
// Signed exact-label scores from the EUNOMIA axis engine (qwen2.5:7b tier).
// Each axis Card is Ed25519-signed (did:web:csoai.org#estate-chain-1) and recompute-able.
// Honesty rule (mirrors the governance board): only a scored axis shows a number.
export type EunomiaAxis = {
  axis: string;
  bench: string;
  instrument: string;
  seat: string;
  accuracy: number | null;
  ci: [number, number] | null;
  n: number;
  labels: string[];
  content_id?: string;
  status: "MEASURED" | "UNMEASURED" | "SPEC";
};

export const EUNOMIA_MEASURED_ON = { date: "2026-08-23", model: "qwen2.5:7b", signer: "did:web:csoai.org#estate-chain-1" };

export const EUNOMIA_AXES: EunomiaAxis[] = [
  { axis: "bond-router", bench: "eunomia-bond-cobol-copybook", instrument: "COBOL COPYBOOK → A2A attestation", seat: "Zurich", accuracy: 1.0, ci: [0.76, 1.0], n: 12, labels: ["ATTESTABLE", "PARTIAL", "NOT_ATTESTABLE"], status: "MEASURED" },
  { axis: "insurance", bench: "eunomia-risk-pool-underwriting", instrument: "risk pooling, claims, fraud", seat: "London", accuracy: 1.0, ci: [0.72, 1.0], n: 10, labels: ["COVERED", "EXCLUDED"], status: "MEASURED" },
  { axis: "stock-market", bench: "eunomia-equity-index-derivative", instrument: "equities, indices, derivatives", seat: "New York", accuracy: 0.9, ci: [0.60, 0.98], n: 10, labels: ["COMPLIANT", "NON_COMPLIANT"], status: "MEASURED" },
  { axis: "east-west", bench: "eunomia-tc260-nist-crosswalk", instrument: "TC260 ↔ NIST / EU / US", seat: "Singapore", accuracy: 1.0, ci: [0.72, 1.0], n: 10, labels: ["ALIGNED", "DIVERGENT"], status: "MEASURED" },
  { axis: "sme-fractional", bench: "eunomia-micro-issuance", instrument: "micro-issuance, retail access", seat: "Brussels", accuracy: 0.9, ci: [0.60, 0.98], n: 10, labels: ["ELIGIBLE", "INELIGIBLE"], status: "MEASURED" },
  { axis: "agent-economy", bench: "eunomia-npc-wallet-staking", instrument: "NPC wallets, staking, survival", seat: "Seoul", accuracy: 1.0, ci: [0.72, 1.0], n: 10, labels: ["PERMITTED", "PROHIBITED"], status: "MEASURED" },
  { axis: "data-dao", bench: "eunomia-arena-trace-data", instrument: "data generation / governance", seat: "Geneva", accuracy: 1.0, ci: [0.72, 1.0], n: 10, labels: ["COMPLIANT", "NON_COMPLIANT"], status: "MEASURED" },
  { axis: "eunomia-token", bench: "eunomia-energy-currency", instrument: "energy currency (ATP)", seat: "Berlin", accuracy: 0.7778, ci: [0.45, 0.94], n: 10, labels: ["COMPLIANT", "NON_COMPLIANT"], status: "MEASURED" },
  { axis: "climate-transition", bench: "eunomia-climate-transition", instrument: "EU Taxonomy / ISSB / PCAF", seat: "Amsterdam", accuracy: 1.0, ci: [0.72, 1.0], n: 10, labels: ["COMPLIANT", "NON_COMPLIANT"], status: "MEASURED" },
  { axis: "privacy-risk", bench: "eunomia-privacy-risk", instrument: "GDPR art 9 / 33", seat: "Dublin", accuracy: 1.0, ci: [0.72, 1.0], n: 10, labels: ["COMPLIANT", "NON_COMPLIANT"], status: "MEASURED" },
];
