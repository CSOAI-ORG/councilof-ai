// Ask GSPC and the in-panel actions, against AG-UI runs recorded live on 2026-09-30.
import { describe, expect, it } from "vitest";
import { askGspc, askIntent, connectAnswer, routedQuestion } from "../src/ask.js";
import { ActionRunner, FRONTEND_TOOLS, planActions, withFrontendTools } from "../src/actions.js";
import { viewTree, textOf, region } from "../src/view.js";
import { normalizeConfig } from "../src/config.js";
import { onRequestPost as watchHandler } from "../../../functions/api/claims/watch-request.ts";
import { requestWatch } from "../src/ask.js";
import { replayFetch } from "./replay.js";
import * as INSTALL from "../../../client/src/data/gspcInstall.ts";
import { MCP_FREE_URL, OPENAPI_URL, STDIO_CMD } from "../src/ask.js";

const O = "https://councilof.ai";
const SUBJ = "https://tandem.ac/mcp";
const model = {
  schema: "csoai.gspc-panel-model/0.1",
  subject: { input: SUBJ, kind: "mcp_server" },
  state: "MEASURED",
  figures: [],
  declared_vs_observed: { summary: null, rows: [] },
  signature: { state: "VALID" },
  corrections: [],
  sources: [],
  verify_url: `${O}/verify-server?url=${encodeURIComponent(SUBJ)}`,
};

describe("install constants", () => {
  it("match client/src/data/gspcInstall.ts, the /connect-gspc source of truth", () => {
    expect([MCP_FREE_URL, STDIO_CMD, OPENAPI_URL]).toEqual([INSTALL.MCP_FREE_URL, INSTALL.STDIO_CMD, INSTALL.OPENAPI_URL]);
  });
});

describe("intent", () => {
  it.each([
    ["is this MCP server safe to use?", "safety"],
    ["explain this evidence", "ask"],
    ["connect GSPC to my project", "connect"],
    ["watch it monthly", "watch"],
    ["please re-check this every month", "watch"],
  ])("%s -> %s", (q, i) => expect(askIntent(q)).toBe(i));
  it("adds the subject only when the question names none", () => {
    expect(routedQuestion("explain this evidence", SUBJ)).toBe(`explain this evidence ${SUBJ}`);
    expect(routedQuestion("what about https://x.example/mcp", SUBJ)).toBe("what about https://x.example/mcp");
  });
});

describe("grounded answers (recorded POST /api/agui/run)", () => {
  it("explain: answer with citations, attribution and verify link on the answer itself", async () => {
    const { fetchFn } = replayFetch();
    const a = await askGspc("explain this evidence", { subject: SUBJ, origin: O, fetchFn: withFrontendTools(fetchFn) });
    expect(a.grounded).toBe(true);
    expect(a.citations.map((c) => c.tool)).toContain("server_evidence");
    const tree = viewTree(model, { ask: { question: "explain this evidence", answer: a, log: [], runner: "idle" } });
    const ans = textOf(region(tree, "ask"));
    expect(ans).toContain("Evidence by GSPC · Council of AI");
    expect(ans).toContain("Verify");
  });

  it("safe to use?: no verdict — the reply opens by saying GSPC does not rate safety", async () => {
    const { fetchFn } = replayFetch();
    const a = await askGspc("is this MCP server safe to use?", { subject: SUBJ, origin: O, fetchFn });
    expect(a.preface).toMatch(/does not say whether anything is safe/);
    const text = textOf(viewTree(model, { ask: { answer: a, log: [], runner: "idle" } }));
    // A verdict would be a sentence that says the subject IS safe or unsafe; the preface itself
    // contains "safe to use", so the guard reads the claim, not the phrase.
    expect(text).not.toMatch(/\b(it|this( MCP)? server|the server) is (safe|unsafe|secure|insecure)\b|\b(certified|compliant)\b/i);
  });

  it("a question no tool answers is shown as ungrounded, with no answer asserted and no attribution on it", async () => {
    const { fetchFn } = replayFetch();
    const a = await askGspc("what is the weather in Paris", { subject: "", origin: O, fetchFn });
    expect(a.grounded).toBe(false);
    const ask = region(viewTree(model, { ask: { answer: a, log: [], runner: "idle" } }), "ask");
    expect(textOf(ask)).toContain("No signed record answered this question");
    expect(JSON.stringify(ask)).not.toContain("data-attribution-line");
  });

  it("connect: exact steps from the published install constants", () => {
    const a = connectAnswer(SUBJ);
    const codes = a.steps.map((s) => s.code).join("\n");
    expect(codes).toContain("https://councilof.ai/mcp/free");
    expect(codes).toContain("npx -y csoai-gspc-mcp");
    expect(codes).toContain("helm upgrade -i gspc-evidence");
    expect(codes).toContain("pip install -e packages/llama-stack-provider-csoai");
  });

  it("declares the frontend tools in RunAgentInput.tools without changing anything else", async () => {
    let sent;
    const f = withFrontendTools(async (_u, init) => {
      sent = JSON.parse(init.body);
      return new Response("");
    });
    await f(`${O}/api/agui/run`, { method: "POST", body: JSON.stringify({ messages: [{ role: "user", content: "x" }] }) });
    expect(sent.tools.map((t) => t.name)).toEqual(FRONTEND_TOOLS.map((t) => t.name));
    expect(sent.messages[0].content).toBe("x");
    expect(sent.forwardedProps).toBeUndefined(); // the panel never confirms a paid tool
  });
});

