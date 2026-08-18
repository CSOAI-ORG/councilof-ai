import { useEffect } from "react";
import { useLocation } from "wouter";
import { classify, isLibraried, prettifyTitle, PRIMARY_PATHS } from "../data/library-ia";
import { ROUTE_MANIFEST } from "../data/route-manifest";

// PageSchema — mounted once globally. Emits a BreadcrumbList for the current route so answer
// engines (and Google) can place every page in the site's hierarchy:
//   Home → [Library → Sector →] Page
// BreadcrumbList is the highest-leverage universal schema: only a handful of pages carry one,
// it is data-derivable from the route + the Library sector classifier, and answer engines use it
// to understand structure. We DON'T emit a WebPage/Article node here — ~32 pages already ship
// their own richer schema (Dataset/FAQPage/Article) and we must not conflict with or duplicate it.
const BASE = "https://councilof.ai";
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
    let sc: HTMLScriptElement | null = null;
    // Inject after a short delay + re-check: a page that ships its OWN BreadcrumbList (via its
    // mount effect) renders slightly after this global route-change effect. Waiting, then
    // checking, guarantees we never double up. 400ms sits well inside the prerender wait window,
    // so the crumb is still captured into the static HTML.
    const t = setTimeout(() => {
      const existing = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .some((s) => (s.textContent || "").includes('"BreadcrumbList"'));
      if (existing) return;

      const items: { name: string; item: string }[] = [{ name: "Home", item: BASE + "/" }];
      if (isLibraried(path)) {
        const sector = classify(path);
        items.push({ name: "Library", item: BASE + "/library" });
        items.push({ name: sector.title, item: `${BASE}/library/${sector.id}` });
      }
      items.push({ name: titleFor(path), item: BASE + path });

      sc = document.createElement("script");
      sc.type = "application/ld+json";
      sc.setAttribute("data-page-schema", "breadcrumb");
      sc.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((it, i) => ({
          "@type": "ListItem", position: i + 1, name: it.name, item: it.item,
        })),
      });
      document.head.appendChild(sc);
    }, 400);
    return () => { clearTimeout(t); if (sc) { try { document.head.removeChild(sc); } catch { /* gone */ } } };
  }, [path]);

  return null;
}

export { PRIMARY_PATHS };
