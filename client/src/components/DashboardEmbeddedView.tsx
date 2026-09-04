import { ExternalLink, X } from "lucide-react";
import { Link } from "wouter";
import { withEmbed } from "@/lib/embed";

export default function DashboardEmbeddedView({
  path,
  label,
}: {
  path: string;
  label: string;
}) {
  return (
    <section
      className="relative flex h-full min-h-[32rem] flex-col bg-[var(--surface-canvas,#fafaf7)]"
      aria-label={`${label} workspace view`}
    >
      <h1 className="sr-only">{label}</h1>
      <div className="absolute right-3 top-16 z-10 flex items-center gap-1 rounded-xl border border-border bg-card/95 p-1 shadow-sm backdrop-blur xl:top-3">
        <a
          href={path}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Open page <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
        <Link
          href="/dashboard?tab=explore"
          aria-label="Close page and return to all tools"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <iframe
        title={`${label} — Council of AI`}
        src={withEmbed(path)}
        className="min-h-0 w-full flex-1 border-0 bg-background"
        data-testid="dashboard-embedded-view"
      />
    </section>
  );
}
