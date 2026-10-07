/**
 * aguiTalk — the browser side of POST /api/agui/run (functions/_lib/aguiRun.ts).
 *
 * The run endpoint streams AG-UI events as Server-Sent Events. This module does three things and
 * nothing else:
 *   1. parseSse(buffer)   — split a text buffer into complete SSE events plus the unparsed rest,
 *                           so a chunk boundary in the middle of an event loses nothing;
 *   2. reduceRun(run, ev) — fold one AG-UI event into a TalkRun (tool cards, answer text, the
 *                           confirm_required request, the finish/error state);
 *   3. streamRun(...)     — POST the question, read the stream, call back on every event.
 *
 * NOTHING HERE PAYS OR SIGNS. A paid (x402) tool is only ever called when the caller passes an
 * explicit `confirmTool`, which the UI sets from a Confirm click. Even then the server strips
 * x_payment, so the call can only return the tool's 402 challenge; payment would come from the
 * reader's own wallet, outside this page. Labels are copied from the tool result, never computed.
 */

import { FRONTEND_TOOLS, FRONTEND_TOOL_NAMES, type FrontendToolName, type PageContext, type StepEffect } from "../../../functions/_lib/uiTools";

export type Json = Record<string, unknown>;

/** A frontend (watch-mode) tool call the run handed to the browser. Executed by lib/uiActions.ts. */
export type UiStepCall = {
  id: string;
  tool: FrontendToolName;
  argsText: string;
  args: Json;
  say: string;
  effect: StepEffect;
  confirm: boolean;
  ended: boolean;
};

export type Citation = { tool: string; record_id: string | null; url: string | null };

export type TalkToolCard = {
  id: string;
  name: string;
  /** The TOOL_CALL_ARGS deltas, concatenated as they arrived. */
  argsText: string;
  status: "running" | "done" | "cancelled";
  label?: string;
  summary?: string;
  citation?: Citation;
  output?: unknown;
  isError?: boolean;
  messageId?: string;
  parentMessageId?: string;
};

/** A failed read stays a failed read even if the server's run-level grounded flag is true. */
export function toolReadFailed(card: Pick<TalkToolCard, "label" | "output" | "isError">): boolean {
  const output = card.output && typeof card.output === "object" && !Array.isArray(card.output)
    ? card.output as Record<string, unknown> : null;
  return /^(UNREACHABLE|UNAVAILABLE|ERROR|FAILED)\b/i.test(card.label ?? "") ||
    card.isError === true || output?.is_error === true || output?.isError === true;
}

export type ConfirmRequest = {
  tools: { tool: string; args: Json }[];
  how?: string;
  effect?: string;
};

/** The session-history question stays bound even if the server returns different IDs. */
export type TalkOrigin = { threadId: string; userMessageId: string };

export type TalkRun = {
  /** Stable browser key; server IDs below never change this key. */
  id: string;
  origin?: TalkOrigin;
  threadId?: string;
  runId?: string;
  userMessageId?: string;
  messageId?: string;
  question: string;
  status: "streaming" | "done" | "error" | "awaiting_confirmation" | "cancelled";
  tools: TalkToolCard[];
  text: string;
  confirm: ConfirmRequest | null;
  error?: string;
  result?: Json;
  /** Frontend tool calls (watch mode), in the order the run sent them. */
  ui: UiStepCall[];
  /** AG-UI shared state: STATE_SNAPSHOT replaces it, STATE_DELTA patches it. */
  state: Json;
  /** Set when the run would move the page but watch consent was not sent. */
  consentRequired: { intent: string; steps: number } | null;
};

export type SseEvent = { event: string | null; data: Json };

const rec = (v: unknown): Json | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null);
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

/** Split complete SSE events off the front of `buffer`. Incomplete trailing text is returned as `rest`. */
export function parseSse(buffer: string): { events: SseEvent[]; rest: string } {
  const norm = buffer.replace(/\r\n/g, "\n");
  const events: SseEvent[] = [];
  let rest = norm;
  let cut: number;
  while ((cut = rest.indexOf("\n\n")) >= 0) {
    const block = rest.slice(0, cut);
    rest = rest.slice(cut + 2);
    let event: string | null = null;
    const data: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
    }
    if (!data.length) continue;
    try {
      const parsed = rec(JSON.parse(data.join("\n")));
      if (parsed) events.push({ event, data: parsed });
    } catch {
      /* a malformed event is dropped, never guessed at */
    }
  }
  return { events, rest };
}

