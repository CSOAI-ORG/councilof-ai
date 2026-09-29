import { describe, expect, it } from "vitest";
import { onRequestGet, onRequestPost } from "./paddle-webhook";

// The paid issuer is withdrawn. Neither method may verify, store or issue anything, and no
// response may carry a certificate or an entitlement — whatever the request or the env holds.
describe("/api/paddle-webhook — withdrawn", () => {
  const env = { PADDLE_WEBHOOK_SECRET: "x".repeat(40), BOARD_SIGN_KEY_PKCS8_B64: "not-a-key" };
  const req = () =>
    new Request("https://councilof.ai/api/paddle-webhook", {
      method: "POST",
      headers: { "paddle-signature": "hmac:00" },
      body: JSON.stringify({ event_type: "transaction.completed", data: { id: "txn_1", items: [] } }),
    });

  for (const [name, handler, ctx] of [
    ["GET", onRequestGet, { env }],
    ["POST", onRequestPost, { env, request: req() }],
  ] as const) {
    it(`${name} answers the retired-endpoint shape and issues nothing`, async () => {
      const res = await (handler as unknown as (c: unknown) => Promise<Response>)(ctx);
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.schema).toBe("csoai.retired-endpoint/0.1");
      expect(body.code).toBe("RETIRED");
      expect(body.endpoint).toBe("/api/paddle-webhook");
      expect(body.replaced_by.record).toBe("csoai.completion-record/0.1");
      const text = JSON.stringify(body);
      expect(text).not.toMatch(/certificate_id|sig_ed25519|entitlement"|csoai\.certificate\/0\.1/);
    });
  }
});
