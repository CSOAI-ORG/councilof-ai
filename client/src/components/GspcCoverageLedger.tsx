import { useEffect, useState } from "react";
import { ExternalLink, Grid3X3, RefreshCw } from "lucide-react";
import {
  buildCoverageLedger,
  isCoverageSnapshot,
  type CoverageCell,
  type CoverageLedgerInput,
  type CoverageRow,
} from "@/lib/coverageLedger";

const SOURCES: Record<keyof CoverageLedgerInput, string> = {
  gspc: "/api/gspc",
  stablecoins: "/interop/stablecoin-universe-2026-09/readiness.json",
  xrpl: "/api/xrpl",
  swift: "/api/swift",
  banks: "/api/bank-complete",
  x402: "/api/x402",
  revenue: "/api/revenue",
};

async function readJson(url: string, signal: AbortSignal): Promise<unknown> {
  try {
    const response = await fetch(url, {
      signal,
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    const body = await response.text();
    if (!body.trim() || body.trimStart().startsWith("<")) return null;
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function Cell({ cell }: { cell: CoverageCell }) {
  if (cell.value === null) {
    return (
      <span
        className="text-slate-400"
        title={`${cell.source} · ${cell.field} · ${cell.unavailable}`}
        aria-label={`not published by ${cell.source}`}
      >
        —
      </span>
    );
  }
  return (
    <span
      className="font-semibold tabular-nums text-slate-950"
      title={`${cell.source} · ${cell.field}`}
    >
      {cell.value.toLocaleString()}
    </span>
  );
}

export default function GspcCoverageLedger() {
  const [rows, setRows] = useState<CoverageRow[] | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      const snapshot = await readJson("/api/coverage", controller.signal);
      if (isCoverageSnapshot(snapshot)) return snapshot.rows;
      const pairs = await Promise.all(
        Object.entries(SOURCES).map(async ([key, url]) => [
          key,
          await readJson(url, controller.signal),
        ]),
      );
      return buildCoverageLedger(
        Object.fromEntries(pairs) as CoverageLedgerInput,
      );
    })().then((nextRows) => {
      if (controller.signal.aborted) return;
      setRows(nextRows);
    });
    return () => controller.abort();
  }, [reload]);

  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
      aria-labelledby="gspc-coverage-ledger-title"
      data-testid="gspc-coverage-ledger"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-950 p-4 text-white">
        <div className="flex max-w-3xl items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
            <Grid3X3 className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
              Master coverage ledger
            </p>
            <h3
              id="gspc-coverage-ledger-title"
              className="mt-1 text-lg font-bold"
            >
              All current universes, one evidence grammar
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Indexed → measured → signed → rooted → witnessed → anchored →
              paid. Every number is read from its owning endpoint on this load.
              A dash means that source does not publish that stage; it never
              means zero.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setRows(null);
            setReload((value) => value + 1);
          }}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/20 px-3 text-xs font-semibold hover:bg-white/10"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Refresh
        </button>
      </div>

      {!rows ? (
        <div className="p-6 text-sm text-slate-500">
          Reading all evidence doors…
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[70rem] border-collapse text-left text-xs">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  {[
                    "Universe",
                    "Indexed",
                    "Measured",
                    "Signed",
                    "Rooted",
                    "Witnessed",
                    "Anchored",
                    "Paid",
                    "Writes GSPC",
                  ].map((label) => (
                    <th key={label} className="px-3 py-2.5 font-semibold">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-slate-100 align-top"
                  >
                    <td className="px-3 py-3">
                      <a
                        href={row.href}
                        className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline"
                      >
                        {row.label}{" "}
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {row.unit}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Cell cell={row.indexed} />
                    </td>
                    <td className="px-3 py-3">
                      <Cell cell={row.measured} />
                    </td>
                    <td className="px-3 py-3">
                      <Cell cell={row.signed} />
                    </td>
                    <td className="px-3 py-3">
                      <Cell cell={row.rooted} />
                    </td>
                    <td className="px-3 py-3">
                      <Cell cell={row.witnessed} />
                    </td>
                    <td className="px-3 py-3">
                      <Cell cell={row.anchored} />
                    </td>
                    <td className="px-3 py-3">
                      <Cell cell={row.paid} />
                    </td>
                    <td className="px-3 py-3">
                      {row.writesBoard === null ? (
                        <span className="text-slate-400">—</span>
                      ) : row.writesBoard ? (
                        <span className="font-semibold text-emerald-800">
                          YES
                        </span>
                      ) : (
                        <span className="font-semibold text-amber-800">NO</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-px border-t border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <p
                key={`${row.id}-note`}
                className="bg-white p-3 text-[10px] leading-relaxed text-slate-600"
              >
                <strong className="text-slate-800">{row.label}:</strong>{" "}
                {row.note}
              </p>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
