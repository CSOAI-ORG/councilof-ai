/**
 * HomeMine — the living board strip + the daily-report/newsletter band, restored
 * into the rebuilt homepage journey (2026-11-09).
 *
 * WHY THIS EXISTS. The #3969 homepage rebuild recomposed the front door into
 * Hero → Results → Products → Evidence → Developers → Updates and dropped two
 * owner-verified sections on the floor: the compact live board strip and the
 * daily-report band with the working signup (NewsletterSignup now stores via
 * LEADS — verified end-to-end 2026-11-04). This component restores both, using
 * the exact markup that shipped on 1 Nov and rendered until the rebuild.
 *
 * FAILURE BEHAVIOUR: LivingBoardStrip renders NOTHING when the board read
 * fails — a missing board never draws a broken homepage. The band is static
 * and always renders.
 */
import LivingBoardStrip from "@/components/home/LivingBoardStrip";
import NewsletterSignup from "@/components/NewsletterSignup";

export default function HomeMine() {
  return (
    <>
      {/* The compact LIVE board (owner, 1 Nov 2026): under the results, above
          every commercial band. Renders nothing at all when the read fails. */}
      <div className="section-shell pt-6 sm:pt-8" data-testid="home-living-strip">
        <LivingBoardStrip />
      </div>

      {/* Link to the report archive without fixing its axis count, cadence or
          signature state in homepage copy. Each report carries its own scope.
          NewsletterSignup and the existing subscription handler are unchanged. */}
      <div className="section-shell pt-10" data-testid="home-report-archive-band">
        <div className="surface-raised border border-border rounded-lg p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-2">
            Published measurement reports
          </h2>
          <p className="text-muted-foreground text-sm mb-4 max-w-2xl">
            Browse dated reports and read each report&apos;s scope, sources and
            evidence status. Check the publication date before relying on a result.
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <a
              href="https://huggingface.co/datasets/csoai/gspc-daily-reports"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
            >
              Browse published reports
            </a>
            <a href="/board/" className="text-sm underline underline-offset-4 hover:text-primary">
              or go straight to the board
            </a>
            <a href="/gspc-verify/" className="text-sm underline underline-offset-4 hover:text-primary">
              Verify a measurement record
            </a>
          </div>
          <div className="mt-6 border-t border-border pt-6" data-testid="home-derived-report-links">
            <h3 className="text-lg font-semibold mb-2">
              Evidence reports and source downloads
            </h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-2xl">
              Read retained regulatory-clock reports, source snapshots and mapping
              gaps. These reports are unsigned derived summaries, not signed
              measurement records or legal advice.
            </p>
            <a
              href="/reports/daily-signal/"
              className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted transition"
            >
              Browse evidence reports
            </a>
          </div>
          <div className="mt-5 max-w-md">
            <NewsletterSignup />
          </div>
        </div>
      </div>
    </>
  );
}
