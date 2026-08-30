import {
  HEALTH_TERMS,
  HEALTH_TERMS_RULING,
  HEALTH_VOICE,
} from "@/lib/healthTerms";

export default function HealthTerms({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const dark = tone === "dark";
  const panel = dark
    ? "rounded-2xl border border-emerald-400/20 bg-emerald-950/40 p-4"
    : "rounded-2xl border border-slate-200 bg-white p-4";
  const title = dark ? "text-slate-100" : "text-slate-900";
  const body = dark ? "text-slate-300" : "text-slate-600";
  const muted = dark ? "text-emerald-300/80" : "text-emerald-800";
  const head = dark ? "text-emerald-300" : "text-slate-900";

  return (
    <section className="mt-12 space-y-8" data-testid="health-terms" aria-labelledby="health-terms-h">
      <div>
        <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${muted}`}>
          Health terms · what they say
        </p>
        <h2 id="health-terms-h" className={`mt-2 text-xl font-bold ${head}`}>
          {HEALTH_TERMS_RULING}
        </h2>
        <p className={`mt-3 text-sm ${title}`}>{HEALTH_VOICE}</p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {HEALTH_TERMS.map((row) => (
          <li key={row.id} className={panel} data-testid={`health-term-${row.id}`}>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className={`font-semibold ${title}`}>{row.term}</h3>
              <span className={`font-mono text-[10px] uppercase ${muted}`}>
                {row.use === "use" ? "use" : "do not"}
              </span>
            </div>
            <p className={`mt-2 text-sm ${body}`}>They say: {row.they_say}</p>
            <p className={`mt-1 text-sm ${body}`}>We say: {row.we_say}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
