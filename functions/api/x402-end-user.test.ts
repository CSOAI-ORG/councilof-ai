/**
 * x402 doors as a buyer meets them (public audit 2026-09-28, fix #29).
 *
 *  - /api/x402-quotes took 1.1 s to first byte and sent 315 KB, fanning out to every door on every
 *    request. It is now compact JSON kept in the edge cache for QUOTES_TTL_SECONDS.
 *  - /api/pop/* challenges ran to 29.7 KB (claim-watch), mostly the preview's head. The challenge
 *    now carries counts, state and caveats and points at the free full reading; 402 bodies are
 *    compact JSON on every door.
 *  - The free door's product_id said csoai.product.request_attestation.
 *  - pop/corrections said "full history". It is the same entries as free /api/corrections,
 *    packaged with per-entry digests, and the count is the ledger's own at request time.
 *  - Every door in the manifest still answers a well-formed x402 v2 402 whose PAYMENT-REQUIRED
 *    header decodes to the same challenge, with the bazaar extension (header parity in full:
 *    payment-required-header.test.ts).
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { offlineEvmFetch } from "./__fixtures__/offline-evm-fetch";
import { onRequestGet as quotes, QUOTES_CACHE_CONTROL, QUOTES_TTL_SECONDS } from "./x402-quotes";
import { onRequestGet as freeDoor, FREE_DOOR_PRODUCT_ID } from "./free-door";
import { onRequestGet as popDoor } from "./_population_door";
import { POPULATION_IDS } from "./_population";
import { onRequestGet as manifest } from "../.well-known/x402.json";
import { LEDGER } from "./corrections";
import descriptions from "./x402-descriptions.json";

const ORIGIN = "https://councilof.ai";
const PUBLIC = resolve(__dirname, "../../public");
const ctx = (path: string, extra: Record<string, unknown> = {}) =>
  ({ request: new Request(ORIGIN + path, { headers: { accept: "application/json" } }), env: {}, params: {}, ...extra }) as never;
const call = (h: unknown, c: unknown) => (h as (c: unknown) => Promise<Response>)(c);
const decodeHeader = (h: string) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(h), (c) => c.charCodeAt(0))));

/** The site's bytes from disk; EVM JSON-RPC gets the offline fixture; everything else 404s. */
function disk() {
  vi.stubGlobal("fetch", async (u: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    if (init?.body) return offlineEvmFetch(u, init);
    const f = resolve(PUBLIC, "." + url.pathname);
    if (!url.pathname.startsWith("/api/") && existsSync(f) && statSync(f).isFile()) {
      return new Response(readFileSync(f), { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response("{}", { status: 404, headers: { "content-type": "application/json" } });
  });
}
afterEach(() => vi.unstubAllGlobals());

describe("/api/x402-quotes is cached at the edge and compact", () => {
  const doorsManifest = { resources: [{ url: `${ORIGIN}/api/proof?bundle=1`, method: "GET" }, { url: `${ORIGIN}/api/free-door`, method: "GET" }] };
  function fakeEdge() {
    const store = new Map<string, Response>();
    const puts: string[] = [];
    vi.stubGlobal("caches", {
      default: {
        match: async (req: Request) => store.get(req.url)?.clone(),
        put: async (req: Request, res: Response) => {
          puts.push(req.url);
          store.set(req.url, res.clone());
        },
      },
    });
    return { store, puts };
  }

  it("the first request asks the doors and stores the reading; the next is served from the cache without asking any door", async () => {
    const edge = fakeEdge();
    const fetchSpy = vi.fn(async (u: string | URL | Request) => {
      const s = String(u);
      if (s.endsWith("/.well-known/x402.json")) return new Response(JSON.stringify(doorsManifest), { status: 200 });
      return new Response(JSON.stringify({ x402Version: 2, accepts: [] }), { status: 402 });
    });
    vi.stubGlobal("fetch", fetchSpy);
    const waits: Promise<unknown>[] = [];
    const first = await call(quotes, ctx("/api/x402-quotes", { waitUntil: (p: Promise<unknown>) => waits.push(p) }));
    await Promise.all(waits);
    expect(first.headers.get("cache-control")).toBe(QUOTES_CACHE_CONTROL);
    expect(QUOTES_CACHE_CONTROL).toContain(`s-maxage=${QUOTES_TTL_SECONDS}`);
    expect(first.headers.get("x-csoai-cache")).toBe("MISS");
    const text = await first.text();
    expect(text).not.toMatch(/\n/); // compact, not pretty-printed
    const reading = JSON.parse(text);
    expect(reading.kind).toBe("MEASURED");
    expect(reading.max_age_seconds).toBe(QUOTES_TTL_SECONDS);
    expect(reading.note).toMatch(/edge cache/);
    expect(edge.puts).toEqual([`${ORIGIN}/api/x402-quotes`]);
    const asked = fetchSpy.mock.calls.length;

    const second = await call(quotes, ctx("/api/x402-quotes?anything=1"));
    expect(second.headers.get("x-csoai-cache")).toBe("HIT");
    expect(JSON.parse(await second.text()).as_of).toBe(reading.as_of);
    expect(fetchSpy.mock.calls.length).toBe(asked);
  });

  it("an UNCHECKABLE reading (manifest unreadable) is served no-store and never cached", async () => {
    const edge = fakeEdge();
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 503 }));
    const r = await call(quotes, ctx("/api/x402-quotes", { waitUntil: () => {} }));
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect((await r.json()).kind).toBe("UNCHECKABLE");
    expect(edge.puts).toEqual([]);
  });

  it("with no edge cache (Node, tests) it still answers", async () => {
    vi.stubGlobal("caches", undefined);
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 503 }));
    const r = await call(quotes, ctx("/api/x402-quotes"));
    expect(r.status).toBe(200);
  });
});

