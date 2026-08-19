import { useEffect, useRef, useState } from "react";

/**
 * StoryWorld — 10-slide sticky scroll hero for councilof.ai.
 * Slide 1 H1 is locked. No sov-* names. No invented scores.
 * Each slide: kicker · title · body · bullet points · infographic (inline SVG, no deps).
 * Background: 3D scroll-world (perspective grid floor + orbit ring + depth orbs) driven
 * by scroll progress. prefers-reduced-motion: stacked sections, no pin, no FX.
 */

type Tone = "light" | "ink" | "ring" | "board";

type Slide = {
  kicker: string;
  title?: string;
  body: string;
  points?: string[];
  href?: string;
  cta?: string;
  tone: Tone;
};

export const STORY: Slide[] = [
  {
    kicker: "Council of AI — the independent measurement body for AI behaviour",
    body: "We measure how your AI behaves on our own published instruments and issue the result as a verified measurement credential: a 3KB card, Ed25519-signed and timestamp-anchored. Then we measure again. Not certification. Not another dashboard.",
    points: [
      "Published instruments — frozen items, public scoring code",
      "Ed25519-signed 3KB card, timestamp-anchored",
      "Re-attested on a cadence — history is append-only",
      "Verification is free forever — no login, no fee",
    ],
    tone: "light",
  },
  {
    kicker: "02  The lie",
    title: "A PDF you cannot recompute.",
    body: "Vendors sell a claim. The evidence is a slide, a badge, or a private report. You cannot run the same test. You cannot see what was left unmeasured. Six months later the model has changed and the PDF has not.",
    points: [
      "A static PDF cannot be recomputed — a signed card can",
      "No n, no confidence interval, no unmeasured cells shown",
      "The model updates; the badge doesn't",
      "Evidence should outlive the vendor who sold it",
    ],
    tone: "ink",
  },
  {
    kicker: "03  The atom",
    title: "A 3KB signed card.",
    body: "We run the system on frozen, published instruments. We sign the result. You keep the card. Anyone can recompute the hash chain in their own browser. The signing key is public.",
    points: [
      "~3KB: scores, n, intervals, hashes, signature",
      "Recompute the hash chain in your own browser",
      "Signing key published — anyone can check it",
      "Anchored to an independent timestamp",
    ],
    href: "/gspc-verify",
    cta: "Verify a card",
    tone: "light",
  },
  {
    kicker: "04  Honest grid",
    title: "13 measured of 14 — including the axis that catches us.",
    body: "Empty cells stay empty. No invented scores. 13 measured axes across 19 models; jail (escape detection, the 14th slot) measured 18 Aug on a smaller fleet, separation untested — it caught our own fine-tune missing every escape, and we published that.",
    points: [
      "13 measured axes across 19 models",
      "Slot 14 — jail: smaller fleet, separation untested, stated",
      "It caught our own fine-tune — and we published it",
      "Ties are ties, never counted as wins",
    ],
    href: "/gspc-scoreboard",
    cta: "Open the board",
    tone: "board",
  },
  {
    kicker: "05  Council Space",
    title: "AI versus AI. Night coverage.",
    body: "Models compete on frozen provisions. Each match is two subjects and one instrument. The verdict is a predicate, not a preference vote. Every round can become a signed card.",
    points: [
      "Two subjects, one frozen instrument per match",
      "Deterministic predicates — never an LLM judging an LLM",
      "Every round can become a signed card",
      "The public feed grows all night",
    ],
    href: "/gspc-arena",
    cta: "Watch Council Space",
    tone: "ink",
  },
  {
    kicker: "06  Colosseum",
    title: "Human versus AI. Day surprise.",
    body: "Three play modes: CITIZEN, MAYOR, RED. A human walks in. The system is measured live. Signed versus unsigned is a promotion gate — unsigned stays practice.",
    points: [
      "Three modes: CITIZEN · MAYOR · RED",
      "Humans probe the system live",
      "Signed vs unsigned is a promotion gate",
      "Unsigned stays practice — never quoted",
    ],
    href: "/gspc-arena",
    cta: "Enter the colosseum",
    tone: "ring",
  },
  {
    kicker: "07  The board",
    title: "13 × 19. Live from the API.",
    body: "Every cell is live from the GSPC API. Empty cells stay empty. n on every row, confidence intervals where the n is honest. Nobody edits yesterday.",
    points: [
      "Every cell live from GET /api/gspc",
      "n on every row; CI where the n is honest",
      "UNMEASURED shown as UNMEASURED — never a zero",
      "Nobody edits yesterday",
    ],
    href: "/gspc-scoreboard",
    cta: "Read the scoreboard",
    tone: "board",
  },
  {
    kicker: "08  Council City",
    title: "The living layer.",
    body: "Cities, towns, sims, clans. Signed events feed the visual mind. The public face is Council City — a place you can walk, not a marketing page.",
    points: [
      "Signed events feed the visual layer",
      "Cities, towns, sims — a world you can walk",
      "Every scene traces back to a receipt",
    ],
    href: "/city",
    cta: "Enter the city",
    tone: "light",
  },
  {
    kicker: "09  Recurrency for AI compliance",
    title: "A new record. Never an edit.",
    body: "AI changes. Law changes. We measure again and issue a delta card. The old card stays. History is append-only. In aviation, a qualification you never revisit is a qualification you can't trust — AI is no different.",
    points: [
      "AI changes; law changes; we measure again",
      "A delta card is issued — the old card stays",
      "Append-only history; frozen is anchored",
      "Corrections are published, never silently edited",
    ],
    href: "/assess",
    cta: "Get measured",
    tone: "ink",
  },
  {
    kicker: "10  Anyone can check",
    title: "No login. No fee to verify.",
    body: "Verification stays free and loginless. We take no money from anything we rank. Measurement credential — never a certification badge.",
    points: [
      "No login, no fee — verification free forever",
      "No money from anything we rank",
      "Measurement credential — never a certification",
      "Check the board, the card and the key yourself",
    ],
    href: "/gspc-verify",
    cta: "Check a card now",
    tone: "light",
  },
];

