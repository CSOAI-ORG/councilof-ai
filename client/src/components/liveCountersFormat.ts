/**
 * Pure formatting for LiveCounters: payload row → what a pill prints. No React, no fetch.
 *
 * A pill prints a number only when the row's state says the source answered, and never prints one
 * bare: READ is the figure, PARTIAL is "≥ N" because it is a lower bound over part of a fan-out,
 * and STALE is "N · stale" because the figure is real and out of date and a reader must be told
 * both in the same glance. UNCHECKABLE and UNMEASURED print as those words. Anything else — a
 * missing row, a non-number where a number was promised — prints UNCHECKABLE, never 0 and never a
 * guess. "—" is reserved for "no payload yet" and is decided by the component, not here.
 *
 * Every download figure carries the window it was counted over (`window` on the row, e.g. the 30
 * complete UTC days it covers, or "cumulative, all time"). Two windows are never added, so the
 * pill names the one it is showing instead of letting a reader assume.
 *
 * No number in this file, or in LiveCounters.tsx, is typed. Every figure comes from the payload.
 */

export type RowState = "READ" | "PARTIAL" | "STALE" | "UNCHECKABLE" | "UNMEASURED";

export interface FootprintRow {
  state?: RowState | string;
  value?: number | string | null;
  unit?: string;
  /** The span the figure was counted over. Never assume one; never add two. */
  window?: string;
  kind?: string;
  source_url?: string | string[];
  as_of?: string | null;
  reason?: string;
  sampled_note?: string;
  /** Fan-out coverage, when the row is one: how many of how many counters answered. */
  covered?: number;
  attempted?: number;
  /** Where the per-package evidence lives, when the row was read out of a measured artifact. */
  evidence_url?: string;
  age_hours?: number | null;
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
  /** What the pill prints: a number, "≥ N" for a lower bound, "N · stale", or a state word. */
  text: string;
  /** Drives colour. "numeric" for a fresh complete read; every other state names itself. */
  tone: "numeric" | "PARTIAL" | "STALE" | "UNCHECKABLE" | "UNMEASURED";
  /** First source URL, if the row names one. */
  href: string | null;
  /** The per-package evidence artifact, when the row was read out of one. */
  evidenceHref: string | null;
  /** The window the figure covers, printed beside the number. Null when the row names none. */
  window: string | null;
  /** Tooltip: window, coverage, as_of, unit and reason. Never empty. */
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
  if (state === "READ" || state === "PARTIAL" || state === "STALE") {
    if (typeof value === "number" && Number.isFinite(value)) {
      const n = formatNumber(value);
      if (state === "PARTIAL") return { text: `≥ ${n}`, tone: "PARTIAL" };
      if (state === "STALE") return { text: `${n} · stale`, tone: "STALE" };
      return { text: n, tone: "numeric" };
    }
    if (typeof value === "string" && value.trim() !== "") {
      return { text: value, tone: state === "READ" ? "numeric" : (state as Pill["tone"]) };
    }
  }
  // A state we do not know, or a READ row without a readable value: say we could not check it.
  return { text: "UNCHECKABLE", tone: "UNCHECKABLE" };
}

/** The window a figure covers, if the row names one. Never guessed from the unit. */
export function rowWindow(row: FootprintRow | undefined): string | null {
  const w = row?.window;
  return typeof w === "string" && w.trim() !== "" ? w : null;
}

/** "312 of 397 counters" — printed whenever the row carries a fan-out's coverage. */
export function coverageText(row: FootprintRow | undefined): string | null {
  const { covered, attempted } = row ?? {};
  if (typeof covered !== "number" || typeof attempted !== "number" || attempted <= 0) return null;
  return `${formatNumber(covered)} of ${formatNumber(attempted)} counters answered`;
}

export function evidenceHref(row: FootprintRow | undefined): string | null {
  const e = row?.evidence_url;
  return typeof e === "string" && e.trim() !== "" ? e : null;
}

export function rowTitle(key: StageKey, row: FootprintRow | undefined): string {
  const parts: string[] = [FUNNEL_LABELS[key]];
  if (row?.unit) parts.push(String(row.unit));
  const w = rowWindow(row);
  if (w) parts.push(`window ${w}`);
  const cov = coverageText(row);
  if (cov) parts.push(cov);
  if (row?.kind) parts.push(String(row.kind));
  if (row?.as_of) parts.push(`as of ${row.as_of}`);
  if (typeof row?.age_hours === "number") parts.push(`measured ${row.age_hours} h ago`);
  if (row?.reason) parts.push(String(row.reason));
  if (row?.sampled_note) parts.push(String(row.sampled_note));
  if (!row) parts.push("row absent from /api/footprint");
  return parts.join(" · ");
}

export function toPill(key: StageKey, row: FootprintRow | undefined): Pill {
  const { text, tone } = formatRow(row);
  return {
    key,
    label: FUNNEL_LABELS[key],
    text,
    tone,
    href: firstSource(row),
    evidenceHref: evidenceHref(row),
    window: rowWindow(row),
    title: rowTitle(key, row),
  };
}

export function pillsFor(payload: FootprintPayload | null | undefined, stages: StageKey[]): Pill[] {
  return stages.map((key) => toPill(key, payload?.[key] as FootprintRow | undefined));
}
