/**
 * HomeMine — direct bridge from the live board results to the daily report
 * archive and independent card verification (avoiding duplicate board strips
 * or duplicate email forms on the landing flow).
 */
export default function HomeMine() {
  return (
    <div className="section-shell py-8" data-testid="home-report-archive-band">
      <div className="rounded-xl border border-[#bbcbbd] bg-[#f4f7f4] px-6 py-5 sm:flex sm:items-center sm:justify-between sm:gap-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#35634b]">
            Daily report archive
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-[#0c1a12]">
            Published measurement reports
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[#3c5043]">
            Browse dated run summaries alongside their sample sizes, sources and
            publication stamps before relying on a result.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 sm:mt-0 sm:shrink-0">
          <a
            href="https://huggingface.co/datasets/csoai/gspc-daily-reports"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[42px] items-center rounded-md bg-[#04624a] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#034d3a]"
          >
            Browse published reports
          </a>
          <a
            href="/board/"
            className="text-xs font-semibold text-[#04624a] underline underline-offset-4 hover:text-[#034d3a]"
          >
            Open the full board
          </a>
        </div>
      </div>
    </div>
  );
}
