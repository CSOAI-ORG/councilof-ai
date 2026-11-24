/**
 * controlRoomHeadlines — the ten headline numbers of the /status control-room strip.
 *
 * Every tile carries a value, a unit, an as_of with its basis, and the address it was read from.
 * A source that failed produces no tile; it is listed in `failed` (and again in the page footer).
 * No failed read is drawn as zero. Where no public file states a value, the tile says "unverified".
 */
import type { Read } from "./statusReads";

export type Tile = {
  id: string;
  label: string;
  value: string;
  unit: string;
  asOf: string;
  /** "stated" = the source's own date; "read" = the time this page read it (the source states none). */
  asOfBasis: "stated" | "read";
  source: string;
  note?: string;
};
export type Failed = { source: string; error: string; readAt: string };

export type Reads = {
  gspc: Read<{ totals?: Record<string, unknown> }>;
  revenue: Read<{ one_number?: Record<string, unknown> & { repeat_nonself_payers?: Record<string, unknown> } }>;
  worker: Read<{ status?: unknown }>;
  capsule: Read<{ index_date?: unknown; as_of?: unknown }>;
  watchdog: Read<{ as_of?: unknown; sources_probed?: unknown; reachable?: unknown }>;
  pulls: Read<{ total_count?: unknown }>;
};

export const SRC = {
  gspc: "/api/gspc",
  revenue: "/api/revenue",
  worker: "/api/worker",
  capsule: "/measurement-capsules/latest.json",
  watchdog: "/interop/watchdog-intake/latest.json",
  pulls: "https://api.github.com/search/issues?q=repo:CSOAI-ORG/councilof-ai+is:pr+is:open&per_page=1",
} as const;

const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

/** USDC atomic units (6 decimals) as a decimal string with exactly two places, truncated, never rounded up. */
export function usdcFromAtomic(atomic: number): string | null {
  if (!Number.isInteger(atomic) || atomic < 0) return null;
  const cents = Math.floor(atomic / 10000);
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

export function headlineTiles(r: Reads): { tiles: Tile[]; failed: Failed[] } {
  const tiles: Tile[] = [];
  const failed: Failed[] = [];
  const miss = (source: string, x: Read<unknown>, why?: string) =>
    failed.push({ source, error: x.ok ? why ?? "answered, but without the field this tile reads" : x.error, readAt: x.readAt });

  const g = r.gspc;
  const t = g.ok ? g.body.totals : undefined;
  if (g.ok && t && isNum(t.measured_axes)) {
    tiles.push({ id: "axes", label: "Axes measured", value: String(t.measured_axes), unit: isNum(t.axes) ? `axes of ${t.axes} on the board` : "axes", asOf: g.readAt, asOfBasis: "read", source: SRC.gspc });
  } else miss(SRC.gspc, g);
  if (g.ok && t && isNum(t.comparison_axes) && isNum(t.separated_leads) && isNum(t.ties) && isNum(t.untested_separations)) {
    tiles.push({
      id: "comparisons",
      label: "Model comparisons",
      value: `${t.separated_leads} separated · ${t.ties} TIE · ${t.untested_separations} UNTESTED`,
      unit: `of ${t.comparison_axes} model-comparison axes`,
      asOf: g.readAt,
      asOfBasis: "read",
      source: SRC.gspc,
      note: "TIE is TIE. UNTESTED is not a tie.",
    });
  }
  // No public file states which hosted models answered the last pulse.
  tiles.push({ id: "hosted", label: "Hosted models that answered the last pulse", value: "unverified", unit: "models", asOf: "not stated by any public file", asOfBasis: "stated", source: "none", note: "No public file states this, so no number is shown." });

  const c = r.capsule;
  if (c.ok && typeof c.body.index_date === "string") {
    tiles.push({ id: "capsule", label: "Newest capsule index", value: c.body.index_date, unit: "date of the index", asOf: typeof c.body.as_of === "string" ? c.body.as_of : c.readAt, asOfBasis: typeof c.body.as_of === "string" ? "stated" : "read", source: SRC.capsule });
  } else miss(SRC.capsule, c);

  const w = r.watchdog;
  if (w.ok && isNum(w.body.reachable) && isNum(w.body.sources_probed)) {
    tiles.push({ id: "watchdog", label: "Watchdog sources reachable", value: `${w.body.reachable} of ${w.body.sources_probed}`, unit: "sources probed in the latest run", asOf: typeof w.body.as_of === "string" ? w.body.as_of : w.readAt, asOfBasis: typeof w.body.as_of === "string" ? "stated" : "read", source: SRC.watchdog });
  } else miss(SRC.watchdog, w);

  const rev = r.revenue;
  const one = rev.ok ? rev.body.one_number : undefined;
  const rep = one?.repeat_nonself_payers;
  if (rev.ok && one && isNum(one.last_30d)) {
    tiles.push({ id: "payers", label: "Distinct outside payers", value: String(one.last_30d), unit: "wallets, last 30 days", asOf: rev.readAt, asOfBasis: "read", source: SRC.revenue, note: "Excludes our own wallets and zero-value settlements." });
  } else miss(SRC.revenue, rev);
  if (rev.ok && rep && isNum(rep.last_30d)) {
    tiles.push({ id: "repeat", label: "Repeat outside payers", value: String(rep.last_30d), unit: "wallets, last 30 days", asOf: rev.readAt, asOfBasis: "read", source: SRC.revenue, note: "A repeated wallet alone does not prove an independent customer." });
  }
  const usdc = rev.ok && one && isNum(one.settled_usdc_atomic) ? usdcFromAtomic(one.settled_usdc_atomic) : null;
  if (usdc !== null) {
    tiles.push({ id: "settled", label: "Settled revenue", value: usdc, unit: "USDC, all time, outside payers only", asOf: rev.readAt, asOfBasis: "read", source: SRC.revenue });
  }

  const wk = r.worker;
  if (wk.ok && typeof wk.body.status === "string") {
    tiles.push({ id: "worker", label: "Worker status", value: wk.body.status, unit: "state of the compute worker", asOf: wk.readAt, asOfBasis: "read", source: SRC.worker });
  } else miss(SRC.worker, wk);

  const p = r.pulls;
  if (p.ok && isNum(p.body.total_count)) {
    tiles.push({ id: "pulls", label: "Open pull requests", value: String(p.body.total_count), unit: "pull requests", asOf: p.readAt, asOfBasis: "read", source: SRC.pulls });
  } else miss(SRC.pulls, p);

  return { tiles, failed };
}
