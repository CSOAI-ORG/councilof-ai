/**
 * Self-serve RAS doors — the unit contract. The network is stubbed; the facilitator is a stub HOST
 * (f.example), never a stubbed verifyX402Payment: the real verify → settle code runs in every paid
 * test, so a door that cannot fulfil cannot pass here (see the buyer's-eye note in
 * functions/api/_manifest_doors.test.ts). Live runs against real endpoints: ras.live.test.ts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { onRequestGet as mcpDoor, classify, parseJsonRpc } from "./mcp-probe";
import { onRequestGet as x402Door, censusRow, decodeHeaderJson } from "./x402-check";
import { onRequestGet as supplyDoor, parseIssuerMd, EVM_LEDGERS } from "./supply";
import { checkUrlSyntax, checkUrl, guardedFetch, isNonPublicIp, type Resolver } from "../_ras_net";
import { keccak256, toHex, verifyEip1186, headerHash, rlpDecode, rlpEncode } from "../_evm_proof";
import { onRequestGet as verifyGet, onRequestPost as verifyPost } from "../verify";
import { onRequestGet as indexGet } from "../x402/[name]";
import { onRequestGet as manifest } from "../../.well-known/x402.json";
import { onRequestGet as catalogue } from "../x402";
import { ESTATE_PAY_TO } from "../_x402_config";
import { USDC_BASE } from "../_skus";
import { signPayload, verifyLeaf } from "../../_lib/cardSign";

const ORIGIN = "https://councilof.ai";
const PAY = btoa(JSON.stringify({ x402Version: 2, scheme: "exact", network: "eip155:8453", payload: {} }));
const PAY2 = btoa(JSON.stringify({ x402Version: 2, scheme: "exact", network: "eip155:8453", payload: { authorization: { nonce: "0x" + "22".repeat(32) } } }));
const LIVE = { X402_FACILITATOR_URL: "https://f.example" };
const ctx = (path: string, env: Record<string, unknown> = {}, headers: Record<string, string> = {}, method = "GET", body?: string) =>
  ({ request: new Request(ORIGIN + path, { method, headers, body }), env, params: {} }) as never;
const call = (h: unknown, c: unknown) => (h as (x: unknown) => Promise<Response>)(c);

/** name → addresses for the DoH stub. */
const DNS: Record<string, string[]> = {
  "mcp.example.org": ["93.184.216.34"],
  "shop.example.org": ["93.184.216.35"],
  "evil.example.org": ["10.0.0.5"],
  "mixed.example.org": ["93.184.216.36", "169.254.169.254"],
  "meta.example.org": ["fd00:ec2::254"],
};

type Route = (url: URL, init?: RequestInit) => Response | Promise<Response> | undefined;
type Net = { calls: string[]; facilitator: string[] };

/** One fetch stub: DoH, the facilitator, then per-test routes. Anything else throws (no silent network). */
function stubNet(route: Route, opts: { dohDown?: boolean } = {}): Net {
  const net: Net = { calls: [], facilitator: [] };
  vi.stubGlobal("fetch", async (u: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    net.calls.push(url.toString());
    if (url.host === "cloudflare-dns.com") {
      if (opts.dohDown) return new Response("down", { status: 502 });
      const name = url.searchParams.get("name") || "";
      const type = url.searchParams.get("type");
      const addrs = (DNS[name] || []).filter((a) => (type === "AAAA" ? a.includes(":") : !a.includes(":")));
      if (!DNS[name]) return Response.json({ Status: 3 });
      return Response.json({ Status: 0, Answer: addrs.map((data) => ({ type: type === "AAAA" ? 28 : 1, data })) });
    }
    if (url.host === "f.example") {
      net.facilitator.push(url.pathname);
      if (url.pathname.endsWith("/supported")) return new Response("nope", { status: 404 });
      if (url.pathname.endsWith("/settle")) return Response.json({ success: true, transaction: "0xtx", network: "base", payer: "0xp" });
      return Response.json({ isValid: true });
    }
    const r = await route(url, init);
    if (r) return r;
    throw new TypeError(`unexpected network call in test: ${url}`);
  });
  return net;
}

afterEach(() => vi.unstubAllGlobals());
// Network-free, but the shared Oracle runner is slow under load; a 5 s default reads as a failure there.
vi.setConfig({ testTimeout: 30_000 });

