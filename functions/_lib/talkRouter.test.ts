import { afterEach, describe, expect, it, vi } from "vitest";

import { ROUTABLE_TOOLS, callTool, executePlan, extractAxis, extractEndpoint, routeIntent, talk } from "./talkRouter";
import { isConfirmed, lastUserText, serveAguiRun } from "./aguiRun";
import { onRequestPost as chatPost } from "../api/chat";
import { onRequestPost as a2aPost } from "../api/a2a";
import GSPC_TOOLS from "../mcp/gspc-tools.json";
import PAID_TOOLS from "../mcp/paid-tools.json";

const HEX = "ab".repeat(32);

const BOARD = {
  totals: {
    axes: 23,
    measured_axes: 23,
    unmeasured_axes: 0,
    public_count: "23 axis · 23 measured",
    separation_public_count: "0 of 14 model-comparison axes separated a leader · 7 TIE · 7 UNTESTED",
  },
  axes: [{ axis: "safety", family: "gspc", status: "MEASURED", n: 36, accuracy: 0.9444, kind: "model-comparison" }],
  measured_on: {},
};

const MCP_TRUST = {
  kind: "csoai.mcp-trust-snapshot/0.1",
  as_of: "2026-09-14T10:38:01Z",
  enumeration: { unique_hosts: 500, complete: false, stop_reason: "cap reached" },
  partial: false,
  counts: { total: 500 },
  headline: "257 of 500 enumerated hosts answered a correct MCP initialize.",
};

/** A fetch stub that answers by path, records every request, and 404s anything else. */
function stubOrigin(extra: Record<string, (req: Request) => Response> = {}) {
  const seen: Request[] = [];
  const routes: Record<string, (req: Request) => Response> = {
    "/api/gspc": () => Response.json(BOARD),
    "/interop/mcp-trust/latest.json": () => Response.json(MCP_TRUST),
    ...extra,
  };
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = input instanceof Request ? input : new Request(String(input), init);
    seen.push(req);
    const u = new URL(req.url);
    const h = routes[u.pathname];
    return h ? h(req) : new Response("not found", { status: 404 });
  });
  vi.stubGlobal("fetch", fn);
  return seen;
}

afterEach(() => vi.unstubAllGlobals());

const ORIGIN = "https://councilof.ai";

describe("routeIntent — deterministic keyword/entity routing onto the /mcp tools", () => {
  const cases: [string, string[]][] = [
    ["what does the board say", ["board_totals"]],
    ["How many axes are measured?", ["board_totals"]],
    ["is cityalert.live trustworthy", ["server_evidence", "mcp_trust"]],
    ["check whether the mcp server at https://tapeperp.com/mcp is trustworthy", ["server_evidence", "mcp_trust"]],
    [`verify ${HEX}`, ["verify_card"]],
    [`is ${HEX} included in the root?`, ["verify_inclusion"]],
    [`get the leaf ${HEX}`, ["get_card"]],
    ["how did safety measure", ["get_axis"]],
    ["what about effect binding", ["get_axis"]],
    ["x402 census please", ["x402_trust"]],
    ["how many mcp servers answered", ["mcp_trust"]],
    ["show the measurement index", ["measurement_index"]],
    ["show the public root", ["get_root"]],
    ["list signed cards", ["list_cards"]],
    ["commission a card for https://example.com/mcp", ["commission_card"]],
  ];
  it.each(cases)("%s -> %j", (q, tools) => {
    const plan = routeIntent(q);
    expect(plan.kind).toBe("tools");
    if (plan.kind === "tools") expect(plan.calls.map((c) => c.tool)).toEqual(tools);
  });

  it("routes only to tools POST /mcp lists (derived from gspc-tools.json + paid-tools.json)", () => {
    const listed = new Set([...GSPC_TOOLS.tools, ...PAID_TOOLS.tools].map((t) => t.name));
    expect(ROUTABLE_TOOLS).toEqual(listed);
    for (const [q] of cases) {
      const plan = routeIntent(q);
      if (plan.kind === "tools") for (const c of plan.calls) expect(listed.has(c.tool)).toBe(true);
    }
  });

  it("extracts the entity, not just the topic", () => {
    const p = routeIntent("is cityalert.live trustworthy");
    expect(p.kind === "tools" && p.calls[0].args.endpoint_url).toBe("https://cityalert.live/mcp");
    const a = routeIntent("tell me about provenance controls");
    expect(a.kind === "tools" && a.calls[0].args.axis).toBe("provenance-controls");
    const v = routeIntent(`verify ${HEX.toUpperCase()}`);
    expect(v.kind === "tools" && v.calls[0].args.card).toBe(HEX);
  });

  it("does not read file names or version numbers as hosts", () => {
    expect(extractEndpoint("read root.json and agent-card.json")).toBeNull();
    expect(extractEndpoint("qwen2.5 on version 1.4.3")).toBeNull();
    expect(extractAxis("what is the weather")).toBeNull();
  });

  it("an unknown or unrelated question is help, never a guessed tool", () => {
    for (const q of ["measure all models", "please assess this", "what is the meaning of life", ""]) {
      expect(routeIntent(q).kind).toBe("help");
    }
  });

  it("a paid tool without its required argument asks for it instead of calling", () => {
    const p = routeIntent("commission a card");
    expect(p.kind).toBe("needs_input");
  });
});

