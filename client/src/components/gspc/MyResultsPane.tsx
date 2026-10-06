/**
 * My results — status of a request, the signed results when delivered, and a free check.
 *
 * Two sources, never mixed:
 *   - this browser's own list (lib/myResults: what you looked up, requested or asked to watch here);
 *   - the live public queue, GET /api/commissions, looked up by receipt, transaction hash or subject.
 * The queue answers QUEUED / RETRIEVABLE / UNFULFILLABLE in its own words; a signed result is
 * opened at its own URL and checked in the verifier. No account is needed and nothing is uploaded.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Search, Trash2 } from "lucide-react";
import ResultCard, { StateChip } from "@/components/talk/ResultCard";
import { clearMyResults, lookupAgainHref, MY_RESULTS_EVENT, readMyResults, type MyResult } from "@/lib/myResults";

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

const ORIGIN_WORD: Record<string, string> = {
  OUTSIDE: "outside payer",
  SELF_TEST: "our own test",
  ZERO_VALUE: "nothing moved",
  UNCHECKABLE: "not checkable",
};
const KIND_WORD: Record<MyResult["kind"], string> = { lookup: "Looked up", "fresh-run": "Fresh run", watch: "Watch request" };

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
      verifyText={first ? "Open the signed result" : "Check a result"}
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
  const [queue, setQueue] = useState<Queue>({ state: "loading", rows: [] });
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState("");

  useEffect(() => {
    const load = () => setMine(readMyResults());
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
      .then((d: { commissions?: Commission[]; as_of?: string }) => {
        if (!cancelled) setQueue({ state: "ok", rows: Array.isArray(d.commissions) ? d.commissions : [], asOf: d.as_of });
      })
      .catch((e: unknown) => {
        if (!cancelled) setQueue({ state: "error", rows: [], error: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const found = useMemo(() => (asked ? findCommissions(queue.rows, asked) : []), [asked, queue.rows]);

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
              Nothing in the public queue matches “{asked}”. A request appears here once it is paid; a lookup alone is not a request.{" "}
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
            <button type="button" onClick={clearMyResults} className={`inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground ${FOCUS}`}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Clear list
            </button>
          ) : null}
        </div>
        {mine.length ? (
          <ul className="mt-2 list-none divide-y divide-border rounded-2xl border border-border bg-card p-0">
            {mine.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{KIND_WORD[r.kind] ?? r.kind}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-foreground" title={r.subject}>
                  {r.subject}
                </span>
                {r.state ? <StateChip label={r.state} /> : null}
                <span className="text-xs text-muted-foreground">{r.at.slice(0, 10)}</span>
                {r.kind === "lookup" ? (
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
                      setQ(r.ref ?? r.subject);
                      setAsked(r.ref && r.kind !== "watch" ? r.ref : r.subject);
                    }}
                    className={`min-h-11 rounded-lg border border-border px-3 text-sm font-semibold text-foreground hover:bg-muted ${FOCUS}`}
                  >
                    Status
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground" data-testid="my-results-empty">
            Nothing yet. Start with{" "}
            <Link href="/dashboard" className="inline-flex items-center gap-1 font-semibold text-emerald-800 underline dark:text-emerald-300">
              Get results <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
            . What you look up or request is kept in this browser only.
          </p>
        )}
      </section>

      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
        Queue read live from <a href="/api/commissions" className="underline">GET /api/commissions</a>
        {queue.asOf ? ` · ${queue.asOf.slice(0, 16).replace("T", " ")}Z` : ""}. A result is a measurement, never a certificate.
      </p>
    </div>
  );
}
