import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useFindingsIndex, searchFindings, pct } from "@/hooks/useFindingsIndex";
import { FindingCard, HonestyStrip, RegBadge, FineDisclaimer } from "@/components/findings/FindingsShared";

/**
 * FindingsExplorer (/findings) — the regulation-findings hub.
 *   · SEARCH  — the shippable RAG: keyword search over every signed finding.
 *   · REGULATORS — live per-regulator index (axes relevant, findings, fine tiers) joined from the cards.
 *   · MODELS  — every measured model, linking to its per-model findings view.
 * All three are live-joined from /signed/findings_index.json — no hardcoded table.
 */
export default function FindingsExplorer() {
  const { index, loading, err } = useFindingsIndex();
  const [tab, setTab] = useState<"search" | "regulators" | "models">("regulators");
  const [q, setQ] = useState("");

  const hits = useMemo(() => (index && q.trim() ? searchFindings(index, q) : []), [index, q]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/60">Council of AI · regulation findings</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">
        Every signed finding, <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">mapped to its regulator and fine tier.</span>
      </h1>
      <p className="mt-3 max-w-3xl text-emerald-100/80">
        Each measured <b>(model × axis)</b> cell is an Ed25519-signed card. Here every card is joined to the
        obligations it is <b>relevant-to</b> — EU AI Act articles, NIST AI RMF functions, OWASP ASI controls —
        and the <b>statutory maximum</b> fine for that tier, cited. Measurement, not certification.
      </p>

      {index && (
        <div className="mt-5 flex flex-wrap gap-2 font-mono text-[11px] text-emerald-300/60">
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">{index.counts.findings} signed findings</span>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">{index.counts.models} models</span>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">{index.counts.axes} mapped axis ids</span>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">{index.counts.regulators} regulators</span>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">{index.counts.unmeasured_cells} pairs honestly UNMEASURED</span>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(["regulators", "models", "search"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm capitalize ${tab === t ? "bg-emerald-500 font-bold text-[#03110b]" : "border border-emerald-500/25 text-emerald-200/80"}`}>
            {t}
          </button>
        ))}
        <a href="/api/findings" className="ml-auto rounded-xl border border-emerald-500/25 px-4 py-2 text-xs text-emerald-200/70 hover:bg-emerald-500/10">/api/findings ↗</a>
      </div>

      {err && <p className="mt-6 text-sm text-rose-400">Could not load the findings index: {err}</p>}
      {loading && <div className="py-24 text-center text-emerald-200/60">Loading the signed findings…</div>}

      {index && tab === "search" && (
        <div className="mt-6">
          <input
            autoFocus value={q} onChange={(e) => setQ(e.target.value)}
            placeholder='search findings — e.g. "provenance article 50" or "jailbreak owasp" or "safety fine"'
            className="w-full rounded-xl border border-emerald-500/30 bg-black/40 px-4 py-3 text-sm text-emerald-50 placeholder-emerald-300/30 focus:border-emerald-400 focus:outline-none" />
          <p className="mt-2 text-[11px] text-emerald-300/50">
            Portable keyword search over every finding (runs in your browser). A richer semantic search over the full
            corpus + crosswalk docs exists as an offline FTS index (sink-pod <code className="text-emerald-300/70">corpus-index.sqlite</code>) — the documented upgrade, not reachable from the edge.
          </p>
          {q.trim() && <p className="mt-3 font-mono text-xs text-emerald-300/60">{hits.length} hit{hits.length === 1 ? "" : "s"}</p>}
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {hits.slice(0, 40).map((f, i) => <FindingCard key={i} f={f} />)}
          </div>
          {q.trim() && hits.length === 0 && <p className="py-10 text-center text-sm text-emerald-300/50">No findings match every term.</p>}
        </div>
      )}

      {index && tab === "regulators" && (
        <div className="mt-6 space-y-4">
          {index.regulators.map((r) => (
            <Link key={r.id} to={`/regulator/${r.id}`} className="block rounded-2xl border border-emerald-500/15 bg-[#05140d] p-5 transition hover:border-emerald-400/40">
              <div className="flex flex-wrap items-center gap-3">
                <RegBadge id={r.id} name={r.name} />
                <span className="text-sm text-emerald-100/70">{r.long_name || r.name}</span>
                <span className="ml-auto font-mono text-[11px] text-emerald-300/55">
                  {r.n_findings_relevant} findings · {r.axes_relevant.length} mapped axis ids · {r.n_models_measured} models
                </span>
              </div>
              <p className="mt-2 text-xs text-emerald-300/55">
                {r.kind === "statute-with-fines"
                  ? <>Statute · fine regime: <span className="text-emerald-200/70">{r.fine_regime}</span></>
                  : r.kind === "security-taxonomy-no-fine" ? "Security taxonomy · no statutory fine"
                  : r.kind === "management-standard-no-fine" ? "Management standard · no statutory fine"
                  : "Voluntary framework · no statutory fine"}
              </p>
              {r.axes_relevant.length > 0 && (
                <p className="mt-2 font-mono text-[11px] text-emerald-300/45">{r.axes_relevant.map((a) => a.label).join(" · ")}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      {index && tab === "models" && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-emerald-500/15">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-emerald-500/15 text-left font-mono text-[11px] uppercase tracking-wider text-emerald-300/60">
                <th className="px-4 py-3">model</th>
                <th className="px-4 py-3">findings</th>
                <th className="px-4 py-3">axes</th>
                <th className="px-4 py-3">regulators</th>
                <th className="px-4 py-3">mean acc.</th>
              </tr>
            </thead>
            <tbody>
              {index.models.map((m) => (
                <tr key={m.model} className="border-b border-emerald-500/5 hover:bg-emerald-500/5">
                  <td className="px-4 py-2.5">
                    <Link to={`/model/${encodeURIComponent(m.model)}`} className="font-mono text-emerald-100 underline-offset-2 hover:text-emerald-300 hover:underline">{m.model}</Link>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-emerald-200/70">{m.n_findings}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-emerald-300/50">{m.axes.length}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex flex-wrap gap-1">{m.regulators.map((rid) => <RegBadge key={rid} id={rid} />)}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-emerald-100">{pct(m.mean_accuracy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {index && (
        <div className="mt-6">
          <FineDisclaimer />
        </div>
      )}
      <HonestyStrip />
      <p className="mt-6 text-center text-[11px] text-emerald-300/45">
        Enterprise / OWASP angle: <Link to="/gspc-verify" className="underline hover:text-emerald-200">verify any card</Link> ·
        public-disclosure crosswalk schema + worked example at <a href="/signed/disclosure-crosswalk-example.json" className="underline hover:text-emerald-200">/signed/disclosure-crosswalk-example.json</a> (public sources only, never a probe).
      </p>
    </div>
  );
}
