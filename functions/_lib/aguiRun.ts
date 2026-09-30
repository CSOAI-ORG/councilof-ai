/**
 * AG-UI run endpoint served in-process (POST /api/agui/run, also POST /api/agui/).
 *
 * Until 2026-09-29 every /api/agui/* path except gspc-state proxied to AGUI_WIRE_URL, which was
 * never set, so a client got 503 agui_wire_unconfigured. This module is the backend: it takes an
 * AG-UI RunAgentInput ({threadId, runId, messages, forwardedProps}), routes the last user message
 * through the shared deterministic router (functions/_lib/talkRouter.ts — the same one /api/chat
 * and the A2A text path use) and streams AG-UI events as Server-Sent Events:
 *
 *   RUN_STARTED → (TOOL_CALL_START → TOOL_CALL_ARGS → TOOL_CALL_END → TOOL_CALL_RESULT)* →
 *   TEXT_MESSAGE_START → TEXT_MESSAGE_CONTENT+ → TEXT_MESSAGE_END → RUN_FINISHED   (or RUN_ERROR)
 *
 * CONFIRM BEFORE ANY PAID ACTION. A plan that includes a paid (x402) tool is NOT executed until the
 * client sends an explicit confirmation: forwardedProps.confirm = { tool: "<that tool name>" }.
 * Without it the run emits a CUSTOM "confirm_required" event naming the tool and arguments, a text
 * message saying nothing was called, and RUN_FINISHED with result.awaiting_confirmation = true.
 * Even when confirmed the router strips x_payment, so the call can only return the tool's 402
 * challenge: payment always comes from the caller's own wallet, never from this server.
 *
 * WATCH MODE (frontend tools, 30 Sep 2026). A browser that declares AG-UI frontend tools in
 * RunAgentInput.tools (navigate, openSubject, setFilter, highlight, fillForm, openPanel, runVerify,
 * scroll, focus; see ./uiTools.ts) AND sends forwardedProps.consent = { watch: true } gets the page
 * moves as TOOL_CALL_START/ARGS/END events it runs itself, with the plan as STATE_SNAPSHOT and its
 * progress as STATE_DELTA under /watch. The plan is keyword and entity matching (planUi); no model
 * chooses a step. Without consent the run says consent_required and moves nothing. A step whose
 * effect is commit, pay or schedule carries confirm: true and the browser stops at a visible
 * Confirm before it. The same events reach a headless agent that declares the same tools; the
 * browser still executes nothing unless the viewer switched watch on in that tab.
 * forwardedProps.page ({path, subject, subjectKind, tab}) lets "this" mean the page's subject.
 */
import { a2uiForTool } from "./a2uiSurfaces";
import { executePlan, extractAxis, routeIntent, ROUTABLE_TOOLS, type Plan } from "./talkRouter";
import { FRONTEND_TOOLS, FRONTEND_TOOL_NAMES, planUi, readPageContext, withPageSubject, type UiPlan } from "./uiTools";
import PAID_TOOLS from "../mcp/paid-tools.json";

type Json = Record<string, unknown>;

const PAID = new Set<string>((PAID_TOOLS as { tools: { name: string }[] }).tools.map((t) => t.name));

export const AGUI_EVENT_TYPES = [
  "RUN_STARTED",
  "TOOL_CALL_START",
  "TOOL_CALL_ARGS",
  "TOOL_CALL_END",
  "TOOL_CALL_RESULT",
  "STATE_SNAPSHOT",
  "STATE_DELTA",
  "TEXT_MESSAGE_START",
  "TEXT_MESSAGE_CONTENT",
  "TEXT_MESSAGE_END",
  "CUSTOM",
  "RUN_FINISHED",
  "RUN_ERROR",
] as const;

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "accept, content-type",
};

const rec = (v: unknown): Json | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null);

/** Text of one AG-UI message: a string content, or the text parts of an array content. */
function messageText(m: Json): string {
  const c = m.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c))
    return c
      .map((p) => (rec(p) && typeof (p as Json).text === "string" ? String((p as Json).text) : ""))
      .join(" ")
      .trim();
  return "";
}

