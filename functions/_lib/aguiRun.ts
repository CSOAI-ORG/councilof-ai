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
 */
import { executePlan, routeIntent, ROUTABLE_TOOLS, type Plan } from "./talkRouter";
import PAID_TOOLS from "../mcp/paid-tools.json";

type Json = Record<string, unknown>;

const PAID = new Set<string>((PAID_TOOLS as { tools: { name: string }[] }).tools.map((t) => t.name));

export const AGUI_EVENT_TYPES = [
  "RUN_STARTED",
  "TOOL_CALL_START",
  "TOOL_CALL_ARGS",
  "TOOL_CALL_END",
  "TOOL_CALL_RESULT",
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
  const question = lastUserText(body);

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
      if (!question.trim()) {
        await emit({ type: "RUN_ERROR", message: "no user message: send messages:[{role:'user', content:'...'}]", code: "NO_MESSAGE" });
        onState?.("error");
        return;
      }
      const plan = routeIntent(question);
      const paid = paidToolsIn(plan);
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
        await emit({ type: "RUN_FINISHED", threadId, runId, result: { awaiting_confirmation: true, tools: paid } });
        onState?.("confirm_required");
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
        }
      });
      await say(answer.answer);
      await emit({
        type: "RUN_FINISHED",
        threadId,
        runId,
        result: { grounded: answer.grounded, intent: answer.intent, label: answer.label, answered_by: answer.answered_by, citations: answer.citations },
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
