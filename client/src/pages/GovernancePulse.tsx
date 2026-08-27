import { useEffect, useMemo, useState } from "react";

// GovernancePulse — a live, searchable feed of every regulation move across the
// grid, synced from the CSOAI intel agent (csoai-dashboard regulation-deltas,
// updated daily). The OS consumes M4's live data — one source, no duplication.

type Delta = { at?: string; kind?: string; frameworkSlug?: string; jurisdictions?: any; summary?: string; source?: string };

const FEED = "https://raw.githubusercontent.com/CSOAI-ORG/csoai-dashboard/main/client/public/data/regulation-deltas.json";

function jur(j: any): string { if (!j) return ""; if (Array.isArray(j)) return j.join(", "); return String(j); }
function when(at?: string): string { if (!at) return ""; try { return new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); } catch (e) { return ""; } }

export default function GovernancePulse() {
  const [items, setItems] = useState<Delta[]>([]);
  const [q, setQ] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    document.title = "Governance Pulse — CSOAI";
    fetch(FEED, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setItems(d.slice().reverse()); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((d) => (((d.summary || "") + " " + (d.frameworkSlug || "") + " " + jur(d.jurisdictions) + " " + (d.kind || "")).toLowerCase().indexOf(t) >= 0));
  }, [items, q]);

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 360px at 80% -10%, rgba(45,212,191,.25), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" /></span>
            <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">Live · synced daily from the grid</p>
          </div>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Governance Pulse</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Every regulation, guidance and enforcement move worldwide — as it happens. Streamed from the CSOAI intelligence agent and surfaced live in the OS.</p>
          <div className="mt-6 max-w-md">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jurisdiction, framework, topic…" className="w-full rounded-xl border border-emerald-300/30 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-emerald-200/50 focus:border-emerald-300 focus:outline-none" />
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
          <span>{loaded ? list.length + " moves" : "Syncing…"}{q ? " matching" : ""}</span>
          <a href="/global-regulations" className="font-semibold text-emerald-700 hover:text-emerald-800">Open the Regulation Atlas →</a>
        </div>

        {loaded && list.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 p-8 text-center text-gray-400">No moves match “{q}”.</div>
        ) : (
          <div className="space-y-2">
            {list.slice(0, 120).map((d, i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-gray-200 p-4 hover:border-emerald-300 hover:bg-emerald-50/30 transition">
                <div className="w-20 shrink-0 text-right">
                  <div className="text-[11px] font-mono text-gray-400">{when(d.at)}</div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {d.frameworkSlug && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{d.frameworkSlug}</span>}
                    {d.kind && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">{d.kind}</span>}
                    {jur(d.jurisdictions) && <span className="text-[11px] text-gray-400">{jur(d.jurisdictions)}</span>}
                  </div>
                  <p className="mt-1 text-sm text-gray-800">{d.summary || "(no summary)"}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          This feed is produced by the CSOAI intelligence agent (the csoai‑dashboard intel hive) and consumed live by the OS — one source of truth, kept current daily. Your Council assistant uses it to keep your guidance fresh without you lifting a finger.
        </div>
      </section>
    </div>
  );
}
