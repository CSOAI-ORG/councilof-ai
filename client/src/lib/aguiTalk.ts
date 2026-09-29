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

export type Json = Record<string, unknown>;

export type Citation = { tool: string; record_id: string | null; url: string | null };

export type TalkToolCard = {
  id: string;
  name: string;
  /** The TOOL_CALL_ARGS deltas, concatenated as they arrived. */
  argsText: string;
  status: "running" | "done";
  label?: string;
  summary?: string;
  citation?: Citation;
  output?: unknown;
};

export type ConfirmRequest = {
  tools: { tool: string; args: Json }[];
  how?: string;
  effect?: string;
};

export type TalkRun = {
  id: string;
  question: string;
  status: "streaming" | "done" | "error" | "awaiting_confirmation" | "cancelled";
  tools: TalkToolCard[];
  text: string;
  confirm: ConfirmRequest | null;
  error?: string;
  result?: Json;
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
  return { id, question, status: "streaming", tools: [], text: "", confirm: null };
}

/** Fold one AG-UI event into the run. Pure. Unknown event types leave the run unchanged. */
export function reduceRun(run: TalkRun, ev: Json): TalkRun {
  const type = str(ev.type);
  switch (type) {
    case "TOOL_CALL_START": {
      const id = str(ev.toolCallId) ?? `call_${run.tools.length + 1}`;
      if (run.tools.some((t) => t.id === id)) return run;
      return { ...run, tools: [...run.tools, { id, name: str(ev.toolCallName) ?? "tool", argsText: "", status: "running" }] };
    }
    case "TOOL_CALL_ARGS": {
      const id = str(ev.toolCallId);
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
    case "TEXT_MESSAGE_CONTENT":
      return { ...run, text: run.text + (str(ev.delta) ?? "") };
    case "CUSTOM": {
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
      return { ...run, result, status: result?.awaiting_confirmation ? "awaiting_confirmation" : "done" };
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
 */
export const TALK_SUGGESTIONS: { text: string; tool: string }[] = [
  { text: "What does the board say?", tool: "board_totals" },
  { text: "How did safety measure?", tool: "get_axis" },
  { text: "List signed cards", tool: "list_cards" },
  { text: "Show the public root", tool: "get_root" },
  { text: "What is measured about github.com?", tool: "server_evidence" },
  { text: "x402 census", tool: "x402_trust" },
];

export type StreamOptions = {
  question: string;
  confirmTool?: string[];
  signal?: AbortSignal;
  endpoint?: string;
  onEvent: (ev: Json) => void;
  fetchImpl?: typeof fetch;
};

/** POST one question to the AG-UI run endpoint and feed every event to onEvent. */
export async function streamRun(o: StreamOptions): Promise<void> {
  const body: Json = {
    threadId: `web-${Date.now().toString(36)}`,
    runId: `run-${Math.random().toString(36).slice(2, 10)}`,
    messages: [{ id: "m1", role: "user", content: o.question }],
  };
  if (o.confirmTool?.length) body.forwardedProps = { confirm: { tools: o.confirmTool, tool: o.confirmTool[0] } };
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
