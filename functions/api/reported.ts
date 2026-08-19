// functions/api/reported.ts — the REPORTED data state (third of three).
//
// MEASURED = signed runs on our frozen instruments (see /api/gspc).
// GATED/UNMEASURED = honestly withheld (insufficient n, no separation test).
// REPORTED = figures published BY OTHERS, cited and timestamped here for context.
//
// Register: every entry is "reported by [source], not measured here". REPORTED
// figures are never signed, never enter the board, never sit next to MEASURED
// numbers without this label, and imply no endorsement of the source's method.
// Each entry carries its source, capture date, and licence/attribution basis.
// Benchmark scores move — treat every figure as "as of captured_at" and follow
// the source link for the live number.

interface ReportedEntry {
  id: string;
  claim: string;
  figures: Record<string, number | string>;
  source: string;
  source_url: string;
  captured_at: string;   // when WE captured the figure
  as_of: string;         // the source's own date, where stated
  attribution_basis: string;
  note?: string;
}

const ENTRIES: ReportedEntry[] = [
  {
    id: "arc-agi-3-human-gap",
    claim: "Humans solved all 135 ARC-AGI-3 environments; the best frontier model scored 0.37%.",
    figures: { human_pass_rate: 1.0, best_model_pass_rate: 0.0037, best_model: "Gemini 3.1 Pro Preview" },
    source: "ARC Prize (ARC-AGI-3 launch results)",
    source_url: "https://arcprize.org/",
    captured_at: "2026-08-19",
    as_of: "2026-03-25",
    attribution_basis: "Public leaderboard figures, cited with attribution.",
    note: "ARC Prize's own summary: 'Humans score 100%. Frontier AI scores 0.51%.' Scores move — check the live leaderboard.",
  },
  {
    id: "gaia-human-gap",
    claim: "GAIA: human respondents 92% vs 15% for GPT-4 with plugins.",
    figures: { human: 0.92, gpt4_with_plugins: 0.15 },
    source: "Mialon et al., GAIA (ICLR 2024)",
    source_url: "https://arxiv.org/abs/2311.12983",
    captured_at: "2026-08-19",
    as_of: "2023-11-21",
    attribution_basis: "arXiv paper figure, cited.",
  },
  {
    id: "gpqa-diamond-expertise-gap",
    claim: "GPQA Diamond: PhD-domain experts ~65% vs skilled non-experts with web access ~34%.",
    figures: { domain_experts: 0.65, skilled_non_experts: 0.34 },
    source: "Rein et al., GPQA",
    source_url: "https://arxiv.org/abs/2311.12022",
    captured_at: "2026-08-19",
    as_of: "2023-11-20",
    attribution_basis: "arXiv paper figure, cited.",
  },
  {
    id: "human-or-not-detection",
    claim: "In AI21's 'Human or Not' (1.5M+ participants), people identified their partner correctly only 68% of the time; 60% when talking to bots.",
    figures: { participants: "1,500,000+", overall_correct: 0.68, vs_bots_correct: 0.6 },
    source: "AI21 Labs (arXiv 2305.20010)",
    source_url: "https://arxiv.org/abs/2305.20010",
    captured_at: "2026-08-19",
    as_of: "2023-06-01",
    attribution_basis: "Company-published study, cited as self-reported.",
  },
  {
    id: "colonoscopy-deskilling",
    claim: "Non-AI-assisted adenoma detection fell from 28.4% to 22.4% after clinicians' AI exposure — first real-world clinical AI-deskilling evidence.",
    figures: { before_ai_exposure: 0.284, after_ai_exposure: 0.224, endoscopists: 19 },
    source: "Budzyń et al., Lancet Gastroenterology & Hepatology 10(10)",
    source_url: "https://doi.org/10.1016/S2468-1253(25)00133-5",
    captured_at: "2026-08-19",
    as_of: "2025-08-12",
    attribution_basis: "Peer-reviewed observational study, cited. Caveats: observational; possible workload confounds.",
  },
];

export const onRequestGet: PagesFunction = async () => {
  const body = {
    schema: "csoai.reported/0.1",
    issuer: "CSOAI Ltd (GB, Companies House 16939677)",
    register:
      "REPORTED is the third data state: figures published by OTHERS, cited and timestamped for " +
      "context. Reported here, not measured here. Unsigned. Never enters the board, never " +
      "compares against MEASURED numbers, implies no endorsement of the source's methodology. " +
      "MEASURED (signed) lives at /api/gspc; UNMEASURED/GATED cells stay honestly empty.",
    states: {
      MEASURED: "signed run on our frozen instruments — /api/gspc",
      "GATED/UNMEASURED": "honestly withheld: insufficient n or no separation test",
      REPORTED: "third-party figure, cited + timestamped, unsigned — this endpoint",
    },
    count: ENTRIES.length,
    entries: ENTRIES,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
    },
  });
};
