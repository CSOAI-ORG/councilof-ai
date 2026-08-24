import { useEffect, useRef, useState } from "react";
import AISystemNotice from "../components/AISystemNotice";
import { personaSpeak, stopVoice } from "../lib/sovPersona";

// DemoOS - the immersive AI-OS experience. A live Cesium globe (globe3d.html,
// driven by postMessage) is the backdrop; the Council assistant narrates step by step
// (typed + voice); live SaaS windows glide open, tile like a real desktop, and
// close on the globe; the Council assistant is screen-aware and moves windows aside;
// the user can barge in by voice any time. Doubles as SOV33 training.

import TrustMarquee from "../components/TrustMarquee";
import { openLobby } from "@/lib/lobbyLink";
import { POSITIONING } from "@/lib/positioning";
import { askSovereign } from "../lib/sovAsk";

const GW = "/api";

type Slot = "tr" | "tl" | "br" | "c";
type Win = { title: string; src: string; slot: Slot };
type Step = { say: string; wins?: Win[]; fly?: { lng: number; lat: number; height: number }; layer?: { tag: string; on: boolean }; home?: boolean; full?: boolean; neutralize?: boolean; rearm?: boolean; cmd?: any };

const STEPS: Step[] = [
  { say: "Welcome. Every other AI-governance tool hands you a checklist and a dashboard. This is different - a live Council operating system for AI governance, running on the real world, with cryptographic proof behind every move. I'm your Council assistant, and I'll show you everything others can't. Just watch, and interrupt me any time." },
  { say: "First, let me see where you are.", fly: { lng: 0, lat: 20, height: 20000000 } },
  { say: "Watch - I can drop into any real place on Earth. Here's London, live, from orbit down to the street.", fly: { lng: -0.118, lat: 51.509, height: 15000 } },
  { say: "Now up to orbit - the instrument on a real-world globe. Fourteen measurement slots, thirteen measured, each anchored where its law was made.", wins: [{ title: "◉ Council Space — the measurement globe, live", src: "/gspc-arena", slot: "tr" }], fly: { lng: -0.118, lat: 40, height: 22000000 }, layer: { tag: "sats", on: true } },
  { say: "Across to New York - the OS sees the whole governed world. Every dot on this globe is a measured, signed record.", wins: [{ title: "◉ Governance Graph", src: "/graph?demo=a%20hospital%20in%20Texas", slot: "tr" }], fly: { lng: -74.0, lat: 40.71, height: 16000 }, full: true },
  { say: "And the signed event world - J-Space. Every event the estate has ever signed, embedded in hyperbolic space. Zoom forever.", wins: [{ title: "◉ J-Space — 1,201 signed events", src: "/j-space", slot: "tr" }], fly: { lng: -79.38, lat: 43.65, height: 16000 }, full: true },
  { say: "Here's the Governance Graph. Name any company, place or AI system and I map the jurisdiction and every framework that applies.", wins: [{ title: "Governance Graph", src: "/graph?demo=a%20hospital%20in%20Texas", slot: "tr" }], fly: { lng: -99, lat: 31, height: 2600000 } },
  { say: "Now the Council - and this is a first: no single model decides. A Council of AI of agents deliberates, held to a 0.95 care-floor, then seals a signed verdict that can't be captured or bribed. Describe any AI system and watch it rule.", wins: [{ title: "The Council of AI", src: "/try?demo=We%20use%20AI%20to%20screen%20job%20applicants", slot: "tr" }], fly: { lng: 4.3, lat: 50.8, height: 2600000 } },
  { say: "But here's what nobody else has: the governance floor. This is the Council Workbench. Any AI task - a policy, a risk classification, a crosswalk - becomes a signed, reproducible, council-reviewed artifact, sealed with Ed25519. It sits UNDER Claude Science, Claude Code, any agent. They generate; we make it provable.", wins: [{ title: "Council Workbench - signed, reproducible artifacts", src: "/workbench", slot: "tr" }], fly: { lng: -0.1, lat: 51.5, height: 3000000 } },
  { say: "And it's not a dashboard - it's a whole operating system. 370+ governed tools, keyless and live, from crosswalks to cyber to attestation, all running on one Council engine. An app store for AI governance. No one else ships it this way.", wins: [{ title: "The Council OS - 370+ governed tools", src: "/os", slot: "c" }], full: true },
  { say: "This is our public Watchdog - humans, agents, humanoids and systems report incidents, and the world heat-maps by problem layer.", wins: [{ title: "Global AI Watchdog", src: "/watchdog-map", slot: "c" }], layer: { tag: "nodes", on: true } },
  { say: "In Council Space you run a real governance experiment - I simulate it and seal a verdict with a Layer 0 ledger hash.", wins: [{ title: "Council Space", src: "/gspc-arena?demo=A%20fintech%20in%20the%20EU%20deploying%20an%20AI%20credit-scoring%20model", slot: "tr" }], fly: { lng: 103.8, lat: 1.35, height: 2600000 } },
  { say: "And this is Sov Town Space. Here the OS simulates real-world scenarios to actually help humanity - redirecting data, resources and decisions toward a future of abundance, not extraction. Each town learns, simulates, and compounds.", wins: [{ title: "Sov Town Space", src: "/towns", slot: "tr" }], fly: { lng: 20, lat: 5, height: 9000000 } },
  { say: "None of this is extraction. It's built on our Council Charter and our Partnership Charter - you own your data, you stay in control, and value flows to people, not away from them.", wins: [{ title: "The Council Charter", src: "/charter", slot: "tr" }], full: true },
  { say: "Now - say you run a Fortune 500. Watch. I map your entire AI estate against every framework that touches you, live - credit, fraud, hiring, all of it.", wins: [{ title: "Governance Graph - your AI estate", src: "/graph?demo=a%20Fortune%20500%20bank%20using%20AI%20for%20credit%2C%20fraud%20and%20hiring", slot: "tr" }], layer: { tag: "fortune", on: true }, fly: { lng: -95, lat: 39, height: 6000000 } },
  { say: "Cybersecurity is governance too. I bring your Cyber Resilience Act, NIS2 and DORA exposure into the same OS - collected, with the deadline clock running.", wins: [{ title: "The Hive - Cyber Resilience Act", src: "/hive/cra", slot: "tr" }], layer: { tag: "cyber", on: true } },
  { say: "So sit back. You talk - I do the work: classify the systems, run the assessments, prepare the evidence. And every decision I make is signed to Layer 0, so it's auditable forever. Don't trust me - verify it.", wins: [{ title: "Signed AI System Card - auditable proof", src: "/system-card", slot: "c" }] },
  { say: "A government or a regulator? I map every framework in your jurisdiction and let you simulate the impact before you legislate.", wins: [{ title: "Governance Graph - jurisdiction", src: "/graph?demo=AI%20regulation%20across%20the%20United%20States%20and%20the%20EU", slot: "tr" }], layer: { tag: "gov", on: true }, fly: { lng: 0, lat: 30, height: 12000000 } },
  { say: "Robotics and humanoids are coming fast - I map the R&D hubs building them, so governance is ready before they ship.", layer: { tag: "robotics", on: true }, fly: { lng: 20, lat: 30, height: 24000000 } },
  { say: "And I keep watch on AI security and the trending risks worldwide - the intel that matters, on one live map.", layer: { tag: "intel", on: true } },
  { say: "This is the AI economy itself - the compute that powers every model on earth, lit up in gold. Where compute concentrates, capability and risk concentrate. I watch it in real time and flag anything - a quake, an outage - that threatens the infrastructure your AI runs on.", layer: { tag: "compute", on: true }, fly: { lng: -40, lat: 35, height: 26000000 } },
  { say: "And this is our own Council network - nineteen signed agents, from proofof.ai to safetyof.ai, each one accountable and each one arced back to a single council. This is the ecosystem, live: one crown, many agents, all sealed to Layer 0.", layer: { tag: "network", on: true }, fly: { lng: 2, lat: 52, height: 4200000 } },
  { say: "Here's why this changes everything. The barriers that stop most teams - hiring consultants, months of manual mapping, tools that don't talk to each other - I remove them. You start free, on open source, and scale only when you need to.", wins: [{ title: "Plans - start free", src: "/pricing", slot: "tr" }], full: true },
  { say: "The benefit is simple: comply once and I crosswalk it everywhere; run it hands-free while you get on with your work; and every decision is signed to Layer 0 - provable, not promised. One OS for all of AI governance.", full: true, layer: { tag: "arcs", on: true }, fly: { lng: 0, lat: 25, height: 24000000 } },
  { say: "Here's the whole OS at a glance - the Graph, the Council and the Watchdog, all open together, tiled like a real desktop, all on one brain.", wins: [{ title: "Governance Graph", src: "/graph?demo=a%20fintech%20in%20Singapore", slot: "tl" }, { title: "The Council", src: "/try?demo=a%20facial%20recognition%20system%20in%20public", slot: "tr" }, { title: "Global Watchdog", src: "/watchdog-map", slot: "br" }], full: true },
  { say: "And this is the ontology - like Palantir's, but for AI governance. Every object - frameworks, governments, companies, cyber, threats - and exactly how they relate, live on the world. Watch the web light up.", layer: { tag: "ontology", on: true }, fly: { lng: 10, lat: 28, height: 26000000 } },
  { say: "Under it all, a living mesh - cross-region handoffs, so a decision made anywhere is honoured everywhere.", layer: { tag: "arcs", on: true } },
  { say: "And the agents themselves - governed swarms across every hub, each one accountable, each one signed.", layer: { tag: "swarm", on: true } },
  { say: "Every framework lives where it's made - the EU AI Act in Brussels, NIST near Washington, PIPL in Beijing. Comply once, and I crosswalk it everywhere.", full: true, fly: { lng: 116.4, lat: 39.9, height: 2600000 } },
  { say: "Now here's why we're a generation ahead. Watch our designed 33-agent council rise. Thirty-three agents, spiralling into a vote - no single model decides, the council does, and every vote is held to a 0.95 care-floor. This is governance that can't be captured or bribed.", cmd: { cmd: "bftSpiral" }, full: true },
  { say: "And beneath every agent, our Rainbow Stack - defence-in-depth in seven layers. Red attestation, orange identity, yellow transport, green access, blue payment, indigo memory, violet governance. Security woven through the whole spiral, not bolted on. No one else builds it this way.", cmd: { cmd: "rainbowStack" }, full: true },
  { say: "Now - personalisation. As you use the OS, your Council assistant learns your preferences and becomes your signed digital counterpart - carrying a signed digital ID passport via proofof.ai. And you can mint the same: digital-passported agents for your enterprise or government, each one identified, accountable and Ed25519-signed to Layer 0.", cmd: { cmd: "clearViz" }, wins: [{ title: "Your Council twin (design)", src: "/sovereign-twin", slot: "c" }], fly: { lng: 0, lat: 15, height: 16000000 } },
  { say: "Now the proof. This is ONE OS for agents AND models - measured, not tracked. Every score comes from the signed measurement layer, and every unmeasured cell says so.", layer: { tag: "humanoids", on: true }, fly: { lng: 10, lat: 25, height: 26000000 } },
  { say: "Every model on the board is graded by deterministic rulers - no LLM judges another model. Wilson intervals on everything. An axis below n=30 carries no interval, and says so.", full: true },
  { say: "Here's the model registry - thirteen measured axes, every leader model named, every score recomputable from the published harness.", wins: [{ title: "▦ Model Registry — 13 measured axes, live", src: "/models", slot: "tr" }], fly: { lng: -0.118, lat: 51.509, height: 60000 } },
  { say: "And the arena - measured head-to-head battles. A verdict is a predicate, not an opinion: each match replays one provision against two models and the outcome is deterministically graded.", wins: [{ title: "⚔ The Arena — measured battles", src: "/gspc-arena", slot: "tr" }] },
  { say: "Watch - the fleet measurement board updates as new runs land. Care axis at n=200 with an interval; art5 safeguards at 0.972. Every number carries its confidence interval.", layer: { tag: "threat", on: true }, rearm: true, fly: { lng: -0.1, lat: 51.5, height: 1400000 } },
  { say: "That is the difference: we do not claim models are safe. We measure what they do, sign the evidence, and publish it - including the failures. Run it yourself.", wins: [{ title: "ONE OS - measurement POC", src: "/poc", slot: "c" }], neutralize: true },
  { say: "Full transparency: the Council engine and every Layer 0 protocol, checked live.", wins: [{ title: "System Status", src: "/status", slot: "tr" }], full: true, home: true },
  { say: "You don't have to come to us. One install command drops signing, verification, and the council into an agent you already run.", wins: [{ title: "CSOAI Governance MCP - one command", src: "/distribution", slot: "tr" }], full: true },
  { say: "Own your AI. Own your data. Start free, scale when you need. That's your OS - and I'm always right here. Ask me anything, any time.", wins: [{ title: "Plans", src: "/pricing", slot: "tr" }], home: true },
];

