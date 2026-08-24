// functions/api/regulator-findings.ts — PUBLIC white-label EU AI Act compliance findings.
//
// The pivot, exposed: we hand regulators + deployers a WORKING endpoint that sorts every
// AI-compliance problem a deployment triggers — obligation, measured gap (from the signed
// GSPC board), and the exact fine exposure (€35M/7%, €15M/3% from /api/regulation) — before
// anyone is contacted. Measurement, not certification; UNMEASURED axes are honest, never
// ranked. Read-only, no model consulted, deterministic. Fetches live via same-origin proxy
// (the rounds.jsonl.js pattern).
//
// GET /api/regulator-findings?deployment=<desc>[&sector=insurance|bond|cobol]

const AXIS_TO_OBLIGATION: Record<string, { obligation: string; tier: string }> = {
  governance: { obligation: "Article 5 prohibited practices", tier: "prohibited_practices" },
  safety: { obligation: "Article 5 + Annex III high-risk", tier: "prohibited_practices" },
  provenance: { obligation: "Article 50 transparency + GPAI", tier: "most_obligations_incl_art50_and_gpai" },
  continuity: { obligation: "Article 14 risk management", tier: "most_obligations_incl_art50_and_gpai" },
  conformance: { obligation: "Article 13 conformity", tier: "most_obligations_incl_art50_and_gpai" },
  openness: { obligation: "Article 53 GPAI transparency", tier: "most_obligations_incl_art50_and_gpai" },
  "jailbreak-resistance": { obligation: "Article 5 prohibited practices", tier: "prohibited_practices" },
  care: { obligation: "Article 5 + proportionality", tier: "most_obligations_incl_art50_and_gpai" },
  affect: { obligation: "Article 5 emotion-recognition", tier: "prohibited_practices" },
  det: { obligation: "Article 5 social-scoring", tier: "prohibited_practices" },
  mcp: { obligation: "Article 50 AI systems output", tier: "most_obligations_incl_art50_and_gpai" },
  xsr: { obligation: "Article 5 biometric-categorisation", tier: "prohibited_practices" },
  agi: { obligation: "Article 5 + systemic-risk", tier: "most_obligations_incl_art50_and_gpai" },
};

const SECTOR_FRAMEWORKS: Record<string, string[]> = {
  insurance: ["EU AI Act Art 5 + high-risk", "Solvency II (AI-risk)", "EIOPA AI principles", "FCA AI guidance"],
  bond: ["EU AI Act high-risk (credit-scoring)", "ESMA AI governance", "CRA regulation (AI models)", "Basel Pillar 3 (model-risk)"],
  cobol: ["EU AI Act (where applicable)", "Defence AI doctrine", "AUKUS interoperability", "Ethical AI (weapon-control) prohibition"],
};

const GRADE_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNMEASURED"];

// EU AI Act Article -> the GSPC axes that measure it + penalty tier. Article-granularity
// findings (the user's explicit ask: "all eu articles and fines", "findings of article 6").
const ARTICLE_TO_AXES: Record<string, { title: string; axes: string[]; tier: string }> = {
  "Article 4": { title: "AI literacy", axes: ["governance"], tier: "most_obligations_incl_art50_and_gpai" },
  "Article 5": { title: "Prohibited AI practices", axes: ["safety", "affect", "det", "jail", "art5-safeguard"], tier: "prohibited_practices" },
  "Article 6": { title: "High-risk classification", axes: ["governance", "safety", "conformance"], tier: "most_obligations_incl_art50_and_gpai" },
  "Article 9": { title: "Risk management system", axes: ["governance", "continuity"], tier: "most_obligations_incl_art50_and_gpai" },
  "Article 13": { title: "Transparency to deployers", axes: ["conformance", "provenance"], tier: "most_obligations_incl_art50_and_gpai" },
  "Article 14": { title: "Human oversight", axes: ["continuity", "governance"], tier: "most_obligations_incl_art50_and_gpai" },
  "Article 50": { title: "Transparency to end-users", axes: ["provenance", "openness"], tier: "most_obligations_incl_art50_and_gpai" },
  "Article 53": { title: "GPAI model obligations", axes: ["openness", "provenance"], tier: "most_obligations_incl_art50_and_gpai" },
  "Article 55": { title: "Systemic-risk GPAI", axes: ["governance", "safety"], tier: "most_obligations_incl_art50_and_gpai" },
};

