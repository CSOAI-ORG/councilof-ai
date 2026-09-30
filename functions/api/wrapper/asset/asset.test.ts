import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet as door, ASSET_DOORS, pairsFor, doorFor, PACK_SCHEMA, READ_BUDGET_MS } from "./[asset]";
import { onRequestGet as usdcRoute } from "./usdc";
import { CHAINS, WRAPPER_LID } from "../../wrapper";
import { VERDICT_RE } from "../../rwa/evidence";
import { wrapperAssetDescription } from "../../_x402_descriptions";
import READINESS from "../../../../public/interop/stablecoin-universe-2026-09/readiness.json";

const ORIGIN = "https://councilof.ai";
const ctx = (path: string, env: Record<string, unknown> = {}, headers: Record<string, string> = {}) =>
  ({ request: new Request(ORIGIN + path, { headers }), env, params: {} }) as never;
const hex = (n: bigint) => "0x" + n.toString(16).padStart(64, "0");
const PAY = btoa(JSON.stringify({ x402Version: 2, scheme: "exact", network: "eip155:8453", payload: {} }));

function stub(opts: { downChains?: string[]; facilitatorCalls?: string[]; calls?: string[] } = {}) {
  const down = new Set((opts.downChains ?? []).flatMap((c) => CHAINS[c].rpcs.map((u) => new URL(u).host)));
  vi.stubGlobal("fetch", async (u: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    if (url.host === "f.example") {
      opts.facilitatorCalls?.push(url.pathname);
      if (url.pathname.endsWith("/supported")) return new Response("nope", { status: 404 });
      if (url.pathname.endsWith("/settle")) return new Response(JSON.stringify({ success: true, transaction: "0xtx", network: "base", payer: "0xp" }));
      return new Response(JSON.stringify({ isValid: true }));
    }
    const body = JSON.parse(String(init?.body)) as { method: string; params: unknown[] };
    opts.calls?.push(`${url.host} ${body.method} ${JSON.stringify(body.params[0])}`);
    if (down.has(url.host)) return new Response("{}", { status: 503 });
    if (body.method === "eth_getBlockByNumber") return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { number: "0x100", hash: "0x" + "ab".repeat(32), timestamp: "0x68c4f000" } }));
    const { data } = body.params[0] as { data: string };
    if (data === "0x313ce567") return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: hex(6n) }));
    if (data === "0x18160ddd") return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: hex(48_501_527_000000n) }));
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: hex(52_222_558_000000n) }));
  });
}
afterEach(() => vi.unstubAllGlobals());

describe("/api/wrapper/asset/<asset> — registry", () => {
  it("every declared door has at least one roster pair, and names the asset's id in the stablecoin index", () => {
    const assets = (READINESS as { assets: { id: string; symbol: string }[] }).assets;
    expect(ASSET_DOORS.map((d) => d.asset)).toEqual(["usdc", "usdt", "dai"]);
    for (const d of ASSET_DOORS) {
      expect(pairsFor(d).length, d.asset).toBeGreaterThan(0);
      const row = assets.find((a) => a.id === d.stablecoin_index_id);
      expect(row?.symbol, d.asset).toBe(d.symbol);
    }
    expect(pairsFor(doorFor("usdc")!).map((e) => e.id)).toContain("usdc.e:arbitrum");
  });

  it("each door's description is the one template with its symbol filled in, and names states and free verification", () => {
    for (const d of ASSET_DOORS) {
      const text = wrapperAssetDescription(d.symbol);
      expect(text).toContain(d.symbol);
      expect(text).not.toContain("{ASSET}");
      expect(text).toMatch(/States per pair/);
      expect(text).toMatch(/verification is free/i);
      expect(text.length).toBeLessThanOrEqual(500);
    }
  });
});

describe("/api/wrapper/asset/<asset> — unpaid challenge latency (30 Sep 2026)", () => {
  it("a chain read slower than the budget still answers 402 within the budget, states PENDING_READ, and carries the wrapper lid", async () => {
    stub();
    const inner = globalThis.fetch;
    vi.stubGlobal("fetch", async (u: string | URL | Request, init?: RequestInit) => {
      await new Promise((r) => setTimeout(r, READ_BUDGET_MS + 1500));
      return inner(u, init);
    });
    const t0 = Date.now();
    const r = await door(ctx("/api/wrapper/asset/usdc"));
    const took = Date.now() - t0;
    expect(r.status).toBe(402);
    expect(took).toBeLessThan(READ_BUDGET_MS + 800);
    const b = await r.json();
    expect(b.csoai.states_at_challenge).toEqual({ PENDING_READ: pairsFor(doorFor("usdc")!).length });
    expect(b.csoai.states_source).toMatch(/PENDING_READ/);
    expect(b.csoai.states_source).toMatch(/never sent to the facilitator/);
    expect(b.csoai.lid).toBe(WRAPPER_LID);
    expect(b.csoai.lid).not.toMatch(/model fleets|leader/);
  }, 10_000);

  it("a read inside the budget is used as read (states from the chain, source fresh read)", async () => {
    stub();
    const b = await (await door(ctx("/api/wrapper/asset/usdc"))).json();
    expect(b.csoai.states_source).toBe("fresh read");
    expect(Object.keys(b.csoai.states_at_challenge)).not.toContain("PENDING_READ");
  });
});

