import { useEffect, useRef, useState, type FormEvent } from "react";
import { Globe2, MessageCircle, ExternalLink, Layers, ShieldCheck } from "lucide-react";
import { askSovereign } from "@/lib/sovAsk";
import { MISSIONS, missionForId, missionHref, suggestMission, type MissionId } from "@/lib/worldMissions";
import { parseWorldBoard, type WorldBoard } from "@/lib/worldBoard";
import { DESKS, type DeskId } from "../../../functions/api/_chatDesks";
import PalAskPanel from "@/components/PalAskPanel";
import { sovActions } from "@/lib/sovAgent";
import {
  WORLD_SOURCES, eventAt, parseObservatory, parseWorldFact,
  type Observatory, type WorldFact, type WorldFactKey,
} from "@/lib/worldLens";

type WorldMode = "globe" | "atlas" | "timeline" | "systems" | "benchmarks";
type ReadState = { phase: "loading" | "ready" | "unavailable"; fact?: WorldFact; error?: string };
const SOURCE_KEYS: WorldFactKey[] = ["gspc", "root", "worker", "observatory"];
const WORLD_REGIONS: Record<string, [number, number]> = {
  GLOBAL: [10, 18], UK: [-0.12, 51.5], EU: [4.35, 50.8], US: [-77, 38.9],
  JAPAN: [139.69, 35.68], CHINA: [116.4, 39.9], INDIA: [77.2, 28.6],
  CANADA: [-75.7, 45.4], SINGAPORE: [103.8, 1.35],
  AUSTRALIA: [151.2, -33.9], UAE: [55.27, 25.2], BRAZIL: [-46.63, -23.5],
  KOREA: [127, 37.5],
};
const GLOBE_TAGS: Record<string, string> = {
  fw: "frameworks", council: "gov", watchdog: "cyber",
  ontology: "ontology", hive: "fortune",
};