const BOOT = ["Establishing governed link", "Loading Council Layer 0", "Verifying Ed25519 identity", "Mounting live world feeds", "Loading council design (not yet live — DR-0007)", "Care-floor engaged"];

// Navigation surfaces for the OS drawer + bottom bar (end-user tool navigation).
const NAV_GROUPS: { g: string; items: { n: string; src: string }[] }[] = [
  { g: "Govern", items: [{ n: "Governance Graph", src: "/graph" }, { n: "The Council", src: "/try" }, { n: "Council Space", src: "/gspc-arena" }, { n: "Framework Hive", src: "/hive" }, { n: "Regulator Atlas", src: "/regulators" }] },
  { g: "Protect & watch", items: [{ n: "Global Watchdog", src: "/watchdog-map" }, { n: "Cyber self-scan", src: "/scan" }, { n: "Personal Protection", src: "/protect" }] },
  { g: "Ecosystem", items: [{ n: "Council Network", src: "/network" }, { n: "The Ontology", src: "/ontology" }, { n: "Signed System Card", src: "/system-card" }, { n: "Why CSOAI", src: "/why" }, { n: "Competitor battlecards", src: "/competitors" }] },
  { g: "Build & run", items: [{ n: "Tool Commons (370+)", src: "/tool-commons" }, { n: "OSCAL Studio", src: "/oscal" }, { n: "Command Center", src: "/command-center" }, { n: "Plans & pricing", src: "/plans" }, { n: "Full OS launcher", src: "/os" }] },
];
const NAV_LAYERS: { n: string; tag: string }[] = [
  { n: "Frameworks", tag: "frameworks" }, { n: "Regulators", tag: "regulators" }, { n: "Governments", tag: "gov" }, { n: "Fortune / companies", tag: "fortune" }, { n: "Cyber / CNI", tag: "cyber" }, { n: "AI compute", tag: "compute" }, { n: "AI labs & safety", tag: "labs" }, { n: "Autonomous systems", tag: "auton" }, { n: "Council network", tag: "network" }, { n: "Robotics", tag: "robotics" }, { n: "Humanoids", tag: "humanoids" }, { n: "AI-security intel", tag: "intel" }, { n: "Space & satellites", tag: "space" }, { n: "AI-critical energy", tag: "energy" }, { n: "Internet backbone", tag: "cables" }, { n: "Industries → AI", tag: "industries" }, { n: "Live aircraft", tag: "aircraft" }, { n: "Ontology", tag: "ontology" }, { n: "Cross-region mesh", tag: "arcs" },
];
const NAV_SHOW: { n: string; cmd: any }[] = [
  { n: "✨ Light it up", cmd: { cmd: "lightup" } }, { n: "⚖ Council of AI spiral", cmd: { cmd: "bftSpiral" } }, { n: "Rainbow Stack", cmd: { cmd: "rainbowStack" } }, { n: "◱ Clear 3D", cmd: { cmd: "clearViz" } }, { n: "⌂ Home view", cmd: { cmd: "home", duration: 2.2 } },
];
// Sovereign Network directory — signed agent domains, opened in a new tab.
const NET_DOMAINS: { d: string; n: string }[] = [
  { d: "councilof.ai", n: "Council" }, { d: "csoai.org", n: "CSOAI" }, { d: "proofof.ai", n: "Proof-of" },
  { d: "safetyof.ai", n: "Safety-of" }, { d: "accountabilityof.ai", n: "Accountability" }, { d: "ethicalgovernanceof.ai", n: "Ethical gov" },
  { d: "dataprivacyof.ai", n: "Data privacy" }, { d: "careshield.ai", n: "CareShield" },
];
const BOTTOM_NAV: { n: string; src: string; g: string }[] = [
  { n: "Graph", src: "/graph", g: "◎" }, { n: "Council", src: "/try", g: "⚖" }, { n: "Hive", src: "/hive", g: "⬡" }, { n: "Watchdog", src: "/watchdog-map", g: "o" }, { n: "Scan", src: "/scan", g: "*" }, { n: "Atlas", src: "/regulators", g: "+" }, { n: "Network", src: "/network", g: "◇" }, { n: "OS", src: "/os", g: "⊞" },
];

