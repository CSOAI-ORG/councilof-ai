/** Bounded display projection for the existing scenario API. Not an evidence verifier. */
export type LearningScenarioView = {
  axis: string;
  board_measurement: {status: string; kind: string; source: string};
  evidence: {published_state: string; independently_admitted: false};
  regulation_context: {
    state: string; source: string; note?: string;
    pointers: {regulator_name?: string; obligation?: string; tier?: string}[];
  };
};
const object = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
function demand(v: unknown, message: string): asserts v {
  if (!v) throw new Error(message);
}
function text(v: unknown, field: string, limit = 2000): string {
  demand(typeof v === "string" && v.trim().length > 0 && v.length <= limit,
    `Invalid scenario ${field}.`);
  return v;
}
/** Deliberately return only typed display fields; do not forward authority or raw answers. */
export function parseLearningScenario(value: unknown, axis: string, axisCount: number): LearningScenarioView {
  demand(/^[a-z][a-z0-9-]{0,79}$/.test(axis), "Invalid requested axis.");
  demand(Number.isInteger(axisCount) && axisCount > 0, "Invalid axis registry.");
  demand(object(value), "Scenario reply must be an object.");
  demand(value.schema === "csoai.learning-scenarios/0.1", "Unsupported scenario schema.");
  demand(value.state === "READY", "Scenario source is not ready for display.");
  demand(value.canonical_axis_count === axisCount, "Scenario axis registry differs from this client.");
  demand(value.scenario_count === 1 && Array.isArray(value.scenarios) && value.scenarios.length === 1,
    "Expected exactly one scenario for the selected axis.");
  const policy = value.policy;
  demand(object(policy), "Scenario policy is absent.");
  demand(policy.read_only === true && policy.candidate_submission_requires_explicit_consent === true,
    "Scenario read-only or consent boundary is absent.");
  for (const k of ["writes_board", "model_training", "automatic_fixing", "automatic_promotion"])
    demand(policy[k] === false, `Scenario ${k} is not explicitly disabled.`);
  const row = value.scenarios[0];
  demand(object(row) && row.axis === axis, "No exact scenario was returned for this axis.");
  const board = row.board_measurement, evidence = row.evidence, regulation = row.regulation_context;
  demand(object(board) && object(evidence) && object(regulation), "Incomplete scenario context.");
  demand(evidence.independently_admitted === false,
    "Independent-admission claims require a separately verified contract.");
  demand(Array.isArray(regulation.pointers) && regulation.pointers.length <= 200,
    "Invalid regulation pointers.");
  const pointers = regulation.pointers.map((pointer) => {
    demand(object(pointer), "Regulation pointer must be an object.");
    const out: {regulator_name?: string; obligation?: string; tier?: string} = {};
    for (const key of ["regulator_name", "obligation", "tier"] as const)
      if (pointer[key] !== undefined) out[key] = text(pointer[key], key);
    return out;
  });
  return {
    axis,
    board_measurement: {status: text(board.status, "board status", 80),
      kind: text(board.kind, "board kind", 80), source: text(board.source, "board source")},
    evidence: {published_state: text(evidence.published_state, "published state", 80), independently_admitted: false},
    regulation_context: {state: text(regulation.state, "mapping state", 80),
      source: text(regulation.source, "mapping source"), pointers,
      ...(regulation.note === undefined ? {} : {note: text(regulation.note, "mapping note", 5000)})},
  };
}
export type ScenarioReadOptions = {
  signal?: AbortSignal; timeoutMs?: number; maxBytes?: number;
  fetchImpl?: typeof fetch;
};
/** Abort, timeout and byte cap apply through body consumption, not just HTTP headers. */
export async function readLearningScenario(url: string, axis: string, axisCount: number,
  options: ScenarioReadOptions = {}): Promise<LearningScenarioView> {
  const timeoutMs = options.timeoutMs ?? 10000, maxBytes = options.maxBytes ?? 1048576;
  demand(Number.isInteger(timeoutMs) && timeoutMs > 0 && timeoutMs <= 60000, "Invalid timeout.");
  demand(Number.isInteger(maxBytes) && maxBytes > 0 && maxBytes <= 2097152, "Invalid byte budget.");
  const controller = new AbortController();
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let rejectStop: (error: Error) => void = () => {};
  const stopped = new Promise<never>((_, reject) => { rejectStop = reject; });
  const abortError = () => Object.assign(new Error("Scenario read cancelled."), {name: "AbortError"});
  const cancel = (error: Error) => {
    rejectStop(error);
    controller.abort();
    if (reader) void reader.cancel().catch(() => {});
  };
  const onAbort = () => cancel(abortError());
  try {
    options.signal?.addEventListener("abort", onAbort, {once: true});
    if (options.signal?.aborted) onAbort();
    else timeout = setTimeout(() => cancel(new Error("Scenario read timed out. Retry when the source is available.")), timeoutMs);
    const work = async () => {
      if (controller.signal.aborted) throw abortError();
      const response = await (options.fetchImpl ?? fetch)(url, {
        headers: {accept: "application/json"}, signal: controller.signal,
      });
      if (controller.signal.aborted) throw abortError();
      demand(response.ok, `Scenario endpoint HTTP ${response.status}.`);
      demand((response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase() === "application/json",
        "Scenario endpoint returned a document, not its JSON contract.");
      const length = response.headers.get("content-length");
      if (length !== null)
        demand(/^\d+$/.test(length) && Number(length) <= maxBytes, "Scenario response exceeds the byte budget.");
      demand(response.body, "Scenario response body is absent.");
      reader = response.body.getReader();
      const chunks: Uint8Array[] = []; let size = 0;
      while (true) {
        if (controller.signal.aborted) throw abortError();
        const {done, value} = await reader.read();
        if (done) break;
        size += value.byteLength;
        demand(size <= maxBytes, "Scenario response exceeds the byte budget.");
        chunks.push(value);
      }
      const bytes = new Uint8Array(size); let at = 0;
      for (const chunk of chunks) {bytes.set(chunk, at); at += chunk.length;}
      const decoded = new TextDecoder("utf-8", {fatal: true}).decode(bytes);
      let parsed: unknown;
      try { parsed = JSON.parse(decoded); } catch {throw new Error("Scenario response contains invalid JSON.");}
      return parseLearningScenario(parsed, axis, axisCount);
    };
    return await Promise.race([work(), stopped]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
    options.signal?.removeEventListener("abort", onAbort);
    controller.abort();
    if (reader) void reader.cancel().catch(() => {});
  }
}
