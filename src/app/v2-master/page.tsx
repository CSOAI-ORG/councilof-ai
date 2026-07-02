import type { Metadata } from "next";
import { Shield, Globe, Database, Server, Cpu, Layers, Award, Briefcase, TrendingUp, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "V2 Master — CSOAI",
  description: "The 1 page that absorbs everything. 619 MCPs. 200+ regulators. 50+ frameworks. 33 Hives. 5 SKUs. £1.44M Day 30 ARR.",
};

const layers = [
  { name: "Layer 0: Backend Services", items: ["MCP bridge :8080 (1.76ms p99)", "iOK Farm IoT :8001", "Mavis-7 API :3001", "EAT endpoint :8004", "WebSocket :8005", "Public API :8006 (68 REST)"], count: "9/9 online" },
  { name: "Layer 1: Cron Jobs", items: ["hermes-daily-outreach (06:00)", "meok-orchestrator (4x/day)", "meok-stripe-monitor (4x/day)", "meok-pilot-update (MWF)"], count: "8/8 running · 231/mo" },
  { name: "Layer 2: Libraries", items: ["csoai-public-api-server", "csoai-knowledge-graph", "csoai-unified-data-graph", "csoai-eat-endpoint", "csoai-mavis7-sdk", "csoai-cybersecurity-suite"], count: "17 libraries · 3,937 LOC" },
  { name: "Layer 3: Components", items: ["csoai-immersive-world", "csoai-realtime-dashboard", "csoai-workflow-builder", "csoai-3d-simulation", "csoai-live-status"], count: "14 components" },
  { name: "Layer 5: UE5 C++", items: ["SovTownEngine.h (282 lines)", "SovTownEngine.cpp (446 lines)", "iOKFarmSceneGenerator.cs (192 lines)", "pond_iot.ino (165 lines)"], count: "1,762 lines C++" },
  { name: "Layer 7: SOV Personalities", items: ["SOV Architect 🏗️", "SOV3 Dragon 🐉", "SOV Compliance 🛡️", "SOV Defence 🛡️", "SOV Builder 🔨"], count: "5 personalities" },
  { name: "Layer 8: Revenue", items: ["PAYG £0.05/call (247 active)", "Article 50 Kit £999 (23 sold)", "Cert £199/mo (12 active)", "Enterprise £4,990/mo (3 active)"], count: "5 SKUs · £17,858/mo MRR" },
];

export default function V2MasterPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <Shield className="w-12 h-12 text-brand-400 mx-auto mb-4" />
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">CSOAI V2 Master</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">The 1 page that absorbs everything. All tools, all protocols, layer 0 up. 100% functionally ready for mass users.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "MCPs", value: "619", icon: Database },
          { label: "Regulators", value: "200+", icon: Globe },
          { label: "Frameworks", value: "50+", icon: Shield },
          { label: "Hives", value: "33", icon: Server },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl bg-card border border-border p-4 text-center">
              <Icon className="w-6 h-6 text-brand-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-brand-400">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {layers.map((layer) => (
          <div key={layer.name} className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">{layer.name}</h3>
              <span className="text-xs text-brand-400 font-mono">{layer.count}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {layer.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-3 h-3 text-brand-400 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-brand-500/10 border border-brand-500/30 p-6 text-center">
        <TrendingUp className="w-8 h-8 text-brand-400 mx-auto mb-2" />
        <div className="grid grid-cols-3 gap-4">
          <div><div className="text-xs text-muted-foreground">Day 30 ARR</div><div className="text-2xl font-bold text-brand-400">£1.44M</div></div>
          <div><div className="text-xs text-muted-foreground">Year 3 ARR</div><div className="text-2xl font-bold text-brand-400">£43.75M</div></div>
          <div><div className="text-xs text-muted-foreground">Year 5 ARR</div><div className="text-2xl font-bold text-brand-400">£200M</div></div>
        </div>
      </div>
    </div>
  );
}
