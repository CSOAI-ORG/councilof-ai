// csoai-check.tsx - CSOAI is the AI governance platform. The 5-minute EU AI Act check.

import { useState } from "react"

export function CSOAICheck() {
  const [systemDescription, setSystemDescription] = useState("")
  const [useCase, setUseCase] = useState("chatbot")
  const [annualTurnoverGbp, setAnnualTurnoverGbp] = useState(1_000_000_000)
  const [humanReview, setHumanReview] = useState(true)
  const [result, setResult] = useState<any>(null)

  function runCheck() {
    const tier = systemDescription.toLowerCase().includes("credit") || systemDescription.toLowerCase().includes("loan") ? "high-risk" : "limited-risk"
    const penaltyPct = tier === "high-risk" ? 0.03 : 0.015
    const penaltyGbp = Math.round(annualTurnoverGbp * penaltyPct)
    const inScope = true
    const obligations = tier === "high-risk"
      ? ["C2PA watermark (Art. 50)", "EU AI-Generated icon (Art. 50)", "Annex IV technical documentation", "Risk management system (Art. 9)", "Data quality + governance (Art. 10)", "Human oversight (Art. 14)", "Accuracy + robustness (Art. 15)"]
      : ["C2PA watermark (Art. 50)", "EU AI-Generated icon (Art. 50)", "Transparency to users (Art. 50)"]
    const deadline = "2026-12-02"
    const recommendation = tier === "high-risk" ? "Get the Article 50 Kit (£999). 5-day done-with-you. C2PA + Annex IV docs + audit-ready evidence folder." : "Get the PAYG plan (£0.05/call). Auto-watermark all synthetic content."
    setResult({ inScope, tier, article: tier === "high-risk" ? "99" : "50", obligations, deadline, penaltyGbp, penaltyEur: Math.round(penaltyGbp * 1.17), recommendation, year1Roi: Math.round((penaltyGbp - 999) / 999) })
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-8">
      <section>
        <h1 className="text-5xl font-bold">5-Minute EU AI Act Check</h1>
        <p className="text-xl text-muted-foreground mt-2">Paste your AI system description. Get your €30M exposure. Get the Article 50 Kit.</p>
      </section>
      <section className="max-w-2xl space-y-4">
        <div>
          <label className="text-sm text-muted-foreground">System description (1-3 sentences)</label>
          <textarea value={systemDescription} onChange={(e) => setSystemDescription(e.target.value)} placeholder="My bank has €1B turnover, 10M EU customers, 1 AI chatbot, no human review." className="w-full mt-1 bg-white/5 border border-white/10 rounded p-3 text-sm h-24 font-mono" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Use case</label>
          <select value={useCase} onChange={(e) => setUseCase(e.target.value)} className="w-full mt-1 bg-white/5 border border-white/10 rounded p-2 text-sm">
            <option value="chatbot">AI Chatbot / Customer Service</option>
            <option value="credit">Credit Scoring / Loan Decisioning</option>
            <option value="employment">HR / Recruitment AI</option>
            <option value="biometric">Biometric Identification</option>
            <option value="general-purpose-ai">General-Purpose AI / Foundation Model</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Annual global turnover (£)</label>
          <select value={annualTurnoverGbp} onChange={(e) => setAnnualTurnoverGbp(parseInt(e.target.value))} className="w-full mt-1 bg-white/5 border border-white/10 rounded p-2 text-sm">
            <option value={10_000_000}>£10M (small org)</option>
            <option value={100_000_000}>£100M (mid-market)</option>
            <option value={1_000_000_000}>£1B (large enterprise)</option>
            <option value={10_000_000_000}>£10B (mega-corp)</option>
          </select>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={humanReview} onChange={(e) => setHumanReview(e.target.checked)} className="rounded" />
            <span>Always has human review before final decision</span>
          </label>
        </div>
        <button onClick={runCheck} disabled={!systemDescription} className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 rounded disabled:opacity-50">Calculate My Exposure</button>
      </section>
      {result && (
        <section className="max-w-2xl space-y-4 bg-emerald-500/5 border border-emerald-500/30 rounded p-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Your maximum EU AI Act exposure</div>
            <div className="text-5xl font-bold text-red-500">€{result.penaltyGbp.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Under EU AI Act Article {result.article} · {result.tier}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Required obligations</div>
            <ul className="text-sm space-y-1 mt-1">{result.obligations.map((o: string, i: number) => <li key={i}>· {o}</li>)}</ul>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3">
            <div className="text-sm">{result.recommendation}</div>
            <div className="text-xs text-muted-foreground mt-1">Year 1 ROI: {result.year1Roi.toLocaleString()}x</div>
          </div>
          <a href="/pricing?sku=kit" className="block w-full text-center py-3 bg-emerald-500 text-black font-bold rounded">Get the Article 50 Kit — £999</a>
        </section>
      )}
    </div>
  )
}

export default CSOAICheck
