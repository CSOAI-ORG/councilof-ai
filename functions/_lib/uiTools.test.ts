import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { FRONTEND_TOOLS, MAX_STEPS, planUi, readPageContext, withPageSubject } from "./uiTools";
import { serveAguiRun } from "./aguiRun";
import PAID_TOOLS from "../mcp/paid-tools.json";
import ToolRunner, { type RunnerTool } from "../../client/src/components/ToolRunner";

const HEX = "cd".repeat(32);
const ORIGIN = "https://councilof.ai";

const BOARD = {
  totals: { axes: 23, measured_axes: 23, unmeasured_axes: 0, public_count: "23 axis · 23 measured" },
  axes: [{ axis: "safety", family: "gspc", status: "MEASURED", n: 36, accuracy: 0.9444, kind: "model-comparison" }],
  measured_on: {},
};

function stubOrigin() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const req = input instanceof Request ? input : new Request(String(input), init);
      return new URL(req.url).pathname === "/api/gspc" ? Response.json(BOARD) : new Response("not found", { status: 404 });
    }),
  );
}
afterEach(() => vi.unstubAllGlobals());

async function run(body: Record<string, unknown>) {
  const res = await serveAguiRun(new Request(`${ORIGIN}/api/agui/run`, { method: "POST", body: JSON.stringify(body) }));
  const text = await res.text();
  return text
    .split("\n\n")
    .map((b) => b.split("\n").find((l) => l.startsWith("data: ")))
    .filter((l): l is string => !!l)
    .map((l) => JSON.parse(l.slice(6)) as { type: string; [k: string]: unknown });
}

const ALL_TOOLS = FRONTEND_TOOLS.map((t) => ({ name: t.name, description: t.description, parameters: t.parameters }));

