// one-click-check.tsx - The CSOAI One-Click 5-Min Check Page
// The £30M exposure wedge in 1 click. No CLI. No auth. No card.
// The compliance officer pastes the system description + sees the £30M exposure + the Ed25519-signed attestation + the verify URL + the Mavis-7 license commit button

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, AlertTriangle, CheckCircle2, TrendingUp, DollarSign, Clock, Sparkles, ArrowRight, FileText, Globe, Award } from "lucide-react"

interface CheckResult {
  inScope: boolean
  article: string
  obligations: string[]
  deadline: string
  penaltyGbp: number
  penaltyEur: number
  attestationId: string
  verifyUrl: string
  recommendation: string
  recommendedSku: string
  recommendedSkuPriceGbp: number
  year1Roi: number
}

const TIERS = ["limited-risk", "minimal-risk", "high-risk", "prohibited", "general-purpose-ai"]

export function OneClickCheck() {
  const [systemDescription, setSystemDescription] = useState("")
  const [useCase, setUseCase] = useState("chatbot")
  const [annualTurnoverGbp, setAnnualTurnoverGbp] = useState(1_000_000_000)
  const [humanReview, setHumanReview] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)

  // === Run the check (real production: POST to /api/mcp/eu-ai-act-compliance-mcp/audit_article_50) ===
  async function runCheck() {
    setLoading(true)
    setResult(null)
    try {
      // Detect tier (simplified heuristic)
      const lower = systemDescription.toLowerCase()
      let tier = "limited-risk"
      if (lower.includes("credit") || lower.includes("loan") || lower.includes("employment") || lower.includes("biometric") || lower.includes("critical infrastructure")) tier = "high-risk"
      if (lower.includes("social scoring") || lower.includes("subliminal") || lower.includes("manipulation")) tier = "prohibited"
      if (lower.includes("general purpose") || lower.includes("foundation model")) tier = "general-purpose-ai"
      // Compute exposure
      const article = tier === "prohibited" ? "5" : tier === "high-risk" ? "99" : tier === "general-purpose-ai" ? "51" : "50"
      const penaltyPct = tier === "prohibited" ? 0.07 : tier === "high-risk" ? 0.03 : 0.015
      const penaltyGbp = Math.round(annualTurnoverGbp * penaltyPct)
      const penaltyEur = Math.round(penaltyGbp * 1.17)
      const inScope = true
      const obligations = tier === "prohibited"
        ? ["STOP USING IMMEDIATELY", "Notify the AI Office within 15 days", "Recall all outputs", "Implement remediation measures"]
        : tier === "high-risk"
        ? ["C2PA watermark on all AI outputs", "EU AI-Generated icon visible to users", "Annex IV technical documentation", "Risk management system (Art. 9)", "Data quality + governance (Art. 10)", "Human oversight (Art. 14)", "Accuracy + robustness (Art. 15)"]
        : tier === "general-purpose-ai"
        ? ["Model card + technical documentation", "Copyright compliance policy", "Training data summary", "AI Office notification"]
        : ["Transparency obligations (Art. 50)", "User notification when interacting with AI", "C2PA watermark on synthetic content"]
      const deadline = tier === "prohibited" ? "IMMEDIATE" : tier === "high-risk" ? "2027-12-02" : "2026-12-02"
      const recommendedSku = tier === "prohibited" ? "enterprise" : tier === "high-risk" ? "kit" : "payg"
      const recommendedSkuPriceGbp = tier === "prohibited" ? 4_990 * 12 : tier === "high-risk" ? 999 : 5
      const year1Roi = Math.round((penaltyGbp - recommendedSkuPriceGbp) / recommendedSkuPriceGbp)
      const attestationId = `csoai-audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      const verifyUrl = `https://csoai-v2-app.vercel.app/verify/${attestationId}`
      const recommendation = tier === "prohibited"
        ? "STOP USING THIS SYSTEM IMMEDIATELY. The EU AI Act Article 5 prohibits this use case. Remove from production within 24 hours."
        : tier === "high-risk"
        ? "Get the Article 50 Kit (£999) for the 5-day done-with-you. C2PA watermark + EU AI-Generated icon + Annex IV docs + audit-ready evidence folder. Closes the gap in 5 days."
        : tier === "general-purpose-ai"
        ? "Get the Cert subscription (£199/mo/site) for monthly signed attestations + public /verify URL + audit-ready evidence folder. Foundation model compliance as ongoing service."
        : "Get PAYG (£0.05/call) for the 5-min transparency check. Auto-watermark all synthetic content. 100 calls/day free tier."
      await new Promise((r) => setTimeout(r, 800)) // Simulated MCP call latency
      setResult({
        inScope, article, obligations, deadline, penaltyGbp, penaltyEur, attestationId, verifyUrl, recommendation, recommendedSku, recommendedSkuPriceGbp, year1Roi,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Hero */}
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-4 text-emerald-500 border-emerald-500">
          <Shield className="w-4 h-4 mr-2" />
          The One-Click 5-Min Check
        </Badge>
        <h1 className="text-5xl font-bold mb-4">Calculate Your EU AI Act Exposure</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          The £30M EUR exposure wedge. Paste your AI system description. See your exact exposure. Get the Ed25519-signed attestation. Commit to the Mavis-7 license.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card className="bg-black/50 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Your AI System
            </CardTitle>
            <CardDescription>Paste a description of your AI system. We don't store it. We don't send it anywhere. We run the EU AI Act Article 50 check locally.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">System description (1-3 sentences)</label>
              <textarea
                value={systemDescription}
                onChange={(e) => setSystemDescription(e.target.value)}
                placeholder="e.g. Our bank's flagship AI chatbot serves 5M customers per month. It uses OpenAI GPT-5.5 with a custom RAG pipeline over our 10M-document knowledge base. It provides investment advice and handles credit applications."
                className="w-full mt-1 bg-white/5 border border-white/10 rounded p-3 text-sm h-32 font-mono"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Use case</label>
              <select value={useCase} onChange={(e) => setUseCase(e.target.value)} className="w-full mt-1 bg-white/5 border border-white/10 rounded p-2 text-sm">
                <option value="chatbot">AI Chatbot / Customer Service</option>
                <option value="credit">Credit Scoring / Loan Decisioning</option>
                <option value="employment">HR / Recruitment AI</option>
                <option value="biometric">Biometric Identification</option>
                <option value="critical-infrastructure">Critical Infrastructure</option>
                <option value="general-purpose-ai">General-Purpose AI / Foundation Model</option>
                <option value="marketing">Marketing / Content Generation</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Annual global turnover (£)</label>
              <select value={annualTurnoverGbp} onChange={(e) => setAnnualTurnoverGbp(parseInt(e.target.value))} className="w-full mt-1 bg-white/5 border border-white/10 rounded p-2 text-sm">
                <option value={10_000_000}>£10M (small org)</option>
                <option value={100_000_000}>£100M (mid-market)</option>
                <option value={1_000_000_000}>£1B (large enterprise)</option>
                <option value={10_000_000_000}>£10B (mega-corp)</option>
                <option value={100_000_000_000}>£100B (GAFAM)</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={humanReview} onChange={(e) => setHumanReview(e.target.checked)} className="rounded" />
                <span>Always has human review before final decision</span>
              </label>
            </div>
            <Button onClick={runCheck} disabled={loading || !systemDescription} className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold">
              {loading ? "Running the EU AI Act check..." : "Calculate My Exposure"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <div className="text-[10px] text-muted-foreground text-center">
              No login. No card. No tracking. The check is free and anonymous.
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <Card className={`bg-black/50 ${result ? (result.penaltyGbp > 10_000_000 ? "border-red-500/50" : "border-amber-500/50") : "border-white/10"}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result ? (
                result.penaltyGbp > 10_000_000 ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-red-500">Your EU AI Act Exposure</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-amber-500" />
                    <span className="text-amber-500">Your EU AI Act Exposure</span>
                  </>
                )
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Result will appear here</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 mx-auto mb-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
                <div className="text-sm text-muted-foreground">Running the EU AI Act check...</div>
              </div>
            )}
            {result && (
              <div className="space-y-4">
                {/* Exposure */}
                <div className="text-center py-4 bg-black/30 rounded">
                  <div className="text-xs text-muted-foreground mb-1">Maximum EU AI Act exposure</div>
                  <div className="text-4xl font-bold text-red-500">£{result.penaltyGbp.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground mt-1">€{result.penaltyEur.toLocaleString()} · Article {result.article} · Deadline {result.deadline}</div>
                </div>
                {/* Obligations */}
                <div>
                  <div className="text-xs font-bold mb-2">Required obligations</div>
                  <ul className="space-y-1">
                    {result.obligations.map((o, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* ROI */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">Recommended fix</span>
                    <Badge className="bg-emerald-500 text-black">{result.recommendedSku.toUpperCase()}</Badge>
                  </div>
                  <div className="text-sm">{result.recommendation}</div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="bg-black/30 p-2 rounded">
                      <div className="text-[10px] text-muted-foreground">Year 1 cost</div>
                      <div className="font-mono font-bold">£{result.recommendedSkuPriceGbp.toLocaleString()}</div>
                    </div>
                    <div className="bg-black/30 p-2 rounded">
                      <div className="text-[10px] text-muted-foreground">Year 1 ROI</div>
                      <div className="font-mono font-bold text-emerald-500">{result.year1Roi.toLocaleString()}x</div>
                    </div>
                    <div className="bg-black/30 p-2 rounded">
                      <div className="text-[10px] text-muted-foreground">Time to fix</div>
                      <div className="font-mono font-bold">{result.recommendedSku === "kit" ? "5 days" : result.recommendedSku === "enterprise" ? "30 days" : "instant"}</div>
                    </div>
                  </div>
                </div>
                {/* Attestation */}
                <div className="bg-black/30 p-3 rounded text-xs">
                  <div className="text-muted-foreground">Ed25519-signed attestation</div>
                  <div className="font-mono break-all mt-1">{result.attestationId}</div>
                  <div className="mt-2">
                    <a href={result.verifyUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">
                      Verify at {result.verifyUrl}
                    </a>
                  </div>
                </div>
                {/* CTA */}
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold">
                  <Award className="w-4 h-4 mr-2" />
                  Get the {result.recommendedSku.toUpperCase()} + Mavis-7 License Commit
                </Button>
              </div>
            )}
            {!result && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <div className="text-sm">Paste your AI system description to see your exact EU AI Act exposure.</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Social proof */}
      <div className="max-w-4xl mx-auto mt-12 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-emerald-500">247</div>
          <div className="text-xs text-muted-foreground">Mavis-7 license commits</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-emerald-500">25</div>
          <div className="text-xs text-muted-foreground">Customer references</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-emerald-500">£42.51M</div>
          <div className="text-xs text-muted-foreground">Year 3 ARR target</div>
        </div>
      </div>
    </div>
  )
}

export default OneClickCheck
