import { useEffect, useState } from "react";
import { ECOSYSTEM, RUBRIC, PLAY_META, type Account } from "../data/ecosystem";

// /intel — the Distribution Hive command view. Renders the ecosystem dataset as
// account cards, runs the fixed testing rubric per account, and tailors demo links.
// Org-level public data only; plays are pre-recon hypotheses (see DISTRIBUTION_HIVE.md).
const TABS = ["all", "regulator", "fortune500", "sector"] as const;

export default function Intel() {
  const [tab, setTab] = useState<string>("all");
  const [sel, setSel] = useState<Account | null>(null);
  useEffect(() => { document.title = "Distribution Hive — account intelligence | CSOAI"; }, []);
  const rows = ECOSYSTEM.filter((a) => tab === "all" || a.type === tab || (tab === "fortune500" && a.type === "fortune100"));

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Distribution Hive · account intelligence</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">The market is <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">nameable.</span></h1>
        <p className="mt-3 max-w-3xl text-emerald-100/80">Governments, regulators, Fortune 500 and high-exposure sectors — under ~10,000 public accounts. Each is one row that feeds the globe, Sov Space and the demo. Pick an account, run the rubric, tailor the demo.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={"rounded-full border px-3 py-1.5 text-xs font-semibold capitalize " + (tab === t ? "border-emerald-400 bg-emerald-500 text-[#03110b]" : "border-emerald-400/25 bg-emerald-500/5 text-emerald-200/80 hover:bg-emerald-500/15")}>{t}</button>
          ))}
          <span className="ml-auto rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300">{rows.length} accounts · seed</span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {rows.map((a) => {
            const pm = PLAY_META[a.play];
            return (
              <button key={a.id} onClick={() => setSel(a)} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4 text-left transition hover:border-emerald-400/40">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-black text-emerald-100">{a.name}</div>
                  <span className={"shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold " + pm.tone}>{a.play}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-emerald-300/60">{a.type} · {a.country} · {a.region}</div>
                <div className="mt-2 flex flex-wrap gap-1">{a.frameworks.slice(0, 5).map((f) => <span key={f} className="rounded bg-black/40 px-2 py-0.5 font-mono text-[10px] text-emerald-300/72">{f}</span>)}</div>
                <div className="mt-2 text-[11px] text-emerald-300/60">posture: {a.posture} · vendor: {a.currentVendor} · src: {a.source}</div>
              </button>
            );
          })}
        </div>

        {sel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setSel(null)}>
            <div className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl border border-emerald-400/30 bg-[#05140d] p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between"><div className="text-lg font-black text-emerald-100">{sel.name}</div><button onClick={() => setSel(null)} className="text-emerald-300/60 hover:text-emerald-100">✕</button></div>
              <div className="mt-1 text-xs text-emerald-300/60">{sel.type} · {sel.country} · jurisdictions: {sel.jurisdictions.join(", ")}</div>
              <div className={"mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold " + PLAY_META[sel.play].tone}>{PLAY_META[sel.play].label}</div>

              <div className="mt-4 text-[11px] font-bold uppercase tracking-wide text-emerald-300/60">Side-by-side test rubric</div>
              <div className="mt-2 space-y-1.5">
                {RUBRIC.map((r) => (
                  <div key={r} className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-1.5 text-[13px]">
                    <span className="text-emerald-100/80">{r}</span>
                    <span className="font-mono text-emerald-300/70">score in demo →</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-[11px] font-bold uppercase tracking-wide text-emerald-300/60">Tailored demo</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <a href="/crosswalk" className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-[#03110b] hover:bg-emerald-400">Crosswalk their {sel.frameworks.length} frameworks →</a>
                <a href="/classifier" className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-white/5">Classify their AI →</a>
                <a href="/agent-governance" className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-white/5">Agent governance →</a>
                <a href="/tool-commons" className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-white/5">Run the MCP live →</a>
              </div>
              <p className="mt-3 text-[11px] text-emerald-300/50">Org-level public data. Play is a pre-recon hypothesis until an account report is run. Source: {sel.source}.</p>
            </div>
          </div>
        )}

        <p className="mt-8 text-[11px] text-emerald-300/50">Seed dataset — real public organisations, honest fields ("unknown" where not yet researched). Individual contact data is handled only via connected, licensed B2B tools under a legitimate-interest basis. See docs/DISTRIBUTION_HIVE.md.</p>
      </div>
    </div>
  );
}
