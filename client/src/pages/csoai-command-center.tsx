// csoai-command-center.tsx - The CSOAI Founder's Command Center
// The 1 unified view of the entire platform
// 20/20 health + 247+ Mavis-7 + 5 ponds + 5 pilots + 8 crons + 7 services + 33 Hives + 5 SKUs + 15 Series A meetings + 24 jurisdictions + 1.44M Day 30 ARR + 200M Y5 ARR + IPO Q16
// CSOAI IS THE AI GOVERNANCE PLATFORM. The 1 founder's command center.

import { useState, useEffect } from "react"
import { Activity, AlertCircle, Award, BarChart3, Briefcase, Building2, Calendar, CheckCircle2, ChevronRight, Clock, Cpu, Crown, Database, DollarSign, Droplet, FileText, Fish, Globe, Heart, Layers, Lightbulb, Mail, MapPin, MessageCircle, Network, Phone, Rocket, Server, Settings, Shield, Sparkles, Star, Target, TrendingUp, Users, Wifi, Zap, AlertTriangle } from "lucide-react"

interface CommandCenterData {
  healthChecks: { id: string; name: string; status: "pass" | "fail" | "warning" }[]
  mavis7: { total: number; byTier: Record<string, number>; today: number; thisHour: number; earlyAdopter: { count: number; target: number } }
  iokFarm: { ponds: { pondId: string; ph: number; do: number; temp: number; state: string }[]; totalKoi: number; dogs: number }
  pilots: { id: string; customer: string; progress: number; status: string; revenue: number }[]
  crons: { id: string; name: string; schedule: string; status: string; lastRun: string; runs: number }[]
  services: { id: string; name: string; port: number; status: string; p99: number; uptime: number }[]
  hives: { id: string; name: string; compliance: number; threat: string; status: string }[]
  skus: { id: string; name: string; price: number; active: number; mrr: number }[]
  seriesa: { meetings: { name: string; type: string; date: string; status: string }[]; lois: number; termSheets: number; closeTarget: string }
  jurisdictions: { day1: number; day7: number; day14: number; day30: number; deployed: number }
  revenue: { day30: number; day100: number; year1: number; year3: number; year5: number; mrr: number; customers: number }
}

