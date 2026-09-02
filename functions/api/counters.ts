/**
 * GET /api/counters — Wave-1 public-utility counters (EXP 005), derived from artifacts.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT CHANGED (2026-08-26) — TWO DEFECTS, BOTH ABOUT ASSERTED FRESHNESS
 *
 * 1. THE SERVE-TIME TIMESTAMP.
 *    This handler used to close its payload with
 *      generated: new Date().toISOString()
 *    Two real requests four seconds apart against `wrangler pages dev` returned
 *    2026-08-26T14:11:26.486Z and 2026-08-26T14:11:30.739Z. The field was not
 *    reporting when anything was counted; it was following the clock. Published
 *    beside counts labelled "LIVE", it asserted a freshness that never happened —
 *    the same defect /api/mcp carried with `last_checked` (11:43:53.111Z then
 *    11:43:56.233Z, three seconds apart, on servers nothing had ever contacted).
 *    There is now no `new Date()` in this file. Every `as_of` is read OUT OF the
 *    artifact it describes, and `as_of_field` names the exact key it was read
 *    from, so a stranger can open the file and check.
 *
 * 2. THE REQUEST-TIME SIBLING FETCH.
 *    The counts were built by fetching /api/gspc and /api/axis-register over HTTP
 *    from inside this handler. That made an aggregate surface report its siblings'
 *    availability rather than its own counts: a cold start, a redeploy or a 500
 *    next door silently turned a real count into `null` → UNPUBLISHED, and nothing
 *    in the payload distinguished "we have never measured this" from "the fetch
 *    failed just now". Both counters now derive from the same committed modules
 *    those endpoints derive from, in-process. Nothing is fetched to serve this.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * "LIVE" IS GONE AS A STATUS, TOO.
 * A number read out of a committed artifact is not live, and calling it live was
 * half of what made the serve-time stamp believable. Status is now PUBLISHED or
 * UNPUBLISHED, and `kind` carries HOW the number was obtained — never collapsed:
 *   measured   — a run happened against a frozen bank and was graded.
 *   declared   — a slot published so a gap is visible. No run behind it.
 *   catalogued — listed in a register. Nothing was contacted, nothing was run.
 *   unmeasured — it exists, we have NOT measured it, and we say so.
 * A declared slot is not a measurement; summing across kinds is how 15 measured
 * axes would become 22. Never add these together.
 *
 * UNPUBLISHED counters stay exactly as they were, and that part was always honest:
 * there is no counter behind verify-page executions or watch-desk reads anywhere in
 * this repo, so any number here would be invented. Null is the whole answer.
 *
 * Doctrine: council-os/QUOTING-NUMBERS.md. Aggregate authority: /api/state.
 * This endpoint has no state of its own — edit the artifact, commit, deploy.
 */

import boardSigned from "../../public/signed/gspc-board.signed.json";
import type { AxisScore } from "./_gspc_types";
import { AXES_A } from "./_gspc_axes_a";
import { AXES_B } from "./_gspc_axes_b";
import { AXES_FIN } from "./_gspc_axes_fin";
import { AXES as REGISTER_ROWS, AXIS_REGISTER_SOURCE } from "./_axis_register";
import { deriveBoardCounts } from "./_boardCounts";

/** How a number was obtained. Never inferred from the value, never collapsed. */
type Kind = "measured" | "declared" | "catalogued" | "unmeasured";

interface Counter {
  id: string;
  name: string;
  /** The number, or null. Null is never replaced with a plausible-looking value. */
  count: number | null;
  kind: Kind;
  status: "PUBLISHED" | "UNPUBLISHED";
  /** The committed file the count was derived from, or null when there is none. */
  source: string | null;
  /** A timestamp read OUT OF that artifact. Null when the artifact carries none. */
  as_of: string | null;
  /** The exact key inside the artifact `as_of` came from. Null with as_of. */
  as_of_field: string | null;
  note: string;
}

