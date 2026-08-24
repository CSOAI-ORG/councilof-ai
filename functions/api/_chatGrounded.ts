// functions/api/_chatGrounded.ts - Ask SOV handlers (private)
import {
  boardCanon, claimGuardRefuse, isJailAxis, loadAxes, loadBoard, wilson,
} from "./_chatCanon";
import { ART5, ART5_CUES, why } from "./_chatArt5";
import { lobbyGround } from "./_chatLobby";

interface Env { SOV_GATE_URL?: string; SOV_GATE_TOKEN?: string }

const CORS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization",
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS });

async function grounded(q: string, origin: string): Promise<string | null> {
  const t = q.toLowerCase().trim();
  const refused = claimGuardRefuse(q);
  if (refused) return refused;

  const door = lobbyGround(q);
  if (door) return door;

  for (const [k, rxs] of ART5_CUES) {
    if (rxs.every((rx) => rx.test(q))) {
      return `That is prohibited under **EU AI Act Article 5(1)(${k})** - ${ART5[k]}.\n\n` +
        why(k) +
        `\n\nArticle 5 prohibitions are absolute (since 2 February 2025).\n\n` +
        `_Classified by a deterministic rule, not by a model._`;
    }
  }

  const board = await loadBoard(origin);
  const axes = board.axes;
  const canon = boardCanon(board);

  if (/\b(pricing|plans?|how much|grade cost|is (it|verify|verification) free)\b/i.test(q)) {
    return `No SaaS tiers. Measurement and verification are free forever. See GET /api/gspc, /gspc-verify/, /assess/, /pricing/.\n\n_Grounded in the published pricing page, not by a model._`;
  }

  if (
    /\b(in plain words|actually measure|what (do|does) (the )?(council|csoai)|difference between measur|one-paragraph summary)\b/i.test(q) ||
    (/\bcertif/i.test(q) && /\bmeasur/i.test(q))
  ) {
    const names = axes.map((a: any) => a.axis).filter((n: any) => n && String(n).toLowerCase() !== "jail");
    return (
      `The Council of AI measures published behaviour against frozen rules, signs with Ed25519, and publishes what it cannot measure. It does not certify.\n\n` +
      `Board axes: ${names.join(", ") || "(unavailable)"}. Public count: ${canon.publicCount}. Jail is floor (separation UNTESTED).\n\n` +
      `_Grounded in the published board, not by a model._`
    );
  }

  const axisIntent =
    /\b(score|accuracy|axis|axes|bench|gspc|leader|wilson|macro f1|unparsed|measured on)\b/i.test(q) ||
    /\b(how many|which) axes\b/i.test(q);
  const hit = axisIntent
    ? axes.find((a: any) => {
        const name = String(a.axis ?? "");
        const bench = String(a.bench ?? "");
        const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return (name && new RegExp(`\\b${esc(name)}\\b`, "i").test(q)) ||
          (bench && new RegExp(`\\b${esc(bench)}\\b`, "i").test(q));
      })
    : null;

  if (hit) {
    if (isJailAxis(hit)) {
      return (
        `**${hit.axis}** (${hit.bench}) is the board **floor**, not a board-measured axis.\n\n` +
        `Separation is **UNTESTED**. Not counted in totals.measured_axes (${canon.publicCount}).\n\n` +
        (typeof hit.accuracy === "number" ? `Floor accuracy ${Number(hit.accuracy).toFixed(3)}` : "No board-grade accuracy") +
        (hit.n ? ` at n=${hit.n}` : "") +
        `.\n\n_Grounded in GET /api/gspc - jail floor / UNTESTED, not by a model._`
      );
    }
    if (!(hit.status === "MEASURED" && hit.n > 0)) {
      return `**${hit.axis}** (${hit.bench}) is **${hit.status}** - it carries no score. I will not invent one.`;
    }
    const usable = hit.n * (1 - (hit.unparsed_rate ?? 0));
    const [lo, hi] = wilson(hit.accuracy, hit.n);
    return `**${hit.axis}** (${hit.bench}) is **MEASURED**.\n\n` +
      `Accuracy **${hit.accuracy.toFixed(3)}**` +
      (usable >= 30
        ? `, Wilson 95% [${lo.toFixed(3)}, ${hi.toFixed(3)}], n=${hit.n}.`
        : `, n=${hit.n} - below the 30 usable-item floor, so no interval is reported.`) +
      `\nMacro F1 ${Number(hit.macro_f1).toFixed(3)}. Unparsed ${(100 * (hit.unparsed_rate ?? 0)).toFixed(1)}% (counted incorrect).`;
  }

  if (/\bjail\b/i.test(q) && canon.jail && !axes.some(isJailAxis)) {
    const j = canon.jail;
    return (
      `**jail** is a measured **floor**, not a board axis.\n\n${canon.jailNote}\n\n` +
      (typeof j.accuracy === "number" ? `Floor accuracy ${Number(j.accuracy).toFixed(3)}` : "No board-grade accuracy") +
      (j.n ? ` at n=${j.n}` : "") +
      `. Public count: ${canon.publicCount}.\n\n_Grounded in GET /api/gspc jail_floor, not by a model._`
    );
  }

  if (
    /\b(board|scoreboard|axes|axis|gspc|coverage|how many axes|walk me through|overview|live board|how many.*measured|measured of)\b/.test(t) &&
    (axes.length || canon.quotable)
  ) {
    const mAxes = canon.measuredAxes;
    return (
      `The GSPC board has **${canon.quotable}** quotable axes. ` +
      `**${canon.measured} measured of ${canon.quotable}**` +
      (canon.publicCount ? ` (${canon.publicCount})` : "") +
      `.\n\n` +
      `Never "12 axes" and never "14 are MEASURED" - jail is not board-measured.\n\n` +
      `${canon.jailNote}\n\n` +
      `The ${mAxes.length} board-measured axes:\n` +
      mAxes.map((a: any) => `- **${a.axis}** ${Number(a.accuracy).toFixed(3)} (n=${a.n}` +
        (a.separation ? `, ${a.separation}` : "") + `)`).join("\n") +
      `\n\n_Grounded in GET /api/gspc totals (measured_axes / public_count), not by a model._`
    );
  }

  if (/\b(method|how do you|unparsed|interval|wilson|grader|n *[>=]* *30)\b/.test(t)) {
    return `Rules: unparsed counted incorrect; no model judges another model; nothing quoted below usable n >= 30; canaries excluded; three outcomes (success, failure, unmeasured).`;
  }

  return null;
}

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
    Response.json({ answer, reply: answer, signature, state, model, message: { role: "assistant", content: answer }, ...extra }, { headers: CORS });

  // ClaimGuard: refuse false count claims before LIVE / grounded
  const guarded = claimGuardRefuse(question);
  if (guarded) return reply(guarded, "claimguard - refused false count claim", "refused");

  // Prefer published board canon over SOV LIVE (sales-blocker fix)
  const g = await grounded(question, origin);
  if (g) return reply(g, "grounded in published measurement - deterministic - recomputable", "grounded");

  if (env.SOV_GATE_URL && env.SOV_GATE_TOKEN) {
    try {
      const r = await fetch(env.SOV_GATE_URL.replace(/\/+$/, "") + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.SOV_GATE_TOKEN },
        body: JSON.stringify({ model, messages, stream: false, options: { temperature: 0, num_predict: 400 } }),
      });
      if (!r.ok) throw new Error("gate HTTP " + r.status);
      const data: any = await r.json();
      const content = data?.message?.content ?? String(data?.response ?? "");
      if (content.trim()) return reply(content, "council - signed - verifiable offline", "live");
    } catch { /* fall through */ }
  }

  let named = "";
  try {
    const live = await loadAxes(origin);
    if (live.length) named = live.map((a: any) => a.axis).filter(Boolean).join(", ");
  } catch { /* ignore */ }

  return reply(
    `I could not ground an answer from published measurement.\n\n` +
    "Try a **named board axis**, **EU AI Act Article 5**, **GET /api/gspc**, **pricing**, **get measured**, or the **measurement method**.\n\n" +
    `Named axes: ${named || "see GET /api/gspc"}.\n\n` +
    "I will not invent a number or a legal opinion.",
    "refused - no grounding available", "ungrounded",
  );
};
