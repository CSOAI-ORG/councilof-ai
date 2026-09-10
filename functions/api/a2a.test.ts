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
        message: {
          messageId: "m-1",
          role: "ROLE_USER",
          parts: [{ data: { skill: "gspc-board", input: {} }, mediaType: "application/json" }],
        },
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
      params: {
        message: {
          messageId: "m-2",
          contextId: "ctx-9",
          role: "ROLE_USER",
          parts: [{ data: { skill: "gspc-board", input: {} } }],
        },
      },
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

  it("preserves only the exact legacy text `board` compatibility request", async () => {
    stubBoard();
    const legacy = await rpc({
      jsonrpc: "2.0",
      id: 1,
      method: "SendMessage",
      params: { message: { messageId: "m-legacy", role: "ROLE_USER", parts: [{ text: "board" }] } },
    });
    expect(legacy.json.result.message.parts[1].data.skill).toBe("gspc-board");
    const ambiguous = await rpc({
      jsonrpc: "2.0",
      id: 2,
      method: "SendMessage",
      params: { message: { messageId: "m-other", role: "ROLE_USER", parts: [{ text: "please assess this" }] } },
    });
    expect(ambiguous.json.error.code).toBe(A2A_ERROR.INVALID_PARAMS);
    expect(ambiguous.json.error.data[0].reason).toBe("INVALID_SKILL_SELECTOR");
  });
});

