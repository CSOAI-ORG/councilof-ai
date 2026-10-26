/**
 * GET /api/reports — the public report index, derived from the live board.
 *
 * This endpoint AUTO-UPDATES: the board counts and the separation state are computed from the same
 * modules GET /api/gspc composes, at request time, so this index cannot fall out of step with the
 * board. A report that has gone stale quietly is worse than no report.
 *
 * It asserts no measurement of its own. Every number here is either derived from the board
 * modules or copied from a public file. UNMEASURED stays empty; it is never 0.
 */
import { AXES_A } from "./_gspc_axes_a";
import { AXES_B } from "./_gspc_axes_b";
import { AXES_C } from "./_gspc_axes_c";
import { AXES_D } from "./_gspc_axes_d";
import { AXES_FIN } from "./_gspc_axes_fin";
import { MEASURED_ON } from "./_gspc_types";
import type { AxisScore } from "./_gspc_types";
import reports from "../../public/agent-plugin/reports.json";
import matrix from "../../public/agent-plugin/platform-matrix.json";
import { headFromGet } from "./_head";

const AXES: AxisScore[] = [...AXES_A, ...AXES_B, ...AXES_C, ...AXES_FIN, ...AXES_D];

const json = (body: unknown) =>
  new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });

export const onRequestGet: PagesFunction = async () => {
  const measured = AXES.filter((a) => a.status === "MEASURED");
  const unmeasured = AXES.filter((a) => a.status !== "MEASURED");
  const behavioural = AXES.filter((a) => a.family !== "financial");
  const separated = behavioural.filter((a) => a.separation === "SEPARATED");
  const ties = behavioural.filter((a) => a.separation === "TIE");
  const untested = behavioural.filter((a) => a.separation === "UNTESTED");
  const platforms = matrix.platforms;
  return json({
    schema: "csoai.public-report-index/0.1",
    // The board's own measured_on block, so this index carries the same provenance the board does.
    measured_on: MEASURED_ON,
    totals: {
      axes: AXES.length,
      measured: measured.length,
      unmeasured: unmeasured.length,
      model_comparison_axes: behavioural.length,
      separated: separated.length,
      tie: ties.length,
      untested: untested.length,
    },
    separated_axes: separated.map((a) => ({
      axis: a.axis,
      n: a.n,
      accuracy: a.accuracy,
      leader: a.leader,
      separation: a.separation,
    })),
    unmeasured_axes: unmeasured.map((a) => a.axis),
    reports: reports.reports,
    agent_plugin: {
      platform_families: platforms.length,
      present_on_this_estate: platforms.filter((p) => p.state === "present").length,
      matrix: "https://councilof.ai/api/plugin/platforms",
    },
    doctrine: [
      "MEASURED is a run behind a slot. UNMEASURED is an answer, never 0.",
      "SEPARATED / TIE / UNTESTED are three states and none is folded into another.",
      "A count with no source is null, never 0.",
      "This is measurement, not certification.",
    ],
    framing: "Anyone can re-check at https://councilof.ai/verify",
  });
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
