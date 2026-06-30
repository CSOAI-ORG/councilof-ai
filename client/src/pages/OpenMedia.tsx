import { useEffect, useState } from "react";
const TOKEN: string = ((import.meta as any).env && (import.meta as any).env.VITE_OPENVERSE_TOKEN) || "";
async function searchCC(q: string): Promise<any[]> {
  const headers: any = {}; if (TOKEN) headers["Authorization"] = "Bearer " + TOKEN;
  const r = await fetch("https://api.openverse.org/v1/images/?q=" + encodeURIComponent(q) + "&page_size=12&mature=false", { headers });
  if (!r.ok) throw new Error("openverse-" + r.status);
  const d = await r.json();
  return d.results || [];
}
export default function OpenMedia() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => { document.title = "Open Commons media | CSOAI"; }, []);
  async function run() { setErr(""); try { setItems(await searchCC(q.trim() || "earth")); } catch (e: any) { setErr("Search failed (" + e.message + ")."); } }
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="mx-auto max-w-5xl px-6 pt-14 pb-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS - open commons</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight">Free, open, attributed media.</h1>
        <p className="mt-3 text-emerald-100/80">800M+ Creative Commons works via Openverse - free to use, properly attributed, governed. Open source made easy.</p>
        <div className="mt-6 flex gap-2 max-w-2xl mx-auto">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder="Search Creative Commons media..." className="flex-1 rounded-xl border border-emerald-500/25 bg-black/30 px-4 py-3 text-sm text-emerald-50 placeholder-emerald-300/30 focus:outline-none" />
          <button onClick={run} className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Search</button>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-6 pb-16">
        {err && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200/80">{err}</div>}
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (
            <a key={it.id} href={it.foreign_landing_url} target="_blank" rel="noopener" className="group overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#05140d]">
              <div className="aspect-square w-full overflow-hidden bg-black"><img src={it.thumbnail} alt={it.title} className="h-full w-full object-cover group-hover:scale-105 transition" loading="lazy" /></div>
              <div className="p-3"><div className="truncate text-xs font-semibold text-emerald-100">{it.title || "Untitled"}</div><div className="mt-0.5 truncate text-[11px] text-emerald-300/60">{it.creator || "Unknown"} - {(it.license || "").toUpperCase()} {it.license_version || ""}</div></div>
            </a>
          ))}
        </div>
        {items.length === 0 && !err && <p className="text-center text-sm text-emerald-300/40">Search to load open-licensed works.</p>}
      </section>
    </div>
  );
}
