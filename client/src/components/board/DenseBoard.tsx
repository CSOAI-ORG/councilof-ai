import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { fetchAxes, quotable, type Axis } from "@/lib/gspcAxes";

/**
 * DenseBoard — the shared GSPC board table used by homepage AND /os.
 *
 * ONE COMPONENT, TWO SURFACES. Homepage and Council OS Board door render the
 * same table. Any fix here applies to both.
 *
 * READ-FIRST. Counts from GET /api/gspc. Empty stays empty. provenance-controls
 * n=6 stays —. No unnamed slot. No in-lane as board row. No invented scores.
 *
 * CLICK-THROUGH. Each measured row links to verify.
 */

type SortKey = "axis" | "status" | "n" | "score";
type SortDir = "asc" | "desc";

export interface DenseBoardProps {
  /** Show the "Full scoreboard" CTA. Default true. */
  showScoreboardLink?: boolean;
  /** Callback when user clicks the scoreboard link (for in-app nav). */
  onOpenScoreboard?: () => void;
}

export default function DenseBoard({
  showScoreboardLink = true,
  onOpenScoreboard,
}: DenseBoardProps) {
  const [axes, setAxes] = useState<Axis[]>([]);
  const [publicCount, setPublicCount] = useState("");
  const [measuredOn, setMeasuredOn] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // "wire" only after a real live read. A snapshot fallback must never wear the
  // "Live from GET /api/gspc" header (A3: UNREACHABLE, never last-cached-as-live).
  const [source, setSource] = useState<"wire" | "snapshot">("snapshot");
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    const ac = new AbortController();
    fetchAxes(ac.signal)
      .then((r) => {
        setAxes(r.axes);
        setPublicCount(r.publicCount || "");
        setMeasuredOn(r.measuredOn || "");
        setLoading(false);
        setSource(r.source);
        if (r.error) setError(r.error);
      })
      .catch((e) => {
        if (!ac.signal.aborted) {
          setError(String(e?.message ?? e));
          setLoading(false);
        }
      });
    return () => ac.abort();
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "axis" ? "asc" : "desc");
    }
  };

  const sorted = [...axes].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortKey) {
      case "axis":
        return dir * a.axis.localeCompare(b.axis);
      case "status": {
        const aM = a.status === "MEASURED" ? 1 : 0;
        const bM = b.status === "MEASURED" ? 1 : 0;
        return dir * (bM - aM) || a.axis.localeCompare(b.axis);
      }
      case "n":
        return dir * ((a.n || 0) - (b.n || 0));
      case "score": {
        const aS = quotable(a) ? (a.accuracy ?? 0) : -1;
        const bS = quotable(b) ? (b.accuracy ?? 0) : -1;
        return dir * (aS - bS);
      }
      default:
        return 0;
    }
  });

  const stampAge = (() => {
    if (!measuredOn) return null;
    const match = measuredOn.match(/\d{4}-\d{2}-\d{2}/);
    if (!match) return null;
    const d = new Date(match[0]);
    const now = new Date();
    const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
    return days;
  })();

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="ml-1 inline-block opacity-60">
      {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : "⇅"}
    </span>
  );

  if (error && axes.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h3 className="font-bold text-amber-900">UNCHECKABLE</h3>
        <p className="mt-2 text-sm text-amber-800">
          GET /api/gspc did not answer. The board cannot speak numbers it has not read.
        </p>
        <p className="mt-1 text-xs text-amber-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            The GSPC Board
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {source === "wire" && !loading ? (
              <>
                Live from <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">GET /api/gspc</code>
                {publicCount && <span className="ml-2 font-semibold text-slate-900">{publicCount}</span>}
              </>
            ) : loading ? (
              <>Reading <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">GET /api/gspc</code>…</>
            ) : (
              <span className="font-semibold text-amber-800">
                UNREACHABLE — GET /api/gspc did not answer this load. Rows below are the bundled
                snapshot, not a live read; the endpoint is the authority.
              </span>
            )}
          </p>
        </div>
        {showScoreboardLink && (
          <a
            href="/dashboard?tab=board"
            onClick={onOpenScoreboard ? (e) => { e.preventDefault(); onOpenScoreboard(); } : undefined}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Full scoreboard <ChevronRight className="h-4 w-4" />
          </a>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[44rem] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              <th
                className="cursor-pointer select-none px-4 py-3 hover:text-slate-900"
                onClick={() => toggleSort("axis")}
              >
                Axis<SortIcon k="axis" />
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 text-center hover:text-slate-900"
                onClick={() => toggleSort("status")}
              >
                Status<SortIcon k="status" />
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 text-right hover:text-slate-900"
                onClick={() => toggleSort("n")}
              >
                n<SortIcon k="n" />
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 text-right hover:text-slate-900"
                onClick={() => toggleSort("score")}
              >
                Score<SortIcon k="score" />
              </th>
              <th className="px-4 py-3 text-center">Age</th>
              <th className="px-4 py-3 text-center">Verify</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : (
              sorted.map((a) => {
                const q = quotable(a);
                const isMeasured = a.status === "MEASURED";
                return (
                  <tr
                    key={a.axis}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-2">
                      <span className="font-semibold text-slate-900">{a.axis}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          isMeasured
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums text-slate-500">
                      {typeof a.n === "number" && a.n > 0 ? a.n : "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums">
                      {q ? (
                        <span className="font-bold text-emerald-700">
                          {((a.accuracy ?? 0) * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center font-mono text-xs text-slate-500">
                      {isMeasured && stampAge !== null ? `${stampAge}d` : "—"}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {isMeasured ? (
                        <a
                          href={`/gspc-verify?axis=${encodeURIComponent(a.axis)}`}
                          className="text-xs font-bold text-emerald-700 hover:underline"
                        >
                          verify
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Empty stays empty. Measurement credential — never certification.
      </p>
    </div>
  );
}
