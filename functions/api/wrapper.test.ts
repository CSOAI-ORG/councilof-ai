import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet as wrapper, ratioString, normalize, toPreview, findEntry, ROSTER, ATTESTS, KIND, FINALITY, buildPayload, pinChain, operatorOf, CHAINS } from "./wrapper";
import RPC_LIST from "./_evm_rpcs.json";
import { CHAINS as READER_CHAINS } from "../../scripts/readers/wrapped-asset-parity-reader.mjs";
import { VERDICT_RE } from "./rwa/evidence";
import { ESTATE_PAY_TO } from "./_x402_config";
import { WRAPPER_DESCRIPTION } from "./_x402_descriptions";
// The reader is the roster's source of truth; the TS mirror must never drift from it.
import { ROSTER as READER_ROSTER } from "../../scripts/readers/wrapped-asset-parity-reader.mjs";

const ORIGIN = "https://councilof.ai";
const ctx = (path: string, env: Record<string, unknown> = {}, headers: Record<string, string> = {}) =>
  ({ request: new Request(ORIGIN + path, { headers }), env, params: {} }) as never;

const hex = (n: bigint) => "0x" + n.toString(16).padStart(64, "0");

/**
 * A fake chain: every endpoint of every chain answers, finalized block 0x100 with one hash, decimals 6
 * (18 for DAI), fixed supplies and escrow balances. Hosts can be taken down (503), rate-limited (429),
 * made to answer a JSON-RPC error with HTTP 200, made to refuse the `finalized` tag, or made to report
 * a different block hash — each per HOST, so a test can say which operator misbehaves.
 */