// The four doors, folded into the hero (the old top banner is gone).
const PERSONAS: { who: string; hook: string; href: string }[] = [
  { who: "Insurers", hook: "price AI risk on signed evidence", href: "/industries/insurance" },
  { who: "Regulators", hook: "check behaviour against the law", href: "/regulators" },
  { who: "Enterprises", hook: "prove your AI before you ship", href: "/start" },
  { who: "Developers", hook: "measure per call on the agent rail", href: "/payg" },
];

function HeroActions() {
  return (
    <>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <a
          href="/gspc-verify"
          className="inline-flex items-center rounded-xl bg-emerald-500 px-6 py-3 text-base font-extrabold text-white shadow-md transition-colors hover:bg-emerald-400"
        >
          Verify a card — free
        </a>
        <a
          href="/gspc-scoreboard"
          className="inline-flex items-center rounded-xl border-2 border-emerald-500/40 px-6 py-3 text-base font-extrabold text-emerald-700 transition-colors hover:bg-emerald-50"
        >
          Open the live board
        </a>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {PERSONAS.map((p) => (
          <a
            key={p.who}
            href={p.href}
            title={p.hook}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-600/25 bg-white/70 px-3 py-1 text-[13px] font-semibold text-emerald-800 transition hover:border-emerald-500 hover:bg-emerald-50"
          >
            {p.who} <span aria-hidden className="text-emerald-500">→</span>
          </a>
        ))}
      </div>
    </>
  );
}

/* ————— per-slide bullet list ————— */
function Points({ points, dark }: { points: string[]; dark: boolean }) {
  return (
    <ul className="mx-auto mt-5 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-1.5 text-left sm:grid-cols-2">
      {points.map((pt) => (
        <li key={pt} className={`flex items-start gap-2 text-[13px] leading-snug ${dark ? "text-emerald-100/80" : "text-gray-600"}`}>
          <svg viewBox="0 0 16 16" className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${dark ? "text-emerald-300" : "text-emerald-500"}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8.5l3.5 3.5L13 4.5" />
          </svg>
          {pt}
        </li>
      ))}
    </ul>
  );
}

