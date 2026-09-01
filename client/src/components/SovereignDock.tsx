import { useEffect, useRef, useState } from "react";
import { LAYER0_DISAMBIGUATION } from "../data/anchoringClaim";
import { useLocation } from "wouter";
import AISystemNotice from "./AISystemNotice";
import { chargeSovereign } from "../lib/sovCharge";
import { askSovereign } from "../lib/sovAsk";
import { fetchHealth } from "../lib/sovHealth";
import { subscribeBus, busHealth, fetchAnchors, fetchLedgerStats, fetchFlywheelSnapshot, fetchHiveCoverage } from "../lib/sovDataBus";
import { useGeolibre, GEO_REGION_OPTIONS } from "../lib/geolibre";
import { PERSONAS, type SovPersonaId, getPersonaId, setPersonaId, personaOf, personaSpeak, stopVoice, DOCTRINE_RE, DOCTRINE_REFUSAL } from "../lib/sovPersona";

// SovereignDock - the persistent right-hand AI OS sidebar. Speak or type and it
// acts: routes you to the right surface, answers from the framework knowledge
// base, and now answers any question with live world data via the measurement API.

type Msg = { role: "you" | "sov"; text: string };

const ROUTES: { re: RegExp; href: string; label: string }[] = [
  { re: /governance graph|knowledge graph|\bgraph\b/i, href: "/os?lobby=home", label: "the Governance Graph" },
  { re: /regulation|legislation|\blaw\b|jurisdiction|comply|compliance/i, href: "/os?lobby=home", label: "the Governance Graph" },
  { re: /framework|crosswalk|\biso\b|\bnist\b|tc260|eu ai act/i, href: "/crosswalks", label: "Framework crosswalks" },
  { re: /sov ?space|simulate|simulation|experiment|run a (sim|scenario)/i, href: "/gspc-arena", label: "Council Space" },
  { re: /sovereign town|\btown\b|incident/i, href: "/gspc-arena?view=towns", label: "the Towns layer of Council Space" },
  { re: /arena|benchmark|head.?to.?head|model compar/i, href: "/gspc-arena?view=arena", label: "the Arena layer of Council Space" },
  { re: /distribution|\bmcp\b|pypi|npm|glama|mcpize|registry/i, href: "/distribution", label: "Distribution & Layer 0 coverage" },
  { re: /jsp ?936|defence assurance|defense assurance|system card|mod evidence|evidence pack|dependable ai/i, href: "/system-card", label: "the Signed System Card — JSP 936 assurance" },
  { re: /evidence|connect|integrat|webhook/i, href: "/evidence-rail", label: "Evidence Hub" },
  { re: /certif|attest|train|academy|course|learn/i, href: "/academy", label: "Council Academy (training, not conformity)" },
  { re: /policy/i, href: "/policy-generator", label: "Policy Generator" },
  { re: /risk|heatmap/i, href: "/risk-heatmap", label: "Risk Heatmap" },
  { re: /oscal|fedramp/i, href: "/oscal", label: "OSCAL Studio" },
  { re: /model|bias|fairness/i, href: "/models", label: "Model Registry" },
  { re: /price|pricing|plan|cost/i, href: "/os?lobby=assess&task=pricing-overview", label: "How the free rail works" },
  { re: /media|image|photo|creative commons/i, href: "/commons", label: "Open Commons media" },
  { re: /status|health|uptime/i, href: "/status", label: "System Status" },
  { re: /watchdog|heat.?map|incident|signal|report a/i, href: "/watchdog-map", label: "the Global AI Watchdog" },
  { re: /humanoid|\bpoc\b|proof of concept|one os|rogue|swarm|bad actor/i, href: "/poc", label: "the ONE OS proof of concept" },
  { re: /globe|earth|world map|3d/i, href: "/gspc-arena?view=globe", label: "the Globe layer of Council Space" },
  { re: /council network|ecosystem|signed agents|agent card|our (agents|domains|companies)/i, href: "/network", label: "the Council network" },
  { re: /layer ?0|protocol|trust control/i, href: "/trust-center", label: "Layer 0" },
  { re: /command|dashboard|overview/i, href: "/command-center", label: "Command Center" },
  { re: /\bos\b|launch|grid|everything/i, href: "/os?lobby=home", label: "the OS launcher" },
];

