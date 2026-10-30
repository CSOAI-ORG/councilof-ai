/**
 * My results — status of a request, the signed results when delivered, and a free check.
 *
 * Two sources, never mixed:
 *   - this browser's own list (lib/myResults: what you looked up, requested or asked to watch here);
 *   - the live public queue, GET /api/commissions, looked up by receipt, transaction hash or subject.
 * The queue answers QUEUED / RETRIEVABLE / UNFULFILLABLE in its own words; a signed result is
 * opened at its own URL and checked in the verifier. No account is needed and nothing is uploaded.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Search, Trash2 } from "lucide-react";
import ResultCard, { StateChip } from "@/components/talk/ResultCard";
import { clearMyResultsStatus, downloadText, lookupAgainHref, MY_RESULTS_EVENT, readMyResultsStatus, seedChecker, VERIFY_SEED_HREF, type MyResult } from "@/lib/myResults";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type CommissionCard = { id: string; url: string; axis: string | null; status: string | null };
type Commission = {
  subject: string;
  fulfillment: string;
  tx: string | null;
  receipt_sha: string;
  as_of: string | null;
  origin?: string;
  cards: CommissionCard[] | null;
  delivery?: { state: string; count: number | null };
};
type Queue = { state: "loading" | "ok" | "error"; rows: Commission[]; asOf?: string; error?: string };

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const nonemptyText = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const nullableText = (v: unknown) => v === null || typeof v === "string";
const readableDate = (v: unknown): v is string => nonemptyText(v) && Number.isFinite(Date.parse(v));

function isCommissionCard(v: unknown): v is CommissionCard {
  return isObject(v) && nonemptyText(v.id) && nonemptyText(v.url) && nullableText(v.axis) && nullableText(v.status);
}

function isCommission(v: unknown): v is Commission {
  if (!isObject(v) || !nonemptyText(v.subject) || !nonemptyText(v.fulfillment) || !nullableText(v.tx) ||
      !nonemptyText(v.receipt_sha) || !(v.as_of === null || readableDate(v.as_of)) ||
      !(v.origin === undefined || typeof v.origin === "string")) return false;
  if (!(v.cards === null || (Array.isArray(v.cards) && v.cards.every(isCommissionCard)))) return false;
  if (v.delivery !== undefined) {
    const d = v.delivery;
    if (!isObject(d) || !nonemptyText(d.state) ||
        !(d.count === null || (typeof d.count === "number" && Number.isInteger(d.count) && d.count >= 0))) return false;
  }
  return true;
}

/** Validate the shapes this pane reads; an unreadable response is never an empty queue.
 * The consumer currently declares top-level as_of optional: absent means unknown, not a date. */
export function parseCommissionQueue(v: unknown): Pick<Queue, "rows" | "asOf"> {
  if (!isObject(v) || !Array.isArray(v.commissions) || !v.commissions.every(isCommission) ||
      !(v.as_of === undefined || readableDate(v.as_of))) throw new Error("UNREADABLE queue response");
  return { rows: v.commissions, ...(typeof v.as_of === "string" ? { asOf: v.as_of } : {}) };
}

type RecordSelection = { id: string; record: string };
type CopyOutcome = RecordSelection & { state: "copying" | "copied" | "manual" };

const ORIGIN_WORD: Record<string, string> = {
  OUTSIDE: "outside payer",
  SELF_TEST: "our own test",
  ZERO_VALUE: "nothing moved",
  UNCHECKABLE: "not checkable",
};
const KIND_WORD: Record<MyResult["kind"], string> = { lookup: "Looked up", "fresh-run": "Fresh run", watch: "Watch request", paid: "Paid result" };

const ROW_BUTTON = `inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold text-foreground hover:bg-muted ${FOCUS}`;

export function findCommissions(rows: Commission[], q: string): Commission[] {
  const s = q.trim().toLowerCase().replace(/^sha256:/, "");
  if (!s) return [];
  return rows.filter(
    (r) => r.receipt_sha?.toLowerCase() === s || (r.tx ?? "").toLowerCase() === s || r.subject.toLowerCase() === s,
  );
}