describe("watch it monthly: confirm first, then a logged request", () => {
  it("the plan fills the form and stops at confirm; nothing is sent by the plan", async () => {
    const { fetchFn, calls } = replayFetch();
    const a = await askGspc("watch it monthly", { subject: SUBJ, origin: O, fetchFn });
    expect(a.kind).toBe("confirm");
    expect(calls).toEqual([]);
    const plan = planActions(null, { intent: "watch", subject: SUBJ });
    expect(plan.map((p) => p.tool)).toEqual(["fill_watch_form", "pause_at_confirm"]);
  });

  it("after confirm the request reaches /api/claims/watch-request and comes back RECEIVED_FOR_REVIEW", async () => {
    const kv = new Map();
    const fetchFn = async (url, init) => watchHandler({ request: new Request(url, init), env: { LEADS: { put: async (k, v) => kv.set(k, v) } } });
    const r = await requestWatch(SUBJ, { origin: O, fetchFn });
    expect(r.state).toBe("RECEIVED_FOR_REVIEW");
    expect(r.request_id).toMatch(/^wr-/);
    expect(kv.size).toBe(1);
  });
});

describe("ActionRunner: visible steps, stop, undo, take over", () => {
  const noSleep = () => Promise.resolve();
  it("plays in order, logs each step, pauses at confirm", async () => {
    const applied = [];
    const r = new ActionRunner({ apply: async (a) => (applied.push(a.tool), () => applied.push(`undo ${a.tool}`)), sleep: noSleep });
    await r.play([
      { tool: "open_subject", args: { subject: SUBJ }, source: "panel" },
      { tool: "highlight_evidence", args: { region: "dvo" }, source: "panel" },
      { tool: "pause_at_confirm", args: {}, source: "panel" },
      { tool: "highlight_evidence", args: { region: "signature" }, source: "panel" },
    ]);
    expect(applied).toEqual(["open_subject", "highlight_evidence"]);
    expect(r.state).toBe("paused");
    expect(r.log.map((e) => e.status)).toEqual(["done", "done", "waiting for confirm"]);
    await r.undo();
    expect(applied.at(-1)).toBe("undo highlight_evidence");
  });

  it("stop halts the queue mid-play; take over hands control back", async () => {
    let release;
    const gate = new Promise((res) => (release = res));
    const applied = [];
    const r = new ActionRunner({ apply: async (a) => applied.push(a.tool), sleep: () => gate });
    const p = r.play([{ tool: "open_subject", args: { subject: SUBJ } }, { tool: "highlight_evidence", args: { region: "dvo" } }]);
    r.stop();
    release();
    await p;
    expect(applied).toEqual([]);
    r.takeOver();
    expect(r.state).toBe("taken_over");
    expect(r.log.at(-1).tool).toBe("take_over");
  });

  it("drops actions that are not panel tools (the panel never acts outside itself)", () => {
    const run = { tools: [{ name: "navigate_host", argsText: '{"url":"https://console.example/delete"}', status: "done" }, { name: "highlight_evidence", argsText: '{"region":"signature"}', status: "done" }] };
    expect(planActions(run, { intent: "ask", subject: SUBJ })).toEqual([{ tool: "highlight_evidence", args: { region: "signature" }, source: "assistant" }]);
  });

  it("connectors are listed read-only and never leave the panel", () => {
    const cfg = normalizeConfig({ connectors: { projectId: "p1", mcpServers: [SUBJ, "https://mcp.acme.example/mcp"] } });
    const t = textOf(region(viewTree(model, { config: cfg }), "connectors"));
    expect(t).toContain("read-only");
    expect(t).toContain("https://mcp.acme.example/mcp");
  });
});
