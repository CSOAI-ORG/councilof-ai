/**
 * The discovery manifest is the first thing a buying agent reads, so every URL in `resources`
 * is a promise that the route will answer 402 with a price. Two of those promises had gone
 * stale and nothing failed:
 *
 *   · /api/witness was still advertised as buyable after paid issuance was quarantined
 *     (QUARANTINED_PRE_RELEASE); the route answers 503 and takes no payment, so an agent that
 *     believed the manifest burned a request on a resource that cannot be sold.
 *   · /api/art50/marking-evidence was live, priced and in the MCP catalogue, and appeared in the
 *     manifest nowhere — undiscoverable to anyone who only reads .well-known.
 *   · `mcp.paid_tools` was a hand-typed list that still named witness_hash after the catalogue
 *     had dropped to four tools.
 *
 * These assert the SHAPE that keeps them true, not the current strings: derived from the
 * catalogue, and disjoint from the quarantine list.
 */
import { describe, expect, it } from "vitest";
import { onRequestGet } from "./x402.json";
import FREE from "../mcp/gspc-tools.json";
import PAID from "../mcp/paid-tools.json";

const ORIGIN = "https://councilof.ai";
const get = async () => {
  const res = await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({
    request: new Request(`${ORIGIN}/.well-known/x402.json`),
    env: {},
  });
  return (await res.json()) as {
    resources: { url: string; method: string; accepts?: { maxTimeoutSeconds?: number }[] }[];
    quarantined?: { url: string; buyable: boolean; lifecycle: string }[];
    mcp: { free_tools: string[]; paid_tools: string[] };
  };
};

