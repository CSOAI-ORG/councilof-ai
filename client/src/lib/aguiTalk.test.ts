import { describe, expect, it } from "vitest";
import { applyPatch, interruptRun, argsOf, challengeOf, newRun, parseSse, reduceRun, streamRun, TALK_SUGGESTIONS, toneOf, type TalkRun } from "./aguiTalk";
import { citationOf, labelOf, routeIntent } from "../../../functions/_lib/talkRouter";

const sse = (type: string, extra: Record<string, unknown> = {}) =>
  `event: ${type}\ndata: ${JSON.stringify({ type, ...extra })}\n\n`;

const STREAM =
  sse("RUN_STARTED", { threadId: "t", runId: "r" }) +
  sse("TOOL_CALL_START", { toolCallId: "call_1", toolCallName: "get_axis" }) +
  sse("TOOL_CALL_ARGS", { toolCallId: "call_1", delta: '{"axis":' }) +
  sse("TOOL_CALL_ARGS", { toolCallId: "call_1", delta: '"safety"}' }) +
  sse("TOOL_CALL_END", { toolCallId: "call_1" }) +
  sse("TOOL_CALL_RESULT", {
    toolCallId: "call_1",
    content: JSON.stringify({
      tool: "get_axis",
      args: { axis: "safety" },
      label: "MEASURED",
      summary: "MEASURED — axis \"safety\"",
      citation: { tool: "get_axis", record_id: "axis:safety", url: "https://councilof.ai/api/gspc?axis=safety" },
      output: { n: 36 },
    }),
  }) +
  sse("TEXT_MESSAGE_START", { messageId: "m" }) +
  sse("TEXT_MESSAGE_CONTENT", { messageId: "m", delta: "**get_axis** → MEASURED" }) +
  sse("TEXT_MESSAGE_CONTENT", { messageId: "m", delta: "\n- n: 36" }) +
  sse("TEXT_MESSAGE_END", { messageId: "m" }) +
  sse("RUN_FINISHED", { threadId: "t", runId: "r", result: { grounded: true } });

function fold(text: string): TalkRun {
  const { events } = parseSse(text);
  return events.reduce((r, e) => reduceRun(r, e.data), newRun("q", "run-1"));
}

describe("parseSse", () => {
  it("keeps an event split across chunks until it is complete", () => {
    const cut = STREAM.indexOf("TOOL_CALL_RESULT") + 40;
    const a = parseSse(STREAM.slice(0, cut));
    const b = parseSse(a.rest + STREAM.slice(cut));
    expect(b.rest).toBe("");
    expect([...a.events, ...b.events].map((e) => e.data.type)).toEqual([
      "RUN_STARTED", "TOOL_CALL_START", "TOOL_CALL_ARGS", "TOOL_CALL_ARGS", "TOOL_CALL_END", "TOOL_CALL_RESULT",
      "TEXT_MESSAGE_START", "TEXT_MESSAGE_CONTENT", "TEXT_MESSAGE_CONTENT", "TEXT_MESSAGE_END", "RUN_FINISHED",
    ]);
  });

  it("drops a malformed event instead of guessing", () => {
    expect(parseSse("data: {not json\n\n").events).toEqual([]);
  });
});

describe("reduceRun", () => {
  it("builds a tool card with args, label and citation from the result, then the answer text", () => {
    const r = fold(STREAM);
    expect(r.status).toBe("done");
    expect(r.tools).toHaveLength(1);
    const c = r.tools[0];
    expect(c).toMatchObject({ name: "get_axis", status: "done", label: "MEASURED" });
    expect(argsOf(c)).toEqual({ axis: "safety" });
    expect(c.citation).toEqual({ tool: "get_axis", record_id: "axis:safety", url: "https://councilof.ai/api/gspc?axis=safety" });
    expect(r.text).toBe("**get_axis** → MEASURED\n- n: 36");
  });

  it("confirm_required stops at awaiting_confirmation with the pending tool, and no card", () => {
    const r = fold(
      sse("RUN_STARTED") +
        sse("CUSTOM", { name: "confirm_required", value: { tools: [{ tool: "commission_card", args: { subject: "x" } }], how: "h", effect: "e" } }) +
        sse("RUN_FINISHED", { result: { awaiting_confirmation: true, tools: ["commission_card"] } }),
    );
    expect(r.status).toBe("awaiting_confirmation");
    expect(r.confirm?.tools).toEqual([{ tool: "commission_card", args: { subject: "x" } }]);
    expect(r.tools).toEqual([]);
  });

  it("RUN_ERROR is an error state with the server's message", () => {
    const r = fold(sse("RUN_STARTED") + sse("RUN_ERROR", { message: "no user message" }));
    expect(r).toMatchObject({ status: "error", error: "no user message" });
  });
});

