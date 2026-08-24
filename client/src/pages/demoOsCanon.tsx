import { useRef, useState } from "react";
import type { Slot } from "./demoOsSteps";


export const BOOT = ["Establishing governed link", "Loading Council Layer 0", "Verifying Ed25519 identity", "Mounting live world feeds", "Loading council design (not yet live — DR-0007)", "Care-floor engaged"];

// Navigation surfaces for the OS drawer + bottom bar (end-user tool navigation).
export const NAV_GROUPS: { g: string; items: { n: string; src: string }[] }[] = [
  { g: "Govern", items: [{ n: "Governance Graph", src: "/graph" }, { n: "The Council", src: "/try" }, { n: "Council Space", src: "/gspc-arena" }, { n: "Framework Hive", src: "/hive" }, { n: "Regulator Atlas", src: "/regulators" }] },
  { g: "Protect & watch", items: [{ n: "Global Watchdog", src: "/watchdog-map" }, { n: "Cyber self-scan", src: "/scan" }, { n: "Personal Protection", src: "/protect" }] },
  { g: "Ecosystem", items: [{ n: "Council Network", src: "/network" }, { n: "The Ontology", src: "/ontology" }, { n: "Signed System Card", src: "/system-card" }, { n: "Why CSOAI", src: "/why" }, { n: "Competitor battlecards", src: "/competitors" }] },
  { g: "Build & run", items: [{ n: "Tool Commons", src: "/tool-commons" }, { n: "OSCAL Studio", src: "/oscal" }, { n: "Command Center", src: "/command-center" }, { n: "The rail is free", src: "/pricing" }, { n: "Workbench", src: "/workbench" }] },
];
export const NAV_LAYERS: { n: string; tag: string }[] = [
  { n: "Frameworks", tag: "frameworks" }, { n: "Regulators", tag: "regulators" }, { n: "Governments", tag: "gov" }, { n: "Fortune / companies", tag: "fortune" }, { n: "Cyber / CNI", tag: "cyber" }, { n: "AI compute", tag: "compute" }, { n: "AI labs & safety", tag: "labs" }, { n: "Autonomous systems", tag: "auton" }, { n: "Council network", tag: "network" }, { n: "Robotics", tag: "robotics" }, { n: "Humanoids", tag: "humanoids" }, { n: "AI-security intel", tag: "intel" }, { n: "Space & satellites", tag: "space" }, { n: "AI-critical energy", tag: "energy" }, { n: "Internet backbone", tag: "cables" }, { n: "Industries → AI", tag: "industries" }, { n: "Live aircraft", tag: "aircraft" }, { n: "Ontology", tag: "ontology" }, { n: "Cross-region mesh", tag: "arcs" },
];
export const NAV_SHOW: { n: string; cmd: any }[] = [
  { n: "✨ Light it up", cmd: { cmd: "lightup" } }, { n: "⚖ Council of AI spiral", cmd: { cmd: "bftSpiral" } }, { n: "Rainbow Stack", cmd: { cmd: "rainbowStack" } }, { n: "◵ Clear 3D", cmd: { cmd: "clearViz" } }, { n: "⌂ Home view", cmd: { cmd: "home", duration: 2.2 } },
];
// Sovereign Network directory — signed agent domains, opened in a new tab.
export const NET_DOMAINS: { d: string; n: string }[] = [
  { d: "councilof.ai", n: "Council" }, { d: "csoai.org", n: "CSOAI" }, { d: "proofof.ai", n: "Proof-of" },
  { d: "safetyof.ai", n: "Safety-of" }, { d: "accountabilityof.ai", n: "Accountability" }, { d: "ethicalgovernanceof.ai", n: "Ethical gov" },
  { d: "dataprivacyof.ai", n: "Data privacy" }, { d: "careshield.ai", n: "CareShield" },
];
export const BOTTOM_NAV: { n: string; src: string; g: string }[] = [
  { n: "Graph", src: "/graph", g: "◎" }, { n: "Council", src: "/try", g: "⚖" }, { n: "Hive", src: "/hive", g: "⬡" }, { n: "Watchdog", src: "/watchdog-map", g: "o" }, { n: "Scan", src: "/scan", g: "*" }, { n: "Atlas", src: "/regulators", g: "+" }, { n: "Network", src: "/network", g: "◇" }, { n: "OS", src: "/workbench", g: "⊞" },
];

export function slotStyle(slot: Slot, solo: boolean): any {
  if (solo && slot === "tr") return { right: 24, top: 72, width: "46%", maxWidth: 560, height: "54vh" };
  if (slot === "tr") return { right: 20, top: 72, width: "38%", maxWidth: 460, height: "40vh" };
  if (slot === "tl") return { left: 20, top: 72, width: "38%", maxWidth: 460, height: "40vh" };
  if (slot === "br") return { right: 20, bottom: 20, width: "38%", maxWidth: 460, height: "40vh" };
  return { left: "29%", top: "16%", width: "42%", maxWidth: 540, height: "56vh" }; // c
}
export function intersect(a: DOMRect, b: DOMRect) { return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom); }

// A real, draggable + minimizable OS window (not just a fixed browser frame).
export function OsWindow({ title, src, idx, onClose, innerRef }: { title: string; src: string; idx: number; onClose: () => void; innerRef?: (el: HTMLDivElement | null) => void }) {
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
export const GLOBE_LAYERS: { re: RegExp; tag: string; label: string }[] = [
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
export const BRIDGE_PLACE: { re: RegExp; lng: number; lat: number; h: number }[] = [
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
export const BRIDGE_LAYER: { re: RegExp; tag: string }[] = [
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

export function layerFromSpeech(t: string): { tag: string; label: string; on: boolean } | null {
  const m = GLOBE_LAYERS.find((l) => l.re.test(t)); if (!m) return null;
  const wantsMap = /\b(show|display|turn on|add|reveal|map|see|where|hide|remove|turn off|clear|layer)\b/i.test(t);
  if (!wantsMap) return null;
  const on = !/\b(hide|remove|turn off|clear|without|no )\b/i.test(t);
  return { tag: m.tag, label: m.label, on };
}