describe(".well-known/x402.json — every advertised resource is one that can actually be bought", () => {
  it("does not advertise the quarantined witness route as buyable", async () => {
    const m = await get();
    expect(m.resources.map((r) => r.url).filter((u) => u.includes("/api/witness"))).toEqual([]);
  });

  it("names the quarantined route instead of dropping it silently, and marks it unbuyable", async () => {
    const m = await get();
    const q = (m.quarantined ?? []).find((x) => x.url.includes("/api/witness"));
    expect(q, "witness must be explained, not vanished").toBeTruthy();
    expect(q!.buyable).toBe(false);
    expect(q!.lifecycle).toBe("QUARANTINED_PRE_RELEASE");
  });

  it("resources and quarantined never overlap — a route is buyable or it is not", async () => {
    const m = await get();
    const path = (u: string) => new URL(u).pathname;
    const buyable = new Set(m.resources.map((r) => path(r.url)));
    for (const q of m.quarantined ?? []) expect(buyable.has(path(q.url)), q.url).toBe(false);
  });

  it("declares every paid MCP route that has one, so nothing live is undiscoverable", async () => {
    const m = await get();
    const declared = new Set(m.resources.map((r) => new URL(r.url).pathname));
    const quarantined = new Set((m.quarantined ?? []).map((q) => new URL(q.url).pathname));
    const missing = PAID.tools
      .map((t) => (t as { csoai?: { route?: string } }).csoai?.route)
      .filter((r): r is string => !!r)
      .filter((r) => !declared.has(r) && !quarantined.has(r));
    // /api/art50/marking-evidence was live at $25 and listed here nowhere.
    expect(missing).toEqual([]);
  });

  it("mcp.paid_tools is derived from the catalogue, not retyped beside it", async () => {
    const m = await get();
    expect(m.mcp.paid_tools).toEqual(PAID.tools.map((t) => t.name));
  });

  it("mcp.free_tools is derived from the live door definitions", async () => {
    const m = await get();
    expect(m.mcp.free_tools).toEqual(FREE.tools.map((t) => t.name));
  });

  it("advertises the same timeout as every live 402 challenge", async () => {
    const m = await get();
    for (const resource of m.resources) {
      expect(resource.accepts?.[0]?.maxTimeoutSeconds, resource.url).toBe(300);
    }
  });

  // The Bazaar indexes exactly one CSOAI resource, /api/free-door, and it was absent from this
  // document — so discovery pointed one way and the catalogue the other. An agent arriving from
  // the Bazaar landed on a door this file never mentioned. Declared here, and asserted so the
  // two surfaces cannot drift apart again.
  it("declares the one resource the Bazaar actually indexes", async () => {
    const body = (await get()) as { resources: { url: string; paid_for: string | null; amount?: string }[] };
    const door = body.resources.find((r) => r.url.includes("/api/free-door"));
    expect(door).toBeDefined();
    expect(door!.paid_for).toBeNull();
    expect(door!.amount).toBe("0");
    // and no published $ price may appear anywhere on this surface
    expect(JSON.stringify(body)).not.toMatch(/\$\s?\d/);
  });

  // A door advertised with a parameter it does not accept is a door that cannot be bought.
  // This file advertised /api/art50/marking-evidence?vendor=<slug>; the handler reads only
  // `url=` and the string "vendor" appears nowhere in it, so a buyer following this document
  // got 400 and never reached a payment challenge. Every advertised query parameter is now
  // checked against the handler that serves it.
  it("advertises art50 with the parameter its handler actually reads", async () => {
    const m = await get();
    const art50 = m.resources.find((r) => r.url.includes("/api/art50/marking-evidence"));
    expect(art50, "art50 must still be advertised").toBeTruthy();
    expect(art50!.url).toContain("url=");
    expect(art50!.url).not.toContain("vendor=");
    expect(String(art50!.free_preview ?? "")).not.toContain("vendor=");
  });

  // A placeholder that names the wrong kind of value costs a buyer a failed call. `<id>` meant
  // a model id on the request-attestation row and an obligation id on the evidence-bundle row.
  it("names what each placeholder wants, so a buyer's first call is not a 404", async () => {
    const m = await get();
    const eb = m.resources.find((r) => r.url.includes("/api/evidence-bundle"));
    expect(eb).toBeTruthy();
    expect(eb!.url).toContain("obligation=article-50");
    expect(eb!.url).toContain("bundle=1");
    expect(eb!.url).not.toMatch(/obligation=<id>/);
  });

  // CDP / a naive indexer GETs resources[].url as written. Angle-bracket
  // templates 400 (asset=<symbol|issuer_address>, url=<https://…>).
  // OpenAPI already samples required params to 402; this document must too.
  // What would make this fail: a resource.url that still contains "<".
  it("every resources[].url is a probeable GET, not an unreplaced template", async () => {
    const m = await get();
    const templated = m.resources.filter((r) => r.url.includes("<"));
    expect(templated.map((r) => r.url), "indexers fetch this field as-is and 400").toEqual([]);
    for (const r of m.resources) {
      expect(() => new URL(r.url), r.url).not.toThrow();
      expect(r.url, r.url).not.toMatch(/[^\x00-\x7F]/);
    }
  });
});

describe("door descriptions are buyer-first (2026-09-06)", () => {
  it("every non-quarantined resource carries a deliverable-first description", async () => {
    const body = await get();
    const resources = body.resources as { url: string; description?: string }[];
    for (const r of resources) {
      expect(r.description, `${r.url} must carry a description`).toBeTruthy();
      expect(r.description!.length, `${r.url} description too short to rank`).toBeGreaterThan(40);
      // first clause = the deliverable, not doctrine: must NOT open with estate-speak
      expect(r.description!.toLowerCase()).toMatch(
        /^(live board totals|signed measurement card|signed compliance evidence bundle|signed derivative data feed|inclusion proof bundle|rwa asset evidence|art\. 50 marking evidence|provider change record|signed receipts batch)/,
      );
    }
  });
});

describe("resources are v1-shaped (accepts[] with outputSchema)", () => {
  it("every resource declares the v1 PaymentRequirements", async () => {
    const body = await get();
    const resources = body.resources as {
      url: string;
      accepts?: { scheme: string; network: string; payTo: string; description: string; outputSchema?: object }[];
    }[];
    for (const r of resources) {
      expect(r.accepts, `${r.url} must declare accepts[] for v1 consumers`).toBeTruthy();
      const a = r.accepts![0];
      expect(a.scheme).toBe("exact");
      expect(a.network).toMatch(/base/i);
      expect(a.payTo).toMatch(/^0x/i);
      expect(a.outputSchema).toBeTruthy();
    }
  });
});
