import { BOARD_LIVE_RULING, CENSUS_SITES, EMPTY_SLOTS } from "@/lib/emptySlots";

/**
 * /products board-honesty panel. Component name EmptySlots kept for imports.
 * Strangers see 22·22·0 — not seven-empty chrome. Cards are MEASURED instrument
 * notes with live axis ids (data-testid axis-note-*), never empty-slot-*.
 */
export default function EmptySlots({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const dark = tone === "dark";
  const panel = dark
    ? "rounded-2xl border border-emerald-400/20 bg-emerald-950/40 p-4"
    : "rounded-2xl border border-slate-200 bg-white p-4";
  const title = dark ? "text-slate-100" : "text-slate-900";
  const body = dark ? "text-slate-300" : "text-slate-600";
  const muted = dark ? "text-emerald-300/80" : "text-emerald-800";
  const head = dark ? "text-emerald-300" : "text-slate-900";

  return (
    <section className="mt-12 space-y-8" data-testid="board-honesty" aria-labelledby="board-honesty-h">
      <div>
        <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${muted}`}>
          Board honesty · live GET · Hub 1191+
        </p>
        <h2 id="board-honesty-h" className={`mt-2 text-xl font-bold ${head}`}>
          {BOARD_LIVE_RULING}
        </h2>
        <p className={`mt-3 text-sm ${body}`}>
          Board 22·22·0 — zero declared empty on GET /api/gspc. Notes below are MEASURED
          instrument history for financial/domain axes (live ids). Empty-as-finding only when{" "}
          <code className="text-[12px]">unmeasured_axes &gt; 0</code>. Not a certificate.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {EMPTY_SLOTS.map((row) => (
          <li key={row.id} className={panel} data-testid={`axis-note-${row.id}`}>
            <h3 className={`font-semibold ${title}`}>{row.axis} · MEASURED</h3>
            <p className={`mt-2 text-sm ${body}`}>{row.honest_next}</p>
            <p className={`mt-2 text-[12px] ${muted}`}>Never: {row.never}</p>
          </li>
        ))}
      </ul>
      <div>
        <h3 className={`text-sm font-bold ${title}`}>Speed 0 sites — DISCOVERED only</h3>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {CENSUS_SITES.map((s) => (
            <li key={s.id} className={panel} data-testid={`census-site-${s.id}`}>
              <div className="flex items-baseline justify-between gap-2">
                <h4 className={`font-semibold ${title}`}>{s.title}</h4>
                <span className={`font-mono text-[10px] uppercase ${muted}`}>{s.status}</span>
              </div>
              <p className={`mt-2 text-sm ${body}`}>{s.does}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
