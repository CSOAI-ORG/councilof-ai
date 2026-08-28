import { useEffect } from "react";
import { Link } from "wouter";
import { ChevronDown, Home } from "lucide-react";
import { HOME_FAQ, FAQ_SECTIONS } from "@/data/home-faq";

/**
 * FaqPage — the dedicated /faq page with the 21 homepage FAQ questions.
 *
 * Renders all questions and answers in the initial HTML using native <details>
 * elements so content is crawlable with JavaScript off. Organised into five
 * H2 sections: What we are · What we are not · How to verify · Money · Law and fronts.
 *
 * JSON-LD: FAQPage + BreadcrumbList for answer-engine visibility.
 */
export default function FaqPage() {
  useEffect(() => {
    document.title = "Questions people ask | Council of AI";
  }, []);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQ.map((item) => ({
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
      <nav
        aria-label="Breadcrumb"
        className="section-shell pt-6 sm:pt-8"
      >
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
      <header className="section-shell pt-8 pb-10 sm:pt-12 sm:pb-14">
        <h1 className="t-display text-foreground">Questions people ask</h1>
        <p className="t-lede measure mt-4 text-muted-foreground">
          {HOME_FAQ.length} plain-English answers: what we measure, what we
          refuse to claim, and how to check any of it yourself.
        </p>
      </header>

      {/* FAQ sections */}
      <div className="section-shell pb-16 sm:pb-24">
        <div className="space-y-12 sm:space-y-16">
          {FAQ_SECTIONS.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="t-section mb-6 text-foreground">{section.title}</h2>
              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {section.items.map((item, idx) => (
                  <details
                    key={item.q}
                    open={idx === 0}
                    className="group open:bg-primary/[0.045]"
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 outline-none transition-colors hover:bg-primary/[0.07] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-6 sm:py-4 [&::-webkit-details-marker]:hidden">
                      <h3 className="flex-1 text-[14.5px] font-semibold leading-snug text-foreground sm:text-[15px]">
                        {item.q}
                      </h3>
                      <ChevronDown
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-primary transition-transform duration-200 group-open:rotate-180"
                      />
                    </summary>
                    <div className="px-4 pb-5 sm:px-6 sm:pb-6">
                      <p className="measure border-l-2 border-primary/60 pl-4 text-[14px] leading-[1.68] text-muted-foreground">
                        {item.a}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Anchor links to sections */}
        <nav
          aria-label="FAQ sections"
          className="mt-12 pt-8 border-t border-border"
        >
          <p className="text-sm font-medium text-muted-foreground mb-4">
            Jump to section
          </p>
          <ul className="flex flex-wrap gap-3">
            {FAQ_SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-primary/10 hover:border-primary/30 transition-colors"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