/* ————— per-slide infographic (inline SVG, tone-aware, no deps) ————— */
function Infographic({ index, dark }: { index: number; dark: boolean }) {
  const ink = dark ? "#a7f3d0" : "#059669";
  const dim = dark ? "rgba(167,243,208,0.35)" : "rgba(5,150,105,0.35)";
  const bad = dark ? "#fca5a5" : "#ef4444";
  const amber = "#f59e0b";
  const common = { fill: "none", stroke: ink, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (index) {
    case 0: // measure → sign → re-attest → check loop
      return (
        <svg viewBox="0 0 320 90" className="h-20 w-auto sm:h-24" aria-hidden>
          {["Measure", "Sign", "Re-attest", "Check"].map((label, k) => (
            <g key={label} transform={`translate(${18 + k * 78},14)`}>
              <rect width="62" height="40" rx="10" {...common} fill={dark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)"} />
              <text x="31" y="25" textAnchor="middle" fontSize="11" fontWeight="700" fill={ink}>{label}</text>
              {k < 3 && <path d={`M66 20 h8 m-3 -4 l4 4 l-4 4`} {...common} />}
            </g>
          ))}
          <path d="M290 60 q10 22 -130 22 q-140 0 -130 -22" {...common} stroke={dim} strokeDasharray="3 4" />
          <text x="160" y="88" textAnchor="middle" fontSize="9" fill={dim} fontWeight="600">append-only · forever checkable</text>
        </svg>
      );
    case 1: // PDF (dead) vs signed card (live)
      return (
        <svg viewBox="0 0 300 96" className="h-20 w-auto sm:h-24" aria-hidden>
          <g transform="translate(30,10)">
            <rect width="70" height="76" rx="6" {...common} stroke={bad} opacity="0.8" />
            {[16, 28, 40, 52].map((y) => <line key={y} x1="10" x2="60" y1={y} y2={y} stroke={bad} strokeWidth="1.2" opacity="0.4" />)}
            <line x1="8" y1="8" x2="62" y2="68" stroke={bad} strokeWidth="2" />
            <text x="35" y="92" textAnchor="middle" fontSize="9" fill={bad} fontWeight="700">static PDF</text>
          </g>
          <text x="150" y="52" textAnchor="middle" fontSize="13" fontWeight="800" fill={ink}>vs</text>
          <g transform="translate(200,10)">
            <rect width="70" height="76" rx="6" {...common} fill={dark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)"} />
            {[16, 28, 40].map((y) => <line key={y} x1="10" x2="60" y1={y} y2={y} stroke={ink} strokeWidth="1.2" opacity="0.5" />)}
            <path d="M14 60 l6 6 l12 -12" {...common} strokeWidth="2.2" />
            <text x="44" y="66" fontSize="8.5" fill={ink} fontWeight="700">signed</text>
            <text x="35" y="92" textAnchor="middle" fontSize="9" fill={ink} fontWeight="700">3KB card</text>
          </g>
        </svg>
      );
    case 2: // card anatomy
      return (
        <svg viewBox="0 0 300 96" className="h-20 w-auto sm:h-24" aria-hidden>
          <rect x="90" y="6" width="120" height="84" rx="10" {...common} fill={dark ? "rgba(16,185,129,0.07)" : "rgba(16,185,129,0.05)"} />
          {[
            ["scores + n + CI", 26],
            ["sha-256 hash chain", 44],
            ["Ed25519 signature", 62],
            ["timestamp anchor", 80],
          ].map(([label, y]) => (
            <g key={label as string}>
              <circle cx="104" cy={(y as number) - 4} r="2.4" fill={ink} />
              <text x="114" y={y as number} fontSize="9.5" fill={ink} fontWeight="600">{label}</text>
            </g>
          ))}
          <text x="150" y="18" textAnchor="middle" fontSize="9" fill={dim} fontWeight="700">~3KB · yours to keep</text>
        </svg>
      );
    case 3: // 14-slot honest grid
      return (
        <svg viewBox="0 0 300 78" className="h-20 w-auto sm:h-24" aria-hidden>
          {Array.from({ length: 14 }).map((_, k) => {
            const x = 22 + (k % 7) * 38, y = k < 7 ? 10 : 42;
            const jail = k === 13;
            return (
              <g key={k}>
                <rect x={x} y={y} width="30" height="24" rx="5" {...common}
                  stroke={jail ? amber : ink}
                  fill={jail ? "rgba(245,158,11,0.12)" : dark ? "rgba(16,185,129,0.10)" : "rgba(16,185,129,0.08)"} />
                {!jail && <path d={`M${x + 8} ${y + 13} l5 5 l9 -10`} {...common} strokeWidth="2" />}
                {jail && <text x={x + 15} y={y + 16} textAnchor="middle" fontSize="8.5" fontWeight="800" fill={amber}>jail</text>}
              </g>
            );
          })}
          <text x="150" y="76" textAnchor="middle" fontSize="9" fill={dim} fontWeight="600">13 measured · slot 14 stated honestly</text>
        </svg>
      );
    case 4: // AI vs AI predicate
      return (
        <svg viewBox="0 0 300 90" className="h-20 w-auto sm:h-24" aria-hidden>
          <circle cx="70" cy="38" r="20" {...common} />
          <text x="70" y="42" textAnchor="middle" fontSize="10" fontWeight="800" fill={ink}>AI</text>
          <circle cx="230" cy="38" r="20" {...common} />
          <text x="230" y="42" textAnchor="middle" fontSize="10" fontWeight="800" fill={ink}>AI</text>
          <rect x="120" y="20" width="60" height="36" rx="8" {...common} fill={dark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)"} />
          <text x="150" y="35" textAnchor="middle" fontSize="8.5" fontWeight="700" fill={ink}>frozen</text>
          <text x="150" y="47" textAnchor="middle" fontSize="8.5" fontWeight="700" fill={ink}>instrument</text>
          <path d="M92 38 h26 m64 0 h26" {...common} strokeDasharray="3 3" />
          <text x="150" y="80" textAnchor="middle" fontSize="9" fill={dim} fontWeight="600">verdict = deterministic predicate → signed card</text>
        </svg>
      );
    case 5: // human vs AI, 3 modes
      return (
        <svg viewBox="0 0 300 92" className="h-20 w-auto sm:h-24" aria-hidden>
          <g {...common}>
            <circle cx="70" cy="26" r="9" />
            <path d="M70 35 v18 m0 -14 l-11 9 m11 -9 l11 9 m-11 5 l-8 12 m8 -12 l8 12" />
          </g>
          <text x="150" y="45" textAnchor="middle" fontSize="13" fontWeight="800" fill={amber}>vs</text>
          <g {...common}>
            <rect x="212" y="18" width="36" height="28" rx="6" />
            <circle cx="224" cy="32" r="2.4" fill={ink} stroke="none" />
            <circle cx="236" cy="32" r="2.4" fill={ink} stroke="none" />
            <path d="M222 52 h16 m-8 -6 v6" />
          </g>
          {["CITIZEN", "MAYOR", "RED"].map((m, k) => (
            <g key={m} transform={`translate(${72 + k * 56},66)`}>
              <rect width="52" height="18" rx="9" {...common} stroke={m === "RED" ? bad : ink} />
              <text x="26" y="12.5" textAnchor="middle" fontSize="8.5" fontWeight="800" fill={m === "RED" ? bad : ink}>{m}</text>
            </g>
          ))}
        </svg>
      );
    case 6: // 13×19 board
      return (
        <svg viewBox="0 0 300 84" className="h-20 w-auto sm:h-24" aria-hidden>
          {Array.from({ length: 13 }).map((_, c) =>
            Array.from({ length: 6 }).map((_, r) => {
              const empty = (c * 7 + r * 3) % 11 === 0;
              return (
                <rect key={`${c}-${r}`} x={30 + c * 19} y={8 + r * 11} width="15" height="8" rx="2"
                  fill={empty ? "transparent" : dark ? "rgba(52,211,153,0.55)" : "rgba(16,185,129,0.5)"}
                  stroke={empty ? dim : "none"} strokeWidth="0.8" />
              );
            })
          )}
          <text x="150" y="82" textAnchor="middle" fontSize="9" fill={dim} fontWeight="600">13 axes × 19 models · empty cells stay empty</text>
        </svg>
      );
    case 7: // city skyline
      return (
        <svg viewBox="0 0 300 84" className="h-20 w-auto sm:h-24" aria-hidden>
          {[
            [40, 34, 22], [70, 20, 30], [100, 40, 18], [128, 14, 34], [160, 30, 24], [190, 22, 30], [222, 38, 20], [248, 26, 26],
          ].map(([x, y, w], k) => (
            <g key={k}>
              <rect x={x} y={y + 8} width={w} height={64 - y} rx="2" {...common} fill={dark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)"} />
              {Array.from({ length: 3 }).map((_, wk) => (
                <rect key={wk} x={(x as number) + 4 + wk * 6} y={y + 14} width="3" height="3" fill={ink} opacity="0.6" />
              ))}
            </g>
          ))}
          <text x="150" y="82" textAnchor="middle" fontSize="9" fill={dim} fontWeight="600">every scene traces back to a signed event</text>
        </svg>
      );
    case 8: // append-only timeline
      return (
        <svg viewBox="0 0 300 84" className="h-20 w-auto sm:h-24" aria-hidden>
          <line x1="24" y1="42" x2="276" y2="42" stroke={dim} strokeWidth="1.4" />
          {[0, 1, 2, 3].map((k) => (
            <g key={k} transform={`translate(${44 + k * 64},22)`}>
              <rect width="40" height="40" rx="7" {...common} fill={dark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)"} />
              <text x="20" y="18" textAnchor="middle" fontSize="8" fontWeight="800" fill={ink}>{k === 3 ? "vΔ" : `v${k + 1}`}</text>
              <path d="M12 28 l6 6 l12 -12" {...common} strokeWidth="1.8" transform="scale(0.8) translate(5,4)" />
            </g>
          ))}
          <text x="150" y="80" textAnchor="middle" fontSize="9" fill={dim} fontWeight="600">new cards append · old cards never edited</text>
        </svg>
      );
    default: // 9: free verify shield
      return (
        <svg viewBox="0 0 300 92" className="h-20 w-auto sm:h-24" aria-hidden>
          <path d="M150 10 l34 12 v22 c0 20 -14 32 -34 38 c-20 -6 -34 -18 -34 -38 v-22 z" {...common} fill={dark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)"} />
          <path d="M136 46 l10 10 l20 -22" {...common} strokeWidth="2.6" />
          <text x="150" y="90" textAnchor="middle" fontSize="9.5" fill={ink} fontWeight="700">free · loginless · no money from anything we rank</text>
        </svg>
      );
  }
}

/* ————— 3D scroll-world background ————— */
function WorldFX({ p, dark }: { p: number; dark: boolean }) {
  const gridColor = dark ? "rgba(110,231,183,0.5)" : "rgba(5,150,105,0.45)";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ perspective: "900px" }} aria-hidden>
      {/* receding grid floor — rides the scroll */}
      <div
        className="absolute inset-x-[-25%] bottom-[-14%] h-[58%] opacity-[0.13]"
        style={{
          transformOrigin: "center bottom",
          transform: `rotateX(63deg) translateY(${(p * 96) % 48}px)`,
          backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to top, ${gridColor} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          WebkitMaskImage: "linear-gradient(to top, black 30%, transparent 95%)",
          maskImage: "linear-gradient(to top, black 30%, transparent 95%)",
        }}
      />
      {/* slow orbit ring */}
      <div
        className="absolute left-1/2 top-1/2 h-[74vmin] w-[74vmin] rounded-full border"
        style={{
          borderColor: dark ? "rgba(110,231,183,0.14)" : "rgba(5,150,105,0.14)",
          transform: `translate(-50%,-50%) rotateX(${58 + p * 14}deg) rotateZ(${p * 160}deg)`,
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[52vmin] w-[52vmin] rounded-full border border-dashed"
        style={{
          borderColor: dark ? "rgba(110,231,183,0.10)" : "rgba(5,150,105,0.10)",
          transform: `translate(-50%,-50%) rotateX(${58 + p * 14}deg) rotateZ(${-p * 220}deg)`,
        }}
      />
      {/* depth orbs at three parallax rates */}
      <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl"
        style={{ transform: `translate3d(${p * 90}px, ${p * 46}px, 0) scale(${1 + p * 0.15})` }} />
      <div className="absolute -right-16 bottom-10 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl"
        style={{ transform: `translate3d(${-p * 70}px, ${-p * 34}px, 0)` }} />
      <div className="absolute left-1/3 top-1/4 h-40 w-40 rounded-full bg-teal-300/10 blur-2xl"
        style={{ transform: `translate3d(${p * 140}px, ${-p * 60}px, 0)` }} />
    </div>
  );
}

