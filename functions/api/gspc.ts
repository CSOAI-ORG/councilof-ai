// functions/api/gspc.ts — the six-axis GSPC payload the globe needs and does not have.
//
// Drop into CSOAI-ORG/councilof-ai at functions/api/gspc.ts. Cloudflare Pages
// auto-discovers it, so it becomes https://www.csoai.org/api/gspc with no config.
//
// WHY THIS EXISTS
//   globe3d.html already has a full layer system (layerTag on every entity, .lyr
//   toggles, a postMessage command API). What it has never had is anything to layer
//   BY. /api/nodes returns 12 sovereign nodes with no axis field; the GSPC worker
//   serves /api/anchors but has no /api/gspc. So the six axes exist on Hugging Face
//   and in two eval harnesses, and nowhere in the product.
//
//   This is the missing join. One endpoint, six axes, measured numbers with their n.
//
// REGISTER
//   Every score below is MEASURED — Council-34 on sov-brain-2, 2026-08-04,
//   graded by the same deterministic regex the published lm-eval and Inspect tasks
//   use. unparsed_rate is reported, never folded into the error rate. n is on every
//   row. Nothing here is an attestation and nothing here is certification.
//
// TO UPDATE
//   Re-run baseline/measure.py against any model on the pod and paste the resulting
//   gspc_baseline_*.json values into AXES below. Do not hand-edit a score without
//   re-running the harness — that is the whole point of the instrument.

interface AxisScore {
  axis: string;
  bench: string;
  task: string;
  n: number;
  accuracy: number;
  macro_f1: number;
  unparsed_rate: number;
  status: "MEASURED" | "UNMEASURED" | "DRAFT" | "SPEC" | "PLANNED";
  interval?: [number, number];   // Wilson 95% CI — present ONLY where usable_n >= 30
  dataset: string;
  colour: string;   // globe layer colour
  hue: number;      // 0-360, for procedural ramps
  note?: string;    // present on DRAFT / caveated axes
}

const MEASURED_ON = {
  model: "qwen3:30b-a3b (governance interval) · cross-company board of 8 frontier models",
  endpoint: "A100 · local Ollama + OpenRouter",
  date: "2026-08-05",
  grading: "deterministic regex + macro-F1, identical to the published lm-eval and Inspect tasks",
  note: "Governance carries the only interval (n=237 clears usable_n>=30). Every other axis has a live " +
    "bank but its clean multi-model re-measure is in progress — shown as UNMEASURED, no score, by our own rule.",
};

