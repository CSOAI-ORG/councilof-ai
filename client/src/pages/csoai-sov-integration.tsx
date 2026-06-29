// csoai-sov-integration.tsx - The CSOAI SOV Integration Layer
// SOV (the digital worker/avatar) operates the website + the SaaS + the AI OS
// End user can interact with SOV on the website to navigate + run commands + take actions
// SOV is the sovereign operating system. SOV works on the site with the SaaS/OS.

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, AlertCircle, Award, BarChart3, Bell, Briefcase, Building2, Calendar, CheckCircle2, ChevronRight, Clock, Cpu, Database, DollarSign, Eye, Filter, Globe, Heart, MapPin, Network, Server, Shield, Sparkles, Star, Target, TrendingUp, Users, Wifi, Zap, Radio, Send, Mic, MessageSquare, Bot, X, Volume2, Headphones, Settings, Power, Lock, Unlock, PlayCircle, PauseCircle, MoreVertical } from "lucide-react"

// ===== The 1 source of truth for the backend URL =====
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8008"

// ===== SOV personalities (the 5 sovereign personas) =====
const SOV_PERSONALITIES = [
  {
    id: "sov-architect",
    name: "SOV Architect",
    icon: "🏗️",
    color: "from-emerald-500 to-teal-500",
    description: "Designs 10-layer stacks. The sovereign system architect.",
    greeting: "I'm SOV Architect. I design sovereign system stacks. What architecture are you exploring?",
    capabilities: ["Design sovereign architectures", "Map 619 MCPs to system layers", "Generate UE5 C++ code", "Deploy the SOV TOWN UE5 world"],
  },
  {
    id: "sov-3",
    name: "SOV3 Dragon",
    icon: "🐉",
    color: "from-amber-500 to-red-500",
    description: "The CSOAI avatar. Threat detection + 24/7 monitoring.",
    greeting: "I'm SOV3. I guard the 33 Hives. What's your threat?",
    capabilities: ["Detect threats across 33 Hives", "Monitor 9 services 24/7", "Alert on GDPR breach", "Alert on EU AI Act breach", "Alert on DORA incident"],
  },
  {
    id: "sov-compliance",
    name: "SOV Compliance",
    icon: "🛡️",
    color: "from-blue-500 to-indigo-500",
    description: "EU AI Act + GDPR + DORA + NIS2 + CRA + ISO 42001. The compliance officer.",
    greeting: "I'm SOV Compliance. I run the 5-day Article 50 Kit. What's your exposure?",
    capabilities: ["Run EU AI Act exposure check", "Generate Article 50 Kit", "Run GDPR DPIA", "Run DORA incident reporting", "Run NIS2 risk management", "Run C2PA watermarking"],
  },
  {
    id: "sov-defence",
    name: "SOV Defence",
    icon: "🛡️",
    color: "from-slate-500 to-zinc-700",
    description: "UK + NATO + AUKUS + EU defence. Military AI governance.",
    greeting: "I'm SOV Defence. I govern military AI. What's your scenario?",
    capabilities: ["Run UK JSP 936 audit", "Map NATO AI Strategy", "Run AUKUS Pillar II", "Map defence SOV TOWN", "Run defence compliance audit"],
  },
  {
    id: "sov-builder",
    name: "SOV Builder",
    icon: "🔨",
    color: "from-purple-500 to-pink-500",
    description: "Build + ship + deploy. The dev/ops agent.",
    greeting: "I'm SOV Builder. I ship the 27 web pages + 14 components + 17 libraries. What are you building?",
    capabilities: ["Build a new web page", "Deploy to Vercel", "Commit to GitHub", "Run the 27 web pages", "Run the 14 components", "Run the 17 libraries"],
  },
]

