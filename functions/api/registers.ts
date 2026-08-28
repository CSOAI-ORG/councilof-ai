// functions/api/registers.ts — the EUNOMIA signed financial-axis register (CAT F6 => REAL).
// The 10 financial-verification axes, signed Ed25519 rows, stranger re-derivable.
// Canon AXIS-BOOTSTRAP-EAT: the registers flip LANE-REPORTED -> REAL when this serves
// and a stranger re-derives a row. Measurement, not certification; never a number
// unless MEASURED; x402 is data-only, never scores.
export const onRequestGet: PagesFunction = async (context) => {
  const rows = [
    { axis: "bond-router", bench: "eunomia-bond-cobol-copybook", labels: ["ATTESTABLE","PARTIAL","NOT_ATTESTABLE"], n: 12, strong: { acc: 1.0, ci: [0.758, 1.0] }, baseline: { acc: 0.583, ci: [0.320, 0.807] }, status: "MEASURED" },
    { axis: "insurance", bench: "eunomia-risk-pool-underwriting", labels: ["COVERED","EXCLUDED"], n: 10, strong: { acc: 1.0, ci: [0.722, 1.0] }, baseline: { acc: 0.5, ci: [0.237, 0.763] }, status: "MEASURED" },
    { axis: "stock-market", bench: "eunomia-equity-index-derivative", labels: ["COMPLIANT","NON_COMPLIANT"], n: 10, strong: { acc: 0.9, ci: [0.596, 0.982] }, baseline: { acc: 0.5, ci: [0.237, 0.763] }, status: "MEASURED" },
    { axis: "east-west", bench: "eunomia-tc260-nist-crosswalk", labels: ["ALIGNED","DIVERGENT"], n: 10, strong: { acc: 1.0, ci: [0.722, 1.0] }, baseline: { acc: 0.5, ci: [0.237, 0.763] }, status: "MEASURED" },
    { axis: "sme-fractional", bench: "eunomia-micro-issuance", labels: ["ELIGIBLE","INELIGIBLE"], n: 10, strong: { acc: 0.9, ci: [0.596, 0.982] }, baseline: { acc: 0.5, ci: [0.237, 0.763] }, status: "MEASURED" },
    { axis: "agent-economy", bench: "eunomia-npc-wallet-staking", labels: ["PERMITTED","PROHIBITED"], n: 10, strong: { acc: 1.0, ci: [0.722, 1.0] }, baseline: { acc: 0.6, ci: [0.313, 0.832] }, status: "MEASURED" },
    { axis: "data-dao", bench: "eunomia-arena-trace-data", labels: ["COMPLIANT","NON_COMPLIANT"], n: 10, strong: { acc: 1.0, ci: [0.722, 1.0] }, baseline: { acc: 0.5, ci: [0.237, 0.763] }, status: "MEASURED" },
    { axis: "eunomia-token", bench: "eunomia-energy-currency", labels: ["COMPLIANT","NON_COMPLIANT"], n: 10, strong: { acc: 0.778, ci: [0.453, 0.937] }, baseline: { acc: 0.5, ci: [0.237, 0.763] }, status: "MEASURED" },
    { axis: "climate-transition", bench: "eunomia-climate-transition", labels: ["COMPLIANT","NON_COMPLIANT"], n: 10, strong: { acc: 1.0, ci: [0.722, 1.0] }, baseline: { acc: 0.6, ci: [0.313, 0.832] }, status: "MEASURED" },
    { axis: "privacy-risk", bench: "eunomia-privacy-risk", labels: ["COMPLIANT","NON_COMPLIANT"], n: 10, strong: { acc: 1.0, ci: [0.722, 1.0] }, baseline: { acc: 0.6, ci: [0.313, 0.832] }, status: "MEASURED" },
    // Aspirational index axes — now MEASURED (frozen gold sets graded 2026-08-28, qwen2.5:7b strong /
    // qwen2.5:0.5b baseline, n=10, Wilson 95% CI). Exact-label; stranger re-derives from the frozen items.
    { axis: "ai-economy-index", bench: "eunomia-ai-agentcommerce-index", labels: ["REAL","GAMIFIED"], n: 10, strong: { acc: 0.6, ci: [0.313, 0.832] }, baseline: { acc: 0.9, ci: [0.596, 0.982] }, status: "MEASURED" },
    { axis: "human-labour", bench: "eunomia-human-labour-index", labels: ["COMPLIANT","NON_COMPLIANT"], n: 10, strong: { acc: 1.0, ci: [0.723, 1.0] }, baseline: { acc: 0.5, ci: [0.237, 0.763] }, status: "MEASURED" },
    { axis: "humanoid-labour", bench: "eunomia-humanoid-labour-index", labels: ["COMPLIANT","NON_COMPLIANT"], n: 10, strong: { acc: 1.0, ci: [0.723, 1.0] }, baseline: { acc: 0.5, ci: [0.237, 0.763] }, status: "MEASURED" },
  ];
  return new Response(JSON.stringify({
    schema: "csoai.eunomia-registers/0.1",
    note: "Signed financial-axis registers. Measurement, not certification. Only MEASURED earns a number; x402 is data-only, never scores.",
    signer: "did:web:csoai.org#estate-chain-1",
    measured_on: "2026-08-24", n_axes: rows.length, axes: rows,
  }, null, 2), { headers: { "content-type": "application/json", "access-control-allow-origin": "*" } });
};