const KNOWLEDGE: { re: RegExp; a: string }[] = [
  { re: /what.?s? layer ?0|explain layer ?0/i, a: LAYER0_DISAMBIGUATION + " Concretely it carries identity (did:csoai), runtime policy, agentic-finance pre-checks, a legacy bridge and cross-region handoff, plus Ed25519 attestation and A2A." },
  { re: /who are you|what are you/i, a: "I'm the Council assistant — I open the right surface, read the living board, and stay inside what we have actually measured." },
];

const QUICK: { label: string; href: string }[] = [
  { label: "Governance Graph", href: "/os?lobby=home" },
  { label: "Council Space", href: "/gspc-arena" },
  { label: "Open Commons", href: "/commons" },
  { label: "Free rail", href: "/os?lobby=assess&task=pricing-overview" },
  { label: "Status", href: "/status" },
  { label: "Full OS", href: "/os?lobby=home" },
];

const GW = "/api";
const INDUSTRIES = ["healthcare","health","hospital","clinical","finance","fintech","banking","insurance","education","edtech","retail","ecommerce","legal","law firm","government","public sector","defense","energy","utilities","automotive","telecom","pharma","biotech","manufacturing","logistics","supply chain","hr","recruiting","hiring","media","gaming","agriculture","transport","aviation","real estate","crypto","web3","marketing","advertising"];

async function askChat(msg: string, system?: string): Promise<string | null> {
  const res = await askSovereign(msg, system ? { system } : undefined);
  return res.ok ? res.text : null;
}

async function askGovern(q: string): Promise<any | null> {
  try {
    const r = await fetch(GW + "/govern?q=" + encodeURIComponent(q));
    if (r.ok) { const d = await r.json(); if (d && d.matched && d.frameworks && d.frameworks.length) return d; }
  } catch (e) {}
  return null;
}

// SOV3 shared brain: /orchestrate returns {say, actions}. The Sovereign SEES the
// page (getScreenContext), THINKS via the measurement API, then ACTS - opening OS surfaces.
const APP_ROUTES: Record<string, string> = {
  revenue: "/os?lobby=assess&task=pricing-overview", pricing: "/os?lobby=assess&task=pricing-overview", plans: "/os?lobby=assess&task=pricing-overview", billing: "/os?lobby=assess&task=pricing-overview",
  king: "/try", council: "/try", try: "/try", vote: "/try", bft: "/try",
  setup: "/start", onboard: "/start", start: "/start", welcome: "/start",
  graph: "/os?lobby=home", knowledge: "/os?lobby=home", search: "/os?lobby=home",
  space: "/gspc-arena", sim: "/gspc-arena", simulation: "/gspc-arena", experiment: "/gspc-arena", sovspace: "/gspc-arena",
  tools: "/tool-commons", mcp: "/tool-commons", commons: "/commons", media: "/commons",
  status: "/status", system: "/status", os: "/os?lobby=home", home: "/os?lobby=home", grid: "/os?lobby=home",
  twin: "/me",
  certification: "/academy", cert: "/academy", academy: "/academy",
  evidence: "/evidence", oscal: "/oscal", models: "/models", policy: "/policy-generator",
  layer0: "/trust-center", distribution: "/distribution", command: "/command-center",
};
function getScreenContext(): any {
  try {
    const h1 = (document.querySelector("h1")?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120);
    const excerpt = (document.body?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 500);
    return { path: location.pathname, title: (document.title || "").slice(0, 90), heading: h1, excerpt, property: "csoai", citizen: "csoai-web" };
  } catch (e) { return { path: "/", title: "", heading: "", excerpt: "" }; }
}
function routeForAction(a: any): string | null {
  if (!a || !a.command) return null;
  if (a.command === "open_url" && a.args && a.args.url) return String(a.args.url);
  if (a.command === "open_app" && a.args && a.args.id) return APP_ROUTES[String(a.args.id).toLowerCase()] || null;
  if (a.command === "govern") return "/os?lobby=home";
  return null;
}
async function orchestrate(message: string, context: any): Promise<{ say: string; actions: any[] } | null> {
  try {
    const r = await fetch(GW + "/orchestrate", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message, context }) });
    if (r.ok) { const d = await r.json(); if (d && (d.say || d.actions)) return { say: String(d.say || ""), actions: Array.isArray(d.actions) ? d.actions : [] }; }
  } catch (e) {}
  return null;
}

