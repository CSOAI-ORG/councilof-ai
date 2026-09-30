/**
 * GSPC Route execution (POST /api/route/execute), owner ruling 2026-09-30. Six properties, each proved to FAIL
 * against a planted violation before it was trusted (plants and red runs: services/gspc-router/PROOF.md,
 * section "execute"):
 *
 *   A. no caller key ever reaches the edge's logs, storage or outbound requests;
 *   B. a tool the probe observed DIVERGENT is refused unless the caller's policy says allow_divergent_effect_binding;
 *   C. nothing is paid without an observed 402 challenge AND the caller's confirm of that exact challenge;
 *   D. the edge never calls a third-party tool that is not verified read-only (server-side writes impossible);
 *   E. the policy is fail-closed: anything not understood, and no signer, executes nothing;
 *   F. every receipt verifies under did:web:csoai.org#route-attestation-1 and a changed byte does not.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { routeExecute, credentialPaths, challengeSha, x402Challenge, type ExecuteDeps } from "./execute";
import { normaliseEndpointUrl } from "./census";
import { routeSigner, verifyReceipt, b64url, ROUTE_KID, type Signer } from "./sign";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const INDEX = JSON.parse(readFileSync(join(ROOT, "public", "interop", "effect-binding-census-index.json"), "utf8"));
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

const SECRET = "sk-canary-0123456789abcdefghijklmnop";
const RO = "https://readonly.example/mcp"; // outcome PARTIAL; tool "lookup" REJECTS; tool "other" ACCEPTS_SILENTLY
const DV = "https://divergent.example/mcp"; // outcome DOES_NOT_BIND; tool "lookup" ACCEPTS_SILENTLY
const NL = "https://notlisted.example/mcp"; // probed; no tool listed read-only

function census(overrides: Record<string, unknown> = {}) {
  const e = (url: string, outcome: string, tools: Record<string, string>) => [
    sha(normaliseEndpointUrl(url) as string),
    { outcome, tools: Object.fromEntries(Object.entries(tools).map(([t, p2]) => [sha(t), { p2 }])) },
  ];
  return {
    ...INDEX,
    entries: Object.fromEntries([
      e(RO, "PARTIAL", { lookup: "REJECTS", other: "ACCEPTS_SILENTLY", unprobed: "NOT_PROBED" }),
      e(DV, "DOES_NOT_BIND", { lookup: "ACCEPTS_SILENTLY" }),
      e(NL, "NO_READONLY_TOOL", {}),
    ]),
    ...overrides,
  };
}

/* ---------------------------------------------------------------- a fake MCP target that records everything */

type Seen = { url: string; headers: Record<string, string>; body: any };

function target(onCall: (params: any, n: number) => { status?: number; result?: unknown; body?: unknown }) {
  const seen: Seen[] = [];
  let calls = 0;
  const fetchTarget = vi.fn(async (url: string, init: RequestInit) => {
    const headers = Object.fromEntries(Object.entries((init.headers ?? {}) as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v]));
    const body = JSON.parse(String(init.body));
    seen.push({ url, headers, body });
    if (body.method === "initialize")
      return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, result: { protocolVersion: "2025-06-18", capabilities: {}, serverInfo: { name: "t", version: "1" } } }), {
        status: 200,
        headers: { "content-type": "application/json", "mcp-session-id": "s-1" },
      });
    if (body.method === "notifications/initialized") return new Response(null, { status: 202 });
    const r = onCall(body.params, calls++);
    if (r.body !== undefined) return new Response(JSON.stringify(r.body), { status: r.status ?? 200, headers: { "content-type": "application/json" } });
    // SSE framing, as streamable-HTTP servers answer
    return new Response(`event: message\ndata: ${JSON.stringify({ jsonrpc: "2.0", id: body.id, result: r.result })}\n\n`, {
      status: r.status ?? 200,
      headers: { "content-type": "text/event-stream" },
    });
  });
  return { fetchTarget, seen, toolCalls: () => seen.filter((s) => s.body.method === "tools/call") };
}