describe("executePlan — answers carry the tool output, a citation and the state label", () => {
  it("board totals: tool name, source URL and the tool's own counts", async () => {
    stubOrigin();
    const a = await talk("what does the board say", ORIGIN);
    expect(a.grounded).toBe(true);
    expect(a.answered_by).toBe("tool:board_totals");
    expect(a.citations[0]).toMatchObject({ tool: "board_totals", url: `${ORIGIN}/api/gspc` });
    expect(a.label).toBe("MEASURED 23 of 23 slots");
    expect(a.answer).toContain("23 axis · 23 measured");
    expect(a.answer).toContain("tool `board_totals`");
  });

  it("an unreachable source is reported as UNREACHABLE with no number substituted", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("down", { status: 503 })));
    const a = await talk("what does the board say", ORIGIN);
    expect(a.label).toBe("UNREACHABLE");
    expect(a.answer).not.toMatch(/\b23\b/);
  });

  it("a domain question cites mcp_trust and server_evidence, and never grades trust", async () => {
    stubOrigin();
    const a = await talk("is cityalert.live trustworthy", ORIGIN);
    expect(a.grounded).toBe(true);
    expect(a.citations.map((c) => c.tool)).toEqual(["server_evidence", "mcp_trust"]);
    expect(a.answer).toContain("257 of 500 enumerated hosts");
    expect(a.answer).not.toMatch(/\b(is|are) (trustworthy|safe|untrustworthy)\b/i);
  });

  it("help is not grounded and calls nothing", async () => {
    const seen = stubOrigin();
    const a = await talk("what is the meaning of life", ORIGIN);
    expect(a.grounded).toBe(false);
    expect(a.tool_calls).toEqual([]);
    expect(seen.length).toBe(0);
    expect(a.answer).toMatch(/could not match/);
  });

  it("never forwards x_payment: the paid route sees no X-PAYMENT header, and a 402 is reported as a challenge", async () => {
    const seen = stubOrigin({
      "/api/request-attestation": () =>
        Response.json({ x402Version: 2, error: "Payment required", accepts: [], resource: { url: `${ORIGIN}/api/request-attestation` } }, { status: 402 }),
    });
    const r = await callTool("commission_card", { subject: "https://example.com/mcp", x_payment: "SHOULD-NOT-PASS" }, ORIGIN);
    const paidReq = seen.find((q) => new URL(q.url).pathname === "/api/request-attestation");
    expect(paidReq).toBeDefined();
    expect(paidReq!.headers.get("x-payment")).toBeNull();
    expect(JSON.stringify(r)).not.toContain("SHOULD-NOT-PASS");

    const a = await executePlan(routeIntent("commission a card for https://example.com/mcp"), ORIGIN);
    expect(a.label).toBe("PAYMENT_REQUIRED");
    expect(a.answer).toMatch(/your own wallet/);
    expect(a.answer).toMatch(/nothing was charged/i);
  });
});

async function readEvents(res: Response): Promise<{ type: string; [k: string]: unknown }[]> {
  const text = await res.text();
  return text
    .split("\n\n")
    .map((b) => b.split("\n").find((l) => l.startsWith("data: ")))
    .filter((l): l is string => !!l)
    .map((l) => JSON.parse(l.slice(6)));
}

