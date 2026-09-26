import { describe, expect, it, vi } from "vitest";
import { onRequestGet as manifest, offerFor } from "./x402.json";

/**
 * /.well-known/x402.json MUST AGREE WITH EVERY LIVE 402, field for field, for every resource.
 *
 * Found by a developer-persona test on 2026-09-26: the listing said `network: "base"`, carried no
 * amount and no asset, and named the EIP-712 domain `extra.name: "USDC"`, while the 402 each door
 * actually issues said `eip155:8453`, `amount: "10000"` and `extra.name: "USD Coin"`. The domain
 * name is what a wallet signs transferWithAuthorization under, so a buyer that trusted the listing
 * signed something the USDC contract rejects.
 *
 * This test reads the resource list FROM THE LISTING HANDLER, calls each door's OWN handler for the
 * same URL, and compares the payment-critical fields of accepts[0]. Nothing is stubbed but the
 * network (so a door that fetches an asset is judged on its challenge, not on the internet) and the
 * clock (so a promo boundary cannot fall between the two calls).
 */

const PAYMENT_FIELDS = ["scheme", "network", "amount", "maxAmountRequired", "asset", "payTo", "maxTimeoutSeconds"] as const;
const PRICING_FIELDS = ["product_id", "sku_id", "tier", "pricing_basis", "normal_amount_atomic", "offered_amount_atomic"] as const;

type Accept = Record<string, unknown> & { extra?: Record<string, unknown>; csoai_pricing?: Record<string, unknown> };

/** Every field on which a payer's signature or a buyer's decision depends. Empty = agree. */
export function paymentDrift(listing: Accept | undefined, challenge: Accept | undefined): string[] {
  if (!listing) return ["listing has no accepts[0]"];
  if (!challenge) return ["challenge has no accepts[0]"];
  const out: string[] = [];
  for (const k of PAYMENT_FIELDS) {
    if (JSON.stringify(listing[k]) !== JSON.stringify(challenge[k]))
      out.push(`${k}: listing ${JSON.stringify(listing[k])} ≠ challenge ${JSON.stringify(challenge[k])}`);
  }
  for (const k of ["name", "version"] as const) {
    if (listing.extra?.[k] !== challenge.extra?.[k])
      out.push(`extra.${k} (EIP-712 domain): listing ${JSON.stringify(listing.extra?.[k])} ≠ challenge ${JSON.stringify(challenge.extra?.[k])}`);
  }
  for (const k of PRICING_FIELDS) {
    if (listing.csoai_pricing?.[k] !== challenge.csoai_pricing?.[k])
      out.push(`csoai_pricing.${k}: listing ${JSON.stringify(listing.csoai_pricing?.[k])} ≠ challenge ${JSON.stringify(challenge.csoai_pricing?.[k])}`);
  }
  return out;
}

const ENV = { X402_PROMO_NOW: "2026-09-26T00:00:00Z" };
const ORIGIN = "https://councilof.ai";
const moduleFor = (pathname: string) => `../api${pathname.replace(/^\/api/, "")}`;

async function listing() {
  const r = (await (manifest as unknown as (c: unknown) => Promise<Response>)({
    request: new Request(`${ORIGIN}/.well-known/x402.json`),
    env: ENV,
  })) as Response;
  return (await r.json()) as { resources: { url: string; accepts?: Accept[] }[] };
}

async function challengeFor(url: URL): Promise<Accept | string> {
  let mod: { onRequestGet?: (c: unknown) => Promise<Response> };
  try {
    mod = (await import(/* @vite-ignore */ moduleFor(url.pathname))) as typeof mod;
  } catch (e) {
    return `no handler module (${(e as Error).message})`;
  }
  if (typeof mod.onRequestGet !== "function") return "handler exports no onRequestGet";
  const resp = await mod.onRequestGet({ request: new Request(url.toString()), env: ENV, params: {} });
  if (resp.status !== 402) return `answered ${resp.status}, not 402`;
  const body = (await resp.json()) as { accepts?: Accept[] };
  return body.accepts?.[0] ?? "402 body has no accepts[0]";
}