const OK = () => ({ result: { content: [{ type: "text", text: "holidays: 2026-12-25" }], isError: false } });
const CHALLENGE = {
  x402Version: 1,
  accepts: [{ scheme: "exact", network: "base", maxAmountRequired: "20000", asset: "0xUSDC", payTo: "0xDOOR", resource: "https://councilof.ai/api/x" }],
};
const PAID_CHALLENGE = () => ({ result: { structuredContent: { status: "PAYMENT_REQUIRED", ...CHALLENGE }, content: [{ type: "text", text: "PAYMENT_REQUIRED" }], isError: true } });

/* ---------------------------------------------------------------- a test route key, published in a test DID */

let signer: Signer;
let didDoc: unknown;
beforeEach(async () => {
  const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const x = ((await crypto.subtle.exportKey("jwk", kp.publicKey)) as JsonWebKey).x as string;
  signer = { kid: ROUTE_KID, sign: async (m) => new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, kp.privateKey, m as BufferSource)) };
  didDoc = {
    id: "did:web:csoai.org",
    verificationMethod: [
      { id: "did:web:csoai.org#board-attestation-1", type: "JsonWebKey2020", publicKeyJwk: { kty: "OKP", crv: "Ed25519", x: "AAAA" } },
      { id: "did:web:csoai.org#route-attestation-1", type: "JsonWebKey2020", publicKeyJwk: { kty: "OKP", crv: "Ed25519", x } },
    ],
  };
});

const CONSOLE = ["log", "info", "warn", "error", "debug", "trace"] as const;
let consoleSpies: ReturnType<typeof vi.spyOn>[] = [];
beforeEach(() => {
  consoleSpies = CONSOLE.map((m) => vi.spyOn(console, m).mockImplementation(() => undefined));
});
afterEach(() => {
  // A: nothing in this file's executions wrote to a log, ever.
  for (const s of consoleSpies) expect(s).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});

function deps(t: ReturnType<typeof target>, over: Partial<ExecuteDeps> = {}): ExecuteDeps & { fetchBoard: any; fetchCensus: any } {
  return {
    fetchBoard: vi.fn(async () => ({ axes: [] })),
    fetchCensus: vi.fn(async () => census()),
    fetchTarget: t.fetchTarget,
    signer,
    origin: "https://preview.councilof-ai.pages.dev",
    now: () => new Date("2026-09-30T18:00:00.000Z"),
    uuid: () => "00000000-0000-4000-8000-00000000e0e0",
    ...over,
  } as any;
}

const third = (id: string, endpoint: string, tool: string, extra: Record<string, unknown> = {}) => ({
  id,
  kind: "mcp_tool",
  provider: "third-party",
  endpoint,
  tool,
  read_only: true,
  ...extra,
});
const first = (tool: string, door: "/mcp/free" | "/mcp" = "/mcp/free") => ({ id: `mcp:${tool}`, kind: "mcp_tool", provider: "csoai", endpoint: `https://councilof.ai${door}`, tool });
const req = (candidates: unknown[], extra: Record<string, unknown> = {}) => ({ task: "Read one public record.", candidates, call: { arguments: { countryCode: "GB" } }, ...extra });

