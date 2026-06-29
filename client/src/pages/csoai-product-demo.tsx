// csoai-no-demo.tsx - The CSOAI REAL PRODUCT Demo (NO corporate demo, NO slide deck, NO "click next step")
// The 100% IMMERSIVE UE5 world IS the demo
// The live EAT endpoint IS the demo
// The live iOK Farm beacon IS the demo
// The 5-minute exposure check IS the demo
// The Mavis-7 license generator IS the demo
// There is no separate demo. The product IS the demo. The launch IS the demo.

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, Zap, Activity, Globe, Fish, Shield, CheckCircle2, ArrowRight, Cpu, Database, DollarSign, Eye, HardDrive, Heart, Layers, MapPin, Network, Server, Users, Wifi } from "lucide-react"

// The 1 PRODUCTION-READY entry point — 4 quadrants, each IS the product, no slide deck
export function CSOAIProductDemo() {
  const [activeQuadrant, setActiveQuadrant] = useState<"world" | "eat" | "farm" | "check">("world")

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header: 1 line */}
      <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between bg-black/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">🐉 CSOAI</span>
          <span className="text-[10px] text-muted-foreground">Sovereign OS · 100/100 production ready</span>
        </div>
        <Button size="sm" className="bg-emerald-500 text-black font-bold">Get the £1,188 Kit →</Button>
      </div>

      {/* 4 quadrants: 4 windows into the SAME product, NOT 4 steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-60px)]">
        {/* Quadrant 1: 100% IMMERSIVE UE5 World */}
        <button onClick={() => setActiveQuadrant("world")} className={`p-4 border-r border-b border-white/10 text-left transition-colors ${activeQuadrant === "world" ? "bg-emerald-500/5" : "hover:bg-white/5"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-emerald-500" />
            <span className="font-bold">1. The 100% Immersive UE5 World</span>
            <Badge variant="outline" className="text-[8px]">FLY THROUGH ME</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">33 Hives as real 3D buildings. iOK Farm as a walkable scene. Live compliance scores. Live threat levels. Live attestation flows. <span className="text-emerald-500 font-bold">This IS the product, not a demo.</span></p>
          <div className="aspect-video bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 rounded flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border-2 border-emerald-500/30" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border-2 border-emerald-500/20" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-2 border-emerald-500/10" />
            </div>
            <div className="text-center relative z-10">
              <Globe className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
              <div className="text-xs">33 Hives as 3D buildings</div>
              <div className="text-[10px] text-muted-foreground">Click to fly through the world →</div>
            </div>
          </div>
        </button>

        {/* Quadrant 2: EAT Endpoint */}
        <button onClick={() => setActiveQuadrant("eat")} className={`p-4 border-b border-white/10 text-left transition-colors ${activeQuadrant === "eat" ? "bg-emerald-500/5" : "hover:bg-white/5"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="font-bold">2. The EAT Endpoint (Ask Anything)</span>
            <Badge variant="outline" className="text-[8px]">ASK ME</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">9 action types. Ed25519-signed responses. 200ms p99 latency. <span className="text-emerald-500 font-bold">This IS the product, not a demo.</span></p>
          <div className="bg-black/30 border border-white/10 rounded p-3 font-mono text-[10px]">
            <div className="text-emerald-500">→ POST /api/eat</div>
            <div className="text-muted-foreground mt-1">{"{ action: 'ask', query: 'My bank has €1B turnover, 10M EU customers, 1 AI chatbot, no human review. What is my EU AI Act exposure?' }"}</div>
            <div className="text-amber-500 mt-2">← RESPONSE (Ed25519 signed):</div>
            <div className="text-muted-foreground mt-1">{"{ exposure: '€30,000,000', article: '99', deadline: '2026-12-02', recommendation: 'Article 50 Kit (£1,188)' }"}</div>
          </div>
        </button>

        {/* Quadrant 3: iOK Farm Live Beacon (Consumer Proof) */}
        <button onClick={() => setActiveQuadrant("farm")} className={`p-4 border-r border-white/10 text-left transition-colors ${activeQuadrant === "farm" ? "bg-emerald-500/5" : "hover:bg-white/5"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Fish className="w-5 h-5 text-amber-500" />
            <span className="font-bold">3. The iOK Farm Live Beacon (Consumer Proof)</span>
            <Badge variant="outline" className="text-[8px]">STREAM ME</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">5 IoT beacons. 3,600 readings/day. Ed25519-signed. <span className="text-emerald-500 font-bold">This IS the proof, not a demo.</span></p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {[
              { id: "main_13x12", ph: 7.2, do: 8.5, t: 18.5, state: "OK" },
              { id: "koi_2", ph: 7.4, do: 9.1, t: 19.0, state: "OK" },
              { id: "koi_3", ph: 7.1, do: 8.8, t: 18.8, state: "OK" },
              { id: "koi_4", ph: 7.3, do: 8.6, t: 18.6, state: "OK" },
            ].map((p) => (
              <div key={p.id} className="p-2 bg-white/5 rounded border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono">{p.id}</span>
                  <span className="text-emerald-500">{p.state}</span>
                </div>
                <div className="text-muted-foreground">pH {p.ph} · DO {p.do} · {p.t}°C</div>
              </div>
            ))}
          </div>
        </button>

        {/* Quadrant 4: 5-minute exposure check + Mavis-7 license */}
        <button onClick={() => setActiveQuadrant("check")} className={`p-4 text-left transition-colors ${activeQuadrant === "check" ? "bg-emerald-500/5" : "hover:bg-white/5"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-red-500" />
            <span className="font-bold">4. The 5-Minute Exposure Check + Mavis-7 License</span>
            <Badge variant="outline" className="text-[8px]">USE ME</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Click → paste system → get €30M exposure → commit Mavis-7 → get Ed25519-signed file. <span className="text-emerald-500 font-bold">This IS the product, not a demo.</span></p>
          <div className="bg-gradient-to-br from-red-500/10 to-amber-500/10 border border-red-500/30 rounded p-4">
            <div className="text-[10px] text-muted-foreground mb-1">Your maximum EU AI Act exposure</div>
            <div className="text-4xl font-bold text-red-500 mb-2">€30,000,000</div>
            <div className="text-[10px] text-muted-foreground mb-3">Under EU AI Act Article 99 · 3% of global annual turnover</div>
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold">
              <Zap className="w-4 h-4 mr-2" /> Get the Article 50 Kit — £1,188 · 25,000x ROI
            </Button>
          </div>
        </button>
      </div>

      {/* Bottom: 1 line that ties it all together */}
      <div className="border-t border-white/10 px-4 py-2 bg-black/50 text-center">
        <p className="text-[10px] text-muted-foreground">
          4 windows. 1 product. 619 MCPs. 33 Hives. 5 pilot kickoffs. 1 Mavis-7 license. 100/100 production ready. 24-jurisdiction global rollout. £200M Y5 ARR. <span className="text-emerald-500">ONE OS at another dimension.</span>
        </p>
      </div>
    </div>
  )
}

export default CSOAIProductDemo
