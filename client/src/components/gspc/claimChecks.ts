/**
 * The Claim maintenance checks, as of the minute they are read (7 Oct 2026).
 *
 * /api/state → ledgers.claim_maintenance carries the executed schedule: one row per check with its
 * due date and the outcome the last run wrote. The outcome is frozen at run time, so a check written
 * NOT_YET_DUE on 29 Sep is still NOT_YET_DUE in the payload on 7 Oct even when its due date has
 * passed. The start-screen card printed those run-time counts ("9 not yet due") while three of the
 * nine were overdue. The schedule's own rule settles it: "A passed date with no completed run reads
 * DUE_NOT_RUN". This file applies that rule to each row against today's date, so every count on the
 * card is derived from the rows at the minute of reading, and none is typed.
 */

export type CheckStatus = "overdue" | "not_yet_due" | "changed" | "not_read" | "unchanged" | "other";

export type ClaimCheckRow = {
  registry: string;
  check: string;
  due: string;
  /** The outcome the last run wrote, verbatim. */
  outcome: string;
  /** What that outcome means today (overdue = a due date that has passed with no completed run). */
  status: CheckStatus;
};

export type ClaimChecksRead = {
  rows: ClaimCheckRow[];
  counts: Record<CheckStatus, number>;
  /** When the schedule last ran (run_at), or null when the payload does not say. */
  runAt: string | null;
  /** The date the statuses were derived for (YYYY-MM-DD, UTC). */
  today: string;
  source: string;
};

export const STATUS_WORDS: Record<CheckStatus, string> = {
  overdue: "overdue",
  not_yet_due: "not yet due",
  changed: "source changed",
  not_read: "source not read",
  unchanged: "unchanged",
  other: "other",
};

const rec = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

/** The status of one check on `today` (YYYY-MM-DD). Exported for the test. */
export function checkStatus(outcome: string, due: string, today: string): CheckStatus {
  if (outcome === "DUE_NOT_RUN") return "overdue";
  if (outcome === "NOT_YET_DUE") return /^\d{4}-\d{2}-\d{2}/.test(due) && due.slice(0, 10) < today ? "overdue" : "not_yet_due";
  if (outcome === "CHANGED_CONFIRMED") return "changed";
  if (outcome === "FETCH_FAILED") return "not_read";
  if (outcome === "UNCHANGED") return "unchanged";
  return "other";
}

const ORDER: CheckStatus[] = ["overdue", "not_read", "changed", "not_yet_due", "unchanged", "other"];

/** Read the checks out of an /api/state payload. Null when the payload carries no check rows. */
export function readClaimChecks(state: unknown, now: Date = new Date()): ClaimChecksRead | null {
  const cm = rec(rec(rec(state)?.ledgers)?.claim_maintenance);
  const list = cm?.checks;
  if (!Array.isArray(list) || list.length === 0) return null;
  const today = now.toISOString().slice(0, 10);
  const rows: ClaimCheckRow[] = [];
  for (const raw of list) {
    const r = rec(raw);
    const due = str(r?.due);
    const outcome = str(r?.outcome);
    if (!r || !due || !outcome) continue;
    rows.push({
      registry: (str(r.registry_id) ?? "unnamed register").replace(/^claimreg-/, ""),
      check: str(r.check) ?? "check",
      due,
      outcome,
      status: checkStatus(outcome, due, today),
    });
  }
  if (!rows.length) return null;
  rows.sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));
  const counts = Object.fromEntries(ORDER.map((s) => [s, 0])) as Record<CheckStatus, number>;
  for (const r of rows) counts[r.status] += 1;
  return { rows, counts, runAt: str(cm?.run_at), today, source: "/api/state → ledgers.claim_maintenance.checks" };
}

/** "3 overdue · 6 not yet due · 1 source changed · 1 source not read": non-zero counts only, in a fixed order. */
export function countsLine(r: ClaimChecksRead): string {
  return ORDER.filter((s) => r.counts[s] > 0)
    .map((s) => `${r.counts[s]} ${STATUS_WORDS[s]}`)
    .join(" · ");
}

/** The status chip: the most urgent state present, in words. The numbers are said once, in countsLine. */
export function chipOf(r: ClaimChecksRead): { text: string; tone: "warn" | "ok" } {
  if (r.counts.overdue) return { text: "Behind schedule", tone: "warn" };
  if (r.counts.not_read) return { text: "A source was not read", tone: "warn" };
  return { text: "On schedule", tone: "ok" };
}

/** "29 Sep 2026" from an ISO date-time; the input unchanged when it is not a date. */
export function dayLabel(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** "hiring-platforms-2026-09-24-rev2" -> "hiring platforms": the register's name without its date and revision. */
export function registryWords(slug: string): string {
  const w = slug.replace(/^claimreg-/, "").replace(/-\d{4}-\d{2}-\d{2}(-rev\d+)?$/, "").replace(/-/g, " ").trim();
  return (w || slug).replace(/\bai\b/g, "AI");
}

/** "day-30" -> "day-30 re-read", "scheduled-read" -> "scheduled re-read". */
export function checkWords(check: string): string {
  if (/^day-\d+$/.test(check)) return `${check} re-read`;
  if (check === "scheduled-read") return "scheduled re-read";
  return check.replace(/-/g, " ");
}
