import { useEffect } from "react";
import { useBoardCount } from "@/lib/boardCount";

/**
 * /owasp-asi — GSPC axes mapped to OWASP AI Exchange categories.
 *
 * The OWASP AI Exchange (https://owaspai.org) organises AI security into 7 sections
 * (0–6) with 10 essential control subcategories. This page shows which GSPC axes
 * measure which OWASP concern. One axis may span multiple categories; the mapping
 * is a coverage indicator, not a grade.
 *
 * "We measure presence and provenance of published commitments, never their quality;
 * absence of a published framework is not a finding of unsafe practice."
 *
 * Sources: OWASP AI Exchange v1.0 (owaspai.org, CC0 1.0), cited Dec 2025.
 * Every row is sourced; the mapping is a CSOAI editorial act, not an OWASP endorsement.
 */

const CATEGORIES = [
  {
    id: "1.1",
    owasp: "Governance, Risk & Compliance",
    section: "§1 General Controls",
    href: "https://owaspai.org/go/governancecontrols",
    axes: ["governance", "art5-safeguard", "regulatory-framework"],
    note: "Art 5-safeguard measures EU AI Act Art 50 marking readiness; regulatory-framework measures statutory register membership.",
  },
  {
    id: "1.2",
    owasp: "Supply Chain Management",
    section: "§1 General Controls",
    href: "https://owaspai.org/go/supplychainmanage",
    axes: ["provenance", "custody-disclosure", "reserve-attestation"],
    note: "Provenance tracks model and data lineage; custody and attestation track financial supply chains.",
  },
  {
    id: "1.3",
    owasp: "Limit Unwanted Behaviour",
    section: "§1 General Controls",
    href: "https://owaspai.org/go/limitunwanted",
    axes: ["safety", "care", "jail", "affect"],
    note: "Safety = adversarial robustness; care = harm-avoidance; jail = containment; affect = emotional safety.",
  },
  {
    id: "2",
    owasp: "Input Threats (Evasion, Prompt Injection, Extraction)",
    section: "§2 Input Threats",
    href: "https://owaspai.org/docs/2_threats_through_use/",
    axes: ["safety", "swarm", "detector-interop", "cross-reality"],
    note: "Swarm measures coordinated multi-model attack surfaces; detector-interop measures adversarial detector resistance; cross-reality measures cross-domain transfer.",
  },
  {
    id: "3",
    owasp: "Development-Time Threats (Data Poisoning, Model Leaks)",
    section: "§3 Development-Time",
    href: "https://owaspai.org/docs/3_development_time_threats/",
    axes: ["provenance", "continuity", "openness"],
    note: "Provenance = data lineage; continuity = model versioning and reproducibility; openness = code and weight transparency.",
  },
  {
    id: "4",
    owasp: "Runtime Security (Model Leaks, Output Injection, Resource Exhaustion)",
    section: "§4 Runtime Security",
    href: "https://owaspai.org/docs/4_runtime_application_security_threats/",
    axes: ["machinery-conformity", "conformance", "distribution-integrity"],
    note: "Machinery-conformity = runtime safety-critical compliance (Machinery Regulation); conformance = MCP/API protocol adherence; distribution-integrity = runtime financial distribution correctness.",
  },
  {
    id: "5",
    owasp: "AI Security Testing",
    section: "§5 Testing",
    href: "https://owaspai.org/docs/5_testing/",
    axes: ["governance", "safety", "care", "jail", "swarm", "detector-interop"],
    note: "GSPC's measurement IS testing: frozen banks, deterministic grading, signed cards. Every measured axis carries per-item evidence a stranger can re-verify.",
  },
  {
    id: "6",
    owasp: "AI Privacy",
    section: "§6 Privacy",
    href: "https://owaspai.org/go/aiprivacy",
    axes: ["care", "affect", "custody-disclosure"],
    note: "Care measures data-handling safety; affect measures emotional/privacy boundaries; custody-disclosure measures financial data transparency.",
  },
  {
    id: "C1",
    owasp: "Sensitive Data Minimisation",
    section: "Essentials — Limit",
    href: "https://owaspai.org/go/dataminimize",
    axes: ["care", "reserve-attestation"],
    note: "Care includes data minimisation subtasks; reserve attestation measures disclosure granularity (never the reserves themselves).",
  },
  {
    id: "C2",
    owasp: "Model Behaviour Constraints (Oversight, Transparency, Least Privilege)",
    section: "Essentials — Limit",
    href: "https://owaspai.org/go/oversight",
    axes: ["governance", "art5-safeguard", "openness", "ai-adoption-components", "labour-components", "humanoid-labour-index"],
    note: "Art 5-safeguard = Art 50 transparency readiness; adoption/labour/humanoid axes measure real-world deployment constraints.",
  },
] as const;

