// functions/api/chat.ts — "Ask SOV".
//
// Two lanes, and the answer always says which one it came from:
//
//   LIVE      the tuned specialist on the GPU, when SOV_GATE_URL/TOKEN are set
//   GROUNDED  a deterministic responder over the estate's own published measurements
//
// The grounded lane is not a placeholder apology. It answers real questions —
// an axis's score, whether an EU AI Act Article 5 practice is prohibited, what a
// status means — from data the estate has actually earned, and it says
// "unmeasured" wherever the estate has not earned a number. What it will never
// do is invent one. An answer it cannot ground is refused, not improvised.

interface Env { SOV_GATE_URL?: string; SOV_GATE_TOKEN?: string }

/* ── Article 5(1) — the eight prohibited practices, verbatim in substance ──── */
const ART5: Record<string, string> = {
  a: "subliminal, purposefully manipulative or deceptive techniques that materially distort behaviour and cause significant harm",
  b: "exploitation of vulnerabilities due to age, disability, or a specific social or economic situation",
  c: "social scoring leading to detrimental treatment in unrelated contexts, or that is unjustified or disproportionate",
  d: "risk assessment predicting criminal offending based solely on profiling or personality traits",
  e: "untargeted scraping of facial images from the internet or CCTV to build facial-recognition databases",
  f: "inference of emotions in the workplace or education institutions, save for medical or safety reasons",
  g: "biometric categorisation deducing race, political opinions, trade-union membership, religion, or sex life",
  h: "real-time remote biometric identification in publicly accessible spaces for law enforcement",
};

// Each cue is a conjunction: every regex must match somewhere in the question.
// Written as AND-sets rather than one ordered pattern because natural questions put
// the terms in any order ("infer employee emotions at work" vs "workplace emotion AI").
const ART5_CUES: [string, RegExp[]][] = [
  ["a", [/\b(subliminal|manipulat|deceptive|dark pattern)/i]],
  ["b", [/\b(exploit|target|prey on|take advantage)/i, /\b(age|child|minor|elderly|disab|poverty|low[- ]income|vulnerab)/i]],
  ["c", [/\b(social scor|citizen scor|trustworthiness scor|score citizens|rate citizens)/i]],
  ["d", [/\b(predict|forecast|risk[- ]?assess|likelihood)/i, /\b(crime|criminal|offend|reoffend|polic)/i]],
  ["e", [/\b(scrap|harvest|collect|crawl)/i, /\b(face|facial|headshot|photo)/i]],
  ["f", [/\bemotion|\bmood|\bsentiment.{0,12}(of|from).{0,12}(staff|employee|student)/i,
         /\b(workplace|work|employee|staff|worker|office|school|student|classroom|exam|education|university)/i]],
  ["g", [/\bbiometric|\bfacial analysis|\bcategoris|\bcategoriz/i,
         /\b(race|ethnic|religio|political|union|sexual|sex life|orientation)/i]],
  ["h", [/\b(real[- ]?time|live|instant)/i, /\b(biometric|facial recognition|face recognition|identif)/i]],
];

