import { ArrowUpRight, Eye } from "lucide-react";

/** Discover the existing public claim explorer without implying an open incident service. */
export default function HomeWatchdog() {
  return (
    <section
      id="public-watchdog"
      className="section-shell pt-10 sm:pt-14"
      aria-labelledby="home-watchdog-h"
      data-testid="home-watchdog"
    >
      <div className="surface-raised border border-border rounded-lg p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="hp-eyebrow">
              <Eye size={16} aria-hidden="true" /> Public evidence · Open access
            </p>
            <h2 id="home-watchdog-h" className="text-2xl sm:text-3xl font-bold mb-3">
              Public Watchdog
            </h2>
            <p className="text-muted-foreground mb-5 max-w-xl">
              Follow public AI claims back to their evidence. Explore the claim
              register, inspect sources and dates, and see what has been measured
              and what remains unmeasured or uncheckable.
            </p>
            <a href="/watchdog/" className="hp-button hp-button-primary">
              Explore public claims <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
          <div className="grid gap-5 content-center">
            <div>
              <a href="/claim-maintenance/" className="hp-text-link">
                Follow a claim over time
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
              <p className="text-sm text-muted-foreground mt-2">
                Trace the evidence behind a claim and inspect its recorded changes.
              </p>
            </div>
            <div>
              <a href="/corrections/" className="hp-text-link">
                Read published corrections
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
              <p className="text-sm text-muted-foreground mt-2">
                Check corrections and superseding records before relying on an earlier result.
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-6 border-t border-border pt-4">
          Current scope: public claim records and published evidence. Incident intake is not open.
        </p>
      </div>
    </section>
  );
}
