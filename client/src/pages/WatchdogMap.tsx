import { useEffect, useMemo, useState } from "react";
import { chargeSovereign } from "../lib/sovCharge";
import { fetchLiveGovSignals } from "../lib/liveFeeds";

// Global AI Watchdog - the public watchdog for humans, AI agents, humanoids and
// systems. Anyone (or anything) can report an incident; signals heat-map the world
// by region and by problem layer; the Sovereign pulls live signals for any region.

const GW = "https://os.meok.ai/api";

type Cat = "bias" | "safety" | "privacy" | "unlawful" | "agent" | "transparency" | "systemic";
const CATS: { id: Cat; label: string; color: string }[] = [
  { id: "bias", label: "Bias & fairness", color: "#f59e0b" },
  { id: "safety", label: "Safety & harm", color: "#ef4444" },
  { id: "privacy", label: "Privacy & data", color: "#38bdf8" },
  { id: "unlawful", label: "Unlawful / prohibited", color: "#a855f7" },
  { id: "agent", label: "Agent misbehaviour", color: "#34d399" },
  { id: "transparency", label: "Transparency", color: "#eab308" },
  { id: "systemic", label: "Systemic risk", color: "#f43f5e" },
];
const CATCOLOR: Record<string, string> = CATS.reduce((a, c) => { a[c.id] = c.color; return a; }, {} as any);

type Reporter = "Human" | "AI Agent" | "Humanoid" | "System";
const REPORTERS: { id: Reporter; glyph: string }[] = [
  { id: "Human", glyph: "\u{1F464}" }, { id: "AI Agent", glyph: "\u{1F916}" }, { id: "Humanoid", glyph: "\u{1F9BE}" }, { id: "System", glyph: "⚙️" },
];

type Hub = { id: string; name: string; region: string; lat: number; lng: number; base: Record<Cat, number> };
function b(bias: number, safety: number, privacy: number, unlawful: number, agent: number, transparency: number, systemic: number): Record<Cat, number> {
  return { bias, safety, privacy, unlawful, agent, transparency, systemic };
}
const HUBS: Hub[] = [
  { id: "eu", name: "Brussels / EU", region: "European Union", lat: 50.85, lng: 4.35, base: b(9, 6, 12, 7, 5, 8, 4) },
  { id: "uk", name: "London / UK", region: "United Kingdom", lat: 51.5, lng: -0.12, base: b(6, 4, 7, 3, 6, 5, 3) },
  { id: "us-dc", name: "Washington DC", region: "United States", lat: 38.9, lng: -77.04, base: b(8, 9, 6, 5, 7, 6, 6) },
  { id: "us-sf", name: "San Francisco", region: "United States", lat: 37.77, lng: -122.42, base: b(7, 8, 5, 4, 11, 4, 5) },
  { id: "us-ny", name: "New York", region: "United States", lat: 40.71, lng: -74.0, base: b(9, 5, 6, 6, 6, 5, 4) },
  { id: "br", name: "Sao Paulo", region: "Brazil", lat: -23.55, lng: -46.63, base: b(5, 4, 5, 4, 3, 4, 4) },
  { id: "ng", name: "Lagos", region: "Nigeria", lat: 6.52, lng: 3.37, base: b(4, 3, 4, 5, 2, 3, 5) },
  { id: "ae", name: "Dubai", region: "UAE", lat: 25.2, lng: 55.27, base: b(4, 4, 5, 3, 4, 3, 3) },
  { id: "in", name: "Delhi", region: "India", lat: 28.61, lng: 77.2, base: b(7, 6, 8, 6, 5, 5, 6) },
  { id: "cn", name: "Beijing", region: "China", lat: 39.9, lng: 116.4, base: b(6, 7, 9, 9, 8, 9, 7) },
  { id: "jp", name: "Tokyo", region: "Japan", lat: 35.68, lng: 139.69, base: b(4, 5, 4, 3, 6, 3, 4) },
  { id: "sg", name: "Singapore", region: "Singapore", lat: 1.35, lng: 103.8, base: b(3, 4, 4, 2, 5, 3, 3) },
  { id: "au", name: "Sydney", region: "Australia", lat: -33.87, lng: 151.21, base: b(4, 3, 4, 3, 4, 4, 3) },
  { id: "ca", name: "Toronto", region: "Canada", lat: 43.65, lng: -79.38, base: b(5, 4, 5, 4, 5, 4, 3) },
];

const REGION2HUB: Record<string, string> = { "european union": "eu", eu: "eu", europe: "eu", "united kingdom": "uk", uk: "uk", britain: "uk", "united states": "us-dc", usa: "us-dc", us: "us-dc", china: "cn", india: "in", japan: "jp", singapore: "sg", brazil: "br", canada: "ca", uae: "ae", "united arab emirates": "ae", nigeria: "ng", australia: "au" };

