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
    <section className={`bg-slate-50 py-14 sm:py-16 ${className}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldSafe(jsonLd) }}
      />
      <div className="mx-auto w-full max-w-4xl px-6">
        <div className="mb-7 text-center">
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">
            FAQ
          </span>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            {title}
          </h2>
          {intro ? (
            <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-gray-500">{intro}</p>
          ) : null}
        </div>

        <div className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {items.map((i, n) => (
            <details
              key={i.q}
              open={n < openCount}
              className="group open:bg-emerald-50/40"
            >
              <summary
                className="flex cursor-pointer list-none items-center gap-3 px-4 py-2.5 outline-none transition-colors hover:bg-emerald-50/60 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset sm:px-5 sm:py-3 [&::-webkit-details-marker]:hidden"
              >
                <h3 className="flex-1 text-[14px] font-semibold leading-snug text-gray-900 sm:text-[15px]">
                  {i.q}
                </h3>
                <ChevronDown
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-emerald-600 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <div className="px-4 pb-4 sm:px-5 sm:pb-4">
                <p className="max-w-none border-l-2 border-emerald-400 pl-3 text-[13.5px] leading-relaxed text-gray-600">
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
