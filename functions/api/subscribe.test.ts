import { describe, expect, it } from "vitest";
import { onRequestGet, onRequestPost } from "./subscribe";

// Subscribe records join contact:/lead: in LEADS under `subscribe:<ISO>:<uuid>`.
// The homepage band posts {email, source}; the handler must store it and say so.
// GET answers only whether the binding is present — never key names (timing and
// volume are not public data; see lead.test.ts for the incident that established that).

function fakeKV() {
  const store = new Map<string, string>();
  return {
    kv: {
      put: async (k: string, v: string) => void store.set(k, v),
      get: async (k: string) => store.get(k) ?? null,
    } as unknown as KVNamespace,
    store,
  };
}

function postCtx(body: unknown, LEADS?: KVNamespace) {
  return {
    request: new Request("https://councilof.ai/api/subscribe", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    env: { LEADS },
  } as unknown as Parameters<typeof onRequestPost>[0];
}

function getCtx(LEADS?: KVNamespace) {
  return {
    request: new Request("https://councilof.ai/api/subscribe"),
    env: { LEADS },
  } as unknown as Parameters<typeof onRequestGet>[0];
}

describe("POST /api/subscribe", () => {
  it("stores the address under a subscribe: key and answers stored:true", async () => {
    const f = fakeKV();
    const r = await onRequestPost(
      postCtx({ email: "reader@example.com", source: "home-band" }, f.kv),
    );
    expect(r.status).toBe(200);
    expect(await r.json()).toStrictEqual({ ok: true, stored: true });
    const keys = [...f.store.keys()];
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatch(/^subscribe:\d{4}-\d{2}-\d{2}T/);
    const stored = JSON.parse(f.store.get(keys[0])!) as Record<string, unknown>;
    expect(stored.email).toBe("reader@example.com");
    expect(stored.source).toBe("home-band");
    expect(typeof stored.at).toBe("string");
  });

  it("without a binding it refuses to pretend: stored:false with the reason", async () => {
    const r = await onRequestPost(postCtx({ email: "reader@example.com" }));
    expect(r.status).toBe(200);
    const data = (await r.json()) as Record<string, unknown>;
    expect(data.stored).toBe(false);
    expect(String(data.reason)).toContain("bound");
  });

  it("rejects non-JSON and addressless bodies with 400", async () => {
    const bad = await onRequestPost(postCtx("not json", fakeKV().kv));
    expect(bad.status).toBe(400);
    const noEmail = await onRequestPost(postCtx({ email: "" }, fakeKV().kv));
    expect(noEmail.status).toBe(400);
  });

  it("rejects an over-long address whose @ falls outside the cap, and caps one inside it", async () => {
    // 500 a's then @: the 200-char cap removes the @, and an address without @ is rejected
    // rather than stored corrupted.
    const rejected = await onRequestPost(
      postCtx({ email: "a".repeat(500) + "@example.com" }, fakeKV().kv),
    );
    expect(rejected.status).toBe(400);

    const f = fakeKV();
    await onRequestPost(
      postCtx({ email: "b".repeat(190) + "@example.com" }, f.kv),
    );
    const key = [...f.store.keys()][0];
    const stored = JSON.parse(f.store.get(key)!) as { email: string };
    expect(stored.email.length).toBe(200);
    expect(stored.email.includes("@")).toBe(true);
  });
});

describe("GET /api/subscribe", () => {
  it("with LEADS populated, the body is exactly {bound:true} and never a key name", async () => {
    const f = fakeKV();
    await f.kv.put(
      "subscribe:2026-11-04T00:00:00.000Z:11111111-1111-4111-8111-111111111111",
      "{}",
    );
    const r = await onRequestGet(getCtx(f.kv));
    expect(r.status).toBe(200);
    const text = await r.text();
    expect(JSON.parse(text)).toStrictEqual({ bound: true });
    expect(text).not.toMatch(/subscribe:2|"keys"|"count"/);
  });

  it("answers exactly {bound:false} with no binding", async () => {
    const r = await onRequestGet(getCtx());
    expect(r.status).toBe(200);
    expect(await r.json()).toStrictEqual({ bound: false });
  });
});
