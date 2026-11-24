import { useEffect, useState } from "react";
import { ExternalLink, ShieldAlert, Activity, FileClock } from "lucide-react";
import {
  SIGNAL_SOURCES, parseCorrections, parseFabric, parseOversight,
  type CorrectionView, type FabricView, type OversightView,
} from "@/lib/worldSignals";

type SourceName = keyof typeof SIGNAL_SOURCES;
type Read<T> = { state: "loading" | "ready" | "unavailable"; data: T | null; error: string | null; sha256?: string; readAt?: string };
const EMPTY = { state: "loading", data: null, error: null } as const;
const PUBLIC_ONLY = "Read-only public source projection. Presence here is not independent verification, an accepted incident, authenticated human authority, or a newly performed measurement.";

export default function CouncilWorldSignals() {
  const [corrections, setCorrections] = useState<Read<CorrectionView>>(EMPTY);
  const [fabric, setFabric] = useState<Read<FabricView>>(EMPTY);
  const [oversight, setOversight] = useState<Read<OversightView>>(EMPTY);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"corrections" | "fabric" | "oversight">("corrections");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    const load = async (key: SourceName) => {
      const set = key === "corrections" ? setCorrections : key === "fabric" ? setFabric : setOversight;
      try {
        const response = await fetch(SIGNAL_SOURCES[key], {
          cache: "no-store", signal: controller.signal,
          headers: { accept: "application/json" },
        });
        if (!response.ok) throw new Error("HTTP " + response.status);
        // Source shapes and claims must be validated before they reach the interface.
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength > 1_500_000) throw new Error("SOURCE_SIZE_LIMIT");
        const raw: unknown = JSON.parse(new TextDecoder().decode(bytes));
        const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
        const sha256 = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
        const parsed = key === "corrections" ? parseCorrections(raw) :
          key === "fabric" ? parseFabric(raw) : parseOversight(raw);
        if (!controller.signal.aborted) (set as (v: unknown) => void)({ state: "ready", data: parsed, error: null, sha256, readAt: new Date().toISOString() });
      } catch (err) {
        if (!controller.signal.aborted) (set as (v: unknown) => void)({
          state: "unavailable", data: null,
          error: err instanceof Error ? err.message.slice(0, 110) : "Invalid source",
        });
      }
    };
    // Exactly three public GETs, once on mount, never while the World Lens is closed.
    void Promise.all((Object.keys(SIGNAL_SOURCES) as SourceName[]).map(load));
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, []);

  const correctionRecords = corrections.data?.items.filter((item) => {
    const q = query.toLowerCase().trim();
    return !q || [item.id, item.error, item.change, item.date, item.state].some((value) => value.toLowerCase().includes(q));
  }) ?? [];
  const fabricRails = fabric.data?.rails.filter((rail) => {
    const q = query.toLowerCase().trim();
    return !q || [rail.id, rail.title, rail.role, rail.state, rail.description].some((value) => value.toLowerCase().includes(q));
  }) ?? [];
  const active = kind === "corrections" ? corrections : kind === "fabric" ? fabric : oversight;

  return (
    <div className="min-h-[410px] bg-[#f8fcfa] p-4 text-slate-900 sm:min-h-[520px]" data-testid="world-signals">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-emerald-950">
        <Activity className="h-5 w-5"/> Public signals &amp; oversight
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-700">{PUBLIC_ONLY}</p>

      <div className="mt-3 grid grid-cols-3 gap-2" aria-label="Public source readback">
        {([
          ["corrections", "Corrections", corrections],
          ["fabric", "Fabric rails", fabric],
          ["oversight", "H.I.M. oversight", oversight],
        ] as const).map(([id, label, value]) => (
          <button key={id} type="button" aria-pressed={kind === id}
            onClick={() => {setKind(id);setQuery("");}}
            className={"min-w-0 rounded-lg border p-2 text-left focus-visible:outline-2 focus-visible:outline-emerald-700 " +
              (kind === id ? "border-emerald-700 bg-emerald-800 text-white" :
                "border-emerald-200 bg-white text-slate-800 hover:border-emerald-500")}>
            <span className="block text-[10px] font-semibold sm:text-xs">{label}</span>
            <span className="mt-1 block text-lg font-semibold tabular-nums">
              {value.state === "ready" ?
                id === "corrections" ? corrections.data?.items.length :
                  id === "fabric" ? fabric.data?.rails.length : oversight.data?.pending ?? "—"
                : value.state === "unavailable" ? "?" : "…"}
            </span>
            <span className="block text-[9px] opacity-80">
              {id === "oversight" ? "pending requests, source-reported" : "public records, source-reported"}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2.5">
        <p role="status" className="text-[11px] text-slate-700">
          {active.state === "ready" ? "Public source parsed. Not independently attested by this viewer." :
            active.state === "unavailable" ? "Source UNCHECKABLE: " + active.error :
              "Reading public source…"}
        </p>
        <a className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 underline"
          href={SIGNAL_SOURCES[kind]}>Inspect original JSON <ExternalLink className="h-3 w-3"/></a>
      </div>

      {active.state === "ready" && active.sha256 && (
        <p className="mt-2 break-all rounded-lg border border-emerald-100 bg-white p-2 font-mono text-[10px] text-slate-700" data-testid="world-source-fingerprint">
          SHA-256 of exactly fetched response bytes: {active.sha256}
          <span className="mt-1 block font-sans text-[10px] text-slate-600">
            Browser read time {active.readAt ?? "unknown"}. This hash is a local fingerprint, not a source signature, OTS anchor or independent witness.
          </span>
        </p>
      )}

      {active.state === "ready" && kind !== "oversight" && (
        <label className="mt-3 block text-xs font-semibold text-slate-700">
          Search source-linked {kind === "corrections" ? "corrections" : "capabilities"}
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={140}
            placeholder={kind === "corrections" ? "ID, change, source date…" : "MCP, AG-UI, GSPC, state…"}
            className="mt-1 block w-full rounded-lg border border-emerald-200 bg-white p-2 text-sm" />
        </label>
      )}

      {kind === "corrections" && corrections.data && (
        <>
          <p className="mt-2 text-[11px] text-slate-700">
            Ledger signature claim: <strong>{corrections.data.signatureClaim}</strong> (reported by the source; not independently checked in this screen).
            Corrections describe CSOAI record maintenance, not all world incidents.
          </p>
          <div className="mt-2 grid max-h-[330px] gap-2 overflow-y-auto" data-testid="world-correction-records">
            {correctionRecords.map(item => (
              <article key={item.id} className="rounded-xl border border-emerald-100 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="font-mono text-xs text-emerald-900">{item.id}</strong>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">{item.state}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-600">
                  Record date {item.date} · publication {item.publishedAt ?? "NOT RECORDED"}
                </p>
                <p className="mt-2 text-xs text-slate-800">{item.error}</p>
                <p className="mt-1 text-xs text-emerald-950">{item.change}</p>
                <p className="mt-1 text-[10px] text-slate-600">Source-reported · NON-GEOSPATIAL · no independent finding inferred</p>
              </article>
            ))}
            {!correctionRecords.length && <p className="rounded-lg bg-white p-3 text-xs">No matching public correction records.</p>}
          </div>
          <a href="/dashboard?tab=corrections" className="mt-3 inline-block text-xs font-semibold text-emerald-800 underline">
            Open full Council corrections and evidence
          </a>
        </>
      )}

      {kind === "fabric" && fabric.data && (
        <>
          <p className="mt-2 text-[11px] text-slate-700">
            Source observation {fabric.data.observedAt}. A runtime-observed listing is not an executed tool call or independently verified effect.
          </p>
          <div className="mt-2 grid max-h-[330px] gap-2 overflow-y-auto sm:grid-cols-2" data-testid="world-fabric-records">
            {fabricRails.map(rail => (
              <article key={rail.id} className="rounded-xl border border-emerald-100 bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <strong className="text-xs text-emerald-900">{rail.title}</strong>
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[9px] text-slate-700">{rail.state.replace(/_/g, " ")}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-600">{rail.role}</p>
                <p className="mt-2 text-xs text-slate-800">{rail.description}</p>
                {rail.destination && <a href={rail.destination} className="mt-2 inline-block text-[11px] font-semibold text-emerald-800 underline">Inspect declared endpoint</a>}
                <p className="mt-1 text-[10px] text-slate-500">Writes GSPC board: no · Source-reported · NON-GEOSPATIAL</p>
              </article>
            ))}
            {!fabricRails.length && <p className="rounded-lg bg-white p-3 text-xs">No matching fabric records.</p>}
          </div>
          <a href="/dashboard?tab=fabric" className="mt-3 inline-block text-xs font-semibold text-emerald-800 underline">
            Open the original Council capability fabric
          </a>
        </>
      )}

      {kind === "oversight" && oversight.data && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-white p-4" data-testid="world-oversight-caveat">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-950">
            <ShieldAlert className="h-4 w-4"/> H.I.M. state is not proof of a qualified human decision
          </h4>
          <p className="mt-2 text-xs text-slate-800">
            Decision-recording path: <strong>{oversight.data.decisionPath}</strong> · Storage bound:
            <strong> {oversight.data.storeBound === true ? "yes" : oversight.data.storeBound === false ? "no" : "not reported"}</strong>.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-amber-50 p-2"><span className="text-[10px] text-slate-700">Source-reported pending</span><p className="text-xl font-semibold tabular-nums">{oversight.data.pending ?? "—"}</p></div>
            <div className="rounded-lg bg-amber-50 p-2"><span className="text-[10px] text-slate-700">Source-reported approved decisions</span><p className="text-xl font-semibold tabular-nums">{oversight.data.approved ?? "—"}</p></div>
          </div>
          <p className="mt-3 text-xs text-amber-950">
            Operator identity: {oversight.data.identity} · Human presence: {oversight.data.humanPresence} · Professional competence: {oversight.data.professionalCompetence}.
          </p>
          <p className="mt-1 text-xs font-semibold text-amber-950">
            Independent execution authority: NOT ESTABLISHED. No public challenge descriptions or participant identities are replicated here.
          </p>
          <p className="mt-2 text-xs text-slate-700">{oversight.data.note}</p>
          <a href="/dashboard?tab=staff" className="mt-3 inline-block text-xs font-semibold text-emerald-800 underline">
            Inspect the existing staff and human-review console
          </a>
        </div>
      )}

      <p className="mt-3 flex items-center gap-1 text-[10px] text-slate-600">
        <FileClock className="h-3 w-3"/> This view does not request payments, run compute, file incidents, contact regulators, or create human approvals.
      </p>
    </div>
  );
}
