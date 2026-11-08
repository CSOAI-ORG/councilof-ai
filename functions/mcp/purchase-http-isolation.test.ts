import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { onRequest } from "./[[path]]";
import { issueToken, userKey } from "../api/_authCrypto";
import { purchaseOwnerPrefix, purchaseTxKey, checkBuyerPayment, finishBuyerPayment, type BuyerEnv, type PurchaseRecord } from "../api/_buyer_purchase";
import { onRequest as purchasesRequest } from "../api/purchases/[[path]]";
import { buildDeliveryRecord, deliveryTxKey, retainedOutputTxKey, RETAINED_OUTPUT_SCHEMA, recordPaidResponse } from "../api/_x402_delivery_record";
import { buyerNonce, buyerOwnerHash, purchaseSha256 } from "../../shared/buyerPurchase";
import PAID from "./paid-tools.json";

const ORIGIN = "https://councilof.ai";
const PROTOCOL = "2026-07-28";
const VERSION = "io.modelcontextprotocol/protocolVersion";
function store() {
  const values = new Map<string, string>();
  return { values, get: vi.fn(async (key: string) => values.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => { values.set(key, value); }),
    list: vi.fn(async ({ prefix, limit }: { prefix: string; limit: number; cursor?: string }) =>
      ({ keys: [...values.keys()].filter(k => k.startsWith(prefix)).sort().slice(0, limit).map(name => ({ name })), list_complete: true })) };
}
let accounts: ReturnType<typeof store>, records: ReturnType<typeof store>, env: BuyerEnv;
let tokenA: string, tokenB: string, ownerA: string, ownerB: string, echoA: string;
const network = vi.fn<typeof fetch>();
const generationA = "a".repeat(64), generationB = "b".repeat(64);
const original = new Uint8Array([0, 255, 1, 128, 42]);
const payer = "0x" + "1".repeat(40);
function encoded(value: unknown) { return btoa(JSON.stringify(value)); }
async function seed(subject: string, generation: string, transaction: string) {
  accounts.values.set(userKey(subject), JSON.stringify({ email: subject, name: "Synthetic buyer",
    salt: "fixture-only-salt", pw: "c".repeat(64), created_at: "2026-11-01T00:00:00Z", account_generation: generation }));
  const token = await issueToken(env, { email: subject, name: "Synthetic buyer", account_generation: generation });
  if (!token) throw new Error("synthetic auth fixture unavailable");
  const owner = await buyerOwnerHash(subject, generation), resource = ORIGIN + "/api/proof?bundle=1";
  const request = { url: resource, resource, method: "GET", body_sha256: await purchaseSha256(new Uint8Array()) };
  const nonce = await buyerNonce(owner, request, "d".repeat(64));
  const payment = encoded({ success: true, transaction, payer, network: "base" });
  const row: PurchaseRecord = { schema: "csoai.owned-purchase/1", owner_hash: owner, transaction, payer,
    resource, request, nonce, created_at: "2026-11-07T00:00:00Z", payment_response: payment };
  records.values.set(await purchaseTxKey(transaction), JSON.stringify(row));
  records.values.set(purchaseOwnerPrefix(owner) + await purchaseSha256(new TextEncoder().encode(transaction)), JSON.stringify(row));
  const metadata = buildDeliveryRecord({ transaction, resource, response_sha256: await purchaseSha256(original),
    response_bytes: original.byteLength, content_type: "application/octet-stream", delivered_at: "2026-11-07T00:00:00Z" });
  records.values.set(deliveryTxKey(transaction), JSON.stringify(metadata));
  records.values.set(retainedOutputTxKey(transaction), JSON.stringify({ ...metadata, schema: RETAINED_OUTPUT_SCHEMA,
    status: 200, status_text: "OK", headers: [["content-type", metadata.content_type], ["x-payment-response", payment]],
    body_base64: btoa(String.fromCharCode(...original)), buyer_binding: { schema: "csoai.owned-output-binding/1",
      owner_hash: owner, nonce, request } }));
  return { token, owner, payment };
}
beforeEach(async () => {
  vi.stubGlobal("crypto", webcrypto);
  network.mockReset().mockRejectedValue(new Error("No external network permitted by this synthetic transport fixture"));
  vi.stubGlobal("fetch", network);
  accounts = store(); records = store();
  // Ephemeral synthetic AUTH key only. It is never printed, persisted, or used for a payment/receipt.
  const key = await webcrypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const bytes = new Uint8Array(await webcrypto.subtle.exportKey("pkcs8", key.privateKey));
  env = { ASSESS_SIGNING_KEY_PKCS8_B64: btoa(String.fromCharCode(...bytes)), SOV_ARENA_STATE: accounts, REVENUE_KV: records };
  const a = await seed("buyer-a@example.test", generationA, "synthetic-tx-a");
  const b = await seed("buyer-b@example.test", generationB, "synthetic-tx-b");
  tokenA = a.token; tokenB = b.token; ownerA = a.owner; ownerB = b.owner; echoA = a.payment;
});
afterEach(() => vi.unstubAllGlobals());

