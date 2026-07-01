import { useEffect, useRef, useState } from "react";

// DemoOS - the immersive AI-OS experience. A live Cesium globe (globe3d.html,
// driven by postMessage) is the backdrop; the Sovereign narrates step by step
// in the chat UI and by voice; SaaS windows open and close on the globe as it
// speaks; the user can interrupt by voice at any time, and the Sovereign waits,
// listens, answers, then resumes - a real nav-guide. Doubles as SOV33 training.

const GW = "https://os.meok.ai/api";

type Step = { say: string; win?: { title: string; src: string }; fly?: { lng: number; lat: number; height: number }; layer?: { tag: string; on: boolean }; home?: boolean; full?: boolean };

const STEPS: Step[] = [
  { say: "Welcome. This is your CSOAI AI Operating System - live, on the world. I'm your Sovereign, and I'll show you everything. Watch." },
  { say: "First, let me see where you are.", fly: { lng: 0, lat: 20, height: 20000000 } },
  { say: "Here's the Governance Graph. Name any company, place or AI system and I map the jurisdiction and every framework that applies.", win: { title: "Governance Graph", src: "/graph?demo=a%20hospital%20in%20Texas" }, fly: { lng: -99, lat: 31, height: 2600000 } },
  { say: "Now the Council. Describe an AI system and five agents deliberate, then seal a signed verdict.", win: { title: "The Council", src: "/try?demo=We%20use%20AI%20to%20screen%20job%20applicants" }, fly: { lng: 4.3, lat: 50.8, height: 2600000 } },
  { say: "This is our public Watchdog - humans, agents, humanoids and systems report incidents, and the world heat-maps by problem layer.", win: { title: "Global AI Watchdog", src: "/watchdog-map" }, layer: { tag: "nodes", on: true } },
  { say: "In Sov Space you run a real governance experiment - I simulate it and seal a verdict with a Layer 0 ledger hash.", win: { title: "Sov Space", src: "/sov-space?demo=A%20fintech%20in%20the%20EU%20deploying%20an%20AI%20credit-scoring%20model" }, fly: { lng: 103.8, lat: 1.35, height: 2600000 } },
  { say: "And this is Sov Town Space. Here the OS simulates real-world scenarios to actually help humanity - redirecting data, resources and decisions toward a future of abundance, not extraction. Each town learns, simulates, and compounds what it discovers.", win: { title: "Sov Town Space", src: "/towns" }, fly: { lng: 20, lat: 5, height: 9000000 } },
  { say: "None of this is extraction. It's all built on our Sovereignty Charter and our Partnership Charter - you own your data, you stay in control, and value flows to people, not away from them. That's the whole point.", win: { title: "The Sovereign Charter", src: "/charter" }, full: true },
  { say: "Every framework lives where it's made - the EU AI Act in Brussels, NIST near Washington, PIPL in Beijing. Comply once, and I crosswalk it everywhere.", full: true, fly: { lng: 116.4, lat: 39.9, height: 2600000 } },
  { say: "Now - the emergence dome. As you use the OS, your Sovereign learns you, and this living mirror of the world charges and hatches into your own AI character. Step inside the dome.", win: { title: "Emergence - the living dome", src: "/emergence" }, fly: { lng: 0, lat: 15, height: 16000000 } },
  { say: "And full transparency: the Sovereign brain and every Layer 0 protocol, checked live.", win: { title: "System Status", src: "/status" }, full: true, home: true },
  { say: "Own your AI. Own your data. Start free, scale when you need. That's your OS - and I'm always right here. Ask me anything, any time.", win: { title: "Plans", src: "/pricing" }, home: true },
];

