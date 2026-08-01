/**
 * SpotInfographic — Lane 4 house infographic (2026-08-01).
 * Brand: dramatic 45° spotlight, emerald on white, dependency-free (same school
 * as BrandGraphics.tsx — custom SVG/CSS, no stock imagery).
 *
 * Every stat carries an evidence chip: MEASURED (traces to a signed artefact)
 * or DESIGN (a target, not a claim). The caption names the source + date.
 * An empty honest slot beats a full suspect one — pass fewer stats rather
 * than unverifiable ones.
 */

export type SpotStat = {
  value: string;
  label: string;
  evidence: "measured" | "design";
};

export default function SpotInfographic({
  title,
  stats,
  source,
  className = "",
}: {
  title: string;
  stats: SpotStat[];
  source: string; // e.g. "corpus-watch baseline, 2026-08-01"
  className?: string;
}) {
  return (
    <section className={`py-16 ${className}`}>
      <div className="container max-w-5xl">
        <div
          className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm"
          style={{
            background:
              "linear-gradient(45deg, rgba(16,185,129,0.10) 0%, rgba(255,255,255,0) 38%), linear-gradient(45deg, rgba(16,185,129,0.05) 55%, rgba(255,255,255,0) 80%)",
          }}
        >
          {/* 45° spotlight beam */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-1/3 left-1/4 h-[180%] w-40 rotate-45 bg-emerald-400/10 blur-2xl"
          />
          <div className="relative px-8 py-10 md:px-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8">{title}</h2>
            <div className={`grid gap-6 ${stats.length > 2 ? "md:grid-cols-" + Math.min(stats.length, 4) : "md:grid-cols-2"} grid-cols-1`}>
              {stats.map((s) => (
                <div key={s.label} className="border-l-2 border-emerald-500 pl-4">
                  <div className="font-mono text-3xl md:text-4xl font-bold text-slate-900">{s.value}</div>
                  <div className="text-slate-600 mt-1 text-sm leading-snug">{s.label}</div>
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                      s.evidence === "measured"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {s.evidence === "measured" ? "measured" : "design"}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-8 text-xs font-mono text-slate-500">source: {source}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