describe("planUi — deterministic page moves, never a number", () => {
  it("does nothing for a plain data question", () => {
    expect(planUi("what does the board say")).toBeNull();
  });
  it("an axis becomes board → filter → highlight", () => {
    const p = planUi("show me safety", {}, { axis: "safety" })!;
    expect(p.steps.map((s) => s.tool)).toEqual(["openPanel", "setFilter", "highlight"]);
    expect(p.steps[1].args).toEqual({ key: "axis", value: "safety" });
  });
  it("a card id opens, re-checks and points at the result", () => {
    const p = planUi(`open ${HEX}`)!;
    expect(p.steps.map((s) => s.tool)).toEqual(["openSubject", "runVerify", "highlight"]);
    expect(p.steps.every((s) => !s.confirm)).toBe(true);
  });
  it("'this' on a server page means the page's server", () => {
    const p = planUi("re-check this", { subject: "https://example.com/mcp", subjectKind: "server" })!;
    expect(p.steps[0]).toMatchObject({ tool: "openSubject", args: { kind: "server", id: "https://example.com/mcp" } });
  });
  it("a paid ask stops at a Confirm step and never submits", () => {
    const p = planUi("commission a card for https://example.com/mcp")!;
    const last = p.steps.at(-1)!;
    expect(last).toMatchObject({ effect: "pay", confirm: true });
    expect(p.steps.some((s) => /submit/i.test(s.tool))).toBe(false);
  });
  it("a schedule ask stops at a Confirm step", () => {
    const p = planUi("watch this server and re-check it monthly", { subject: "https://example.com/mcp", subjectKind: "server" })!;
    expect(p.steps.some((s) => s.effect === "schedule" && s.confirm)).toBe(true);
  });
  it("a tour is bounded", () => {
    const p = planUi("walk me through it")!;
    expect(p.steps.length).toBeGreaterThan(2);
    expect(p.steps.length).toBeLessThanOrEqual(MAX_STEPS);
  });
  it("names a destination", () => {
    expect(planUi("take me to connect")!.steps[0]).toMatchObject({ tool: "navigate", args: { path: "/connect/" } });
  });
  it("withPageSubject appends the subject only for deictic questions", () => {
    expect(withPageSubject("verify this", { subject: HEX })).toBe(`verify this ${HEX}`);
    expect(withPageSubject("what does the board say", { subject: HEX })).toBe("what does the board say");
  });
  // Tools audit, 6 Oct 2026: the paid-ask plan named form[data-ui-form='request'] and
  // [data-ui-action='request-submit'], and neither existed in the client, so watch mode said
  // "Typing … as the subject" and typed nothing. Render the real runner for commission_card (its
  // schema from paid-tools.json, as tools/list serves it) and look for every selector the plan names.
  it("every selector the paid-ask plan names exists on the rendered request form", () => {
    const tool = (PAID_TOOLS as { tools: RunnerTool[] }).tools.find((t) => t.name === "commission_card")!;
    expect(tool).toBeDefined();
    const html = renderToStaticMarkup(
      createElement(ToolRunner, { catalogue: [tool], initialToolName: "commission_card", initialArguments: { subject: "https://example.com/mcp" } }),
    );
    const p = planUi("commission a card for https://example.com/mcp")!;
    const selectors = p.steps.map((s) => s.args.selector).filter((x): x is string => typeof x === "string");
    expect(selectors.length).toBeGreaterThanOrEqual(2);
    for (const sel of selectors) {
      for (const [, attr, value] of sel.matchAll(/\[([a-z-]+)='([^']+)'\]/g)) expect(html, sel).toContain(`${attr}="${value}"`);
      if (sel.startsWith("form")) expect(html).toMatch(/<form[^>]*data-ui-form="request"/);
    }
    const fill = p.steps.find((s) => s.tool === "fillForm")!;
    for (const name of Object.keys(fill.args.values as Record<string, unknown>)) expect(html).toContain(`data-ui-field="${name}"`);
    // The highlighted control is the submit button itself, and nothing here submits it.
    expect(html).toMatch(/<button type="submit"[^>]*data-ui-action="request-submit"/);
  });

  it("readPageContext bounds and type-checks", () => {
    expect(readPageContext({ path: "/x", subjectKind: "bogus", headings: [1, "a"] })).toMatchObject({ path: "/x", subjectKind: null, headings: ["a"] });
  });
});

describe("AG-UI watch mode — frontend tools, consent, STATE_SNAPSHOT / STATE_DELTA", () => {
  it("without consent: consent_required, no frontend tool call", async () => {
    stubOrigin();
    const ev = await run({ messages: [{ role: "user", content: "take me to connect" }], tools: ALL_TOOLS });
    expect(ev.find((e) => e.type === "CUSTOM" && e.name === "consent_required")).toBeTruthy();
    expect(ev.some((e) => e.type === "TOOL_CALL_START" && e.toolCallName === "navigate")).toBe(false);
  });
  it("undeclared tools are never called", async () => {
    stubOrigin();
    const ev = await run({ messages: [{ role: "user", content: "take me to connect" }], forwardedProps: { consent: { watch: true } } });
    expect(ev.some((e) => e.type === "TOOL_CALL_START")).toBe(false);
    expect(ev.some((e) => e.type === "STATE_SNAPSHOT")).toBe(false);
  });
  it("with consent: snapshot, frontend calls, delta, and an honest not-measured answer", async () => {
    stubOrigin();
    const ev = await run({ messages: [{ role: "user", content: "take me to connect" }], tools: ALL_TOOLS, forwardedProps: { consent: { watch: true } } });
    const snap = ev.find((e) => e.type === "STATE_SNAPSHOT") as { snapshot: { watch: { steps: unknown[] } } };
    expect(snap.snapshot.watch.steps.length).toBe(2);
    expect(ev.find((e) => e.type === "TOOL_CALL_START")).toMatchObject({ toolCallName: "navigate", toolCallId: "ui_1" });
    expect(ev.find((e) => e.type === "STATE_DELTA")).toMatchObject({ delta: [{ op: "replace", path: "/watch/status", value: "handed_to_client" }] });
    const text = ev.filter((e) => e.type === "TEXT_MESSAGE_CONTENT").map((e) => e.delta).join("");
    expect(text).toMatch(/not measured/);
    expect(ev.at(-1)).toMatchObject({ type: "RUN_FINISHED", result: { grounded: false, label: "NAVIGATION" } });
  });
  it("a data question with an axis answers from the tool AND moves the page", async () => {
    stubOrigin();
    const ev = await run({ messages: [{ role: "user", content: "show me safety" }], tools: ALL_TOOLS, forwardedProps: { consent: { watch: true } } });
    const names = ev.filter((e) => e.type === "TOOL_CALL_START").map((e) => e.toolCallName);
    expect(names).toEqual(["openPanel", "setFilter", "highlight", "get_axis"]);
    expect(ev.at(-1)).toMatchObject({ type: "RUN_FINISHED", result: { grounded: true, answered_by: "tool:get_axis" } });
  });
  it("frontend results come back as tool messages and are recorded, nothing else is called", async () => {
    stubOrigin();
    const ev = await run({
      messages: [
        { role: "user", content: "take me to connect" },
        { role: "tool", toolCallId: "ui_1", content: "ok" },
        { role: "tool", toolCallId: "ui_2", content: "ok" },
      ],
      tools: ALL_TOOLS,
    });
    expect(ev.find((e) => e.type === "STATE_DELTA")).toMatchObject({ delta: [{ op: "add", path: "/watch/reported" }, { op: "replace", value: "done" }] });
    expect(ev.some((e) => e.type === "TOOL_CALL_START")).toBe(false);
  });
  it("page context answers 'this' about the page subject", async () => {
    stubOrigin();
    const ev = await run({ messages: [{ role: "user", content: "how did this measure" }], forwardedProps: { page: { subject: "safety", subjectKind: "axis" } } });
    expect(ev.find((e) => e.type === "TOOL_CALL_START")).toMatchObject({ toolCallName: "get_axis" });
  });
});
