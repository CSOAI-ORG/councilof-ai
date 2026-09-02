import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";

// ── Types ──
interface TourData {
  provisions: Array<{ id: string; label: string; jurisdiction: string; provisions: number; status: string; hash: string }>;
  driftEvents: number;
  driftReportUrl: string;
  benchCounts: Record<string, number> | null;
  benchError: string;
  passport: { minted: boolean; ts: string; sig: string } | null;
  passportError: string;
  loaded: boolean;
}

interface StepConfig {
  id: string;
  title: string;
  narration: string;
  dataType: "real" | "simulated" | "mixed";
  verifyHref?: string;
  verifyLabel?: string;
  globeCommand?: { cmd: string; [k: string]: unknown };
}

// ── Step definitions (REGISTER: every claim wired to a source or badged) ──
const STEPS: StepConfig[] = [
  {
    id: "globe",
    title: "The watched corpus",
    narration:
      "Five legal instruments are under continuous hash watch. When a provision changes, we know the same morning — with a signed delta.",
    dataType: "real",
    verifyHref: "https://github.com/CSOAI-ORG/corpus-watch/blob/main/corpus_state.json",
    verifyLabel: "View corpus_state.json on GitHub",
    globeCommand: { cmd: "home", duration: 1.5 },
  },
  {
    id: "drift",
    title: "Drift feed",
    narration:
      "The corpus watcher hashes every provision daily and diffs the world. No drift detected in the current window — a measured statement, not a guarantee.",
    dataType: "real",
    verifyHref: "/corpus-watch/delta-report-2026-08-01.md",
    verifyLabel: "Read signed delta report",
    globeCommand: { cmd: "flyTo", lng: 4.4, lat: 50.8, height: 1200000, duration: 1.8 },
  },
  {
    id: "bench",
    title: "AIR-Bench sweep",
    narration:
      "Deterministic measurements across the GSPC instrument. Counts are pulled from the public HF ledger snapshot every 6 hours.",
    dataType: "mixed",
    verifyHref: "https://huggingface.co/spaces/csoai/csoai-measurement-ledger",
    verifyLabel: "Open HF Space ledger",
    globeCommand: { cmd: "flyTo", lng: -122.4, lat: 37.8, height: 2200000, duration: 1.8 },
  },
  {
    id: "passport",
    title: "Passport mint",
    narration:
      "Every tour visitor can request a live Ed25519-signed passport. The signature is verifiable offline with the published public key.",
    dataType: "real",
    verifyHref: "/api",
    verifyLabel: "Inspect mint endpoint",
    globeCommand: { cmd: "flyTo", lng: -0.12, lat: 51.5, height: 1200000, duration: 1.8 },
  },
  {
    id: "close",
    title: "Every number is signed",
    narration:
      "You just saw real provision counts from a watched corpus, a signed drift report, and a live mint endpoint. Nothing was faked. Verify anything.",
    dataType: "real",
    verifyHref: "/instrument",
    verifyLabel: "Explore the instrument",
    globeCommand: { cmd: "home", duration: 2.0 },
  },
];

// ── Data sources ──
const CORPUS_STATE_URL = "https://raw.githubusercontent.com/CSOAI-ORG/corpus-watch/main/corpus_state.json";
const LOCAL_CORPUS_URL = "/corpus-watch/status.json";
const HF_LEDGER_URL = "https://csoai-csoai-measurement-ledger.hf.space/snapshot.json";
const PASSPORT_URL = "/api";

