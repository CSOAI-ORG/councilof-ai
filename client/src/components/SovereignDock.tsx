import { useEffect, useRef, useState } from "react";
import { chargeSovereign } from "../lib/sovCharge";
import { fetchHealth } from "../lib/sovHealth";
import { startTour } from "../lib/demoTour";

// SovereignDock - the persistent right-hand AI OS sidebar. Speak or type and it
// acts: routes you to the right surface, answers from the framework knowledge
// base, and now answers any question with live world data via os.meok.ai.

type Msg = { role: "you" | "sov"; text: string };

const ROUTES: { re: RegExp; href: string; label: string }[] = [
  { re: /governance graph|knowledge graph|\bgraph\b/i, href: "/graph", label: "the Governance Graph" },
  { re: /regulation|legislation|\blaw\b|jurisdiction|comply|compliance/i, href: "/graph", label: "the Governance Graph" },
  { re: /framework|crosswalk|\biso\b|\bnist\b|tc260|eu ai act/i, href: "/crosswalks", label: "Framework crosswalks" },
  { re: /sov ?space|simulate|simulation|experiment|run a (sim|scenario)/i, href: "/sov-space", label: "Sov Space" },
  { re: /sovereign town|\btown\b|incident/i, href: "/sovereign-town", label: "Sovereign Town" },
  { re: /distribution|\bmcp\b|pypi|npm|glama|mcpize|registry/i, href: "/distribution", label: "Distribution & Layer 0 coverage" },
  { re: /evidence|connect|integrat|webhook/i, href: "/evidence", label: "Evidence Hub" },
  { re: /certif|attest|train/i, href: "/certification", label: "Certification" },
  { re: /policy/i, href: "/policy-generator", label: "Policy Generator" },
  { re: /risk|heatmap/i, href: "/risk-heatmap", label: "Risk Heatmap" },
  { re: /oscal|fedramp/i, href: "/oscal", label: "OSCAL Studio" },
  { re: /model|bias|fairness/i, href: "/models", label: "Model Registry" },
  { re: /price|pricing|plan|cost/i, href: "/plans", label: "Plans and pricing" },
  { re: /media|image|photo|creative commons/i, href: "/commons", label: "Open Commons media" },
  { re: /status|health|uptime/i, href: "/status", label: "System Status" },
  { re: /watchdog|heat.?map|incident|signal|report a/i, href: "/watchdog-map", label: "the Global AI Watchdog" },
  { re: /humanoid|\bpoc\b|proof of concept|one os|rogue|swarm|bad actor/i, href: "/poc", label: "the ONE OS proof of concept" },
  { re: /globe|earth|world map|3d/i, href: "/world-3d", label: "the living globe" },
  { re: /sovereign network|ecosystem|signed agents|agent card|our (agents|domains|companies)/i, href: "/network", label: "the Sovereign network" },
  { re: /layer ?0|protocol|trust control/i, href: "/layer0", label: "Layer 0" },
  { re: /command|dashboard|overview/i, href: "/command-center", label: "Command Center" },
  { re: /\bos\b|launch|grid|everything/i, href: "/os", label: "the OS launcher" },
];

const KNOWLEDGE: { re: RegExp; a: string }[] = [
  { re: /what.?s? layer ?0|explain layer ?0/i, a: "Layer 0 is the trust floor for AI: identity (did:csoai), runtime policy, agentic-finance pre-checks, a legacy bridge and cross-region handoff, plus Ed25519 attestation and A2A. Every governed agent stands on it." },
  { re: /who are you|what are you/i, a: "I am your Sovereign - the agent-first interface to the CSOAI OS. Speak or type and I act: open any tool, explain any framework, answer with live world data, and route you to a signed council verdict." },
];

const QUICK: { label: string; href: string }[] = [
  { label: "Governance Graph", href: "/graph" },
  { label: "Sov Space", href: "/sov-space" },
  { label: "Open Commons", href: "/commons" },
  { label: "Plans", href: "/plans" },
  { label: "Status", href: "/status" },
  { label: "Full OS", href: "/os" },
];

const GW = "https://os.meok.ai/api";
const INDUSTRIES = ["healthcare","health","hospital","clinical","finance","fintech","banking","insurance","education","edtech","retail","ecommerce","legal","law firm","government","public sector","defense","energy","utilities","automotive","telecom","pharma","biotech","manufacturing","logistics","supply chain","hr","recruiting","hiring","media","gaming","agriculture","transport","aviation","real estate","crypto","web3","marketing","advertising"];

