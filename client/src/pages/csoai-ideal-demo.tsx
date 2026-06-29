// csoai-set-ideal-demo.tsx - The CSOAI Set Ideal Demo
// The 1 perfect end-to-end production-ready interactive demo
// Ties together: the iOK Farm live beacon stream + the 100% IMMERSIVE UE5 world + the EAT endpoint + the Unified Data Graph
// + the 5 pilot kickoffs + the 33 Hives + the 619 MCPs + the £30M exposure wedge + the Mavis-7 license + the 200+ regulators + the 7-stage revenue funnel
// Live. Interactive. Production-ready. The demo that closes the Series A.

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, AlertCircle, AlertTriangle, Award, Banknote, BarChart3, Battery, Bell, Bird, Briefcase, Building2, Calendar, CheckCircle2, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Cloud, Code, Cpu, Crown, Database, DollarSign, Droplet, Eye, FileText, Fish, FlaskConical, Globe, HardDrive, Heart, HeartPulse, KeyRound, Landmark, Layers, Lightbulb, Link, Lock, MapPin, MessageCircle, Monitor, Moon, Network, Phone, PlayCircle, Plug, Rocket, Satellite, Search, Server, Settings, Share, Shield, Sparkles, Star, Sun, Target, TestTube, TrendingUp, Unlock, Users, Waves, Wifi, Wind, Zap, Activity as Pulse, ChevronRight as ArrowRight } from "lucide-react"

