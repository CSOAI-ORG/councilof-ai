import { describe, expect, it } from "vitest";

/**
 * OWNER RULING, 6 September 2026:
 *   "no prices on any page, no tiers, no payment processor names — everything is
 *    free or pay-as-you-go x402 at the 402."
 *
 * client/src/lib/ownerRuling.test.ts keeps that ruling on the pages a HUMAN reads. It scans
 * client/src for English prose — /\b(paid tier|free tier|two tiers|…)\b/ — and it is scoped to
 * that directory. Neither half could reach what this file guards.
 *
 * WHAT THIS FOUND, 2026-09-06. GET /api/x402 — the machine catalog a Bazaar indexer reads and
 * re-presents to a buyer — published a top-level key literally named `tiers`, and stamped a
 * `tier: N` ordinal on every entry. Not prose, so the phrase regex could not see it; not under
 * client/src, so the scanner never looked. A ladder on this surface travels further than one on
 * a page, because an index copies it and shows it to people who never visit the site.
 *
 * (The ordinal was also false on its own terms: the six entries were numbered 1, 2, 3, 1, 4, 3 —
 * not unique, not ordered, and the duplication had already produced one silent bug.)
 *
 * WHY THIS CHECKS THE SERVED JSON, NOT THE SOURCE. `tier` is a legitimate INTERNAL name: it is
 * the price-band selector in _skus.ts (`resolvePriceUsd(sku, tier, env)`) and an option on
 * x402Accepts. A source grep must either allow those files — and so stop guarding them — or
 * fail on machinery no buyer can see. Walking the response body has neither problem: it asks the
 * only question the ruling asks, which is what we PUBLISH.
 */

type Handler = (c: unknown) => Promise<Response>;

const SURFACES: { name: string; url: string; load: () => Promise<{ onRequestGet: unknown }> }[] = [
  { name: "GET /api/x402", url: "https://councilof.ai/api/x402", load: () => import("./x402") },
  {
    name: "GET /.well-known/x402.json",
    url: "https://councilof.ai/.well-known/x402.json",
    load: () => import("../.well-known/x402.json"),
  },
];

/** Every key name in a JSON document, at any depth, with the path that reaches it. */
function keyPaths(v: unknown, at = "$"): [string, string][] {
  if (Array.isArray(v)) return v.flatMap((e, i) => keyPaths(e, `${at}[${i}]`));
  if (v && typeof v === "object") {
    return Object.entries(v as Record<string, unknown>)
      .flatMap(([k, e]) => [[k, `${at}.${k}`] as [string, string], ...keyPaths(e, `${at}.${k}`)]);
  }
  return [];
}

const LADDER = /^(tier|tiers|plan|plans|pricing_tier|subscription)$/i;

describe("the wire surfaces publish no ladder", () => {
  it("finds the surfaces, so this cannot pass vacuously", () => {
    expect(SURFACES.length).toBeGreaterThanOrEqual(2);
  });

  for (const s of SURFACES) {
    it(`${s.name} names no tier, plan or subscription key`, async () => {
      const { onRequestGet } = await s.load();
      const res = await (onRequestGet as Handler)({ request: new Request(s.url), env: {} });
      const body = await res.json();

      const paths = keyPaths(body);
      expect(paths.length, `${s.name} served no object — the walk has lost its subject`)
        .toBeGreaterThan(10);

      const ladder = paths.filter(([k]) => LADDER.test(k)).map(([, p]) => p);
      expect(ladder, `${s.name} publishes a ladder the owner ruled does not exist`).toEqual([]);
    });
  }
});
