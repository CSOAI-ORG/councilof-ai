import { useEffect, useRef, useState } from "react";

// BrandGraphics — reusable, dependency-free branded visuals for CSOAI pages.
// All custom coded SVG/CSS (emerald #10b981 / teal #2dd4bf / slate-900) — NO stock/AI photos.
// Exports: PersonaHeroArt, Slideshow, TrustStrip.

const EM = "#10b981", TE = "#2dd4bf";

// ---- Custom per-persona hero illustration (abstract governance motifs) ----
type PersonaKey = "sec-filer" | "finance" | "healthcare" | "regulator" | "startup" | "enterprise" | "default";

export function PersonaHeroArt({ persona = "default", className = "" }: { persona?: PersonaKey; className?: string }) {
  // shared defs: soft aura + signed-node grid
  const aura = (
    <>
      <defs>
        <radialGradient id="pa-aura" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor={TE} stopOpacity="0.35" />
          <stop offset="100%" stopColor={EM} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pa-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={TE} />
          <stop offset="100%" stopColor={EM} />
        </linearGradient>
      </defs>
      <rect width="320" height="220" fill="url(#pa-aura)" />
    </>
  );
  const motif = () => {
    switch (persona) {
      case "sec-filer": // document + signed seal (10-K)
        return (
          <g stroke="url(#pa-stroke)" strokeWidth="2" fill="none">
            <rect x="96" y="44" width="86" height="112" rx="6" fill="#03110b" />
            {[62, 74, 86, 98, 110, 122].map((y) => <line key={y} x1="108" y1={y} x2="170" y2={y} strokeWidth="3" opacity="0.6" />)}
            <circle cx="196" cy="150" r="26" fill="#03110b" />
            <path d="M184 150l8 9 16-18" strokeWidth="3.5" />
          </g>
        );
      case "finance": // ledger bars + shield
        return (
          <g stroke="url(#pa-stroke)" strokeWidth="2" fill="none">
            {[0, 1, 2, 3].map((i) => <rect key={i} x={100 + i * 22} y={120 - i * 18} width="14" height={40 + i * 18} rx="3" fill={EM} opacity={0.25 + i * 0.15} />)}
            <path d="M210 56l30 12v20c0 20-14 30-30 38-16-8-30-18-30-38V68z" fill="#03110b" />
            <path d="M198 96l9 10 18-20" strokeWidth="3.5" />
          </g>
        );
      case "healthcare": // pulse + cross in shield
        return (
          <g stroke="url(#pa-stroke)" strokeWidth="2.5" fill="none">
            <path d="M60 118h34l10-26 14 52 12-34 8 16h50" />
            <path d="M210 54l30 12v22c0 20-14 30-30 38-16-8-30-18-30-38V66z" fill="#03110b" strokeWidth="2" />
            <path d="M210 78v28M196 92h28" strokeWidth="3.5" />
          </g>
        );
      case "regulator": // globe + gavel-free scales (governance)
        return (
          <g stroke="url(#pa-stroke)" strokeWidth="2" fill="none">
            <circle cx="160" cy="106" r="52" fill="#03110b" />
            <ellipse cx="160" cy="106" rx="52" ry="20" /><ellipse cx="160" cy="106" rx="20" ry="52" />
            <line x1="108" y1="106" x2="212" y2="106" />
            {[0, 1, 2].map((i) => <circle key={i} cx={130 + i * 30} cy={90 + (i % 2) * 28} r="4" fill={TE} />)}
          </g>
        );
      case "startup": // rocket-node network
        return (
          <g stroke="url(#pa-stroke)" strokeWidth="2" fill="none">
            {[[120, 70], [200, 60], [230, 130], [140, 150], [90, 110]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6" fill={EM} />)}
            <path d="M120 70L200 60L230 130L140 150L90 110Z" opacity="0.5" />
            <path d="M160 96l14-22 14 22-14 10z" fill={TE} />
          </g>
        );
      case "enterprise": // stacked layers + seal
        return (
          <g stroke="url(#pa-stroke)" strokeWidth="2" fill="none">
            {[0, 1, 2].map((i) => <rect key={i} x="100" y={70 + i * 26} width="120" height="18" rx="4" fill={EM} opacity={0.2 + i * 0.12} />)}
            <circle cx="220" cy="150" r="22" fill="#03110b" /><path d="M209 150l7 8 15-16" strokeWidth="3.5" />
          </g>
        );
      default: // signed network
        return (
          <g stroke="url(#pa-stroke)" strokeWidth="2" fill="none">
            {[[110, 80], [190, 70], [230, 120], [150, 150], [90, 120]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6" fill={EM} />)}
            <path d="M110 80L190 70L230 120L150 150L90 120Z" opacity="0.5" />
            <circle cx="160" cy="110" r="16" fill="#03110b" /><path d="M151 110l6 7 12-13" strokeWidth="3" />
          </g>
        );
    }
  };
  return (
    <svg viewBox="0 0 320 220" className={className} role="img" aria-label="CSOAI governance illustration" xmlns="http://www.w3.org/2000/svg">
      {aura}
      {motif()}
    </svg>
  );
}

// ---- Dependency-free branded slideshow (auto-rotate + dots + pause on hover) ----
export function Slideshow({ slides, interval = 5000 }: { slides: { title: string; body: string; tag?: string }[]; interval?: number }) {
  const [i, setI] = useState(0);
  const paused = useRef(false);
  useEffect(() => {
    const t = setInterval(() => { if (!paused.current) setI((v) => (v + 1) % slides.length); }, interval);
    return () => clearInterval(t);
  }, [slides.length, interval]);
  if (!slides.length) return null;
  const s = slides[i];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#03110b] p-6 sm:p-8"
      onMouseEnter={() => (paused.current = true)} onMouseLeave={() => (paused.current = false)}>
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(500px 240px at 90% -10%, rgba(45,212,191,.16), transparent 60%)" }} />
      <div key={i} className="relative min-h-[120px] animate-[fadeIn_.5s_ease]">
        {s.tag && <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">{s.tag}</p>}
        <h3 className="mt-2 text-xl sm:text-2xl font-black text-white">{s.title}</h3>
        <p className="mt-2 max-w-2xl text-sm sm:text-base text-emerald-50/80">{s.body}</p>
      </div>
      <div className="relative mt-5 flex gap-2">
        {slides.map((_, k) => (
          <button key={k} aria-label={`Slide ${k + 1}`} onClick={() => setI(k)}
            className={`h-1.5 rounded-full transition-all ${k === i ? "w-8 bg-emerald-400" : "w-2.5 bg-emerald-500/30 hover:bg-emerald-500/50"}`} />
        ))}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

// ---- Branded trust strip (the honest, verifiable cues) ----
export function TrustStrip({ className = "" }: { className?: string }) {
  // Each cue names an artifact a reader can go and open. "Ed25519-signed / every governed
  // action" used to sit in the first slot and was scope creep: what is signed is each
  // published measurement card and the board snapshot, not an unbounded set of "actions".
  // A cue on a trust strip is a capability claim like any other and is held to the same
  // standard as the prose beside it.
  const items = [
    { k: "Ed25519-signed", v: "every published measurement card" },
    { k: "Verify without an account", v: "pin our key, recompute the bytes" },
    { k: "Empty cells stay empty", v: "unmeasured is published, not hidden" },
    { k: "MIT-licensed core", v: "no vendor lock-in" },
  ];
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${className}`}>
      {items.map((it) => (
        <div key={it.k} className="rounded-xl border border-emerald-500/20 bg-white/[0.03] px-4 py-3">
          <div className="text-sm font-bold text-emerald-300">{it.k}</div>
          <div className="text-xs text-emerald-50/60">{it.v}</div>
        </div>
      ))}
    </div>
  );
}