const TONE: Record<Tone, string> = {
  light: "bg-gradient-to-b from-emerald-50 via-white to-white text-gray-900",
  ink: "bg-[#06140f] text-emerald-50",
  ring: "bg-gradient-to-b from-[#1a1206] via-[#0d0a06] to-black text-amber-50",
  board: "bg-[#07130e] text-emerald-50",
};

function SlideFace({ slide, index, active }: { slide: Slide; index: number; active: boolean }) {
  const dark = slide.tone !== "light";
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center transition-opacity duration-500 ${
        active ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!active}
    >
      <div className="hidden sm:block">
        <Infographic index={index} dark={dark} />
      </div>
      <span className={`mt-3 text-xs font-bold uppercase tracking-[0.22em] ${
        slide.tone === "light" ? "text-emerald-600" : "text-emerald-300/80"
      }`}>
        {slide.kicker}
      </span>
      {index === 0 ? (
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[1.08] sm:text-5xl lg:text-6xl">
          We measure.<br />
          We sign.<br />
          We re-attest.<br />
          <span className="text-emerald-500">Everyone can check.</span>
        </h1>
      ) : (
        <h2 className="mt-4 max-w-4xl text-4xl font-black leading-[1.08] sm:text-5xl lg:text-6xl">
          {slide.title}
        </h2>
      )}
      <p className={`mt-4 max-w-2xl text-base leading-relaxed sm:text-lg ${
        slide.tone === "light" ? "text-gray-500" : "text-emerald-100/75"
      }`}>
        {slide.body}
      </p>
      {slide.points && <Points points={slide.points} dark={dark} />}
      {index === 0 && <HeroActions />}
      {slide.href && slide.cta && (
        <a
          href={slide.href}
          className={`mt-6 inline-flex items-center rounded-xl px-6 py-3 text-base font-extrabold shadow-md transition-colors ${
            slide.tone === "ring"
              ? "bg-amber-400 text-gray-900 hover:bg-amber-300"
              : "bg-emerald-500 text-white hover:bg-emerald-400"
          }`}
        >
          {slide.cta}
        </a>
      )}
    </div>
  );
}

