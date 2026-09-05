import { useEffect } from "react";
import { useLocation } from "wouter";
import { classify, isLibraried, prettifyTitle, PRIMARY_PATHS } from "../data/library-ia";
import { ROUTE_MANIFEST } from "../data/route-manifest";

// PageSchema — mounted once globally. Emits per-route JSON-LD so answer engines (and Google)
// can place every page in the site's hierarchy and cite it:
//   1. BreadcrumbList (every non-home route): Home → [Library → Sector →] Page
//   2. Article (libraried reference pages only): headline + articleSection + publisher, so each
//      archived page is a first-class citation surface. Primary pages keep their hand-tuned
//      schema; pages already shipping an Article/TechArticle are never doubled (delayed re-check).
// Honesty constraint: no fabricated dates — per-page datePublished is unknowable, so it is
// OMITTED rather than invented. FAQPage/Dataset on the same page coexist fine with both nodes.
const BASE = "https://councilof.ai";
// The estate's canonical publisher node (matches NewHome-v3's Organization schema).
const PUBLISHER = {
  "@type": "Organization",
  name: "CSOAI Ltd",
  url: BASE,
  identifier: "UK Companies House 16939677",
};
const titleFor = (path: string): string => {
  const hit = ROUTE_MANIFEST.find((r) => r.path === path);
  if (hit) return prettifyTitle(hit.title);
  const doc = (typeof document !== "undefined" ? document.title : "") || "";
  return doc.split(/[|—·]/)[0].trim() || path.replace(/^\//, "");
};

export default function PageSchema() {
  const [loc] = useLocation();
  const path = (loc || "/").replace(/\/$/, "") || "/";

  useEffect(() => {
    if (path === "/") return; // home is the breadcrumb root, no trail of its own
    const added: HTMLScriptElement[] = [];
    // Inject after a short delay + re-check: a page that ships its OWN schema (via its mount
    // effect) renders slightly after this global route-change effect. Waiting, then checking,
    // guarantees we never double up. 400ms sits well inside the 1800ms prerender wait window,
    // so both nodes are still captured into the static HTML.
    const t = setTimeout(() => {
      const pageLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map((s) => s.textContent || "").join("\n");
      const inject = (kind: string, node: object) => {
        const sc = document.createElement("script");
        sc.type = "application/ld+json";
        sc.setAttribute("data-page-schema", kind);
        sc.text = JSON.stringify({ "@context": "https://schema.org", ...node });
        document.head.appendChild(sc);
        added.push(sc);
      };

      // /honesty is the page whose whole job is to state what we have NOT measured, and it
      // shipped with no FAQPage node — so answer engines had no structured handle on the one
      // page written to be quoted against us. The questions and answers are read from the
      // page's OWN rendered sections at prerender time, never authored here: a hand-written
      // FAQ would drift from the page the day the page changed, and phrasing a heading into a
      // question would be putting words in the page's mouth. Heading verbatim (minus its
      // "1." ordinal), answer = that section's first paragraph. If the page renders no
      // sections, NO node is emitted — an empty FAQ is worse than none.
      if (path === "/honesty" && !pageLd.includes('"FAQPage"')) {
        const qa = Array.from(document.querySelectorAll("h2"))
          .map((h) => {
            const name = (h.textContent || "").replace(/^\s*\d+\.\s*/, "").trim();
            let el: Element | null = h.nextElementSibling;
            while (el && !/^(P|UL|OL)$/.test(el.tagName)) el = el.nextElementSibling;
            const text = (el?.textContent || "").trim();
            return { name, text };
          })
          .filter((x) => x.name && x.text.length > 40)
          .slice(0, 10);
        if (qa.length) {
          inject("faq", {
            "@type": "FAQPage",
            mainEntity: qa.map((x) => ({
              "@type": "Question",
              name: x.name,
              acceptedAnswer: { "@type": "Answer", text: x.text.slice(0, 1200) },
            })),
          });
        }
      }

      const libraried = isLibraried(path);
      const sector = libraried ? classify(path) : null;
      const title = titleFor(path);
      // Only routes in the manifest are real pages. An unknown path (client-side 404) must not
      // get an Article node — and manifest membership also guarantees a real headline rather
      // than the stale-document.title fallback.
      const known = ROUTE_MANIFEST.some((r) => r.path === path);

      if (!pageLd.includes('"BreadcrumbList"')) {
        const items: { name: string; item: string }[] = [{ name: "Home", item: BASE + "/" }];
        if (sector) {
          items.push({ name: "Library", item: BASE + "/library" });
          items.push({ name: sector.title, item: `${BASE}/library/${sector.id}` });
        }
        items.push({ name: title, item: BASE + path });
        inject("breadcrumb", {
          "@type": "BreadcrumbList",
          itemListElement: items.map((it, i) => ({
            "@type": "ListItem", position: i + 1, name: it.name, item: it.item,
          })),
        });
      }

      // Article — libraried reference pages only, and never on a page that already ships its
      // own Article-family node. No dates: we will not invent datePublished.
      if (known && sector && !/"(?:Article|TechArticle|NewsArticle|ScholarlyArticle)"/.test(pageLd)) {
        inject("article", {
          "@type": "Article",
          headline: title,
          url: BASE + path,
          articleSection: sector.title,
          isPartOf: {
            "@type": "CollectionPage",
            name: `${sector.title} — Library`,
            url: `${BASE}/library/${sector.id}`,
          },
          publisher: PUBLISHER,
          author: PUBLISHER,
        });
      }
    }, 400);
    return () => {
      clearTimeout(t);
      for (const sc of added) { try { document.head.removeChild(sc); } catch { /* gone */ } }
    };
  }, [path]);

  return null;
}

export { PRIMARY_PATHS };
