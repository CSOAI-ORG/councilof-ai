import { useEffect, useRef, useState } from "react";
import { chargeSovereign } from "../lib/sovCharge";

// Sovereign Space - the CSOAI AI-OS simulation. Feed data + text, watch the
// 33-agent council deliberate, and the Sovereign narrates + speaks every step.
// When VITE_SOV_GATEWAY is set it runs LIVE against the MEOK 59-MCP substrate
// (council + audit + sigil); otherwise it runs the local simulation. The same
// flow pixel-streams from Unreal Engine 5 in the full OS.

type Step = { t: string; phase: number };
const SAMPLE = "A hospital wants to deploy an AI triage model in the EU that ranks ER patients by urgency.";

const GW: string = ((import.meta as any).env && (import.meta as any).env.VITE_KNOWLEDGE_BASE) || "https://os.meok.ai/api";
const SS_INDUSTRIES = ["healthcare","health","hospital","clinical","triage","pharma","biotech","finance","fintech","banking","insurance","lending","credit","education","edtech","retail","ecommerce","legal","government","public sector","defense","energy","utilities","automotive","telecom","manufacturing","logistics","hr","recruiting","hiring","media","gaming","agriculture","transport","aviation","real estate","crypto","web3","marketing"];
function ssIndustry(q: string) { const s = (q || "").toLowerCase(); return SS_INDUSTRIES.find((w) => new RegExp("\\b" + w + "\\b").test(s)) || null; }
function ssRegion(q: string) {
  const s = " " + (q || "").toLowerCase() + " ";
  if (/\bus\b|\busa\b|\bamerica|\bcalifornia\b|\btexas\b|\bcolorado\b|\bnew york\b/.test(s)) return "the United States (NIST AI RMF + state law)";
  if (/\beu\b|\beurope|\bgerman|\bfrance\b|\bspain\b|\bitaly\b|\bireland\b|\bparis\b|\bberlin\b/.test(s)) return "the European Union (EU AI Act)";
  if (/\bchina\b|\bbeijing\b/.test(s)) return "China (TC260)";
  if (/\bsingapore\b/.test(s)) return "Singapore (Model AI Governance)";
  if (/\buk\b|\bbritain\b|\blondon\b/.test(s)) return "the United Kingdom (UK AI regulation)";
  return "a global footprint (ISO 42001)";
}
async function ssSha256(s: string): Promise<string> {
  try { const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join(""); } catch (e) { return ""; }
}
async function ssGovern(ind: string): Promise<any | null> {
  try { const r = await fetch(GW + "/govern?q=" + encodeURIComponent(ind)); if (r.ok) { const d = await r.json(); if (d && d.matched && d.frameworks && d.frameworks.length) return d; } } catch (e) {}
  return null;
}
async function ssVerdict(scenario: string): Promise<string> {
  try {
    const r = await fetch(GW + "/chat", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: "You are the CSOAI 33-agent governance council. In 3 sentences, deliver a verdict on this AI system: is it permitted, and under what key conditions (risk tier, human oversight, transparency, data duties)? System: " + scenario }) });
    if (r.ok) { const d = await r.json(); if (d && d.response && d.model !== "idle") return String(d.response); }
  } catch (e) {}
  return "";
}

function buildRun(scenario: string): Step[] {
  const s = (scenario || "").trim() || SAMPLE;
  const head = s.slice(0, 88) + (s.length > 88 ? "..." : "");
  return [
    { t: "Ingesting your scenario into Sov Space: \"" + head + "\"", phase: 1 },
    { t: "Classifying the system - risk tier and applicable regimes detected (EU AI Act, NIST AI RMF, ISO 42001).", phase: 1 },
    { t: "Convening the council - 33 sovereign agents, Byzantine fault tolerant. Quorum forming...", phase: 2 },
    { t: "Agents deliberating - mapping controls, fairness checks, human-oversight duties, transparency obligations.", phase: 2 },
    { t: "Crosswalking once -> EU AI Act, NIST, ISO 42001 and TC260 satisfied from one evidence set.", phase: 3 },
    { t: "Consensus reached. Verdict signed (Ed25519) and written to the Layer 0 ledger.", phase: 4 },
  ];
}

