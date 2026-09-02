import { useEffect, useState } from "react";

// CouncilHives — the Hive Grid. Every tool/feature is its own hive with an
// inner sovereign queen (sov3) that learns from your interactions, self-improves,
// stays aware, and ensembles with the others — all governed by Layer 0. The
// architecture for a self-improving, never-stuck OS. Queens learn live once the
// Layer 0 gateway is deployed; the structure stands now.

type State = "Learning" | "Aware" | "Evolving";
type Hive = { queen: string; name: string; href: string; state: State };

const HIVES: Hive[] = [
  { queen: "▦", name: "Council Town", href: "/gspc-arena?view=towns", state: "Evolving" },
  { queen: "◉", name: "Command Center", href: "/command-center", state: "Aware" },
  { queen: "▥", name: "Layer 0", href: "/trust-center", state: "Aware" },
  { queen: "⊟", name: "MCP Fleet", href: "/mcp-fleet", state: "Evolving" },
  { queen: "⌖", name: "Distribution", href: "/distribution", state: "Learning" },
  { queen: "❖", name: "Regulation Atlas", href: "/global-regulations", state: "Evolving" },
  { queen: "⌬", name: "OSCAL Studio", href: "/oscal", state: "Aware" },
  { queen: "⊞", name: "Evidence Hub", href: "/evidence", state: "Learning" },
  { queen: "⊛", name: "Model Registry", href: "/models", state: "Aware" },
  { queen: "✎", name: "Policy Generator", href: "/policy-generator", state: "Learning" },
  { queen: "◆", name: "Risk Heatmap", href: "/risk-heatmap", state: "Aware" },
  { queen: "✸", name: "Council Academy", href: "/academy", state: "Learning" },
  { queen: "⬡", name: "The Grid", href: "/register", state: "Evolving" },
];

const stateColor: Record<State, string> = {
  Learning: "bg-sky-100 text-sky-700",
  Aware: "bg-emerald-100 text-emerald-700",
  Evolving: "bg-violet-100 text-violet-700",
};

export default function CouncilHives() {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    document.title = "The Hive Grid — CSOAI";
    const iv = setInterval(() => setPulse((p) => (p + 1) % HIVES.length), 1100);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 text-white py-20">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.25), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">One queen per hive · ensembled · Layer 0 governed</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">The Hive Grid</h1>
          <p className="mt-5 max-w-2xl text-lg text-emerald-50/90">Every tool is its own hive with an inner Council queen that learns from how you use the OS, self-improves, stays aware, and never gets stuck. Each queen is governed by Layer 0, so it can evolve safely. Together they ensemble into one mind.</p>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
            <Stat v={String(HIVES.length)} l="Feature hives" />
            <Stat v={String(HIVES.length)} l="Council queens" />
            <Stat v="216" l="MCP servers" />
            <Stat v="10" l="Fleet hives" />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HIVES.map((h, i) => (
            <a key={h.name} href={h.href} className={"group rounded-2xl border p-5 transition hover:scale-[1.015] " + (i === pulse ? "border-emerald-400 shadow-[0_0_24px_-6px_rgba(16,185,129,.5)]" : "border-gray-200")}>
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-700">{h.queen}</div>
                <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + stateColor[h.state]}>{h.state}</span>
              </div>
              <div className="mt-3 font-bold text-gray-900">{h.name} <span className="text-xs font-normal text-gray-400">hive</span></div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                <span className={"h-1.5 w-1.5 rounded-full " + (i === pulse ? "bg-emerald-400 animate-ping" : "bg-emerald-300")} />
                Council queen · learning from your interactions · ensembled
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          Each queen trains on real usage of its hive, self-heals when it gets stuck, and shares what it learns with the others (ensemble). Live continuous learning switches on with the Layer 0 gateway — the runtime brain. The grid, the governance, and the structure are already standing.
        </div>
      </section>
    </div>
  );
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-center">
      <div className="text-3xl font-extrabold text-emerald-300">{v}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-emerald-100/70">{l}</div>
    </div>
  );
}
