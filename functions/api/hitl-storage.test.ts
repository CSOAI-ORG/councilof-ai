import { describe, expect, it, vi } from "vitest";
import { buildChallenge, buildReceipt, deriveModule, listCompletedModules, listReceipts, markModuleCompleted, putChallenge, putReceipt } from "./_hitl";

const { board } = vi.hoisted(() => ({ board: { axes: [{ axis: "governance", status: "MEASURED", separation: "TIE", n: 10 }] } }));
vi.mock("./_chatCanon", () => ({ loadBoard: async () => board }));
import { onRequestPost, onRequestGet, HITL_ASSESSMENT_SCOPE } from "./hitl";

function store(fail = false) {
  const values = new Map<string, string>();
  return {
    values,
    put: vi.fn(async (key: string, value: string) => { if (fail) throw new Error("storage failed"); values.set(key, value); }),
    get: async (key: string) => values.get(key) ?? null,
    list: async ({ prefix }: { prefix: string }) => ({ keys: [...values.keys()].filter(k => k.startsWith(prefix)).sort().map(name => ({ name })), list_complete: true }),
  };
}
async function challenge() {
  return buildChallenge({ at: "2026-10-29T00:00:00Z", axis: "governance", subject: "fixture", proposed_action: "review fixture", raised_by: "fixture", source: null, facts: null, required_module: null });
}
async function receipt(decision: "HOLD" | "REJECTED", at = "2026-10-29T00:00:01Z") {
  return buildReceipt({ operator: "fixture", axis: "governance", decision, note: "fixture", competency_verified: true, completed_modules: [], module_id: "governance", challenge: await challenge(), at });
}
async function post(path: string, body: unknown, kv?: ReturnType<typeof store>) {
  return onRequestPost({ request: new Request(`https://fixture.invalid/api/hitl/${path}`, { method: "POST", headers: { "content-type": "application/json", "x-hitl-token": "fixture-only-token" }, body: JSON.stringify(body) }), env: { HITL_KV: kv, HITL_DECIDE_TOKEN: "fixture-only-token" } } as any);
}
async function decisionBody() {
  const mod = deriveModule(board, "governance")!;
  return { decision: "HOLD", challenge: await challenge(), module_id: mod.id, answer: mod.correct_option, operator: "fixture" };
}