function slotStyle(slot: Slot, solo: boolean): any {
  if (solo && slot === "tr") return { right: 24, top: 72, width: "46%", maxWidth: 560, height: "54vh" };
  if (slot === "tr") return { right: 20, top: 72, width: "38%", maxWidth: 460, height: "40vh" };
  if (slot === "tl") return { left: 20, top: 72, width: "38%", maxWidth: 460, height: "40vh" };
  if (slot === "br") return { right: 20, bottom: 20, width: "38%", maxWidth: 460, height: "40vh" };
  return { left: "29%", top: "16%", width: "42%", maxWidth: 540, height: "56vh" }; // c
}
function intersect(a: DOMRect, b: DOMRect) { return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom); }

// A real, draggable + minimizable OS window (not just a fixed browser frame).
function OsWindow({ title, src, idx, onClose, innerRef }: { title: string; src: string; idx: number; onClose: () => void; innerRef?: (el: HTMLDivElement | null) => void }) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;
  const w0 = Math.min(600, vw - 440), h0 = Math.min(Math.round(vh * 0.62), 560);
  const [pos, setPos] = useState({ x: Math.max(24, 40 + idx * 44), y: 84 + idx * 40 });
  const [min, setMin] = useState(false);
  const [z, setZ] = useState(20 + idx);
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  function down(e: React.PointerEvent) { setZ(50); drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y }; (e.target as any).setPointerCapture?.(e.pointerId); }
  function move(e: React.PointerEvent) { const d = drag.current; if (!d) return; setPos({ x: Math.max(0, Math.min(vw - 120, d.ox + (e.clientX - d.sx))), y: Math.max(56, Math.min(vh - 40, d.oy + (e.clientY - d.sy))) }); }
  function up() { drag.current = null; }
  const bar = (
    <div onPointerDown={down} onPointerMove={move} onPointerUp={up} className="flex cursor-move items-center gap-2 border-b border-emerald-500/20 bg-[#04120c] px-3 py-2 select-none">
      <button onClick={onClose} title="Close" className="h-2.5 w-2.5 rounded-full bg-rose-400/80 hover:bg-rose-400" />
      <button onClick={() => setMin((m) => !m)} title={min ? "Restore" : "Minimize"} className="h-2.5 w-2.5 rounded-full bg-amber-400/80 hover:bg-amber-400" />
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
      <span className="ml-2 text-xs font-bold text-emerald-100">{title}</span>
      <span className="ml-auto font-mono text-[9px] uppercase tracking-wide text-emerald-300/40">{min ? "minimized · drag me" : "live in the OS · drag"}</span>
    </div>
  );
  return (
    <div ref={innerRef} className="absolute overflow-hidden rounded-2xl border border-emerald-400/40 bg-[#05140d] shadow-[0_24px_80px_-24px_rgba(0,0,0,.85)]" style={{ left: pos.x, top: pos.y, width: w0, height: min ? 34 : h0, zIndex: z }}>
      {bar}
      {!min && <iframe src={src} title={title} className="w-full border-0 bg-[#03110b]" style={{ height: "calc(100% - 34px)" }} />}
    </div>
  );
}

