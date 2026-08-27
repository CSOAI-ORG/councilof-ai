import { useEffect, useState } from "react";
const TOKEN: string = ((import.meta as any).env && (import.meta as any).env.VITE_OPENVERSE_TOKEN) || "";
const EX = ["earth", "cities", "forest", "technology"];
async function searchCC(q: string): Promise<any[]> {
  const headers: any = {}; if (TOKEN) headers["Authorization"] = "Bearer " + TOKEN;
  const r = await fetch("https://api.openverse.org/v1/images/?q=" + encodeURIComponent(q) + "&page_size=12&mature=false", { headers });
  if (!r.ok) throw new Error("openverse-" + r.status); const d = await r.json(); return d.results || [];
}
export default function OpenMedia() {
  const [q, setQ] = useState(""); const [items, setItems] = useState<any[]>([]); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  useEffect(() => { document.title = "Open Commons media | CSOAI"; }, []);
  async function run(query?: string) { const term = (query !== undefined ? query : q).trim() || "earth"; setQ(term); setErr(""); setLoading(true); try { setItems(await searchCC(term)); } catch (e: any) { setErr("Search failed (" + e.message + ")."); } setLoading(false); }
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden border-b border-emerald-500/15">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(800px 380px at 50% -10%, rgba(16,185,129,.20), transparent 60%)" }} />
        <div className="relative mx-auto max-w-4xl px-6 pt-16 pb-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS - open commons</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">Open <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">commons.</span></h1>
          <p className="mt-4 mx-auto max-w-xl text-lg text-emerald-100/80">800M+ Creative Commons works - free to use, properly attributed, governed. Open source, made easy.</p>
          <div className="mt-7 flex gap-2 max-w-2xl mx-auto"><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder="Search free, open-licensed media..." className="flex-1 rounded-xl border border-emerald-500/30 bg-black/40 px-5 py-4 text-base text-emerald-50 placeholder-emerald-300/30 focus:border-emerald-400 focus:outline-none" /><button onClick={() => run()} className="rounded-xl bg-emerald-500 px-6 py-4 text-base font-bold text-[#03110b] hover:bg-emerald-400">{loading ? "..." : "Search"}</button></div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">{EX.map((e) => (<button key={e} onClick={() => run(e)} className="rounded-full border border-emerald-400/25 bg-emerald-500/5 px-3 py-1 text-xs text-emerald-200/80 hover:bg-emerald-500/15">{e}</button>))}</div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-6 py-10">
        {err && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200/80">{err}</div>}
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (<a key={it.id} href={it.foreign_landing_url} target="_blank" rel="noopener" className="group overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#05140d] hover:border-emerald-400/50"><div className="aspect-square w-full overflow-hidden bg-black"><img src={it.thumbnail} alt={it.title} className="h-full w-full object-cover group-hover:scale-105 transition" loading="lazy" /></div><div className="p-3"><div className="truncate text-xs font-semibold text-emerald-100">{it.title || "Untitled"}</div><div className="mt-0.5 truncate text-[11px] text-emerald-300/60">{it.creator || "Unknown"} - {(it.license || "").toUpperCase()} {it.license_version || ""}</div></div></a>))}
        </div>
        {items.length === 0 && !err && <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-emerald-500/15 bg-[#05140d] p-5"><div className="font-bold text-emerald-200">Free</div><p className="mt-1 text-sm text-emerald-100/70">Every result is Creative Commons - reuse with confidence.</p></div><div className="rounded-2xl border border-emerald-500/15 bg-[#05140d] p-5"><div className="font-bold text-emerald-200">Attributed</div><p className="mt-1 text-sm text-emerald-100/70">Creator + license shown on every work, automatically.</p></div><div className="rounded-2xl border border-emerald-500/15 bg-[#05140d] p-5"><div className="font-bold text-emerald-200">Governed</div><p className="mt-1 text-sm text-emerald-100/70">Open tools, inside a governed OS. Search above to begin.</p></div></div>}
      </section>
    </div>
  );
}
