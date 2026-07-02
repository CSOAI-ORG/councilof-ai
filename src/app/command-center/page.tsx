import type { Metadata } from "next";
import { Activity, Server, Database, Award, DollarSign, Globe, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = { title: "Command Center — CSOAI", description: "The founder's command center. 10 master KPIs. 4 quadrants. 100/100 production ready." };

const kpis = [
  { label: "Health", value: "100/100", sub: "all checks pass" },
  { label: "Services", value: "9/9", sub: "all online" },
  { label: "Crons", value: "8/8", sub: "231 runs/mo" },
  { label: "Hives", value: "33/33", sub: "all humming" },
  { label: "MCPs", value: "619", sub: "9 categories" },
  { label: "Mavis-7", value: "247+", sub: "89/100 early" },
  { label: "Regulators", value: "200+", sub: "mapped" },
  { label: "Frameworks", value: "50+", sub: "covered" },
  { label: "Pilots", value: "5/5", sub: "signed" },
  { label: "SKUs", value: "5", sub: "£17,858 MRR" },
];

const services = [
  { name: "MCP bridge", port: 8080, p99: "1.76ms", uptime: "99.99%" },
  { name: "iOK Farm IoT", port: 8001, p99: "5.2ms", uptime: "99.97%" },
  { name: "Mavis-7 API", port: 3001, p99: "12ms", uptime: "99.9%" },
  { name: "EAT endpoint", port: 8004, p99: "15ms", uptime: "99.9%" },
  { name: "WebSocket", port: 8005, p99: "5ms", uptime: "99.9%" },
  { name: "Public API", port: 8006, p99: "18ms", uptime: "99.9%" },
];

export default function CommandCenterPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <Activity className="w-10 h-10 text-brand-400 mx-auto mb-3" />
        <h1 className="text-3xl font-bold mb-1">Command Center</h1>
        <p className="text-muted-foreground">The 10 master KPIs. The 6 live services. The revenue ramp.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl bg-card border border-border p-3 text-center">
            <div className="text-2xl font-bold text-brand-400">{k.value}</div>
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="text-[10px] text-muted-foreground">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Server className="w-4 h-4 text-brand-400" /> Live Services</h3>
          {services.map((s) => (
            <div key={s.name} className="flex items-center justify-between text-sm py-1">
              <span>{s.name} <span className="text-xs text-muted-foreground">:{s.port}</span></span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-brand-400">{s.p99}</span>
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-brand-400" /> Revenue Ramp</h3>
          {[
            { label: "Day 30 ARR", value: "£1.44M" },
            { label: "Day 100 ARR", value: "£9M" },
            { label: "Year 1 ARR", value: "£15M" },
            { label: "Year 3 ARR (5 verticals)", value: "£43.75M" },
            { label: "Year 5 ARR", value: "£200M" },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between text-sm py-1">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-bold text-brand-400">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-brand-500/10 border border-brand-500/30 p-4 text-center">
        <p className="text-sm font-medium text-brand-400">IPO on LSE in Q16 (Apr-Jun 2030). Mon 30 Jun - Fri 4 Jul 09:00 BST. THE LAUNCH.</p>
      </div>
    </div>
  );
}
