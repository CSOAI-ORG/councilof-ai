import { useMemo, useState } from "react";

// CSOAI Risk Heatmap — HUNT_24 Tier-1 #4 (#1 requested enterprise GRC feature).
// Interactive 5x5 likelihood x impact matrix with a plotted risk register.
// Click a cell or a risk to inspect. Client-side, demoable.

type Risk = {
  id: string;
  title: string;
  category: string;
  likelihood: number; // 1-5
  impact: number; // 1-5
  owner: string;
  treatment: string;
};

const RISKS: Risk[] = [
  { id: "R-01", title: "Model bias in CV screening", category: "AI/Fairness", likelihood: 4, impact: 4, owner: "People Ops", treatment: "Quarterly bias audit + human review gate" },
  { id: "R-02", title: "Prompt injection in support agent", category: "AI/Security", likelihood: 3, impact: 4, owner: "Trust & Safety", treatment: "Input filtering + output guardrails" },
  { id: "R-03", title: "EU AI Act Art 50 non-disclosure", category: "Regulatory", likelihood: 2, impact: 5, owner: "Legal", treatment: "Transparency banner shipped" },
  { id: "R-04", title: "Training data provenance gap", category: "Data", likelihood: 3, impact: 3, owner: "ML Platform", treatment: "Dataset documentation backfill" },
  { id: "R-05", title: "Vendor model outage", category: "Operational", likelihood: 3, impact: 2, owner: "SRE", treatment: "Fallback provider + circuit breaker" },
  { id: "R-06", title: "Model drift undetected", category: "AI/Quality", likelihood: 4, impact: 3, owner: "ML Platform", treatment: "Drift monitors + alerts" },
  { id: "R-07", title: "PII leakage in logs", category: "Privacy", likelihood: 2, impact: 4, owner: "Security", treatment: "PII redaction at ingest" },
  { id: "R-08", title: "Unapproved model in prod", category: "Governance", likelihood: 2, impact: 3, owner: "AI Gov", treatment: "Registry gate in CI" },
];

const L_LABELS = ["Rare", "Unlikely", "Possible", "Likely", "Almost certain"];
const I_LABELS = ["Negligible", "Minor", "Moderate", "Major", "Severe"];

function cellScore(l: number, i: number) {
  return l * i; // 1..25
}
function cellColor(score: number) {
  if (score >= 15) return "bg-red-500/85 text-white";
  if (score >= 9) return "bg-amber-400/85 text-amber-950";
  if (score >= 4) return "bg-yellow-200 text-yellow-900";
  return "bg-emerald-200 text-emerald-900";
}

export default function RiskHeatmap() {
  const [sel, setSel] = useState<Risk | null>(RISKS[0]);

  const byCell = useMemo(() => {
    const m: Record<string, Risk[]> = {};
    RISKS.forEach((r) => {
      const k = r.likelihood + "-" + r.impact;
      (m[k] = m[k] || []).push(r);
    });
    return m;
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-emerald-300 font-semibold tracking-wide uppercase text-sm">Risk management</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Risk Heatmap</h1>
          <p className="mt-5 text-lg text-emerald-50 max-w-2xl">Plot every AI and operational risk on a likelihood × impact matrix. Click a risk to see its owner and treatment.</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 grid gap-8 lg:grid-cols-3">
        {/* Matrix */}
        <div className="lg:col-span-2">
          <div className="flex">
            <div className="flex items-center">
              <span className="rotate-180 text-xs font-semibold uppercase tracking-wide text-gray-500" style={{ writingMode: "vertical-rl" }}>Impact →</span>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-1.5">
                {[5, 4, 3, 2, 1].map((impact) =>
                  [1, 2, 3, 4, 5].map((likelihood) => {
                    const k = likelihood + "-" + impact;
                    const here = byCell[k] || [];
                    const score = cellScore(likelihood, impact);
                    return (
                      <button
                        key={k}
                        onClick={() => here[0] && setSel(here[0])}
                        className={`relative aspect-square rounded-lg ${cellColor(score)} flex items-center justify-center text-xs font-bold transition hover:ring-2 hover:ring-gray-900/30`}
                        title={`L${likelihood} × I${impact} = ${score}`}
                      >
                        {here.length > 0 && (
                          <span className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5 p-1">
                            {here.map((r) => (
                              <span key={r.id} className={`rounded px-1 text-[10px] font-mono ${sel?.id === r.id ? "bg-gray-900 text-white" : "bg-white/70 text-gray-900"}`}>{r.id}</span>
                            ))}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              <div className="mt-2 grid grid-cols-5 gap-1.5 text-center text-[10px] uppercase tracking-wide text-gray-500">
                {L_LABELS.map((l) => <span key={l}>{l}</span>)}
              </div>
              <div className="mt-1 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Likelihood →</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
            <Legend c="bg-emerald-200" t="Low (1-3)" />
            <Legend c="bg-yellow-200" t="Moderate (4-8)" />
            <Legend c="bg-amber-400/85" t="High (9-14)" />
            <Legend c="bg-red-500/85" t="Critical (15-25)" />
          </div>
        </div>

        {/* Detail + register */}
        <div className="space-y-6">
          {sel && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-gray-500">{sel.id}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cellColor(cellScore(sel.likelihood, sel.impact))}`}>score {cellScore(sel.likelihood, sel.impact)}</span>
              </div>
              <h3 className="mt-2 font-bold text-gray-900">{sel.title}</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <Row k="Category" v={sel.category} />
                <Row k="Likelihood" v={`${sel.likelihood} — ${L_LABELS[sel.likelihood - 1]}`} />
                <Row k="Impact" v={`${sel.impact} — ${I_LABELS[sel.impact - 1]}`} />
                <Row k="Owner" v={sel.owner} />
                <Row k="Treatment" v={sel.treatment} />
              </dl>
            </div>
          )}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-bold text-gray-900">Risk register</h3>
            <div className="mt-3 space-y-1">
              {RISKS.map((r) => (
                <button key={r.id} onClick={() => setSel(r)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${sel?.id === r.id ? "bg-emerald-50" : "hover:bg-gray-50"}`}>
                  <span className="truncate text-gray-700"><span className="font-mono text-xs text-gray-400">{r.id}</span> {r.title}</span>
                  <span className={`ml-2 shrink-0 rounded px-1.5 text-[11px] font-bold ${cellColor(cellScore(r.likelihood, r.impact))}`}>{cellScore(r.likelihood, r.impact)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <dt className="text-gray-500">{k}</dt>
      <dd className="col-span-2 text-gray-800">{v}</dd>
    </div>
  );
}
function Legend({ c, t }: { c: string; t: string }) {
  return <span className="flex items-center gap-1"><span className={`h-3 w-3 rounded ${c}`} />{t}</span>;
}