// ─────────────────────────────────────────────────────────────── SSRF
describe("SSRF guard — syntax (no network)", () => {
  const refused: [string, string][] = [
    ["http://example.org/mcp", "NOT_HTTPS"],
    ["ftp://example.org/", "NOT_HTTPS"],
    ["https://example.org:8443/mcp", "NON_DEFAULT_PORT"],
    ["https://user:pw@example.org/mcp", "USERINFO_IN_URL"],
    ["https://localhost/mcp", "NON_PUBLIC_HOSTNAME"],
    ["https://intranet/mcp", "NON_PUBLIC_HOSTNAME"],
    ["https://db.internal/mcp", "NON_PUBLIC_HOSTNAME"],
    ["https://printer.local/", "NON_PUBLIC_HOSTNAME"],
    ["https://x.home.arpa/", "NON_PUBLIC_HOSTNAME"],
    ["https://127.0.0.1/mcp", "NON_PUBLIC_IP"],
    ["https://2130706433/mcp", "NON_PUBLIC_IP"], // decimal 127.0.0.1, normalised by the URL parser
    ["https://0x7f.0.0.1/mcp", "NON_PUBLIC_IP"],
    ["https://10.1.2.3/", "NON_PUBLIC_IP"],
    ["https://172.16.0.1/", "NON_PUBLIC_IP"],
    ["https://192.168.1.1/", "NON_PUBLIC_IP"],
    ["https://100.64.0.1/", "NON_PUBLIC_IP"],
    ["https://169.254.169.254/latest/meta-data/", "NON_PUBLIC_IP"], // AWS/GCP/Azure IMDS
    ["https://100.100.100.200/latest/meta-data/", "NON_PUBLIC_IP"], // Alibaba metadata
    ["https://168.63.129.16/", "NON_PUBLIC_IP"], // Azure wireserver (public range)
    ["https://0.0.0.0/", "NON_PUBLIC_IP"],
    ["https://224.0.0.1/", "NON_PUBLIC_IP"],
    ["https://[::1]/mcp", "NON_PUBLIC_IP"],
    ["https://[fd00:ec2::254]/", "NON_PUBLIC_IP"], // AWS IMDS over IPv6
    ["https://[fe80::1]/", "NON_PUBLIC_IP"],
    ["https://[::ffff:127.0.0.1]/", "NON_PUBLIC_IP"],
    ["https://[::ffff:8.8.8.8]/", "NON_PUBLIC_IP"], // mapped literals are refused whatever they map
    ["https://[64:ff9b::7f00:1]/", "NON_PUBLIC_IP"], // NAT64 of 127.0.0.1
    ["https://[2002:7f00:1::]/", "NON_PUBLIC_IP"], // 6to4
    ["not a url", "BAD_URL"],
  ];
  it.each(refused)("refuses %s (%s)", (u, reason) => {
    const r = checkUrlSyntax(u);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe(reason);
  });
  it.each(["https://example.org/mcp", "https://1.1.1.1/", "https://[2606:4700:4700::1111]/", "https://councilof.ai/mcp"])("accepts public %s", (u) => {
    expect(checkUrlSyntax(u).ok).toBe(true);
  });
  it("classifies addresses the resolver returns", () => {
    for (const a of ["10.0.0.5", "127.0.0.1", "169.254.169.254", "fd00:ec2::254", "::1", "fe80::abcd"]) expect(isNonPublicIp(a), a).toBe(true);
    for (const a of ["93.184.216.34", "1.1.1.1", "2606:4700:4700::1111"]) expect(isNonPublicIp(a), a).toBe(false);
  });
});

