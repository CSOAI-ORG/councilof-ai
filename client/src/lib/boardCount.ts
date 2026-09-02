/**
 * boardCount — the ONE place any surface gets the GSPC board's axis count.
 *
 * ADR-001 (council-os/ADR-001-axis-count.md) rules: "No surface should type a
 * count." The count is DERIVED from the signed board data, because a public
 * number must be backed by the signed artifact it claims to summarise. Hand
 * typing produced 12, 13, 14, 15, 16, 17 and 22 simultaneously across the site.
 *
 * ── THE GRAMMAR RULE (the one that matters most) ─────────────────────────────
 * TWO numbers, and they always travel together.
 *   `axis`          counts SLOTS on the board.
 *   `measured_axes` counts slots with a real run behind them.
 * Quoting the larger number alone would claim measurements that do not exist.
 * That is why nothing here exposes a lone "how many axis" integer for copy:
 * render `public_count` (the short sentence) or `count_grammar` (the long one).
 * `axis` and `measured_axes` are exported for arithmetic and gates, not prose.
 *
 * ── PROVENANCE ───────────────────────────────────────────────────────────────
 * Authority:  GET /api/gspc -> totals.{axes,measured_axes,unmeasured_axes,
 *             public_count,count_grammar}, all computed from the axis array in
 *             functions/api/gspc.ts and covered by the board signature.
 * Fallback:   client/src/data/facts.json -> counts.axis_count.observed. That
 *             block is a RECORDED OBSERVATION of the endpoint, carrying its own
 *             observed_at date and its own "if this disagrees with the endpoint,
 *             the ENDPOINT wins" note. It exists so a surface that has not yet
 *             received the fetch renders the last observed state instead of a
 *             zero — and so this file itself types no number.
 *
 * A surface using the fallback is marked `live: false`. Say so if you show it.
 */
import { useEffect, useState } from "react";
// Relative, not "@/data/facts.json": vitest.config.ts declares no path aliases, so
// an aliased import here breaks every test that transitively reaches this module.
import facts from "../data/facts.json";

/**
 * Separation over the MODEL-COMPARISON axis only. A separation test asks whether
 * a leader's lead over a fleet is statistically real, so it does not apply to an
 * axis with no fleet — which is why `comparison_axes` is smaller than `axis` and
 * must never be quoted as the board's size. A TIE is not a win.
 */
export interface SeparationCount {
  comparison_axes: number;
  separated: number;
  ties: number;
  untested: number;
  /** Render-ready, and never a bare "N of M win" claim. */
  sentence: string;
}

/** One family's own size. Same grammar rule: both numbers, or the smaller one. */
export interface FamilyCount {
  axes: number;
  measured: number;
  /** e.g. "14 axis · 13 measured" — the family's own sentence. */
  sentence: string;
}

export interface BoardCount {
  /** Slots on the board. NOT a count of measurements. */
  axes: number;
  /** Slots with a measured run behind them. */
  measured_axes: number;
  /** Slots published so the gap is visible, with no run behind them. */
  unmeasured_axes: number;
  /** The short sentence a surface quotes, e.g. "22 axis · 22 measured". */
  public_count: string;
  /** Carded external public leaders only (BLUEPRINT A1). Not equal to measured_axes. */
  public_leader_count: number | null;
  /** Full lid sentence from GET /api/gspc totals.lid when present. */
  lid: string | null;
  /** The long sentence that explains why both numbers are printed. */
  count_grammar: string;
  /** The behavioural (GSPC) half, when the board publishes the breakdown. */
  gspc_family: FamilyCount | null;
  /** The financial/domain half, when the board publishes the breakdown. */
  financial_family: FamilyCount | null;
  /** Separation over the model-comparison axis, when the board publishes it. */
  separation: SeparationCount | null;
  /** true when these numbers came off the live board; false for the recorded observation. */
  live: boolean;
}

/** Format the count as a sentence. Never emit one of these numbers on its own. */
export function publicCountSentence(axes: number, measured: number): string {
  return `${axes} axis · ${measured} measured`;
}

function grammarSentence(axes: number, measured: number, unmeasured: number): string {
  return (
    `${axes} axis are on the board; ${measured} of them carry a measurement and ${unmeasured} are ` +
    `declared slots with no run behind them. The larger number counts slots, the smaller counts ` +
    `measurements — quote both or quote the smaller.`
  );
}

const observed = (facts as any)?.counts?.axis_count?.observed ?? {};

