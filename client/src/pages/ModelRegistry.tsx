import { useMemo, useState } from "react";

// CSOAI Model Registry & Fairness — model cards + bias/fairness testing.
// Closes HUNT_24 Tier-2 #18/#19. EU AI Act Art 10 requires data/model documentation;
// NYC Local Law 144 requires bias audits for automated employment decisions.
// Interactive, client-side, AIF360-style metrics — demoable now, real harness behind
// the same UI later.

type RiskTier = "Unacceptable" | "High" | "Limited" | "Minimal";

type Model = {
  id: string;
  name: string;
  version: string;
  owner: string;
  tier: RiskTier;
  frameworks: string[];
  intendedUse: string;
  trainingData: string;
  limitations: string;
  lastEval: string;
};

const MODELS: Model[] = [
  {
    id: "credit-scorer-v3",
    name: "Credit Scorer",
    version: "3.2.0",
    owner: "Risk & Underwriting",
    tier: "High",
    frameworks: ["EU AI Act", "ISO 42001", "NIST AI RMF"],
    intendedUse: "Score consumer credit applications to support (not replace) human lending decisions.",
    trainingData: "1.2M anonymised applications, 2019–2025, EU + UK. Protected attributes withheld from features.",
    limitations: "Not validated outside EU/UK markets; degrades on thin-file applicants.",
    lastEval: "2026-06-18",
  },
  {
    id: "cv-screener-v1",
    name: "CV Screener",
    version: "1.4.1",
    owner: "People Ops",
    tier: "High",
    frameworks: ["EU AI Act", "NYC LL144"],
    intendedUse: "Rank applicant CVs for recruiter review. Automated employment decision tool under NYC LL144.",
    trainingData: "480k historical applications with hiring outcomes; rebalanced for class imbalance.",
    limitations: "Requires annual bias audit (LL144). Not used for final hiring decisions.",
    lastEval: "2026-06-10",
  },
  {
    id: "support-router-v2",
    name: "Support Router",
    version: "2.0.3",
    owner: "Customer Experience",
    tier: "Limited",
    frameworks: ["EU AI Act", "ISO 42001"],
    intendedUse: "Classify and route inbound support tickets to the correct queue.",
    trainingData: "3.1M labelled tickets; PII redacted at ingest.",
    limitations: "Transparency obligation (Art 50) — users informed they interact with AI.",
    lastEval: "2026-05-29",
  },
  {
    id: "content-mod-v5",
    name: "Content Moderator",
    version: "5.1.0",
    owner: "Trust & Safety",
    tier: "High",
    frameworks: ["EU AI Act", "TC260", "NIST AI RMF"],
    intendedUse: "Flag policy-violating content for human moderator review.",
    trainingData: "Multilingual corpus, human-labelled; quarterly refresh.",
    limitations: "Lower recall on low-resource languages; human-in-the-loop required.",
    lastEval: "2026-06-20",
  },
];

const tierColor: Record<RiskTier, string> = {
  Unacceptable: "bg-red-100 text-red-700 border-red-200",
  High: "bg-amber-100 text-amber-800 border-amber-200",
  Limited: "bg-blue-100 text-blue-700 border-blue-200",
  Minimal: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

type Metric = { name: string; value: number; threshold: number; better: "low" | "high"; desc: string };

function runFairness(seed: number): Metric[] {
  const r = (a: number, b: number) => a + ((Math.sin(seed * 9301 + 49297) + 1) / 2) * (b - a);
  const r2 = (a: number, b: number) => a + ((Math.cos(seed * 4523 + 13) + 1) / 2) * (b - a);
  const r3 = (a: number, b: number) => a + ((Math.sin(seed * 1777 + 7) + 1) / 2) * (b - a);
  return [
    { name: "Demographic parity difference", value: +(r(0.01, 0.16)).toFixed(3), threshold: 0.1, better: "low", desc: "Difference in positive-outcome rate across protected groups (target ≤ 0.10)." },
    { name: "Equal opportunity difference", value: +(r2(0.01, 0.14)).toFixed(3), threshold: 0.1, better: "low", desc: "Difference in true-positive rate across groups (target ≤ 0.10)." },
    { name: "Disparate impact ratio", value: +(r3(0.72, 1.05)).toFixed(3), threshold: 0.8, better: "high", desc: "Ratio of selection rates (four-fifths rule: target ≥ 0.80)." },
  ];
}

const card = "rounded-2xl border border-gray-200 bg-white p-6";

export default function ModelRegistry() {
  const [selected, setSelected] = useState<Model>(MODELS[1]);
  const [seed, setSeed] = useState(1);
  const metrics = useMemo(() => runFairness(seed + selected.id.length), [seed, selected]);
  const passed = metrics.every((m) => (m.better === "low" ? m.value <= m.threshold : m.value >= m.threshold));

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-emerald-300 font-semibold tracking-wide uppercase text-sm">AI/ML governance</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">Model Registry &amp; Fairness</h1>
          <p className="mt-5 text-lg text-emerald-50 max-w-2xl">
            Documented model cards and bias audits for every AI system — the evidence EU AI Act Art. 10
            and NYC Local Law 144 demand, generated and tracked in one place.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 grid gap-8 lg:grid-cols-5">
        {/* Registry list */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900">Registered models</h2>
          <div className="mt-4 space-y-3">
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className={`w-full text-left rounded-xl border p-4 transition ${selected.id === m.id ? "border-emerald-400 bg-emerald-50/50" : "border-gray-200 hover:border-emerald-200"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{m.name}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${tierColor[m.tier]}`}>{m.tier} risk</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">v{m.version} · {m.owner}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.frameworks.map((f) => (
                    <span key={f} className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">{f}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Model card + fairness */}
        <div className="lg:col-span-3 space-y-6">
          <div className={card}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{selected.name} <span className="text-sm font-normal text-gray-400">v{selected.version}</span></h2>
              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${tierColor[selected.tier]}`}>{selected.tier} risk</span>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <Row k="Intended use" v={selected.intendedUse} />
              <Row k="Training data" v={selected.trainingData} />
              <Row k="Limitations" v={selected.limitations} />
              <Row k="Owner" v={selected.owner} />
              <Row k="Last evaluated" v={selected.lastEval} />
              <Row k="Frameworks" v={selected.frameworks.join(" · ")} />
            </dl>
          </div>

          <div className={card}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Fairness audit</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {passed ? "PASS" : "REVIEW REQUIRED"}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">AIF360-style group fairness metrics. Demonstration values — wire your evaluation harness behind this panel.</p>
            <div className="mt-4 space-y-4">
              {metrics.map((m) => {
                const ok = m.better === "low" ? m.value <= m.threshold : m.value >= m.threshold;
                return (
                  <div key={m.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-800">{m.name}</span>
                      <span className={`font-mono font-semibold ${ok ? "text-emerald-700" : "text-red-600"}`}>{m.value} {ok ? "✓" : "✗"}</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                      <div className={`h-2 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${Math.min(100, Math.abs(m.value) * 100 / (m.better === "high" ? 1.05 : 0.2))}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">{m.desc}</p>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setSeed((s) => s + 1)} className="mt-5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
              ↻ Re-run audit
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <dt className="text-gray-500">{k}</dt>
      <dd className="col-span-2 text-gray-800">{v}</dd>
    </div>
  );
}
