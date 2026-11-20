import { describe, expect, it } from "vitest";
import { onRequestGet, onRequestHead, onRequestPost } from "./contact";

function fakeKV() {
  const store = new Map<string, string>();
  const kv = {
    put: async (k: string, v: string) => void store.set(k, v),
    get: async (k: string) => store.get(k) ?? null,
    list: async () => {
      throw new Error("GET /api/contact must never list LEADS");
    },
  } as unknown as KVNamespace;
  return { kv, store };
}

describe("GET / HEAD /api/contact", () => {
  it("reports {bound:true} with no-store and answers HEAD without touching KV entries", async () => {
    const { kv } = fakeKV();
    const res = await onRequestGet({
      request: new Request("https://councilof.ai/api/contact"),
      env: { LEADS: kv },
    } as Parameters<typeof onRequestGet>[0]);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toStrictEqual({ bound: true });

    const head = await onRequestHead({
      request: new Request("https://councilof.ai/api/contact", { method: "HEAD" }),
      env: { LEADS: kv },
    } as Parameters<typeof onRequestHead>[0]);
    expect(head.status).toBe(200);
    expect(await head.text()).toBe("");
  });

  it("reports {bound:false} when LEADS is unbound", async () => {
    const res = await onRequestGet({
      request: new Request("https://councilof.ai/api/contact"),
      env: {},
    } as Parameters<typeof onRequestGet>[0]);
    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ bound: false });
  });
});

describe("POST /api/contact", () => {
  it("stores under contact:<iso>:<uuid>, confirms readback, and returns stored:true", async () => {
    const { kv, store } = fakeKV();
    const res = await onRequestPost({
      request: new Request("https://councilof.ai/api/contact", {
        method: "POST",
        body: JSON.stringify({ email: "buyer@example.org", message: "Need Article 50 pack invoice" }),
      }),
      env: { LEADS: kv },
    } as Parameters<typeof onRequestPost>[0]);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.ok).toBe(true);
    expect(body.stored).toBe(true);
    expect(body.state).toBe("STORED_READBACK_CONFIRMED");
    expect(String(body.receipt_id)).toMatch(/^contact:/);
    expect(store.size).toBe(1);
  });

  it("honestly reports stored:false when LEADS is unbound", async () => {
    const res = await onRequestPost({
      request: new Request("https://councilof.ai/api/contact", {
        method: "POST",
        body: JSON.stringify({ email: "buyer@example.org", message: "hello" }),
      }),
      env: {},
    } as Parameters<typeof onRequestPost>[0]);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.stored).toBe(false);
    expect(String(body.fallback)).toContain("nicholas@csoai.org");
  });
});
