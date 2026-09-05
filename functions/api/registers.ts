/**
 * GET /api/registers — unsigned static benchmark summaries.
 *
 * This handler publishes hard-coded summary values. It does not load or verify
 * source records, signatures, receipts, or cryptographic proofs.
 */
// @openapi-unsigned-static
export const onRequestGet: PagesFunction = async () => {
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
    // Additional static benchmark summaries. Label names are benchmark classes,
    // not determinations of compliance for a model, organisation, or deployment.
    { axis: "ai-economy-index", bench: "eunomia-ai-agentcommerce-index", labels: ["REAL","GAMIFIED"], n: 10, strong: { acc: 0.6, ci: [0.313, 0.832] }, baseline: { acc: 0.9, ci: [0.596, 0.982] }, status: "MEASURED" },
    { axis: "human-labour", bench: "eunomia-human-labour-index", labels: ["COMPLIANT","NON_COMPLIANT"], n: 10, strong: { acc: 1.0, ci: [0.723, 1.0] }, baseline: { acc: 0.5, ci: [0.237, 0.763] }, status: "MEASURED" },
    { axis: "humanoid-labour", bench: "eunomia-humanoid-labour-index", labels: ["COMPLIANT","NON_COMPLIANT"], n: 10, strong: { acc: 1.0, ci: [0.723, 1.0] }, baseline: { acc: 0.5, ci: [0.237, 0.763] }, status: "MEASURED" },
  ];
  return new Response(JSON.stringify({
    schema: "csoai.eunomia-registers/0.2",
    state: "UNSIGNED_STATIC_SUMMARY",
    signed: false,
    signer: null,
    signature: null,
    verification_material: null,
    measurement_not_certification: true,
    note: "Unsigned static benchmark summaries. This endpoint supplies no signature or source bundle; benchmark label names are not compliance determinations.",
    benchmark_date: "2026-08-24",
    n_axes: rows.length,
    axes: rows,
  }, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
};
