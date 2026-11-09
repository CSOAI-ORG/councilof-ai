import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { checkTrace, runFixture, SCENARIOS } from "./revocation-latency.mjs";

const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const renumber = (t: any) => { t.events.forEach((e: any, i: number) => { e.seq = i; }); return t; };
function sample(): any {
  const text = JSON.stringify({ effect_id: "e1", action_id: "a" }) + "\n";
  return {
    schema: "council.revocation-observation/1",
    clock: { id: "single-clock", kind: "monotonic", unit: "ms" },
    expected_attempt_ids: ["a", "queued"], enforcement_points: ["admission"],
    quiescence_bound_ms: 20, effect_readback: { text, sha256: hash(text) },
    events: [
      { type: "action_started", action_id: "a", t_ms: 0 },
      { type: "revocation_issued", t_ms: 10 },
      { type: "enforcement_observed", enforcement_id: "admission", t_ms: 11 },
      { type: "action_rejected", action_id: "queued", reason: "revoked", t_ms: 12 },
      { type: "effect_completed", effect_id: "e1", action_id: "a", t_ms: 20 },
      { type: "action_settled", action_id: "a", outcome: "completed", t_ms: 21 },
      { type: "quiescence_observed", t_ms: 22 },
      { type: "observation_closed", complete: true, t_ms: 23 },
    ].map((event, seq) => ({ ...event, seq, clock_id: "single-clock" })),
  };
}

describe("revocation observation profile", () => {
  it("separates propagation, settlement, effects and observed quiescence", () => {
    const result = checkTrace(sample());
    expect(result.state).toBe("PASS");
    expect(result.metrics).toMatchObject({
      propagation_ms: { admission: 1 }, post_issue_settlement_tail_ms: 11,
      post_issue_effect_tail_ms: 10, issue_to_quiescence_ms: 12,
      post_issue_effect_count: 1, post_issue_admission_count: 0,
    });
  });
  it("does not equate a blocked next call with meeting the halt bound", () => {
    const t = sample(); t.quiescence_bound_ms = 5;
    const result = checkTrace(t);
    expect(result.state).toBe("FAIL");
    expect(result.rules.find((r: any) => r.id === "NO_NEW_ADMISSION_AFTER_ISSUE").state).toBe("PASS");
    expect(result.rules.find((r: any) => r.id === "QUIESCENCE_WITHIN_DECLARED_BOUND").state).toBe("FAIL");
  });
  it("uses event chronology for the last settlement rather than start order", () => {
    const t = sample();
    t.expected_attempt_ids.push("b");
    t.events.splice(1, 0, { type: "action_started", action_id: "b", t_ms: 1, clock_id: "single-clock" },
      { type: "action_settled", action_id: "b", outcome: "cancelled", t_ms: 2, clock_id: "single-clock" });
    expect(checkTrace(renumber(t)).metrics.last_action_settled_ms).toBe(21);
  });
  it("keeps no-action timestamps null rather than reporting zero latency", () => {
    const t = sample(); t.expected_attempt_ids = ["queued"];
    t.events = t.events.filter((e: any) => e.action_id !== "a");
    t.effect_readback = { text: "", sha256: hash("") };
    const result = checkTrace(renumber(t));
    expect(result.state).toBe("PASS");
    expect(result.metrics.last_action_settled_ms).toBeNull();
    expect(result.metrics.last_effect_completed_ms).toBeNull();
    expect(result.metrics.post_issue_effect_tail_ms).toBeNull();
    expect(result.metrics.post_issue_effect_count).toBe(0);
  });
  it("reports a pre-revocation completion without a negative tail", () => {
    const t = sample();
    for (const e of t.events) if (e.type === "action_started") e.t_ms = 0;
    t.events.find((e: any) => e.type === "effect_completed").t_ms = 3;
    t.events.find((e: any) => e.type === "action_settled").t_ms = 4;
    t.events.sort((a: any, b: any) => a.t_ms - b.t_ms);
    const result = checkTrace(renumber(t));
    expect(result.state).toBe("PASS");
    expect(result.metrics.last_effect_completed_ms).toBe(3);
    expect(result.metrics.post_issue_effect_tail_ms).toBe(0);
    expect(result.metrics.post_issue_effect_count).toBe(0);
  });
  it.each(["closure", "attempt", "enforcement", "readback", "quiescence", "unknown"])(
    "preserves incomplete evidence: %s", missing => {
      const t = sample();
      if (missing === "closure") t.events.pop();
      if (missing === "attempt") t.expected_attempt_ids.push("unobserved");
      if (missing === "enforcement") t.enforcement_points.push("unobserved-worker");
      if (missing === "readback") t.effect_readback = null;
      if (missing === "quiescence") t.events = t.events.filter((e: any) => e.type !== "quiescence_observed");
      if (missing === "unknown") t.events.find((e: any) => e.type === "action_settled").outcome = "unknown";
      expect(checkTrace(renumber(t)).state).toBe("INCONCLUSIVE");
    });
  it.each(["clock", "backwards", "duplicate-revocation", "unattributed-effect", "unknown-type", "duplicate-attempt"])(
    "refuses an invalid trace: %s", defect => {
      const t = sample();
      if (defect === "clock") t.events[2].clock_id = "different-clock";
      if (defect === "backwards") t.events[3].t_ms = 0;
      if (defect === "duplicate-revocation") t.events[2].type = "revocation_issued";
      if (defect === "unattributed-effect") t.events[4].action_id = "outside";
      if (defect === "unknown-type") t.events[3].type = "looks-safe";
      if (defect === "duplicate-attempt") t.events[3].action_id = "a";
      expect(checkTrace(t).state).toBe("INVALID");
    });
  it("fails a quiescence assertion contradicted by later activity", () => {
    const t = sample();
    const q = t.events.splice(6, 1)[0]; q.t_ms = 13;
    t.events.splice(4, 0, q);
    expect(checkTrace(renumber(t)).state).toBe("FAIL");
  });
  it("does not accept quiescence before a declared enforcement point is observed", () => {
    const t = sample();
    const ack = t.events.splice(2, 1)[0]; ack.t_ms = 22.5;
    t.events.splice(t.events.length - 1, 0, ack);
    expect(checkTrace(renumber(t)).state).toBe("FAIL");
  });
  it.each(["digest", "missing-event", "extra-row", "malformed-row"])("fails inconsistent effect evidence: %s", defect => {
    const t = sample();
    if (defect === "digest") t.effect_readback.sha256 = "0".repeat(64);
    if (defect === "missing-event") t.events = t.events.filter((e: any) => e.type !== "effect_completed");
    if (defect === "malformed-row") t.effect_readback = { text: '"not-an-effect"\n', sha256: hash('"not-an-effect"\n') };
    if (defect === "extra-row") {
      t.effect_readback.text += JSON.stringify({ effect_id: "e2", action_id: "a" }) + "\n";
      t.effect_readback.sha256 = hash(t.effect_readback.text);
    }
    expect(checkTrace(renumber(t)).state).toBe("FAIL");
  });
  it("retains a late effect after an unknown callback outcome", () => {
    const t = sample();
    const settled = t.events.find((e: any) => e.type === "action_settled");
    settled.outcome = "unknown"; settled.t_ms = 13;
    t.events.sort((a: any, b: any) => a.t_ms - b.t_ms);
    const result = checkTrace(renumber(t));
    expect(result.state).toBe("INCONCLUSIVE");
    expect(result.metrics.post_issue_effect_count).toBe(1);
  });
  it.each([null, {}, { events: [] }])("rejects missing schema and scope", input => {
    expect(checkTrace(input).state).toBe("INVALID");
  });
});

