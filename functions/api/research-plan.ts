// GET /api/research-plan — live measured-board context joined to versioned research semantics.
// This endpoint does not conduct research, interpret source changes, submit candidates, re-run a
// bank, sign, train, repair or promote. A source-change candidate is never a measurement.
import { headFromGet } from "./_head";
import registry from "./_gspc_research_semantics.json";

type JsonObject = Record<string, unknown>;
const OUTPUT_SCHEMA = "csoai.gspc-research-plan/0.1";
const BOARD_SCHEMA = "csoai.gspc-axes/0.5";
const AXIS_ID = /^[a-z0-9][a-z0-9-]*$/;
const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "cache-control": "public, max-age=300",
};
const isObject = (value: unknown): value is JsonObject =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

function validRegistry(value: unknown): boolean {
  if (!isObject(value) || value.schema !== "csoai.gspc-research-semantics/0.1") return false;
  if (!isObject(value.sources) || !Array.isArray(value.axes) || value.axes.length === 0) return false;
  const controls = value.controls;
  if (!isObject(controls) || controls.read_only !== true || controls.writes_board !== false ||
      controls.model_training !== false || controls.automatic_fixing !== false ||
      controls.automatic_signing !== false || controls.automatic_promotion !== false ||
      controls.candidate_is_measurement !== false) return false;
  const sourceIds = new Set<string>();
  for (const [id, source] of Object.entries(value.sources)) {
    if (!AXIS_ID.test(id) || sourceIds.has(id) || !isObject(source) ||
        !nonEmpty(source.publisher) || !nonEmpty(source.title) ||
        !nonEmpty(source.url) || !/^https:\/\//.test(source.url) ||
        typeof source.watch !== "boolean") return false;
    sourceIds.add(id);
  }
  const axisIds = new Set<string>();
  for (const axis of value.axes) {
    if (!isObject(axis) || !nonEmpty(axis.axis) || !AXIS_ID.test(axis.axis) || axisIds.has(axis.axis) ||
        !nonEmpty(axis.continuous_question) || !Array.isArray(axis.compound_semantics) ||
        axis.compound_semantics.length < 2 || !axis.compound_semantics.every(nonEmpty) ||
        !isObject(axis.implementation) || !nonEmpty(axis.implementation.present) ||
        !nonEmpty(axis.implementation.missing) || !nonEmpty(axis.safe_autonomous_action) ||
        !nonEmpty(axis.human_gate) || !Array.isArray(axis.source_ids) ||
        axis.source_ids.length === 0 || !axis.source_ids.every((id) => typeof id === "string" && sourceIds.has(id))) return false;
    axisIds.add(axis.axis);
  }
  return true;
}

function boardAxes(board: unknown): JsonObject[] | null {
  if (!isObject(board) || board.schema !== BOARD_SCHEMA || !Array.isArray(board.axes) ||
      board.axes.length === 0 || !isObject(board.totals)) return null;
  const ids = new Set<string>();
  for (const axis of board.axes) {
    if (!isObject(axis) || !nonEmpty(axis.axis) || !AXIS_ID.test(axis.axis) || ids.has(axis.axis) ||
        !nonEmpty(axis.status) || !nonEmpty(axis.kind) || !nonEmpty(axis.task)) return null;
    ids.add(axis.axis);
  }
  if (board.totals.axes !== board.axes.length ||
      board.totals.measured_axes !== board.axes.filter((axis) => isObject(axis) && axis.status === "MEASURED").length) return null;
  return board.axes as JsonObject[];
}

function unavailable(errors: string[]) {
  return new Response(JSON.stringify({
    schema: OUTPUT_SCHEMA,
    state: "UNCHECKABLE",
    errors,
    measured_axis_count: null,
    plans: [],
    controls: registry.controls,
  }, null, 2), { status: 503, headers: HEADERS });
}

function measuredContext(axis: JsonObject) {
  const fields = [
    "family", "kind", "bench", "task", "n", "n_unit", "n_note", "accuracy",
    "accuracy_is", "separation", "separation_basis", "separation_untested_reason",
    "fleet_mean", "dataset", "dataset_url", "dataset_url_state", "evidence_url",
    "coverage", "coverage_note", "measurement_time", "run_attestation",
    "public_leader_state", "method_status", "note",
  ];
  const context: JsonObject = {
    classification: "PUBLISHED_BOARD_MEASUREMENT",
    source: "/api/gspc",
    status: axis.status,
  };
  for (const key of fields) if (axis[key] !== undefined) context[key] = axis[key];
  return context;
}

