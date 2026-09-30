import { useEffect, useState, type ReactNode } from "react";
import {
  CORPUS_RELATION,
  DETERMINATION_NAMES,
  PARITY_MEANING,
  READINESS_URL,
  SUPPLY_INDEX_URL,
  XL_DATASET_URL,
  XL_SIGNED_URL,
  XL_URL,
  crossLedgerSummary,
  loadReadinessFigure,
  loadSupplyReadFigure,
  loadXl,
  parityFigure,
  type LoadedXl,
  type ReadinessFigure,
  type SupplyReadFigure,
} from "@/lib/stablecoinCorpusRelation";

export type Slot<T> = { state: "loading" } | { state: "ok"; value: T } | { state: "unavailable"; reason: string };

function useSlot<T>(load: (signal: AbortSignal) => Promise<T>): Slot<T> {
  const [slot, setSlot] = useState<Slot<T>>({ state: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal)
      .then((value) => { if (!controller.signal.aborted) setSlot({ state: "ok", value }); })
      .catch((e: Error) => { if (!controller.signal.aborted) setSlot({ state: "unavailable", reason: e?.message || "could not be read" }); });
    return () => controller.abort();
  }, [load]);
  return slot;
}

const day = (iso: string) => iso.slice(0, 10);

function Figure<T>({ slot, render }: { slot: Slot<T>; render: (v: T) => ReactNode }) {
  if (slot.state === "loading") return <p className="mt-3 text-sm text-slate-500">Reading the source file…</p>;
  if (slot.state === "unavailable")
    return <p className="mt-3 text-sm text-rose-800"><b>UNMEASURED here:</b> the source could not be read just now ({slot.reason}). No fallback figure is shown.</p>;
  return <>{render(slot.value)}</>;
}

function Card({ id, label, unit, source, children }: { id: (typeof CORPUS_RELATION.corpora)[number]; label: string; unit: string; source: string; children: ReactNode }) {
  const named = DETERMINATION_NAMES?.[id];
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-corpus={id}>
      <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-700">{id}{named ? ` · ${named}` : ""}</p>
      <h3 className="mt-1 text-lg font-bold">{label}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">Counts: {unit}</p>
      {children}
      <p className="mt-3 break-all text-xs"><a className="font-semibold text-emerald-800 underline" href={source}>{source}</a></p>
    </article>
  );
}

const loadXlOnce = (signal: AbortSignal) => loadXl(signal);
const loadReadiness = () => loadReadinessFigure();
const loadSupply = (signal: AbortSignal) => loadSupplyReadFigure(signal);

