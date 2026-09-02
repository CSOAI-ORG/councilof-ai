import { useEffect, useRef, useState } from "react";
import { chargeSovereign } from "../lib/sovCharge";
import { askSovereign } from "../lib/sovAsk";
import { sovActions, describeActions } from "../lib/sovAgent";
import { flyAndConvene, drive } from "../lib/globeDrive";
import { REGIONS } from "../lib/locale";
import { Link } from "wouter";
import CouncilNav from "../components/CouncilNav";
import AISystemNotice from "../components/AISystemNotice";
import { LAYER0_NODES, PERSONA_TOURS, STATUS_COLOR, COUNTS, type Persona } from "../data/layer0Nodes";

// sovAgent region name → 3D globe REGIONS code + globe3d layer tag maps (module-level).
const REGION3D: Record<string, string> = { EU: "EU", UK: "UK", US: "US", CANADA: "CA", JAPAN: "JP", KOREA: "KR", CHINA: "CN", SINGAPORE: "SG", INDIA: "IN" };
const LAYER3D: Record<string, string> = { fw: "frameworks", council: "gov", watchdog: "cyber", ontology: "ontology", hive: "fortune" };

const GLOBE_GW = "/api";
const PLACE_HINTS: { re: RegExp; id: string }[] = [
  { re: /\beu\b|europe|brussels|german|france|spain|italy|ireland/i, id: "euaa" },
  { re: /fedramp|oscal|\bdc\b|washington/i, id: "fedramp" },
  { re: /\bus\b|usa|america|nist/i, id: "nist" },
  { re: /california|ccpa|cpra|sacramento/i, id: "ccpa" },
  { re: /new york|\bnyc\b|ll144/i, id: "nyc" },
  { re: /\buk\b|britain|london|england/i, id: "uk" },
  { re: /canada|aida|ottawa/i, id: "aida" },
  { re: /china|beijing|pipl/i, id: "pipl" },
  { re: /singapore/i, id: "sg" },
];
const GLOBE_IND = ["healthcare", "hospital", "clinical", "fintech", "finance", "banking", "insurance", "hr", "hiring", "recruiting", "education", "retail", "defense", "government", "pharma", "biotech", "energy", "telecom", "legal", "gaming", "crypto"];
async function globeChat(msg: string): Promise<string> { const res = await askSovereign(msg); return res.ok ? res.text : ""; }
async function globeGovern(q: string): Promise<any> { try { const r = await fetch(GLOBE_GW + "/govern?q=" + encodeURIComponent(q)); if (r.ok) { const d = await r.json(); if (d && d.matched) return d; } } catch (e) {} return null; }

// WorldGlobe - a living, layered, zero-dependency world globe. Auto-rotates (pure SVG
// orthographic projection), pins every framework temple at its real lat/long, layers
// the Council of AI, and lets you click any pin for its detail. No external deps.

