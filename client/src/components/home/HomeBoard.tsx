/**
 * Compact GSPC leaderboard for home.
 * Live board only. Empty rows stay empty. No TIE p-values on this pane.
 */
import { countLine, orderedRows, useGspcBoard, type GspcAxis } from "@/components/board/useGspcBoard";
import HomeUnderstand from "./HomeUnderstand";

export default function HomeBoard({ highlight }: { highlight?: string | null }) {
  const { data, error, loading } = useGspcBoard();
  const rows = orderedRows(data);
  const count = countLine(data);
  const want = (highlight || "").toLowerCase();

  return (
    <section
      aria-labelledby="home-board-h"
      className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_20px_44px_-32px_rgba(4,18,12,.45)] sm:p-7"
    >
      <h2 id="home-board-h" className="text-xl font-bold text-slate-900">
        GSPC leaderboard
      </h2>
      <p className="mt-1 text-sm font-semibold text-emerald-800" data-testid="os-live-strip">
        {error
          ? "Board is unreachable right now. Empty stays empty."
          : loading
            ? "Reading the board…"
            : count || "Empty stays empty."}
      </p>
      <p className="mt-1 text-sm text-slate-600">Empty rows stay empty. Not a ranking for sale.</p>
      <HomeUnderstand
        className="mt-4"
        title="How to read this table"
        items={[
          "A filled row is a measurement. A dash is honest emptiness.",
          "The count line is living GET /api/gspc — we do not type it into the page.",
          { kind: "usp", text: "Position is layout, not a purchased rank." },
        ]}
      />

      {data && !error && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              GSPC board. Position is layout, not a purchased rank.
            </caption>
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Axis</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">n</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Row key={row.axis} a={row} active={want !== "" && row.axis.toLowerCase() === want} />
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-slate-500">
                    Empty stays empty. The board did not return rows.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-sm">
        <a href="/dashboard?tab=board" className="font-medium text-emerald-800 hover:underline">
          Full board
        </a>
        {" · "}
        <a href="/methodology" className="text-slate-600 hover:underline">
          Methodology
        </a>
      </p>
    </section>
  );
}

function Row({ a, active }: { a: GspcAxis; active: boolean }) {
  const st = String(a.status || "UNMEASURED");
  const href = `/dashboard?tab=board#${encodeURIComponent(a.axis)}`;
  return (
    <tr
      id={`axis-${a.axis}`}
      className={`border-t border-slate-100 ${active ? "bg-emerald-50" : "hover:bg-slate-50"}`}
    >
      <td className="px-3 py-2 font-medium text-slate-900">
        <a href={href} className="hover:text-emerald-800">
          {a.axis}
        </a>
      </td>
      <td className="px-3 py-2">
        {st === "MEASURED" ? (
          <span className="text-emerald-800">MEASURED</span>
        ) : (
          <span className="text-slate-500">UNMEASURED</span>
        )}
      </td>
      <td className="px-3 py-2 font-mono text-slate-600">
        {st === "MEASURED" && typeof a.n === "number" ? a.n : "—"}
      </td>
    </tr>
  );
}
