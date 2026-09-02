import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";
import { PAID_TOOL_NAMES, buildPaidRequest } from "./_paid";
import PAID from "./paid-tools.json";
import FREE from "./gspc-tools.json";

const ORIGIN = "https://councilof.ai";
const call = async (body: unknown, env: Record<string, unknown> = {}) =>
  onRequest({ request: new Request(`${ORIGIN}/mcp`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), env, params: {} } as never);
const rpc = (method: string, params?: unknown, id = 1) => ({ jsonrpc: "2.0", id, method, ...(params ? { params } : {}) });

const FREE_SEVEN = ["board_totals", "get_axis", "verify_card", "list_cards", "get_root", "get_card", "verify_inclusion"];
const PAID_FIVE = ["commission_card", "art50_marking_evidence", "rwa_evidence", "witness_hash", "receipts_batch"];

/** A fake origin: routes answer 402 (with a v2 body + header), 200 when x-payment is present, 404 when absent. */
function stubOrigin(opts: { deployed: string[]; paidOk?: boolean }) {
  const seen: Request[] = [];
  vi.stubGlobal("fetch", async (u: string | URL | Request, init?: RequestInit) => {
    const req = u instanceof Request ? u : new Request(String(u), init);
    seen.push(req);
    const url = new URL(req.url);
    if (!opts.deployed.includes(url.pathname)) return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
    if (req.headers.get("x-payment") && opts.paidOk !== false) {
      return new Response(JSON.stringify({ schema: "x", kind: "deliverable", route: url.pathname }), { status: 200, headers: { "x-payment-response": "c2V0dGxlZA==" } });
    }
    const pr = { x402Version: 2, accepts: [{ scheme: "exact", network: "eip155:8453", amount: "100000", payTo: "0xpay" }], extensions: { bazaar: { info: {}, schema: {} } }, csoai: { preview: { route: url.pathname } } };
    return new Response(JSON.stringify(pr), { status: 402, headers: { "PAYMENT-REQUIRED": btoa(JSON.stringify(pr)) } });
  });
  return seen;
}
afterEach(() => vi.unstubAllGlobals());

