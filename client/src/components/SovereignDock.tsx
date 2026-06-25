import { useEffect, useRef, useState } from "react";

// SovereignDock — the persistent right-hand AI OS sidebar. The Sovereign rides
// with you across the whole CSOAI world: speak or type a command and it acts —
// routing you to the right surface now, and (with the gateway live) doing the
// work for you. The agent-first OS layer over every page. As SaaS gives way to
// agents, this is the emergence: you command, the Sovereign acts.

type Msg = { role: "you" | "sov"; text: string };

const ROUTES: { re: RegExp; href: string; label: string }[] = [
  { re: /regulation|legislation|\blaw\b|jurisdiction|comply|compliance/i, href: "/global-regulations", label: "Regulations & legislation" },
  { re: /framework|crosswalk|\biso\b|\bnist\b|tc260|eu ai act/i, href: "/crosswalks", label: "Framework crosswalks" },
  { re: /sovereign town|\btown\b|incident/i, href: "/sovereign-town", label: "Sovereign Town" },
  { re: /distribution|\bmcp\b|pypi|npm|glama|mcpize|registry/i, href: "/distribution", label: "Distribution & Layer 0 coverage" },
  { re: /evidence|connect|integrat|webhook/i, href: "/evidence", label: "Evidence Hub" },
  { re: /certif|attest/i, href: "/certification", label: "Certification" },
  { re: /policy/i, href: "/policy-generator", label: "Policy Generator" },
  { re: /risk|heatmap/i, href: "/risk-heatmap", label: "Risk Heatmap" },
  { re: /oscal|fedramp/i, href: "/oscal", label: "OSCAL Studio" },
  { re: /model|bias|fairness/i, href: "/models", label: "Model Registry" },
  { re: /globe|earth|world map/i, href: "/globe.html", label: "the living globe" },
  { re: /layer ?0|protocol|trust control/i, href: "/layer0", label: "Layer 0" },
  { re: /command|dashboard|overview/i, href: "/command-center", label: "Command Center" },
  { re: /\bos\b|home|launch|grid|everything/i, href: "/os", label: "the OS launcher" },
];

const KNOWLEDGE: { re: RegExp; a: string }[] = [
  { re: /what.?s? layer ?0|explain layer ?0/i, a: "Layer 0 is the trust floor for AI: eight controls — identity (did:csoai), runtime policy / PDCA, agentic-finance pre-checks, a legacy bridge and cross-region handoff — plus Ed25519 attestation and A2A. Every governed agent stands on it." },
  { re: /eu ai act/i, a: "The EU AI Act is the EU's risk-tiered AI law; Article 50 transparency duties bite first. I can map your systems to it — open Crosswalks or the Regulation Atlas and I'll show what applies." },
  { re: /\bnist\b/i, a: "NIST AI RMF is the US voluntary framework: Govern, Map, Measure, Manage. I crosswalk it to the EU AI Act and ISO 42001 so you comply once and satisfy many." },
  { re: /iso ?42001/i, a: "ISO/IEC 42001 is the certifiable AI management system standard. It pairs with our Evidence Hub and the Certification path." },
  { re: /crosswalk/i, a: "Crosswalks map one control set across the EU AI Act, NIST AI RMF, ISO 42001 and TC260 — do the work once, prove it everywhere. Want me to open them?" },
  { re: /how .*(comply|start)|where .*start/i, a: "Start with a free Readiness Check; then I pre-load the regulations for your region, generate a board-ready policy, collect evidence, and take you to certification. Say 'readiness' and I'll begin." },
  { re: /who are you|what are you/i, a: "I am your Sovereign — the agent-first interface to the CSOAI OS. Speak or type and I act: open any tool, explain any framework, and with the gateway live, do the governance work for you." },
  { re: /pulse|what.?s? new|latest|recent/i, a: "The Governance Pulse is the live feed of every regulation move worldwide, synced daily. Say 'pulse' and I'll open it." },
  { re: /hive|queen|sov3/i, a: "Every tool is its own hive with a sovereign queen — sov3 — that learns from your usage and ensembles with the others, all governed by Layer 0. See the Hive Grid." },
];