function CommissionCardView({ c }: { c: Commission }) {
  const cards = Array.isArray(c.cards) ? c.cards : null;
  const first = cards?.[0];
  return (
    <ResultCard
      title={c.subject}
      tool="GET /api/commissions"
      label={c.fulfillment}
      tiles={[
        { key: "cards", label: "Signed results", value: cards === null ? "unread" : String(cards.length) },
        { key: "delivery", label: "Delivery", value: (c.delivery?.state ?? "unknown").replace(/_/g, " ").toLowerCase() },
        { key: "origin", label: "Paid by", value: ORIGIN_WORD[c.origin ?? ""] ?? "unknown" },
        ...(c.as_of ? [{ key: "as_of", label: "Requested", value: c.as_of.slice(0, 10) }] : []),
      ]}
      verifyUrl={first ? first.url : "/dashboard?tab=verify"}
      recordId={c.receipt_sha}
      summary={`Receipt ${c.receipt_sha}${c.tx ? ` · transaction ${c.tx}` : ""}`}
      raw={c}
    >
      {cards && cards.length > 1 ? (
        <ul className="mt-3 space-y-1 text-sm">
          {cards.slice(0, 6).map((k) => (
            <li key={k.id} className="flex min-w-0 items-center gap-2">
              <StateChip label={k.status ?? undefined} />
              <a href={k.url} className={`min-w-0 truncate font-mono text-xs text-emerald-800 underline dark:text-emerald-300 ${FOCUS}`}>
                {k.axis ?? "result"} · {k.id.slice(0, 12)}…
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </ResultCard>
  );
}

export default function MyResultsPane() {
  const [mine, setMine] = useState<MyResult[]>([]);
  const [mineState, setMineState] = useState<"loading" | "ok" | "error">("loading");
  const [mineAction, setMineAction] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<RecordSelection | null>(null);
  const [handoffFailed, setHandoffFailed] = useState<RecordSelection | null>(null);
  const [copyOutcome, setCopyOutcome] = useState<CopyOutcome | null>(null);
  const selectionRevision = useRef(0);
  const copyOperation = useRef(0);
  const selectedTarget = useRef<RecordSelection | null>(null);
  const [queue, setQueue] = useState<Queue>({ state: "loading", rows: [] });
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState("");
  // A watch request has no public status endpoint (POST /api/claims/watch-request only records it),
  // so its Status button says that instead of searching the paid-commission queue for it.
  const [watchNote, setWatchNote] = useState<string | null>(null);

  const selectRecord = (target: RecordSelection | null) => {
    // Identical bytes reopened after a close still form a new selection.
    selectionRevision.current += 1;
    copyOperation.current += 1;
    selectedTarget.current = target;
    setSelectedRecord(target);
    setHandoffFailed(null);
    setCopyOutcome(null);
  };

  useEffect(() => {
    const load = () => {
      const read = readMyResultsStatus();
      setMineState(read.state);
      if (read.state === "ok" || read.rows.length > 0) {
        const target = selectedTarget.current;
        if (target && !read.rows.some((r) => r.kind === "paid" && r.id === target.id && r.record === target.record)) {
          selectRecord(null);
        }
        setMine(read.rows);
      }
      // A partial read exposes its readable rows alongside the warning. A wholly unreadable
      // read keeps the previously read rows on screen; neither is called an empty list.
    };
    load();
    window.addEventListener(MY_RESULTS_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(MY_RESULTS_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/commissions", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: unknown) => {
        const read = parseCommissionQueue(d);
        if (!cancelled) setQueue({ state: "ok", ...read });
      })
      .catch((e: unknown) => {
        if (!cancelled) setQueue({ state: "error", rows: [], error: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const found = useMemo(() => (asked ? findCommissions(queue.rows, asked) : []), [asked, queue.rows]);
  const recovery = selectedRecord
    ? mine.find((r) => r.kind === "paid" && r.id === selectedRecord.id && r.record === selectedRecord.record)
    : undefined;

  useEffect(() => {
    if (selectedRecord && !recovery) selectRecord(null);
  }, [selectedRecord, recovery]);

  const clearList = () => {
    const outcome = clearMyResultsStatus();
    if (outcome.cleared) {
      selectRecord(null);
      setMine([]);
      setMineState("ok");
      setMineAction("The list was cleared from this browser. Server-side records were not changed.");
    } else {
      setMineAction("This browser could not confirm the clear. Previously displayed rows remain visible; no success is claimed.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8" data-testid="my-results">
      <h1 className="text-2xl font-black tracking-tight text-foreground">My results</h1>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Where a request stands, the signed results once they are delivered, and a free check that they are genuine. No account:
        look up a receipt, or use the list this browser keeps.
      </p>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        role="search"
        aria-label="Look up a request"
        onSubmit={(e) => {
          e.preventDefault();
          setWatchNote(null);
          setAsked(q.trim());
        }}
      >
        <label htmlFor="my-results-q" className="sr-only">
          Receipt, transaction hash or subject
        </label>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id="my-results-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Receipt, transaction hash or model name"
            autoComplete="off"
            spellCheck={false}
            className={`min-h-12 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-base text-foreground placeholder:text-muted-foreground ${FOCUS}`}
          />
        </div>
        <button type="submit" className={`min-h-12 rounded-xl bg-emerald-800 px-6 text-base font-bold text-white hover:bg-emerald-900 dark:bg-emerald-600 ${FOCUS}`}>
          Look up
        </button>
      </form>

      <div className="mt-4 space-y-2" aria-live="polite">
        {watchNote ? (
          <p className="rounded-xl border border-border bg-muted p-3 text-sm text-foreground [overflow-wrap:anywhere]" data-testid="my-results-watch-note">
            {watchNote}
          </p>
        ) : null}
        {asked ? (
          queue.state === "loading" ? (
            <p role="status" className="text-sm text-muted-foreground">Reading the queue…</p>
          ) : queue.state === "error" ? (
            <p className="rounded-xl border border-amber-500/50 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-50">
              The queue could not be read ({queue.error}). Nothing is shown in its place.
            </p>
          ) : found.length ? (
            <ul className="list-none space-y-2 p-0">
              {found.map((c) => (
                <CommissionCardView key={c.receipt_sha} c={c} />
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-border bg-muted p-3 text-sm text-foreground" data-testid="my-results-none">
              Nothing in the public queue matches “{asked}”. A request appears here once it is paid; a lookup alone is not a request. If
              you paid, use the receipt id from the reply.{" "}
              <Link href={`/dashboard?tab=measured&subject=${encodeURIComponent(asked)}`} className="font-semibold text-emerald-800 underline dark:text-emerald-300">
                Request a fresh run
              </Link>
            </p>
          )
        ) : null}
      </div>

      <section className="mt-8" aria-labelledby="my-list-h">
        <div className="flex items-center justify-between gap-2">
          <h2 id="my-list-h" className="text-lg font-bold text-foreground">
            In this browser
          </h2>
          {mine.length ? (
            <button type="button" onClick={clearList} className={`inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground ${FOCUS}`}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Clear list
            </button>
          ) : null}
        </div>
        {mineState === "loading" ? (
          <p role="status" className="mt-2 text-sm text-muted-foreground">Reading this browser's list…</p>
        ) : mineState === "error" ? (
          <p role="alert" className="mt-2 rounded-xl border border-amber-500/50 p-3 text-sm" data-testid="my-results-unreadable">
            This browser's results could not be read. This is not an empty list; nothing has been overwritten.
            {mine.length ? " Readable retained rows remain available below; other entries may be unreadable." : ""}
          </p>
        ) : null}
        {mineAction ? <p role="status" className="mt-2 text-sm" data-testid="my-results-list-action">{mineAction}</p> : null}
        {mine.length ? (
          <ul className="mt-2 list-none divide-y divide-border rounded-2xl border border-border bg-card p-0">
            {mine.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{KIND_WORD[r.kind] ?? r.kind}</span>
                <span className="min-w-0 flex-1 basis-56 font-mono text-sm text-foreground [overflow-wrap:anywhere]" title={r.subject}>
                  {r.subject}
                </span>
                {r.state ? <StateChip label={r.state} /> : null}
                <span className="text-xs text-muted-foreground">{r.at.slice(0, 10)}</span>
                {r.kind === "paid" ? (
                  // A paid result is what the door delivered, kept in this browser: check it for free,
                  // download it, see the transaction. Only a commission receipt is in the public queue,
                  // so only that kind gets "Status" (an art50 pack would always answer "nothing matches").
                  <span className="flex flex-wrap gap-2">
                    {r.record ? (
                      <a
                        href={VERIFY_SEED_HREF}
                        onClick={(event) => {
                          if (!seedChecker(r.record!)) {
                            event.preventDefault();
                            selectRecord({ id: r.id, record: r.record! });
                            setHandoffFailed({ id: r.id, record: r.record! });
                          }
                        }}
                        className={ROW_BUTTON}
                        data-testid="my-results-check"
                      >
                        Check it is genuine
                      </a>
                    ) : null}
                    {r.record ? (
                      <button type="button" onClick={() => {
                        selectRecord({ id: r.id, record: r.record! });
                      }} className={ROW_BUTTON} data-testid="my-results-show-record">
                        View or copy record
                      </button>
                    ) : null}
                    {r.record ? (
                      <button type="button" onClick={() => downloadText(r.record!, `csoai-${(r.ref ?? "record").slice(0, 12)}.json`)} className={ROW_BUTTON}>
                        Download
                      </button>
                    ) : null}
                    {r.tx ? (
                      <a href={`https://basescan.org/tx/${r.tx}`} target="_blank" rel="noreferrer" className={ROW_BUTTON} title={r.tx}>
                        Transaction
                      </a>
                    ) : null}
                    {r.ref && r.door && /\/api\/request-attestation\b/.test(r.door) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setWatchNote(null);
                          setQ(r.ref!);
                          setAsked(r.ref!);
                        }}
                        className={ROW_BUTTON}
                      >
                        Status
                      </button>
                    ) : null}
                    {!r.record ? (
                      <span className="self-center text-xs text-muted-foreground">The record was not kept here{r.ref ? ` (id ${r.ref.slice(0, 12)}…)` : ""}.</span>
                    ) : null}
                  </span>
                ) : r.kind === "lookup" ? (
                  // A lookup is not a request: there is nothing of it in the paid-request queue, so
                  // "Status" (which searched that queue) always answered "nothing matches". The
                  // useful action is to ask the same question again.
                  <Link
                    href={lookupAgainHref(r)}
                    className={`inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold text-foreground hover:bg-muted ${FOCUS}`}
                    data-testid="my-results-again"
                  >
                    Look up again
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (r.kind === "watch") {
                        setAsked("");
                        setWatchNote(
                          `Your monthly re-check request${r.ref ? ` (${r.ref})` : ""} for “${r.subject}” was recorded for a person to review. ` +
                            "There is no public status for watch requests yet; nothing is scheduled or charged unless it is accepted.",
                        );
                        return;
                      }
                      setWatchNote(null);
                      setQ(r.ref ?? r.subject);
                      setAsked(r.ref ?? r.subject);
                    }}
                    className={`min-h-11 rounded-lg border border-border px-3 text-sm font-semibold text-foreground hover:bg-muted ${FOCUS}`}
                  >
                    Status
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : mineState === "ok" ? (
          <p className="mt-2 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground" data-testid="my-results-empty">
            Nothing yet. Start with{" "}
            <Link href="/dashboard" className="inline-flex items-center gap-1 font-semibold text-emerald-800 underline dark:text-emerald-300">
              Get results <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
            . What you look up or request is kept in this browser only.
          </p>
        ) : null}
        {recovery && typeof recovery.record === "string" ? (
          <section className="mt-4 rounded-xl border border-border p-4" aria-labelledby="my-results-record-h" data-testid="my-results-record">
            <h3 id="my-results-record-h" className="font-semibold">Retained record: {recovery.subject}</h3>
            <p className="mt-1 text-xs [overflow-wrap:anywhere]">Browser row {recovery.id}{recovery.ref ? " · record " + recovery.ref : ""}</p>
            <p className="mt-2 text-sm">Copy or download this retained text. Opening it here does not check its signature or send another request.</p>
            {handoffFailed?.id === recovery.id && handoffFailed.record === recovery.record ? (
              <p role="alert" className="mt-2 text-sm" data-testid="my-results-handoff-failed">
                This browser could not confirm the checker handoff, so you stayed here. Copy the text to use in the free checker.
              </p>
            ) : null}
            <pre tabIndex={0} aria-label="Retained record text" className="mt-3 max-h-64 overflow-auto whitespace-pre p-3 text-xs" data-testid="my-results-record-text">{recovery.record}</pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={ROW_BUTTON} disabled={copyOutcome?.state === "copying"} onClick={async () => {
                const target = { id: recovery.id, record: recovery.record! };
                const revision = selectionRevision.current;
                const operation = ++copyOperation.current;
                const isCurrent = () => selectionRevision.current === revision &&
                  copyOperation.current === operation && selectedTarget.current?.id === target.id &&
                  selectedTarget.current.record === target.record;
                if (!isCurrent()) return;
                setCopyOutcome({ ...target, state: "copying" });
                try {
                  await navigator.clipboard.writeText(target.record);
                  if (isCurrent()) setCopyOutcome({ ...target, state: "copied" });
                } catch {
                  if (isCurrent()) setCopyOutcome({ ...target, state: "manual" });
                }
              }} data-testid="my-results-copy-record">Copy record</button>
              <button type="button" className={ROW_BUTTON} onClick={() => {
                selectRecord(null);
              }}>Close record</button>
            </div>
            {copyOutcome?.id === recovery.id && copyOutcome.record === recovery.record ? (
              <p role="status" className="mt-2 text-sm" data-testid="my-results-copy-status">
                {copyOutcome.state === "copying" ? "Copying…" : copyOutcome.state === "copied" ? "The retained text was copied." : "Copy could not be confirmed. Select and copy the visible text, or use Download."}
              </p>
            ) : null}
          </section>
        ) : null}
      </section>

      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
        Queue read live from <a href="/api/commissions" className="underline">GET /api/commissions</a>
        {queue.asOf ? " · " + queue.asOf : ""}. A result is a measurement, never a certificate.
      </p>
    </div>
  );
}
