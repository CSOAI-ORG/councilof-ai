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
  const axisNames = axes.map((a: any) => String(a.axis)).filter(Boolean);

  // 1o. Pricing / plans — no SaaS tiers.
  if (/\b(pricing|plans?|per[- ]seat|saas tier|course fee|what is free|not promised)\b/i.test(q)) {
    return (
      `There are no SaaS tiers, no per-seat plans, and no course fees on this estate.\n\n` +
      `Measurement and verification are free forever. Anyone can read GET /api/gspc, verify a card at /gspc-verify/, ` +
      `and run an assessment at /assess/ with no account.\n\n` +
      `Where a signed evidence artefact is sold, it is priced as an artefact on its own product page — ` +
      `never a fee for a ranking or placement. See /pricing/ for the published posture.\n\n` +
      `_Grounded in the published pricing page, not by a model._`
    );
  }

  // 1p. Sector / demographic — what to do first (not an axis score).
  if (
    /\b(what should .+ do first|ai governance for |sector|for finance|for healthcare|for startup|for enterprise|for regulator)\b/i.test(q) &&
    !/\b(governance axis|axis score|accuracy|wilson|n=)\b/i.test(q)
  ) {
    return (
      `A sensible first move with signed evidence:\n\n` +
      `1. **Inventory** — name the AI systems that matter and which rules might apply (EU AI Act tier, sector law, DORA, etc.).\n` +
      `2. **Read the board** — GET /api/gspc shows what is measured today; empty cells stay empty.\n` +
      `3. **Verify, don't trust** — recompute any card at /gspc-verify/ with the published Ed25519 key.\n` +
      `4. **Get measured** — /assess/ runs against frozen rules; the result attests measurement, not certification.\n\n` +
      `Sector pages under /for/ and /regulators/ link to published crosswalks. The Council does not give a legal opinion.\n\n` +
      `_Grounded in the published method and routes, not by a model._`
    );
  }

  // PLACEHOLDER_TRUNCATED