export function lastUserText(body: Json): string {
  if (typeof body.message === "string") return body.message;
  const msgs = Array.isArray(body.messages) ? (body.messages as unknown[]) : [];
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = rec(msgs[i]);
    if (m && m.role === "user") return messageText(m);
  }
  return "";
}

/** The frontend tools the caller declared in RunAgentInput.tools that watch mode knows. */
export function declaredFrontendTools(body: Json): Set<string> {
  const out = new Set<string>();
  for (const t of Array.isArray(body.tools) ? (body.tools as unknown[]) : []) {
    const name = rec(t)?.name;
    if (typeof name === "string" && FRONTEND_TOOL_NAMES.has(name)) out.add(name);
  }
  return out;
}

/** Watch consent: forwardedProps.consent.watch === true, nothing weaker. */
export function watchConsented(body: Json): boolean {
  return rec(rec(body.forwardedProps)?.consent)?.watch === true;
}

/** Frontend tool results a client sent back ({role:"tool", toolCallId, content}) after the last user message. */
export function frontendResults(body: Json): { toolCallId: string; ok: boolean }[] {
  const msgs = Array.isArray(body.messages) ? (body.messages as unknown[]) : [];
  const out: { toolCallId: string; ok: boolean }[] = [];
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = rec(msgs[i]);
    if (!m) continue;
    if (m.role === "user") break;
    if (m.role === "tool" && typeof m.toolCallId === "string" && m.toolCallId.startsWith("ui_"))
      out.unshift({ toolCallId: m.toolCallId, ok: !m.error });
  }
  return out;
}

export function paidToolsIn(plan: Plan): string[] {
  return plan.kind === "tools" ? plan.calls.map((c) => c.tool).filter((t) => PAID.has(t)) : [];
}

/** The explicit confirm event: forwardedProps.confirm.tool must name every paid tool in the plan. */
export function isConfirmed(body: Json, paidTools: string[]): boolean {
  if (!paidTools.length) return true;
  const confirm = rec(rec(body.forwardedProps)?.confirm);
  const tools = new Set<string>();
  if (typeof confirm?.tool === "string") tools.add(confirm.tool);
  if (Array.isArray(confirm?.tools)) for (const t of confirm!.tools as unknown[]) if (typeof t === "string") tools.add(t);
  return paidTools.every((t) => tools.has(t));
}

function chunks(s: string, n = 240): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n));
  return out.length ? out : [""];
}

export function aguiDescriptor(origin: string): Json {
  return {
    schema: "csoai.agui-run/0.1",
    endpoint: `${origin}/api/agui/run`,
    method: "POST",
    input: "AG-UI RunAgentInput: {threadId?, runId?, messages:[{role:'user', content}], forwardedProps?}. A bare {message} is also accepted.",
    events: [...AGUI_EVENT_TYPES],
    router: "deterministic keyword/entity routing onto the POST /mcp tools; no model in the path",
    tools: [...ROUTABLE_TOOLS],
    frontend_tools: {
      declare: "RunAgentInput.tools: the AG-UI Tool definitions below. Only declared tools are called.",
      consent: "forwardedProps.consent = {watch: true}. Without it a run that would move the page emits CUSTOM consent_required and calls no frontend tool.",
      page: "forwardedProps.page = {path, title, subject, subjectKind: card|server|axis, tab}. A question about 'this' is answered about page.subject.",
      state: "STATE_SNAPSHOT {watch:{intent, status, steps[]}} then STATE_DELTA (RFC 6902) as steps are handed over or reported back.",
      results: "Return each result as {role:'tool', toolCallId:'ui_n', content} in the next run; the run records it in /watch and calls nothing else.",
      confirm: "Steps with effect commit, pay or schedule carry confirm:true. A client must stop at a visible Confirm; no step pays, signs or submits.",
      planner: "deterministic keyword and entity matching (functions/_lib/uiTools.ts planUi); no model",
      tools: FRONTEND_TOOLS,
    },
    confirm: "A paid (x402) tool runs only when forwardedProps.confirm = {tool:'<name>'} names it; even then no payment is made — the tool answers with its 402 challenge and payment comes from the caller's own wallet.",
    also: { state_stream: `${origin}/api/agui/gspc-state`, chat: `${origin}/api/chat`, mcp: `${origin}/mcp` },
    note: "Measurement, not certification. Every number in a run is a field of a named tool's output.",
  };
}

