import { useEffect, useState } from "react";
import { detectLocale, type Locale } from "../lib/locale";

// Region-aware strip: detects where the visitor is and shows the governance regime
// that actually applies there, greeted in their language. "Loads local."
export default function RegionBanner() {
  const [loc, setLoc] = useState<Locale | null>(null);
  useEffect(() => { setLoc(detectLocale()); }, []);
  if (!loc) return null;
  const r = loc.region;
  return (
    <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-emerald-400/25 bg-gradient-to-b from-emerald-500/[0.08] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/60">detected · {r.label}</span>
        <span className="text-sm font-semibold text-emerald-100">{loc.greeting}</span>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-emerald-100/80">{r.note}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wide text-emerald-300/45">applies here:</span>
        {r.frameworks.map((f) => <span key={f} className="rounded-full bg-black/40 px-2.5 py-0.5 font-mono text-[10px] text-emerald-300/75">{f}</span>)}
        <a href="/assess" className="ml-auto rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-[#03110b] hover:bg-emerald-400">Free assessment for {r.label} →</a>
      </div>
    </div>
  );
}
