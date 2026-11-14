// Actual local handler versus its machine-readable guide. Synthetic payment/KV only.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequestGet } from "./request-attestation";
import { verifyX402Payment } from "./_x402";
import * as cardSign from "../_lib/cardSign";
vi.mock("./_x402", async (load) => ({ ...await load<typeof import("./_x402")>(), verifyX402Payment: vi.fn() }));
const guide = JSON.parse(readFileSync(resolve(__dirname, "../../public/quickstart.json"), "utf8"));
const receive = guide.steps.find((s: { name: string }) => s.name === "receive");
const verifyStep = guide.steps.find((s: { name: string }) => s.name === "verify");
const payment = vi.mocked(verifyX402Payment);
const origin = "https://councilof.ai";
type Outcome = { http_status: number; state: string | null; automatic_payment_retry: boolean; signature_emission?: string };
function declared(status: number, body: Record<string, unknown>) {
  const outcome = receive.outcomes?.find((o: Outcome) => o.http_status === status && (o.state === null ? body.state === undefined : o.state === body.state));
  expect(outcome, `Guide omits actual ${status} / ${String(body.state)}`).toBeDefined();
  expect(outcome.automatic_payment_retry).toBe(false);
  expect(body.execution).toBe("NOT_OBSERVED");
  expect(body.delivery).toBe("NOT_OBSERVED");
  return outcome;
}
function store(failWrite = false) {
  const data = new Map<string, string>();
  return { get: vi.fn(async (key: string) => data.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => { if (failWrite) throw new Error("synthetic KV unavailable"); data.set(key, value); }),
    list: vi.fn(async () => ({ keys: [], list_complete: true })) } as unknown as KVNamespace;
}
async function call(kv: KVNamespace | undefined = store()) {
  const request = new Request(origin + "/api/request-attestation?subject=qwen3:4b&axis=governance", { headers: { "x-payment": "SYNTHETIC-NO-FUNDS" } });
  const env = kv ? { REVENUE_KV: kv } : {};
  const response = await onRequestGet({ request, env } as Parameters<typeof onRequestGet>[0]);
  return { status: response.status, body: await response.json() as Record<string, any> };
}
beforeEach(() => {
  payment.mockResolvedValue({ ok: true, settlement: { transaction: "0x" + "1".repeat(64), network: "eip155:8453", payer: "0x" + "2".repeat(40) } } as Awaited<ReturnType<typeof verifyX402Payment>>);
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ as_of: "2026-09-01T00:00:00Z", cells: [] })));
  vi.spyOn(crypto.subtle, "sign").mockImplementation(async () => { throw new Error("SIGNING_FORBIDDEN_IN_GUIDANCE_TEST"); });
});
afterEach(() => { expect(crypto.subtle.sign).not.toHaveBeenCalled(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe("machine quickstart matches selected actual receipt outcomes", () => {
  it("does not treat an unsigned 200 acknowledgement as delivery", async () => {
    const { status, body } = await call(); expect(status).toBe(200); expect(body.signed).toBe(false);
    expect(declared(status, body).signature_emission).toBe("CONDITIONAL");
  });
  it("describes a post-payment queue write failure without inviting repayment", async () => {
    const { status, body } = await call(store(true)); expect(status).toBe(202);
    expect(body.state).toBe("SETTLED_QUEUE_UNCONFIRMED"); expect(body.retry_payment).toBe(false); declared(status, body);
  });
  it("keeps missing settlement identity unconfirmed", async () => {
    payment.mockResolvedValue({ ok: true, settlement: {} } as Awaited<ReturnType<typeof verifyX402Payment>>);
    const { status, body } = await call(); expect(status).toBe(202); expect(body.payment_settled).toBeNull();
    declared(status, body); expect(receive.missing_settlement_identity).toBe("DO_NOT_INFER_SETTLEMENT");
  });
  it("describes accepted-queue receipt failure without erasing the job", async () => {
    vi.spyOn(cardSign, "signPayload").mockRejectedValue(new Error("synthetic receipt assembly failure"));
    const { status, body } = await call(); expect(status).toBe(202);
    expect(body.state).toBe("QUEUE_ACCEPTED_RECEIPT_UNAVAILABLE"); expect(body.enqueued).toBe(true);
    expect(body.retry_payment).toBe(false); declared(status, body);
  });
  it("preserves queue id on a repeated already-recorded synthetic settlement", async () => {
    const kv = store(); const first = await call(kv); const second = await call(kv);
    expect(second.body.queue_ack.reused).toBe(true);
    expect(second.body.queue_ack.commission_id).toBe(first.body.queue_ack.commission_id);
    declared(second.status, second.body);
    expect(receive.retry_policy.distinguish_reread_from_repayment).toBe(true);
  });
});
describe("guide scope and receipt handling", () => {
  it("labels source-described outcomes rather than observed live success", () => {
    expect(receive.observed).toBe(false); expect(receive.source).toBe("functions/api/request-attestation.ts");
    expect(receive.response_scope).toBe("SELECTED_SOURCE_OUTCOMES_NOT_EXHAUSTIVE");
  });
  it("retains the six existing steps and schema without inventing an amount", () => {
    expect(guide.schema).toBe("csoai.agent-quickstart/0.1");
    expect(guide.steps.map((s: { name: string }) => s.name)).toEqual(["discover", "request", "402", "settle", "receive", "verify"]);
    expect(JSON.stringify(guide)).not.toMatch(/"amount"\s*:\s*"\d/);
  });
  it("preserves raw response and stops on an unrecognised or lost outcome", () => {
    expect(receive.retry_policy).toMatchObject({ automatic_repayment: false, preserve_raw_response: true, unrecognised_outcome: "RECONCILE_BEFORE_ANOTHER_PAYMENT" });
    expect(receive.inferences_not_established).toEqual(expect.arrayContaining(["execution", "delivery", "root_inclusion", "independently_verified_settlement"]));
  });
  it("does not promise signatures without a configured signer", () => {
    expect(guide.one_line).not.toContain("receive a signed card");
    expect(guide.steps[2].offer_signatures).toBe("CONDITIONAL_ON_CONFIGURED_SIGNER_AND_ACCEPTED_REQUIREMENTS");
    expect(receive.expect).toContain("202");
  });
  it("distinguishes the actual offline verifier exit contracts", () => {
    const card = verifyStep.checkers?.find((v: { id: string }) => v.id === "card-v0-payload");
    const set = verifyStep.checkers?.find((v: { id: string }) => v.id === "gspc-card-set");
    expect(card?.exit_codes).toEqual({ "0": "VALID_PAYLOAD_UNDER_SUPPLIED_KEY", "1": "INVALID", "2": "UNCHECKABLE" });
    expect(set?.exit_codes["3"]).toBe("VALID_CARDS_INCOMPLETE_OR_INCONSISTENT_SET");
    expect(verifyStep.non_receipt_response).toBe("DO_NOT_TREAT_AS_A_CARD_OR_PROOF_OF_NONPAYMENT");
  });
  it("keeps the source echo header separate from a universal protocol declaration", () => {
    expect(receive.settlement_header).toMatchObject({ name: "x-payment-response", basis: "CURRENT_HANDLER_SOURCE", universal_x402_header: false });
  });
});

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
it.each(["SETTLED_QUEUE_UNCONFIRMED", "QUEUE_ACCEPTED_RECEIPT_UNAVAILABLE"])("actual payload CLI does not misclassify nonreceipt %s", (state) => {
  const dir = mkdtempSync(join(tmpdir(), "csoai-guide-nonreceipt-"));
  try {
    const response = join(dir, "response.json");
    writeFileSync(response, JSON.stringify({ state, retry_payment: false, execution: "NOT_OBSERVED", delivery: "NOT_OBSERVED" }));
    const result = spawnSync(process.execPath, [resolve(__dirname, "../../public/verifier/card-v0-verify.mjs"), response, resolve(__dirname, "../../public/.well-known/did.json")], { encoding: "utf8", timeout: 10000 });
    expect(result.error).toBeUndefined(); expect(result.status).toBe(2);
    expect(result.stdout).toMatch(/^UNCHECKABLE\s+no payload object/);
    expect(result.stdout).not.toMatch(/^INVALID|payment failed|not paid/i);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
