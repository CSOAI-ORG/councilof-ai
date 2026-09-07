import { describe, expect, it } from "vitest";
import { onRequestGet, PAID_ROUTE, PAID_TOOL, sellerBody } from "./x402-trust-seller";

const call = (qs = "") =>
  (onRequestGet as unknown as (c: unknown) => Promise<Response>)({
    request: new Request(`https://councilof.ai/api/x402-trust-seller${qs}`),
    env: {},
  });

describe("/api/x402-trust-seller — seller-side trust sold as commission_card", () => {
  it("points the paid step at the shipped commission_card door", async () => {
    const res = await call("?host=example.com");
    expect(res.status).toBe(200);
    const b = (await res.json()) as Record<string, unknown>;
    expect(b.sold_as).toBe(PAID_TOOL);
    expect(b.sold_as).toBe("commission_card");
    expect(String(b.paid_step)).toBe(`https://councilof.ai${PAID_ROUTE}?subject=example.com`);
    expect(String(b.paid_step)).toMatch(/request-attestation\?subject=example\.com$/);
    expect(b.risk_verdict).toBe("UNMEASURED");
    expect(b.never).toEqual(expect.arrayContaining(["a certificate", "a grade"]));
  });

  it("rejects a host that is not a DNS label", async () => {
    const res = await call("?host=http://evil.example/x");
    expect(res.status).toBe(400);
  });

  it("sellerBody keeps host names off the aggregate counts URL", () => {
    const b = sellerBody("https://councilof.ai", "vaults.fyi");
    expect(b.host).toBe("vaults.fyi");
    expect(String(b.counts_aggregate)).toBe("https://councilof.ai/interop/x402-trust/latest.json");
    expect(String(b.counts_aggregate)).not.toMatch(/vaults/);
  });
});
