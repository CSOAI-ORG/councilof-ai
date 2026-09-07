import assert from "node:assert/strict";
import test from "node:test";
import { onRequestGet, PAID_ROUTE, PAID_TOOL, sellerBody } from "./x402-trust-seller.ts";

test("paid step is the shipped commission_card door", async () => {
  const res = await (onRequestGet as (c: unknown) => Promise<Response>)({
    request: new Request("https://councilof.ai/api/x402-trust-seller?host=example.com"),
    env: {},
  });
  assert.equal(res.status, 200);
  const b = await res.json() as Record<string, unknown>;
  assert.equal(b.sold_as, PAID_TOOL);
  assert.equal(b.sold_as, "commission_card");
  assert.equal(b.paid_step, `https://councilof.ai${PAID_ROUTE}?subject=example.com`);
  assert.equal(b.risk_verdict, "UNMEASURED");
});

test("bad host is 400", async () => {
  const res = await (onRequestGet as (c: unknown) => Promise<Response>)({
    request: new Request("https://councilof.ai/api/x402-trust-seller?host=http://evil.example/x"),
    env: {},
  });
  assert.equal(res.status, 400);
});

test("sellerBody keeps host names off the aggregate URL", () => {
  const b = sellerBody("https://councilof.ai", "vaults.fyi");
  assert.equal(b.host, "vaults.fyi");
  assert.equal(b.counts_aggregate, "https://councilof.ai/interop/x402-trust/latest.json");
  assert.equal(String(b.counts_aggregate).includes("vaults"), false);
});