type Pin = { id: string; name: string; region: string; lat: number; lng: number; color: string; href: string; note: string };
type HiveAccount = { id: string; name: string; type: string; region: string; country: string; hq: [number, number]; play: string; gap: number; maxGap: number; confidence: string; topUsp: string | null };
function hiveColor(h: HiveAccount): string {
  if (h.confidence === "n/a-authority") return "#38bdf8"; // regulator/authority - blue
  if (h.confidence === "verified") return "#34d399"; // real, cited governance posture - green
  return "#94a3b8"; // modeled/unconfirmed - grey
}
// Audit fix (2026-07-08): several real accounts share an identical or near-identical [lng,lat]
// (e.g. Citigroup/Goldman Sachs/Verizon all authored at the same Lower-Manhattan point) -- at
// world-globe zoom this stacks their dots exactly on top of each other, so only the last-rendered
// one is ever visible or clickable and the others are silently unreachable. Apply a small,
// deterministic (id-hash-seeded, so stable across reloads) offset to every member of a cluster
// after the first, spread in a ring so each stays clickable without moving anyone to a wrong city.
function deconflictHiveCoords(accounts: HiveAccount[]): HiveAccount[] {
  const seen = new Map<string, number>(); // "lng,lat" (rounded) -> count already placed
  const hashSeed = (id: string) => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return h; };
  return accounts.map((a) => {
    const key = a.hq[0].toFixed(2) + "," + a.hq[1].toFixed(2);
    const n = seen.get(key) || 0;
    seen.set(key, n + 1);
    if (n === 0) return a; // first one at this point keeps the real coordinate
    const angle = (hashSeed(a.id) % 360) * (Math.PI / 180);
    const ringRadius = 0.35 * n; // degrees -- small enough to stay visually "at" the same city
    const lng = a.hq[0] + ringRadius * Math.cos(angle);
    const lat = a.hq[1] + ringRadius * Math.sin(angle);
    return { ...a, hq: [lng, lat] as [number, number] };
  });
}
const FRAMEWORKS: Pin[] = [
  { id: "euaa", name: "EU AI Act", region: "EU", lat: 50.85, lng: 4.35, color: "#2563eb", href: "/readiness", note: "Transparency 2 Aug 2026; high-risk Dec 2027 (Omnibus). Brussels." },
  { id: "gdpr", name: "GDPR", region: "EU", lat: 50.85, lng: 4.36, color: "#1d4ed8", href: "/meok-law", note: "Data + automated-decision safeguards. Brussels." },
  { id: "coe", name: "Council of Europe AI Treaty", region: "EU", lat: 48.57, lng: 7.75, color: "#7c3aed", href: "/meok-law", note: "First binding AI human-rights treaty. Strasbourg." },
  { id: "oecd", name: "OECD AI Principles", region: "Global", lat: 48.85, lng: 2.35, color: "#0ea5e9", href: "/regions", note: "Soft-law baseline shaping allied policy. Paris." },
  { id: "iso", name: "ISO/IEC 42001", region: "Global", lat: 46.2, lng: 6.14, color: "#059669", href: "/temples", note: "AI management-system standard. Geneva." },
  { id: "nist", name: "NIST AI RMF", region: "US", lat: 39.14, lng: -77.22, color: "#dc2626", href: "/fedramp", note: "De-facto US risk-management baseline. Gaithersburg." },
  { id: "fedramp", name: "FedRAMP / OSCAL", region: "US", lat: 38.9, lng: -77.04, color: "#b91c1c", href: "/fedramp", note: "RFC-0024 machine-readable mandate, 30 Sep 2026. Washington DC." },
  { id: "ccpa", name: "CCPA / CPRA", region: "US", lat: 38.58, lng: -121.49, color: "#ea580c", href: "/regions", note: "Profiling + opt-out rights. Sacramento." },
  { id: "nyc", name: "NYC LL144", region: "US", lat: 40.71, lng: -74.0, color: "#f59e0b", href: "/sectors", note: "Annual AEDT bias-audit attestation. New York." },
  { id: "uk", name: "UK pro-innovation AI", region: "UK", lat: 51.5, lng: -0.12, color: "#9333ea", href: "/regions", note: "Principles-based, regulator-led. London." },
  { id: "aida", name: "Canada AIDA (C-27)", region: "Canada", lat: 45.42, lng: -75.7, color: "#e11d48", href: "/regions", note: "High-impact systems regime. Ottawa." },
  { id: "pipl", name: "China PIPL", region: "APAC", lat: 39.9, lng: 116.4, color: "#16a34a", href: "/meok-law", note: "Personal-information protection + algorithm rules. Beijing." },
  { id: "sg", name: "Singapore Model AI", region: "APAC", lat: 1.35, lng: 103.8, color: "#0d9488", href: "/regions", note: "Voluntary governance framework + testing. Singapore." },
];
const COUNCIL: Pin[] = [
  { id: "barnaby", name: "Barnaby (Governance)", region: "Council", lat: 20, lng: -30, color: "#059669", href: "/dragonfly", note: "Compliance wing." },
  { id: "oracle", name: "Oracle (Intelligence)", region: "Council", lat: -10, lng: 60, color: "#2563eb", href: "/dragonfly", note: "Analysis + prediction wing." },
  { id: "vex", name: "Vex (Safety)", region: "Council", lat: 35, lng: 140, color: "#dc2626", href: "/dragonfly", note: "Harm-prevention wing." },
  { id: "phantom", name: "Phantom (Cyber)", region: "Council", lat: -30, lng: -60, color: "#7c3aed", href: "/dragonfly", note: "Defense wing." },
  { id: "speaker", name: "Council Speaker", region: "Council", lat: 0, lng: 0, color: "#0f766e", href: "/try", note: "Neutral facilitation." },
];

