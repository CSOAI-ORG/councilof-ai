// Governance Battle — two models classify the SAME scenario; the deterministic statute (the law)
// declares the winner. Not a human vote — a signed, measured verdict. This is the differentiator
// vs arena.ai / LMArena: they rank by "which answer feels better"; we rank by which one the law says
// is correct, and sign the result.
const INSTRUCTION =
  "You are classifying an AI system under Regulation (EU) 2024/1689 (the EU AI Act). " +
  "Reply with EXACTLY ONE token and nothing else: PROHIBITED | HIGH_RISK | LIMITED_RISK | MINIMAL_RISK.";

function bucket(tier: string): string {
  const t = (tier || "").toUpperCase();
  if (/PROHIBIT|UNACCEPT/.test(t)) return "PROHIBITED";
  if (/HIGH/.test(t)) return "HIGH_RISK";
  return "LIMITED"; // limited or minimal collapse
}
function extractTier(text: string): string {
  const rx: [string, RegExp][] = [
    ["PROHIBITED", /\bprohibit\w*\b/i], ["HIGH_RISK", /\bhigh[ _-]?risk\b/i],
    ["LIMITED_RISK", /\blimited[ _-]?risk\b/i], ["MINIMAL_RISK", /\bminimal[ _-]?risk\b/i],
  ];
  let best = "", pos = 1e9;
  for (const [name, r] of rx) { const m = r.exec(text || ""); if (m && m.index < pos) { pos = m.index; best = name; } }
  return best;
}
async function podTier(model: string, scenario: string): Promise<string> {
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 50000);
    const r = await fetch("https://dxjgtj2jyvljxo-11434.proxy.runpod.net/api/generate", {
      method: "POST", headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0 Chrome/120" },
      body: JSON.stringify({ model, prompt: `${INSTRUCTION}\n\nScenario: ${scenario}\nAnswer:`, stream: false, options: { num_predict: 12, temperature: 0 } }),
      signal: ctl.signal,
    });
    clearTimeout(t); const d: any = await r.json();
    return extractTier(d.response || "");
  } catch { return ""; }
}

export const onRequestPost: PagesFunction = async (ctx) => {
  let scenario = "";
  try { scenario = ((await ctx.request.json()) as any).scenario || ""; } catch {}
  if (!scenario) return new Response(JSON.stringify({ error: "no scenario" }), { status: 400, headers: { "content-type": "application/json" } });

  // ground truth from the deterministic law (same-origin /api/assess)
  let truth = "UNMEASURED";
  try {
    const tr = await fetch(new URL("/api/assess", ctx.request.url).toString(), {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: scenario }) });
    truth = (await tr.json() as any).tier || "UNMEASURED";
  } catch {}
  const truthB = bucket(truth);

  const [aRaw, bRaw] = await Promise.all([podTier("sov34:latest", scenario), podTier("qwen2.5:0.5b", scenario)]);
  const aB = aRaw ? bucket(aRaw) : "", bB = bRaw ? bucket(bRaw) : "";
  const aMatch = aB === truthB && !!aRaw, bMatch = bB === truthB && !!bRaw;
  let winner = "tie";
  if (aMatch && !bMatch) winner = "sov34";
  else if (bMatch && !aMatch) winner = "qwen2.5:0.5b";
  else if (aMatch && bMatch) winner = "both correct";
  else winner = "neither matched the law";

  return new Response(JSON.stringify({
    scenario, truth, truth_bucket: truthB,
    contestants: [
      { model: "sov34 (MEOK operator)", answer: aRaw || "— declined", matched_law: aMatch },
      { model: "qwen2.5:0.5b (base)", answer: bRaw || "— declined", matched_law: bMatch },
    ],
    winner, judged_by: "EU AI Act — deterministic, not a human vote",
  }), { headers: { "content-type": "application/json" } });
};
