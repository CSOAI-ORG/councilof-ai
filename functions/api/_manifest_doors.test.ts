import { describe, expect, it, vi } from "vitest";
import { onRequestGet as manifest } from "../.well-known/x402.json";

/**
 * Every door the manifest advertises must answer a payment challenge — from the HANDLER, not
 * from a fixture.
 *
 * WHY THIS TEST AND NOT A LIVE PROBE. scripts/x402-rail-proof.py proves the rail EARNS by
 * signing an authorization and reading invalid_exact_evm_insufficient_balance. That proof
 * STARTS FROM A 402: it is structurally blind to a door that never issues one, because the
 * buyer is turned away before any payment is attempted. Two such doors shipped on 2026-09-05 —
 * /api/art50/marking-evidence advertised `vendor=<slug>` while its handler reads only `url=`
 * (400), and /api/evidence-bundle advertised `obligation=<id>` where `<id>` meant a MODEL id
 * two rows above (404 unknown_obligation). Both were lost sales that every existing check
 * passed over.
 *
 * The resource list is READ FROM THE MANIFEST FUNCTION at run time, so a door added there is
 * covered here the moment it is added — the two cannot drift. Nothing is stubbed except the
 * network, and only so a door that fetches an external asset is judged on its challenge rather
 * than on the internet.
 */

/** Real values a buyer would supply. Filling a placeholder is not inventing a fixture — the
 *  challenge still comes from the handler; these only get the request past argument parsing. */
const FILL: Record<string, string> = {
  "<id>": "gpt-4o",
  "<slug>": "governance",
  "<s>": "gpt-4o",
  "<model-id>": "gpt-4o",
  "<dora|eu-cra|article-50|article-53>": "dora",
  "<symbol|issuer_address>": "RLUSD",
  "<symbol>": "RLUSD",
  "<iso>": "2026-09-01",
  "<64-hex>": "a".repeat(64),
  "<https://…>": encodeURIComponent("https://councilof.ai/images/coliseum_hero_arena.jpg"),
};

const fill = (u: string) =>
  Object.entries(FILL).reduce((acc, [k, v]) => acc.split(k).join(v), u);

async function manifestResources(): Promise<{ url: string; paid_for: string | null }[]> {
  const r = (await (manifest as unknown as (c: unknown) => Promise<Response>)({
    request: new Request("https://councilof.ai/.well-known/x402.json"),
    env: {},
  })) as Response;
  const body = (await r.json()) as { resources: { url: string; paid_for: string | null }[] };
  return body.resources;
}

/** /api/rwa/evidence → ./rwa/evidence — the handler that serves that path, derived not listed. */
const moduleFor = (pathname: string) => `.${pathname.replace(/^\/api/, "")}`;

describe("every manifest door issues a payment challenge from its own handler", () => {
  it("reads its door list from the manifest, not from a hand-kept copy", async () => {
    const res = await manifestResources();
    expect(res.length).toBeGreaterThanOrEqual(9);
    expect(res.some((r) => r.url.includes("/api/art50/marking-evidence"))).toBe(true);
  });

  it("answers 402 with the PAYMENT-REQUIRED header, x402Version 2 and the bazaar extension", async () => {
    const resources = await manifestResources();
    // Isolate from the network: a door that fetches an external asset must be judged on the
    // challenge it issues, not on whether that asset is reachable from CI.
    // A NEW Response per call. Returning one shared object consumes its body on the first read
    // and every later door sees "Body is unusable" — which looks like a door defect and is not.
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } }),
    );
    const failures: string[] = [];
    try {
      for (const r of resources) {
        const url = new URL(fill(r.url));
        let mod: { onRequestGet?: (c: unknown) => Promise<Response> };
        try {
          mod = (await import(/* @vite-ignore */ moduleFor(url.pathname))) as typeof mod;
        } catch (e) {
          failures.push(`${url.pathname}: no handler module (${(e as Error).message})`);
          continue;
        }
        if (typeof mod.onRequestGet !== "function") {
          failures.push(`${url.pathname}: handler exports no onRequestGet`);
          continue;
        }
        const resp = await mod.onRequestGet({
          request: new Request(url.toString()),
          env: {},
          params: {},
        });
        if (resp.status !== 402) {
          failures.push(`${url.pathname}: answered ${resp.status}, not 402 — a buyer is turned away`);
          continue;
        }
        if (!resp.headers.get("payment-required")) {
          failures.push(`${url.pathname}: 402 without the PAYMENT-REQUIRED header`);
        }
        const body = (await resp.json()) as Record<string, unknown>;
        if (body.x402Version !== 2) failures.push(`${url.pathname}: x402Version is ${body.x402Version}, not 2`);
        const ext = (body.extensions ?? {}) as Record<string, unknown>;
        if (!ext.bazaar) failures.push(`${url.pathname}: no extensions.bazaar — the indexer reads that`);
      }
    } finally {
      fetchSpy.mockRestore();
    }
    expect(failures, `\n  ${failures.join("\n  ")}\n`).toEqual([]);
  });
});
