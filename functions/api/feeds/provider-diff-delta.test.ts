import { describe, expect, it, vi } from "vitest";

/**
 * B06: "provider-diff-feed delivers only the delta since the last receipt."
 *
 * It did not. The paid batch was identical on every call — index, state, every leaf, root — so a
 * subscriber who paid twice received the same bytes twice and had no reason to buy again. There
 * was no since/cursor/after parameter anywhere in the handler; grep found only `last_run`, a
 * field of the index rather than a request parameter.
 */
const INDEX = {
  as_of: "2026-09-05T00:00:00Z",
  recent_diffs: [
    { id: "a/pricing", leaf: "/feeds/provider-diff/leaves/a.json", fetched_at: "2026-09-01T00:00:00Z" },
    { id: "b/pricing", leaf: "/feeds/provider-diff/leaves/b.json", fetched_at: "2026-09-04T00:00:00Z" },
    { id: "c/pricing", leaf: "/feeds/provider-diff/leaves/c.json", fetched_at: "2026-09-05T12:00:00Z" },
    { id: "d/no-date", leaf: "/feeds/provider-diff/leaves/d.json" },
  ],
};

const call = async (qs: string) => {
  vi.resetModules();
  const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
    const u = String(input);
    if (u.includes("/feeds/provider-diff/index.json")) return new Response(JSON.stringify(INDEX), { status: 200 });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  });
  const x402 = await import("../_x402");
  const spy = vi.spyOn(x402, "verifyX402Payment").mockResolvedValue({ ok: true } as never);
  try {
    const { onRequestGet } = await import("./provider-diff");
    const r = (await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({
      request: new Request(`https://councilof.ai/api/feeds/provider-diff?history=1${qs}`),
      env: {},
    })) as Response;
    return { status: r.status, body: (await r.json()) as Record<string, unknown> };
  } finally {
    spy.mockRestore();
    fetchSpy.mockRestore();
  }
};

describe("provider-diff returns a delta, not the whole batch every time", () => {
  it("returns everything when no cursor is given — unchanged behaviour", async () => {
    const { status, body } = await call("");
    expect(status).toBe(200);
    expect((body.delta as Record<string, unknown>).returned).toBe(4);
    expect((body.delta as Record<string, unknown>).since).toBeNull();
  });

  it("returns only what is newer than the cursor", async () => {
    const { body } = await call("&since=2026-09-03T00:00:00Z");
    const d = body.delta as Record<string, unknown>;
    expect(d.returned).toBe(3); // b, c, and the undated one
    expect(d.total_available).toBe(4);
    expect(Object.keys(body.leaves as object)).not.toContain("/feeds/provider-diff/leaves/a.json");
  });

  it("includes a diff with no readable fetched_at rather than withholding a paid row", async () => {
    const { body } = await call("&since=2026-09-05T23:00:00Z");
    expect(Object.keys(body.leaves as object)).toContain("/feeds/provider-diff/leaves/d.json");
  });

  it("rejects a malformed cursor instead of silently billing for a full batch", async () => {
    const { status, body } = await call("&since=last-tuesday");
    expect(status).toBe(400);
    expect(String(body.reason)).toMatch(/ISO-8601/);
  });
});
