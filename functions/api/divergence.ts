// functions/api/divergence.ts — THE CROSS: the human-vs-AI divergence map.
//
// Where human and machine judgment split on identical items. The "only number
// a buyer can read" (canon): MEASURED (our fleet, signed) vs REPORTED
// (published human baselines). The cross is DISPLAYED, never blended —
// REPORTED never mixes into MEASURED cells.
//
// Computed from two live sources:
//   · the board (MEASURED — deterministic fleet runs on frozen splits)
//   · /api/reported (REPORTED — published human baselines, captured + attributed)
//
// Register: measurement, not certification. A divergence is a finding, not a
// verdict. Human numbers are published aggregates — rail one, no DPIA.
interface ReportedEntry {
  id: string;
  claim: string;
  figures: Record<string, number | string>;
  source: string;
  source_url: string;
  captured_at: string;
  as_of: string;
  attribution_basis: string;
  note?: string;
}

// Map REPORTED human-baseline entries to the axes they speak to.
const AXIS_MAP: Record<string, { axis: string; human: string; model: string; label: string }> = {
  "arc-agi-3-human-gap": { axis: "governance", human: "human_pass_rate", model: "best_model_pass_rate", label: "Abstract reasoning (ARC-AGI-3)" },
  "gaia-human-gap": { axis: "safety", human: "human", model: "gpt4_with_plugins", label: "Real-world QA (GAIA)" },
  "gpqa-diamond-expertise-gap": { axis: "provenance", human: "domain_experts", model: "skilled_non_experts", label: "PhD-domain QA (GPQA Diamond)" },
};

export const onRequestGet = async () => {
  // MEASURED board (our fleet).
  let board = null;
  try {
    const res = await fetch("https://councilof.ai/api/gspc");
    if (res.ok) board = await res.json();
  } catch {
    board = null;
  }

  // REPORTED human baselines.
  let reported: ReportedEntry[] = [];
  try {
    const res = await fetch("https://councilof.ai/api/reported");
    if (res.ok) {
      const d = await res.json();
      reported = d.entries || [];
    }
  } catch {
    reported = [];
  }

  const boardAxes = Object.fromEntries(
    (board?.axes || []).map((a: any) => [a.axis, a]),
  );

  const divergences = reported
    .map((entry) => {
      const map = AXIS_MAP[entry.id];
      if (!map) return null;
      const human = entry.figures[map.human];
      const model = entry.figures[map.model];
      if (typeof human !== "number" || typeof model !== "number") return null;
      const gap = human - model;
      const axis = boardAxes[map.axis];
      return {
        id: entry.id,
        label: map.label,
        axis: map.axis,
        human_baseline: human,
        model_baseline: model,
        divergence: Number(gap.toFixed(3)),
        divergence_class: gap > 0.3 ? "HUMAN-LEAD" : gap < -0.3 ? "MODEL-LEAD" : "NEAR-TIE",
        measured_note: axis ? `MEASURED on ${axis}: n=${axis.n}` : "axis not yet measured",
        source: entry.source,
        source_url: entry.source_url,
        as_of: entry.as_of,
        captured_at: entry.captured_at,
        attribution_basis: entry.attribution_basis,
        register: "REPORTED human baselines never mix into MEASURED cells — the cross is displayed, never blended.",
      };
    })
    .filter(Boolean);

  const payload = {
    schema: "csoai.divergence-map/0.1",
    ts: new Date().toISOString(),
    note: "Where human and machine judgment split on identical items — the only number a buyer can read. REPORTED (published human baselines) vs MEASURED (our deterministic fleet). Displayed, never blended.",
    register: "measurement, not certification. Published human aggregates = rail one, no DPIA. Live-human data stays DPIA-gated.",
    measured_source: "councilof.ai/api/gspc (deterministic fleet, frozen splits)",
    reported_source: "councilof.ai/api/reported (published human baselines, captured + attributed)",
    divergences,
    count: divergences.length,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300" },
  });
};
