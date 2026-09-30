/**
 * PrerenderedMainFallback — the Suspense fallback for the page body on FIRST load.
 *
 * THE DEFECT IT REMOVES (measured live 2026-09-30, Playwright, 1440x900). Every prerendered
 * page arrives complete. On boot, createRoot() replaced that markup with the lazy route's
 * Suspense fallback — a 60vh spinner — so the article vanished, the footer jumped up into the
 * viewport, and then the real page rendered and pushed it back down. The layout-shift entry
 * was the footer, [605,295] -> offscreen, scored 0.328 on /methodology/, /board/ and
 * /gspc-verify/ alike: a "poor" Core Web Vital (> 0.25) on almost every page, plus a visible
 * blank flash for every reader.
 *
 * THE FIX. The prerendered <main> is read once, at module load, before React's first commit
 * touches #root. While the first route's chunk is loading, the fallback shows those same bytes
 * instead of a spinner, so nothing collapses. It is used only for the path the document was
 * served for and only until the first real page mounts; every later navigation gets the
 * ordinary loader. A page served without prerendered content (empty <main>) also gets the
 * loader — nothing is invented to fill it.
 */
import { useEffect } from "react";
import { SectionLoader } from "./PageLoader";

type Captured = { path: string; html: string };

function capture(): Captured | null {
  if (typeof document === "undefined") return null;
  const main = document.getElementById("main-content");
  if (!main || main.childElementCount === 0) return null;
  // The prerender's own loading placeholder is not content; never replay a spinner as a page.
  if (main.querySelector('[role="status"][aria-label="Loading the page"]') && main.childElementCount === 1) return null;
  return { path: window.location.pathname, html: main.innerHTML };
}

let captured: Captured | null = capture();

/** For tests: what the module captured at load (null when there was no prerendered body). */
export function capturedPrerender(): Captured | null {
  return captured;
}

function Loader() {
  return (
    <div role="status" aria-label="Loading the page" className="flex min-h-[60vh] items-center justify-center bg-background">
      <SectionLoader />
    </div>
  );
}

function Replay({ html }: { html: string }) {
  // Once the real route has mounted this fallback unmounts; from then on it is spent.
  useEffect(() => () => {
    captured = null;
  }, []);
  return <div data-prerender-replay="" aria-busy="true" style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function PrerenderedMainFallback() {
  const c = captured;
  if (c && typeof window !== "undefined" && window.location.pathname === c.path) return <Replay html={c.html} />;
  return <Loader />;
}
