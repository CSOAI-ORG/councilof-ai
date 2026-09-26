/**
 * The fresh-capsule x402 door. Listing = challenge is the first test: the entry in
 * /.well-known/x402.json and the door's own 402 are compared field by field, so a buyer who reads
 * the listing signs exactly what the door will accept.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet, measure, PATH } from "./fresh-capsule";
import { onRequestGet as x402Json } from "../../.well-known/x402.json";
import { toLegacyNetwork } from "../_x402_config";
import { parseLexical, recomputeCapsuleId } from "../../_lib/measurementCapsule";

vi.setConfig({ testTimeout: 60_000 });
const ORIGIN = "https://councilof.ai";
afterEach(() => vi.unstubAllGlobals());

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const call = async (qs = "", headers: Record<string, string> = {}) => {
  const res = await onRequestGet({ request: new Request(`${ORIGIN}${PATH}${qs}`, { headers }), env: {} } as never);
  return { res, body: (await res.json()) as Any };
};

/** A fake MCP endpoint: its discovery documents and its initialize / tools/list answers. */
function fakeServer(opts: { card?: Any | null; tools: string[]; version?: string; protocol?: string }) {
  const seen: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    seen.push(url);
    if (url.endsWith("/.well-known/mcp/server-card.json"))
      return opts.card ? Response.json(opts.card) : new Response("nope", { status: 404 });
    if (url.endsWith("/.well-known/mcp.json")) return new Response("nope", { status: 404 });
    if (url === "https://svc.example/mcp") {
      const body = JSON.parse(String(init?.body ?? "{}"));
      if (body.method === "initialize")
        return Response.json({ jsonrpc: "2.0", id: 1, result: { protocolVersion: opts.protocol ?? "2025-06-18", serverInfo: { name: "svc", version: opts.version ?? "1.2.3" }, capabilities: { tools: {} } } }, { headers: { "mcp-session-id": "s1" } });
      if (body.method === "tools/list")
        return new Response(`event: message\ndata: ${JSON.stringify({ jsonrpc: "2.0", id: 2, result: { tools: opts.tools.map((name) => ({ name, inputSchema: { type: "object" } })) } })}\n\n`, { headers: { "content-type": "text/event-stream" } });
      return new Response(null, { status: 202 });
    }
    throw new Error(`unexpected fetch ${url}`);
  }));
  return seen;
}

describe("listing = challenge", () => {
  it("the x402.json entry carries exactly the door's 402 accepts (v2 verbatim, v1 by the settle path's projection)", async () => {
    const { res, body } = await call();
    expect(res.status).toBe(402);
    const header = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(res.headers.get("PAYMENT-REQUIRED")!), (ch) => ch.charCodeAt(0))));
    expect(header.accepts).toEqual(body.accepts);

    const listing = (await (await x402Json({ request: new Request(`${ORIGIN}/.well-known/x402.json`), env: {} } as never)).json()) as Any;
    const entry = (listing.resources as Any[]).find((r) => new URL(r.url).pathname === PATH)!;
    expect(entry, "the door is listed").toBeTruthy();
    expect(entry.url).toBe(body.resource.url);
    expect(entry.accepts_v2).toEqual(body.accepts);
    const c = body.accepts[0];
    const v1 = entry.accepts[0];
    expect(v1).toMatchObject({
      scheme: c.scheme,
      network: toLegacyNetwork(c.network),
      maxAmountRequired: c.amount,
      asset: c.asset,
      payTo: c.payTo,
      resource: c.resource,
      description: c.description,
      maxTimeoutSeconds: c.maxTimeoutSeconds,
      extra: { name: c.extra.name, version: c.extra.version },
    });
    expect(entry.description).toBe(c.description);
    expect(c.csoai_pricing.sku_id).toBe("request_attestation"); // the per-request pattern, no new price
    expect(c.csoai_pricing.tier).toBe("per_request");
  });
});

describe("the measurement", () => {
  it("CONSISTENT when the server card's tools equal the live tools/list; the id recomputes in the shared verifier", async () => {
    fakeServer({ card: { serverInfo: { version: "1.2.3" }, tools: [{ name: "b" }, { name: "a" }] }, tools: ["a", "b"] });
    const { capsule } = await measure("https://svc.example/mcp", "TOOLS");
    expect(capsule.measurement_state).toBe("CONSISTENT");
    expect(capsule.schema).toBe("csoai.measurement-capsule/0.2");
    expect(await recomputeCapsuleId(parseLexical(JSON.stringify(capsule)))).toBe(capsule.capsule_id);
    expect(Object.values(capsule.sources as Any).every((v) => /^[0-9a-f]{64}$/.test(String(v)))).toBe(true);
    expect(JSON.stringify(capsule)).not.toMatch(/"(verdict|score|rating|grade|decision|allow|approve)"/i);
  });

  it("INCONSISTENT when they differ — it says the statements disagree, not which is true", async () => {
    fakeServer({ card: { tools: ["a", "b", "c"] }, tools: ["a", "b"] });
    const { capsule } = await measure("https://svc.example/mcp", "TOOLS");
    expect(capsule.measurement_state).toBe("INCONSISTENT");
    expect(capsule.limitations).toContain("INCONSISTENT says two public statements disagree, not which one is true");
  });

  it("UNCHECKABLE with the reason when only the live surface spoke", async () => {
    fakeServer({ card: null, tools: ["a"] });
    const { capsule } = await measure("https://svc.example/mcp", "VERSION");
    expect(capsule.measurement_state).toBe("UNCHECKABLE");
    expect((capsule.differential as Any).reason).toBe("NO_DECLARING_SURFACE");
  });
});

describe("the door", () => {
  it("preview is free: the state, unsigned, no source digests", async () => {
    fakeServer({ card: { tools: ["a"] }, tools: ["a"] });
    const { res, body } = await call("?endpoint=https://svc.example/mcp&dimension=tools&preview=1");
    expect(res.status).toBe(200);
    expect(body.capsule.measurement_state).toBe("CONSISTENT");
    expect(body.capsule.sources).toBeUndefined();
    expect(body.capsule.capsule_id).toBeNull();
    expect(body.doctrine).toBe("measurement, not endorsement");
  });

  it("read before settle: an UNCHECKABLE read answers 402 again and never reaches a facilitator", async () => {
    const seen = fakeServer({ card: null, tools: ["a"] });
    const { res, body } = await call("?endpoint=https://svc.example/mcp&dimension=TOOLS", { "X-PAYMENT": "e30=" });
    expect(res.status).toBe(402);
    expect(body.csoai.read_before_settle).toMatchObject({ state: "UNCHECKABLE", settled: false });
    expect(seen.every((u) => u.startsWith("https://svc.example/"))).toBe(true);
  });

  it("refuses non-public targets before any read, and never settles bad input", async () => {
    const seen = fakeServer({ card: null, tools: [] });
    for (const ep of ["http://svc.example/mcp", "https://127.0.0.1/mcp", "https://localhost/mcp", "https://svc.internal/mcp", "https://svc.example:8443/mcp", "https://u:p@svc.example/mcp"]) {
      const { res, body } = await call(`?endpoint=${encodeURIComponent(ep)}&dimension=TOOLS&preview=1`);
      expect(res.status, ep).toBe(400);
      expect(body.settled).toBe(false);
    }
    const { res } = await call("?endpoint=https://svc.example/mcp&dimension=AUTH", { "X-PAYMENT": "e30=" });
    expect(res.status).toBe(400);
    expect(seen).toEqual([]);
  });
});