export default function SovereignDock() {
  const [, navigate] = useLocation();
  // Drive the site WITH the dock still present (SPA nav, no hard reload) — external → new tab.
  const go = (href: string) => { if (/^https?:\/\//.test(href)) window.open(href, "_blank"); else navigate(href); };
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "sov", text: "Hi. I'm the Council assistant. Ask about a measurement, a statute, or tell me which pane to open." }]);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [hz, setHz] = useState<any>(null);
  const [brainOpen, setBrainOpen] = useState(false);
  const [brainMode, setBrainMode] = useState<string>(() => { try { return localStorage.getItem("sov_brain_mode") || "hosted"; } catch (e) { return "hosted"; } });
  const [personaId, setPersona] = useState<SovPersonaId>(() => getPersonaId());
  const persona = personaOf(personaId);
  function switchPersona(id: SovPersonaId) {
    if (id === personaId) return;
    setPersonaId(id); setPersona(id);
    setMsgs((m) => m.concat({ role: "sov", text: personaOf(id).greeting }));
  }
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function onFiles(e: any) {
    const fs = Array.from((e.target.files || []) as FileList); if (!fs.length) return;
    setMsgs((m) => m.concat({ role: "you", text: "📎 " + fs.map((f) => f.name).join(", ") }));
    setMsgs((m) => m.concat({ role: "sov", text: "Received " + fs.length + " file" + (fs.length > 1 ? "s" : "") + ". I'll review under Layer 0 — perception runs on my right brain (vision/VLM), reasoning on my left, and nothing leaves your governance boundary without a signed decision." }));
    chargeSovereign(4); try { e.target.value = ""; } catch (er) {}
  }
  const BRAIN: Record<string, string> = {
    offline: "Offline brain — a local open-source model runs on your own hardware. Fully self-hosted, no data leaves you. I wrap it in multi-agent review + Layer 0 so it still stays compliant.",
    hosted: "Hosted brain — premium models, governed. I route your request to the best model (MoE, world model or VLM), the Council of AI checks the answer, and every decision is signed.",
    paygo: "Pay-as-you-go — you only pay per governed call. Same multi-agent review + Layer 0 floor; ideal for bursty or trial use.",
  };
  function setBrain(mode: string) { setBrainMode(mode); try { localStorage.setItem("sov_brain_mode", mode); } catch (e) {} setMsgs((m) => m.concat({ role: "sov", text: BRAIN[mode] })); }

  useEffect(() => { fetchHealth().then(setHz); }, []);

  // Sov Space data bus — the OS taskbar shows feed health honestly (live/partial/offline).
  const [, forceBus] = useState(0);
  useEffect(() => {
    const un = subscribeBus(() => forceBus((x) => x + 1));
    fetchAnchors(); fetchLedgerStats(); fetchFlywheelSnapshot(); fetchHiveCoverage();
    return un;
  }, []);
  const bus = busHealth();
  const geo = useGeolibre();

  useEffect(() => { const el = endRef.current && (endRef.current.parentElement as HTMLElement | null); if (el) el.scrollTop = el.scrollHeight; }, [msgs, open]);

  useEffect(() => {
    if (!voiceOn || msgs.length <= 1) return;
    var last = msgs[msgs.length - 1];
    if (last && last.role === "sov") {
      personaSpeak(last.text);
    }
  }, [msgs, voiceOn]);

  async function act(text: string) {
    const t = (text || "").trim();
    if (!t) return;
    setMsgs((m) => m.concat({ role: "you", text: t }));
    setInput("");
    // Doctrine hard-stop — enforced before any network call, in every persona.
    if (DOCTRINE_RE.test(t)) { setMsgs((m) => m.concat({ role: "sov", text: DOCTRINE_REFUSAL })); return; }
    chargeSovereign(4); // every question teaches your Council assistant
    // Only treat input as a navigation command when it's an explicit nav verb or a
    // short topic phrase - never when the user is asking a question (answer those).
    const words = t.split(/\s+/).length;
    const questionLike = /\?/.test(t) || /^(is|are|what|how|does|do|can|could|should|would|why|when|which|who|will|explain|tell me|define|describe|list)\b/i.test(t);
    const navVerb = /^(open|go to|goto|show me|show|take me|navigate|launch|bring up|jump to|visit)\b/i.test(t);
    const wantsNav = navVerb || (!questionLike && words <= 4);
    const hit = wantsNav ? ROUTES.find((r) => r.re.test(t)) : null;
    const know = KNOWLEDGE.find((k) => k.re.test(t));
    if (know && !hit) { setMsgs((m) => m.concat({ role: "sov", text: know.a })); return; }
    if (hit) {
      setMsgs((m) => m.concat({ role: "sov", text: "Opening " + hit.label + " — taking you there now (I stay with you)." }));
      setTimeout(() => { go(hit.href); }, 650);
      return;
    }
    // SOV3: the Council assistant is page-aware. For a command or an "explain this page"
    // request, orchestrate over the live brain - it speaks and opens the right surface.
    const ctx = getScreenContext();
    const commandLike = navVerb || /\bexplain (this|the) page\b|\bwhat can i do here\b|\bwhere am i\b|\bhelp me (here|with this)\b|\bwhat is this page\b|\bwalk me through\b|\btake me\b|\bopen \b/i.test(t);
    if (commandLike) {
      setMsgs((m) => m.concat({ role: "sov", text: "On it…" }));
      const o = await orchestrate(t, ctx);
      if (o && (o.say || o.actions.length)) {
        const route = o.actions.map(routeForAction).find(Boolean) as string | undefined;
        setMsgs((m) => m.concat({ role: "sov", text: o.say || (route ? "Opening that for you." : "Done.") }));
        if (route) setTimeout(() => { go(route); }, 950);
        return;
      }
    }
    setMsgs((m) => m.concat({ role: "sov", text: "Reasoning over live governance data…" }));
    // Reason via the live Council gateway; in parallel map the industry to its framework stack.
    const ind = INDUSTRIES.find((w) => new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(t));
    const [answer, gov] = await Promise.all([askChat(t, persona.system), ind ? askGovern(ind) : Promise.resolve(null)]);
    let out = answer || "";
    if (gov) {
      const names = gov.frameworks.map((f: any) => f.name).join(", ");
      out += (out ? "\n\n" : "") + "⚖️ Governance stack for " + gov.industry + ": " + names + "." + (gov.bridges && gov.bridges.length ? " Legacy bridge: " + gov.bridges.join(", ") + "." : "") + " Every governed action is Layer 0 signed.";
    }
    if (out) { setMsgs((m) => m.concat({ role: "sov", text: out })); return; }
    // Fallback: entity facts from the knowledge endpoint.
    try {
      const r = await fetch(GW + "/knowledge?q=" + encodeURIComponent(t));
      if (r.ok) {
        const d = await r.json();
        let ans = "";
        if (d && d.facts && (d.facts.desc || d.facts.label)) ans = (d.facts.label ? d.facts.label + " - " : "") + (d.facts.desc || "") + (d.facts.population ? " (population " + Number(d.facts.population).toLocaleString() + ")" : "") + ".";
        if (!ans && d && d.results && d.results[0]) ans = d.results[0].excerpt || d.results[0].desc || "";
        if (ans) { setMsgs((m) => m.concat({ role: "sov", text: ans + " Want the governance view? Open the Governance Graph." })); return; }
      }
    } catch (e) {}
    setMsgs((m) => m.concat({ role: "sov", text: "I could not reach live reasoning just now - try: regulations, crosswalks, evidence, certify, or open the Governance Graph." }));
  }

  function voice() {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { setMsgs((m) => m.concat({ role: "sov", text: "Voice needs a Chromium browser - type your command and I will act." })); return; }
    try {
      const rec = new SR(); rec.lang = "en-US"; rec.interimResults = false; rec.maxAlternatives = 1;
      rec.onstart = () => setListening(true);
      rec.onend = () => setListening(false);
      rec.onresult = (e: any) => { const said = e.results[0][0].transcript; act(said); };
      rec.start();
    } catch (e) { setListening(false); }
  }

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Open the Council assistant" title="Ask the Council" className="group fixed right-4 bottom-4 z-[9998] flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/40 bg-[#04110b]/90 text-emerald-200 shadow-[0_8px_24px_-8px_rgba(16,185,129,.5)] backdrop-blur transition hover:bg-[#062016]">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="absolute right-0 top-0 flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" /></span>
        </button>
      )}
      {open && (
        <div className="fixed right-0 top-0 z-[9999] flex h-screen w-[340px] max-w-[88vw] flex-col border-l border-emerald-500/20 bg-[#05080e]/95 text-[#e7f6ef] backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 border-b border-emerald-500/15 px-4 py-3">
            <div className={"flex h-9 w-9 items-center justify-center rounded-full border text-lg " + (personaId === "assurance" ? "border-amber-300/50 bg-amber-500/15 text-amber-200" : "border-emerald-300/40 bg-emerald-500/15")}>{persona.glyph}</div>
            <div className="flex-1">
              <div className={"text-sm font-bold " + (personaId === "assurance" ? "text-amber-100" : "text-emerald-100")}>{persona.name}</div>
              <div className={"font-mono text-[10px] uppercase tracking-[2px] " + (personaId === "assurance" ? "text-amber-300/60" : "text-emerald-300/50")}>{hz && hz.ok && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle" style={{ boxShadow: "0 0 6px #34d399" }} />}{hz && hz.ok ? persona.sub + " - connected" : persona.sub}</div>
              <div className="font-mono text-[10px] uppercase tracking-[2px] text-sky-300/50" title="Council Space data bus — anchors · ledger · flywheel · hive feeds">
                <span className={"mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle " + (bus.state === "live" ? "bg-sky-400" : bus.state === "partial" ? "bg-amber-400" : "bg-rose-400/70")} />
                data bus: {bus.state === "live" ? "live" : bus.state === "partial" ? `partial ${bus.live}/${bus.total}` : "offline"}
              </div>
              {/* Geolibre local shard — opt-in only; off by default (GDPR-clean) */}
              <div className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/50" title={geo.enabled ? `Local shard: ${geo.region.label} (${geo.source === "ip" ? "IP-resolved" : "manual pick"}) — frameworks: ${geo.region.frameworks.join(", ")}` : "Local shard off — enable for jurisdiction-aware arena + towns"}>
                {geo.enabled ? (
                  <button onClick={geo.disable} className="hover:text-emerald-100" title="Disable local shard">
                    ⬡ shard: {geo.region.code}{geo.countryIso2 ? `/${geo.countryIso2}` : ""} · {geo.source === "ip" ? "ip" : "manual"} ✕
                  </button>
                ) : (
                  <button onClick={() => geo.enable()} className="hover:text-emerald-100" title="Enable local shard (resolves your IP country once, only after you click)">
                    ⬡ shard: off — enable
                  </button>
                )}
                <select
                  value={geo.enabled && geo.source === "manual" ? geo.regionCode : ""}
                  onChange={(e) => { if (e.target.value) geo.pick(e.target.value); }}
                  className="ml-1 rounded border border-emerald-500/20 bg-[#05140d] px-1 text-emerald-300/70 outline-none"
                  title="Pick a shard manually — no network, no IP"
                >
                  <option value="">pick…</option>
                  {GEO_REGION_OPTIONS.map((o) => <option key={o.code} value={o.code}>{o.code}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => { setVoiceOn((x) => !x); stopVoice(); }} aria-label="Toggle voice" className="rounded-lg px-2 py-1 text-emerald-300/70 hover:bg-white/5">{voiceOn ? "On" : "Off"}</button>
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg px-2 py-1 text-emerald-300/70 hover:bg-white/5">{"\u2715"}</button>
          </div>
          <div className="flex flex-wrap gap-1.5 border-b border-emerald-500/10 px-3 py-2">
            {(Object.keys(PERSONAS) as SovPersonaId[]).map((id) => (
              <button key={id} onClick={() => switchPersona(id)} title={id === "assurance" ? "Defence assurance voice — JSP 936, signed System Cards. Assurance, never weapons." : "Civil governance voice"} className={"rounded-full px-2.5 py-1 text-[11px] font-bold " + (personaId === id ? (id === "assurance" ? "border border-amber-400/60 bg-amber-500/25 text-amber-100" : "border border-emerald-400/60 bg-emerald-500/30 text-emerald-100") : "border border-white/15 bg-white/[0.03] text-white/50 hover:bg-white/10")}>{id === "assurance" ? "✦ Assurance" : "◉ Civil"}</button>
            ))}
            <button onClick={() => go("/demo")} className="rounded-full border border-emerald-400/50 bg-emerald-500/25 px-2.5 py-1 text-[11px] font-bold text-emerald-100 hover:bg-emerald-500/35">▶ Live demo</button>
            <button onClick={() => act("explain this page and what I can do here")} className="rounded-full border border-emerald-400/50 bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-100 hover:bg-emerald-500/30">Explain this page</button>
            {QUICK.map((q) => (<button key={q.label} onClick={() => go(q.href)} className="rounded-full border border-emerald-400/25 bg-emerald-500/5 px-2.5 py-1 text-[11px] text-emerald-200/80 hover:bg-emerald-500/15">{q.label}</button>))}
          </div>
          <div className="px-4 pt-3">
            {/* Art 50(1): the dock chats with a live model — disclosed at first interaction. */}
            <AISystemNotice route="/sovereign-dock" />
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) => (<div key={i} className={m.role === "you" ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-500/20 px-3 py-2 text-sm" : "mr-auto max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-emerald-400/20 bg-white/[0.03] px-3 py-2 text-sm text-emerald-50/90"}>{m.text}</div>))}
            <div ref={endRef} />
          </div>
          <div className="border-t border-emerald-500/15 p-3">
            {brainOpen && (
              <div className="mb-2 rounded-xl border border-emerald-400/25 bg-[#04120c] p-3">
                <div className="text-[11px] font-bold text-emerald-100">Your Council assistant brain</div>
                <p className="mt-1 text-[11px] leading-relaxed text-emerald-100/70">A sandwich: a <b className="text-emerald-200">left brain</b> (reasoning, tools, multi-agent compliance) and a <b className="text-emerald-200">right brain</b> (perception, vision/VLM). Route any model underneath — MoE, mixture-of-models, a world model, a VLM — and the Council assistant wraps it in the Council's designed multi-provider oversight + Layer 0 so whatever you plug in stays compliant and signed.</p>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {[["offline", "Offline"], ["hosted", "Hosted"], ["paygo", "PAYG"]].map(([id, label]) => (
                    <button key={id} onClick={() => setBrain(id)} className={"rounded-lg px-2 py-1.5 text-[11px] font-bold " + (brainMode === id ? "bg-emerald-500 text-[#03110b]" : "border border-emerald-400/30 text-emerald-100 hover:bg-white/5")}>{label}</button>
                  ))}
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" multiple accept="image/*,application/pdf,.txt,.csv,.json,.docx" className="hidden" onChange={onFiles} />
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-white/[0.04] px-2 py-1.5">
              <button onClick={() => fileRef.current && fileRef.current.click()} aria-label="Upload files or photos" title="Upload files / photos — governed under Layer 0" className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-lg font-bold text-emerald-200 hover:bg-emerald-500/25">+</button>
              <button onClick={() => setBrainOpen((b) => !b)} aria-label="Council engine setup" title="Brain setup — offline / hosted / PAYG" className={"flex h-8 w-8 items-center justify-center rounded-lg text-sm " + (brainOpen ? "bg-emerald-500/30 text-emerald-100" : "bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25")}>{"◉"}</button>
              <button onClick={voice} aria-label="Speak to your Council assistant" className={"flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold " + (listening ? "bg-rose-500/30 text-rose-200 animate-pulse" : "bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25")}>MIC</button>
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") act(input); }} placeholder="Ask me anything..." className="flex-1 bg-transparent text-sm text-emerald-50 placeholder-emerald-300/40 focus:outline-none" />
              <button onClick={() => act(input)} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-[#03110b] hover:bg-emerald-400">Send</button>
            </div>
            <div className={"mt-2 text-center font-mono text-[9px] uppercase tracking-[2px] " + (personaId === "assurance" ? "text-amber-300/50" : "text-emerald-300/40")}>{personaId === "assurance" ? "Assurance, never weapons \u00B7 provenance is not truth \u00B7 Layer 0 signed" : "You command \u00B7 the Council assistant acts \u00B7 Layer 0 signed"}</div>
          </div>
        </div>
      )}
    </>
  );
}