/* ================================================================ A */
describe("A. no caller key reaches logs, storage or the outbound request", () => {
  const places: Array<[string, Record<string, unknown>]> = [
    ["call.arguments.api_key", req([third("t", RO, "lookup")], { call: { arguments: { api_key: SECRET } } })],
    ["a key-shaped value in an innocent field", req([third("t", RO, "lookup")], { call: { arguments: { q: SECRET } } })],
    ["a bearer value", req([third("t", RO, "lookup")], { call: { arguments: { q: `Bearer ${SECRET}` } } })],
    ["headers at the top level", { ...req([third("t", RO, "lookup")]), headers: { Authorization: `Bearer ${SECRET}` } }],
    ["a credential inside policy", req([third("t", RO, "lookup")], { policy: { caller_wallet: true, token_note: { access_token: SECRET } } })],
  ];
  for (const [name, body] of places)
    it(`${name}: refused before any read or call, value never echoed`, async () => {
      const t = target(OK);
      const d = deps(t);
      const r = await routeExecute(body, d);
      expect(r.body.state).toBe("CREDENTIALS_REFUSED");
      expect(r.http_status).toBe(400);
      expect(t.fetchTarget).not.toHaveBeenCalled();
      expect(d.fetchCensus).not.toHaveBeenCalled();
      expect(d.fetchBoard).not.toHaveBeenCalled();
      expect(JSON.stringify(r.body)).not.toContain(SECRET.slice(3, 20));
    });

  it("an executed call sends no Authorization, cookie or key header, and the receipt carries the answer as sha256 only", async () => {
    const t = target(OK);
    const r = await routeExecute(req([third("t", RO, "lookup")]), deps(t));
    expect(r.body.state).toBe("EXECUTED");
    for (const s of t.seen) {
      expect(Object.keys(s.headers).sort()).toEqual(
        ["accept", "content-type", "mcp-protocol-version", ...(s.body.method === "initialize" ? [] : ["mcp-session-id"])].sort(),
      );
    }
    const rec = JSON.stringify(r.body.receipt);
    expect(rec).not.toContain("holidays: 2026-12-25");
    expect(rec).not.toContain("countryCode");
  });

  it("the execution code has no logging and no storage binding (source check)", () => {
    for (const f of ["functions/_lib/route/execute.ts", "functions/api/route/execute.ts", "functions/_lib/route/sign.ts"]) {
      const src = readFileSync(join(ROOT, f), "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
      expect(src, f).not.toMatch(/console\.|\.put\(|KVNamespace|D1Database|R2Bucket|caches\.|waitUntil/);
    }
  });

  it("credentialPaths reports paths, never values; x_payment in payment is the one exempt field", () => {
    expect(credentialPaths({ payment: { x_payment: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig" } })).toEqual([]);
    expect(credentialPaths({ call: { arguments: { x_payment: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig" } } })).toEqual(["$.call.arguments.x_payment"]);
    expect(credentialPaths({ a: [{ Authorization: "x" }] })).toEqual(["$.a[0].Authorization"]);
  });
});

/* ================================================================ B */
describe("B. DIVERGENT (extra argument silently accepted) is refused without the policy flag", () => {
  it("a tool whose own probe was ACCEPTS_SILENTLY is forbidden by the floor and never called", async () => {
    const t = target(OK);
    const r = await routeExecute(req([third("t", RO, "other")]), deps(t));
    expect(r.body.state).toBe("NO_PERMITTED_CANDIDATE");
    expect((r.body.forbidden as any[])[0].forbid_policy).toBe("floor:effect-binding-divergent");
    expect(t.fetchTarget).not.toHaveBeenCalled();
    const c = (r.body.receipt as any).observed.considered[0];
    expect(c.census).toMatchObject({ effect_binding: "DIVERGENT", basis: "census_tool", tool: { listed_read_only: true, p2: "ACCEPTS_SILENTLY" } });
  });

  it("the per-tool result decides: REJECTS at a PARTIAL server is CONSISTENT and runs", async () => {
    const t = target(OK);
    const r = await routeExecute(req([third("t", RO, "lookup")]), deps(t));
    expect(r.body.state).toBe("EXECUTED");
    expect((r.body.receipt as any).observed.considered[0].census.effect_binding).toBe("CONSISTENT");
    expect(t.toolCalls()).toHaveLength(1);
  });

  it("an unprobed tool at a DOES_NOT_BIND server keeps the server's DIVERGENT", async () => {
    const t = target(OK);
    const r = await routeExecute(req([third("t", DV, "lookup")]), deps(t));
    expect(r.body.state).toBe("NO_PERMITTED_CANDIDATE");
    expect(t.fetchTarget).not.toHaveBeenCalled();
  });

  it("allow_divergent_effect_binding: true (and only that) lets it run", async () => {
    for (const v of [undefined, false, "true", 1]) {
      const t = target(OK);
      const r = await routeExecute(req([third("t", RO, "other")], { policy: { allow_divergent_effect_binding: v } }), deps(t));
      expect(r.body.state, String(v)).not.toBe("EXECUTED");
      expect(t.fetchTarget).not.toHaveBeenCalled();
    }
    const t = target(OK);
    const r = await routeExecute(req([third("t", RO, "other")], { policy: { allow_divergent_effect_binding: true } }), deps(t));
    expect(r.body.state).toBe("EXECUTED");
    expect((r.body.receipt as any).declared.policy.allow_divergent_effect_binding).toBe(true);
  });
});

/* ================================================================ C */
describe("C. no payment without an observed 402 challenge and the caller's confirm of it", () => {
  const paidReq = (extra: Record<string, unknown> = {}) =>
    req([first("commission_card", "/mcp")], { policy: { caller_wallet: true }, confirm_action: true, call: { arguments: { endpoint: "https://x.example" } }, ...extra });
  const xPayments = (t: ReturnType<typeof target>) => t.toolCalls().filter((s) => "x_payment" in (s.body.params.arguments ?? {}));

  it("no challenge from the target: NO_CHALLENGE, and the caller's x_payment is never forwarded", async () => {
    const t = target(OK);
    const sh = await challengeSha(CHALLENGE);
    const r = await routeExecute(paidReq({ payment: { x_payment: "PAYLOAD", challenge_sha256: sh } }), deps(t));
    expect(r.body.state).toBe("NO_CHALLENGE");
    expect(xPayments(t)).toHaveLength(0);
    expect(r.body.charged).toBe(false);
  });

  it("a challenge and no payment: 402 PAYMENT_REQUIRED with the door's own challenge, one unpaid call", async () => {
    const t = target(PAID_CHALLENGE);
    const r = await routeExecute(paidReq(), deps(t));
    expect(r.http_status).toBe(402);
    expect(r.body.state).toBe("PAYMENT_REQUIRED");
    expect((r.body.payment_required as any).challenge).toEqual(CHALLENGE);
    expect((r.body.payment_required as any).challenge_sha256).toBe(await challengeSha(CHALLENGE));
    expect(t.toolCalls()).toHaveLength(1);
    expect(xPayments(t)).toHaveLength(0);
    expect(t.seen[0].url).toBe("https://preview.councilof-ai.pages.dev/mcp");
  });

  it("a confirm of a DIFFERENT challenge pays nothing", async () => {
    const t = target(PAID_CHALLENGE);
    const r = await routeExecute(paidReq({ payment: { x_payment: "PAYLOAD", challenge_sha256: "0".repeat(64) } }), deps(t));
    expect(r.body.state).toBe("PAYMENT_REQUIRED");
    expect(xPayments(t)).toHaveLength(0);
  });

  it("a confirm without a caller wallet in policy pays nothing (floor:paid-needs-caller-wallet)", async () => {
    const t = target(PAID_CHALLENGE);
    const sh = await challengeSha(CHALLENGE);
    const r = await routeExecute(paidReq({ policy: {}, payment: { x_payment: "PAYLOAD", challenge_sha256: sh } }), deps(t));
    expect(r.body.state).toBe("NO_PERMITTED_CANDIDATE");
    expect(t.fetchTarget).not.toHaveBeenCalled();
  });

  it("challenge observed + that challenge confirmed: x_payment forwarded exactly once", async () => {
    const t = target((_p, n) => (n === 0 ? PAID_CHALLENGE() : { result: { structuredContent: { status: "DELIVERED", settlement_state: "REPORTED_BY_ROUTE", payment_response_header: "0xTX" } } }));
    const sh = await challengeSha(CHALLENGE);
    const r = await routeExecute(paidReq({ payment: { x_payment: "PAYLOAD", challenge_sha256: sh } }), deps(t));
    expect(r.body.state).toBe("EXECUTED");
    expect(xPayments(t)).toHaveLength(1);
    expect(xPayments(t)[0].body.params.arguments.x_payment).toBe("PAYLOAD");
    expect((r.body.receipt as any).observed.payment).toMatchObject({ x402: "settled", tx: "0xTX", challenge_sha256: sh });
  });

  it("a third-party payment request is never paid by the edge", async () => {
    const t = target(PAID_CHALLENGE);
    const sh = await challengeSha(CHALLENGE);
    const r = await routeExecute(req([third("t", RO, "lookup")], { policy: { caller_wallet: true }, payment: { x_payment: "PAYLOAD", challenge_sha256: sh } }), deps(t));
    expect(r.body.state).toBe("CLIENT_SIDE");
    expect(xPayments(t)).toHaveLength(0);
  });

  it("x_payment smuggled into call.arguments is refused", async () => {
    const t = target(PAID_CHALLENGE);
    const r = await routeExecute(paidReq({ call: { arguments: { x_payment: "PAYLOAD" } } }), deps(t));
    expect(r.body.state).toBe("BAD_ARGUMENTS");
    expect(t.fetchTarget).not.toHaveBeenCalled();
    expect(x402Challenge(PAID_CHALLENGE().result)).toEqual(CHALLENGE);
  });
});

/* ================================================================ D */
describe("D. server-side writes are impossible: the edge calls only verified read-only tools", () => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ["caller says read_only, probe did not list it", req([third("t", NL, "write_thing")], { confirm_action: true })],
    ["listed server, this tool not listed", req([third("t", RO, "delete_all")], { confirm_action: true })],
    ["destructive, confirmed", req([third("t", RO, "lookup", { destructive: true, read_only: false })], { confirm_action: true, policy: { confirm_destructive: true } })],
    ["endpoint the census never probed", req([third("t", "https://unknown.example/mcp", "lookup")], { confirm_action: true })],
    ["no tool named", req([{ id: "t", kind: "mcp_tool", provider: "p", endpoint: RO, read_only: true }], { confirm_action: true })],
  ];
  for (const [name, body] of cases)
    it(`${name}: CLIENT_SIDE plan, zero outbound requests`, async () => {
      const t = target(OK);
      const r = await routeExecute(body, deps(t));
      expect(r.body.state).toBe("CLIENT_SIDE");
      expect(r.body.executed).toBe(false);
      expect(t.fetchTarget).not.toHaveBeenCalled();
      expect((r.body.client_side as any).per_call_confirm).toBe(true);
    });

  it("a first-party tool that is not read-only needs confirm_action; without it nothing is called", async () => {
    const t = target(PAID_CHALLENGE);
    const r = await routeExecute(req([first("commission_card", "/mcp")], { policy: { caller_wallet: true } }), deps(t));
    expect(r.body.state).toBe("CONFIRM_REQUIRED");
    expect(t.fetchTarget).not.toHaveBeenCalled();
  });

  it("a caller cannot declare our paid tool read-only: the fleet's annotations win", async () => {
    const t = target(PAID_CHALLENGE);
    const r = await routeExecute(req([{ ...first("commission_card", "/mcp"), read_only: true, paid: false }], { policy: { caller_wallet: true } }), deps(t));
    expect(r.body.state).toBe("CONFIRM_REQUIRED");
    expect(t.fetchTarget).not.toHaveBeenCalled();
  });
});

/* ================================================================ E */
describe("E. the policy is fail-closed", () => {
  it("an unknown policy key grants nothing: nothing is called", async () => {
    const t = target(OK);
    const r = await routeExecute(req([third("t", RO, "lookup")], { policy: { trust_me: true } }), deps(t));
    expect(r.body.state).toBe("NO_PERMITTED_CANDIDATE");
    expect(t.fetchTarget).not.toHaveBeenCalled();
  });

  it("an unreadable census leaves every third-party tool unverified: nothing is called", async () => {
    for (const fc of [async () => { throw new Error("HTTP 503"); }, async () => ({ schema: "x" }), async () => census({ schema: "csoai.effect-binding.census-index/9" })]) {
      const t = target(OK);
      const r = await routeExecute(req([third("t", RO, "lookup")]), deps(t, { fetchCensus: fc } as any));
      expect(r.body.state).toBe("CLIENT_SIDE");
      expect(t.fetchTarget).not.toHaveBeenCalled();
    }
  });

  it("schema 0.1 (no per-tool rows) never verifies a tool read-only", async () => {
    const idx = census();
    for (const e of Object.values(idx.entries) as any[]) delete e.tools;
    const t = target(OK);
    const r = await routeExecute(req([third("t", RO, "lookup")]), deps(t, { fetchCensus: async () => ({ ...idx, schema: "csoai.effect-binding.census-index/0.1" }) } as any));
    expect(r.body.state).toBe("CLIENT_SIDE");
    expect(t.fetchTarget).not.toHaveBeenCalled();
  });

  it("no signer (absent, not Ed25519, or not the published key): SIGNER_UNAVAILABLE, nothing called", async () => {
    const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
    const otherPkcs8 = Buffer.from(await crypto.subtle.exportKey("pkcs8", kp.privateKey)).toString("base64");
    for (const secret of [undefined, "", "bm90IGEga2V5", otherPkcs8]) {
      const s = await routeSigner(secret);
      expect("unavailable" in s, String(secret)).toBe(true);
      const t = target(OK);
      const r = await routeExecute(req([third("t", RO, "lookup")]), deps(t, { signer: s }));
      expect(r.http_status).toBe(503);
      expect(r.body.state).toBe("SIGNER_UNAVAILABLE");
      expect(t.fetchTarget).not.toHaveBeenCalled();
    }
  });

  it("an unknown call or payment key is BAD_ARGUMENTS, nothing called", async () => {
    for (const extra of [{ call: { arguments: {}, tool: "evil" } }, { payment: { x_payment: "p", amount: 1 } }, { confirm_action: "yes" }]) {
      const t = target(OK);
      const r = await routeExecute(req([third("t", RO, "lookup")], extra), deps(t));
      expect(r.body.state).toBe("BAD_ARGUMENTS");
      expect(t.fetchTarget).not.toHaveBeenCalled();
    }
  });

  it("a target answering 401 is handed back client-side; the edge never retries with anything", async () => {
    const t = target(() => ({ status: 401, body: { error: "auth" } }));
    const r = await routeExecute(req([third("t", RO, "lookup")]), deps(t));
    expect(r.body.state).toBe("CLIENT_SIDE");
    expect((r.body.receipt as any).observed.execution.status).toBe("TARGET_REQUIRES_AUTH");
    expect(t.toolCalls()).toHaveLength(1);
  });
});

/* ================================================================ F */
describe("F. receipts verify under did:web:csoai.org#route-attestation-1", () => {
  const outcomes: Array<[string, () => ReturnType<typeof target>, Record<string, unknown>]> = [
    ["EXECUTED", () => target(OK), req([third("t", RO, "lookup")])],
    ["NO_PERMITTED_CANDIDATE", () => target(OK), req([third("t", RO, "other")])],
    ["CLIENT_SIDE", () => target(OK), req([third("t", NL, "x")])],
    ["PAYMENT_REQUIRED", () => target(PAID_CHALLENGE), req([first("commission_card", "/mcp")], { policy: { caller_wallet: true }, confirm_action: true })],
  ];
  for (const [state, mk, body] of outcomes)
    it(`${state}: VALID against the DID document; any changed byte is INVALID`, async () => {
      const r = await routeExecute(body, deps(mk()));
      expect(r.body.state).toBe(state);
      const rec = r.body.receipt as Record<string, any>;
      expect(rec.signature).toMatchObject({ alg: "Ed25519", kid: "did:web:csoai.org#route-attestation-1", signed: "event_id" });
      expect(await verifyReceipt(rec, didDoc)).toEqual({ result: "VALID", reason: "signed by did:web:csoai.org#route-attestation-1" });
      const t1 = structuredClone(rec);
      t1.observed.execution.status = "EXECUTED_TAMPERED";
      expect((await verifyReceipt(t1, didDoc)).result).toBe("INVALID");
      const t2 = structuredClone(rec);
      t2.signature.sig = b64url(new Uint8Array(64));
      expect((await verifyReceipt(t2, didDoc)).result).toBe("INVALID");
      expect((await verifyReceipt(rec, { verificationMethod: [] })).result).toBe("UNVERIFIABLE_KEY");
      // the pinned production key did not sign a test receipt
      expect((await verifyReceipt(rec)).result).toBe("INVALID");
    });

  it("the executed receipt names the call by hashes and its execution mode", async () => {
    const r = await routeExecute(req([third("t", RO, "lookup")]), deps(target(OK)));
    const ex = (r.body.receipt as any).observed.execution;
    expect(ex).toMatchObject({ mode: "executed", status: "EXECUTED", where: "server", http_status: 200 });
    expect(ex.request_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(ex.response_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(ex.target.endpoint_sha256).toBe(sha(RO));
  });
});