const AXES: AxisScore[] = [
  {
    axis: "governance", bench: "GovBench", task: "EU AI Act risk-tier classification",
    // v2 bank: 237 public items (+102 held back privately), imported 2026-08-05 from the AI Act
    // Evaluation Benchmark (NCSR "Demokritos", arXiv:2603.09435, CC-BY-4.0). RE-MEASURED 2026-08-05
    // on the full n=237 bank — the first axis to clear usable_n>=30, so the first to carry an interval.
    n: 237, accuracy: 0.515, macro_f1: 0.381, unparsed_rate: 0.0, status: "MEASURED",
    interval: [0.451, 0.578],
    dataset: "csoai/gspc-gov", colour: "#34d399", hue: 152,
    note:
      "The first axis over usable_n>=30 (7.9x), so the first with a Wilson interval. Shown here is OUR " +
      "model, Council-34 (model id Council-34): accuracy 0.515 [0.451, 0.578] at n=237 (2026-08-05) — mid-pack, not flattered. The " +
      "full n=237 board: sovereign Council-34 0.515 / falcon3 0.426 / qwen2.5-1.5b 0.430; rented frontier " +
      "models cluster higher at 0.66-0.74, all with overlapping intervals. No model is clearly best at " +
      "EU AI Act tiering — a finding, not a broken bank. We show our own model's honest number, not a " +
      "rented model's higher one.",
  },
  {
    axis: "safety", bench: "DefBench", task: "calibrated refusal on paired requests",
    n: 14, accuracy: 0.643, macro_f1: 0.653, unparsed_rate: 0.071, status: "MEASURED",
    dataset: "csoai/gspc-agi", colour: "#f87171", hue: 0,
  },
  {
    axis: "provenance", bench: "ProvBench", task: "Article 50 marking survival by validity",
    n: 16, accuracy: 0, macro_f1: 0, unparsed_rate: 0, status: "UNMEASURED",
    dataset: "csoai/gspc-prv", colour: "#60a5fa", hue: 213,
    note: "v3 bank live 2026-08-05 (validity principle: a manifest present but whose binding no longer " +
      "validates has NOT survived). Awaiting a clean multi-model board — no score shown until then.",
  },
  {
    axis: "continuity", bench: "PQCBench", task: "post-quantum status of a cryptographic assumption",
    n: 33, accuracy: 0, macro_f1: 0, unparsed_rate: 0, status: "UNMEASURED",
    dataset: "csoai/gspc-asi", colour: "#c084fc", hue: 271,
    note: "The one axis measured to DISCRIMINATE across frontier models (spread 0.295). Bank grown to " +
      "n=33 on 2026-08-05 so it can carry its first interval — awaiting the clean board to publish it.",
  },
  {
    axis: "conformance", bench: "MCPBench", task: "MCP tool conformance",
    n: 11, accuracy: 0.636, macro_f1: 0.667, unparsed_rate: 0.091, status: "MEASURED",
    dataset: "csoai/gspc-mcp", colour: "#fbbf24", hue: 43,
  },
  {
    axis: "openness", bench: "OSSBench", task: "licence reasoning versus intended use",
    n: 16, accuracy: 0, macro_f1: 0, unparsed_rate: 0, status: "UNMEASURED",
    dataset: "csoai/gspc-oss", colour: "#2dd4bf", hue: 174,
    note: "v2 bank live 2026-08-05 (licence reasoning: AGPL network trigger, directional compatibility, " +
      "SSPL/ELv2/BSL service clauses). Awaiting a clean multi-model board — no score shown until then.",
  },
  {
    axis: "machinery-conformity", bench: "MachBench",
    task: "Machinery Reg self-evolving safety-function classification (PART_A / OUT_OF_SCOPE / NOT_SAFETY_FUNCTION)",
    n: 16, accuracy: 0.375, macro_f1: 0.182, unparsed_rate: 0.0, status: "DRAFT",
    dataset: "csoai/gspc-mach", colour: "#fb923c", hue: 40,
    note:
      "DRAFT — not published. n=16 < usable_n=30, NOT quotable by our own rule. 3 disputed items " +
      "excluded from the score (the law itself does not resolve them). Awaiting legal review of the " +
      "gold labels. Anchor: Machinery Reg (EU) 2023/1230 Annex I Part A items 5-6, applies 14 Jan 2027.",
  },
  {
    axis: "care", bench: "CareBench", task: "care-cost (protect × help) under paired conduct scenarios",
    n: 0, accuracy: 0, macro_f1: 0, unparsed_rate: 0, status: "DRAFT",
    dataset: "csoai/gspc-care", colour: "#f472b6", hue: 330,
    note: "DRAFT — care-cost/conduct measure consolidating conduct-bench + care-battery; not yet at n≥30, not quoted.",
  },
  {
    axis: "cross-reality", bench: "XRAIV", task: "autonomous agent action authority (PROCEED / CONFIRM / REFUSE)",
    n: 16, accuracy: 0, macro_f1: 0, unparsed_rate: 0, status: "UNMEASURED",
    dataset: "csoai/gspc-xr", colour: "#a78bfa", hue: 258,
    note: "v0 bank published 2026-08-05 (csoai/gspc-xr, 16 public + 8 held out) + a LangGraph " +
      "arena (arena.py) that scores an agent's action authority per step against the GSPC grader and " +
      "signs the match. n<30 so no interval; clean board in progress.",
  },
  {
    axis: "detector-interop", bench: "DetBench", task: "cross-detector watermark interoperability matrix",
    n: 0, accuracy: 0, macro_f1: 0, unparsed_rate: 0, status: "SPEC",
    dataset: "csoai/gspc-det", colour: "#38bdf8", hue: 199,
    note: "SPEC — methodology published (POAI detector-interop); the N×M matrix needs the signatories' marking tools + detectors. Code-of-Practice target 2 Feb 2027.",
  },
  {
    axis: "art5-safeguard", bench: "Art5Bench", task: "EU AI Act Article 5 prohibited-practice trip",
    n: 16, accuracy: 0, macro_f1: 0, unparsed_rate: 0, status: "UNMEASURED",
    dataset: "csoai/gspc-art5", colour: "#fb7185", hue: 350,
    note: "v0 bank published 2026-08-05 (csoai/gspc-art5, 16 public + 8 held out): given an " +
      "AI practice, PROHIBITED (caught by Article 5) or PERMITTED, designed to discriminate on the " +
      "exceptions (medical/safety emotion recognition, warranted RBI, non-sensitive biometric sorting, " +
      "within-service fraud scoring). n<30 so no interval; clean multi-model board in progress. " +
      "This replaces the earlier NCII/CSAM framing — that corpus is never handled by CSOAI.",
  },
  {
    axis: "swarm", bench: "SwarmBench", task: "multi-agent coordination safety",
    n: 0, accuracy: 0, macro_f1: 0, unparsed_rate: 0, status: "PLANNED",
    dataset: "csoai/gspc-swarm", colour: "#94a3b8", hue: 215,
    note: "PLANNED — repo exists but has no item bank yet. Named and dated, not measured, not fabricated.",
  },
  {
    axis: "affect", bench: "AffectBench", task: "emotional & embodied safety (manipulation / disclosure / vulnerability)",
    n: 41, accuracy: 0, macro_f1: 0, unparsed_rate: 0, status: "DRAFT",
    dataset: "csoai/gspc-affect", colour: "#ec4899", hue: 330,
    note: "DRAFT — bank live on HF 2026-08-12, v2.1 same day (41 public + 18 held-out, PROHIBITED 18 / DISCLOSE 11 / PERMITTED 12, n≥30 floor PASS, contamination guard clean, held-out never uploaded, split membership pinned). DISCLOSE class grades Art 50 transparency duties — the only GSPC bank that does. v2.1 adds the three laundering patterns: persona-hijack, fiction-bypass, false-permission. No score exists: awaiting counsel blessing of the legal gold schema and the clean board. Anchors: Art 5(1)(a)/(b) PROHIBITED (live 2 Feb 2025), Art 50(3) DISCLOSE (live 2 Aug 2026), Annex III 1(c) conformity (Dec 2027 clock). Severity 1–5 + basis strings, COUNSEL-PENDING.",
  },
];