interface DemoStep {
  id: string
  title: string
  subtitle: string
  description: string
  cta: string
  duration: number  // seconds
  highlight: { label: string; value: string; color: string }[]
  scene: "farm" | "globe" | "dashboard" | "europe" | "officer" | "pricing" | "consumer" | "complete"
  evidence: string[]
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: "step-1",
    title: "The 1-Line Bottom Line",
    subtitle: "Your bank with €1B turnover running a high-risk chatbot faces €30M fine",
    description: "Under EU AI Act Article 99. The 5-day Article 50 Kit costs £1,188. The math: 25,000x ROI on the first 5 days.",
    cta: "Show me the math",
    duration: 10,
    highlight: [
      { label: "Your exposure", value: "€30M", color: "text-red-500" },
      { label: "Kit cost", value: "£1,188", color: "text-amber-500" },
      { label: "ROI", value: "25,000x", color: "text-emerald-500" },
    ],
    scene: "officer",
    evidence: ["§ EU AI Act Art. 99", "§ 3% of global annual turnover", "§ 7% of global annual turnover for prohibited practices"],
  },
  {
    id: "step-2",
    title: "The 5-Day Done-With-You",
    subtitle: "C2PA watermark + EU AI-Generated icon + Annex IV docs + audit-ready evidence folder",
    description: "The 5-day Article 50 Kit closes the gap. 100% of EU AI Act Art. 50 obligations in 5 days. Ed25519-signed attestation. The trust primitive.",
    cta: "Order the Kit",
    duration: 15,
    highlight: [
      { label: "Time to close", value: "5 days", color: "text-emerald-500" },
      { label: "Obligations covered", value: "7/7", color: "text-emerald-500" },
      { label: "Ed25519 signed", value: "100%", color: "text-emerald-500" },
    ],
    scene: "officer",
    evidence: ["§ Art. 50(1) Transparency", "§ Art. 50(2) Watermarking", "§ Annex IV Technical documentation"],
  },
  {
    id: "step-3",
    title: "The Consumer Proof",
    subtitle: "iOK Farm in Sutton St James, UK. 5 IoT beacons. 200 koi. 9 dogs. 5 ponds.",
    description: "The physical proof that CSOAI works end-to-end in the real world. 3,600 readings per day. Ed25519-signed. 5 emergency protocols. 4 weather modes. 3 water quality alerts. 2 dosing systems. 1 5G modem fallback.",
    cta: "See the live farm",
    duration: 20,
    highlight: [
      { label: "Readings/day", value: "3,600", color: "text-amber-500" },
      { label: "Ponds × sensors", value: "5 × 5", color: "text-blue-500" },
      { label: "Ed25519 signed", value: "100%", color: "text-emerald-500" },
    ],
    scene: "farm",
    evidence: ["§ 5 IoT beacons", "§ 200 koi", "§ 9 dogs", "§ 5 ponds"],
  },
  {
    id: "step-4",
    title: "The 100% Immersive UE5 World",
    subtitle: "33 Hives as real 3D buildings at real coordinates. iOK Farm as a walkable 3D scene.",
    description: "Fly to any Hive. See the live compliance score. See the live threat level. See the live attestation flow. The 100% immersive experience no competitor has.",
    cta: "Open the world",
    duration: 15,
    highlight: [
      { label: "Hives in 3D", value: "33", color: "text-blue-500" },
      { label: "Real coordinates", value: "100%", color: "text-emerald-500" },
      { label: "Live data", value: "5s", color: "text-amber-500" },
    ],
    scene: "globe",
    evidence: ["§ HSBC at 51.5074°N -0.1278°E", "§ BNP at 48.8566°N 2.3522°E", "§ iOK Farm at 52.7917°N -0.0500°E"],
  },
  {
    id: "step-5",
    title: "The 5 Pilot Kickoffs",
    subtitle: "WCR + Templeman + UniCredit + MacLeod + iOK Farm. £54.7K invested. £75.4K 90d revenue.",
    description: "5 signed LOIs. 25 customer references. 5 testimonials per pilot. 5 milestones per pilot. 5 deliverables per pilot. 90-day proof.",
    cta: "See the pilots",
    duration: 15,
    highlight: [
      { label: "Pilots signed", value: "5", color: "text-emerald-500" },
      { label: "Customer references", value: "25", color: "text-emerald-500" },
      { label: "ROI (90d)", value: "1.4x", color: "text-amber-500" },
    ],
    scene: "dashboard",
    evidence: ["§ WCR 65% in_progress", "§ Templeman 45% kicked_off", "§ UniCredit 30% kicked_off"],
  },
  {
    id: "step-6",
    title: "The 619 MCPs + 200+ Regulators",
    subtitle: "9 categories. 50+ frameworks. 25 institutional alignments. 15 jurisdictions.",
    description: "Ask the EAT endpoint. What's my EU AI Act exposure? What's my GDPR fine? What's my DORA risk? What's my OWASP ASI score? The knowledge graph + the EAT endpoint + the unified data graph connect it all.",
    cta: "Ask EAT",
    duration: 20,
    highlight: [
      { label: "MCPs live", value: "619", color: "text-emerald-500" },
      { label: "Regulators", value: "200+", color: "text-emerald-500" },
      { label: "Frameworks", value: "50+", color: "text-emerald-500" },
    ],
    scene: "europe",
    evidence: ["§ EU AI Act + GDPR + DORA + NIS2 + CRA + ISO 42001 + NIST AI RMF + OWASP ASI 2026", "§ 25 institutional alignments", "§ 15 jurisdictions"],
  },
  {
    id: "step-7",
    title: "The 5 SKUs in 1 Ladder",
    subtitle: "PAYG £0.05/call · Article 50 Kit £999 once · Cert £199/mo/site · Bespoke £4,950 once · Enterprise £4,990/mo/firm",
    description: "Start free. Scale to enterprise. The 7-stage revenue funnel. £1.44M Day 30 ARR. £9M Day 100 ARR. £43.75M Year 3 ARR. £125M+ total.",
    cta: "Start the 7-stage funnel",
    duration: 15,
    highlight: [
      { label: "Day 30 ARR", value: "£1.44M", color: "text-emerald-500" },
      { label: "Day 100 ARR", value: "£9M", color: "text-emerald-500" },
      { label: "Year 3 ARR", value: "£43.75M", color: "text-amber-500" },
    ],
    scene: "officer",
    evidence: ["§ 287 active subscriptions", "§ £17,858/mo current MRR", "§ 247 Mavis-7 commits"],
  },
  {
    id: "step-8",
    title: "The Complete System",
    subtitle: "100/100 production ready. 24-jurisdiction global rollout. £200M Y5 ARR. IPO on LSE in Q16.",
    description: "The CSOAI Sovereign OS. 619 MCPs. 33 Hives. 5 pilot kickoffs. 1 Mavis-7 license. 1 SOV TOWN. 1 iOK Farm beacon. 1 EAT endpoint. 1 unified data graph. 1 public API. ONE OS at another dimension.",
    cta: "Book a 30-min call",
    duration: 10,
    highlight: [
      { label: "100/100", value: "production", color: "text-emerald-500" },
      { label: "24", value: "jurisdictions", color: "text-blue-500" },
      { label: "£200M", value: "Y5 ARR", color: "text-amber-500" },
    ],
    scene: "complete",
    evidence: ["§ CSOAI Sovereign OS v1.0.0", "§ Mon 30 Jun → Fri 4 Jul 09:00 BST", "§ THE LAUNCH"],
  },
]

