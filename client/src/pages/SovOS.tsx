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

/* ── panel: the board ──────────────────────────────────────────────────── */

function BoardPanel({ containerApi }: IDockviewPanelProps) {
  const { axes, doi, issuer } = useAxes();
  const c = countOf(axes);
  return (
    <PanelShell subtitle={`GSPC board · ${c.measured}/${c.total} measured · ${c.withInterval} carrying an interval`}>
      <p className="mt-4 border-t border-white/5 pt-3 text-[11px] leading-relaxed text-slate-500">
        {c.total - c.measured === 0
          ? `All ${c.total} measurement slots are MEASURED.`
          : `${c.total - c.measured} of ${c.total} slots carry no number yet — only MEASURED slots earn a score.`}
      </p>
    </PanelShell>
  );
}

export default function SovOS() {
  return null;
}
