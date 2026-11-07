import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { onRequestGet, RESERVE_FETCH_TIMEOUT_MS } from "./request-attestation";
import { verifyX402Payment } from "./_x402";
import { onRequestGet as art50Get } from "./art50/marking-evidence";

vi.mock("./_x402", async (load) => ({
  ...(await load<typeof import("./_x402")>()),
  verifyX402Payment: vi.fn(),
}));

/**
 * THE PAID DELIVERABLE CANNOT HANG, AND CANNOT LIE ABOUT AN UNREAD RESERVE (2026-10-13).
 *
 * PayAI's reliability stat ("percentage of settlement attempts that succeeded") reads
 * api/request-attestation at 88 — exactly 7 of 8 attempts — against free-door/eunomia/art50 at
 * 100. This door is the only one of the four whose paid path WAITS on a same-origin fetch
 * (/signed/card-matrix.json) that had no timeout and no retry: the same read the 2026-09-28
 * canary caught hanging 20–40 s on 3 of 4 probes. Money had already moved when the wait began,
 * so a stalled read meant the attempt never completed.
 *
 * What must hold after the fix:
 *   - the deliverable terminates within 2 × RESERVE_FETCH_TIMEOUT_MS even if the read never
 *     answers, and ships an honest receipt;
 *   - an unread reserve reads as UNCHECKABLE (reserve_count null — never 0, never "empty");
 *   - one transient blip is absorbed by a retry and the reserve is still read;
 *   - no door borrows another door's SKU: art50's no-input challenge carried
 *     csoai.product.request_attestation (free-door's fix #29 class), mis-attributing any settle
 *     through that challenge to the attestation product.
 */

const origin = "https://councilof.ai";
const payment = vi.mocked(verifyX402Payment);

function kvStub() {
  const data = new Map<string, string>();
  return {
    kv: {
      get: vi.fn(async (k: string) => data.get(k) ?? null),
      put: vi.fn(async (k: string, v: string) => void data.set(k, v)),
      list: vi.fn(async () => ({ keys: [], list_complete: true })),
    } as unknown as KVNamespace,
    data,
  };
}

async function paidCall(fetchImpl?: typeof fetch) {
  if (fetchImpl) vi.stubGlobal("fetch", fetchImpl);
  const { kv } = kvStub();
  const r = await onRequestGet({
    request: new Request(`${origin}/api/request-attestation?subject=qwen3:4b`, {
      headers: { "x-payment": "c3ludGhldGljLW5vdC1hLXJlYWwtcGF5bWVudA==" },
    }),
    env: { REVENUE_KV: kv },
  } as unknown as Parameters<typeof onRequestGet>[0]);
  return { response: r, body: await r.json() as any };
}

const matrix = (cells: unknown[] = []) =>
  new Response(JSON.stringify({ as_of: "2026-09-01T00:00:00Z", cells }), { status: 200 });

beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  payment.mockResolvedValue({
    ok: true,
    settlement: { transaction: "0x" + "1".repeat(64), network: "base", payer: "0x" + "2".repeat(40) },
  } as any);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("the paid deliverable is bounded and honest about an unread reserve", () => {
  it("terminates and ships an honest receipt when the matrix read never answers", async () => {
    vi.useFakeTimers();
    const pending: string[] = [];
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      pending.push(String(input));
      return new Promise<Response>(() => {}); // a read that never answers
    }));
    const { kv } = kvStub();
    const answer = onRequestGet({
      request: new Request(`${origin}/api/request-attestation?subject=qwen3:4b`, {
        headers: { "x-payment": "c3ludGhldGljLW5vdC1hLXJlYWwtcGF5bWVudA==" },
      }),
      env: { REVENUE_KV: kv },
    } as unknown as Parameters<typeof onRequestGet>[0]);
    // the deliverable terminates within the bounded read (2 attempts), not "whenever the edge does"
    await vi.advanceTimersByTimeAsync(RESERVE_FETCH_TIMEOUT_MS * 2 + 500);
    const response = await answer;
    expect(response.status).toBe(200);
    const body = await response.json() as any;
    // bounded, with a retry attempt made
    expect(pending.filter((u) => u.includes("/signed/card-matrix.json")).length).toBe(2);
    // NULL, NEVER 0: an unread reserve is UNCHECKABLE, not "no cards on file"
    expect(body.card.payload.reserve_read).toBe(false);
    expect(body.card.payload.reserve_count).toBeNull();
    expect(body.card.payload.reserve_returned).toBeNull();
    expect(body.card.payload.reserve).toEqual([]);
    expect(JSON.stringify(body.card.source_urls)).toContain("unreadable after 2 attempts");
  });

  it("absorbs one transient matrix failure via the retry and still reads the reserve", async () => {
    let calls = 0;
    const { body } = await paidCall(async (input: RequestInfo | URL) => {
      if (String(input).includes("/signed/card-matrix.json")) {
        calls++;
        if (calls === 1) return new Response("unavailable", { status: 503 });
        return matrix([{ model: "qwen3:4b", axis: "governance", card: "e".repeat(64), card_url: "/signed/cards/e.json", signed: true }]);
      }
      return matrix();
    });
    expect(calls).toBe(2);
    expect(body.card.payload.reserve_read).toBe(true);
    expect(body.card.payload.reserve_count).toBe(1);
  });

  it("reports a persistently unread matrix as null, never as an empty reserve", async () => {
    let calls = 0;
    const { body } = await paidCall(async (input: RequestInfo | URL) => {
      if (String(input).includes("/signed/card-matrix.json")) {
        calls++;
        return new Response("unavailable", { status: 503 });
      }
      return matrix();
    });
    expect(calls).toBe(2);
    expect(body.card.payload.reserve_read).toBe(false);
    expect(body.card.payload.reserve_count).toBeNull();
  });
});

describe("SKU attribution — each door carries its own", () => {
  it("art50's no-input challenge advertises its own sku, not request_attestation's", async () => {
    // the unpaid challenge path: a payment that did not settle must yield the 402
    payment.mockResolvedValue({ ok: false, reason: "no payment header" } as any);
    const response = await art50Get({
      request: new Request(`${origin}/api/art50/marking-evidence`),
      env: {},
    } as unknown as Parameters<typeof art50Get>[0]);
    expect(response.status).toBe(402);
    const body = await response.json() as any;
    const acc = body.accepts[0];
    expect(acc.csoai_pricing.product_id).toBe("csoai.product.art50_marking_evidence");
    expect(acc.csoai_pricing.sku_id).toBe("art50_marking_evidence");
    // the duplication this closes
    expect(acc.csoai_pricing.product_id).not.toBe("csoai.product.request_attestation");
    // the challenge advertises THIS door's own pack price (25 USDC at 6 decimals per
    // functions/api/_skus.ts), not request_attestation's per-request atom
    expect(acc.csoai_pricing.normal_amount_atomic).toBe("25000000");
  });
});