/** The block as rendered from three independently loaded slots (pure: the tests render it from real files). */
export function CorpusRelationView({ readiness, supply, xl }: { readiness: Slot<ReadinessFigure>; supply: Slot<SupplyReadFigure>; xl: Slot<LoadedXl> }) {
  return (
    <>
      <section id="corpus_relation" aria-labelledby="corpus-relation-heading" className="mx-auto max-w-7xl px-5 pb-10" data-testid="stablecoin-corpus-relation">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">corpus_relation: {CORPUS_RELATION.relation}</p>
        <h2 id="corpus-relation-heading" className="mt-2 text-2xl font-black">Three stablecoin figures, three different things</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          This page reports readiness, a dated supply read and a daily cross-ledger parity read. {CORPUS_RELATION.why} They
          are never {CORPUS_RELATION.never.join(", never ")}.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Card id="readiness" label="Readiness" unit="assets in the frozen discovery index that carry asset-level measurement evidence" source={READINESS_URL}>
            <Figure slot={readiness} render={(r) => (
              <p className="mt-3 text-sm leading-6"><b className="text-2xl font-black">{r.measured_assets}</b> of {r.indexed_assets} indexed assets. The index was frozen on {day(r.as_of)}; being indexed is not being measured.</p>
            )} />
          </Card>
          <Card id="supply_read" label="Supply read" unit="assets with at least one deployment whose on-chain supply figure was read at a named block" source={SUPPLY_INDEX_URL}>
            <Figure slot={supply} render={(s) => (
              <>
                <p className="mt-3 text-sm leading-6"><b className="text-2xl font-black">{s.assets_read}</b> of {s.universe_assets} assets, read once on {day(s.as_of)} and not refreshed since.</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  By reader: {s.by_reader.map((r) => `${r.reader} ${r.assets}`).join(", ")}. The file checks that no asset appears under two readers
                  (result: {s.disjointness}) before it states the figure above. It is a count of assets, not a sum of supply.
                </p>
              </>
            )} />
          </Card>
          <Card id="parity" label="Parity" unit="assets in the newest signed cross-ledger record, one issuer-list parity state each" source={XL_URL}>
            <Figure slot={xl} render={(x) => {
              const p = parityFigure(x.record);
              return (
                <>
                  <ul className="mt-3 space-y-1 text-sm">
                    {p.states.map((t) => <li key={t.state}><b className="font-black">{t.n}</b> <span className="font-mono text-xs font-bold">{t.state}</span>{PARITY_MEANING[t.state] ? <span className="text-slate-600"> — {PARITY_MEANING[t.state]}</span> : null}</li>)}
                  </ul>
                  <p className="mt-2 text-xs leading-5 text-slate-600">Of {p.assets} assets in the record dated {p.date}. A state belongs to an asset, not to its issuer, and is never a verdict on reserves.</p>
                </>
              );
            }} />
          </Card>
        </div>
        <details className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-xs">
          <summary className="cursor-pointer font-semibold text-slate-700">Machine-readable corpus_relation</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-slate-700">{JSON.stringify({ corpus_relation: { ...CORPUS_RELATION, sources: { readiness: READINESS_URL, supply_read: SUPPLY_INDEX_URL, parity: XL_URL } } }, null, 2)}</pre>
        </details>
      </section>

      <section id="cross-ledger" aria-labelledby="cross-ledger-heading" className="mx-auto max-w-7xl px-5 pb-12" data-testid="stablecoin-cross-ledger">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Daily · signed · free to read</p>
        <h2 id="cross-ledger-heading" className="mt-2 text-2xl font-black">Cross-ledger reads: each issuer's own list against each ledger</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Once a day, the cross-ledger record reads every deployment an issuer's own page lists and asks each ledger for its supply
          figure, labelling every read by the strength of its evidence. The record is signed and published as new dated files;
          <code className="mx-1 rounded bg-slate-100 px-1">{XL_URL}</code> serves it byte for byte, only after the signature verifies.
        </p>
        <Figure slot={xl} render={(x) => {
          const s = crossLedgerSummary(x.record);
          return (
            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-slate-500">Record</dt><dd className="font-mono">{s.date}{x.version ? ` (${x.version})` : ""}, read {s.as_of}</dd></div>
                  <div><dt className="text-xs text-slate-500">Signature</dt><dd className="font-mono">{x.signature}</dd></div>
                  <div><dt className="text-xs text-slate-500">Assets in the record</dt><dd><b>{s.assets_in_record}</b></dd></div>
                  <div><dt className="text-xs text-slate-500">Deployments read</dt><dd><b>{s.deployments_read}</b></dd></div>
                  {s.selection.k != null && s.selection.frame_n != null && <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Selection rule</dt><dd>{s.selection.k} of {s.selection.frame_n} candidates by value — a rule for what to read first, not a measurement{s.selection.added_by_name ? `; ${s.selection.added_by_name} more added by name` : ""}</dd></div>}
                  <div><dt className="text-xs text-slate-500">Selected, no issuer list wired yet</dt><dd><b>{s.selected_without_issuer_list}</b> UNMEASURED — not zero, not absent</dd></div>
                  <div><dt className="text-xs text-slate-500">Not read, each with its reason</dt><dd><b>{s.not_read}</b> UNCHECKABLE</dd></div>
                  {s.changes && <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Against the previous record ({s.changes.previous})</dt><dd>{s.changes.deployments_added ?? "—"} deployments added, {s.changes.deployments_removed ?? "—"} removed</dd></div>}
                </dl>
                {x.sha256 && <p className="mt-3 break-all font-mono text-[11px] text-slate-500">sha256 {x.sha256}</p>}
                {x.record.measurement_only && <p className="mt-3 text-xs leading-5 text-slate-600">{x.record.measurement_only}</p>}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-bold">Reads by evidence kind</h3>
                <ul className="mt-2 space-y-2 text-xs leading-5">
                  {s.evidence_kinds.map((k) => (
                    <li key={k.state}>
                      <b className="text-sm">{k.n}</b> <span className="font-mono font-bold">{k.state}</span>
                      {x.record.evidence_kind_legend?.[k.state] && <span className="block text-slate-600">{x.record.evidence_kind_legend[k.state].slice(0, 220)}{x.record.evidence_kind_legend[k.state].length > 220 ? "…" : ""}</span>}
                    </li>
                  ))}
                </ul>
                {x.record.consensus_check && <p className="mt-3 text-xs text-slate-600">{Object.values(x.record.consensus_check).join(" ")}</p>}
              </div>
            </div>
          );
        }} />
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6">
          <h3 className="font-bold">Read it and check it yourself</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-700">
            <li>Download the record from <a className="underline" href={XL_URL}>{XL_URL}</a> and its signed wrapper from <a className="underline" href={XL_SIGNED_URL}>{XL_SIGNED_URL}</a> (both free; the same files are on <a className="underline" href={XL_DATASET_URL}>Hugging Face</a>).</li>
            <li>The sha256 of the record must equal <code>payload.artifact.sha256</code> in the wrapper.</li>
            <li>Verify <code>signature.sig_ed25519</code> over the canonical payload with the <code>#board-attestation-1</code> key in <a className="underline" href="https://csoai.org/.well-known/did.json">did.json</a>.</li>
          </ol>
          <p className="mt-3 text-xs text-slate-600">
            Per-deployment pages, where a finding with a pending correction is withheld: <a className="underline" href="/stablecoins/deployments/">/stablecoins/deployments/</a>.
            The values are each ledger's own supply figure (totalSupply() or its equivalent), not issued or outstanding supply,
            reserves or redeemability. Nothing here is investment advice, and issuers are never ranked.
          </p>
        </div>
      </section>
    </>
  );
}

export default function StablecoinCorpusRelation() {
  const readiness = useSlot<ReadinessFigure>(loadReadiness);
  const supply = useSlot<SupplyReadFigure>(loadSupply);
  const xl = useSlot<LoadedXl>(loadXlOnce);
  return <CorpusRelationView readiness={readiness} supply={supply} xl={xl} />;
}
