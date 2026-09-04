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
import PAID from "../mcp/paid-tools.json";

const ORIGIN = "https://councilof.ai";
const get = async () => {
  const res = await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({
    request: new Request(`${ORIGIN}/.well-known/x402.json`),
    env: {},
  });
  return (await res.json()) as {
    resources: { url: string; method: string }[];
    quarantined?: { url: string; buyable: boolean; lifecycle: string }[];
    mcp: { paid_tools: string[] };
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
});
