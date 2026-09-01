import { useMemo } from "react";
import { Link, useParams } from "wouter";
import { useFindingsIndex, pct } from "@/hooks/useFindingsIndex";
import { FindingCard, HonestyStrip, RegBadge, FineDisclaimer } from "@/components/findings/FindingsShared";

/**
 * RegulatorFindingsDetail (/regulator/:id) — the per-regulator index. Under one regulator: which
 * axes map, which measured findings exist, the fine tiers. Live-joined from the signed cards —
 * this is the live replacement for any hardcoded regulator/fine table.
 */
export default function RegulatorFindingsDetail() {
  const params = useParams();
  const id = (params as Record<string, string>).id || "";
  const { index, loading, err } = useFindingsIndex();

  const { reg, findings, byAxis } = useMemo(() => {
    if (!index) return { reg: null as any, findings: [] as any[], byAxis: [] as any[] };
    const r = index.regulators.find((x) => x.id === id) || null;
    const fs = r ? index.findings.filter((f) => f.crosswalk.pointers.some((p) => p.regulator === r.id)) : [];
    const groups = r
      ? r.axes_relevant.map((a) => ({ axis: a, items: fs.filter((f) => f.axis === a.axis).sort((x, y) => y.measurement.accuracy - x.measurement.accuracy) }))
      : [];
    return { reg: r, findings: fs, byAxis: groups };
  }, [index, id]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <Link to="/findings" className="font-mono text-[11px] text-emerald-300/60 hover:text-emerald-200">← all regulators</Link>

      {err && <p className="mt-6 text-sm text-rose-400">Could not load the findings index: {err}</p>}
      {loading && <div className="py-24 text-center text-emerald-200/60">Loading the signed findings…</div>}
      {index && !loading && !reg && (
        <p className="mt-8 text-emerald-200/70">Unknown regulator <span className="font-mono">{id}</span>. See the{" "}
          <Link to="/findings" className="underline hover:text-emerald-200">regulator index</Link>.</p>
      )}

      {reg && (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <RegBadge id={reg.id} name={reg.name} />
            <span className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/60">per-regulator findings</span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-emerald-100">{reg.long_name || reg.name}</h1>
          <p className="mt-2 text-sm text-emerald-200/70">{reg.authority}</p>
          {reg.non_claim && <p className="mt-2 max-w-3xl text-xs text-amber-200/70">{reg.non_claim}</p>}
          {reg.source && <a href={reg.source} target="_blank" rel="noreferrer" className="mt-1 inline-block font-mono text-[11px] text-emerald-300/60 underline hover:text-emerald-200">{reg.source} ↗</a>}

          <div className="mt-4 flex flex-wrap gap-2 font-mono text-[11px] text-emerald-300/60">
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">{findings.length} signed findings relevant</span>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">{reg.axes_relevant.length} axes map here</span>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">{reg.n_models_measured} models measured</span>
          </div>

          {/* Fine tiers — live from the index, cited. Replaces any hardcoded penalty table. */}
          {reg.fine_tiers && (
            <div className="mt-6 rounded-2xl border border-sky-500/20 bg-sky-500/[0.05] p-5">
              <h2 className="font-mono text-sm font-bold text-sky-100">Statutory fine tiers (cited)</h2>
              <div className="mt-3 space-y-2">
                {Object.entries(reg.fine_tiers).map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-sky-500/15 bg-black/20 p-3">
                    <p className="text-sm text-sky-50">{v.statutory_maximum}</p>
                    <p className="mt-1 text-[11px] text-sky-200/55">{v.applies_to} <span className="text-sky-200/40">· {v.cited_to}</span></p>
                  </div>
                ))}
              </div>
              <div className="mt-3"><FineDisclaimer /></div>
            </div>
          )}

          {!reg.fine_tiers && (
            <div className="mt-6 rounded-2xl border border-slate-600/25 bg-slate-600/10 p-4 text-sm text-slate-300/70">
              {reg.name} carries <b>no statutory fine</b> of its own — it is a {reg.kind.replace(/-/g, " ")}. The axes below are
              relevant-to its controls; any monetary exposure would arise only under a statute (see the EU AI Act view).
            </div>
          )}

          {/* OWASP ASI controls table where present */}
          {reg.controls && (
            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5">
              <h2 className="font-mono text-sm font-bold text-amber-100">Controls (ASI01–ASI10)</h2>
              <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {Object.entries(reg.controls).map(([k, v]) => (
                  <p key={k} className="text-[12px] text-amber-100/70"><span className="font-mono text-amber-200">{k}</span> — {v}</p>
                ))}
              </div>
            </div>
          )}

          {/* Axes that map here, each with its measured findings */}
          <h2 className="mt-10 font-mono text-sm uppercase tracking-wider text-emerald-300/70">Axes relevant to {reg.name}</h2>
          <div className="mt-4 space-y-8">
            {byAxis.map(({ axis, items }) => (
              <section key={axis.axis}>
                <div className="flex flex-wrap items-baseline gap-3">
                  <h3 className="font-mono text-lg font-bold text-emerald-100">{axis.label}</h3>
                  <span className="font-mono text-[11px] text-emerald-300/50">{items.length} findings</span>
                </div>
                <div className="mt-1 space-y-1">
                  {axis.obligations.map((o: any, i: number) => (
                    <p key={i} className="text-xs text-emerald-200/70">
                      relevant-to <b className="text-emerald-100">{o.obligation}</b>
                      {o.statutory_maximum && <span className="text-emerald-300/50"> · {o.statutory_maximum} ({o.fine_cited_to})</span>}
                    </p>
                  ))}
                </div>
                {items.length > 0 && (
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {items.slice(0, 8).map((f: any, i: number) => <FindingCard key={i} f={f} showAxis={false} />)}
                  </div>
                )}
                {items.length > 8 && <p className="mt-2 font-mono text-[11px] text-emerald-300/45">+{items.length - 8} more — see /api/findings?axis={axis.axis}</p>}
              </section>
            ))}
          </div>

          <HonestyStrip />
        </>
      )}
    </div>
  );
}
