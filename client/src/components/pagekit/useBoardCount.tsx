import { useEffect, useState } from "react";

/**
 * The board count, read LIVE from GET /api/gspc — never hardcoded into copy.
 *
 * `/api/gspc` publishes `totals.public_count` as the human phrase the board
 * itself stands behind (today: "13 measured of 14"). Pages render whatever the
 * wire says. If the wire is unreachable we render NOTHING numeric and say so —
 * a surface that prints a stale count while looking live is the same defect as
 * quoting an unearned score.
 */

export type BoardCount = {
  /** e.g. "13 measured of 14" — straight off the wire, or null while loading/failed */
  phrase: string | null;
  measured: number | null;
  total: number | null;
  measuredOn: string | null;
  loading: boolean;
  error: string | null;
};

export function useBoardCount(): BoardCount {
  const [state, setState] = useState<BoardCount>({
    phrase: null,
    measured: null,
    total: null,
    measuredOn: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/gspc", { signal: ac.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j: any) => {
        const axes: any[] = Array.isArray(j?.axes) ? j.axes : [];
        const measured = axes.filter((a) => a?.status === "MEASURED").length || null;
        const total = j?.totals?.axes ?? (axes.length || null);
        setState({
          phrase: j?.totals?.public_count ?? (measured && total ? `${measured} measured of ${total}` : null),
          measured,
          total,
          measuredOn: j?.measured_on?.date ?? j?.measured_on ?? null,
          loading: false,
          error: null,
        });
      })
      .catch((e: any) => {
        if (ac.signal.aborted) return;
        setState((s) => ({ ...s, loading: false, error: String(e?.message ?? e) }));
      });
    return () => ac.abort();
  }, []);

  return state;
}

/**
 * Inline live board count. Renders the wire's own phrase, or an honest
 * placeholder — never a baked-in number.
 */
export function BoardCount({ suffix }: { suffix?: string }) {
  const { phrase, loading, error } = useBoardCount();
  if (loading) return <span className="text-gray-400">reading the live board…</span>;
  if (error || !phrase)
    return (
      <a href="/api/gspc" className="text-emerald-700 underline decoration-dotted">
        the live board at /api/gspc
      </a>
    );
  return (
    <span>
      <strong className="text-gray-900">{phrase}</strong>
      {suffix ? ` ${suffix}` : ""}
    </span>
  );
}

/** The board count as a headline stat, with its own source line. */
export function BoardCountStat() {
  const { phrase, measuredOn, loading, error } = useBoardCount();
  return (
    <div className="rounded-2xl border border-emerald-900/10 bg-white p-6">
      <div className="text-3xl font-black tracking-tight text-emerald-700 sm:text-4xl">
        {loading ? <span className="text-gray-300">…</span> : (phrase ?? "see /api/gspc")}
      </div>
      <div className="mt-2 text-sm font-bold text-gray-900">GSPC axes on the public board</div>
      <div className="mt-1 text-[12px] leading-snug text-gray-500">
        {error
          ? "Live count unavailable right now — read it yourself at GET /api/gspc."
          : `Live from GET /api/gspc${measuredOn ? ` · stamped ${measuredOn}` : ""}. Nothing here is typed by hand.`}
      </div>
    </div>
  );
}