export function newRun(question: string, id: string): TalkRun {
  return { id, question, status: "streaming", tools: [], text: "", confirm: null, ui: [], state: {}, consentRequired: null };
}

/**
 * RFC 6902 JSON Patch, the subset AG-UI STATE_DELTA needs (add, replace, remove; "-" appends).
 * Pure: returns a new document. An operation on a path that does not exist is skipped, never
 * guessed at (the next STATE_SNAPSHOT resynchronises).
 */
export function applyPatch(doc: Json, ops: unknown): Json {
  const out = JSON.parse(JSON.stringify(doc ?? {})) as Json;
  for (const raw of Array.isArray(ops) ? ops : []) {
    const op = rec(raw);
    const path = str(op?.path);
    if (!op || path === null || !/^(add|replace|remove)$/.test(String(op.op))) continue;
    const keys = path.split("/").slice(1).map((k) => k.replace(/~1/g, "/").replace(/~0/g, "~"));
    if (!keys.length) continue;
    let node: unknown = out;
    let ok = true;
    for (const k of keys.slice(0, -1)) {
      const next = Array.isArray(node) ? node[Number(k)] : rec(node)?.[k];
      if (next === undefined || next === null || typeof next !== "object") {
        if (op.op === "add" && !Array.isArray(node) && rec(node)) {
          (node as Json)[k] = {};
          node = (node as Json)[k];
          continue;
        }
        ok = false;
        break;
      }
      node = next;
    }
    if (!ok) continue;
    const last = keys[keys.length - 1];
    if (Array.isArray(node)) {
      const i = last === "-" ? node.length : Number(last);
      if (!Number.isInteger(i) || i < 0 || i > node.length) continue;
      if (op.op === "remove") node.splice(i, 1);
      else if (op.op === "add") node.splice(i, 0, op.value);
      else if (i < node.length) node[i] = op.value;
    } else if (rec(node)) {
      const n = node as Json;
      if (op.op === "remove") delete n[last];
      else if (op.op === "replace" && !(last in n)) continue;
      else n[last] = op.value;
    }
  }
  return out;
}

function uiStepFrom(id: string, name: string, argsText: string, ended: boolean): UiStepCall {
  let args: Json = {};
  try {
    args = rec(JSON.parse(argsText || "{}")) ?? {};
  } catch {
    args = {};
  }
  const { say, effect, confirm, ...rest } = args;
  const eff = effect === "commit" || effect === "pay" || effect === "schedule" ? effect : "view";
  return {
    id,
    tool: name as FrontendToolName,
    argsText,
    args: rest,
    say: typeof say === "string" ? say : "",
    effect: eff,
    // A commit, pay or schedule step always stops at Confirm, whatever the flag says.
    confirm: confirm === true || eff !== "view",
    ended,
  };
}