describe(".well-known/x402.json accepts[] = the live 402 accepts[], for every resource", () => {
  it("every listed resource declares the SKU its door charges", async () => {
    for (const r of (await listing()).resources) expect(offerFor(r.url), r.url).not.toBeNull();
  });

  it("no payment field drifts between the listing and the door's own challenge", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } }),
    );
    const failures: string[] = [];
    let compared = 0;
    try {
      for (const r of (await listing()).resources) {
        const url = new URL(r.url);
        const ch = await challengeFor(url);
        if (typeof ch === "string") {
          failures.push(`${url.pathname}: ${ch}`);
          continue;
        }
        compared++;
        for (const d of paymentDrift(r.accepts?.[0], ch)) failures.push(`${url.pathname}${url.search}: ${d}`);
      }
    } finally {
      fetchSpy.mockRestore();
    }
    expect(failures, `\n  ${failures.join("\n  ")}\n`).toEqual([]);
    expect(compared).toBeGreaterThanOrEqual(20);
  });

  // PayAI lists five doors under their query-less base path (self-parity record 2026-09-26). This
  // pins that WE never drop the query: the challenge names the listed URL's query in resource.url
  // and accepts[0].resource, so an index that strips it does so on its own side. (The facilitator
  // envelope keeps it too — _x402.test.ts "FULL resource url, query included".)
  it("every door's challenge keeps the listed query string in resource.url and accepts[0].resource", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } }),
    );
    const failures: string[] = [];
    try {
      for (const r of (await listing()).resources) {
        const url = new URL(r.url);
        if (!url.search) continue;
        const mod = (await import(/* @vite-ignore */ moduleFor(url.pathname))) as { onRequestGet: (c: unknown) => Promise<Response> };
        const resp = await mod.onRequestGet({ request: new Request(url.toString()), env: ENV, params: {} });
        const body = (await resp.json()) as { resource?: { url?: string }; accepts?: { resource?: string }[] };
        for (const [where, got] of [["resource.url", body.resource?.url], ["accepts[0].resource", body.accepts?.[0]?.resource]] as const) {
          const g = got ? new URL(got) : null;
          for (const [k, v] of url.searchParams)
            if (g?.searchParams.get(k) !== v) failures.push(`${url.pathname}: ${where} lost ${k}=${v} (${got})`);
        }
      }
    } finally {
      fetchSpy.mockRestore();
    }
    expect(failures, `\n  ${failures.join("\n  ")}\n`).toEqual([]);
  });

  it("asserts no third-party index membership it cannot keep true (no typed indexed_in)", async () => {
    const body = (await listing()) as unknown as { resources: Record<string, unknown>[]; index_membership?: string };
    for (const r of body.resources) expect(r, String(r.url)).not.toHaveProperty("indexed_in");
    expect(body.index_membership).toMatch(/measured by reading that index/);
  });

  // MUST-FAIL CONTROL. The comparator has to see the exact defect that shipped; if it did not, the
  // test above would pass vacuously on any listing.
  it("control: the 2026-09-26 listing entry is reported as drift on network, amount, asset and extra.name", () => {
    const live: Accept = {
      scheme: "exact", network: "eip155:8453", amount: "10000", maxAmountRequired: "10000",
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", payTo: "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
      maxTimeoutSeconds: 300, extra: { name: "USD Coin", version: "2" },
    };
    const shipped: Accept = {
      scheme: "exact", network: "base", payTo: "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
      maxTimeoutSeconds: 300, extra: { name: "USDC", version: "2" },
    };
    const drift = paymentDrift(shipped, live);
    expect(drift.some((d) => d.startsWith("network:"))).toBe(true);
    expect(drift.some((d) => d.startsWith("amount:"))).toBe(true);
    expect(drift.some((d) => d.startsWith("asset:"))).toBe(true);
    expect(drift.some((d) => d.startsWith("extra.name"))).toBe(true);
    expect(paymentDrift(live, { ...live })).toEqual([]);
  });
});
