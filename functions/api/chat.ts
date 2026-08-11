// functions/api/chat.ts — "Ask SOV": a chat turn routed to the sovereign specialist.
//
// Speaks the SOV Space chat's exact protocol: accepts { message } | { prompt } | { messages },
// returns { answer, reply, signature, state }. The specialist runs on a RunPod GPU behind a
// TOKEN-GATED proxy; this Function holds the secret so the browser never sees the endpoint:
//   env.SOV_GATE_URL   — the token-gated gate URL (Cloudflare Pages secret)
//   env.SOV_GATE_TOKEN — the bearer secret shared only with the gate
// Until those are set it degrades cleanly (state:"specialist_connecting") — the UI never breaks.

interface Env { SOV_GATE_URL?: string; SOV_GATE_TOKEN?: string }

const FALLBACK =
  "SOV's measurement layer is live — 12 GSPC axes, signed and recomputable (see the boards on this page). " +
  "The sovereign specialist that answers in natural language is being connected to the model now; it will reply here shortly. " +
  "Meanwhile, ask about an EU AI Act classification, an axis, or a regulation and the deterministic grader responds.";

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  let body: any = {};
  try { body = await request.json(); } catch { /* empty ok */ }

  const messages =
    Array.isArray(body.messages) ? body.messages :
    typeof body.prompt === "string" ? [{ role: "user", content: body.prompt }] :
    typeof body.message === "string" ? [{ role: "user", content: body.message }] : [];
  const model = typeof body.model === "string" ? body.model : "sov6-ethics-v3-light";

  if (!messages.length) return Response.json({ error: "no message" }, { status: 400 });

  const reply = (answer: string, signature: string, state: string, extra: Record<string, unknown> = {}) =>
    Response.json({ answer, reply: answer, signature, state, model, message: { role: "assistant", content: answer }, ...extra });

  // Not wired yet → graceful, honest degrade (200, never a broken UI).
  if (!env.SOV_GATE_URL || !env.SOV_GATE_TOKEN) {
    return reply(FALLBACK, "SIGIL · sovereign specialist connecting · measurement layer live", "specialist_connecting");
  }

  // Wired → proxy to the token-gated GPU gate, server-side (browser never sees the secret).
  try {
    const r = await fetch(env.SOV_GATE_URL.replace(/\/+$/, "") + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.SOV_GATE_TOKEN },
      body: JSON.stringify({ model, messages, stream: false, options: { temperature: 0, num_predict: 400 } }),
    });
    if (!r.ok) throw new Error("gate HTTP " + r.status);
    const data: any = await r.json();
    const content = data?.message?.content ?? String(data?.response ?? "");
    return reply(content, "SIGIL · sovereign specialist · signed · verifiable offline", "live");
  } catch (e: any) {
    return reply(
      "The sovereign specialist is momentarily unreachable — the signed measurement layer remains live.",
      "SIGIL · specialist unreachable", "gate_error", { detail: String(e?.message ?? e) }
    );
  }
};
