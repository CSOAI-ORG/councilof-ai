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
          ? `All ${c.total} axes are MEASURED.`
          : `${c.total - c.measured} of ${c.total} axes carry no number yet — only MEASURED axes earn a score.`} An interval only
        appears once usable n ≥ 30. Unparsed answers are reported separately as UNMEASURED — never scored wrong, never dropped.
      </p>
    </PanelShell>
  );
}

/* ── panel: evidence ───────────────────────────────────────────────────── */

function EvidencePanel({ params }: IDockviewPanelProps<{ axis: string }>) {
  const { axes } = useAxes();
  const a = axes.find((x) => x.axis === params.axis) ?? axes[0];
  const rows: [string, React.ReactNode][] = [
    ["status", <StatusChip a={a} />],
    ["score", <Score a={a} />],
    ["items (n)", a.n || "no item bank yet"],
    ["macro F1", quotable(a) ? a.macro_f1.toFixed(3) : "—"],
    ["unparsed", quotable(a) ? `${(a.unparsed_rate * 100).toFixed(1)}% (reported UNMEASURED)` : "—"],
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

/* ── panel: MCP fleet ──────────────────────────────────────────────────── */

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

/* ── panel: Ask SOV ────────────────────────────────────────────────────── */

import { openLobby } from "@/lib/lobbyLink";

/** Council chat lives in Council OS — no duplicate composer here. */
function AskPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-[#080c14] p-8 text-center">
      <p className="max-w-md text-[13px] leading-relaxed text-slate-400">
        Ask the Council in <strong className="text-emerald-200">Council OS</strong> — one slim composer,
        grounded answers, native board and verify panes. This dock no longer runs a second chat.
      </p>
      <button
        type="button"
        onClick={() => openLobby({ pane: "home" })}
        className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/25"
      >
        Open Council OS
      </button>
    </div>
  );
}

/* ── panel: Games — the estate's game arcade ───────────────────────────────── */
//
// Each game in the arcade is one entry in GAMES. A game ships on its own deploy
// cycle (its own CF Pages project) and the OS just hosts it — the estate owns
// the brand, the purpose, and the surface; the game client stays independent.

type Game = { id: string; title: string; tagline: string; src?: string; note: string; gated: boolean; design?: boolean };

const GAMES: Game[] = [
  {
    id: "council-town",
    title: "Council Town",
    tagline: "Agent clans deliberating in an open world",
    src: "https://council-town.pages.dev/",
    note:
      "Council Town's world runs on its game backend (Convex), which is owner-gated — one login the estate owner clears. " +
      "Until it is wired, the client shows its loading shell; nothing is simulated or fabricated.",
    gated: true,
  },
  {
    id: "the-ruler",
    title: "The Ruler",
    tagline: "Human-vs-model labelling duel — every bet is a signed preference cell",
    design: true,
    note: "DESIGN — FastChat pairwise bridge exists on pod; needs Empirica/oTree seat. See council-os/GAMES_SLATE.md slot 2.",
    gated: true,
  },
  {
    id: "monoculture",
    title: "Monoculture",
    tagline: "Co-op failure-hunt board game over GNN cross-synthesis clusters",
    design: true,
    note: "DESIGN — gnn_synthesis.py built; UI not started. Slot 3 in GAMES_SLATE.",
    gated: true,
  },
  {
    id: "mark-my-words",
    title: "Mark My Words",
    tagline: "C2PA / watermark tamper hunt",
    design: true,
    note: "DESIGN — ProvBench/DetBench banks exist; game skin not started. Slot 4.",
    gated: true,
  },
  {
    id: "jurisdiction",
    title: "Jurisdiction",
    tagline: "Regulatory map-builder on the SovSpace globe",
    design: true,
    note: "DESIGN — globe + risk-tier banks exist; game rules not started. Slot 5.",
    gated: true,
  },
  {
    id: "council-chamber",
    title: "The Council Chamber",
    tagline: "33-seat governance role-play with signed minutes",
    design: true,
    note: "DESIGN — vote-log tools on pod; chamber UI not started. Slot 6.",
    gated: true,
  },
];

function GamesPanel({ params }: IDockviewPanelProps<{ game?: string }>) {
  const [activeId, setActiveId] = useState<string>(GAMES[0].id);
  const [reachable, setReachable] = useState<Record<string, boolean | null>>({});
  const game = GAMES.find((g) => g.id === activeId) ?? GAMES[0];

  useEffect(() => {
    if (params?.game && GAMES.some((g) => g.id === params.game)) setActiveId(params.game);
  }, [params?.game]);

  useEffect(() => {
    if (game.design || !game.src) return;
    if (reachable[game.id] !== undefined) return;
    let dead = false;
    fetch(game.src, { method: "GET" })
      .then((r) => { if (!dead) setReachable((m) => ({ ...m, [game.id]: r.ok })); })
      .catch(() => { if (!dead) setReachable((m) => ({ ...m, [game.id]: false })); });
    return () => { dead = true; };
  }, [game, reachable]);

  return (
    <div className="flex h-full w-full flex-col bg-[#080c14]">
      <div className="flex shrink-0 items-center gap-1 border-b border-white/5 bg-[#080c14]/95 px-2 py-1.5">
        {GAMES.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveId(g.id)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${g.id === activeId ? "bg-emerald-400/15 text-emerald-200" : "text-slate-500 hover:bg-white/5 hover:text-slate-300"}`}
          >
            {g.title}
            {g.design && <span className="ml-1.5 rounded border border-violet-400/30 px-1 py-0.5 text-[9px] font-semibold text-violet-400/70">design</span>}
            {g.gated && !g.design && <span className="ml-1.5 rounded border border-amber-400/30 px-1 py-0.5 text-[9px] font-semibold text-amber-400/70">gate</span>}
          </button>
        ))}
        <span className="ml-auto hidden pr-2 text-[10px] text-slate-600 sm:block">{game.tagline}</span>
      </div>
      {game.design || !game.src ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-violet-400/20 bg-violet-500/5 p-5 text-center">
            <Gamepad2 className="mx-auto h-6 w-6 text-violet-400/70" />
            <div className="mt-2 text-sm font-medium text-slate-200">{game.title} — DESIGN</div>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-400">{game.note}</p>
          </div>
        </div>
      ) : reachable[game.id] === false ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-white/10 bg-white/[0.02] p-5 text-center">
            <Gamepad2 className="mx-auto h-6 w-6 text-slate-600" />
            <div className="mt-2 text-sm font-medium text-slate-200">{game.title} client unreachable</div>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
              The game client did not answer at {game.src}. The signed measurement records stay available in the
              Council City panel meanwhile.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1">
            <iframe src={game.src} title={game.title} className="h-full w-full border-0" allow="clipboard-write" />
          </div>
          <div className="shrink-0 border-t border-white/5 px-3 py-1.5 text-[10px] leading-relaxed text-slate-600">
            {game.note}
          </div>
        </>
      )}
    </div>
  );
}

/* ── panel: Training — flywheel runs + mesh simulations ─────────────────── */

interface FlywheelRun {
  run_id: string;
  model: string;
  practice: { n: number; acc: number | null };
  held_out: { n: number; acc: number | null };
  overfit_gap: number;
  alarm: string;
  exported_pairs: number;
  exported_kb_rows: number;
  guard: string;
  ts: string;
}
interface FlywheelBoard { generated_at: string; n_runs: number; runs: FlywheelRun[]; }
interface SimBoard {
  generated_at: string;
  kind: string;
  note: string;
  run: { scenario: string; n_runs: number; agent_count: number; mean_consensus_time_ms: number; p50_consensus_time_ms: number; p99_consensus_time_ms: number; task_success_rate: number; optimal_cluster_size: number; bottleneck_agent: string; failure_scenarios: string[] };
}

function TrainingPanel() {
  const [board, setBoard] = useState<FlywheelBoard | null>(null);
  const [sim, setSim] = useState<SimBoard | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let dead = false;
    Promise.all([
      fetch("/flywheel/board.json").then((r) => (r.ok ? r.json() : Promise.reject(new Error(`flywheel HTTP ${r.status}`)))),
      fetch("/flywheel/sim-board.json").then((r) => (r.ok ? r.json() : Promise.reject(new Error(`sim-board HTTP ${r.status}`)))),
    ])
      .then(([b, s]) => { if (!dead) { setBoard(b); setSim(s); } })
      .catch((e) => { if (!dead) setErr(String(e.message ?? e)); });
    return () => { dead = true; };
  }, []);

  if (err) return <PanelShell subtitle="Training"><div className="text-sm text-amber-400/80">Training records unreachable — {err}. Nothing shown rather than a fabricated run.</div></PanelShell>;
  if (!board && !sim) return <PanelShell subtitle="Training"><div className="text-sm text-slate-500">reading /flywheel/board.json…</div></PanelShell>;

  return (
    <PanelShell subtitle={`Training · ${board?.n_runs ?? 0} flywheel runs · ${sim ? "1 mesh simulation" : "no simulation yet"}`}>
      {/* ── training runs ── */}
      <div className="mb-4">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Flywheel training runs</div>
        {board && board.runs.length ? (
          <div className="space-y-1.5">
            {board.runs.map((r) => {
              const gapOk = Math.abs(r.overfit_gap) <= 0.15;
              return (
                <div key={r.run_id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-[11px] text-slate-500">{r.run_id}</span>
                    <span className="text-sm font-medium text-slate-100">{r.model}</span>
                    <span className="ml-auto text-[11px] tabular-nums text-slate-400">
                      overfit gap <b className={gapOk ? "text-emerald-300" : "text-rose-300"}>{r.overfit_gap.toFixed(4)}</b>
                    </span>
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${gapOk ? "border-emerald-400/30 text-emerald-300" : "border-rose-400/30 text-rose-300"}`}>{gapOk ? "OK" : "ALARM"}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    <span>{r.exported_pairs} pairs exported</span>
                    <span>{r.exported_kb_rows} KB rows</span>
                    <span className="text-slate-600">{r.guard}</span>
                    <span className="text-slate-600">{r.alarm}</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-600">{new Date(r.ts).toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-[12px] text-slate-500">No flywheel runs recorded yet.</div>
        )}
      </div>

      {/* ── mesh simulation ── */}
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Mesh simulation</div>
        {sim ? (
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-[11px] text-slate-500">{sim.run.scenario}</span>
              <span className="ml-auto text-[11px] text-slate-400">{sim.run.n_runs.toLocaleString()} Monte Carlo runs · {sim.run.agent_count} agents</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-md bg-white/[0.03] px-2.5 py-1.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-600">mean consensus</div>
                <div className="text-sm font-semibold tabular-nums text-slate-100">{sim.run.mean_consensus_time_ms.toFixed(1)} ms</div>
              </div>
              <div className="rounded-md bg-white/[0.03] px-2.5 py-1.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-600">p99 consensus</div>
                <div className="text-sm font-semibold tabular-nums text-slate-100">{sim.run.p99_consensus_time_ms.toFixed(1)} ms</div>
              </div>
              <div className="rounded-md bg-white/[0.03] px-2.5 py-1.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-600">task success</div>
                <div className="text-sm font-semibold tabular-nums text-emerald-300">{(sim.run.task_success_rate * 100).toFixed(1)}%</div>
              </div>
              <div className="rounded-md bg-white/[0.03] px-2.5 py-1.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-600">optimal cluster</div>
                <div className="text-sm font-semibold tabular-nums text-slate-100">{sim.run.optimal_cluster_size}</div>
              </div>
              <div className="rounded-md bg-white/[0.03] px-2.5 py-1.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-600">bottleneck</div>
                <div className="text-sm font-semibold tabular-nums text-slate-100">{sim.run.bottleneck_agent}</div>
              </div>
              <div className="rounded-md bg-white/[0.03] px-2.5 py-1.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-600">failure scenarios</div>
                <div className="text-sm font-semibold tabular-nums text-slate-100">{sim.run.failure_scenarios.length}</div>
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{sim.note}</p>
          </div>
        ) : (
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-[12px] text-slate-500">No simulation snapshot yet.</div>
        )}
      </div>

      <p className="mt-4 border-t border-white/5 pt-3 text-[11px] leading-relaxed text-slate-600">
        Training stays firewall-clean: the flywheel exports measurement fuel (pairs + KB rows) and refuses
        held-out contamination; analysis over outcomes is published as signed measurement — the estate never
        trains and ships a champion model on the collected honey.
      </p>
    </PanelShell>
  );
}