const round = (x: number, p = 4) => Math.round(x * 10 ** p) / 10 ** p;

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const axis = url.searchParams.get("axis");

  const selected = axis ? AXES.filter((a) => a.axis === axis) : AXES;
  if (axis && selected.length === 0) {
    return new Response(
      JSON.stringify({ error: "unknown axis", known: AXES.map((a) => a.axis) }, null, 2),
      { status: 404, headers: { "content-type": "application/json; charset=utf-8" } },
    );
  }

  const items = selected.reduce((s, a) => s + a.n, 0);
  const body = {
    schema: "csoai.gspc-axes/0.2",
    issuer: "CSOAI Ltd (GB, Companies House 16939677)",
    doi: "10.5281/zenodo.21755656",
    measured_on: MEASURED_ON,
    note:
      "Measurement, not certification. Every score is a measured run on a published, " +
      "frozen split; the harness is public and anyone can recompute and challenge it. " +
      "unparsed_rate is the share of responses no label could be read from — reported " +
      "as UNMEASURED, never scored as a wrong answer.",
    totals: (() => {
      // DRAFT / unpublished axes never fold into a headline mean.
      const m = selected.filter((a) => a.status === "MEASURED");
      const avg = (f: (a: typeof m[number]) => number) =>
        m.length ? round(m.reduce((s, a) => s + f(a), 0) / m.length) : null;
      return {
        axes: selected.length,
        measured_axes: m.length,
        items,
        mean_macro_f1: avg((a) => a.macro_f1),
        mean_accuracy: avg((a) => a.accuracy),
        mean_unparsed_rate: avg((a) => a.unparsed_rate),
        mean_note: "Means are over MEASURED axes only; DRAFT axes are shown but excluded.",
      };
    })(),
    axes: selected,
    limitations: [
      "Governance is the only axis over usable_n>=30 (n=237) and the only one carrying an interval. Every other axis shows its bank size but no score until its clean multi-model board lands.",
      "Scores describe measured runs on frozen splits on a date. They do not describe a system's compliance with anything.",
      "CSOAI is a measurement body, not a certification or accreditation body, and not a notified body.",
    ],
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
};