export default function DemoOS() {
  const [mode, setMode] = useState<null | "demo" | "full">(null);
  const [i, setI] = useState(-1);
  const [chat, setChat] = useState<{ who: "sov" | "you"; t: string }[]>([]);
  const [win, setWin] = useState<Step["win"] | null>(null);
  const [listening, setListening] = useState(false);
  const [paused, setPaused] = useState(false);
  const [geoCity, setGeoCity] = useState("");
  const frame = useRef<HTMLIFrameElement | null>(null);
  const timer = useRef<any>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const steps = useRef<Step[]>([]);

  useEffect(() => { document.title = "The AI OS - live demo & tour | CSOAI"; return () => { try { window.speechSynthesis.cancel(); } catch (e) {} if (timer.current) clearTimeout(timer.current); }; }, []);
  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  function post(msg: any) { try { frame.current && frame.current.contentWindow && frame.current.contentWindow.postMessage(msg, "*"); } catch (e) {} }
  function speak(t: string) { try { const u = new SpeechSynthesisUtterance(t); u.rate = 1.04; const vs = window.speechSynthesis.getVoices(); const pick = vs.find((v) => /Google US English|Samantha|Microsoft Aria|en-US/i.test(v.name + " " + v.lang)); if (pick) u.voice = pick; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) {} }

  async function start(m: "demo" | "full") {
    setMode(m);
    steps.current = STEPS.filter((s) => (m === "full" ? true : !s.full));
    setChat([{ who: "sov", t: steps.current[0].say }]);
    // geo intro (best-effort, keyless)
    try {
      const r = await fetch("https://ipapi.co/json/");
      if (r.ok) { const d = await r.json(); if (d && d.latitude) { setGeoCity(d.city || d.country_name || ""); setTimeout(() => post({ cmd: "flyTo", lng: d.longitude, lat: d.latitude, height: 30000, duration: 3 }), 800); setTimeout(() => post({ cmd: "flyTo", lng: d.longitude, lat: d.latitude, height: 90000, duration: 2.5 }), 4200); setTimeout(() => post({ cmd: "home", duration: 2.5 }), 7200); } }
    } catch (e) {}
    setI(0); runStep(0, m);
  }

  function runStep(idx: number, m: "demo" | "full") {
    const arr = steps.current; if (idx >= arr.length) { finish(); return; }
    const s = arr[idx];
    setChat((c) => (idx === 0 ? c : c.concat({ who: "sov", t: s.say })));
    speak(s.say);
    if (s.fly) post({ cmd: "flyTo", ...s.fly, duration: 2.2 });
    if (s.layer) post({ cmd: "layer", ...s.layer });
    if (s.home) post({ cmd: "home", duration: 2.5 });
    if (s.win) { setChat((c) => c.concat({ who: "sov", t: "Opening " + s.win!.title + " for you." })); setWin(s.win); } else { setWin(null); }
    const dur = m === "demo" ? 12000 : 24000;
    timer.current = setTimeout(() => { if (s.win) setChat((c) => c.concat({ who: "sov", t: "Closing " + s.win!.title + "." })); const n = idx + 1; setI(n); runStep(n, m); }, dur);
  }

  function finish() { setWin(null); post({ cmd: "home", duration: 2.5 }); setChat((c) => c.concat({ who: "sov", t: "That's the tour. Jump in - Start free, or ask me anything." })); setMode(null); setI(-1); }
  function stop() { if (timer.current) clearTimeout(timer.current); try { window.speechSynthesis.cancel(); } catch (e) {} setMode(null); setI(-1); setWin(null); post({ cmd: "home", duration: 2 }); }

  function interrupt() {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { setChat((c) => c.concat({ who: "sov", t: "Voice needs a Chromium browser - type to me and I'll answer." })); return; }
    if (timer.current) clearTimeout(timer.current);
    try { window.speechSynthesis.cancel(); } catch (e) {}
    setPaused(true); setListening(true);
    setChat((c) => c.concat({ who: "sov", t: "I'm listening - go ahead." }));
    try {
      const rec = new SR(); rec.lang = "en-US"; rec.interimResults = false; rec.maxAlternatives = 1;
      rec.onresult = async (e: any) => { const said = e.results[0][0].transcript; setChat((c) => c.concat({ who: "you", t: said })); await answer(said); };
      rec.onend = () => setListening(false);
      rec.start();
    } catch (e) { setListening(false); }
  }

  async function answer(q: string) {
    setChat((c) => c.concat({ who: "sov", t: "…" }));
    try {
      const r = await fetch(GW + "/chat", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: q + " (Be concise - the user is on a live tour of the CSOAI AI OS.)" }) });
      if (r.ok) { const d = await r.json(); if (d && d.response) { setChat((c) => c.slice(0, -1).concat({ who: "sov", t: String(d.response) })); speak(String(d.response)); } }
    } catch (e) {}
  }
  function resume() { setPaused(false); const n = Math.max(0, i); setChat((c) => c.concat({ who: "sov", t: "Back to the tour." })); runStep(n, mode === "full" ? "full" : "demo"); }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#03080e] text-emerald-50">
      <iframe ref={frame} src="/globe3d.html" title="globe" className="absolute inset-0 h-full w-full border-0" />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(1200px 600px at 50% 120%, rgba(3,8,14,.7), transparent 60%)" }} />

      {/* Start overlay */}
      {mode === null && i === -1 && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#03080e]/70 backdrop-blur-sm px-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI - the AI operating system</p>
          <h1 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight">See the OS <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">run itself.</span></h1>
          <p className="mt-4 max-w-xl text-emerald-100/80">The Sovereign will fly the globe, open the tools, and explain it all - by voice and in chat. Interrupt any time and it listens.</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => start("demo")} className="rounded-xl bg-emerald-500 px-7 py-3.5 text-base font-bold text-[#03110b] hover:bg-emerald-400">▶ Quick demo (~2 min)</button>
            <button onClick={() => start("full")} className="rounded-xl border border-emerald-400/50 px-7 py-3.5 text-base font-semibold text-emerald-100 hover:bg-emerald-500/10">Full guided tour (~6 min)</button>
          </div>
          <a href="/os" className="mt-4 text-xs text-emerald-300/60 hover:text-emerald-200">Skip - take me straight into the OS →</a>
        </div>
      )}

      {/* SaaS window */}
      {win && (
        <div className="absolute right-6 top-6 z-20 w-[46%] max-w-[560px] overflow-hidden rounded-2xl border border-emerald-400/40 bg-[#05140d] shadow-[0_20px_70px_-20px_rgba(0,0,0,.8)]">
          <div className="flex items-center gap-2 border-b border-emerald-500/20 bg-[#04120c] px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            <span className="ml-2 text-xs font-bold text-emerald-100">{win.title}</span>
            <span className="ml-auto font-mono text-[9px] uppercase tracking-wide text-emerald-300/40">live in the OS</span>
          </div>
          <iframe src={win.src} title={win.title} className="h-[52vh] w-full border-0 bg-[#03110b]" />
        </div>
      )}

      {/* Chat UI */}
      {mode !== null && (
        <div className="absolute left-6 bottom-6 z-30 w-[92%] max-w-md rounded-2xl border border-emerald-400/30 bg-[#04120c]/95 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-2 border-b border-emerald-500/15 px-4 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/15 text-base">{"◉"}</div>
            <div className="text-sm font-bold text-emerald-100">Your Sovereign {geoCity && <span className="font-mono text-[10px] font-normal text-emerald-300/50">near {geoCity}</span>}</div>
            <button onClick={stop} className="ml-auto rounded-lg px-2 py-1 text-[11px] text-emerald-300/60 hover:bg-white/5">End</button>
          </div>
          <div className="max-h-[38vh] space-y-2 overflow-y-auto px-4 py-3">
            {chat.map((m, k) => (<div key={k} className={m.who === "you" ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-500/20 px-3 py-2 text-sm" : "mr-auto max-w-[92%] rounded-2xl rounded-bl-sm border border-emerald-400/20 bg-white/[0.03] px-3 py-2 text-sm text-emerald-50/90"}>{m.t}</div>))}
            <div ref={endRef} />
          </div>
          <div className="flex items-center gap-2 border-t border-emerald-500/15 p-3">
            {!paused ? (
              <button onClick={interrupt} className={"flex-1 rounded-xl px-3 py-2 text-sm font-bold " + (listening ? "bg-rose-500/30 text-rose-100 animate-pulse" : "bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25")}>{listening ? "Listening…" : "🎙 Interrupt & ask"}</button>
            ) : (
              <button onClick={resume} className="flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Resume tour ▶</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
