// Model Registry — OpenRouter-style models surface: GSPC axes, rankings, gateway catalog.
// Reads /api/gspc (the signed measurement layer). No fabricated numbers, no demo data.
// Falls back to the bundled AXES snapshot if the API is unreachable — honest about which.

import { useEffect, useState } from "react";
import { AXES, MEASURED_ON, type Axis } from "@/lib/gspcAxes";
import MeasurementHub from "@/components/hub/MeasurementHub";
import GatewayCatalog from "@/components/hub/GatewayCatalog";
import { openLobby, lobbyHref } from "@/lib/lobbyLink";
import CouncilOsPageShell from "@/components/os/CouncilOsPageShell";

interface GspcAxis {
  axis: string;
  bench: string;
  task: string;
  n: number;
  accuracy: number;
  leader: string;
  separation: string | null;
  separation_p: number | null;
  interval: [number, number] | null;
  fleet_mean: number | null;
  macro_f1: number | null;
  unparsed_rate: number;
  status: string;
  dataset: string | null;
  colour: string;
  note: string;
}
interface GspcResponse {
  schema: string;
  issuer: string;
  measured_on: { date: string; model: string; note: string };
  axes: GspcAxis[];
  totals: { measured: number; unmeasured: number; total: number };
  limitations: string[];
}

function useGspc() {
  const [state, setState] = useState({
    axes: AXES, source: "snapshot", measuredOn: MEASURED_ON.date, loading: true, error: null, limitations: [], issuer: ""
  });
  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/gspc", { signal: ac.signal })
      .then((r) => r.json())
      .then((d) => {
        setState({
          axes: d.axes, source: "wire", measuredOn: d.measured_on?.date ?? "",
          loading: false, error: null, limitations: d.limitations ?? [], issuer: d.issuer ?? "",
        });
      })
      .catch(() => setState((s) => ({ ...s, loading: false })));
    return () => ac.abort();
  }, []);
  return state;
}

function fmtCI(lo: number, hi: number) { return `[${lo.toFixed(3)}, ${hi.toFixed(3)}]`; }

const AXIS_LABEL: Record<string, string> = {
  governance: "EU AI Act", safety: "Safety", provenance: "Provenance", continuity: "Continuity",
  conformance: "Conformance", openness: "Openness", "machinery-conformity": "Machinery", care: "Care",
  "cross-reality": "XR", "detector-interop": "Detection", "art5-safeguard": "Art 5", swarm: "Swarm", affect: "Affect",
};

type RegistryTab = "axes" | "rankings" | "gateway";
const TABS = [
  { id: "axes" as const, label: "GSPC axes" },
  { id: "rankings" as const, label: "Rankings" },
  { id: "gateway" as const, label: "Gateway catalog" },
];

export default function ModelRegistry() {
  const { axes, source, measuredOn, loading, limitations, issuer } = useGspc();
  const [tab, setTab] = useState<RegistryTab>("rankings");
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#04070d]">
        <div className="text-center"><div className="text-sm text-slate-500">reading /api/gspc…</div></div>
      </div>
    );
  }
  const wireAxes = axes.filter((a) => "leader" in a) as GspcAxis[];
  const measuredCount = wireAxes.filter((a) => a.status === "MEASURED").length;
  return (
    <CouncilOsPageShell title="Models" subtitle="Per-axis leaders from GET /api/gspc — separated leads only" className="min-h-screen bg-[#04070d] text-slate-200">
      <header className="border-b border-white/8 bg-[#080c14]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <a href={lobbyHref({ pane: "models" })} onClick={(e) => { e.preventDefault(); openLobby({ pane: "models", task: "read-the-board" }); }} className="text-[11px] uppercase tracking-[0.2em] text-emerald-400">← Open in Council OS</a>
          <h1 className="mt-2 text-3xl font-bold text-white">Model Registry</h1>
          <div className="mt-4 flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} className={tab === t.id ? "rounded-md px-3 py-1.5 text-sm bg-emerald-600 text-white" : "rounded-md px-3 py-1.5 text-sm text-slate-400"}>{t.label}</button>
            ))}
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-8">
        {tab === "rankings" && <div className="rounded-xl border border-white/10 bg-[#0a0f18] p-4"><MeasurementHub initialTab="models" /></div>}
        {tab === "gateway" && <div className="rounded-xl border border-white/10 bg-[#0a0f18] p-4"><GatewayCatalog /></div>}
        {tab === "axes" && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wireAxes.map((a) => (
              <div key={a.axis} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <h3 className="text-sm font-semibold text-slate-100">{AXIS_LABEL[a.axis] ?? a.axis}</h3>
                <div className="mt-2 text-[11px] text-slate-500">{a.bench} · n={a.n}</div>
                {a.status === "MEASURED" && <div className="mt-2 text-2xl font-bold text-slate-100">{a.accuracy?.toFixed(3)}</div>}
              </div>
            ))}
          </div>
        )}
      </section>
    </CouncilOsPageShell>
  );
}