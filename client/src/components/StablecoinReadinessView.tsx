import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Database, ExternalLink, Search } from "lucide-react";
import {
  filterStablecoinReadiness,
  loadStablecoinReadiness,
  stablecoinEvidenceFlags,
  type StablecoinReadiness,
  type StablecoinReadinessAsset,
} from "@/lib/stablecoinReadiness";
import {
  loadStablecoinPromotionQueue,
  type StablecoinPromotionQueue,
} from "@/lib/stablecoinPromotionQueue";

type Filter = "ALL" | "MEASURED" | "UNMEASURED" | "REVIEW";

const shortState = (state: string) => state.replaceAll("_", " ").toLocaleLowerCase();

function StatePill({ active, children }: { active: boolean; children: ReactNode }) {
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${active ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{children}</span>;
}

function AssetDetail({ asset, data }: { asset: StablecoinReadinessAsset; data: StablecoinReadiness }) {
  const measured = asset.measurement.state === "MEASURED";
  const proof = data.shared_evidence.index_commitment;
  return (
    <aside className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-slate-100" data-testid="stablecoin-readiness-detail">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs uppercase tracking-wider text-emerald-300">Evidence drill-down</p><h4 className="mt-1 text-xl font-bold">{asset.name} <span className="text-slate-400">{asset.symbol}</span></h4></div>
        <StatePill active={measured}>{asset.measurement.state}</StatePill>
      </div>
      <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
        <div><dt className="text-slate-400">Measurement depth</dt><dd className="mt-1 font-mono">{shortState(asset.measurement.depth)}</dd></div>
        <div><dt className="text-slate-400">Freshness</dt><dd className="mt-1 font-mono">{asset.measurement.as_of || shortState(asset.measurement.freshness)}</dd></div>
        <div><dt className="text-slate-400">Signature</dt><dd className="mt-1">{shortState(asset.signature_state)}</dd></div>
        <div><dt className="text-slate-400">Current root</dt><dd className="mt-1">{shortState(asset.root_state)}</dd></div>
        <div><dt className="text-slate-400">External witness</dt><dd className="mt-1">{shortState(asset.anchor_state)}</dd></div>
        <div><dt className="text-slate-400">Payment</dt><dd className="mt-1">{shortState(asset.x402_door_state)}</dd></div>
      </dl>
      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-300">Indexed chain entries ({asset.chain_deployment_count})</p>
        <div className="mt-2 flex max-h-28 flex-wrap gap-1.5 overflow-auto" aria-label={`${asset.name} indexed chains`}>
          {asset.chains.map((chain) => <span key={chain} className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-300">{chain}</span>)}
        </div>
      </div>
      {asset.correction_lineage.state !== "NONE_DECLARED" && <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-100"><div className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" />{shortState(asset.correction_lineage.state)}</div><p className="mt-1 leading-relaxed">{asset.correction_lineage.note}</p></div>}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {asset.measurement.evidence_urls.map((url) => <a key={url} className="underline text-emerald-300" href={url}>Measurement card <ExternalLink className="inline h-3 w-3" /></a>)}
        <a className="underline text-emerald-300" href={proof.commitment_card_url}>Index commitment <ExternalLink className="inline h-3 w-3" /></a>
        {proof.rekor.url && <a className="underline text-emerald-300" href={proof.rekor.url}>Rekor #{proof.rekor.log_index} <ExternalLink className="inline h-3 w-3" /></a>}
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-slate-400">{proof.scope} {proof.opentimestamps.truth_rule} A signature proves integrity, not safety or legal conformity.</p>
    </aside>
  );
}

export default function StablecoinReadinessView() {
  const [data, setData] = useState<StablecoinReadiness | null>(null);
  const [queue, setQueue] = useState<StablecoinPromotionQueue | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    loadStablecoinReadiness(controller.signal).then((value) => { setData(value); setSelectedId(value.assets.find((asset) => asset.measurement.state === "MEASURED")?.id || value.assets[0]?.id || null); }).catch((reason: Error) => { if (reason.name !== "AbortError") setError(reason.message); });
    loadStablecoinPromotionQueue(controller.signal).then(setQueue).catch(() => { /* readiness remains usable if the operational queue is unavailable */ });
    return () => controller.abort();
  }, []);
  const shown = useMemo(() => filterStablecoinReadiness(data?.assets || [], query, filter), [data, query, filter]);
  const selected = data?.assets.find((asset) => asset.id === selectedId) || shown[0];
  if (error) return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Stablecoin readiness is unavailable: {error}. No fallback counts are shown.</div>;
  if (!data) return <div className="rounded-xl border border-slate-200 p-6 text-sm text-slate-500">Loading the signed readiness catalog…</div>;
  const c = data.coverage;
  return (
    <section id="stablecoins" className="space-y-4" data-testid="stablecoin-readiness-view">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Stablecoin evidence readiness</p><h3 className="mt-1 text-2xl font-bold text-slate-950">One catalog. Every gap visible.</h3><p className="mt-1 max-w-3xl text-sm text-slate-600">{data.purpose}</p></div>
        <div className="flex flex-wrap gap-3 text-xs font-semibold text-emerald-800"><a href="/interop/stablecoin-universe-2026-09/readiness.json" className="underline">Evidence ledger JSON</a><a href="/interop/stablecoin-universe-2026-09/promotion-queue.json" className="underline">Evidence execution queue</a></div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {[
          ["Indexed", c.indexed_assets], ["Deployments", c.indexed_chain_deployments], ["Chains", c.distinct_asset_reported_chains], ["Measured", c.deeply_measured_assets],
          ["Signed", c.asset_measurements_signed], ["Rooted", c.asset_measurements_current_root_included], ["Bitcoin anchored", c.asset_measurements_bitcoin_anchored_via_current_root], ["Settled", c.asset_specific_x402_settlements_verified],
        ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-3"><div className="text-xl font-black text-slate-950">{value}</div><div className="text-[11px] text-slate-500">{label}</div></div>)}
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950"><b>{c.unmeasured_assets} assets remain independently unmeasured.</b> All rows are discoverable metadata, but the generic A2A, MCP and x402 routes do not mean each asset has its own integration or paid settlement.</div>
      {queue && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-950" data-testid="stablecoin-promotion-queue-summary"><b>The promotion queue covers all {queue.population} assets.</b> {queue.counts.primary_source_registered} have a registered primary source, {queue.counts.deep_probed} have fresh or archived deep-probe evidence, and {queue.next_action_counts.REGISTER_PRIMARY_SOURCES || 0} currently require source registration before deeper work. The daily round produces evidence; it never upgrades a row from a payment or catalog listing.</div>}
      {data.discovery_candidates.length > 0 && <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs leading-relaxed text-sky-950"><b>{data.discovery_candidates.length} post-freeze discovery candidate.</b> {data.discovery_candidates.map((candidate) => <span key={candidate.id}> <a className="font-semibold underline" href={candidate.source.url}>{candidate.symbol}</a> is issuer-reported on {candidate.reported_chain}, but remains outside this signed frozen index and independently unmeasured.</span>)}</div>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.75fr)]">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-2 border-b border-slate-200 p-3 sm:flex-row">
            <label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><span className="sr-only">Search assets or chains</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search asset, symbol, id or chain" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm" /></label>
            <select aria-label="Filter evidence state" value={filter} onChange={(event) => setFilter(event.target.value as Filter)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="ALL">All evidence states</option><option value="MEASURED">Measured</option><option value="UNMEASURED">Unmeasured</option><option value="REVIEW">Semantic review</option></select>
          </div>
          <div className="max-h-[34rem] overflow-auto">
            <table className="w-full min-w-[58rem] border-collapse text-left text-xs"><thead className="sticky top-0 bg-slate-100 text-slate-600"><tr>{["Asset", "Deployments", "Measured", "Signature", "Root", "Witness / anchor", "A2A · MCP", "x402 / settlement"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead><tbody>{shown.map((asset) => {
              const { measured, signed, rooted, settled } = stablecoinEvidenceFlags(asset);
              return <tr key={asset.id} className={`border-t border-slate-100 hover:bg-emerald-50/50 ${selected?.id === asset.id ? "bg-emerald-50" : ""}`}><td className="px-3 py-2"><button type="button" className="text-left focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600" onClick={() => setSelectedId(asset.id)} aria-pressed={selected?.id === asset.id}><b>{asset.symbol}</b><div className="max-w-40 truncate text-slate-500">{asset.name}</div></button></td><td className="px-3 py-2">{asset.chain_deployment_count}</td><td className="px-3 py-2"><StatePill active={measured}>{shortState(asset.measurement.state)}</StatePill></td><td className="px-3 py-2"><StatePill active={signed}>{shortState(asset.signature_state)}</StatePill></td><td className="px-3 py-2"><StatePill active={rooted}>{shortState(asset.root_state)}</StatePill></td><td className="max-w-40 px-3 py-2 text-slate-600">{shortState(asset.anchor_state)}</td><td className="max-w-44 px-3 py-2 text-slate-500">{shortState(asset.a2a_discovery_state)} · {shortState(asset.mcp_discovery_state)}</td><td className="max-w-44 px-3 py-2"><StatePill active={settled}>{shortState(asset.x402_door_state)}</StatePill></td></tr>;
            })}</tbody></table>
            {!shown.length && <div className="p-8 text-center text-sm text-slate-500">No assets match this search and evidence filter.</div>}
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-[11px] text-slate-500"><span>{shown.length} of {data.assets.length} assets shown</span><span className="flex items-center gap-1"><Database className="h-3 w-3" /> Frozen {new Date(data.as_of).toLocaleString()}</span></div>
        </div>
        {selected && <AssetDetail asset={selected} data={data} />}
      </div>
    </section>
  );
}
