import { ChevronDown } from "lucide-react";

/**
 * FaqBlock — the house FAQ section, as a native <details>/<summary> accordion.
 *
 * WHY NATIVE DISCLOSURE, NOT A JS ACCORDION. Three reasons, all of them AEO:
 *   1. It works with JavaScript off, so a crawler that does not execute our bundle
 *      still reads every answer — the text lives in the DOM whether open or shut.
 *   2. <summary> is keyboard-operable and screen-reader-announced for free; no
 *      aria-expanded bookkeeping to get wrong.
 *   3. Questions stay real <h3>s, which is what answer engines lift.
 *
 * Emits FAQPage JSON-LD describing EXACTLY what is rendered — never more. Every
 * answer must satisfy the register: measurement not certification, numbers trace
 * to a signed artefact or a live endpoint, UNMEASURED is a state and never a fail,
 * no superlative we cannot evidence.
 */

export type FaqItem = { q: string; a: string };

/** JSON-LD must not be able to close its own <script>. */
function ldSafe(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default function FaqBlock({
  title = "Frequently asked questions",
  intro,
  items,
  className = "",
  /** How many entries start expanded. One, so 21 rows read as a table not a wall. */
  openCount = 1,
}: {
  title?: string;
  intro?: string;
  items: FaqItem[];
  className?: string;
  openCount?: number;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };

  return (
    // Ground was `bg-slate-50` (#f8fafc) — a COOL blue-grey under a warm-white,
    // green-accented brand. It is now the shared sunken token, so it matches the
    // rest of the estate and inverts correctly in dark.
    <section className={`section-y surface-sunken ${className}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldSafe(jsonLd) }}
      />
      <div className="section-shell-narrow">
        <div className="mb-9 text-center sm:mb-10">
          <span className="t-kicker inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary">
            FAQ
          </span>
          <h2 className="t-section mt-4 text-foreground">{title}</h2>
          {intro ? (
            <p className="t-lede measure measure-center mt-4 text-muted-foreground">{intro}</p>
          ) : null}
        </div>

        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {items.map((i, n) => (
            <details
              key={i.q}
              open={n < openCount}
              className="group open:bg-primary/[0.045]"
            >
              {/* py-2.5 was under the 44px minimum tap target on mobile. */}
              <summary
                className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 outline-none transition-colors hover:bg-primary/[0.07] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-6 sm:py-4 [&::-webkit-details-marker]:hidden"
              >
                <h3 className="flex-1 text-[14.5px] font-semibold leading-snug text-foreground sm:text-[15px]">
                  {i.q}
                </h3>
                <ChevronDown
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-primary transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <div className="px-4 pb-5 sm:px-6 sm:pb-6">
                <p className="measure border-l-2 border-primary/60 pl-4 text-[14px] leading-[1.68] text-muted-foreground">
                  {i.a}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