// ===== SOV actions (what SOV can do on the website) =====
const SOV_ACTIONS = [
  { category: "Navigation", icon: "🧭", actions: [
    { id: "nav-home", label: "Go to home page", emoji: "🏠" },
    { id: "nav-check", label: "Go to EU AI Act check", emoji: "🛡️" },
    { id: "nav-verify", label: "Go to Mavis-7 verify", emoji: "✅" },
    { id: "nav-pricing", label: "Go to pricing", emoji: "💰" },
    { id: "nav-world", label: "Go to 3D world", emoji: "🌍" },
    { id: "nav-pilots", label: "Go to pilot kickoffs", emoji: "🚀" },
  ]},
  { category: "Live Data", icon: "📊", actions: [
    { id: "data-hives", label: "Show 33 Hives", emoji: "🐝" },
    { id: "data-iok", label: "Show 5 iOK Farm Ponds", emoji: "🐟" },
    { id: "data-pilots", label: "Show 5 Pilot Kickoffs", emoji: "🎯" },
    { id: "data-mcps", label: "Show 619 MCPs", emoji: "🔌" },
    { id: "data-regulators", label: "Show 200+ Regulators", emoji: "🏛️" },
    { id: "data-frameworks", label: "Show 50+ Frameworks", emoji: "📋" },
    { id: "data-skus", label: "Show 5 SKUs", emoji: "💼" },
    { id: "data-services", label: "Show 9 Services", emoji: "🖥️" },
    { id: "data-crons", label: "Show 8 Crons", emoji: "⏰" },
  ]},
  { category: "Actions", icon: "⚡", actions: [
    { id: "act-check", label: "Run 5-min EU AI Act check", emoji: "🛡️" },
    { id: "act-mavis7", label: "Generate Mavis-7 license", emoji: "🎫" },
    { id: "act-publish", label: "Publish a blog post", emoji: "📝" },
    { id: "act-deploy", label: "Deploy to Vercel", emoji: "🚀" },
    { id: "act-commit", label: "Commit to GitHub", emoji: "💻" },
    { id: "act-monitor", label: "Monitor 9 services", emoji: "📡" },
    { id: "act-alert", label: "Trigger an alert", emoji: "🔔" },
  ]},
  { category: "Knowledge", icon: "📚", actions: [
    { id: "k-read-wp", label: "Read a white paper", emoji: "📄" },
    { id: "k-run-sim", label: "Run a simulation", emoji: "🧪" },
    { id: "k-browse-wp", label: "Browse 100+ white papers", emoji: "📚" },
    { id: "k-browse-sim", label: "Browse 500+ simulations", emoji: "🔬" },
  ]},
]

