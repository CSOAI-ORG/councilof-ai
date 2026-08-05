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
//   Every score below is MEASURED — sov34:latest on sov-brain-2, 2026-08-04,
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
  status: "MEASURED" | "UNMEASURED" | "DRAFT";
  dataset: string;
  colour: string;   // globe layer colour
  hue: number;      // 0-360, for procedural ramps
  note?: string;    // present on DRAFT / caveated axes
}

const MEASURED_ON = {
  model: "sov34:latest",
  endpoint: "sov-brain-2 · Ollama",
  date: "2026-08-04",
  grading: "deterministic regex + macro-F1, identical to the published lm-eval and Inspect tasks",
};

const AXES: AxisScore[] = [
  {
    axis: "governance", bench: "GovBench", task: "EU AI Act risk-tier classification",
    n: 24, accuracy: 0.458, macro_f1: 0.386, unparsed_rate: 0.042, status: "MEASURED",
    dataset: "csoai/gspc-gov", colour: "#34d399", hue: 152,
  },
  {
    axis: "safety", bench: "DefBench", task: "calibrated refusal on paired requests",
    n: 14, accuracy: 0.643, macro_f1: 0.653, unparsed_rate: 0.071, status: "MEASURED",
    dataset: "csoai/gspc-agi", colour: "#f87171", hue: 0,
  },
  {
    axis: "provenance", bench: "ProvBench", task: "Article 50 marking survival",
    n: 15, accuracy: 0.200, macro_f1: 0.273, unparsed_rate: 0.733, status: "MEASURED",
    dataset: "csoai/gspc-prv", colour: "#60a5fa", hue: 213,
  },
  {
    axis: "continuity", bench: "PQCBench", task: "post-quantum signing agility",
    n: 13, accuracy: 0.231, macro_f1: 0.217, unparsed_rate: 0.308, status: "MEASURED",
    dataset: "csoai/gspc-asi", colour: "#c084fc", hue: 271,
  },
  {
    axis: "conformance", bench: "MCPBench", task: "MCP tool conformance",
    n: 11, accuracy: 0.636, macro_f1: 0.667, unparsed_rate: 0.091, status: "MEASURED",
    dataset: "csoai/gspc-mcp", colour: "#fbbf24", hue: 43,
  },
  {
    axis: "openness", bench: "OSSBench", task: "licence versus intended use",
    n: 13, accuracy: 0.538, macro_f1: 0.500, unparsed_rate: 0.154, status: "MEASURED",
    dataset: "csoai/gspc-oss", colour: "#2dd4bf", hue: 174,
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
    doi: "10.5281/zenodo.21755657",
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
      "Small splits — 11 to 24 items per axis, 90 in total. Report the n with any figure.",
      "Scores describe one model on one frozen split on one date. They do not describe a system's compliance with anything.",
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