describe("/mcp tools/list — seven free + five paid, catalogue free, nothing labelled safe", () => {
  it("lists the free seven first and the paid five after, one definitions file each", async () => {
    const r = await (await call(rpc("tools/list"))).json();
    const names = r.result.tools.map((t: { name: string }) => t.name);
    expect(names).toEqual([...FREE_SEVEN, ...PAID_FIVE]);
    expect((FREE as { tools: unknown[] }).tools).toHaveLength(7);
    expect((PAID as { tools: unknown[] }).tools).toHaveLength(5);
    expect([...PAID_TOOL_NAMES]).toEqual(PAID_FIVE);
  });

  it("every paid definition says PAID, names measurement not certification, and never 'safe' / 'verified registry'", () => {
    for (const t of (PAID as { tools: { name: string; description: string; inputSchema: { properties: Record<string, unknown> }; csoai: { paid: boolean; route: string } }[] }).tools) {
      expect(t.description, t.name).toMatch(/^PAID \(x402/);
      expect(t.description, t.name).toMatch(/[Mm]easurement, not certification|never a conformity|not a rating|never a conclusion/);
      expect(t.description, t.name).not.toMatch(/\bsafe\b|verified registry|approved/i);
      expect(t.inputSchema.properties, t.name).toHaveProperty("x_payment");
      expect(t.csoai.paid).toBe(true);
      expect(t.csoai.route).toMatch(/^\/api\//);
    }
    expect((PAID as { note: string }).note).toMatch(/stdio stays free-only/);
    expect(JSON.stringify(PAID)).not.toMatch(/[£$€]\s?\d/);
  });

  it("the free seven definitions are byte-identical to what the stdio server reads (no drift)", async () => {
    const { readFileSync } = await import("node:fs");
    const canonical = JSON.parse(readFileSync(new URL("./gspc-tools.json", import.meta.url), "utf8"));
    expect(canonical.tools.map((t: { name: string }) => t.name)).toEqual(FREE_SEVEN);
    expect(canonical.tools.some((t: { name: string }) => PAID_FIVE.includes(t.name))).toBe(false);
  });

  it("GET /mcp discovery and initialize name the paid tools and the stdio free-only rule", async () => {
    const g = await (await onRequest({ request: new Request(`${ORIGIN}/mcp`), env: {}, params: {} } as never)).json();
    expect(g.paid_tools.names).toEqual(PAID_FIVE);
    expect(g.paid_tools.doctrine).toMatch(/measurement, not certification/);
    expect(g.stdio_alternative).toMatch(/free-only/);
    const i = await (await call(rpc("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "t", version: "0" } }))).json();
    expect(i.result.instructions).toMatch(/Five paid tools/);
    expect(i.result.instructions).toMatch(/Measurement, not certification/);
  });
});

describe("/mcp tools/call — paid tools", () => {
  it("unpaid: returns the route's 402 challenge as structuredContent (not an error), forwarding exactly the route path", async () => {
    const seen = stubOrigin({ deployed: ["/api/request-attestation", "/api/receipts/batch"] });
    const r = await (await call(rpc("tools/call", { name: "commission_card", arguments: { subject: "qwen3", axis: "gov" } }))).json();
    expect(r.result.isError).toBe(false);
    const sc = r.result.structuredContent;
    expect(sc.status).toBe("PAYMENT_REQUIRED");
    expect(sc.payment_required.accepts[0]).toMatchObject({ scheme: "exact", network: "eip155:8453", payTo: "0xpay" });
    expect(sc.payment_required_header).toBeTruthy();
    expect(sc.nothing_charged).toBe(true);
    expect(sc.not_a_certification).toBe(true);
    expect(r.result.content[0].text).toMatch(/^PAYMENT_REQUIRED/);
    expect(seen).toHaveLength(1);
    const u = new URL(seen[0].url);
    expect(u.origin + u.pathname).toBe(`${ORIGIN}/api/request-attestation`);
    expect(u.searchParams.get("subject")).toBe("qwen3");
    expect(u.searchParams.get("axis")).toBe("gov");
    expect(seen[0].headers.get("x-payment")).toBeNull();
  });

  it("paid: forwards x_payment as the X-PAYMENT header verbatim and returns the deliverable + settle echo", async () => {
    const seen = stubOrigin({ deployed: ["/api/receipts/batch"] });
    const r = await (await call(rpc("tools/call", { name: "receipts_batch", arguments: { from: "2026-08-31T00:00:00Z", to: "2026-09-01T00:00:00Z", x_payment: "eyJ4NDAyIjoxfQ==" } }))).json();
    const sc = r.result.structuredContent;
    expect(sc.status).toBe("DELIVERED");
    expect(sc.deliverable).toMatchObject({ kind: "deliverable", route: "/api/receipts/batch" });
    expect(sc.payment_response_header).toBe("c2V0dGxlZA==");
    expect(seen[0].headers.get("x-payment")).toBe("eyJ4NDAyIjoxfQ==");
    expect(new URL(seen[0].url).searchParams.get("from")).toBe("2026-08-31T00:00:00Z");
  });

  it("preview=true is forwarded as the free preview flag (no payment needed)", async () => {
    const seen = stubOrigin({ deployed: ["/api/receipts/batch"] });
    await call(rpc("tools/call", { name: "receipts_batch", arguments: { from: "2026-08-31T00:00:00Z", preview: true } }));
    expect(new URL(seen[0].url).searchParams.get("preview")).toBe("1");
  });

  it("a route not on this origin yet answers NOT_DEPLOYED — nothing invented, nothing charged", async () => {
    stubOrigin({ deployed: [] });
    for (const [name, args] of [
      ["art50_marking_evidence", { url: "https://example.org/a.jpg" }],
      ["rwa_evidence", { asset: "RLUSD" }],
      ["witness_hash", { sha256: "0".repeat(64) }],
    ] as const) {
      const r = await (await call(rpc("tools/call", { name, arguments: args }))).json();
      expect(r.result.structuredContent.status, name).toBe("NOT_DEPLOYED");
      expect(r.result.structuredContent.reason, name).toMatch(/PR #11(58|62|63)/);
      expect(r.result.isError, name).toBe(false);
    }
  });

  it("bad arguments are refused before any fetch; the free seven still dispatch to their own handler", async () => {
    const seen = stubOrigin({ deployed: [] });
    const r = await (await call(rpc("tools/call", { name: "witness_hash", arguments: {} }))).json();
    expect(r.result.structuredContent.status).toBe("BAD_ARGUMENTS");
    expect(r.result.isError).toBe(true);
    expect(seen).toHaveLength(0);
    // The free tools are untouched by the paid layer: get_root goes to /root.json, not to a paid route.
    await call(rpc("tools/call", { name: "get_root", arguments: {} }));
    expect(seen.map((q) => new URL(q.url).pathname)).toEqual(["/root.json"]);
  });

  it("buildPaidRequest pins each tool to its declared route and never to a caller-supplied URL", () => {
    const b = buildPaidRequest("art50_marking_evidence", { bytes_b64: "AAAA", url: "https://evil.example/x" }, ORIGIN);
    expect("req" in b).toBe(true);
    if ("req" in b) {
      expect(new URL(b.req.url).pathname).toBe("/api/art50/marking-evidence");
      expect(b.req.method).toBe("POST");
    }
    const w = buildPaidRequest("witness_hash", { sha256: "A".repeat(64), label: "hello" }, ORIGIN);
    if ("req" in w) expect(new URL(w.req.url).searchParams.get("sha256")).toBe("a".repeat(64));
    expect(buildPaidRequest("nope", {}, ORIGIN)).toEqual({ error: "unknown paid tool: nope" });
  });
});
