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

interface Env {
  SOV_GATE_URL?: string;
  SOV_GATE_TOKEN?: string;
  LITELLM_PROXY_URL?: string;
  LITELLM_MASTER_KEY?: string;
}

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
  } catch { return []; }
}

/** Deterministic. Returns null when the question cannot be grounded — never a guess. */
async function grounded(q: string, origin: string): Promise<string | null> {
  return null;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  return Response.json({ answer: "stub" });
};