/** Fold one AG-UI event into the run. Pure. Unknown event types leave the run unchanged. */
export function reduceRun(run: TalkRun, ev: Json): TalkRun {
  const type = str(ev.type);
  switch (type) {
    case "RUN_STARTED":
      return { ...run, threadId: str(ev.threadId) ?? run.threadId, runId: str(ev.runId) ?? run.runId };
    case "TEXT_MESSAGE_START":
      return { ...run, messageId: str(ev.messageId) ?? run.messageId };
    case "TOOL_CALL_START": {
      const name = str(ev.toolCallName) ?? "tool";
      if (FRONTEND_TOOL_NAMES.has(name)) {
        const id = str(ev.toolCallId) ?? `ui_${run.ui.length + 1}`;
        if (run.ui.some((u) => u.id === id)) return run;
        return { ...run, ui: [...run.ui, uiStepFrom(id, name, "", false)] };
      }
      const id = str(ev.toolCallId) ?? `call_${run.tools.length + 1}`;
      if (run.tools.some((t) => t.id === id)) return run;
      return { ...run, tools: [...run.tools, { id, name: str(ev.toolCallName) ?? "tool", argsText: "", status: "running", parentMessageId: str(ev.parentMessageId) ?? undefined }] };
    }
    case "TOOL_CALL_ARGS": {
      const id = str(ev.toolCallId);
      if (run.ui.some((u) => u.id === id))
        return { ...run, ui: run.ui.map((u) => (u.id === id ? uiStepFrom(u.id, u.tool, u.argsText + (str(ev.delta) ?? ""), false) : u)) };
      return { ...run, tools: run.tools.map((t) => (t.id === id ? { ...t, argsText: t.argsText + (str(ev.delta) ?? "") } : t)) };
    }
    case "TOOL_CALL_RESULT": {
      const id = str(ev.toolCallId);
      let body: Json = {};
      try {
        body = rec(JSON.parse(str(ev.content) ?? "{}")) ?? {};
      } catch {
        body = {};
      }
      const cit = rec(body.citation);
      const patch: Partial<TalkToolCard> = {
        status: "done",
        label: str(body.label) ?? undefined,
        summary: str(body.summary) ?? undefined,
        citation: cit
          ? { tool: str(cit.tool) ?? "", record_id: str(cit.record_id), url: str(cit.url) }
          : undefined,
        output: body.output,
        isError: body.is_error === true || ev.is_error === true,
        messageId: str(ev.messageId) ?? undefined,
      };
      // The server may have followed one sibling hop, so the result's own tool/args win.
      if (str(body.tool)) patch.name = str(body.tool)!;
      if (rec(body.args)) patch.argsText = JSON.stringify(body.args);
      const known = run.tools.some((t) => t.id === id);
      const tools = known
        ? run.tools.map((t) => (t.id === id ? { ...t, ...patch } : t))
        : [...run.tools, { id: id ?? `call_${run.tools.length + 1}`, name: patch.name ?? "tool", argsText: patch.argsText ?? "", ...patch, status: "done" as const }];
      return { ...run, tools };
    }
    case "TOOL_CALL_END": {
      const id = str(ev.toolCallId);
      if (!run.ui.some((u) => u.id === id)) return run;
      return { ...run, ui: run.ui.map((u) => (u.id === id ? uiStepFrom(u.id, u.tool, u.argsText, true) : u)) };
    }
    case "STATE_SNAPSHOT":
      return { ...run, state: rec(ev.snapshot) ?? {} };
    case "STATE_DELTA":
      return { ...run, state: applyPatch(run.state, ev.delta) };
    case "TEXT_MESSAGE_CONTENT":
      if (run.messageId && str(ev.messageId) && ev.messageId !== run.messageId) return run;
      return { ...run, text: run.text + (str(ev.delta) ?? "") };
    case "CUSTOM": {
      if (ev.name === "consent_required") {
        const v = rec(ev.value) ?? {};
        return { ...run, consentRequired: { intent: str(v.intent) ?? "move the page", steps: typeof v.steps === "number" ? v.steps : 0 } };
      }
      if (ev.name !== "confirm_required") return run;
      const v = rec(ev.value) ?? {};
      const tools = (Array.isArray(v.tools) ? v.tools : [])
        .map((t) => rec(t))
        .filter((t): t is Json => Boolean(t && typeof t.tool === "string"))
        .map((t) => ({ tool: String(t.tool), args: rec(t.args) ?? {} }));
      return { ...run, confirm: { tools, how: str(v.how) ?? undefined, effect: str(v.effect) ?? undefined } };
    }
    case "RUN_FINISHED": {
      const result = rec(ev.result) ?? undefined;
      const failed = run.status === "error" || run.tools.some(toolReadFailed);
      return { ...run, threadId: str(ev.threadId) ?? run.threadId, runId: str(ev.runId) ?? run.runId, result,
        status: failed ? "error" : result?.awaiting_confirmation ? "awaiting_confirmation" : "done",
        ...(failed ? { error: run.error ?? "one or more sources did not return a successful result" } : {}) };
    }
    case "RUN_ERROR":
      return { ...run, status: "error", error: str(ev.message) ?? "the run failed" };
    default:
      return run;
  }
}

/** Parsed call arguments for display; the raw text when it is not JSON. */
export function argsOf(card: Pick<TalkToolCard, "argsText">): Json | string {
  if (!card.argsText) return {};
  try {
    return rec(JSON.parse(card.argsText)) ?? card.argsText;
  } catch {
    return card.argsText;
  }
}

/**
 * The 402 challenge a paid tool returned, as the challenge states it. Only fields the payload
 * carries are returned; amounts stay in the challenge's own atomic units, never converted.
 */
export type Challenge = {
  resource: string | null;
  description: string | null;
  accepts: { scheme: string | null; network: string | null; asset: string | null; symbol: string | null; payTo: string | null; amountAtomic: string | null }[];
};

export function challengeOf(output: unknown): Challenge | null {
  const p = rec(output);
  if (!p || p.x402Version === undefined) return null;
  const res = rec(p.resource);
  const accepts = (Array.isArray(p.accepts) ? p.accepts : []).map((a) => {
    const r = rec(a) ?? {};
    return {
      scheme: str(r.scheme),
      network: str(r.network),
      asset: str(r.asset),
      symbol: str(rec(r.extra)?.symbol),
      payTo: str(r.payTo),
      amountAtomic: str(r.maxAmountRequired) ?? str(r.amount),
    };
  });
  return { resource: str(res?.url) ?? str(p.resource), description: str(res?.description), accepts };
}

