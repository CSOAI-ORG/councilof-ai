import { useEffect } from "react";
import batch from "@/data/mill-batch-2026-09-24.json";
import { setMetaDescription } from "@/lib/utils";

/** A dated directory of already-published evidence, never a live board or ranking. */
export default function SignedMillBatch20260924() {
  useEffect(() => {
    document.title = "13:10 UTC signed measurement batch | Council of AI";
    setMetaDescription(
      "Fourteen signed measurement cards from the 13:10 UTC run on 24 September 2026: thirteen MEASURED and one UNMEASURED, linked to exact public JSON and root.",
    );
  }, []);

  const measured = batch.cards.filter((card) => card.status === "MEASURED").length;
  const unmeasured = batch.cards.filter((card) => card.status === "UNMEASURED").length;

  return (
    <section className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
          Dated evidence directory · 24 September 2026
        </p>
        <h1 className="mt-3 text-4xl font-black text-gray-900">Signed mill batch</h1>
        <p className="mt-2 text-sm font-semibold text-amber-900">
          This page records the 13:10 UTC run only. Later runs are separate and are not represented here.
        </p>
        <p className="mt-4 max-w-3xl text-gray-700">
          {batch.cards.length} signed cards from one {batch.model} run: {measured} marked MEASURED
          and {unmeasured} marked UNMEASURED. The latter has 28 graded items, below the
          30-item reporting threshold; no accuracy is quoted here. These are card states,
          not GSPC board admissions or a model ranking.
        </p>

        <section aria-labelledby="batch-root" className="mt-8 rounded-2xl border border-emerald-600/20 bg-white p-6 shadow-sm">
          <h2 id="batch-root" className="text-lg font-bold text-gray-900">Exact root for this batch</h2>
          <p className="mt-2 text-sm text-gray-700">
            Root dated <time dateTime={batch.root_as_of}>{batch.root_as_of}</time>. Its 1,423 leaves
            cover the wider signed-card estate; the 14 links below are this run’s cards within it.
          </p>
          <a className="mt-3 inline-block font-semibold text-emerald-800 underline" href={batch.root_path}>
            Download the immutable card root
          </a>
          <p className="mt-3 break-all font-mono text-xs text-gray-600">Root SHA-256: {batch.root_sha256}</p>
          <p className="mt-1 break-all font-mono text-xs text-gray-600">Merkle root: {batch.merkle_root}</p>
          <p className="mt-2 text-sm text-gray-600">
            The root’s OpenTimestamps proof was calendar-pending at the{" "}
            <time dateTime={batch.readback_at}>13:59 UTC readback</time>.
            This page makes no Bitcoin-anchor claim. A root commitment is not a certification.
          </p>
        </section>

        <section aria-labelledby="batch-cards" className="mt-8 rounded-2xl border border-emerald-600/20 bg-white p-6 shadow-sm">
          <h2 id="batch-cards" className="text-lg font-bold text-gray-900">The 14 signed cards</h2>
          <p className="mt-1 text-sm text-gray-600">Open each JSON to inspect its method, sample and signature.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-700">
                  <th scope="col" className="py-2 pr-4">Axis</th>
                  <th scope="col" className="py-2 pr-4">Card state</th>
                  <th scope="col" className="py-2 pr-4">Graded items</th>
                  <th scope="col" className="py-2">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {batch.cards.map((card) => (
                  <tr key={card.path} className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-medium text-gray-900">{card.axis}</td>
                    <td className="py-3 pr-4">{card.status}</td>
                    <td className="py-3 pr-4 tabular-nums">{card.n}</td>
                    <td className="py-3">
                      <a className="font-medium text-emerald-800 underline" href={card.path}>
                        Signed JSON
                      </a>
                      <span className="mt-1 block break-all font-mono text-[11px] text-gray-500">{card.path}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-8 text-sm text-gray-600">
          Measurement, not certification. For the current board state, see the{" "}
          <a className="text-emerald-800 underline" href="/dashboard?tab=board">GSPC board</a>.
        </p>
      </div>
    </section>
  );
}
