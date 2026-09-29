import { describe, expect, it } from "vitest";
import { argsOf, challengeOf, newRun, parseSse, reduceRun, streamRun, TALK_SUGGESTIONS, toneOf, type TalkRun } from "./aguiTalk";
import { labelOf, routeIntent } from "../../../functions/_lib/talkRouter";

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

  it("list_cards is labelled from its own state field, not ANSWERED", () => {
    expect(labelOf("list_cards", { state: "LIVE" }, false)).toBe("LIVE");
    expect(labelOf("list_cards", { state: "UNREACHABLE" }, false)).toBe("UNREACHABLE");
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