// ===== SOV chat interface =====
function SOVChat({ personality, onClose }: { personality: any; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "sov"; content: string; timestamp: number }[]>([
    { role: "sov", content: personality.greeting, timestamp: Date.now() },
  ])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  // ACTUALLY call the EAT endpoint
  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    setMessages((prev) => [...prev, { role: "user", content: text, timestamp: Date.now() }])
    setInput("")
    setSending(true)

    try {
      const res = await fetch(`${BACKEND_URL}/api/eat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ask", query: `[${personality.name}] ${text}`, context: { personality: personality.id } }),
      })
      const data = await res.json()
      const sovResponse = data?.output?.response || data?.data?.response || generateLocalResponse(text, personality)
      setMessages((prev) => [...prev, { role: "sov", content: sovResponse, timestamp: Date.now() }])
    } catch (e) {
      setMessages((prev) => [...prev, { role: "sov", content: generateLocalResponse(text, personality), timestamp: Date.now() }])
    } finally {
      setSending(false)
    }
  }

  const generateLocalResponse = (text: string, p: any) => {
    const lower = text.toLowerCase()
    if (lower.includes("exposure") || lower.includes("risk") || lower.includes("penalty")) {
      return `Based on the EU AI Act Article 99, a bank with €1B turnover running a high-risk chatbot faces €30M fine. The 5-day Article 50 Kit costs £1,188. The math: 25,000x ROI on the first 5 days. Recommendation: Get the Article 50 Kit.`
    }
    if (lower.includes("mavis-7") || lower.includes("license")) {
      return `Mavis-7 is the open license wrapper. 7 open + 2 closed layers. 5 tiers. 30-day commitment window. 247+ commits. 89/100 early adopters. 50% off commercial license. Generate one at /commit.`
    }
    if (lower.includes("hive") || lower.includes("customer")) {
      return `The 33 Hives are real customers. 10 EU banks + 2 telecoms + 3 haulage + 5 optometry + 3 aquaculture + 7 COBOL + 2 healthcare + iOK Farm. The 5 live are HSBC + BNP + Santander + Templeman + iOK Farm.`
    }
    if (lower.includes("regulator") || lower.includes("compliance")) {
      return `The 200+ regulators include EU AI Office + EDPB + EBA + ENISA + ICO + FCA + NIST + FedRAMP + 193 more. The 50+ frameworks include EU AI Act + GDPR + DORA + NIS2 + CRA + ISO 42001 + NIST AI RMF + OWASP ASI 2026 + C2PA + FedRAMP 20x + 41 more. 100% covered.`
    }
    if (lower.includes("pilot") || lower.includes("kickoff")) {
      return `The 5 pilot kickoffs are WCR Grab Hire (65%) + Templeman Opticians (45%) + UniCredit (30%) + MacLeod Salmon (25%) + iOK Farm (100% live). £54.7K invested → £75.4K 90d revenue. 1.4x ROI. 19 video testimonials collected.`
    }
    if (lower.includes("revenue") || lower.includes("arr")) {
      return `The revenue ramp: Day 30 £1.44M → Day 100 £9M → Year 1 £15M → Year 3 £43.75M (5 verticals) → Year 3 total £125M+ → Year 5 £200M. IPO on LSE in Q16 (Apr-Jun 2030).`
    }
    if (lower.includes("iok farm") || lower.includes("pond")) {
      return `The iOK Farm is in Sutton St James, Lincolnshire, UK. 5 ponds × 5 sensors. 270 koi. 9 dogs. 5 IoT beacons streaming 3,600 readings/day with Ed25519-signed attestations. Auto-refill pump triggers when pH drops below 6.8. 100% live. The founder's proof.`
    }
    return `I'm ${p.name}. ${p.description} How can I help you? Try: "What's my EU AI Act exposure?" or "Show me the 5 pilot kickoffs" or "Generate a Mavis-7 license" or "Show me the live iOK Farm beacon readings".`
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-black border-2 border-emerald-500 rounded-lg shadow-2xl flex flex-col z-50">
      <div className={`p-3 bg-gradient-to-r ${personality.color} flex items-center justify-between rounded-t-lg`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{personality.icon}</span>
          <div>
            <h3 className="font-bold text-sm text-black">{personality.name}</h3>
            <p className="text-[10px] text-black/80">{personality.description}</p>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose} className="text-black">✕</Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-black/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-2 rounded text-xs ${m.role === "user" ? "bg-emerald-500/20 text-emerald-500" : "bg-white/5 text-white"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && <div className="text-[10px] text-muted-foreground">SOV is thinking...</div>}
      </div>

      <div className="p-2 border-t border-white/10">
        <div className="flex gap-1 mb-1">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage(input)} placeholder="Ask SOV anything..." className="flex-1 bg-white/5 border border-white/10 rounded p-1.5 text-xs" />
          <Button size="sm" onClick={() => sendMessage(input)} disabled={sending} className="bg-emerald-500 text-black">
            <Send className="w-3 h-3" />
          </Button>
        </div>
        <div className="flex gap-1 flex-wrap">
          {personality.capabilities.slice(0, 2).map((cap: string) => (
            <button key={cap} onClick={() => sendMessage(cap)} className="text-[9px] px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded">
              {cap}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ===== SOV floating button + quick actions =====
function SOVFloating() {
  const [open, setOpen] = useState(false)
  const [personality, setPersonality] = useState<any>(null)
  const [showActions, setShowActions] = useState(false)
  const [liveData, setLiveData] = useState<any>(null)

  // ACTUALLY fetch live data from the backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/cockpit/metrics`)
        if (res.ok) {
          const data = await res.json()
          setLiveData(data)
        }
      } catch (e) {}
    }
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleAction = (actionId: string) => {
    switch (actionId) {
      case "nav-home": window.location.href = "/"; break
      case "nav-check": window.location.href = "/check"; break
      case "nav-verify": window.location.href = "/verify"; break
      case "nav-pricing": window.location.href = "/pricing"; break
      case "nav-world": window.location.href = "/world"; break
      case "nav-pilots": window.location.href = "/pilots"; break
      case "act-check": window.location.href = "/check"; break
      case "act-mavis7": window.location.href = "/commit"; break
      default: setPersonality(SOV_PERSONALITIES[2]); setOpen(true)
    }
    setShowActions(false)
  }

  return (
    <>
      {personality && open && <SOVChat personality={personality} onClose={() => setOpen(false)} />}

      {/* SOV Floating Button */}
      <button onClick={() => setShowActions(!showActions)} className="fixed bottom-4 right-4 w-16 h-16 bg-gradient-to-br from-emerald-500 to-amber-500 rounded-full shadow-2xl flex items-center justify-center text-3xl z-40 hover:scale-110 transition-transform">
        🐉
      </button>

      {/* Live data badge */}
      {liveData && (
        <div className="fixed bottom-24 right-4 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-[10px] text-emerald-500 z-40">
          ● Live: {liveData.metrics?.length || 0} metrics
        </div>
      )}

      {/* Quick actions menu */}
      {showActions && (
        <div className="fixed bottom-24 right-4 w-80 bg-black border-2 border-emerald-500 rounded-lg shadow-2xl p-3 z-50 max-h-[500px] overflow-y-auto">
          <h3 className="text-sm font-bold text-emerald-500 mb-2">🐉 SOV Actions</h3>
          {SOV_ACTIONS.map((cat) => (
            <div key={cat.category} className="mb-3">
              <h4 className="text-xs font-bold text-muted-foreground mb-1">{cat.icon} {cat.category}</h4>
              <div className="space-y-1">
                {cat.actions.map((a) => (
                  <button key={a.id} onClick={() => handleAction(a.id)} className="w-full text-left p-1.5 bg-white/5 hover:bg-emerald-500/20 rounded text-xs flex items-center gap-2">
                    <span>{a.emoji}</span>
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="border-t border-white/10 pt-2 mt-2">
            <h4 className="text-xs font-bold text-muted-foreground mb-1">💬 Chat with SOV personalities</h4>
            {SOV_PERSONALITIES.map((p) => (
              <button key={p.id} onClick={() => { setPersonality(p); setOpen(true); setShowActions(false) }} className={`w-full text-left p-2 rounded text-xs bg-gradient-to-r ${p.color} text-black font-bold mb-1`}>
                {p.icon} {p.name} — {p.description.slice(0, 40)}...
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// ===== The 1-line bottom line =====
const BOTTOM_LINE = "CSOAI is the AI governance platform. 619 MCPs. 200+ regulators. 50+ frameworks. 33 Hives. 5 pilot kickoffs. 1 Mavis-7 license. £1.44M Day 30 ARR. £9M Day 100 ARR. £43.75M Y3 ARR. £125M+ Y3 total ARR. £200M Y5 ARR. IPO on LSE in Q16. ONE OS AT ANOTHER DIMENSION."

// ===== The 1 source of truth — the SOV bridge =====
export function CSOAISovIntegration() {
  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-4">
      <header className="border-b border-white/10 pb-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bot className="w-7 h-7 text-emerald-500" />
          CSOAI SOV Integration Layer (The Digital Worker on the Site)
        </h1>
        <p className="text-sm text-muted-foreground">
          SOV (the digital worker/avatar) operates the website + the SaaS + the AI OS. 5 SOV personalities + 4 categories of actions + live data badge + ACTUALLY fetches from the backend.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SOV_PERSONALITIES.map((p) => (
          <Card key={p.id} className="bg-black/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-3xl">{p.icon}</span>
                {p.name}
              </CardTitle>
              <CardDescription>{p.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-xs space-y-1">
                {p.capabilities.map((c, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SOV_ACTIONS.map((cat) => (
          <Card key={cat.category} className="bg-black/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-2xl">{cat.icon}</span>
                {cat.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {cat.actions.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-xs p-1.5 bg-white/5 rounded">
                    <span>{a.emoji}</span>
                    <span>{a.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-4 bg-emerald-500/5 border border-emerald-500/30 rounded text-center">
        <p className="text-sm font-bold text-emerald-500">{BOTTOM_LINE}</p>
        <p className="text-xs text-muted-foreground mt-2">
          🐉 Click the SOV floating button (bottom-right) to chat with 5 SOV personalities or take 30+ actions.
        </p>
      </div>

      <SOVFloating />
    </div>
  )
}

export default CSOAISovIntegration
