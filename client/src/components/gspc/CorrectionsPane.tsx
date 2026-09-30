/**
 * CorrectionsPane — Corrections → Corrections ledger, inside the workspace. Read live from
 * GET /api/corrections (the same ledger /corrections/ renders), newest first as the ledger orders
 * it. The signature state is printed as the endpoint states it; the entry text is the entry's own.
 */
import { useState } from "react";
import { Link } from "wouter";
import { useLiveJson } from "./useLiveJson";
import NextSteps from "./NextSteps";

type Entry = {
  id?: string;
  date?: string;
  status?: string;
  detected_by?: string;
  what_was_wrong?: string;
  fix?: string;
  what_changed?: string;
  how_caught?: string;
};
type Ledger = { corrections?: Entry[]; signature_state?: string; signature_check?: { checked_at?: string } };

function clip(s: string | undefined, n: number): string {
  if (!s) return "";
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}

export default function CorrectionsPane() {
  const read = useLiveJson<Ledger>("/api/corrections");
  const [shown, setShown] = useState(8);
  const entries = read.state === "ok" && Array.isArray(read.data.corrections) ? read.data.corrections : [];
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-8" data-testid="corrections-pane">
      <p className="t-kicker text-emerald-800">Corrections</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">What we got wrong, and what changed</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Every entry says what was wrong, how it was caught and what changed. Signed records are superseded, never edited.
      </p>

      {read.state === "loading" ? (
        <div role="status" aria-live="polite" className="mt-6 space-y-3" data-testid="corrections-loading">
          {[0, 1, 2].map((i) => (
            <span key={i} className="block h-20 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" aria-hidden="true" />
          ))}
          <span className="sr-only">Reading the corrections ledger</span>
        </div>
      ) : read.state === "error" ? (
        <div role="alert" className="mt-6 rounded-2xl border border-amber-500/60 bg-amber-50 p-4 text-sm text-amber-950" data-testid="corrections-error">
          <p>
            The ledger is unread right now ({read.error}). Nothing is shown in its place.{" "}
            <a className="font-bold underline underline-offset-2" href="/api/corrections">
              Read GET /api/corrections directly
            </a>
            .
          </p>
          <button type="button" onClick={read.retry} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-emerald-800 px-4 text-sm font-bold text-white hover:bg-emerald-900">
            Try again
          </button>
        </div>
      ) : entries.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">The ledger answered with no entries.</p>
      ) : (
        <>
          <p className="mt-5 text-sm text-muted-foreground" data-testid="corrections-summary">
            <span className="font-mono text-base font-black text-foreground">{entries.length}</span> entries · ledger signature{" "}
            <span className="font-mono font-bold text-foreground">{read.data.signature_state ?? "not stated"}</span>
            {read.data.signature_check?.checked_at ? ` (checked ${read.data.signature_check.checked_at})` : ""} · source GET /api/corrections
          </p>
          <ol className="mt-4 list-none space-y-3 p-0">
            {entries.slice(0, shown).map((e, i) => (
              <li key={e.id ?? i} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                <p className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-foreground">{e.id}</span>
                  {e.date ? <span className="text-muted-foreground">{e.date}</span> : null}
                  {e.status ? <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-900">{e.status}</span> : null}
                  {e.detected_by ? <span className="text-muted-foreground">caught by {e.detected_by}</span> : null}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  <span className="font-semibold">Wrong: </span>
                  {clip(e.what_was_wrong, 320)}
                </p>
                {e.fix || e.what_changed ? (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Changed: </span>
                    {clip(e.what_changed ?? e.fix, 260)}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {shown < entries.length ? (
              <button
                type="button"
                onClick={() => setShown((n) => n + 12)}
                className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:border-emerald-600/50"
              >
                Show more ({entries.length - shown} older)
              </button>
            ) : null}
            <Link href="/corrections/" className="inline-flex min-h-11 items-center text-sm font-bold text-emerald-800 underline underline-offset-4">
              The full ledger page →
            </Link>
            <a href="/feeds/corrections.xml" className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-800 underline underline-offset-4">
              RSS feed
            </a>
          </div>
        </>
      )}
      {read.state === "loading" ? null : (
      <NextSteps
        testId="corrections-next"
        steps={[
          { href: "/dashboard?tab=claims", title: "See what we keep re-checking", body: "Claim maintenance: the claims re-read on a schedule, and what changed." },
          { href: "/dispute/", title: "Ask for a correction", body: "Contest anything we published; a dispute is answered by re-measuring." },
          { href: "/dashboard?tab=verify", title: "Check a record yourself", body: "A superseded record still verifies; its replacement is named." },
        ]}
      />
      )}
    </div>
  );
}
