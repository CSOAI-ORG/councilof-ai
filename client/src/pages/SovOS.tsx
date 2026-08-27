// SOV OS — the workspace.
//
// Built on dockview (MIT) so the panels are genuinely dockable: drag a tab out, split
// it, stack it, close it, and the layout persists to localStorage. The globe is
// MapLibre GL (BSD-3) in true globe projection. Everything renders from lib/gspcAxes,
// which refuses to hand a panel a score the axis has not earned.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DockviewReact, themeAbyss, type DockviewReadyEvent, type IDockviewPanelProps, type DockviewApi } from "dockview-react";
import "dockview/dist/styles/dockview.css";
import { Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import "maplibre-gl/dist/maplibre-gl.css";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AXES, MEASURED_ON, STATUS_TONE, confidence, countOf, fetchAxes, hasInterval, quotable, wilson,
         type Axis, type AxesState } from "@/lib/gspcAxes";
import { createContext, useContext } from "react";
import { Globe2, LayoutGrid, MessageSquare, Server, ScrollText, Building2, Gamepad2, GraduationCap, Command as CmdIcon, ShieldCheck } from "lucide-react";
import CityPanel from "@/components/sovos/CityPanel";

// Vite cannot see maplibre's `new URL("./maplibre-gl-worker.mjs", import.meta.url)`,
// so the chunk 404s and the SPA fallback serves HTML. Point it at the emitted asset.
try { setWorkerUrl(maplibreWorkerUrl); } catch { /* older maplibre */ }

const LAYOUT_KEY = "councilos.layout.v2";


/* ── live axes, shared by every panel ──────────────────────────────────────── */

const AxesCtx = createContext<AxesState>({ axes: AXES, source: "snapshot", measuredOn: MEASURED_ON.date, inLane: [], loading: true });
const useAxes = () => useContext(AxesCtx);

function AxesProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AxesState>({ axes: AXES, source: "snapshot", measuredOn: MEASURED_ON.date, inLane: [], loading: true });
  useEffect(() => {
    const ac = new AbortController();
    fetchAxes(ac.signal).then((r) => setState({ ...r, loading: false })).catch(() => setState((s) => ({ ...s, loading: false })));
    return () => ac.abort();
  }, []);
  return <AxesCtx.Provider value={state}>{children}</AxesCtx.Provider>;
}

/** Says where the numbers came from. Never lets a stale snapshot look live. */
function SourceChip() {
  const { source, measuredOn, loading, error } = useAxes();
  if (loading) return <span className="text-[11px] text-slate-600">reading /api/gspc…</span>;
  return source === "wire"
    ? <span className="text-[11px] text-emerald-400/80">live · /api/gspc · measured {measuredOn}</span>
    : <span className="text-[11px] text-amber-400/80" title={error}>bundled snapshot ({measuredOn}) — /api/gspc unreachable</span>;
}

/* ── shared chrome ─────────────────────────────────────────────────────────── */

