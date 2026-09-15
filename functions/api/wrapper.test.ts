import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet as wrapper, ratioString, normalize, toPreview, findEntry, ROSTER, ATTESTS, KIND, buildPayload, CHAINS } from "./wrapper";
import { VERDICT_RE } from "./rwa/evidence";
import { ESTATE_PAY_TO } from "./_x402_config";
// The reader is the roster's source of truth; the TS mirror must never drift from it.
import { ROSTER as READER_ROSTER } from "../../scripts/readers/wrapped-asset-parity-reader.mjs";

const ORIGIN = "https://councilof.ai";
const ctx = (path: string, env: Record<string, unknown> = {}, headers: Record<string, string> = {}) =>
  ({ request: new Request(ORIGIN + path, { headers }), env, params: {} }) as never;

const hex = (n: bigint) => "0x" + n.toString(16).padStart(64, "0");

/** A fake chain: finalized block per host, decimals 6 (18 for DAI), fixed supplies and escrow balances. */
function stubChain(opts: { down?: string; rpcError?: { host: string; message: string }; facilitatorCalls?: string[] } = {}) {
  vi.stubGlobal("fetch", async (u: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    if (url.host === "f.example") {
      opts.facilitatorCalls?.push(url.pathname);
      if (url.pathname.endsWith("/supported")) return new Response("nope", { status: 404 });
      if (url.pathname.endsWith("/settle")) return new Response(JSON.stringify({ success: true, transaction: "0xtx", network: "base", payer: "0xp" }));
      return new Response(JSON.stringify({ isValid: true }));
    }
    if (opts.down && url.host === opts.down) return new Response("{}", { status: 503 });
    // A JSON-RPC error answered with HTTP 200 — the shape publicnode returns for an archive read without a token.
    if (opts.rpcError && url.host === opts.rpcError.host) return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, error: { code: -32602, message: opts.rpcError.message } }));
    const body = JSON.parse(String(init?.body)) as { method: string; params: unknown[] };
    if (body.method === "eth_getBlockByNumber") return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { number: "0x100", hash: "0x" + "ab".repeat(32), timestamp: "0x68c4f000" } }));
    if (body.method === "eth_call") {
      const { to, data } = body.params[0] as { to: string; data: string };
      const dai = /6B175474E89094C44Da98b954EedeAC495271d0F|DA10009cBd5D07dd0CeCc66161FC93D7c9000da1|50c5725949A6F0c72E6C4a641F24049A917DB0Cb/i.test(to);
      if (data === "0x313ce567") return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: hex(dai ? 18n : 6n) }));
      if (data === "0x18160ddd") return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: hex(48_501_527_000000n) }));
      if (data.startsWith("0x70a08231")) return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: hex(52_222_558_000000n) }));
    }
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, error: { message: "unexpected" } }));
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("/api/wrapper — arithmetic and doctrine", () => {
  it("ratio is BigInt, six places, truncated; normalize keeps every decimal", () => {
    expect(ratioString(52_222_558_000000n, 48_501_527_000000n)).toBe("1.076719");
    expect(ratioString(1n, 3n)).toBe("0.333333");
    expect(ratioString(5n, 0n)).toBeNull();
    expect(normalize(1_000_001n, 6)).toBe("1.000001");
    expect(normalize(42n, 0)).toBe("42");
  });

  it("the TS roster mirrors the reader's roster exactly, and every id is unique", () => {
    expect(JSON.parse(JSON.stringify(ROSTER))).toEqual(JSON.parse(JSON.stringify(READER_ROSTER)));
    expect(new Set(ROSTER.map((e) => e.id)).size).toBe(ROSTER.length);
    expect(findEntry("usdc.e:arbitrum")?.backing_model).toBe("escrow");
    expect(findEntry("usdc:base")?.backing_model).toBe("native");
    expect(findEntry("wbtc:ethereum")?.backing_model).toBe("custodial");
  });

  it("never carries a verdict word or MEASURED — a read is not a measurement", () => {
    expect(VERDICT_RE.test(ATTESTS)).toBe(false);
    expect(VERDICT_RE.test(KIND)).toBe(false);
    expect(VERDICT_RE.test("ESCROW_PARITY_READ UNCHECKABLE_NATIVE_ISSUANCE UNMEASURED")).toBe(false);
    expect(VERDICT_RE.test("MEASURED_ESCROW_PARITY")).toBe(true); // why that name was dropped
  });
});

