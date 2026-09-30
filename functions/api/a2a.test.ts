import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { A2A_ERROR, A2A_PROTOCOL_VERSION, GREETING_EXAMPLES, SKILL_IDS, isCapabilityGreeting, onRequestGet, onRequestPost } from "./a2a";

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

const V1_HEADERS = { "a2a-version": "1.0" };

const rpc = async (body: unknown, headers: Record<string, string> = V1_HEADERS) => {
  const request = new Request("https://councilof.ai/api/a2a", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const res = await onRequestPost({ request } as never);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { status: res.status, headers: res.headers, json: (await res.json()) as any };
};

const send = (extra: Record<string, unknown> = {}, headers: Record<string, string> = V1_HEADERS) =>
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
  it("answers the registry SDK's generic discovery probe with capability help, not a measurement", async () => {
    const sourceFetch = vi.fn();
    vi.stubGlobal("fetch", sourceFetch);
    // a2aregistry.org's a2a-sdk 1.1.2 sends this text as a single Part and
    // includes configuration:{} when probing a v1 JSON-RPC interface.
    const probe = {
      jsonrpc: "2.0",
      id: "registry-task-probe",
      method: "SendMessage",
      params: {
        message: {
          messageId: "probe-message",
          role: "ROLE_USER",
          parts: [{ text: "Hello, what can you do?" }],
        },
        configuration: {},
      },
    };
    const { status, headers, json } = await rpc(probe);
    expect(status).toBe(200);
    expect(headers.get("a2a-version")).toBe("1.0");
    expect(json.error).toBeUndefined();
    expect(json.result.message.role).toBe("ROLE_AGENT");
    expect(json.result.message.parts[0].text).toContain("not a measurement or certification");
    expect(json.result.message.parts[1].data).toMatchObject({
      kind: "CAPABILITY_HELP",
      state: "DESCRIPTIVE_ONLY",
      protocolVersion: "1.0",
      skills: [...SKILL_IDS],
    });
    expect(sourceFetch).not.toHaveBeenCalled();

    const unversioned = await rpc(probe, {});
    expect(unversioned.json.error.code).toBe(A2A_ERROR.VERSION_NOT_SUPPORTED);
    expect(unversioned.json.result).toBeUndefined();
    expect(sourceFetch).not.toHaveBeenCalled();
  });

  // 2026-09-26: a bare "hello" got INVALID_SKILL_SELECTOR while that error's own text said a
  // greeting was accepted. Greetings now answer with the capability list; the error names them.
  it.each(["hello", "Hello!", "hi", "Hey there", "help", "hi, what can you do?", "What are your skills?"])(
    "a greeting (%s) is answered with the capability list, not INVALID_SKILL_SELECTOR",
    async (text) => {
      const sourceFetch = vi.fn();
      vi.stubGlobal("fetch", sourceFetch);
      const { json } = await rpc({
        jsonrpc: "2.0", id: 1, method: "SendMessage", params: {
          message: { messageId: "m-1", role: "ROLE_USER", parts: [{ text }] },
        },
      });
      expect(json.error).toBeUndefined();
      expect(json.result.message.parts[1].data).toMatchObject({ kind: "CAPABILITY_HELP", skills: [...SKILL_IDS] });
      expect(sourceFetch).not.toHaveBeenCalled();
    },
  );

  it("every greeting the error text names is one the parser accepts, and a sentence that merely contains one is not", async () => {
    for (const g of GREETING_EXAMPLES.split(", ")) expect(isCapabilityGreeting(g), g).toBe(true);
    for (const t of ["measure all models", "hi please grade gpt-4o", "helpful", "which model is best"]) expect(isCapabilityGreeting(t), t).toBe(false);
    const { json } = await rpc({
      jsonrpc: "2.0", id: 1, method: "SendMessage", params: {
        message: { messageId: "m-1", role: "ROLE_USER", parts: [{ text: "measure all models" }] },
      },
    });
    // 2026-09-29: unplaced text is a RESULT that says no tool matched (a2aregistry.org recorded the
    // old -32602 as "Returning errors when contacted by users"), not a capability greeting.
    expect(json.error).toBeUndefined();
    expect(json.result.message.parts[1].data.kind).toBe("NO_TOOL_MATCHED");
  });

  it("does not turn unrelated free text into a measurement or task — it answers that no tool matched", async () => {
    const sourceFetch = vi.fn();
    vi.stubGlobal("fetch", sourceFetch);
    const { json } = await rpc({
      jsonrpc: "2.0", id: 1, method: "SendMessage", params: {
        message: { messageId: "m-1", role: "ROLE_USER", parts: [{ text: "measure all models" }] },
      },
    });
    expect(json.error).toBeUndefined();
    expect(json.result.message.role).toBe("ROLE_AGENT");
    expect(json.result.message.parts[0].text).toContain("could not match that question to a tool");
    expect(json.result.message.parts[1].data).toMatchObject({ kind: "NO_TOOL_MATCHED", state: "unknown", tool_calls: [], citations: [] });
    expect(sourceFetch).not.toHaveBeenCalled();
  });

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
    expect(ambiguous.json.error).toBeUndefined();
    expect(ambiguous.json.result.message.parts[1].data.kind).toBe("NO_TOOL_MATCHED");
  });
});

