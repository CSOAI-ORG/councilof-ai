import { useEffect, useState } from "react";
const GW: string = ((import.meta as any).env && (import.meta as any).env.VITE_KNOWLEDGE_BASE) || "https://os.meok.ai/api";
const EX = ["audit", "compliance", "EU AI Act", "payments", "defence", "identity"];
export default function ToolCommons() {
  const [q, setQ] = useState(""); const [data, setData] = useState<any>(null); const [loading, setLoading] = useState(false); const [copied, setCopied] = useState("");
  useEffect(() => { document.title = "Tool Commons - 377 governed MCP tools | CSOAI"; run("governance"); }, []);
  async function run(query?: string) {
    const term = (query !== undefined ? query : q).trim() || "governance"; setQ(term); setLoading(true);
    try { const r = await fetch(GW + "/tools?q=" + encodeURIComponent(term)); if (r.ok) setData(await r.json()); } catch (e) {}
    setLoading(false);
  }
  function copy(cmd: string, name: string) { try { navigator.clipboard.writeText(cmd); setCopied(name); setTimeout(() => setCopied(""), 1200); } catch (e) {} }
  const matches = (data && data.matches) || [];
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden border-b border-emerald-500/15">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(800px 380px at 50% -10%, rgba(16,185,129,.20), transparent 60%)" }} />
        <div className="relative mx-auto max-w-4xl px-6 pt-16 pb-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS - open tool commons</p>
          <h1 className="mt-3 text-5xl sm:text-6xl font-black tracking-tight">The open <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">tool commons.</span></h1>
          <p className="mt-4 mx-auto max-w-xl text-lg text-emerald-100/80">{data ? data.total : "377"}+ governed MCP tools - search, connect with one command, run them inside the Sovereign OS. Open source, made easy.</p>
          <div className="mt-7 flex gap-2 max-w-2xl mx-auto"><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder="Search 377 governed tools..." className="flex-1 rounded-xl border border-emerald-500/30 bg-black/40 px-5 py-4 text-base text-emerald-50 placeholder-emerald-300/30 focus:border-emerald-400 focus:outline-none" /><button onClick={() => run()} className="rounded-xl bg-emerald-500 px-6 py-4 text-base font-bold text-[#03110b] hover:bg-emerald-400">{loading ? "..." : "Search"}</button></div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">{EX.map((e) => (<button key={e} onClick={() => run(e)} className="rounded-full border border-emerald-400/25 bg-emerald-500/5 px-3 py-1 text-xs text-emerald-200/80 hover:bg-emerald-500/15">{e}</button>))}</div>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="grid gap-3 sm:grid-cols-2">
          {matches.map((m: any) => (
            <div key={m.name} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4">
              <div className="flex items-center justify-between gap-2"><div className="truncate font-mono text-sm font-bold text-emerald-100">{m.name}</div><span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">{m.clusterLabel}</span></div>
              <div className="mt-1 text-xs text-emerald-300/60">{m.tools} tools</div>
              <div className="mt-3 flex items-center gap-2"><code className="flex-1 truncate rounded-lg bg-black/40 px-2.5 py-1.5 text-[11px] text-emerald-300/80">{m.connect}</code><button onClick={() => copy(m.connect, m.name)} className="shrink-0 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[11px] font-bold text-[#03110b] hover:bg-emerald-400">{copied === m.name ? "Copied" : "Copy"}</button></div>
            </div>
          ))}
        </div>
        {matches.length === 0 && !loading && <p className="text-center text-sm text-emerald-300/40">No tools matched - try another term.</p>}
        <p className="mt-8 text-center text-xs text-emerald-300/50">Every tool is governed by Layer 0 and signed. Open, MIT-licensed, sovereign by construction. Live via the Sovereign gateway.</p>
      </section>
    </div>
  );
}
