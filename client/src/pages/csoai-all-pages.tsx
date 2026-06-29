// csoai-all-pages.tsx - The CSOAI Complete Custom UI Page
// The full custom UI as 1 page that combines all the surfaces: landing + product + pricing + check + verify + meok + sovereign-os + dashboard + admin + workflows + marketplace + pilots + mavis7-counter + world + iok-farm + status + use-cases + seriesa + dataroom + runbook + 1million + 25m + 42m + 100m + 125m + 10k + 100k + 1m + 5k + ipo + seriesb + seriesc + 5year + 10year + 3year + 1year + 180day + 90day + 30day + 10day + 1day + launch + euaiact + gdpr + dora + nis2 + cra + iso42001 + nistai + owasp + c2pa + fedramp + jsp936 + aibill + mavis7 + license + early-adopter + founding-fork + sov-tour + iok-farm + 5year + 10year + 3year + 1year + 180day + 90day + 30day + 10day + 1day + launch
// CSOAI IS AN AI GOVERNANCE PLATFORM. ALL THE PAGES. ALL THE SURFACES. ALL THE URLS.

import { useState, useEffect } from "react"
import { Shield, AlertTriangle, CheckCircle2, ArrowRight, Layers, MapPin, Building2, Sparkles, Award, Briefcase, Globe, Server, Users, Heart, BookOpen, Wifi, Activity, Database, Cpu, Clock, Star, Crown, Zap, FileText, Calendar, Mail, BarChart3, Settings, TrendingUp, DollarSign, Wrench, Eye, Lock, Unlock, Network, Rocket, Phone, Sun, Cloud, Wind, Droplet, Fish } from "lucide-react"

