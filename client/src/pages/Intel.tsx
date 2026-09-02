import { useEffect, useRef, useState } from "react";
import { ECOSYSTEM, PLAY_META, type Account } from "../data/ecosystem";
import { scoreAccount } from "../lib/hiveScore";
import { flyAndConvene } from "../lib/globeDrive";
import CouncilNav from "../components/CouncilNav";

// /intel — the Distribution Hive command view. Renders the ecosystem dataset as
// account cards, runs the fixed testing rubric per account, and tailors demo links.
// Org-level public data only; plays are pre-recon hypotheses (see DISTRIBUTION_HIVE.md).
const TABS = ["all", "regulator", "fortune500", "sector"] as const;

export default function Intel() {
  const [tab, setTab] = useState<string>("all");
  const [region, setRegion] = useState<string>("all");
  const [sector, setSector] = useState<string>("all");
  const [sel, setSel] = useState<Account | null>(null);
  const globeRef = useRef<HTMLIFrameElement | null>(null);
  // Persistent globe, mounted once: whenever you pick an account, the Council assistant flies it
  // to that account's exact HQ and pulses the point — the market lights up without audio.
  useEffect(() => { if (sel) flyAndConvene(globeRef.current?.contentWindow, sel.hq[0], sel.hq[1], { height: 1400000, duration: 2.8, spiral: false }); }, [sel]);
  useEffect(() => { document.title = "Distribution Hive — account intelligence | CSOAI"; }, []);
  const REGIONS = ["all", ...Array.from(new Set(ECOSYSTEM.map((a) => a.region)))];
  const SECTORS = ["all", ...Array.from(new Set(ECOSYSTEM.map((a) => a.sector).filter(Boolean) as string[]))];
  const rows = ECOSYSTEM.filter((a) =>
    (tab === "all" || a.type === tab || (tab === "fortune500" && a.type === "fortune100")) &&
    (region === "all" || a.region === region) &&
    (sector === "all" || a.sector === sector));
  const scored = rows.map((a) => ({ a, s: scoreAccount(a) }));
  const nonAuth = scored.filter((x) => x.s.confidence !== "authority");
  const avgGap = nonAuth.length ? (nonAuth.reduce((t, x) => t + x.s.totalGap, 0) / nonAuth.length).toFixed(1) : "0";
  const playCount = scored.reduce((m, x) => { m[x.s.play] = (m[x.s.play] || 0) + 1; return m; }, {} as Record<string, number>);
  // worst-gap leaderboard — ranked across the WHOLE dataset (not the current tab)
  const topGaps = ECOSYSTEM.map((a) => ({ a, s: scoreAccount(a) })).filter((x) => x.s.confidence !== "authority").sort((x, y) => y.s.totalGap - x.s.totalGap).slice(0, 8);
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <CouncilNav />
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Distribution Hive · account intelligence</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">The market is <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">nameable.</span></h1>
        <p className="mt-3 max-w-3xl text-emerald-100/80">Governments, regulators, Fortune 500 and high-exposure sectors — under ~10,000 public accounts. Each is one row that feeds the globe, Council Space and the demo. Pick an account, run the rubric, tailor the demo.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={"rounded-full border px-3 py-1.5 text-xs font-semibold capitalize " + (tab === t ? "border-emerald-400 bg-emerald-500 text-[#03110b]" : "border-emerald-400/25 bg-emerald-500/5 text-emerald-200/80 hover:bg-emerald-500/15")}>{t}</button>
          ))}
          <span className="ml-auto rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300">{rows.length} accounts · seed</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="font-mono text-[9px] uppercase tracking-[1px] text-emerald-300/75">region</span>
          {REGIONS.map((r) => (
            <button key={r} onClick={() => setRegion(r)} className={"rounded-full border px-2.5 py-1 font-semibold " + (region === r ? "border-emerald-400 bg-emerald-500/20 text-emerald-100" : "border-emerald-400/20 text-emerald-300/70 hover:bg-emerald-500/10")}>{r}</button>
          ))}
          <span className="ml-2 font-mono text-[9px] uppercase tracking-[1px] text-emerald-300/75">sector</span>
          {SECTORS.map((s) => (
            <button key={s} onClick={() => setSector(s)} className={"rounded-full border px-2.5 py-1 font-semibold capitalize " + (sector === s ? "border-emerald-400 bg-emerald-500/20 text-emerald-100" : "border-emerald-400/20 text-emerald-300/70 hover:bg-emerald-500/10")}>{s}</button>
          ))}
        </div>

        <div className="mt-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <div className="rounded-xl border border-emerald-500/15 bg-[#05140d] px-3 py-2.5">
              <div className="font-mono text-[9px] uppercase tracking-[1px] text-emerald-300/75">Accounts</div>
              <div className="text-lg font-black text-emerald-100">{rows.length}</div>
            </div>
            <div className="rounded-xl border border-emerald-500/15 bg-[#05140d] px-3 py-2.5">
              <div className="font-mono text-[9px] uppercase tracking-[1px] text-emerald-300/75">Avg gap</div>
              <div className="text-lg font-black text-emerald-300">{avgGap}<span className="text-[11px] text-emerald-300/75">/21</span></div>
            </div>
            {(["align", "absorb", "integrate", "displace"] as const).map((p) => (
              <div key={p} className="rounded-xl border border-emerald-500/15 bg-[#05140d] px-3 py-2.5">
                <div className={"font-mono text-[9px] uppercase tracking-[1px] " + PLAY_META[p].tone.split(" ")[0]}>{p}</div>
                <div className="text-lg font-black text-emerald-100">{playCount[p] || 0}</div>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-emerald-300/75">Live §4 rubric · CSOAI scores sourced to product · competitor scores modeled from cited battlecards · displace only with a known vendor.</p>
        </div>

        <div className="mt-4 rounded-2xl border border-amber-400/25 bg-gradient-to-b from-amber-500/[0.06] to-transparent p-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[2px] text-amber-300/70">Top opportunities · biggest CSOAI gap (whole dataset)</p>
            <span className="text-[10px] text-emerald-300/75">click to open the account →</span>
          </div>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {topGaps.map(({ a, s }, i) => (
              <button key={a.id} onClick={() => setSel(a)} className="flex items-center gap-2 rounded-lg bg-black/30 px-3 py-1.5 text-left hover:bg-black/50">
                <span className="w-4 shrink-0 font-mono text-[11px] text-amber-300/60">{i + 1}</span>
                <span className="flex-1 truncate text-[13px] font-semibold text-emerald-100">{a.name}</span>
                <span className={"shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold " + PLAY_META[a.play].tone}>{a.play}</span>
                <span className="shrink-0 font-mono text-[11px] font-bold text-amber-300">{s.totalGap}/21</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-500/20">
          <div className="flex items-center justify-between bg-[#05140d] px-4 py-2">
            <div className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/70">Live globe — {sel ? "flown to " + sel.name + " · " + sel.country : "pick an account to fly the market"}</div>
            <div className="flex items-center gap-3">
              {sel && <a href={"/brief?id=" + sel.id} className="text-[11px] font-semibold text-emerald-200 hover:underline">Open tailored brief →</a>}
            </div>
          </div>
          <iframe ref={globeRef} src="/globe3d.html" title="hive globe" loading="lazy" className="block h-[340px] w-full" style={{ border: 0 }} />
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {scored.map(({ a, s }) => {
            const pm = PLAY_META[a.play];
            return (
              <button key={a.id} onClick={() => setSel(a)} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4 text-left transition hover:border-emerald-400/40">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-black text-emerald-100">{a.name}</div>
                  <span className={"shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold " + pm.tone}>{a.play}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-emerald-300/75">{a.type} · {a.country} · {a.region}</div>
                <div className="mt-2 flex flex-wrap gap-1">{a.frameworks.slice(0, 5).map((f) => <span key={f} className="rounded bg-black/40 px-2 py-0.5 font-mono text-[10px] text-emerald-300/80">{f}</span>)}</div>
                {s.confidence === "authority" ? (
                  <div className="mt-2 text-[11px] text-emerald-300/75">authority · we implement their regime · posture: {a.posture}</div>
                ) : (
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-300/75">
                    <span>gap <b className="text-emerald-300">{s.totalGap}/21</b></span>
                    <span className={"rounded px-1.5 py-0.5 text-[9px] font-bold " + (s.confidence === "verified" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300")}>{s.confidence}</span>
                    {s.topUsps[0] && <span className="truncate text-emerald-300/75">lead: {s.topUsps[0]}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {sel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setSel(null)}>
            <div className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl border border-emerald-400/30 bg-[#05140d] p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between"><div className="text-lg font-black text-emerald-100">{sel.name}</div><button onClick={() => setSel(null)} className="text-emerald-300/75 hover:text-emerald-100">✕</button></div>
              <div className="mt-1 text-xs text-emerald-300/75">{sel.type} · {sel.country} · jurisdictions: {sel.jurisdictions.join(", ")}</div>
              <div className={"mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold " + PLAY_META[sel.play].tone}>{PLAY_META[sel.play].label}</div>

              <div className="mt-4 text-[11px] font-bold uppercase tracking-wide text-emerald-300/75">Side-by-side test rubric (live)</div>
              {scoreAccount(sel).confidence === "authority" ? (
                <p className="mt-2 rounded-lg bg-black/30 px-3 py-2 text-[12px] text-emerald-100/80">Rule-setting authority — play is <b>align</b>: CSOAI implements their regime ({sel.frameworks.join(", ")}) across the crosswalk. Not a displace/absorb target.</p>
              ) : (<>
                <div className="mt-2 space-y-1.5">
                  {scoreAccount(sel).perAxis.map((r) => (
                    <div key={r.key} className="flex items-center justify-between gap-3 rounded-lg bg-black/30 px-3 py-1.5 text-[13px]">
                      <span className="text-emerald-100/80">{r.label}</span>
                      <span className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-emerald-300/75">CSOAI {r.csoai}</span>
                        <span className="text-emerald-300/75">vs</span>
                        <span className="text-amber-300/80">them {r.current}</span>
                        {r.gap > 0 && <span className="rounded bg-emerald-500/15 px-1.5 font-bold text-emerald-300">+{r.gap}</span>}
                      </span>
                    </div>
                  ))}
                </div>
                {(() => { const sc = scoreAccount(sel); return sc.topUsps.length ? (
                  <p className="mt-2 text-[11px] text-emerald-300/70">Lead the demo with: <b className="text-emerald-200">{sc.topUsps.join(", ")}</b> · total gap {sc.totalGap}/{sc.maxGap} · <span className={sc.confidence === "verified" ? "text-emerald-300" : "text-amber-300"}>{sc.confidence}</span></p>
                ) : null; })()}
              </>)}

              <div className="mt-4 text-[11px] font-bold uppercase tracking-wide text-emerald-300/75">Tailored demo</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <a href={"/brief?id=" + sel.id} className="rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-black text-[#03110b] hover:bg-emerald-300">Open tailored brief →</a>
                <a href={"/crosswalk?fw=" + encodeURIComponent(sel.frameworks.join(","))} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-[#03110b] hover:bg-emerald-400">Crosswalk their {sel.frameworks.length} frameworks →</a>
                <a href={"/classifier?q=" + encodeURIComponent("A production AI system at " + sel.name + " (" + sel.type + (sel.sector ? ", " + sel.sector : "") + ") operating under " + (sel.jurisdictions.join("/") || "multiple regimes"))} className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-white/5">Classify their AI →</a>
                <a href="/agent-governance" className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-white/5">Agent governance →</a>
                <a href="/tool-commons" className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-white/5">Run the MCP live →</a>
              </div>
              <p className="mt-3 text-[11px] text-emerald-300/75">Org-level public data. Play is a pre-recon hypothesis until an account report is run. Source: {sel.source}.</p>
            </div>
          </div>
        )}

        <p className="mt-8 text-[11px] text-emerald-300/75">Seed dataset — real public organisations, honest fields ("unknown" where not yet researched). Individual contact data is handled only via connected, licensed B2B tools under a legitimate-interest basis. See docs/DISTRIBUTION_HIVE.md.</p>
      </div>
    </div>
  );
}
