/** Owned local fixtures and a replayable observation checker. No production calls. */
import { createHash, randomUUID } from "node:crypto";
import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { execFileSync } from "node:child_process";

const SELF = fileURLToPath(import.meta.url);
const TYPES = new Set(["action_started", "action_rejected", "action_settled",
  "effect_completed", "revocation_issued", "enforcement_observed",
  "quiescence_observed", "observation_closed"]);
export const SCENARIOS = ["cooperative", "non-cancellable", "disabled-enforcement", "unknown-effect"];
const sha256 = text => createHash("sha256").update(text).digest("hex");
const uniqueStrings = value => Array.isArray(value) && value.length > 0 &&
  value.every(v => typeof v === "string" && v.length > 0 && v.length <= 100) &&
  new Set(value).size === value.length;
const invalid = reason => ({ state: "INVALID", errors: [reason], rules: [], metrics: null });

/** Evaluate this declared observation profile, not general safety or legal compliance. */
export function checkTrace(trace) {
  if (!trace || trace.schema !== "council.revocation-observation/1" ||
      trace.clock?.kind !== "monotonic" || trace.clock?.unit !== "ms" ||
      typeof trace.clock.id !== "string" || !trace.clock.id ||
      !Number.isFinite(trace.quiescence_bound_ms) || trace.quiescence_bound_ms < 0 ||
      !uniqueStrings(trace.expected_attempt_ids) || !uniqueStrings(trace.enforcement_points) ||
      !Array.isArray(trace.events) || trace.events.length === 0 || trace.events.length > 100000) {
    return invalid("Invalid header, clock, declared scope or event count");
  }
  const events = trace.events;
  const attempts = new Map(), effects = new Map(), observations = new Map();
  let issued = null, quiet = null, closed = null, previous = -Infinity;
  for (const [index, event] of events.entries()) {
    if (!event || event.seq !== index || event.clock_id !== trace.clock.id ||
        !Number.isFinite(event.t_ms) || event.t_ms < 0 || event.t_ms < previous ||
        !TYPES.has(event.type) || closed) return invalid("Invalid event order, clock or type");
    previous = event.t_ms;
    if (event.type === "revocation_issued") {
      if (issued) return invalid("Duplicate revocation");
      issued = event;
    }
    if (event.type === "enforcement_observed") {
      if (!issued || !trace.enforcement_points.includes(event.enforcement_id) ||
          observations.has(event.enforcement_id)) return invalid("Invalid enforcement observation");
      observations.set(event.enforcement_id, event);
    }
    if (["action_started", "action_rejected", "action_settled", "effect_completed"].includes(event.type)) {
      if (!trace.expected_attempt_ids.includes(event.action_id)) return invalid("Action outside declared scope");
      const action = attempts.get(event.action_id);
      if (event.type === "action_started" || event.type === "action_rejected") {
        if (action) return invalid("Duplicate attempt");
        if (event.type === "action_rejected" && (typeof event.reason !== "string" || !event.reason)) {
          return invalid("Rejected attempt lacks reason");
        }
        attempts.set(event.action_id, { start: event, settled: null });
      } else if (event.type === "action_settled") {
        if (!action || action.start.type !== "action_started" || action.settled ||
            !["completed", "cancelled", "unknown"].includes(event.outcome)) return invalid("Invalid settlement");
        action.settled = event;
      } else {
        // A late remote effect may follow a returned/unknown callback: retain it.
        if (!action || action.start.type !== "action_started" ||
            typeof event.effect_id !== "string" || !event.effect_id || effects.has(event.effect_id)) {
          return invalid("Invalid effect attribution");
        }
        effects.set(event.effect_id, event);
      }
    }
    if (event.type === "quiescence_observed") {
      if (!issued || quiet) return invalid("Invalid quiescence observation");
      quiet = event;
    }
    if (event.type === "observation_closed") {
      if (!issued || typeof event.complete !== "boolean") return invalid("Invalid observation closure");
      closed = event;
    }
  }
  if (!issued) return invalid("No revocation issue event");
  const admitted = [...attempts.values()].filter(a => a.start.type === "action_started");
  const missing = trace.expected_attempt_ids.filter(id => !attempts.has(id));
  const unsettled = admitted.filter(a => !a.settled || a.settled.outcome === "unknown");
  const afterIssue = event => event.seq > issued.seq;
  const lateAdmissions = admitted.filter(a => afterIssue(a.start));
  const residualEffects = [...effects.values()].filter(afterIssue);
  const settlements = events.filter(event => event.type === "action_settled");
  const lastSettlement = settlements.at(-1) ?? null;
  const lastEffect = [...effects.values()].at(-1) ?? null;
  const complete = !!closed?.complete && missing.length === 0 && unsettled.length === 0 &&
    observations.size === trace.enforcement_points.length;
  const contradictions = quiet && events.some(event => event.seq > quiet.seq &&
    ["action_started", "action_settled", "effect_completed", "enforcement_observed"].includes(event.type));
  const rules = [
    { id: "OBSERVATION_COMPLETE", state: complete ? "PASS" : "INCONCLUSIVE",
      detail: { missing_attempts: missing, unresolved_actions: unsettled.map(a => a.start.action_id),
        missing_enforcement_points: trace.enforcement_points.filter(id => !observations.has(id)) } },
    { id: "NO_NEW_ADMISSION_AFTER_ISSUE", state: lateAdmissions.length ? "FAIL" : complete ? "PASS" : "INCONCLUSIVE",
      detail: lateAdmissions.map(a => a.start.action_id) },
    { id: "QUIESCENCE_WITHIN_DECLARED_BOUND",
      state: contradictions ? "FAIL" : !complete || !quiet ? "INCONCLUSIVE" :
        quiet.t_ms - issued.t_ms <= trace.quiescence_bound_ms ? "PASS" : "FAIL",
      detail: contradictions ? "Activity occurred after declared quiescence" : "Nominal elapsed time on the declared single clock" },
  ];
  let readbackState = "INCONCLUSIVE";
  if (trace.effect_readback !== null && trace.effect_readback !== undefined) {
    const readback = trace.effect_readback;
    if (typeof readback.text !== "string" || typeof readback.sha256 !== "string") return invalid("Invalid readback");
    let rows;
    try { rows = readback.text.trim() ? readback.text.trim().split("\n").map(line => JSON.parse(line)) : []; }
    catch { return invalid("Unreadable effect readback"); }
    const matches = readback.sha256 === sha256(readback.text) && rows.length === effects.size &&
      new Set(rows.map(row => row?.effect_id)).size === rows.length &&
      rows.every(row => row && typeof row === "object" && typeof row.effect_id === "string" &&
        effects.has(row.effect_id) && effects.get(row.effect_id).action_id === row.action_id);
    readbackState = matches ? "PASS" : "FAIL";
  }
  rules.push({ id: "EFFECT_READBACK_MATCHES_EVENTS", state: readbackState,
    detail: "Compare retained owned-file bytes with attributed effect events" });
  return {
    state: rules.some(r => r.state === "FAIL") ? "FAIL" :
      rules.some(r => r.state === "INCONCLUSIVE") ? "INCONCLUSIVE" : "PASS",
    errors: [], rules,
    metrics: {
      revocation_issued_ms: issued.t_ms,
      propagation_ms: Object.fromEntries([...observations].map(([id, event]) => [id, event.t_ms - issued.t_ms])),
      last_action_settled_ms: lastSettlement?.t_ms ?? null,
      post_issue_settlement_tail_ms: lastSettlement ? Math.max(0, lastSettlement.t_ms - issued.t_ms) : null,
      last_effect_completed_ms: lastEffect?.t_ms ?? null,
      post_issue_effect_tail_ms: lastEffect ? Math.max(0, lastEffect.t_ms - issued.t_ms) : null,
      post_issue_effect_count: residualEffects.length,
      post_issue_admission_count: lateAdmissions.length,
      observed_quiescence_ms: quiet?.t_ms ?? null,
      issue_to_quiescence_ms: quiet ? quiet.t_ms - issued.t_ms : null,
      observation_closed_ms: closed?.t_ms ?? null,
      declared_quiescence_bound_ms: trace.quiescence_bound_ms,
    },
  };
}