// 2026-09-29 (growth gaps A1): most A2A SDK clients in the wild send the 0.3 shape — method
// message/send, no A2A-Version header, parts carrying {kind}. Every one of them got -32009.
describe("POST /api/a2a — the A2A 0.3 wire shape is served through the 1.0 handler", () => {
  const send03 = (parts: unknown[], headers: Record<string, string> = {}, extra: Record<string, unknown> = {}) =>
    rpc(
      {
        jsonrpc: "2.0",
        id: "v03",
        method: "message/send",
        params: { message: { kind: "message", messageId: "m-03", role: "user", parts, ...extra } },
      },
      headers,
    );

  it("answers message/send with no version header as a 0.3 Message", async () => {
    stubBoard();
    const { status, headers, json } = await send03([{ kind: "text", text: "board" }]);
    expect(status).toBe(200);
    expect(json.error).toBeUndefined();
    expect(headers.get("a2a-version")).toBe("0.3");
    expect(json.result).toMatchObject({ kind: "message", role: "agent" });
    expect(json.result.parts[0]).toMatchObject({ kind: "text" });
    expect(json.result.parts[0].text).toContain(`Lid: ${LID}`);
    expect(json.result.parts[1]).toMatchObject({ kind: "data" });
    expect(json.result.parts[1].data.skill).toBe("gspc-board");
  });

  it("accepts a 0.3 message/send without messageId by generating the compatibility id server-side", async () => {
    stubBoard();
    const { status, headers, json } = await rpc({
      jsonrpc: "2.0",
      id: "v03-no-message-id",
      method: "message/send",
      params: { message: { kind: "message", role: "user", parts: [{ kind: "text", text: "board" }] } },
    }, {});
    expect(status).toBe(200);
    expect(json.error).toBeUndefined();
    expect(headers.get("a2a-version")).toBe("0.3");
    expect(typeof json.result.messageId).toBe("string");
    expect(json.result.parts[0].text).toContain("Lid: " + LID);
  });

  it("serves an explicit 0.x header the same way, and keeps the caller's contextId", async () => {
    stubBoard();
    const { json } = await send03([{ kind: "text", text: "board" }], { "a2a-version": "0.3" }, { contextId: "ctx-03" });
    expect(json.error).toBeUndefined();
    expect(json.result.contextId).toBe("ctx-03");
  });

  it("maps a 0.3 data part onto the structured selector", async () => {
    stubBoard();
    const { json } = await send03([{ kind: "data", data: { skill: "gspc-board", input: {} } }]);
    expect(json.error).toBeUndefined();
    expect(json.result.parts[1].data.skill).toBe("gspc-board");
  });

  it("answers free text it cannot place with a result, never an error", async () => {
    const sourceFetch = vi.fn();
    vi.stubGlobal("fetch", sourceFetch);
    const { json } = await send03([{ kind: "text", text: "please assess this" }]);
    expect(json.error).toBeUndefined();
    expect(json.result.kind).toBe("message");
    expect(json.result.parts[1].data.kind).toBe("NO_TOOL_MATCHED");
    expect(sourceFetch).not.toHaveBeenCalled();
  });

  it("keeps 0.3 task methods on the same error codes as 1.0", async () => {
    const got = await rpc({ jsonrpc: "2.0", id: 9, method: "tasks/get", params: { id: "t-1" } }, {});
    expect(got.json.error.code).toBe(A2A_ERROR.TASK_NOT_FOUND);
    const stream = await rpc({ jsonrpc: "2.0", id: 9, method: "message/stream", params: {} }, {});
    expect(stream.json.error.code).toBe(A2A_ERROR.UNSUPPORTED_OPERATION);
  });

  it("still refuses a 0.3 method name under a declared 1.0 header, and an unknown slash method", async () => {
    const mixed = await send03([{ kind: "text", text: "board" }], V1_HEADERS);
    expect(mixed.json.error.code).toBe(A2A_ERROR.VERSION_NOT_SUPPORTED);
    const unknown = await rpc({ jsonrpc: "2.0", id: 9, method: "tasks/frobnicate", params: {} }, {});
    expect(unknown.json.error.code).toBe(A2A_ERROR.VERSION_NOT_SUPPORTED);
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
    expect(init.redirect).toBe("manual");
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

  it("refuses a 3xx source redirect instead of following it", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, {
      status: 302,
      headers: { location: "https://evil.example/exfil" },
    })));
    const { json } = await callSkill("x402-discovery", {});
    expect(json.error.code).toBe(A2A_ERROR.INTERNAL);
    expect(json.error.message).toMatch(/redirected \(302\)/i);
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
        "a2a-version": "1.0",
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
  it("treats an absent version as unsupported 0.3 rather than silently serving 1.0", async () => {
    stubBoard();
    const unversioned = await rpc({ jsonrpc: "2.0", id: 1, method: "SendMessage", params: {} }, {});
    expect(unversioned.json.error.code).toBe(A2A_ERROR.VERSION_NOT_SUPPORTED);
    expect(unversioned.json.error.message).toContain("absent A2A-Version means 0.3");
    expect(unversioned.json.error.data[0].metadata).toMatchObject({
      requested: "0.3",
      supported: ["1.0"],
      missingVersionHeader: true,
    });
  });

  it("names the fix for 0.3 method names and refuses other A2A-Version values", async () => {
    stubBoard();
    const legacy = await rpc({ jsonrpc: "2.0", id: 1, method: "message/send", params: {} }, V1_HEADERS);
    expect(legacy.json.error.code).toBe(A2A_ERROR.VERSION_NOT_SUPPORTED);
    expect(legacy.json.error.message).toContain("SendMessage");
    const v03 = await send({}, { "a2a-version": "0.3" });
    expect(v03.json.error.code).toBe(A2A_ERROR.VERSION_NOT_SUPPORTED);
    const malformed = await send({}, { "a2a-version": "1.0.1" });
    expect(malformed.json.error.code).toBe(A2A_ERROR.VERSION_NOT_SUPPORTED);
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
    expect(json.version_rule).toContain("an absent or empty header means 0.3");
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

/**
 * The card advertised estate-index while the router's SKILL_IDS did not, so a stranger reading
 * /.well-known/agent-card.json and calling the skill it names got "unknown skill". A card that
 * promises what the router rejects is worse than a card with fewer skills.
 */
describe("every skill the card advertises is one the router will accept", () => {
  it("card skills and SKILL_IDS are the same set", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const card = JSON.parse(
      readFileSync(resolve(__dirname, "../../public/.well-known/agent-card.json"), "utf8"),
    );
    const advertised = (card.skills as Array<{ id: string }>).map((s) => s.id).sort();
    expect(advertised).toEqual([...SKILL_IDS].sort());
  });
});

/**
 * Being in SKILL_IDS is not enough: validateSkillInput has its own per-skill branches and falls
 * through to "unsupported skill". estate-index passed the allowlist and was refused there, so the
 * card still advertised something the router would not answer. This asserts every advertised skill
 * survives BOTH checks with the input its own card example shows.
 */
describe("every advertised skill survives input validation, not just the allowlist", () => {
  it("no skill is refused as unsupported when called with an empty input", async () => {
    const refused: string[] = [];
    for (const id of SKILL_IDS) {
      const res = await onRequestPost({
        request: new Request("https://councilof.ai/api/a2a", {
          method: "POST",
          headers: { "content-type": "application/json", "a2a-version": "1.0" },
          body: JSON.stringify({
            jsonrpc: "2.0", id: 1, method: "SendMessage",
            params: { message: { messageId: `probe-${id}`, role: "user", parts: [{ data: { skill: id, input: {} } }] } },
          }),
        }),
      } as never);
      const body = await res.json();
      if (String(body?.error?.message ?? "") === "unsupported skill") refused.push(id);
    }
    expect(refused).toEqual([]);
  });
});