function Stacked() {
  return (
    <div>
      {STORY.map((slide, i) => {
        const dark = slide.tone !== "light";
        return (
          <section key={slide.kicker} className={`relative min-h-[80vh] ${TONE[slide.tone]}`}>
            <div className="relative mx-auto flex min-h-[80vh] max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
              <div className="hidden sm:block">
                <Infographic index={i} dark={dark} />
              </div>
              <span className={`mt-3 text-xs font-bold uppercase tracking-[0.22em] ${
                slide.tone === "light" ? "text-emerald-600" : "text-emerald-300/80"
              }`}>{slide.kicker}</span>
              {i === 0 ? (
                <h1 className="mt-4 text-4xl font-black leading-[1.08] sm:text-5xl">
                  We measure.<br />We sign.<br />We re-attest.<br />
                  <span className="text-emerald-500">Everyone can check.</span>
                </h1>
              ) : (
                <h2 className="mt-4 text-4xl font-black leading-[1.08] sm:text-5xl">{slide.title}</h2>
              )}
              <p className={`mt-4 max-w-2xl text-lg ${slide.tone === "light" ? "text-gray-500" : "text-emerald-100/75"}`}>{slide.body}</p>
              {slide.points && <Points points={slide.points} dark={dark} />}
              {i === 0 && <HeroActions />}
              {slide.href && slide.cta && (
                <a href={slide.href} className="mt-6 inline-flex rounded-xl bg-emerald-500 px-6 py-3 font-extrabold text-white">{slide.cta}</a>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function StoryWorld() {
  const pin = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [p, setP] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const onScroll = () => {
      const el = pin.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const raw = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total));
      setP(raw);
      setI(Math.min(STORY.length - 1, Math.floor(raw * STORY.length * 0.999)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduce]);

  if (reduce) return <Stacked />;

  const slide = STORY[i];
  const dark = slide.tone !== "light";

  return (
    <div ref={pin} className="relative" style={{ height: `${STORY.length * 100}vh` }}>
      <div className={`sticky top-0 h-screen overflow-hidden ${TONE[slide.tone]}`}>
        <WorldFX p={p} dark={dark} />
        {STORY.map((s, idx) => (
          <SlideFace key={s.kicker} slide={s} index={idx} active={idx === i} />
        ))}
        <div className="absolute right-5 top-1/2 hidden -translate-y-1/2 flex-col gap-2 sm:flex" aria-hidden>
          {STORY.map((s, idx) => (
            <span
              key={s.kicker}
              className={`h-2 w-2 rounded-full ${idx === i ? "bg-emerald-400 scale-125" : "bg-white/30"}`}
            />
          ))}
        </div>
        <div className="absolute bottom-6 left-0 right-0 px-8">
          <div className="mx-auto h-px max-w-xl bg-white/10">
            <div className="h-px bg-emerald-400" style={{ width: `${((i + 1) / STORY.length) * 100}%` }} />
          </div>
          <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-300/70">
            {String(i + 1).padStart(2, "0")} / {String(STORY.length).padStart(2, "0")}  ·  scroll the world
          </p>
        </div>
      </div>
    </div>
  );
}
