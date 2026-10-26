import { describe, expect, it } from "vitest";
import { onRequestGet, onRequestPost } from "./lead";

// LEADS holds contact:, lead: and subscribe: records keyed `<kind>:<ISO timestamp>:<uuid>`.
// GET /api/lead used to return up to ten of those key names plus a count, to anyone. That told
// the public when each inbound request arrived and how many there were. GET now answers only
// whether the binding is present, and must never touch the key list to do it.

const SEEDED_KEYS = [
  "contact:2026-09-30T10:11:12.345Z:0b7c7a2e-1d2f-4e3a-9b8c-7d6e5f4a3b2c",
  "lead:2026-10-01T08:09:10.111Z:1c8d8b3f-2e3a-4f4b-8c9d-8e7f6a5b4c3d",
  "subscribe:2026-09-12T07:06:05.000Z:2d9e9c4a-3f4b-4a5c-9d0e-9f8a7b6c5d4e",
];

type FakeKV = { kv: KVNamespace; store: Map<string, string>; listCalls: number; getCalls: number };

function fakeKV(seed: string[] = SEEDED_KEYS): FakeKV {
  const store = new Map<string, string>(seed.map((k) => [k, "{}"]));
  const f: FakeKV = { kv: undefined as unknown as KVNamespace, store, listCalls: 0, getCalls: 0 };
  f.kv = {
    put: async (k: string, v: string) => void store.set(k, v),
    get: async (k: string) => {
      f.getCalls++;
      return store.get(k) ?? null;
    },
    list: async () => {
      f.listCalls++;
      return { keys: [...store.keys()].map((name) => ({ name })), list_complete: true, cacheStatus: null };
    },
  } as unknown as KVNamespace;
  return f;
}

function getCtx(LEADS?: KVNamespace) {
  return {
    request: new Request("https://councilof.ai/api/lead"),
    env: { LEADS },
  } as unknown as Parameters<typeof onRequestGet>[0];
}

function postCtx(body: unknown, LEADS?: KVNamespace) {
  return {
    request: new Request("https://councilof.ai/api/lead", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    env: { LEADS },
  } as unknown as Parameters<typeof onRequestPost>[0];
}

// Shapes a LEADS key name could take in any response. Matching on these, not on the seeded
// strings alone, so a future change that formats keys differently is still caught.
const KEY_SHAPES = [
  /\b(contact|lead|subscribe|watch-request):\d{4}-\d{2}-\d{2}T/,
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,
];

describe("GET /api/lead never returns LEADS key names", () => {
  it("with LEADS bound and populated, the body is exactly {bound:true}", async () => {
    const f = fakeKV();
    const r = await onRequestGet(getCtx(f.kv));
    expect(r.status).toBe(200);
    const text = await r.text();
    expect(JSON.parse(text)).toStrictEqual({ bound: true });
    for (const k of SEEDED_KEYS) expect(text).not.toContain(k);
    for (const shape of KEY_SHAPES) expect(text).not.toMatch(shape);
    expect(text).not.toMatch(/"keys"|"count"/);
  });

  it("never lists or reads the namespace to answer", async () => {
    const f = fakeKV();
    await onRequestGet(getCtx(f.kv));
    expect(f.listCalls).toBe(0);
    expect(f.getCalls).toBe(0);
  });

  it("does not grow with the number of leads (no count, no timing)", async () => {
    const few = await (await onRequestGet(getCtx(fakeKV(SEEDED_KEYS.slice(0, 1)).kv))).text();
    const many = await (await onRequestGet(getCtx(fakeKV(SEEDED_KEYS).kv))).text();
    const none = await (await onRequestGet(getCtx(fakeKV([]).kv))).text();
    expect(few).toBe(many);
    expect(none).toBe(many);
  });

  it("with LEADS unbound, the body is exactly {bound:false}", async () => {
    const r = await onRequestGet(getCtx(undefined));
    expect(r.status).toBe(200);
    expect(await r.json()).toStrictEqual({ bound: false });
  });

  it("is not cacheable", async () => {
    const r = await onRequestGet(getCtx(fakeKV().kv));
    expect(r.headers.get("cache-control")).toBe("no-store");
  });
});

describe("POST /api/lead is unchanged", () => {
  it("stores the form under lead:<timestamp>:<uuid> and says stored:true", async () => {
    const f = fakeKV([]);
    const r = await onRequestPost(postCtx({ email: "a@example.org", name: "A", report_id: "r1" }, f.kv));
    expect(r.status).toBe(200);
    expect(await r.json()).toStrictEqual({ ok: true, stored: true });
    const [key] = [...f.store.keys()];
    expect(key).toMatch(/^lead:\d{4}-\d{2}-\d{2}T[^:]+:\d{2}:[^:]+:[0-9a-f-]{36}$/);
    const rec = JSON.parse(f.store.get(key)!);
    expect(rec.email).toBe("a@example.org");
    expect(rec.report_id).toBe("r1");
  });

  it("says stored:false with a fallback, never a silent 200, when LEADS is unbound", async () => {
    const r = await onRequestPost(postCtx({ email: "a@example.org" }));
    const b = await r.json();
    expect(b.stored).toBe(false);
    expect(b.fallback).toContain("nicholas@csoai.org");
  });

  it("rejects a missing email and a non-JSON body with 400", async () => {
    expect((await onRequestPost(postCtx({ name: "no email" }, fakeKV([]).kv))).status).toBe(400);
    expect((await onRequestPost(postCtx("not json", fakeKV([]).kv))).status).toBe(400);
  });
});
