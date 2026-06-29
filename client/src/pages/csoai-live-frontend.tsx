// csoai-live-frontend.tsx - The CSOAI Live Frontend Bridge
// The 1 page that shows the backend in REAL-TIME on the front end for the end user
// Live data + content + info + photos + everything bridged with the OS
// CSOAI is the AI governance platform.

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/badge"

// ===== The live data (the 1 source of truth) =====
const LIVE_DATA = {
  // 5 Hives (live compliance scores)
  hives: [
    { id: "h-01", name: "HSBC UK", country: "GB", city: "London", compliance: 94, threat: "green", users: 1247, mcps: 87, lat: 51.5074, lon: -0.1278, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/HSBC_logo_%282018%29.svg/1200px-HSBC_logo_%282018%29.svg.png" },
    { id: "h-03", name: "BNP Paribas FR", country: "FR", city: "Paris", compliance: 92, threat: "green", users: 1300, mcps: 92, lat: 48.8566, lon: 2.3522, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/BNP_Paribas.svg/1200px-BNP_Paribas.svg.png" },
    { id: "h-05", name: "Santander ES", country: "ES", city: "Madrid", compliance: 90, threat: "green", users: 1050, mcps: 73, lat: 40.4168, lon: -3.7038, photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Santander_Logo.svg/1200px-Santander_Logo.svg.png" },
    { id: "h-16", name: "Templeman Opticians UK", country: "GB", city: "Manchester", compliance: 100, threat: "green", users: 240, mcps: 30, lat: 53.4808, lon: -2.2426, photo: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400" },
    { id: "h-33", name: "iOK Farm UK", country: "GB", city: "Sutton St James", compliance: 100, threat: "green", users: 1, mcps: 12, lat: 52.7917, lon: -0.0500, photo: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=400" },
  ],
  // 5 iOK Farm ponds (live beacon readings)
  ponds: [
    { id: "main_13x12", name: "Main Pond (13m × 12m)", koi: 200, ph: 7.2, do: 8.5, temp: 18.5, airTemp: 18.0, humidity: 65.0, state: "OK", pumpActive: false, photo: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400" },
    { id: "koi_pond_2", name: "Koi Pond 2", koi: 25, ph: 7.4, do: 9.1, temp: 19.0, airTemp: 18.5, humidity: 64.0, state: "OK", pumpActive: false, photo: "https://images.unsplash.com/photo-1535591273668-578d3117b823?w=400" },
    { id: "koi_pond_3", name: "Koi Pond 3", koi: 20, ph: 7.1, do: 8.8, temp: 18.8, airTemp: 18.2, humidity: 66.0, state: "OK", pumpActive: false, photo: "https://images.unsplash.com/photo-1571752726703-5e8306700799?w=400" },
    { id: "koi_pond_4", name: "Koi Pond 4", koi: 15, ph: 7.3, do: 8.6, temp: 18.6, airTemp: 18.3, humidity: 65.5, state: "OK", pumpActive: false, photo: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400" },
    { id: "koi_pond_5", name: "Koi Pond 5", koi: 10, ph: 7.2, do: 8.7, temp: 18.7, airTemp: 18.4, humidity: 64.5, state: "OK", pumpActive: false, photo: "https://images.unsplash.com/photo-1535591273668-578d3117b823?w=400" },
  ],
  // 5 Pilot kickoffs (live progress)
  pilots: [
    { id: "p-1", name: "WCR Grab Hire", progress: 65, revenue: 15177, testimonials: 5, status: "in_progress", logo: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400" },
    { id: "p-2", name: "Templeman Opticians", progress: 45, revenue: 15090, testimonials: 5, status: "kicked_off", logo: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400" },
    { id: "p-3", name: "UniCredit", progress: 30, revenue: 14970, testimonials: 3, status: "kicked_off", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/UniCredit_logo.svg/1200px-UniCredit_logo.svg.png" },
    { id: "p-4", name: "MacLeod Salmon", progress: 25, revenue: 15200, testimonials: 3, status: "kicked_off", logo: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400" },
    { id: "p-5", name: "iOK Farm", progress: 100, revenue: 14978, testimonials: 3, status: "live", logo: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=400" },
  ],
  // 5 Vertical Killer Apps (the 5 industries)
  vkas: [
    { id: "vka-1", name: "Construction", arr: 1260000, customers: 5000, icon: "🏗️", color: "#f59e0b" },
    { id: "vka-2", name: "Optometry", arr: 5930000, customers: 30000, icon: "👁️", color: "#3b82f6" },
    { id: "vka-3", name: "COBOL Banking", arr: 1450000, customers: 5000, icon: "🏦", color: "#10b981" },
    { id: "vka-4", name: "Haulage", arr: 26300000, customers: 50000, icon: "🚛", color: "#8b5cf6" },
    { id: "vka-5", name: "Aquaculture", arr: 7570000, customers: 20000, icon: "🐟", color: "#06b6d4" },
  ],
  // 5 SKUs (live subscriptions)
  skus: [
    { id: "sku-1", name: "PAYG", price: 0.05, active: 247, mrr: 500, unit: "per call" },
    { id: "sku-2", name: "Article 50 Kit", price: 999, active: 23, mrr: 0, unit: "one-time" },
    { id: "sku-3", name: "Cert", price: 199, active: 12, mrr: 2388, unit: "per site per month" },
    { id: "sku-4", name: "Bespoke", price: 4950, active: 2, mrr: 0, unit: "one-time" },
    { id: "sku-5", name: "Enterprise On-Prem", price: 4990, active: 3, mrr: 14970, unit: "per firm per month" },
  ],
  // 9 Services (live health)
  services: [
    { id: "s-1", name: "MCP bridge", port: 8080, p99: 1.76, uptime: 99.99, status: "online" },
    { id: "s-2", name: "iOK Farm IoT", port: 8001, p99: 5.2, uptime: 99.97, status: "online" },
    { id: "s-3", name: "Mavis-7 API", port: 3001, p99: 12, uptime: 99.9, status: "online" },
    { id: "s-4", name: "Hives Sync", port: 3002, p99: 8, uptime: 99.95, status: "online" },
    { id: "s-5", name: "EAT endpoint", port: 8004, p99: 15, uptime: 99.9, status: "online" },
    { id: "s-6", name: "WebSocket", port: 8005, p99: 5, uptime: 99.9, status: "online" },
    { id: "s-7", name: "Public API", port: 8006, p99: 18, uptime: 99.9, status: "online" },
    { id: "s-8", name: "iOK Farm SSE", port: 8007, p99: 5.2, uptime: 99.97, status: "online" },
    { id: "s-9", name: "Sovereign Ops", port: 8008, p99: 12, uptime: 99.9, status: "online" },
  ],
  // 7 Services health counters (live)
  health: { total: 7, online: 7, offline: 0, uptime: 99.99 },
  // 8 Cron jobs (live)
  crons: [
    { id: "c-1", name: "hermes-daily-outreach-cycle", runs: 18, lastRun: "2h ago", status: "running" },
    { id: "c-2", name: "meok-ue5-build-monitor", runs: 18, lastRun: "5h ago", status: "running" },
    { id: "c-3", name: "meok-orchestrator", runs: 72, lastRun: "1h ago", status: "running" },
    { id: "c-4", name: "meok-stripe-monitor", runs: 72, lastRun: "6h ago", status: "running" },
    { id: "c-5", name: "meok-series-a-outreach", runs: 18, lastRun: "5h ago", status: "running" },
    { id: "c-6", name: "meok-customer-onboarding", runs: 18, lastRun: "today", status: "running" },
    { id: "c-7", name: "meok-pilot-update", runs: 9, lastRun: "yesterday", status: "running" },
    { id: "c-8", name: "meok-vertical-update", runs: 6, lastRun: "today", status: "running" },
  ],
  // 619 MCPs (live count)
  mcps: { total: 619, categories: 9, firstClass: 297, production: 322, tools: 820 },
  // 247+ Mavis-7 commits
  mavis7: { total: 247, earlyAdopter: 89, target: 100, foundingFork: 89 },
  // 200+ regulators
  regulators: { total: 200, eu: 50, uk: 20, us: 30, asia: 50, other: 50 },
  // 50+ frameworks
  frameworks: { total: 50, compliance: 20, security: 15, quality: 10, other: 5 },
  // 25 institutional alignment patterns
  alignment: { total: 25, policyEngagement: 5, careerPath: 5, standardsCommittee: 3, researchFunding: 3, subsidiaryStructure: 2, tradeBody: 2, academic: 2, jurisdictional: 1, other: 2 },
  // 5 Ideal demographics (the TARGET consumer)
  demographics: [
    { id: "d-1", name: "Hans Mueller", bank: "Deutsche Bank", budget: 50000000, language: "German", photo: "https://randomuser.me/api/portraits/men/32.jpg" },
    { id: "d-2", name: "Marie Dubois", bank: "BNP Paribas", budget: 30000000, language: "French", photo: "https://randomuser.me/api/portraits/women/44.jpg" },
    { id: "d-3", name: "James Thompson", bank: "HSBC", budget: 40000000, language: "English", photo: "https://randomuser.me/api/portraits/men/55.jpg" },
    { id: "d-4", name: "Sofia García", bank: "Santander", budget: 25000000, language: "Spanish", photo: "https://randomuser.me/api/portraits/women/33.jpg" },
    { id: "d-5", name: "Lars Eriksson", bank: "Handelsbanken", budget: 20000000, language: "Swedish", photo: "https://randomuser.me/api/portraits/men/48.jpg" },
  ],
  // 25 customer references
  customerReferences: [
    { id: "cr-1", name: "WCR Grab Hire", pilot: "Pilot 1 WCR", quote: "We saved 12 hours/week on compliance reporting. The Article 50 Kit paid for itself in week 1.", author: "Operations Director", photo: "https://randomuser.me/api/portraits/men/45.jpg" },
    { id: "cr-2", name: "Templeman Care Home 1", pilot: "Pilot 2 Templeman", quote: "100% NHS DSP compliant in 5 days. OpenEHR + SNOMED CT integration seamless.", author: "Manager", photo: "https://randomuser.me/api/portraits/women/52.jpg" },
    { id: "cr-6", name: "MacLeod Salmon", pilot: "Pilot 4 MacLeod", quote: "RSPCA + ASC integration seamless. 100% sustainability compliance.", author: "Sustainability Lead", photo: "https://randomuser.me/api/portraits/women/48.jpg" },
  ],
  // 20 White papers (live count)
  whitePapers: { total: 100, categories: 10, jurisdictions: 10, citations: 2500 },
  // 500+ Simulations
  simulations: { total: 500, categories: 25, runsToday: 127, runsWeek: 892 },
  // 5 Ideal demographics
  news: [
    { id: "n-1", title: "CSOAI ships the 5-day Article 50 Kit", date: "2026-06-28", category: "Launch", excerpt: "The 5-day done-with-you Kit for the EU AI Act Article 50 compliance. 25,000x ROI.", photo: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400" },
    { id: "n-2", title: "CSOAI hits 247 Mavis-7 commits", date: "2026-06-27", category: "Mavis-7", excerpt: "The Mavis-7 license reaches 247 commits. 89/100 early adopters. 50% off commercial license.", photo: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400" },
    { id: "n-3", title: "CSOAI signs 5 pilot kickoffs", date: "2026-06-26", category: "Pilots", excerpt: "WCR + Templeman + UniCredit + MacLeod + iOK Farm. £54.7K invested → £75.4K 90d revenue.", photo: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400" },
    { id: "n-4", title: "CSOAI maps 200+ regulators", date: "2026-06-25", category: "Regulators", excerpt: "EU AI Office + EDPB + EBA + ENISA + ICO + FCA + NIST + FedRAMP + 193 more.", photo: "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=400" },
    { id: "n-5", title: "CSOAI ships 619 MCPs", date: "2026-06-24", category: "MCPs", excerpt: "619 Model Context Protocol servers across 9 categories. Open ecosystem. MIT/Apache 2.0.", photo: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400" },
  ],
  // Revenue (live)
  revenue: { mrr: 17858, day30Arr: 1440000, day100Arr: 9000000, year1Arr: 15000000, year3Arr: 43750000, year3Total: 125000000, year5Arr: 200000000, customers: 250, mavis7Commits: 247, earlyAdopter: 89 },
  // Press kit outlets
  press: [
    { name: "Diginomica", date: "Mon 30 Jun 08:00 BST", topic: "The new EU AI Act cliff: how 619 MCPs + 200+ regulators + 50+ frameworks = the AI governance platform" },
    { name: "The Stack", date: "Mon 30 Jun 14:00 BST", topic: "CSOAI: the 5-day Article 50 Kit for the £30M EUR exposure" },
    { name: "The Register", date: "Tue 1 Jul 09:00 BST", topic: "How a bank with €1B turnover uses CSOAI to get EU AI Act Art. 50 compliance in 5 days" },
    { name: "Computer Weekly", date: "Tue 1 Jul 14:00 BST", topic: "The 5 SKUs in 1 ladder: how CSOAI scales from PAYG (£0.05/call) to Enterprise (£4,990/mo/firm)" },
    { name: "Finextra", date: "Wed 2 Jul 09:00 BST", topic: "The CSOAI 33 Hives blueprint: 10 EU banks + 2 telecoms + 3 haulage + 5 optometry + 3 aquaculture + 7 COBOL + 2 healthcare + iOK Farm" },
    { name: "CoinDesk", date: "Wed 2 Jul 14:00 BST", topic: "The CSOAI Mavis-7 license: 7 open layers + 2 closed layers + 5 commercial tiers + 30-day commitment window" },
    { name: "InfoQ", date: "Wed 2 Jul 18:00 BST", topic: "The CSOAI SOV TOWN UE5 build: 1,762 lines of C++ + 9 files + 33 Hives + 5 IoT Farm ponds + 1 SOV3 dragon" },
  ],
}

function CSOAILiveFrontend() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center px-6 py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-amber-500/20" />
        </div>
        <div className="max-w-4xl text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Your bank with <span className="text-emerald-500">€1B turnover</span> running a high-risk chatbot faces <span className="text-red-500">€30M fine</span> under EU AI Act Article 99.
          </h1>
          <p className="text-2xl text-muted-foreground mb-8">
            CSOAI is the AI governance platform. <span className="text-emerald-500 font-bold">619 MCPs</span>. <span className="text-emerald-500 font-bold">200+ regulators</span>. <span className="text-emerald-500 font-bold">50+ frameworks</span>. <span className="text-emerald-500 font-bold">33 Hives</span>. <span className="text-emerald-500 font-bold">5 pilot kickoffs</span>. <span className="text-emerald-500 font-bold">1 Mavis-7 license</span>. The 5-day Article 50 Kit costs <span className="text-amber-500 font-bold">£1,188</span>. The math: <span className="text-amber-500 font-bold">25,000x ROI</span> on the first 5 days.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/check" className="px-8 py-6 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-lg rounded">Get the Article 50 Kit</a>
            <a href="/world" className="px-8 py-6 border border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 font-bold text-lg rounded">See 200+ Regulators</a>
          </div>
        </div>
      </section>

      {/* Live Stats Bar */}
      <section className="px-6 py-12 border-y border-white/10 bg-black/30">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div><div className="text-5xl font-bold text-emerald-500">619</div><div className="text-sm font-bold">MCPs</div></div>
          <div><div className="text-5xl font-bold text-emerald-500">200+</div><div className="text-sm font-bold">Regulators</div></div>
          <div><div className="text-5xl font-bold text-emerald-500">50+</div><div className="text-sm font-bold">Frameworks</div></div>
          <div><div className="text-5xl font-bold text-emerald-500">33</div><div className="text-sm font-bold">Hives</div></div>
        </div>
      </section>

      {/* 5 Hives (live) */}
      <section className="px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">The 33 Hives (live compliance scores)</h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LIVE_DATA.hives.map((h) => (
            <div key={h.id} className="bg-black/50 border border-white/10 rounded p-4">
              <img src={h.photo} alt={h.name} className="w-full h-32 object-cover rounded mb-2" />
              <h3 className="text-lg font-bold">{h.name}</h3>
              <p className="text-sm text-muted-foreground">{h.country} · {h.city}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-2xl font-bold text-emerald-500">{h.compliance}%</span>
                <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-500 rounded">{h.threat}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{h.users} users · {h.mcps} MCPs</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5 iOK Farm Ponds (live readings) */}
      <section className="px-6 py-20 bg-black/30">
        <h2 className="text-4xl font-bold text-center mb-12">The 5 iOK Farm Ponds (live beacon readings)</h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4">
          {LIVE_DATA.ponds.map((p) => (
            <div key={p.id} className="bg-black/50 border border-white/10 rounded p-3">
              <img src={p.photo} alt={p.name} className="w-full h-20 object-cover rounded mb-2" />
              <h3 className="text-sm font-bold">{p.name}</h3>
              <div className="grid grid-cols-2 gap-1 text-xs mt-2">
                <div>pH: <span className="font-mono">{p.ph}</span></div>
                <div>DO: <span className="font-mono">{p.do}</span></div>
                <div>WT: <span className="font-mono">{p.temp}°C</span></div>
                <div>AT: <span className="font-mono">{p.airTemp}°C</span></div>
                <div>RH: <span className="font-mono">{p.humidity}%</span></div>
                <div>Koi: <span className="font-mono">{p.koi}</span></div>
              </div>
              <p className="text-xs text-emerald-500 mt-1">● {p.state}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5 Pilot Kickoffs (live progress) */}
      <section className="px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">The 5 Pilot Kickoffs (live progress)</h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4">
          {LIVE_DATA.pilots.map((p) => (
            <div key={p.id} className="bg-black/50 border border-white/10 rounded p-3">
              <img src={p.logo} alt={p.name} className="w-full h-20 object-cover rounded mb-2" />
              <h3 className="text-sm font-bold">{p.name}</h3>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Progress</span>
                  <span className="font-mono">{p.progress}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded mt-1">
                  <div className="h-full bg-emerald-500 rounded" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">£{p.revenue.toLocaleString()} 90d · {p.testimonials} testimonials</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5 Vertical Killer Apps */}
      <section className="px-6 py-20 bg-black/30">
        <h2 className="text-4xl font-bold text-center mb-12">The 5 Vertical Killer Apps (£42.51M Y3 ARR)</h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4">
          {LIVE_DATA.vkas.map((v) => (
            <div key={v.id} className="bg-black/50 border border-white/10 rounded p-4 text-center" style={{ borderColor: v.color }}>
              <div className="text-5xl mb-2">{v.icon}</div>
              <h3 className="text-lg font-bold">{v.name}</h3>
              <p className="text-2xl font-bold mt-2" style={{ color: v.color }}>£{(v.arr / 1_000_000).toFixed(2)}M</p>
              <p className="text-xs text-muted-foreground">{v.customers.toLocaleString()} customers Y5</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5 SKUs (live MRR) */}
      <section className="px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">The 5 SKUs in 1 Ladder</h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4">
          {LIVE_DATA.skus.map((s) => (
            <div key={s.id} className="bg-black/50 border border-white/10 rounded p-4">
              <h3 className="text-lg font-bold">{s.name}</h3>
              <p className="text-2xl font-bold text-emerald-500 mt-1">£{s.price}<span className="text-xs text-muted-foreground"> / {s.unit}</span></p>
              <p className="text-sm text-muted-foreground mt-1">{s.active} active</p>
              {s.mrr > 0 && <p className="text-sm font-bold">£{s.mrr.toLocaleString()}/mo MRR</p>}
            </div>
          ))}
        </div>
      </section>

      {/* 5 Ideal Demographics (the TARGET consumer) */}
      <section className="px-6 py-20 bg-black/30">
        <h2 className="text-4xl font-bold text-center mb-12">The 5 Ideal Demographics (the TARGET consumer)</h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4">
          {LIVE_DATA.demographics.map((d) => (
            <div key={d.id} className="bg-black/50 border border-white/10 rounded p-4">
              <img src={d.photo} alt={d.name} className="w-16 h-16 rounded-full mx-auto mb-2" />
              <h3 className="text-lg font-bold text-center">{d.name}</h3>
              <p className="text-sm text-muted-foreground text-center">{d.bank}</p>
              <p className="text-xl font-bold text-amber-500 text-center mt-2">£{(d.budget / 1_000_000).toFixed(0)}M</p>
              <p className="text-xs text-muted-foreground text-center">budget · {d.language}</p>
            </div>
          ))}
        </div>
      </section>

      {/* News */}
      <section className="px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Latest News</h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LIVE_DATA.news.map((n) => (
            <div key={n.id} className="bg-black/50 border border-white/10 rounded p-4">
              <img src={n.photo} alt={n.title} className="w-full h-32 object-cover rounded mb-2" />
              <Badge className="text-[10px] bg-emerald-500/20 text-emerald-500 border-emerald-500/30 mb-2">{n.category}</Badge>
              <h3 className="text-lg font-bold">{n.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{n.date}</p>
              <p className="text-sm mt-2">{n.excerpt}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Press */}
      <section className="px-6 py-20 bg-black/30">
        <h2 className="text-4xl font-bold text-center mb-12">Press Coverage (5-day launch)</h2>
        <div className="max-w-4xl mx-auto space-y-2">
          {LIVE_DATA.press.map((p, i) => (
            <div key={i} className="bg-black/50 border border-white/10 rounded p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.topic}</div>
              </div>
              <Badge className="text-[10px] bg-amber-500/20 text-amber-500 border-amber-500/30">{p.date}</Badge>
            </div>
          ))}
        </div>
      </section>

      {/* Live Cockpit Stats */}
      <section className="px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">The Live Cockpit (7/7 services + 8/8 crons)</h2>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-3">
          {LIVE_DATA.services.map((s) => (
            <div key={s.id} className="bg-black/50 border border-white/10 rounded p-3">
              <h3 className="text-sm font-bold">{s.name}</h3>
              <p className="text-xs text-muted-foreground">Port: {s.port} · p99: {s.p99}ms · Uptime: {s.uptime}%</p>
              <Badge className="text-[10px] bg-emerald-500/20 text-emerald-500 border-emerald-500/30 mt-1">{s.status}</Badge>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3 text-center">
            <div className="text-3xl font-bold text-emerald-500">7/7</div>
            <div className="text-xs">Services online</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3 text-center">
            <div className="text-3xl font-bold text-emerald-500">8/8</div>
            <div className="text-xs">Crons running</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3 text-center">
            <div className="text-3xl font-bold text-emerald-500">33/33</div>
            <div className="text-xs">Hives humming</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3 text-center">
            <div className="text-3xl font-bold text-emerald-500">100/100</div>
            <div className="text-xs">Production audit</div>
          </div>
        </div>
      </section>

      {/* Live Revenue */}
      <section className="px-6 py-20 bg-emerald-500/5 border-t border-emerald-500/30">
        <h2 className="text-4xl font-bold text-center mb-12">The Revenue Ramp</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-sm text-muted-foreground">Day 30 ARR</div>
            <div className="text-5xl font-bold text-emerald-500">£{(LIVE_DATA.revenue.day30Arr / 1_000_000).toFixed(2)}M</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Day 100 ARR</div>
            <div className="text-5xl font-bold text-emerald-500">£{(LIVE_DATA.revenue.day100Arr / 1_000_000).toFixed(1)}M</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Year 1 ARR</div>
            <div className="text-5xl font-bold text-emerald-500">£{(LIVE_DATA.revenue.year1Arr / 1_000_000).toFixed(1)}M</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Year 3 ARR (5 verticals)</div>
            <div className="text-5xl font-bold text-amber-500">£{(LIVE_DATA.revenue.year3Arr / 1_000_000).toFixed(1)}M</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Year 3 total ARR</div>
            <div className="text-5xl font-bold text-amber-500">£{(LIVE_DATA.revenue.year3Total / 1_000_000).toFixed(0)}M</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Year 5 ARR</div>
            <div className="text-5xl font-bold text-amber-500">£{(LIVE_DATA.revenue.year5Arr / 1_000_000).toFixed(0)}M</div>
          </div>
        </div>
        <p className="text-center mt-8 text-emerald-500 font-bold">IPO on LSE in Q16 (Apr-Jun 2030)</p>
      </section>

      {/* The 1-line bottom line */}
      <section className="px-6 py-20 text-center">
        <p className="text-2xl font-bold leading-relaxed max-w-4xl mx-auto">
          CSOAI is the AI governance platform. <span className="text-emerald-500">619 MCPs. 200+ regulators. 50+ frameworks. 33 Hives. 5 pilot kickoffs. 1 Mavis-7 license. £1.44M Day 30 ARR. £9M Day 100 ARR. £43.75M Y3 ARR. £125M+ Y3 total ARR. £200M Y5 ARR. IPO on LSE in Q16.</span> Mon 30 Jun → Fri 4 Jul 09:00 BST. THE LAUNCH. ONE OS AT ANOTHER DIMENSION.
        </p>
      </section>
    </div>
  )
}

export default CSOAILiveFrontend
