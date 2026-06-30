import { useEffect, useState } from "react";
import { dcLive, fetchPlaceStats } from "../lib/datacommons";
const FW = [{ name: "EU AI Act", href: "/eu-ai-act-checklist" }, { name: "NIST AI RMF", href: "/nist-vs-eu-ai-act" }, { name: "ISO 42001", href: "/iso-42001-vs-eu-ai-act" }, { name: "GDPR", href: "/eu-ai-act-vs-gdpr" }];
function jurisdiction(q: string) {
  const s = (q || "").toLowerCase();
  if (/\beu\b|europe|german|france|spain|ital|dublin|ireland|netherl|brussels|paris|berlin/.test(s)) return { region: "European Union", primary: "EU AI Act", href: "/eu-ai-act-checklist" };
  if (/\bus\b|usa|america|california|texas|colorado|new york/.test(s)) return { region: "United States", primary: "NIST AI RMF + state laws", href: "/colorado-ai-act" };
  if (/china|beijing|shanghai|shenzhen/.test(s)) return { region: "China", primary: "TC260", href: "/china-ai-law" };
  if (/\buk\b|britain|england|london|scotland/.test(s)) return { region: "United Kingdom", primary: "UK AI regulation", href: "/uk-ai-regulation" };
  return { region: "Global", primary: "ISO 42001", href: "/iso-42001-vs-eu-ai-act" };
}
export default function GovGraph() {
  const [q, setQ] = useState(""); const [res, setRes] = useState<any>(null); const [stats, setStats] = useState<string[]>([]);
  useEffect(() => { document.title = "Governance Graph - the governed Google | CSOAI"; }, []);
  async function run() { if (!q.trim()) return; setRes({ q: q.trim(), j: jurisdiction(q) }); setStats([]); if (dcLive()) { try { setStats(await fetchPlaceStats(q.trim())); } catch (e) {} } }
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="mx-auto max-w-3xl px-6 pt-14 pb-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS - Governance Graph</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight">The governed Google.</h1>
        <p className="mt-3 text-emerald-100/80">Ask about any company, place, or AI system. Google gives breadth; the Sovereign gives the law, the frameworks, and a signed answer.</p>
        <div className="mt-6 flex gap-2"><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder="e.g. a hospital in Germany, or a fintech in Texas" className="flex-1 rounded-xl border border-emerald-500/25 bg-black/30 px-4 py-3 text-sm text-emerald-50 placeholder-emerald-300/30 focus:outline-none" /><button onClick={run} className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Map it</button></div>
      </section>
      {res && (<section className="mx-auto max-w-3xl px-6 pb-10 space-y-4">
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5"><div className="text-sm text-emerald-300/70">For "{res.q}"</div><div className="mt-1 text-xl font-bold">Jurisdiction: {res.j.region}</div><p className="mt-1 text-sm text-emerald-100/80">Primary regime: <a href={res.j.href} className="font-bold text-emerald-300 underline">{res.j.primary}</a>. Comply once and the Sovereign crosswalks it across every framework below.</p></div>
        <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5"><div className="text-lg font-bold">Frameworks that apply</div><div className="mt-3 flex flex-wrap gap-2">{FW.map((f) => (<a key={f.name} href={f.href} className="rounded-full border border-emerald-400/30 bg-emerald-500/5 px-3 py-1.5 text-sm text-emerald-100 hover:bg-emerald-500/15">{f.name}</a>))}</div></div>
        {stats.length > 0 && (<div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5"><div className="text-lg font-bold">Live public data (Google Data Commons)</div><ul className="mt-2 space-y-1 text-sm text-emerald-100/80">{stats.map((s, i) => (<li key={i}>{s}</li>))}</ul></div>)}
        <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5 text-center"><div className="text-lg font-bold">Want a real, signed verdict?</div><p className="mt-1 text-sm text-emerald-100/70">Run it through the live 33-agent council - Ed25519 signed, Layer 0 ledgered.</p><div className="mt-3 flex justify-center gap-2"><a href="/sov-space" className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Run in Sov Space -&gt;</a><a href="/try" className="rounded-xl border border-emerald-400/40 px-5 py-2 text-sm font-semibold text-emerald-100 hover:bg-white/5">Ask the Council</a></div></div>
      </section>)}
      <section className="mx-auto max-w-3xl px-6 pb-16"><p className="text-center text-xs text-emerald-300/50">{dcLive() ? "Live: Google Data Commons connected." : "Connects Google Data Commons when VITE_DATACOMMONS_KEY is set - free."} Google breadth + CSOAI governance. Your data stays sovereign.</p></section>
    </div>
  );
}
