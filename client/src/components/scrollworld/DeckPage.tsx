import { useEffect, type ReactNode } from "react";
import { setMetaDescription } from "@/lib/utils";
import type { Slide } from "./types";
import { ScrollWorld } from "./ScrollWorld";
import { DeckHero, LiveBoardCount } from "./DeckHero";

/**
 * DeckPage — one owner-authored deck rendered as a scroll-world.
 *
 * Every deck page ends with the SAME honesty band, because these pages were built
 * from generated decks whose claims we had to correct before publishing. The band
 * states in plain sight what the page does NOT claim, so a reader (or an answer
 * engine) never has to infer it. `notClaimed` is per-deck and mandatory.
 */
export function DeckPage({
  title,
  description,
  hero,
  slides,
  notClaimed,
  related = [],
  jsonLd,
  children,
}: {
  title: string;
  description: string;
  hero: { kicker: string; title: string; lede: string; bg: { src: string; alt: string }; actions?: { href: string; label: string; primary?: boolean }[] };
  slides: Slide[];
  notClaimed: string[];
  related?: { href: string; label: string; what: string }[];
  jsonLd?: Record<string, unknown>;
  /** the page's existing working tool / live data, rendered after the story and before the honesty band */
  children?: ReactNode;
}) {
  useEffect(() => {
    document.title = title;
    setMetaDescription(description);
  }, [title, description]);

  return (
    <div className="bg-white">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <DeckHero {...hero} />
      <ScrollWorld slides={slides} />
      {children}

      {/* ————— the honesty band — what this page does NOT claim ————— */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">Read this before you quote us</span>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-gray-900 sm:text-4xl">
            What this page does not claim
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-600">
            We publish the limits with the results. Everything below is something a reader could
            reasonably assume from a page like this one — and each is something we cannot presently
            evidence, so we say so rather than let the assumption stand.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {notClaimed.map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[11px] font-black text-rose-700" aria-hidden>
                  ✕
                </span>
                <span className="text-[15px] leading-snug text-gray-700">{t}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 rounded-2xl bg-white p-5 text-sm leading-relaxed text-gray-600 ring-1 ring-gray-200">
            Coverage on this page is never typed by hand. <LiveBoardCount /> Corrections to anything
            we have published live in the{" "}
            <a href="/refutation-ledger" className="font-semibold text-emerald-700 underline underline-offset-2">refutation ledger</a>{" "}
            — append-only, never a silent edit.
          </p>

          {related.length > 0 && (
            <div className="mt-10">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-gray-600">Go deeper</h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <li key={r.href}>
                    <a href={r.href} className="block rounded-2xl bg-white p-5 ring-1 ring-gray-200 transition hover:ring-emerald-300">
                      <span className="text-base font-extrabold text-gray-900">{r.label}</span>
                      <span className="mt-1 block text-sm leading-snug text-gray-600">{r.what}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default DeckPage;
