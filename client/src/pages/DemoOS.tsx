import { useEffect, useRef, useState } from "react";

// DemoOS - the immersive AI-OS experience. A live Cesium globe (globe3d.html,
// driven by postMessage) is the backdrop; the Sovereign narrates step by step
// (typed + voice); live SaaS windows glide open, tile like a real desktop, and
// close on the globe; the Sovereign is screen-aware and moves windows aside;
// the user can barge in by voice any time. Doubles as SOV33 training.

const GW = "https://os.meok.ai/api";

type Slot = "tr" | "tl" | "br" | "c";
type Win = { title: string; src: string; slot: Slot };
type Step = { say: string; wins?: Win[]; fly?: { lng: number; lat: number; height: number }; layer?: { tag: string; on: boolean }; home?: boolean; full?: boolean };

const STEPS: Step[] = [
  { say: "Welcome. This is your CSOAI AI Operating System - live, on the world. I'm your Sovereign, and I'll show you everything. Just watch, and interrupt me any time." },
  { say: "First, let me see where you are.", fly: { lng: 0, lat: 20, height: 20000000 } },
  { say: "Here's the Governance Graph. Name any company, place or AI system and I map the jurisdiction and every framework that applies.", wins: [{ title: "Governance Graph", src: "/graph?demo=a%20hospital%20in%20Texas", slot: "tr" }], fly: { lng: -99, lat: 31, height: 2600000 } },
  { say: "Now the Council. Describe an AI system and five agents deliberate, then seal a signed verdict.", wins: [{ title: "The Council", src: "/try?demo=We%20use%20AI%20to%20screen%20job%20applicants", slot: "tr" }], fly: { lng: 4.3, lat: 50.8, height: 2600000 } },
  { say: "This is our public Watchdog - humans, agents, humanoids and systems report incidents, and the world heat-maps by problem layer.", wins: [{ title: "Global AI Watchdog", src: "/watchdog-map", slot: "c" }], layer: { tag: "nodes", on: true } },
  { say: "In Sov Space you run a real governance experiment - I simulate it and seal a verdict with a Layer 0 ledger hash.", wins: [{ title: "Sov Space", src: "/sov-space?demo=A%20fintech%20in%20the%20EU%20deploying%20an%20AI%20credit-scoring%20model", slot: "tr" }], fly: { lng: 103.8, lat: 1.35, height: 2600000 } },
  { say: "And this is Sov Town Space. Here the OS simulates real-world scenarios to actually help humanity - redirecting data, resources and decisions toward a future of abundance, not extraction. Each town learns, simulates, and compounds.", wins: [{ title: "Sov Town Space", src: "/towns", slot: "tr" }], fly: { lng: 20, lat: 5, height: 9000000 } },
  { say: "None of this is extraction. It's built on our Sovereignty Charter and our Partnership Charter - you own your data, you stay in control, and value flows to people, not away from them.", wins: [{ title: "The Sovereign Charter", src: "/charter", slot: "tr" }], full: true },
  { say: "Here's the whole OS at a glance - the Graph, the Council and the Watchdog, all open together, tiled like a real desktop, all on one brain.", wins: [{ title: "Governance Graph", src: "/graph?demo=a%20fintech%20in%20Singapore", slot: "tl" }, { title: "The Council", src: "/try?demo=a%20facial%20recognition%20system%20in%20public", slot: "tr" }, { title: "Global Watchdog", src: "/watchdog-map", slot: "br" }], full: true },
  { say: "Every framework lives where it's made - the EU AI Act in Brussels, NIST near Washington, PIPL in Beijing. Comply once, and I crosswalk it everywhere.", full: true, fly: { lng: 116.4, lat: 39.9, height: 2600000 } },
  { say: "Now - the emergence dome. As you use the OS, your Sovereign learns you, and this living mirror of the world charges and hatches into your own AI character. Step inside.", wins: [{ title: "Emergence - the living dome", src: "/emergence", slot: "c" }], fly: { lng: 0, lat: 15, height: 16000000 } },
  { say: "Full transparency: the Sovereign brain and every Layer 0 protocol, checked live.", wins: [{ title: "System Status", src: "/status", slot: "tr" }], full: true, home: true },
  { say: "Own your AI. Own your data. Start free, scale when you need. That's your OS - and I'm always right here. Ask me anything, any time.", wins: [{ title: "Plans", src: "/pricing", slot: "tr" }], home: true },
];

