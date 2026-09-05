/**
 * homeGspcTableReaders — the DOM-free readers behind the home-page GSPC table.
 *
 * EVERY VALUE IS READ OFF GET /api/gspc AT RENDER TIME. Nothing in this file
 * types a count, a model name, a status word or a lid sentence. Where the
 * payload does not carry a field the reader returns null (or a labelled
 * absence) and the surface prints that absence in words — never a zero, never
 * a placeholder name, never a padded row.
 *
 * The status / separation / public_leader_state words are printed VERBATIM as
 * the API serves them (state_enum on the payload is the vocabulary). A TIE is a
 * TIE. A withheld leader is a state, not an empty cell.
 */
// Named *Readers so "./HomeGspcTable" can never resolve here on a case-insensitive
// filesystem (vite tries .ts before .tsx; APFS matched homeGspcTable.ts for it).
import type { GspcAxis, GspcPayload, GspcTotals } from "../board/useGspcBoard";

/* ── the lid and the count, verbatim ─────────────────────────────────────── */

/** totals.lid, verbatim. Null when the board does not publish one — never derived here. */
export function lidOf(data: GspcPayload | null | undefined): string | null {
  const lid = data?.totals?.lid;
  return typeof lid === "string" && lid.trim() ? lid.trim() : null;
}

/** totals.public_count, verbatim. Null rather than a guess. */
export function publicCountOf(data: GspcPayload | null | undefined): string | null {
  const c = data?.totals?.public_count;
  return typeof c === "string" && c.trim() ? c.trim() : null;
}

/** The sentence the surface prints when the board cannot be read. Absent is not zero. */
export function unreadLine(error: string | null | undefined): string {
  const why = error && error.trim() ? error.trim() : "no response";
  return `unread — GET /api/gspc did not answer (${why}). No figure on this page stands in for the board.`;
}

/* ── one row ─────────────────────────────────────────────────────────────── */

/** status, verbatim. The payload's own rule: absence of a field means UNMEASURED. */
export function statusText(a: GspcAxis): string {
  return typeof a.status === "string" && a.status.trim() ? a.status.trim() : "UNMEASURED";
}

/** family, verbatim ("gspc" / "financial"). */
export function familyText(a: GspcAxis): string {
  return typeof a.family === "string" && a.family.trim() ? a.family.trim() : "—";
}

/** n as served, or a labelled absence. Never 0 for an absent n. */
export function nText(a: GspcAxis): string {
  if (typeof a.n !== "number" || !Number.isFinite(a.n)) return "no n published";
  // "issuer accounts (not bank items)" → "issuer accounts": the unit, without its parenthetical.
  const unit = typeof a.n_unit === "string" && a.n_unit.trim() ? ` ${a.n_unit.split(" (")[0].trim()}` : "";
  return `${a.n}${unit}`;
}

/**
 * separation, verbatim, for a model-comparison axis. A deterministic-facts axis
 * has no fleet, so no test applies — that is a different fact from UNTESTED.
 */
export function separationText(a: GspcAxis): string {
  if (a.kind === "deterministic-facts") return "no fleet · not applicable";
  return typeof a.separation === "string" && a.separation.trim() ? a.separation.trim() : "not published";
}

export type LeaderCell =
  | { kind: "public"; model: string; accuracy: number | null; interval: [number, number] | null; separation: string }
  | { kind: "withheld"; state: string }
  | { kind: "facts" }
  | { kind: "none" };

/** The only place a leader is decided. Reads the wire; invents no name. */
export function leaderCell(a: GspcAxis): LeaderCell {
  if (a.kind === "deterministic-facts") return { kind: "facts" };
  if (typeof a.public_leader_state === "string" && a.public_leader_state.trim()) {
    return { kind: "withheld", state: a.public_leader_state.trim() };
  }
  if (typeof a.leader === "string" && a.leader.trim()) {
    return {
      kind: "public",
      model: a.leader.trim(),
      accuracy: typeof a.accuracy === "number" && Number.isFinite(a.accuracy) ? a.accuracy : null,
      interval: Array.isArray(a.interval) && a.interval.length === 2 ? [Number(a.interval[0]), Number(a.interval[1])] : null,
      separation: separationText(a),
    };
  }
  return { kind: "none" };
}

/** Human words for a withheld state, keyed on the verbatim enum. Unknown states print as served. */
export function withheldWords(state: string): string {
  if (state === "EXCLUDED_OWN_MODEL") return "withheld — our own model led; a neutral body does not rank itself";
  if (state === "NO_SIGNED_CARD") return "withheld — no signed card behind the named leader";
  return `withheld — ${state}`;
}

