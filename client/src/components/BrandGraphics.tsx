import { useEffect, useId, useState } from "react";

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

// A bounded, user-controlled slideshow on the existing institutional ink surface.
export function Slideshow({ slides, interval = 5000, label = "Featured information" }: {
  slides: { title: string; body: string; tag?: string }[];
  interval?: number;
  label?: string;
}) {
  const [i, setI] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  // Start static until the browser preference is known; SSR must not need window.
  const [reduced, setReduced] = useState(true);
  const [hidden, setHidden] = useState(false);
  const id = useId();
  const count = slides.length;
  const index = count ? i % count : 0;
  const delay = typeof interval === "number" && Number.isFinite(interval)
    && interval >= 5000 && interval <= 2147483647 ? interval : null;
  const rotating = count > 1 && delay !== null
    && !userPaused && !hoverPaused && !focusPaused && !reduced && !hidden;

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => { setI(value => value < count ? value : 0); }, [count]);
  useEffect(() => {
    if (!rotating || delay === null) return;
    const timer = window.setInterval(() => setI(value => (value + 1) % count), delay);
    return () => window.clearInterval(timer);
  }, [rotating, delay, count]);

  if (!count) return null;
  const slide = slides[index];
  const select = (next: number) => {
    setI((next + count) % count);
    setUserPaused(true);
  };
  const focusClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-kicker)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)]";
  const controlClass = `inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--ink-border)] px-3 text-sm font-semibold transition-colors hover:bg-[var(--ink-raised-hover)] motion-reduce:transition-none ${focusClass}`;
  const rotationUnavailable = reduced || delay === null;

  return (
    <section
      data-council-slideshow="true"
      aria-label={label}
      aria-roledescription="carousel"
      className="surface-ink relative overflow-hidden rounded-2xl border border-[var(--ink-border)] p-6 sm:p-8"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setFocusPaused(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusPaused(false);
      }}
    >
      <div aria-live={rotating ? "off" : "polite"} aria-atomic="true">
        <div id={`${id}-slide`} role="group" aria-roledescription="slide"
          aria-label={`Slide ${index + 1} of ${count}`}
          className="relative min-h-[120px]">
          {slide.tag && <p className="ink-kicker font-mono text-xs uppercase tracking-[0.14em]">{slide.tag}</p>}
          <h3 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">{slide.title}</h3>
          <p className="ink-muted mt-3 max-w-2xl text-base leading-relaxed">{slide.body}</p>
        </div>
      </div>
      {count > 1 && (
        <div className="relative mt-6">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Slideshow controls">
            <button type="button" disabled={rotationUnavailable}
              aria-label={rotationUnavailable ? "Automatic rotation disabled" : userPaused ? "Resume automatic slides" : "Pause automatic slides"}
              aria-describedby={`${id}-rotation`} className={`${controlClass} disabled:cursor-default`}
              onClick={() => setUserPaused(value => !value)}>
              {rotationUnavailable ? "Automatic rotation off" : userPaused ? "Resume slides" : "Pause slides"}
            </button>
            <div className="inline-flex shrink-0 gap-2" role="group" aria-label="Previous and next slide">
              <button type="button" aria-label="Previous slide" aria-controls={`${id}-slide`}
                className={controlClass} onClick={() => select(index - 1)}>←</button>
              <button type="button" aria-label="Next slide" aria-controls={`${id}-slide`}
                className={controlClass} onClick={() => select(index + 1)}>→</button>
            </div>
            <span className="ink-muted ml-auto text-sm tabular-nums" aria-hidden="true">{index + 1} / {count}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label="Choose a slide">
            {slides.map((item, k) => (
              <button key={k} type="button" aria-label={`Slide ${k + 1}: ${item.title}`}
                aria-current={k === index ? "true" : undefined} aria-controls={`${id}-slide`}
                onClick={() => select(k)}
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-[var(--ink-raised-hover)] ${focusClass}`}>
                <span aria-hidden="true" className={`h-1.5 rounded-full ${k === index ? "w-7 bg-[var(--ink-kicker)]" : "w-3 bg-[var(--ink-muted)]"}`} />
              </button>
            ))}
          </div>
          <p id={`${id}-rotation`} className="ink-muted mt-1 text-xs leading-relaxed">
            {reduced ? "Automatic rotation is off for reduced motion." : delay === null
              ? "Automatic rotation is off. Use the slide controls."
              : userPaused ? "Automatic rotation is paused. Resume when ready."
              : focusPaused || hoverPaused ? "Paused while you use this slideshow."
              : "Slides rotate every " + (delay / 1000) + " seconds. Pause to read at your own pace."}
          </p>
        </div>
      )}
    </section>
  );
}

// ---- Branded trust strip (the honest, verifiable cues) ----
export function TrustStrip({ className = "" }: { className?: string }) {
  // Each cue names an artifact a reader can go and open. "Ed25519-signed / every governed
  // action" used to sit in the first slot and was scope creep: verify issued signed
  // cards and the board snapshot individually; supporting fact runs can be unsigned.
  // A cue on a trust strip is a capability claim like any other and is held to the same
  // standard as the prose beside it.
  const items = [
    { k: "Ed25519-signed", v: "issued signed cards and board snapshot" },
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
