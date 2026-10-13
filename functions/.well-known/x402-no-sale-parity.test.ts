import { describe, expect, it, vi } from "vitest";
import { offlineEvmFetch } from "../api/__fixtures__/offline-evm-fetch";
import { NO_SALE_UNMEASURED } from "../api/_x402_no_sale";
import { CHAINS, NO_SALE_UNMEASURED as DOOR_NO_SALE, operatorOf } from "../api/wrapper";
import { onRequestGet as manifest, offerFor } from "./x402.json";

/**
 * EVERY UNPAID ANSWER A LISTED DOOR CAN GIVE IS ONE THE LISTING DECLARES.
 *
 * WHAT WAS WRONG (13 Oct 2026). The outward gate's consistency.x402_manifest_vs_live_402 reported
 * "4 mismatches over 27 paid resources (by field network, amount, asset, extra.name)". All four were
 * one door: GET /api/wrapper?id=usdc.e:arbitrum answered 200, not 402. That is the door's stated
 * rule — it reads the chain first and offers nothing while the read is UNMEASURED — and it was
 * UNMEASURED because every Arbitrum endpoint refused the eth_call (the reason the live answer
 * carried is reproduced in ARBITRUM_REFUSALS below). The payment terms never differed: whenever the
 * same door answered 402, its four fields equalled the listing's.
 *
 * So the listing was not wrong about the terms. It was silent about the second answer. It gave
 * accepts[] and, in a program-readable field, nothing else; the 200 was in prose only.
 *
 * WHY THE EXISTING TESTS COULD NOT SEE IT. x402-listing-parity.test.ts and _manifest_doors.test.ts
 * call every door on offlineEvmFetch, a network on which every chain read succeeds. Every door
 * answers 402 there, so the branch that answers 200 was never compared with the listing at all.
 *
 * WHAT THIS TEST DOES. It reads the resource list from the listing handler, calls each door's OWN
 * handler on a network where the chain reads are refused, and accepts exactly two unpaid answers:
 *   1. a 402 whose payment fields equal the listing's accepts[0], or
 *   2. the no-sale answer that the listing declares for that resource (resources[].no_sale).
 * Anything else fails, in both directions: a non-402 the listing does not declare, and a
 * declaration that no door gives when its reads are refused.
 */

type Accept = Record<string, unknown> & { extra?: Record<string, unknown> };
type NoSale = { status: number; when?: string; body: Record<string, unknown>; note?: string };
type Resource = { url: string; accepts?: Accept[]; no_sale?: NoSale };

const ORIGIN = "https://councilof.ai";
const ENV = { X402_PROMO_NOW: "2026-09-26T00:00:00Z" };
const moduleFor = (pathname: string) => `../api${pathname.replace(/^\/api/, "")}`;

/** The fields a payer signs over or decides on — the gate's four (network, amount, asset, extra.name) and the rest of the terms. */
const TERMS = ["scheme", "network", "amount", "maxAmountRequired", "asset", "payTo", "maxTimeoutSeconds"] as const;
function termsDrift(listing: Accept | undefined, challenge: Accept | undefined): string[] {
  if (!listing) return ["listing has no accepts[0]"];
  if (!challenge) return ["402 body has no accepts[0]"];
  const out: string[] = [];
  for (const k of TERMS)
    if (JSON.stringify(listing[k]) !== JSON.stringify(challenge[k])) out.push(`${k}: listing ${JSON.stringify(listing[k])} ≠ challenge ${JSON.stringify(challenge[k])}`);
  for (const k of ["name", "version"] as const)
    if (listing.extra?.[k] !== challenge.extra?.[k]) out.push(`extra.${k}: listing ${JSON.stringify(listing.extra?.[k])} ≠ challenge ${JSON.stringify(challenge.extra?.[k])}`);
  return out;
}

/** Every field of `want` is in `got` with the same value, at any depth. Arrays and scalars compare whole. */
function contains(got: unknown, want: unknown): boolean {
  if (want === null || typeof want !== "object" || Array.isArray(want)) return JSON.stringify(got) === JSON.stringify(want);
  if (got === null || typeof got !== "object" || Array.isArray(got)) return false;
  return Object.entries(want as Record<string, unknown>).every(([k, v]) => contains((got as Record<string, unknown>)[k], v));
}

