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
    return `No SaaS tiers. Measurement and verification are free forever. See GET /api/gspc, /gspc-verify/, /assess/, or the lobby door /?lobby=measured&task=pricing-overview.\n\n_Grounded in the published free rail, not by a model._`;
  }

  if (
    /\b(in plain words|actually measure|what (do|does) (the )?(council|csoai)|difference between measur|one-paragraph summary)\b/i.test(q) ||
    (/\bcertif/i.test(q) && /\bmeasur/i.test(q))
  ) {
    const names = axes.map((a: any) => a.axis).filter(Boolean);
    return (
      `The Council of AI measures published behaviour against frozen rules, signs with Ed25519, and publishes what it cannot measure. It does not certify.\n\n` +
      `Board axes: ${names.join(", ") || "(unavailable)"}. Public count: ${canon.publicCount}. Jail is MEASURED; living-board separation is TIE (not a separated leader).\n\n` +
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
      const sep = String(hit.separation ?? "TIE").toUpperCase();
      return (
        `**${hit.axis}** (${hit.bench}) is **MEASURED** on the quotable board (slot 14).\n\n` +
        `Separation is **${sep}** — a TIE is not a separated leader. Counted in totals (${canon.publicCount}).\n\n` +
        (typeof hit.accuracy === "number" ? `Leader accuracy ${Number(hit.accuracy).toFixed(3)}` : "No board-grade accuracy") +
        (hit.n ? ` at n=${hit.n}` : "") +
        `.\n\n_Grounded in GET /api/gspc jail axis, not by a model._`
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
      `**jail** is MEASURED on the quotable board.\n\n${canon.jailNote}\n\n` +
      (typeof j.accuracy === "number" ? `Leader accuracy ${Number(j.accuracy).toFixed(3)}` : "No board-grade accuracy") +
      (j.n ? ` at n=${j.n}` : "") +
      `. Public count: ${canon.publicCount}.\n\n_Grounded in GET /api/gspc, not by a model._`
    );
  }

  if (
    /\b(board|scoreboard|axes|axis|gspc|coverage|how many axes|walk me through|overview|live board|how many.*measured|measured of)\b/.test(t) &&
    (axes.length || canon.slots)
  ) {
    const mAxes = canon.measuredAxes;
    const uAxes = canon.unmeasuredAxes;
    // A MEASURED axis does not always carry an accuracy: the deterministic-facts
    // financial axes (provenance-controls) have an n and a status and no score, and
    // /api/gspc says so explicitly ("an axis with no accuracy contributes nothing
    // rather than a zero"). This used to print `Number(undefined).toFixed(3)` and
    // hand the reader the literal string **NaN**.
    const row = (a: any) => {
      const acc = Number(a.accuracy);
      const head = Number.isFinite(acc) ? `${acc.toFixed(3)} ` : "";
      const tail = Number.isFinite(acc)
        ? (a.separation ? `, ${a.separation}` : "")
        : ", no accuracy on this axis — it is a deterministic-facts row, not a model comparison";
      return `- **${a.axis}** ${head}(n=${a.n}${tail})`;
    };
    return (
      `${canon.publicCount}. ` +
      `**${canon.measured}** of the **${canon.slots}** published slots carry a measurement; ` +
      `**${canon.unmeasured}** are declared slots with no run behind them.\n\n` +
      `Quote both numbers or quote the smaller one — the larger counts slots, not measurements. ` +
      `A published slot exists so the gap is visible; it is not evidence of anything having been measured. ` +
      `Jail is MEASURED; a TIE is not a separated leader.\n\n` +
      `${canon.jailNote}\n\n` +
      `The ${mAxes.length} measured:\n` +
      mAxes.map(row).join("\n") +
      (uAxes.length
        ? `\n\nThe ${uAxes.length} carrying no number — UNMEASURED is a published status, not an omission:\n` +
          uAxes.map((a: any) => `- **${a.axis}** — ${String(a.status ?? "UNMEASURED")}, no score on this stamp`).join("\n")
        : "") +
      `\n\n_Grounded in GET /api/gspc totals (axes / measured_axes / unmeasured_axes / public_count), not by a model._`
    );
  }

  if (/\b(method|how do you|unpars(?:ed|able|eable)|interval|wilson|grader|n *[>=]* *30)\b/.test(t)) {
    return `Rules: unparsed counted incorrect; no model judges another model; nothing quoted below usable n >= 30; canaries excluded; three outcomes (success, failure, unmeasured).`;
  }

  // Conversational floor - greet, identity, capability. Answered from the About facts and
  // the live board canon (never an invented number or legal opinion), so the concierge holds
  // a basic conversation instead of refusing "hello". claimGuardRefuse already ran above.
  const openNames = axes.map((a: any) => a.axis).filter(Boolean);
  if (/^(hi|hey+|hello+|yo|gm|ga|ge|good (morning|afternoon|evening)|greetings|sup|howdy|hiya|heya|hej|hola)\b/i.test(t) || t === "hi" || t === "hello") {
    return (
      `Hi - I'm the Council of AI concierge. I answer from published measurement and frozen rules, and I say **UNMEASURED** rather than guess.\n\n` +
      `Ask me a **named axis** (${openNames.slice(0, 4).join(", ")}${openNames.length > 4 ? ", ..." : ""}), **how the board works**, **EU AI Act Article 5**, **the measurement method**, **pricing**, or **how to get measured**.\n\n` +
      `_A concierge over published facts, not a model that invents them._`
    );
  }
  if (/\b(who are you|what (is|are|s) (this|you|council|csoai|the council of ai)|what do you do|tell me about (council|csoai|this|you)|about (council|csoai|you)|explain (council|csoai|this)|are you (an? )?(ai|bot|chatbot))\b/i.test(t)) {
    return (
      `The **Council of AI** is an independent measurement instrument: it measures how AI systems behave against the rules that govern them, signs each result with Ed25519, and publishes what it cannot yet measure. It does **not** certify and issues no conformity mark.\n\n` +
      `The GSPC board publishes **${canon.publicCount}** — ${canon.unmeasured} of its ${canon.slots} slots carry no number, and say so (${openNames.slice(0, 6).join(", ")}${openNames.length > 6 ? ", ..." : ""}). Verification is free forever; a grade is never sold.\n\n` +
      `Ask me a named axis, the method, Article 5, or how to get measured.\n\n_Grounded in the published board, not by a model._`
    );
  }
  if (/\b(what can i ask|what can you (do|answer|help)|^help$|how (do|does) (this|it|i) (work|use)|what (are my )?options|menu|get started|where do i start|what now)\b/i.test(t) || t === "help") {
    return (
      `Here's what I can answer from published facts:\n\n` +
      `- **A named board axis** - its measured accuracy, Wilson interval and n (or UNMEASURED, honestly).\n` +
      `- **The board** - how many of its published slots carry a measurement, and how many carry none.\n` +
      `- **EU AI Act Article 5** - the prohibited practices, by a deterministic rule.\n` +
      `- **The measurement method** - unparsed counted wrong, n>=30 to quote, three outcomes.\n` +
      `- **Pricing** - no SaaS tiers; verification is free forever.\n` +
      `- **Get measured** - how to run a signed assessment.\n\n` +
      `_I answer from published measurement; I won't invent a number or a legal opinion._`
    );
  }
  if (/\b(thank|thanks|cheers|ta\b|appreciate|nice|cool|great|awesome|ok|okay|bye|goodbye|see ya)\b/i.test(t) && t.length < 40) {
    return `Anytime. Ask me a named axis, the board, Article 5, the method, or how to get measured whenever you're ready.\n\n_Council of AI - measurement, not certification._`;
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

  // `model` used to be stamped on EVERY reply, defaulting to "sov6-ethics-v3-light" — including
  // the deterministic `grounded` and `refused` answers, which are computed from the published
  // board with no model in the path at all. A client reading that field was told a model wrote
  // an answer no model had seen. It is now null unless a model actually produced the text, and
  // `answered_by` says which path did.
  const reply = (answer: string, signature: string, state: string, extra: Record<string, unknown> = {}) =>
    Response.json(
      {
        answer,
        reply: answer,
        signature,
        state,
        model: state === "live" ? model : null,
        answered_by: state === "live" ? `model:${model}` : "deterministic (no model in the path)",
        message: { role: "assistant", content: answer },
        ...extra,
      },
      { headers: CORS },
    );

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
