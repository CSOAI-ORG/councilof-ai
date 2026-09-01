import { useEffect } from "react";
import { Link } from "wouter";
import { ChevronDown, Home, ExternalLink } from "lucide-react";
import { FAQ_ITEMS, FAQ_SECTIONS } from "@/data/home-faq";

/**
 * FaqPage — the dedicated /faq page with 12 questions (ceiling 12).
 *
 * 2026 pattern: Google killed FAQ rich results (7 May 2026). We do not chase
 * SERP stars. FAQPage + BreadcrumbList still valid Schema.org — schema text
 * MUST match visible HTML exactly. Includes lastReviewed.
 *
 * Structure: H1 → standfirst → jump TOC → grouped questions (H2/H3) → footer.
 * Each answer: 40–60 words, one living URL, no second question inside.
 */

const LAST_REVIEWED = "2026-08-28";

export default function FaqPage() {
  useEffect(() => {
    document.title = "Frequently asked questions | Council of AI";
  }, []);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    dateModified: LAST_REVIEWED,
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://councilof.ai/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "FAQ",
        item: "https://councilof.ai/faq",
      },
    ],
  };

  return (
    <main className="surface-base min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* Breadcrumb navigation */}
      <nav aria-label="Breadcrumb" className="section-shell pt-6 sm:pt-8">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <Home className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Home</span>
            </Link>
          </li>
          <li aria-hidden="true" className="text-border">/</li>
          <li>
            <span className="text-foreground font-medium" aria-current="page">
              FAQ
            </span>
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <header className="section-shell pt-8 pb-6 sm:pt-12 sm:pb-8">
        <h1 className="t-display text-foreground">Frequently asked questions</h1>
        <p className="t-lede measure mt-4 text-muted-foreground">
          Definitions and pointers for Council of AI, the GSPC measurement board
          and signed measurement cards. For live counts, fetch{" "}
          <a
            href="https://councilof.ai/api/gspc"
            className="font-medium text-primary hover:underline"
          >
            GET /api/gspc
          </a>
          .
        </p>
      </header>

      {/* Jump TOC */}
      <nav aria-label="FAQ sections" className="section-shell pb-8 sm:pb-10">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <p className="text-sm font-semibold text-foreground mb-3">
            Jump to section
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {FAQ_SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="text-sm text-primary hover:underline"
              >
                {section.title}
              </a>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <ol className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3 text-sm text-muted-foreground">
              {FAQ_ITEMS.map((item, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-primary font-medium">{idx + 1}.</span>
                  <a
                    href={`#q${idx + 1}`}
                    className="hover:text-foreground transition-colors line-clamp-1"
                  >
                    {item.q}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </nav>

      {/* FAQ sections */}
      <div className="section-shell pb-12 sm:pb-16">
        <div className="space-y-10 sm:space-y-12">
          {FAQ_SECTIONS.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="t-section mb-5 text-foreground">{section.title}</h2>
              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {section.items.map((item) => {
                  const globalIdx = FAQ_ITEMS.indexOf(item);
                  return (
                    <details
                      key={item.q}
                      id={`q${globalIdx + 1}`}
                      open
                      className="group"
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 outline-none transition-colors hover:bg-primary/[0.05] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-6 sm:py-4 [&::-webkit-details-marker]:hidden">
                        <h3 className="flex-1 text-[15px] font-semibold leading-snug text-foreground">
                          {item.q}
                        </h3>
                        <ChevronDown
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 text-primary transition-transform duration-200 group-open:rotate-180"
                        />
                      </summary>
                      <div className="px-4 pb-5 sm:px-6 sm:pb-6">
                        <p className="text-[14px] leading-[1.7] text-muted-foreground">
                          {item.a}
                        </p>
                        {item.url && (
                          <a
                            href={item.url}
                            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                          >
                            {item.url.startsWith("/api/")
                              ? item.url
                              : `Read more`}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Footer disclaimer */}
        <footer className="mt-12 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            If this page disagrees with{" "}
            <a
              href="https://councilof.ai/api/gspc"
              className="font-medium text-primary hover:underline"
            >
              GET /api/gspc
            </a>
            , the API wins.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/70 text-center">
            Last reviewed: {LAST_REVIEWED}
          </p>
        </footer>
      </div>
    </main>
  );
}
