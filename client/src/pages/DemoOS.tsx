import { useEffect, useRef, useState } from "react";
import AISystemNotice from "../components/AISystemNotice";
import { personaSpeak, stopVoice } from "../lib/sovPersona";

// DemoOS - the immersive AI-OS experience. A live Cesium globe (globe3d.html,
// driven by postMessage) is the backdrop; the Council assistant narrates step by step
// (typed + voice); live SaaS windows glide open, tile like a real desktop, and
// close on the globe; the Council assistant is screen-aware and moves windows aside;
// the user can barge in by voice any time. Doubles as SOV33 training.

import TrustMarquee from "../components/TrustMarquee";
import { askSovereign } from "../lib/sovAsk";
import { STEPS, type Step, type Win } from "./demoOsSteps";
import {
  BOOT, NAV_GROUPS, NAV_LAYERS, NAV_SHOW, NET_DOMAINS, BOTTOM_NAV,
  BRIDGE_PLACE, BRIDGE_LAYER, layerFromSpeech,
} from "./demoOsCanon";

const GW = "/api";

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

  function openTool(title: string, src: string) { setWins([{ title, src, slot: "c" }]); setWinsShow(true); setWinMin(false); setDrawer(false); }
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
              <a href="/os?lobby=home" className="mt-3 block rounded-xl bg-emerald-600 px-3 py-2.5 text-center text-sm font-bold text-white hover:bg-emerald-500">Enter Council OS →</a>
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
                <a href="/os?lobby=home" className="rounded-xl bg-emerald-500/15 px-3 py-2 text-center text-xs font-bold text-emerald-100 hover:bg-emerald-500/25">Show governance</a>
                <a href="/os?lobby=home" className="rounded-xl bg-emerald-500 px-3 py-2 text-center text-xs font-bold text-[#03110b] hover:bg-emerald-400">Enter the OS ▶</a>
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