export type Tone = "measured" | "unmeasured" | "payment" | "problem" | "neutral";

/** Colour family for a state word. The word itself is always shown verbatim. */
export function toneOf(label: string | undefined): Tone {
  const l = String(label ?? "").toUpperCase();
  if (!l) return "neutral";
  if (/^(UNMEASURED|NOT_MEASURED|NOT_ON_BOARD|NEEDS_INPUT|UNCHECKABLE)/.test(l)) return "unmeasured";
  if (/^PAYMENT_REQUIRED/.test(l)) return "payment";
  if (/^(INVALID|ERROR|UNREACHABLE|FAILED)/.test(l)) return "problem";
  if (/^(MEASURED|VALID|LIVE|INCLUDED|SIGNED)/.test(l)) return "measured";
  return "neutral";
}

/**
 * Suggested questions. Each is a phrase the deterministic router (functions/_lib/talkRouter.ts)
 * routes to a named free tool; aguiTalk.test.ts pins every one of them against routeIntent.
 *
 * Tools audit, 6 Oct 2026: "List signed cards" (hashes and axis codes, no model or score) and
 * "Show the public root" (a Merkle root) were developer chips on a stranger's start screen. They
 * are gone from the chips; list_cards and get_root stay available to agents over POST /mcp.
 * Stranger journey, 6 Oct 2026: "the board" and "x402 census" became "the leaderboard" and "paid
 * doors"; the router sends each to the same tool as before.
 */
export const TALK_SUGGESTIONS: { text: string; tool: string }[] = [
  { text: "What does the leaderboard show?", tool: "board_totals" },
  { text: "How did safety measure?", tool: "get_axis" },
  { text: "What is measured about github.com?", tool: "server_evidence" },
  { text: "Show the latest corrections", tool: "corrections_summary" },
  { text: "Which paid doors answer?", tool: "x402_trust" },
];

export type StreamOptions = {
  question: string;
  threadId?: string;
  runId?: string;
  userMessageId?: string;
  confirmTool?: string[];
  /** Where the reader is; lets "this" mean the page's subject. */
  page?: PageContext;
  /** Declare the watch-mode frontend tools (RunAgentInput.tools), so the run can plan page moves. */
  declareUi?: boolean;
  /** Send watch consent: only when the viewer switched watch on in this tab. */
  watch?: boolean;
  /** Frontend tool results to report back ({role:"tool"} messages), for the follow-up run. */
  toolResults?: { toolCallId: string; content: string; error?: string }[];
  signal?: AbortSignal;
  endpoint?: string;
  onEvent: (ev: Json) => void;
  fetchImpl?: typeof fetch;
};

/** POST one question to the AG-UI run endpoint and feed every event to onEvent. */
export async function streamRun(o: StreamOptions): Promise<void> {
  const body: Json = {
    threadId: o.threadId ?? `web-${Date.now().toString(36)}`,
    runId: o.runId ?? `run-${Math.random().toString(36).slice(2, 10)}`,
    messages: [
      ...(o.question ? [{ id: o.userMessageId ?? "m1", role: "user", content: o.question }] : []),
      ...(o.toolResults ?? []).map((r, i) => ({ id: `t${i + 1}`, role: "tool", toolCallId: r.toolCallId, content: r.content, ...(r.error ? { error: r.error } : {}) })),
    ],
  };
  const fp: Json = {};
  if (o.confirmTool?.length) fp.confirm = { tools: o.confirmTool, tool: o.confirmTool[0] };
  if (o.page) fp.page = o.page;
  if (o.declareUi || o.watch) body.tools = FRONTEND_TOOLS;
  if (o.watch) fp.consent = { watch: true };
  if (Object.keys(fp).length) body.forwardedProps = fp;
  const f = o.fetchImpl ?? fetch;
  const r = await f(o.endpoint ?? "/api/agui/run", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "text/event-stream" },
    body: JSON.stringify(body),
    signal: o.signal,
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  if (!r.body) {
    const { events } = parseSse((await r.text()) + "\n\n");
    for (const e of events) o.onEvent(e.data);
    return;
  }
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (value) buf += dec.decode(value, { stream: true });
    const { events, rest } = parseSse(done ? buf + "\n\n" : buf);
    buf = rest;
    for (const e of events) o.onEvent(e.data);
    if (done) break;
  }
}