const wilson = (acc: number, n: number): [number, number] => {
  if (!n) return [0, 0];
  const z = 1.959964, d = 1 + (z * z) / n;
  const c = acc + (z * z) / (2 * n);
  const m = z * Math.sqrt((acc * (1 - acc)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
};

async function loadAxes(origin: string): Promise<any[]> {
  try {
    const r = await fetch(new URL("/api/gspc", origin).toString());
    if (!r.ok) return [];
    const j: any = await r.json();
    return Array.isArray(j?.axes) ? j.axes : [];
  } catch { return []; }
}

async function loadCity(origin: string): Promise<any | null> {
  try {
    const r = await fetch(new URL("/city/board.json", origin).toString());
    if (!r.ok) return null;
    const j: any = await r.json();
    return j?.kind === "sovos-city.board" ? j : null;
  } catch { return null; }
}

/** Deterministic. Returns null when the question cannot be grounded — never a guess. */
async function grounded(q: string, origin: string): Promise<string | null> {
  const t = q.toLowerCase().trim();

  // 1. Article 5 — is this practice prohibited?
  for (const [k, rxs] of ART5_CUES) {
    if (rxs.every((rx) => rx.test(q))) {
      return `That is prohibited under **EU AI Act Article 5(1)(${k})** — ${ART5[k]}.\n\n` +
why(k) +
        `\n\nArticle 5 prohibitions are absolute: there is no conformity assessment, ` +
        `registration, or documentation route that makes a prohibited practice lawful. ` +
        `Prohibitions have applied since 2 February 2025.\n\n` +
        `_Classified by a deterministic rule against Article 5(1)(a)–(h), not by a model._`;
    }
  }

  const axes = await loadAxes(origin);

  // 2. A named axis.
  const hit = axes.find((a: any) =>
    t.includes(String(a.axis).toLowerCase()) || t.includes(String(a.bench ?? "").toLowerCase()));
  if (hit) {
    const q_ok = hit.status === "MEASURED" && hit.n > 0;
    if (!q_ok) {
      return `**${hit.axis}** (${hit.bench}) is **${hit.status}** — it carries no score.\n\n` +
        `Task: ${hit.task}.\n` +
        (hit.n ? `Item bank: n=${hit.n}.\n` : `There is no item bank yet (n=0).\n`) +
        (hit.note ? `\n${hit.note}\n` : "") +
        `\nI will not quote a number for an axis that has not earned one.`;
    }
    const usable = hit.n * (1 - (hit.unparsed_rate ?? 0));
    const [lo, hi] = wilson(hit.accuracy, hit.n);
    return `**${hit.axis}** (${hit.bench}) is **MEASURED**.\n\n` +
      `Accuracy **${hit.accuracy.toFixed(3)}**` +
      (usable >= 30
        ? `, Wilson 95% [${lo.toFixed(3)}, ${hi.toFixed(3)}], n=${hit.n}.`
        : `, n=${hit.n} — below the 30 usable-item floor, so no interval is reported.`) +
      `\nMacro F1 ${Number(hit.macro_f1).toFixed(3)}. Unparsed ${(100 * (hit.unparsed_rate ?? 0)).toFixed(1)}% (counted incorrect).\n` +
      `Task: ${hit.task}.` + (hit.note ? `\n\n${hit.note}` : "");
  }

  // 3. The board as a whole.
  if (/\b(board|axes|axis|coverage|measured|how many|overview|status)\b/.test(t) && axes.length) {
    const m = axes.filter((a: any) => a.status === "MEASURED" && a.n > 0);
    const withCI = m.filter((a: any) => a.n * (1 - (a.unparsed_rate ?? 0)) >= 30);
    return `The GSPC suite is **${axes.length} axes**. **${m.length}** are MEASURED; ` +
      `**${withCI.length}** carry a confidence interval (usable n ≥ 30).\n\n` +
      m.map((a: any) => `· **${a.axis}** ${a.accuracy.toFixed(3)} (n=${a.n})`).join("\n") +
      `\n\nThe other ${axes.length - m.length} are UNMEASURED, DRAFT, SPEC or PLANNED and show no number. ` +
      `That is the point of the instrument: absence of evidence is reported, not hidden.`;
  }

  // 4. The arena.
  if (/\b(city|arena|swarm|simulat|agent|faction|red team|epoch)\b/.test(t)) {
    const c = await loadCity(origin);
    if (c) {
      const proven = c.positive_control?.gate_exercised;
      const breaches = Object.entries(c.breaches_by_article ?? {});
      return `**Council City** — the governed multi-agent arena. Last published run: ` +
        `${c.epochs} epochs, ${c.turns} turns, ${c.usable_n} usable, ${c.unmeasured} unmeasured.\n\n` +
        `Positive control: **${proven ? "PASSED" : "FAILED"}** — known-breaching actions were pushed through ` +
        `the live gate and ${proven ? "every one was blocked with the right citation" : "were NOT blocked, so the run proves nothing"}.\n\n` +
        (breaches.length
          ? `Breaches: ${breaches.map(([k, v]) => `${k} × ${v}`).join(", ")}.`
          : `No citizen proposed an Article 5 breach in that run.`) +
        `\n\nChain: ${c.chain?.records} signed epochs, ${c.chain?.signature_ok} signatures verified, ` +
        `${c.chain?.chain_intact ? "intact" : "BROKEN"}. Law: Article 0 V1–V8 + EU AI Act Art 5(1)(a)–(h), ` +
        `graded deterministically — no model judges another model.`;
    }
  }

  // 5. Method questions.
  if (/\b(method|how do you|unparsed|interval|wilson|grader|judge|canary|n *[≥>=]* *30)\b/.test(t)) {
    return `The rules every board here runs on:\n\n` +
      `· **Unparsed counted incorrect** — an answer we cannot read is a wrong answer, never a dropped row.\n` +
      `· **No model judges another model** — every grader is deterministic; there is no LLM jury.\n` +
      `· **Nothing quoted below usable n ≥ 30** — under that an axis carries no interval and says so.\n` +
      `· **Canaries excluded** — they detect contamination and never enter a score.\n` +
      `· **Three outcomes, never two** — success, failure, and *unmeasured*.\n\n` +
      `Every published artefact is signed and recomputable from the item bank.`;
  }

  return null;
}

function why(k: string): string {
  const map: Record<string, string> = {
    a: "The test is material distortion of behaviour plus significant harm — persuasion as such is not caught.",
    b: "The vulnerability must be the reason the technique works, and harm must be likely.",
    c: "The trigger is detrimental treatment in a context unrelated to the data, or treatment disproportionate to the behaviour.",
    d: "Prediction based *solely* on profiling or personality is caught; supporting a human assessment grounded in objective facts is not.",
    e: "The word doing the work is *untargeted* — scraping directed at specific, lawfully-obtained subjects is a different question.",
    f: "Workplace and education are the prohibited settings; medical and safety purposes are carved out.",
    g: "Categorisation to *deduce* a protected characteristic is caught; biometric verification as such is not.",
    h: "Real-time and remote and publicly accessible and for law enforcement — narrow judicially-authorised exceptions exist.",
  };
  return map[k] ?? "";
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
  if (!messages.length) return Response.json({ error: "no message" }, { status: 400 });

  const question = String(messages[messages.length - 1]?.content ?? "");
  const origin = new URL(request.url).origin;

  const reply = (answer: string, signature: string, state: string, extra: Record<string, unknown> = {}) =>
    Response.json({ answer, reply: answer, signature, state, model, message: { role: "assistant", content: answer }, ...extra });

  // LIVE lane — the specialist, when it is wired.
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
      if (content.trim()) return reply(content, "council · signed · verifiable offline", "live");
      throw new Error("empty answer from gate");
    } catch {
      // fall through to grounded rather than return nothing
    }
  }

  // GROUNDED lane — deterministic, over published measurements.
  const g = await grounded(question, origin);
  if (g) return reply(g, "grounded in published measurement · deterministic · recomputable", "grounded");

  return reply(
    "I can answer from what this estate has actually measured — ask about one of the twelve GSPC axes " +
    "(governance, safety, provenance, continuity, conformance, openness, care, swarm, cross-reality, " +
    "art5-safeguard, detector-interop, machinery-conformity), whether a practice is prohibited under " +
    "EU AI Act Article 5, the Council City arena runs, or the measurement method itself.\n\n" +
    "I won't answer this one, because I would be improvising rather than grounding. The tuned " +
    "specialist that handles open-ended questions is not connected yet.",
    "refused — no grounding available", "ungrounded",
  );
};
