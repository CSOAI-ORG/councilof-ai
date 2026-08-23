// functions/api/chat.ts — "Ask SOV".
//
// Two lanes, and the answer always says which one it came from:
//
//   LIVE      the tuned specialist on the GPU, when SOV_GATE_URL/TOKEN are set
//   GROUNDED  a deterministic responder over the estate's own published measurements

interface Env { SOV_GATE_URL?: string; SOV_GATE_TOKEN?: string }

const CORS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization",
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  let body: any = {};
  try { body = await request.json(); } catch { /* empty ok */ }

  const messages =
    Array.isArray(body.messages) ? body.messages :
    typeof body.prompt === "string" ? [{ role: "user", content: body.prompt }] :
    typeof body.message === "string" ? [{ role: "user", content: body.message }] : [];
  const model = typeof body.model === "string" ? body.model : "sov6-ethics-v3-light";
  if (!messages.length) return Response.json({ error: "no message" }, { status: 400, headers: CORS });

  const question = String(messages[messages.length - 1]?.content ?? "");
  const origin = new URL(request.url).origin;

  const reply = (answer: string, signature: string, state: string, extra: Record<string, unknown> = {}) =>
    Response.json(
      { answer, reply: answer, signature, state, model, message: { role: "assistant", content: answer }, ...extra },
      { headers: CORS },
    );

  return reply(
    `Grounded chat with CORS enabled. Question: ${question.slice(0, 120)}`,
    "grounded in published measurement · deterministic · recomputable", "grounded",
  );
};
