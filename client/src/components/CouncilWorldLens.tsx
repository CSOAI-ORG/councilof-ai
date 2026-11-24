import { useEffect, useRef, useState, type FormEvent } from "react";
import { Globe2, RotateCcw, MessageCircle, ExternalLink, Layers, ShieldCheck } from "lucide-react";
import { askSovereign } from "@/lib/sovAsk";
import { sovActions } from "@/lib/sovAgent";
import {
  WORLD_SOURCES, eventAt, parseObservatory, parseWorldFact,
  type Observatory, type WorldFact, type WorldFactKey,
} from "@/lib/worldLens";

type WorldMode = "globe" | "atlas" | "timeline";
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
  const [tick, setTick] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [asking, setAsking] = useState(false);
  const [status, setStatus] = useState("Globe is a view, not a live agent or a real-world outcome.");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    setReads(Object.fromEntries(SOURCE_KEYS.map((key) => [key, { phase: "loading" }])) as Partial<Record<WorldFactKey, ReadState>>);
    setObservatory(null);
    for (const key of SOURCE_KEYS) {
      fetch(WORLD_SOURCES[key], { headers: { accept: "application/json" }, cache: "no-store", signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("HTTP " + response.status);
          const data: unknown = await response.json();
          const fact = parseWorldFact(key, data);
          if (key === "observatory") setObservatory(parseObservatory(data));
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
        ] as const).map(([id, title]) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={"rounded-lg px-3 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-emerald-700 " +
              (mode === id ? "bg-emerald-800 text-white" : "border border-slate-200 bg-white text-slate-800 hover:bg-emerald-50")}>{title}</button>
        ))}
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(235px,290px)]">
        <div role="tabpanel" aria-label={mode === "globe" ? "3D globe" : mode === "atlas" ? "Regulation atlas" : "Historical simulation replay"} className="min-w-0 bg-slate-950">
          {mode === "globe" ? (
            <iframe ref={frameRef} title="Council 3D Earth, source-reported markers"
              src="/globe3d.html" loading="lazy" onLoad={() => setStatus("Globe frame loaded; Cesium canvas and data freshness require independent verification.")}
              className="h-[410px] w-full border-0 sm:h-[520px]" />
          ) : mode === "atlas" ? (
            <iframe title="OpenGridWorks regulation atlas" src="/opengridworks?embed=1" loading="lazy"
              className="h-[410px] w-full border-0 bg-white sm:h-[520px]" />
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
                    <p className="break-words font-mono text-xs text-emerald-200">{event.intent}</p>
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
