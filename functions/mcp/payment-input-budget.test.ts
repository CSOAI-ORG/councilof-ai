import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPaidRequest, paidToolResult } from "./_paid";
afterEach(() => vi.unstubAllGlobals());
describe("payment header resource preflight", () => {
  it.each([false, true])(
    "stops nested payment JSON before a route/facilitator call (base64=%s)",
    async (encoded) => {
      let payload: unknown = {};
      for (let n = 0; n < 70; n++) payload = { payload };
      const json = JSON.stringify(payload);
      const network = vi.fn(() => {
        throw new Error("No payment route should be called");
      });
      vi.stubGlobal("fetch", network);
      const result = await paidToolResult(
        "commission_card",
        { subject: "fixture", x_payment: encoded ? btoa(json) : json },
        "https://councilof.ai",
      );
      expect(result.structuredContent).toMatchObject({
        status: "BAD_ARGUMENTS",
      });
      expect(result.structuredContent?.reason).toContain("limit");
      expect(network).not.toHaveBeenCalled();
    },
  );
  it("bounds decoded width and header bytes before request construction", () => {
    for (const x_payment of [
      btoa(JSON.stringify({ payload: Array(10_001).fill(0) })),
      "A".repeat(65_537),
    ]) {
      expect(
        buildPaidRequest(
          "commission_card",
          { subject: "fixture", x_payment },
          "https://councilof.ai",
        ),
      ).toHaveProperty("error");
    }
  });
  it.each([false, true])(
    "retains exact under-budget caller authorization bytes (base64=%s)",
    (encoded) => {
      const json = JSON.stringify({
        x402Version: 1,
        scheme: "exact",
        network: "base",
        payload: { signature: "offline-fixture" },
      });
      const x_payment = encoded ? btoa(json) : json;
      const built = buildPaidRequest(
        "commission_card",
        { subject: "fixture", x_payment },
        "https://councilof.ai",
      );
      expect("req" in built && built.req.headers.get("x-payment")).toBe(
        x_payment,
      );
    },
  );
});