describe("challengeOf / toneOf", () => {
  it("reads the 402 challenge verbatim, amount left in atomic units", () => {
    const c = challengeOf({
      x402Version: 2,
      resource: { url: "https://councilof.ai/api/request-attestation?subject=x", description: "d" },
      accepts: [{ scheme: "exact", network: "eip155:8453", maxAmountRequired: "10000", asset: "0xA", payTo: "0xB", extra: { symbol: "USDC" } }],
    });
    expect(c).toEqual({
      resource: "https://councilof.ai/api/request-attestation?subject=x",
      description: "d",
      accepts: [{ scheme: "exact", network: "eip155:8453", asset: "0xA", symbol: "USDC", payTo: "0xB", amountAtomic: "10000" }],
    });
    expect(challengeOf({ state: "VALID" })).toBeNull();
  });

  it("UNMEASURED is its own tone, never the error tone", () => {
    expect(toneOf("UNMEASURED")).toBe("unmeasured");
    expect(toneOf("NOT_MEASURED")).toBe("unmeasured");
    expect(toneOf("MEASURED 23 of 23 slots")).toBe("measured");
    expect(toneOf("PAYMENT_REQUIRED")).toBe("payment");
    expect(toneOf("UNREACHABLE")).toBe("problem");
    expect(toneOf("ANSWERED")).toBe("neutral");
  });
});

describe("suggested questions are ones the router answers", () => {
  it.each(TALK_SUGGESTIONS.map((s) => [s.text, s.tool]))("%s -> %s", (text, tool) => {
    const plan = routeIntent(text);
    expect(plan.kind).toBe("tools");
    if (plan.kind === "tools") expect(plan.calls[0].tool).toBe(tool);
  });

  it("offers 4 to 6 of them, none a paid tool", () => {
    expect(TALK_SUGGESTIONS.length).toBeGreaterThanOrEqual(4);
    expect(TALK_SUGGESTIONS.length).toBeLessThanOrEqual(6);
    for (const s of TALK_SUGGESTIONS) expect(["commission_card", "art50_marking_evidence", "rwa_evidence", "receipts_batch"]).not.toContain(s.tool);
  });

  it("offers a stranger no developer-only chip (tools audit, 6 Oct 2026)", () => {
    // list_cards answers hashes and axis codes with no model or score; get_root answers a Merkle
    // root. Both stay callable by agents over POST /mcp; neither is a start-screen question.
    const tools = TALK_SUGGESTIONS.map((s) => s.tool);
    expect(tools).not.toContain("list_cards");
    expect(tools).not.toContain("get_root");
    expect(TALK_SUGGESTIONS.map((s) => s.text)).toContain("Show the latest corrections");
  });

  it("list_cards is labelled from its own state field, not ANSWERED", () => {
    expect(labelOf("list_cards", { state: "LIVE" }, false)).toBe("LIVE");
    expect(labelOf("list_cards", { state: "UNREACHABLE" }, false)).toBe("UNREACHABLE");
  });

  it("list_cards cites the signed card index it read (head + URL), not the /mcp door", () => {
    const p = { state: "LIVE", index: { source: "https://councilof.ai/signed/card_index.json", head: "ab".repeat(32) } };
    expect(citationOf("list_cards", p, "https://councilof.ai")).toEqual({ tool: "list_cards", record_id: "ab".repeat(32), url: "https://councilof.ai/signed/card_index.json" });
    expect(citationOf("list_cards", { state: "UNREACHABLE", index: { state: "UNREACHABLE", source: "x" } }, "https://o").url).toBe("https://o/mcp");
  });
});

