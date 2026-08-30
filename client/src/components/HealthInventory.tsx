import {
  boardHealthLine,
  HEALTH_FACTS,
  HEALTH_NEVER,
  HEALTH_PUBLIC_LINE,
  HEALTH_RULING,
  LIVE_HEALTH_PIN,
} from "@/lib/healthInventory";

export default function HealthInventory({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const dark = tone === "dark";
  const panel = dark
    ? "rounded-2xl border border-emerald-400/20 bg-emerald-950/40 p-4"
    : "rounded-2xl border border-slate-200 bg-white p-4";
  const title = dark ? "text-slate-100" : "text-slate-900";
  const body = dark ? "text-slate-300" : "text-slate-600";
  const muted = dark ? "text-emerald-300/80" : "text-emerald-800";
  const head = dark ? "text-emerald-300" : "text-slate-900";

  return (
    <section className="mt-12 space-y-8" data-testid="health-inventory" aria-labelledby="health-h">
      <div>
        <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${muted}`}>
          Health inventory · all correct facts we can access
        </p>
        <h2 id="health-h" className={`mt-2 text-xl font-bold ${head}`}>
          {HEALTH_RULING}
        </h2>
        <p className={`mt-3 text-sm ${body}`}>
          How healthy the record is: {LIVE_HEALTH_PIN.board}, {LIVE_HEALTH_PIN.empty} empty,{" "}
          {LIVE_HEALTH_PIN.index_rows} signed index rows, {LIVE_HEALTH_PIN.corrections}{" "}
          corrections. That is coverage. It is not a grade of the model.
        </p>
        <p className={`mt-3 font-mono text-[13px] ${title}`}>{HEALTH_PUBLIC_LINE}</p>
        <p className={`mt-2 text-sm ${body}`}>Board today: {boardHealthLine()}</p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {HEALTH_FACTS.map((fact) => (
          <li key={fact.id} className={panel} data-testid={`health-fact-${fact.id}`}>
            <div className="flex items-baseline justify-between gap-2">
              <a href={fact.href} className={`font-semibold underline-offset-2 hover:underline ${title}`}>
                {fact.title}
              </a>
              <span className={`font-mono text-[10px] uppercase ${muted}`}>{fact.state}</span>
            </div>
            <p className={`mt-2 text-sm ${body}`}>{fact.means}</p>
            <p className={`mt-1 text-[12px] ${muted}`}>{fact.access}</p>
          </li>
        ))}
      </ul>

      <div className={panel} data-testid="health-never">
        <p className={`font-mono text-[11px] uppercase tracking-[0.16em] ${muted}`}>Never</p>
        <ul className={`mt-2 list-disc space-y-1 pl-5 text-sm ${body}`}>
          {HEALTH_NEVER.map((row) => (
            <li key={row}>{row}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