type Answer = { status: number; body: Record<string, unknown> | null; paymentRequiredHeader: boolean };

/**
 * The rule, as one function: "" when the answer is one the listing entry declares, else what is wrong.
 * The same rule scripts/outward-gate/outward_gate.py applies to the live site (x402_no_sale).
 */
function unpaidAnswerProblem(r: Resource, a: Answer): string {
  if (a.status === 402) return termsDrift(r.accepts?.[0], (a.body?.accepts as Accept[] | undefined)?.[0]).join("; ");
  const d = r.no_sale;
  if (!d) return `answered ${a.status}, not 402, and the listing declares no no_sale answer for it`;
  if ((d.body?.payment as { requested?: unknown } | undefined)?.requested !== false) return "the declared no_sale.body does not say payment.requested:false — that is not a no-sale answer";
  if (a.status !== d.status) return `answered ${a.status}; the listing declares 402 or a no-sale ${d.status}`;
  if (!a.body) return `answered ${a.status} without a JSON body; the declared no-sale answer has one`;
  if (!contains(a.body, d.body)) return `answered ${a.status} but the body does not carry the declared no_sale.body ${JSON.stringify(d.body)}`;
  if (a.body.accepts !== undefined || a.paymentRequiredHeader) return "the no-sale answer still carries payment terms (accepts[] or a PAYMENT-REQUIRED header)";
  return "";
}

async function listing(): Promise<Resource[]> {
  const r = (await (manifest as unknown as (c: unknown) => Promise<Response>)({ request: new Request(`${ORIGIN}/.well-known/x402.json`), env: ENV })) as Response;
  return ((await r.json()) as { resources: Resource[] }).resources;
}

async function unpaid(url: URL): Promise<Answer> {
  const mod = (await import(/* @vite-ignore */ moduleFor(url.pathname))) as { onRequestGet: (c: unknown) => Promise<Response> };
  const resp = await mod.onRequestGet({ request: new Request(url.toString()), env: ENV, params: {} });
  let body: Record<string, unknown> | null = null;
  try {
    body = (await resp.json()) as Record<string, unknown>;
  } catch {
    body = null;
  }
  return { status: resp.status, body, paymentRequiredHeader: !!resp.headers.get("payment-required") };
}

/**
 * What each Arbitrum operator answered to the eth_call, as the live door reported it in the `reason`
 * of its 200 on 13 Oct 2026 (read 07:05Z): "arbitrum.io: HTTP 429; 1rpc.io: RPC error: You've reached
 * the usage limit for your current plan. …; drpc.org: HTTP 400; publicnode.com: HTTP 403".
 * The status codes and the message are the observed ones. The JSON-RPC error envelope around the
 * message is the standard shape; its numeric code was not recorded and is not set here.
 */
const ARBITRUM_REFUSALS: Record<string, () => Response> = {
  "arbitrum.io": () => new Response("", { status: 429 }),
  "1rpc.io": () =>
    new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, error: { message: "You've reached the usage limit for your current plan." } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  "drpc.org": () => new Response("", { status: 400 }),
  "publicnode.com": () => new Response("", { status: 403 }),
};

const rpcOf = (init?: RequestInit): { jsonrpc?: string; method?: string } | null => {
  try {
    return init?.body ? JSON.parse(String(init.body)) : null;
  } catch {
    return null;
  }
};
const urlOf = (u: string | URL | Request) => (typeof u === "string" ? u : u instanceof URL ? u.toString() : u.url);

/** Blocks still pin; only Arbitrum's eth_call is refused, by every operator on its list — the morning of 13 Oct. */
const arbitrumCallsRefused = async (u: string | URL | Request, init?: RequestInit): Promise<Response> => {
  const url = urlOf(u);
  if (rpcOf(init)?.method === "eth_call" && CHAINS.arbitrum.rpcs.includes(url)) return (ARBITRUM_REFUSALS[operatorOf(url)] ?? ARBITRUM_REFUSALS["arbitrum.io"])();
  return offlineEvmFetch(u, init);
};

