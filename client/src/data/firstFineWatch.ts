/**
 * First-Fine Watch headline: the figure, the date it was last checked, and whether that date is
 * still fresh (7 Oct 2026 retest: the page printed "days since fining powers: 22" six weeks after the
 * figure was true, on a site whose pitch is live, checkable figures).
 *
 * The source is GET /api/fines (functions/api/fines.ts). That feed carries its own review date
 * (as_of) and derives every count from corpus dates, never from the request clock. This file reads
 * it, and only it decides what the page may call current: a figure older than FRESH_DAYS is shown
 * with its date and a plain "Not updated since <date>" label, never as today's figure. When the feed
 * cannot be read, the page shows the last verified figure from client/src/data/enforcement.ts with
 * its own date and the same label.
 */
import { FFW } from "./enforcement";

/** A figure checked within this many days is shown as current, with its date. Older is labelled stale. */
export const FRESH_DAYS = 14;

export type FineWatchRead = {
  /** EU AI Act Art 101 fines found, in EUR, as of `asOf`. */
  eur: number;
  /** The date the record was last checked (YYYY-MM-DD). */
  asOf: string;
  /** The date Art 101 fining powers began (YYYY-MM-DD). */
  powersOn: string;
  /** Days from powersOn to asOf: both dates from the record, never from today's clock. */
  daysPowersToCheck: number;
  /** Whole days from asOf to today. */
  ageDays: number;
  stale: boolean;
  /** "live": read from /api/fines now. "built-in": the last verified figure shipped with the page. */
  from: "live" | "built-in";
  source: string;
};

const DAY = 86_400_000;
const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const days = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);

function build(eur: number, asOf: string, powersOn: string, now: Date, from: FineWatchRead["from"], source: string): FineWatchRead {
  const today = now.toISOString().slice(0, 10);
  const ageDays = Math.max(0, days(asOf, today));
  return { eur, asOf, powersOn, daysPowersToCheck: days(powersOn, asOf), ageDays, stale: ageDays > FRESH_DAYS, from, source };
}

/** From the /api/fines payload; null when it does not carry the figure and both dates. */
export function readFineWatch(feed: unknown, now: Date = new Date()): FineWatchRead | null {
  const f = (feed && typeof feed === "object" ? feed : {}) as Record<string, any>;
  const w = (f.first_fine_watch ?? {}) as Record<string, unknown>;
  const eur = w.eu_ai_act_fines_collected_eur;
  const asOf = isDate(f.as_of) ? f.as_of : isDate(f.freshness?.rows_last_reviewed) ? f.freshness.rows_last_reviewed : null;
  const powersOn = w.enforcement_powers_live_since;
  if (typeof eur !== "number" || !Number.isFinite(eur) || !asOf || !isDate(powersOn)) return null;
  return build(eur, asOf, powersOn, now, "live", "GET /api/fines");
}

/** The last verified figure shipped with the page (enforcement.ts), with its own date. */
export function builtInFineWatch(now: Date = new Date()): FineWatchRead {
  return build(FFW.eur, FFW.asOf, FFW.powersOnIso, now, "built-in", "client/src/data/enforcement.ts (last verified figure)");
}

/** "24 Aug 2026". */
export function dateLabel(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** "€0" (EUR, no decimals). */
export function eurLabel(n: number): string {
  return `€${n.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}
