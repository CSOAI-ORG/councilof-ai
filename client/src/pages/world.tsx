// csoai-world-page.tsx - The CSOAI World Globe page
// Renders the full CSOAI World Globe as a standalone page at /world
// Compatible with: Next.js 14+ · React 18+ · Tailwind CSS · shadcn/ui

import { CsOaiWorldGlobe } from "@/components/csoai-world-globe"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe, MapPin, Building2, Server, Cpu, Zap, Shield, Network, Sparkles, ExternalLink, Wifi, Crown, Users, BookOpen, Briefcase, Anchor } from "lucide-react"
import { Suspense } from "react"

export default function WorldPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* The 3D Globe (full viewport) */}
      <div className="relative">
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading the CSOAI World...</div>}>
          <CsOaiWorldGlobe />
        </Suspense>
      </div>

      {/* Info panel below the globe */}
      <div className="max-w-7xl mx-auto py-16 px-6">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-emerald-500 border-emerald-500">
            <Globe className="w-4 h-4 mr-2" />
            CSOAI World Globe
          </Badge>
          <h1 className="text-5xl font-bold mb-4">
            The sovereign operating system
            <br />
            <span className="bg-gradient-to-r from-emerald-500 to-gold-500 bg-clip-text text-transparent">
              for AI safety governance
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The entire MEOK AI Labs / CSOAI architecture rendered as one sovereign world.
            33 Hives. 5 SOV TOWN UE5 builds. 5 vertical enterprise sites. 5 SaaS products.
            1 Mavis-7 license. 1 sovereign dragon avatar. 1 iOK Farm beacon. All on one Earth.
          </p>
        </div>

        {/* The 8 layers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <LayerCard
            icon={<MapPin className="w-6 h-6" />}
            title="33 Hives"
            description="The 33 real customers across 8 categories. 10 EU banks + 2 telecoms + 3 haulage + 5 optometry + 3 aquaculture + 7 COBOL banks + 2 healthcare + 1 iOK Farm."
            color="emerald"
          />
          <LayerCard
            icon={<Crown className="w-6 h-6" />}
            title="5 SOV TOWNs"
            description="The 5 photorealistic 3D UE5 builds. London (HSBC) + London (Barclays) + Paris (BNP) + Lincoln (WCR) + Sutton St James (iOK Farm). 9 buildings + 5 ponds + 5 IoT beacons + 9 dogs + 200 koi."
            color="gold"
          />
          <LayerCard
            icon={<Briefcase className="w-6 h-6" />}
            title="5 Verticals"
            description="The 5 vertical killer apps. Construction (OpenConstructionERP + Speckle) + Optometry (OpenEHR + SNOMED CT) + COBOL (GnuCOBOL) + Haulage (OSM + OSRM) + Aquaculture (OpenCV + YOLOv8)."
            color="purple"
          />
          <LayerCard
            icon={<Server className="w-6 h-6" />}
            title="5 SaaS"
            description="The 5 SaaS products. PAYG (£0.05/call) + Article 50 Kit (£999) + Certification (£199/mo/site) + Bespoke (£4,950) + Enterprise On-Prem (£4,990/mo/firm)."
            color="cyan"
          />
          <LayerCard
            icon={<BookOpen className="w-6 h-6" />}
            title="1 Mavis-7"
            description="The 1 forkable license. 7 open layers (MIT/Apache 2.0) + 2 closed layers (MEOK AI Labs trademark + Mavis-7 legal wrapper) + 5 commercial license tiers + 30-day commitment window."
            color="amber"
          />
          <LayerCard
            icon={<Sparkles className="w-6 h-6" />}
            title="1 SOV3"
            description="The 1 sovereign dragon avatar. Kokoro TTS (54 voices × 8 languages) + Ollama LLM (local) + NVIDIA ACE Audio2Face-3D lip-sync. Speaks on threat detection. 7 capabilities."
            color="rose"
          />
          <LayerCard
            icon={<Wifi className="w-6 h-6" />}
            title="1 iOK Farm"
            description="The 1 physical proof. 5 ponds + 5 IoT beacons + 9 dogs + 200 koi. ESP32 + pH/DO/temp/humidity sensors. Ed25519-signed attestations. Real-time MQTT every 30s."
            color="emerald"
          />
          <LayerCard
            icon={<Network className="w-6 h-6" />}
            title="271 MCPs"
            description="The 271 CSOAI MCPs. 9 categories: Compliance 40 + Healthcare 25 + Finance 36 + Supply Chain 30 + Identity 26 + Standards 40 + Agents 36 + Open Source 44 + Vertical 45. 100% MIT/Apache 2.0."
            color="indigo"
          />
        </div>

        {/* The data layer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" /> 33 Hives
              </CardTitle>
              <CardDescription>The real customers</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div>10 EU banks · 2 telecoms · 3 haulage · 5 optometry</div>
              <div>3 aquaculture · 7 COBOL banks · 2 healthcare · 1 iOK Farm</div>
              <div className="text-muted-foreground mt-2">Total ARR target: £42.51M Year 3</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" /> 5 SOV TOWNs
              </CardTitle>
              <CardDescription>The photorealistic 3D worlds</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div>London (HSBC) · London (Barclays) · Paris (BNP)</div>
              <div>Lincoln (WCR) · Sutton St James (iOK Farm)</div>
              <div className="text-muted-foreground mt-2">9 files · 1,256 LOC · 3-step deploy · 5 min to live</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" /> 5 Verticals
              </CardTitle>
              <CardDescription>The killer apps</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div>Construction · Optometry · COBOL · Haulage · Aquaculture</div>
              <div className="text-muted-foreground mt-2">4 crown jewels + 3 new MCPs per vertical</div>
            </CardContent>
          </Card>
        </div>

        {/* The bottom CTA */}
        <div className="mt-16 text-center p-8 border border-emerald-500/30 rounded-lg">
          <Crown className="w-12 h-12 text-gold-500 mx-auto mb-4" style={{ color: "#fbbf24" }} />
          <h2 className="text-3xl font-bold mb-2">Mon 30 Jun 09:00 BST. The launch.</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            5 human actions. 8 cron jobs. 250 customers by Day 30.
            £1.44M ARR. £42.51M Year 3 ARR. $125M+/£100M+ Year 3 ARR total.
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/commit" className="px-6 py-3 bg-emerald-500 text-black rounded font-semibold hover:bg-emerald-600">
              Commit to the Mavis-7 license
            </a>
            <a href="https://github.com/CSOAI-ORG/councilof-ai" className="px-6 py-3 border border-white/20 rounded font-semibold hover:border-emerald-500">
              Fork the architecture on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function LayerCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
  return (
    <div className={`p-4 rounded-lg border border-${color}-500/30 bg-${color}-500/5 hover:bg-${color}-500/10 transition-colors`}>
      <div className={`text-${color}-500 mb-2`} style={{ color: `var(--${color}, #4ade80)` }}>{icon}</div>
      <div className="font-bold mb-1">{title}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  )
}
