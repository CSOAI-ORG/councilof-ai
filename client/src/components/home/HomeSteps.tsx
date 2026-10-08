/** Four practical checks, using the existing evidence pages and image assets. */
import { Link } from "wouter";
export interface Step {
  id: string;
  kicker: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  img: {
    base: string;
    widths: number[];
    width: number;
    height: number;
    alt: string;
  };
}
export const STEPS: Step[] = [
  {
    id: "measure",
    kicker: "1 · Read + inspect",
    title: "Read the run behind a result",
    body: "Start with the task, method and measurement date. Model comparisons use frozen questions and fixed grading rules. A TIE or UNTESTED comparison stays that way.",
    href: "/methodology",
    cta: "How a measurement is made",
    img: {
      base: "/images/home/arena",
      widths: [480, 900],
      width: 900,
      height: 506,
      alt: "Figures in a bright arena facing a row of glowing test stations",
    },
  },
  {
    id: "sign",
    kicker: "2 · Verify",
    title: "Check the record yourself",
    body: "Ed25519-signed cards and content-addressed unsigned records are labelled separately. The browser verifier returns VALID, INVALID or UNCHECKABLE. Your record stays in the browser, which may retrieve public-key metadata; verification is free.",
    href: "/gspc-verify",
    cta: "Check a record yourself",
    img: {
      base: "/images/home/evidence-card",
      widths: [480, 800, 1376],
      width: 1376,
      height: 768,
      alt: "Two hands holding a glass card showing a verified signed record",
    },
  },
  {
    id: "recheck",
    kicker: "3 · Maintain",
    title: "Keep the original date in view",
    body: "A live fetch is not a new measurement. Read the maintenance rules for freshness, scope and changes to a source before relying on a published claim.",
    href: "/claim-maintenance/",
    cta: "How a claim is kept current",
    img: {
      base: "/images/home/clock",
      widths: [480, 620],
      width: 620,
      height: 464,
      alt: "A white wall clock with a single green hand",
    },
  },
  {
    id: "correct",
    kicker: "4 · Correct",
    title: "Follow what changed",
    body: "The public corrections ledger records what was wrong and what changed. Signed records are superseded rather than quietly edited, keeping the earlier evidence available to inspect.",
    href: "/corrections/",
    cta: "Read the corrections ledger",
    img: {
      base: "/images/home/watchdog",
      widths: [480, 800, 1376],
      width: 1376,
      height: 768,
      alt: "People dropping reports into a funnel labelled public watchdog reporting",
    },
  },
];
function StepImage({ img }: { img: Step["img"] }) {
  return (
    <img
      src={img.base + "-" + img.widths[0] + ".webp"}
      srcSet={img.widths
        .map((w) => img.base + "-" + w + ".webp " + w + "w")
        .join(", ")}
      sizes="(min-width: 640px) 7rem, 6rem"
      width={img.width}
      height={img.height}
      alt={img.alt}
      loading="lazy"
      decoding="async"
      className="h-20 w-24 shrink-0 rounded-xl border border-border bg-muted object-cover sm:h-24 sm:w-28"
    />
  );
}
export default function HomeSteps() {
  return (
    <section
      aria-labelledby="home-steps-h"
      className="surface-sunken section-y border-t border-border"
      data-testid="home-steps"
    >
      <div className="section-shell">
        <p className="t-kicker text-emerald-800 dark:text-emerald-300">
          How to use the evidence
        </p>
        <h2 id="home-steps-h" className="t-band mt-3 max-w-3xl text-foreground">
          Read it. Verify it. Keep checking.
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
          Inspect the scope of a run, check its record and follow its changes.
          Each step keeps the method and its limits visible.
        </p>
        <ol className="mt-8 grid list-none gap-4 p-0 md:grid-cols-2">
          {STEPS.map((s) => (
            <li
              key={s.id}
              id={"step-" + s.id}
              className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 sm:p-6"
              data-testid={"home-step-" + s.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-300">
                    {s.kicker}
                  </p>
                  <h3 className="mt-2 text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
                    {s.title}
                  </h3>
                </div>
                <StepImage img={s.img} />
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {s.body}
              </p>
              <Link
                href={s.href}
                className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-emerald-800 underline underline-offset-4 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-200"
              >
                {s.cta} →
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
