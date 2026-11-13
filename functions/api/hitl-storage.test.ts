import { describe, expect, it, vi } from "vitest";
import { buildChallenge, buildReceipt, deriveModule, listReceipts, putChallenge, putReceipt } from "./_hitl";

const { board } = vi.hoisted(() => ({ board: { axes: [{ axis: "governance", status: "MEASURED", separation: "TIE", n: 10 }] } }));
vi.mock("./_chatCanon", () => ({ loadBoard: async () => board }));
import { onRequestPost, onRequestGet } from "./hitl";

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