export async function serveAguiRun(
  request: Request,
  waitUntil?: (p: Promise<unknown>) => void,
  /** Aggregate usage hook: called once per run with its end state (no text). */
  onState?: (state: "grounded" | "unknown" | "needs_input" | "confirm_required" | "error") => void,
): Promise<Response> {
  const origin = new URL(request.url).origin;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method === "GET" || request.method === "HEAD")
    return Response.json(aguiDescriptor(origin), { headers: { ...CORS, "cache-control": "no-store" } });
  if (request.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405, headers: CORS });

  let body: Json = {};
  try {
    body = rec(await request.json()) ?? {};
  } catch {
    body = {};
  }
  const threadId = typeof body.threadId === "string" && body.threadId ? body.threadId : crypto.randomUUID();
  const runId = typeof body.runId === "string" && body.runId ? body.runId : crypto.randomUUID();
  const page = readPageContext(rec(body.forwardedProps)?.page);
  const question = withPageSubject(lastUserText(body), page);
  const declared = declaredFrontendTools(body);
  const returned = frontendResults(body);

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  const emit = (ev: Json) =>
    writer.write(enc.encode(`event: ${ev.type}\ndata: ${JSON.stringify({ ...ev, timestamp: Date.now() })}\n\n`));

  const say = async (text: string) => {
    const messageId = crypto.randomUUID();
    await emit({ type: "TEXT_MESSAGE_START", messageId, role: "assistant" });
    for (const delta of chunks(text)) await emit({ type: "TEXT_MESSAGE_CONTENT", messageId, delta });
    await emit({ type: "TEXT_MESSAGE_END", messageId });
  };

  const run = (async () => {
    try {
      await emit({ type: "RUN_STARTED", threadId, runId });
      // A client reporting frontend-tool results: record them in /watch, call nothing else.
      if (returned.length) {
        await emit({
          type: "STATE_DELTA",
          delta: [
            { op: "add", path: "/watch/reported", value: returned },
            { op: "replace", path: "/watch/status", value: returned.every((r) => r.ok) ? "done" : "done_with_errors" },
          ],
        });
        await emit({ type: "RUN_FINISHED", threadId, runId, result: { grounded: false, frontend_results: returned.length } });
        onState?.("grounded");
        return;
      }
      if (!question.trim()) {
        await emit({ type: "RUN_ERROR", message: "no user message: send messages:[{role:'user', content:'...'}]", code: "NO_MESSAGE" });
        onState?.("error");
        return;
      }
      const plan = routeIntent(question);
      const paid = paidToolsIn(plan);

      // Watch mode: the page moves, planned deterministically, only for declared tools and consent.
      let ui: UiPlan | null = null;
      if (declared.size) {
        const planned = planUi(question, page, { axis: extractAxis(question), watch: rec(body.forwardedProps)?.mode === "watch" });
        if (planned) {
          const steps = planned.steps.filter((s) => declared.has(s.tool));
          if (steps.length) ui = { intent: planned.intent, steps };
        }
      }
      const uiIds: string[] = [];
      if (ui && !watchConsented(body)) {
        await emit({
          type: "CUSTOM",
          name: "consent_required",
          value: {
            scope: "watch",
            intent: ui.intent,
            steps: ui.steps.length,
            how: "Re-send with forwardedProps.consent = {watch: true} once the viewer has switched watch on.",
          },
        });
        ui = null;
      } else if (ui) {
        await emit({
          type: "STATE_SNAPSHOT",
          snapshot: {
            watch: {
              intent: ui.intent,
              status: "planned",
              planner: "deterministic (uiTools.planUi); no model",
              steps: ui.steps.map((s) => ({ id: s.id, tool: s.tool, say: s.say, effect: s.effect, confirm: s.confirm, status: "pending" })),
            },
          },
        });
        const parent = crypto.randomUUID();
        for (const s of ui.steps) {
          await emit({ type: "TOOL_CALL_START", toolCallId: s.id, toolCallName: s.tool, parentMessageId: parent });
          await emit({ type: "TOOL_CALL_ARGS", toolCallId: s.id, delta: JSON.stringify({ ...s.args, say: s.say, effect: s.effect, confirm: s.confirm }) });
          await emit({ type: "TOOL_CALL_END", toolCallId: s.id });
          uiIds.push(s.id);
        }
        await emit({ type: "STATE_DELTA", delta: [{ op: "replace", path: "/watch/status", value: "handed_to_client" }] });
      }
      const uiResult = ui ? { watch: { intent: ui.intent, steps: uiIds.length }, frontend_tool_calls: uiIds } : {};
      if (plan.kind === "tools" && paid.length && !isConfirmed(body, paid)) {
        const pending = plan.calls.filter((c) => PAID.has(c.tool)).map((c) => ({ tool: c.tool, args: c.args }));
        await emit({
          type: "CUSTOM",
          name: "confirm_required",
          value: {
            tools: pending,
            how: "Re-send the run with forwardedProps.confirm = {tool:'<name>'} to call it.",
            effect: "Confirmed, the tool returns its x402 402 challenge. Nothing is paid by this server; payment comes from your own wallet.",
          },
        });
        await say(
          `\`${paid.join("`, `")}\` is a paid (x402) tool. I have not called it. Confirm to fetch its 402 challenge; ` +
            `payment, if you choose to make it, comes from your own wallet — this assistant never pays.`,
        );
        await emit({ type: "RUN_FINISHED", threadId, runId, result: { awaiting_confirmation: true, tools: paid, ...uiResult } });
        onState?.("confirm_required");
        return;
      }
      if (ui && plan.kind !== "tools") {
        // The page moved; no data tool matched. Say so: nothing measured is quoted.
        await say(
          `I moved the page: ${ui.intent} (${ui.steps.length} step${ui.steps.length === 1 ? "" : "s"}). ` +
            "No signed record was read for this question, so I give no number: not measured by this answer.",
        );
        await emit({ type: "RUN_FINISHED", threadId, runId, result: { grounded: false, intent: ui.intent, label: "NAVIGATION", answered_by: "ui planner (deterministic)", citations: [], ...uiResult } });
        onState?.("unknown");
        return;
      }
      const parentMessageId = crypto.randomUUID();
      const answer = await executePlan(plan, origin, async (e) => {
        if (e.phase === "start") {
          await emit({ type: "TOOL_CALL_START", toolCallId: e.id, toolCallName: e.call.tool, parentMessageId });
          const shown: Json = {};
          for (const [k, v] of Object.entries(e.call.args)) if (!k.startsWith("_")) shown[k] = v;
          await emit({ type: "TOOL_CALL_ARGS", toolCallId: e.id, delta: JSON.stringify(shown) });
          await emit({ type: "TOOL_CALL_END", toolCallId: e.id });
        } else if (e.outcome) {
          await emit({
            type: "TOOL_CALL_RESULT",
            messageId: crypto.randomUUID(),
            toolCallId: e.id,
            role: "tool",
            content: JSON.stringify({
              tool: e.outcome.tool,
              args: e.outcome.args,
              label: e.outcome.label,
              summary: e.outcome.summary,
              citation: e.outcome.citation,
              output: e.outcome.output,
            }),
          });
          // A2UI v0.9.1 rendering of the same output (board card, verify result). CUSTOM is the AG-UI
          // extension event; clients that do not render A2UI ignore it.
          const a2ui = a2uiForTool(e.outcome.tool, e.outcome.output);
          if (a2ui) await emit({ type: "CUSTOM", name: "a2ui", value: a2ui });
        }
      });
      await say(answer.answer);
      await emit({
        type: "RUN_FINISHED",
        threadId,
        runId,
        result: { grounded: answer.grounded, intent: answer.intent, label: answer.label, answered_by: answer.answered_by, citations: answer.citations, ...uiResult },
      });
      onState?.(answer.grounded ? "grounded" : answer.kind === "needs_input" ? "needs_input" : "unknown");
    } catch (e) {
      await emit({ type: "RUN_ERROR", message: e instanceof Error ? e.message : String(e), code: "RUN_FAILED" }).catch(() => undefined);
      onState?.("error");
    } finally {
      await writer.close().catch(() => undefined);
    }
  })();
  waitUntil?.(run);

  return new Response(readable, {
    status: 200,
    headers: {
      ...CORS,
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
      "x-csoai-agui": "run",
    },
  });
}