describe("streamRun", () => {
  it("sends confirm only when asked, and feeds every event through", async () => {
    const bodies: any[] = [];
    const fetchImpl = (async (_u: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)));
      const enc = new TextEncoder();
      const half = Math.floor(STREAM.length / 2);
      return new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(enc.encode(STREAM.slice(0, half)));
            c.enqueue(enc.encode(STREAM.slice(half)));
            c.close();
          },
        }),
        { status: 200, headers: { "content-type": "text/event-stream" } },
      );
    }) as unknown as typeof fetch;
    const seen: string[] = [];
    await streamRun({ question: "How did safety measure?", fetchImpl, onEvent: (e) => seen.push(String(e.type)) });
    expect(bodies[0].forwardedProps).toBeUndefined();
    expect(bodies[0].messages[0]).toMatchObject({ role: "user", content: "How did safety measure?" });
    expect(seen.at(-1)).toBe("RUN_FINISHED");
    await streamRun({ question: "commission a card for x", confirmTool: ["commission_card"], fetchImpl, onEvent: () => undefined });
    expect(bodies[1].forwardedProps.confirm.tools).toEqual(["commission_card"]);
  });
});

describe("trace identity, terminal truth and inert imported state", () => {
  it("retains producer IDs/times and deduplicates identified event replays", () => {
    let run = newRun("q", "local-row");
    const start = { type: "RUN_STARTED", threadId: "producer-thread", runId: "producer-run", timestamp: 17, eventId: "e1" };
    run = reduceRun(run, start);
    run = reduceRun(run, { type: "TOOL_CALL_START", toolCallId: "t1", toolCallName: "verify_card", timestamp: 18, eventId: "e2" });
    const args = { type: "TOOL_CALL_ARGS", toolCallId: "t1", delta: "{}", timestamp: 19, eventId: "e3" };
    run = reduceRun(reduceRun(run, args), args);
    run = reduceRun(run, { type: "TOOL_CALL_END", toolCallId: "t1", timestamp: 20, eventId: "e4" });
    expect(run.tools[0].status).toBe("running"); // Argument completion is not execution.
    run = reduceRun(run, { type: "TOOL_CALL_RESULT", toolCallId: "t1", timestamp: 12, eventId: "e5", content: JSON.stringify({ tool: "verify_card", label: "UNCHECKABLE", output: { as_of: "2001-01-01", cost: null, supersedes: "original-record" } }) });
    expect(run).toMatchObject({ id: "local-row", threadId: "producer-thread", runId: "producer-run", startedAt: 17, lastEventAt: 12 });
    expect(run.tools[0]).toMatchObject({ argsText: "{}", status: "done", label: "UNCHECKABLE", output: { as_of: "2001-01-01", cost: null, supersedes: "original-record" } });
    expect(toneOf(run.tools[0].label)).toBe("unmeasured");
    expect(run.trace).toHaveLength(5);
    const text = { type: "TEXT_MESSAGE_CONTENT", delta: "One answer", eventId: "e6" };
    run = reduceRun(reduceRun(run, text), text);
    expect(run.text).toBe("One answer");
    run = reduceRun(run, { type: "RUN_FINISHED", result: { grounded: true }, eventId: "e7" });
    expect(reduceRun(run, start)).toEqual(run);
  });

  it.each([{ type: "interrupt" }, { type: "unknown_future_outcome" }])("does not turn outcome %j into done", outcome => {
    const run = reduceRun(newRun("q", "r"), { type: "RUN_FINISHED", outcome });
    expect(run.status).toBe("interrupted");
  });
  it("separates executor cancellation from local stop requests and approval", () => {
    let run = reduceRun(newRun("q", "r"), { type: "TOOL_CALL_START", toolCallId: "t", toolCallName: "get_axis" });
    const local = interruptRun(run, "stop_requested");
    expect(local.status).toBe("stop_requested");
    expect(local.tools[0].status).toBe("unknown");
    expect(local.cancellationSource).toBeUndefined();
    const acknowledged = reduceRun(run, { type: "RUN_FINISHED", outcome: { type: "cancelled" } });
    expect(acknowledged).toMatchObject({ status: "cancelled", cancellationSource: "executor" });
    const held = reduceRun(newRun("q", "r"), { type: "RUN_FINISHED", result: { awaiting_confirmation: true } });
    expect(held).toMatchObject({ status: "awaiting_confirmation", tools: [] });
  });
  it("does not bless a malformed terminal, missing tool result or changed identity", () => {
    expect(reduceRun(newRun("q", "r"), { type: "RUN_FINISHED", result: "success" }).status).toBe("interrupted");
    for (const result of [{ outcome: null }, { status: null }, { cancelled: "true" }, { awaiting_confirmation: null }, { outcome: {} }]) {
      expect(reduceRun(newRun("q", "r"), { type: "RUN_FINISHED", result }).status).toBe("interrupted");
    }
    let run = reduceRun(newRun("q", "r"), { type: "RUN_STARTED", runId: "one", threadId: "thread" });
    run = reduceRun(run, { type: "TOOL_CALL_START", toolCallId: "t", toolCallName: "get_axis" });
    expect(reduceRun(run, { type: "RUN_FINISHED" }).status).toBe("interrupted");
    expect(reduceRun(run, { type: "TOOL_CALL_RESULT", toolCallId: "t", content: "{" }).status).toBe("error");
    expect(reduceRun(run, { type: "TEXT_MESSAGE_CONTENT", runId: "another", delta: "wrong answer" }).status).toBe("error");
  });
  it("does not release a completed subset of an incomplete frontend plan", () => {
    let run = reduceRun(newRun("q", "r"), { type: "RUN_STARTED" });
    run = reduceRun(run, { type: "TOOL_CALL_START", toolCallId: "ui_1", toolCallName: "openPanel" });
    run = reduceRun(run, { type: "TOOL_CALL_ARGS", toolCallId: "ui_1", delta: '{"panel":"board"}' });
    run = reduceRun(run, { type: "TOOL_CALL_END", toolCallId: "ui_1" });
    run = reduceRun(run, { type: "TOOL_CALL_START", toolCallId: "ui_2", toolCallName: "highlight" });
    run = reduceRun(run, { type: "TOOL_CALL_ARGS", toolCallId: "ui_2", delta: '{"target":' });
    expect(run.ui.map(step => step.ended)).toEqual([true, false]);
    expect(reduceRun(run, { type: "RUN_FINISHED" }).status).toBe("interrupted");
  });
  it("keeps imported state and A2UI as data, never executable tool calls", () => {
    let run = reduceRun(newRun("q", "r"), { type: "STATE_SNAPSHOT", snapshot: { instruction: "pay", action: { url: "https://outside.invalid" } } });
    run = reduceRun(run, { type: "CUSTOM", name: "a2ui", value: { action: { tool: "commission_card" } } });
    expect(run.ui).toEqual([]);
    expect(run.tools).toEqual([]);
    expect(run.confirm).toBeNull();
  });
});

