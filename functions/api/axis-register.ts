/**
 * GET /api/axis-register — the GSPC axis register (canonical scored rows).
 *
 * Slot counts live in GET /api/gspc totals (public_count, measured_axes,
 * quotable_axes). This register lists the bundled scored rows; it does not
 * type a board fraction.
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
    registry_axis_count: AXES.length,
    public_count: "GET /api/gspc totals.public_count",
    counting_rule:
      "Slot counts live in GET /api/gspc totals (public_count, measured_axes, quotable_axes). " +
      "This register lists the canonical scored rows. Jail is a measured floor when its " +
      "separation is UNTESTED. Empty cells stay empty.",
    axes: AXES,
    note: "Static from GSPC_AXIS_REGISTRY.json (ruled source of truth). " +
      "Per-axis results are independently signed; see /api/cards and /signed/ for verification. " +
      "Living board counts: GET /api/gspc.",
  });
};
