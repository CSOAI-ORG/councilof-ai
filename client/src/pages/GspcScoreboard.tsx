import { useEffect, useState } from "react";
import { setMetaDescription } from "@/lib/utils";
import { gspcDatasetLd } from "@/lib/datasetSchema";

/**
 * /gspc-scoreboard — the live board, honestly displayed (NEXT-100 #2).
 * Every hero CTA already points here; until now it fell through to the SPA
 * catch-all. Renders LIVE from /api/gspc: per-axis n, leader accuracy with
 * Wilson CI where the n is honest, and first-class separation chips.
 * LMArena rule adopted verbatim: overlapping/failed separation renders as
 * "statistically indistinguishable" — never as a ranking.
 */

interface Axis {
  axis: string;
  bench: string;
  n: number;
  accuracy: number;
  leader: string;
  separation: "SEPARATED" | "TIE" | "UNTESTED";
  separation_p?: number;
  interval?: [number, number];
  status: string;
}

// The board Dataset + a hasPart catalog of all 13 published per-axis banks, so
// Hugging Face Dataset-Search and answer engines can index each bank (real HF
// URLs, CC-BY-4.0, the resolving concept DOI) from this one crawlable page.
// Derived from the axis registry — see client/src/lib/datasetSchema.ts.
const DATASET_LD = gspcDatasetLd();

const CHIP: Record<string, string> = {
  SEPARATED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  TIE: "bg-amber-100 text-amber-800 border-amber-300",
  UNTESTED: "bg-gray-100 text-gray-600 border-gray-300",
};

export default function GspcScoreboard() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = "The GSPC board — 13 measured of 14, live | Council of AI";
    setMetaDescription("The live GSPC board — 13 measured of 14, every measured cell with n and 95% CI where honest. UNMEASURED is reported, never hidden. Counts and stamps come from GET /api/gspc.");
    fetch("/api/gspc")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(DATASET_LD) }} />
      <div className="mx-auto max-w-5xl px-6 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          Live from GET /api/gspc — recompute anything, free
        </p>
        <h1 className="mt-3 text-4xl font-black text-gray-900">The GSPC board</h1>
        <p className="mt-3 max-w-3xl text-gray-600">
          {data?.totals?.public_count ?? "13 measured of 14 quotable"} · deterministic grading on
          frozen, published splits · a <strong>TIE</strong> means the leader&apos;s edge is{" "}
          <strong>statistically indistinguishable</strong> (McNemar p≥0.05) — ties are never counted
          as wins. Empty cells stay empty.
        </p>

        {err && <p className="mt-8 text-red-600">Board fetch failed: {err} — the API at /api/gspc is the source of truth.</p>}
        {!data && !err && <p className="mt-8 text-gray-500">Loading the live board…</p>}

        {data && (
          <div className="mt-8 overflow-x-auto rounded-xl border border-emerald-600/15 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-emerald-50/60 text-left text-gray-700">
                  <th className="p-3">Axis</th>
                  <th className="p-3">Bench</th>
                  <th className="p-3">n</th>
                  <th className="p-3">Leader accuracy</th>
                  <th className="p-3">95% CI</th>
                  <th className="p-3">Separation</th>
                </tr>
              </thead>
              <tbody>
                {(data.axes as Axis[]).map((a) => (
                  <tr key={a.axis} className="border-b last:border-0">
                    <td className="p-3 font-semibold text-gray-900">{a.axis}</td>
                    <td className="p-3 text-gray-600">{a.bench}</td>
                    <td className="p-3 font-mono">{a.n}</td>
                    <td className="p-3 font-mono">
                      {(a as any).accuracy_is ? "≥" : ""}{(a.accuracy * 100).toFixed(1)}%
                      {(a as any).accuracy_is && (
                        <span className="ml-1 text-[10px] uppercase tracking-wide text-gray-400" title={(a as any).accuracy_is}>
                          lower bound
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-gray-600">
                      {a.interval ? `${(a.interval[0] * 100).toFixed(1)}–${(a.interval[1] * 100).toFixed(1)}%` : "withheld (n not independent)"}
                    </td>
                    <td className="p-3">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${CHIP[a.separation]}`}>
                        {a.separation === "TIE" ? "TIE — indistinguishable" : a.separation}
                      </span>
                      {a.separation_p !== undefined && (
                        <span className="ml-2 font-mono text-[11px] text-gray-400">p={a.separation_p}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3 text-sm">
          <a href="/gspc-verify" className="rounded-xl border border-emerald-600/20 bg-white p-4 font-semibold text-emerald-700 hover:bg-emerald-50">
            Verify a card — free, in your browser →
          </a>
          <a href="/honesty" className="rounded-xl border border-emerald-600/20 bg-white p-4 font-semibold text-emerald-700 hover:bg-emerald-50">
            The honesty gate — our own losses →
          </a>
          <a href="/api/reported" className="rounded-xl border border-emerald-600/20 bg-white p-4 font-semibold text-emerald-700 hover:bg-emerald-50">
            REPORTED — third-party context, cited →
          </a>
        </div>

        <p className="mt-8 text-xs text-gray-500">
          Measurement, not certification. Leaders shown are point estimates (swarm quotes its 95%
          lower bound); only SEPARATED leads (4 of 14 slots — swarm ungated 19 Aug 2026) are
          statistically real. Jail (slot 14) was measured on a smaller
          fleet with no separation test — stated, never hidden. Full per-axis notes, fleet means,
          harm tails and the signed living stamp: <code>GET /api/gspc</code>.
        </p>
      </div>
    </div>
  );
}