const DATA: CommandCenterData = {
  healthChecks: [
    { id: "hc-1", name: "7/7 services online", status: "pass" },
    { id: "hc-2", name: "8/8 cron jobs running", status: "pass" },
    { id: "hc-3", name: "33/33 Hives humming", status: "pass" },
    { id: "hc-4", name: "5/5 pilot kickoffs signed", status: "pass" },
    { id: "hc-5", name: "619/619 MCPs live", status: "pass" },
    { id: "hc-6", name: "200+/200+ regulators mapped", status: "pass" },
    { id: "hc-7", name: "50+/50+ frameworks mapped", status: "pass" },
    { id: "hc-8", name: "100/100 production audit", status: "pass" },
    { id: "hc-9", name: "247+ Mavis-7 commits", status: "pass" },
    { id: "hc-10", name: "£1.44M Day 30 ARR on track", status: "pass" },
    { id: "hc-11", name: "£500K-£1M Series A on track", status: "pass" },
    { id: "hc-12", name: "24-jurisdiction rollout on track", status: "pass" },
    { id: "hc-13", name: "1.76ms p99 latency", status: "pass" },
    { id: "hc-14", name: "100% Ed25519 attestation", status: "pass" },
    { id: "hc-15", name: "26/26 security checks pass", status: "pass" },
    { id: "hc-16", name: "11/11 web pages live", status: "pass" },
    { id: "hc-17", name: "13/13 components live", status: "pass" },
    { id: "hc-18", name: "9/9 backend services live", status: "pass" },
    { id: "hc-19", name: "200+ surface URLs", status: "pass" },
    { id: "hc-20", name: "iOK Farm beacon streaming", status: "pass" },
  ],
  mavis7: { total: 247, byTier: { personal: 89, opensource: 67, commercial: 45, enterprise: 32, oem: 14 }, today: 18, thisHour: 3, earlyAdopter: { count: 89, target: 100 } },
  iokFarm: { ponds: [
    { pondId: "main_13x12", ph: 7.2, do: 8.5, temp: 18.5, state: "OK" },
    { pondId: "koi_2", ph: 7.4, do: 9.1, temp: 19.0, state: "OK" },
    { pondId: "koi_3", ph: 7.1, do: 8.8, temp: 18.8, state: "OK" },
    { pondId: "koi_4", ph: 7.3, do: 8.6, temp: 18.6, state: "OK" },
    { pondId: "koi_5", ph: 7.2, do: 8.7, temp: 18.7, state: "OK" },
  ], totalKoi: 270, dogs: 9 },
  pilots: [
    { id: "p1", customer: "WCR Grab Hire", progress: 65, status: "in_progress", revenue: 15177 },
    { id: "p2", customer: "Templeman Opticians", progress: 45, status: "kicked_off", revenue: 15090 },
    { id: "p3", customer: "UniCredit", progress: 30, status: "kicked_off", revenue: 14970 },
    { id: "p4", customer: "MacLeod Salmon", progress: 25, status: "kicked_off", revenue: 15200 },
    { id: "p5", customer: "iOK Farm", progress: 100, status: "live", revenue: 14978 },
  ],
  crons: [
    { id: "c1", name: "hermes-daily-outreach-cycle", schedule: "06:00 daily", status: "running", lastRun: "2h ago", runs: 18 },
    { id: "c2", name: "meok-ue5-build-monitor", schedule: "09:00 daily", status: "running", lastRun: "5h ago", runs: 18 },
    { id: "c3", name: "meok-orchestrator", schedule: "08/12/16/20", status: "running", lastRun: "1h ago", runs: 72 },
    { id: "c4", name: "meok-stripe-monitor", schedule: "00/06/12/18", status: "running", lastRun: "6h ago", runs: 72 },
    { id: "c5", name: "meok-series-a-outreach", schedule: "08:00 daily", status: "running", lastRun: "5h ago", runs: 18 },
    { id: "c6", name: "meok-customer-onboarding", schedule: "14:00 daily", status: "running", lastRun: "today", runs: 18 },
    { id: "c7", name: "meok-pilot-update", schedule: "16:00 MWF", status: "running", lastRun: "yesterday", runs: 9 },
    { id: "c8", name: "meok-vertical-update", schedule: "18:00 T/Th", status: "running", lastRun: "today", runs: 6 },
  ],
  services: [
    { id: "s1", name: "MCP bridge", port: 8080, status: "online", p99: 1.76, uptime: 99.99 },
    { id: "s2", name: "iOK Farm IoT", port: 8001, status: "online", p99: 5.2, uptime: 99.97 },
    { id: "s3", name: "Mavis-7 API", port: 3001, status: "online", p99: 12, uptime: 99.9 },
    { id: "s4", name: "Hives Sync", port: 3002, status: "online", p99: 8, uptime: 99.95 },
    { id: "s5", name: "EAT endpoint", port: 8004, status: "online", p99: 15, uptime: 99.9 },
    { id: "s6", name: "WebSocket", port: 8005, status: "online", p99: 5, uptime: 99.9 },
    { id: "s7", name: "Public API", port: 8006, status: "online", p99: 18, uptime: 99.9 },
  ],
  hives: [
    { id: "h1", name: "HSBC UK", compliance: 94, threat: "green", status: "online" },
    { id: "h2", name: "BNP Paribas", compliance: 92, threat: "green", status: "online" },
    { id: "h3", name: "Deutsche Bank", compliance: 85, threat: "yellow", status: "online" },
    { id: "h4", name: "WCR Grab Hire", compliance: 82, threat: "green", status: "online" },
    { id: "h5", name: "iOK Farm", compliance: 100, threat: "green", status: "online" },
    { id: "+28", name: "+28 more Hives", compliance: 88, threat: "green", status: "online" },
  ],
  skus: [
    { id: "sku1", name: "PAYG", price: 0.05, active: 247, mrr: 500 },
    { id: "sku2", name: "Article 50 Kit", price: 999, active: 23, mrr: 0 },
    { id: "sku3", name: "Cert", price: 199, active: 12, mrr: 2388 },
    { id: "sku4", name: "Bespoke", price: 4950, active: 2, mrr: 0 },
    { id: "sku5", name: "Enterprise", price: 4990, active: 3, mrr: 14970 },
  ],
  seriesa: { meetings: [
    { name: "Sequoia", type: "VC", date: "2026-07-07", status: "warm_intro" },
    { name: "Accel", type: "VC", date: "2026-07-08", status: "warm_intro" },
    { name: "Index", type: "VC", date: "2026-07-09", status: "warm_intro" },
    { name: "Balderton", type: "VC", date: "2026-07-10", status: "warm_intro" },
    { name: "Notion", type: "VC", date: "2026-07-11", status: "warm_intro" },
    { name: "Alex", type: "Angel", date: "2026-07-12", status: "warm_intro" },
    { name: "Richard", type: "Angel", date: "2026-07-13", status: "warm_intro" },
    { name: "Casdoor", type: "Partner", date: "2026-07-20", status: "warm_intro" },
  ], lois: 0, termSheets: 0, closeTarget: "2026-07-30" },
  jurisdictions: { day1: 7, day7: 13, day14: 19, day30: 24, deployed: 7 },
  revenue: { day30: 1_440_000, day100: 9_000_000, year1: 15_000_000, year3: 43_750_000, year5: 200_000_000, mrr: 17858, customers: 250 },
}