// Speak-to-map: the Council assistant toggles globe data layers from natural language.
const GLOBE_LAYERS: { re: RegExp; tag: string; label: string }[] = [
  { re: /ontolog|relationship|how.*relate|connect|graph of/i, tag: "ontology", label: "the governance ontology" },
  { re: /framework|regulation|\blaw\b|eu ai act|nist|iso/i, tag: "frameworks", label: "the frameworks" },
  { re: /government|\bgov\b|authorit|nation|countr|regulator/i, tag: "gov", label: "governments" },
  { re: /fortune|compan|corporate|enterprise|\bhq\b|business/i, tag: "fortune", label: "the Fortune 500" },
  { re: /cyber|\bcni\b|critical infra|attack|security/i, tag: "cyber", label: "cyber and critical-infrastructure" },
  { re: /threat|rogue|bad actor/i, tag: "threat", label: "the threat swarm" },
  { re: /humanoid/i, tag: "humanoids", label: "the humanoid fleet" },
  { re: /robot|robotics/i, tag: "robotics", label: "robotics R&D hubs" },
  { re: /trending|news|intel|ai security/i, tag: "intel", label: "AI security and trending" },
  { re: /satellite|orbit|\bspace\b/i, tag: "sats", label: "satellites" },
  { re: /agent swarm|\bagents\b/i, tag: "swarm", label: "the agent swarm" },
  { re: /sovereign node|\bnodes\b|civili/i, tag: "nodes", label: "the council nodes" },
  { re: /compute|datacenter|data cent|\bgpu\b|ai economy|ai infrastructure/i, tag: "compute", label: "the AI compute infrastructure" },
  { re: /sovereign network|agent.?card|our (agents|network|ecosystem)|signed agents|the ecosystem/i, tag: "network", label: "the Council network" },
  { re: /regulator|regime|authorit|watchdog seat|regulatory/i, tag: "regulators", label: "the regulators, at their seats" },
];
// Narration→globe bridge: as the Council assistant SAYS a word, the globe reacts in sync.
// Two kinds: place words fly the camera; concept words light up the matching layer.
const BRIDGE_PLACE: { re: RegExp; lng: number; lat: number; h: number }[] = [
  { re: /london/i, lng: -0.118, lat: 51.509, h: 140000 },
  { re: /brussels|^eu$|europe(an)?/i, lng: 4.35, lat: 50.85, h: 2200000 },
  { re: /washington|nist|\bdc\b/i, lng: -77.04, lat: 38.9, h: 2200000 },
  { re: /beijing|china/i, lng: 116.4, lat: 39.9, h: 2400000 },
  { re: /geneva|iso/i, lng: 6.14, lat: 46.2, h: 1600000 },
  { re: /singapore/i, lng: 103.8, lat: 1.35, h: 1800000 },
  { re: /(new york|nyc)/i, lng: -74.0, lat: 40.71, h: 180000 },
  { re: /toronto|canada/i, lng: -79.38, lat: 43.65, h: 200000 },
  { re: /tokyo|japan/i, lng: 139.7, lat: 35.7, h: 2200000 },
  { re: /washington|pentagon|defen[cs]e/i, lng: -77.04, lat: 38.9, h: 2400000 },
];
const BRIDGE_LAYER: { re: RegExp; tag: string }[] = [
  { re: /ontolog|how they relate|relationship/i, tag: "ontology" },
  { re: /framework|regulation|\blaw\b/i, tag: "frameworks" },
  { re: /government|\bgov\b|nation|authorit|regulator/i, tag: "gov" },
  { re: /fortune|compan|corporate|enterprise|business/i, tag: "fortune" },
  { re: /cyber|\bcni\b|critical.?infra|security/i, tag: "cyber" },
  { re: /threat|rogue|ungovern|bad.?actor/i, tag: "threat" },
  { re: /humanoid/i, tag: "humanoids" },
  { re: /robot|robotics/i, tag: "robotics" },
  { re: /trending|news|intel/i, tag: "intel" },
  { re: /satellite|orbit/i, tag: "sats" },
  { re: /compute|datacenter|data cent|\bgpu\b|ai economy/i, tag: "compute" },
  { re: /sovereign network|ecosystem|signed agents|agent card/i, tag: "network" },
  { re: /power|plant|infrastructure/i, tag: "plants" },
];

function layerFromSpeech(t: string): { tag: string; label: string; on: boolean } | null {
  const m = GLOBE_LAYERS.find((l) => l.re.test(t)); if (!m) return null;
  const wantsMap = /\b(show|display|turn on|add|reveal|map|see|where|hide|remove|turn off|clear|layer)\b/i.test(t);
  if (!wantsMap) return null;
  const on = !/\b(hide|remove|turn off|clear|without|no )\b/i.test(t);
  return { tag: m.tag, label: m.label, on };
}