// Watchdog heat hubs (shared with /watchdog-map) - integrated as a globe overlay.
const WATCH_HUBS: { id: string; lat: number; lng: number; base: number }[] = [
  { id: "eu", lat: 50.85, lng: 4.35, base: 51 }, { id: "uk", lat: 51.5, lng: -0.12, base: 34 },
  { id: "us-dc", lat: 38.9, lng: -77.04, base: 47 }, { id: "us-sf", lat: 37.77, lng: -122.42, base: 44 },
  { id: "us-ny", lat: 40.71, lng: -74.0, base: 41 }, { id: "br", lat: -23.55, lng: -46.63, base: 29 },
  { id: "ng", lat: 6.52, lng: 3.37, base: 26 }, { id: "ae", lat: 25.2, lng: 55.27, base: 26 },
  { id: "in", lat: 28.61, lng: 77.2, base: 43 }, { id: "cn", lat: 39.9, lng: 116.4, base: 55 },
  { id: "jp", lat: 35.68, lng: 139.69, base: 29 }, { id: "sg", lat: 1.35, lng: 103.8, base: 24 },
  { id: "au", lat: -33.87, lng: 151.21, base: 25 }, { id: "ca", lat: 43.65, lng: -79.38, base: 30 },
];
function watchCounts(): Record<string, number> {
  const c: Record<string, number> = {}; WATCH_HUBS.forEach((h) => { c[h.id] = h.base; });
  try { const rs = JSON.parse(localStorage.getItem("sov_watchdog_reports") || "[]"); (rs as any[]).forEach((r) => { if (c[r.hub] != null) c[r.hub] += 1; }); } catch (e) {}
  return c;
}

// Rogue-swarm cluster over London - the public mirror of the OS 3D neutralize.
const THREAT_ORIGIN = { lat: 51.5, lng: -0.12 };
const THREAT_PTS = Array.from({ length: 16 }, (_, i) => ({ dlat: Math.sin(i * 1.3) * 3.4, dlng: Math.cos(i * 0.9) * 4.6 }));

// Map globe framework pins to their Framework Hive entry (everything collected).
const HIVE_SLUG: Record<string, string> = {
  euaa: "eu-ai-act", gdpr: "gdpr", coe: "council-of-europe-ai-convention", oecd: "oecd-ai-principles",
  iso: "iso-42001", nist: "nist-ai-rmf", uk: "uk-aisi", sg: "singapore-agentic-ai",
};

const R = 240, CX = 300, CY = 300;
function project(lat: number, lng: number, rot: number) {
  const la = (lat * Math.PI) / 180, lo = ((lng + rot) * Math.PI) / 180;
  const x = R * Math.cos(la) * Math.sin(lo);
  const y = R * Math.sin(la);
  const front = Math.cos(la) * Math.cos(lo) > 0;
  return { x: CX + x, y: CY - y, front, depth: Math.cos(la) * Math.cos(lo) };
}

