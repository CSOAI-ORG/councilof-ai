import { useEffect, useState } from "react";
const GW: string = ((import.meta as any).env && (import.meta as any).env.VITE_KNOWLEDGE_BASE) || "https://os.meok.ai/api";
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
  const [q, setQ] = useState(""); const [res, setRes] = useState<any>(null); const [kn, setKn] = useState<any>(null); const [loading, setLoading] = useState(false);
  useEffect(() => { document.title = "Governance Graph - the governed Google | CSOAI"; }, []);
  async function run() {
    if (!q.trim()) return;
    setRes({ q: q.trim(), j: jurisdiction(q) }); setKn(null); setLoading(true);
    try { const r = await fetch(GW + "/knowledge?q=" + encodeURIComponent(q.trim())); if (r.ok) setKn(await r.json()); } catch (e) {}
    setLoading(false);
  }
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="mx-auto max-w-3xl px-6 pt-14 pb-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS - Governance Graph</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight">The governed Google.</h1>
        <p className="mt-3 text-emerald-100/80">Ask about any company, place, or AI system. Live world knowledge meets the law, the frameworks, and a signed answer.</p>
        <div className="mt-6 flex gap-2"><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder="e.g. Germany, or a hospital in Texas" className="flex-1 rounded-xl border border-emerald-500/25 bg-black/30 px-4 py-3 text-sm text-emerald-50 placeholder-emerald-300/30 focus:outline-none" /><button onClick={run} className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-[#03110b] hover:bg-emerald-400">{loading ? "..." : "Map it"}</button></div>
      </section>
      {res && (<section className="mx-auto max-w-3xl px-6 pb-10 space-y-4">
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5"><div className="text-sm text-emerald-300/70">For "{res.q}"</div><div className="mt-1 text-xl font-bold">Jurisdiction: {res.j.region}</div><p className="mt-1 text-sm text-emerald-100/80">Primary regime: <a href={res.j.href} className="font-bold text-emerald-300 underline">{res.j.primary}</a>. Comply once and the Sovereign crosswalks it across every framework below.</p></div>
        {kn && kn.facts && (kn.facts.label || kn.facts.population) && (<div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5"><div className="text-lg font-bold">{kn.facts.label || res.q}</div>{kn.facts.desc && <div className="text-sm text-emerald-300/70">{kn.facts.desc}</div>}<div className="mt-2 grid gap-1 sm:grid-cols-2 text-sm text-emerald-100/80">{kn.facts.population ? <div>Population: <span className="font-mono text-emerald-300">{Number(kn.facts.population).toLocaleString()}</span></div> : null}{kn.facts.founded ? <div>Founded: <span className="font-mono text-emerald-300">{kn.facts.founded}</span></div> : null}{kn.facts.website ? <div className="truncate">Official: <a href={kn.facts.website} className="text-emerald-300 underline">{kn.facts.website}</a></div> : null}{kn.facts.url ? <div>Wikidata: <a href={kn.facts.url} className="text-emerald-300 underline">entity</a></div> : null}</div><div className="mt-1 text-[10px] uppercase tracking-wide text-emerald-300/40">live: Wikipedia + Wikidata via os.meok.ai</div></div>)}
        {kn && Array.isArray(kn.results) && kn.results.length > 0 && (<div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5"><div className="text-lg font-bold">Knowledge</div><div className="mt-3 space-y-2">{kn.results.slice(0, 4).map((it: any, i: number) => (<a key={i} href={it.url} target="_blank" rel="noopener" className="flex gap-3 rounded-xl border border-emerald-500/10 p-2 hover:bg-white/5">{it.thumb ? <img src={it.thumb} alt="" className="h-10 w-10 rounded object-cover" /> : null}<div><div className="text-sm font-semibold text-emerald-100">{it.title}</div><div className="text-xs text-emerald-300/60 line-clamp-2">{it.excerpt || it.desc}</div></div></a>))}</div></div>)}
        <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5"><div className="text-lg font-bold">Frameworks that apply</div><div className="mt-3 flex flex-wrap gap-2">{FW.map((f) => (<a key={f.name} href={f.href} className="rounded-full border border-emerald-400/30 bg-emerald-500/5 px-3 py-1.5 text-sm text-emerald-100 hover:bg-emerald-500/15">{f.name}</a>))}</div></div>
        <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5 text-center"><div className="text-lg font-bold">Want a real, signed verdict?</div><p className="mt-1 text-sm text-emerald-100/70">Run it through the live 33-agent council - Ed25519 signed, Layer 0 ledgered.</p><div className="mt-3 flex justify-center gap-2"><a href="/sov-space" className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Run in Sov Space -&gt;</a><a href="/try" className="rounded-xl border border-emerald-400/40 px-5 py-2 text-sm font-semibold text-emerald-100 hover:bg-white/5">Ask the Council</a></div></div>
      </section>)}
      <section className="mx-auto max-w-3xl px-6 pb-16"><p className="text-center text-xs text-emerald-300/50">Live world knowledge (Wikipedia + Wikidata) via os.meok.ai + CSOAI governance. Your data stays sovereign.</p></section>
    </div>
  );
}