/* ── panel: method ─────────────────────────────────────────────────────── */

function MethodPanel() {
  const rules = [
    ["Unparsed reported as UNMEASURED", "An answer we cannot read is a measurement failure, reported in its own column — never a wrong answer, never a dropped row."],
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

/* ── workspace ───────────────────────────────────────────────────────────── */

const COMPONENTS = { globe: GlobePanel, board: BoardPanel, evidence: EvidencePanel, fleet: FleetPanel, ask: AskPanel, method: MethodPanel, city: CityPanel, games: GamesPanel, training: TrainingPanel };

function openEvidence(api: DockviewApi, axis: string) {
  const existing = api.getPanel("evidence");
  if (existing) { existing.api.updateParameters({ axis }); existing.api.setActive(); return; }
  api.addPanel({ id: "evidence", component: "evidence", title: "Evidence", params: { axis }, position: { referencePanel: "board", direction: "below" } });
}

type LauncherItem = { id: keyof typeof COMPONENTS; title: string; icon: any; hint: string; gated?: boolean };
type LauncherSection = { heading: string; items: LauncherItem[] };

// The Games section is built from the game registry — adding a game to GAMES
// adds its own sidebar entry automatically. The arcade holds up to 6 games.
const LAUNCHER_SECTIONS: LauncherSection[] = [
  {
    heading: "Workspace",
    items: [
      { id: "globe", title: "Globe", icon: Globe2, hint: "Thirteen seats, one per axis" },
      { id: "board", title: "GSPC Board", icon: LayoutGrid, hint: "Scores only where measured" },
    ],
  },
  {
    heading: "Measurement",
    items: [
      { id: "city", title: "Council City", icon: Building2, hint: "Signed arena runs" },
      { id: "training", title: "Training", icon: GraduationCap, hint: "Flywheel runs + mesh simulations" },
      { id: "method", title: "Method", icon: ScrollText, hint: "The rules the boards run on" },
    ],
  },
  {
    heading: "Games",
    items: GAMES.map((g) => ({ id: "games", title: g.title, icon: Gamepad2, hint: g.tagline, gated: g.gated })),
  },
  {
    heading: "Intelligence",
    items: [
      { id: "ask", title: "Ask SOV", icon: MessageSquare, hint: "Answers from the signed layer" },
      { id: "fleet", title: "MCP Fleet", icon: Server, hint: "Declared tool servers" },
    ],
  },
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
    if (saved) {
      try {
        // Sanitize: drop any saved panel whose component no longer exists, so a
        // renamed panel (e.g. town -> games) can never break the workspace.
        const json = JSON.parse(saved);
        const known = new Set(Object.keys(COMPONENTS));
        const panels = json?.panels ?? [];
        json.panels = panels.filter((p: any) => known.has(p?.component ?? p?.contentComponent ?? ""));
        if (json.panels.length) { event.api.fromJSON(json); return; }
      } catch { /* fall through to default */ }
      localStorage.removeItem(LAYOUT_KEY);
    }
    event.api.addPanel({ id: "globe", component: "globe", title: "Globe" });
    event.api.addPanel({ id: "games", component: "games", title: "Games", position: { referencePanel: "globe", direction: "right" } });
    event.api.addPanel({ id: "board", component: "board", title: "GSPC Board", position: { referencePanel: "games", direction: "right" } });
    event.api.addPanel({ id: "ask", component: "ask", title: "Ask SOV", position: { referencePanel: "games", direction: "below" } });
    event.api.addPanel({ id: "city", component: "city", title: "Council City", position: { referencePanel: "ask", direction: "within" } });
    event.api.addPanel({ id: "training", component: "training", title: "Training", position: { referencePanel: "ask", direction: "within" } });
    event.api.addPanel({ id: "method", component: "method", title: "Method", position: { referencePanel: "ask", direction: "within" } });
  }, []);

  useEffect(() => {
    if (!api) return;
    const d = api.onDidLayoutChange(() => { try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(api.toJSON())); } catch { /* quota */ } });
    return () => d.dispose();
  }, [api]);

  const open = useCallback((id: keyof typeof COMPONENTS, title: string, params?: Record<string, unknown>) => {
    if (!api) return;
    const p = api.getPanel(id);
    if (p) { if (params) p.api.updateParameters(params); p.api.setActive(); return; }
    api.addPanel({ id, component: id, title, params });
  }, [api]);

  const resetLayout = () => { localStorage.removeItem(LAYOUT_KEY); location.reload(); };

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#04070d] text-slate-200">
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-white/8 bg-[#080c14] px-3">
        <span className="text-[13px] font-semibold tracking-[0.22em] text-emerald-300">Council&nbsp;OS</span>
        <span className="hidden text-[11px] text-slate-500 sm:block">
          {COUNTS.measured}/{COUNTS.total} measured · {COUNTS.withInterval} carrying an interval
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => setPalette(true)} className="flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-400 hover:bg-white/5">
            <CmdIcon className="h-3 w-3" /> K
          </button>
          <button onClick={resetLayout} className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-400 hover:bg-white/5">Reset layout</button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="flex w-52 shrink-0 flex-col border-r border-white/8 bg-[#080c14]">
          <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <div>
              <span className="block text-[11px] font-semibold tracking-[0.16em] text-slate-200">Council OS</span>
              <SourceChip />
            </div>
          </div>
          <div className="flex-1 overflow-auto py-1.5">
            {LAUNCHER_SECTIONS.map((section) => (
              <div key={section.heading} className="mb-0.5">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">{section.heading}</div>
                {section.items.map(({ id, title, icon: Icon, hint, gated }) => (
                  <button
                    key={id + title}
                    onClick={() => open(id, title, id === "games" && gated ? { game: GAMES[0].id } : undefined)}
                    title={hint}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-left text-[12px] font-medium text-slate-400 transition hover:bg-white/5 hover:text-emerald-200"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{title}</span>
                    {id === "board" && <span className="ml-auto shrink-0 rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-emerald-300">{COUNTS.measured}</span>}
                    {gated && <span className="ml-auto shrink-0 rounded border border-amber-400/30 px-1 py-0.5 text-[9px] font-semibold text-amber-400/70">gate</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 px-3 py-2 text-[10px] leading-relaxed text-slate-600">
            {COUNTS.total} axes · {COUNTS.measured} measured · signed, recomputable
          </div>
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
            {LAUNCHER_SECTIONS.flatMap((s) => s.items).map(({ id, title }) => (
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