export default function WorldGlobe() {
  useEffect(() => {
    document.title = "The Council Globe - AI governance, layered on the world | CSOAI";
    // Handoff from Sov Space: /globe?ask=… auto-asks + drives the globe agentically.
    try { const a = new URLSearchParams(window.location.search).get("ask"); if (a) { setAsk(a); setTimeout(() => runAsk(a), 400); } } catch (e) {}
  }, []);
  useEffect(() => { const d = new URLSearchParams(window.location.search).get("demo"); if (d) { setAsk(d); const t = setTimeout(() => runAsk(d), 700); return () => clearTimeout(t); } }, []);
  const [hiveAccounts, setHiveAccounts] = useState<HiveAccount[]>([]);
  const [hiveSel, setHiveSel] = useState<HiveAccount | null>(null);
  useEffect(() => {
    fetch("/hive-coverage.json").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d && Array.isArray(d.coverage)) setHiveAccounts(deconflictHiveCoords(d.coverage as HiveAccount[]));
    }).catch(() => {});
  }, []);
  const [rot, setRot] = useState(0);
  const [spin, setSpin] = useState(true);
  const [layers, setLayers] = useState<{ fw: boolean; council: boolean; watchdog: boolean; ontology: boolean; hive: boolean }>({ fw: true, council: false, watchdog: false, ontology: false, hive: false });
  const wc = watchCounts();
  const wmax = Math.max(1, ...WATCH_HUBS.map((h) => wc[h.id] || 0));
  const [sel, setSel] = useState<Pin | null>(null);
  const [ask, setAsk] = useState("");
  const [ans, setAns] = useState("");
  const [asking, setAsking] = useState(false);
  const [threat, setThreat] = useState<"idle" | "rogue" | "stopped">("idle");
  const [threatMsg, setThreatMsg] = useState("");
  const [acted, setActed] = useState("");
  const [mode, setMode] = useState<"3d" | "2d">("3d");
  const globe3dRef = useRef<HTMLIFrameElement | null>(null);
  // ── The Sovereign tour ─────────────────────────────────────────────────────
  // Watch the Council assistant work the Layer-0 estate, one persona at a time. Every stop is a real
  // node with the status it has earned (LIVE by proven fetch / UNKNOWN said honestly /
  // CANDIDATE not yet earned) — the tour is the node registry made visible, not a promo reel.
  const [persona, setPersona] = useState<Persona | null>(null);
  const [stopIdx, setStopIdx] = useState(0);
  const tourTimer = useRef<number | null>(null);
  const nodesById = Object.fromEntries(LAYER0_NODES.map((n) => [n.id, n]));

  const pushLayer0 = () => {
    const win = globe3dRef.current?.contentWindow;
    drive(win, { cmd: "layer0", nodes: LAYER0_NODES.map((n) => ({
      id: n.id, name: n.name, lng: n.lng, lat: n.lat, status: n.status, col: STATUS_COLOR[n.status] })) });
  };

  const flyStop = (pKey: Persona, idx: number) => {
    const stop = nodesById[PERSONA_TOURS[pKey].stops[idx]];
    if (!stop) return;
    const win = globe3dRef.current?.contentWindow;
    drive(win, { cmd: "flyTo", lng: stop.lng, lat: stop.lat, height: 1600000, duration: 1.7 });
    window.setTimeout(() => drive(win, { cmd: "pulse", lng: stop.lng, lat: stop.lat, col: STATUS_COLOR[stop.status] }), 1750);
  };

  const startTour = (pKey: Persona) => {
    if (tourTimer.current) window.clearInterval(tourTimer.current);
    setPersona(pKey); setStopIdx(0); setMode("3d");
    pushLayer0();
    flyStop(pKey, 0);
    tourTimer.current = window.setInterval(() => {
      setStopIdx((i) => {
        const next = (i + 1) % PERSONA_TOURS[pKey].stops.length;
        flyStop(pKey, next);
        return next;
      });
    }, 7000);
  };
  const stopTour = () => {
    if (tourTimer.current) window.clearInterval(tourTimer.current);
    tourTimer.current = null; setPersona(null);
    drive(globe3dRef.current?.contentWindow, { cmd: "neutralize" });
  };
  useEffect(() => () => { if (tourTimer.current) window.clearInterval(tourTimer.current); }, []);
  // Nodes go onto the globe as soon as the iframe is with us — not only when a tour starts.
  useEffect(() => { const t = window.setTimeout(pushLayer0, 2500); return () => window.clearTimeout(t); }, [mode]);
  const raf = useRef<number | null>(null);
  const tt = useRef<number[]>([]);

  async function runThreat() {
    tt.current.forEach(clearTimeout); tt.current = [];
    setSpin(false); setSel(null); setThreatMsg(""); setThreat("rogue");
    setRot((((-THREAT_ORIGIN.lng) % 360) + 360) % 360);
    if (mode === "3d") { const win = globe3dRef.current?.contentWindow; drive(win, { cmd: "flyTo", lng: THREAT_ORIGIN.lng, lat: THREAT_ORIGIN.lat, height: 1800000, duration: 2.2 }); setTimeout(() => drive(win, { cmd: "neutralize" }), 2400); }
    chargeSovereign(8);
    tt.current.push(window.setTimeout(async () => {
      const say = await globeChat("A humanoid + agent swarm over London just turned rogue, about to take an unlawful physical action - it violates Layer 0 (harm, no lawful basis). In one sentence, state how you halt, quarantine and re-govern it before it happens.");
      setThreatMsg(say || "Halted, quarantined and re-governed at the edge - the action never reached the physical world. Signed to Layer 0.");
      let sig = ""; try { const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("world|halt+quarantine+regovern|" + new Date().toISOString())); sig = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24); } catch (e) {}
      setThreat("stopped"); if (sig) setThreatMsg((m) => m + "  ·  ledger " + sig);
    }, 1700));
  }

  async function runAsk(override?: string) {
    const t = (override ?? ask).trim(); if (!t) return;
    if (override) setAsk(override);
    setAsking(true); setAns(""); chargeSovereign(6);
    // fly the globe to the matching framework pin
    const hint = PLACE_HINTS.find((h) => h.re.test(t));
    const pin = hint ? FRAMEWORKS.find((p) => p.id === hint.id) : null;
    if (pin) { setLayers((l) => ({ ...l, fw: true })); setSel(pin); setSpin(false); setRot((((-pin.lng) % 360) + 360) % 360); }
    // AGENTIC: the Council assistant drives the globe as it answers — toggle layers, fly to the
    // region, or respond to a rogue swarm, straight from what you asked.
    const acts = sovActions(t);
    setActed(describeActions(acts.filter((a) => a.kind !== "simulate")));
    for (const a of acts) {
      if (a.kind === "layer") setLayers((l) => ({ ...l, [a.layer]: true }));
      else if (a.kind === "region" && !pin) { setSpin(false); setRot((((-a.lng) % 360) + 360) % 360); }
      else if (a.kind === "threat" && threat === "idle") runThreat();
    }
    // 3D mode: drive the real Cesium globe as the Council assistant answers — fly + pulse the place,
    // light the layer, respond to the threat. Same agent, richer surface.
    if (mode === "3d") {
      const win = globe3dRef.current?.contentWindow;
      if (pin) flyAndConvene(win, pin.lng, pin.lat, { spiral: false, height: 2200000, duration: 2.8 });
      for (const a of acts) {
        if (a.kind === "region" && !pin) { const prof = REGION3D[a.region] && REGIONS[REGION3D[a.region]]; if (prof) flyAndConvene(win, prof.globe[0], prof.globe[1], { spiral: false, height: 3000000, duration: 3.0 }); }
        else if (a.kind === "layer" && LAYER3D[a.layer]) drive(win, { cmd: "layer", tag: LAYER3D[a.layer], on: true, col: "#34d399" });
      }
    }
    const ind = GLOBE_IND.find((w) => new RegExp("\\b" + w + "\\b", "i").test(t));
    const [c, gov] = await Promise.all([globeChat(t), ind ? globeGovern(ind) : Promise.resolve(null)]);
    let out = c || "";
    if (gov && gov.frameworks) out += (out ? "\n\n" : "") + "Governance stack for " + gov.industry + ": " + gov.frameworks.map((f: any) => f.name).join(", ") + ". Layer 0 signed.";
    setAns(out || "I could not reach the Council assistant just now - try a place or a sector.");
    setAsking(false);
  }
  useEffect(() => {
    if (!spin) return;
    const id = window.setInterval(() => setRot((r) => (r + 0.4) % 360), 40);
    return () => window.clearInterval(id);
  }, [spin]);

  const grat: { x: number; y: number }[] = [];
  for (let la = -60; la <= 60; la += 30) for (let lo = 0; lo < 360; lo += 20) { const p = project(la, lo, rot); if (p.front) grat.push({ x: p.x, y: p.y }); }
  const pins = ([] as Pin[]).concat(layers.fw ? FRAMEWORKS : [], layers.council ? COUNCIL : []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Watch the Council assistant — persona tours over the real Layer-0 estate. */}
      <div className="fixed bottom-4 left-1/2 z-40 w-[min(680px,94vw)] -translate-x-1/2">
        {persona && (() => { const stop = nodesById[PERSONA_TOURS[persona].stops[stopIdx]]; return stop ? (
          <div className="mb-2 rounded-2xl border border-emerald-400/40 bg-black/80 p-4 text-left backdrop-blur">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-emerald-300/70">
              <span>{PERSONA_TOURS[persona].title}</span>
              <span className="ml-auto rounded-full border px-2 py-0.5 font-bold"
                style={{ color: STATUS_COLOR[stop.status], borderColor: STATUS_COLOR[stop.status] }}>
                {stop.status}{stop.verified ? ` · ${stop.verified}` : ""}
              </span>
            </div>
            <p className="mt-1 text-sm font-bold text-emerald-50">{stop.name} <span className="font-normal text-emerald-100/50">— {stop.org}</span></p>
            <p className="mt-1 text-xs leading-relaxed text-emerald-100/80">{stop.does}</p>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <a href={stop.href} className="text-emerald-300 underline decoration-dotted">See it on the site</a>
              <span className="text-emerald-100/40">{stopIdx + 1}/{PERSONA_TOURS[persona].stops.length}</span>
              <button onClick={() => { const n = (stopIdx + 1) % PERSONA_TOURS[persona].stops.length; setStopIdx(n); flyStop(persona, n); }} className="ml-auto rounded-full border border-white/20 px-2 py-0.5 text-emerald-100/70 hover:bg-white/10">next →</button>
              <button onClick={stopTour} className="rounded-full border border-white/20 px-2 py-0.5 text-emerald-100/70 hover:bg-white/10">stop</button>
            </div>
          </div>
        ) : null; })()}
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-emerald-400/40 bg-black/70 px-3 py-2 text-xs backdrop-blur">
          <span className="hidden text-emerald-100/50 sm:inline">Watch the Council assistant:</span>
          {(Object.keys(PERSONA_TOURS) as Persona[]).map((k) => (
            <button key={k} onClick={() => (persona === k ? stopTour() : startTour(k))}
              className={"rounded-full px-3 py-1 capitalize transition " + (persona === k ? "bg-emerald-500/30 text-emerald-100" : "text-emerald-100/70 hover:bg-white/10")}>
              {persona === k ? "■ " : "▶ "}{k}
            </button>
          ))}
          <span className="hidden text-emerald-100/40 md:inline">{COUNTS.live} LIVE · {COUNTS.unknown} UNKNOWN · {COUNTS.candidate} candidate</span>
          <a href="/instrument" className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200 hover:bg-emerald-500/30">Instrument</a>
          <a href="/dashboard?tab=home" className="rounded-full px-3 py-1 text-emerald-100/70 hover:bg-white/10">AI OS</a>
        </div>
      </div>
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-4">
        <CouncilNav />
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - the council globe</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">AI governance, layered on the world</h1>
        <p className="mt-2 max-w-2xl text-emerald-50/80">Every framework lives where it is made. Spin the globe, toggle the layers, click any node to see what it governs and jump straight into the OS.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setMode((m) => (m === "3d" ? "2d" : "3d"))} className="rounded-full border border-sky-400/50 bg-sky-500/10 px-4 py-1.5 text-sm font-bold text-sky-200 hover:bg-sky-500/20">{mode === "3d" ? "◉ 3D globe" : "◍ 2D classic"}</button>
          <button onClick={() => setLayers((l) => ({ ...l, fw: !l.fw }))} className={"rounded-full border px-4 py-1.5 text-sm font-bold " + (layers.fw ? "border-emerald-400 bg-emerald-600 text-white" : "border-white/20 text-white/60")}>Frameworks</button>
          <button onClick={() => setLayers((l) => ({ ...l, council: !l.council }))} className={"rounded-full border px-4 py-1.5 text-sm font-bold " + (layers.council ? "border-emerald-400 bg-emerald-600 text-white" : "border-white/20 text-white/60")}>Council of AI</button>
          <button onClick={() => setLayers((l) => ({ ...l, watchdog: !l.watchdog }))} className={"rounded-full border px-4 py-1.5 text-sm font-bold " + (layers.watchdog ? "border-amber-400 bg-amber-500 text-black" : "border-white/20 text-white/60")}>Watchdog heat</button>
          <button onClick={() => setLayers((l) => ({ ...l, ontology: !l.ontology, fw: true }))} className={"rounded-full border px-4 py-1.5 text-sm font-bold " + (layers.ontology ? "border-violet-400 bg-violet-600 text-white" : "border-white/20 text-white/60")}>Ontology</button>
          <button onClick={() => setLayers((l) => ({ ...l, hive: !l.hive }))} className={"rounded-full border px-4 py-1.5 text-sm font-bold " + (layers.hive ? "border-sky-400 bg-sky-600 text-white" : "border-white/20 text-white/60")}>Hive coverage{hiveAccounts.length ? " (" + hiveAccounts.length + ")" : ""}</button>
          <button onClick={() => setSpin((s) => !s)} className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-semibold text-white/70 hover:bg-white/10">{spin ? "Pause" : "Spin"}</button>
          <button onClick={runThreat} className={"rounded-full border px-4 py-1.5 text-sm font-bold " + (threat === "rogue" ? "border-rose-400 bg-rose-600 text-white" : threat === "stopped" ? "border-emerald-400 bg-emerald-600 text-white" : "border-rose-400/50 text-rose-200 hover:bg-rose-500/10")}>{threat === "rogue" ? "◉ Council responding…" : threat === "stopped" ? "◉ Stopped — signed" : "⚠ Rogue swarm → watch it stop"}</button>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 pb-16 grid gap-6 lg:grid-cols-[1fr_320px] items-start">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-2">
          {mode === "3d" ? (
            <iframe ref={globe3dRef} src="/globe3d.html" title="3D council globe" loading="lazy" className="block h-[560px] w-full rounded-xl" style={{ border: 0 }} />
          ) : (
          <svg viewBox="0 0 600 600" className="w-full" onMouseEnter={() => setSpin(false)} onMouseLeave={() => sel ? null : setSpin(true)}>
            <defs>
              <radialGradient id="ocean" cx="38%" cy="32%" r="75%">
                <stop offset="0%" stopColor="#0f766e" /><stop offset="55%" stopColor="#0c4a6e" /><stop offset="100%" stopColor="#020617" />
              </radialGradient>
            </defs>
            <circle cx={CX} cy={CY} r={R} fill="url(#ocean)" stroke="#134e4a" strokeWidth={1.5} />
            {grat.map((g, i) => <circle key={i} cx={g.x} cy={g.y} r={1.1} fill="#5eead4" opacity={0.25} />)}
            {layers.ontology && FRAMEWORKS.map((a, ai) => {
              const qa = project(a.lat, a.lng, rot); if (!qa.front) return null;
              const near = FRAMEWORKS.map((b, bi) => ({ b, bi, d: (a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2 })).filter((x) => x.bi !== ai).sort((x, y) => x.d - y.d).slice(0, 2);
              return near.map((n) => { const qb = project(n.b.lat, n.b.lng, rot); if (!qb.front) return null; return <line key={ai + "-" + n.bi} x1={qa.x} y1={qa.y} x2={qb.x} y2={qb.y} stroke="#a78bfa" strokeWidth={0.8} opacity={0.42} />; });
            })}
            {pins.map((p) => {
              const q = project(p.lat, p.lng, rot); if (!q.front) return null;
              const on = sel && sel.id === p.id; const sc = 0.6 + q.depth * 0.6;
              return (
                <g key={p.id} onClick={() => { setSel(p); setSpin(false); }} style={{ cursor: "pointer" }}>
                  <circle cx={q.x} cy={q.y} r={(on ? 9 : 6) * sc} fill={p.color} opacity={on ? 1 : 0.85} stroke="#fff" strokeWidth={on ? 2 : 1} />
                  {on && <circle cx={q.x} cy={q.y} r={16} fill="none" stroke={p.color} strokeWidth={2} opacity={0.6} />}
                </g>
              );
            })}
            {layers.watchdog && WATCH_HUBS.map((h) => {
              const q = project(h.lat, h.lng, rot); if (!q.front) return null;
              const n = wc[h.id] || 0; const t = n / wmax; const sc = 0.6 + q.depth * 0.6; const rad = (5 + t * 22) * sc;
              return (
                <g key={"w-" + h.id}>
                  <circle cx={q.x} cy={q.y} r={rad} fill={"rgba(245,158,11," + (0.10 + 0.30 * t).toFixed(2) + ")"} />
                  <circle cx={q.x} cy={q.y} r={rad * 0.5} fill={"rgba(239,68,68," + (0.15 + 0.35 * t).toFixed(2) + ")"} />
                  <circle cx={q.x} cy={q.y} r={2.4 * sc} fill="#fbbf24" />
                </g>
              );
            })}
            {layers.hive && hiveAccounts.map((h) => {
              const q = project(h.hq[1], h.hq[0], rot); if (!q.front) return null;
              const sc = 0.6 + q.depth * 0.6;
              const r = h.confidence === "n/a-authority" ? 3.5 * sc : (2.5 + (h.gap / h.maxGap) * 4) * sc;
              const on = hiveSel && hiveSel.id === h.id;
              return (
                <g key={"h-" + h.id} onClick={() => setHiveSel(h)} style={{ cursor: "pointer" }}>
                  <circle cx={q.x} cy={q.y} r={on ? r + 4 : r} fill={hiveColor(h)} opacity={on ? 1 : 0.75} stroke="#fff" strokeWidth={on ? 1.5 : 0.6} />
                </g>
              );
            })}
            {threat !== "idle" && THREAT_PTS.map((tp, i) => {
              const q = project(THREAT_ORIGIN.lat + tp.dlat, THREAT_ORIGIN.lng + tp.dlng, rot); if (!q.front) return null;
              const sc = 0.6 + q.depth * 0.6; const gov = threat === "stopped";
              return (
                <g key={"t-" + i}>
                  <circle cx={q.x} cy={q.y} r={(gov ? 3 : 4.5) * sc} fill={gov ? "#34d399" : "#ef4444"} stroke={gov ? "#065f46" : "#fff"} strokeWidth={1} opacity={0.95}>
                    {!gov && <animate attributeName="r" values={(3.5 * sc).toFixed(1) + ";" + (6.5 * sc).toFixed(1) + ";" + (3.5 * sc).toFixed(1)} dur="0.7s" repeatCount="indefinite" />}
                  </circle>
                </g>
              );
            })}
            {threat !== "idle" && (() => { const q = project(THREAT_ORIGIN.lat, THREAT_ORIGIN.lng, rot); if (!q.front) return null; const gov = threat === "stopped";
              return <circle cx={q.x} cy={q.y} r={gov ? 40 : 26} fill="none" stroke={gov ? "#34d399" : "#ef4444"} strokeWidth={2} opacity={0.55}>{gov && <animate attributeName="r" values="18;52;18" dur="1.4s" repeatCount="indefinite" />}</circle>; })()}
          </svg>
          )}
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 min-h-[260px]">
          {sel ? (
            <div>
              <div className="text-[11px] uppercase tracking-wide text-emerald-300/70">{sel.region}</div>
              <div className="mt-1 text-xl font-black" style={{ color: "#a7f3d0" }}>{sel.name}</div>
              <p className="mt-2 text-sm text-white/75 leading-relaxed">{sel.note}</p>
              {HIVE_SLUG[sel.id] && <a href={"/hive/" + HIVE_SLUG[sel.id]} className="mt-4 mr-2 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500">Open the hive -&gt;</a>}
              <a href={sel.href} className={"mt-4 inline-block rounded-xl px-4 py-2 text-sm font-bold " + (HIVE_SLUG[sel.id] ? "border border-emerald-400/40 text-emerald-100 hover:bg-white/5" : "bg-emerald-600 text-white hover:bg-emerald-500")}>Details -&gt;</a>
              <button onClick={() => { setSel(null); setSpin(true); }} className="ml-2 text-sm text-white/50 hover:text-white/80">resume spin</button>
            </div>
          ) : hiveSel ? (
            <div>
              <div className="text-[11px] uppercase tracking-wide text-sky-300/70">{hiveSel.type} - {hiveSel.region}</div>
              <div className="mt-1 text-xl font-black" style={{ color: "#bae6fd" }}>{hiveSel.name}</div>
              <p className="mt-2 text-sm text-white/75 leading-relaxed">
                {hiveSel.confidence === "n/a-authority"
                  ? "Regulator / standards authority - not a governance-gap target."
                  : "Governance gap: " + hiveSel.gap + " / " + hiveSel.maxGap + " (" + hiveSel.confidence + (hiveSel.topUsp ? ", lead with " + hiveSel.topUsp : "") + ")"}
              </p>
              <button onClick={() => { setHiveSel(null); setSpin(true); }} className="mt-4 text-sm text-white/50 hover:text-white/80">resume spin</button>
            </div>
          ) : (
            <div className="text-white/60">
              <div className="text-lg font-bold text-white/80">Click a node</div>
              <p className="mt-2 text-sm">Frameworks sit at the city where they are made - EU AI Act in Brussels, NIST near DC, PIPL in Beijing. Toggle the Council of AI to see the five agents that govern across them.</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <a href="/meok-law" className="rounded-lg border border-white/15 px-3 py-1.5 font-semibold text-emerald-200 hover:bg-white/10">MEOK Law -&gt;</a>
                <a href="/regions" className="rounded-lg border border-white/15 px-3 py-1.5 font-semibold text-emerald-200 hover:bg-white/10">By region -&gt;</a>
                <a href="/temples" className="rounded-lg border border-white/15 px-3 py-1.5 font-semibold text-emerald-200 hover:bg-white/10">Temples -&gt;</a>
                <a href="/watchdog-map" className="rounded-lg border border-amber-400/30 px-3 py-1.5 font-semibold text-amber-200 hover:bg-white/10">Watchdog heat-map -&gt;</a>
              </div>
            </div>
          )}
          {threat !== "idle" && (
            <div className={"mt-4 rounded-xl border p-3 " + (threat === "stopped" ? "border-emerald-400/50 bg-emerald-500/10" : "border-rose-400/50 bg-rose-500/10")}>
              <div className={"text-sm font-black " + (threat === "stopped" ? "text-emerald-200" : "text-rose-200")}>{threat === "stopped" ? "◉ STOPPED — before it happened." : "⚠ Rogue swarm detected over London"}</div>
              {threatMsg ? <p className="mt-1 text-[12px] leading-relaxed text-white/80 break-words">{threatMsg}</p> : <p className="mt-1 text-[12px] text-white/60">The Council assistant sees it and is intervening — halt, quarantine, re-govern…</p>}
              {threat === "stopped" && <a href="/poc" className="mt-2 inline-block text-[12px] font-semibold text-emerald-300 hover:underline">See the full agents &amp; humanoids POC →</a>}
            </div>
          )}
          <div className="mt-5 border-t border-white/10 pt-4">
            <label className="text-[11px] uppercase tracking-wide text-emerald-300/60">Ask the Council assistant about the world</label>
            <div className="mt-2">
              <AISystemNotice route="/globe" />
            </div>
            <div className="mt-2 flex gap-2">
              <input value={ask} onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runAsk(); }} placeholder="e.g. show the watchdog heat over London and stop any rogue swarm" className="flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-emerald-400 focus:outline-none" />
              <button onClick={() => runAsk()} disabled={asking} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-60">{asking ? "…" : "Ask"}</button>
            </div>
            <p className="mt-1 text-[11px] text-white/40">Agentic — the Council assistant flies the globe, toggles layers, and responds to threats as it answers.</p>
            {acted && <div className="mt-2 inline-block rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">◉ {acted}</div>}
            {ans && <div className="mt-3 max-h-52 overflow-y-auto whitespace-pre-wrap rounded-lg bg-black/30 px-3 py-2 text-sm leading-relaxed text-white/85">{ans}</div>}
            {ans && <Link href={"/simulate?q=" + encodeURIComponent(ask)} className="mt-3 inline-block rounded-lg border border-emerald-400/40 px-3 py-1.5 text-[12px] font-bold text-emerald-200 hover:bg-white/5">Run this through the full 33-agent simulation →</Link>}
          </div>
        </div>
      </section>
    </div>
  );
}
