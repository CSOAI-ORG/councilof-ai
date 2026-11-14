/**
 * HomeMine — the published-report archive and newsletter band.
 *
 * The live board already appears in HomeResults. Keep one authoritative board
 * surface on the homepage; repeating its strip here added a second copy without
 * giving readers new evidence. The report archive and working newsletter signup
 * remain here, with publication dates and scope kept on the linked reports.
 */
import NewsletterSignup from "@/components/NewsletterSignup";

export default function HomeMine() {
  return (
    <>
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
