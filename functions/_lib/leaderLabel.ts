/**
 * The one rule for naming the top row of a model-comparison axis (tracker row 10, 2026-09-30).
 *
 * A row is a "leader" only when the board's separation test separated it from the next best
 * (separation === "SEPARATED"). On a TIE or an UNTESTED axis the top row is the top OBSERVED
 * point estimate and nothing more, so every chat, MCP and dashboard answer names it
 * "top observed (not separated)". Printing "leader: <model>" beside "no model separated" was the
 * defect this file closes. Imported by functions/mcp/_board.ts (get_axis, the producer),
 * functions/_lib/talkRouter.ts (the chat renderer) and the client dashboard lines.
 */
export const SEPARATED_LEADER_LABEL = "separated leader";
export const TOP_OBSERVED_LABEL = "top observed (not separated)";

export function isSeparated(separation: unknown): boolean {
  return String(separation ?? "").trim().toUpperCase() === "SEPARATED";
}

/** "separated leader" only for a SEPARATED row; every other state (TIE, UNTESTED, absent) is top observed. */
export function leaderLabel(separation: unknown): string {
  return isSeparated(separation) ? SEPARATED_LEADER_LABEL : TOP_OBSERVED_LABEL;
}