describe("HITL storage acknowledgement and decision history", () => {
  it("separates a caller label and answer match from identity and competence verification", async () => {
    const body = { ...await decisionBody(), operator: "caller-supplied label" };
    const res = await post("decision", body, store());
    expect(res.status).toBe(200);
    const reply = await res.json();
    expect(reply.assessment_scope).toEqual(HITL_ASSESSMENT_SCOPE);
    expect(reply.assessment_scope).toMatchObject({
      decision_recording_credential: "SHARED_OPERATOR_TOKEN",
      operator_identity: "NOT_VERIFIED", human_presence: "NOT_ESTABLISHED",
      competency_verified_meaning: "LIVE_BOARD_ANSWER_MATCH_ONLY",
      professional_competence: "NOT_ASSESSED", execution_authority: false,
    });
    // Compatibility fields and the signed payload remain the existing receipt shape.
    expect(reply.assessment_scope).not.toHaveProperty("credential_check");
    expect(reply.receipt.operator).toBe("caller-supplied label");
    expect(reply.receipt.competency_verified).toBe(true);
    expect(reply.receipt).not.toHaveProperty("assessment_scope");
    expect(reply.receipt.schema).toBe("csoai.hitl-oversight-receipt/0.1");
  });
  it("includes assessment limits when reading state and historical receipts", async () => {
    for (const path of ["", "/record"]) {
      const res = await onRequestGet({ request: new Request("https://fixture.invalid/api/hitl" + path), env: { HITL_KV: store() } } as any);
      expect((await res.json()).assessment_scope).toEqual(HITL_ASSESSMENT_SCOPE);
    }
  });
  it("does not report a challenge as stored after a rejected write", async () => {
    const res = await post("challenge", { subject: "fixture", proposed_action: "review fixture" }, store(true));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, stored: false, storage_state: "WRITE_UNCONFIRMED" });
  });
  it("does not report a decision as recorded after a rejected write", async () => {
    const res = await post("decision", await decisionBody(), store(true));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toMatchObject({ ok: false, stored: false, storage_state: "WRITE_UNCONFIRMED" });
    expect(body.receipt).toBeUndefined();
  });
  it("requires storage before recording a decision", async () => {
    const res = await post("decision", await decisionBody());
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, stored: false, storage_state: "UNBOUND" });
  });
  it("retains the deliberately stateless challenge path", async () => {
    const res = await post("challenge", { subject: "fixture", proposed_action: "review fixture" });
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ stored: false });
  });
  it("acknowledges a successful write without claiming execution authority", async () => {
    const res = await post("decision", await decisionBody(), store());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, stored: true, storage_state: "WRITE_ACKNOWLEDGED", execution_authority: false });
  });
  it("preserves two decisions about the same challenge", async () => {
    const kv = store();
    const a = await receipt("HOLD"); const b = await receipt("REJECTED", "2026-10-29T00:00:02Z");
    expect(await putReceipt(kv as any, a)).toBe(true);
    expect(await putReceipt(kv as any, b)).toBe(true);
    expect((await listReceipts(kv as any)).map(x => x.decision).sort()).toEqual(["HOLD", "REJECTED"]);
  });
  it("makes an exact receipt retry use the same content address", async () => {
    const kv = store(); const r = await receipt("HOLD");
    await putReceipt(kv as any, r); await putReceipt(kv as any, r);
    expect(kv.values.size).toBe(1);
    expect([...kv.values.keys()][0]).toMatch(/^hitl:receipt:[^:]+:[a-f0-9]{64}$/);
  });
  it("keeps legacy challenge-key receipts readable and untouched", async () => {
    const kv = store(); const a = await receipt("HOLD"); const b = await receipt("REJECTED");
    const key = `hitl:receipt:${a.challenge.id}`; const original = JSON.stringify(a);
    kv.values.set(key, original); await putReceipt(kv as any, b);
    expect(kv.values.get(key)).toBe(original);
    expect(await listReceipts(kv as any)).toHaveLength(2);
  });
  it("returns false to direct helper callers when storage refuses writes", async () => {
    expect(await putChallenge(store(true) as any, await challenge())).toBe(false);
    expect(await putReceipt(store(true) as any, await receipt("HOLD"))).toBe(false);
    expect(await putReceipt(null, await receipt("HOLD"))).toBe(false);
  });
  it("labels limited history without calling it every decision", async () => {
    const res = await onRequestGet({ request: new Request("https://fixture.invalid/api/hitl/record"), env: { HITL_KV: store() } } as any);
    const body = await res.json();
    expect(body.history_scope).toMatchObject({ limit: 50, complete: false, consistency: "eventual" });
    expect(body.note).not.toMatch(/Every decision/);
  });
  it("does not turn an unreadable history into a successful empty ledger", async () => {
    const kv = store(); kv.list = async () => { throw new Error("unavailable"); };
    const res = await onRequestGet({ request: new Request("https://fixture.invalid/api/hitl/record"), env: { HITL_KV: kv } } as any);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.storage_state).toBe("READ_FAILED");
    expect(body.receipts).toBeUndefined();
  });
  it("does not advertise the decision path as open without storage", async () => {
    const res = await onRequestGet({ request: new Request("https://fixture.invalid/api/hitl"), env: { HITL_DECIDE_TOKEN: "fixture-only-token" } } as any);
    expect(await res.json()).toMatchObject({ decision_path: "locked", operator_token_configured: true, store_bound: false });
  });
});

