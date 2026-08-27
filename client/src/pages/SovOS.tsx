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

try { setWorkerUrl(maplibreWorkerUrl); } catch { /* older maplibre */ }

const LAYOUT_KEY = "councilos.layout.v2";

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

function BoardPanel({ containerApi }: IDockviewPanelProps) {
  const { axes } = useAxes();
  const c = countOf(axes);
  return (
    <PanelShell subtitle="GSPC board">
      <p className="mt-4 border-t border-white/5 pt-3 text-[11px] leading-relaxed text-slate-500">
        {c.total - c.measured === 0
          ? `All ${c.total} measurement slots are MEASURED.`
          : `${c.total - c.measured} of ${c.total} slots carry no number yet — only MEASURED slots earn a score.`}
      </p>
    </PanelShell>
  );
}

function PanelShell({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return <div className="p-4">{subtitle && <div>{subtitle}</div>}{children}</div>;
}

export default function SovOS() {
  return <AxesProvider><div>{COUNTS.total} slots</div></AxesProvider>;
}