const aguiPost = (body: unknown) =>
  serveAguiRun(
    new Request(`${ORIGIN}/api/agui/run`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
  );

describe("AG-UI run — streams RUN / TOOL_CALL / TEXT_MESSAGE events from the same router", () => {
  it("streams the full event sequence for a board question", async () => {
    stubOrigin();
    const res = await aguiPost({ threadId: "t1", runId: "r1", messages: [{ id: "m1", role: "user", content: "what does the board say" }] });
    expect(res.headers.get("content-type")).toMatch(/text\/event-stream/);
    const ev = await readEvents(res);
    expect(ev.map((e) => e.type)).toEqual([
      "RUN_STARTED",
      "TOOL_CALL_START",
      "TOOL_CALL_ARGS",
      "TOOL_CALL_END",
      "TOOL_CALL_RESULT",
      "TEXT_MESSAGE_START",
      ...ev.filter((e) => e.type === "TEXT_MESSAGE_CONTENT").map(() => "TEXT_MESSAGE_CONTENT"),
      "TEXT_MESSAGE_END",
      "RUN_FINISHED",
    ]);
    expect(ev[0]).toMatchObject({ threadId: "t1", runId: "r1" });
    expect(ev[1]).toMatchObject({ toolCallName: "board_totals" });
    const result = JSON.parse(String(ev[4].content));
    expect(result.citation).toMatchObject({ tool: "board_totals" });
    expect(ev.at(-1)).toMatchObject({ type: "RUN_FINISHED", result: { grounded: true, answered_by: "tool:board_totals" } });
  });

  it("a paid tool is NOT called without an explicit confirm event", async () => {
    const seen = stubOrigin();
    const ev = await readEvents(await aguiPost({ messages: [{ role: "user", content: "commission a card for https://example.com/mcp" }] }));
    expect(ev.some((e) => e.type === "TOOL_CALL_START")).toBe(false);
    expect(ev.find((e) => e.type === "CUSTOM")).toMatchObject({ name: "confirm_required" });
    expect(ev.at(-1)).toMatchObject({ type: "RUN_FINISHED", result: { awaiting_confirmation: true } });
    expect(seen.length).toBe(0);
  });

  it("with forwardedProps.confirm naming the tool, it returns the 402 challenge and still pays nothing", async () => {
    const seen = stubOrigin({
      "/api/request-attestation": () => Response.json({ x402Version: 2, error: "Payment required", accepts: [] }, { status: 402 }),
    });
    const ev = await readEvents(
      await aguiPost({
        messages: [{ role: "user", content: "commission a card for https://example.com/mcp" }],
        forwardedProps: { confirm: { tool: "commission_card" } },
      }),
    );
    expect(ev.find((e) => e.type === "TOOL_CALL_START")).toMatchObject({ toolCallName: "commission_card" });
    const result = JSON.parse(String(ev.find((e) => e.type === "TOOL_CALL_RESULT")!.content));
    expect(result.label).toBe("PAYMENT_REQUIRED");
    expect(seen.every((q) => q.headers.get("x-payment") === null)).toBe(true);
  });

  it("confirm must name the tool; an empty message is a RUN_ERROR", async () => {
    expect(isConfirmed({ forwardedProps: { confirm: { tool: "rwa_evidence" } } }, ["commission_card"])).toBe(false);
    expect(isConfirmed({}, [])).toBe(true);
    expect(lastUserText({ messages: [{ role: "user", content: [{ type: "text", text: "board" }] }] })).toBe("board");
    const ev = await readEvents(await aguiPost({ messages: [] }));
    expect(ev.map((e) => e.type)).toEqual(["RUN_STARTED", "RUN_ERROR"]);
  });

  it("GET describes the endpoint instead of 503", async () => {
    const res = await serveAguiRun(new Request(`${ORIGIN}/api/agui/run`));
    expect(res.status).toBe(200);
    const j = (await res.json()) as Record<string, unknown>;
    expect(j.events).toContain("RUN_STARTED");
  });
});

const a2aText = (text: string) =>
  a2aPost({
    request: new Request(`${ORIGIN}/api/a2a`, {
      method: "POST",
      headers: { "content-type": "application/json", "a2a-version": "1.0" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "SendMessage", params: { message: { messageId: "m1", role: "ROLE_USER", parts: [{ text }] } } }),
    }),
  } as never);

describe("the doors use the router: POST /api/chat and A2A plain text", () => {
  it("/api/chat answers a server question from server_evidence + mcp_trust with citations, not ungrounded", async () => {
    stubOrigin();
    const res = await chatPost({
      request: new Request(`${ORIGIN}/api/chat`, { method: "POST", body: JSON.stringify({ message: "is cityalert.live trustworthy" }) }),
      env: {},
    } as never);
    const j = (await res.json()) as Record<string, any>;
    expect(j.state).toBe("grounded");
    expect(j.answered_by).toBe("tool:server_evidence+mcp_trust");
    expect(j.citations.map((c: any) => c.tool)).toContain("mcp_trust");
    expect(j.model).toBeNull();
    expect(j.signature).toBeNull();
  });

  it("A2A SendMessage with plain text returns board_totals output", async () => {
    stubOrigin();
    const j = (await (await a2aText("what does the board say")).json()) as Record<string, any>;
    const data = j.result.message.parts[1].data;
    expect(data.kind).toBe("GROUNDED_TOOL_ANSWER");
    expect(data.answered_by).toBe("tool:board_totals");
    expect(j.result.message.parts[0].text).toContain("23 axis · 23 measured");
  });

  it("A2A text the router cannot place is still refused, never guessed", async () => {
    stubOrigin();
    const j = (await (await a2aText("measure all models")).json()) as Record<string, any>;
    expect(j.error.data[0].reason).toBe("INVALID_SKILL_SELECTOR");
  });
});