describe("POST /api/a2a — seven explicit skill routes", () => {
  const callSkill = (skill: string, input: Record<string, unknown>) => rpc({
    jsonrpc: "2.0",
    id: `id-${skill}`,
    method: "SendMessage",
    params: {
      message: {
        messageId: `m-${skill}`,
        role: "ROLE_USER",
        parts: [{ data: { skill, input }, mediaType: "application/json" }],
      },
    },
  });

  it.each([
    ["east-west-crosswalk", {}, "/api/cross", "GET", undefined],
    ["benchmark-quality-register", {}, "/api/benchmark-quality", "GET", undefined],
    ["x402-discovery", {}, "/api/x402", "GET", undefined],
    ["article50-detect", { manifest: { claim: { generator: "fixture" } } }, "/api/detect", "POST", { manifest: { claim: { generator: "fixture" } } }],
    ["eu-ai-act-screen", { system: "Hiring assistant for employment screening" }, "/api/assess", "POST", { system: "Hiring assistant for employment screening" }],
  ])("routes %s to its fixed same-origin handler", async (skill, input, path, method, expectedBody) => {
    const fetchMock = vi.fn(async () => Response.json({ from: path }));
    vi.stubGlobal("fetch", fetchMock);
    const { json } = await callSkill(skill as string, input as Record<string, unknown>);
    expect(json.error).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://councilof.ai${path}`);
    expect(init.method).toBe(method);
    expect(init.redirect).toBe("error");
    expect(init.headers).toEqual(expectedBody
      ? { accept: "application/json", "content-type": "application/json" }
      : { accept: "application/json" });
    expect(init).not.toHaveProperty("credentials");
    expect(init.headers).not.toHaveProperty("authorization");
    if (expectedBody) expect(JSON.parse(init.body)).toEqual(expectedBody);
    else expect(init.body).toBeUndefined();
    const data = json.result.message.parts[1].data;
    expect(data).toMatchObject({
      state: "DELIVERED_SOURCE",
      skill,
      source: `https://councilof.ai${path}`,
      payload: { from: path },
    });
    expect(data.source_attribution).toMatch(/did not independently verify/i);
    expect(json.result.message.parts[0].text).not.toMatch(/certified|compliant/i);
  });

  it("routes measured-badge with only an encoded immutable subject and card hash", async () => {
    const fetchMock = vi.fn(async () => Response.json({ measured: true }));
    vi.stubGlobal("fetch", fetchMock);
    const card = "a".repeat(64);
    const subject = `owner/model@${"b".repeat(40)}`;
    const { json } = await callSkill("measured-badge", { card, subject });
    expect(json.error).toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/api/badge");
    expect(parsed.searchParams.get("format")).toBe("json");
    expect(parsed.searchParams.get("card")).toBe(card);
    expect(parsed.searchParams.get("subject")).toBe(subject);
    expect(init.method).toBe("GET");
  });

  it("never forwards caller authorization, cookies, or payment headers", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const request = new Request("https://councilof.ai/api/a2a", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer caller-secret",
        cookie: "session=caller-secret",
        "x-payment": "caller-payment",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "SendMessage",
        params: {
          message: {
            messageId: "m-no-forward",
            role: "ROLE_USER",
            parts: [{ data: { skill: "x402-discovery", input: {} } }],
          },
        },
      }),
    });
    const res = await onRequestPost({ request } as never);
    expect((await res.json() as { error?: unknown }).error).toBeUndefined();
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toEqual({ accept: "application/json" });
  });

  it("fails closed on missing, unknown, duplicate, and malformed selectors", async () => {
    const base = (parts: unknown[]) => rpc({
      jsonrpc: "2.0",
      id: 9,
      method: "SendMessage",
      params: { message: { messageId: "m-9", role: "ROLE_USER", parts } },
    });
    expect((await base([])).json.error.code).toBe(A2A_ERROR.INVALID_PARAMS);
    expect((await base([{ data: { skill: "not-real", input: {} } }])).json.error.code).toBe(A2A_ERROR.INVALID_PARAMS);
    expect((await base([
      { data: { skill: "gspc-board", input: {} } },
      { data: { skill: "x402-discovery", input: {} } },
    ])).json.error.code).toBe(A2A_ERROR.INVALID_PARAMS);
    expect((await callSkill("measured-badge", { card: "abc", subject: "owner/model@main" })).json.error.code)
      .toBe(A2A_ERROR.INVALID_PARAMS);
    expect((await callSkill("east-west-crosswalk", { url: "https://example.com" })).json.error.code)
      .toBe(A2A_ERROR.INVALID_PARAMS);
  });

  it("rejects invalid Part oneofs and extra semantic parts instead of ignoring them", async () => {
    const base = (parts: unknown[]) => rpc({
      jsonrpc: "2.0",
      id: 10,
      method: "SendMessage",
      params: { message: { messageId: "m-oneof", role: "ROLE_USER", parts } },
    });
    const textAndData = await base([{
      text: "board",
      data: { skill: "x402-discovery", input: {} },
    }]);
    expect(textAndData.json.error.data[0].reason).toBe("INVALID_SKILL_SELECTOR");
    expect(textAndData.json.error.message).toMatch(/oneof/i);

    const extraPart = await base([
      { data: { skill: "gspc-board", input: {} } },
      { text: "ignore this" },
    ]);
    expect(extraPart.json.error.data[0].reason).toBe("INVALID_SKILL_SELECTOR");
    expect(extraPart.json.error.message).toMatch(/additional semantic parts are not ignored/i);

    for (const key of ["url", "raw"] as const) {
      const unsupported = await base([{ [key]: "https://example.com/not-called" }]);
      expect(unsupported.json.error.code).toBe(A2A_ERROR.INVALID_PARAMS);
      expect(unsupported.json.error.message).toMatch(/not supported/i);
    }
  });

  it("rejects oversized requests before routing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const request = new Request("https://councilof.ai/api/a2a", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ padding: "x".repeat(256 * 1024) }),
    });
    const res = await onRequestPost({ request } as never);
    const json = await res.json() as { error: { data: Array<{ reason: string }> } };
    expect(json.error.data[0].reason).toBe("REQUEST_TOO_LARGE");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([undefined, "1"])(
    "bounds an oversized stream with %s Content-Length even when cancel never settles",
    async (contentLength) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      let pulls = 0;
      let cancelReason = "";
      const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
          pulls += 1;
          controller.enqueue(new Uint8Array(100 * 1024));
          if (pulls === 10) controller.close();
        },
        cancel(reason) {
          cancelReason = String(reason);
          return new Promise<void>(() => undefined);
        },
      }, { highWaterMark: 0 });
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (contentLength !== undefined) headers["content-length"] = contentLength;
      const request = new Request("https://councilof.ai/api/a2a", {
        method: "POST",
        headers,
        body: stream,
        duplex: "half",
      } as RequestInit & { duplex: "half" });
      const res = await onRequestPost({ request } as never);
      const json = await res.json() as { error: { data: Array<{ reason: string }> } };
      expect(json.error.data[0].reason).toBe("REQUEST_TOO_LARGE");
      expect(pulls).toBeLessThan(10);
      expect(cancelReason).toBe("request too large");
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("returns the timeout even when the never-ending stream's cancel promise never settles", async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      let cancelReason = "";
      const stream = new ReadableStream<Uint8Array>({
        cancel(reason) {
          cancelReason = String(reason);
          return new Promise<void>(() => undefined);
        },
      }, { highWaterMark: 0 });
      const request = new Request("https://councilof.ai/api/a2a", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: stream,
        duplex: "half",
      } as RequestInit & { duplex: "half" });
      const result = onRequestPost({ request } as never);
      await vi.advanceTimersByTimeAsync(5_001);
      const res = await result;
      const json = await res.json() as { error: { data: Array<{ reason: string }> } };
      expect(json.error.data[0].reason).toBe("REQUEST_READ_TIMEOUT");
      expect(cancelReason).toBe("request read timeout");
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("fails closed when a handler response is oversized", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ value: "x".repeat(1024 * 1024) })));
    const { json } = await callSkill("x402-discovery", {});
    expect(json.error.code).toBe(A2A_ERROR.INTERNAL);
    expect(json.error.data[0].metadata.source_state).toBe("RESPONSE_TOO_LARGE");
  });

  it("times out a handler without falling through to a different skill", async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      })));
      const result = callSkill("east-west-crosswalk", {});
      await vi.advanceTimersByTimeAsync(8_001);
      const { json } = await result;
      expect(json.error.code).toBe(A2A_ERROR.INTERNAL);
      expect(json.error.data[0].metadata.skill).toBe("east-west-crosswalk");
      expect(json.error.message).toMatch(/timed out/i);
    } finally {
      vi.useRealTimers();
    }
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

  it("documents the explicit structured selector for every advertised skill", () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const card = JSON.parse(readFileSync(path.resolve(here, "../../public/.well-known/agent-card.json"), "utf8"));
    for (const skill of card.skills as Array<{ id: string; examples?: string[] }>) {
      expect(skill.examples?.some((example) =>
        example.includes("SendMessage with Part.data") && example.includes(`"skill":"${skill.id}"`)
      ), `${skill.id} has no structured A2A example`).toBe(true);
    }
  });
});
