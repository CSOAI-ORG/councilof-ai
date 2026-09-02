import { useGspcBoard } from "@/components/board/useGspcBoard";
import { heroCells, heroStrip } from "./heroBoard";

/**
 * First paint of councilof.ai — the instrument, not a workspace product.
 * Totals come from GET /api/gspc. Empty cells stay empty.
 */
export default function HeroBoard() {
  const { data, error, loading } = useGspcBoard();
  const unreachable = !loading && (!!error || !data);
  const strip = heroStrip(data, unreachable);
  const cells = heroCells(data);

  return (
    <section className="surface-ink py-14 sm:py-18 lg:py-20" aria-labelledby="home-h1">
      <div className="section-shell">
        <h1 id="home-h1" className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
          Council of AI
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-emerald-100/90">
          Independent measurement body. We measure, sign, re-attest. We do not certify.
        </p>

        <p
          data-testid="live-strip"
          className="mt-6 font-mono text-sm font-semibold tracking-wide text-emerald-200"
        >
          {strip.text}
        </p>
        {strip.live && (
          <p className="mt-1 text-[11px] text-emerald-200/70">live from GET /api/gspc</p>
        )}

        <ul
          className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          aria-label="Living GSPC board"
        >
          {cells.map((c) => (
            <li
              key={c.axis}
              className={
                c.filled
                  ? "rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-2.5"
                  : "rounded-lg border border-dashed border-white/25 bg-transparent px-3 py-2.5"
              }
            >
              <span className="block truncate text-[12px] font-bold text-white">{c.axis}</span>
              <span className="mt-1 block font-mono text-[11px] text-emerald-100/80">
                n {c.nLabel}
                {c.filled ? ` · ${c.figureLabel}` : " · empty"}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <a
            href="/gspc-verify"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-bold text-[#04120c] shadow-lg transition-colors hover:bg-emerald-400"
          >
            Verify a card
          </a>
          <a
            href="/dashboard?tab=board"
            className="inline-flex items-center justify-center rounded-xl border border-white/35 bg-transparent px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Open the board
          </a>
          <a
            href="/dashboard?tab=board"
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold text-emerald-100/90 transition-colors hover:bg-white/10"
          >
            Council OS
          </a>
        </div>
      </div>
    </section>
  );
}