const counter = (
  id: string,
  name: string,
  count: number | null,
  kind: Kind,
  source: string | null,
  as_of: string | null,
  as_of_field: string | null,
  note: string,
): Counter => ({
  id,
  name,
  count,
  kind,
  status: count != null ? "PUBLISHED" : "UNPUBLISHED",
  source,
  as_of,
  as_of_field,
  note,
});

// ── sources, named once ──────────────────────────────────────────────────────
const SRC_BOARD = "public/signed/gspc-board.signed.json";
const SRC_AXES = "functions/api/_gspc_axes_{a,b,fin}.ts (the arrays /api/gspc derives from)";

// ── the board's own date-of-record ───────────────────────────────────────────
// This artifact carries no ISO instant. Its honest date-of-record is the measurement
// stamp it was signed over, so that string is quoted VERBATIM rather than parsed into
// something that would look more precise than it is.
const boardTotals = (boardSigned as any).totals ?? {};
const boardMeasuredOn: string | null = (boardSigned as any).measured_on?.date ?? null;

// ── live derivation, so snapshot drift is published rather than inherited ────
// /api/gspc computes its totals from these arrays at request time; the signed file is
// a snapshot of that computation. Both are computed here and compared, so that if they
// ever disagree the disagreement is visible instead of depending on which surface a
// reader happened to open.
const LIVE_AXES: AxisScore[] = [...AXES_A, ...AXES_B, ...AXES_FIN];
const liveBoard = deriveBoardCounts(LIVE_AXES);
const liveAxisSlots = liveBoard.axes;
const liveMeasuredAxes = liveBoard.measured_axes;
const boardAgrees =
  boardTotals.axes === liveAxisSlots &&
  boardTotals.measured_axes === liveMeasuredAxes &&
  boardTotals.unmeasured_axes === liveBoard.unmeasured_axes;

const COUNTERS: Counter[] = [
  counter(
    "gspc_measured_axes",
    "GSPC measured axes",
    liveMeasuredAxes,
    "measured",
    SRC_AXES + " → deriveBoardCounts(axes).measured_axes",
    boardMeasuredOn,
    "measured_on.date",
    "Board slots with a real graded run behind them. This is the number to quote if you " +
      "quote only one. as_of is the signed board's measurement stamp, verbatim — it is a " +
      "date of record, not an instant, and not when this response was served.",
  ),
  counter(
    "gspc_axis_slots",
    "GSPC axis slots (declared, not measured)",
    liveAxisSlots,
    "declared",
    SRC_AXES + " → deriveBoardCounts(axes).axes",
    boardMeasuredOn,
    "measured_on.date",
    "A count of SLOTS. A slot is published so a gap is visible; it is not evidence that " +
      "anything was measured. Never quote this number alone — quote it beside " +
      "gspc_measured_axes, or quote /api/gspc totals.public_count, which carries both.",
  ),
  counter(
    "axis_register_rows",
    "Axis register rows (canonical scored rows)",
    REGISTER_ROWS.length,
    "catalogued",
    AXIS_REGISTER_SOURCE + ".length",
    null,
    null,
    "Rows bundled in the register that /api/axis-register serves, counted from the array. " +
      "This module carries NO timestamp of any kind, so as_of and as_of_field are both null. " +
      "The board's measurement date is a neighbouring source's date, not this one's, and the " +
      "deploy time is nobody's measurement time. Unknown stays null. NOTE: register rows are " +
      "not board slots and the two are never added — see counting_rule on /api/axis-register.",
  ),
  counter(
    "verify_page_executions",
    "Verify-page executions (free, zero-auth)",
    null,
    "unmeasured",
    null,
    null,
    null,
    "No counter exists behind this anywhere in this repo, so any number would be invented. " +
      "Verification is free, zero-auth and unlogged by design; counting it would mean " +
      "instrumenting it. UNPUBLISHED is the honest answer and it is the whole answer.",
  ),
  counter(
    "watch_desk_reads",
    "Watch-desk reads",
    null,
    "unmeasured",
    null,
    null,
    null,
    "Not measured and not published. No telemetry and no per-user data is collected on this " +
      "surface, so there is nothing to count. UNPUBLISHED, not zero — zero would be a claim.",
  ),
];