describe("SSRF guard — DNS and redirects", () => {
  const resolver: Resolver = async (h) => (DNS[h] ? { state: "RESOLVED", addresses: DNS[h] } : { state: "UNRESOLVED" });

  it("refuses a public name that resolves to a private address, and one with ANY bad record", async () => {
    const a = await checkUrl("https://evil.example.org/mcp", resolver);
    expect(a.ok).toBe(false);
    if (!a.ok) expect(a.reason).toBe("RESOLVES_TO_NON_PUBLIC_IP");
    const b = await checkUrl("https://mixed.example.org/mcp", resolver);
    expect(b.ok).toBe(false);
    const c = await checkUrl("https://meta.example.org/", resolver);
    expect(c.ok).toBe(false);
  });

  it("fails CLOSED when DNS cannot be read", async () => {
    const r = await checkUrl("https://mcp.example.org/", async () => ({ state: "UNAVAILABLE", detail: "DoH 502" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("DNS_CHECK_UNAVAILABLE");
  });

  it("a redirect to the metadata IP is refused and the metadata IP is never fetched", async () => {
    const net = stubNet((url) => (url.host === "shop.example.org" ? new Response(null, { status: 302, headers: { location: "http://169.254.169.254/latest/meta-data/" } }) : undefined));
    const out = await guardedFetch("https://shop.example.org/pay", { timeoutMs: 5000, maxBytes: 1024, maxRedirects: 5 });
    expect(out.kind).toBe("BLOCKED");
    if (out.kind === "BLOCKED") expect(out.reason).toBe("REDIRECT_TO_BLOCKED");
    expect(net.calls.some((c) => c.includes("169.254.169.254"))).toBe(false);
  });

  it("a redirect to a public name that resolves privately is refused before it is fetched", async () => {
    const net = stubNet((url) => (url.host === "shop.example.org" ? new Response(null, { status: 307, headers: { location: "https://evil.example.org/x" } }) : undefined));
    const out = await guardedFetch("https://shop.example.org/pay", { timeoutMs: 5000, maxBytes: 1024, maxRedirects: 5 });
    expect(out.kind).toBe("BLOCKED");
    expect(net.calls.some((c) => c.startsWith("https://evil.example.org"))).toBe(false);
  });

  it("a redirect loop stops at the hop cap", async () => {
    stubNet((url) => (url.host === "shop.example.org" ? new Response(null, { status: 302, headers: { location: "https://shop.example.org/again" } }) : undefined));
    const out = await guardedFetch("https://shop.example.org/pay", { timeoutMs: 5000, maxBytes: 1024, maxRedirects: 3 });
    expect(out.kind).toBe("BLOCKED");
    if (out.kind === "BLOCKED") expect(out.reason).toBe("TOO_MANY_REDIRECTS");
  });

  it("caps the body and says so", async () => {
    stubNet((url) => (url.host === "shop.example.org" ? new Response("x".repeat(5000)) : undefined));
    const out = await guardedFetch("https://shop.example.org/big", { timeoutMs: 5000, maxBytes: 1000, maxRedirects: 0 });
    expect(out.kind).toBe("RESPONSE");
    if (out.kind === "RESPONSE") { expect(out.body.byteLength).toBe(1000); expect(out.truncated).toBe(true); }
  });
});

// ─────────────────────────────────────────────────────────────── 402 behaviour
const DOORS: [string, unknown, string][] = [
  ["mcp-probe", mcpDoor, "/api/ras/mcp-probe?url=https://mcp.example.org/mcp"],
  ["x402-check", x402Door, "/api/ras/x402-check?url=https://shop.example.org/pay"],
  ["supply", supplyDoor, "/api/ras/supply?asset=USDC&ledger=ethereum"],
];

describe("payment required — the exact scheme fields, and no computation before payment", () => {
  it.each(DOORS)("%s: bare GET is a v2 402 with PAYMENT-REQUIRED, exact/Base/USDC, path-scoped resource, bazaar; nothing fetched", async (name, door, path) => {
    const net = stubNet(() => undefined);
    const r = await call(door, ctx(path, LIVE));
    expect(r.status).toBe(402);
    const header = r.headers.get("PAYMENT-REQUIRED");
    expect(header).toBeTruthy();
    const b = (await r.json()) as any;
    const h = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(header!), (c) => c.charCodeAt(0)))); // base64 of UTF-8 bytes
    for (const pr of [b, h]) {
      expect(pr.x402Version).toBe(2);
      const a = pr.accepts[0];
      expect(a.scheme).toBe("exact");
      expect(a.network).toBe("eip155:8453");
      expect(a.asset).toBe(USDC_BASE.asset);
      expect(a.payTo).toBe(ESTATE_PAY_TO);
      expect(a.extra).toMatchObject({ name: "USD Coin", version: "2" });
      expect(Number(a.amount)).toBeGreaterThan(0); // a paid door never advertises 0 (buyer's-eye rule)
      expect(a.maxTimeoutSeconds).toBe(300);
      expect(pr.resource.url).toBe(`${ORIGIN}/api/ras/${name}`); // a buyer's target never becomes a catalogue row
    }
    // PAYMENT-REQUIRED (x402 v2; coordinator ruling 3 of 2026-09-26, amended 2026-09-27): the header carries
    // the payment subset plus the body's extensions.bazaar — a v2 client echoes extensions from the decoded
    // header (bazaar.md: without it "discovery cataloging will not occur") — and stays under 4 KiB.
    expect(h.extensions).toEqual({ bazaar: b.extensions.bazaar });
    expect(header!.length).toBeLessThan(4096);
    expect(b.extensions.bazaar.info.input).toMatchObject({ type: "http", method: "GET" });
    // the bazaar blob satisfies its own schema: every info.input key is declared
    const inputProps = Object.keys(b.extensions.bazaar.schema.properties.input.properties);
    for (const k of Object.keys(b.extensions.bazaar.info.input)) expect(inputProps).toContain(k);
    expect(b.accepts[0].csoai_pricing.pricing_basis).toBe("STANDARD"); // fresh compute is never the existing-data promo
    expect(b.csoai.payment_changes_result).toBe(false);
    expect(b.csoai.board_effect).toMatch(/^none/);
    // No DNS, no target, no facilitator settle: an unpaid request computes nothing.
    expect(net.calls.filter((c) => !c.startsWith("https://f.example"))).toEqual([]);
    expect(net.facilitator.filter((p) => p.endsWith("/settle"))).toEqual([]);
  });

  it.each(DOORS)("%s: POST is the same door (gold-402 gate)", async (_n, door, path) => {
    stubNet(() => undefined);
    expect((await call(door, ctx(path, LIVE, {}, "POST", "{}"))).status).toBe(402);
  });

  it("a blocked URL is named in the 402 before anyone pays", async () => {
    stubNet(() => undefined);
    const b = (await (await call(mcpDoor, ctx("/api/ras/mcp-probe?url=https://169.254.169.254/", LIVE))).json()) as any;
    expect(b.csoai.input_check.ok).toBe(false);
    expect(b.csoai.input_check.reason).toMatch(/NON_PUBLIC_IP/);
  });

  it.each([
    ["mcp-probe", mcpDoor, "/api/ras/mcp-probe?url=https://169.254.169.254/latest/meta-data/"],
    ["mcp-probe", mcpDoor, "/api/ras/mcp-probe?url=http://mcp.example.org/"],
    ["x402-check", x402Door, "/api/ras/x402-check?url=https://10.0.0.1/"],
    ["supply", supplyDoor, "/api/ras/supply?asset=USDT&ledger=ethereum"],
    ["supply", supplyDoor, "/api/ras/supply?asset=USDC&ledger=solana"],
  ])("%s: paid request with refused input is 4xx and never reaches the facilitator (%s)", async (_n, door, path) => {
    const net = stubNet(() => undefined);
    const r = await call(door, ctx(path, LIVE, { "x-payment": PAY }));
    expect([400, 404]).toContain(r.status);
    expect((await r.json()).settled).toBe(false);
    expect(net.facilitator).toEqual([]);
  });

  it("a paid probe of a name that resolves privately is refused at run time and not settled", async () => {
    const net = stubNet(() => undefined);
    const r = await call(mcpDoor, ctx("/api/ras/mcp-probe?url=https://evil.example.org/mcp", LIVE, { "x-payment": PAY }));
    expect(r.status).toBe(400);
    expect((await r.json()).reason).toMatch(/RESOLVES_TO_NON_PUBLIC_IP/);
    expect(net.facilitator).toEqual([]);
    expect(net.calls.some((c) => c.startsWith("https://evil.example.org"))).toBe(false);
  });

  it("DNS unreadable → 503, not probed, not settled (our side failed, not the target)", async () => {
    const net = stubNet(() => undefined, { dohDown: true });
    const r = await call(x402Door, ctx("/api/ras/x402-check?url=https://shop.example.org/pay", LIVE, { "x-payment": PAY }));
    expect(r.status).toBe(503);
    expect(net.facilitator).toEqual([]);
  });

  it("an undecodable payment header computes nothing", async () => {
    const net = stubNet(() => undefined);
    const r = await call(mcpDoor, ctx("/api/ras/mcp-probe?url=https://mcp.example.org/mcp", LIVE, { "x-payment": "%%%not-base64%%%" }));
    expect(r.status).toBe(402);
    expect(net.calls.filter((c) => !c.startsWith("https://f.example"))).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────── FAIL is delivered
const mcpServer = (mode: "modern" | "legacy" | "html" | "auth" | "rpc-error") => (url: URL, init?: RequestInit) => {
  if (url.host !== "mcp.example.org") return undefined;
  const body = JSON.parse(String(init?.body || "{}"));
  const methodsSeen = (globalThis as any).__methods as string[];
  methodsSeen.push(body.method);
  const rpc = (result: unknown) => Response.json({ jsonrpc: "2.0", id: body.id, result });
  if (mode === "html") return new Response("<html>not here</html>", { status: 404, headers: { "content-type": "text/html" } });
  if (mode === "auth") return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, error: { code: -32001, message: "auth" } }), { status: 401 });
  if (mode === "rpc-error") return Response.json({ jsonrpc: "2.0", id: body.id, error: { code: -32601, message: "Method not found" } });
  if (body.method === "server/discover") {
    if (mode === "legacy") return Response.json({ jsonrpc: "2.0", id: body.id, error: { code: -32601, message: "Method not found" } });
    return rpc({ resultType: "complete", supportedVersions: ["2026-07-28"], capabilities: { tools: {} }, serverInfo: { name: "demo", version: "1" } });
  }
  if (body.method === "initialize") return new Response(`event: message\ndata: ${JSON.stringify({ jsonrpc: "2.0", id: body.id, result: { protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "legacy-demo" } } })}\n\n`, { headers: { "content-type": "text/event-stream", "mcp-session-id": "s-1" } });
  if (body.method === "notifications/initialized") return new Response(null, { status: 202 });
  if (body.method === "tools/list") {
    if (!body.params?.cursor) return rpc({ tools: [{ name: "zeta" }, { name: "alpha" }], nextCursor: "p2" });
    return rpc({ tools: [{ name: "mid" }] });
  }
  return Response.json({ jsonrpc: "2.0", id: body.id, error: { code: -32601, message: "no" } });
};

describe("a paid probe that finds a failure is DELIVERED as that failure, and settled", () => {
  it.each([
    ["html", "NOT_MCP"],
    ["auth", "AUTH_REQUIRED"],
    ["rpc-error", "MCP_ERROR"],
  ] as const)("mcp-probe against a %s endpoint → 200 %s with a receipt and a settle", async (mode, state) => {
    (globalThis as any).__methods = [];
    const net = stubNet(mcpServer(mode));
    const r = await call(mcpDoor, ctx("/api/ras/mcp-probe?url=https://mcp.example.org/mcp", LIVE, { "x-payment": PAY }));
    expect(r.status).toBe(200);
    const b = (await r.json()) as any;
    expect(b.result.state).toBe(state);
    expect(b.result.tool_called).toBe(false);
    expect(b.receipt.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(b.settle.transaction).toBe("0xtx");
    expect(net.facilitator.filter((p) => p.endsWith("/settle"))).toHaveLength(1);
    expect((globalThis as any).__methods).not.toContain("tools/call");
  });

  it("mcp-probe against an unresolvable host → UNREACHABLE, delivered", async () => {
    stubNet(() => undefined);
    const r = await call(mcpDoor, ctx("/api/ras/mcp-probe?url=https://gone.example.org/mcp", LIVE, { "x-payment": PAY }));
    expect(r.status).toBe(200);
    expect(((await r.json()) as any).result.state).toBe("UNREACHABLE");
  });

  it("x402-check against a door that answers 200 → NOT_CONFORMANT, delivered and settled", async () => {
    const net = stubNet((url) => (url.host === "shop.example.org" ? Response.json({ ok: true }) : undefined));
    const r = await call(x402Door, ctx("/api/ras/x402-check?url=https://shop.example.org/pay", LIVE, { "x-payment": PAY }));
    expect(r.status).toBe(200);
    const b = (await r.json()) as any;
    expect(b.result.state).toBe("NOT_CONFORMANT");
    expect(b.result.row).toMatchObject({ status: 200, conformant: false });
    expect(net.facilitator.filter((p) => p.endsWith("/settle"))).toHaveLength(1);
  });

  it("supply where symbol() is not the asset → REJECTED, delivered", async () => {
    stubNet(evmStub({ symbol: "NOTUSDC" }));
    const r = await call(supplyDoor, ctx("/api/ras/supply?asset=USDC&ledger=base", LIVE, { "x-payment": PAY }));
    expect(r.status).toBe(200);
    const b = (await r.json()) as any;
    expect(b.result.evidence_kind).toBe("REJECTED");
    expect(b.result.supply).toBeNull();
  });

  it("supply where OUR RPC read fails → the 402 again, nothing settled", async () => {
    const net = stubNet(evmStub({ down: true }));
    const r = await call(supplyDoor, ctx("/api/ras/supply?asset=USDC&ledger=base", LIVE, { "x-payment": PAY }));
    expect(r.status).toBe(402);
    expect(((await r.json()) as any).csoai.not_delivered.settled).toBe(false);
    expect(net.facilitator.filter((p) => p.endsWith("/verify") || p.endsWith("/settle"))).toEqual([]);
  });

  it("a failed settle releases nothing: the result is not in the 402", async () => {
    (globalThis as any).__methods = [];
    stubNet(mcpServer("modern"));
    const r = await call(mcpDoor, ctx("/api/ras/mcp-probe?url=https://mcp.example.org/mcp", {}, { "x-payment": PAY })); // no facilitator configured
    expect(r.status).toBe(402);
    const b = (await r.json()) as any;
    expect(b.result).toBeUndefined();
    expect(b.receipt).toBeUndefined();
  });
});

describe("payment never changes the result", () => {
  it("two different payments against the same target return the same result (bar the clock)", async () => {
    const strip = (x: any) => { const { fetched_at, elapsed_ms, ...rest } = x; return rest; };
    (globalThis as any).__methods = [];
    stubNet(mcpServer("modern"));
    const a = (await (await call(mcpDoor, ctx("/api/ras/mcp-probe?url=https://mcp.example.org/mcp", LIVE, { "x-payment": PAY }))).json()) as any;
    (globalThis as any).__methods = [];
    stubNet(mcpServer("modern"));
    const b = (await (await call(mcpDoor, ctx("/api/ras/mcp-probe?url=https://mcp.example.org/mcp", LIVE, { "x-payment": PAY2 }))).json()) as any;
    expect(strip(a.result)).toEqual(strip(b.result));
    expect(a.result.state).toBe("RESPONDED");
    expect(a.result.protocol).toEqual({ requested: ["2026-07-28"], negotiated: "2026-07-28", era: "modern" });
    expect(a.result.tools).toMatchObject({ state: "LISTED", count: 3, pages: 2, complete: true });
    expect(a.evidence.tool_names).toEqual(["alpha", "mid", "zeta"]);
    const sha = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(["alpha", "mid", "zeta"]))))].map((x) => x.toString(16).padStart(2, "0")).join("");
    expect(a.result.tools.names_sha256).toBe(sha);
  });

  it("legacy fallback: discover refused → initialize (SSE) → notifications/initialized → tools/list, session carried", async () => {
    (globalThis as any).__methods = [];
    stubNet(mcpServer("legacy"));
    const b = (await (await call(mcpDoor, ctx("/api/ras/mcp-probe?url=https://mcp.example.org/mcp", LIVE, { "x-payment": PAY }))).json()) as any;
    expect(b.result.state).toBe("RESPONDED");
    expect(b.result.protocol).toEqual({ requested: ["2026-07-28", "2025-06-18"], negotiated: "2025-06-18", era: "legacy" });
    expect((globalThis as any).__methods).toEqual(["server/discover", "initialize", "notifications/initialized", "tools/list", "tools/list"]);
  });
});