function slotStyle(slot: Slot, solo: boolean): any {
  if (solo && slot === "tr") return { right: 24, top: 72, width: "46%", maxWidth: 560, height: "54vh" };
  if (slot === "tr") return { right: 20, top: 72, width: "38%", maxWidth: 460, height: "40vh" };
  if (slot === "tl") return { left: 20, top: 72, width: "38%", maxWidth: 460, height: "40vh" };
  if (slot === "br") return { right: 20, bottom: 20, width: "38%", maxWidth: 460, height: "40vh" };
  return { left: "29%", top: "16%", width: "42%", maxWidth: 540, height: "56vh" }; // c
}
function intersect(a: DOMRect, b: DOMRect) { return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom); }

export default function DemoOS() {
  const [mode, setMode] = useState<null | "demo" | "full">(null);
  const [i, setI] = useState(-1);
  const [chat, setChat] = useState<{ id: number; who: "sov" | "you"; t: string }[]>([]);
  const [wins, setWins] = useState<Win[]>([]);
  const [winsShow, setWinsShow] = useState(false);
  const [listening, setListening] = useState(false);
  const [paused, setPaused] = useState(false);
  const [handsFree, setHandsFree] = useState(true);
  const [geoCity, setGeoCity] = useState("");
  const [geoLabel, setGeoLabel] = useState("");
  const [title, setTitle] = useState("");

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

  useEffect(() => { document.title = "The AI OS - live demo & tour | CSOAI"; return () => cleanup(); }, []);
  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  function cleanup() { try { window.speechSynthesis.cancel(); } catch (e) {} if (timer.current) clearTimeout(timer.current); if (typeT.current) clearInterval(typeT.current); try { rec.current && rec.current.stop(); } catch (e) {} }
  function post(msg: any) { try { frame.current && frame.current.contentWindow && frame.current.contentWindow.postMessage(msg, "*"); } catch (e) {} }
  function say(who: "sov" | "you", t: string) { const id = ++idc.current; setChat((c) => c.concat({ id, who, t })); return id; }
  function narrate(text: string) {
    const id = ++idc.current; setChat((c) => c.concat({ id, who: "sov", t: "" }));
    const words = text.split(" "); let k = 0;
    if (typeT.current) clearInterval(typeT.current);
    typeT.current = setInterval(() => { k++; const done = k >= words.length; const part = words.slice(0, k).join(" ") + (done ? "" : " ▍"); setChat((c) => c.map((m) => (m.id === id ? { ...m, t: part } : m))); if (done && typeT.current) clearInterval(typeT.current); }, 85);
    speak(text);
  }
  function speak(t: string) { try { const u = new SpeechSynthesisUtterance(t); u.rate = 1.04; const vs = window.speechSynthesis.getVoices(); const pick = vs.find((v) => /Google US English|Samantha|Microsoft Aria|en-US/i.test(v.name + " " + v.lang)); if (pick) u.voice = pick; u.onstart = () => { speaking.current = true; }; u.onend = () => { speaking.current = false; }; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) {} }

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
    try {
      const rr = await fetch("https://ipapi.co/json/");
      if (rr.ok) { const d = await rr.json(); if (d && d.latitude) {
        setGeoCity(d.city || d.country_name || ""); setGeoLabel("Locating you…");
        setTimeout(() => { setGeoLabel("Scanning ~10 miles around you"); post({ cmd: "flyTo", lng: d.longitude, lat: d.latitude, height: 30000, duration: 3 }); }, 700);
        setTimeout(() => { setGeoLabel("Widening to ~30 miles"); post({ cmd: "flyTo", lng: d.longitude, lat: d.latitude, height: 90000, duration: 2.6 }); }, 4200);
        setTimeout(() => { setGeoLabel("Ready for work"); post({ cmd: "home", duration: 2.6 }); }, 7400);
        setTimeout(() => setGeoLabel(""), 10000);
      } }
    } catch (e) {}
    runStep(0);
  }

  function openWins(list: Win[]) {
    setWinsShow(false); setWins(list);
    requestAnimationFrame(() => requestAnimationFrame(() => setWinsShow(true)));
    setTimeout(() => {
      try { if (win0Ref.current && chatRef.current && intersect(win0Ref.current.getBoundingClientRect(), chatRef.current.getBoundingClientRect())) { say("sov", "That's covering our chat - let me move it aside for you."); speak("Let me move that aside for you."); setWins((w) => w.map((x, idx) => (idx === 0 ? { ...x, slot: "tr" } : x))); } } catch (e) {}
    }, 900);
  }
  function closeWins() { setWinsShow(false); setTimeout(() => setWins([]), 320); }

  function runStep(idx: number) {
    const arr = stepsRef.current; if (idx >= arr.length) { finish(); return; }
    const s = arr[idx];
    setTitle(s.wins && s.wins.length ? (s.wins.length > 1 ? s.wins.length + " apps open" : s.wins[0].title) : s.say.split(" - ")[0].slice(0, 42));
    narrate(s.say);
    if (s.fly) post({ cmd: "flyTo", ...s.fly, duration: 2.2 });
    if (s.layer) post({ cmd: "layer", ...s.layer });
    if (s.home) post({ cmd: "home", duration: 2.5 });
    if (s.wins && s.wins.length) { say("sov", s.wins.length > 1 ? "Arranging " + s.wins.length + " windows for you." : "Opening " + s.wins[0].title + "."); openWins(s.wins); } else closeWins();
    const dur = modeRef.current === "demo" ? 12500 : 23000;
    timer.current = setTimeout(() => advance(idx), dur);
  }
  function advance(idx: number) { const n = idx + 1; setI(n); runStep(n); }
  function next() { if (timer.current) clearTimeout(timer.current); try { window.speechSynthesis.cancel(); } catch (e) {} advance(i); }

  function finish() { closeWins(); post({ cmd: "home", duration: 2.5 }); say("sov", "That's the tour. Jump in - Start free, or ask me anything."); stopRec(); setMode(null); setI(-1); setTitle(""); }
  function stop() { cleanup(); setMode(null); setI(-1); setWins([]); setWinsShow(false); setTitle(""); setGeoLabel(""); post({ cmd: "home", duration: 2 }); }

  function onBargeIn(said: string) { if (timer.current) clearTimeout(timer.current); try { window.speechSynthesis.cancel(); } catch (e) {} setPaused(true); say("you", said); answer(said); }
  function interrupt() {
    if (timer.current) clearTimeout(timer.current); try { window.speechSynthesis.cancel(); } catch (e) {} setPaused(true); setListening(true); say("sov", "I'm listening - go ahead.");
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition; if (!SR) { say("sov", "Voice needs a Chromium browser - type to me instead."); setListening(false); return; }
    try { const r = new SR(); r.lang = "en-US"; r.interimResults = false; r.maxAlternatives = 1; r.onresult = (e: any) => { const said = e.results[0][0].transcript; say("you", said); answer(said); }; r.onend = () => setListening(false); r.start(); } catch (e) { setListening(false); }
  }
  async function answer(q: string) {
    setListening(false); say("sov", "…");
    try { const r = await fetch(GW + "/chat", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: q + " (Be concise - the user is on a live tour of the CSOAI AI OS.)" }) }); if (r.ok) { const d = await r.json(); if (d && d.response) { setChat((c) => c.slice(0, -1).concat({ id: ++idc.current, who: "sov", t: String(d.response) })); speak(String(d.response)); } } } catch (e) {}
  }
  function resume() { setPaused(false); say("sov", "Back to the tour."); runStep(Math.max(0, i)); }

  const solo = wins.length === 1;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#03080e] text-emerald-50">
      <iframe ref={frame} src="/globe3d.html" title="globe" className="absolute inset-0 h-full w-full border-0" />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(1200px 640px at 50% 120%, rgba(3,8,14,.72), transparent 60%)" }} />

      {mode === null && i === -1 && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#03080e]/70 backdrop-blur-sm px-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI - the AI operating system</p>
          <h1 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight">See the OS <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">run itself.</span></h1>
          <p className="mt-4 max-w-xl text-emerald-100/80">The Sovereign flies the globe, opens the tools, and explains it all - by voice and in chat. Speak any time and it listens.</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => start("demo")} className="rounded-xl bg-emerald-500 px-7 py-3.5 text-base font-bold text-[#03110b] hover:bg-emerald-400">▶ Quick demo (~2 min)</button>
            <button onClick={() => start("full")} className="rounded-xl border border-emerald-400/50 px-7 py-3.5 text-base font-semibold text-emerald-100 hover:bg-emerald-500/10">Full guided tour (~6 min)</button>
          </div>
          <a href="/os" className="mt-4 text-xs text-emerald-300/60 hover:text-emerald-200">Skip - take me straight into the OS →</a>
        </div>
      )}

      {mode !== null && (
        <div className="absolute left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border border-emerald-500/25 bg-[#04120c]/90 px-4 py-2 backdrop-blur-xl">
          <span className="h-2 w-2 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px #34d399" }} />
          <span className="text-xs font-bold text-emerald-100">{title || "CSOAI Sovereign OS"}</span>
          <span className="hidden sm:flex items-center gap-1">{stepsRef.current.map((_, k) => (<span key={k} className={"h-1.5 rounded-full transition-all " + (k === i ? "w-4 bg-emerald-400" : k < i ? "w-1.5 bg-emerald-500/60" : "w-1.5 bg-white/15")} />))}</span>
          {!paused && <button onClick={next} className="rounded-full px-2 py-0.5 text-[11px] font-bold text-emerald-200/80 hover:bg-white/5">Next ▸</button>}
        </div>
      )}

      {geoLabel && (<div className="absolute left-1/2 top-20 z-30 -translate-x-1/2 rounded-full border border-emerald-400/30 bg-black/50 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[2px] text-emerald-200/90 backdrop-blur">◎ {geoLabel}</div>)}

      {wins.map((w, idx) => (
        <div key={idx} ref={idx === 0 ? win0Ref : undefined} className={"absolute z-20 overflow-hidden rounded-2xl border border-emerald-400/40 bg-[#05140d] shadow-[0_24px_80px_-24px_rgba(0,0,0,.85)] transition-all duration-500 ease-out " + (winsShow ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none")} style={slotStyle(w.slot, solo)}>
          <div className="flex items-center gap-2 border-b border-emerald-500/20 bg-[#04120c] px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            <span className="ml-2 text-xs font-bold text-emerald-100">{w.title}</span>
            <span className="ml-auto font-mono text-[9px] uppercase tracking-wide text-emerald-300/40">live in the OS</span>
          </div>
          <iframe src={w.src} title={w.title} className="w-full border-0 bg-[#03110b]" style={{ height: "calc(100% - 33px)" }} />
        </div>
      ))}

      {mode !== null && (
        <div ref={chatRef} className="absolute left-6 bottom-6 z-30 w-[92%] max-w-md rounded-2xl border border-emerald-400/30 bg-[#04120c]/95 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-2 border-b border-emerald-500/15 px-4 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/15 text-base">{"◉"}</div>
            <div className="text-sm font-bold text-emerald-100">Your Sovereign {geoCity && <span className="font-mono text-[10px] font-normal text-emerald-300/50">near {geoCity}</span>}</div>
            <button onClick={() => setHandsFree((h) => { const n = !h; if (n) startRec(); else stopRec(); return n; })} className={"ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold " + (handsFree ? "bg-emerald-500/20 text-emerald-200" : "text-emerald-300/50 hover:bg-white/5")}>{handsFree ? "hands-free ⏺" : "hands-free off"}</button>
            <button onClick={stop} className="rounded-lg px-2 py-1 text-[11px] text-emerald-300/60 hover:bg-white/5">End</button>
          </div>
          <div className="max-h-[38vh] space-y-2 overflow-y-auto px-4 py-3">
            {chat.map((m) => (<div key={m.id} className={m.who === "you" ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-500/20 px-3 py-2 text-sm" : "mr-auto max-w-[92%] rounded-2xl rounded-bl-sm border border-emerald-400/20 bg-white/[0.03] px-3 py-2 text-sm text-emerald-50/90"}>{m.t}</div>))}
            <div ref={endRef} />
          </div>
          <div className="flex items-center gap-2 border-t border-emerald-500/15 p-3">
            {!paused ? (
              <button onClick={interrupt} className={"flex-1 rounded-xl px-3 py-2 text-sm font-bold " + (listening ? "bg-rose-500/30 text-rose-100 animate-pulse" : "bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25")}>{listening ? "Listening…" : (handsFree ? "🎙 Just speak - I'm listening" : "🎙 Interrupt & ask")}</button>
            ) : (
              <button onClick={resume} className="flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Resume tour ▶</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