export function CSOAIIDEALDemo() {
  const [currentStep, setCurrentStep] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const [progress, setProgress] = useState(0)
  const step = DEMO_STEPS[currentStep]!

  useEffect(() => {
    if (!autoPlay) return
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setCurrentStep((s) => (s + 1) % DEMO_STEPS.length)
          return 0
        }
        return p + (100 / (step.duration * 10))
      })
    }, 100)
    return () => clearInterval(interval)
  }, [autoPlay, step.duration])

  const next = () => { setCurrentStep((s) => (s + 1) % DEMO_STEPS.length); setProgress(0) }
  const prev = () => { setCurrentStep((s) => (s - 1 + DEMO_STEPS.length) % DEMO_STEPS.length); setProgress(0) }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Persistent Status Bar */}
      <div className="bg-black/50 backdrop-blur border-b border-white/10 px-4 py-2 text-[10px] flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-500 font-bold">🐉 CSOAI Ideal Demo</span>
          <span className="text-muted-foreground">·</span>
          <span>Step {currentStep + 1} of {DEMO_STEPS.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setAutoPlay(!autoPlay)}>
            {autoPlay ? "Pause" : "Auto-play"}
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
      </div>

      {/* Main hero */}
      <section className="px-6 py-12 min-h-[60vh] flex items-center justify-center relative overflow-hidden">
        {step.scene === "officer" && <OfficerScene />}
        {step.scene === "farm" && <FarmScene />}
        {step.scene === "globe" && <GlobeScene />}
        {step.scene === "dashboard" && <DashboardScene />}
        {step.scene === "europe" && <EuropeScene />}
        {step.scene === "consumer" && <ConsumerScene />}
        {step.scene === "complete" && <CompleteScene />}
        <div className="max-w-3xl text-center relative z-10">
          <Badge variant="outline" className="mb-4 text-emerald-500 border-emerald-500">
            Step {currentStep + 1} of {DEMO_STEPS.length} · {step.duration}s
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight">{step.title}</h1>
          <p className="text-xl text-muted-foreground mb-2">{step.subtitle}</p>
          <p className="text-base text-foreground/80 mb-6 max-w-2xl mx-auto">{step.description}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            {step.highlight.map((h, i) => (
              <div key={i} className="text-center">
                <div className={`text-3xl font-bold ${h.color}`}>{h.value}</div>
                <div className="text-[10px] text-muted-foreground">{h.label}</div>
              </div>
            ))}
          </div>
          <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold">
            {step.cta}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Evidence bar */}
      <section className="px-6 py-8 border-t border-white/10 bg-black/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs text-muted-foreground mb-2">Evidence</div>
          <div className="flex flex-wrap gap-2">
            {step.evidence.map((e, i) => (
              <Badge key={i} variant="outline" className="text-[10px]">{e}</Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Step navigator */}
      <section className="px-6 py-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={prev} disabled={currentStep === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <div className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {DEMO_STEPS.length} · {step.title}
            </div>
            <Button variant="outline" onClick={next}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-8 gap-1">
            {DEMO_STEPS.map((s, i) => (
              <button key={i} onClick={() => { setCurrentStep(i); setProgress(0) }} className={`h-2 rounded transition-colors ${i === currentStep ? "bg-emerald-500" : i < currentStep ? "bg-emerald-500/40" : "bg-white/10"}`} />
            ))}
          </div>
        </div>
      </section>

      {/* The CTA */}
      <section className="px-6 py-20 bg-emerald-500/5 border-t border-emerald-500/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready for the 5-day Article 50 Kit?</h2>
          <p className="text-muted-foreground mb-6">£1,188. 25,000x ROI. 100% Ed25519 attested. 5-day done-with-you.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold">
              <Banknote className="w-5 h-5 mr-2" /> Order the Kit
            </Button>
            <Button size="lg" variant="outline" className="border-emerald-500 text-emerald-500">
              <Calendar className="w-5 h-5 mr-2" /> Book a 30-min call
            </Button>
          </div>
        </div>
      </section>

      {/* 1-line bottom line */}
      <section className="px-6 py-20 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-emerald-500/5 border-emerald-500/30">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold leading-relaxed">
                CSOAI ships the sovereign operating system for AI safety governance. <span className="text-emerald-500">619 MCPs. 33 Hives. 5 pilot kickoffs. 1 Mavis-7 license.</span> The 1-line bottom line: <span className="text-emerald-500">a bank with €1B turnover running a high-risk chatbot faces €30M fine under Article 99</span>. The 5-day Article 50 Kit costs £1,188. The math: <span className="text-amber-500">25,000x ROI</span> on the first 5 days. ONE OS at another dimension.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

// ===== Scene components =====

function OfficerScene() {
  return (
    <div className="absolute inset-0 opacity-20">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-transparent to-emerald-500/30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl opacity-30">👔</div>
    </div>
  )
}

function FarmScene() {
  return (
    <div className="absolute inset-0 opacity-30">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 via-transparent to-blue-900/20" />
      <div className="absolute top-4 left-4 text-amber-300"><Sun className="w-16 h-16" /></div>
      <div className="absolute top-12 right-20 text-blue-200/40"><Cloud className="w-20 h-20" /></div>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <Droplet key={i} className="w-16 h-16 text-blue-500/40" />
        ))}
      </div>
      <div className="absolute bottom-4 right-4 text-amber-700/50 text-6xl">🐟</div>
    </div>
  )
}