async function askChat(msg: string): Promise<string | null> {
  try {
    const r = await fetch(GW + "/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: msg }) });
    if (r.ok) { const d = await r.json(); if (d && d.response && d.model !== "idle") return String(d.response); }
  } catch (e) {}
  return null;
}

async function askGovern(q: string): Promise<any | null> {
  try {
    const r = await fetch(GW + "/govern?q=" + encodeURIComponent(q));
    if (r.ok) { const d = await r.json(); if (d && d.matched && d.frameworks && d.frameworks.length) return d; }
  } catch (e) {}
  return null;
}

// SOV3 shared brain: /orchestrate returns {say, actions}. The Sovereign SEES the
// page (getScreenContext), THINKS via os.meok.ai, then ACTS - opening OS surfaces.
const APP_ROUTES: Record<string, string> = {
  revenue: "/pricing", pricing: "/pricing", plans: "/pricing", billing: "/pricing",
  king: "/try", council: "/try", try: "/try", vote: "/try", bft: "/try",
  setup: "/start", onboard: "/start", start: "/start", welcome: "/start",
  graph: "/graph", knowledge: "/graph", search: "/graph",
  space: "/sov-space", sim: "/sov-space", simulation: "/sov-space", experiment: "/sov-space", sovspace: "/sov-space",
  tools: "/tool-commons", mcp: "/tool-commons", commons: "/commons", media: "/commons",
  status: "/status", system: "/status", os: "/os", home: "/os", grid: "/os",
  emergence: "/emergence", egg: "/emergence",
  certification: "/certification", cert: "/certification", academy: "/academy",
  evidence: "/evidence", oscal: "/oscal", models: "/models", policy: "/policy-generator",
  layer0: "/layer0", distribution: "/distribution", command: "/command-center",
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
  if (a.command === "govern") return "/graph";
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
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "sov", text: "I am your Sovereign. Ask me anything, or tell me what to do - I answer with live world data and take you where you need to go." }]);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [hz, setHz] = useState<any>(null);
  const [brainOpen, setBrainOpen] = useState(false);
  const [brainMode, setBrainMode] = useState<string>(() => { try { return localStorage.getItem("sov_brain_mode") || "hosted"; } catch (e) { return "hosted"; } });
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function onFiles(e: any) {
    const fs = Array.from((e.target.files || []) as FileList); if (!fs.length) return;
    setMsgs((m) => m.concat({ role: "you", text: "📎 " + fs.map((f) => f.name).join(", ") }));
    setMsgs((m) => m.concat({ role: "sov", text: "Received " + fs.length + " file" + (fs.length > 1 ? "s" : "") + ". I'll review under Layer 0 — perception runs on my right brain (vision/VLM), reasoning on my left, and nothing leaves your governance boundary without a signed decision." }));
    chargeSovereign(4); try { e.target.value = ""; } catch (er) {}
  }
  const BRAIN: Record<string, string> = {
    offline: "Offline brain — a local open-source model runs on your own hardware. Fully sovereign, no data leaves you. I wrap it in BFT + Layer 0 so it still stays compliant.",
    hosted: "Hosted brain — premium models, governed. I route your request to the best model (MoE, world model or VLM), the BFT council checks the answer, and every decision is signed.",
    paygo: "Pay-as-you-go — you only pay per governed call. Same BFT + Layer 0 floor; ideal for bursty or trial use.",
  };
  function setBrain(mode: string) { setBrainMode(mode); try { localStorage.setItem("sov_brain_mode", mode); } catch (e) {} setMsgs((m) => m.concat({ role: "sov", text: BRAIN[mode] })); }

  useEffect(() => { fetchHealth().then(setHz); }, []);

  useEffect(() => { const el = endRef.current && (endRef.current.parentElement as HTMLElement | null); if (el) el.scrollTop = el.scrollHeight; }, [msgs, open]);

  useEffect(() => {
    if (!voiceOn || msgs.length <= 1) return;
    var last = msgs[msgs.length - 1];
    if (last && last.role === "sov") {
      try { var u = new SpeechSynthesisUtterance(last.text); u.rate = 1.03; var vs = window.speechSynthesis.getVoices(); var pick = vs.find((vo) => /Google US English|Samantha|Microsoft Aria|en-US/i.test(vo.name + " " + vo.lang)); if (pick) u.voice = pick; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) {}
    }
  }, [msgs, voiceOn]);

  async function act(text: string) {
    const t = (text || "").trim();
    if (!t) return;
    setMsgs((m) => m.concat({ role: "you", text: t }));
    setInput("");
    chargeSovereign(4); // every question teaches your Sovereign
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
      setMsgs((m) => m.concat({ role: "sov", text: "Opening " + hit.label + " - taking you there now." }));
      setTimeout(() => { window.location.assign(hit.href); }, 650);
      return;
    }
    // SOV3: the Sovereign is page-aware. For a command or an "explain this page"
    // request, orchestrate over the live brain - it speaks and opens the right surface.
    const ctx = getScreenContext();
    const commandLike = navVerb || /\bexplain (this|the) page\b|\bwhat can i do here\b|\bwhere am i\b|\bhelp me (here|with this)\b|\bwhat is this page\b|\bwalk me through\b|\btake me\b|\bopen \b/i.test(t);
    if (commandLike) {
      setMsgs((m) => m.concat({ role: "sov", text: "On it…" }));
      const o = await orchestrate(t, ctx);
      if (o && (o.say || o.actions.length)) {
        const route = o.actions.map(routeForAction).find(Boolean) as string | undefined;
        setMsgs((m) => m.concat({ role: "sov", text: o.say || (route ? "Opening that for you." : "Done.") }));
        if (route) setTimeout(() => { if (/^https?:\/\//.test(route)) window.open(route, "_blank"); else window.location.assign(route); }, 950);
        return;
      }
    }
    setMsgs((m) => m.concat({ role: "sov", text: "Reasoning over live governance data…" }));
    // Reason via the live Sovereign gateway; in parallel map the industry to its framework stack.
    const ind = INDUSTRIES.find((w) => new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(t));
    const [answer, gov] = await Promise.all([askChat(t), ind ? askGovern(ind) : Promise.resolve(null)]);
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
        <button onClick={() => setOpen(true)} aria-label="Open your Sovereign" className="fixed right-4 bottom-4 z-[9998] flex items-center gap-2 rounded-full border border-emerald-400/40 bg-[#04110b]/90 px-4 py-3 text-emerald-200 shadow-[0_8px_30px_-6px_rgba(16,185,129,.5)] backdrop-blur hover:bg-[#062016]">
          <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" /><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" /></span>
          <span className="text-sm font-bold">Sovereign</span>
        </button>
      )}
      {open && (
        <div className="fixed right-0 top-0 z-[9999] flex h-screen w-[340px] max-w-[88vw] flex-col border-l border-emerald-500/20 bg-[#05080e]/95 text-[#e7f6ef] backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 border-b border-emerald-500/15 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/15 text-lg">{"\u25C9"}</div>
            <div className="flex-1">
              <div className="text-sm font-bold text-emerald-100">Your Sovereign</div>
              <div className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/50">{hz && hz.ok && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle" style={{ boxShadow: "0 0 6px #34d399" }} />}{hz && hz.ok ? "Sovereign - connected" : "CSOAI OS - agent-first"}</div>
            </div>
            <button onClick={() => { setVoiceOn((x) => !x); try { window.speechSynthesis.cancel(); } catch (e) {} }} aria-label="Toggle voice" className="rounded-lg px-2 py-1 text-emerald-300/70 hover:bg-white/5">{voiceOn ? "On" : "Off"}</button>
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg px-2 py-1 text-emerald-300/70 hover:bg-white/5">{"\u2715"}</button>
          </div>
          <div className="flex flex-wrap gap-1.5 border-b border-emerald-500/10 px-3 py-2">
            <button onClick={() => { startTour(); window.location.assign("/"); }} className="rounded-full border border-emerald-400/50 bg-emerald-500/25 px-2.5 py-1 text-[11px] font-bold text-emerald-100 hover:bg-emerald-500/35">▶ Live tour</button>
            <button onClick={() => act("explain this page and what I can do here")} className="rounded-full border border-emerald-400/50 bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-100 hover:bg-emerald-500/30">Explain this page</button>
            {QUICK.map((q) => (<a key={q.label} href={q.href} className="rounded-full border border-emerald-400/25 bg-emerald-500/5 px-2.5 py-1 text-[11px] text-emerald-200/80 hover:bg-emerald-500/15">{q.label}</a>))}
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) => (<div key={i} className={m.role === "you" ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-500/20 px-3 py-2 text-sm" : "mr-auto max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-emerald-400/20 bg-white/[0.03] px-3 py-2 text-sm text-emerald-50/90"}>{m.text}</div>))}
            <div ref={endRef} />
          </div>
          <div className="border-t border-emerald-500/15 p-3">
            {brainOpen && (
              <div className="mb-2 rounded-xl border border-emerald-400/25 bg-[#04120c] p-3">
                <div className="text-[11px] font-bold text-emerald-100">Your Sovereign brain</div>
                <p className="mt-1 text-[11px] leading-relaxed text-emerald-100/70">A sandwich: a <b className="text-emerald-200">left brain</b> (reasoning, tools, BFT compliance) and a <b className="text-emerald-200">right brain</b> (perception, vision/VLM). Route any model underneath — MoE, mixture-of-models, a world model, a VLM — and the Sovereign wraps it in the 33-agent BFT council + Layer 0 so whatever you plug in stays compliant and signed.</p>
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
              <button onClick={() => setBrainOpen((b) => !b)} aria-label="Sovereign brain setup" title="Brain setup — offline / hosted / PAYG" className={"flex h-8 w-8 items-center justify-center rounded-lg text-sm " + (brainOpen ? "bg-emerald-500/30 text-emerald-100" : "bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25")}>{"◉"}</button>
              <button onClick={voice} aria-label="Speak to your Sovereign" className={"flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold " + (listening ? "bg-rose-500/30 text-rose-200 animate-pulse" : "bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25")}>MIC</button>
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") act(input); }} placeholder="Ask me anything..." className="flex-1 bg-transparent text-sm text-emerald-50 placeholder-emerald-300/40 focus:outline-none" />
              <button onClick={() => act(input)} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-[#03110b] hover:bg-emerald-400">Send</button>
            </div>
            <div className="mt-2 text-center font-mono text-[9px] uppercase tracking-[2px] text-emerald-300/40">You command {"\u00B7"} the Sovereign acts {"\u00B7"} Layer 0 signed</div>
          </div>
        </div>
      )}
    </>
  );
}