function PanelShell({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div className="h-full w-full overflow-auto bg-[#080c14] text-slate-200">
      {subtitle && (
        <div className="sticky top-0 z-10 border-b border-white/5 bg-[#080c14]/95 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-slate-500 backdrop-blur">
          {subtitle}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

function StatusChip({ a }: { a: Axis }) {
  return <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${STATUS_TONE[a.status]}`}>{a.status}</span>;
}

/** The only component allowed to print a score — and it asks the guard first. */
function Score({ a }: { a: Axis }) {
  if (!quotable(a)) return <span className="text-slate-600">— no score earned</span>;
  const [lo, hi] = wilson(a.accuracy, a.n);
  return (
    <span className="tabular-nums">
      <span className="text-lg font-semibold text-slate-100">{a.accuracy.toFixed(3)}</span>
      <span className="ml-2 text-xs text-slate-500">
        {hasInterval(a) ? `95% [${lo.toFixed(3)}, ${hi.toFixed(3)}]` : `n=${a.n} < 30 — no interval`}
      </span>
    </span>
  );
}

/* ── panel: globe ──────────────────────────────────────────────────────── */

function GlobePanel({ api, containerApi }: IDockviewPanelProps) {
  const { axes } = useAxes();
  const axesRef = useRef(axes);
  axesRef.current = axes;
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!host.current || map.current) return;
    const m = new MapLibreMap({
      container: host.current,
      style: "https://tiles.openfreemap.org/styles/dark",
      center: [4.37, 42], zoom: 1.6, attributionControl: false,
    });
    map.current = m;
    m.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
    m.on("style.load", () => { try { m.setProjection({ type: "globe" } as any); } catch { /* older gl */ } });

    for (const a of axesRef.current) {
      const el = document.createElement("button");
      el.className = "sov-seat";
      el.style.cssText =
        `width:${10 + confidence(a) * 16}px;height:${10 + confidence(a) * 16}px;border-radius:50%;cursor:pointer;` +
        `background:${a.colour};border:2px solid rgba(255,255,255,.55);` +
        `box-shadow:0 0 ${quotable(a) ? 18 : 6}px ${a.colour};opacity:${quotable(a) ? 1 : 0.5}`;
      el.title = `${a.axis} · ${a.seat} · ${a.status}`;
      el.onclick = () => openEvidence(containerApi, a.axis);
      new Marker({ element: el }).setLngLat([a.lng, a.lat]).addTo(m);
    }
    const spin = setInterval(() => { if (!m.isMoving()) m.easeTo({ center: [m.getCenter().lng + 0.35, m.getCenter().lat], duration: 900, easing: (t) => t }); }, 900);
    return () => { clearInterval(spin); m.remove(); map.current = null; };
  }, [containerApi]);

  useEffect(() => {
    const d = api.onDidDimensionsChange(() => map.current?.resize());
    return () => d.dispose();
  }, [api]);

  return (
    <div className="relative h-full w-full bg-[#04070d]">
      <div ref={host} style={{ position: "absolute", inset: 0 }} />
      <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-white/10 bg-black/55 px-3 py-2 text-[11px] leading-relaxed backdrop-blur">
        <div className="font-semibold tracking-[0.2em] text-emerald-300">{axes.length} SEATS</div>
        <div className="text-slate-400">dot size = confidence (items ÷ 30, discounted by unparsed)</div>
        <div className="text-slate-500">dim = no score earned yet</div>
      </div>
    </div>
  );
}

/* ── panel: the board ──────────────────────────────────────────────────── */

function BoardPanel({ containerApi }: IDockviewPanelProps) {
  const { axes, doi, issuer } = useAxes();
  const c = countOf(axes);
  return (
    <PanelShell subtitle={`GSPC board · ${c.measured}/${c.total} measured · ${c.withInterval} carrying an interval`}>
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <SourceChip />
        {issuer && <span className="text-[11px] text-slate-500">issuer {issuer}</span>}
        {doi && <a className="text-[11px] text-teal-400 hover:underline" href={`https://doi.org/${doi}`} target="_blank" rel="noreferrer">DOI {doi} ↗</a>}
      </div>
      <div className="space-y-1.5">
        {axes.map((a) => (
          <button
            key={a.axis}
            onClick={() => openEvidence(containerApi, a.axis)}
            className="group flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-left transition hover:border-white/15 hover:bg-white/[0.05]"
          >
            <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: a.colour, opacity: quotable(a) ? 1 : 0.35 }} />
            <span className="min-w-[10rem] flex-1">
              <span className="block text-sm font-medium text-slate-100">{a.axis}</span>
              <span className="block text-[11px] text-slate-500">{a.bench} · {a.seat}</span>
            </span>
            <span className="hidden min-w-0 flex-1 truncate text-[11px] text-slate-500 lg:block">{a.instrument}</span>
            <span className="ml-auto shrink-0 text-right text-sm"><Score a={a} /></span>
            <StatusChip a={a} />
          </button>
        ))}
      </div>
      <p className="mt-4 border-t border-white/5 pt-3 text-[11px] leading-relaxed text-slate-500">
        {c.total - c.measured === 0
          ? `All ${c.total} measurement slots are MEASURED.`
          : `${c.total - c.measured} of ${c.total} slots carry no number yet — only MEASURED slots earn a score.`} An interval only
        appears once usable n ≥ 30. Unparsed answers are reported separately as UNMEASURED — never scored wrong, never dropped.
      </p>
    </PanelShell>
  );
}

/* TRUNCATED_FOR_TOOL - will use push_files from json instead */