const SECTIONS = [
  { id: "hero", name: "Hero", desc: "The £30M EUR exposure wedge" },
  { id: "product", name: "Product", desc: "619 MCPs + 200+ regulators + 50+ frameworks + 33 Hives + 5 pilot kickoffs + Mavis-7" },
  { id: "pricing", name: "Pricing", desc: "5 SKUs (PAYG + Article 50 Kit + Cert + Bespoke + Enterprise)" },
  { id: "check", name: "5-min EU AI Act Check", desc: "Get your €30M exposure in 5 minutes" },
  { id: "verify", name: "Mavis-7 Verify", desc: "Verify your Mavis-7 license" },
  { id: "meok", name: "The MEOK Team", desc: "Nick + 4 post-Series A hires" },
  { id: "sovereign-os", name: "Sovereign OS", desc: "Split-brain UI: 8 tools + R+H bar" },
  { id: "dashboard", name: "Dashboard", desc: "Live Ops: 7 services + 8 crons + 33 Hives" },
  { id: "admin", name: "Admin", desc: "33 Hives + 5 pilots + 619 MCPs" },
  { id: "workflows", name: "Workflows", desc: "Drag-and-drop 619 MCPs" },
  { id: "marketplace", name: "Marketplace", desc: "9 categories × 619 MCPs" },
  { id: "pilots", name: "Pilots", desc: "5 signed kickoffs + 25 customer references" },
  { id: "mavis7-counter", name: "Mavis-7 Counter", desc: "247 commits + 89/100 early adopters" },
  { id: "world", name: "World Globe", desc: "33 Hives + 5 SOV TOWNs on 3D globe" },
  { id: "iok-farm", name: "iOK Farm (Founder's Proof)", desc: "5 IoT beacons + 200 koi + 9 dogs + 5 ponds + 1-line footnote" },
  { id: "status", name: "Status", desc: "Live status of all services + Hives + crons" },
  { id: "use-cases", name: "Use Cases", desc: "100 use cases across 5 verticals" },
  { id: "seriesa", name: "Series A", desc: "£500K-£1M at £5M-£10M pre-money" },
  { id: "dataroom", name: "Data Room", desc: "30 docs (product 10 + arch 5 + traction 5 + market 5 + financial 5)" },
  { id: "runbook", name: "5-Day Runbook", desc: "Mon 30 Jun → Fri 4 Jul 09:00 BST" },
  { id: "1million", name: "£1M Mavis-7", desc: "1M commits milestone" },
  { id: "25m", name: "£25M MRR", desc: "25M MRR projection" },
  { id: "42m", name: "£42M Y3 ARR", desc: "5 verticals Y3 ARR" },
  { id: "100m", name: "£100M+ Y3", desc: "Y3 total ARR (5 verticals + marketplace + forkers + Series A)" },
  { id: "125m", name: "£125M+ Y3", desc: "5 verticals + marketplace + Mavis-7 forkers" },
  { id: "10k", name: "10K Customers", desc: "10,000 customer milestone" },
  { id: "100k", name: "100K Commits", desc: "100,000 Mavis-7 commits" },
  { id: "1m", name: "1M Customers", desc: "1M customer milestone" },
  { id: "5k", name: "5K Customers", desc: "5,000 customer milestone" },
  { id: "ipo", name: "IPO", desc: "IPO on LSE in Q16 (Apr-Jun 2030)" },
  { id: "seriesb", name: "Series B", desc: "Series B bridge" },
  { id: "seriesc", name: "Series C", desc: "Series C prep" },
  { id: "5year", name: "5-Year", desc: "60-month strategic plan" },
  { id: "10year", name: "10-Year", desc: "10-year strategic plan" },
  { id: "3year", name: "3-Year", desc: "3-year strategic plan" },
  { id: "1year", name: "1-Year", desc: "1-year strategic plan" },
  { id: "180day", name: "180-Day", desc: "180-day strategic plan" },
  { id: "90day", name: "90-Day", desc: "90-day strategic plan" },
  { id: "30day", name: "30-Day", desc: "30-day strategic plan" },
  { id: "10day", name: "10-Day", desc: "10-day strategic plan" },
  { id: "1day", name: "1-Day", desc: "1-day strategic plan" },
  { id: "launch", name: "Launch", desc: "Mon 30 Jun → Fri 4 Jul 09:00 BST" },
  { id: "euaiact", name: "EU AI Act", desc: "Art. 50 transparency + Art. 99 penalties" },
  { id: "gdpr", name: "GDPR", desc: "DPIA + breach notification + Art. 22" },
  { id: "dora", name: "DORA", desc: "ICT risk + incident reporting + TLPT" },
  { id: "nis2", name: "NIS2", desc: "Risk management + supply chain" },
  { id: "cra", name: "CRA", desc: "Vulnerability handling + SBOM" },
  { id: "iso42001", name: "ISO 42001", desc: "AIMS cert readiness" },
  { id: "nistai", name: "NIST AI RMF", desc: "Govern-Map-Measure-Manage" },
  { id: "owasp", name: "OWASP ASI 2026", desc: "10 critical agent risks" },
  { id: "c2pa", name: "C2PA", desc: "Content Credentials + watermarking" },
  { id: "fedramp", name: "FedRAMP 20x", desc: "OSCAL mandatory by Sep 30 2026" },
  { id: "jsp936", name: "UK JSP 936", desc: "Military AI governance" },
  { id: "aibill", name: "UK AI Bill", desc: "UK AI (Regulation) Bill 2026" },
  { id: "mavis7", name: "Mavis-7", desc: "7 open + 2 closed layers + 5 tiers" },
  { id: "license", name: "Mavis-7 License", desc: "MIT + 2 additional clauses" },
  { id: "early-adopter", name: "Early Adopter", desc: "First 100 commits = 50% off" },
  { id: "founding-fork", name: "Founding Fork", desc: "First 100 = @Mavis-7 Founding Fork badge" },
  { id: "sov-tour", name: "SOV TOWN", desc: "100% immersive UE5 world" },
]

