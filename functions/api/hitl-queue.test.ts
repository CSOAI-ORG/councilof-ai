import { describe, expect, it, vi } from "vitest";
import { buildChallenge, deriveModule, putChallenge, verifyHitlReceipt } from "./_hitl";

const { board } = vi.hoisted(() => ({ board: { axes: [{ axis: "governance", status: "MEASURED", separation: "TIE", n: 10 }] } }));
vi.mock("./_chatCanon", () => ({ loadBoard: async () => board }));
import { onRequestGet, onRequestPost } from "./hitl";

function store() {
  const values = new Map<string, string>();
  return {
    values,
    get: vi.fn(async (key: string) => values.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => { values.set(key, value); }),
    list: vi.fn(async ({ prefix }: { prefix: string }) => ({ keys: [...values.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true })),
  };
}
async function get(path: string, kv: ReturnType<typeof store>) {
  return onRequestGet({ request: new Request(`https://fixture.invalid/api/hitl/${path}`), env: { HITL_KV: kv } } as any);
}
async function post(challenge: unknown, kv: ReturnType<typeof store>, options: { token?: string; answer?: string } = {}) {
  const mod = deriveModule(board, "governance")!;
  return onRequestPost({ request: new Request("https://fixture.invalid/api/hitl/decision", {
    method: "POST", headers: { "content-type": "application/json", "x-hitl-token": options.token ?? "fixture-only-token" },
    body: JSON.stringify({ challenge, decision: "HOLD", operator: "fixture", module_id: mod.id, answer: options.answer ?? mod.correct_option }),
  }), env: { HITL_KV: kv, HITL_DECIDE_TOKEN: "fixture-only-token" } } as any);
}
async function fixture(privateContext = false) {
  const kv = store();
  const original = await buildChallenge({ at: "2026-10-29T00:00:00Z", axis: "governance", subject: "fixture", proposed_action: "review fixture", raised_by: "fixture", source: privateContext ? "private-source-reference" : null, facts: privateContext ? "private-supporting-context" : null, required_module: null });
  await putChallenge(kv as any, original);
  const response = await get("challenges", kv);
  expect(response.status).toBe(200);
  const queued = (await response.json()).challenges[0];
  kv.get.mockClear(); kv.put.mockClear();
  return { kv, original, queued };
}

describe("queued challenge to recorded decision", () => {
  it.each([false, true])("accepts the exact queue projection with private context=%s", async (privateContext) => {
    const { kv, original, queued } = await fixture(privateContext);
    const response = await post(queued, kv);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, stored: true, execution_authority: false, receipt: { decision: "HOLD", challenge: { id: original.id, source: null, facts: null } } });
    const history = await (await get("record", kv)).json();
    expect(history.receipts).toHaveLength(1);
    expect(history.receipts[0]).toEqual(body.receipt);
    expect((await verifyHitlReceipt(body.receipt, "")).sha_ok).toBe(true);
    expect(JSON.stringify([queued, body, history])).not.toMatch(/private-source-reference|private-supporting-context/);
    expect(JSON.parse(kv.values.get(`hitl:challenge:${original.id}`)!)).toEqual(original);
  });
  it.each(["axis", "subject", "proposed_action", "raised_by", "at", "required_module"])("refuses changed displayed %s even when the id is unchanged", async (field) => {
    const { kv, queued } = await fixture();
    const response = await post({ ...queued, [field]: "altered" }, kv);
    expect(response.status).toBe(422);
    expect(kv.put).not.toHaveBeenCalled();
  });
  it("refuses a projection missing the action rather than trusting an id alone", async () => {
    const { kv, queued } = await fixture(); delete queued.proposed_action;
    expect((await post(queued, kv)).status).toBe(422);
    expect(kv.put).not.toHaveBeenCalled();
  });
  it("does not silently replace a malformed full challenge with a stored original", async () => {
    const { kv, original } = await fixture(true);
    expect((await post({ ...original, source: "altered" }, kv)).status).toBe(422);
    expect(kv.put).not.toHaveBeenCalled();
  });
  it("retains the complete-challenge route without publishing private context", async () => {
    const { kv, original } = await fixture(true);
    const response = await post(original, kv);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.receipt.challenge).toMatchObject({ id: original.id, source: null, facts: null });
    expect((await verifyHitlReceipt(body.receipt, "")).sha_ok).toBe(true);
  });
  it("reports a missing eventual-store record as unavailable, with no decision", async () => {
    const { kv, queued } = await fixture(); kv.values.clear();
    const response = await post(queued, kv);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, stored: false, storage_state: "CHALLENGE_UNAVAILABLE" });
    expect(kv.put).not.toHaveBeenCalled();
  });
  it("does not turn a rejected read into a missing or accepted challenge", async () => {
    const { kv, queued } = await fixture(); kv.get.mockRejectedValue(new Error("offline"));
    const response = await post(queued, kv);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ storage_state: "READ_FAILED" });
    expect(kv.put).not.toHaveBeenCalled();
  });
  it.each(["{bad json", "null", "[]"])("refuses unreadable stored bytes: %s", async (raw) => {
    const { kv, original, queued } = await fixture(); kv.values.set(`hitl:challenge:${original.id}`, raw);
    expect((await post(queued, kv)).status).toBe(422);
    expect(kv.put).not.toHaveBeenCalled();
  });
  it("reverifies the stored original and refuses changed hidden fields", async () => {
    const { kv, original, queued } = await fixture(true);
    kv.values.set(`hitl:challenge:${original.id}`, JSON.stringify({ ...original, facts: "changed" }));
    expect((await post(queued, kv)).status).toBe(422);
    expect(kv.put).not.toHaveBeenCalled();
  });
  it("checks authentication before accessing the private original", async () => {
    const { kv, queued } = await fixture(true);
    expect((await post(queued, kv, { token: "wrong" })).status).toBe(401);
    expect(kv.get).not.toHaveBeenCalled(); expect(kv.put).not.toHaveBeenCalled();
  });
  it("retains the current-board competency gate after resolving the original", async () => {
    const { kv, queued } = await fixture(true);
    const response = await post(queued, kv, { answer: "incorrect" });
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ blocked_by_competency_gate: true });
    expect(kv.put).not.toHaveBeenCalled();
  });
});