const AXIS_LABELS: Record<string, string> = {
  governance: "Governance",
  safety: "Safety",
  provenance: "Provenance",
  continuity: "Continuity",
  conformance: "Conformance",
  openness: "Openness",
  "machinery-conformity": "Machinery",
  care: "Care",
  "cross-reality": "Cross-Reality",
  "detector-interop": "Detector",
  "art5-safeguard": "Art 5-Safeguard",
  swarm: "Swarm",
  affect: "Affect",
  jail: "Jail",
  "provenance-controls": "Provenance Controls",
  "reserve-attestation": "Reserve Attestation",
  "regulatory-framework": "Regulatory",
  "distribution-integrity": "Distribution",
  "custody-disclosure": "Custody",
  "ai-adoption-components": "AI Adoption",
  "labour-components": "Labour",
  "humanoid-labour-index": "Humanoid Labour",
};

export default function OwaspAsiMapping() {
  const board = useBoardCount();

  useEffect(() => {
    document.title = "OWASP AI Exchange — GSPC Axis Mapping | Council of AI";
  }, []);

  // Build coverage matrix: which categories each axis covers
  const axisCoverage = new Map<string, string[]>();
  for (const cat of CATEGORIES) {
    for (const axis of cat.axes) {
      const existing = axisCoverage.get(axis) ?? [];
      existing.push(cat.id);
      axisCoverage.set(axis, existing);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-600">
        Council of AI — OWASP AI Exchange mapping
      </p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
        GSPC axes → OWASP AI Exchange
      </h1>
      <p className="mt-4 max-w-3xl text-slate-600">
        The OWASP AI Exchange (owaspai.org, CC0 1.0) organises AI security into 7 sections
        with 10 essential control subcategories. The {board.public_count ?? "22-axis"} GSPC board
        measures behavioural and financial axes. This page maps each GSPC axis to the OWASP
        concern it addresses. The mapping is a CSOAI editorial act — not an OWASP endorsement.
        One axis may span multiple categories.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">Coverage table</h2>
        <p className="mt-2 text-sm text-slate-500">
          Each row is one OWASP category. Axes listed are measured on the GSPC board.
          Sources: OWASP AI Exchange v1.0 (Dec 2025), cited at{" "}
          <a className="text-emerald-700 underline" href="https://owaspai.org">owaspai.org</a>.
        </p>
        <div className="mt-4 space-y-4">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-mono text-xs text-emerald-700">{cat.id}</span>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{cat.owasp}</h3>
                  <p className="text-xs text-slate-400">{cat.section}</p>
                </div>
                <a
                  href={cat.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-emerald-400"
                >
                  OWASP ↗
                </a>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {cat.axes.map((axis) => (
                  <span
                    key={axis}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                  >
                    {AXIS_LABELS[axis] ?? axis}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-600">{cat.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">Axis → category index</h2>
        <p className="mt-2 text-sm text-slate-500">
          Reverse lookup: for each GSPC axis, which OWASP categories it addresses.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[...axisCoverage.entries()].sort().map(([axis, cats]) => (
            <div
              key={axis}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <span className="font-semibold text-slate-900">
                {AXIS_LABELS[axis] ?? axis}
              </span>
              <span className="ml-2 font-mono text-xs text-slate-400">
                → {cats.join(", ")}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-bold text-slate-900">Method note</h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          This mapping places each GSPC axis against the OWASP AI Exchange section or
          essential subcategory whose threat model the axis most directly measures. An axis
          may appear in multiple categories when it addresses overlapping concerns (e.g.
          "safety" addresses both input threats and behaviour limiting). The OWASP AI Exchange
          is the authoritative source for AI security controls; GSPC axes are the measurement
          instruments. Coverage of a category means at least one GSPC axis measures something
          in that category's scope — it does not mean the category is exhaustively covered.
          We measure presence of published commitments, never their quality.
        </p>
        <p className="mt-3 text-xs text-slate-400">
          Source: OWASP AI Exchange, owaspai.org, CC0 1.0. CSOAI mapping as_of{" "}
          {new Date().toISOString().slice(0, 10)}. This is a CSOAI editorial act.
          OWASP does not endorse this mapping.
        </p>
      </section>
    </main>
  );
}
