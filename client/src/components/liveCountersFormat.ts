/**
 * Pure formatting for LiveCounters: payload row → what a pill prints. No React, no fetch.
 *
 * A pill prints a number only when the row's state says the source answered (READ, or PARTIAL
 * with the lower-bound mark). UNCHECKABLE and UNMEASURED print as those words. Anything else —
 * a missing row, a non-number where a number was promised — prints UNCHECKABLE, never 0 and
 * never a guess. "—" is reserved for "no payload yet" and is decided by the component, not here.
 */

export type RowState = "READ" | "PARTIAL" | "UNCHECKABLE" | "UNMEASURED";

export interface FootprintRow {
  state?: RowState | string;
  value?: number | string | null;
  unit?: string;
  kind?: string;
  source_url?: string | string[];
  as_of?: string | null;
  reason?: string;
  sampled_note?: string;
  [extra: string]: unknown;
}

export interface FootprintPayload {
  schema?: string;
  as_of?: string;
  honesty?: string;
  registry_listings?: FootprintRow;
  gross_distribution?: FootprintRow;
  qualified_distribution?: FootprintRow;
  observed_execution?: FootprintRow;
  economic_use?: FootprintRow;
  repeat_payers?: FootprintRow;
  institutional_use?: FootprintRow;
  board?: FootprintRow;
  signed_cards?: FootprintRow;
  github_stars?: FootprintRow;
}

export type StageKey = keyof Omit<FootprintPayload, "schema" | "as_of" | "honesty">;

export interface Pill {
  key: StageKey;
  label: string;
  /** What the pill prints: a formatted number, "≥ N" for a lower bound, or a state word. */
  text: string;
  /** Drives colour; "numeric" for READ/PARTIAL, otherwise the state word. */
  tone: "numeric" | "UNCHECKABLE" | "UNMEASURED";
  /** First source URL, if the row names one. */
  href: string | null;
  /** Tooltip: as_of plus unit/reason. Never empty. */
  title: string;
}

export const FUNNEL_LABELS: Record<StageKey, string> = {
  registry_listings: "Registry listings",
  gross_distribution: "Gross downloads",
  qualified_distribution: "Non-mirror downloads",
  observed_execution: "Observed executions",
  economic_use: "Paying wallets",
  repeat_payers: "Repeat payers",
  institutional_use: "Institutions",
  board: "Board",
  signed_cards: "Signed cards verifying",
  github_stars: "Repository stars",
};

/** Home hero: the stages a first reader should see, in funnel order. */
export const HERO_STAGES: StageKey[] = ["gross_distribution", "economic_use", "registry_listings"];

/** Footer: the whole funnel, compact, in funnel order. */
export const FOOTER_STAGES: StageKey[] = [
  "registry_listings",
  "gross_distribution",
  "qualified_distribution",
  "observed_execution",
  "economic_use",
  "repeat_payers",
  "institutional_use",
];

const nf = new Intl.NumberFormat("en-GB");

export function formatNumber(n: number): string {
  return nf.format(n);
}

export function firstSource(row: FootprintRow | undefined): string | null {
  const s = row?.source_url;
  if (Array.isArray(s)) return typeof s[0] === "string" ? s[0] : null;
  return typeof s === "string" ? s : null;
}

/** The pill text for one row. Exhaustive over what the endpoint can say; defensive over what it cannot. */
export function formatRow(row: FootprintRow | undefined): { text: string; tone: Pill["tone"] } {
  if (!row || typeof row !== "object") return { text: "UNCHECKABLE", tone: "UNCHECKABLE" };
  const { state, value } = row;
  if (state === "UNMEASURED") return { text: "UNMEASURED", tone: "UNMEASURED" };
  if (state === "UNCHECKABLE") return { text: "UNCHECKABLE", tone: "UNCHECKABLE" };
  if (state === "READ" || state === "PARTIAL") {
    if (typeof value === "number" && Number.isFinite(value)) {
      return { text: state === "PARTIAL" ? `≥ ${formatNumber(value)}` : formatNumber(value), tone: "numeric" };
    }
    if (typeof value === "string" && value.trim() !== "") return { text: value, tone: "numeric" };
  }
  // A state we do not know, or a READ row without a readable value: say we could not check it.
  return { text: "UNCHECKABLE", tone: "UNCHECKABLE" };
}

export function rowTitle(key: StageKey, row: FootprintRow | undefined): string {
  const parts: string[] = [FUNNEL_LABELS[key]];
  if (row?.unit) parts.push(String(row.unit));
  if (row?.kind) parts.push(String(row.kind));
  if (row?.as_of) parts.push(`as of ${row.as_of}`);
  if (row?.reason) parts.push(String(row.reason));
  if (row?.sampled_note) parts.push(String(row.sampled_note));
  if (!row) parts.push("row absent from /api/footprint");
  return parts.join(" · ");
}

export function toPill(key: StageKey, row: FootprintRow | undefined): Pill {
  const { text, tone } = formatRow(row);
  return { key, label: FUNNEL_LABELS[key], text, tone, href: firstSource(row), title: rowTitle(key, row) };
}

export function pillsFor(payload: FootprintPayload | null | undefined, stages: StageKey[]): Pill[] {
  return stages.map((key) => toPill(key, payload?.[key] as FootprintRow | undefined));
}