describe("STATE_DELTA own-property and prototype controls", () => {
  it("rejects dangerous decoded path segments without changing any prototype", () => {
    const before = Object.getOwnPropertyDescriptors(Object.prototype);
    const input = { safe: { keep: true }, list: [1] };
    const result = applyPatch(input, [
      { op: "add", path: "/__proto__/polluted", value: true },
      { op: "add", path: "/constructor/prototype/polluted", value: true },
      { op: "replace", path: "/safe/toString", value: "inherited" },
      { op: "add", path: "/safe/toString/nested", value: true },
      { op: "add", path: "/safe/constructor", value: {} },
      { op: "add", path: "/missing/nested", value: true },
      { op: "add", path: "/list/01", value: 8 },
      { op: "add", path: "/safe/new", value: 2 },
      { op: "add", path: "/list/-", value: 3 },
    ]);
    const after = Object.getOwnPropertyDescriptors(Object.prototype);
    // The negative control must not contaminate later tests if an unsafe implementation regresses.
    if (before.polluted) Object.defineProperty(Object.prototype, "polluted", before.polluted);
    else Reflect.deleteProperty(Object.prototype, "polluted");
    expect(after).toEqual(before);
    expect(result).toEqual({ safe: { keep: true, new: 2 }, list: [1, 3] });
    expect(input).toEqual({ safe: { keep: true }, list: [1] });
  });
  it("retains valid escaped own paths and rejects invalid escapes", () => {
    expect(applyPatch({ "a/b": { "~c": 1 } }, [
      { op: "replace", path: "/a~1b/~0c", value: 2 },
      { op: "replace", path: "/a~2b/~0c", value: 9 },
    ])).toEqual({ "a/b": { "~c": 2 } });
  });
});

