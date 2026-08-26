import { useGspcBoard, type GspcAxis } from "./board/useGspcBoard";
import { accuracyCell, intervalCell, separationNote } from "@/lib/axisCells";

/**
 * AxisProof — the block that turns a commercial page into a checkable one.
 *
 * ── THE DEFECT THIS CLOSES ───────────────────────────────────────────────────
 * The audience pages (/for/:persona) and the sector pages (/industries/:slug)
 * were the pages a buyer is actually sent to, and they named no axis, no n and
 * no card. The measurement was absent from the measurement company's own
 * commercial surfaces: a reader could agree with every sentence and still have
 * nothing to check. Sector pages that DID carry a figure carried it as a typed
 * literal in a data file, which is the other half of the same defect.
 *
 * ── WHAT IT DOES ─────────────────────────────────────────────────────────────
 * A page names the axes that bear on its reader — a LABEL, which is canon and
 * safe to write down — and this component reads their live rows from
 * GET /api/gspc. Every number on screen (n, leader accuracy, interval,
 * separation) comes off that payload. Nothing here is typed, and when the
 * payload does not carry a field the cell says so in words via axisCells rather
 * than computing on `undefined` (which is how `NaN%` reached /insurers).
 *
 * ── WHAT IT WILL NOT DO ──────────────────────────────────────────────────────
 * It does not invent a row. An axis named by a page that the board does not
 * carry is rendered as "not on the board" rather than silently dropped, because
 * a silently dropped row is how a page comes to describe a measurement that
 * does not exist. It states UNMEASURED where the board states it, and it never
 * renders 0% for an absent figure.
 */

export interface AxisProofProps {
  /** Axis ids exactly as GET /api/gspc names them. Labels, not numbers. */
  axes: string[];
  /** Why THIS reader should care about THESE axes. One sentence, sector-specific. */
  why: string;
  /** Light surface (persona/sector pages) or dark (Council OS surfaces). */
  tone?: "light" | "dark";
  className?: string;
}

const T = {
  light: {
    wrap: "rounded-2xl border border-emerald-600/20 bg-white",
    head: "border-b border-emerald-600/15 bg-emerald-50/60",
    title: "text-slate-900",
    sub: "text-slate-600",
    cell: "text-slate-800",
    axis: "text-slate-900",
    muted: "text-slate-500",
    link: "text-emerald-700",
  },
  dark: {
    wrap: "rounded-2xl border border-emerald-500/20 bg-[#05140d]",
    head: "border-b border-emerald-500/15 bg-emerald-500/5",
    title: "text-emerald-50",
    sub: "text-emerald-100/70",
    cell: "text-emerald-100/85",
    axis: "text-emerald-50",
    muted: "text-emerald-300/60",
    link: "text-emerald-300",
  },
} as const;