describe("rules, without a network", () => {
  it("classify: the state table", () => {
    const H = (status: number) => ({ kind: "HTTP", status, content_type: "" }) as never;
    expect(classify({ kind: "RESULT", status: 200, result: {}, headers: new Headers() } as never, null)).toBe("RESPONDED");
    expect(classify({ kind: "RPC_ERROR", status: 200, error: {} } as never, H(401))).toBe("AUTH_REQUIRED");
    expect(classify({ kind: "NOT_JSONRPC", status: 404, content_type: "text/html" } as never, { kind: "NOT_JSONRPC", status: 404, content_type: "" } as never)).toBe("NOT_MCP");
    expect(classify({ kind: "TIMEOUT", detail: "" } as never, null)).toBe("TIMEOUT");
    expect(classify({ kind: "UNREACHABLE", detail: "" } as never, null)).toBe("UNREACHABLE");
    expect(classify({ kind: "RPC_ERROR", status: 200, error: {} } as never, { kind: "RPC_ERROR", status: 200, error: {} } as never)).toBe("MCP_ERROR");
    expect(classify({ kind: "NOT_JSONRPC", status: 405, content_type: "" } as never, H(502))).toBe("UNREACHABLE");
  });

  it("parseJsonRpc reads SSE frames and picks the matching id", () => {
    const sse = `event: message\ndata: {"jsonrpc":"2.0","method":"notifications/progress","params":{}}\n\nevent: message\ndata: {"jsonrpc":"2.0","id":7,"result":{"ok":1}}\n\n`;
    expect(parseJsonRpc(sse, "text/event-stream", 7)).toMatchObject({ id: 7, result: { ok: 1 } });
    expect(parseJsonRpc("<html>", "text/html", 1)).toBeNull();
  });

  it("censusRow ports x402-bazaar-conformance.py probe() field for field", () => {
    const pr = { x402Version: 2, accepts: [{ scheme: "exact", network: "eip155:8453", amount: "10000" }], extensions: { bazaar: { info: {}, schema: {} } } };
    const enc = (o: unknown) => btoa(JSON.stringify(o));
    const bytes = (o: unknown) => new TextEncoder().encode(JSON.stringify(o));
    const ok = censusRow(402, new Headers({ "payment-required": enc(pr) }), bytes(pr));
    expect(ok).toMatchObject({ status: 402, payment_required_header: true, x402_version: 2, has_accepts: true, has_bazaar_extension: true, header_x402_version: 2, header_has_bazaar_extension: true, scheme: "exact", network: "eip155:8453", amount: "10000", conformant: true });
    // header carries v2 + bazaar, body is v1: NOT conformant (the snapshot's literal body rule)
    const hdrOnly = censusRow(402, new Headers({ "payment-required": enc(pr) }), bytes({ x402Version: 1, accepts: pr.accepts }));
    expect(hdrOnly).toMatchObject({ x402_version: 1, has_bazaar_extension: false, header_x402_version: 2, header_has_bazaar_extension: true, conformant: false });
    // no header: not conformant even with a perfect body
    expect(censusRow(402, new Headers(), bytes(pr)).conformant).toBe(false);
    // neither body object nor header: the bare census row
    expect(censusRow(404, new Headers(), new TextEncoder().encode("<html>"))).toEqual({ status: 404, conformant: false });
    expect(decodeHeaderJson("not base64 json")).toBeNull();
  });

  it("parseIssuerMd reads the Mainnet table only, with the reader's ROW_RE", () => {
    const md = "# USDC\n## Mainnet\n| Blockchain | USDC Address |\n| :--- | :--- |\n| Ethereum | [`0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`](https://etherscan.io/token/0xA0b8) |\n| Base | [`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`](https://basescan.org/x) |\n## Testnet\n| Ethereum Sepolia | [`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`](x) |\n";
    const rows = parseIssuerMd(md);
    expect(Object.keys(rows)).toEqual(["Ethereum", "Base"]);
    expect(rows.Ethereum.identifier).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
  });
});

