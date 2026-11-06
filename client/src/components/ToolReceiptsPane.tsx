import { useEffect, useId, useMemo, useState } from "react";
import { Download, RefreshCw, Search, Trash2 } from "lucide-react";
import {
  clearToolReceiptsStatus,
  exportToolReceipts,
  readToolReceiptsStatus,
  subscribeToolReceipts,
  RECEIPTS_CAP,
  type ToolReceipt,
  type ToolReceiptsReadStatus,
} from "@/lib/toolReceipts";

const CONTROL =
  "min-h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
const PAGE_SIZE = 8;

export type ReceiptFilters = { query: string; outcome: string; door: string };

/** Filters operate only on retained metadata, never on arguments or result bodies. */
export function filterToolReceipts(
  rows: readonly ToolReceipt[],
  filters: ReceiptFilters,
): ToolReceipt[] {
  const query = filters.query.trim().toLowerCase();
  return rows.filter(
    (row) =>
      (filters.outcome === "all" || row.outcome === filters.outcome) &&
      (filters.door === "all" || row.door === filters.door) &&
      (!query ||
        [row.tool, row.outcome, row.door, row.at, row.args_hash].some((field) =>
          field.toLowerCase().includes(query),
        )),
  );
}

function receiptTime(at: string): string {
  return (
    new Date(at).toLocaleString("en-GB", {
      timeZone: "UTC",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " UTC"
  );
}

/** Reactive browser-local run history. These metadata notes are never signed evidence. */
export default function ToolReceiptsPane() {
  const id = useId();
  const [read, setRead] = useState<
    (ToolReceiptsReadStatus & { retained?: boolean }) | null
  >(null);
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState("all");
  const [door, setDoor] = useState("all");
  const [page, setPage] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearNote, setClearNote] = useState<string | null>(null);

  function refresh() {
    const next = readToolReceiptsStatus();
    setRead((previous) =>
      next.state !== "ok" && !next.receipts.length && previous?.receipts.length
        ? { ...next, receipts: previous.receipts, retained: true }
        : next,
    );
  }

  useEffect(() => {
    refresh();
    return subscribeToolReceipts(refresh);
  }, []);

  const rows = read?.receipts ?? [];
  const filtered = useMemo(
    () => filterToolReceipts(rows, { query, outcome, door }),
    [rows, query, outcome, door],
  );
  const outcomes = [
    ...new Set([
      ...rows.map((row) => row.outcome),
      ...(outcome === "all" ? [] : [outcome]),
    ]),
  ].sort();
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );
  const exportText = exportToolReceipts(filtered);
  const hasFilters = Boolean(
    query.trim() || outcome !== "all" || door !== "all",
  );

  return (
    <section
      aria-labelledby={id + "-heading"}
      className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5"
      data-testid="tool-receipts"
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3
            id={id + "-heading"}
            className="text-base font-bold text-foreground"
          >
            Your run receipts
          </h3>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            A local log of tool names, outcomes, times and argument hashes.
            Arguments and result bodies are never kept here.
            <strong className="text-foreground"> Not signed evidence.</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className={BUTTON}
          aria-label="Refresh local run receipts"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="mt-3 text-sm leading-relaxed"
      >
        {!read ? (
          <p>Reading this browser’s run log…</p>
        ) : read.state !== "ok" ? (
          <p
            className="rounded-xl border border-amber-700/40 bg-amber-50 p-3 text-amber-950"
            data-testid="receipts-storage-warning"
          >
            {read.reason}{" "}
            {read.retained
              ? "The last readable snapshot is retained below; it is not a fresh read."
              : ""}
          </p>
        ) : null}
        {clearNote ? (
          <p className="mt-2 text-foreground" data-testid="receipts-clear-note">
            {clearNote}
          </p>
        ) : null}
      </div>

      {read && rows.length === 0 ? (
        <p
          className="mt-3 text-sm text-muted-foreground"
          data-testid="receipts-empty"
        >
          {read.state === "ok"
            ? "Nothing yet. Completed tool calls can add a local receipt when browser storage is available."
            : "No readable local receipts are available to display. An unavailable log is not an empty run history."}
        </p>
      ) : null}

      {rows.length > 0 || hasFilters ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,auto)_minmax(8rem,auto)]">
            <div>
              <label
                htmlFor={id + "-query"}
                className="mb-1.5 block text-xs font-semibold text-muted-foreground"
              >
                Find a run
              </label>
              <div className="relative">
                <Search
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-3.5 text-muted-foreground"
                />
                <input
                  id={id + "-query"}
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(0);
                  }}
                  placeholder="Tool, outcome, date or argument hash"
                  className={CONTROL + " w-full pl-9"}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor={id + "-outcome"}
                className="mb-1.5 block text-xs font-semibold text-muted-foreground"
              >
                Outcome
              </label>
              <select
                id={id + "-outcome"}
                value={outcome}
                onChange={(event) => {
                  setOutcome(event.target.value);
                  setPage(0);
                }}
                className={CONTROL + " w-full"}
              >
                <option value="all">All outcomes</option>
                {outcomes.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor={id + "-door"}
                className="mb-1.5 block text-xs font-semibold text-muted-foreground"
              >
                Endpoint
              </label>
              <select
                id={id + "-door"}
                value={door}
                onChange={(event) => {
                  setDoor(event.target.value);
                  setPage(0);
                }}
                className={CONTROL + " w-full"}
              >
                <option value="all">All endpoints</option>
                <option value="/mcp">/mcp</option>
                <option value="/mcp/free">/mcp/free</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p
              className="mr-auto text-sm text-muted-foreground"
              data-testid="receipts-count"
            >
              {filtered.length} matching of {rows.length} retained · limit{" "}
              {RECEIPTS_CAP}
            </p>
            {hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setOutcome("all");
                  setDoor("all");
                  setPage(0);
                }}
                className={BUTTON}
              >
                Clear filters
              </button>
            ) : null}
            {filtered.length > 0 && exportText ? (
              <a
                href={
                  "data:application/json;charset=utf-8," +
                  encodeURIComponent(exportText)
                }
                download={
                  "tool-receipts-" +
                  new Date().toISOString().slice(0, 10) +
                  ".json"
                }
                className={BUTTON}
                data-testid="receipts-export"
              >
                <Download size={16} aria-hidden="true" />
                Export filtered JSON
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setConfirmClear(true);
                setClearNote(null);
              }}
              className={BUTTON}
              data-testid="receipts-clear"
            >
              <Trash2 size={16} aria-hidden="true" />
              Clear local log
            </button>
          </div>
          {read?.state !== "ok" && filtered.length > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Export contains only the readable metadata snapshot below; it does
              not confirm the current storage state.
            </p>
          ) : null}
          {confirmClear && rows.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 p-3">
              <p className="mr-auto text-sm text-foreground">
                Clear all retained local run receipts? Filters do not limit this
                action.
              </p>
              <button
                type="button"
                className={BUTTON}
                data-testid="receipts-clear-confirm"
                onClick={() => {
                  const result = clearToolReceiptsStatus();
                  setClearNote(
                    result.cleared
                      ? "The local run log was cleared and its removal confirmed."
                      : "The clear could not be confirmed. No successful clear is claimed.",
                  );
                  if (result.cleared) setConfirmClear(false);
                  refresh();
                }}
              >
                Really clear
              </button>
              <button
                type="button"
                className={BUTTON}
                onClick={() => setConfirmClear(false)}
              >
                Keep receipts
              </button>
            </div>
          ) : null}
          {!filtered.length ? (
            <p
              role="status"
              className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground"
            >
              No local receipt matches these filters. Try a different search or
              clear the filters.
            </p>
          ) : (
            <ul
              className="mt-4 list-none space-y-2 p-0"
              aria-label="Local tool runs, newest first"
            >
              {visible.map((row, index) => (
                <li
                  key={
                    row.at + "-" + row.tool + "-" + row.args_hash + "-" + index
                  }
                  data-testid="receipts-row"
                >
                  <details className="rounded-xl border border-border bg-background">
                    <summary className="min-h-12 cursor-pointer rounded-xl p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className="font-semibold text-foreground">
                        {row.tool}
                      </span>{" "}
                      <span className="font-mono text-xs text-muted-foreground">
                        {row.outcome}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {receiptTime(row.at)} · {row.door}
                      </span>
                    </summary>
                    <div className="border-t border-border p-3">
                      <dl className="grid gap-3 text-xs sm:grid-cols-2">
                        <div>
                          <dt className="font-semibold text-muted-foreground">
                            Recorded time
                          </dt>
                          <dd className="mt-1 break-all font-mono text-foreground">
                            <time dateTime={row.at}>{row.at}</time>
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-muted-foreground">
                            Endpoint
                          </dt>
                          <dd className="mt-1 font-mono text-foreground">
                            {row.door}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-muted-foreground">
                            Returned outcome
                          </dt>
                          <dd className="mt-1 break-words font-mono text-foreground">
                            {row.outcome}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-muted-foreground">
                            Evidence boundary
                          </dt>
                          <dd className="mt-1 text-foreground">
                            Unsigned browser-local metadata
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="font-semibold text-muted-foreground">
                            Argument hash (arguments are not retained)
                          </dt>
                          <dd className="mt-1 break-all font-mono text-foreground">
                            {row.args_hash}
                          </dd>
                        </div>
                      </dl>
                      <a
                        href={
                          "/dashboard?tab=tools&tool=" +
                          encodeURIComponent(row.tool)
                        }
                        aria-label={"Open tool " + row.tool}
                        className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4"
                      >
                        Open this tool
                      </a>
                      <p className="text-xs text-muted-foreground">
                        Opening the tool does not run it. Enter its arguments
                        again.
                      </p>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
          {filtered.length > PAGE_SIZE ? (
            <nav
              aria-label="Run receipt pages"
              className="mt-4 flex flex-wrap items-center justify-between gap-3"
            >
              <button
                type="button"
                className={BUTTON}
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous receipts
              </button>
              <p
                className="text-sm text-muted-foreground"
                data-testid="receipts-page"
              >
                Page {currentPage + 1} of {pages}
              </p>
              <button
                type="button"
                className={BUTTON}
                disabled={currentPage >= pages - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                Next receipts
              </button>
            </nav>
          ) : null}
        </>
      ) : null}

      {read && read.state !== "ok" && !rows.length ? (
        <button
          type="button"
          onClick={() => setConfirmClear(!confirmClear)}
          className={BUTTON + " mt-3"}
        >
          Manage unreadable local log
        </button>
      ) : null}
      {confirmClear && !rows.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={BUTTON}
            data-testid="receipts-clear-confirm"
            onClick={() => {
              const result = clearToolReceiptsStatus();
              setClearNote(
                result.cleared
                  ? "The local run log was cleared and its removal confirmed."
                  : "The clear could not be confirmed. No successful clear is claimed.",
              );
              if (result.cleared) setConfirmClear(false);
              refresh();
            }}
          >
            Really clear unreadable local log
          </button>
          <button
            type="button"
            className={BUTTON}
            onClick={() => setConfirmClear(false)}
          >
            Keep log
          </button>
        </div>
      ) : null}
      <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
        These receipts describe local calls only. They do not prove a payment
        settled, that an output was correct, or that evidence was signed or
        admitted. Export includes metadata only, never arguments or results.
        Clearing site data removes this browser’s log.
      </p>
    </section>
  );
}
