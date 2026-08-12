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
import { Globe2, LayoutGrid, MessageSquare, Server, ScrollText, Building2, Command as CmdIcon } from "lucide-react";
import CityPanel from "@/components/sovos/CityPanel";

// Vite cannot see maplibre's `new URL("./maplibre-gl-worker.mjs", import.meta.url)`,
// so the chunk 404s and the SPA fallback serves HTML. Point it at the emitted asset.
try { setWorkerUrl(maplibreWorkerUrl); } catch { /* older maplibre */ }

const LAYOUT_KEY = "sovos.layout.v2";


/* ── live axes, shared by every panel ──────────────────────────────────────── */

const AxesCtx = createContext<AxesState>({ axes: AXES, source: "snapshot", measuredOn: MEASURED_ON.date, loading: true });
const useAxes = () => useContext(AxesCtx);

function AxesProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AxesState>({ axes: AXES, source: "snapshot", measuredOn: MEASURED_ON.date, loading: true });
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

/* ── panel: globe ──────────────────────────────────────────────────────────── */

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
        <div className="font-semibold tracking-[0.2em] text-emerald-300">TWELVE SEATS</div>
        <div className="text-slate-400">dot size = confidence (items ÷ 30, discounted by unparsed)</div>
        <div className="text-slate-500">dim = no score earned yet</div>
      </div>
    </div>
  );
}

/* ── panel: the board ──────────────────────────────────────────────────────── */

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
        Nine axes show no number on purpose. A score appears only once an axis is MEASURED, and an interval only
        once usable n ≥ 30. Unparsed answers are counted incorrect, never dropped.
      </p>
    </PanelShell>
  );
}

/* ── panel: evidence ───────────────────────────────────────────────────────── */

function EvidencePanel({ params }: IDockviewPanelProps<{ axis: string }>) {
  const { axes } = useAxes();
  const a = axes.find((x) => x.axis === params.axis) ?? axes[0];
  const rows: [string, React.ReactNode][] = [
    ["status", <StatusChip a={a} />],
    ["score", <Score a={a} />],
    ["items (n)", a.n || "no item bank yet"],
    ["macro F1", quotable(a) ? a.macro_f1.toFixed(3) : "—"],
    ["unparsed", quotable(a) ? `${(a.unparsed_rate * 100).toFixed(1)}% (counted incorrect)` : "—"],
    ["instrument", a.instrument],
    ["task", a.task],
    ["seat", a.seat],
  ];
  return (
    <PanelShell subtitle={`${a.axis} · ${a.bench}`}>
      <dl className="space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-4 border-b border-white/5 pb-2">
            <dt className="w-28 shrink-0 text-[11px] uppercase tracking-wider text-slate-500">{k}</dt>
            <dd className="text-sm text-slate-200">{v}</dd>
          </div>
        ))}
      </dl>
      {a.note && <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-[12px] leading-relaxed text-slate-400">{a.note}</p>}
      {a.dataset ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <a className="rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-300 hover:bg-white/5"
             href={`https://huggingface.co/datasets/${a.dataset}`} target="_blank" rel="noreferrer">HF dataset ↗</a>
          <a className="rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-300 hover:bg-white/5"
             href={`https://www.kaggle.com/datasets/nicktempleman/${a.dataset.split("/").pop()}`} target="_blank" rel="noreferrer">Kaggle mirror ↗</a>
          <span className="self-center font-mono text-[10px] text-slate-600">{a.dataset}</span>
        </div>
      ) : (
        <p className="mt-4 text-[11px] text-slate-600">No dataset published for this axis yet — no link is shown rather than a broken one.</p>
      )}
    </PanelShell>
  );
}

/* ── panel: MCP fleet ──────────────────────────────────────────────────────── */

