import { useEffect, useRef, useState } from "react";

// SovereignDock - the persistent right-hand AI OS sidebar. Speak or type and it
// acts: routes you to the right surface, answers from the framework knowledge
// base, and now answers any question with live world data via os.meok.ai.

type Msg = { role: "you" | "sov"; text: string };

const ROUTES: { re: RegExp; href: string; label: string }[] = [
  { re: /regulation|legislation|\blaw\b|jurisdiction|comply|compliance/i, href: "/graph", label: "the Governance Graph" },
  { re: /framework|crosswalk|\biso\b|\bnist\b|tc260|eu ai act/i, href: "/crosswalks", label: "Framework crosswalks" },
  { re: /sov ?space|simulate|experiment|govern/i, href: "/sov-space", label: "Sov Space" },
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
  { re: /globe|earth|world map|3d/i, href: "/world-3d", label: "the living globe" },
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

export default function SovereignDock() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "sov", text: "I am your Sovereign. Ask me anything, or tell me what to do - I answer with live world data and take you where you need to go." }]);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

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
              <div className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/50">CSOAI OS {"\u00B7"} agent-first</div>
            </div>
            <button onClick={() => { setVoiceOn((x) => !x); try { window.speechSynthesis.cancel(); } catch (e) {} }} aria-label="Toggle voice" className="rounded-lg px-2 py-1 text-emerald-300/70 hover:bg-white/5">{voiceOn ? "On" : "Off"}</button>
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg px-2 py-1 text-emerald-300/70 hover:bg-white/5">{"\u2715"}</button>
          </div>
          <div className="flex flex-wrap gap-1.5 border-b border-emerald-500/10 px-3 py-2">
            {QUICK.map((q) => (<a key={q.label} href={q.href} className="rounded-full border border-emerald-400/25 bg-emerald-500/5 px-2.5 py-1 text-[11px] text-emerald-200/80 hover:bg-emerald-500/15">{q.label}</a>))}
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) => (<div key={i} className={m.role === "you" ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-500/20 px-3 py-2 text-sm" : "mr-auto max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-emerald-400/20 bg-white/[0.03] px-3 py-2 text-sm text-emerald-50/90"}>{m.text}</div>))}
            <div ref={endRef} />
          </div>
          <div className="border-t border-emerald-500/15 p-3">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-white/[0.04] px-2 py-1.5">
              <button onClick={voice} aria-label="Speak to your Sovereign" className={"flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold " + (listening ? "bg-rose-500/30 text-rose-200 animate-pulse" : "bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25")}>MIC</button>
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
