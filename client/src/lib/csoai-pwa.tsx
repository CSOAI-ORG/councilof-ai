// csoai-pwa.ts - The CSOAI PWA Wrapper (service worker + manifest + offline support)
// Production-ready PWA so the Sovereign OS works as a real installed app on iOS + Android + Windows + macOS + Linux
// Plus the 5-year strategic roadmap timeline component

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ChevronRight, Rocket, Target, TrendingUp, Award, Crown, Star, Activity, Calendar, Briefcase, Building2 } from "lucide-react"

const MANIFEST = {
  name: "CSOAI Sovereign OS",
  short_name: "CSOAI",
  description: "The sovereign operating system for AI safety governance",
  start_url: "/",
  display: "standalone",
  orientation: "any",
  background_color: "#000000",
  theme_color: "#10b981",
  display_override: ["window-controls-overlay", "minimal-ui", "standalone"],
  icons: [
    { src: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png", purpose: "any" },
    { src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png", purpose: "any" },
    { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png", purpose: "any" },
    { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  ],
  categories: ["business", "productivity", "developer", "education"],
  start_url: "/?source=pwa",
  display: "standalone",
  scope: "/",
  theme_color: "#10b981",
  background_color: "#000000",
  orientation: "any",
}

const SERVICE_WORKER = `// CSOAI PWA Service Worker
const CACHE_NAME = "csoai-v1.0.0"
const STATIC_ASSETS = ["/", "/try", "/check", "/verify", "/pricing", "/sovereign", "/world", "/dashboard", "/admin", "/workflows", "/marketplace", "/pilots", "/mavis7-counter", "/one-click-check", "/iok-farm", "/knowledge-graph", "/eat", "/embed", "/docs", "/blog", "/status", "/use-cases", "/commit", "/api/openapi.json"]

self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))) })
self.addEventListener("fetch", (event) => { event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request))) })
self.addEventListener("activate", (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))) })
`

const ROADMAP_QUARTERS = [
  { q: "Q1", period: "Jul-Sep 2026", theme: "The Launch", arr: "£9M", customers: 250, highlights: ["Mon 30 Jun IP deed", "Fri 4 Jul THE LAUNCH", "Day 30 £1.44M ARR", "Day 100 £9M ARR"] },
  { q: "Q2", period: "Oct-Dec 2026", theme: "Series A Close", arr: "£20M", customers: 500, highlights: ["5 lead VC meetings", "5 LOIs by Day 18", "5 hires", "ISO 42001 cert"] },
  { q: "Q3", period: "Jan-Mar 2027", theme: "5 Verticals", arr: "£42.51M", customers: 1000, highlights: ["Construction + Optometry + COBOL + Haulage + Aquaculture = £42.51M", "ISO 42001 complete", "SOC 2 Type I"] },
  { q: "Q4", period: "Apr-Jun 2027", theme: "24 Jurisdictions", arr: "£60M", customers: 2500, highlights: ["EU + UK + US (7 jurisdictions)", "APAC (6)", "LATAM + CA + AU (6)", "MEA (5)"] },
  { q: "Q5", period: "Jul-Sep 2027", theme: "Series B", arr: "£70M", customers: 4000, highlights: ["5 hires complete", "Series B prep", "DEFENSE SOV TOWN", "Mavis-7 SDK 1.0"] },
  { q: "Q6", period: "Oct-Dec 2027", theme: "DEFENSE Expansion", arr: "£75M", customers: 5000, highlights: ["DEFENSE in 5 countries", "NATO DIANA partnership", "AUKUS Pillar II", "4 new crown jewels"] },
  { q: "Q7", period: "Jan-Mar 2028", theme: "API Ecosystem", arr: "£78M", customers: 6000, highlights: ["Public API 2.0", "100 third-party developers", "10 vertical killer apps", "ISO 42001 renewed"] },
  { q: "Q8", period: "Apr-Jun 2028", theme: "High-Risk Anniversary", arr: "£80M", customers: 7500, highlights: ["1-year high-risk anniversary", "1.5M Mavis-7 commits", "50 vertical killer apps"] },
  { q: "Q9", period: "Jul-Sep 2028", theme: "100 Customers", arr: "£90M", customers: 10000, highlights: ["100 enterprise × £4,990/mo = £72M", "Per-use fees = £15M", "2M Mavis-7 commits"] },
  { q: "Q10", period: "Oct-Dec 2028", theme: "DEFENSE Global", arr: "£100M", customers: 12000, highlights: ["DEFENSE in 10 countries", "5K Mavis-7 in DEFENSE", "100K ATT&CK mappings", "£100M ARR"] },
  { q: "Q11", period: "Jan-Mar 2029", theme: "Series C", arr: "£110M", customers: 15000, highlights: ["Series C prep", "10 vertical killer apps 100% adoption", "3M Mavis-7 commits"] },
  { q: "Q12", period: "Apr-Jun 2029", theme: "1-Year Anniversary", arr: "£125M+", customers: 18000, highlights: ["1-year high-risk anniversary", "4M Mavis-7 commits", "£125M+ ARR", "IPO prep begins"] },
  { q: "Q13", period: "Jul-Sep 2029", theme: "IPO Filing", arr: "£135M", customers: 22000, highlights: ["S-1 filing", "Series D bridge", "5M Mavis-7 commits"] },
  { q: "Q14", period: "Oct-Dec 2029", theme: "IPO Roadshow", arr: "£142M", customers: 25000, highlights: ["Roadshow", "7M Mavis-7 commits"] },
  { q: "Q15", period: "Jan-Mar 2030", theme: "IPO Pricing", arr: "£148M", customers: 30000, highlights: ["IPO pricing", "10M Mavis-7 commits"] },
  { q: "Q16", period: "Apr-Jun 2030", theme: "THE IPO", arr: "£150M", customers: 35000, highlights: ["CSOAI listed on LSE", "12M Mavis-7 commits", "35K customers", "50 vertical killer apps"] },
  { q: "Q17", period: "Jul-Sep 2030", theme: "Post-IPO Scale", arr: "£165M", customers: 50000, highlights: ["20M Mavis-7 commits", "50K customers", "100 vertical killer apps"] },
  { q: "Q18", period: "Oct-Dec 2030", theme: "Enterprise", arr: "£180M", customers: 75000, highlights: ["50 Fortune 500", "30M Mavis-7 commits", "75K customers"] },
  { q: "Q19", period: "Jan-Mar 2031", theme: "Global Platform", arr: "£190M", customers: 100000, highlights: ["200 vertical killer apps", "50M Mavis-7 commits", "100K customers", "Series E bridge"] },
  { q: "Q20", period: "Apr-Jun 2031", theme: "£200M ARR", arr: "£200M", customers: 150000, highlights: ["100M Mavis-7 commits", "150K customers", "500 vertical killer apps", "£200M ARR"] },
]

export function FiveYearRoadmapTimeline() {
  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      <div className="text-center">
        <Badge variant="outline" className="mb-4 text-emerald-500 border-emerald-500">
          <Rocket className="w-3 h-3 mr-1" /> 5-YEAR STRATEGIC ROADMAP · 60 QUARTERLY MILESTONES
        </Badge>
        <h1 className="text-4xl font-bold mb-2">From £1.44M Day 30 to £200M Year 5 ARR</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto">The 60-month strategic plan that takes CSOAI from the launch (Fri 4 Jul 2026) to the IPO (Q16 · Apr-Jun 2030) to the global platform (£200M ARR by Q20 · Apr-Jun 2031).</p>
      </div>

      {/* The 20-quarter timeline */}
      <div className="space-y-2">
        {ROADMAP_QUARTERS.map((q, i) => (
          <Card key={q.q} className="bg-black/50 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-emerald-500 w-16">{q.q}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">{q.theme}</span>
                    <Badge variant="outline" className="text-[10px]">{q.period}</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex flex-wrap gap-2">
                    {q.highlights.map((h, j) => (<span key={j}>· {h}</span>))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-500">{q.arr}</div>
                  <div className="text-[10px] text-muted-foreground">{q.customers.toLocaleString()} customers</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* The 1-line bottom line */}
      <div className="text-center">
        <Sparkles className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
        <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
          20 quarters × 3 milestones = 60 quarterly milestones. £1.44M Day 30 → £9M Day 100 → £42.51M Y3 ARR (5 verticals) → £125M+ Y3 ARR total → £150M IPO (Q16) → £200M Y5 ARR (Q20). 100 customer references by Day 30 + 5 vertical killer apps + DEFENSE SOV TOWN + 100K+ Mavis-7 commits by Y5. ONE OS at another dimension.
        </p>
      </div>
    </div>
  )
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") setInstalled(true)
    setDeferredPrompt(null)
  }

  return (
    <Button onClick={install} disabled={!deferredPrompt || installed} className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold">
      {installed ? "✓ Installed" : "Install CSOAI PWA"}
    </Button>
  )
}

export const CSOAI_PWA_MANIFEST = MANIFEST
export const CSOAI_PWA_SERVICE_WORKER = SERVICE_WORKER
export default FiveYearRoadmapTimeline
