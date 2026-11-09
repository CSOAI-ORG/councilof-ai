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

      {/* Daily report + newsletter band: the 33-axis signed daily report is
          published publicly; the signup rides the real /api/subscribe handler
          (stores to LEADS — verified end-to-end 2026-11-04). */}
      <div className="section-shell pt-10" data-testid="home-daily-report-band">
        <div className="surface-raised border border-border rounded-lg p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-2">
            The 33-axis daily report — signed, dated, public.
          </h2>
          <p className="text-muted-foreground text-sm mb-4 max-w-2xl">
            Every axis, every leaderboard change, every correction — one signed report
            a day, published before we pitch anything. Read today&apos;s issue or have
            it find you.
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <a
              href="https://huggingface.co/datasets/csoai/gspc-daily-reports"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
            >
              Read today&apos;s report
            </a>
            <a href="/board/" className="text-sm underline underline-offset-4 hover:text-primary">
              or go straight to the board
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