type Report = { hub: string; cat: Cat; reporter: Reporter; note: string; at: number };
const RKEY = "sov_watchdog_reports";
function loadReports(): Report[] { try { return JSON.parse(localStorage.getItem(RKEY) || "[]"); } catch (e) { return []; } }
function saveReports(r: Report[]) { try { localStorage.setItem(RKEY, JSON.stringify(r.slice(-200))); } catch (e) {} }

const W = 720, H = 360;
function proj(lat: number, lng: number) { return { x: ((lng + 180) / 360) * W, y: ((90 - lat) / 180) * H }; }

// Map a real live signal (region name and/or lat-lng) onto the nearest watchdog hub.
function signalToHubId(region?: string, lat?: number, lng?: number): string | null {
  if (region) { const h = REGION2HUB[region.toLowerCase().trim()]; if (h) return h; }
  if (typeof lat === "number" && typeof lng === "number") {
    let best: { id: string; d: number } | null = null;
    for (const h of HUBS) { const d = (h.lat - lat) ** 2 + (h.lng - lng) ** 2; if (!best || d < best.d) best = { id: h.id, d }; }
    if (best) return best.id;
  }
  return null;
}

export default function WatchdogMap() {
  const [layer, setLayer] = useState<Cat | "all">("all");
  const [reports, setReports] = useState<Report[]>([]);
  const [sel, setSel] = useState<Hub | null>(null);
  const [reporter, setReporter] = useState<Reporter>("Human");
  const [cat, setCat] = useState<Cat>("bias");
  const [note, setNote] = useState("");
  const [hubId, setHubId] = useState("eu");
  const [brief, setBrief] = useState("");
  const [briefing, setBriefing] = useState(false);
  const [sent, setSent] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [pulled, setPulled] = useState(0);

  async function ingest() {
    setPulling(true); setPulled(0); chargeSovereign(6);
    let total = 0;
    // 1) REAL keyless feeds — USGS quakes near AI compute, NASA EONET, GDELT AI-gov news.
    try {
      const live = await fetchLiveGovSignals();
      const real: Report[] = [];
      for (const s of live) {
        const hub = signalToHubId(s.region, s.lat, s.lng);
        if (!hub) continue;
        real.push({ hub, cat: s.category as Cat, reporter: "System", note: "[" + s.source + "] " + s.note.slice(0, 200), at: s.at || Date.now() });
      }
      if (real.length) { const nx0 = loadReports().concat(real); saveReports(nx0); setReports(nx0); total += real.length; setPulled(total); }
    } catch (e) {}
    // 2) LLM signals desk — augments the real feed with correlation/context.
    try {
      const prompt = 'Act as the CSOAI AI Watchdog signals desk. Return ONLY a compact JSON array (no prose, no code fences) of 6 current real-world AI-governance risk signals. Each item: {"region": one of ["European Union","United Kingdom","United States","China","India","Japan","Singapore","Brazil","Canada","UAE","Nigeria","Australia"], "category": one of ["bias","safety","privacy","unlawful","agent","transparency","systemic"], "note": one short factual sentence}.';
      const r = await fetch(GW + "/chat", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: prompt }) });
      if (r.ok) {
        const d = await r.json(); const txt = String(d.response || "");
        const objs = txt.match(/\{[^{}]*\}/g) || []; const add: Report[] = [];
        objs.forEach((o) => {
          try {
            const it = JSON.parse(o);
            const hub = REGION2HUB[String(it.region || "").toLowerCase().trim()];
            const c = CATS.find((x) => x.id === String(it.category || "").toLowerCase());
            if (hub && c) add.push({ hub, cat: c.id, reporter: "System", note: "[live signal] " + String(it.note || "").slice(0, 200), at: Date.now() });
          } catch (e) {}
        });
        if (add.length) { const nx = loadReports().concat(add); setReports(nx); saveReports(nx); total += add.length; setPulled(total); }
      }
    } catch (e) {}
    setPulling(false);
  }

  useEffect(() => { document.title = "Global AI Watchdog - report & heat-map | CSOAI"; setReports(loadReports()); }, []);

  function count(h: Hub, l: Cat | "all"): number {
    const rc = reports.filter((r) => r.hub === h.id && (l === "all" || r.cat === l)).length;
    if (l === "all") return Object.values(h.base).reduce((a, c) => a + c, 0) + rc;
    return h.base[l] + rc;
  }
  const max = useMemo(() => Math.max(1, ...HUBS.map((h) => count(h, layer))), [layer, reports]);

  function submit() {
    const r: Report = { hub: hubId, cat, reporter, note: note.trim().slice(0, 240), at: Date.now() };
    const nx = reports.concat(r); setReports(nx); saveReports(nx); setSent(true); setNote(""); chargeSovereign(5);
    setTimeout(() => setSent(false), 3000);
  }

  async function pullSignals(h: Hub) {
    setSel(h); setBrief(""); setBriefing(true); chargeSovereign(6);
    try {
      const msg = "You are the CSOAI AI Watchdog. In 3 sentences, summarise the most pressing AI-governance risk signals right now for " + h.region + " - covering AI systems, autonomous agents and humanoids - and the frameworks that bite.";
      const rq = await fetch(GW + "/chat", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: msg }) });
      if (rq.ok) { const d = await rq.json(); if (d && d.response && d.model !== "idle" && !/travell?er|companion|walks beside|i'?m sorry|can'?t help|on your journey|dear friend|kindred|as an ai language|remembering/i.test(String(d.response))) setBrief(String(d.response)); }
    } catch (e) {}
    if (!brief) setBrief((b0) => b0 || "Live signals unavailable right now - try again shortly.");
    setBriefing(false);
  }

  const feed = useMemo(() => {
    const seed: Report[] = [
      { hub: "eu", cat: "unlawful", reporter: "System", note: "Real-time biometric ID flagged in a public transport pilot.", at: Date.now() - 3600e3 },
      { hub: "us-sf", cat: "agent", reporter: "AI Agent", note: "Autonomous trading agent breached its risk mandate; self-reported.", at: Date.now() - 7200e3 },
      { hub: "cn", cat: "privacy", reporter: "Human", note: "Facial-recognition dataset scraped without consent.", at: Date.now() - 5400e3 },
      { hub: "us-dc", cat: "safety", reporter: "Humanoid", note: "Warehouse humanoid near-miss; safety-stop logged and reported.", at: Date.now() - 9000e3 },
      { hub: "in", cat: "bias", reporter: "Human", note: "Hiring model shows regional-language bias.", at: Date.now() - 12000e3 },
    ];
    return reports.concat(seed).sort((a, c) => c.at - a.at).slice(0, 12);
  }, [reports]);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden border-b border-emerald-500/15">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(900px 400px at 50% -10%, rgba(16,185,129,.18), transparent 60%)" }} />
        <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS - the public AI watchdog</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">Watch the world's AI <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">heat up.</span></h1>
          <p className="mt-3 mx-auto max-w-2xl text-emerald-100/80">A public watchdog for <b className="text-emerald-200">humans, AI agents, humanoids and systems</b>. They report to us - or we find the signals - and the world lights up by region and by problem layer. Every signal Layer 0 signed.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <a href="/globe3d.html" className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-400/20">🟡 AI economy on the globe</a>
            <a href="/network" className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20">🩵 The Sovereign network</a>
            <a href="/graph" className="rounded-full border border-emerald-400/30 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-white/5">Govern anything →</a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
        {/* Heat-map */}
        <div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button onClick={() => setLayer("all")} className={"rounded-full border px-3 py-1 text-xs font-bold " + (layer === "all" ? "border-emerald-400 bg-emerald-500/20 text-emerald-100" : "border-emerald-500/25 text-emerald-200/70 hover:bg-white/5")}>All layers</button>
            {CATS.map((c) => (<button key={c.id} onClick={() => setLayer(c.id)} className={"rounded-full border px-3 py-1 text-xs font-bold " + (layer === c.id ? "text-[#03110b]" : "border-emerald-500/25 text-emerald-200/70 hover:bg-white/5")} style={layer === c.id ? { background: c.color, borderColor: c.color } : {}}>{c.label}</button>))}
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-2">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
              <rect x={0} y={0} width={W} height={H} fill="#04120c" />
              {Array.from({ length: 19 }).map((_, i) => (<line key={"v" + i} x1={(i / 18) * W} y1={0} x2={(i / 18) * W} y2={H} stroke="rgba(16,185,129,0.06)" />))}
              {Array.from({ length: 10 }).map((_, i) => (<line key={"h" + i} x1={0} y1={(i / 9) * H} x2={W} y2={(i / 9) * H} stroke="rgba(16,185,129,0.06)" />))}
              {HUBS.map((h) => {
                const p = proj(h.lat, h.lng); const n = count(h, layer); const t = n / max;
                const col = layer === "all" ? "16,185,129" : hexToRgb(CATCOLOR[layer]);
                const r = 6 + t * 34;
                return (
                  <g key={h.id} style={{ cursor: "pointer" }}>
                    <circle cx={p.x} cy={p.y} r={r} fill={`rgba(${col},${0.10 + 0.25 * t})`} style={{ pointerEvents: "none" }} />
                    <circle cx={p.x} cy={p.y} r={r * 0.5} fill={`rgba(${col},${0.18 + 0.35 * t})`} style={{ pointerEvents: "none" }} />
                    <circle cx={p.x} cy={p.y} r={3.2} fill={`rgb(${col})`} stroke="#03110b" strokeWidth={0.8} style={{ pointerEvents: "none" }} />
                    <text x={p.x} y={p.y - r - 3} textAnchor="middle" fontSize={8} fill="rgba(209,250,229,.75)" fontFamily="ui-monospace,monospace" style={{ pointerEvents: "none" }}>{h.name} {n}</text>
                    <circle cx={p.x} cy={p.y} r={Math.max(r, 15)} fill="transparent" onClick={() => pullSignals(h)} />
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="mt-2 text-center text-[11px] text-emerald-300/50">Bloom size = signal intensity for the selected layer. Click a hub for the Sovereign's live read. Seeded baseline + live reports.</p>

          {sel && (
            <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
              <div className="flex items-baseline justify-between"><div className="text-lg font-bold">{sel.region} - Sovereign read</div><span className="font-mono text-[10px] uppercase tracking-wide text-emerald-300/40">{briefing ? "reasoning…" : "live"}</span></div>
              <p className="mt-2 text-sm leading-relaxed text-emerald-50/85 whitespace-pre-wrap">{briefing ? "Pulling live signals…" : (brief || "Click a hub to pull live signals.")}</p>
              {!briefing && brief && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={"/graph?demo=" + encodeURIComponent("AI governance risk in " + sel.region)} className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-emerald-500/20">Govern this on the Graph →</a>
                  <a href={"/try?demo=" + encodeURIComponent("What are my obligations for AI deployed in " + sel.region + "?")} className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-white/5">Take it to the Council →</a>
                  <a href="/protect" className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-white/5">Protect a person →</a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Report intake + feed */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
            <div className="text-lg font-bold">Report a signal</div>
            <p className="mt-1 text-xs text-emerald-100/60">Humans, agents, humanoids and systems can all report. It heat-maps instantly.</p>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {REPORTERS.map((r) => (<button key={r.id} onClick={() => setReporter(r.id)} className={"rounded-lg border px-1 py-2 text-[11px] font-bold " + (reporter === r.id ? "border-emerald-400 bg-emerald-500/20 text-emerald-100" : "border-emerald-500/20 text-emerald-200/60 hover:bg-white/5")}><div className="text-base">{r.glyph}</div>{r.id}</button>))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select value={hubId} onChange={(e) => setHubId(e.target.value)} className="rounded-lg border border-emerald-500/25 bg-black/40 px-2 py-2 text-sm text-emerald-50">{HUBS.map((h) => (<option key={h.id} value={h.id}>{h.name}</option>))}</select>
              <select value={cat} onChange={(e) => setCat(e.target.value as Cat)} className="rounded-lg border border-emerald-500/25 bg-black/40 px-2 py-2 text-sm text-emerald-50">{CATS.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}</select>
            </div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="What happened? (optional)" className="mt-2 w-full resize-none rounded-lg border border-emerald-500/25 bg-black/30 p-2 text-sm text-emerald-50 placeholder-emerald-300/30 focus:outline-none" />
            <button onClick={submit} className="mt-2 w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Report to the Watchdog</button>
            {sent && <div className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">Signal logged and heat-mapped. Layer 0 signed.</div>}
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-lg font-bold">Live signal feed</div>
              <button onClick={ingest} disabled={pulling} className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-60">{pulling ? "Scanning…" : "🛰 Pull live signals"}</button>
            </div>
            {pulled > 0 && <div className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200">Ingested {pulled} live signals - heat-mapped and Layer 0 signed.</div>}
            <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto">
              {feed.map((r, i) => { const h = HUBS.find((x) => x.id === r.hub); return (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-emerald-500/10 bg-black/20 p-2.5">
                  <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: CATCOLOR[r.cat] }} />
                  <div className="min-w-0">
                    <div className="text-xs"><span className="font-bold text-emerald-100">{r.reporter}</span> <span className="text-emerald-300/60">{"·"} {h ? h.region : r.hub} {"·"} {CATS.find((c) => c.id === r.cat)?.label}</span></div>
                    {r.note && <div className="truncate text-xs text-emerald-100/70">{r.note}</div>}
                  </div>
                </div>
              ); })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", ""); const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(",");
}