export async function onRequestGet({ request }: { request: Request }) {
  if (!validRegistry(registry)) return unavailable(["RESEARCH_REGISTRY_INVALID"]);
  let board: unknown;
  try {
    const response = await fetch(new URL("/api/gspc", request.url), {
      method: "GET",
      headers: { accept: "application/json" },
    });
    if (!response.ok) return unavailable(["GSPC_SOURCE_UNAVAILABLE"]);
    board = await response.json();
  } catch {
    return unavailable(["GSPC_SOURCE_UNAVAILABLE"]);
  }
  const axes = boardAxes(board);
  if (!axes) return unavailable(["GSPC_SOURCE_INVALID"]);

  const byId = new Map(registry.axes.map((axis) => [axis.axis, axis]));
  const measured = axes.filter((axis) => axis.status === "MEASURED");
  const missing = measured.filter((axis) => !byId.has(axis.axis as string)).map((axis) => axis.axis);
  if (missing.length) return unavailable([`RESEARCH_SEMANTICS_MISSING:${missing.join(",")}`]);

  const plans = measured.map((axis) => {
    const semantics = byId.get(axis.axis as string)!;
    const sources = semantics.source_ids.map((id) => ({ id, ...registry.sources[id as keyof typeof registry.sources] }));
    return {
      axis: axis.axis,
      research_state: "WATCH_CONFIGURED",
      candidate_state: "NO_CANDIDATE_IN_THIS_RESPONSE",
      candidate_is_measurement: false,
      measurement: measuredContext(axis),
      continuous_question: semantics.continuous_question,
      compound_semantics: semantics.compound_semantics,
      implementation: semantics.implementation,
      safe_autonomous_action: semantics.safe_autonomous_action,
      human_gate: semantics.human_gate,
      remeasurement_trigger: "CONFIRMED_SOURCE_CHANGE_THEN_HUMAN_IMPACT_REVIEW",
      sources,
      controls: {
        read_only: true,
        writes_board: false,
        model_training: false,
        automatic_fixing: false,
        automatic_signing: false,
        automatic_promotion: false,
      },
    };
  });
  const requestedAxis = new URL(request.url).searchParams.get("axis")?.trim() || null;
  const selected = requestedAxis ? plans.filter((plan) => plan.axis === requestedAxis) : plans;
  if (requestedAxis && selected.length === 0) {
    return new Response(JSON.stringify({
      schema: OUTPUT_SCHEMA,
      error: "unknown measured research axis",
      axis: requestedAxis,
      known_axes: plans.map((plan) => plan.axis),
      plans: [],
      controls: registry.controls,
    }, null, 2), { status: 404, headers: HEADERS });
  }
  return new Response(JSON.stringify({
    schema: OUTPUT_SCHEMA,
    state: "READY",
    purpose: "Continuous source monitoring and human-reviewed re-measurement planning for measured GSPC axes.",
    semantics_version: registry.version,
    source_snapshot: {
      board: "/api/gspc",
      board_schema: (board as JsonObject).schema,
      board_axes: axes.length,
      measured_axes: measured.length,
      registry: "functions/api/_gspc_research_semantics.json",
    },
    measured_axis_count: selected.length,
    watch: {
      scheduler: ".github/workflows/reg-watch.yml",
      detector: "scripts/research/watch-sources.mjs",
      state: "research-watch-state.json",
      review_requests: "research-review-requests/",
      confirmation: "two successful non-empty fetches with the same changed fingerprint at least 10 minutes apart",
      candidate_schema: "csoai.research-review-request/0.1",
      candidate_submission: "NONE",
    },
    controls: registry.controls,
    plans: selected,
  }, null, 2), { status: 200, headers: HEADERS });
}

export const boardAxesForTest = boardAxes;
export const validRegistryForTest = validRegistry;
export const onRequestHead = headFromGet(onRequestGet);
