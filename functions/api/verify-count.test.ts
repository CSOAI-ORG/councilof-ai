import { describe, expect, it } from "vitest";
import { onRequestGet, onRequestPost, bucketKeyFor, countOne } from "./verify-count";

/** A minimal fake of the WORKER_STATE_KV binding: records every put, optionally throws. */
function fakeKV(opts: { fail?: boolean } = {}) {
  const store = new Map<string, string>();
  const puts: { key: string; value: string; options: unknown }[] = [];
  return {
    store,
    puts,
    async get(key: string) {
      if (opts.fail) throw new Error("kv read failed");
      return store.get(key) ?? null;
    },
    async put(key: string, value: string, options: unknown) {
      if (opts.fail) throw new Error("kv write failed");
      puts.push({ key, value, options });
      store.set(key, value);
    },
  };
}

type Ctx = Parameters<typeof onRequestPost>[0];
const ctxWith = (env: unknown) => ({ env }) as Ctx;

describe("POST /api/verify-count — aggregate-only execution counter", () => {
  it("increments the day bucket (fake KV)", async () => {
    const kv = fakeKV();
    kv.store.set(bucketKeyFor(), "41");
    const response = await onRequestPost(ctxWith({ WORKER_STATE_KV: kv }));
    expect(response.status).toBe(204);
    const stored = kv.store.get(bucketKeyFor());
    expect(stored).toBe("42");
    expect(kv.puts).toHaveLength(1);
    // the bucket carries a long TTL so the landing workflow owns retention, not request-time expiry
    expect((kv.puts[0].options as { expirationTtl?: number }).expirationTtl).toBeGreaterThan(365 * 24 * 60 * 60);
  });

  it("creates the bucket when none exists — never a fabricated zero read", async () => {
    const kv = fakeKV();
    await countOne({ WORKER_STATE_KV: kv });
    expect(kv.store.get(bucketKeyFor())).toBe("1");
  });

  it("still answers 204 when KV throws on read or write", async () => {
    const throwing = fakeKV({ fail: true });
    const response = await onRequestPost(ctxWith({ WORKER_STATE_KV: throwing }));
    expect(response.status).toBe(204);
    expect(throwing.puts).toHaveLength(0);
    // an unbound binding is the same honest nothing
    const unbound = await onRequestPost(ctxWith({}));
    expect(unbound.status).toBe(204);
  });

  it("never echoes or stores anything from the request body", async () => {
    const kv = fakeKV();
    // A payload carrying what this endpoint must never see: a card id, a signature fragment,
    // a person-shaped string. The endpoint ignores the body entirely.
    const leaked =
      "the record's sha256 is 3b1f9e7c0a4d2e8f6b5c1a9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f and " +
      "its signature is 9a2b and the checker was nicholas@example.com";
    const request = new Request("https://councilof.ai/api/verify-count", {
      method: "POST",
      body: JSON.stringify({ card_id: "3b1f9e7c0a4d2e8f", result: "VALID", checker: "nicholas@example.com", signature: "9a2b" }),
      headers: { "content-type": "application/json" },
    });
    const response = await onRequestPost({ request, env: { WORKER_STATE_KV: kv } } as unknown as Ctx);
    expect(response.status).toBe(204);
    const body = await response.text();
    expect(body).toBe(""); // 204 carries no body, so nothing can be reflected
    // and the stored bytes hold only the counter
    expect(kv.puts).toHaveLength(1);
    expect(kv.puts[0].value).toBe("1");
    for (const stored of kv.store.values()) expect(stored).not.toContain("3b1f9e7c0a4d2e8f");
    for (const stored of kv.store.values()) expect(stored).not.toContain("nicholas@example.com");
    for (const stored of kv.store.values()) expect(stored).not.toContain("9a2b");
    expect(kv.puts[0].key).toMatch(/^verify-exec:\d{4}-\d{2}-\d{2}$/);
    expect(leaked).toContain("3b1f9e7c0a4d2e8f"); // the fixture itself really carried the marker
  });

  it("answers GET with the POST-only capability statement", async () => {
    const response = await onRequestGet({} as Parameters<typeof onRequestGet>[0]);
    expect(response.status).toBe(405);
    const body = (await response.json()) as { endpoint: string; state: string; note: string };
    expect(body.endpoint).toBe("/api/verify-count");
    expect(body.state).toBe("NOT_IMPLEMENTED");
    expect(body.note).toContain("No job, report, subscription, card, or receipt was created");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
  });
});