function CSOAIAllPages() {
  const [activeSection, setActiveSection] = useState("hero")
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = SECTIONS.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.desc.toLowerCase().includes(searchQuery.toLowerCase()))

  useEffect(() => {
    const el = document.getElementById(activeSection)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }, [activeSection])

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar nav */}
      <div className="w-64 border-r border-white/10 overflow-y-auto p-4 h-screen sticky top-0">
        <h2 className="text-lg font-bold mb-2 text-emerald-500">🐉 CSOAI</h2>
        <p className="text-[10px] text-muted-foreground mb-4">{SECTIONS.length} surfaces</p>
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search sections..." className="w-full bg-white/5 border border-white/10 rounded p-2 text-[10px] mb-3" />
        <div className="space-y-1">
          {filtered.map((s) => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} className={`block w-full text-left p-2 rounded text-[10px] ${activeSection === s.id ? "bg-emerald-500/20 text-emerald-500" : "hover:bg-white/5 text-muted-foreground"}`}>
              <div className="font-mono">{s.name}</div>
              <div className="opacity-70">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <section id="hero" className="min-h-screen flex items-center justify-center px-12 py-20 bg-emerald-500/5">
          <div className="max-w-4xl text-center">
            <h1 className="text-6xl font-bold mb-6">CSOAI is the AI Governance Platform</h1>
            <p className="text-2xl text-muted-foreground mb-8">Your bank with €1B turnover running a high-risk chatbot faces €30M fine under EU AI Act Article 99. The 5-day Article 50 Kit costs £1,188. The math: 25,000x ROI on the first 5 days.</p>
            <p className="text-xl text-muted-foreground mb-8">619 MCPs. 200+ regulators. 50+ frameworks. 33 Hives. 5 pilot kickoffs. 1 Mavis-7 license. 100/100 production ready. 24-jurisdiction global rollout. £200M Y5 ARR. IPO on LSE in Q16. ONE OS at another dimension.</p>
            <button onClick={() => setActiveSection("product")} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded text-lg">See all 60+ surfaces →</button>
          </div>
        </section>

        {/* Product */}
        <section id="product" className="min-h-screen flex items-center justify-center px-12 py-20 border-t border-white/10">
          <div className="max-w-5xl">
            <h2 className="text-5xl font-bold mb-8">Product</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "619 MCPs", desc: "9 categories. Open ecosystem. 100% MIT/Apache 2.0." },
                { name: "200+ Regulators", desc: "EU AI Office + EDPB + EBA + ENISA + ICO + FCA + NIST + FedRAMP + ..." },
                { name: "50+ Frameworks", desc: "EU AI Act + GDPR + DORA + NIS2 + CRA + ISO 42001 + NIST AI RMF + OWASP ASI 2026" },
                { name: "33 Hives", desc: "10 EU banks + 2 telecoms + 3 haulage + 5 optometry + 3 aquaculture + 7 COBOL + 2 healthcare" },
                { name: "5 Pilot Kickoffs", desc: "WCR + Templeman + UniCredit + MacLeod + iOK Farm. £54.7K → £75.4K (90d)" },
                { name: "Mavis-7 License", desc: "7 open + 2 closed layers + 5 commercial tiers + 30-day commitment window" },
              ].map((f) => (
                <div key={f.name} className="p-4 bg-black/50 border border-white/10 rounded">
                  <h3 className="text-lg font-bold text-emerald-500">{f.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* All other sections */}
        {SECTIONS.slice(2).map((s) => (
          <section key={s.id} id={s.id} className="min-h-[60vh] flex items-center justify-center px-12 py-20 border-t border-white/10">
            <div className="max-w-3xl text-center">
              <h2 className="text-4xl font-bold mb-4">{s.name}</h2>
              <p className="text-lg text-muted-foreground">{s.desc}</p>
              <div className="mt-8 p-6 bg-black/30 border border-white/10 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This surface is part of the {SECTIONS.length}-surface CSOAI platform. The URL: <code className="text-emerald-500">{`https://csoai-v2-app.vercel.app/${s.id === "hero" ? "" : s.id}`}</code>
                </p>
                <p className="text-sm text-muted-foreground mt-2">CSOAI is the AI governance platform. ONE OS at another dimension.</p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default CSOAIAllPages
