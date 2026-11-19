import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyX402Payment, x402Accepts } from "./_x402";
import { _clearSupportedCache } from "./_x402_negotiate";

/**
 * THE SETTLE PATH MUST SURVIVE A BLIP (defect measured 2026-10-13).
 *
 * PayAI's /discovery/resources/{r}/stats defines `reliability` as "percentage of settlement
 * attempts that succeeded". api/request-attestation read 88 — exactly 7 of 8 attempts, the same
 * failure sitting at 6 of 7 = 86 in the 17–21 Sep snapshots — while free-door read 100 over 20
 * attempts. Until this fix, the /verify and /settle fetches had no timeout and no retry, so ONE
 * dropped connection or 5xx permanently failed an attempt whose payment was correctly signed
 * ("facilitator error: …" — a real defect between a buyer and our money, per
 * scripts/x402-rail-proof.py's verdict table).
 *
 * What must hold:
 *   - transient failure (network throw, 5xx, 429) on /verify or /settle → exactly ONE retry, and
 *     the attempt completes when the retry lands;
 *   - a definitive verdict (isValid:false / success:false / any 4xx) → never retried;
 *   - persistent transient failure → fails after exactly two tries, bounded, as before.
 *
 * Retry on /settle is idempotent: the buyer's EIP-3009 authorization funds at most one transfer
 * (its nonce is consumed on success), so a repeat can observe the settlement, never double-charge.
 */

const RESOURCE = "https://councilof.ai/api/request-attestation?subject=llama3.2:3b";
const FAC = "https://f.example";
const ENV = { X402_FACILITATOR_URL: FAC };

const receipt = () =>
  btoa(
    JSON.stringify({
      x402Version: 2,
      scheme: "exact",
      network: "eip155:8453",
      payload: {
        signature: "0x" + "11".repeat(65),
        authorization: {
          from: "0x" + "22".repeat(20),
          to: "0x" + "33".repeat(20),
          value: "10000",
          validAfter: "0",
          validBefore: "99999999999",
          nonce: "0x" + "44".repeat(32),
        },
      },
    }),
  );

const req = () => new Request(RESOURCE, { headers: { "x-payment": receipt() } });
const [a] = x402Accepts({}, RESOURCE, { skuId: "request_attestation", tier: "per_request" });

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

type Handlers = {
  verify: (call: number) => Response | Promise<Response>;
  settle: (call: number) => Response | Promise<Response>;
};

function stubFetch(handlers: Handlers) {
  const counts = { supported: 0, verify: 0, settle: 0 };
  vi.stubGlobal("fetch", async (u: unknown) => {
    const url = String(u);
    if (url.endsWith("/supported")) {
      counts.supported++;
      return new Response("{}", { status: 404 }); // inconclusive negotiation → client dialect
    }
    if (url.endsWith("/verify")) return handlers.verify(++counts.verify);
    if (url.endsWith("/settle")) return handlers.settle(++counts.settle);
    throw new Error("unexpected fetch " + url);
  });
  return counts;
}

beforeEach(() => {
  _clearSupportedCache();
});
afterEach(() => vi.unstubAllGlobals());

describe("the settle path is bounded and retried once on transient failure", () => {
  it("retries a transient /verify 5xx and the attempt still settles", async () => {
    const counts = stubFetch({
      verify: (n) => (n === 1 ? new Response("oops", { status: 502 }) : ok({ isValid: true })),
      settle: () => ok({ success: true, transaction: "0xabc", network: "base", payer: "0xpayer" }),
    });
    const r = await verifyX402Payment(req(), ENV, RESOURCE, a);
    expect(r.ok).toBe(true);
    expect(counts.verify).toBe(2); // one retry, then done
    expect(counts.settle).toBe(1);
  });

  it("retries a dropped /settle connection and observes the settlement", async () => {
    const counts = stubFetch({
      verify: () => ok({ isValid: true }),
      settle: (n) => {
        if (n === 1) throw new Error("socket hang up");
        return ok({ success: true, transaction: "0xabc", network: "base", payer: "0xpayer" });
      },
    });
    const r = await verifyX402Payment(req(), ENV, RESOURCE, a);
    expect(r.ok).toBe(true);
    expect(counts.settle).toBe(2);
    expect(r.settlement?.transaction).toBe("0xabc");
  });

  it("retries a transient /settle 5xx and the attempt still settles", async () => {
    const counts = stubFetch({
      verify: () => ok({ isValid: true }),
      settle: (n) => (n === 1 ? new Response("bad gateway", { status: 502 }) : ok({ success: true, transaction: "0xdef", network: "base", payer: "0xpayer" })),
    });
    const r = await verifyX402Payment(req(), ENV, RESOURCE, a);
    expect(r.ok).toBe(true);
    expect(counts.settle).toBe(2);
  });

  it("answers a definitive verify rejection once — never retried", async () => {
    const counts = stubFetch({
      verify: () => ok({ isValid: false, invalidReason: "invalid_exact_evm_signature" }),
      settle: () => ok({ success: true }),
    });
    const r = await verifyX402Payment(req(), ENV, RESOURCE, a);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/facilitator rejected receipt: invalid_exact_evm_signature/);
    expect(counts.verify).toBe(1);
    expect(counts.settle).toBe(0);
  });

  it("answers a definitive settle verdict once — never retried", async () => {
    const counts = stubFetch({
      verify: () => ok({ isValid: true }),
      settle: () => ok({ success: false, errorReason: "insufficient_funds" }),
    });
    const r = await verifyX402Payment(req(), ENV, RESOURCE, a);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/settle failed: insufficient_funds/);
    expect(counts.settle).toBe(1);
  });

  it("persistent transient failure is bounded to two tries and fails as before", async () => {
    const counts = stubFetch({
      verify: () => new Response("oops", { status: 502 }),
      settle: () => ok({ success: true }),
    });
    const r = await verifyX402Payment(req(), ENV, RESOURCE, a);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/facilitator \/verify HTTP 502/);
    expect(counts.verify).toBe(2);
  });
});