// ─────────────────────────────────────────────────────────────── EVM proof port
describe("keccak / RLP / EIP-1186 — the reader's checks, ported", () => {
  const hex = (s: string) => toHex(keccak256(new TextEncoder().encode(s)));
  it("keccak-256 known vectors (Ethereum padding, not SHA3-256)", () => {
    expect(hex("")).toBe("c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470");
    expect(hex("abc")).toBe("4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45");
    expect(hex("a".repeat(200))).toMatch(/^[0-9a-f]{64}$/); // multi-block absorb
  });
  it("the 32-bit permutation equals a BigInt reference on 80 random inputs (0..600 bytes)", () => {
    const MASK = (1n << 64n) - 1n;
    const RC = ["0000000000000001","0000000000008082","800000000000808a","8000000080008000","000000000000808b","0000000080000001","8000000080008081","8000000000008009","000000000000008a","0000000000000088","0000000080008009","000000008000000a","000000008000808b","800000000000008b","8000000000008089","8000000000008003","8000000000008002","8000000000000080","000000000000800a","800000008000000a","8000000080008081","8000000000008080","0000000080000001","8000000080008008"].map((h) => BigInt("0x" + h));
    const ROT = [0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18, 2, 61, 56, 14];
    const rotl = (x: bigint, n: number) => (n === 0 ? x : ((x << BigInt(n)) | (x >> BigInt(64 - n))) & MASK);
    const ref = (data: Uint8Array) => {
      const rate = 136, padded = new Uint8Array(Math.ceil((data.length + 1) / rate) * rate);
      padded.set(data); padded[data.length] ^= 1; padded[padded.length - 1] ^= 0x80;
      const s = new Array<bigint>(25).fill(0n);
      for (let off = 0; off < padded.length; off += rate) {
        for (let i = 0; i < 17; i++) { let lane = 0n; for (let b = 7; b >= 0; b--) lane = (lane << 8n) | BigInt(padded[off + i * 8 + b]); s[i] ^= lane; }
        for (let r = 0; r < 24; r++) {
          const C = [0, 1, 2, 3, 4].map((x) => s[x] ^ s[x + 5] ^ s[x + 10] ^ s[x + 15] ^ s[x + 20]);
          for (let x = 0; x < 5; x++) { const D = C[(x + 4) % 5] ^ rotl(C[(x + 1) % 5], 1); for (let y = 0; y < 25; y += 5) s[x + y] ^= D; }
          const B = new Array<bigint>(25);
          for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) B[y + 5 * ((2 * x + 3 * y) % 5)] = rotl(s[x + 5 * y], ROT[x + 5 * y]);
          for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) s[x + 5 * y] = B[x + 5 * y] ^ (~B[((x + 1) % 5) + 5 * y] & MASK & B[((x + 2) % 5) + 5 * y]);
          s[0] ^= RC[r];
        }
      }
      const out = new Uint8Array(32);
      for (let i = 0; i < 4; i++) { let lane = s[i]; for (let b = 0; b < 8; b++) { out[i * 8 + b] = Number(lane & 0xffn); lane >>= 8n; } }
      return out;
    };
    let seed = 42;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) >>> 16) & 0xff;
    for (let t = 0; t < 80; t++) {
      const buf = Uint8Array.from({ length: (t * 97) % 601 }, rnd);
      expect(toHex(keccak256(buf)), `len ${buf.length}`).toBe(toHex(ref(buf)));
    }
  });
  it("RLP round-trips", () => {
    const v = [new Uint8Array([1, 2, 3]), [new Uint8Array(0), new Uint8Array(60).fill(7)]];
    expect(rlpDecode(rlpEncode(v as never))).toEqual(v);
  });
  const fx = JSON.parse(readFileSync(fileURLToPath(new URL("./__fixtures__/eip1186-usdc-ethereum.json", import.meta.url)), "utf8"));
  it("verifies the committed Ethereum USDC proof (block 26051941, slot 11) against its stateRoot", () => {
    const v = verifyEip1186(fx.state_root, fx.address, fx.response, fx.slot);
    expect(v.error).toBeNull();
    expect(v.account_proof_verified).toBe(true);
    expect(v.storage_proof_verified).toBe(true);
    expect(v.proven_value).toBe(BigInt(fx.response.storageProof[0].value).toString());
  });
  it("recomputes the header hash of that block", () => {
    expect(headerHash(fx.header)).toBe(fx.block_hash.toLowerCase());
  });
  it("a proof against the wrong stateRoot does not verify", () => {
    const v = verifyEip1186("0x" + "11".repeat(32), fx.address, fx.response, fx.slot);
    expect(v.account_proof_verified).toBe(false);
    expect(v.error).toMatch(/not in proof/);
  });
  it("a tampered storage value does not verify", () => {
    const bad = JSON.parse(JSON.stringify(fx.response));
    bad.storageProof[0].value = "0x1";
    const v = verifyEip1186(fx.state_root, fx.address, bad, fx.slot);
    expect(v.storage_proof_verified).toBe(false);
  });
});