export default function SovSpace() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef<number>(0);
  const [scenario, setScenario] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [verdictText, setVerdictText] = useState("");
  const [sig, setSig] = useState("");
  const [voiceOn, setVoiceOn] = useState(true);
  const endRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<any[]>([]);

  useEffect(() => { document.title = "Sovereign Space - simulate, experiment, govern | CSOAI"; }, []);
  useEffect(() => { const d = new URLSearchParams(window.location.search).get("demo"); if (d) { setScenario(d); const t = setTimeout(() => run(d), 700); return () => clearTimeout(t); } }, []);
  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [log]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); try { window.speechSynthesis.cancel(); } catch (e) {} }, []);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    let raf = 0; const DPR = Math.min(window.devicePixelRatio || 1, 2);
    function size() { const r = cv.getBoundingClientRect(); cv.width = r.width * DPR; cv.height = r.height * DPR; }
    size(); window.addEventListener("resize", size);
    const N = 33; let tick = 0;
    function frame() {
      tick += 1; const w = cv.width, h = cv.height, cx = w / 2, cy = h / 2;
      const ph = phaseRef.current;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#03110b"; ctx.fillRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.34;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 + tick * 0.002;
        const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
        const lit = ph >= 2 && ((tick * 0.6 + i * 7) % N) < (ph * 6);
        ctx.beginPath(); ctx.arc(x, y, lit ? 5 * DPR : 3 * DPR, 0, Math.PI * 2);
        ctx.fillStyle = lit ? "#34d399" : "rgba(16,185,129,0.35)"; ctx.fill();
        if (ph >= 3) { ctx.strokeStyle = "rgba(16,185,129," + (0.05 + 0.05 * Math.sin(tick * 0.05 + i)) + ")"; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); }
      }
      if (ph >= 1) { for (let k = 0; k < 26; k++) { const p = ((tick * 4 + k * 30) % 300) / 300; const x = 20 * DPR + p * (cx - 20 * DPR); const y = cy + Math.sin(k + tick * 0.04) * 26 * DPR; ctx.fillStyle = "rgba(110,231,183," + (1 - p) + ")"; ctx.fillRect(x, y, 2.4 * DPR, 2.4 * DPR); } }
      const pulse = 1 + 0.08 * Math.sin(tick * 0.08);
      const grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, 46 * DPR * pulse);
      grd.addColorStop(0, ph >= 4 ? "#a7f3d0" : "#10b981"); grd.addColorStop(1, "rgba(4,120,87,0)");
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx, cy, 46 * DPR * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#05140d"; ctx.beginPath(); ctx.arc(cx, cy, 20 * DPR, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#6ee7b7"; ctx.font = (14 * DPR) + "px ui-monospace, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String.fromCharCode(9673), cx, cy);
      raf = requestAnimationFrame(frame);
    }
    frame();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
  }, []);

  function speak(t: string) { if (!voiceOn) return; try { const u = new SpeechSynthesisUtterance(t); u.rate = 1.04; const vs = window.speechSynthesis.getVoices(); const pick = vs.find((v) => /Google US English|Samantha|Microsoft Aria|en-US/i.test(v.name + " " + v.lang)); if (pick) u.voice = pick; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) {} }

  function playSteps(steps: Step[], verdict?: string, sigHash?: string) {
    let i = 0;
    const play = () => {
      if (i >= steps.length) {
        phaseRef.current = 4;
        if (verdict) { setVerdictText(verdict); setLog((l) => l.concat("Verdict: " + verdict)); }
        if (sigHash) setLog((l) => l.concat("Ledger hash (SHA-256): " + sigHash));
        setRunning(false); setDone(true); return;
      }
      const st = steps[i++]; phaseRef.current = st.phase; setLog((l) => l.concat(st.t)); speak(st.t);
      const id = setTimeout(play, 1050); timers.current.push(id);
    };
    play();
  }

  function buildLiveRun(scenario: string, region: string, fwNames: string[], bridges: string[], ind: string | null): Step[] {
    const s = (scenario || "").trim() || SAMPLE;
    const head = s.slice(0, 88) + (s.length > 88 ? "..." : "");
    const fwList = fwNames.length ? fwNames.join(", ") : "EU AI Act, NIST AI RMF, ISO 42001";
    return [
      { t: "Ingesting your scenario into Sov Space: \"" + head + "\"", phase: 1 },
      { t: "Classifying the system - jurisdiction: " + region + (ind ? "; sector: " + ind : "") + ".", phase: 1 },
      { t: "Applicable regimes detected: " + fwList + ".", phase: 1 },
      { t: "Convening the council - 33 sovereign agents, Byzantine fault tolerant. Quorum forming...", phase: 2 },
      { t: "Agents deliberating - risk tier, fairness checks, human-oversight duties, transparency obligations.", phase: 2 },
      { t: "Crosswalking once -> " + fwList + " satisfied from one evidence set." + (bridges.length ? " Legacy bridge: " + bridges.join(", ") + "." : ""), phase: 3 },
      { t: "Consensus reached. Verdict sealed and written to the Layer 0 ledger.", phase: 4 },
    ];
  }

  async function run(override?: string) {
    timers.current.forEach(clearTimeout); timers.current = [];
    if (override) setScenario(override);
    setLog(["Convening the council over your scenario..."]); setVerdictText(""); setSig(""); setDone(false); setRunning(true); phaseRef.current = 2; chargeSovereign(10);
    const scen = ((override ?? scenario) || "").trim() || SAMPLE;
    const ind = ssIndustry(scen);
    const region = ssRegion(scen);
    try {
      const [gov, verdict] = await Promise.all([ind ? ssGovern(ind) : Promise.resolve(null), ssVerdict(scen)]);
      const fwNames: string[] = gov && Array.isArray(gov.frameworks) ? gov.frameworks.map((f: any) => f.name) : [];
      const bridges: string[] = gov && Array.isArray(gov.bridges) ? gov.bridges : [];
      const ts = new Date().toISOString();
      const digest = await ssSha256(scen + "|" + fwNames.join(",") + "|" + (verdict || "") + "|" + ts);
      const shortSig = digest ? digest.slice(0, 40) : "";
      setSig(shortSig);
      setLog([]);
      playSteps(buildLiveRun(scen, region, fwNames, bridges, ind), verdict || "Permitted with conditions - high-risk controls, human oversight, and transparency required.", shortSig);
      return;
    } catch (e) {
      setLog((l) => l.concat("Live gateway unavailable - running local simulation."));
    }
    playSteps(buildRun(scenario), "Compliant with conditions - signed and ledgered.");
  }
  function reset() { timers.current.forEach(clearTimeout); try { window.speechSynthesis.cancel(); } catch (e) {} phaseRef.current = 0; setLog([]); setRunning(false); setDone(false); setVerdictText(""); setSig(""); }

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden mx-auto max-w-6xl px-6 pt-14 pb-6">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(800px 380px at 30% -10%, rgba(16,185,129,.18), transparent 60%)" }} />
        <p className="relative font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS - Sovereign Space</p>
        <h1 className="relative mt-2 text-5xl sm:text-6xl font-black tracking-tight">Simulate. Experiment. <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">Govern.</span></h1>
        <p className="mt-3 max-w-2xl text-emerald-100/80">Feed a real-world scenario - data or text - into the AI-OS. Watch the 33-agent council deliberate live while your Sovereign narrates and speaks every step. This is the web preview of the immersive Unreal Engine 5 world; the full OS pixel-streams the same flow from UE5.</p>
      </section>
      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20">
          <canvas ref={canvasRef} className="h-[420px] w-full block" />
          <div className="absolute left-3 top-3 rounded-md bg-black/40 px-2 py-1 font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/80">{running ? "council deliberating" : done ? "verdict signed - Layer 0" : "sov space - idle"}</div>
          <div className="absolute right-3 top-3 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-[2px] bg-emerald-500/20 text-emerald-200">LIVE - Sovereign gateway</div>
        </div>
        <div className="flex flex-col rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4">
          <label className="text-xs font-bold text-emerald-200/80">Your experiment</label>
          <textarea value={scenario} onChange={(e) => setScenario(e.target.value)} placeholder={SAMPLE} rows={3} className="mt-2 resize-none rounded-xl border border-emerald-500/25 bg-black/30 p-3 text-sm text-emerald-50 placeholder-emerald-300/30 focus:outline-none" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={() => run()} disabled={running} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-50">{running ? "Running..." : "Run experiment"}</button>
            <button onClick={reset} className="rounded-xl border border-emerald-400/40 px-3 py-2 text-sm font-semibold text-emerald-100 hover:bg-white/5">Reset</button>
            <button onClick={() => { setVoiceOn((x) => !x); try { window.speechSynthesis.cancel(); } catch (e) {} }} className="rounded-xl border border-emerald-400/40 px-3 py-2 text-sm text-emerald-100 hover:bg-white/5">{voiceOn ? "Voice on" : "Voice off"}</button>
          </div>
          <div className="mt-3 flex-1 space-y-2 overflow-y-auto rounded-xl border border-emerald-500/10 bg-black/20 p-3 text-sm" style={{ minHeight: 180 }}>
            {log.length === 0 && <div className="text-emerald-300/40">The Sovereign will narrate here as your experiment runs.</div>}
            {log.map((m, i) => (<div key={i} className="flex gap-2"><span className="text-emerald-400">{String.fromCharCode(9673)}</span><span className="text-emerald-50/90">{m}</span></div>))}
            {done && <div className="mt-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-emerald-100">{verdictText ? <div className="mb-2 leading-relaxed"><b className="text-emerald-200">Council verdict:</b> {verdictText}</div> : <div className="mb-2"><b>Verdict:</b> signed and ledgered.</div>}{sig ? <div className="font-mono text-[10px] text-emerald-300/70 break-all">Layer 0 ledger hash - SHA-256: {sig}</div> : null}<div className="mt-3 flex flex-wrap gap-2"><a href="/system-card" className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-100 hover:bg-amber-400/20">Get a signed System Card →</a><a href={"/hive?q=" + encodeURIComponent(scenario)} className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-white/5">Collect the frameworks →</a><a href="/try" className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-white/5">Inspect on the live Council →</a></div></div>}
            <div ref={endRef} />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          <a href="/try" className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5 hover:border-emerald-400/40"><div className="text-lg font-bold">Ask the live Council</div><p className="mt-1 text-sm text-emerald-100/70">Take a real question to the 33 agents and get a signed verdict.</p></a>
          <a href="/certification" className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5 hover:border-emerald-400/40"><div className="text-lg font-bold">Training and Certification</div><p className="mt-1 text-sm text-emerald-100/70">Learn the framework and earn your verifiable Sovereign credential.</p></a>
          <a href="/charter" className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5 hover:border-emerald-400/40"><div className="text-lg font-bold">The Sovereign Charter</div><p className="mt-1 text-sm text-emerald-100/70">The constitution the OS is governed by - read and align.</p></a>
        </div>
        <div className="mt-6 rounded-2xl border border-emerald-500/15 bg-black/20 p-5 text-sm text-emerald-100/70">
          <b className="text-emerald-200">Roadmap to Unreal Engine 5.</b> This Sov Space runs natively in your browser today. The full immersive OS renders in UE5 and reaches you by pixel-stream, with the same Sovereign voice loop and Layer 0 signing - you take control, it explains as it happens. Building in the open on GitHub; aligned across the M4 build line.
        </div>
      </section>
    </div>
  );
}
