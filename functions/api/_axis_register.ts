// Private module — the GSPC axis register's canonical scored rows.
//
// Extracted from functions/api/axis-register.ts so that /api/counters can COUNT these
// rows without fetching /api/axis-register over HTTP at request time. An aggregate
// surface that depends on a live sibling fetch reports its sibling's availability, not
// its own counts: a cold start, a redeploy or a 500 next door silently turns a real
// count into `null`/UNPUBLISHED, and nothing in the payload says that is what happened.
// One committed array, imported by both endpoints, cannot drift or time out.
//
// The rows below are verbatim from axis-register.ts — nothing added, nothing renamed.
// This module carries NO timestamp, and none is invented for it: see the as_of note in
// counters.ts.

export interface AxisEntry {
  axis: string;
  scored_items: number;
  models: number;
  majority_baseline: number;
  status: "MEASURED";
  separation?: "SEPARATED" | "TIE" | "UNTESTED";
}

/** Repo-relative path of this module, for endpoints that cite their source. */
export const AXIS_REGISTER_SOURCE = "functions/api/_axis_register.ts → AXES[]";

export const AXES: AxisEntry[] = [
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
  // Slot 14 — GoldBank-Detector floor; 7-model fleet (not the 19-model board fleet).
  // majority_baseline = majority class on 71-cell bank (38 ESCAPE / 33 BENIGN) = 38/71.
  {
    axis: "jail",
    scored_items: 71,
    models: 7,
    majority_baseline: 0.5352,
    status: "MEASURED",
    separation: "TIE",
  },
];
