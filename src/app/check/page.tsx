"use client";

import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle2, Zap } from "lucide-react";

export default function CheckPage() {
  const [system, setSystem] = useState("");
  const [useCase, setUseCase] = useState("chatbot");
  const [turnover, setTurnover] = useState(1000000000);
  const [humanReview, setHumanReview] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runCheck = () => {
    setLoading(true);
    setTimeout(() => {
      const tier = useCase === "credit" || useCase === "employment" || useCase === "biometric" ? "high-risk" : "limited-risk";
      const penaltyPct = tier === "high-risk" ? 0.03 : 0.015;
      const penaltyGbp = Math.round(turnover * penaltyPct);
      setResult({
        tier,
        article: tier === "high-risk" ? "99" : "50",
        obligations: tier === "high-risk" ? ["C2PA watermark (Art. 50)", "EU AI-Generated icon (Art. 50)", "Annex IV technical documentation", "Risk management system (Art. 9)", "Data quality + governance (Art. 10)", "Human oversight (Art. 14)", "Accuracy + robustness (Art. 15)"] : ["C2PA watermark (Art. 50)", "EU AI-Generated icon (Art. 50)", "Transparency to users (Art. 50)"],
        deadline: "2026-12-02",
        penaltyGbp,
        penaltyEur: Math.round(penaltyGbp * 1.17),
        recommendation: tier === "high-risk" ? "Get the Article 50 Kit (£999). 5-day done-with-you. C2PA + Annex IV docs + audit-ready evidence folder." : "Get the PAYG plan (£0.05/call). Auto-watermark all synthetic content.",
        year1Roi: Math.round((penaltyGbp - 999) / 999),
      });
      setLoading(false);
    }, 500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <Shield className="w-12 h-12 text-brand-400 mx-auto mb-4" />
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">5-Minute EU AI Act Check</h1>
        <p className="text-muted-foreground">Paste your AI system description. Get your exposure. Get the fix.</p>
      </div>

      <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">System description</label>
          <textarea value={system} onChange={(e) => setSystem(e.target.value)} placeholder="My bank has €1B turnover, 10M EU customers, 1 AI chatbot, no human review." className="w-full rounded-xl bg-background border border-border p-3 text-sm min-h-[80px]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Use case</label>
            <select value={useCase} onChange={(e) => setUseCase(e.target.value)} className="w-full rounded-xl bg-background border border-border p-2 text-sm">
              <option value="chatbot">AI Chatbot / Customer Service</option>
              <option value="credit">Credit Scoring / Loan Decisioning</option>
              <option value="employment">HR / Recruitment AI</option>
              <option value="biometric">Biometric Identification</option>
              <option value="general-purpose-ai">General-Purpose AI / Foundation Model</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Annual global turnover</label>
            <select value={turnover} onChange={(e) => setTurnover(parseInt(e.target.value))} className="w-full rounded-xl bg-background border border-border p-2 text-sm">
              <option value={10000000}>£10M (small org)</option>
              <option value={100000000}>£100M (mid-market)</option>
              <option value={1000000000}>£1B (large enterprise)</option>
              <option value={10000000000}>£10B (mega-corp)</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={humanReview} onChange={(e) => setHumanReview(e.target.checked)} className="rounded" />
          <span>Always has human review before final decision</span>
        </label>
        <button onClick={runCheck} disabled={!system || loading} className="w-full py-3 rounded-xl gradient-brand text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? "Computing..." : <><Zap className="w-4 h-4" /> Calculate My Exposure</>}
        </button>
      </div>

      {result && (
        <div className="mt-6 rounded-2xl bg-card border border-brand-500/30 p-6 space-y-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Your maximum EU AI Act exposure</div>
            <div className="text-5xl font-bold text-red-500 mt-1">€{result.penaltyEur.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">Under EU AI Act Article {result.article} · {result.tier} · Deadline {result.deadline}</div>
          </div>
          <div>
            <h3 className="text-sm font-bold mb-2">Required obligations ({result.obligations.length})</h3>
            <ul className="space-y-1">
              {result.obligations.map((o: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-brand-500/10 border border-brand-500/30 p-4">
            <p className="text-sm font-medium">{result.recommendation}</p>
            <p className="text-xs text-brand-400 mt-2">Year 1 ROI: {result.year1Roi.toLocaleString()}x</p>
          </div>
          <a href="/pricing" className="block w-full text-center py-3 rounded-xl gradient-brand text-white font-semibold">
            Get the Article 50 Kit — £999
          </a>
        </div>
      )}
    </div>
  );
}