/** A minimal EVM RPC for supply-door tests (ledger: base, eth_call only). */
function evmStub(opts: { symbol?: string; down?: boolean }): Route {
  const md = "## Mainnet\n| Base | [`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`](https://basescan.org/x) |\n| Ethereum | [`0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`](x) |\n## Testnet\n";
  const abiString = (s: string) => "0x" + "20".padStart(64, "0") + s.length.toString(16).padStart(64, "0") + [...new TextEncoder().encode(s)].map((b) => b.toString(16).padStart(2, "0")).join("").padEnd(64, "0");
  return (url, init) => {
    if (url.host === "developers.circle.com") return new Response(md, { headers: { "content-type": "text/markdown" } });
    if (url.host === new URL(EVM_LEDGERS.base.rpc).host) {
      if (opts.down) return new Response("{}", { status: 503 });
      const body = JSON.parse(String(init?.body));
      const res = (result: unknown) => Response.json({ jsonrpc: "2.0", id: body.id, result });
      if (body.method === "eth_blockNumber") return res("0x100");
      if (body.method === "eth_getBlockByNumber") return res({ number: "0x100", hash: "0x" + "ab".repeat(32), timestamp: "0x68c4f000" });
      if (body.method === "eth_call") {
        const data = body.params[0].data;
        if (data === "0x95d89b41") return res(abiString(opts.symbol ?? "USDC"));
        if (data === "0x313ce567") return res("0x" + (6).toString(16).padStart(64, "0"));
        if (data === "0x18160ddd") return res("0x" + (4_000_000_000_000n).toString(16).padStart(64, "0"));
      }
    }
    return undefined;
  };
}

