import { afterEach, describe, expect, it, vi } from "vitest";
import { challengeFromResult } from "@/components/ToolRunner";
import { buildTypedData, type EIP1193Provider, type X402Challenge } from "./x402Wallet";
import {
  DELIST_RISK_DAYS,
  challengeFromPaymentRequired,
  daysSince,
  decodeSettlement,
  delistRisk,
  index402For,
  settleFor,
  walkTally,
  type DoorSettlesReading,
  type Index402Reading,
  doorFromSearch,
  doorsFromManifest,
  explorerTxUrl,
  listingFor,
  payDoor,
  quoteDoor,
  remainingDoors,
  retryDoorWithPayment,
  sameResource,
  routeKey,
  selectDoor,
  unsettledReason,
  type Door,
  type ListingReading,
} from "./payEveryDoor";

/**
 * The /pay flow, tested without a DOM and without a network. Every fixture below is shaped
 * like the LIVE bytes (a 402 from councilof.ai/api/rwa/evidence read 2026-09-22, the manifest
 * from /.well-known/x402.json the same day) — the fields, not the values, are what matter.
 * No amount in this file is a price; they are protocol fixtures.
 */

const ORIGIN = "https://councilof.ai";
const ACCEPTED = {
  scheme: "exact",
  network: "eip155:8453",
  amount: "10000",
  maxAmountRequired: "10000",
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  payTo: "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
  maxTimeoutSeconds: 300,
  extra: { name: "USD Coin", version: "2", decimals: 6, symbol: "USDC" },
  resource: `${ORIGIN}/api/rwa/evidence?asset=RLUSD`,
  description: "A signed XRPL evidence card.",
  mimeType: "application/json",
};
const PAYMENT_REQUIRED = {
  x402Version: 2,
  error: "Payment required",
  resource: { url: `${ORIGIN}/api/rwa/evidence?asset=RLUSD`, description: "A signed XRPL evidence card.", mimeType: "application/json", serviceName: "CSOAI RWA" },
  accepts: [ACCEPTED],
  extensions: { bazaar: { info: { input: { type: "http", method: "GET" } }, schema: { type: "object" } } },
  csoai: { free_preview: `${ORIGIN}/api/rwa/evidence?asset=RLUSD&preview=1` },
};
const MANIFEST = {
  schema: "csoai.x402/0.2",
  x402Version: 2,
  resources: [
    { method: "GET", url: `${ORIGIN}/api/free-door`, paid_for: null, description: "free door" },
    { method: "GET", url: `${ORIGIN}/api/request-attestation?subject=model-or-subject-id`, paid_for: "issuance", description: "issuance" },
    { method: "GET", url: `${ORIGIN}/api/rwa/evidence?asset=RLUSD`, paid_for: "issuance", free_preview: `${ORIGIN}/api/rwa/evidence?asset=<symbol>&preview=1`, description: "rwa" },
    { method: "GET", url: "not a url", description: "ignored" },
  ],
};
const SIGNER = "0x4dB7ff00ff00ff00ff00ff00ff00ff00ff0002B7";
const SIGNATURE = `0x${"ab".repeat(65)}`;

const jsonResponse = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

function provider(opts: { chain?: string; onSign?: (params: unknown[]) => unknown } = {}): EIP1193Provider & { calls: { method: string; params: unknown[] }[] } {
  const calls: { method: string; params: unknown[] }[] = [];
  return {
    calls,
    request: async ({ method, params }) => {
      calls.push({ method, params });
      if (method === "eth_requestAccounts") return [SIGNER];
      if (method === "eth_chainId") return opts.chain ?? "0x2105";
      if (method === "wallet_switchEthereumChain") return null;
      if (method === "eth_signTypedData_v4") return opts.onSign ? opts.onSign(params) : SIGNATURE;
      throw new Error(`unexpected ${method}`);
    },
  };
}

const door = (): Door => doorsFromManifest(MANIFEST)[2];

afterEach(() => {
  vi.useRealTimers();
});