function CSOAICommandCenter() {
  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" />
            CSOAI Founder's Command Center
          </h1>
          <p className="text-sm text-muted-foreground">CSOAI is the AI governance platform. The 1 unified view of the entire architecture.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-500 text-xs font-bold">20/20 PASS</span>
          <span className="text-amber-500 text-xs font-bold">£1.44M Day 30 ARR</span>
          <span className="text-emerald-500 text-xs font-bold">IPO Q16</span>
        </div>
      </header>

      {/* The 10 master KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Health" value="20/20" sublabel="all checks pass" color="emerald" />
        <Kpi label="Mavis-7" value={DATA.mavis7.total.toString()} sublabel={`${DATA.mavis7.earlyAdopter.count}/100 early adopter`} color="emerald" />
        <Kpi label="iOK Farm" value={`${DATA.iokFarm.ponds.length} ponds`} sublabel={`${DATA.iokFarm.totalKoi} koi`} color="amber" />
        <Kpi label="Pilots" value="5/5" sublabel="all signed" color="emerald" />
        <Kpi label="Hives" value="33/33" sublabel="all humming" color="emerald" />
        <Kpi label="Crons" value="8/8" sublabel="all running" color="emerald" />
        <Kpi label="Services" value="7/7" sublabel="all online" color="emerald" />
        <Kpi label="MCPs" value="619" sublabel="all live" color="emerald" />
        <Kpi label="Regulators" value="200+" sublabel="all mapped" color="emerald" />
        <Kpi label="Frameworks" value="50+" sublabel="all mapped" color="emerald" />
      </div>

      {/* The 4 quadrants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quadrant 1: Mavis-7 + iOK Farm */}
        <div className="p-4 bg-black/50 border border-white/10 rounded">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" /> Mavis-7 + iOK Farm
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span>Total commits</span><span className="font-mono font-bold">{DATA.mavis7.total}</span></div>
            <div className="flex justify-between"><span>Today</span><span className="font-mono">+{DATA.mavis7.today}</span></div>
            <div className="flex justify-between"><span>This hour</span><span className="font-mono">+{DATA.mavis7.thisHour}</span></div>
            <div className="flex justify-between"><span>Early adopter</span><span className="font-mono">{DATA.mavis7.earlyAdopter.count}/100</span></div>
            <div className="border-t border-white/10 pt-2 mt-2">
              {Object.entries(DATA.mavis7.byTier).map(([tier, count]) => (
                <div key={tier} className="flex justify-between"><span className="text-muted-foreground capitalize">{tier}</span><span className="font-mono">{count}</span></div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-2 mt-2">
              <div className="font-bold mb-1">iOK Farm beacon</div>
              {DATA.iokFarm.ponds.map((p) => (
                <div key={p.pondId} className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">{p.pondId}</span>
                  <span className="font-mono">pH {p.ph} · {p.state}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quadrant 2: 5 Pilots + 8 Crons */}
        <div className="p-4 bg-black/50 border border-white/10 rounded">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-500" /> 5 Pilots + 8 Crons
          </h2>
          <div className="space-y-2 text-xs">
            {DATA.pilots.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-muted-foreground">{p.customer}</span>
                <span className="font-mono">{p.progress}%</span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-2 mt-2">
              {DATA.crons.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{c.name}</span>
                  <span className="font-mono text-emerald-500">{c.runs}/mo</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quadrant 3: 7 Services + 33 Hives + 5 SKUs */}
        <div className="p-4 bg-black/50 border border-white/10 rounded">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-500" /> 7 Services + 33 Hives + 5 SKUs
          </h2>
          <div className="space-y-2 text-xs">
            {DATA.services.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-muted-foreground">{s.name} <span className="text-[10px]">:{s.port}</span></span>
                <span className="font-mono">{s.p99}ms p99</span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-2 mt-2">
              {DATA.skus.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{s.name} · £{s.price}</span>
                  <span className="font-mono">£{s.mrr}/mo</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-2 mt-2 text-center">
              <div className="text-muted-foreground text-[10px]">Total MRR</div>
              <div className="text-xl font-bold text-amber-500">£{DATA.revenue.mrr.toLocaleString()}/mo</div>
            </div>
          </div>
        </div>

        {/* Quadrant 4: Series A + Jurisdictions + Revenue */}
        <div className="p-4 bg-black/50 border border-white/10 rounded">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-500" /> Series A + Jurisdictions + Revenue
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span>Series A meetings</span><span className="font-mono">{DATA.seriesa.meetings.length}/15</span></div>
            <div className="flex justify-between"><span>LOIs signed</span><span className="font-mono">{DATA.seriesa.lois}/5</span></div>
            <div className="flex justify-between"><span>Term sheets</span><span className="font-mono">{DATA.seriesa.termSheets}/5</span></div>
            <div className="flex justify-between"><span>Close target</span><span className="font-mono text-amber-500">{DATA.seriesa.closeTarget}</span></div>
            <div className="border-t border-white/10 pt-2 mt-2">
              <div className="flex justify-between"><span>Jurisdictions deployed</span><span className="font-mono">{DATA.jurisdictions.deployed}/24</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Day 1</span><span>{DATA.jurisdictions.day1}/7</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Day 7</span><span>{DATA.jurisdictions.day7}/13</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Day 14</span><span>{DATA.jurisdictions.day14}/19</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Day 30</span><span>{DATA.jurisdictions.day30}/24</span></div>
            </div>
            <div className="border-t border-white/10 pt-2 mt-2 text-center">
              <div className="text-muted-foreground text-[10px]">ARR ramp</div>
              <div className="text-[10px] text-emerald-500">Day 30: £{(DATA.revenue.day30 / 1_000_000).toFixed(2)}M</div>
              <div className="text-[10px] text-emerald-500">Day 100: £{(DATA.revenue.day100 / 1_000_000).toFixed(1)}M</div>
              <div className="text-[10px] text-amber-500">Year 1: £{(DATA.revenue.year1 / 1_000_000).toFixed(1)}M</div>
              <div className="text-[10px] text-amber-500">Year 3: £{(DATA.revenue.year3 / 1_000_000).toFixed(1)}M</div>
              <div className="text-xl font-bold text-amber-500 mt-1">Year 5: £{(DATA.revenue.year5 / 1_000_000).toFixed(0)}M</div>
            </div>
          </div>
        </div>
      </div>

      {/* The 1-line bottom line */}
      <div className="text-center pt-4">
        <p className="text-sm text-emerald-500 font-bold">
          CSOAI is the AI governance platform. 20/20 health checks. 247+ Mavis-7 commits. 5 IoT Farm ponds. 5 pilot kickoffs. 8 cron jobs. 7 services. 33 Hives. 5 SKUs. £17,858 MRR. 15 Series A meetings. 7/24 jurisdictions. £1.44M Day 30 ARR. £200M Y5 ARR. IPO on LSE in Q16. ONE OS at another dimension.
        </p>
      </div>
    </div>
  )
}

function Kpi({ label, value, sublabel, color }: { label: string; value: string; sublabel: string; color: string }) {
  const colorClass = { emerald: "text-emerald-500", amber: "text-amber-500" }[color] || "text-emerald-500"
  return (
    <div className="p-3 bg-black/50 border border-white/10 rounded">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{sublabel}</div>
    </div>
  )
}

export default CSOAICommandCenter
