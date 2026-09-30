import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import { onRequestGet as door, onRequestHead, parseCaip19, recordsFor, caip19Of, PATH_PREFIX, SCHEMA } from "./[[caip]]";
import { onRequestGet as evidence, L, datedLedgerPath } from "../../../w/[id]";
import { CHAINS, ROSTER } from "../../wrapper";
import WALLET from "../../../../public/wallet/measured-wrappers.json";

const ORIGIN = "https://councilof.ai";
const ctx = (path: string, headers: Record<string, string> = {}) => ({ request: new Request(ORIGIN + path, { headers }), env: {}, params: {} }) as never;
const hex = (n: bigint) => "0x" + n.toString(16).padStart(64, "0");

function stub(opts: { downChains?: string[]; calls?: string[] } = {}) {
  const down = new Set((opts.downChains ?? []).flatMap((c) => CHAINS[c].rpcs.map((u) => new URL(u).host)));
  vi.stubGlobal("fetch", async (u: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    const body = JSON.parse(String(init?.body)) as { method: string; params: unknown[] };
    opts.calls?.push(`${url.host} ${body.method}`);
    if (down.has(url.host)) return new Response("{}", { status: 503 });
    if (body.method === "eth_getBlockByNumber") return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { number: "0x100", hash: "0x" + "ab".repeat(32), timestamp: "0x68c4f000" } }));
    const { data } = body.params[0] as { data: string };
    if (data === "0x313ce567") return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: hex(6n) }));
    if (data === "0x18160ddd") return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: hex(48_501_527_000000n) }));
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: hex(52_222_558_000000n) }));
  });
}
afterEach(() => vi.unstubAllGlobals());

const USDCE_ARB = "eip155:42161/erc20:0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8";

describe("/api/wrapper/caip19/<CAIP-19> — free preview by contract", () => {
  it("parses eip155 erc20 CAIP-19 only", () => {
    expect(parseCaip19(USDCE_ARB)).toEqual({ chainId: 42161, address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8" });
    expect(parseCaip19("eip155:1/slip44:60")).toBeNull();
    expect(parseCaip19("solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")).toBeNull();
    expect(parseCaip19("eip155:0/erc20:0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8")).toBeNull();
  });

  it("answers 200 with the state, as_of, a /w/ evidence link and the published ledger state; never 402", async () => {
    stub();
    const res = await door(ctx(PATH_PREFIX + USDCE_ARB));
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    const b = (await res.json()) as Record<string, any>;
    expect(b.schema).toBe(SCHEMA);
    expect(b.free).toBe(true);
    expect(b.payment).toEqual({ requested: false });
    expect(b.state).toBe("ESCROW_PARITY_READ");
    expect(b.records).toHaveLength(1);
    const r = b.records[0];
    expect(r.id).toBe("usdc.e:arbitrum");
    expect(r.as_of).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
    expect(r.evidence).toBe(`${ORIGIN}/w/usdc.e:arbitrum`);
    expect(r.published.state).toBe(L.records.find((x) => x.id === "usdc.e:arbitrum")!.state);
    expect(r.card.preview).toBe(true);
    expect(r.card.sig_ed25519).toBeUndefined();
  });

  it("matches the address case-insensitively and reads every record on one contract, pinning each chain once", async () => {
    const calls: string[] = [];
    stub({ calls });
    const res = await door(ctx(PATH_PREFIX + "eip155:42161/erc20:0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9"));
    const b = (await res.json()) as Record<string, any>;
    expect(res.status).toBe(200);
    expect(b.records.map((r: { id: string }) => r.id).sort()).toEqual(["usdt0:arbitrum", "usdt:arbitrum"]);
    expect(calls.filter((c) => c.endsWith("eth_getBlockByNumber")).length).toBe(2); // finalized + second-operator confirm, once
  });

  it("UNMEASURED is a 200 preview, not an error and not a sale", async () => {
    stub({ downChains: ["arbitrum"] });
    const res = await door(ctx(PATH_PREFIX + USDCE_ARB));
    expect(res.status).toBe(200);
    const b = (await res.json()) as Record<string, any>;
    expect(b.state).toBe("UNMEASURED");
    expect(b.payment).toEqual({ requested: false });
  });

  it("404 for a contract not on the roster, 400 for a malformed CAIP-19; HEAD mirrors GET", async () => {
    stub();
    const nf = await door(ctx(PATH_PREFIX + "eip155:1/erc20:0x0000000000000000000000000000000000000001"));
    expect(nf.status).toBe(404);
    expect(((await nf.json()) as Record<string, string>).reason).toMatch(/No wrapped-asset measurement is on record/);
    expect((await door(ctx(PATH_PREFIX + "not-a-caip"))).status).toBe(400);
    const head = await onRequestHead(ctx(PATH_PREFIX + "not-a-caip"));
    expect(head.status).toBe(400);
    expect(await head.text()).toBe("");
  });

  it("every token in the wallet list resolves here and at its /w/ evidence link, with the list's state", async () => {
    stub();
    const tokens = (WALLET as { tokens: { caip19: string; records: string[]; state: string; evidence: string }[] }).tokens;
    expect(tokens.length).toBeGreaterThan(0);
    for (const t of tokens) {
      const p = parseCaip19(t.caip19)!;
      expect(recordsFor(p.chainId, p.address).map((e) => e.id).sort(), t.caip19).toEqual([...t.records].sort());
      const ev = await evidence(ctx(new URL(t.evidence).pathname));
      expect(ev.status, t.evidence).toBe(200);
      const body = (await ev.json()) as Record<string, any>;
      expect(body.state).toBe(t.state);
      expect(body.record.id).toBe(t.records[0]);
    }
    expect(ROSTER.every((e) => caip19Of(e).startsWith("eip155:"))).toBe(true);
  });
});

describe("/w/<id> — the token list's short evidence link", () => {
  it("serves the ledger record verbatim with the dated ledger and its OTS proof file, both on disk", async () => {
    const res = await evidence(ctx("/w/usdt:arbitrum"));
    expect(res.status).toBe(200);
    const b = (await res.json()) as Record<string, any>;
    expect(b.record).toEqual(L.records.find((r) => r.id === "usdt:arbitrum"));
    expect(b.same_contract_records).toEqual(["usdt0:arbitrum"]);
    expect(b.live_preview).toBe(`${ORIGIN}/api/wrapper/caip19/eip155:42161/erc20:0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9`);
    const dated = datedLedgerPath(L.as_of);
    expect(existsSync(`public${dated}`)).toBe(true);
    expect(existsSync(`public${dated}.ots`)).toBe(true);
    expect(b.ledger.url).toBe(ORIGIN + dated);
  });

  it("404 names the known ids; every link fits the token-list 42-character cap", async () => {
    const res = await evidence(ctx("/w/nope:nowhere"));
    expect(res.status).toBe(404);
    expect(((await res.json()) as { known_ids: string[] }).known_ids).toContain("usdc.e:arbitrum");
    for (const r of L.records) expect(`${ORIGIN}/w/${r.id}`.length, r.id).toBeLessThanOrEqual(42);
  });
});
