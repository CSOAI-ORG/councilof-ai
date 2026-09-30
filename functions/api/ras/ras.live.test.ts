/**
 * LIVE run of each RAS door against real public endpoints. Skipped unless RAS_LIVE=1.
 *
 *   RAS_LIVE=1 npx vitest run functions/api/ras/ras.live.test.ts
 *
 * The ONLY stub is the facilitator host (https://f.example): verify says valid, settle says
 * settled, so the door's real verify → settle code runs and nothing is paid. Every other request —
 * DNS-over-HTTPS, the MCP servers, the x402 doors, Circle's page, the Ethereum/Base RPCs,
 * councilof.ai, Hugging Face — goes to the real internet. Results are printed, not asserted beyond
 * shape: the live state of a third-party endpoint is the finding, not a test expectation.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { onRequestGet as mcpDoor } from "./mcp-probe";
import { onRequestGet as x402Door } from "./x402-check";
import { onRequestGet as supplyDoor } from "./supply";
import { onRequestGet as verifyGet } from "../verify";
import { onRequestGet as indexGet } from "../x402/[name]";

const LIVE = process.env.RAS_LIVE === "1";
const ORIGIN = "https://councilof.ai";
const PAY = btoa(JSON.stringify({ x402Version: 2, scheme: "exact", network: "eip155:8453", payload: {} }));
const ENV = { X402_FACILITATOR_URL: "https://f.example" };
const ctx = (path: string, headers: Record<string, string> = { "x-payment": PAY }) =>
  ({ request: new Request(ORIGIN + path, { headers }), env: ENV, params: {} }) as never;
const call = (h: unknown, c: unknown) => (h as (x: unknown) => Promise<Response>)(c);
const out: Record<string, unknown>[] = [];

describe.skipIf(!LIVE)("RAS doors — live, payment verification stubbed at the facilitator host only", () => {
  const real = globalThis.fetch;
  beforeAll(() => {
    vi.stubGlobal("fetch", async (u: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(u instanceof Request ? u.url : u));
      if (url.host === "f.example") {
        if (url.pathname.endsWith("/supported")) return new Response("nope", { status: 404 });
        if (url.pathname.endsWith("/settle")) return Response.json({ success: true, transaction: "0xLIVE-TEST-NOT-A-TX", network: "base", payer: "0xtest" });
        return Response.json({ isValid: true });
      }
      return real(u as RequestInfo, init);
    });
  });
  afterAll(() => {
    vi.unstubAllGlobals();
    console.log("RAS_LIVE_RESULTS " + JSON.stringify(out, null, 1));
  });

  it.each(["https://councilof.ai/mcp", "https://mcp.deepwiki.com/mcp"])("mcp-probe %s", async (target) => {
    const r = await call(mcpDoor, ctx(`/api/ras/mcp-probe?url=${encodeURIComponent(target)}`));
    const b = (await r.json()) as any;
    out.push({ door: "mcp-probe", target, http: r.status, state: b.result?.state, protocol: b.result?.protocol, tools: b.result?.tools && { count: b.result.tools.count, state: b.result.tools.state, sha: b.result.tools.names_sha256?.slice(0, 16) }, methods: b.result?.methods_sent, receipt_sha: b.receipt?.sha256?.slice(0, 16), settled: b.settle?.transaction ?? null, err: b.error ?? b.csoai?.not_delivered });
    expect(r.status).toBe(200);
    expect(["RESPONDED", "AUTH_REQUIRED", "NOT_MCP", "MCP_ERROR", "UNREACHABLE", "TIMEOUT"]).toContain(b.result.state);
    expect(b.result.tool_called).toBe(false);
  }, 60_000);

  it.each(["https://councilof.ai/api/free-door", "https://2s.io/api/geocode/address"])("x402-check %s", async (target) => {
    const r = await call(x402Door, ctx(`/api/ras/x402-check?url=${encodeURIComponent(target)}`));
    const b = (await r.json()) as any;
    out.push({ door: "x402-check", target, http: r.status, state: b.result?.state, row: b.result?.row, receipt_sha: b.receipt?.sha256?.slice(0, 16), err: b.error ?? b.csoai?.not_delivered });
    expect(r.status).toBe(200);
    expect(["CONFORMANT", "NOT_CONFORMANT", "UNREACHABLE"]).toContain(b.result.state);
  }, 60_000);

  it.each([["USDC", "ethereum"], ["USDC", "base"]])("supply %s on %s", async (asset, ledger) => {
    const r = await call(supplyDoor, ctx(`/api/ras/supply?asset=${asset}&ledger=${ledger}`));
    const b = (await r.json()) as any;
    out.push({ door: "supply", asset, ledger, http: r.status, evidence_kind: b.result?.evidence_kind, supply: b.result?.supply?.decimal, block: b.result?.height?.number, header_hash_recomputed: b.result?.height?.header_hash_recomputed, proof: b.result?.proof && { slot: b.result.proof.slot, account: b.result.proof.account_proof_verified, storage: b.result.proof.storage_proof_verified, err: b.result.proof.error }, two_operators_agree: b.result?.two_operators_agree, receipt_bytes_ok: !!b.receipt?.sha256, err: b.error ?? b.csoai?.not_delivered });
    // 200 = delivered; 402 = our read failed and nothing settled (also a correct outcome, recorded)
    expect([200, 402]).toContain(r.status);
  }, 120_000);

  it("verify ?record_url= a published signed card (free)", async () => {
    const rec = "https://councilof.ai/signed/cards/82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c.json";
    const r = await call(verifyGet, ctx(`/api/verify?record_url=${encodeURIComponent(rec)}`, {}));
    const b = (await r.json()) as any;
    out.push({ door: "verify", record: rec, http: r.status, state: b.state, family: b.family, fetched: b.fetched, reasons: b.reasons });
    expect(r.status).toBe(200);
    expect(b.free).toBe(true);
  }, 60_000);

  it("x402 index (free)", async () => {
    const r = await call(indexGet, { request: new Request(`${ORIGIN}/api/x402/index`), env: {}, params: { name: "index" } });
    const b = (await r.json()) as any;
    out.push({ door: "x402-index", http: r.status, state: b.state, latest_unsigned_run: b.latest_unsigned_run });
    expect(r.status).toBe(200);
  }, 60_000);
});
