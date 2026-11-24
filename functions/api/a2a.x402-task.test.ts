/**
 * The task half of the x402 A2A transport on POST /api/a2a (lane a2a-x402-task-flow-20261122).
 *
 * x402 `specs/transports-v2/a2a.md` and the a2a-x402 extension (v0.1, v0.2): payment required is
 * a Task in state input-required; the client pays with a Message that names the task and carries
 * its PaymentPayload in metadata; the settlement comes back on the Task. Until this lane the door
 * answered every SendMessage with a Message, so a client built to either spec never saw the
 * challenge. The Task is opt-in (the extension header) and is not stored: its id carries the call.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  A2A_X402_EXTENSION_URIS,
  X402_TASK_ID_MAX,
  a2aPaidCallName,
  a2aX402Extension,
  onRequestGet,
  onRequestPost,
  x402PaymentErrorCode,
  x402PublicTaskInput,
  x402TaskContextId,
  x402TaskId,
  x402TaskSelection,
} from "./a2a";

const ORIGIN = "https://councilof.ai";
const V02 = "https://github.com/google-agentic-commerce/a2a-x402/blob/main/spec/v0.2";
const V01 = "https://github.com/google-a2a/a2a-x402/v0.1";
const PAYLOAD_KEY = "x402.payment.payload";
const STATUS_KEY = "x402.payment.status";

afterEach(() => vi.unstubAllGlobals());

const CHALLENGE = {
  x402Version: 2,
  resource: { url: `${ORIGIN}/api/evidence-bundle?obligation=article-50&bundle=1` },
  accepts: [{ scheme: "exact", network: "eip155:8453", amount: "10000", asset: "0xA0b8", payTo: "0xMERCHANT", maxTimeoutSeconds: 60 }],
};
const REFUSAL = "facilitator rejected receipt: invalid_exact_evm_insufficient_balance";

/** The paid route: 402 with no payment; with one, it delivers, or refuses when told to. */
const stubRoute = (opts: { refuse?: boolean; missing?: boolean } = {}) => {
  const seen: Request[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const req = input instanceof Request ? input : new Request(String(input));
      seen.push(req);
      // A route that is not on this origin: the paid wrapper answers NOT_DEPLOYED, isError false.
      if (opts.missing) return new Response("not found", { status: 404, headers: { "content-type": "text/plain" } });
      if (req.headers.get("x-payment") && !opts.refuse) {
        return new Response(JSON.stringify({ bundle: "assembled" }), {
          status: 200,
          headers: { "content-type": "application/json", "x-payment-response": btoa(JSON.stringify({ success: true, transaction: "0xabc", network: "eip155:8453" })) },
        });
      }
      const body = req.headers.get("x-payment") ? { ...CHALLENGE, csoai: { not_paid_reason: REFUSAL } } : CHALLENGE;
      return new Response(JSON.stringify(body), {
        status: 402,
        headers: { "content-type": "application/json", "PAYMENT-REQUIRED": btoa(JSON.stringify(CHALLENGE)) },
      });
    }),
  );
  return seen;
};

type Sent = { body: any; headers: Headers }; // eslint-disable-line @typescript-eslint/no-explicit-any
const post = async (rpc: unknown, headers: Record<string, string>): Promise<Sent> => {
  const res = await onRequestPost({
    request: new Request(`${ORIGIN}/api/a2a`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(rpc) }),
  } as never);
  return { body: await res.json(), headers: res.headers };
};
/** A v1.0 SendMessage. */
const send = (message: Record<string, unknown>, headers: Record<string, string> = {}) =>
  post({ jsonrpc: "2.0", id: 1, method: "SendMessage", params: { message: { messageId: "m-1", role: "ROLE_USER", ...message } } }, { "a2a-version": "1.0", ...headers });
/** A 0.3 message/send: no A2A-Version header, 0.3 parts. */
const send03 = (message: Record<string, unknown>, headers: Record<string, string> = {}) =>
  post({ jsonrpc: "2.0", id: 1, method: "message/send", params: { message: { kind: "message", messageId: "m-1", role: "user", ...message } } }, headers);

