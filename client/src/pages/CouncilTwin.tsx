import { useEffect, useRef, useState } from "react";
const EMG_GW = "/api";
/**
 * DESIGN — not a live claim. This page shows what a personalized Sovereign Twin
 * experience WOULD look like. The visualizer is an illustrative canvas; the
 * "charge" meter is a UI affordance. The passport-mint flow hits a real signing
 * endpoint, but the resulting "twin" is a signed personalisation record, not
 * a claim about emergent AI behaviour. See CouncilModelCard for the canonical
 * disclaimer: "Not AGI, not conscious in the literal sense — any language
 * about emergent behaviour or 'consciousness' in internal material is a
 * metaphor for the substrate's evolving-memory design, never a literal claim."
 */
export default function CouncilTwin() {
  const cv = useRef<HTMLCanvasElement | null>(null);
  const chargeRef = useRef(0); const personaliseRef = useRef(false);
  const [charge, setCharge] = useState(0); const [personalised, setPersonalised] = useState(false);
  const [pName, setPName] = useState(""); const [pKind, setPKind] = useState("Personal Council Twin");
  const [passport, setPassport] = useState<null | { fingerprint?: string; signature?: string; publicKey?: string; canonical?: string }>(null);
  const [minting, setMinting] = useState(false);
  async function mintPassport() {
    const holder = (pName || "").trim(); if (!holder) return;
    setMinting(true); setPassport(null);
    const canonical = "CSOAI Personalisation Record \u00b7 " + pKind + " \u00b7 holder: " + holder + " \u00b7 issued " + new Date().toISOString();
    try {
      const r = await fetch(EMG_GW + "/sign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: canonical }) });
      if (r.ok) { const d = await r.json(); setPassport({ fingerprint: d.fingerprint, signature: d.signature, publicKey: d.publicKey, canonical: d.canonical || canonical }); }
    } catch (e) {}
    if (!passport) setPassport((p) => p || { canonical, fingerprint: "", signature: "" });
    setMinting(false);
  }
  useEffect(() => { document.title = "Your Council assistant Twin | CSOAI (DESIGN)"; try { var sv = parseInt(localStorage.getItem("sov_charge") || "0", 10); if (sv > 0) { chargeRef.current = sv; setCharge(sv); if (sv >= 100) { personaliseRef.current = true; setPersonalised(true); } } } catch (e) {} }, []);
  function addCharge() { const n = Math.min(100, chargeRef.current + 12); chargeRef.current = n; setCharge(n); try { localStorage.setItem("sov_charge", String(n)); } catch (e) {} if (n >= 100 && !personaliseRef.current) { personaliseRef.current = true; setPersonalised(true); } }
  useEffect(() => {
    const c = cv.current; if (!c) return; const ctx = c.getContext("2d"); if (!ctx) return;
    let raf = 0; const DPR = Math.min(window.devicePixelRatio || 1, 2);
    function size() { const r = c.getBoundingClientRect(); c.width = r.width * DPR; c.height = r.height * DPR; }
    size(); window.addEventListener("resize", size);
    const N = 460; const pts: number[][] = [];
    for (let i = 0; i < N; i++) { const y = 1 - (i / (N - 1)) * 2; const rad = Math.sqrt(1 - y * y); const th = i * 2.399963; pts.push([Math.cos(th) * rad, y, Math.sin(th) * rad]); }
    let t = 0;
    function frame() {
      t += 1; const w = c.width, h = c.height, cx = w / 2, cy = h / 2; const R = Math.min(w, h) * 0.32;
      const chg = chargeRef.current / 100; const hd = personaliseRef.current; const col = hd ? "250,204,21" : "16,185,129";
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#03110b"; ctx.fillRect(0, 0, w, h);
      const aur = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * (1.5 + 0.3 * Math.sin(t * 0.03)));
      aur.addColorStop(0, "rgba(16,185,129," + (0.12 + 0.1 * chg) + ")"); aur.addColorStop(0.6, "rgba(" + col + "," + (0.08 + 0.28 * chg) + ")"); aur.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = aur; ctx.beginPath(); ctx.arc(cx, cy, R * 1.9, 0, Math.PI * 2); ctx.fill();
      const ay = t * 0.004; const lit: number[][] = [];
      for (let i = 0; i < pts.length; i++) { const x = pts[i][0], y = pts[i][1], z = pts[i][2]; const X = x * Math.cos(ay) - z * Math.sin(ay); const Z = x * Math.sin(ay) + z * Math.cos(ay); const sx = cx + X * R, sy = cy + y * R; const front = Z > 0; const day = (X + 1) / 2; const base = front ? (0.2 + 0.6 * day) : 0.07;
        ctx.fillStyle = "rgba(" + col + "," + base.toFixed(2) + ")"; ctx.beginPath(); ctx.arc(sx, sy, (front ? 1.7 : 1.0) * DPR, 0, Math.PI * 2); ctx.fill(); if (front && day > 0.55) lit.push([sx, sy]); }
      ctx.strokeStyle = "rgba(" + (hd ? "253,224,71" : "110,231,183") + "," + (0.05 + 0.12 * chg) + ")"; ctx.lineWidth = DPR;
      for (let k = 0; k < 14 && lit.length > 2; k++) { const a = lit[(k * 7) % lit.length], b = lit[(k * 13 + 3) % lit.length]; if (a && b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 34 * DPR, b[0], b[1]); ctx.stroke(); } }
      const core = ctx.createRadialGradient(cx, cy, 1, cx, cy, R * 0.55); core.addColorStop(0, "rgba(" + (hd ? "254,240,138" : "167,243,208") + "," + (0.35 + 0.4 * chg) + ")"); core.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = core; ctx.beginPath(); ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2); ctx.fill();
      if (hd) { ctx.fillStyle = "rgba(254,240,138,0.95)"; ctx.font = (R * 0.55) + "px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String.fromCharCode(9673), cx, cy); }
      raf = requestAnimationFrame(frame);
    }
    frame();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
  }, []);
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50 overflow-hidden">
      <section className="relative">
        <canvas ref={cv} className="block h-[72vh] w-full" />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS \u00b7 your Council assistant Twin (DESIGN)</p>
          <h1 className="mt-2 text-4xl sm:text-4xl font-black tracking-tight">{personalised ? "Your Council assistant Twin is personalised." : "Your Council assistant Twin."}</h1>
          <p className="mt-2 max-w-xl px-6 text-sm text-emerald-100/70">{personalised ? "Your personalisation record is signed. The Twin reflects your Council assistant's view of the world — it does not make behavioural claims." : "An illustrative mirror of Earth — day, night, every connector lit. Use the OS to personalise. No claims about emergent behaviour."}</p>
          <div className="pointer-events-auto mt-4 flex flex-wrap items-center justify-center gap-3 px-6">
            {!personalised && <button onClick={addCharge} className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Personalise ({charge}%)</button>}
            {personalised && <a href="/start" className="rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-[#03110b] hover:bg-amber-300">Meet your Twin -&gt;</a>}
            <a href="/world-3d" className="rounded-xl border border-emerald-400/40 px-5 py-3 text-sm font-semibold text-emerald-100 hover:bg-white/5">Real-world globe -&gt;</a>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-12 text-center">
        <p className="text-sm text-emerald-100/70">An illustrative personalisation surface — the world rendered as your Council assistant Twin. Actions across the OS fill your personalisation record. This page does not assert emergent or conscious behaviour in the Twin; the Twin is a signed personalisation record.</p>
        <div className="mt-6 rounded-2xl border border-emerald-500/15 bg-black/20 p-5">
          <div className="text-sm font-bold text-emerald-200">Your Twin personalises as you use the OS.</div>
          <p className="mt-1 text-sm text-emerald-100/70">Every question in the <b className="text-emerald-200">Council dock</b>, every <b className="text-emerald-200">Governance Graph</b> query, every <b className="text-emerald-200">Council Space</b> experiment and <b className="text-emerald-200">Council</b> verdict updates your personalisation record.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <a href="/dashboard?tab=home" className="rounded-full border border-emerald-400/30 bg-emerald-500/5 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/15">Ask the Governance Graph +6%</a>
            <a href="/gspc-arena" className="rounded-full border border-emerald-400/30 bg-emerald-500/5 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/15">Run a Council Space experiment +10%</a>
            <a href="/try" className="rounded-full border border-emerald-400/30 bg-emerald-500/5 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/15">Convene the Council +10%</a>
          </div>
        </div>

        {/* Digital sovereign twin + signed ID passport (real Ed25519 signing) */}
        <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-5 text-left">
          <div className="text-sm font-bold text-emerald-200">Mint a digital ID passport</div>
          <p className="mt-1 text-[13px] text-emerald-100/75">Your signed twin — and every agent you deploy — carries a signed <b className="text-emerald-200">digital passport</b>: an Ed25519 identity anyone can verify (proofof.ai). Mint one for yourself, or issue <b className="text-emerald-200">passported agents</b> for your enterprise or government — each identified, accountable, and sealed to Layer 0.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Holder — you, an agent, or an org" className="flex-1 min-w-[200px] rounded-lg border border-emerald-500/25 bg-black/30 px-3 py-2 text-sm text-emerald-50 placeholder-emerald-300/30 focus:border-emerald-400 focus:outline-none" />
            <select value={pKind} onChange={(e) => setPKind(e.target.value)} className="rounded-lg border border-emerald-500/25 bg-black/30 px-2 py-2 text-sm text-emerald-50">
              <option>Council twin</option><option>Enterprise agent</option><option>Government agent</option><option>Humanoid / robot</option>
            </select>
            <button onClick={mintPassport} disabled={minting} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-60">{minting ? "Signing\u2026" : "Mint signed passport"}</button>
          </div>
          {passport && (
            <div className="mt-3 rounded-xl border border-emerald-500/20 bg-black/30 p-3 font-mono text-[11px] text-emerald-100/85">
              <div className="text-emerald-300/80">\u2726 {pKind} \u00b7 {pName}</div>
              {passport.fingerprint ? (<>
                <div className="mt-1 break-all">seal <span className="text-emerald-200">{passport.fingerprint}</span></div>
                <div className="mt-0.5 break-all text-emerald-300/60">sig {String(passport.signature).slice(0, 88)}\u2026</div>
                <div className="mt-1 text-emerald-300/70">Ed25519-signed \u00b7 offline-verifiable via <a href="/protect" className="underline">proofof.ai</a> \u00b7 anchored to Layer 0.</div>
              </>) : (<div className="mt-1 text-amber-200/80">Signing service unavailable right now — the passport is issued once the Council assistant backend is reachable. Your details never leave your browser.</div>)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
