import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { tourActive, tourStep, setTourStep, endTour, startTour, tourSeen, markSeen } from "../lib/demoTour";
import { tourSteps, personaSpeak, getPersonaId } from "../lib/sovPersona";

// DemoTour - a global, self-driving guided walkthrough. When idle it proactively
// invites the user ("let me show you around"). When active it shows a narrated card
// on each surface, speaks it, and (via ?demo= on the next route) auto-runs that
// surface's live feature so the user watches CSOAI govern real AI in real time.
export default function DemoTour() {
  const [loc] = useLocation();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [seen, setSeen] = useState(true);
  const [invite, setInvite] = useState(false);
  const spoke = useRef<string>("");

  useEffect(() => { setActive(tourActive()); setStep(tourStep()); setSeen(tourSeen()); }, [loc]);
  // Proactively surface the invite a few seconds after first landing.
  useEffect(() => {
    if (!tourActive() && !tourSeen()) { const t = setTimeout(() => setInvite(true), 3500); return () => clearTimeout(t); }
  }, []);

  const STEPS = tourSteps(); // persona-aware: assurance mode adds the System Card assurance stop
  const s = active ? STEPS[step] : null;
  const here = !!s && typeof window !== "undefined" && window.location.pathname === s.path;

  useEffect(() => {
    if (active && here && s && spoke.current !== s.path) {
      spoke.current = s.path;
      personaSpeak(s.say);
    }
  }, [active, here, step]);

  function begin() { startTour(); setInvite(false); setSeen(true); window.location.assign("/"); }
  function dismissInvite() { markSeen(); setInvite(false); setSeen(true); }
  function next() {
    const n = step + 1;
    if (n >= STEPS.length) { endTour(); setActive(false); try { window.speechSynthesis.cancel(); } catch (e) {} return; }
    setTourStep(n); setStep(n);
    const ns = STEPS[n];
    const url = ns.demo ? ns.path + "?demo=" + encodeURIComponent(ns.demo) : ns.path;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    window.location.assign(url);
  }
  function stop() { endTour(); setActive(false); try { window.speechSynthesis.cancel(); } catch (e) {} }

  // Proactive invite pill (idle, first visit)
  if (!active && invite && !seen) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-20 z-[9997] pointer-events-auto max-w-[calc(100vw-2rem)] sm:max-w-[280px] rounded-2xl border border-emerald-400/40 bg-[#04120c]/95 p-3 text-emerald-50 shadow-[0_10px_40px_-8px_rgba(16,185,129,.6)] backdrop-blur-xl">
        <div className="flex items-start gap-2">
          <span className="text-lg">{"◉"}</span>
          <div>
            <div className="text-sm font-bold text-emerald-100">New here? See what makes CSOAI different.</div>
            <p className="mt-0.5 text-xs text-emerald-100/70">60-second live tour: the Sovereign OS, a 33-agent council, signed governance artifacts, and the globe. Not slides - the real thing.</p>
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <button onClick={begin} className="flex-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-[#03110b] hover:bg-emerald-400">Show me ▶</button>
          <button onClick={dismissInvite} className="rounded-lg px-2 py-1.5 text-xs text-emerald-300/60 hover:bg-white/5">Not now</button>
        </div>
      </div>
    );
  }

  if (!active || !s || !here) return null;

  const last = step >= TOUR.length - 1;
  return (
    <div className="fixed inset-x-0 bottom-0 z-[10000] flex justify-center px-4 pb-5 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-emerald-400/40 bg-[#04120c]/95 p-4 text-emerald-50 shadow-[0_10px_50px_-10px_rgba(16,185,129,.6)] backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/15 text-lg">{"◉"}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={"text-sm font-black " + (getPersonaId() === "assurance" ? "text-amber-100" : "text-emerald-100")}>{s.title}</span>
              <span className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/50">Sovereign tour {"·"} {step + 1}/{STEPS.length}</span>
            </div>
            {s.usp && <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300/90">{"✦"} {s.usp}</div>}
            <p className="mt-1 text-sm leading-relaxed text-emerald-50/90">{s.say}</p>
            {s.tip && <p className="mt-1 text-xs text-emerald-300/70">{"→"} {s.tip}</p>}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button onClick={stop} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-300/70 hover:bg-white/5">End tour</button>
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (<span key={i} className={"h-1.5 rounded-full transition-all " + (i === step ? "w-5 bg-emerald-400" : "w-1.5 bg-emerald-500/30")} />))}
          </div>
          <button onClick={next} className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400">{last ? "Finish" : "Next ▶"}</button>
        </div>
      </div>
    </div>
  );
}