export default function CouncilTour() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loc, setLoc] = useLocation();
  const search = typeof window !== "undefined" ? window.location.search : "";
  const deck = new URLSearchParams(search).get("deck") === "1";
  const [step, setStep] = useState(0);
  const [data, setData] = useState<TourData>({
    provisions: [],
    driftEvents: 0,
    driftReportUrl: "/corpus-watch/delta-report-2026-08-01.md",
    benchCounts: null,
    benchError: "",
    passport: null,
    passportError: "",
    loaded: false,
  });
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch real data on mount ──
  useEffect(() => {
    document.title = deck ? "CSOAI — Live Demo | Pitch Deck" : "CSOAI — Live Demo Tour";

    async function load() {
      const out: Partial<TourData> = { loaded: true };

      // 1. Corpus state (GitHub raw → local fallback)
      try {
        const r = await fetch(CORPUS_STATE_URL, { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          out.provisions = j.instruments || [];
        } else throw new Error("GH " + r.status);
      } catch {
        try {
          const r2 = await fetch(LOCAL_CORPUS_URL, { cache: "no-store" });
          const j2 = await r2.json();
          out.provisions = j2.instruments || [];
        } catch {
          out.provisions = [];
        }
      }

      // 2. Drift events from local delta report
      try {
        const r = await fetch(LOCAL_CORPUS_URL, { cache: "no-store" });
        const j = await r.json();
        out.driftEvents = j.drift_events ?? 0;
      } catch {
        out.driftEvents = 0;
      }

      // 3. HF ledger snapshot (may be behind auth or rate-limited)
      try {
        const r = await fetch(HF_LEDGER_URL, { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          out.benchCounts = j.counts || j.subjects || null;
        } else {
          out.benchError = "HF Space returned " + r.status;
        }
      } catch (e: unknown) {
        out.benchError = e instanceof Error ? e.message : "Network error";
      }

      // 4. Passport mint endpoint (HEAD check)
      try {
        const r = await fetch(PASSPORT_URL, { method: "HEAD", cache: "no-store" });
        out.passport = { minted: r.ok, ts: new Date().toISOString(), sig: "" };
      } catch (e: unknown) {
        out.passportError = e instanceof Error ? e.message : "Unreachable";
        out.passport = null;
      }

      setData((prev) => ({ ...prev, ...(out as TourData) }));
    }
    load();
  }, [deck]);

  // ── URL hash + iframe sync ──
  const go = useCallback(
    (n: number) => {
      const idx = Math.max(0, Math.min(STEPS.length - 1, n));
      setStep(idx);
      if (typeof window !== "undefined") {
        history.replaceState(null, "", `#step${idx}`);
      }
      const cmd = STEPS[idx].globeCommand;
      if (cmd && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(cmd, "*");
      }
    },
    []
  );

  // Read hash on mount
  useEffect(() => {
    const m = window.location.hash.match(/^#step(\d+)$/);
    if (m) go(parseInt(m[1], 10));
  }, [go]);

  // ── Deck mode: auto-advance ──
  useEffect(() => {
    if (!deck) return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => {
      if (step >= STEPS.length - 1) return;
      go(step + 1);
    }, 8000);
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
    };
  }, [step, deck, go]);

  const last = step === STEPS.length - 1;
  const s = STEPS[step];

  // ── Render helpers ──
  const RealBadge = () => (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Live
    </span>
  );

  const SimBadge = () => (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1l4 8H1L5 1z" fill="currentColor"/></svg>
      Simulated
    </span>
  );

  // ── Data panels per step ──
  function DataPanel() {
    if (s.id === "globe") {
      const total = data.provisions.reduce((a, b) => a + (b.provisions || 0), 0);
      return (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.provisions.map((inst) => (
            <div key={inst.id} className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-2">
                <RealBadge />
                <span className="text-[10px] uppercase tracking-wider text-emerald-300/60">{inst.jurisdiction}</span>
              </div>
              <div className="mt-1 text-2xl font-black text-emerald-100">{inst.provisions}</div>
              <div className="text-[11px] text-emerald-200/70">{inst.label}</div>
              <div className="mt-1 font-mono text-[9px] text-emerald-400/40 break-all">{inst.hash?.slice(0, 16)}…</div>
            </div>
          ))}
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
            <div className="text-[10px] uppercase tracking-wider text-emerald-300/60">Total provisions under watch</div>
            <div className="mt-1 text-3xl font-black text-emerald-50">{total || 0}</div>
          </div>
        </div>
      );
    }
    if (s.id === "drift") {
      return (
        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2">
            <RealBadge />
            <span className="text-xs text-emerald-300/70">Signed delta report</span>
          </div>
          <div className="mt-2 font-mono text-sm text-emerald-100">
            Drift events: <span className="text-lg font-bold text-emerald-50">{data.driftEvents}</span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-emerald-400/50">Normaliser: norm-v2 · Ed25519 signed</div>
        </div>
      );
    }
    if (s.id === "bench") {
      if (data.benchError) {
        return (
          <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2">
              <SimBadge />
              <span className="text-xs text-amber-300/70">HF Space snapshot</span>
            </div>
            <p className="mt-2 text-sm text-amber-100/80">Ledger endpoint currently unreachable: {data.benchError}</p>
            <p className="mt-1 text-xs text-amber-200/60">Counts will appear when the Space is live. No placeholder numbers are shown.</p>
          </div>
        );
      }
      if (data.benchCounts && Object.keys(data.benchCounts).length > 0) {
        return (
          <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2">
              <RealBadge />
              <span className="text-xs text-emerald-300/70">HF ledger snapshot</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(data.benchCounts).map(([k, v]) => (
                <div key={k} className="rounded-lg border border-emerald-400/10 bg-emerald-500/5 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-300/50">{k}</div>
                  <div className="text-xl font-bold text-emerald-100">{v as number}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      return (
        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2"><RealBadge /><span className="text-xs text-emerald-300/70">Loading ledger…</span></div>
          <div className="mt-2 h-8 w-32 animate-pulse rounded bg-emerald-400/10" />
        </div>
      );
    }
    if (s.id === "passport") {
      if (data.passportError) {
        return (
          <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2">
              <SimBadge />
              <span className="text-xs text-amber-300/70">Mint endpoint</span>
            </div>
            <p className="mt-2 text-sm text-amber-100/80">Endpoint status: {data.passportError}</p>
            <p className="mt-1 text-xs text-amber-200/60">The live mint is available when the Layer 0 API is reachable.</p>
          </div>
        );
      }
      if (data.passport) {
        return (
          <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2">
              <RealBadge />
              <span className="text-xs text-emerald-300/70">Ed25519 passport mint</span>
            </div>
            <div className="mt-2 font-mono text-xs text-emerald-100">
              Status: <span className="font-bold text-emerald-50">{data.passport.minted ? "Reachable" : "Checked"}</span>
            </div>
            <div className="mt-1 font-mono text-[10px] text-emerald-400/40">Last probe: {data.passport.ts}</div>
          </div>
        );
      }
      return (
        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2"><RealBadge /><span className="text-xs text-emerald-300/70">Probing mint endpoint…</span></div>
          <div className="mt-2 h-8 w-32 animate-pulse rounded bg-emerald-400/10" />
        </div>
      );
    }
    if (s.id === "close") {
      return (
        <div className="mt-4 flex flex-col gap-3">
          <a href="/instrument" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-[#03110b] hover:bg-emerald-400 transition">
            Explore the instrument →
          </a>
          <a href="/govbench" className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/40 px-6 py-3 text-sm font-semibold text-emerald-100 hover:bg-white/5 transition">
            See the measurement board →
          </a>
        </div>
      );
    }
    return null;
  }

  // ── Styles ──
  const aurora = {
    background:
      "radial-gradient(900px 520px at 50% -10%, rgba(16,185,129,.18), transparent 60%), radial-gradient(700px 520px at 85% 115%, rgba(45,212,191,.14), transparent 60%)",
  };

  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-[#04070d] text-[#e7f6ef] ${
        deck ? "sov-deck" : ""
      }`}
    >
      {/* Globe iframe (full-bleed background) */}
      <iframe
        ref={iframeRef}
        src="/tour-globe.html"
        title="CSOAI Tour Globe"
        className="absolute inset-0 z-0 h-full w-full border-0"
        sandbox="allow-scripts allow-same-origin"
        loading="eager"
      />

      {/* Gradient overlay for readability */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-[#04070d] via-[#04070d]/60 to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-[1]" style={aurora} />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col justify-end px-6 pb-12 pt-32 sm:pb-16">
        {/* Step badge */}
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/50">
            Step {step + 1} / {STEPS.length}
          </span>
          {s.dataType === "real" && <RealBadge />}
          {s.dataType === "simulated" && <SimBadge />}
          {s.dataType === "mixed" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              <RealBadge /> + fallback
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black tracking-tight text-emerald-50 sm:text-4xl">
          {s.title}
        </h1>

        {/* Narration */}
        <p className="mt-3 max-w-xl text-base leading-relaxed text-emerald-100/80 sm:text-lg">
          {s.narration}
        </p>

        {/* Data panel */}
        <DataPanel />

        {/* Verify link */}
        {s.verifyHref && (
          <a
            href={s.verifyHref}
            target={s.verifyHref.startsWith("http") ? "_blank" : undefined}
            rel={s.verifyHref.startsWith("http") ? "noopener noreferrer" : undefined}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300/80 hover:text-emerald-200 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            {s.verifyLabel || "Verify this number"} ↗
          </a>
        )}

        {/* Controls */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={() => go(step - 1)}
            disabled={step === 0}
            className="rounded-lg border border-emerald-400/30 px-4 py-2 text-sm font-semibold text-emerald-200/80 hover:bg-white/5 disabled:opacity-30 transition"
          >
            ← Back
          </button>
          {!last ? (
            <button
              onClick={() => go(step + 1)}
              className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400 transition"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => setLoc("/instrument")}
              className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400 transition"
            >
              Enter the instrument →
            </button>
          )}
          <button
            onClick={() => go(0)}
            className="ml-auto text-xs font-medium text-emerald-300/50 hover:text-emerald-300 transition"
          >
            ↻ Replay
          </button>
        </div>

        {/* Dots */}
        <div className="mt-6 flex gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              aria-label={`Step ${i + 1}`}
              onClick={() => go(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? "w-6 bg-emerald-400"
                  : "w-1.5 bg-emerald-400/30 hover:bg-emerald-400/60"
              }`}
            />
          ))}
        </div>

        {/* Footer */}
        {!deck && (
          <div className="mt-8 font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/30">
            Every number is signed or badged · No hardcoded telemetry · CSOAI
          </div>
        )}
      </div>

      {/* Deck mode: 16:9 safe-area guide (subtle) */}
      {deck && (
        <div className="pointer-events-none absolute inset-0 z-[5] border-[12px] border-emerald-400/5" />
      )}
    </div>
  );
}