/** Every JSON-RPC call on every chain is rate-limited; anything that is not JSON-RPC answers as offlineEvmFetch does. */
const everyChainRefused = async (u: string | URL | Request, init?: RequestInit): Promise<Response> => {
  if (rpcOf(init)?.jsonrpc === "2.0") return new Response("", { status: 429 });
  return offlineEvmFetch(u, init);
};

async function probeAll(net: (u: string | URL | Request, init?: RequestInit) => Promise<Response>) {
  const spy = vi.spyOn(globalThis, "fetch").mockImplementation(net as typeof fetch);
  const out: { r: Resource; path: string; a: Answer; problem: string }[] = [];
  try {
    for (const r of await listing()) {
      const url = new URL(r.url);
      const a = await unpaid(url);
      out.push({ r, path: `${url.pathname}${url.search}`, a, problem: unpaidAnswerProblem(r, a) });
    }
  } finally {
    spy.mockRestore();
  }
  return out;
}

describe(".well-known/x402.json declares every unpaid answer its doors give", () => {
  it("the wrapper doors publish the door's own object, and every declaration says no payment is requested", async () => {
    const all = await listing();
    // The per-pair door and each per-asset door (functions/api/_wrapper_asset_doors.json): the doors that read the chain before they offer.
    const wrapperDoors = all.filter((r) => /^\/api\/wrapper(\/asset\/[a-z0-9]+)?$/.test(new URL(r.url).pathname));
    expect(wrapperDoors.length, "the per-pair door and at least one per-asset door are listed").toBeGreaterThanOrEqual(2);
    // One object: what the door module hands its handlers is what the manifest module publishes.
    expect(DOOR_NO_SALE).toBe(NO_SALE_UNMEASURED);
    for (const r of wrapperDoors) {
      expect(r.no_sale, `${r.url} declares no no_sale answer`).toBeDefined();
      expect(r.no_sale, r.url).toEqual(NO_SALE_UNMEASURED);
      expect(offerFor(r.url)?.noSale, r.url).toBe(NO_SALE_UNMEASURED);
    }
    // Whichever door declares one: a no-sale answer is never a 402 and never requests payment.
    for (const r of all.filter((x) => x.no_sale)) {
      expect(r.no_sale!.status, r.url).not.toBe(402);
      expect((r.no_sale!.body.payment as { requested?: unknown } | undefined)?.requested, r.url).toBe(false);
    }
  });

  it("13 Oct, as observed: Arbitrum refuses the read — the per-pair door gives its declared no-sale answer and every other answer is a 402 on the listed terms", async () => {
    const got = await probeAll(arbitrumCallsRefused);
    expect(got.filter((g) => g.problem).map((g) => `${g.path}: ${g.problem}`), "an unpaid answer the listing does not declare").toEqual([]);
    expect(got.filter((g) => g.a.status !== 402).map((g) => g.path)).toContain("/api/wrapper?id=usdc.e:arbitrum");
    // Partial on purpose: a per-asset door with a readable pair on another chain still sells.
    expect(got.filter((g) => g.r.no_sale && g.a.status === 402).length, "a declaring door that still challenged").toBeGreaterThanOrEqual(1);
    const door = got.find((g) => g.path === "/api/wrapper?id=usdc.e:arbitrum")!;
    expect(door.a.status).toBe(200);
    expect(door.a.body).toMatchObject({ preview_only: true, state: "UNMEASURED", payment: { requested: false, presented: false, sent_to_facilitator: false, settled: false } });
    // The door hands back what the operators said, so a reader can see why nothing is offered.
    expect(String(door.a.body!.reason)).toMatch(/arbitrum\.io: HTTP 429; 1rpc\.io: RPC error: You've reached the usage limit/);
    expect(got.length).toBeGreaterThanOrEqual(20);
  });

  it("every chain refused: each declaring door gives its no-sale answer, and no declaration is one that no door gives", async () => {
    const got = await probeAll(everyChainRefused);
    expect(got.filter((g) => g.problem).map((g) => `${g.path}: ${g.problem}`), "an unpaid answer the listing does not declare").toEqual([]);
    const declined = got.filter((g) => g.a.status !== 402).map((g) => g.path).sort();
    const declaring = got.filter((g) => g.r.no_sale).map((g) => g.path).sort();
    // Both directions at once: an undeclared non-402 is in `declined` only; a vacuous declaration is in `declaring` only.
    expect(declined).toEqual(declaring);
    expect(declaring.length, "no door declares a no-sale answer: this test would pass vacuously").toBeGreaterThanOrEqual(4);
    for (const g of got.filter((x) => x.a.status !== 402)) {
      expect(g.a.body?.accepts, g.path).toBeUndefined();
      expect(g.a.paymentRequiredHeader, g.path).toBe(false);
    }
  });

  it("chain readable: a declaring door answers 402 on the listed terms — the declaration describes a second answer, not a route that never sells", async () => {
    const got = (await probeAll(offlineEvmFetch)).filter((g) => g.r.no_sale);
    expect(got.length).toBeGreaterThanOrEqual(4);
    for (const g of got) {
      expect(g.a.status, g.path).toBe(402);
      expect(g.problem, g.path).toBe("");
    }
  });

  // MUST-FAIL CONTROLS. The rule has to see the defect that was reported, and has to refuse a
  // declaration used as a blanket excuse; otherwise the three tests above would pass on any listing.
  describe("controls: what the rule must refuse", () => {
    const live200: Answer = {
      status: 200,
      paymentRequiredHeader: false,
      body: { schema: "csoai.wrapper-parity/0.1", kind: "preview", preview_only: true, id: "usdc.e:arbitrum", state: "UNMEASURED", payment: { requested: false, presented: false, sent_to_facilitator: false, settled: false } },
    };
    const terms: Accept = { scheme: "exact", network: "eip155:8453", amount: "1", maxAmountRequired: "1", asset: "0xA", payTo: "0xB", maxTimeoutSeconds: 300, extra: { name: "USD Coin", version: "2" } };
    const declared: Resource = { url: `${ORIGIN}/api/wrapper?id=usdc.e:arbitrum`, accepts: [terms], no_sale: NO_SALE_UNMEASURED };

    it("the listing as it was served on 13 Oct (no no_sale field) against the door's 200 is a mismatch", () => {
      const asServed: Resource = { url: declared.url, accepts: declared.accepts };
      expect(unpaidAnswerProblem(asServed, live200)).toMatch(/answered 200, not 402, and the listing declares no no_sale answer/);
      expect(unpaidAnswerProblem(declared, live200)).toBe("");
    });

    it("a 200 that is not the declared answer is still a mismatch on a declaring door", () => {
      const variants: [string, Answer][] = [
        ["requests payment", { ...live200, body: { ...live200.body, payment: { requested: true, sent_to_facilitator: false, settled: false } } }],
        ["says nothing about payment", { ...live200, body: { preview_only: true, state: "UNMEASURED" } }],
        ["is in another state", { ...live200, body: { ...live200.body, state: "ESCROW_PARITY_READ" } }],
        ["is not JSON", { ...live200, body: null }],
        ["is an error status", { ...live200, status: 500 }],
        ["carries payment terms", { ...live200, body: { ...live200.body, accepts: [terms] } }],
        ["carries a PAYMENT-REQUIRED header", { ...live200, paymentRequiredHeader: true }],
      ];
      for (const [what, a] of variants) expect(unpaidAnswerProblem(declared, a), what).not.toBe("");
    });

    it("a declaration that does not say payment.requested:false excuses nothing", () => {
      const blanket: Resource = { ...declared, no_sale: { status: 200, body: {} } };
      expect(unpaidAnswerProblem(blanket, live200)).toMatch(/not a no-sale answer/);
      expect(unpaidAnswerProblem(blanket, { status: 200, body: {}, paymentRequiredHeader: false })).not.toBe("");
    });

    it("a 402 on other terms is a mismatch whether or not the door declares a no-sale answer", () => {
      const drifted: Answer = { status: 402, paymentRequiredHeader: true, body: { accepts: [{ ...terms, network: "base", extra: { name: "USDC", version: "2" } }] } };
      const problem = unpaidAnswerProblem(declared, drifted);
      expect(problem).toMatch(/network:/);
      expect(problem).toMatch(/extra\.name:/);
      expect(unpaidAnswerProblem(declared, { status: 402, paymentRequiredHeader: true, body: { accepts: [terms] } })).toBe("");
    });
  });
});
