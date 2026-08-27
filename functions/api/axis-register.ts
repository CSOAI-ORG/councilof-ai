/**
 * GET /api/axis-register — the GSPC axis register (canonical scored rows).
 *
 * Slot counts live in GET /api/gspc totals (public_count, measured_axes,
 * quotable_axes). This register lists the bundled scored rows; it does not
 * type a board fraction. Cite live totals.public_count for the board fraction.
 *
 * The rows themselves live in ./_axis_register so /api/counters can count them
 * from the committed array instead of fetching this endpoint at request time.
 */

import { AXES } from "./_axis_register";

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
      "This register lists the 14 canonical scored rows (13 board axes + jail). Jail is " +
      "MEASURED; living-board separation is TIE (determined 2026-08-25) — a TIE is not a " +
      "separated leader. Empty cells stay empty.",
    axes: AXES,
    note: "Static from GSPC_AXIS_REGISTRY.json (ruled source of truth) + jail GoldBank floor. " +
      "Per-axis results are independently signed; see /api/cards and /signed/ for verification. " +
      "Living board counts: GET /api/gspc. Canon lock: do not invent 22 axes.",
  });
};