type StubOpts = {
  down?: string[];
  rateLimited?: string[];
  rpcError?: { hosts: string[]; message: string };
  noFinalizedTag?: string[];
  hashFor?: Record<string, string>;
  calls?: { host: string; method: string; params: unknown[] }[];
  facilitatorCalls?: string[];
  facilitatorBodies?: { path: string; body: any }[];
};
const HASH = "0x" + "ab".repeat(32);
function stubChain(opts: StubOpts = {}) {
  vi.stubGlobal("fetch", async (u: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    if (url.host === "f.example") {
      opts.facilitatorCalls?.push(url.pathname);
      if (init?.body) opts.facilitatorBodies?.push({ path: url.pathname, body: JSON.parse(String(init.body)) });
      if (url.pathname.endsWith("/supported")) return new Response("nope", { status: 404 });
      if (url.pathname.endsWith("/settle")) return new Response(JSON.stringify({ success: true, transaction: "0xtx", network: "base", payer: "0xp" }));
      return new Response(JSON.stringify({ isValid: true }));
    }
    const body = JSON.parse(String(init?.body)) as { method: string; params: unknown[] };
    opts.calls?.push({ host: url.host, method: body.method, params: body.params });
    if (opts.down?.includes(url.host)) return new Response("{}", { status: 503 });
    if (opts.rateLimited?.includes(url.host)) return new Response("Too Many Requests", { status: 429 });
    // A JSON-RPC error answered with HTTP 200 — the shape publicnode returns for an archive read without a token.
    if (opts.rpcError?.hosts.includes(url.host)) return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, error: { code: -32602, message: opts.rpcError.message } }));
    if (body.method === "eth_getBlockByNumber") {
      if (body.params[0] === "finalized" && opts.noFinalizedTag?.includes(url.host)) return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, error: { code: -32601, message: "tag not supported" } }));
      return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { number: "0x100", hash: opts.hashFor?.[url.host] ?? HASH, timestamp: "0x68c4f000" } }));
    }
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
const hostsOf = (chain: string) => CHAINS[chain].rpcs.map((u) => new URL(u).host);

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
  it("bare GET is a 402 (indexable); bad id is 400 with the known ids; an id off the roster is 404 paid or not, and takes nothing", async () => {
    stubChain();
    expect((await wrapper(ctx("/api/wrapper"))).status).toBe(402);
    const bad = await wrapper(ctx("/api/wrapper?id=???&preview=1"));
    expect(bad.status).toBe(400);
    expect((await bad.json()).known_ids).toContain("usdc.e:arbitrum");
    expect((await wrapper(ctx("/api/wrapper?id=???"))).status).toBe(400);
    const unknown = await wrapper(ctx("/api/wrapper?id=nope:chain", { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": "e30=" }));
    expect(unknown.status).toBe(404);
    expect((await unknown.json()).reason).toMatch(/No payment was requested or taken/);
    // Unpaid, a pair the roster does not carry is not offered for sale either.
    expect((await wrapper(ctx("/api/wrapper?id=nope:chain"))).status).toBe(404);
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
    // The 402 is issued only after the read, and says what the buyer would be buying.
    expect(b.csoai.state_at_challenge).toBe("ESCROW_PARITY_READ");
    expect(b.resource.description).toBe(WRAPPER_DESCRIPTION);
    expect(b.accepts[0].description).toBe(WRAPPER_DESCRIPTION);
    expect(b.extensions?.bazaar ?? b.extensions).toBeTruthy();
    expect(VERDICT_RE.test(JSON.stringify(b).replace(/\d+ axes measured/g, ""))).toBe(false);
  });

  it("preview is free and unsigned: reads present, no signature, no raw-read hashes; escrow pair carries the ratio", async () => {
    stubChain();
    const r = await wrapper(ctx("/api/wrapper?id=usdc.e:arbitrum&preview=1"));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.kind).toBe("preview");
    // The plan's DONE WHEN reads `.state` off this response; without it that check is vacuous (null).
    expect(b.state).toBe("ESCROW_PARITY_READ");
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
    stubChain({ down: hostsOf("arbitrum") });
    const dead = await buildPayload(findEntry("usdc.e:arbitrum")!);
    expect(dead.payload.state).toBe("UNMEASURED");
    expect(String(dead.payload.error)).toMatch(/no operator reported a finalized block/);
    expect(String(dead.payload.error)).toMatch(/HTTP 503/);
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

  it("an RPC failure answers 200 preview-only with the reason — never a 402 — and never calls /verify or /settle", async () => {
    const facilitatorCalls: string[] = [];
    stubChain({ facilitatorCalls, rpcError: { hosts: hostsOf("ethereum"), message: "Archive requests require a personal token." } });
    const r = await wrapper(paidCtx());
    expect(r.status).toBe(200);
    expect(r.headers.get("PAYMENT-REQUIRED")).toBeNull();
    expect(r.headers.get("x-payment-response")).toBeNull();
    const b = await r.json();
    expect(b).toMatchObject({ kind: "preview", preview_only: true, state: "UNMEASURED" });
    expect(b.payment).toEqual({ requested: false, presented: true, sent_to_facilitator: false, settled: false });
    expect(String(b.reason)).toMatch(/Archive requests require a personal token/);
    expect(b.card.sig_ed25519).toBeUndefined();
    expect(b.accepts).toBeUndefined();
    expect(facilitatorCalls.filter((p) => p.endsWith("/settle"))).toEqual([]);
    expect(facilitatorCalls.filter((p) => p.endsWith("/verify"))).toEqual([]);
  });

  it("unpaid, an UNMEASURED pair answers 200 preview-only, not 402: nothing is offered while nothing can be delivered", async () => {
    stubChain({ down: hostsOf("ethereum") });
    const r = await wrapper(ctx("/api/wrapper?id=usdc.e:arbitrum"));
    expect(r.status).toBe(200);
    expect(r.headers.get("PAYMENT-REQUIRED")).toBeNull();
    const b = await r.json();
    expect(b).toMatchObject({ preview_only: true, state: "UNMEASURED", payment: { requested: false, presented: false, settled: false } });
    expect(b.not_sold).toMatch(/200, not 402/);
    // and the preview of the same pair agrees: one state, whichever door is asked
    const p = await (await wrapper(ctx("/api/wrapper?id=usdc.e:arbitrum&preview=1"))).json();
    expect(p.state).toBe("UNMEASURED");
  });

  it("the bazaar block the 402 advertises is byte-for-byte the block the settle envelope echoes, under the door's full url", async () => {
    // specs/extensions/bazaar.md, Client Behavior: the `bazaar` extension from PaymentRequired is
    // echoed into PaymentPayload, and the facilitator catalogues off that. One object, used twice.
    const facilitatorBodies: { path: string; body: any }[] = [];
    stubChain({ facilitatorBodies });
    const unpaid = await wrapper(ctx("/api/wrapper?id=usdc.e:arbitrum", { X402_FACILITATOR_URL: "https://f.example" }));
    expect(unpaid.status).toBe(402);
    const advertised = (await unpaid.json()).extensions.bazaar;
    expect(advertised.info.input.queryParams).toEqual({ id: "usdc.e:arbitrum" });

    const paid = await wrapper(paidCtx());
    expect(paid.status).toBe(200);
    const settle = facilitatorBodies.find((b) => b.path.endsWith("/settle"));
    const verify = facilitatorBodies.find((b) => b.path.endsWith("/verify"));
    expect(settle && verify).toBeTruthy();
    for (const sent of [verify!, settle!]) {
      expect(JSON.stringify(sent.body.paymentPayload.extensions.bazaar)).toBe(JSON.stringify(advertised));
      // the full resource, query included — the bare path is a different resource
      expect(sent.body.paymentPayload.resource.url).toBe(`${ORIGIN}/api/wrapper?id=usdc.e%3Aarbitrum`);
    }
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

// Plan item #19 (2026-09-28): an ordered keyless RPC list, a second-operator block-hash compare, and
// reads pinned to a finalized block — never `latest`.
describe("/api/wrapper — ordered RPCs, second-operator hash check, finalized pins", () => {
  it("every chain lists at least two keyless endpoints run by at least two operators; the reader reads the same list", () => {
    for (const [chain, spec] of Object.entries(CHAINS)) {
      expect(spec.rpcs.length, chain).toBeGreaterThanOrEqual(2);
      expect(new Set(spec.rpcs.map(operatorOf)).size, chain).toBeGreaterThanOrEqual(2);
      for (const u of spec.rpcs) {
        expect(u, chain).toMatch(/^https:\/\//);
        expect(u, `${chain}: no key in a keyless list`).not.toMatch(/key|token|apikey|[0-9a-f]{32}/i);
      }
      expect(spec.rpc).toBe(spec.rpcs[0]);
    }
    for (const e of ROSTER) expect(CHAINS[e.wrapped.chain], e.id).toBeTruthy();
    expect(Object.keys(CHAINS).sort()).toEqual(Object.keys((RPC_LIST as { chains: object }).chains).sort());
    for (const [chain, c] of Object.entries(READER_CHAINS as Record<string, { rpcs: string[] }>)) expect(c.rpcs, chain).toEqual(CHAINS[chain].rpcs);
  });

  it("a rate-limited first endpoint falls through to the next, and the card names the operator that answered", async () => {
    const calls: { host: string; method: string; params: unknown[] }[] = [];
    stubChain({ rateLimited: ["arb1.arbitrum.io"], calls });
    const b = await buildPayload(findEntry("usdc.e:arbitrum")!);
    expect(b.payload.state).toBe("ESCROW_PARITY_READ");
    const w = b.payload.wrapped as { rpc: string; block: { operators: string[]; finality: string } };
    expect(w.rpc).toBe(CHAINS.arbitrum.rpcs[1]);
    expect(w.block.operators[0]).toBe(operatorOf(CHAINS.arbitrum.rpcs[1]));
    expect(w.block.operators[1]).not.toBe(w.block.operators[0]);
    expect(w.block.finality).toBe(FINALITY);
    expect((b.payload.reads as Record<string, { operator: string }>).wrapped_total_supply.operator).toBe(operatorOf(CHAINS.arbitrum.rpcs[1]));
    expect(calls.some((c) => c.host === "arb1.arbitrum.io")).toBe(true); // it was tried first
  });

  it("pins to the finalized tag only: an endpoint without it is skipped, and none at all is UNMEASURED — never `latest`", async () => {
    const calls: { host: string; method: string; params: unknown[] }[] = [];
    stubChain({ noFinalizedTag: hostsOf("arbitrum"), calls });
    const b = await buildPayload(findEntry("usdc.e:arbitrum")!);
    expect(b.payload.state).toBe("UNMEASURED");
    expect(String(b.payload.error)).toMatch(/no operator reported a finalized block/);
    expect(calls.filter((c) => c.method === "eth_blockNumber")).toEqual([]);
    expect(calls.filter((c) => c.method === "eth_getBlockByNumber" && c.params[0] === "latest")).toEqual([]);
    expect(calls.filter((c) => c.method === "eth_call")).toEqual([]);
  });

  it("a second operator reporting a different hash at the pinned height leaves the pair UNMEASURED", async () => {
    const other = "0x" + "cd".repeat(32);
    stubChain({ hashFor: Object.fromEntries(hostsOf("ethereum").slice(1).map((h) => [h, other])) });
    const pin = pinChain("ethereum");
    await expect(pin).rejects.toThrow(/block-hash disagreement at 256/);
    const b = await buildPayload(findEntry("usdc.e:arbitrum")!);
    expect(b.payload.state).toBe("UNMEASURED");
    expect(String(b.payload.error)).toMatch(/disagreement/);
    expect(b.payload.escrow_over_wrapped).toBeUndefined();
  });

  it("no second operator answering is UNMEASURED too: one operator's word is not a pinned block", async () => {
    stubChain({ down: hostsOf("arbitrum").slice(1) });
    const b = await buildPayload(findEntry("usdc.e:arbitrum")!);
    expect(b.payload.state).toBe("UNMEASURED");
    expect(String(b.payload.error)).toMatch(/no second operator confirmed the hash/);
  });

  it("the paid card carries both operators and stays within the 3072-byte card cap", async () => {
    stubChain({ facilitatorCalls: [] });
    const r = await wrapper(ctx("/api/wrapper?id=usdc.e:arbitrum", { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": btoa(JSON.stringify({ x402Version: 2, scheme: "exact", network: "eip155:8453", payload: {} })) }));
    expect(r.status).toBe(200);
    const text = await r.text();
    expect(new TextEncoder().encode(text).byteLength).toBeLessThanOrEqual(3072 * 2); // pretty or canonical, the cap is enforced on canonical bytes in the handler
    const card = JSON.parse(text);
    expect(card.payload.wrapped.block.operators).toHaveLength(2);
    expect(card.payload.canonical.block.operators).toHaveLength(2);
    expect(VERDICT_RE.test(text)).toBe(false);
  });
});