const QUICK: { label: string; href: string }[] = [
  { label: "Take the tour", href: "/tour" },
  { label: "Industries & Regulations", href: "/global-regulations" },
  { label: "Crosswalks", href: "/crosswalks" },
  { label: "Sovereign Town", href: "/sovereign-town" },
  { label: "Distribution", href: "/distribution" },
  { label: "Evidence", href: "/evidence" },
  { label: "Full OS", href: "/os" },
];

export default function SovereignDock() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "sov", text: "I am your Sovereign. Tell me what to do \u2014 say it or type it, and I take you there. Soon I will do the work for you." }]);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  useEffect(() => {
    if (!voiceOn || msgs.length <= 1) return;
    var last = msgs[msgs.length - 1];
    if (last && last.role === "sov") {
      try { var u = new SpeechSynthesisUtterance(last.text); u.rate = 1.03; u.pitch = 1; var vs = window.speechSynthesis.getVoices(); var pick = vs.find((vo) => /Google US English|Samantha|Daniel|Microsoft Aria|en-US/i.test(vo.name + " " + vo.lang)); if (pick) u.voice = pick; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) {}
    }
  }, [msgs, voiceOn]);

  function act(text: string) {
    const t = (text || "").trim();
    if (!t) return;
    setMsgs((m) => m.concat({ role: "you", text: t }));
    setInput("");
    const hit = ROUTES.find((r) => r.re.test(t));
    const know = KNOWLEDGE.find((k) => k.re.test(t));
    if (know && !hit) { setMsgs((m) => m.concat({ role: "sov", text: know.a })); return; }
    if (hit) {
      setMsgs((m) => m.concat({ role: "sov", text: "Opening " + hit.label + " \u2014 taking you there now." }));
      setTimeout(() => { window.location.assign(hit.href); }, 650);
    } else {
      setMsgs((m) => m.concat({ role: "sov", text: "Noted. I will handle that across your governance \u2014 full autonomous execution comes online when the Layer 0 gateway is deployed. Try: regulations, crosswalks, town, distribution, evidence, certify." }));
    }
  }

  function voice() {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { setMsgs((m) => m.concat({ role: "sov", text: "Voice needs a Chromium browser \u2014 type your command and I will act." })); return; }
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
            <button onClick={() => { setVoiceOn((x) => !x); try { window.speechSynthesis.cancel(); } catch (e) {} }} aria-label="Toggle voice" className="rounded-lg px-2 py-1 text-emerald-300/70 hover:bg-white/5">{voiceOn ? "🔊" : "🔇"}</button>
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg px-2 py-1 text-emerald-300/70 hover:bg-white/5">{"\u2715"}</button>
          </div>

          <div className="flex flex-wrap gap-1.5 border-b border-emerald-500/10 px-3 py-2">
            {QUICK.map((q) => (
              <a key={q.label} href={q.href} className="rounded-full border border-emerald-400/25 bg-emerald-500/5 px-2.5 py-1 text-[11px] text-emerald-200/80 hover:bg-emerald-500/15">{q.label}</a>
            ))}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "you" ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-500/20 px-3 py-2 text-sm" : "mr-auto max-w-[90%] rounded-2xl rounded-bl-sm border border-emerald-400/20 bg-white/[0.03] px-3 py-2 text-sm text-emerald-50/90"}>{m.text}</div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="border-t border-emerald-500/15 p-3">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-white/[0.04] px-2 py-1.5">
              <button onClick={voice} aria-label="Speak to your Sovereign" className={"flex h-8 w-8 items-center justify-center rounded-lg text-base " + (listening ? "bg-rose-500/30 text-rose-200 animate-pulse" : "bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25")}>{"\uD83C\uDF99"}</button>
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") act(input); }} placeholder="Sovereign, do this..." className="flex-1 bg-transparent text-sm text-emerald-50 placeholder-emerald-300/40 focus:outline-none" />
              <button onClick={() => act(input)} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-[#03110b] hover:bg-emerald-400">Send</button>
            </div>
            <div className="mt-2 text-center font-mono text-[9px] uppercase tracking-[2px] text-emerald-300/40">You command {"\u00B7"} the Sovereign acts {"\u00B7"} Layer 0 signed</div>
          </div>
        </div>
      )}
    </>
  );
}