async function send(args: Record<string, unknown>, token?: string, door = "/mcp", name = "commission_card") {
  const headers = new Headers({ "content-type": "application/json", accept: "application/json",
    "MCP-Protocol-Version": PROTOCOL, "Mcp-Method": "tools/call", "Mcp-Name": name });
  if (token) headers.set("authorization", "Bearer " + token);
  const response = await onRequest({ request: new Request(ORIGIN + door, { method: "POST", headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: "synthetic-call", method: "tools/call",
      params: { name, arguments: args, _meta: { [VERSION]: PROTOCOL, "io.modelcontextprotocol/clientCapabilities": {} } } }) }),
    env, waitUntil: () => {} });
  expect(response.headers.get("cache-control")).toContain("no-store");
  const message = await response.json();
  return { response, message, content: message.result?.structuredContent };
}

describe("actual HTTP mount and SDK paid caller isolation", () => {
  it("passes transport Bearer and request env through every existing paid tool's SDK callback", async () => {
    for (const { name } of PAID.tools) {
      const { content } = await send({ purchase_action: "history" }, tokenA, "/mcp", name);
      expect(content).toMatchObject({ status: "PURCHASE_HISTORY", payment_presented: false, no_new_payment_or_provider_call: true });
      expect(content.purchase.rows.map((r: { transaction: string }) => r.transaction)).toEqual(["synthetic-tx-a"]);
    }
    expect(records.list.mock.calls.every(([options]) => options.prefix === purchaseOwnerPrefix(ownerA))).toBe(true);
    expect(records.put).not.toHaveBeenCalled(); expect(network).not.toHaveBeenCalled();
  });
  it("recovers exact original bytes and stored echo through the real SDK without regeneration or acceptance", async () => {
    const { content } = await send({ purchase_action: "recover", purchase_transaction: "synthetic-tx-a" }, tokenA);
    expect(content).toMatchObject({ status: "ORIGINAL_RECOVERED", acceptance_inferred: false, settlement_state: "NOT_REQUESTED" });
    expect(content.purchase.result.body_base64).toBe(btoa(String.fromCharCode(...original)));
    expect(content.purchase.receipt.payment_response).toBe(echoA);
    expect(content.purchase.decisions.rows).toEqual([]);
    expect(records.put).not.toHaveBeenCalled(); expect(network).not.toHaveBeenCalled();
  });
  it("refuses both another owner and an anonymous request for the same original", async () => {
    for (const token of [tokenB, undefined]) {
      const { content } = await send({ purchase_action: "recover", purchase_transaction: "synthetic-tx-a" }, token);
      expect(content).toMatchObject({ status: "PURCHASE_UNAVAILABLE", acceptance_inferred: false });
      expect(JSON.stringify(content)).not.toContain(echoA);
      expect(content.purchase.result).toBeUndefined();
    }
    expect(records.put).not.toHaveBeenCalled(); expect(network).not.toHaveBeenCalled();
  });
  it("rejects a previously valid token after the account lifecycle changes", async () => {
    const key = userKey("buyer-a@example.test"), account = JSON.parse(accounts.values.get(key)!);
    accounts.values.set(key, JSON.stringify({ ...account, account_generation: "e".repeat(64) }));
    const { content } = await send({ purchase_action: "history" }, tokenA);
    expect(content).toMatchObject({ status: "PURCHASE_UNAVAILABLE", http_status: 401 });
    expect(records.list).not.toHaveBeenCalled(); expect(network).not.toHaveBeenCalled();
  });
  it("keeps two simultaneous callers and a later anonymous call isolated", async () => {
    const [a, b] = await Promise.all([send({ purchase_action: "history" }, tokenA), send({ purchase_action: "history" }, tokenB)]);
    expect(a.content.purchase.rows.map((r: { transaction: string }) => r.transaction)).toEqual(["synthetic-tx-a"]);
    expect(b.content.purchase.rows.map((r: { transaction: string }) => r.transaction)).toEqual(["synthetic-tx-b"]);
    expect(ownerA).not.toBe(ownerB);
    const anon = await send({ purchase_action: "history" });
    expect(anon.content).toMatchObject({ status: "PURCHASE_UNAVAILABLE", http_status: 401 });
    expect(records.put).not.toHaveBeenCalled(); expect(network).not.toHaveBeenCalled();
  });
  it("never gives the free door a paid handler or caller store context", async () => {
    const { message } = await send({ purchase_action: "recover", purchase_transaction: "synthetic-tx-a" }, tokenA, "/mcp/free");
    expect(JSON.stringify(message)).not.toContain(echoA);
    expect(message.error || message.result?.isError).toBeTruthy();
    expect(accounts.get).not.toHaveBeenCalled(); expect(records.get).not.toHaveBeenCalled();
    expect(records.list).not.toHaveBeenCalled(); expect(records.put).not.toHaveBeenCalled(); expect(network).not.toHaveBeenCalled();
  });
  it("does not accept an authorization field inside tool arguments as a caller session", async () => {
    const { message, content } = await send({ purchase_action: "history", authorization: "Bearer " + tokenA });
    expect(content?.status === "PURCHASE_UNAVAILABLE" || !!message.error || !!message.result?.isError).toBe(true);
    expect(records.list).not.toHaveBeenCalled(); expect(network).not.toHaveBeenCalled();
  });
  it("binds the actual unpaid MCP request to the supported authenticated HTTP prepare step", async () => {
    network.mockImplementation(async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);
      expect(new URL(request.url).origin).toBe(ORIGIN);
      expect(new URL(request.url).pathname).toBe("/api/request-attestation");
      expect(request.headers.has("x-payment")).toBe(false);
      return Response.json({ x402Version: 1, resource: request.url, accepts: [{ scheme: "exact", network: "base", resource: request.url }] }, { status: 402 });
    });
    const challenge = await send({ subject: "synthetic-subject" }, tokenA);
    expect(challenge.content).toMatchObject({ status: "PAYMENT_REQUIRED", settlement_state: "NOT_REQUESTED" });
    const identity = challenge.content.purchase_request;
    const response = await purchasesRequest({ env, request: new Request(ORIGIN + "/api/purchases/prepare", {
      method: "POST", headers: { authorization: "Bearer " + tokenA, "content-type": "application/json" }, body: JSON.stringify(identity) }) });
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toContain("no-store");
    const preparation = await response.json();
    expect(preparation.request).toEqual(identity); expect(preparation.owner_hash).toBe(ownerA);
    expect(preparation.nonce).toBe(await buyerNonce(ownerA, identity, preparation.seed));
    expect(network).toHaveBeenCalledOnce(); expect(records.put).not.toHaveBeenCalled();
  });
  it("refuses payment on private actions before stores or any network operation", async () => {
    const { content } = await send({ purchase_action: "recover", purchase_transaction: "synthetic-tx-a",
      x_payment: "synthetic-authorization-must-not-forward" }, tokenA);
    expect(content).toMatchObject({ status: "BAD_ARGUMENTS" });
    expect(accounts.get).not.toHaveBeenCalled(); expect(records.get).not.toHaveBeenCalled();
    expect(records.put).not.toHaveBeenCalled(); expect(network).not.toHaveBeenCalled();
  });
  it("permits an Authorization preflight only under the existing allowed-origin contract", async () => {
    const response = await onRequest({ env, request: new Request(ORIGIN + "/mcp", { method: "OPTIONS",
      headers: { Origin: "https://chatgpt.com", "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type,mcp-protocol-version" } }) });
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-headers")?.toLowerCase().split(",").map(x => x.trim())).toContain("authorization");
    expect(response.headers.has("access-control-allow-credentials")).toBe(false);
    expect(records.get).not.toHaveBeenCalled(); expect(network).not.toHaveBeenCalled();
  });
  it("still refuses an unapproved browser origin at authenticated preflight", async () => {
    const response = await onRequest({ env, request: new Request(ORIGIN + "/mcp", { method: "OPTIONS",
      headers: { Origin: "https://unapproved.example.test", "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type" } }) });
    expect(response.status).toBe(403);
    expect(accounts.get).not.toHaveBeenCalled(); expect(records.get).not.toHaveBeenCalled(); expect(network).not.toHaveBeenCalled();
  });
  it("completes exact-request prepare, one mock payment, fresh original recovery and explicit decisions with unknown-write reconciliation", async () => {
    const tx = "synthetic-sequence-transaction";
    let mockPayments = 0;
    network.mockImplementation(async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);
      expect(new URL(request.url).origin).toBe(ORIGIN);
      expect(new URL(request.url).pathname).toBe("/api/request-attestation");
      const payment = request.headers.get("x-payment");
      if (!payment) return Response.json({ x402Version: 1, resource: request.url,
        accepts: [{ scheme: "exact", network: "base", resource: request.url }] }, { status: 402 });
      const envelope = JSON.parse(atob(payment));
      expect(JSON.stringify(envelope)).not.toContain(tokenA);
      const checked = await checkBuyerPayment(request, env, request.url, envelope);
      if (checked.ok === false) throw new Error(checked.reason);
      if (!checked.buyer) throw new Error("mock payment must remain lifecycle/request-bound");
      mockPayments++; // mock financial result only; no wallet signature, facilitator or provider call
      const echo = encoded({ success: true, transaction: tx, payer, network: "base" });
      const finished = await finishBuyerPayment(records, checked.buyer, tx, payer, request.url, echo);
      expect(finished.state).toBe("RECORDED");
      return recordPaidResponse(new Response(original, { headers: { "content-type": "application/octet-stream" } }),
        { kv: records, transaction: tx, resource: request.url, confirmedPaid: true, successfulOutput: true,
          paymentResponse: echo, buyer: finished.buyer, buyerState: finished.state });
    });
    const args = { subject: "synthetic-sequence-subject" };
    const challenge = await send(args, tokenA);
    expect(challenge.content.status).toBe("PAYMENT_REQUIRED");
    const prepResponse = await purchasesRequest({ env, request: new Request(ORIGIN + "/api/purchases/prepare", {
      method: "POST", headers: { authorization: "Bearer " + tokenA, "content-type": "application/json" },
      body: JSON.stringify(challenge.content.purchase_request) }) });
    expect(prepResponse.status).toBe(200);
    const preparation = await prepResponse.json();
    expect(preparation.request).toEqual(challenge.content.purchase_request);
    expect(preparation.nonce).toBe(await buyerNonce(ownerA, preparation.request, preparation.seed));
    const payment = encoded({ x402Version: 1, scheme: "exact", network: "base",
      payload: { signature: "synthetic-financial-signature-not-a-real-authorization",
        authorization: { from: payer, to: "0x" + "2".repeat(40), value: "10000",
          validAfter: "0", validBefore: "9999999999", nonce: preparation.nonce } },
      csoaiPurchase: { version: 1, seed: preparation.seed } });
    const delivery = await send({ ...args, x_payment: payment }, tokenA);
    expect(delivery.content).toMatchObject({ status: "DELIVERED", settlement_state: "REPORTED_BY_ROUTE" });
    expect(mockPayments).toBe(1);
    const history = await send({ purchase_action: "history" }, tokenA);
    expect(history.content.purchase.rows.some((r: { transaction: string }) => r.transaction === tx)).toBe(true);
    const recovered = await send({ purchase_action: "recover", purchase_transaction: tx }, tokenA);
    const saved = recovered.content.purchase;
    expect(saved.result.body_base64).toBe(btoa(String.fromCharCode(...original)));
    expect(saved.result.sha256).toBe(await purchaseSha256(original));
    expect(saved.decisions.rows).toEqual([]); expect(saved.acceptance_inferred).toBe(false);
    const decision = { purchase_transaction: tx, purchase_result_sha256: saved.result.sha256,
      purchase_result_version: saved.result.version };
    const accepted = await send({ ...decision, purchase_action: "accept", purchase_request_id: "f".repeat(64) }, tokenA);
    expect(accepted.content).toMatchObject({ status: "BUYER_DECISION_RECORDED",
      purchase: { decision: { action: "accept" }, acceptance_inferred: false } });
    let unknownDecisionPuts = 0;
    const unknownId = "e".repeat(64);
    records.put.mockImplementation(async (key, value) => {
      records.values.set(key, value);
      if (key.startsWith("private:purchase-decision:v1:") && key.endsWith(unknownId)) {
        unknownDecisionPuts++;
        await new Promise<void>(() => {}); // one invoked write is present but its completion is unobserved
      }
    });
    const uncertain = await send({ ...decision, purchase_action: "request_correction",
      purchase_request_id: unknownId, purchase_reason: "Synthetic explicit correction request" }, tokenA);
    expect(uncertain.content).toMatchObject({ status: "PURCHASE_UNAVAILABLE", purchase: { state: "UNKNOWN", request_id: unknownId } });
    const reconciled = await send({ purchase_action: "decisions", purchase_transaction: tx, purchase_request_id: unknownId }, tokenA);
    expect(reconciled.content.purchase.rows).toHaveLength(1);
    expect(reconciled.content.purchase.rows[0]).toMatchObject({ request_id: unknownId, action: "request_correction" });
    const reopened = await send({ purchase_action: "recover", purchase_transaction: tx }, tokenA);
    expect(reopened.content.purchase.result).toEqual(saved.result);
    expect(reopened.content.purchase.receipt).toEqual(saved.receipt);
    expect(unknownDecisionPuts).toBe(1); expect(mockPayments).toBe(1);
    expect(network).toHaveBeenCalledTimes(2); // one unpaid challenge, one explicitly presented mock payment
  });

});
