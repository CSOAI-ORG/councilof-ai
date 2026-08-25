import { useEffect, useState } from "react";
import AISystemNotice from "../components/AISystemNotice";

// CSOAI World — the immersive sovereign load-up. Login locates your node in the
// real world, then the CSOAI world greets you ALREADY KNOWING your jurisdiction:
// the regulations + crosswalks that apply, pre-loaded scenarios for your region,
// and a Sovereign ready to help automatically (no setup or training required).

type Loc = { city: string; country: string; cc: string; lat: number; lon: number };

const EU = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"];

function jurisdiction(cc: string): { region: string; fw: string[] } {
  if (EU.indexOf(cc) >= 0) return { region: "European Union", fw: ["EU AI Act", "GDPR", "ISO 42001"] };
  const map: Record<string, { region: string; fw: string[] }> = {
    GB: { region: "United Kingdom", fw: ["UK GDPR", "ICO guidance", "ISO 42001"] },
    US: { region: "United States", fw: ["NIST AI RMF", "State AI laws", "ISO 42001"] },
    CA: { region: "Canada", fw: ["AIDA", "PIPEDA", "ISO 42001"] },
    AU: { region: "Australia", fw: ["AI Ethics Principles", "Privacy Act", "ISO 42001"] },
    CN: { region: "China", fw: ["TC260", "PIPL", "Algorithm rules"] },
    SG: { region: "Singapore", fw: ["Model AI Governance", "PDPA", "ISO 42001"] },
    JP: { region: "Japan", fw: ["METI Guidelines", "APPI", "ISO 42001"] },
    IN: { region: "India", fw: ["DPDPA", "MeitY advisories", "ISO 42001"] },
    BR: { region: "Brazil", fw: ["LGPD", "PL 2338 AI Act", "ISO 42001"] },
    AE: { region: "United Arab Emirates", fw: ["UAE AI Charter", "PDPL", "ISO 42001"] },
  };
  return map[cc] || { region: "Global", fw: ["ISO 42001", "NIST AI RMF", "OECD AI Principles"] };
}