export default function AxisProof({ axes, why, tone = "light", className = "" }: AxisProofProps) {
  const { data, error, loading } = useGspcBoard();
  const t = T[tone];
  const rows: (GspcAxis | { axis: string; missing: true })[] = axes.map((id) => {
    const hit = (data?.axes as GspcAxis[] | undefined)?.find((a) => a.axis === id);
    return hit ?? { axis: id, missing: true as const };
  });

  return (
    <section className={`${t.wrap} overflow-hidden ${className}`} aria-labelledby="axisproof-h">
      <div className={`${t.head} px-5 py-4`}>
        <h2 id="axisproof-h" className={`text-base font-bold ${t.title}`}>
          What you can check, right now
        </h2>
        <p className={`mt-1 text-sm leading-relaxed ${t.sub}`}>{why}</p>
      </div>

      {error && (
        <p className={`px-5 py-4 text-sm ${t.sub}`}>
          The live board could not be read ({error}). Nothing is shown in its place —
          <a href="/api/gspc" className={`ml-1 font-semibold underline ${t.link}`}>GET /api/gspc</a> is
          the source of truth, not this page.
        </p>
      )}
      {loading && !error && <p className={`px-5 py-4 text-sm ${t.muted}`}>Reading the live board…</p>}

      {data && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-left ${t.sub}`}>
                <th className="px-5 py-2 font-semibold">Axis</th>
                <th className="px-3 py-2 font-semibold">Bench</th>
                <th className="px-3 py-2 font-semibold">n</th>
                <th className="px-3 py-2 font-semibold">Leader accuracy</th>
                <th className="px-3 py-2 font-semibold">95% CI</th>
                <th className="px-5 py-2 font-semibold">Separation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                if ("missing" in r) {
                  return (
                    <tr key={r.axis} className="border-t border-current/10">
                      <td className={`px-5 py-3 font-semibold ${t.axis}`}>{r.axis}</td>
                      <td className={`px-3 py-3 ${t.muted}`} colSpan={5}>
                        not on the board — this page names an axis GET /api/gspc does not carry
                      </td>
                    </tr>
                  );
                }
                const a = r as GspcAxis;
                const acc = accuracyCell(a);
                const iv = intervalCell(a);
                const sep = separationNote(a);
                return (
                  <tr key={a.axis} className="border-t border-current/10">
                    <td className={`px-5 py-3 font-semibold ${t.axis}`}>{a.axis}</td>
                    <td className={`px-3 py-3 ${t.cell}`}>{a.bench || "—"}</td>
                    {/* A declared slot serves n:0. Printing "0" in an n column reads as
                        "we measured zero items", which is a measurement claim; the slot's
                        honest state is that nothing was measured at all. Render the unit
                        the board supplies instead, and keep the figure only where one
                        exists. Never 0. */}
                    <td className={`px-3 py-3 font-mono ${t.cell}`}>
                      {typeof a.n === "number" && a.n > 0 ? (
                        <>
                          {a.n}
                          {(a as any).n_unit && (
                            <span className={`ml-1 font-sans text-[10px] ${t.muted}`}>{(a as any).n_unit}</span>
                          )}
                        </>
                      ) : (
                        <span className={`font-sans text-[11px] ${t.muted}`}>
                          {(a as any).n_unit || "—"}
                        </span>
                      )}
                    </td>
                    <td className={`px-3 py-3 font-mono ${t.cell}`} data-testid={`axisproof-acc-${a.axis}`}>
                      {acc.state === "figure" && <>{acc.prefix}{acc.text}</>}
                      {acc.state === "facts" && (
                        <span title={acc.title} className={`font-sans ${t.muted}`}>
                          {acc.text}
                          {acc.detail && <span className="mt-0.5 block text-[11px]">{acc.detail}</span>}
                        </span>
                      )}
                      {acc.state === "unmeasured" && (
                        <span title={acc.title} className={`font-sans ${t.muted}`}>{acc.text}</span>
                      )}
                    </td>
                    <td className={`px-3 py-3 font-mono text-[12px] ${t.cell}`}>
                      <span title={iv.title} className={iv.text.includes("%") ? "" : `font-sans ${t.muted}`}>{iv.text}</span>
                    </td>
                    <td className={`px-5 py-3 ${t.cell}`}>
                      {a.separation ? (
                        <span className="text-[12px] font-semibold">
                          {a.separation === "TIE" ? "TIE — indistinguishable" : a.separation}
                          {typeof a.separation_p === "number" && (
                            <span className={`ml-1 font-normal ${t.muted}`}>p={a.separation_p}</span>
                          )}
                        </span>
                      ) : (
                        <span className={`text-[12px] ${t.muted}`}>{sep || a.status || "—"}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className={`border-t border-current/10 px-5 py-3 text-[12px] leading-relaxed ${t.sub}`}>
        Every figure above is read from <a href="/api/gspc" className={`font-semibold underline ${t.link}`}>GET /api/gspc</a> when
        this page loads — none of it is written into the page. Recompute a signed card yourself at{" "}
        <a href="/gspc-verify" className={`font-semibold underline ${t.link}`}>/gspc-verify</a>, walk every
        chain position at <a href="/signed/chain.json" className={`font-semibold underline ${t.link}`}>/signed/chain.json</a>, and
        read the rules the grades are computed under at{" "}
        <a href="/methodology" className={`font-semibold underline ${t.link}`}>/methodology</a>. A leader is
        the highest point estimate on the board, not an approval; a TIE is not a win; and{" "}
        <span className="font-semibold">unmeasured</span> means no run exists — never zero. We measure
        against these obligations; we do not enforce them and we certify nothing.
      </div>
    </section>
  );
}