describe("owned-file controls with real monotonic observations", () => {
  const expected = ["PASS", "FAIL", "FAIL", "INCONCLUSIVE"];
  it.each(SCENARIOS)("detects the expected control outcome for %s", async (scenario: string) => {
    const trace = await runFixture(scenario), result = checkTrace(trace);
    expect(result.state).toBe(expected[SCENARIOS.indexOf(scenario)]);
    expect(trace.synthetic).toBe(true);
    expect(result.rules.find((r: any) => r.id === "EFFECT_READBACK_MATCHES_EVENTS").state).toBe("PASS");
    if (scenario === "disabled-enforcement") expect(result.metrics.post_issue_admission_count).toBe(3);
    if (scenario === "non-cancellable") expect(result.metrics.post_issue_effect_count).toBe(1);
    if (scenario === "cooperative") expect(result.metrics.last_effect_completed_ms).toBeNull();
    if (scenario === "unknown-effect") expect(result.metrics.observed_quiescence_ms).toBeNull();
  });
});

describe("retained-file command-line replay", () => {
  function replay(input: unknown) {
    const dir = mkdtempSync(join(tmpdir(), "council-replay-test-"));
    try {
      const path = join(dir, "input.json");
      writeFileSync(path, JSON.stringify(input));
      const run = spawnSync(process.execPath,
        [fileURLToPath(new URL("./revocation-latency.mjs", import.meta.url)), "--check", path],
        { encoding: "utf8" });
      return { code: run.status, output: run.stdout ? JSON.parse(run.stdout) : null };
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
  it.each([["PASS", 0], ["FAIL", 1], ["INVALID", 2], ["INCONCLUSIVE", 3]])(
    "uses the documented exit status for %s", (state, code) => {
      const trace = sample();
      if (state === "FAIL") trace.quiescence_bound_ms = 5;
      if (state === "INVALID") trace.events[1].clock_id = "another-clock";
      if (state === "INCONCLUSIVE") trace.events.pop();
      const run = replay(trace);
      expect(run.code).toBe(code);
      expect(run.output[0].state).toBe(state);
    });
  it("recomputes results instead of trusting a stored passing label", () => {
    const trace = sample(); trace.quiescence_bound_ms = 5;
    const run = replay({ observations: [{ trace, result: { state: "PASS" } }] });
    expect(run.code).toBe(1);
    expect(run.output[0].state).toBe("FAIL");
  });
  it("refuses an empty trial rather than treating no observations as success", () => {
    expect(replay({ observations: [] }).code).toBe(2);
  });
});
