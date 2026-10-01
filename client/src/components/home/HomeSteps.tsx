/**
 * HomeSteps — how it works, as four sections with an image each: measure, sign, re-check, correct.
 *
 * Owner, 30 Sep 2026: the front door should be end-user focused, built around what makes this
 * different, in sections with our own images, with the technical detail moved to About and the
 * deeper pages. These four sections ARE the "how it works" line and the main strengths at once,
 * so the page says each thing once.
 *
 * NO FIGURES HERE. Each figure on the home page is printed in one place (the board band or the
 * proof strip); these sections carry words and a link to the page that holds the evidence.
 *
 * IMAGES. Our own renders, served as WebP at 480px, 800px and the source's own width (never
 * upscaled), with width/height set so the browser reserves the box before the bytes arrive, and
 * loading="lazy" because every one of them is below the first screen.
 */
import { Link } from "wouter";

export interface Step {
  id: string;
  kicker: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  img: { base: string; widths: number[]; width: number; height: number; alt: string };
}

export const STEPS: Step[] = [
  {
    id: "measure",
    kicker: "1 · Measure",
    title: "The same frozen questions, graded by a rule",
    body:
      "Every model answers the same published question bank, frozen before the run. A fixed rule grades each answer, never another AI's opinion. When two models cannot be told apart we say tie, and when an axis has not been tested we say untested.",
    href: "/methodology",
    cta: "How a measurement is made",
    img: { base: "/images/home/arena", widths: [480, 900], width: 900, height: 506, alt: "Figures in a bright arena facing a row of glowing test stations" },
  },
  {
    id: "sign",
    kicker: "2 · Sign",
    title: "Checkable evidence, free to verify",
    body:
      "Measurement cards that carry an Ed25519 signature are independently checkable with a key we publish. Other measurement artifacts declare their attestation state explicitly, including content-addressed unsigned records, so we never imply a signature where none exists. Paste a signed card into the verifier: the record stays in your browser, while the browser may retrieve public-key metadata. No account is needed, and verification is free forever. A rank is never for sale, and our own models are listed apart and never counted in.",
    href: "/gspc-verify",
    cta: "Check a record yourself",
    img: { base: "/images/home/evidence-card", widths: [480, 800, 1376], width: 1376, height: 768, alt: "Two hands holding a glass card showing a verified signed record" },
  },
  {
    id: "recheck",
    kicker: "3 · Re-check",
    title: "Kept current, not filed away",
    body:
      "A published claim carries its date. We re-read claims against their sources on a schedule; when a source moves, the claim is re-measured, marked stale or retired. The rules we follow are an open specification anyone can adopt.",
    href: "/claim-maintenance/",
    cta: "How a claim is kept current",
    img: { base: "/images/home/clock", widths: [480, 620], width: 620, height: 464, alt: "A white wall clock with a single green hand" },
  },
  {
    id: "correct",
    kicker: "4 · Correct",
    title: "Our mistakes are public",
    body:
      "When we get something wrong, the corrections ledger says what was wrong, how it was caught and what changed, with the date. Signed records are superseded, never quietly edited, because editing them would break the signature that makes them checkable.",
    href: "/corrections/",
    cta: "Read the corrections ledger",
    img: { base: "/images/home/watchdog", widths: [480, 800, 1376], width: 1376, height: 768, alt: "People dropping reports into a funnel labelled public watchdog reporting" },
  },
];

function StepImage({ img }: { img: Step["img"] }) {
  const srcSet = img.widths.map((w) => `${img.base}-${w}.webp ${w}w`).join(", ");
  const fallback = `${img.base}-${img.widths[0]}.webp`;
  return (
    <img
      src={fallback}
      srcSet={srcSet}
      sizes="(min-width: 1024px) 34rem, calc(100vw - 2rem)"
      width={img.width}
      height={img.height}
      alt={img.alt}
      loading="lazy"
      decoding="async"
      className="aspect-[16/10] h-auto w-full rounded-3xl border border-border bg-muted object-cover shadow-[0_24px_50px_-38px_rgba(4,18,12,.55)]"
    />
  );
}

export default function HomeSteps() {
  return (
    <section aria-labelledby="home-steps-h" className="surface-sunken section-y border-t border-border" data-testid="home-steps">
      <div className="section-shell">
        <p className="t-kicker text-emerald-800 dark:text-emerald-300">How it works</p>
        <h2 id="home-steps-h" className="t-band mt-3 max-w-3xl text-foreground">
          Measure, sign, re-check, correct.
        </h2>
        <ol className="mt-12 list-none space-y-16 p-0 sm:space-y-20">
          {STEPS.map((s, i) => (
            <li key={s.id} id={`step-${s.id}`} className="grid items-center gap-7 lg:grid-cols-2 lg:gap-14" data-testid={`home-step-${s.id}`}>
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <StepImage img={s.img} />
              </div>
              <div className={"min-w-0 " + (i % 2 === 1 ? "lg:order-1" : "")}>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-300">{s.kicker}</p>
                <h3 className="mt-2 text-2xl font-black leading-tight tracking-tight text-foreground sm:text-3xl">{s.title}</h3>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">{s.body}</p>
                <Link
                  href={s.href}
                  className="mt-5 inline-flex min-h-11 items-center text-base font-bold text-emerald-800 underline underline-offset-4 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-200"
                >
                  {s.cta} →
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