describe("the free door names its own product", () => {
  it("402 accepts[0] carries csoai.product.free_door and sku free_door, still at amount 0", async () => {
    disk();
    const r = await call(freeDoor, ctx("/api/free-door"));
    expect(r.status).toBe(402);
    const b = await r.json();
    const a = b.accepts[0];
    expect(FREE_DOOR_PRODUCT_ID).toBe("csoai.product.free_door");
    expect(a.csoai_pricing.product_id).toBe("csoai.product.free_door");
    expect(a.csoai_pricing.sku_id).toBe("free_door");
    expect(a.amount).toBe("0");
    expect(JSON.stringify(b)).not.toContain("request_attestation");
  });

  it("the manifest lists it under the same product", async () => {
    disk();
    const m = await (await call(manifest, ctx("/.well-known/x402.json"))).json();
    const row = m.resources.find((r: { url: string }) => r.url === `${ORIGIN}/api/free-door`);
    expect(row.accepts[0].csoai_pricing.product_id).toBe("csoai.product.free_door");
  });
});

describe("pop/corrections: the same entries as free /api/corrections, count read live", () => {
  it("the canonical text says so, and no surface of the door says full history", async () => {
    disk();
    const canonical = (descriptions as Record<string, string>).pop_corrections;
    expect(canonical).toContain("the same entries as free /api/corrections, packaged with per-entry digests");
    expect(canonical).not.toMatch(/full history|full-history/i);
    const r = await call(popDoor, ctx("/api/pop/corrections"));
    expect(r.status).toBe(402);
    const body = await r.text();
    const header = JSON.stringify(decodeHeader(r.headers.get("PAYMENT-REQUIRED")!));
    expect(body + header).not.toMatch(/full history|full-history/i);
    const b = JSON.parse(body);
    expect(b.resource.description).toBe(canonical);
    const n = (LEDGER as { corrections: unknown[] }).corrections.length;
    expect(b.csoai.reading_sentence).toContain(`the same ${n} entries as free /api/corrections, packaged with per-entry digests`);
    expect(b.csoai.preview.n).toBe(n);
    const pv = await (await call(popDoor, ctx("/api/pop/corrections?preview=1"))).json();
    expect(pv.title).toBe("Corrections ledger");
    expect(JSON.stringify(pv)).not.toMatch(/full history|full-history/i);
  });
});

describe("pop challenges carry the reading's counts, not its head", () => {
  it.each([...POPULATION_IDS])("%s: no head, no repeated door list, a pointer to the free full reading, and a small body", async (id) => {
    disk();
    const r = await call(popDoor, ctx(`/api/pop/${id}`));
    expect(r.status).toBe(402);
    const text = await r.text();
    const b = JSON.parse(text);
    expect(b.csoai.preview).not.toHaveProperty("head");
    expect(b.csoai.preview).not.toHaveProperty("source");
    expect(b.csoai.preview.full_reading).toBe(`${ORIGIN}/api/pop/${id}?preview=1`);
    expect(b.csoai).not.toHaveProperty("all_doors");
    expect(b.csoai.reading_sentence.length).toBeLessThanOrEqual(260);
    expect(text.length, `${id} 402 body`).toBeLessThanOrEqual(8_192);
    // the head is still there, free, where the challenge points
    const pv = await (await call(popDoor, ctx(`/api/pop/${id}?preview=1`))).json();
    expect(pv).toHaveProperty("head");
  });
});

describe("every door in the manifest: a well-formed v2 402, header and body agreeing, bazaar intact", () => {
  it("all of them", async () => {
    vi.stubGlobal("fetch", offlineEvmFetch);
    const m = await (await call(manifest, ctx("/.well-known/x402.json"))).json();
    const failures: string[] = [];
    for (const row of m.resources as { url: string }[]) {
      const url = new URL(row.url);
      const mod = await import(/* @vite-ignore */ `.${url.pathname.replace(/^\/api/, "")}`);
      const r: Response = await mod.onRequestGet({ request: new Request(url.toString()), env: {}, params: {} });
      if (r.status !== 402) { failures.push(`${url.pathname}: ${r.status}`); continue; }
      const text = await r.text();
      const b = JSON.parse(text);
      const h = r.headers.get("PAYMENT-REQUIRED");
      if (!h) { failures.push(`${url.pathname}: no PAYMENT-REQUIRED header`); continue; }
      const hv = decodeHeader(h);
      if (b.x402Version !== 2 || hv.x402Version !== 2) failures.push(`${url.pathname}: not v2`);
      if (!b.extensions?.bazaar || !hv.extensions?.bazaar) failures.push(`${url.pathname}: bazaar missing`);
      if (JSON.stringify(hv.accepts?.[0]?.amount) !== JSON.stringify(b.accepts?.[0]?.amount)) failures.push(`${url.pathname}: header amount != body`);
      if (hv.resource?.url !== b.resource?.url) failures.push(`${url.pathname}: header resource != body`);
      if (/\n {2}"/.test(text)) failures.push(`${url.pathname}: body is pretty-printed`);
    }
    expect(failures, failures.join("\n")).toEqual([]);
    expect((m.resources as unknown[]).length).toBeGreaterThanOrEqual(25);
  }, 60_000);
});
