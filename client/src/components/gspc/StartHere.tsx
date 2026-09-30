/**
 * StartHere — the dismissible first-run card on the workspace home (pattern P1 + P16 of
 * ~/_alignment/UX-LEARN-CROWDSTRIKE-REDHAT-2026-09-30.md, in our own design language):
 * three routes by intent (verify a sample, a guided quick start, what changed), then one line of
 * verbs that say what each costs: Verify is free; Commission creates a request; Pay is x402 and
 * only ever with the caller's wallet. No price is printed. Dismissal is per browser.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { X } from "lucide-react";
import { useLiveJson } from "./useLiveJson";

const KEY = "coai:ws-start-here-dismissed";
const SAMPLE_CARD = "82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c";

type Entry = { id?: string; date?: string; what_was_wrong?: string };

export default function StartHere() {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEY) === "1") setOpen(false);
    } catch {
      /* storage blocked: the card stays */
    }
  }, []);
  const ledger = useLiveJson<{ corrections?: Entry[] }>(open ? "/api/corrections" : null);
  if (!open) return null;
  const latest = ledger.state === "ok" && Array.isArray(ledger.data.corrections) ? ledger.data.corrections.slice(0, 2) : [];
  return (
    <section aria-labelledby="ws-start-h" className="relative mb-6 rounded-3xl border border-emerald-950/10 bg-card p-5 shadow-[0_1px_2px_rgba(6,21,15,0.04)] sm:p-6" data-testid="ws-start-here">
      <button
        type="button"
        aria-label="Dismiss the start here card"
        onClick={() => {
          setOpen(false);
          try {
            window.localStorage.setItem(KEY, "1");
          } catch {
            /* ignore */
          }
        }}
        className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      <p className="t-kicker text-emerald-800">Start here</p>
      <h2 id="ws-start-h" className="mt-1 pr-10 text-xl font-black tracking-tight text-foreground">
        Three ways in
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground">Verify a sample card</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">One real signed card, checked in your browser against the published key.</p>
          <Link href={`/gspc-verify/?card=/signed/cards/${SAMPLE_CARD}.json`} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-emerald-800 px-4 text-sm font-bold text-white hover:bg-emerald-900">
            Verify (free)
          </Link>
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground">A guided quick start</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Reproduce a published figure yourself, or wire an agent to the free door.</p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold">
            <Link href="/academy/exercises/" className="inline-flex min-h-11 items-center text-emerald-800 underline underline-offset-4">
              Reproduce a figure
            </Link>
            <Link href="/quickstart/" className="inline-flex min-h-11 items-center text-emerald-800 underline underline-offset-4">
              Agent quick start
            </Link>
          </p>
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground">What changed</h3>
          {ledger.state === "loading" ? (
            <p role="status" className="mt-1 text-sm text-muted-foreground">
              Reading the corrections ledger…
            </p>
          ) : latest.length ? (
            <ul className="mt-1 list-none space-y-1 p-0 text-sm">
              {latest.map((e) => (
                <li key={e.id} className="min-w-0 truncate text-muted-foreground" title={e.what_was_wrong}>
                  <span className="font-mono font-bold text-foreground">{e.id}</span> {e.date}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">The ledger is unread right now; nothing is shown in its place.</p>
          )}
          <Link href="/dashboard?tab=corrections" className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-emerald-800 underline underline-offset-4">
            Open the corrections ledger
          </Link>
        </div>
      </div>
      <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground" data-testid="ws-cost-verbs">
        <Link href="/dashboard?tab=verify" className="font-bold text-emerald-800 underline underline-offset-2">Verify</Link> is free, always ·{" "}
        <Link href="/dashboard?tab=measured" className="font-bold text-emerald-800 underline underline-offset-2">Commission</Link> creates a measurement request ·{" "}
        <Link href="/dashboard?tab=swift" className="font-bold text-emerald-800 underline underline-offset-2">Pay (x402)</Link> happens only from your own wallet, after a challenge you can read first.
      </p>
    </section>
  );
}
