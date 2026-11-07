import ControlEvidencePanel from "./ControlEvidencePanel";
import ObservatoryCoverage from "./ObservatoryCoverage";
import { useEffect, useId, useMemo, useState } from "react";
import { FRAMEWORK_LENSES, OBSERVATORY_VERSION, freshness, parseOrganisationEvidence, readObservatoryFilters, writeObservatoryFilters, selectAxes, type ObservatoryAxis, type OrganisationEvidence } from "@/lib/gspcObservatory";

const SOURCES = [
  { kind: "lab-artifact" as const, url: "/interop/lab-card-census-2026-09-17.json", label: "Lab evaluation-artifact census" },
  { kind: "gpai-notice" as const, url: "/interop/gpai-signatory-2026-09/index.json", label: "GPAI notice register" },
  { kind: "humanoid-deployment" as const, url: "/interop/humanoid-registry-unsigned.json", label: "Humanoid deployment register" },
];
const control = "min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600";
const link = "inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-semibold text-emerald-800 underline focus:outline-none focus:ring-2 focus:ring-emerald-600";

/** One board reader, two independent disclosure readers. No measurement/signing side effects. */
export default function LivingObservatory({ axes, boardError = null, boardLoaded = false, showInstrumentCards = true, onFilterChange }: { onFilterChange?: (value: { lens: string; query: string }) => void; axes: readonly ObservatoryAxis[]; boardError?: string | null; boardLoaded?: boolean; showInstrumentCards?: boolean }) {
  const prefix = useId();
  const initial = useMemo(() => readObservatoryFilters(typeof window === "undefined" ? "" : window.location.search), []);
  const [lens, setLens] = useState(initial.lens);
  const [query, setQuery] = useState(initial.query);
  const [scope, setScope] = useState(initial.scope);
  const [shareState, setShareState] = useState("");
  useEffect(() => {
    const readLocation = () => { const f = readObservatoryFilters(window.location.search); setLens(f.lens); setQuery(f.query); setScope(f.scope); setPage(0); };
    window.addEventListener("popstate", readLocation);
    return () => window.removeEventListener("popstate", readLocation);
  }, []);
  useEffect(() => {
    const next = writeObservatoryFilters(window.location.href, { lens, query, scope });
    if (next !== window.location.href) window.history.replaceState(window.history.state, "", next);
  }, [lens, query, scope]);
  async function copyView() {
    try { await navigator.clipboard.writeText(writeObservatoryFilters(window.location.href, { lens, query, scope })); setShareState("View link copied."); }
    catch { setShareState("Copy the current address from your browser to share this view."); }
  }
  const [records, setRecords] = useState<OrganisationEvidence[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true); setErrors([]); setRecords([]); setNow(Date.now());
    const timeout = window.setTimeout(() => ac.abort(), 12000);
    Promise.all(SOURCES.map(async s => {
      try {
        const r = await fetch(s.url, { signal: ac.signal, headers: { accept: "application/json" } });
        if (!r.ok || !(r.headers.get("content-type") ?? "").includes("application/json")) throw new Error(`HTTP ${r.status} or non-JSON response`);
        return { records: parseOrganisationEvidence(s.kind, await r.json()), error: null };
      } catch (e) { return { records: [], error: `${s.label}: ${e instanceof Error ? e.message : "unavailable"}` }; }
    })).then(results => {
      if (!active) return;
      setRecords(results.flatMap(r => r.records));
      setErrors(results.flatMap(r => r.error ? [r.error] : []));
      setLoading(false);
    }).finally(() => clearTimeout(timeout));
    let active = true;
    return () => { active = false; ac.abort(); clearTimeout(timeout); };
  }, [attempt]);
  useEffect(() => { onFilterChange?.({ lens, query }); }, [lens, query, onFilterChange]);
  const currentLens = FRAMEWORK_LENSES.find(l => l.id === lens)!;
  const selectedAxes = useMemo(() => selectAxes(axes, lens, query), [axes, lens, query]);
  const selectedRecords = useMemo(() => records.filter(r => (scope === "all" || r.kind === scope) &&
    `${r.name} ${r.subject}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)), [records, scope, query]);
  const pages = Math.max(1, Math.ceil(selectedRecords.length / 10));
  const shownPage = Math.min(page, pages - 1);
  return <section aria-labelledby={`${prefix}-title`} className="my-8 rounded-2xl border border-emerald-800/20 bg-white p-4 shadow-sm sm:p-6" data-testid="living-observatory">
    <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">GSPC · living evidence workspace</p>
    <h2 id={`${prefix}-title`} className="mt-2 text-2xl font-bold text-slate-950">Explore the evidence, not just the output.</h2>
    <p className="mt-2 text-sm leading-relaxed text-slate-700">Choose a framework to find relevant instruments. Inspect what organisations disclose separately from what tests establish. No composite company ranking is calculated from these registers.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold text-slate-800" htmlFor={`${prefix}-lens`}>Framework or topic lens
        <select id={`${prefix}-lens`} className={`${control} mt-1`} value={lens} onChange={e => setLens(e.target.value)}>{FRAMEWORK_LENSES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}</select>
      </label>
      <label className="text-sm font-semibold text-slate-800" htmlFor={`${prefix}-search`}>Search instruments and organisations
        <input id={`${prefix}-search`} type="search" maxLength={160} onKeyDown={e => { if (e.key === "Escape") { setQuery(""); setPage(0); } }} placeholder="For example: care, governance, a company" className={`${control} mt-1`} value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} />
      </label>
    </div>
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button type="button" className={link} onClick={() => { setLens("all"); setQuery(""); setScope("all"); setPage(0); }}>Reset filters</button>
      <button type="button" className={link} onClick={copyView}>Copy this view</button>
      <a className={link} href="/connect-gspc">Connect agents and evidence tools</a>
      <span role="status" className="text-xs text-slate-600">{shareState}</span>
    </div>
    <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><strong>{currentLens.kind}.</strong> {currentLens.note} {currentLens.id === "all" ? <span>Source: the existing board response.</span> : <a className="font-semibold underline" href={currentLens.source}>Source / context</a>}</p>
    <div aria-live="polite" className="mt-4 text-sm text-slate-700">
      {boardError ? "Board unavailable. No fallback scores are substituted." : !boardLoaded ? "Loading the existing board…" : `${selectedAxes.length} matching instruments from the board. A filtered view, not a new ranking.`}
    </div>
    {showInstrumentCards && <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {selectedAxes.map(a => <a key={a.axis} href={`/gspc/${encodeURIComponent(a.axis)}`} className="min-h-[64px] rounded-lg border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 hover:bg-emerald-50">
        <span className="block font-semibold text-slate-900">{a.bench || a.axis}</span>
        <span className="block text-xs text-slate-700">{a.axis} · {a.status || "STATUS NOT PROVIDED"} · {a.kind || (a.family === "financial" ? "fact instrument" : "see instrument method")}</span>
      </a>)}
    </div>}
    {boardLoaded && !boardError && !selectedAxes.length && <p className="mt-3 text-sm text-slate-600">No matching instrument. Missing coverage is not a failing score.</p>}
    <details className="mt-5 rounded-xl border border-slate-200 p-4">
      <summary className="min-h-[44px] cursor-pointer text-base font-bold text-slate-900">Organisational evidence · labs and humanoid deployments</summary>
      <p className="mb-3 text-sm text-slate-700">This register is independent of the topic lens above. Each row describes a notice or deployment, not a unique audited company. Listed organisations are not thereby partners or customers.</p>
      <label htmlFor={`${prefix}-scope`} className="text-sm font-semibold">Evidence collection
        <select id={`${prefix}-scope`} className={`${control} mt-1`} value={scope} onChange={e => { setScope(e.target.value); setPage(0); }}>
          <option value="all">All evidence records</option><option value="lab-artifact">Lab system cards and evaluation evidence</option><option value="gpai-notice">GPAI public-list notices</option><option value="humanoid-deployment">Humanoid deployments</option>
        </select>
      </label>
      <p role="status" className="my-3 text-sm">{loading ? "Loading source registers…" : `${selectedRecords.length} matching evidence records; not independently verified organisational safety assessments.`}</p>
      {errors.length > 0 && <div role="alert" className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm"><p>Some sources could not be read. Coverage is partial.</p>{errors.map(e => <p key={e}>{e}</p>)}<button type="button" className={link} onClick={() => setAttempt(a => a + 1)}>Retry source reads</button></div>}
      {!loading && !selectedRecords.length && <p>No records matched. No organisation has been assigned a zero score.</p>}
      <div className="space-y-3">{selectedRecords.slice(shownPage * 10, (shownPage + 1) * 10).map(r => <article key={r.id} className="rounded-xl border border-slate-200 p-3">
        <h3 className="font-bold text-slate-900">{r.name}</h3><p className="text-sm text-slate-700">{r.subject}</p>
        <p className="mt-1 text-xs font-semibold text-slate-700">Recorded disclosure: {r.disclosure} · ORGANISATIONAL ASSESSMENT NOT PERFORMED</p>
        <p className="mt-1 text-xs text-slate-600">Register as of {r.observedAt || "not recorded"} · {now === null ? "freshness pending" : freshness(r.observedAt, now)} (7-day display window, not continuous source verification)</p>
        <p className="mt-2 text-sm text-slate-700">{r.qualification}</p>
        {r.labChecks && <details className="mt-3 rounded-lg border border-slate-200 p-3">
          <summary className="min-h-[44px] cursor-pointer font-semibold">Inspect five evidence checks</summary>
          <p className="text-xs text-slate-600">Recorded states below are attributed to the dated census. NO means absent in its stated search scope, not unsafe. UNCHECKABLE is not NO. This page does not re-run those checks.</p>
          <dl className="mt-3 space-y-3">{r.labChecks.map(c => <div key={c.id} className="border-t border-slate-200 pt-3"><dt className="font-semibold">{c.label} · recorded {c.state}</dt><dd className="mt-1 whitespace-pre-line break-words text-sm text-slate-700">{c.note || "No separate qualification supplied; consult the retained census."}</dd><dd><details className="mt-1"><summary className="min-h-[44px] cursor-pointer text-sm underline">Census evidence narrative</summary><p className="whitespace-pre-line break-words text-sm text-slate-700">{c.evidence || "No evidence narrative supplied."}</p></details></dd></div>)}</dl>
          {r.artifacts && <details className="mt-3"><summary className="min-h-[44px] cursor-pointer text-sm font-semibold">Source artefacts ({r.artifacts.length})</summary><div className="flex flex-col">{r.artifacts.map((u, i) => <a key={`${u}-${i}`} href={u} className={`${link} break-all`}>Source {i + 1}: {new URL(u, "https://councilof.ai").hostname}</a>)}</div></details>}
        </details>}
        {r.source && <a className={link} href={r.source}>Primary source</a>}{r.receipt && <a className={link} href={r.receipt}>Retained notice</a>}
      </article>)}</div>
      {pages > 1 && <div className="mt-3 flex items-center justify-between gap-2"><button type="button" className={link} disabled={shownPage === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Previous</button><span className="text-sm">Page {shownPage + 1} of {pages}</span><button type="button" className={link} disabled={shownPage + 1 >= pages} onClick={() => setPage(p => p + 1)}>Next</button></div>}
    </details>
    <ControlEvidencePanel lens={lens} />
    <ObservatoryCoverage />
    <details className="mt-3 rounded-xl border border-slate-200 p-4">
      <summary className="min-h-[44px] cursor-pointer text-base font-bold text-slate-900">CARE, the Charter and human evidence cups</summary>
      <p className="text-sm text-slate-700">The two cups distinguish human participation from independent evaluator evidence on the same instrument. Each marble requires a scoped observation, a reviewed receipt, an instrument and system revision, and an expiry. Trust does not confer human rights, establish consciousness or bypass consent.</p>
      <div className="my-4 grid gap-4 sm:grid-cols-2">{["Human participation evidence", "Independent evaluator evidence"].map(label => <div key={label} className="rounded-b-3xl border-2 border-t-0 border-emerald-800/40 p-5 text-center"><h3 className="font-semibold">{label}</h3><p className="mt-3 text-sm">No admitted contextual receipts</p><p className="text-xs text-slate-600">Unmeasured — not zero trust</p></div>)}</div>
      <p className="text-sm text-slate-700">No admitted human-study receipt feed is connected here yet. Published model scores and company disclosures do not fill human-study cups. The earlier reciprocal-trust prototype is not this study instrument. Human consent, independence checks and correction history are required before these cups can fill.</p>
      <nav aria-label="Care evidence and principles" className="mt-2 flex flex-wrap"><a className={link} href="/maternal-covenant">Maternal Covenant</a><a className={link} href="/charter">Partnership Charter and articles</a><a className={link} href="/gspc/care">CARE instrument</a><a className={link} href="/gspc-verify">Verify evidence</a><a className={link} href="/layer0">Layer 0</a></nav>
    </details>
    <p className="mt-4 text-xs text-slate-600">Projection version {OBSERVATORY_VERSION}. Source records keep their original dates and states. This view does not sign, publish, award certification, alter the board or authorise agent actions.</p>
  </section>;
}