describe("the door list is the manifest, never a typed list", () => {
  it("derives every usable resources[] row, in manifest order, and drops a row with no url", () => {
    const doors = doorsFromManifest(MANIFEST);
    expect(doors.map((d) => d.url)).toEqual(MANIFEST.resources.slice(0, 3).map((r) => r.url));
    expect(doors[0].paidFor).toBeNull();
    expect(doors[2].freePreview).toContain("preview=1");
    expect(doors[2].routeKey).toBe(`${ORIGIN}/api/rwa/evidence`);
  });

  it("refuses a manifest with no resources rather than inventing doors", () => {
    expect(() => doorsFromManifest({ resources: [] })).toThrow(/no resources/);
    expect(() => doorsFromManifest(null)).toThrow();
  });

  it("reads the manifest through fetch and quotes each door from its own 402", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const u = String(url);
      if (u.endsWith("/.well-known/x402.json")) return jsonResponse(200, MANIFEST);
      return jsonResponse(402, PAYMENT_REQUIRED, { "PAYMENT-REQUIRED": btoa(JSON.stringify(PAYMENT_REQUIRED)) });
    }) as unknown as typeof fetch;
    const manifest = await (await fetchImpl(`${ORIGIN}/.well-known/x402.json`)).json();
    const doors = doorsFromManifest(manifest);
    const q = await quoteDoor(doors[2], fetchImpl);
    expect(q.kind).toBe("challenge");
    if (q.kind === "challenge") {
      // the body crossed a Response, so identity is gone; the retained entry is field-for-field the 402's
      expect(q.challenge.accepted).toEqual(PAYMENT_REQUIRED.accepts[0]);
      expect(q.challenge.amount).toBe(ACCEPTED.amount);
    }
    const paidCall = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls.find(
      (c) => (c[1] as RequestInit | undefined)?.headers && "x-payment" in ((c[1] as RequestInit).headers as Record<string, string>),
    );
    expect(paidCall, "a quote never sends X-PAYMENT").toBeUndefined();
  });

  it("names a route that answers without a challenge as NO CHALLENGE, not as a door to pay", async () => {
    const free = vi.fn(async () => jsonResponse(200, { totals: {} })) as unknown as typeof fetch;
    expect((await quoteDoor(door(), free)).kind).toBe("no-challenge");
    const missing = vi.fn(async () => jsonResponse(404, { error: "unknown_obligation" })) as unknown as typeof fetch;
    const q = await quoteDoor(door(), missing);
    expect(q.kind).toBe("no-challenge");
    if (q.kind === "no-challenge") expect(q.detail).toContain("unknown_obligation");
  });
});

describe("the challenge is the one x402Wallet signs", () => {
  it("maps a door's 402 body field-for-field as ToolRunner.challengeFromResult maps an MCP result", () => {
    const http = challengeFromPaymentRequired(PAYMENT_REQUIRED);
    const mcp = challengeFromResult({ ok: false, text: "", state: "runtime_observed", structuredContent: PAYMENT_REQUIRED } as never);
    expect(http).toEqual(mcp);
    expect(http?.accepted).toBe(PAYMENT_REQUIRED.accepts[0]);
    expect(http?.resourceInfo).toBe(PAYMENT_REQUIRED.resource);
    expect(http?.extensions).toBe(PAYMENT_REQUIRED.extensions);
  });

  it("sends the wallet byte-for-byte what buildTypedData builds for the same challenge", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-22T12:00:00Z"));
    const challenge: X402Challenge = { ...challengeFromPaymentRequired(PAYMENT_REQUIRED)!, nonce: `0x${"12".repeat(32)}` };
    let sent: string | null = null;
    const p = provider({
      onSign: (params) => {
        sent = params[1] as string;
        return SIGNATURE;
      },
    });
    const fetchImpl = vi.fn(async () => jsonResponse(200, { ok: true })) as unknown as typeof fetch;
    await payDoor({ door: door(), challenge, provider: p, walletName: "MetaMask", fetchImpl });
    expect(sent).not.toBeNull();
    expect(sent).toBe(JSON.stringify(buildTypedData(challenge, SIGNER)));
    // and the wallet was asked for the challenge's chain before signing, as X402PayButton's path does
    const order = p.calls.map((c) => c.method);
    expect(order.indexOf("eth_chainId")).toBeLessThan(order.indexOf("eth_signTypedData_v4"));
  });

  it("refuses malformed terms before the wallet is opened", async () => {
    const challenge = { ...challengeFromPaymentRequired(PAYMENT_REQUIRED)!, accepted: { ...ACCEPTED, scheme: "upto" } };
    const p = provider();
    const s = await payDoor({ door: door(), challenge, provider: p, walletName: "w", fetchImpl: vi.fn() as unknown as typeof fetch });
    expect(s.kind).toBe("error");
    expect(p.calls).toHaveLength(0);
  });
});

