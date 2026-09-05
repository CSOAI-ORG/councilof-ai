import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { A2A_ERROR, A2A_PROTOCOL_VERSION, onRequestGet, onRequestPost } from "./a2a";

const LID =
  "22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate.";

// A board fixture shaped like the live /api/gspc: one withheld leader, one shown leader.
const BOARD = {
  totals: { lid: LID, public_count: "22 axis · 22 measured" },
  axes: [
    {
      axis: "governance",
      family: "gspc",
      kind: "model-comparison",
      status: "MEASURED",
      n: 237,
      separation: "UNTESTED",
      public_leader_state: "EXCLUDED_OWN_MODEL",
    },
    {
      axis: "swarm",
      family: "gspc",
      kind: "model-comparison",
      status: "MEASURED",
      n: 37,
      separation: "SEPARATED",
      leader: "qwen2.5:7b (base model)",
    },
  ],
};

const stubBoard = (ok = true) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => (ok ? Response.json(BOARD) : new Response("down", { status: 503 }))),
  );

afterEach(() => vi.unstubAllGlobals());

const rpc = async (body: unknown, headers: Record<string, string> = {}) => {
  const request = new Request("https://councilof.ai/api/a2a", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const res = await onRequestPost({ request } as never);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { status: res.status, headers: res.headers, json: (await res.json()) as any };
};

const send = (extra: Record<string, unknown> = {}, headers: Record<string, string> = {}) =>
  rpc(
    {
      jsonrpc: "2.0",
      id: 1,
      method: "SendMessage",
      params: {
        message: { messageId: "m-1", role: "ROLE_USER", parts: [{ text: "board" }] },
        ...extra,
      },
    },
    headers,
  );

describe("POST /api/a2a — SendMessage", () => {
  it("answers with a Message whose text carries totals.lid verbatim and whose data is derived", async () => {
    stubBoard();
    const { status, headers, json } = await send();
    expect(status).toBe(200);
    expect(headers.get("a2a-version")).toBe(A2A_PROTOCOL_VERSION);
    expect(json.id).toBe(1);
    expect(json.error).toBeUndefined();
    const msg = json.result.message;
    expect(msg.role).toBe("ROLE_AGENT");
    expect(typeof msg.messageId).toBe("string");
    expect(msg.parts[0].text).toContain(`Lid: ${LID}`);
    const data = msg.parts[1].data;
    expect(data.state).toBe("DERIVED");
    expect(data.lid).toBe(LID);
    expect(data.axes).toHaveLength(2);
    expect(data.source).toBe("https://councilof.ai/api/gspc");
    expect(data.as_of).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("never invents a leader: a withheld leader stays a state, a shown one is passed through", async () => {
    stubBoard();
    const { json } = await send();
    const [gov, swarm] = json.result.message.parts[1].data.axes;
    expect(gov.leader).toBeNull();
    expect(gov.public_leader_state).toBe("EXCLUDED_OWN_MODEL");
    expect(swarm.leader).toBe("qwen2.5:7b (base model)");
  });

  it("keeps the caller's contextId", async () => {
    stubBoard();
    const { json } = await rpc({
      jsonrpc: "2.0",
      id: "abc",
      method: "SendMessage",
      params: { message: { messageId: "m-2", contextId: "ctx-9", role: "ROLE_USER", parts: [] } },
    });
    expect(json.id).toBe("abc");
    expect(json.result.message.contextId).toBe("ctx-9");
  });

  it("is UNCHECKABLE with no lid when /api/gspc does not answer", async () => {
    stubBoard(false);
    const { json } = await send();
    const msg = json.result.message;
    expect(msg.parts[0].text).toMatch(/^UNCHECKABLE/);
    expect(msg.parts[1].data.state).toBe("UNCHECKABLE");
    expect(msg.parts[1].data.lid).toBeUndefined();
    expect(msg.parts[1].data.axes).toBeUndefined();
  });

  it("rejects a missing message and a tenant this interface never declared", async () => {
    stubBoard();
    const noMessage = await rpc({ jsonrpc: "2.0", id: 1, method: "SendMessage", params: {} });
    expect(noMessage.json.error.code).toBe(A2A_ERROR.INVALID_PARAMS);
    const tenant = await send({ tenant: "acme" });
    expect(tenant.json.error.code).toBe(A2A_ERROR.INVALID_PARAMS);
  });
});

describe("POST /api/a2a — versions and the rest of the method table", () => {
  it("names the fix for 0.3 method names and refuses other A2A-Version values", async () => {
    stubBoard();
    const legacy = await rpc({ jsonrpc: "2.0", id: 1, method: "message/send", params: {} });
    expect(legacy.json.error.code).toBe(A2A_ERROR.VERSION_NOT_SUPPORTED);
    expect(legacy.json.error.message).toContain("SendMessage");
    const v03 = await send({}, { "a2a-version": "0.3" });
    expect(v03.json.error.code).toBe(A2A_ERROR.VERSION_NOT_SUPPORTED);
    const v10 = await send({}, { "a2a-version": "1.0" });
    expect(v10.json.error).toBeUndefined();
  });

  it.each([
    ["GetTask", A2A_ERROR.TASK_NOT_FOUND],
    ["CancelTask", A2A_ERROR.TASK_NOT_FOUND],
    ["ListTasks", A2A_ERROR.UNSUPPORTED_OPERATION],
    ["SendStreamingMessage", A2A_ERROR.UNSUPPORTED_OPERATION],
    ["SubscribeToTask", A2A_ERROR.UNSUPPORTED_OPERATION],
    ["GetExtendedAgentCard", A2A_ERROR.UNSUPPORTED_OPERATION],
    ["CreateTaskPushNotificationConfig", A2A_ERROR.PUSH_NOTIFICATION_NOT_SUPPORTED],
    ["Frobnicate", A2A_ERROR.METHOD_NOT_FOUND],
  ])("%s -> %i with an ErrorInfo detail", async (method, code) => {
    const { json } = await rpc({ jsonrpc: "2.0", id: 7, method, params: { id: "t-1" } });
    expect(json.error.code).toBe(code);
    expect(json.error.data[0]["@type"]).toBe("type.googleapis.com/google.rpc.ErrorInfo");
    expect(json.error.data[0].domain).toBe("a2a-protocol.org");
  });

  it("returns -32700 for non-JSON and -32600 for batches and shapeless requests", async () => {
    expect((await rpc("{not json")).json.error.code).toBe(A2A_ERROR.PARSE);
    expect((await rpc([{ jsonrpc: "2.0", id: 1, method: "SendMessage" }])).json.error.code).toBe(
      A2A_ERROR.INVALID_REQUEST,
    );
    expect((await rpc({ id: 1, method: "SendMessage" })).json.error.code).toBe(A2A_ERROR.INVALID_REQUEST);
  });
});

describe("GET /api/a2a and the card that points here", () => {
  it("publishes the method table and the version rule", async () => {
    const res = await onRequestGet({ request: new Request("https://councilof.ai/api/a2a") } as never);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.protocolVersion).toBe(A2A_PROTOCOL_VERSION);
    expect(json.agent_card).toBe("https://councilof.ai/.well-known/agent-card.json");
    expect(Object.keys(json.methods as object)).toContain("SendMessage");
  });

  it("the card's first supportedInterface is this door at protocolVersion 1.0, with no 0.3 fields left", () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const cardPath = path.resolve(here, "../../public/.well-known/agent-card.json");
    const card = JSON.parse(readFileSync(cardPath, "utf8"));
    expect(card.supportedInterfaces[0]).toEqual({
      url: "https://councilof.ai/api/a2a",
      protocolBinding: "JSONRPC",
      protocolVersion: A2A_PROTOCOL_VERSION,
    });
    // 0.3 carried these at the top level; 1.0 moved them into supportedInterfaces.
    expect(card.protocolVersion).toBeUndefined();
    expect(card.url).toBeUndefined();
    expect(card.capabilities.streaming).toBe(false);
    expect(card.capabilities.extendedAgentCard).toBe(false);
    // The alias path must serve the same bytes.
    const alias = readFileSync(path.resolve(here, "../../public/.well-known/agent.json"));
    expect(alias.equals(readFileSync(cardPath))).toBe(true);
  });
});