describe("shared HITL practice completion, separate from a person's decision", () => {
  async function answer(kv: ReturnType<typeof store>, correct: boolean) {
    const mod = deriveModule(board, "governance")!;
    const selected = correct ? mod.correct_option : mod.options.find(option => option.id !== mod.correct_option)!.id;
    // Practice has no token or named learner. Test the actual public branch.
    return onRequestPost({ request: new Request("https://fixture.invalid/api/hitl/modules", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ module_id: mod.id, answer: selected }),
    }), env: { HITL_KV: kv } } as any);
  }

  it("checks an incorrect answer without recording a completion", async () => {
    const kv = store();
    const response = await answer(kv, false);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, correct: false, recorded: false, oversight_gate_unlocked: false });
    expect(kv.put).not.toHaveBeenCalled();
    expect(await listCompletedModules(kv as any)).toEqual([]);
  });

  it("records a correct result and preserves it after a later incorrect attempt", async () => {
    const kv = store(); const id = deriveModule(board, "governance")!.id;
    expect(await (await answer(kv, true)).json()).toMatchObject({ correct: true, recorded: true });
    const original = kv.values.get(`hitl:module:${id}`);
    expect(await (await answer(kv, false)).json()).toMatchObject({ correct: false, recorded: false });
    expect(kv.values.get(`hitl:module:${id}`)).toBe(original);
    expect(kv.put).toHaveBeenCalledTimes(1);
    expect(await listCompletedModules(kv as any)).toEqual([id]);
  });

  it("filters legacy incorrect, unqualified and key-mismatched rows without rewriting them", async () => {
    const kv = store();
    const rows: Array<[string, unknown]> = [
      ["good", { module_id: "good", correct: true }],
      ["wrong", { module_id: "wrong", correct: false }],
      ["absent", { module_id: "absent" }],
      ["string", { module_id: "string", correct: "true" }],
      ["misbound", { module_id: "other", correct: true }],
      ["number", { module_id: 1, correct: true }],
      ["empty", null],
    ];
    for (const [key, value] of rows) kv.values.set(`hitl:module:${key}`, JSON.stringify(value));
    kv.values.set("hitl:module:malformed", "{");
    const original = [...kv.values.entries()];
    expect(await listCompletedModules(kv as any)).toEqual(["good"]);
    expect([...kv.values.entries()]).toEqual(original);
    expect(kv.put).not.toHaveBeenCalled();
    const response = await onRequestGet({ request: new Request("https://fixture.invalid/api/hitl"), env: { HITL_KV: kv } } as any);
    expect(await response.json()).toMatchObject({ completed_modules: ["good"] });
  });

  it("direct helper callers cannot mark an incorrect or misbound result complete", async () => {
    const kv = store();
    for (const record of [null, [], {}, { module_id: "m", correct: false },
      { module_id: "other", correct: true }, { module_id: "m", correct: "true" }]) {
      expect(await markModuleCompleted(kv as any, "m", record as any)).toBe(false);
    }
    expect(kv.put).not.toHaveBeenCalled();
    expect(await markModuleCompleted(kv as any, "m", { module_id: "m", correct: true })).toBe(true);
  });

  it("reports an unacknowledged correct-result write without inventing completion", async () => {
    const kv = store(true);
    expect(await (await answer(kv, true)).json()).toMatchObject({ correct: true, recorded: false });
    expect(await listCompletedModules(kv as any)).toEqual([]);
  });

  it("a new decision receipt contains only the module rechecked in that request", async () => {
    const kv = store();
    kv.values.set("hitl:module:someone-elses-module", JSON.stringify({ module_id: "someone-elses-module", correct: true }));
    const historical = await receipt("HOLD");
    await putReceipt(kv as any, historical);
    const oldEntries = [...kv.values.entries()];
    const response = await post("decision", await decisionBody(), kv);
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.execution_authority).toBe(false);
    expect(result.receipt.completed_modules).toEqual([deriveModule(board, "governance")!.id]);
    for (const [key, value] of oldEntries) expect(kv.values.get(key)).toBe(value);
  });

  it("shared completion cannot bypass the decision's current-answer recheck", async () => {
    const kv = store(); const mod = deriveModule(board, "governance")!;
    await answer(kv, true);
    const body = await decisionBody();
    body.answer = mod.options.find(option => option.id !== mod.correct_option)!.id;
    const response = await post("decision", body, kv);
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ ok: false, blocked_by_competency_gate: true });
    expect(await listReceipts(kv as any)).toEqual([]);
  });
});
