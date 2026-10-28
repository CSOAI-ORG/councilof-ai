import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, X } from "lucide-react";
import { Link } from "wouter";
import { withEmbed } from "@/lib/embed";
import { unframeableLanding } from "@/lib/unframeable";
import { learningChallengeReturn } from "@/lib/learningChallenge";

/**
 * One published page inside the Council OS centre pane.
 *
 * MOVED PAGES (tools audit, 6 Oct 2026). A page that has been withdrawn is 308'd by a Pages
 * Function to /os?lobby=home (or /enterprise to /dashboard). Framed, that showed Council OS inside
 * Council OS. After each load the frame's landed location is read (same origin) and, when it is a
 * place that must never be framed, the frame is replaced by a plain "This page has moved" panel.
 */
export default function DashboardEmbeddedView({
  path,
  label,
}: {
  path: string;
  label: string;
}) {
  const learningReturn = learningChallengeReturn(path);
  const closeHref = learningReturn?.href ?? "/dashboard?tab=explore";
  const frame = useRef<HTMLIFrameElement>(null);
  const [moved, setMoved] = useState<{ path: string; href: string } | null>(null);

  // A new destination gets a fresh frame.
  useEffect(() => setMoved(null), [path]);

  const onLoad = useCallback(() => {
    const landed = unframeableLanding(frame.current);
    if (landed) setMoved(landed);
  }, []);

  return (
    <section
      className="relative flex h-full min-h-[32rem] flex-col bg-[var(--surface-canvas,#fafaf7)]"
      aria-label={`${label} workspace view`}
    >
      <h1 className="sr-only">{label}</h1>
      {moved ? (
        <div className="mx-auto w-full max-w-xl px-5 py-12" data-testid="dashboard-embedded-moved">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
              {label}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">This page has moved.</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <code className="font-mono text-xs">{path}</code> now forwards to{" "}
              <code className="font-mono text-xs">{moved.path}</code>
              {moved.path === "/dashboard" || moved.path === "/os"
                ? ", which is this workspace, so it is not shown inside itself."
                : ", which opens as its own page, not inside this workspace."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={closeHref}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {learningReturn ? "Back to lesson" : "Back to Everything A–Z"}
              </Link>
              <a
                href={moved.href}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Go where it moved <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-xl border border-border bg-card/95 p-1 shadow-sm backdrop-blur">
            {learningReturn ? (
              <span className="px-2 text-xs text-muted-foreground">
                {learningReturn.axisId.replace(/-/g, " ")} · {learningReturn.stageId}
              </span>
            ) : null}
            <a
              href={path}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Open page <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <Link
              href={closeHref}
              aria-label={learningReturn ? "Close challenge banks and return to the lesson" : "Close page and return to all tools"}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {learningReturn ? <><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to lesson</> : <X className="h-4 w-4" aria-hidden="true" />}
            </Link>
          </div>
          <iframe
            ref={frame}
            key={path}
            title={`${label} — Council of AI`}
            src={withEmbed(path)}
            onLoad={onLoad}
            className="min-h-0 w-full flex-1 border-0 bg-background"
            data-testid="dashboard-embedded-view"
          />
        </>
      )}
    </section>
  );
}
