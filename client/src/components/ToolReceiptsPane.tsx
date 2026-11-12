import { useEffect, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import {
  clearToolReceipts,
  exportToolReceipts,
  listToolReceipts,
  RECEIPTS_CAP,
  type ToolReceipt,
} from "@/lib/toolReceipts";

/**
 * ToolReceiptsPane — your local log of the tools you have run in this browser
 * (2026-11-02, plan item P5).
 *
 * This pane renders ToolRunner's receipts: tool, door, outcome, time and the hash of the
 * arguments you sent. It is deliberately modest about what it is: a localStorage list is the
 * reader's own note-taking, NOT signed evidence — a signed record is one you can verify with
 * the verify tools, and nothing here is that. Export downloads the list as JSON; clear empties
 * it. Nothing leaves the browser.
 */
export default function ToolReceiptsPane() {
  const [receipts, setReceipts] = useState<ToolReceipt[] | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setReceipts(listToolReceipts());
    // Live refresh (QA fix, 2026-11-04): the receipts lib signals after every record/clear, so a
    // run that happens while this pane is mounted appears without a remount.
    const refresh = () => setReceipts(listToolReceipts());
    window.addEventListener("coai:receipts-changed", refresh);
    return () => window.removeEventListener("coai:receipts-changed", refresh);
  }, []);

  const refresh = () => setReceipts(listToolReceipts());

  if (receipts === null) return null;
  if (!receipts.length) {
    return (
      <section
        aria-labelledby="receipts-h"
        className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4"
        data-testid="tool-receipts"
      >
        <h3 id="receipts-h" className="text-sm font-bold text-slate-900">Your run receipts</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Nothing yet. Every tool you run here leaves a small local receipt (tool, door, outcome,
          time, and a hash of the arguments — never the arguments). Kept in this browser only;
          a local log is not signed evidence.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="receipts-h"
      className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4"
      data-testid="tool-receipts"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 id="receipts-h" className="text-sm font-bold text-slate-900">
          Your run receipts
          <span className="ml-2 font-mono text-xs font-normal text-slate-500" data-testid="receipts-count">
            {receipts.length} kept of {RECEIPTS_CAP} max
          </span>
        </h3>
        <span className="ml-auto inline-flex gap-2">
          <a
            href={`data:application/json;charset=utf-8,${encodeURIComponent(exportToolReceipts() ?? "{}")}`}
            download={`tool-receipts-${new Date().toISOString().slice(0, 10)}.json`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            data-testid="receipts-export"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" /> Export JSON
          </a>
          {confirmClear ? (
            <span className="inline-flex gap-1.5">
              <button
                type="button"
                onClick={() => { clearToolReceipts(); setConfirmClear(false); refresh(); }}
                className="inline-flex min-h-9 items-center rounded-lg bg-red-600 px-2.5 text-xs font-bold text-white hover:bg-red-500"
                data-testid="receipts-clear-confirm"
              >
                Really clear
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="inline-flex min-h-9 items-center rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Keep
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              data-testid="receipts-clear"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Clear
            </button>
          )}
        </span>
      </div>
      <ul className="mt-3 list-none space-y-1.5 p-0" aria-label="Recent tool runs, newest first">
        {receipts.slice(0, 8).map((r) => (
          <li
            key={`${r.at}-${r.tool}-${r.args_hash.slice(0, 8)}`}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg bg-white px-3 py-2 text-xs leading-5 text-slate-700"
            data-testid="receipts-row"
          >
            <span className="font-mono text-[11px] text-slate-400">{r.at.slice(0, 19).replace("T", " ")}</span>
            <span className="font-semibold text-slate-900">{r.tool}</span>
            <span className="font-mono text-[11px] text-slate-500">{r.door}</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">{r.outcome}</span>
            <span className="font-mono text-[11px] text-slate-400" title="sha256 (or marked fallback) over the canonical arguments; the arguments themselves are not stored">
              args {r.args_hash.slice(0, 12)}…
            </span>
          </li>
        ))}
      </ul>
      {receipts.length > 8 ? (
        <p className="mt-2 text-xs text-slate-500">+ {receipts.length - 8} older receipt(s) — export to see all.</p>
      ) : null}
      <p className="mt-3 text-xs leading-5 text-slate-500">
        A local log kept in your browser (localStorage). <strong>Not signed evidence</strong> — a
        signed record is one you can check with the verify tools; this list is your own
        note-taking and nothing here claims a run settled, paid or verified anything.
      </p>
    </section>
  );
}