const SELECT = { skill: "evidence_bundle", input: { obligation: "article-50" } };
const PAYMENT = { x402Version: 2, resource: CHALLENGE.resource, accepted: CHALLENGE.accepts[0], payload: { signature: "0xsig", authorization: { from: "0xPAYER" } } };
const routeDecodes = (header: string | null) => JSON.parse(atob(header ?? ""));

describe("activation: only a request that names the a2a-x402 extension gets a Task", () => {
  it("reads X-A2A-Extensions and A2A-Extensions, among other URIs, for every published URI", () => {
    for (const uri of A2A_X402_EXTENSION_URIS) {
      expect(a2aX402Extension(new Headers({ "x-a2a-extensions": uri }))).toBe(uri);
      expect(a2aX402Extension(new Headers({ "a2a-extensions": `https://example.com/other, ${uri}/` }))).toBe(uri);
    }
    expect(a2aX402Extension(new Headers())).toBeNull();
    expect(a2aX402Extension(new Headers({ "x-a2a-extensions": "https://example.com/other" }))).toBeNull();
  });

  it("without the header, the unpaid challenge is the Message it was", async () => {
    stubRoute();
    const { body, headers } = await send({ parts: [{ data: SELECT }] });
    expect(body.result.task).toBeUndefined();
    expect(body.result.message.metadata[STATUS_KEY]).toBe("payment-required");
    expect(headers.get("x-a2a-extensions")).toBeNull();
  });

  it("with the header, a free skill is still answered with a Message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ root: "abc", count: 1 })));
    const { body } = await send({ parts: [{ data: { skill: "get_root", input: {} } }] }, { "x-a2a-extensions": V02 });
    expect(body.result?.task).toBeUndefined();
    expect(body.result?.message ?? body.error).toBeDefined();
  });
});

