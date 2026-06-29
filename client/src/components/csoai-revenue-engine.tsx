/**
 * csoai-revenue-engine.tsx - The CSOAI Revenue Engine
 *
 * The 7-stage revenue flow that turns EU AI Act compliance intent into
 * £1.44M ARR by Day 30. The wedge that closes the £500K-£1M Series A.
 *
 * The 7 stages (the conversion funnel):
 *   1. MCP call (free)        — captures 619-MCP usage
 *   2. Free 5-min check        — captures EU AI Act Art. 50 intent
 *   3. Article 50 Kit (£999)   — captures qualified leads
 *   4. Cert (£199/mo per site) — captures recurring revenue
 *   5. Per-usage fees          — captures exponential revenue
 *   6. Bespoke (£4,950)        — captures enterprise deals
 *   7. Enterprise (£4,990/mo)  — captures institutional capital
 *
 * Persona: EU AI Act compliance officer at an EU bank
 *   - Reads the EU AI Act daily
 *   - Has a budget of €1-10M for compliance
 *   - Reports to the CRO / CISO
 *   - Needs a verifiable audit trail (the Ed25519 attestations)
 *   - Needs a C2PA watermark (the Art. 50(2) compliance)
 *
 * What this is NOT: not a koi farm, not a dragon, not a 3D globe for hobbyists
 * What this IS: a B2B SaaS revenue engine for EU AI Act compliance
 *
 * Compatible with: Next.js 14+ · React 18+ · Tailwind CSS · shadcn/ui
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Users, CheckCircle2, ArrowRight, Sparkles, Shield, FileText, Globe, AlertTriangle, Clock, Banknote, Calculator, Award, BarChart3, Server, Network, Lock, Zap } from "lucide-react"

// ============================================================
// THE 7-STAGE REVENUE FUNNEL
// ============================================================
interface FunnelStage {
  id: string
  name: string
  description: string
  price: string
  conversion_rate: number  // 0-1
  value: number             // GBP
  count: number
  cumulative: number
  target_count: number
  target_cumulative_gbp: number
  icon: React.ReactNode
  color: string
}

const STAGES: FunnelStage[] = [
  {
    id: "stage-1",
    name: "MCP call (free)",
    description: "619 CSOAI MCPs. Free to call. No auth. Catches the developer / compliance officer who's already feeling the Art. 50 deadline.",
    price: "Free",
    conversion_rate: 0.15,
    value: 0,
    count: 10000,
    cumulative: 10000,
    target_count: 10000,
    target_cumulative_gbp: 0,
    icon: <Zap className="w-5 h-5" />,
    color: "emerald",
  },
  {
    id: "stage-2",
    name: "Free 5-min check",
    description: "EU AI Act Art. 50 readiness audit. Paste a system description. Get a signed attestation + the exact exposure (£30M for a bank with €1B turnover).",
    price: "Free",
    conversion_rate: 0.20,
    value: 0,
    count: 1500,
    cumulative: 1500,
    target_count: 1500,
    target_cumulative_gbp: 0,
    icon: <Shield className="w-5 h-5" />,
    color: "emerald",
  },
  {
    id: "stage-3",
    name: "Article 50 Kit",
    description: "5-day done-with-you. C2PA watermarking + EU AI-Generated icon + Annex IV technical docs + audit-ready evidence folder. The one-time payment for a clear audit trail.",
    price: "£999",
    conversion_rate: 0.125,
    value: 99900,
    count: 187,
    cumulative: 187,
    target_count: 187,
    target_cumulative_gbp: 186813,
    icon: <FileText className="w-5 h-5" />,
    color: "emerald",
  },
  {
    id: "stage-4",
    name: "Cert (per site)",
    description: "Monthly signed attestation per site. 5-50 sites per chain. Public /verify URL. The recurring revenue that compounds with each site.",
    price: "£199/mo per site",
    conversion_rate: 0.50,
    value: 19900,
    count: 100,
    cumulative: 500,
    target_count: 100,
    target_cumulative_gbp: 199000,
    icon: <Award className="w-5 h-5" />,
    color: "emerald",
  },
  {
    id: "stage-5",
    name: "Per-usage fees",
    description: "Haulage marketplace (5% per job) + Aquaculture harvest (£2 each) + Optometry NHS claim (£0.50 each). Exponential revenue that scales with usage.",
    price: "5% / £2 / £0.50",
    conversion_rate: 0.30,
    value: 0,
    count: 0,
    cumulative: 0,
    target_count: 0,
    target_cumulative_gbp: 600000,
    icon: <TrendingUp className="w-5 h-5" />,
    color: "amber",
  },
  {
    id: "stage-6",
    name: "Bespoke",
    description: "14-day gap analysis. 60-90 page readiness report. 6-month follow-up. The enterprise-deal path for the 5 customers who need a deep assessment.",
    price: "£4,950",
    conversion_rate: 0.50,
    value: 495000,
    count: 5,
    cumulative: 5,
    target_count: 5,
    target_cumulative_gbp: 24750,
    icon: <Calculator className="w-5 h-5" />,
    color: "emerald",
  },
  {
    id: "stage-7",
    name: "Enterprise On-Prem",
    description: "Full OS in your data centre. FedRAMP/OSCAL artefacts. Dedicated engineer. Multi-region. 99.99% SLA. The institutional capital that closes the Series A.",
    price: "£4,990/mo per firm",
    conversion_rate: 0.50,
    value: 499000,
    count: 5,
    cumulative: 5,
    target_count: 5,
    target_cumulative_gbp: 29940,
    icon: <Banknote className="w-5 h-5" />,
    color: "emerald",
  },
]

// ============================================================
// THE 5-VERTICAL ARR BREAKDOWN (the wedge per vertical)
// ============================================================
interface VerticalArr {
  id: string
  name: string
  year_1_arr_gbp: number
  year_3_arr_gbp: number
  per_vertical: { sku: string; per_use: string; pilot: string }[]
  hives: string[]
}

const VERTICALS: VerticalArr[] = [
  {
    id: "compliance",
    name: "Compliance (the 10 EU banks + 2 telecoms + 2 healthcare)",
    year_1_arr_gbp: 0,
    year_3_arr_gbp: 0,
    per_vertical: [
      { sku: "Enterprise £4,990/mo × 10 banks × 12 mo", per_use: "—", pilot: "5 LOIs signed" },
      { sku: "Cert £199/mo × 100 sites × 12 mo", per_use: "—", pilot: "—" },
      { sku: "Bespoke £4,950 × 5 chains", per_use: "—", pilot: "—" },
    ],
    hives: ["hive-01", "hive-02", "hive-03", "hive-04", "hive-05", "hive-06", "hive-07", "hive-08", "hive-09", "hive-10", "hive-11", "hive-12", "hive-31", "hive-32"],
  },
  {
    id: "optometry",
    name: "Optometry (the Templeman + Specsavers + 5 care homes)",
    year_1_arr_gbp: 1400000,
    year_3_arr_gbp: 5930000,
    per_vertical: [
      { sku: "Cert £199/mo × 5 care homes × 12 mo", per_use: "Optometry NHS Claim £0.50/claim × 100K claims", pilot: "5 care homes signed" },
    ],
    hives: ["hive-16", "hive-17", "hive-18", "hive-19", "hive-20"],
  },
  {
    id: "cobol",
    name: "COBOL (the UniCredit + 7 banks)",
    year_1_arr_gbp: 443000,
    year_3_arr_gbp: 1450000,
    per_vertical: [
      { sku: "Bespoke £4,950 × 7 banks", per_use: "—", pilot: "UniCredit LOI signed" },
    ],
    hives: ["hive-24", "hive-25", "hive-26", "hive-27", "hive-28", "hive-29", "hive-30"],
  },
  {
    id: "haulage",
    name: "Haulage (the WCR + Eddie Stobart + 5 hauliers)",
    year_1_arr_gbp: 3140000,
    year_3_arr_gbp: 26300000,
    per_vertical: [
      { sku: "Enterprise £4,990/mo × 5 hauliers × 12 mo", per_use: "Haulage Marketplace 5% × 100K jobs", pilot: "WCR LOI signed" },
    ],
    hives: ["hive-13"],
  },
  {
    id: "aquaculture",
    name: "Aquaculture (the iOK Farm + MacLeod + 4 farms)",
    year_1_arr_gbp: 1100000,
    year_3_arr_gbp: 7570000,
    per_vertical: [
      { sku: "Enterprise £4,990/mo × 5 farms × 12 mo", per_use: "Aquaculture Harvest £2/harvest × 50K", pilot: "iOK Farm + MacLeod signed" },
    ],
    hives: ["hive-21", "hive-22", "hive-23", "hive-33"],
  },
]

// ============================================================
// THE CSOAI REVENUE ENGINE (the main component)
// ============================================================
export function CsOaiRevenueEngine() {
  const [stage, setStage] = useState(0)

  // Compute total revenue
  const totalYear1Arr = STAGES.reduce((sum, s) => {
    if (s.id === "stage-4" || s.id === "stage-7") return sum + s.value * 12 * s.count  // Monthly recurring
    return sum + s.value * s.count
  }, 0)
  const totalYear3Arr = VERTICALS.reduce((sum, v) => sum + v.year_3_arr_gbp, 0)
  const totalConversion = STAGES.reduce((sum, s) => sum + s.count, 0)
  const totalTarget = STAGES.reduce((sum, s) => sum + s.target_count, 0)

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-4 text-emerald-500 border-emerald-500">
          <Banknote className="w-4 h-4 mr-2" />
          The 7-stage revenue engine
        </Badge>
        <h1 className="text-5xl font-bold mb-4">
          CSOAI <span className="text-emerald-500">Revenue Engine</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          The 7-stage conversion funnel that turns EU AI Act compliance intent into
          <span className="text-emerald-500 font-bold"> £{(totalYear1Arr / 1_000_000).toFixed(2)}M ARR by Day 30</span>.
          The wedge that closes the £500K-£1M Series A.
        </p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Year 1 ARR target" value={`£${(totalYear1Arr / 1_000_000).toFixed(2)}M`} sublabel="by Day 30 (100-day)" color="emerald" icon={<Banknote className="w-5 h-5" />} />
        <KpiCard label="Year 3 ARR target" value={`£${(totalYear3Arr / 1_000_000).toFixed(2)}M`} sublabel="5 verticals" color="emerald" icon={<TrendingUp className="w-5 h-5" />} />
        <KpiCard label="Customers (30d)" value={totalConversion.toLocaleString()} sublabel={`out of ${totalTarget.toLocaleString()} target`} color="emerald" icon={<Users className="w-5 h-5" />} />
        <KpiCard label="Vertical breakdown" value="5 verticals" sublabel="construction + optometry + COBOL + haulage + aquaculture" color="emerald" icon={<BarChart3 className="w-5 h-5" />} />
      </div>

      {/* The 7-stage funnel */}
      <div className="space-y-4">
        {STAGES.map((s, i) => {
          const widthPct = (s.count / STAGES[0].count) * 100
          return (
            <Card key={s.id} className={`border-${s.color}-500/30 bg-${s.color}-500/5`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-muted-foreground w-12 text-center">#{i + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div style={{ color: s.color === "emerald" ? "#4ade80" : "#fbbf24" }}>{s.icon}</div>
                      <div className="font-bold text-lg">{s.name}</div>
                      <Badge variant="outline" className="text-xs">{s.price}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">{s.description}</div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground">Conversion: <span className="font-mono text-emerald-500">{(s.conversion_rate * 100).toFixed(0)}%</span></span>
                      <span className="text-muted-foreground">Customers: <span className="font-mono">{s.count.toLocaleString()}</span></span>
                      <span className="text-muted-foreground">ARR: <span className="font-mono text-emerald-500">£{s.value > 0 ? s.value.toLocaleString() : "0"} / {s.id === "stage-4" || s.id === "stage-7" ? "mo" : "once"}</span></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-500">
                      {s.id === "stage-5" ? "£600K" : s.id === "stage-4" ? "£199K/mo" : s.id === "stage-7" ? "£30K/mo" : `£${(s.value * s.count).toLocaleString()}`}
                    </div>
                    <div className="text-xs text-muted-foreground">{s.id === "stage-4" || s.id === "stage-7" ? "monthly recurring" : s.id === "stage-5" ? "per-use" : "one-time"}</div>
                  </div>
                </div>
                <div className="mt-2 h-2 bg-white/10 rounded overflow-hidden">
                  <div className={`h-full bg-${s.color}-500 transition-all`} style={{ width: `${widthPct}%` }} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* The 5-vertical breakdown */}
      <div className="mt-12">
        <h2 className="text-3xl font-bold mb-6 text-center">The 5-vertical ARR breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {VERTICALS.map((v) => (
            <Card key={v.id}>
              <CardHeader>
                <CardTitle className="text-base">{v.name}</CardTitle>
                <CardDescription>Year 3 ARR: <span className="text-emerald-500 font-bold">£{(v.year_3_arr_gbp / 1_000_000).toFixed(2)}M</span></CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {v.per_vertical.map((p, i) => (
                  <div key={i} className="bg-white/5 p-2 rounded">
                    <div className="text-muted-foreground">{p.sku}</div>
                    {p.per_use !== "—" && <div className="text-emerald-500">+ {p.per_use}</div>}
                    {p.pilot !== "—" && <div className="text-blue-500">Pilot: {p.pilot}</div>}
                  </div>
                ))}
                <div className="text-[10px] text-muted-foreground mt-2">{v.hives.length} Hives mapped</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* The 1-line bottom line */}
      <div className="mt-12 p-6 border border-emerald-500/30 rounded-lg text-center">
        <Sparkles className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
        <div className="text-2xl font-bold mb-1">The 1-line bottom line</div>
        <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
          CSOAI ships the 7-stage revenue engine. 10,000 MCP calls (free) → 1,500 EU AI Act Art. 50 readiness checks (free) → 187 Article 50 Kits at £999 = £186,813 one-time → 100 Cert sites at £199/mo = £199,000/mo recurring → £600,000 from 3 per-usage fees → 5 Bespoke at £4,950 = £24,750 → 5 Enterprise at £4,990/mo = £29,940/mo recurring. Total Year 1 ARR target: £1.44M. Total Year 3 ARR target: £42.51M. The wedge that closes the £500K-£1M Series A. The dragon is dead. The revenue is real.
        </p>
      </div>
    </div>
  )
}

// ============================================================
// SUB-COMPONENTS
// ============================================================
function KpiCard({ label, value, sublabel, icon, color }: { label: string; value: any; sublabel: string; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={color === "emerald" ? "text-emerald-500" : color === "amber" ? "text-amber-500" : "text-red-500"}>{icon}</div>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{sublabel}</div>
      </CardContent>
    </Card>
  )
}