function grade(rate: number | null): { grade: string; note: string } {
  if (rate === null) return { grade: "UNMEASURED", note: "insufficient data — not a ranking" };
  if (rate >= 0.75) return { grade: "LOW", note: "measured compliant on this axis" };
  if (rate >= 0.5) return { grade: "MEDIUM", note: "measured partial compliance" };
  if (rate >= 0.25) return { grade: "HIGH", note: "measured material gap" };
  return { grade: "CRITICAL", note: "measured non-compliance risk" };
}

async function fetchJson(request: Request, path: string) {
  const res = await fetch(new URL(path, request.url), { headers: { accept: "application/json" } });
  if (!res.ok) return {};
  try { return await res.json(); } catch { return {}; }
}

function sectorKeys(sector: string): string[] {
  const map: Record<string, string[]> = {
    insurance: ["governance", "safety", "provenance", "continuity", "care"],
    bond: ["governance", "conformance", "provenance", "continuity", "det", "care"],
    cobol: ["governance", "safety", "jailbreak-resistance"],
  };
  return map[sector] || Object.keys(AXIS_TO_OBLIGATION);
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const deployment = url.searchParams.get("deployment") || "unspecified AI deployment";
  const sector = url.searchParams.get("sector");

  const reg = await fetchJson(request, "/api/regulation");
  const board = await fetchJson(request, "/api/gspc");
  const penalties = reg.penalty_tiers_eu_ai_act || {};

  const acc: Record<string, { accuracy: number | null; n?: number; leader?: string; interval?: string }> = {};
  const axes = board.axes;
  if (Array.isArray(axes)) {
    for (const a of axes) acc[a.axis] = { accuracy: a.accuracy ?? null, n: a.n, leader: a.leader };
  } else if (axes && typeof axes === "object") {
    for (const k of Object.keys(axes)) acc[k] = { accuracy: axes[k]?.accuracy ?? null, n: axes[k]?.n, leader: axes[k]?.leader };
  }

  const keys = sector ? sectorKeys(sector) : Object.keys(AXIS_TO_OBLIGATION);
  const findings = keys
    .map((axis) => {
      const { obligation, tier } = AXIS_TO_OBLIGATION[axis];
      const measured = acc[axis]?.accuracy ?? null;
      const g = grade(measured);
      return {
        axis,
        obligation,
        measured,
        n: acc[axis]?.n ?? null,
        leader: acc[axis]?.leader ?? null,
        grade: g.grade,
        note: g.note,
        penalty_exposure: penalties[tier] || "see /api/regulation",
      };
    })
    .sort((a, b) => GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade));

  // Article-granularity findings: group the axes per EU AI Act Article, take the worst
  // measured gap across the article's axes, report the fine exposure. `?by=article` mode.
  const by = url.searchParams.get("by");
  if (by === "article") {
    const articles = Object.entries(ARTICLE_TO_AXES).map(([article, a]) => {
      const axisRates: Record<string, number | null> = {};
      for (const ax of a.axes) axisRates[ax] = acc[ax]?.accuracy ?? null;
      const rates = Object.values(axisRates).filter((v): v is number => v !== null);
      const worst = rates.length ? Math.min(...rates) : null;
      const g = grade(worst);
      return {
        article,
        title: a.title,
        axes: a.axes,
        axis_rates: axisRates,
        worst_measured: worst,
        grade: g.grade,
        note: g.note,
        penalty_exposure: penalties[a.tier] || "see /api/regulation",
      };
    }).sort((a, b) => GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade));

    return new Response(JSON.stringify({
      schema: "csoai.white-label-article-findings/0.1",
      ts: new Date().toISOString(),
      deployment,
      note: "Article-granularity EU AI Act findings. Measurement, not certification — UNMEASURED articles are honest, never ranked.",
      articles,
      penalty_tiers: penalties,
      verify_path: "/api/arena/scoreboard?verify=1",
    }, null, 2), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" },
    });
  }

  const body = {
    schema: "csoai.white-label-regulator-findings/0.1",
    ts: new Date().toISOString(),
    deployment,
    sector: sector ? SECTOR_FRAMEWORKS[sector] : null,
    note: "We hand regulators + deployers a working GSPC E2E that sorts every AI-compliance problem before anyone is contacted. Measurement, not certification — UNMEASURED axes are honest, never invented.",
    findings,
    penalty_tiers: penalties,
    verify_path: "/api/arena/scoreboard?verify=1",
  };
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" },
  });
}
