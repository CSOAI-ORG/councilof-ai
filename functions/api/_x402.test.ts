import { afterEach, describe, expect, it, vi } from "vitest";
import { x402Accepts, verifyX402Payment, buildPaymentRequiredV2, toLegacyNetwork, toV1Requirements } from "./_x402";
import { ESTATE_PAY_TO, resolvePayTo, railMode, USDC_BASE_EIP712 } from "./_x402_config";
import { USDC_BASE } from "./_skus";

const RESOURCE = "https://councilof.ai/api/request-attestation";
const receipt = (v: 1 | 2) =>
  btoa(JSON.stringify({ x402Version: v, scheme: "exact", network: v === 2 ? "eip155:8453" : "base", payload: { signature: "0x", authorization: {} } }));

afterEach(() => vi.unstubAllGlobals());

describe("x402 rail — money destination and token domain", () => {
  it("advertises the estate wallet by default and lets env override it", () => {
    expect(resolvePayTo({})).toBe(ESTATE_PAY_TO);
    expect(resolvePayTo({ X402_PAY_TO: "0x000000000000000000000000000000000000dEaD" })).toBe("0x000000000000000000000000000000000000dEaD");
    // A malformed override must not silently fall back to the default (funds would go to the wrong place).
    expect(resolvePayTo({ X402_PAY_TO: "not-an-address" })).toBeNull();
  });

  it("accepts[] carries a complete challenge: USDC on Base, CAIP-2, EIP-712 domain of the token", () => {
    const [a] = x402Accepts({}, RESOURCE, { skuId: "request_attestation", tier: "per_request" });
    expect(a.payTo).toBe(ESTATE_PAY_TO);
    expect(a.asset).toBe(USDC_BASE.asset);
    expect(a.network).toBe("eip155:8453");
    expect(a.amount).toMatch(/^\d+$/);
    // The client signs transferWithAuthorization under the TOKEN's domain — "USD Coin"/"2", not the ticker.
    expect(a.extra.name).toBe(USDC_BASE_EIP712.name);
    expect(a.extra.version).toBe("2");
  });

  it("v1 requirements name Base by slug so a v1 facilitator recognises the chain", () => {
    const [a] = x402Accepts({}, RESOURCE, { skuId: "issuance", tier: "reserve" });
    expect(toLegacyNetwork(a.network)).toBe("base");
    expect(toV1Requirements(a)).toMatchObject({ network: "base", payTo: ESTATE_PAY_TO, asset: USDC_BASE.asset, extra: { name: "USD Coin", version: "2" } });
  });

  it("the v2 PaymentRequired body never leaks the ticker as the EIP-712 name", () => {
    const accepts = x402Accepts({}, RESOURCE, { skuId: "evidence_bundle", tier: "bundle" });
    const pr = buildPaymentRequiredV2({ resourceUrl: RESOURCE, description: "d", serviceName: "s", accepts, bazaar: { info: {}, schema: {} } });
    expect((pr.accepts as { extra: { name: string } }[])[0].extra.name).toBe("USD Coin");
    expect(pr.x402Version).toBe(2);
  });

  it("reports an honest mode: challenge-only until a facilitator is provisioned", () => {
    expect(railMode({})).toMatchObject({ mode: "challenge-only", pay_to_configured: true, facilitator_configured: false });
    expect(railMode({ X402_FACILITATOR_URL: "https://f.example" })).toMatchObject({ mode: "live" });
  });
});

describe("x402 rail — settlement is fail-closed and verify≠settle", () => {
  const req = (h?: string) => new Request(RESOURCE, { headers: h ? { "x-payment": h } : {} });

  it("refuses without a header, with garbage, and with no facilitator", async () => {
    expect((await verifyX402Payment(req(), {}, RESOURCE)).ok).toBe(false);
    expect((await verifyX402Payment(req("x-payment: test"), {}, RESOURCE)).ok).toBe(false);
    const r = await verifyX402Payment(req(receipt(1)), {}, RESOURCE);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/not provisioned/);
  });

  it("does NOT grant on /verify alone — /settle must succeed", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (u: string, init?: RequestInit) => {
      calls.push(String(u));
      const body = JSON.parse(String(init?.body));
      expect(body.paymentRequirements.payTo).toBe(ESTATE_PAY_TO);
      if (String(u).endsWith("/verify")) return new Response(JSON.stringify({ isValid: true }), { status: 200 });
      return new Response(JSON.stringify({ success: false, errorReason: "insufficient_funds" }), { status: 200 });
    });
    const [a] = x402Accepts({}, RESOURCE, { skuId: "request_attestation", tier: "per_request" });
    const r = await verifyX402Payment(req(receipt(1)), { X402_FACILITATOR_URL: "https://f.example/" }, RESOURCE, a);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/settle failed: insufficient_funds/);
    expect(calls).toEqual(["https://f.example/verify", "https://f.example/settle"]);
  });

  it("grants only after settle, echoing the facilitator's settlement facts and speaking the client's dialect", async () => {
    const seen: { url: string; body: { x402Version: number; paymentRequirements: { network: string } } }[] = [];
    vi.stubGlobal("fetch", async (u: string, init?: RequestInit) => {
      seen.push({ url: String(u), body: JSON.parse(String(init?.body)) });
      if (String(u).endsWith("/verify")) return new Response(JSON.stringify({ isValid: true }), { status: 200 });
      return new Response(JSON.stringify({ success: true, transaction: "0xabc", network: "base", payer: "0xpayer" }), { status: 200 });
    });
    const [a] = x402Accepts({}, RESOURCE, { skuId: "request_attestation", tier: "per_request" });
    const v1 = await verifyX402Payment(req(receipt(1)), { X402_FACILITATOR_URL: "https://f.example" }, RESOURCE, a);
    expect(v1.ok).toBe(true);
    expect(v1.settlement).toEqual({ transaction: "0xabc", network: "base", payer: "0xpayer" });
    expect(JSON.parse(atob(v1.paymentResponse!))).toMatchObject({ success: true, transaction: "0xabc" });
    expect(seen[0].body.x402Version).toBe(1);
    expect(seen[0].body.paymentRequirements.network).toBe("base");

    seen.length = 0;
    const v2 = await verifyX402Payment(req(receipt(2)), { X402_FACILITATOR_URL: "https://f.example" }, RESOURCE, a);
    expect(v2.ok).toBe(true);
    expect(seen[0].body.x402Version).toBe(2);
    expect(seen[0].body.paymentRequirements.network).toBe("eip155:8453");
  });
});
