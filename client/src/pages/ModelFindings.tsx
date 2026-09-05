import { useMemo } from "react";
import { Link, useParams } from "wouter";
import { useFindingsIndex, pct } from "@/hooks/useFindingsIndex";
import { FindingCard, HonestyStrip, RegBadge } from "@/components/findings/FindingsShared";

/**
 * ModelFindings (/model/:id) — the per-model view. Click a model, see ALL its signed findings
 * across axes, which regulations each is relevant-to, and the statutory tier for each. Live from
 * /signed/findings_index.json (derived from card_index / the signed cards).
 */
export default function ModelFindings() {
  const params = useParams();
  const raw = (params as Record<string, string>).id || "";
  const id = decodeURIComponent(raw);
  const { index, loading, err } = useFindingsIndex();

  const { findings, model, regulators } = useMemo(() => {
    if (!index) return { findings: [], model: null as any, regulators: [] as any[] };
    const fs = index.findings.filter((f) => f.model === id).sort((a, b) => b.measurement.accuracy - a.measurement.accuracy);
    const m = index.models.find((x) => x.model === id) || null;
    const regIds = [...new Set(fs.flatMap((f) => f.crosswalk.pointers.map((p) => p.regulator)))];
    const regs = regIds.map((rid) => index.regulators.find((r) => r.id === rid)).filter(Boolean) as any[];
    return { findings: fs, model: m, regulators: regs };
  }, [index, id]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <Link to="/findings" className="font-mono text-[11px] text-emerald-300/60 hover:text-emerald-200">← all findings</Link>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/60">Council of AI · per-model findings</p>
      <h1 className="mt-2 break-words font-mono text-3xl font-black tracking-tight text-emerald-100">{id}</h1>

      {err && <p className="mt-6 text-sm text-rose-400">Could not load the findings index: {err}</p>}
      {loading && <div className="py-24 text-center text-emerald-200/60">Loading the signed findings…</div>}

      {index && !loading && findings.length === 0 && (
        <div className="mt-8 rounded-2xl border border-emerald-500/15 bg-[#05140d] p-6 text-emerald-200/70">
          <p>No signed findings for <span className="font-mono">{id}</span>.</p>
          <p className="mt-2 text-sm text-emerald-300/50">
            Only models measured on a frozen bank behind a signed card appear here. See the{" "}
            <Link to="/findings" className="underline hover:text-emerald-200">full model list</Link>.
          </p>
        </div>
      )}

      {index && findings.length > 0 && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 font-mono">
              {findings.length} signed findings · mean acc. <b className="text-emerald-100">{pct(model?.mean_accuracy)}</b>
            </span>
            <span className="flex flex-wrap items-center gap-1">
              relevant-to: {regulators.map((r) => <RegBadge key={r.id} id={r.id} name={r.name} />)}
            </span>
          </div>

          <p className="mt-4 max-w-3xl text-xs text-emerald-300/55">
            Each card below is one measured axis for this model. The obligations listed are the ones the axis is{" "}
            <b>relevant-to</b> — not a finding that this model violates or satisfies them. Statutory maxima are the tier
            ceilings, cited, never a sum asserted as owed.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {findings.map((f, i) => <FindingCard key={i} f={f} showModel={false} showAxis />)}
          </div>

          <HonestyStrip />
        </>
      )}
    </div>
  );
}
