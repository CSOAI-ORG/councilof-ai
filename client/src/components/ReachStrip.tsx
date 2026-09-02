import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useBoardCount } from "@/lib/boardCount";
import {
  REACH_LID_FALLBACK,
  REACH_RULING,
  REACH_SURFACES,
  fetchHfOrgDownloads,
  formatDownloads,
  type HfReachSnapshot,
} from "@/lib/reachStrip";

/**
 * Compact "Where it's published" strip for the homepage.
 * Distribution reach for the authority narrative — printers of GET /api/gspc.
 * Lid always present. Optional live HF rolling downloads when Hub answers.
 */
export default function ReachStrip() {
  const board = useBoardCount();
  const lid = board.lid?.trim() || REACH_LID_FALLBACK;
  const [hf, setHf] = useState<HfReachSnapshot | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetchHfOrgDownloads(ac.signal).then((snap) => {
      if (snap) setHf(snap);
    });
    return () => ac.abort();
  }, []);

  return (
    <section
      aria-labelledby="reach-h"
      className="mt-10 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_16px_36px_-28px_rgba(4,18,12,.45)] sm:p-7"
      data-testid="reach-strip"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-700">
        Where it&apos;s published
      </p>
      <h2 id="reach-h" className="mt-2 text-xl font-bold text-slate-900">
        Printers of the live board
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{REACH_RULING}</p>

      <p
        className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2 font-mono text-[12px] leading-relaxed text-amber-950"
        data-testid="reach-strip-lid"
      >
        Lid: {lid}
      </p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REACH_SURFACES.map((s) => (
          <li key={s.id}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`reach-surface-${s.id}`}
              className="block h-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 hover:border-emerald-400/50 hover:bg-emerald-50/40"
            >
              <span className="font-mono text-[10px] uppercase tracking-wide text-emerald-800">
                {s.kind}
              </span>
              <span className="mt-1 block text-[13px] font-semibold text-slate-900">{s.label}</span>
              <span className="mt-1 block text-[12px] leading-relaxed text-slate-600">{s.note}</span>
              {s.id === "hf" && hf ? (
                <span
                  className="mt-2 block font-mono text-[11px] text-slate-500"
                  data-testid="reach-hf-downloads"
                >
                  Hub datasets rolling downloads: {formatDownloads(hf.downloads)} across{" "}
                  {hf.datasets} repos · as of {hf.asOf.slice(0, 10)} ·{" "}
                  <span className="underline">source on Hub</span>
                </span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[12px] leading-relaxed text-slate-500">
        Authority is live{" "}
        <a href="/api/gspc" className="font-medium text-emerald-800 hover:underline">
          GET /api/gspc
        </a>
        , signed cards, and free{" "}
        <Link href="/gspc-verify" className="font-medium text-emerald-800 hover:underline">
          verify
        </Link>
        . These listings do not certify anything. See also{" "}
        <Link href="/where-the-record-lives" className="font-medium text-emerald-800 hover:underline">
          where the record lives
        </Link>
        .
      </p>
    </section>
  );
}
