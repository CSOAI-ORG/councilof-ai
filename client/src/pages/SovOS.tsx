// SOV OS — the workspace.
//
// Built on dockview (MIT) so the panels are genuinely dockable: drag a tab out, split
// it, stack it, close it, and the layout persists to localStorage. The globe is
// MapLibre GL (BSD-3) in true globe projection. Everything renders from lib/gspcAxes,
// which refuses to hand a panel a score the axis has not earned.

import { Redirect } from "wouter";
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

export default function SovOS() {
  // One public OS: Council OS lobby. The dockview shell stays in-tree for
  // local play but is not a public door.
  return <Redirect to="/?lobby=home" />;
}