describe("reversible Task ID privacy boundary: only enumerated public selectors", () => {
  it("keeps the existing public Article 50 task flow", () => {
    expect(x402PublicTaskInput("evidence_bundle", { obligation: "article-50" }, "ctx-issued")).toBe(true);
    expect(x402TaskId("evidence_bundle", { obligation: "article-50" }, "ctx-issued")).toMatch(/^x402-/);
  });

  it("does not embed free-text subjects, raw URLs or encoded documents in task IDs", () => {
    const secret = "SYNTHETIC_PRIVATE_SENTINEL_ONLY";
    expect(x402TaskId("evidence_bundle", { obligation: "article-50", subject: secret })).toBeNull();
    expect(x402TaskId("commission_card", { subject: secret })).toBeNull();
    expect(x402TaskId("art50_marking_evidence", { url: "https://example.invalid/" + secret })).toBeNull();
    expect(x402TaskId("art50_marking_evidence", { bytes_b64: btoa(secret) })).toBeNull();
    expect(x402TaskId("rwa_evidence", { asset: secret })).toBeNull();
    expect(x402TaskId("receipts_batch", { from: "2026-11-21T00:00:00Z" })).toBeNull();
  });

  it("rejects free-text context IDs and unknown selectors, even for the safe paid tool", () => {
    expect(x402TaskId("evidence_bundle", { obligation: "article-50" }, "private context with spaces")).toBeNull();
    expect(x402TaskId("evidence_bundle", { obligation: "article-50" }, "https://example.invalid/user")).toBeNull();
    expect(x402TaskId("evidence_bundle", { obligation: "article-50", extra: "no" })).toBeNull();
    expect(x402TaskId("evidence_bundle", { obligation: "unknown" })).toBeNull();
  });

  it("does not accept a forged base64url task whose decoded inputs would be denied", () => {
    const forged = (v: unknown) => "x402-" + btoa(JSON.stringify(v)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(x402TaskSelection(forged({ t: "evidence_bundle", i: { obligation: "article-50", subject: "PRIVATE" }, c: "ctx-1" }))).toBeNull();
    expect(x402TaskSelection(forged({ t: "art50_marking_evidence", i: { url: "https://example.invalid" }, c: "ctx-1" }))).toBeNull();
    expect(x402TaskSelection(forged({ t: "evidence_bundle", i: { obligation: "article-50" }, c: "context with spaces" }))).toBeNull();
  });

  it("uses the existing unpaid Message path for confidential input instead of issuing a Task ID", async () => {
    const seen = stubRoute();
    const { body } = await send(
      { parts: [{ data: { skill: "evidence_bundle", input: { obligation: "article-50", subject: "SYNTHETIC_PRIVATE_SENTINEL_ONLY" } } }] },
      { "x-a2a-extensions": V02 },
    );
    expect(body.result.task).toBeUndefined();
    expect(body.result.message.metadata[STATUS_KEY]).toBe("payment-required");
    expect(seen).toHaveLength(1);
    expect(seen[0].headers.get("x-payment")).toBeNull();
  });
});

describe("payment required is a Task in state input-required", () => {
  it("carries the challenge in status.message.metadata, charges nothing, and echoes the extension", async () => {
    const seen = stubRoute();
    const { body, headers } = await send({ contextId: "ctx-1", parts: [{ data: SELECT }] }, { "x-a2a-extensions": V02 });
    const task = body.result.task;
    expect(body.result.message).toBeUndefined();
    expect(task.id.startsWith("x402-")).toBe(true);
    expect(task.contextId).toBe("ctx-1");
    expect(task.status.state).toBe("TASK_STATE_INPUT_REQUIRED");
    expect(task.status.message.taskId).toBe(task.id);
    expect(task.status.message.metadata[STATUS_KEY]).toBe("payment-required");
    expect(task.status.message.metadata["x402.payment.required"].accepts).toEqual(CHALLENGE.accepts);
    expect(task.status.message.metadata["x402.payment.receipts"]).toBeUndefined();
    expect(task.status.message.parts[1].data.result.structuredContent.nothing_charged).toBe(true);
    expect(task.artifacts).toBeUndefined();
    expect(headers.get("x-a2a-extensions")).toBe(V02);
    expect(seen).toHaveLength(1);
    expect(seen[0].headers.get("x-payment")).toBeNull();
  });

  it("the id carries the call and nothing else: it decodes to the tool and its input", async () => {
    stubRoute();
    const { body } = await send({ parts: [{ data: SELECT }] }, { "x-a2a-extensions": V02 });
    expect(x402TaskSelection(body.result.task.id)).toEqual({ kind: "TOOL", tool: "evidence_bundle", input: { obligation: "article-50" } });
  });
});

describe("the client pays with a Message that names the Task", () => {
  it("the PaymentPayload reaches the route for the same call, and the Task completes with the receipt", async () => {
    const seen = stubRoute();
    const first = await send({ parts: [{ data: SELECT }] }, { "x-a2a-extensions": V02 });
    const taskId = first.body.result.task.id;
    const { body } = await send(
      { taskId, parts: [{ text: "Here is the payment authorization." }], metadata: { [STATUS_KEY]: "payment-submitted", [PAYLOAD_KEY]: PAYMENT } },
      { "x-a2a-extensions": V02 },
    );
    expect(seen).toHaveLength(2);
    expect(new URL(seen[1].url).pathname).toBe("/api/evidence-bundle");
    expect(new URL(seen[1].url).searchParams.get("obligation")).toBe("article-50");
    expect(routeDecodes(seen[1].headers.get("x-payment"))).toEqual(PAYMENT);
    const task = body.result.task;
    expect(task.id).toBe(taskId);
    expect(task.status.state).toBe("TASK_STATE_COMPLETED");
    expect(task.status.message.metadata[STATUS_KEY]).toBe("payment-completed");
    expect(task.status.message.metadata["x402.payment.receipts"]).toEqual([{ success: true, transaction: "0xabc", network: "eip155:8453" }]);
    expect(task.status.message.parts).toHaveLength(1);
    expect(task.artifacts).toHaveLength(1);
    expect(task.artifacts[0].parts[0].data.result.structuredContent.status).toBe("DELIVERED");
  });

  it("the paying Message needs no extension header: the task id is enough", async () => {
    stubRoute();
    const taskId = x402TaskId("evidence_bundle", { obligation: "article-50" }) as string;
    const { body } = await send({ taskId, parts: [{ text: "pay" }], metadata: { [PAYLOAD_KEY]: PAYMENT } });
    expect(body.result.task.status.state).toBe("TASK_STATE_COMPLETED");
  });

  it("a refused payment fails the Task with the route's reason, a spec error code, and no settlement", async () => {
    stubRoute({ refuse: true });
    const taskId = x402TaskId("evidence_bundle", { obligation: "article-50" }) as string;
    const { body } = await send({ taskId, parts: [{ text: "pay" }], metadata: { [STATUS_KEY]: "payment-submitted", [PAYLOAD_KEY]: PAYMENT } });
    const task = body.result.task;
    expect(task.status.state).toBe("TASK_STATE_FAILED");
    expect(task.status.message.metadata[STATUS_KEY]).toBe("payment-failed");
    expect(task.status.message.metadata["x402.payment.error"]).toBe("INSUFFICIENT_FUNDS");
    expect(task.status.message.metadata["x402.payment.receipts"]).toEqual([{ success: false, errorReason: REFUSAL, transaction: "", network: "eip155:8453" }]);
    expect(task.artifacts).toBeUndefined();
  });

  it("a paying follow-up that reaches a route which is not deployed fails the Task: no verification, no artifact", async () => {
    stubRoute({ missing: true });
    const taskId = x402TaskId("evidence_bundle", { obligation: "article-50" }) as string;
    const { body } = await send({ taskId, parts: [{ text: "pay" }], metadata: { [STATUS_KEY]: "payment-submitted", [PAYLOAD_KEY]: PAYMENT } });
    const task = body.result.task;
    const structured = task.status.message.parts[1].data.result.structuredContent;
    expect(structured.status).toBe("NOT_DEPLOYED");
    expect(task.status.message.parts[1].data.result.isError).toBe(false); // a state, not a fault: so isError cannot decide
    expect(task.status.state).toBe("TASK_STATE_FAILED");
    expect(task.status.message.metadata[STATUS_KEY]).toBe("payment-submitted");
    expect(task.status.message.metadata["x402.payment.receipts"]).toBeUndefined();
    expect(task.artifacts).toBeUndefined();
  });

  it("a follow-up with no payment gets the challenge again, as input-required", async () => {
    const seen = stubRoute();
    const taskId = x402TaskId("evidence_bundle", { obligation: "article-50" }) as string;
    const { body } = await send({ taskId, parts: [{ text: "?" }] });
    expect(body.result.task.status.state).toBe("TASK_STATE_INPUT_REQUIRED");
    expect(seen[0].headers.get("x-payment")).toBeNull();
  });

  it("a client that rejects the terms fails the Task, and nothing is run or charged", async () => {
    const seen = stubRoute();
    const taskId = x402TaskId("evidence_bundle", { obligation: "article-50" }) as string;
    const { body } = await send({ taskId, parts: [{ text: "no" }], metadata: { [STATUS_KEY]: "payment-rejected" } });
    expect(seen).toHaveLength(0);
    expect(body.result.task.status.state).toBe("TASK_STATE_FAILED");
    expect(body.result.task.status.message.metadata[STATUS_KEY]).toBe("payment-rejected");
    // No tool was dispatched, so the reply is not a TOOL_RESULT and writes no paid_call usage row.
    expect(body.result.task.status.message.parts[1].data.kind).toBe("X402_PAYMENT_REJECTED");
    expect(a2aPaidCallName(body)).toBeNull();
  });

  it("a payment that is not an object is refused before any route is called", async () => {
    const seen = stubRoute();
    const taskId = x402TaskId("evidence_bundle", { obligation: "article-50" }) as string;
    const { body } = await send({ taskId, parts: [{ text: "pay" }], metadata: { [PAYLOAD_KEY]: "e30=" } });
    expect(seen).toHaveLength(0);
    expect(body.error.code).toBe(-32602);
  });
});

describe("the Task keeps the context it was issued in", () => {
  it("a follow-up that names only the task answers in the challenge's context", async () => {
    stubRoute();
    const first = await send({ contextId: "ctx-issued", parts: [{ data: SELECT }] }, { "x-a2a-extensions": V02 });
    const taskId = first.body.result.task.id;
    expect(x402TaskContextId(taskId)).toBe("ctx-issued");
    const { body } = await send({ taskId, parts: [{ text: "pay" }], metadata: { [PAYLOAD_KEY]: PAYMENT } });
    expect(body.result.task.contextId).toBe("ctx-issued");
    expect(body.result.task.status.message.contextId).toBe("ctx-issued");
    expect(body.result.task.status.state).toBe("TASK_STATE_COMPLETED");
  });

  it("a challenge with no contextId is issued one, and the follow-up keeps it", async () => {
    stubRoute();
    const first = await send({ parts: [{ data: SELECT }] }, { "x-a2a-extensions": V02 });
    const issued = first.body.result.task.contextId;
    expect(typeof issued).toBe("string");
    const { body } = await send({ taskId: first.body.result.task.id, parts: [{ text: "pay" }], metadata: { [PAYLOAD_KEY]: PAYMENT } });
    expect(body.result.task.contextId).toBe(issued);
  });

  it("a follow-up that names the same context is served; one that names another is refused before any route", async () => {
    const seen = stubRoute();
    const taskId = x402TaskId("evidence_bundle", { obligation: "article-50" }, "ctx-issued") as string;
    const same = await send({ taskId, contextId: "ctx-issued", parts: [{ text: "pay" }], metadata: { [PAYLOAD_KEY]: PAYMENT } });
    expect(same.body.result.task.contextId).toBe("ctx-issued");
    const before = seen.length;
    const other = await send({ taskId, contextId: "ctx-other", parts: [{ text: "pay" }], metadata: { [PAYLOAD_KEY]: PAYMENT } });
    expect(other.body.error.code).toBe(-32602);
    expect(other.body.error.message).toMatch(/does not match the context/);
    expect(seen.length).toBe(before);
    // A rejection is held to the same rule.
    const rejected = await send({ taskId, contextId: "ctx-other", parts: [{ text: "no" }], metadata: { [STATUS_KEY]: "payment-rejected" } });
    expect(rejected.body.error.code).toBe(-32602);
  });

  it("an id whose context is not a string is not one this door issued", async () => {
    const seen = stubRoute();
    const b64 = (v: unknown) => btoa(JSON.stringify(v)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const { body } = await send({ taskId: `x402-${b64({ t: "evidence_bundle", i: { obligation: "article-50" }, c: 7 })}`, parts: [{ text: "pay" }], metadata: { [PAYLOAD_KEY]: PAYMENT } });
    expect(body.error.code).toBe(-32001);
    expect(seen).toHaveLength(0);
  });
});

describe("a 0.3 client, as the a2a-x402 examples write it", () => {
  it("message/send gets a 0.3 Task, pays by taskId, and reads the receipt", async () => {
    const seen = stubRoute();
    const first = await send03({ parts: [{ kind: "data", data: SELECT }] }, { "x-a2a-extensions": V01 });
    const task = first.body.result;
    expect(task.kind).toBe("task");
    expect(task.status.state).toBe("input-required");
    expect(task.status.message.kind).toBe("message");
    expect(task.status.message.role).toBe("agent");
    expect(task.status.message.metadata[STATUS_KEY]).toBe("payment-required");
    expect(task.status.message.metadata["x402.payment.required"].accepts).toEqual(CHALLENGE.accepts);
    expect(first.headers.get("x-a2a-extensions")).toBe(V01);
    expect(first.headers.get("a2a-version")).toBe("0.3");

    const paid = await send03(
      { taskId: task.id, parts: [{ kind: "text", text: "Here is the payment authorization." }], metadata: { [STATUS_KEY]: "payment-submitted", [PAYLOAD_KEY]: PAYMENT } },
      { "x-a2a-extensions": V01 },
    );
    expect(routeDecodes(seen[1].headers.get("x-payment"))).toEqual(PAYMENT);
    expect(paid.body.result.kind).toBe("task");
    expect(paid.body.result.status.state).toBe("completed");
    expect(paid.body.result.status.message.metadata[STATUS_KEY]).toBe("payment-completed");
    expect(paid.body.result.status.message.metadata["x402.payment.receipts"][0].success).toBe(true);
    expect(paid.body.result.artifacts[0].parts[0].kind).toBe("data");
    expect(paid.body.result.artifacts[0].parts[0].data.result.structuredContent.status).toBe("DELIVERED");
  });

  it("a 0.3 Message reply keeps its x402 metadata (it was dropped by the 0.3 mapping)", async () => {
    stubRoute();
    const { body } = await send03({ parts: [{ kind: "data", data: SELECT }] });
    expect(body.result.kind).toBe("message");
    expect(body.result.metadata[STATUS_KEY]).toBe("payment-required");
  });
});

describe("the Task is not stored, and a forged id buys nothing", () => {
  it("an id this door could not have issued is task-not-found, and no route is called", async () => {
    const seen = stubRoute();
    const b64 = (v: unknown) => btoa(JSON.stringify(v)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    for (const taskId of [
      "x402-not-base64!!",
      `x402-${b64({ t: "get_root", i: {} })}`, // a free tool
      `x402-${b64({ t: "no_such_tool", i: {} })}`,
      `x402-${b64({ t: "evidence_bundle", i: { obligation: "article-50", preview: true } })}`,
      `x402-${b64({ t: "evidence_bundle", i: { obligation: "article-50", x_payment: "e30=" } })}`,
      `x402-${b64({ t: "evidence_bundle" })}`,
      `x402-${"A".repeat(X402_TASK_ID_MAX)}`,
    ]) {
      const { body } = await send({ taskId, parts: [{ text: "pay" }], metadata: { [PAYLOAD_KEY]: PAYMENT } });
      expect(body.error.code, taskId.slice(0, 40)).toBe(-32001);
    }
    expect(seen).toHaveLength(0);
  });

  it("a forged Task ID with input outside the public selector policy reaches no route", async () => {
    const seen = stubRoute();
    // The normal constructor must already refuse this invalid obligation.
    expect(x402TaskId("evidence_bundle", { obligation: "not-an-obligation" })).toBeNull();
    // Even a caller that forges the reversible JSON must not dispatch it.
    const encoded = btoa(JSON.stringify({ t: "evidence_bundle", i: { obligation: "not-an-obligation" } }));
    const taskId = "x402-" + encoded.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
    const { body } = await send({ taskId, parts: [{ text: "pay" }], metadata: { [PAYLOAD_KEY]: PAYMENT } });
    expect(seen).toHaveLength(0);
    expect(body.error.code).toBe(-32001);
  });

  it("a taskId that is not an x402 one is left alone: the message is read as before", async () => {
    stubRoute();
    const { body } = await send({ taskId: "some-other-task", parts: [{ data: SELECT }] });
    expect(body.result.message.metadata[STATUS_KEY]).toBe("payment-required");
  });

  it("GetTask does not find an x402 Task, and says why", async () => {
    const taskId = x402TaskId("evidence_bundle", { obligation: "article-50" }) as string;
    const { body } = await post({ jsonrpc: "2.0", id: 1, method: "GetTask", params: { id: taskId } }, { "a2a-version": "1.0" });
    expect(body.error.code).toBe(-32001);
    expect(body.error.message).toMatch(/not stored/);
  });

  it("public Task IDs round-trip; non-ASCII private subjects and oversized selectors are not encoded", async () => {
    const input = { subject: "modèle — 測定" };
    expect(x402TaskId("commission_card", input)).toBeNull();
    expect(x402TaskId("commission_card", { subject: "x".repeat(X402_TASK_ID_MAX) })).toBeNull();
    const safe = x402TaskId("evidence_bundle", { obligation: "article-50" }) as string;
    expect(x402TaskSelection(safe)?.input).toEqual({ obligation: "article-50" });
    expect(x402TaskId("evidence_bundle", { obligation: "article-50", preview: true })).toBeNull();
    expect(x402TaskId("evidence_bundle", { obligation: "article-50", preview: false, x_payment: " " })).toBe(safe);
  });
});

describe("what the door reports about a Task", () => {
  it("maps a refusal reason to the a2a-x402 error codes, and never says on-chain failure for one that was not", () => {
    expect(x402PaymentErrorCode("invalid_exact_evm_insufficient_balance")).toBe("INSUFFICIENT_FUNDS");
    expect(x402PaymentErrorCode("invalid_exact_evm_payload_signature")).toBe("INVALID_SIGNATURE");
    expect(x402PaymentErrorCode("payment expired: validBefore passed")).toBe("EXPIRED_PAYMENT");
    expect(x402PaymentErrorCode("nonce already used")).toBe("DUPLICATE_NONCE");
    expect(x402PaymentErrorCode("x-payment header is not a decodable x402 payload")).toBe("VERIFICATION_FAILED");
  });

  it("the paid_call usage label is read from a Task reply too, in both wire shapes", async () => {
    stubRoute();
    const unpaid = await send({ parts: [{ data: SELECT }] }, { "x-a2a-extensions": V02 });
    expect(a2aPaidCallName(unpaid.body)).toBe("a2a.evidence_bundle.none");
    const paid = await send({ taskId: unpaid.body.result.task.id, parts: [{ text: "pay" }], metadata: { [PAYLOAD_KEY]: PAYMENT } });
    expect(a2aPaidCallName(paid.body)).toBe("a2a.evidence_bundle.meta");
    const paid03 = await send03({ taskId: unpaid.body.result.task.id, parts: [{ kind: "text", text: "pay" }], metadata: { [PAYLOAD_KEY]: PAYMENT } });
    expect(a2aPaidCallName(paid03.body)).toBe("a2a.evidence_bundle.meta");
  });
});

/**
 * The door's own description, read on GET before a client sends anything. Until 24 Nov 2026 it
 * still said "every SendMessage answers with a Message" two days after the Task flow went live.
 * These hold the description to what the door does, by running the door beside it.
 */
describe("GET /api/a2a describes the reply a client will actually get", () => {
  const describeDoor = async () =>
    (await (await onRequestGet({ request: new Request(`${ORIGIN}/api/a2a`) } as never)).json()) as {
      tasks: string;
      methods: Record<string, string>;
      version_rule: string;
      tool_skills: { payment: string };
    };

  it("does not say every reply is a Message, because one is a Task", async () => {
    stubRoute();
    const doc = await describeDoor();
    const { body } = await send({ parts: [{ data: SELECT }] }, { "x-a2a-extensions": V02 });
    expect(body.result.task.status.state).toBe("TASK_STATE_INPUT_REQUIRED"); // what the door does
    for (const text of [doc.tasks, doc.methods.SendMessage]) {
      expect(text).toMatch(/\bTask\b/);
      expect(text).not.toMatch(/every SendMessage answers with a Message/);
    }
    expect(doc.tasks).toMatch(/none stored/);
    expect(doc.tasks).toMatch(/input-required/);
    expect(doc.methods.SendMessage).toContain('message.metadata["x402.payment.payload"]');
    expect(doc.version_rule).not.toMatch(/answered as a 0\.3 Message/);
  });

  it("still says GetTask finds nothing, and the door agrees for both kinds of id", async () => {
    const doc = await describeDoor();
    expect(doc.tasks).toMatch(/GetTask can only ever say TaskNotFound/);
    expect(doc.methods.GetTask).toMatch(/-32001/);
    const get = async (taskId: string) =>
      (await (
        await onRequestPost({
          request: new Request(`${ORIGIN}/api/a2a`, {
            method: "POST",
            headers: { "content-type": "application/json", "a2a-version": "1.0" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "GetTask", params: { id: taskId } }),
          }),
          env: {},
          waitUntil: () => {},
        } as never)
      ).json()) as { error: { code: number; message: string } };
    const plain = await get("some-other-task");
    expect(plain.error.code).toBe(-32001);
    expect(plain.error.message).not.toMatch(/every SendMessage answers with a Message/);
    expect(plain.error.message).toMatch(/not stored/);
    const x402 = await get(x402TaskId("evidence_bundle", { obligation: "article-50" }) as string);
    expect(x402.error.code).toBe(-32001);
  });
});