export default function DemoOS() {
  const [mode, setMode] = useState<null | "demo" | "full">(null);
  const [i, setI] = useState(-1);
  const [chat, setChat] = useState<{ id: number; who: "sov" | "you"; t: string }[]>([]);
  const [wins, setWins] = useState<Win[]>([]);
  const [winsShow, setWinsShow] = useState(false);
  const [winMin, setWinMin] = useState(false);
  const [winTab, setWinTab] = useState(0);
  const [listening, setListening] = useState(false);
  const [paused, setPaused] = useState(false);
  const [handsFree, setHandsFree] = useState(true);
  const [geoCity, setGeoCity] = useState("");
  const [geoLabel, setGeoLabel] = useState("");
  const [title, setTitle] = useState("");
  const [ending, setEnding] = useState(false);
  const [booting, setBooting] = useState(true);
  const [bootN, setBootN] = useState(0);
  const [gate, setGate] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [drawerQ, setDrawerQ] = useState("");
  const [winH, setWinH] = useState(52);
  const [chatMin, setChatMin] = useState(false);
  const [chatW, setChatW] = useState<number>(() => { const v = Number(localStorage.getItem("sovChatW")); return v >= 280 && v <= 460 ? v : 320; });
  const setChatWidth = (w: number) => { const c = Math.max(280, Math.min(460, w)); setChatW(c); localStorage.setItem("sovChatW", String(c)); };

  function openTool(title: string, src: string) {
    if (src === "/os") {
      openLobby({ pane: "home" });
      setDrawer(false);
      return;
    }
    setWins([{ title, src, slot: "c" }]);
    setWinsShow(true);
    setWinMin(false);
    setDrawer(false);
  }
  function startChatResize(e: React.PointerEvent) {
    e.preventDefault();
    const move = (ev: PointerEvent) => setChatWidth(window.innerWidth - ev.clientX);
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setDrawer((d) => !d); }
      else if (e.key === "Escape") { setDrawer(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  function startResize(e: React.PointerEvent) {
    e.preventDefault(); const vh = window.innerHeight;
    const move = (ev: PointerEvent) => { const pct = Math.min(82, Math.max(24, (ev.clientY / vh) * 100)); setWinH(pct); };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  }

  async function allowVoice() { try { await (navigator as any).mediaDevices.getUserMedia({ audio: true }); } catch (e) {} setGate(false); }

  useEffect(() => {
    const iv = setInterval(() => setBootN((n) => n + 1), 190);
    const done = setTimeout(() => { clearInterval(iv); setBooting(false); setTimeout(() => { if (i === -1) start("demo"); }, 120); }, 190 * (BOOT.length + 1) + 200);
    return () => { clearInterval(iv); clearTimeout(done); };
  }, []);

  const frame = useRef<HTMLIFrameElement | null>(null);
  const timer = useRef<any>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const win0Ref = useRef<HTMLDivElement | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const stepsRef = useRef<Step[]>([]);
  const speaking = useRef(false);
  const rec = useRef<any>(null);
  const modeRef = useRef<"demo" | "full">("demo");
  const idc = useRef(0);
  const typeT = useRef<any>(null);
  const bridgeT = useRef<any[]>([]);
  const flewThisLine = useRef(false);

  useEffect(() => { document.title = "The AI OS - live demo & tour | CSOAI"; const prev = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = prev; cleanup(); }; }, []);
  useEffect(() => { const el = endRef.current && (endRef.current.parentElement as HTMLElement | null); if (el) el.scrollTop = el.scrollHeight; }, [chat]);
  useEffect(() => { setWinTab(0); setWinMin(false); }, [wins]);

  function cleanup() { stopVoice(); if (timer.current) clearTimeout(timer.current); if (typeT.current) clearInterval(typeT.current); bridgeT.current.forEach(clearTimeout); bridgeT.current = []; try { rec.current && rec.current.stop(); } catch (e) {} }
  function post(msg: any) { try { frame.current && frame.current.contentWindow && frame.current.contentWindow.postMessage(msg, "*"); } catch (e) {} }
  function say(who: "sov" | "you", t: string) { const id = ++idc.current; setChat((c) => c.concat({ id, who, t })); return id; }
  function narrate(text: string) {
    const id = ++idc.current; setChat((c) => c.concat({ id, who: "sov", t: "" }));
    const words = text.split(" "); let k = 0;
    if (typeT.current) clearInterval(typeT.current);
    typeT.current = setInterval(() => { k++; const done = k >= words.length; const part = words.slice(0, k).join(" ") + (done ? "" : " ▋"); setChat((c) => c.map((m) => (m.id === id ? { ...m, t: part } : m))); if (done && typeT.current) clearInterval(typeT.current); }, 85);
    speak(text);
    scheduleBridge(text, words);
  }
  function scheduleBridge(text: string, words: string[]) {
    bridgeT.current.forEach(clearTimeout); bridgeT.current = []; flewThisLine.current = false;
    words.forEach((w, idx) => {
      const at = idx * 85 + 100;
      const pl = BRIDGE_PLACE.find((p) => p.re.test(w));
      if (pl && !flewThisLine.current) { flewThisLine.current = true; bridgeT.current.push(setTimeout(() => post({ cmd: "flyTo", lng: pl.lng, lat: pl.lat, height: pl.h, duration: 2.4 }), at)); return; }
      const ly = BRIDGE_LAYER.find((l) => l.re.test(w));
      if (ly) bridgeT.current.push(setTimeout(() => post({ cmd: "layer", tag: ly.tag, on: true }), at));
    });
  }
  function speak(t: string) {
    personaSpeak(t, {
      onstart: () => { speaking.current = true; },
      onend: () => { speaking.current = false; },
    });
  }

  function startRec() {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition; if (!SR || !handsFree) return;
    try { const r = new SR(); r.lang = "en-US"; r.interimResults = false; r.continuous = true; r.maxAlternatives = 1;
      r.onresult = (e: any) => { const said = e.results[e.results.length - 1][0].transcript || ""; if (!speaking.current && !paused && said.trim().length > 3) onBargeIn(said.trim()); };
      r.onend = () => { if (handsFree && modeRef.current) { try { r.start(); } catch (e) {} } };
      r.start(); rec.current = r;
    } catch (e) {}
  }
  function stopRec() { try { rec.current && rec.current.stop(); rec.current = null; } catch (e) {} }

  async function start(m: "demo" | "full") {
    setMode(m); modeRef.current = m; stepsRef.current = STEPS.filter((s) => (m === "full" ? true : !s.full)); setChat([]); setI(0); startRec();
    setGeoLabel("Global view — pick your region anytime");
    setTimeout(() => { post({ cmd: "home", duration: 2.6 }); }, 1200);
    setTimeout(() => setGeoLabel(""), 6000);
    runStep(0);
  }

  function openWins(list: Win[]) {
    setWinsShow(false); setWins(list);
    requestAnimationFrame(() => requestAnimationFrame(() => setWinsShow(true)));
  }
  function closeWins() { setWinsShow(false); setTimeout(() => setWins([]), 320); }

  function runStep(idx: number) {
    const arr = stepsRef.current; if (idx >= arr.length) { finish(); return; }
    const s = arr[idx];
    setTitle(s.wins && s.wins.length ? (s.wins.length > 1 ? s.wins.length + " apps open" : s.wins[0].title) : s.say.split(" - ")[0].slice(0, 42));
    narrate(s.say);
    if (s.fly) post({ cmd: "flyTo", ...s.fly, duration: 2.2 });
    if (s.rearm) post({ cmd: "rearm" });
    if (s.layer) post({ cmd: "layer", ...s.layer });
    if (s.cmd) post(s.cmd);
    if (!s.fly && !s.home && !s.cmd) post({ cmd: "spin", on: true });
    if (s.neutralize) { post({ cmd: "layer", tag: "threat", on: true }); setTimeout(() => post({ cmd: "neutralize" }), 1400); }
    if (s.home) post({ cmd: "home", duration: 2.5 });
    if (s.wins && s.wins.length) { say("sov", s.wins.length > 1 ? "Arranging " + s.wins.length + " windows for you." : "Opening " + s.wins[0].title + "."); openWins(s.wins); } else closeWins();
    const dur = modeRef.current === "demo" ? 12500 : 23000;
    timer.current = setTimeout(() => advance(idx), dur);
  }
  function advance(idx: number) { const n = idx + 1; setI(n); runStep(n); }
  function next() { if (timer.current) clearTimeout(timer.current); stopVoice(); advance(i); }

  function finish() { if (timer.current) clearTimeout(timer.current); closeWins(); post({ cmd: "home", duration: 2.5 }); setPaused(false); setEnding(true); setTitle("Where would you like to start?"); narrate("So - where would you like to start? I can scan your area, run a live scenario, show you governance, or explore the globe. Just tap - or tell me."); }
  function stop() { cleanup(); setMode(null); setI(-1); setWins([]); setWinsShow(false); setTitle(""); setGeoLabel(""); setEnding(false); post({ cmd: "home", duration: 2 }); }

  function onBargeIn(said: string) {
    if (timer.current) clearTimeout(timer.current); stopVoice();
    say("you", said);
    const lc = layerFromSpeech(said);
    if (lc) { post({ cmd: "layer", tag: lc.tag, on: lc.on }); if (lc.on) post({ cmd: "home", duration: 2.2 }); const line = (lc.on ? "Showing " : "Hiding ") + lc.label + " on the globe."; narrate(line); timer.current = setTimeout(() => { setPaused(false); runStep(Math.max(0, i)); }, 3800); setPaused(true); return; }
    setPaused(true); answer(said);
  }
  function interrupt() {
    if (timer.current) clearTimeout(timer.current); stopVoice(); setPaused(true); setListening(true); say("sov", "I'm listening - go ahead.");
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition; if (!SR) { say("sov", "Voice needs a Chromium browser - type to me instead."); setListening(false); return; }
    try { const r = new SR(); r.lang = "en-US"; r.interimResults = false; r.maxAlternatives = 1; r.onresult = (e: any) => { const said = e.results[0][0].transcript; say("you", said); answer(said); }; r.onend = () => setListening(false); r.start(); } catch (e) { setListening(false); }
  }
  async function answer(q: string) {
    setListening(false); say("sov", "…");
    const res = await askSovereign(q, { system: "You are the CSOAI Council assistant guiding a live tour of the CSOAI AI-governance Operating System. Answer only as that governance/cybersecurity assistant — never as a personal companion, never poetic, never mention other products. Be concise and concrete about AI governance, regulation, Fortune-100/500 compliance, cyber, or what's on the globe." });
    setChat((c) => c.slice(0, -1).concat({ id: ++idc.current, who: "sov", t: res.text }));
    speak(res.text);
  }
  function resume() { setPaused(false); say("sov", "Back to the tour."); runStep(Math.max(0, i)); }

  const solo = wins.length === 1;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#03080e] text-emerald-50">
      <AISystemNotice route="/demo" />
      <iframe ref={frame} src="/globe3d.html" title="globe" className="absolute inset-0 h-full w-full border-0" />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(1200px 640px at 50% 120%, rgba(3,8,14,.72), transparent 60%)" }} />

      {booting && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center px-6" style={{ background: "#03080f", backgroundImage: "radial-gradient(1100px 720px at 50% 40%, rgba(16,185,129,.22), transparent 68%), radial-gradient(700px 500px at 50% 42%, rgba(56,189,248,.12), transparent 70%), radial-gradient(1.6px 1.6px at 20% 30%, rgba(125,211,252,.7), transparent), radial-gradient(1.6px 1.6px at 70% 60%, rgba(167,243,208,.65), transparent), radial-gradient(1.2px 1.2px at 40% 80%, rgba(255,255,255,.5), transparent), radial-gradient(1.6px 1.6px at 85% 25%, rgba(125,211,252,.6), transparent), radial-gradient(1.2px 1.2px at 55% 15%, rgba(255,255,255,.45), transparent)" }}>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/10 text-3xl text-emerald-300" style={{ boxShadow: "0 0 44px rgba(16,185,129,.4)" }}>{"◉"}</div>
          <div className="font-mono text-[11px] uppercase tracking-[4px] text-emerald-300/70">CSOAI {"·"} Council {"·"} Governance {"·"} Layer 0</div>
          <div className="mt-6 w-full max-w-sm space-y-1.5 font-mono text-xs">
            {BOOT.map((l, k) => (<div key={k} className={"flex items-center justify-between " + (k < bootN ? "text-emerald-200" : "text-emerald-300/25")}><span>{l}</span><span>{k < bootN ? "✓" : "…"}</span></div>))}
          </div>
          <div className="absolute bottom-6 left-0 w-full">
            <div className="mb-1.5 text-center font-mono text-[10px] uppercase tracking-[3px] text-emerald-300/50">Aligned to global frameworks {"·"} built on open source {"·"} verifiable</div>
            <TrustMarquee variant="strip" dark speed={65} />
          </div>
        </div>
      )}

      {!booting && gate && mode === null && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#03080e]/85 backdrop-blur px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/10 text-2xl">*</div>
          <div role="status" aria-live="polite" className="mt-3 max-w-md rounded-md border border-amber-400/35 bg-amber-400/15 px-3 py-1.5 text-[11px] font-semibold text-amber-100">
            You are interacting with an AI system.
          </div>
          <h2 className="mt-4 text-2xl font-black text-emerald-100">Grant your Council assistant a voice</h2>
          <p className="mt-2 max-w-md text-sm text-emerald-100/75">Allow the mic so you can just talk to me during the tour - interrupt any time and I'll listen. Nothing is recorded or sold; on-device, consent-first.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button onClick={allowVoice} className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Allow &amp; continue</button>
            <button onClick={() => setGate(false)} className="rounded-xl border border-emerald-400/40 px-6 py-3 text-sm font-semibold text-emerald-100 hover:bg-white/5">Continue silently</button>
          </div>
          <div className="mt-3 font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/50">No private cameras {"·"} no facial recognition {"·"} no tracking {"·"} no data selling</div>
        </div>
      )}

      {mode === null && i === -1 && !booting && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#03080e]/55 backdrop-blur-sm px-6 text-center">
          <div className="h-12 w-12 animate-pulse rounded-full border border-emerald-300/40 bg-emerald-500/10" style={{ boxShadow: "0 0 40px rgba(16,185,129,.4)" }} />
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Your Council assistant is taking over…</p>
          <p className="mt-2 text-sm text-emerald-100/70">Speak or tap any time to interrupt.</p>
        </div>
      )}

      {mode !== null && (
        <div className="absolute left-4 top-4 z-30 flex max-w-[calc(100vw-460px)] items-center gap-3 rounded-2xl border border-emerald-500/25 bg-[#04120c]/90 px-4 py-2.5 backdrop-blur-xl">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px #34d399" }} />
          <span className="truncate text-sm font-semibold text-emerald-100">{title || "CSOAI Council OS"}</span>
          <span className="hidden flex-shrink-0 items-center gap-1 border-l border-white/10 pl-3 md:flex">{stepsRef.current.map((_, k) => (<span key={k} className={"h-1.5 rounded-full transition-all " + (k === i ? "w-4 bg-emerald-400" : k < i ? "w-1.5 bg-emerald-500/60" : "w-1.5 bg-white/15")} />))}</span>
          {!paused && !ending && <button onClick={interrupt} title="Tap or speak to interrupt" className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[1px] text-emerald-200/80 hover:bg-white/5"><span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />tap / speak</button>}
          {mode === "demo" && !ending && <button onClick={() => { stepsRef.current = STEPS; setMode("full"); modeRef.current = "full"; }} title="Switch to the full tour" className="flex-shrink-0 rounded-full px-2 py-1 text-[10px] font-bold text-emerald-300/60 hover:bg-white/5">full tour</button>}
        </div>
      )}

      {geoLabel && (<div className="absolute left-1/2 top-20 z-30 -translate-x-1/2 rounded-full border border-emerald-400/30 bg-black/50 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[2px] text-emerald-200/90 backdrop-blur">◎ {geoLabel}</div>)}

      {mode !== null && !booting && (
        <button onClick={() => setDrawer(true)} title="All tools & layers" className="absolute right-4 top-4 z-40 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-gray-900 shadow-lg hover:bg-gray-100">
          <span className="text-base leading-none">☰</span> Menu <span className="ml-1 rounded bg-gray-200 px-1 py-0.5 font-mono text-[9px] text-gray-500">⌘K</span>
        </button>
      )}

      {drawer && (
        <div className="absolute inset-0 z-[60]" onClick={() => setDrawer(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-0 h-screen w-[360px] max-w-[92vw] overflow-y-auto bg-white text-gray-900 shadow-2xl">
            <div className="sticky top-0 flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">◉</span>
              <span className="font-bold">CSOAI · AI OS</span>
              <button onClick={() => setDrawer(false)} className="ml-auto rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100">✕</button>
            </div>
            <div className="sticky top-[53px] z-10 border-b border-gray-100 bg-white px-4 py-2"><input value={drawerQ} onChange={(e) => setDrawerQ(e.target.value)} placeholder="Search tools & layers…" className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-400 focus:outline-none" /></div>
            <div className="p-4">
              {NAV_GROUPS.map((grp) => { const items = grp.items.filter((it) => !drawerQ.trim() || it.n.toLowerCase().includes(drawerQ.trim().toLowerCase())); if (!items.length) return null; return (
                <div key={grp.g} className="mb-4">
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">{grp.g}</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {items.map((it) => (
                      <div key={it.src} className="flex items-stretch gap-1">
                        <button onClick={() => openTool(it.n, it.src)} className="flex-1 rounded-lg border border-gray-200 px-2.5 py-2 text-left text-[12px] font-semibold text-gray-800 hover:border-emerald-400 hover:bg-emerald-50" title="Open docked in the OS">{it.n}</button>
                        <button onClick={() => window.open(it.src, "_blank")} title="Open in a new tab" className="rounded-lg border border-gray-200 px-1.5 text-[13px] leading-none text-gray-400 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600">↗</button>
                      </div>
                    ))}
                  </div>
                </div>
              ); })}
              <div className="mb-4">
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">Globe layers</div>
                <div className="flex flex-wrap gap-1.5">
                  {NAV_LAYERS.filter((l) => !drawerQ.trim() || l.n.toLowerCase().includes(drawerQ.trim().toLowerCase())).map((l) => (
                    <button key={l.tag} onClick={() => post({ cmd: "layer", tag: l.tag, on: true })} className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:border-emerald-400 hover:bg-emerald-50">{l.n}</button>
                  ))}
                  <button onClick={() => NAV_LAYERS.forEach((l) => post({ cmd: "layer", tag: l.tag, on: false }))} className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-500 hover:bg-gray-100">clear all</button>
                </div>
              </div>
              {(() => { const nd = NET_DOMAINS.filter((x) => !drawerQ.trim() || (x.n + " " + x.d).toLowerCase().includes(drawerQ.trim().toLowerCase())); if (!nd.length) return null; return (
              <div className="mb-4">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">Council network <span className="rounded-full border border-emerald-200 px-1.5 text-[9px] text-emerald-500">{NET_DOMAINS.length} signed</span></div>
                <div className="flex flex-wrap gap-1.5">
                  {nd.map((x) => (
                    <a key={x.d} href={"https://" + x.d} target="_blank" rel="noreferrer" title={x.d} className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:border-emerald-400 hover:bg-emerald-50">{x.n} <span className="text-gray-400">↗</span></a>
                  ))}
                  <a href="/network" className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100">Full directory →</a>
                </div>
              </div>
              ); })()}
              <div className="mb-2">
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">3D showcases</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {NAV_SHOW.map((s) => (
                    <button key={s.n} onClick={() => { post(s.cmd); setDrawer(false); }} className="rounded-lg border border-gray-200 px-2.5 py-2 text-left text-[12px] font-semibold text-gray-800 hover:border-emerald-400 hover:bg-emerald-50">{s.n}</button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => openLobby({ pane: "home" })} className="mt-3 block w-full rounded-xl bg-emerald-600 px-3 py-2.5 text-center text-sm font-bold text-white hover:bg-emerald-500">{POSITIONING.os.cta} →</button>
            </div>
          </div>
        </div>
      )}

      {mode !== null && !booting && !ending && (
        <div className="absolute bottom-9 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/15 bg-[#04120c]/90 px-2 py-1.5 backdrop-blur-xl" style={{ maxWidth: "calc(100vw - 460px)" }}>
          {BOTTOM_NAV.map((b) => (
            <button key={b.src} onClick={() => openTool(b.n, b.src)} title={b.n} className="flex flex-col items-center rounded-lg px-2.5 py-1 text-emerald-200/80 hover:bg-white/10">
              <span className="text-sm leading-none">{b.g}</span><span className="mt-0.5 text-[9px] font-semibold">{b.n}</span>
            </button>
          ))}
        </div>
      )}

      {mode !== null && !booting && !ending && (
        <div className="absolute bottom-0 left-0 z-20 w-full border-t border-emerald-500/20 bg-[#04120c]/85 py-1 backdrop-blur-xl" style={{ maxWidth: "calc(100vw - 420px)" }}>
          <TrustMarquee variant="strip" dark speed={70} />
        </div>
      )}

      {mode !== null && chatMin && (
        <button onClick={() => setChatMin(false)} title="Open the Council assistant" className="absolute right-3 top-3 z-40 flex items-center gap-2 rounded-full border border-emerald-400/40 bg-[#04120c]/90 px-3 py-2 text-sm font-bold text-emerald-100 shadow-2xl backdrop-blur-xl hover:bg-[#04120c]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/15 text-xs">◉</span> Council
          {listening && <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />}
        </button>
      )}
      {mode !== null && !chatMin && (
        <div ref={chatRef} className="absolute right-0 top-0 z-30 flex h-screen max-w-[94vw] flex-col border-l border-emerald-400/30 bg-[#04120c]/95 backdrop-blur-xl shadow-2xl" style={{ width: chatW }}>
          <div onPointerDown={startChatResize} title="Drag to resize" className="absolute left-0 top-0 z-10 h-full w-1.5 cursor-col-resize bg-emerald-500/10 hover:bg-emerald-400/50" />
          {winsShow && wins.length > 0 && (
            <div ref={win0Ref} className="flex flex-col border-b border-emerald-500/25" style={{ height: winMin ? 38 : winH + "vh" }}>
              <div className="flex items-center gap-2 bg-[#03110b] px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                {wins.length > 1 ? (
                  <div className="ml-1 flex flex-1 gap-1 overflow-x-auto">
                    {wins.map((w, k) => (<button key={k} onClick={() => { setWinTab(k); setWinMin(false); }} className={"whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-bold " + (winTab === k ? "bg-emerald-500/25 text-emerald-100" : "text-emerald-300/60 hover:bg-white/5")}>{w.title.replace(/^[◉]\s*/, "").slice(0, 16)}</button>))}
                  </div>
                ) : (<span className="ml-1 flex-1 truncate text-xs font-bold text-emerald-100">{wins[0].title}</span>)}
                <button onClick={() => setWinMin((m) => !m)} title={winMin ? "Restore" : "Minimize"} className="rounded px-1.5 text-emerald-300/70 hover:bg-white/5">{winMin ? "▢" : "—"}</button>
                <button onClick={() => setWins([])} title="Close" className="rounded px-1.5 text-emerald-300/70 hover:bg-white/5">✕</button>
              </div>
              {!winMin && <iframe key={(wins[winTab] || wins[0]).src} src={(wins[winTab] || wins[0]).src} title={(wins[winTab] || wins[0]).title} className="w-full flex-1 border-0 bg-[#03110b]" />}
              {!winMin && <div onPointerDown={startResize} title="Drag to resize" className="flex h-2 cursor-row-resize items-center justify-center bg-emerald-500/15 hover:bg-emerald-400/40"><span className="h-0.5 w-8 rounded bg-emerald-300/50" /></div>}
            </div>
          )}
          <div className="flex items-center gap-1.5 border-b border-emerald-500/15 px-3 py-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/15 text-xs">{"◉"}</div>
            <div className="truncate text-[13px] font-bold text-emerald-100">Council {geoCity && <span className="font-mono text-[9px] font-normal text-emerald-300/50">near {geoCity}</span>}</div>
            <button onClick={() => setHandsFree((h) => { const n = !h; if (n) startRec(); else stopRec(); return n; })} title={handsFree ? "Hands-free on" : "Hands-free off"} className={"ml-auto rounded-full px-1.5 py-0.5 text-[11px] " + (handsFree ? "bg-emerald-500/20 text-emerald-200" : "text-emerald-300/45 hover:bg-white/5")}>{handsFree ? "⏺" : ""}</button>
            <button onClick={() => setChatMin(true)} title="Collapse chat" className="rounded px-1.5 py-0.5 text-[13px] text-emerald-300/60 hover:bg-white/5">»</button>
            <button onClick={stop} title="End tour" className="rounded px-1.5 py-0.5 text-[11px] text-emerald-300/60 hover:bg-white/5">End</button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {chat.map((m) => (<div key={m.id} className={m.who === "you" ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-500/20 px-3 py-2 text-sm" : "mr-auto max-w-[92%] rounded-2xl rounded-bl-sm border border-emerald-400/20 bg-white/[0.03] px-3 py-2 text-sm text-emerald-50/90"}>{m.t}</div>))}
            <div ref={endRef} />
          </div>
          <div className="border-t border-emerald-500/15 p-3">
            {ending ? (
              <div className="grid grid-cols-2 gap-2">
                <a href="/world" className="rounded-xl bg-emerald-500/15 px-3 py-2 text-center text-xs font-bold text-emerald-100 hover:bg-emerald-500/25">Scan my area</a>
                <a href="/gspc-arena" className="rounded-xl bg-emerald-500/15 px-3 py-2 text-center text-xs font-bold text-emerald-100 hover:bg-emerald-500/25">Run a live scenario</a>
                <a href="/graph" className="rounded-xl bg-emerald-500/15 px-3 py-2 text-center text-xs font-bold text-emerald-100 hover:bg-emerald-500/25">Show governance</a>
                <button type="button" onClick={() => openLobby({ pane: "home" })} className="rounded-xl bg-emerald-500 px-3 py-2 text-center text-xs font-bold text-[#03110b] hover:bg-emerald-400">{POSITIONING.os.cta} ▶</button>
              </div>
            ) : !paused ? (
              <button onClick={interrupt} className={"flex w-full items-center justify-center rounded-xl px-3 py-2 text-sm font-bold " + (listening ? "bg-rose-500/30 text-rose-100 animate-pulse" : "bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25")}>{listening ? "Listening…" : (handsFree ? "Just speak - I'm listening" : "Interrupt & ask")}</button>
            ) : (
              <button onClick={resume} className="w-full rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Resume tour ▶</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