/**
 * The last recorded observation of the board, read out of the facts ledger.
 * Not an authority: `live` is false and the endpoint always wins.
 */
export const BOARD_COUNT_OBSERVED: BoardCount = {
  axes: Number(observed.axes) || 0,
  measured_axes: Number(observed.measured_axes) || 0,
  unmeasured_axes: Number(observed.unmeasured_axes) || 0,
  public_count:
    typeof observed.value === "string" && observed.value.trim()
      ? observed.value
      : publicCountSentence(Number(observed.axes) || 0, Number(observed.measured_axes) || 0),
  public_leader_count: null,
  lid: null,
  count_grammar: grammarSentence(
    Number(observed.axes) || 0,
    Number(observed.measured_axes) || 0,
    Number(observed.unmeasured_axes) || 0,
  ),
  // The facts ledger records the board TOTAL, not the per-family split. A surface
  // that needs the split gets it from the live board or shows nothing — it is not
  // reconstructed here, because a reconstructed breakdown is a typed one.
  gspc_family: null,
  financial_family: null,
  // Likewise not recorded in the facts ledger. A surface shows no separation
  // figures at all until the live board supplies them — a stale "3 of 13" is
  // worse than no number, because a reader cannot tell it is stale.
  separation: null,
  live: false,
};

function familyFrom(raw: any): FamilyCount | null {
  if (!raw || typeof raw.axes !== "number" || typeof raw.measured !== "number") return null;
  return {
    axes: raw.axes,
    measured: raw.measured,
    sentence: publicCountSentence(raw.axes, raw.measured),
  };
}

/**
 * Read a BoardCount out of a /api/gspc payload (or the signed board snapshot,
 * which carries the same `totals` shape). Returns null if the payload does not
 * actually carry the counts — a surface must then fall back, never invent.
 */
export function boardCountFromPayload(payload: any): BoardCount | null {
  const t = payload?.totals;
  if (!t || typeof t.axes !== "number" || typeof t.measured_axes !== "number") return null;
  const unmeasured =
    typeof t.unmeasured_axes === "number" ? t.unmeasured_axes : t.axes - t.measured_axes;
  return {
    axes: t.axes,
    measured_axes: t.measured_axes,
    unmeasured_axes: unmeasured,
    public_count:
      typeof t.public_count === "string" && t.public_count.trim()
        ? t.public_count
        : publicCountSentence(t.axes, t.measured_axes),
    public_leader_count:
      typeof t.public_leader_count === "number" ? t.public_leader_count : null,
    lid: typeof t.lid === "string" && t.lid.trim() ? t.lid.trim() : null,
    count_grammar:
      typeof t.count_grammar === "string" && t.count_grammar.trim()
        ? t.count_grammar
        : grammarSentence(t.axes, t.measured_axes, unmeasured),
    gspc_family: familyFrom(t.by_family?.gspc),
    financial_family: familyFrom(t.by_family?.financial),
    separation: separationFrom(t),
    live: true,
  };
}

function separationFrom(t: any): SeparationCount | null {
  if (typeof t?.comparison_axes !== "number" || typeof t?.separated_leads !== "number") return null;
  const comparison_axes = t.comparison_axes;
  const separated = t.separated_leads;
  const ties = typeof t.ties === "number" ? t.ties : 0;
  const untested = typeof t.untested_separations === "number" ? t.untested_separations : 0;
  return {
    comparison_axes,
    separated,
    ties,
    untested,
    sentence:
      `${separated} of the ${comparison_axes} model-comparison axis show a statistically separated ` +
      `leader (McNemar p<0.05 on discordant items); ${ties} are honest ties and ${untested} are ` +
      `untested. A point-estimate lead on a tied axis is not a measured advantage, and a tie is ` +
      `never counted as a win. This denominator is the model-comparison axis only — it is not the ` +
      `board's size.`,
  };
}

/**
 * useBoardCount — fetch the live board once and derive the count from it.
 * Renders the recorded observation until the fetch lands, and keeps it if the
 * fetch fails: a stale-but-dated number beats a fabricated one, and `live`
 * tells the caller which it is holding.
 */
export function useBoardCount(): BoardCount {
  const [count, setCount] = useState<BoardCount>(BOARD_COUNT_OBSERVED);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/gspc", { signal: ac.signal, headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => {
        const derived = boardCountFromPayload(d);
        if (derived) setCount(derived);
      })
      .catch(() => {
        /* keep the recorded observation; never invent a number */
      });
    return () => ac.abort();
  }, []);

  return count;
}
