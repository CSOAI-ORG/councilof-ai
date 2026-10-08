/** Existing evidence surfaces, with each instrument's scope kept separate. */
import { Link } from "wouter";
export const EVIDENCE_AREAS = [
  {
    id: "models",
    kicker: "Model comparisons",
    title: "How did a model behave?",
    body: "Inspect dated model runs, sample sizes and the evidence behind them. A point lead is not a separated result: ties and untested comparisons remain visible.",
    href: "/board/models",
    cta: "Explore measured models",
  },
  {
    id: "endpoints",
    kicker: "Agents + endpoints",
    title: "What happened at a tool boundary?",
    body: "Tool-call server observations show whether an unauthorised argument was refused at the boundary. They do not establish what a backend executed.",
    href: "/gspc/effect-binding",
    cta: "Inspect effect-binding evidence",
  },
  {
    id: "public-records",
    kicker: "Public financial records",
    title: "What do the public records show?",
    body: "Read dated issuer-account and public-series observations. These are deterministic fact runs, with no model accuracy, leader or risk verdict.",
    href: "/financial-axes",
    cta: "Read the financial fact runs",
  },
] as const;
export default function HomeEvidencePaths() {
  return (
    <section
      id="evidence"
      className="surface-base section-y border-t border-border"
      aria-labelledby="home-evidence-h"
      data-testid="home-evidence-paths"
    >
      <div className="section-shell">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-300">
          Evidence for different questions
        </p>
        <h2
          id="home-evidence-h"
          className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          Start with what you need to check.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Different subjects need different evidence. Each record keeps its own
          method, date and limits.
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {EVIDENCE_AREAS.map((area) => (
            <article
              key={area.id}
              className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 sm:p-6"
              data-testid={"home-evidence-" + area.id}
            >
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                {area.kicker}
              </p>
              <h3 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-foreground">
                {area.title}
              </h3>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                {area.body}
              </p>
              <Link
                href={area.href}
                className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-800 underline decoration-emerald-500/40 underline-offset-4 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-100"
              >
                {area.cta} →
              </Link>
            </article>
          ))}
        </div>
        <aside className="mt-6 rounded-xl border border-emerald-700/15 bg-emerald-50 px-5 py-4 text-sm leading-relaxed text-emerald-950 dark:border-emerald-300/15 dark:bg-emerald-950/40 dark:text-emerald-100">
          <strong className="font-semibold">
            Keep each instrument’s scope.
          </strong>{" "}
          A model comparison, a tool-boundary probe and a financial fact run
          answer different questions. Decisions about the system remain with the
          responsible person.
        </aside>
      </div>
    </section>
  );
}