export default function OsEnter() {
  const [phase, setPhase] = useState(0);
  const [loc, setLoc] = useState<Loc | null>(null);
  const [err, setErr] = useState(false);
  const [deltas, setDeltas] = useState<any[]>([]);

  useEffect(() => {
    document.title = "Enter the CSOAI World";
    const boot = setTimeout(() => setPhase(1), 1500);
    fetch("https://raw.githubusercontent.com/CSOAI-ORG/csoai-dashboard/main/client/public/data/regulation-deltas.json", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setDeltas(d.slice(-40).reverse()); })
      .catch(() => {});
    // Ship gate (audit P1-2): no third-party IP geolocation on public surfaces.
    // Open on a neutral global view; the visitor picks a region manually if they want one.
    setLoc({ city: "Global", country: "", cc: "", lat: 20, lon: 0 });
    return () => clearTimeout(boot);
  }, []);

  useEffect(() => {
    if (phase === 1 && (loc || err)) { const t = setTimeout(() => setPhase(2), 2000); return () => clearTimeout(t); }
  }, [phase, loc, err]);

  const lat = loc ? loc.lat : 20, lon = loc ? loc.lon : 0, dd = 0.05;
  const bbox = (lon - dd) + "," + (lat - dd) + "," + (lon + dd) + "," + (lat + dd);
  const mapUrl = "https://www.openstreetmap.org/export/embed.html?bbox=" + bbox + "&layer=mapnik&marker=" + lat + "," + lon;
  const place = loc ? [loc.city, loc.country].filter(Boolean).join(", ") : "the Council Grid";
  const jur = jurisdiction(loc ? loc.cc : "");
  const aurora = { background: "radial-gradient(900px 520px at 50% -10%, rgba(16,185,129,.20), transparent 60%), radial-gradient(700px 520px at 85% 115%, rgba(45,212,191,.16), transparent 60%)" };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04070d] text-[#e7f6ef]">
      <AISystemNotice route="/os-demo" />
      <div className="pointer-events-none absolute inset-0" style={aurora} />

      {phase === 0 && (
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-emerald-500/20 animate-ping absolute inset-0" />
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10 text-3xl font-black text-emerald-300">C</div>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70 animate-pulse">Initializing CSOAI Council OS</div>
        </div>
      )}

      {phase === 1 && (
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
          <div className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
          <div className="font-mono text-sm text-emerald-200/80">Establishing Council link{loc || err ? " complete" : "..."}</div>
          {(loc || err) && (
            <div className="mt-2 rounded-2xl border border-emerald-400/30 bg-white/5 px-6 py-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60">Council node located</div>
              <div className="mt-1 text-xl font-bold text-emerald-200">{"\u25c9 " + place}</div>
            </div>
          )}
        </div>
      )}

      {phase === 2 && (
        <div className="relative z-10 min-h-screen">
          <iframe title="Your Council location" src={mapUrl} className="absolute inset-0 h-full w-full opacity-40" style={{ filter: "grayscale(0.3) saturate(1.2) hue-rotate(95deg) brightness(0.7)", border: "0" }} />
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 70% at 50% 40%, transparent, rgba(4,7,13,.9) 80%)" }} />
          <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-12 text-center">
            <div className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/70">This is where you stand</div>
            <h1 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight">{place}</h1>

            <div className="mt-6 w-full rounded-2xl border border-emerald-400/25 bg-white/[0.04] p-5 text-left">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60">Your Council assistant already knows your jurisdiction</div>
              <div className="mt-1 text-lg font-bold text-emerald-100">{jur.region}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {jur.fw.map((f) => (
                  <span key={f} className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">{f}</span>
                ))}
              </div>
              <p className="mt-3 text-[13px] leading-snug text-emerald-50/70">Pre-loaded: the regulations and crosswalks that apply to you, with sample scenarios for your region on Council Town. No setup, no training required {"\u2014"} your Council assistant helps automatically. Prefer to learn? Immersive courses are inside.</p>
              <div className="mt-4 border-t border-emerald-400/15 pt-3">
                <div className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/50">Live regulation pulse \u00b7 synced from the grid</div>
                {deltas.length === 0 ? (
                  <div className="mt-1 text-[12px] text-emerald-50/50">Syncing the latest moves\u2026</div>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {deltas.slice(0, 3).map((d, i) => (
                      <li key={i} className="text-[12px] leading-snug text-emerald-50/75"><span className="font-semibold text-emerald-300/80">{d.frameworkSlug || d.kind || "update"}</span> \u00b7 {d.summary}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-6 flex w-full flex-wrap justify-center gap-3">
              <a href="/command-center" className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-[#03110b] hover:bg-emerald-400 transition">Talk to your Council assistant {"\u2192"}</a>
              <a href="/evidence-rail" className="rounded-xl border border-emerald-400/40 px-6 py-3 text-sm font-semibold text-emerald-100 hover:bg-white/5 transition">Connect your stack {"\u2192"}</a>
            </div>
            <button onClick={() => setPhase(3)} className="mt-5 font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60 hover:text-emerald-300">Or choose how you enter {"\u2193"}</button>
          </div>
        </div>
      )}

      {phase === 3 && (
        <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/70">Choose your hemisphere</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">How will you enter the CSOAI world?</h2>
          <p className="mt-3 max-w-xl text-emerald-50/70">Your Council self can lead with either mind. Switch any time inside the OS.</p>
          <div className="mt-8 grid w-full gap-4 sm:grid-cols-2">
            <a href="/command-center" className="group rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-500/15 to-sky-400/5 p-6 text-left transition hover:scale-[1.02]">
              <div className="text-3xl">{"\u25d0"}</div>
              <div className="mt-3 text-lg font-bold text-white">Left brain {"\u2014"} Govern</div>
              <p className="mt-1 text-sm text-emerald-50/70">Command Center, compliance, evidence, certification. Structure, proof, control.</p>
            </a>
            <a href="/gspc-arena?view=towns" className="group rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 to-teal-400/5 p-6 text-left transition hover:scale-[1.02]">
              <div className="text-3xl">{"\u25d1"}</div>
              <div className="mt-3 text-lg font-bold text-white">Right brain {"\u2014"} Explore</div>
              <p className="mt-1 text-sm text-emerald-50/70">Council Town, the real-world globe, frameworks, the Council. Discovery, vision, flow.</p>
            </a>
          </div>
          <a href="/?lobby=home" className="mt-8 rounded-xl border border-emerald-400/40 px-6 py-3 text-sm font-semibold text-emerald-100 hover:bg-white/5 transition">Or open the full OS {"\u2192"}</a>
          <div className="mt-6 font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/40">Council Town is learning {"\u00b7"} accumulating {"\u00b7"} spawning {"\u00b7"} on one signed Layer 0 floor</div>
        </div>
      )}

      {phase < 2 && (
        <a href="/?lobby=home" className="absolute bottom-5 right-6 z-20 font-mono text-[11px] text-emerald-300/50 hover:text-emerald-300">skip {"\u2192"}</a>
      )}
    </div>
  );
}