describe("supply door on an eth_call-only ledger", () => {
  it("USDC on base → OPERATOR_API with the supply, address from the issuer page", async () => {
    stubNet(evmStub({}));
    const b = (await (await call(supplyDoor, ctx("/api/ras/supply?asset=USDC&ledger=base", LIVE, { "x-payment": PAY }))).json()) as any;
    expect(b.result.evidence_kind).toBe("OPERATOR_API");
    expect(b.result.supply).toMatchObject({ base_units: "4000000000000", decimals: 6, decimal: "4000000.000000" });
    expect(b.result.target.address).toBe("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
    expect(b.result.issuer_list.md_sha256).toMatch(/^[0-9a-f]{64}$/);
  });
});

// ─────────────────────────────────────────────────────────────── verify is free
describe("verification is free — /api/verify never meters", () => {
  it("verify.ts imports nothing from the x402 rail", () => {
    const src = readFileSync(fileURLToPath(new URL("../verify.ts", import.meta.url)), "utf8");
    expect(src).not.toMatch(/from\s+"\.\/_x402/);
    expect(src).not.toMatch(/\b402\b[^\n]*status/);
  });

  async function testKey() {
    const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
    const raw = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
    return { pkcs8b64: btoa(String.fromCharCode(...pkcs8)), pubHex: [...raw].map((b) => b.toString(16).padStart(2, "0")).join("") };
  }

  it("a RAS receipt POSTed with a payment header is judged for free: unsigned → UNCHECKABLE, tampered → INVALID", async () => {
    (globalThis as any).__methods = [];
    stubNet(mcpServer("modern"));
    const paid = (await (await call(mcpDoor, ctx("/api/ras/mcp-probe?url=https://mcp.example.org/mcp", LIVE, { "x-payment": PAY }))).json()) as any;
    const net = stubNet(() => Response.json({ verificationMethod: [] }));
    const r1 = await call(verifyPost, ctx("/api/verify", {}, { "content-type": "application/json", "x-payment": PAY }, "POST", JSON.stringify(paid.receipt)));
    expect(r1.status).toBe(200);
    const v1 = (await r1.json()) as any;
    expect(v1.family).toBe("csoai.card-v0");
    expect(v1.state).toBe("UNCHECKABLE"); // no Pages key in the test env → the receipt declares itself unsigned
    expect(v1.reasons).toEqual(["unsigned"]);
    const tampered = { ...paid.receipt, payload: { ...paid.receipt.payload, state: "NOT_MCP" } };
    const v2 = (await (await call(verifyPost, ctx("/api/verify", {}, { "content-type": "application/json" }, "POST", JSON.stringify(tampered)))).json()) as any;
    expect(v2.state).toBe("INVALID");
    expect(v2.reasons).toEqual(["sha256_mismatch"]);
    expect(net.facilitator).toEqual([]);
  });

  it("a signed receipt's signature is the board-sign rule: verifyLeaf passes under the signing key", async () => {
    const key = await testKey();
    (globalThis as any).__methods = [];
    stubNet(mcpServer("modern"));
    const b = (await (await call(mcpDoor, ctx("/api/ras/mcp-probe?url=https://mcp.example.org/mcp", { ...LIVE, BOARD_SIGN_KEY_PKCS8_B64: key.pkcs8b64 }, { "x-payment": PAY }))).json()) as any;
    expect(b.receipt.did).toBe("did:web:csoai.org#board-attestation-1");
    const v = await verifyLeaf(b.receipt.payload, b.receipt.sha256, b.receipt.sig_ed25519, key.pubHex);
    expect(v).toEqual({ sha_ok: true, sig_ok: true });
  });

  it("GET ?record_url= re-fetches an estate record, sha256s the bytes, verifies — 200, never 402", async () => {
    const leaf = await signPayload({ kind: "t", n: 1 }, undefined);
    const record = { schema: "https://councilof.ai/schema/card-v0.json", payload: { kind: "t", n: 1 }, sha256: leaf.sha256, sig_ed25519: null };
    const bytes = JSON.stringify(record);
    const net = stubNet((url) => (url.toString() === "https://councilof.ai/signed/x.json" ? new Response(bytes, { headers: { "content-type": "application/json" } }) : undefined));
    const r = await call(verifyGet, ctx("/api/verify?record_url=https://councilof.ai/signed/x.json", {}, { "x-payment": PAY }));
    expect(r.status).toBe(200);
    const b = (await r.json()) as any;
    expect(b.free).toBe(true);
    expect(b.fetched.bytes).toBe(new TextEncoder().encode(bytes).byteLength);
    expect(b.fetched.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(b.state).toBe("UNCHECKABLE"); // digest ok, unsigned
    expect(b.checks.find((c: any) => c.code === "sha256_ok")).toBeTruthy();
    expect(net.facilitator).toEqual([]);
  });

  it("GET ?record_url= off the estate's origins is refused without a fetch", async () => {
    const net = stubNet(() => undefined);
    const r = await call(verifyGet, ctx("/api/verify?record_url=https://169.254.169.254/latest/meta-data/"));
    expect(r.status).toBe(400);
    expect(((await r.json()) as any).state).toBe("UNCHECKABLE");
    expect(net.calls).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────── daily index
describe("/api/x402/index — signed or pending, never invented", () => {
  it("nothing signed published (default alias 404, no env) → INDEX_PENDING, index null, the latest UNSIGNED run pointed at", async () => {
    stubNet((url) => url.host !== "huggingface.co" ? undefined
      : url.pathname.endsWith("/signed/index-latest.json") ? new Response("Entry not found", { status: 404 })
      : Response.json({ schema: "csoai.x402-bazaar-conformance/0.2", date: "2026-09-24", as_of: "2026-09-24T03:05:41Z", partial: false, headline: { conformant: 1 } }));
    const r = await call(indexGet, { request: new Request(`${ORIGIN}/api/x402/index`), env: {}, params: { name: "index" } });
    expect(r.status).toBe(200);
    const b = (await r.json()) as any;
    expect(b.state).toBe("INDEX_PENDING");
    expect(b.index).toBeNull();
    expect(b.latest_unsigned_run).toMatchObject({ signed: false, date: "2026-09-24", readable: true });
    expect(b.latest_unsigned_run.headline).toBeUndefined(); // an unsigned run's numbers are not re-served as the index
    expect(b.free).toBe(true);
  });

  it("a configured leaf whose signature fails is SIGNATURE_INVALID and is not served", async () => {
    const leaf = await signPayload({ kind: "x402-index", rows: 1 }, undefined);
    const doc = { payload: { kind: "x402-index", rows: 1 }, sha256: leaf.sha256, sig_ed25519: "00".repeat(64), did: "did:web:csoai.org#board-attestation-1" };
    stubNet((url) => (url.host === "huggingface.co" ? Response.json(doc) : undefined));
    const r = await call(indexGet, { request: new Request(`${ORIGIN}/api/x402/index`), env: { X402_INDEX_SIGNED_URL: "https://huggingface.co/datasets/csoai/x402-bazaar-conformance/resolve/main/signed/index-latest.json" }, params: { name: "index" } });
    const b = (await r.json()) as any;
    expect(b.state).toBe("SIGNATURE_INVALID");
    expect(b.index).toBeNull();
  });

  it("the real 2026-09-27 leaf at the default alias (no env) → SIGNED under the pinned board key; its payload is the index", async () => {
    const raw = readFileSync(fileURLToPath(new URL("../x402/__fixtures__/x402_index_2026-09-27.json", import.meta.url)), "utf8");
    const net = stubNet((url) => (url.host === "huggingface.co" && url.pathname.endsWith("/signed/index-latest.json") ? new Response(raw, { status: 200 }) : undefined));
    const r = await call(indexGet, { request: new Request(`${ORIGIN}/api/x402/index`), env: {}, params: { name: "index" } });
    const b = (await r.json()) as any;
    expect(b.state).toBe("SIGNED");
    expect(b.source).toBe("https://huggingface.co/datasets/csoai/x402-bazaar-conformance/resolve/main/signed/index-latest.json");
    expect(b.index.schema).toBe("csoai.x402-index/0.1");
    expect(b.index.census.partial).toBe(false);
    expect(b.index.pins["summary-2026-09-27.json"]).toBe("5ed2c6488776af15ddce5ecb16ed000458999732123920b06d28aa5ea1c578e4");
    expect(b.signature.did).toBe("did:web:csoai.org#board-attestation-1");
    expect(net.calls).toHaveLength(1);
  });

  it("must-fail control: the same leaf with one census number changed is not served", async () => {
    const leaf = JSON.parse(readFileSync(fileURLToPath(new URL("../x402/__fixtures__/x402_index_2026-09-27.json", import.meta.url)), "utf8"));
    leaf.payload.census.headline.conformant += 1;
    stubNet((url) => (url.host === "huggingface.co" && url.pathname.endsWith("/signed/index-latest.json") ? Response.json(leaf) : undefined));
    const r = await call(indexGet, { request: new Request(`${ORIGIN}/api/x402/index`), env: {}, params: { name: "index" } });
    const b = (await r.json()) as any;
    expect(b.state).not.toBe("SIGNED");
    expect(b.index).toBeNull();
  });

  it("any other /api/x402/<name> is a 404", async () => {
    const r = await call(indexGet, { request: new Request(`${ORIGIN}/api/x402/other`), env: {}, params: { name: "other" } });
    expect(r.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────── discovery
describe("discovery — manifest and catalogue carry all five", () => {
  it("/.well-known/x402.json lists the three paid doors with outputSchema, and the two free doors with no accepts", async () => {
    const m = (await (await call(manifest, { request: new Request(`${ORIGIN}/.well-known/x402.json`), env: {} })).json()) as any;
    for (const p of ["/api/ras/mcp-probe", "/api/ras/x402-check", "/api/ras/supply"]) {
      const r = m.resources.find((x: any) => new URL(x.url).pathname === p);
      expect(r, p).toBeTruthy();
      expect(r.outputSchema.properties.receipt, p).toBeTruthy();
      expect(r.accepts[0].outputSchema).toEqual(r.outputSchema);
    }
    const free = m.free_doors.map((d: any) => new URL(d.url).pathname);
    expect(free).toEqual(["/api/verify", "/api/x402/index"]);
    for (const d of m.free_doors) { expect(d.accepts).toBeUndefined(); expect(d.free).toBe(true); expect(d.outputSchema).toBeTruthy(); }
    expect(JSON.stringify(m)).not.toMatch(/\$\s?\d/); // no typed dollar price
  });

  it("the three descriptions open with the deliverable (the x402.json buyer-first rule)", async () => {
    const m = (await (await call(manifest, { request: new Request(`${ORIGIN}/.well-known/x402.json`), env: {} })).json()) as any;
    const ras = m.resources.filter((r: any) => new URL(r.url).pathname.startsWith("/api/ras/"));
    expect(ras).toHaveLength(3);
    for (const r of ras) {
      expect(r.description.length).toBeGreaterThan(40);
      expect(r.description.toLowerCase()).toMatch(/^(mcp discovery probe receipt|x402 challenge conformance receipt|token supply read receipt)/);
      expect(r.description).not.toMatch(/\b(certif|compliant|guarantee)/i);
    }
  });

  it("/api/x402 (the A2A x402-discovery skill's source) carries the three doors and both free routes", async () => {
    const c = (await (await call(catalogue, { request: new Request(`${ORIGIN}/api/x402`), env: {} })).json()) as any;
    const ids = c.resources.map((r: any) => r.id);
    for (const id of ["ras_mcp_probe", "ras_x402_check", "ras_supply"]) expect(ids).toContain(id);
    expect(c.free_forever).toContain(`${ORIGIN}/api/x402/index`);
    expect(c.free_forever.some((u: string) => u.startsWith(`${ORIGIN}/api/verify?record_url=`))).toBe(true);
  });
});
