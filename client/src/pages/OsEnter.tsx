import { useEffect, useState } from "react";

// CSOAI World — the immersive sovereign load-up. The OS opens by locating your
// sovereign node in the real world, then draws you into the CSOAI world:
// Sovereign Town, the Sovereign Council, your digital self. Choose your
// hemisphere (govern / explore) and enter. CSOAI-branded, gamified, fluid.

type Loc = { city: string; country: string; lat: number; lon: number };

export default function OsEnter() {
  const [phase, setPhase] = useState(0); // 0 boot, 1 locate, 2 world, 3 choose
  const [loc, setLoc] = useState<Loc | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    document.title = "Enter the CSOAI World";
    const boot = setTimeout(() => setPhase(1), 1500);
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d.latitude === "number") {
          setLoc({ city: d.city || "Unknown", country: d.country_name || "", lat: d.latitude, lon: d.longitude });
        } else setErr(true);
      })
      .catch(() => setErr(true));
    return () => clearTimeout(boot);
  }, []);

  useEffect(() => {
    if (phase === 1 && (loc || err)) {
      const t = setTimeout(() => setPhase(2), 2000);
      return () => clearTimeout(t);
    }
  }, [phase, loc, err]);

  const lat = loc ? loc.lat : 20;
  const lon = loc ? loc.lon : 0;
  const dd = 0.05;
  const bbox = (lon - dd) + "," + (lat - dd) + "," + (lon + dd) + "," + (lat + dd);
  const mapUrl = "https://www.openstreetmap.org/export/embed.html?bbox=" + bbox + "&layer=mapnik&marker=" + lat + "," + lon;
  const place = loc ? [loc.city, loc.country].filter(Boolean).join(", ") : "the Sovereign Grid";

  const aurora = { background: "radial-gradient(900px 520px at 50% -10%, rgba(16,185,129,.20), transparent 60%), radial-gradient(700px 520px at 85% 115%, rgba(45,212,191,.16), transparent 60%)" };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04070d] text-[#e7f6ef]">
      <div className="pointer-events-none absolute inset-0" style={aurora} />

      {/* BOOT */}
      {phase === 0 && (
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-emerald-500/20 animate-ping absolute inset-0" />
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10 text-3xl font-black text-emerald-300">C</div>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70 animate-pulse">Initializing CSOAI Sovereign OS</div>
        </div>
      )}

      {/* LOCATE */}
      {phase === 1 && (
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
          <div className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
          <div className="font-mono text-sm text-emerald-200/80">Establishing sovereign link{loc || err ? " complete" : "..."}</div>
          {(loc || err) && (
            <div className="mt-2 rounded-2xl border border-emerald-400/30 bg-white/5 px-6 py-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60">Sovereign node located</div>
              <div className="mt-1 text-xl font-bold text-emerald-200">{loc ? "\u25C9 " + place : "\u25C9 the Sovereign Grid"}</div>
            </div>
          )}
        </div>
      )}

      {/* WORLD */}
      {phase === 2 && (
        <div className="relative z-10 min-h-screen">
          <iframe title="Your sovereign location" src={mapUrl} className="absolute inset-0 h-full w-full opacity-50" style={{ filter: "grayscale(0.3) saturate(1.2) hue-rotate(95deg) brightness(0.7)", border: "0" }} />
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 60% at 50% 45%, transparent, rgba(4,7,13,.86) 78%)" }} />
          <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
            <div className="relative mb-6">
              <div className="h-16 w-16 rounded-full bg-emerald-400/30 animate-ping absolute inset-0" />
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300/50 bg-emerald-500/15 text-2xl">{"\u25C9"}</div>
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/70">This is where you stand</div>
            <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">{place}</h1>
            <p className="mt-4 max-w-md text-emerald-50/75">Your sovereign node is on the grid. Step in from the real world into the CSOAI world — Sovereign Town, the Council, and your digital self.</p>
            <button onClick={() => setPhase(3)} className="mt-7 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-[#03110b] hover:bg-emerald-400 transition">Enter the CSOAI world {"\u2192"}</button>
          </div>
        </div>
      )}

      {/* CHOOSE HEMISPHERE */}
      {phase === 3 && (
        <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/70">Choose your hemisphere</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">How will you enter the CSOAI world?</h2>
          <p className="mt-3 max-w-xl text-emerald-50/70">Your sovereign self can lead with either mind. You can switch any time inside the OS.</p>
          <div className="mt-8 grid w-full gap-4 sm:grid-cols-2">
            <a href="/command-center" className="group rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-500/15 to-sky-400/5 p-6 text-left transition hover:scale-[1.02]">
              <div className="text-3xl">{"\u25D0"}</div>
              <div className="mt-3 text-lg font-bold text-white">Left brain {"\u2014"} Govern</div>
              <p className="mt-1 text-sm text-emerald-50/70">Command Center, compliance, evidence, certification. Structure, proof, control.</p>
              <div className="mt-4 text-sm font-semibold text-sky-300 opacity-0 transition group-hover:opacity-100">Enter governance {"\u2192"}</div>
            </a>
            <a href="/sovereign-town" className="group rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 to-teal-400/5 p-6 text-left transition hover:scale-[1.02]">
              <div className="text-3xl">{"\u25D1"}</div>
              <div className="mt-3 text-lg font-bold text-white">Right brain {"\u2014"} Explore</div>
              <p className="mt-1 text-sm text-emerald-50/70">Sovereign Town, the living globe, frameworks, the Council. Discovery, vision, flow.</p>
              <div className="mt-4 text-sm font-semibold text-emerald-300 opacity-0 transition group-hover:opacity-100">Enter Sovereign Town {"\u2192"}</div>
            </a>
          </div>
          <a href="/os" className="mt-8 rounded-xl border border-emerald-400/40 px-6 py-3 text-sm font-semibold text-emerald-100 hover:bg-white/5 transition">Or open the full OS {"\u2192"}</a>
          <div className="mt-6 font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/40">Sovereign Town is learning {"\u00B7"} accumulating {"\u00B7"} spawning {"\u00B7"} on one signed Layer 0 floor</div>
        </div>
      )}

      {/* skip */}
      {phase < 2 && (
        <a href="/os" className="absolute bottom-5 right-6 z-20 font-mono text-[11px] text-emerald-300/50 hover:text-emerald-300">skip {"\u2192"}</a>
      )}
    </div>
  );
}