describe("/api/wrapper — doors", () => {
  it("bare GET is a 402 (indexable); bad id on preview is 400 with the known ids; unknown id with payment is 404 and takes nothing", async () => {
    stubChain();
    expect((await wrapper(ctx("/api/wrapper"))).status).toBe(402);
    const bad = await wrapper(ctx("/api/wrapper?id=???&preview=1"));
    expect(bad.status).toBe(400);
    expect((await bad.json()).known_ids).toContain("usdc.e:arbitrum");
    const unknown = await wrapper(ctx("/api/wrapper?id=nope:chain", { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": "e30=" }));
    expect(unknown.status).toBe(404);
    expect((await unknown.json()).reason).toMatch(/No payment was taken/);
  });

  it("402 carries the shared accepts entry, the free preview and ledger pointers, and x402 v2 + bazaar", async () => {
    stubChain();
    const r = await wrapper(ctx("/api/wrapper?id=usdc.e:arbitrum"));
    expect(r.status).toBe(402);
    expect(r.headers.get("PAYMENT-REQUIRED")).toBeTruthy();
    const b = await r.json();
    expect(b.x402Version).toBe(2);
    expect(b.accepts).toHaveLength(1);
    expect(b.accepts[0]).toMatchObject({ scheme: "exact", network: "eip155:8453", payTo: ESTATE_PAY_TO });
    expect(b.csoai.free_preview).toBe(`${ORIGIN}/api/wrapper?id=usdc.e%3Aarbitrum&preview=1`);
    expect(b.csoai.free_ledger).toMatch(/wrapped-asset-parity/);
    expect(b.extensions?.bazaar ?? b.extensions).toBeTruthy();
    expect(VERDICT_RE.test(JSON.stringify(b).replace(/22 axes measured/g, ""))).toBe(false);
  });

  it("preview is free and unsigned: reads present, no signature, no raw-read hashes; escrow pair carries the ratio", async () => {
    stubChain();
    const r = await wrapper(ctx("/api/wrapper?id=usdc.e:arbitrum&preview=1"));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.kind).toBe("preview");
    expect(b.card.preview).toBe(true);
    expect(b.card.sig_ed25519).toBeUndefined();
    expect(b.card.payload.inputs_sha256).toBeUndefined();
    expect(b.card.payload.reads.wrapped_total_supply.raw_sha256).toBeUndefined();
    expect(b.card.payload.state).toBe("ESCROW_PARITY_READ");
    expect(b.card.payload.escrow_over_wrapped).toBe("1.076719");
    expect(b.card.payload.reads.wrapped_total_supply.normalized).toBe("48501527.000000");
    expect(b.card.subject).toContain("ESCROW_PARITY_READ");
  });

  it("a native-issuance pair reads supply but claims no parity; a dead RPC is UNMEASURED with the error recorded", async () => {
    stubChain();
    const native = await (await wrapper(ctx("/api/wrapper?id=usdc:base&preview=1"))).json();
    expect(native.card.payload.state).toBe("UNCHECKABLE_NATIVE_ISSUANCE");
    expect(native.card.payload.escrow_over_wrapped).toBeNull();
    expect(native.card.payload.reads.escrow_balance).toBeUndefined();
    expect(native.card.unmeasured.join(" ")).toMatch(/no escrow exists/);
    stubChain({ down: "arb1.arbitrum.io" });
    const dead = await buildPayload(findEntry("usdc.e:arbitrum")!);
    expect(dead.payload.state).toBe("UNMEASURED");
    expect(String(dead.payload.error)).toMatch(/RPC/);
    expect((dead.payload.unmeasured as string[]).join(" ")).toMatch(/nothing inferred/);
  });

  it("a custodial wrapper reads its supply and stays INDEXED — no reserve read, no ratio, no 'unbacked'", async () => {
    stubChain();
    const b = await (await wrapper(ctx("/api/wrapper?id=wbtc:ethereum&preview=1"))).json();
    expect(b.card.payload.state).toBe("INDEXED_CUSTODIAL");
    expect(b.card.payload.escrow_over_wrapped).toBeNull();
    expect(b.card.payload.reads.escrow_balance).toBeUndefined();
    expect(b.card.payload.reads.wrapped_total_supply).toBeTruthy();
    expect(b.card.unmeasured.join(" ")).toMatch(/custodian-held/);
    expect(JSON.stringify(b)).not.toMatch(/unbacked/);
  });

  it("preview strips exactly the metered fields and nothing else", () => {
    const card = { schema: "s", payload: { inputs_sha256: "x", reads: { a: { raw_sha256: "y", atomic: "1" } }, state: "UNMEASURED" }, sha256: "z", sig_ed25519: "w", did: "d" };
    const p = toPreview(card) as { payload: { inputs_sha256?: string; reads: { a: { raw_sha256?: string; atomic: string } } }; sha256?: string; sig_ed25519?: string; did?: string; preview: boolean };
    expect(p.preview).toBe(true);
    expect(p.sha256).toBeUndefined(); expect(p.sig_ed25519).toBeUndefined(); expect(p.did).toBeUndefined();
    expect(p.payload.inputs_sha256).toBeUndefined();
    expect(p.payload.reads.a.raw_sha256).toBeUndefined();
    expect(p.payload.reads.a.atomic).toBe("1");
  });
});

// 2026-09-15 end-user test: the paid door verified AND SETTLED before it read the chain, so on a day
// the Ethereum RPC refused pinned-block reads a paying agent would have been charged for a card that
// says "chain reads (rpc failed; nothing inferred)". The read now runs first; UNMEASURED settles nothing.
describe("/api/wrapper — reads the chain before it settles", () => {
  const PAY = btoa(JSON.stringify({ x402Version: 2, scheme: "exact", network: "eip155:8453", payload: {} }));
  const paidCtx = () => ctx("/api/wrapper?id=usdc.e:arbitrum", { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": PAY });

  it("an RPC failure returns the unpaid challenge with the reason, and never calls /verify or /settle", async () => {
    const facilitatorCalls: string[] = [];
    stubChain({ facilitatorCalls, rpcError: { host: new URL(CHAINS.ethereum.rpc).host, message: "Archive requests require a personal token." } });
    const r = await wrapper(paidCtx());
    expect(r.status).toBe(402);
    expect(r.headers.get("PAYMENT-REQUIRED")).toBeTruthy();
    expect(r.headers.get("x-payment-response")).toBeNull();
    const b = await r.json();
    expect(b.x402Version).toBe(2);
    expect(b.accepts).toHaveLength(1);
    expect(b.extensions?.bazaar).toBeTruthy();
    expect(b.csoai.read_before_settle).toMatchObject({ state: "UNMEASURED", settled: false });
    expect(String(b.csoai.read_before_settle.error)).toMatch(/Archive requests require a personal token/);
    expect(String(b.csoai.not_paid_reason)).toMatch(/UNMEASURED/);
    expect(facilitatorCalls.filter((p) => p.endsWith("/settle"))).toEqual([]);
    expect(facilitatorCalls.filter((p) => p.endsWith("/verify"))).toEqual([]);
  });

  it("control: a successful read verifies, settles once, and delivers the card with the payment response", async () => {
    const facilitatorCalls: string[] = [];
    stubChain({ facilitatorCalls });
    const r = await wrapper(paidCtx());
    expect(r.status).toBe(200);
    expect(r.headers.get("x-payment-response")).toBeTruthy();
    const card = await r.json();
    expect(card.payload.state).toBe("ESCROW_PARITY_READ");
    expect(facilitatorCalls.filter((p) => p.endsWith("/verify")).length).toBeGreaterThan(0);
    expect(facilitatorCalls.filter((p) => p.endsWith("/settle"))).toHaveLength(1);
  });
});
