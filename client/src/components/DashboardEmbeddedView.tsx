import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, RefreshCw, X } from "lucide-react";
import { Link } from "wouter";
import { withEmbed } from "@/lib/embed";
import { unframeableLanding } from "@/lib/unframeable";

export const EMBEDDED_PAGE_TIMEOUT_MS = 15_000;
type FrameRead = {
  key: string;
  phase: "loading" | "loaded" | "error" | "timeout";
  moved: { path: string; href: string } | null;
};

/** One published page inside Council OS. A frame load is not a content or HTTP verdict.
 * Redirects back into an application shell are replaced rather than recursively framed. */
export default function DashboardEmbeddedView({
  path,
  label,
}: {
  path: string;
  label: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${path}\u0000${attempt}`;
  const [read, setRead] = useState<FrameRead>({
    key,
    phase: "loading",
    moved: null,
  });
  const current: FrameRead =
    read.key === key ? read : { key, phase: "loading", moved: null };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setRead((previous) =>
        previous.key !== key || previous.phase === "loading"
          ? { key, phase: "timeout", moved: null }
          : previous,
      );
    }, EMBEDDED_PAGE_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [key]);

  return (
    <section
      className="relative flex h-full min-h-[32rem] flex-col bg-[var(--surface-canvas,#fafaf7)]"
      aria-label={`${label} workspace view`}
    >
      <h1 className="sr-only">{label}</h1>
      {current.moved ? (
        <div
          className="mx-auto w-full max-w-xl px-5 py-12"
          data-testid="dashboard-embedded-moved"
        >
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
              {label}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              This page has moved.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <code className="font-mono text-xs">{path}</code> now forwards to{" "}
              <code className="font-mono text-xs">{current.moved.path}</code>
              {current.moved.path === "/dashboard" ||
              current.moved.path === "/os"
                ? ", which is this workspace, so it is not shown inside itself."
                : ", which opens as its own page, not inside this workspace."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/dashboard?tab=explore"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to
                Everything A–Z
              </Link>
              <a
                href={current.moved.href}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Go where it moved{" "}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border bg-card px-3 py-2">
            <a
              href={path}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Open page <span className="sr-only">(opens in a new tab)</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <Link
              href="/dashboard?tab=explore"
              aria-label="Close page and return to all tools"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          {current.phase === "loading" ? (
            <p
              role="status"
              className="border-b border-border px-4 py-3 text-sm text-muted-foreground"
              data-testid="dashboard-embedded-loading"
            >
              Loading {label}… You can also open the page in a separate tab.
            </p>
          ) : current.phase === "error" || current.phase === "timeout" ? (
            <div
              role="alert"
              className="border-b border-amber-700/30 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              data-testid="dashboard-embedded-error"
            >
              <p>
                {current.phase === "timeout"
                  ? "This page has not confirmed loading after 15 seconds."
                  : "The browser reported that this page could not load."}{" "}
                No content state is assumed. Try again or use Open page.
              </p>
              <button
                type="button"
                onClick={() => setAttempt((value) => value + 1)}
                className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg border border-amber-800/30 px-3 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800"
              >
                <RefreshCw size={16} aria-hidden="true" />
                Retry page
              </button>
            </div>
          ) : null}
          <iframe
            ref={frame}
            key={key}
            title={`${label} — Council of AI`}
            src={withEmbed(path)}
            aria-busy={current.phase === "loading"}
            onLoad={(event) => {
              if (event.currentTarget !== frame.current) return;
              setRead({
                key,
                phase: "loaded",
                moved: unframeableLanding(frame.current),
              });
            }}
            onErrorCapture={(event) => {
              if (event.currentTarget === frame.current)
                setRead({ key, phase: "error", moved: null });
            }}
            className="min-h-0 w-full flex-1 border-0 bg-background"
            data-testid="dashboard-embedded-view"
          />
        </>
      )}
    </section>
  );
}
