/**
 * Deadline Radar — turns the frameworks' free-text `effective` dates into a live,
 * queryable compliance clock so the OS is "already aware when deadlines hit."
 *
 * Reads (read-only) from data/frameworks.ts + data/regulationsGeo.ts and emits
 * structured DeadlineEvent[]. Pure, dependency-free, safe to call on the client or
 * server (the daily crawler can reuse it). See intel/types.ts + the blueprint.
 */
import { FRAMEWORKS, type Framework } from '../frameworks';
import { COUNTRY_FRAMEWORKS, GLOBAL_SLUGS } from '../regulationsGeo';
import type { DeadlineEvent } from './types';

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7,
  sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

/** Which jurisdictions a framework binds (ISO3 list, or ['GLOBAL'] for global standards). */
function jurisdictionsFor(slug: string): string[] {
  if (GLOBAL_SLUGS.includes(slug)) return ['GLOBAL'];
  const isos = Object.entries(COUNTRY_FRAMEWORKS)
    .filter(([, slugs]) => slugs.includes(slug))
    .map(([iso]) => iso);
  return isos.length ? isos : ['GLOBAL'];
}

/**
 * Extract every dated milestone from a free-text `effective` string. Handles:
 *   "2 Aug 2026 (GPAI) · 2 Dec 2027 (Annex III high-risk)" → two events
 *   "22 Jan 2026" · "Dec 2023" · "2025" · "25 May 2018"
 * Parenthetical text becomes the milestone label.
 */
export function parseEffective(effective: string): Array<{ date: string; label?: string }> {
  if (!effective) return [];
  const out: Array<{ date: string; label?: string }> = [];
  // day? month year, optionally followed by "(label)"
  const re = /(?:(\d{1,2})\s+)?([A-Za-z]{3,4})\.?\s+(\d{4})(?:\s*\(([^)]+)\))?|(\b\d{4}\b)(?:\s*\(([^)]+)\))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(effective)) !== null) {
    if (m[3] && m[2]) {
      const mon = MONTHS[m[2].toLowerCase()];
      if (mon === undefined) continue;
      const day = m[1] ? parseInt(m[1], 10) : 1;
      const dt = new Date(Date.UTC(parseInt(m[3], 10), mon, day));
      out.push({ date: dt.toISOString().slice(0, 10), label: m[4]?.trim() });
    } else if (m[5]) {
      // bare year (e.g. "1996", "2025")
      out.push({ date: `${m[5]}-01-01`, label: m[6]?.trim() });
    }
  }
  return out;
}

/** All deadline events across the framework catalogue. */
export function allDeadlines(frameworks: Framework[] = FRAMEWORKS): DeadlineEvent[] {
  const events: DeadlineEvent[] = [];
  for (const f of frameworks) {
    if (!f.effective) continue;
    const juris = jurisdictionsFor(f.slug);
    for (const { date, label } of parseEffective(f.effective)) {
      events.push({
        date,
        frameworkSlug: f.slug,
        label: label ? `${f.name} — ${label}` : f.name,
        jurisdictions: juris,
        binding: f.binding,
      });
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

const daysBetween = (from: Date, isoDate: string) =>
  Math.ceil((Date.UTC(+isoDate.slice(0, 4), +isoDate.slice(5, 7) - 1, +isoDate.slice(8, 10)) - from.getTime()) / 86_400_000);

/** Future (and today's) deadlines, soonest first, with `daysOut` filled in. */
export function upcomingDeadlines(from: Date = new Date(), frameworks: Framework[] = FRAMEWORKS): DeadlineEvent[] {
  const f0 = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  return allDeadlines(frameworks)
    .map((e) => ({ ...e, daysOut: daysBetween(f0, e.date) }))
    .filter((e) => (e.daysOut ?? -1) >= 0)
    .sort((a, b) => (a.daysOut! - b.daysOut!));
}

/** Deadlines (past + future) relevant to one jurisdiction (ISO3), global standards included. */
export function deadlinesForJurisdiction(iso3: string, from: Date = new Date(), frameworks: Framework[] = FRAMEWORKS): DeadlineEvent[] {
  const f0 = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  return allDeadlines(frameworks)
    .filter((e) => e.jurisdictions.includes('GLOBAL') || e.jurisdictions.includes(iso3))
    .map((e) => ({ ...e, daysOut: daysBetween(f0, e.date) }))
    .sort((a, b) => (a.daysOut! - b.daysOut!));
}

/** The single next binding deadline anywhere — the headline clock. */
export function nextDeadline(from: Date = new Date(), bindingOnly = true): DeadlineEvent | null {
  const up = upcomingDeadlines(from).filter((e) => (bindingOnly ? e.binding : true));
  return up[0] ?? null;
}
