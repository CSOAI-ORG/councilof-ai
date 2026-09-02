import type { AxisScore } from "./_gspc_types";

export interface BoardCounts {
  axes: number;
  measured_axes: number;
  unmeasured_axes: number;
  public_count: string;
  count_grammar: string;
  by_family: {
    gspc: { axes: number; measured: number; note: string };
    financial: { axes: number; measured: number; note: string };
  };
}

/**
 * The one counter used by both GET /api/gspc and GET /api/state.
 *
 * Counts are derived from axis rows. A slot is not silently promoted to a
 * measurement, and a deterministic-facts row is not silently called a score.
 */
export function deriveBoardCounts(axes: readonly AxisScore[]): BoardCounts {
  const measured = axes.filter((axis) => axis.status === "MEASURED").length;
  const unmeasured = axes.length - measured;
  const byFamily = (family: AxisScore["family"]) => {
    const rows = axes.filter((axis) => axis.family === family);
    return {
      axes: rows.length,
      measured: rows.filter((axis) => axis.status === "MEASURED").length,
    };
  };

  return {
    axes: axes.length,
    measured_axes: measured,
    unmeasured_axes: unmeasured,
    public_count: `${axes.length} axis · ${measured} measured`,
    count_grammar:
      unmeasured === 0
        ? `${axes.length} axis are on the board and every one carries a measurement — no ` +
          `declared slot is empty. Both counts are DERIVED from the axis array, never typed; if a ` +
          `future slot is added with no run behind it, this line separates the two again on its own.`
        : `${axes.length} axis are on the board; ${measured} of them carry a measurement and ` +
          `${unmeasured} are declared slots with no run behind them. The larger number counts slots, ` +
          `the smaller counts measurements — quote both or quote the smaller. A published slot exists ` +
          `so the gap is visible; it is not evidence of anything having been measured.`,
    by_family: {
      gspc: {
        ...byFamily("gspc"),
        note: "The 14 behavioural axes: a model fleet answers a frozen bank, graded deterministically.",
      },
      financial: {
        ...byFamily("financial"),
        note:
          "The 8 financial/domain axis (ADR-001), all MEASURED as deterministic-facts runs — " +
          "issuer-account flags read off the public ledger (financial n=16 on the live XRPL " +
          "reader; provenance-controls n=6) and public statistical series, graded by rule with no " +
          "model, no fleet and no judgement. None of the eight is a model comparison, so none has " +
          "a leader, an accuracy or a separation determination, and none contributes to any mean " +
          "below — measured is not the same as scored. The two former index slots are measured as " +
          "component facts (ai-adoption-components, labour-components), never restored to the " +
          "retired MEASURED-INDEX-v0.1 sticker (C-2026-0826-05).",
      },
    },
  };
}
