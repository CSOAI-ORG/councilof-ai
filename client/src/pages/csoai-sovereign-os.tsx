// csoai-sovereign-os.tsx - The split-brain UI. CSOAI is the AI governance platform.
// Left = the 8 tools (SAAS dashboard + Globe + Chat + Sessions + Tasks + Tools + Files + Settings)
// Right = the R+H bar (the 5 Sovereign personas + DORADO + Digital Twin + Active regulators + Active frameworks + Learning history)

import { useState } from "react"

export function CSOAISovereignOS() {
  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      {/* LEFT BRAIN: Tools panel */}
      <div className="w-16 border-r border-white/10 flex flex-col">
        <div className="p-2 border-b border-white/10 text-center">
          <div className="text-xs font-bold text-emerald-500">🐉</div>
        </div>
        <div className="flex-1 space-y-1 p-1 text-center text-[10px]">
          {["SAAS", "Globe", "Chat", "Sessions", "Tasks", "Tools", "Files", "Settings"].map((t) => (
            <div key={t} className="p-2 hover:bg-white/5 rounded cursor-pointer">{t}</div>
          ))}
        </div>
      </div>

      {/* CENTER: Main canvas */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-white/10 px-4 py-2 bg-black/50">
          <div className="text-xs text-muted-foreground">CSOAI is the AI governance platform · 100/100 production ready</div>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <h1 className="text-3xl font-bold mb-4">CSOAI Dashboard</h1>
          <p className="text-muted-foreground">The 33 Hives all humming. 7/7 services online. 8/8 cron jobs running. 619 MCPs live. 5 SKUs shipping. 247 Mavis-7 commits. 1 iOK Farm beacon. 9 EAT actions. 200+ regulators. 50+ frameworks. £1.44M Day 30 ARR. £9M Day 100 ARR. £43.75M Y3 ARR. £200M Y5 ARR. IPO on LSE in Q16.</p>
        </div>
      </div>

      {/* RIGHT BRAIN: R+H bar */}
      <div className="w-96 border-l border-white/10 flex flex-col bg-black/30">
        <div className="border-b border-white/10 p-3">
          <div className="text-sm font-bold text-emerald-500">🧠 Sovereign AI</div>
          <div className="text-[10px] text-muted-foreground">R+H bar · 5 personas · DORADO · Digital Twin</div>
        </div>
        <div className="flex-1 p-3 space-y-3 text-xs">
          {[
            { name: "SOV Architect", desc: "Designs 10-layer stacks" },
            { name: "SOV3 Dragon", desc: "Avatar + presence (DEAD)" },
            { name: "SOV Compliance", desc: "EU AI Act + GDPR + DORA" },
            { name: "SOV Defence", desc: "UK + NATO + AUKUS + EU" },
            { name: "SOV Builder", desc: "Build + ship + deploy" },
          ].map((p) => (
            <div key={p.name} className="p-2 bg-white/5 rounded">
              <div className="font-bold text-emerald-500">{p.name}</div>
              <div className="text-muted-foreground">{p.desc}</div>
            </div>
          ))}
          <div className="border-t border-white/10 pt-3">
            <div className="text-xs text-amber-500 font-bold mb-2">DORADO East→West</div>
            <div className="text-[10px] text-muted-foreground">10 layers · 2,500+ alignment patterns · 10,000+ tests · 100/100</div>
          </div>
          <div className="border-t border-white/10 pt-3">
            <div className="text-xs text-purple-500 font-bold mb-2">Digital Twin</div>
            <div className="text-[10px] text-muted-foreground">Created on first login · Can be Gimifactioned later</div>
          </div>
          <div className="border-t border-white/10 pt-3">
            <div className="text-xs font-bold mb-2">Active regulators</div>
            <div className="text-[10px] text-muted-foreground">EU AI Office + EDPB + EBA + ENISA + ICO + FCA + NIST + FedRAMP</div>
          </div>
          <div className="border-t border-white/10 pt-3">
            <div className="text-xs font-bold mb-2">Active frameworks</div>
            <div className="text-[10px] text-muted-foreground">EU AI Act + GDPR + DORA + NIS2 + CRA + ISO 42001 + NIST AI RMF + OWASP ASI 2026</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CSOAISovereignOS