function FleetPanel() {
  const [state, setState] = useState<{ loading: boolean; servers: any[]; error?: string }>({ loading: true, servers: [] });
  useEffect(() => {
    let dead = false;
    fetch("/api/mcp")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => { if (!dead) setState({ loading: false, servers: j.servers ?? j.items ?? (Array.isArray(j) ? j : []) }); })
      .catch((e) => { if (!dead) setState({ loading: false, servers: [], error: String(e.message ?? e) }); });
    return () => { dead = true; };
  }, []);

  if (state.loading) return <PanelShell subtitle="MCP fleet"><div className="text-sm text-slate-500">querying /api/mcp…</div></PanelShell>;
  if (state.error) return <PanelShell subtitle="MCP fleet"><div className="text-sm text-amber-400/80">/api/mcp unreachable — {state.error}. Nothing shown rather than a fabricated fleet.</div></PanelShell>;

  return (
    <PanelShell subtitle={`MCP fleet · ${state.servers.length} declared`}>
      <div className="grid gap-2 sm:grid-cols-2">
        {state.servers.map((s: any, i: number) => (
          <div key={s.id ?? s.name ?? i} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-slate-100">{s.name ?? s.id ?? `server ${i + 1}`}</span>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.status === "up" || s.healthy ? "bg-emerald-400" : "bg-slate-600"}`} />
            </div>
            {(s.description ?? s.transport) && <div className="mt-1 line-clamp-2 text-[11px] text-slate-500">{s.description ?? s.transport}</div>}
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

/* ── panel: Ask SOV ────────────────────────────────────────────────────────── */

type Turn = { role: "user" | "assistant"; text: string; sig?: string; state?: string };

function AskPanel() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [turns, busy]);

  const send = async () => {
    const text = q.trim();
    if (!text || busy) return;
    setQ(""); setBusy(true);
    setTurns((t) => [...t, { role: "user", text }]);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
      const j = await r.json();
      setTurns((t) => [...t, { role: "assistant", text: j.answer ?? j.reply ?? "(empty)", sig: j.signature, state: j.state }]);
    } catch (e: any) {
      setTurns((t) => [...t, { role: "assistant", text: `/api/chat unreachable — ${e?.message ?? e}. No offline guess is shown in its place.`, state: "unreachable" }]);
    } finally { setBusy(false); }
  };

  return (
    <div className="flex h-full flex-col bg-[#080c14]">
      <div className="flex-1 space-y-3 overflow-auto p-4">
        {!turns.length && (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-[12px] leading-relaxed text-slate-400">
            Ask the sovereign specialist. It answers from the signed measurement layer — and says
            <span className="text-slate-200"> "unmeasured" </span> where the estate has not earned a number.
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className={t.role === "user" ? "ml-auto max-w-[85%]" : "max-w-[92%]"}>
            <div className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${t.role === "user" ? "bg-emerald-500/15 text-emerald-50" : "border border-white/8 bg-white/[0.03] text-slate-200"}`}>
              {t.text}
            </div>
            {t.sig && <div className="mt-1 text-[10px] tracking-wide text-slate-600">{t.sig}</div>}
          </div>
        ))}
        {busy && <div className="text-[11px] text-slate-500">specialist thinking…</div>}
        <div ref={end} />
      </div>
      <div className="flex gap-2 border-t border-white/5 p-3">
        <input
          value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Is a CV-screening model high-risk under the AI Act?"
          className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-400/40"
        />
        <button onClick={send} disabled={busy} className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-4 text-sm font-medium text-emerald-200 disabled:opacity-40">Ask</button>
      </div>
    </div>
  );
}

/* ── panel: method ─────────────────────────────────────────────────────────── */

function MethodPanel() {
  const rules = [
    ["Unparsed counted incorrect", "An answer we cannot read is a wrong answer, never a dropped row."],
    ["No model judges another model", "Every grader is deterministic. There is no LLM jury."],
    ["Nothing quoted below n ≥ 30", "Under thirty usable items an axis carries no interval, and says so."],
    ["Canaries excluded", "Canary items detect contamination; they never enter a score."],
    ["Structurally unable to report false success", "Three outcomes, never two: success, failure, unmeasured."],
  ];
  return (
    <PanelShell subtitle="Method — the rules the boards run on">
      <div className="space-y-2.5">
        {rules.map(([h, b]) => (
          <div key={h} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="text-sm font-medium text-emerald-300">{h}</div>
            <div className="mt-0.5 text-[12px] leading-relaxed text-slate-400">{b}</div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

/* ── workspace ─────────────────────────────────────────────────────────────── */

const COMPONENTS = { globe: GlobePanel, board: BoardPanel, evidence: EvidencePanel, fleet: FleetPanel, ask: AskPanel, method: MethodPanel, city: CityPanel };

function openEvidence(api: DockviewApi, axis: string) {
  const existing = api.getPanel("evidence");
  if (existing) { existing.api.updateParameters({ axis }); existing.api.setActive(); return; }
  api.addPanel({ id: "evidence", component: "evidence", title: "Evidence", params: { axis }, position: { referencePanel: "board", direction: "below" } });
}

const LAUNCHER: { id: keyof typeof COMPONENTS; title: string; icon: any }[] = [
  { id: "globe", title: "Globe", icon: Globe2 },
  { id: "board", title: "GSPC Board", icon: LayoutGrid },
  { id: "ask", title: "Ask SOV", icon: MessageSquare },
  { id: "fleet", title: "MCP Fleet", icon: Server },
  { id: "city", title: "SOV City", icon: Building2 },
  { id: "method", title: "Method", icon: ScrollText },
];

export default function SovOS() {
  return <AxesProvider><SovOSInner /></AxesProvider>;
}

function SovOSInner() {
  const { axes } = useAxes();
  const COUNTS = countOf(axes);
  const [api, setApi] = useState<DockviewApi | null>(null);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setPalette((p) => !p); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const onReady = useCallback((event: DockviewReadyEvent) => {
    setApi(event.api);
    const saved = localStorage.getItem(LAYOUT_KEY);
    if (saved) { try { event.api.fromJSON(JSON.parse(saved)); return; } catch { localStorage.removeItem(LAYOUT_KEY); } }
    event.api.addPanel({ id: "globe", component: "globe", title: "Globe" });
    event.api.addPanel({ id: "board", component: "board", title: "GSPC Board", position: { referencePanel: "globe", direction: "right" } });
    event.api.addPanel({ id: "ask", component: "ask", title: "Ask SOV", position: { referencePanel: "globe", direction: "below" } });
    event.api.addPanel({ id: "city", component: "city", title: "SOV City", position: { referencePanel: "ask", direction: "within" } });
    event.api.addPanel({ id: "method", component: "method", title: "Method", position: { referencePanel: "ask", direction: "within" } });
  }, []);

  useEffect(() => {
    if (!api) return;
    const d = api.onDidLayoutChange(() => { try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(api.toJSON())); } catch { /* quota */ } });
    return () => d.dispose();
  }, [api]);

  const open = useCallback((id: keyof typeof COMPONENTS, title: string) => {
    if (!api) return;
    const p = api.getPanel(id);
    if (p) { p.api.setActive(); return; }
    api.addPanel({ id, component: id, title });
  }, [api]);

  const resetLayout = () => { localStorage.removeItem(LAYOUT_KEY); location.reload(); };

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#04070d] text-slate-200">
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-white/8 bg-[#080c14] px-3">
        <span className="text-[13px] font-semibold tracking-[0.22em] text-emerald-300">SOV&nbsp;OS</span>
        <span className="hidden text-[11px] text-slate-500 sm:block">
          {COUNTS.measured}/{COUNTS.total} axes measured · {COUNTS.withInterval} with an interval · signed, recomputable
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => setPalette(true)} className="flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-400 hover:bg-white/5">
            <CmdIcon className="h-3 w-3" /> K
          </button>
          <button onClick={resetLayout} className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-400 hover:bg-white/5">Reset layout</button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-white/8 bg-[#080c14] py-2">
          {LAUNCHER.map(({ id, title, icon: Icon }) => (
            <button key={id} title={title} onClick={() => open(id, title)}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-emerald-300">
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </nav>
        <div className="min-w-0 flex-1">
          <DockviewReact components={COMPONENTS} onReady={onReady} theme={themeAbyss} disableTabsContextMenu />
        </div>
      </div>

      <CommandDialog open={palette} onOpenChange={setPalette}>
        <CommandInput placeholder="Open a panel or jump to an axis…" />
        <CommandList>
          <CommandEmpty>Nothing matches.</CommandEmpty>
          <CommandGroup heading="Panels">
            {LAUNCHER.map(({ id, title }) => (
              <CommandItem key={id} onSelect={() => { open(id, title); setPalette(false); }}>{title}</CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Axes">
            {axes.map((a) => (
              <CommandItem key={a.axis} onSelect={() => { if (api) { open("board", "GSPC Board"); openEvidence(api, a.axis); } setPalette(false); }}>
                {a.axis} <span className="ml-2 text-[10px] text-slate-500">{a.status}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
