/**
 * HubResultsPane — the published Hugging Face results, as their own population.
 *
 * WHY THIS EXISTS. WP-2 asks for published Hugging Face results to be visible, with
 * filters and provenance, and says different mill-card cohorts belong in a clearly
 * labelled results view rather than joined into the board rankings.
 *
 * Until now the `results` rail tab rendered HomeGspcBoard — the same component as the
 * `board` tab. Two doors, one destination, and a tab labelled "Benchmark results" that
 * delivered the 22-axis board. Meanwhile GET /api/hub-cards has been serving 699 signed
 * cells across 13 axes and 79 third-party models, and nothing in client/ read it.
 *
 * WHAT IS DELIBERATELY NOT DONE HERE. These cells are never merged into the board, never
 * ranked against it, and never summed with it. The two populations answer different
 * questions and the endpoint says so itself. Every qualifier below is quoted from the
 * payload's own `honesty` block rather than written here, so the page cannot drift from
 * the producer's stated limits.
 *
 * THE NUMBER THAT MUST NOT APPEAR. An UNMEASURED cell still carries an accuracy. This
 * component routes every figure through `displayAccuracy`, which returns null unless the
 * status is exactly MEASURED; an UNMEASURED row shows its reasons instead of a score.
 * See useHubCards.ts.
 */
import { useMemo, useState } from "react";
import {
  axesIn,
  displayAccuracy,
  statusesIn,
  useHubCards,
  type HubCell,
} from "./useHubCards";

const ALL = "__all__";

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

export default function HubResultsPane() {
  const { data, error, loading } = useHubCards();
  const [axis, setAxis] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);

  const cells = data?.cells ?? [];
  const axes = useMemo(() => axesIn(cells), [cells]);
  const statuses = useMemo(() => statusesIn(cells), [cells]);

  const shown = useMemo(
    () =>
      cells.filter(
        (c) =>
          (axis === ALL || c.axis === axis) &&
          (status === ALL || c.status === status),
      ),
    [cells, axis, status],
  );

  if (loading) {
    return (
      <div className="p-6 text-sm text-emerald-100/70" role="status">
        Loading published Hub results…
      </div>
    );
  }

  if (error) {
    // In words. No placeholder rows, no zeroes standing in for data.
    return (
      <div className="p-6 text-sm" role="alert">
        <p className="font-semibold text-rose-300">
          The published Hub results could not be read.
        </p>
        <p className="mt-2 text-emerald-100/70">
          GET /api/hub-cards did not answer: {error}. Nothing is shown rather than a
          number that is not a measurement.
        </p>
      </div>
    );
  }

  const counts = data?.counts ?? {};

  return (
    <section className="p-4 sm:p-6" aria-labelledby="hub-results-heading">
      <h2 id="hub-results-heading" className="text-lg font-bold text-emerald-100">
        Published Hub results
      </h2>

      {/* Provenance, before any number. */}
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {data?.population && (
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wide text-emerald-300/70">
              Population
            </dt>
            <dd className="text-emerald-100/85">{data.population}</dd>
          </div>
        )}
        {data?.source && (
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wide text-emerald-300/70">
              Source
            </dt>
            <dd className="break-all text-emerald-100/85">{data.source}</dd>
          </div>
        )}
        {data?.as_of && (
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wide text-emerald-300/70">
              Observed
            </dt>
            <dd className="text-emerald-100/85">{data.as_of}</dd>
          </div>
        )}
        {data?.schema && (
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wide text-emerald-300/70">
              Schema
            </dt>
            <dd className="text-emerald-100/85">{data.schema}</dd>
          </div>
        )}
      </dl>

      {/* The producer's own limits, verbatim. Not paraphrased. */}
      {data?.honesty && (
        <ul className="mt-4 space-y-1 rounded-xl border border-emerald-500/20 bg-black/20 p-4 text-sm text-emerald-100/75">
          {Object.entries(data.honesty).map(([k, v]) => (
            <li key={k}>{v}</li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-sm text-emerald-100/75">
        {counts.cells ?? cells.length} cells · {counts.measured ?? 0} MEASURED ·{" "}
        {counts.unmeasured ?? 0} UNMEASURED. Every cell here is signed. A signature is
        not a verification: it says the card bytes carry one, not that anyone checked it
        or that the verdict inside is a measurement.
      </p>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-emerald-100/70">Axis</span>
          <select
            className="rounded-lg border border-emerald-500/30 bg-black/30 px-2 py-1 text-emerald-100"
            value={axis}
            onChange={(e) => setAxis(e.target.value)}
          >
            <option value={ALL}>All {axes.length} axes</option>
            {axes.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-emerald-100/70">Status</span>
          <select
            className="rounded-lg border border-emerald-500/30 bg-black/30 px-2 py-1 text-emerald-100"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value={ALL}>All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <span className="self-center text-emerald-100/60">
          {shown.length} shown
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Published Hugging Face Hub results: one row per model and axis, with status,
            sample size and the signed card behind each.
          </caption>
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-emerald-300/70">
              <th scope="col" className="py-2 pr-3">Model</th>
              <th scope="col" className="py-2 pr-3">Axis</th>
              <th scope="col" className="py-2 pr-3">Status</th>
              <th scope="col" className="py-2 pr-3 text-right">Accuracy</th>
              <th scope="col" className="py-2 pr-3 text-right">n</th>
              <th scope="col" className="py-2 pr-3">Card</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[13px] tabular-nums">
            {shown.map((c: HubCell) => {
              const acc = displayAccuracy(c);
              return (
                <tr
                  key={`${c.model}::${c.axis}::${c.card_sha256 ?? ""}`}
                  className="border-t border-emerald-500/10"
                >
                  <td className="py-1.5 pr-3 font-sans">{c.model}</td>
                  <td className="py-1.5 pr-3">{c.axis}</td>
                  <td className="py-1.5 pr-3">
                    {c.status}
                    {c.status !== "MEASURED" && c.unmeasured?.length ? (
                      <span className="ml-2 font-sans text-emerald-100/60">
                        ({c.unmeasured.join(", ")})
                      </span>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap py-1.5 pr-3 text-right">
                    {acc === null ? (
                      // The cell may carry a number. It is not a result until the
                      // status says so, so it is not printed as one.
                      <span className="font-sans text-emerald-100/50">
                        not a measurement
                      </span>
                    ) : (
                      pct(acc)
                    )}
                  </td>
                  <td className="whitespace-nowrap py-1.5 pr-3 text-right">{c.n ?? ""}</td>
                  <td className="whitespace-nowrap py-1.5 pr-3">
                    {c.card_url ? (
                      <a
                        className="text-emerald-300 underline hover:text-emerald-200"
                        href={c.card_url}
                      >
                        {(c.card_sha256 ?? "").slice(0, 12) || "card"}
                      </a>
                    ) : (
                      ""
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
