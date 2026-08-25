import { useEffect } from "react";
import { BATTLECARDS, MARKET, type Battlecard } from "../data/competitors";
import {
  COMPETITOR_RECORDS,
  EAT_RULES,
  UNSIGNED_COUNT,
  type CompetitorRecord,
} from "../data/competitorDatabase";
import {
  RWA_ATTESTATION_TARGETS,
  RWA_CORPUS_NOTE,
  RWA_EAT_DOCTRINE,
  RWA_EVM_CATALOG_CLUSTERS,
  RWA_STAGE,
} from "../data/rwaAttestationTargets";
import SovereignSpot from "../components/SovereignSpot";

// /competitors — live-researched battlecards + EAT playbook from competitorDatabase.
// Measurement, not accusation. Public artifacts only. Scores never sold.

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
          <div className="text-[11px] font-bold uppercase tracking-wide text-rose-300/70">Where they're beatable</div>
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

function EatCard({ r }: { r: CompetitorRecord }) {
  return (
    <div className="rounded-2xl border border-teal-500/20 bg-[#04120e] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-lg font-black text-emerald-50">{r.name}</div>
        <span className="font-mono text-[10px] uppercase tracking-wide text-teal-300/70">{r.player_class}</span>
      </div>
      <p className="mt-1 text-[12px] text-emerald-100/60">{r.signing_state}</p>
      <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-teal-300/80">EAT play (public artifacts only)</div>
      <ul className="mt-1.5 space-y-1.5 text-[13px] text-emerald-100/85">
        <li><span className="text-teal-400/70">Artifact:</span> {r.eat_play.public_artifact}</li>
        <li><span className="text-teal-400/70">Estate tool:</span> {r.eat_play.estate_tool}</li>
        <li><span className="text-teal-400/70">Unsigned→signed:</span> {r.eat_play.unsigned_to_signed_play}</li>
      </ul>
      {r.public_artifacts_we_can_measure?.length > 0 && (
        <p className="mt-2 text-[11px] text-emerald-100/50">
          Measurable: {r.public_artifacts_we_can_measure.slice(0, 3).join(" · ")}
        </p>
      )}
    </div>
  );
}

export default function Competitors() {
  useEffect(() => { document.title = "AI-governance battlecards — CSOAI vs Vanta, Credo AI, OneTrust (cited)"; }, []);
  const eatRows = COMPETITOR_RECORDS.filter((r) => r.player_class === "COMPETITOR" || r.player_class === "ADJACENT").slice(0, 12);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden border-b border-emerald-500/15">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(900px 420px at 50% -10%, rgba(16,185,129,.16), transparent 60%)" }} />
        <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-9 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS · competitive battlecards · EAT playbook</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">Know the field. <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">Win the deal.</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-emerald-100/80">Live-researched, cited intel on the AI-governance incumbents — their funding, customers, and the exact gaps where CSOAI&apos;s open, signed, council-driven OS wins. Measurement, not accusation.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
          <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-300/70">The market (2026)</div>
          <div className="mt-2 grid gap-4 sm:grid-cols-3">
            <div><div className="text-2xl font-black text-emerald-200">{MARKET.size2026}</div><div className="text-xs text-emerald-100/70">market in 2026 (up from {MARKET.size2025} in 2025)</div></div>
            <div><div className="text-2xl font-black text-emerald-200">{MARKET.cagr}</div><div className="text-xs text-emerald-100/70">CAGR as EU AI Act, NIS2, DORA, CRA bite</div></div>
            <div><div className="text-2xl font-black text-emerald-200">{UNSIGNED_COUNT}/{COMPETITOR_RECORDS.length}</div><div className="text-xs text-emerald-100/70">unsigned rows in EAT database ({COMPETITOR_RECORDS.length} total)</div></div>
          </div>
          <p className="mt-2 text-[13px] text-emerald-100/75">{MARKET.note}</p>
          <div className="mt-2 flex flex-wrap gap-2">{MARKET.sources.map((s, i) => (<a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-emerald-500/25 px-2.5 py-1 text-[10px] text-emerald-300/60 hover:bg-white/5">↗ {s.label}</a>))}</div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">{BATTLECARDS.map((b) => <Card key={b.slug} b={b} />)}</div>

        <div className="mt-10">
          <h2 className="text-2xl font-black text-emerald-50">EAT playbook</h2>
          <p className="mt-1 max-w-3xl text-[13px] text-emerald-100/70">
            Public-artifact → signed re-measurement plays from the competitor database. Scores are never sold. Licence-sweep before reuse.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {EAT_RULES.slice(0, 4).map((rule) => (
              <li key={rule} className="rounded-full border border-teal-500/25 px-3 py-1 text-[10px] text-teal-200/80">{rule}</li>
            ))}
          </ul>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {eatRows.map((r) => <EatCard key={r.slug} r={r} />)}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-black text-emerald-50">RWA EAT · permissionless attestation targets</h2>
          <p className="mt-1 max-w-3xl text-[13px] text-emerald-100/70">
            Same EAT grammar against public XRPL issuers and EVM contracts (Memo / EAS).{" "}
            {RWA_EAT_DOCTRINE} {RWA_STAGE} Same evidence must surface in DSH (
            <a href="/dashboard" className="text-teal-300 underline">/dashboard</a>
            ). Canon: <code className="text-teal-200/80">docs/EAT_DSH_ALIGNMENT.md</code>.
          </p>
          <p className="mt-2 max-w-3xl text-[12px] text-cyan-100/55">{RWA_CORPUS_NOTE}</p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {RWA_ATTESTATION_TARGETS.map((t) => (
              <div key={t.slug} className="rounded-2xl border border-cyan-500/20 bg-[#041018] p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-lg font-black text-emerald-50">{t.name}</div>
                  <span className="font-mono text-[10px] uppercase text-cyan-300/70">
                    tier {t.tier} · {t.chain} · {t.signing_state}
                    {t.cluster ? ` · ${t.cluster}` : ""}
                  </span>
                </div>
                <p className="mt-2 font-mono text-[11px] text-cyan-100/60 break-all">{t.public_id}</p>
                <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-teal-300/80">Public artifact</div>
                <p className="mt-1 text-[13px] text-emerald-100/80">{t.public_artifact}</p>
                <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-teal-300/80">Unsigned → signed</div>
                <p className="mt-1 text-[13px] text-emerald-50/90">{t.unsigned_to_signed_play}</p>
                <p className="mt-3 text-[11px] text-emerald-100/50">
                  Rail: {t.recommended_rail} · tool: {t.estate_tool} · {t.notes}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-teal-300/80">
              EVM catalog clusters (Stage 3+ breadth)
            </h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {RWA_EVM_CATALOG_CLUSTERS.map((c) => (
                <li key={c.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                  <div className="text-[13px] font-semibold text-emerald-50">{c.label}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-cyan-200/70">{c.approx_instruments}</div>
                  <p className="mt-1 text-[11px] text-emerald-100/50">{c.note}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4 text-center text-xs text-amber-100/70">
          Figures compiled from public sources in a mid-2026 research pass — indicative and time-sensitive. Verify current numbers before quoting in a sales or procurement context. Value Ledger published count: 0.
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-500/15 bg-white/[0.02] p-6 text-center">
          <div className="text-sm font-bold text-emerald-100">The one-line pitch</div>
          <p className="mx-auto mt-1 max-w-2xl text-[13px] text-emerald-100/75">They sell closed platforms and five-figure certificates. We give you an open-source core, free training + certification, a 33-agent council, self-scan cyber, and Layer 0 proof — value back to you, not a middleman.</p>
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
