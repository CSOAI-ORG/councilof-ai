/**
 * DashboardPrerenderFallback — the Council OS counterpart of PrerenderedMainFallback.
 *
 * A Council OS page arrives prerendered (and a deep link like /dashboard/?tab=route arrives as the
 * snapshot of that pane; see functions/_lib/dashboardTabSnapshot.ts). Until 30 Sep 2026 the first
 * React commit replaced that markup with a spinner while the dashboard chunks loaded, then painted
 * the pane again: a blank flash, and a largest-contentful-paint pushed out to the last JS wave.
 * Here the prerendered #root markup is read once at module load, before React touches it, and shown
 * as the fallback for the page it was served for, until the real dashboard mounts.
 */
import { useEffect } from "react";
import { SectionLoader } from "./PageLoader";

type Captured = { href: string; html: string };

function capture(): Captured | null {
  if (typeof document === "undefined") return null;
  const p = window.location.pathname;
  if (p !== "/dashboard" && !p.startsWith("/dashboard/")) return null;
  const root = document.getElementById("root");
  if (!root || root.childElementCount === 0) return null;
  if (root.querySelector('[role="status"][aria-label="Loading Council OS"]') && root.textContent!.trim().length < 40) return null;
  return { href: p + window.location.search, html: root.innerHTML };
}

let captured: Captured | null = capture();

export function capturedDashboard(): Captured | null {
  return captured;
}

function Replay({ html }: { html: string }) {
  useEffect(() => () => {
    captured = null;
  }, []);
  return <div data-prerender-replay="" aria-busy="true" style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function DashboardPrerenderFallback() {
  const c = captured;
  if (c && typeof window !== "undefined" && window.location.pathname + window.location.search === c.href) return <Replay html={c.html} />;
  return (
    <div role="status" aria-label="Loading Council OS" className="flex min-h-svh items-center justify-center bg-background">
      <SectionLoader />
    </div>
  );
}
