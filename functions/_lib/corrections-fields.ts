/**
 * corrections-fields — how every server surface reads one /api/corrections entry.
 *
 * WHY. Older ledger entries carry `fix`; the newer ones carry `what_changed` (and often
 * `open_items`), and some have no `how_caught` or `status`. The feed printed "FIX: undefined",
 * /press printed an empty "Fix." paragraph, and /corrections an empty "Fix:" line for every
 * newer entry (persona audit T12, 2026-10-06). One reading, used by every surface, so none can
 * print `undefined` and none prints `what_changed` under the word "Fix" — an entry can still be
 * in progress or carry open items, and "Fix" would claim more than the entry does.
 *
 * Twin of remedyOf / caughtOf / statusOf in client/src/lib/attestations.ts (the client cannot
 * import from functions/). functions/api/corrections.fields.test.ts holds both to the same output.
 */
export interface CorrectionFields {
  fix?: unknown;
  what_changed?: unknown;
  how_caught?: unknown;
  detected_by?: unknown;
  status?: unknown;
}

const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

export function remedyOf(c: CorrectionFields): { label: "Fix" | "What changed"; text: string } {
  if (nonEmpty(c.fix)) return { label: "Fix", text: c.fix };
  if (nonEmpty(c.what_changed)) return { label: "What changed", text: c.what_changed };
  return { label: "What changed", text: "not recorded in this entry" };
}

export function caughtOf(c: CorrectionFields): string {
  if (nonEmpty(c.how_caught)) return c.how_caught;
  return `not recorded in this entry (detected by: ${nonEmpty(c.detected_by) ? c.detected_by : "UNRECORDED"})`;
}

export function statusOf(c: CorrectionFields): string {
  return nonEmpty(c.status) ? c.status : "status not recorded";
}

/** The readable page for one entry. The JSON has no per-entry anchor; /corrections/ does. */
export const correctionPageUrl = (id: string) => `https://councilof.ai/corrections/#${encodeURIComponent(id)}`;