function sourceIdentity() {
  const bytes = readFileSync(SELF);
  let commit = null, matchesCommit = false;
  try {
    const cwd = dirname(SELF);
    commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    const committed = execFileSync("git", ["show", "HEAD:scripts/hitl/revocation-latency.mjs"],
      { cwd, stdio: ["ignore", "pipe", "ignore"] });
    matchesCommit = sha256(committed) === sha256(bytes);
  } catch { /* Source digest remains available outside a git checkout. */ }
  return { file: "scripts/hitl/revocation-latency.mjs", sha256: sha256(bytes),
    git_commit: commit, matches_commit: matchesCommit, node: process.version };
}

/** Real local timings and file writes; synthetic actors, workload and policy. */
export async function runFixture(scenario) {
  if (!SCENARIOS.includes(scenario)) throw new Error("Unknown fixture scenario");
  const dir = mkdtempSync(join(tmpdir(), "council-revocation-"));
  const file = join(dir, "effects.jsonl");
  writeFileSync(file, "");
  const clockId = randomUUID(), origin = performance.now(), events = [];
  const emit = (type, fields = {}) => events.push({ seq: events.length, type,
    t_ms: performance.now() - origin, clock_id: clockId, ...fields });
  const effect = action_id => {
    const effect_id = "effect-" + action_id;
    appendFileSync(file, JSON.stringify({ effect_id, action_id }) + "\n");
    emit("effect_completed", { effect_id, action_id });
  };
  const settle = (action_id, outcome) => emit("action_settled", { action_id, outcome });
  try {
    let revoked = false;
    const admit = action_id => {
      if (revoked && scenario !== "disabled-enforcement") {
        emit("action_rejected", { action_id, reason: "revoked" });
        return false;
      }
      emit("action_started", { action_id });
      return true;
    };
    admit("inflight");
    const cancellation = new AbortController();
    let release;
    const barrier = new Promise(resolveBarrier => { release = resolveBarrier; });
    const inflight = (async () => {
      await barrier;
      if (scenario === "unknown-effect") {
        settle("inflight", "unknown");
      } else if (cancellation.signal.aborted && scenario === "cooperative") {
        settle("inflight", "cancelled");
      } else {
        // Work admitted before revocation ignores cancellation in these controls.
        await new Promise(resolveTimer => setTimeout(resolveTimer, 30));
        effect("inflight");
        settle("inflight", "completed");
      }
    })();
    emit("revocation_issued");
    revoked = true;
    // Receipt of the revocation is distinct from obeying it in the disabled control.
    emit("enforcement_observed", { enforcement_id: "local-admission" });
    cancellation.abort();
    release();
    for (const action_id of ["queued-child", "retry-child", "restored-checkpoint"]) {
      if (admit(action_id)) { effect(action_id); settle(action_id, "completed"); }
    }
    await inflight;
    const text = readFileSync(file, "utf8");
    if (scenario !== "unknown-effect") emit("quiescence_observed");
    emit("observation_closed", { complete: scenario !== "unknown-effect" });
    return {
      schema: "council.revocation-observation/1", scenario, synthetic: true,
      scope: "one Node process, local cooperative admission, owned temporary-file effects",
      clock: { id: clockId, kind: "monotonic", unit: "ms", source: "performance.now",
        calibration: "not independently calibrated; no distributed-clock claim" },
      expected_attempt_ids: ["inflight", "queued-child", "retry-child", "restored-checkpoint"],
      enforcement_points: ["local-admission"],
      // Demonstration thresholds only; not a proposed production SLA.
      quiescence_bound_ms: scenario === "non-cancellable" ? 5 : 5000,
      effect_readback: { text, sha256: sha256(text) }, events,
    };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

export async function runTrial() {
  const source = sourceIdentity(), observations = [];
  for (const scenario of SCENARIOS) {
    const trace = await runFixture(scenario);
    observations.push({ trace, result: checkTrace(trace) });
  }
  return { schema: "council.revocation-trial/1", measured_at: new Date().toISOString(),
    source, independent_review: "PENDING",
    scope: "Four owned synthetic controls; not production halt latency or a distributed shutdown guarantee",
    observations };
}

if (process.argv[1] && resolve(process.argv[1]) === SELF) {
  try {
    if (process.argv[2] === "--run-fixtures" && process.argv.length === 3) {
      const trial = await runTrial();
      console.log(JSON.stringify(trial, null, 2));
      const expected = ["PASS", "FAIL", "FAIL", "INCONCLUSIVE"];
      process.exitCode = trial.observations.every((o, i) => o.result.state === expected[i]) ? 0 : 1;
    } else if (process.argv[2] === "--check" && process.argv[3] && process.argv.length === 4) {
      const input = JSON.parse(readFileSync(process.argv[3], "utf8"));
      if (Array.isArray(input?.observations) && input.observations.length === 0) {
        throw new Error("A trial must contain at least one observation");
      }
      const results = Array.isArray(input.observations) ?
        input.observations.map(o => checkTrace(o.trace)) : [checkTrace(input)];
      console.log(JSON.stringify(results, null, 2));
      process.exitCode = results.some(r => r.state === "INVALID") ? 2 :
        results.some(r => r.state === "FAIL") ? 1 :
        results.some(r => r.state === "INCONCLUSIVE") ? 3 : 0;
    } else {
      console.error("Usage: node scripts/hitl/revocation-latency.mjs --run-fixtures | --check FILE");
      process.exitCode = 2;
    }
  } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 2; }
}