export function fmtPct(v: number | null | undefined): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "";
  const p = Math.round(v * 1000) / 10;
  return `${Number.isInteger(p) ? p.toFixed(0) : p.toFixed(1)}%`;
}

/* ── the tally under the table: derived from the rows, at render time ────── */

export interface Tally {
  rows: number;
  byStatus: Record<string, number>;
  byFamily: Record<string, number>;
  comparison: number;
  facts: number;
  publicLeaders: number;
  withheld: Record<string, number>;
  noLeader: number;
}

export function tally(axes: GspcAxis[]): Tally {
  const t: Tally = { rows: axes.length, byStatus: {}, byFamily: {}, comparison: 0, facts: 0, publicLeaders: 0, withheld: {}, noLeader: 0 };
  for (const a of axes) {
    const s = statusText(a);
    t.byStatus[s] = (t.byStatus[s] ?? 0) + 1;
    const f = familyText(a);
    t.byFamily[f] = (t.byFamily[f] ?? 0) + 1;
    const cell = leaderCell(a);
    if (cell.kind === "facts") t.facts += 1;
    else t.comparison += 1;
    if (cell.kind === "public") t.publicLeaders += 1;
    else if (cell.kind === "withheld") t.withheld[cell.state] = (t.withheld[cell.state] ?? 0) + 1;
    else if (cell.kind === "none") t.noLeader += 1;
  }
  return t;
}

/** "22 rows · 22 MEASURED · gspc 14 · financial 8" — counted from the rows on screen. */
export function tallyLine(t: Tally): string {
  const status = Object.entries(t.byStatus).map(([k, v]) => `${v} ${k}`).join(" · ");
  const family = Object.entries(t.byFamily).map(([k, v]) => `${k} ${v}`).join(" · ");
  return `${t.rows} rows on this table · ${status || "no status served"} · ${family || "no family served"}`;
}

/* ── the models block: public leader scores only ─────────────────────────── */

export interface PublicLeader {
  model: string;
  axis: string;
  accuracy: number | null;
  interval: [number, number] | null;
  separation: string;
  n: number | null;
  datasetUrl: string | null;
}

/**
 * Every model-comparison axis whose leader the board publishes — and nothing
 * else. Own-model exclusions and uncarded leaders are states, not entries.
 * Ordered by point estimate on each model's OWN axis: that is layout, not a
 * cross-axis rank, because each figure is on its own frozen bank.
 */
export function publicLeaders(axes: GspcAxis[]): PublicLeader[] {
  const out: PublicLeader[] = [];
  for (const a of axes) {
    const cell = leaderCell(a);
    if (cell.kind !== "public") continue;
    out.push({
      model: cell.model,
      axis: a.axis,
      accuracy: cell.accuracy,
      interval: cell.interval,
      separation: cell.separation,
      n: typeof a.n === "number" && Number.isFinite(a.n) ? a.n : null,
      datasetUrl: typeof a.dataset_url === "string" && a.dataset_url ? a.dataset_url : null,
    });
  }
  return out.sort((x, y) => (y.accuracy ?? -1) - (x.accuracy ?? -1));
}

/**
 * The honest line under the models block. Every number is counted from the
 * rows; the board's own totals.public_leader_count is quoted beside it, and a
 * disagreement is printed rather than reconciled.
 */
export function leadersNote(t: Tally, totals: GspcTotals | null | undefined): string {
  const parts: string[] = [];
  parts.push(`${t.publicLeaders} public leader score${t.publicLeaders === 1 ? "" : "s"} on the board today, counted from the rows above`);
  const boardSays = totals?.public_leader_count;
  if (typeof boardSays === "number") {
    parts.push(boardSays === t.publicLeaders ? `the board's own count agrees (${boardSays})` : `the board's own count says ${boardSays} — shown as served, not reconciled`);
  }
  const withheld = Object.entries(t.withheld).map(([state, n]) => `${n} ${state}`);
  if (withheld.length) parts.push(`${t.comparison - t.publicLeaders - t.noLeader} model-comparison axes withhold their leader (${withheld.join(", ")})`);
  if (t.noLeader) parts.push(`${t.noLeader} publish no leader`);
  if (t.facts) parts.push(`${t.facts} fact runs have no fleet and no leader`);
  parts.push("nothing is padded and a TIE is not a win");
  return parts.join(" · ") + ".";
}
