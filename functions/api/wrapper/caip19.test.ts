import { describe, expect, it, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { onRequestGet as lookupGet, onRequestHead as lookupHead } from "./caip19/[[id]]";
import { onRequestGet as indexGet } from "./index.json";
import { buildIndex, caip19Of, normalizeCaip19, CANDIDATE_STATES } from "./_caip19";
import { WRAPPER_ROSTER } from "../_wrapper_roster";
import ARCHIVE from "./_caip_archive.json";
import * as gen from "../../../scripts/readers/wrapper-caip-ledger.mjs";

const ORIGIN = "https://councilof.ai";
const USDC_ETH = "eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const USDCE_ARB = "eip155:42161/erc20:0xff970a61a04b1ca14834a43f5de4533ebddb5cc8";

const LEDGER = {
  schema: "csoai.wrapped-asset-parity/0.1",
  as_of: "2026-09-14T10:51:51.468Z",
  records: [{ id: "usdc.e:arbitrum", state: "ESCROW_PARITY_READ", escrow_over_wrapped: "1.000000" }],
};
const assets = (status = 200) => ({
  fetch: vi.fn(async (r: Request | string) => {
    const url = typeof r === "string" ? r : r.url;
    if (status === 200 && url.endsWith("/interop/wrapped-asset-parity-latest.json")) return new Response(JSON.stringify(LEDGER));
    return new Response("not found", { status: 404 });
  }),
});
const ctx = (path: string, env: Record<string, unknown> = {}) => {
  const u = new URL(ORIGIN + path);
  const rest = u.pathname.startsWith("/api/wrapper/caip19/") ? u.pathname.slice("/api/wrapper/caip19/".length) : "";
  return { request: new Request(u.toString()), env, params: rest ? { id: rest.split("/") } : {} } as never;
};

afterEach(() => vi.unstubAllGlobals());

describe("CAIP-19 keying", () => {
  it("maps ERC-20 sides to eip155 erc20 ids, lower-cased", () => {
    expect(caip19Of({ chain: "arbitrum", symbol: "USDC.e", address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8" }).caip19).toBe(USDCE_ARB);
    expect(caip19Of({ chain: "ethereum", symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" }).caip19).toBe(USDC_ETH);
  });

  it("maps native counterparts through SLIP-44 and says why an off-ledger side has no id", () => {
    expect(caip19Of({ chain: "bitcoin", symbol: "BTC", address: "custody" }).caip19).toBe("bip122:000000000019d6689c085ae165831e93/slip44:0");
    expect(caip19Of({ chain: "xrpl", symbol: "XRP", address: "custody" }).caip19).toBe("xrpl:0/slip44:144");
    expect(caip19Of({ chain: "ethereum", symbol: "ETH", address: "native ETH (not an ERC-20 contract)" }).caip19).toBe("eip155:1/slip44:60");
    const off = caip19Of({ chain: "offchain", symbol: "USD deposits", address: "bank deposits" });
    expect(off.caip19).toBeNull();
    expect(off.why_null).toMatch(/off any public ledger/);
  });

  it("normalises and validates CAIP-19", () => {
    expect(normalizeCaip19("eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")).toBe(USDC_ETH);
    expect(normalizeCaip19("xrpl:0/slip44:144")).toBe("xrpl:0/slip44:144");
    expect(normalizeCaip19("usdc.e:arbitrum")).toBeNull();
    expect(normalizeCaip19("eip155:1/erc20:0x1234")).toBeNull();
    expect(normalizeCaip19("")).toBeNull();
  });

  it("keys every roster side, or lists it as unkeyed with a reason — none dropped", () => {
    const { assets, unkeyed } = buildIndex();
    const roster = WRAPPER_ROSTER as unknown as { id: string }[];
    for (const r of roster) {
      for (const side of ["wrapped", "canonical"] as const) {
        const hit = assets.some((a) => a.pairs.some((p) => p.pair === r.id && p.side === side)) || unkeyed.some((u) => u.pair === r.id && u.side === side);
        expect(hit, `${r.id} ${side}`).toBe(true);
      }
    }
    for (const u of unkeyed) expect(u.why_null.length).toBeGreaterThan(10);
    expect(new Set(assets.map((a) => a.caip19)).size).toBe(assets.length);
  });

  it("indexes every per-deployment archive row, and the archive map agrees with the shared keying", () => {
    const rows = (ARCHIVE as { rows: { caip19: string; chain: string; symbol: string; address: string; archive: string }[] }).rows;
    expect(rows.length).toBeGreaterThan(0);
    const { assets } = buildIndex();
    for (const r of rows) {
      expect(caip19Of(r).caip19).toBe(r.caip19);
      expect(assets.find((a) => a.caip19 === r.caip19)?.archive).toBe(r.archive);
      expect(r.archive).toMatch(/^\/archive\/evm-[a-z0-9-]+\/index\.json$/);
    }
  });

  it("uses the same CAIP-2 table as the candidate ledger generator", () => {
    const src = readFileSync(new URL("../../../scripts/readers/wrapper-caip-ledger.mjs", import.meta.url), "utf8");
    expect(src).toContain("functions/api/wrapper/_caip2.json");
  });
});

describe("GET /api/wrapper/caip19/<id>", () => {
  it("finds a canonical asset and every pair it backs, with links to the existing door", async () => {
    const res = await lookupGet(ctx(`/api/wrapper/caip19/${USDC_ETH}`, { ASSETS: assets() }));
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    const body = await res.json();
    expect(body.found).toBe(true);
    expect(body.caip19).toBe(USDC_ETH);
    const arb = body.pairs.find((p: { pair: string }) => p.pair === "usdc.e:arbitrum");
    expect(arb.side).toBe("canonical");
    expect(arb.counterpart.caip19).toBe(USDCE_ARB);
    expect(arb.preview).toBe("/api/wrapper?id=usdc.e%3Aarbitrum&preview=1");
    expect(arb.asset_door).toBe("/api/wrapper/asset/usdc");
    expect(arb.public_record).toEqual({ ledger: "/interop/wrapped-asset-parity-latest.json", as_of: LEDGER.as_of, state: "ESCROW_PARITY_READ", state_vocabulary: LEDGER.schema, escrow_over_wrapped: "1.000000" });
    expect(body.candidate_batch.status).toBe("HELD");
    expect(body.candidate_batch.vocabulary).toEqual([...CANDIDATE_STATES]);
  });

  it("accepts an encoded id, a mixed-case address and ?id=", async () => {
    const enc = encodeURIComponent("eip155:42161/erc20:0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8");
    const a = await lookupGet(ctx(`/api/wrapper/caip19/${enc}`));
    expect(a.status).toBe(200);
    expect((await a.json()).caip19).toBe(USDCE_ARB);
    const b = await lookupGet(ctx(`/api/wrapper/caip19?id=${encodeURIComponent(USDCE_ARB)}`));
    expect(b.status).toBe(200);
    const body = await b.json();
    expect(body.pairs[0].pair).toBe("usdc.e:arbitrum");
    expect(body.pairs[0].side).toBe("wrapped");
    expect(body.pairs[0].public_record).toBeNull();
  });

  it("answers without the ledger file and never reads a chain", async () => {
    const fetchSpy = vi.fn(async () => new Response("{}"));
    vi.stubGlobal("fetch", fetchSpy);
    const res = await lookupGet(ctx(`/api/wrapper/caip19/${USDC_ETH}`, { ASSETS: assets(404) }));
    expect(res.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("404s a valid id that is not listed, 400s a non-CAIP id and an empty path", async () => {
    const miss = await lookupGet(ctx("/api/wrapper/caip19/eip155:1/erc20:0x0000000000000000000000000000000000000001"));
    expect(miss.status).toBe(404);
    expect((await miss.json()).found).toBe(false);
    expect((await lookupGet(ctx("/api/wrapper/caip19/usdc.e:arbitrum"))).status).toBe(400);
    expect((await lookupGet(ctx("/api/wrapper/caip19"))).status).toBe(400);
  });

  it("finds an archive-only deployment", async () => {
    const row = (ARCHIVE as { rows: { caip19: string; archive: string }[] }).rows[0];
    const res = await lookupGet(ctx(`/api/wrapper/caip19/${row.caip19}`));
    expect(res.status).toBe(200);
    expect((await res.json()).archive).toBe(row.archive);
  });

  it("HEAD mirrors GET status with no body", async () => {
    const res = await lookupHead(ctx(`/api/wrapper/caip19/${USDC_ETH}`));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("");
  });
});

describe("GET /api/wrapper/index.json", () => {
  it("lists every keyed asset with a lookup URL and counts that add up", async () => {
    const res = await indexGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("SovX wrapped-asset measurements");
    expect(body.counts.assets).toBe(body.assets.length);
    expect(body.counts.unkeyed_sides).toBe(body.unkeyed.length);
    expect(body.counts.pairs).toBe((WRAPPER_ROSTER as unknown[]).length);
    for (const a of body.assets) expect(a.lookup).toBe(`/api/wrapper/caip19/${a.caip19}`);
    expect(body.caip2.arbitrum).toBe("eip155:42161");
  });

  it("keeps doctrine: no internal codename, no price, no certifying language", async () => {
    const text = await (await indexGet()).text();
    expect(text).not.toMatch(/pontius|venturi|sovos/i);
    expect(text).not.toMatch(/\$\s?\d|\bUSD\s?\d|"price"|"amount"/i);
    const affirmative = text.replace(/"not a [^"]*"|"no reserve adequacy[^"]*"|"a listing is not an endorsement"/g, "");
    expect(affirmative).not.toMatch(/certif|attestation|audit|proof of reserve|rated|ranking/i);
  });
});

describe("candidate ledger state rules (scripts/readers/wrapper-caip-ledger.mjs)", () => {
  const amt = (atomic: string, decimals: number) => ({ atomic, decimals });
  const bridgeQuote = [{ state: "QUOTED", role: "bridge", quote: "tokens are locked" }];
  it("CONSISTENT only when escrow >= supply at equal decimals, with a bridge-side quote", () => {
    const base = { backing_model: "escrow", disclosures: bridgeQuote, error: null };
    expect(gen.deriveState({ ...base, reads: { escrow_balance: amt("1000000", 6), wrapped_total_supply: amt("1000000000000000000", 18) } }).state).toBe("CONSISTENT");
    expect(gen.deriveState({ ...base, reads: { escrow_balance: amt("999999", 6), wrapped_total_supply: amt("1000000000000000000", 18) } }).state).toBe("INCONSISTENT");
    const issuerOnly = { ...base, disclosures: [{ state: "QUOTED", role: "issuer", quote: "x" }] };
    expect(gen.deriveState({ ...issuerOnly, reads: { escrow_balance: amt("5", 6), wrapped_total_supply: amt("1", 6) } }).state).toBe("UNCHECKABLE");
  });
  it("never lets a failed read or an unknown mechanism become anything but UNMEASURED", () => {
    expect(gen.deriveState({ backing_model: "escrow", disclosures: bridgeQuote, reads: {}, error: "operator disagreement" }).state).toBe("UNMEASURED");
    expect(gen.deriveState({ backing_model: "escrow", disclosures: bridgeQuote, reads: { wrapped_total_supply: amt("1", 6) }, error: null }).state).toBe("UNMEASURED");
    expect(gen.deriveState({ backing_model: "mystery", disclosures: [], reads: { wrapped_total_supply: amt("1", 6) }, error: null }).state).toBe("UNMEASURED");
  });
  it("maps custodial to SINGLE_SURFACE and native / per-chain issuance to UNCHECKABLE", () => {
    const reads = { wrapped_total_supply: amt("1", 6) };
    expect(gen.deriveState({ backing_model: "custodial", disclosures: [], reads, error: null }).state).toBe("SINGLE_SURFACE");
    expect(gen.deriveState({ backing_model: "native", disclosures: [], reads, error: null }).state).toBe("UNCHECKABLE");
    expect(gen.deriveState({ backing_model: "issuer_multichain", disclosures: [], reads, error: null }).state).toBe("UNCHECKABLE");
  });
  it("quotes verbatim from the visible text", () => {
    const text = gen.visibleText("<p>Intro.</p><script>x()</script><p>Tokens are locked in the bridge &amp; minted on L2. Next.</p>");
    const q = gen.quoteFrom(text, "locked");
    expect(q).toBe("Tokens are locked in the bridge & minted on L2.");
    expect(text.includes(q)).toBe(true);
    expect(gen.quoteFrom("Database only here.", "\\bBase\\b", false, true)).toBeNull();
  });
  it("keys the same asset ids as the lookup", () => {
    for (const p of gen.allPairs()) {
      expect(gen.caip19Of(p.wrapped).caip19).toBe(caip19Of(p.wrapped).caip19);
      expect(gen.caip19Of(p.canonical).caip19).toBe(caip19Of(p.canonical).caip19);
    }
    expect(gen.allPairs().length).toBeGreaterThanOrEqual(30);
  });
});
