import { useEffect } from "react";
import { BATTLECARDS, MARKET, type Battlecard } from "../data/competitors";
import SovereignSpot from "../components/SovereignSpot";

// /competitors — live-researched battlecards. Cited, dated intel on the AI-
// governance incumbents and the specific CSOAI wedge for each. Compiled from a
// web-research pass mid-2026; figures indicative, verify for procurement.

function Card({ b }: { b: Battlecard }) {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
      <div className="text-xl font-black text-emerald-50">{b.name}</div>
      <p className="mt-1 text-sm text-emerald-100/75">{b.positioning}</p>

      <div className="mt-4 text-[11px] font-bold uppercase tracking-wide text-emerald-300/70">The facts (cited)</div>
      <ul className="mt-1.5 space-y-1 text-[13px] text-emerald-100/80">
        {b.facts.map((f, i) => (<li key={i} className="flex gap-2"><span className="text-emerald-400/60">·</span><span>{f}</span></li>))}
      </ul>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-sky-300/70">Strengths</div>
          <ul className="mt-1.5 space-y-1 text-[12px] text-emerald-100/70">{b.strengths.map((s, i) => (<li key={i} className="flex gap-2"><span className="text-sky-400/60">+</span><span>{s}</span></li>))}</ul>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-rose-300/70">Where our scope differs</div>
          <ul className="mt-1.5 space-y-1 text-[12px] text-emerald-100/70">{b.weaknesses.map((w, i) => (<li key={i} className="flex gap-2"><span className="text-rose-400/60">−</span><span>{w}</span></li>))}</ul>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
        <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-300/80">How CSOAI wins</div>
        <p className="mt-1 text-[13px] text-emerald-50/90">{b.wedge}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {b.sources.map((s, i) => (<a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-emerald-500/25 px-2.5 py-1 text-[10px] text-emerald-300/70 hover:bg-white/5">↗ {s.label}</a>))}
      </div>
    </div>
  );
}

export default function Competitors() {
  useEffect(() => { document.title = "AI-governance battlecards — CSOAI vs Vanta, Credo AI, OneTrust (cited)"; }, []);
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden border-b border-emerald-500/15">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(900px 420px at 50% -10%, rgba(16,185,129,.16), transparent 60%)" }} />
        <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-9 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS · competitive battlecards</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Know the field. <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">Cite the source.</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-emerald-100/80">Publicly-reported context on the AI-governance market, each figure carrying the source that published it. Every fact below is reported by that source, not measured by us — and none of it is a finding about any company.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
          <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-300/70">The market (2026)</div>
          <div className="mt-2 grid gap-4 sm:grid-cols-3">
            <div><div className="text-2xl font-black text-emerald-200">{MARKET.size2026}</div><div className="text-xs text-emerald-100/70">market in 2026 (up from {MARKET.size2025} in 2025)</div></div>
            <div><div className="text-2xl font-black text-emerald-200">{MARKET.cagr}</div><div className="text-xs text-emerald-100/70">CAGR as EU AI Act, NIS2, DORA, CRA bite</div></div>
            <div><div className="text-2xl font-black text-emerald-200">reported</div><div className="text-xs text-emerald-100/70">every figure in this block is the cited analyst&apos;s, not a measurement of ours</div></div>
          </div>
          <p className="mt-2 text-[13px] text-emerald-100/75">{MARKET.note}</p>
          <div className="mt-2 flex flex-wrap gap-2">{MARKET.sources.map((s, i) => (<a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-emerald-500/25 px-2.5 py-1 text-[10px] text-emerald-300/60 hover:bg-white/5">↗ {s.label}</a>))}</div>
        </div>

        {/* Required, and it was absent. This page names four live companies and compares
            them to us. UK comparative-advertising rules (BPMMR 2008) require the comparison
            to be of objectively verifiable features and to not discredit a competitor, and
            nominative trademark use needs the relationship stated. An earlier audit recorded
            a disclaimer here; there was none — the only one in the estate sits on a
            different component. */}
        <p className="mx-auto mt-6 max-w-3xl rounded-lg border border-emerald-500/20 bg-white/[0.02] px-4 py-3 text-center text-[11px] leading-relaxed text-emerald-100/60">
          Vanta, Drata, Credo AI and OneTrust are trademarks of their respective owners. Council of AI is
          not affiliated with, endorsed by, or partnered with any of them. Comparisons below describe
          published product scope and are sourced where cited; where a company does not publish its
          pricing we say so rather than repeat an unverified figure. Anything here that is wrong is a
          defect — tell us at nicholas@csoai.org and the correction is published in our ledger.
        </p>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">{BATTLECARDS.map((b) => <Card key={b.slug} b={b} />)}</div>

        <div className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4 text-center text-xs text-amber-100/70">
          Figures compiled from public sources in a mid-2026 research pass — indicative and time-sensitive. Verify current numbers before quoting in a sales or procurement context.
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-500/15 bg-white/[0.02] p-6 text-center">
          <div className="text-sm font-bold text-emerald-100">The one-line pitch</div>
          <p className="mx-auto mt-1 max-w-2xl text-[13px] text-emerald-100/75">Stated about us, not about them: verification is free forever and needs no account, a grade is never sold, every published card can be recomputed offline from bytes we publish, and what we could not measure is labelled unmeasured rather than left out. We measure against an obligation — we do not enforce one, and we certify nothing.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <a href="/why" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Why CSOAI →</a>
            <a href="/regulators" className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">The Regulator Atlas →</a>
            <a href="/scan" className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20">Cyber self-scan →</a>
          </div>
        </div>

        <div className="mt-8">
          <SovereignSpot topic="the AI-governance competitive landscape (Vanta, Credo AI, OneTrust)" layer="regulators" suggest="Where does each incumbent leave a gap CSOAI fills?" />
        </div>
      </section>
    </div>
  );
}
