import { useEffect, useState } from "react";

import SovereignSpot from "../components/SovereignSpot";
import AISystemNotice from "../components/AISystemNotice";
// Penalties - interactive EU AI Act penalty estimator. Pick a violation tier and your
// global turnover; see the max exposure (greater of fixed cap or % of turnover).
// FAQPage JSON-LD for answer engines. Zero external deps.
type Tier = { id: string; name: string; fixedM: number; pct: number; ex: string };
const TIERS: Tier[] = [
  { id: "prohibited", name: "Prohibited practices (Art. 5)", fixedM: 35, pct: 7, ex: "Social scoring, manipulative or exploitative AI, untargeted scraping for facial-recognition databases." },
  { id: "obligations", name: "Other obligations (high-risk, GPAI, transparency)", fixedM: 15, pct: 3, ex: "Missing transparency labels, GPAI documentation gaps, high-risk conformity failures." },
  { id: "info", name: "Incorrect or misleading information", fixedM: 7.5, pct: 1, ex: "Supplying incorrect, incomplete, or misleading information to authorities." },
];
export default function Penalties() {
  useEffect(() => { document.title = "EU AI Act penalties - fine calculator | CSOAI"; }, []);
  useEffect(() => {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.text = JSON.stringify({
      "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        { "@type": "Question", "name": "What is the maximum fine under the EU AI Act?", "acceptedAnswer": { "@type": "Answer", "text": "Up to EUR 35 million or 7% of total worldwide annual turnover, whichever is higher, for engaging in prohibited AI practices." } },
        { "@type": "Question", "name": "How are EU AI Act fines calculated?", "acceptedAnswer": { "@type": "Answer", "text": "Fines are the greater of a fixed cap or a percentage of global annual turnover. Tiers are 35M/7% for prohibited practices, 15M/3% for other obligations, and 7.5M/1% for supplying misleading information." } },
      ],
    });
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);
  const [tierId, setTierId] = useState("prohibited");
  const [turnover, setTurnover] = useState(100); // EUR millions
  const tier = TIERS.find((t) => t.id === tierId) || TIERS[0];
  const pctAmount = turnover * (tier.pct / 100);
  const exposure = Math.max(tier.fixedM, pctAmount);
  const fmt = (m: number) => m >= 1000 ? "EUR " + (m / 1000).toFixed(2) + "bn" : "EUR " + m.toFixed(1) + "m";
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - penalty estimator</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">What does an EU AI Act breach actually cost?</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Fines are the greater of a fixed cap or a slice of your global turnover. Pick the violation tier and your revenue to see the exposure.</p>
          <div className="mt-6 max-w-2xl"><AISystemNotice route="/fines" /></div>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-12 grid gap-8 lg:grid-cols-[1fr_320px] items-start">
        <div>
          <h2 className="text-lg font-bold text-gray-900">1. Violation tier</h2>
          <div className="mt-3 space-y-2">
            {TIERS.map((t) => (
              <button key={t.id} onClick={() => setTierId(t.id)} className={"flex w-full flex-col rounded-xl border px-4 py-3 text-left transition-colors " + (tierId === t.id ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:bg-gray-50")}>
                <span className="flex items-center justify-between"><span className="font-bold text-gray-900">{t.name}</span><span className="text-sm font-black text-emerald-700">EUR {t.fixedM}m / {t.pct}%</span></span>
                <span className="mt-1 text-xs text-gray-500">{t.ex}</span>
              </button>
            ))}
          </div>
          <h2 className="mt-8 text-lg font-bold text-gray-900">2. Global annual turnover</h2>
          <div className="mt-3 flex items-center justify-between text-sm"><span className="font-semibold text-gray-700">EUR {turnover}m</span><span className="text-xs text-gray-400">10m - 50bn</span></div>
          <input type="range" min={10} max={50000} step={10} value={turnover} onChange={(e) => setTurnover(parseInt(e.target.value, 10))} className="mt-2 w-full accent-emerald-600" />
        </div>
        <div className="rounded-2xl border border-gray-200 p-6 text-center">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-400">Maximum exposure</div>
          <div className="mt-2 text-4xl font-black text-red-600">{fmt(exposure)}</div>
          <div className="mt-3 text-xs text-gray-500">greater of: cap {fmt(tier.fixedM)} or {tier.pct}% turnover ({fmt(pctAmount)})</div>
          <a href="/readiness" className="mt-5 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500">Avoid this - scan now -&gt;</a>
          <a href="/eu-ai-act-checklist" className="mt-3 inline-block text-sm font-semibold text-emerald-700">The readiness checklist -&gt;</a>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 pb-12">
        <p className="text-xs text-gray-400">Illustrative estimate based on the EU AI Act penalty tiers (Art. 99). Actual fines consider gravity, duration, and cooperation. Not legal advice.</p>
      </section>
      <section className="bg-[#03110b] py-10"><div className="mx-auto max-w-5xl px-6">
        <SovereignSpot topic="EU AI Act penalties and how to avoid them" layer="frameworks" suggest="What triggers the biggest EU AI Act fines and how do I avoid them?" />
      </div></section>
    </div>
  );
}