export const onRequestGet: PagesFunction = async () => {
  const body = {
    schema: "csoai.wave1-counters/0.2",
    wave: 1,

    contract: {
      derivation:
        "Every count below is derived from a committed artifact in THIS repo, in-process. " +
        "Nothing is fetched to serve this response and no count is typed by hand.",
      freshness:
        "There is no new Date() in this endpoint. as_of is read OUT OF the artifact and " +
        "as_of_field names the key it came from. Two calls any interval apart return a " +
        "byte-identical payload; if they ever differ, this endpoint has the defect it was " +
        "rebuilt to remove.",
      freshness_self_test:
        "curl -s http://localhost:8799/api/counters | jq -S '[.counters[]|{id,as_of_field,as_of}]' > /tmp/a; sleep 5; " +
        "curl -s http://localhost:8799/api/counters | jq -S '[.counters[]|{id,as_of_field,as_of}]' > /tmp/b; diff /tmp/a /tmp/b && echo IDENTICAL",
      freshness_self_test_warning:
        "Confirm as_of is PRESENT and non-null on at least one counter before trusting that " +
        "diff. A check that reads a field which does not exist compares null to null and " +
        "passes for every input, forever. This repo has shipped that defect twice.",
      kinds: {
        measured: "A run happened against a frozen bank or source and was graded.",
        declared: "A slot published so a gap is visible. No run behind it.",
        catalogued: "Listed in a register. Nothing was contacted and nothing was run.",
        unmeasured: "It exists and we have not measured it — stated, not implied.",
      },
      never_sum:
        "Kinds are never added together. A declared slot is not a measurement and a register " +
        "row is not a board slot.",
      unpublished_rule:
        "UNPUBLISHED means no source exists, not that a fetch failed. Null is never replaced " +
        "with zero, with a plausible-looking value, or with a figure from another estate.",
      aggregate_authority:
        "/api/state is the one surface a lane quotes for a count. This endpoint is a Wave-1 " +
        "public-utility subset of it and must agree with it by construction — both derive " +
        "from the same committed artifacts. Doctrine: council-os/QUOTING-NUMBERS.md.",
    },

    counters: COUNTERS,

    board_crosscheck: {
      note:
        "The axis counters above are derived live from the axis arrays; the signed board is a " +
        "snapshot of that same computation. Both are computed and compared here so drift is " +
        "published rather than silently inherited by whichever surface a reader opened.",
      live_source: SRC_AXES,
      signed_source: SRC_BOARD,
      live_axis_slots: liveAxisSlots,
      live_measured_axes: liveMeasuredAxes,
      live_unmeasured_axes: liveBoard.unmeasured_axes,
      signed_axis_slots: boardTotals.axes ?? null,
      signed_measured_axes: boardTotals.measured_axes ?? null,
      signed_unmeasured_axes: boardTotals.unmeasured_axes ?? null,
      signed_snapshot_agrees: boardAgrees,
      on_disagreement:
        "If signed_snapshot_agrees is false, quote the living authority exposed by /api/gspc and " +
        "/api/state; retain the signed snapshot as stale custody history until it is re-derived " +
        "and re-signed. Do not silently present historical counters as current.",
    },

    note:
      "Aggregate-only. NO telemetry, NO per-user data, NO fabricated counts. Measurement, " +
      "not a ranking, and never a certification.",
  };

  return new Response(JSON.stringify(body, null, 1), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // The payload is deterministic for a given deploy, so a cache cannot make it stale
      // in the way a serve-time stamp could. The old `no-store` existed to keep a
      // clock-following field fresh; there is no such field left to keep fresh.
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
};