describe("three outcomes and no fourth", () => {
  it("DELIVERED carries the settle reference the door echoed, decoded from X-PAYMENT-RESPONSE", async () => {
    const receipt = { success: true, transaction: `0x${"cd".repeat(32)}`, network: "eip155:8453", payer: SIGNER };
    const fetchImpl = vi.fn(async (_u: unknown, init?: RequestInit) => {
      expect((init?.headers as Record<string, string>)["x-payment"]).toMatch(/^[A-Za-z0-9+/=]+$/);
      return jsonResponse(200, { schema: "csoai.rwa-evidence/0.1" }, { "x-payment-response": btoa(JSON.stringify(receipt)) });
    }) as unknown as typeof fetch;
    const s = await payDoor({ door: door(), challenge: challengeFromPaymentRequired(PAYMENT_REQUIRED)!, provider: provider(), walletName: "w", fetchImpl });
    expect(s.kind).toBe("delivered");
    if (s.kind === "delivered") {
      expect(s.settlement).toEqual({ transaction: receipt.transaction, network: "eip155:8453", payer: SIGNER, success: true });
      expect(explorerTxUrl(s.settlement!.network, s.settlement!.transaction)).toBe(`https://basescan.org/tx/${receipt.transaction}`);
    }
  });

  it("DELIVERED without a receipt header keeps settlement null — delivery is not proof of settlement", async () => {
    const out = await retryDoorWithPayment(door(), "hdr", vi.fn(async () => jsonResponse(200, {})) as unknown as typeof fetch);
    expect(out.kind).toBe("delivered");
    if (out.kind === "delivered") {
      expect(out.paymentResponse).toBeNull();
      expect(out.settlement).toBeNull();
    }
    expect(decodeSettlement("not base64 json")).toBeNull();
  });

  it("UNSETTLED when the door answers 402 again, with the facilitator's reason verbatim", async () => {
    const reason = "facilitator rejected receipt: invalid_exact_evm_insufficient_balance";
    const fetchImpl = vi.fn(async () => jsonResponse(402, { ...PAYMENT_REQUIRED, csoai: { not_paid_reason: reason } })) as unknown as typeof fetch;
    const s = await payDoor({ door: door(), challenge: challengeFromPaymentRequired(PAYMENT_REQUIRED)!, provider: provider(), walletName: "w", fetchImpl });
    expect(s).toEqual({ kind: "unsettled", reason });
  });

  it("reads the reason from the three places a door may relay it, and says when there is none", () => {
    expect(unsettledReason({ csoai: { not_paid_reason: "a" } })).toBe("a");
    expect(unsettledReason({ extensions: { csoai: { not_paid_reason: "b" } } })).toBe("b");
    expect(unsettledReason({ not_paid_reason: "c" })).toBe("c");
    expect(unsettledReason({ error: "Payment required" })).toMatch(/relayed no reason/);
  });

  it("REJECTED when the wallet declines: nothing sent, no retry", async () => {
    const p = provider({
      onSign: () => {
        throw Object.assign(new Error("MetaMask Typed Message Signature: User denied message signature."), { code: 4001 });
      },
    });
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const s = await payDoor({ door: door(), challenge: challengeFromPaymentRequired(PAYMENT_REQUIRED)!, provider: p, walletName: "w", fetchImpl });
    expect(s.kind).toBe("rejected");
    if (s.kind === "rejected") expect(s.detail).toMatch(/nothing was charged/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("WRONG NETWORK when the wallet will not move to the challenge's chain — no retry either", async () => {
    const p = provider({ chain: "0x1" });
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const s = await payDoor({ door: door(), challenge: challengeFromPaymentRequired(PAYMENT_REQUIRED)!, provider: p, walletName: "w", fetchImpl });
    expect(s.kind).toBe("wrong-network");
    if (s.kind === "wrong-network") expect(s.detail).toMatch(/stayed on chain 1; the 402 requires 8453/);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(p.calls.some((c) => c.method === "eth_signTypedData_v4")).toBe(false);
  });
});

describe("deep link and walk order", () => {
  it("?door=<url> selects the exact url, or the route with any query, or a bare path", () => {
    const doors = doorsFromManifest(MANIFEST);
    expect(doorFromSearch("?door=" + encodeURIComponent(doors[2].url))).toBe(doors[2].url);
    expect(selectDoor(doors, doors[2].url)?.url).toBe(doors[2].url);
    expect(selectDoor(doors, `${ORIGIN}/api/rwa/evidence?asset=XRP`)?.url).toBe(doors[2].url);
    expect(selectDoor(doors, "/api/free-door")?.url).toBe(doors[0].url);
    expect(selectDoor(doors, `${ORIGIN}/api/nothing`)).toBeNull();
    expect(doorFromSearch("")).toBeNull();
    expect(routeKey("nonsense")).toBe("nonsense");
  });

  it("pay-all walks only doors with a live challenge that have not been delivered", () => {
    const doors = doorsFromManifest(MANIFEST);
    const ch = challengeFromPaymentRequired(PAYMENT_REQUIRED)!;
    const quotes = {
      [doors[0].url]: { kind: "challenge" as const, http: 402 as const, challenge: ch, body: {} },
      [doors[1].url]: { kind: "no-challenge" as const, http: 404, detail: "x" },
      [doors[2].url]: { kind: "challenge" as const, http: 402 as const, challenge: ch, body: {} },
    };
    const states = { [doors[2].url]: { kind: "delivered" as const, paymentResponse: null, settlement: null } };
    expect(remainingDoors(doors, quotes, states).map((d) => d.url)).toEqual([doors[0].url]);
  });
});

describe("the listing column is the index's record, or an honest unknown", () => {
  const reading = (partial: Partial<ListingReading>): ListingReading => ({
    kind: "MEASURED",
    as_of: "2026-09-22T13:00:00Z",
    absence_determinate: true,
    scanned: 6715,
    declared_total: 6715,
    rows: [{ resource: `${ORIGIN}/api/free-door`, route_key: `${ORIGIN}/api/free-door`, last_updated: "2026-09-09T08:26:19.435Z", amount: "0", max_timeout_seconds: 300 }],
    ...partial,
  });
  const doors = doorsFromManifest(MANIFEST);

  it("LISTED with the row's last_updated", () => {
    expect(listingFor(doors[0], reading({}))).toMatchObject({ status: "LISTED", lastUpdated: "2026-09-09T08:26:19.435Z" });
  });

  it("NOT LISTED only when the index was read in full", () => {
    expect(listingFor(doors[2], reading({}))).toMatchObject({ status: "NOT_LISTED", scanned: 6715, declared: 6715 });
  });

  it("a row under the door's FULL url is found in either query spelling, and preferred over the bare-path row", () => {
    const door = doors[2]; // …/rwa/evidence?asset=RLUSD
    const bare = { resource: `${ORIGIN}/api/rwa/evidence`, route_key: `${ORIGIN}/api/rwa/evidence`, last_updated: "2026-09-01T00:00:00Z", amount: "10000", max_timeout_seconds: 300 };
    const full = { resource: `${ORIGIN}/api/rwa/evidence?asset=RLUSD`, route_key: `${ORIGIN}/api/rwa/evidence`, last_updated: "2026-09-22T12:00:00Z", amount: "10000", max_timeout_seconds: 300 };
    expect(listingFor(door, reading({ rows: [full] }))).toMatchObject({ status: "LISTED", lastUpdated: "2026-09-22T12:00:00Z" });
    expect(listingFor(door, reading({ rows: [bare, full] }))).toMatchObject({ status: "LISTED", lastUpdated: "2026-09-22T12:00:00Z" });
    expect(listingFor(door, reading({ rows: [bare] }))).toMatchObject({ status: "LISTED", lastUpdated: "2026-09-01T00:00:00Z" });
    expect(sameResource(`${ORIGIN}/api/wrapper?id=usdc.e%3Aarbitrum`, `${ORIGIN}/api/wrapper?id=usdc.e:arbitrum`)).toBe(true);
    expect(sameResource(`${ORIGIN}/api/wrapper?id=dai:optimism`, `${ORIGIN}/api/wrapper?id=usdc.e:arbitrum`)).toBe(false);
  });

  it("UNCHECKABLE — never NOT LISTED, never 0 — when the read was short, failed, or never happened", () => {
    expect(listingFor(doors[2], reading({ absence_determinate: false, reason: "short" }))).toMatchObject({ status: "UNCHECKABLE", reason: "short" });
    expect(listingFor(doors[2], reading({ kind: "UNCHECKABLE", absence_determinate: false, rows: [], reason: "HTTP 502" }))).toMatchObject({ status: "UNCHECKABLE", reason: "HTTP 502" });
    expect(listingFor(doors[2], null)).toMatchObject({ status: "UNCHECKABLE" });
    // a row seen in a short read is still LISTED — presence is observed, only absence is not
    expect(listingFor(doors[0], reading({ absence_determinate: false }))).toMatchObject({ status: "LISTED" });
  });
});

describe("the 402 Index cell is that index's record, or an honest unknown", () => {
  const doors = doorsFromManifest(MANIFEST);
  const reading = (over: Partial<Index402Reading> = {}): Index402Reading => ({
    kind: "MEASURED",
    as_of: "2026-09-22T14:08:21Z",
    declared_total: 112,
    scanned: 112,
    absence_determinate: true,
    rows: [{ url: `${ORIGIN}/api/free-door`, route_key: `${ORIGIN}/api/free-door`, health_status: "healthy", last_checked: "2026-09-22 10:00:13", domain_verified: false }],
    reason: null,
    ...over,
  });

  it("LISTED with the row's health word and probe time, exactly as the index wrote them", () => {
    expect(index402For(doors[0], reading())).toEqual({ status: "LISTED", health: "healthy", lastChecked: "2026-09-22 10:00:13", domainVerified: false, asOf: "2026-09-22T14:08:21Z", exact: true });
  });

  it("NOT LISTED only when the search was read in full; a route-key row counts and says it was not exact", () => {
    expect(index402For(doors[2], reading())).toMatchObject({ status: "NOT_LISTED", scanned: 112, declared: 112 });
    const byRoute = reading({ rows: [{ url: `${ORIGIN}/api/rwa/evidence`, health_status: "down" }] });
    expect(index402For(doors[2], byRoute)).toMatchObject({ status: "LISTED", health: "down", lastChecked: null, domainVerified: null, exact: false });
  });

  it("UNCHECKABLE — never NOT LISTED — when the read was short, failed, or never happened", () => {
    expect(index402For(doors[2], reading({ absence_determinate: false, reason: "index answered HTTP 503 at offset 100" }))).toEqual({ status: "UNCHECKABLE", reason: "index answered HTTP 503 at offset 100" });
    expect(index402For(doors[2], reading({ kind: "UNCHECKABLE", absence_determinate: false, reason: null }))).toMatchObject({ status: "UNCHECKABLE", reason: expect.stringMatching(/not read in full/) });
    expect(index402For(doors[2], null)).toMatchObject({ status: "UNCHECKABLE" });
    expect(index402For(doors[0], reading({ absence_determinate: false }))).toMatchObject({ status: "LISTED" });
  });
});

describe("the last-settle cell is this site's record, or null", () => {
  const doors = doorsFromManifest(MANIFEST);
  const reading = (over: Partial<DoorSettlesReading> = {}): DoorSettlesReading => ({
    kind: "MEASURED",
    as_of: "2026-09-22T14:08:21Z",
    rows: [{ resource: `${ORIGIN}/api/rwa/evidence?asset=RLUSD`, route_key: `${ORIGIN}/api/rwa/evidence`, last_settle: "2026-09-20T09:30:00.000Z", tx: "0x3", network: "eip155:8453", self: true, zero_value: false, settles: 3 }],
    reason: null,
    ...over,
  });

  it("SETTLED carries the record's own instant, tx and self flag", () => {
    expect(settleFor(doors[2], reading())).toEqual({ status: "SETTLED", lastSettle: "2026-09-20T09:30:00.000Z", tx: "0x3", network: "eip155:8453", self: true, settles: 3, asOf: "2026-09-22T14:08:21Z", exact: true });
  });

  it("a door with no record is NONE_ON_RECORD with lastSettle null — never a date borrowed from elsewhere", () => {
    expect(settleFor(doors[0], reading())).toEqual({ status: "NONE_ON_RECORD", lastSettle: null, asOf: "2026-09-22T14:08:21Z" });
    const unreadableTime = reading({ rows: [{ resource: `${ORIGIN}/api/free-door`, last_settle: "yesterday-ish" }] });
    expect(settleFor(doors[0], unreadableTime)).toMatchObject({ status: "NONE_ON_RECORD", lastSettle: null });
  });

  it("UNMEASURED with the reason when the records were not read, or the store is not bound", () => {
    expect(settleFor(doors[2], null)).toMatchObject({ status: "UNMEASURED", lastSettle: null });
    expect(settleFor(doors[2], reading({ kind: "UNMEASURED", rows: [], reason: "no REVENUE_KV bound — nothing is recorded, so no door has a last settle here" }))).toEqual({
      status: "UNMEASURED",
      lastSettle: null,
      reason: "no REVENUE_KV bound — nothing is recorded, so no door has a last settle here",
    });
  });

  it("a bare-path record matches the door by route and says it was not exact", () => {
    const bare = reading({ rows: [{ resource: `${ORIGIN}/api/rwa/evidence`, last_settle: "2026-09-01T00:00:00Z" }] });
    expect(settleFor(doors[2], bare)).toMatchObject({ status: "SETTLED", lastSettle: "2026-09-01T00:00:00Z", tx: null, exact: false });
  });
});

describe("the delist alarm: red at 25 days, red on null, and not a day early", () => {
  const NOW = Date.parse("2026-09-22T12:00:00.000Z");
  const DAY = 24 * 60 * 60 * 1000;
  const at = (ms: number) => new Date(NOW - ms).toISOString();

  it("is 25 days, stated once", () => {
    expect(DELIST_RISK_DAYS).toBe(25);
  });

  it("null, undefined and an unreadable instant are all risk — nothing on record is not recent", () => {
    expect(delistRisk(null, NOW)).toBe(true);
    expect(delistRisk(undefined, NOW)).toBe(true);
    expect(delistRisk("", NOW)).toBe(true);
    expect(delistRisk("not a date", NOW)).toBe(true);
  });

  it("boundary: one millisecond short of 25 days is not risk; exactly 25 days is; a day later still is", () => {
    expect(delistRisk(at(25 * DAY - 1), NOW)).toBe(false);
    expect(delistRisk(at(25 * DAY), NOW)).toBe(true);
    expect(delistRisk(at(26 * DAY), NOW)).toBe(true);
    expect(delistRisk(at(0), NOW)).toBe(false);
    expect(delistRisk(at(24 * DAY), new Date(NOW))).toBe(false);
  });

  it("a settle in the future (clock skew) is not risk, and daysSince floors", () => {
    expect(delistRisk(at(-DAY), NOW)).toBe(false);
    expect(daysSince(at(2.9 * DAY), NOW)).toBe(2);
    expect(daysSince(null, NOW)).toBeNull();
    expect(daysSince("nope", NOW)).toBeNull();
  });
});

describe("the Settle-all tally reads the door states and counts each door once", () => {
  it("delivered / unsettled / rejected / failed / pending", () => {
    const q = ["a", "b", "c", "d", "e", "f"];
    const tally = walkTally(q, {
      a: { kind: "delivered", paymentResponse: null, settlement: null },
      b: { kind: "unsettled", reason: "x" },
      c: { kind: "rejected", detail: "y" },
      d: { kind: "wrong-network", detail: "z" },
      e: { kind: "signing", wallet: "MetaMask" },
      z: { kind: "delivered", paymentResponse: null, settlement: null }, // not in the queue: not counted
    });
    expect(tally).toEqual({ queued: 6, delivered: 1, unsettled: 1, rejected: 1, failed: 1, pending: 2 });
    expect(walkTally([], {})).toEqual({ queued: 0, delivered: 0, unsettled: 0, rejected: 0, failed: 0, pending: 0 });
  });
});