export default function CouncilWorldLens() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [mode, setMode] = useState<WorldMode>("globe");
  const [region, setRegion] = useState("GLOBAL");
  const [layer, setLayer] = useState("frameworks");
  const [reads, setReads] = useState<Partial<Record<WorldFactKey, ReadState>>>({});
  const [observatory, setObservatory] = useState<Observatory | null>(null);
  const [board, setBoard] = useState<WorldBoard | null>(null);
  const [axisQuery, setAxisQuery] = useState("");
  const [axisFilter, setAxisFilter] = useState<"all" | "model" | "tie" | "untested" | "separated">("all");
  const [tick, setTick] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [asking, setAsking] = useState(false);
  const [selectedMission, setSelectedMission] = useState<MissionId>("ras");
  const [suggestedMission, setSuggestedMission] = useState<MissionId | null>(null);
  const [staffOpen, setStaffOpen] = useState(false);
  const [staffDesk, setStaffDesk] = useState<DeskId>("measure");
  const [status, setStatus] = useState("Globe is a view, not a live agent or a real-world outcome.");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    setReads(Object.fromEntries(SOURCE_KEYS.map((key) => [key, { phase: "loading" }])) as Partial<Record<WorldFactKey, ReadState>>);
    setObservatory(null);
    setBoard(null);
    for (const key of SOURCE_KEYS) {
      fetch(WORLD_SOURCES[key], { headers: { accept: "application/json" }, cache: "no-store", signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("HTTP " + response.status);
          const data: unknown = await response.json();
          const fact = parseWorldFact(key, data);
          if (key === "observatory" && !controller.signal.aborted) setObservatory(parseObservatory(data));
          if (key === "gspc" && !controller.signal.aborted) setBoard(parseWorldBoard(data));
          if (!controller.signal.aborted) setReads((old) => ({ ...old, [key]: { phase: "ready", fact } }));
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) setReads((old) => ({
            ...old, [key]: { phase: "unavailable", error: error instanceof Error ? error.message.slice(0, 90) : "Source unavailable" },
          }));
        });
    }
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, []);

  function globeCommand(command: Record<string, unknown>) {
    if (mode !== "globe" || !frameRef.current?.contentWindow) {
      setStatus("Switch to 3D Earth to apply camera or layer commands. No external execution.");
      return;
    }
    frameRef.current.contentWindow.postMessage(command, window.location.origin);
  }

  function fly(target: string) {
    setRegion(target);
    const pos = WORLD_REGIONS[target];
    if (!pos) return;
    globeCommand({ cmd: "flyTo", lng: pos[0], lat: pos[1], height: 3100000, duration: 1.6, col: "#087554" });
    setStatus("Camera requested: " + target + ". Geographic camera control only; no policy or agent action.");
  }

  function showLayer(tag: string) {
    setLayer(tag);
    globeCommand({ cmd: "layer", tag, on: true });
    setStatus("Showing existing " + tag + " visual layer. Markers must be checked against their sources; no simulation graded.");
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = prompt.trim().slice(0, 600);
    if (!question || asking) return;
    const mission = suggestMission(question);
    if (mission) { setSelectedMission(mission.id); setSuggestedMission(mission.id); }
    else setSuggestedMission(null);
    const actions = sovActions(question);
    // Only visual commands are safe to execute deterministically from a sentence.
    // A simulation, threat, human approval or physical intervention is NEVER run by this parser.
    for (const action of actions) {
      if (action.kind === "region" && WORLD_REGIONS[action.region]) fly(action.region);
      if (action.kind === "layer" && GLOBE_TAGS[action.layer]) showLayer(GLOBE_TAGS[action.layer]);
    }
    if (actions.some((action) => action.kind === "simulate" || action.kind === "threat")) {
      setStatus("Simulation/action requested but NOT executed. The local rehearsal engine and real authority gate remain separate.");
    }
    setAsking(true);
    setReply("");
    try {
      const response = await askSovereign(question, {
        fallback: "The Council chat gateway did not supply a qualified answer. Use the linked source records; no simulation was executed.",
      });
      setReply(response.text + (response.ok
        ? "\n\nCouncil gateway answer; not an independently verified measurement or MEOK runtime attestation."
        : "\n\nGateway unavailable or answer rejected. No model or decision run is claimed."));
    } finally {
      setAsking(false);
    }
  }

  const event = eventAt(observatory, tick);
  return (
    <section aria-labelledby="council-world-title" data-testid="council-world-lens"
      className="mb-8 overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-100 bg-emerald-50/70 p-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800">Council OS · SovSpace spatial lens</p>
          <h2 id="council-world-title" className="mt-1 flex items-center gap-2 text-xl font-semibold text-emerald-950">
            <Globe2 className="h-5 w-5" aria-hidden="true" /> Council World
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-700">One workspace for geography, source-linked evidence, historical simulation and a guarded Council conversation. Real, synthetic and unverified records stay separate.</p>
        </div>
        <a href="/world/observatory/" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 underline">Original simulation archive <ExternalLink className="h-3 w-3" /></a>
      </div>

      <div role="tablist" aria-label="Council World perspectives" className="flex flex-wrap gap-2 border-b border-slate-200 p-3">
        {([
          ["globe", "3D Earth"],
          ["atlas", "OpenGridWorks atlas"],
          ["timeline", "SovSpace replay"],
          ["systems", "Systems & ontology"],
          ["benchmarks", "GSPC control room"],
        ] as const).map(([id, title]) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={"rounded-lg px-3 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-emerald-700 " +
              (mode === id ? "bg-emerald-800 text-white" : "border border-slate-200 bg-white text-slate-800 hover:bg-emerald-50")}>{title}</button>
        ))}
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(235px,290px)]">
        <div role="tabpanel" aria-label={mode === "globe" ? "3D globe" : mode === "atlas" ? "Regulation atlas" : mode === "systems" ? "Connected Council systems" : mode === "benchmarks" ? "Live GSPC axis evidence" : "Historical simulation replay"} className="min-w-0 bg-slate-950">
          {mode === "globe" ? (
            <iframe ref={frameRef} title="Council 3D Earth, source-reported markers"
              src="/globe3d.html" loading="lazy" onLoad={() => setStatus("Globe frame loaded; Cesium canvas and data freshness require independent verification.")}
              className="h-[410px] w-full border-0 sm:h-[520px]" />
          ) : mode === "atlas" ? (
            <iframe title="OpenGridWorks regulation atlas" src="/opengridworks?embed=1" loading="lazy"
              className="h-[410px] w-full border-0 bg-white sm:h-[520px]" />
          ) : mode === "benchmarks" ? (
            <div className="min-h-[410px] bg-[#f8fcfa] p-4 text-slate-900 sm:min-h-[520px]" data-testid="world-gspc-control-room">
              <h3 className="text-lg font-semibold text-emerald-950">GSPC · measurement control room</h3>
              <p className="mt-1 text-xs text-slate-700">
                The public board supplies every count and row. Measurement does not mean a model won, that a method is sufficient, or that an agent is safe to deploy.
              </p>
              {board ? (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Source-derived GSPC summary">
                    {[
                      { title: "Published axes", number: board.axes.length, detail: board.nMeasured + " with a measured status" },
                      { title: "Comparison axes", number: board.nModelComparison, detail: "A shared model test, not unique models" },
                      { title: "Separated leads", number: board.nSeparated, detail: "Only a qualifying separation" },
                      { title: "TIE / UNTESTED", number: board.nTie + board.nUntested, detail: board.nTie + " tied · " + board.nUntested + " untested" },
                    ].map((metric) => (
                      <div key={metric.title} className="rounded-lg border border-emerald-200 bg-white p-2.5">
                        <p className="text-[10px] font-semibold text-slate-700">{metric.title}</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-950">{metric.number}</p>
                        <p className="mt-1 text-[10px] text-slate-600">{metric.detail}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 rounded-lg border border-slate-200 bg-white p-2 text-[11px] leading-relaxed text-slate-700">
                    Source separation line: {board.separationLine}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <label className="min-w-0 flex-1 text-[11px] font-semibold text-slate-700">
                      Find an axis
                      <input type="search" value={axisQuery} onChange={(e) => setAxisQuery(e.target.value)}
                        placeholder="Search axis, task or family" className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" />
                    </label>
                    <label className="text-[11px] font-semibold text-slate-700">
                      Evidence state
                      <select value={axisFilter} onChange={(e) => setAxisFilter(e.target.value as typeof axisFilter)}
                        className="mt-1 block rounded-lg border border-slate-200 bg-white p-2 text-xs">
                        <option value="all">All axes</option>
                        <option value="model">Model comparisons</option>
                        <option value="tie">TIE</option>
                        <option value="untested">UNTESTED</option>
                        <option value="separated">SEPARATED</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-2 grid max-h-[300px] gap-2 overflow-y-auto sm:grid-cols-2" aria-live="polite" data-testid="world-axis-cards">
                    {board.axes.filter((a) => {
                      const query = axisQuery.trim().toLowerCase();
                      const hit = !query || (a.id + " " + a.family + " " + a.detail).toLowerCase().includes(query);
                      const match = axisFilter === "all" || axisFilter === "model" && a.kind === "model-comparison" ||
                        axisFilter === "tie" && a.separation === "TIE" ||
                        axisFilter === "untested" && a.separation === "UNTESTED" ||
                        axisFilter === "separated" && a.separation === "SEPARATED";
                      return hit && match;
                    }).map((a) => (
                      <a key={a.id} href={a.path}
                        className="block rounded-xl border border-slate-200 bg-white p-3 text-xs focus-visible:outline-2 focus-visible:outline-emerald-700 hover:border-emerald-500">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong className="capitalize text-emerald-900">{a.label}</strong>
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700">
                            {a.separation ?? a.status}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-600">{a.kind} · {a.family} · n={a.n ?? "not supplied"} · method: {a.method ?? "not supplied"}</p>
                        <p className="mt-1 line-clamp-2 text-[11px] text-slate-700">{a.detail}</p>
                      </a>
                    ))}
                    {board.axes.every((a) => {
                      const query = axisQuery.trim().toLowerCase();
                      return !( (!query || (a.id + " " + a.family + " " + a.detail).toLowerCase().includes(query)) &&
                        (axisFilter === "all" || axisFilter === "model" && a.kind === "model-comparison" ||
                        axisFilter === "tie" && a.separation === "TIE" ||
                        axisFilter === "untested" && a.separation === "UNTESTED" ||
                        axisFilter === "separated" && a.separation === "SEPARATED") );
                    }) && <p className="col-span-full rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
                      No axes match these filters. This is not evidence that no such issue exists.
                    </p>}
                  </div>
                  <a href="/dashboard?tab=results" className="mt-3 inline-block text-xs font-semibold text-emerald-800 underline">
                    Open complete benchmark records, sources, intervals and methods
                  </a>
                </>
              ) : (
                <p className="mt-4 rounded-lg border border-amber-200 bg-white p-4 text-sm text-amber-900">
                  GSPC source unavailable, rejected or still loading. No cached scores substituted.
                </p>
              )}
            </div>
          ) : mode === "systems" ? (
            <div className="min-h-[410px] bg-[#f8fcfa] p-4 text-slate-900 sm:min-h-[520px]" data-testid="world-ontology">
              <h3 className="text-lg font-semibold text-emerald-950">Systems &amp; ontology</h3>
              <p className="mb-3 mt-1 text-xs text-slate-700">
                An interactive index of actual Council OS destinations. Each link opens the existing working pane; this graph does not imply that all 16 backends are connected or live.
              </p>
              <div className="grid max-h-[440px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                {MISSIONS.map((mission) => (
                  <a key={mission.id} href={missionHref(mission)}
                    className="group rounded-xl border border-emerald-200 bg-white p-3 focus-visible:outline-2 focus-visible:outline-emerald-700 hover:border-emerald-500 hover:shadow-sm">
                    <div className="flex items-start justify-between gap-1">
                      <strong className="text-xs text-emerald-900">{mission.label}</strong>
                      <ExternalLink className="h-3 w-3 shrink-0 text-emerald-700" aria-hidden="true" />
                    </div>
                    <span className="mt-1 inline-block rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[9px] text-emerald-900">{mission.dataKind.replace(/_/g, " ")}</span>
                    <p className="mt-1 line-clamp-2 text-[11px] text-slate-700">{mission.promise}</p>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[410px] flex-col justify-center bg-slate-950 p-5 text-slate-100 sm:min-h-[520px]">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-300">Archived projection · not live simulation</p>
              <h3 className="mt-3 text-xl font-semibold">Event timeline</h3>
              {observatory && event ? (
                <>
                  <p className="mt-3 text-sm">Index {tick + 1} of {observatory.events.length} · {event.axis}</p>
                  <label className="mt-5 text-xs" htmlFor="world-tick">Scrub the archived events</label>
                  <input id="world-tick" type="range" min={0} max={observatory.events.length - 1} value={tick}
                    onChange={(e) => setTick(Number(e.target.value))} className="mt-2 accent-emerald-400" />
                  <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-4">
                    <p className="break-words font-mono text-xs text-emerald-200">{event.intent || "Source supplied no intent text; no meaning inferred."}</p>
                    <p className="mt-2 text-xs text-slate-300">Source timestamp: {new Date(event.sourceEpoch * 1000).toISOString()}</p>
                    <p className="mt-1 text-xs text-slate-300">Source row: {event.sourceIndex} · no verified geographic coordinates or signature</p>
                  </div>
                </>
              ) : <p className="mt-4 text-sm text-amber-200">Archive unavailable or not validated. No synthetic event is substituted.</p>}
              <a href="/world/observatory/" className="mt-5 text-sm font-semibold text-emerald-300 underline">Inspect original hash-linked source and limits</a>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4 border-l border-slate-200 bg-white p-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">World controls</h3>
            <p className="mt-1 text-xs text-slate-600">These controls only change the view. They do not run an agent, a simulation or a decision.</p>
          </div>
          <label className="text-xs font-medium text-slate-700">Go to region
            <select aria-label="Go to region" value={region} onChange={(e) => fly(e.target.value)} disabled={mode !== "globe"}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm">
              {Object.keys(WORLD_REGIONS).map((key) => <option key={key} value={key}>{key}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-700">Existing evidence layer
            <select aria-label="Evidence layer" value={layer} onChange={(e) => showLayer(e.target.value)} disabled={mode !== "globe"}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm">
              <option value="frameworks">Regulatory frameworks</option>
              <option value="gov">Council visual layer</option>
              <option value="ontology">Ontology relationships</option>
              <option value="cyber">Watchdog visual layer</option>
              <option value="fortune">Existing hive layer</option>
            </select>
          </label>
          <p role="status" className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">{status}</p>
          <div className="border-t border-slate-200 pt-3">
            <h3 className="flex items-center gap-1 text-sm font-semibold text-slate-900"><Layers className="h-4 w-4"/> Evidence readback</h3>
            <div className="mt-2 space-y-2" data-testid="world-source-status">
              {SOURCE_KEYS.map((key) => {
                const read = reads[key];
                return <div key={key} className="rounded-lg border border-slate-200 p-2">
                  <a href={WORLD_SOURCES[key]} className="text-xs font-semibold text-emerald-800 underline">{read?.fact?.label || key}</a>
                  <p className="mt-1 text-xs font-medium text-slate-900">{read?.phase === "ready" ? read.fact?.value : read?.phase === "unavailable" ? "UNCHECKABLE" : "Reading…"}</p>
                  {read?.fact?.sourceDate && <p className="mt-1 break-words text-[10px] text-slate-600">Source date: {read.fact.sourceDate}</p>}
                  {read?.fact && <p className="mt-1 text-[10px] leading-relaxed text-slate-600">{read.fact.caveat}</p>}
                  {read?.phase === "unavailable" && <p className="text-[10px] text-amber-900">{read.error}</p>}
                </div>;
              })}
            </div>
          </div>
        </aside>
      </div>

      <section className="border-t border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="world-workflows-title" data-testid="world-mission-router">
        <h3 id="world-workflows-title" className="text-base font-semibold text-emerald-950">
          Choose a real workflow
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-700">
          An objective becomes a suggested Council OS view, never an executed instruction. All 16 destinations reuse existing panes and their own identity, evidence and permission checks.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="text-xs font-semibold text-slate-800">Workflow
            <select value={selectedMission} onChange={(e) => { setSelectedMission(e.target.value as MissionId); setSuggestedMission(null); }}
              className="mt-1 block w-full rounded-lg border border-emerald-200 bg-white p-2.5 text-sm">
              {MISSIONS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </label>
          <a href={missionHref(missionForId(selectedMission)!)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-center text-sm font-semibold text-white">
            Open existing Council OS pane <ExternalLink className="h-3.5 w-3.5"/>
          </a>
        </div>
        {(() => {
          const m = missionForId(selectedMission)!;
          return <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs" data-testid="world-mission-detail">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-emerald-900">{m.label}</span>
              <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] text-slate-700">{m.dataKind.replace(/_/g, " ")}</span>
              {suggestedMission === m.id && <span className="rounded bg-white px-2 py-0.5 text-[10px] text-emerald-800">Suggested by your question</span>}
            </div>
            <p className="mt-2 text-slate-800">{m.promise}</p>
            <p className="mt-1 text-amber-950">{m.boundary}</p>
            <p className="mt-2 text-slate-600">AI staff desk: {DESKS[m.desk].name}. Staff answers are not binding decisions by a person.</p>
          </div>;
        })()}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-slate-700">Speak with an existing AI staff member
            <select aria-label="AI staff desk" value={staffDesk} onChange={(e) => { setStaffDesk(e.target.value as DeskId); setStaffOpen(true); }}
              className="ml-2 rounded-lg border border-slate-200 bg-white p-2 text-xs">
              {(["measure", "press", "revenue", "watchdog", "academy", "verify"] as const).map((desk) => (
                <option key={desk} value={desk}>{DESKS[desk].name}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => setStaffOpen((open) => !open)}
            aria-expanded={staffOpen} aria-controls="world-ai-staff-chat"
            className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-900">
            {staffOpen ? "Close AI staff" : "Talk to AI staff"}
          </button>
        </div>
        {staffOpen && <div id="world-ai-staff-chat" className="mt-3" data-testid="world-him-staff">
          <p className="mb-2 text-xs text-amber-900">AI assistant only; escalation is not approval. Uses the existing /api/pals staff service, not a duplicate chatbot.</p>
          <PalAskPanel key={staffDesk} desk={staffDesk} onClose={() => setStaffOpen(false)} />
        </div>}
      </section>
      <form onSubmit={ask} className="border-t border-slate-200 bg-emerald-50/50 p-4">
        <label htmlFor="council-world-question" className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
          <MessageCircle className="h-4 w-4"/> Ask the Council and focus the world
        </label>
        <p className="mb-2 mt-1 text-xs text-slate-700">
          A bounded question uses the existing Council chat gateway; region/layer commands only navigate the globe. This does not verify MEOK as the responding model.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input id="council-world-question" value={prompt} maxLength={600} onChange={(e) => setPrompt(e.target.value)}
            placeholder="Show UK governance evidence and explain the source dates"
            className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm" />
          <button type="submit" disabled={!prompt.trim() || asking}
            className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {asking ? "Reading…" : "Ask and focus"}
          </button>
        </div>
        {reply && <div className="mt-3 whitespace-pre-wrap rounded-lg border border-emerald-200 bg-white p-3 text-sm text-slate-900" role="status">{reply}</div>}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
          <a href="#arena-practice" className="font-semibold text-emerald-800 underline">Practice decisions in this workspace</a>
          <a href="/gspc-verify" className="inline-flex items-center gap-1 font-semibold text-emerald-800 underline"><ShieldCheck className="h-3 w-3"/> Verify signed evidence</a>
          <a href="/globe" className="font-semibold text-emerald-800 underline">Original Council Globe</a>
          <a href="/world/observatory/" className="font-semibold text-emerald-800 underline">Open full event archive</a>
        </div>
      </form>
    </section>
  );
}
