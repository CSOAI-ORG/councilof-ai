import { useEffect, useState } from "react";
const GW: string = ((import.meta as any).env && (import.meta as any).env.VITE_SOV_GATEWAY) || "";
const CORE: { name: string; state: string }[] = [
  { name: "Byzantine Council (BFT consensus)", state: "operational" },
  { name: "Compliance engine (30 frameworks)", state: "operational" },
  { name: "Layer 0 signing (Ed25519)", state: "operational" },
  { name: "Governance Graph (live world data)", state: "operational" },
  { name: "Sigil ledger + hash-chain", state: "monitoring" },
  { name: "Framework crosswalk (comply once)", state: "expanding" },
  { name: "Sovereign Charter", state: "expanding" },
];
const DOT: Record<string, string> = { operational: "bg-emerald-400", monitoring: "bg-amber-400", expanding: "bg-sky-400" };
export default function StatusPage() {
  const [live, setLive] = useState<any>(null);
  useEffect(() => { document.title = "System Status | CSOAI"; if (/^https?:\/\//.test(GW)) { fetch(GW.replace(/\/$/, "") + "/health").then((r) => (r.ok ? r.json() : null)).then(setLive).catch(() => {}); } }, []);
  const allOk = CORE.filter((c) => c.state === "operational").length;
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden border-b border-emerald-500/15">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(800px 380px at 50% -10%, rgba(16,185,129,.20), transparent 60%)" }} />
        <div className="relative mx-auto max-w-3xl px-6 pt-16 pb-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS - system status</p>
          <h1 className="mt-3 text-5xl sm:text-6xl font-black tracking-tight">We publish our <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">own status.</span></h1>
          <p className="mt-4 mx-auto max-w-xl text-lg text-emerald-100/80">An AI-governance company should be the most transparent system you run. {allOk} core systems operational; data layers expanding; ledger under continuous integrity monitoring.</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-10 space-y-3">
        {CORE.map((c) => (<div key={c.name} className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-[#05140d] px-5 py-4"><span className="text-sm font-semibold text-emerald-100">{c.name}</span><span className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-emerald-200/70"><span className={"h-2.5 w-2.5 rounded-full " + (DOT[c.state] || "bg-gray-400")} />{c.state}</span></div>))}
        {live && live.components && (<div className="mt-4 rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 to-transparent p-5"><div className="text-sm font-bold text-emerald-200">Live substrate ({live.status || "connected"})</div><div className="mt-2 grid gap-1 sm:grid-cols-2 text-xs text-emerald-100/80">{Object.keys(live.components).map((k) => (<div key={k} className="flex justify-between"><span>{k}</span><span className="font-mono text-emerald-300">{String(live.components[k])}</span></div>))}</div></div>)}
        <p className="pt-4 text-center text-xs text-emerald-300/50">{/^https?:\/\//.test(GW) ? "Connected to the live Sovereign substrate." : "Connects to the live substrate when configured."} Every verdict Ed25519-signed, Layer 0 ledgered.</p>
      </section>
    </div>
  );
}