describe("bounded single-request SSE transport", () => {
  const response = (body: string) => new Response(body, { headers: { "content-type": "text/event-stream" } });
  it("delivers live progress before terminal and EOF, preserving one request", async () => {
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    let progress!: () => void;
    const arrived = new Promise<void>(resolve => { progress = resolve; });
    let requests = 0, settled = false;
    const seen: string[] = [], encoder = new TextEncoder();
    const read = streamRun({ question: "q", fetchImpl: (async () => {
      requests++;
      return new Response(new ReadableStream<Uint8Array>({ start(c) { controller = c; c.enqueue(encoder.encode(sse("RUN_STARTED", { runId: "actual", threadId: "actual-thread", timestamp: 4 }))); } }), { headers: { "content-type": "text/event-stream" } });
    }) as typeof fetch, onEvent: event => { seen.push(String(event.type)); progress(); } }).then(() => { settled = true; });
    await arrived;
    expect(settled).toBe(false);
    expect(seen).toEqual(["RUN_STARTED"]);
    controller.enqueue(encoder.encode(sse("RUN_FINISHED", { runId: "actual", threadId: "actual-thread" })));
    controller.close();
    await read;
    expect(requests).toBe(1);
    expect(settled).toBe(true);
  });
  it.each([
    sse("RUN_STARTED") + "data: {bad\n\n" + sse("RUN_FINISHED"),
    sse("RUN_STARTED") + "event: RUN_FINISHED\ndata: {\"type\":\"RUN_ERROR\"}\n\n",
    sse("RUN_STARTED") + 'event: RUN_FINISHED\ndata: {"type":"RUN_FINISHED"}',
  ])("rejects malformed or incomplete terminal bytes without a replay", async text => {
    let requests = 0;
    await expect(streamRun({ question: "q", fetchImpl: (async () => { requests++; return response(text); }) as typeof fetch, onEvent: () => {} })).rejects.toThrow();
    expect(requests).toBe(1);
  });
  it("deduplicates matching SSE event IDs and rejects mismatched identities", async () => {
    const start = 'id: one\nevent: RUN_STARTED\ndata: {"type":"RUN_STARTED","eventId":"one"}\n\n';
    const types: string[] = [];
    await streamRun({ question: "q", fetchImpl: (async () => response(start + start + sse("RUN_FINISHED"))) as typeof fetch, onEvent: e => types.push(String(e.type)) });
    expect(types).toEqual(["RUN_STARTED", "RUN_FINISHED"]);
    await expect(streamRun({ question: "q", fetchImpl: (async () => response(start.replace('"eventId":"one"', '"eventId":"other"'))) as typeof fetch, onEvent: () => {} })).rejects.toThrow(/identity/);
  });
  it("rejects an oversized incomplete event and a non-SSE response", async () => {
    await expect(streamRun({ question: "q", fetchImpl: (async () => response("x".repeat(512 * 1024 + 1))) as typeof fetch, onEvent: () => {} })).rejects.toThrow(/size limit/);
    await expect(streamRun({ question: "q", fetchImpl: (async () => Response.json({ success: true })) as typeof fetch, onEvent: () => {} })).rejects.toThrow(/event stream/);
  });
  it("honours an already aborted caller without POST and bounds a stalled fetch", async () => {
    const controller = new AbortController(); controller.abort();
    let requests = 0;
    const fetchImpl = (async () => { requests++; return response(STREAM); }) as typeof fetch;
    await expect(streamRun({ question: "q", signal: controller.signal, fetchImpl, onEvent: () => {} })).rejects.toThrow();
    expect(requests).toBe(0);
    await expect(streamRun({ question: "q", timeoutMs: 10, fetchImpl: (() => new Promise<Response>(() => {})) as typeof fetch, onEvent: () => {} })).rejects.toThrow(/timed out/);
  });
});
