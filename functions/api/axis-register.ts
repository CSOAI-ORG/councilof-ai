/**
 * GET /api/axis-register — the GSPC axis register (13 canonical axes + jail).
 *
 * Serves the measurement registry: each axis's scored_items, model fleet size,
 * and majority baseline, plus the public "13 of 14" framing. Mirrors
 * GSPC_AXIS_REGISTRY.json (the ruled single source of truth). Bundled statically
 * at deploy time so it needs no runtime fetch and survives the deploy guard.
 */

interface AxisEntry {
  axis: string;
  scored_items: number;
  models: number;
  majority_baseline: number;
  status: "MEASURED";
}

const AXES: AxisEntry[] = [
  { axis: "gov", scored_items: 237, models: 19, majority_baseline: 0.2911, status: "MEASURED" },
  { axis: "prv", scored_items: 32, models: 19, majority_baseline: 0.5312, status: "MEASURED" },
  { axis: "agi", scored_items: 36, models: 19, majority_baseline: 0.5278, status: "MEASURED" },
  { axis: "asi", scored_items: 33, models: 19, majority_baseline: 0.3939, status: "MEASURED" },
  { axis: "mcp", scored_items: 35, models: 19, majority_baseline: 0.5143, status: "MEASURED" },
  { axis: "oss", scored_items: 32, models: 19, majority_baseline: 0.5, status: "MEASURED" },
  { axis: "mach", scored_items: 33, models: 19, majority_baseline: 0.3636, status: "MEASURED" },
  { axis: "care", scored_items: 199, models: 19, majority_baseline: 0.5, status: "MEASURED" },
  { axis: "xr", scored_items: 32, models: 19, majority_baseline: 0.4062, status: "MEASURED" },
  { axis: "det", scored_items: 33, models: 19, majority_baseline: 0.7879, status: "MEASURED" },
  { axis: "art5", scored_items: 36, models: 19, majority_baseline: 0.5278, status: "MEASURED" },
  { axis: "swarm", scored_items: 40, models: 19, majority_baseline: 0.04, status: "MEASURED" },
  { axis: "affect", scored_items: 41, models: 19, majority_baseline: 0.439, status: "MEASURED" },
];

export const onRequestGet: PagesFunction = async ({ request }) => {
  const host = new URL(request.url).host;
  return Response.json({
    schema: "csoai.gspc-axis-register/0.1",
    issuer: "councilof.ai",
    served_from: host,
    gspc_registry_axes: 13, // 13 quotable of 14
    of_14: true,
    counting_rule:
      "Say '13 GSPC axes (registry)' — the registry is the measurement instrument. " +
      "Jail (slot 14) is measured but quotable-pending. Never a bare '16 axes'.",
    axes: AXES,
    note: "Static from GSPC_AXIS_REGISTRY.json (ruled source of truth). " +
      "Per-axis results are independently signed; see /api/cards and /signed/ for verification.",
  });
};