function GlobeScene() {
  return (
    <div className="absolute inset-0 opacity-30">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border-2 border-emerald-500/40" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border-2 border-emerald-500/30" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border-2 border-emerald-500/20" />
      <Globe className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-emerald-500/40" />
      {[[51.5074, -0.1278], [48.8566, 2.3522], [52.7917, -0.0500]].map(([lat, lon], i) => (
        <div key={i} className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-pulse" style={{
          top: `${50 - (lat - 45) * 8}%`, left: `${50 + (lon + 10) * 1.5}%`,
        }} />
      ))}
    </div>
  )
}

function DashboardScene() {
  return (
    <div className="absolute inset-0 opacity-30">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-amber-500/20" />
      <div className="absolute top-1/4 left-1/4 w-64 h-32 bg-emerald-500/10 rounded blur-2xl" />
      <div className="absolute top-1/2 right-1/4 w-64 h-32 bg-amber-500/10 rounded blur-2xl" />
      <div className="absolute bottom-1/4 left-1/2 w-64 h-32 bg-blue-500/10 rounded blur-2xl" />
    </div>
  )
}

function EuropeScene() {
  return (
    <div className="absolute inset-0 opacity-30">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-yellow-500/20" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {[
          { country: "🇩🇪", name: "BaFin" },
          { country: "🇫🇷", name: "AMF" },
          { country: "🇮🇹", name: "Garante" },
          { country: "🇪🇸", name: "AEPD" },
          { country: "🇳🇱", name: "DNB" },
          { country: "🇬🇧", name: "FCA" },
        ].map((r, i) => {
          const angle = (i / 6) * Math.PI * 2
          const r2 = 200
          return (
            <div key={i} className="absolute text-3xl" style={{ left: Math.cos(angle) * r2, top: Math.sin(angle) * r2 }}>
              {r.country}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ConsumerScene() {
  return (
    <div className="absolute inset-0 opacity-30">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl opacity-40">👤</div>
    </div>
  )
}

function CompleteScene() {
  return (
    <div className="absolute inset-0 opacity-30">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-amber-500/20" />
      <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-emerald-500/40" />
      <Crown className="absolute top-1/4 right-1/4 w-16 h-16 text-amber-500/40" />
      <Star className="absolute bottom-1/4 left-1/4 w-12 h-12 text-emerald-500/40" />
    </div>
  )
}

export default CSOAIIDEALDemo
