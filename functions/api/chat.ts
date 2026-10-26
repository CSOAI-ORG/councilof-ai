// functions/api/chat.ts - Ask SOV entry (helpers are _-private modules)
import { onRequestPost as groundedPost } from "./_chatGrounded";
import { recordUsage } from "../_lib/usage";
import { headFromGet } from "./_head";
import { readAsk } from "../_lib/askInput";
import { betterDesk, deskDisclosure, deskList, deskOf } from "./_chatDesks";

export { onRequestOptions } from "./_chatGrounded";

/** The reply's state, reduced to the words /api/usage counts (grounded / unknown / needs_input / ...). */
export function chatUsageState(status: number, state: unknown): string {
  if (status >= 400) return "error";
  if (state === "ungrounded") return "unknown";
  return typeof state === "string" && state ? state : "unknown";
}

/** The five ways to reach the same grounded answerer. Order is the order a newcomer meets them. */
export const CHAT_SKINS = ["chat", "mcp", "a2a", "agui", "a2ui"] as const;

/**
 * GET /api/chat: a descriptor, not a 404. It names the one answerer ("Ask the Council") and every
 * skin it is served through, each with its method and address. No counts are typed here.
 */
export function chatDescriptor(origin: string) {
  return {
    schema: "csoai.chat-skins/0.1",
    name: "Ask the Council",
    what: "One grounded answerer over published measurement records. It says UNMEASURED rather than guess. Measurement, not certification.",
    skins: [...CHAT_SKINS],
    surfaces: {
      chat: { method: "POST", endpoint: `${origin}/api/chat`, input: '{"message": string, "desk"?: string}', response: "application/json {answer, state}" },
      mcp: { method: "POST", endpoint: `${origin}/mcp/free`, protocol: "MCP Streamable HTTP", about: `${origin}/mcp/free` },
      a2a: { method: "POST", endpoint: `${origin}/api/a2a`, protocol: "A2A JSON-RPC", agent_card: `${origin}/.well-known/agent-card.json` },
      agui: { method: "POST", endpoint: `${origin}/api/agui/run`, protocol: "AG-UI event stream", about: `${origin}/api/agui/run` },
      a2ui: { method: "POST", endpoint: `${origin}/api/a2ui/run`, protocol: "A2UI NDJSON", about: `${origin}/api/a2ui/run` },
    },
    example: `curl -s -X POST ${origin}/api/chat -H 'content-type: application/json' -d '{"message":"What does the board measure?"}'`,
    privacy: "Aggregate counters only: the reply's state word is counted, and for a request refused because no question was found, its body shape (content class and top-level key NAMES from a fixed allowlist, never a value; /api/usage reject_shape). No question text is kept.",
    api_description: `${origin}/openapi.json`,
    // The AI desks on /team: the same answerer with a persona and a scope. Each reply to a desk
    // carries the Art. 50(1) disclosure. Usage stays the reply state word only.
    desks: deskList(),
    team: `${origin}/team`,
  };
}

export const onRequestGet = async (ctx: { request: Request }) =>
  new Response(JSON.stringify(chatDescriptor(new URL(ctx.request.url).origin)), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=300",
    },
  });

/**
 * A handler that THREW used to escape this wrapper: the platform answered with its own error page
 * and nothing was counted, so chat_state "error" was a lower bound on failures. It is now caught,
 * answered as JSON and counted as "error" like any other failed reply.
 */
export function chatFailure(): Response {
  return Response.json(
    {
      error: "internal",
      state: "error",
      detail:
        "The chat door failed while answering. Nothing was measured by this reply. This failure is counted on GET /api/usage (chat_state error).",
      answer: null,
    },
    { status: 500, headers: { "access-control-allow-origin": "*", "cache-control": "no-store" } },
  );
}

// Aggregate usage only (functions/_lib/usage.ts): the reply's state word, and for a request that
// carried no question its body SHAPE (content class + allowlisted key names). No question text is kept.
export const onRequestPost: typeof groundedPost = async (ctx) => {
  let res: Response;
  try {
    const desked = await withDesk(ctx.request);
    if (desked) {
      res = await deskReply(await groundedPost({ ...ctx, request: desked.request } as typeof ctx), desked.desk, desked.question);
    } else {
      res = await groundedPost(ctx);
    }
  } catch {
    res = chatFailure();
  }
  const c = ctx as unknown as { request: Request; env?: unknown; waitUntil?: (p: Promise<unknown>) => void };
  if (c.env && c.waitUntil) {
    c.waitUntil(
      res.clone().json()
        .then((j) => {
          const body = j as { state?: unknown; received?: { shape?: unknown } };
          recordUsage(c, "chat_state", chatUsageState(res.status, body?.state));
          if (res.status === 400 && typeof body?.received?.shape === "string") {
            recordUsage(c, "reject_shape", `chat.${body.received.shape}`);
          }
        })
        .catch(() => { recordUsage(c, "chat_state", chatUsageState(res.status, null)); }),
    );
  }
  return res;
};

/**
 * A desk-tagged request ({message, desk}) is re-sent to the same answerer with the desk's
 * instructions as a system turn ahead of the one question. Untagged requests are untouched.
 */
async function withDesk(request: Request): Promise<{ desk: string; question: string; request: Request } | null> {
  const url = new URL(request.url);
  let tag: unknown = url.searchParams.get("desk");
  let raw: any = null;
  try { raw = await request.clone().json(); } catch { /* not JSON */ }
  if (raw && typeof raw === "object" && typeof raw.desk === "string") tag = raw.desk;
  const desk = deskOf(tag);
  if (!desk) return null;
  const ask = await readAsk(request.clone() as unknown as Parameters<typeof readAsk>[0]);
  if (ask.question === null) return null;
  const body = { messages: [{ role: "system", content: desk.instructions }, { role: "user", content: ask.question }] };
  const headers = new Headers(request.headers);
  headers.set("content-type", "application/json");
  return { desk: desk.id, question: ask.question, request: new Request(request.url, { method: "POST", headers, body: JSON.stringify(body) }) };
}

/** Stamp the desk, the Art. 50(1) disclosure and any better-desk pointer onto the answer. */
export async function deskReply(res: Response, deskId: string, question: string): Promise<Response> {
  const desk = deskOf(deskId);
  if (!desk || !res.ok) return res;
  let j: any;
  try { j = await res.clone().json(); } catch { return res; }
  const disclosure = deskDisclosure(desk.name);
  const other = betterDesk(desk, question);
  const pointer = other ? `\n\nThis looks like a question for the ${other.name} desk (${other.role}). Ask ${other.name} on /team.` : "";
  const answer = `_${disclosure}_\n\n${String(j?.answer ?? "")}${pointer}`;
  const out = { ...j, answer, reply: answer, message: { role: "assistant", content: answer }, desk: desk.id, agent: desk.name, agent_kind: "AI agent", disclosure, ...(other ? { suggested_desk: other.id } : {}) };
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  return new Response(JSON.stringify(out), { status: res.status, headers });
}

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
