import { describe, expect, it, vi } from "vitest";
import { readQuotes } from "./x402-quotes";

const ORIGIN = "https://councilof.ai";
const CHALLENGE = { x402Version: 2, accepts: [{ scheme: "exact", network: "eip155:8453" }], error: "payment required" };
const MANIFEST = {
  resources: [
    { url: `${ORIGIN}/api/proof?bundle=1`, method: "GET" },
    { url: `${ORIGIN}/api/free-door`, method: "GET" },
    { url: "https://elsewhere.example/api/door", method: "GET" },
    { url: "not-a-url" },
  ],
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("/api/x402-quotes relays each door's own unpaid answer", () => {
  it("returns each same-origin door's status and body verbatim, and asks nothing else", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url);
      expect((init?.headers as Record<string, string> | undefined)?.["x-payment"]).toBeUndefined();
      if (u.endsWith("/.well-known/x402.json")) return json(200, MANIFEST);
      if (u.includes("/api/proof")) return json(402, CHALLENGE);
      if (u.includes("/api/free-door")) return json(200, { ok: true });
      throw new Error(`unexpected subrequest ${u}`);
    }) as unknown as typeof fetch;
    const r = await readQuotes(ORIGIN, fetchImpl);
    expect(r.kind).toBe("MEASURED");
    expect(r.quotes).toHaveLength(3);
    expect(r.quotes[0]).toMatchObject({ http: 402, body: CHALLENGE, error: null, skipped: null });
    expect(r.quotes[1]).toMatchObject({ http: 200, body: { ok: true } });
    expect(r.quotes[2]).toMatchObject({ http: null, body: null, skipped: "not a door on this origin" });
    // manifest + two same-origin doors; the foreign host is never contacted
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(3);
  });

  it("reports an unreachable door with its error and no substituted body", async () => {
    const fetchImpl = (async (url: string | URL | Request) => {
      if (String(url).endsWith("/.well-known/x402.json")) return json(200, { resources: [MANIFEST.resources[0]] });
      throw new Error("connection reset");
    }) as unknown as typeof fetch;
    const r = await readQuotes(ORIGIN, fetchImpl);
    expect(r.quotes[0]).toMatchObject({ http: null, body: null, error: "connection reset" });
  });

  it("is UNCHECKABLE, with no rows, when the manifest cannot be read", async () => {
    const r = await readQuotes(ORIGIN, (async () => json(503, {})) as unknown as typeof fetch);
    expect(r.kind).toBe("UNCHECKABLE");
    expect(r.quotes).toEqual([]);
    expect(r.reason).toContain("HTTP 503");
  });
});