describe("/api/wrapper/asset/<asset> — doors", () => {
  it("an unknown asset is 404 and takes nothing; the static route file serves the same handler", async () => {
    stub();
    const r = await door(ctx("/api/wrapper/asset/doge", { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": PAY }));
    expect(r.status).toBe(404);
    expect((await r.json()).known_assets).toEqual(["usdc", "usdt", "dai"]);
    expect((await usdcRoute(ctx("/api/wrapper/asset/usdc"))).status).toBe(402);
  });

  it("unpaid and readable → 402, path-scoped resource, the asset's description, the states it read", async () => {
    stub();
    const r = await door(ctx("/api/wrapper/asset/usdc"));
    expect(r.status).toBe(402);
    expect(r.headers.get("PAYMENT-REQUIRED")).toBeTruthy();
    const b = await r.json();
    expect(b.x402Version).toBe(2);
    expect(b.resource.url).toBe(`${ORIGIN}/api/wrapper/asset/usdc`);
    expect(b.resource.description).toBe(wrapperAssetDescription("USDC"));
    expect(b.accepts[0].description).toBe(wrapperAssetDescription("USDC"));
    expect(b.csoai.pairs).toEqual(pairsFor(doorFor("usdc")!).map((e) => e.id));
    expect(Object.values(b.csoai.states_at_challenge as Record<string, number>).reduce((a, n) => a + n, 0)).toBe(b.csoai.pairs.length);
    expect(b.extensions?.bazaar).toBeTruthy();
  });

  it("each chain is pinned once per request, shared by every pair on it", async () => {
    const calls: string[] = [];
    stub({ calls });
    await door(ctx("/api/wrapper/asset/usdc?preview=1"));
    const finalizedAsks = calls.filter((c) => c.includes("eth_getBlockByNumber") && c.includes('"finalized"'));
    const chains = new Set(pairsFor(doorFor("usdc")!).flatMap((e) => [e.wrapped.chain, e.canonical.chain]).filter((c) => CHAINS[c]));
    expect(finalizedAsks.length).toBe(chains.size);
  });

  it("every pair UNMEASURED → 200 preview-only, unpaid or paid, and the facilitator is never called", async () => {
    const facilitatorCalls: string[] = [];
    stub({ downChains: Object.keys(CHAINS), facilitatorCalls });
    const unpaid = await door(ctx("/api/wrapper/asset/dai"));
    expect(unpaid.status).toBe(200);
    expect(await unpaid.json()).toMatchObject({ preview_only: true, state: "UNMEASURED", payment: { requested: false, settled: false } });
    const paid = await door(ctx("/api/wrapper/asset/dai", { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": PAY }));
    expect(paid.status).toBe(200);
    expect(await paid.json()).toMatchObject({ preview_only: true, payment: { presented: true, sent_to_facilitator: false, settled: false } });
    expect(facilitatorCalls).toEqual([]);
  });

  it("paid: one signed-or-unsigned card per readable pair, UNMEASURED pairs listed and never carded, settled once", async () => {
    const facilitatorCalls: string[] = [];
    // Polygon down: usdc.e:polygon is UNMEASURED, every other USDC pair reads.
    stub({ downChains: ["polygon"], facilitatorCalls });
    const r = await door(ctx("/api/wrapper/asset/usdc", { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": PAY }));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.schema).toBe(PACK_SCHEMA);
    const total = pairsFor(doorFor("usdc")!).length;
    expect(b.cards.length + b.unmeasured_pairs.length).toBe(total);
    expect(b.unmeasured_pairs.map((p: { id: string }) => p.id)).toEqual(["usdc.e:polygon"]);
    for (const c of b.cards) {
      expect(c.payload.state).not.toBe("UNMEASURED");
      expect(c.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(b.pack_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(facilitatorCalls.filter((p) => p.endsWith("/settle"))).toHaveLength(1);
    expect(VERDICT_RE.test(JSON.stringify(b.cards))).toBe(false);
  });
});
