/**
 * /corrections — the public corrections ledger as a page of its own.
 *
 * Until 2026-09-26 /corrections 308'd to /dashboard?tab=attestations, where the ledger is one
 * pane among five. A reader looking for "where were you wrong" had to guess a dashboard tab. This
 * page renders GET /api/corrections (functions/api/corrections.ts) and nothing else: every entry,
 * newest first, with what was wrong, how it was caught and the fix, plus the ledger's own
 * signature state printed verbatim (the endpoint earns it per request; this page types none).
 *
 * The ledger is read at runtime and also snapshotted: scripts/prerender.mjs renders this route
 * through its /api/ proxy (since 2026-09-30), so a reader without JavaScript, a crawler or an agent
 * gets the entries at build time; the browser re-reads GET /api/corrections on load. No count is
 * typed here.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import { latestCorrections, ledgerSignatureState, type CorrectionsDoc } from "@/lib/attestations";
import LedgersPanel from "@/components/LedgersPanel";

type Load = { state: "reading" } | { state: "ok"; doc: CorrectionsDoc } | { state: "failed"; reason: string };

export default function Corrections() {
  const [load, setLoad] = useState<Load>({ state: "reading" });

  useEffect(() => {
    document.title = "Corrections ledger | Council of AI";
    setMetaDescription(
      "Every published thing Council of AI (CSOAI Ltd) got wrong: what was wrong, how it was caught and the fix, dated. Read live from GET /api/corrections.",
    );
    const ac = new AbortController();
    fetch("/api/corrections", { signal: ac.signal, headers: { accept: "application/json" } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setLoad({ state: "ok", doc: (await r.json()) as CorrectionsDoc });
      })
      .catch((e) => {
        if (!ac.signal.aborted) setLoad({ state: "failed", reason: e?.message ?? String(e) });
      });
    return () => ac.abort();
  }, []);

  const doc = load.state === "ok" ? load.doc : null;
  const rows = useMemo(() => latestCorrections(doc), [doc]);

  return (
    <div data-testid="corrections-page" className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/">Home</Link> › <span>Corrections</span>
      </nav>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Corrections ledger</h1>
      <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-700">
        Every entry is something we published and got wrong: what was wrong, how it was caught, and the fix, dated.
        The same body that publishes a number publishes when the number was wrong.
      </p>
      <p className="mt-3 max-w-3xl text-sm text-slate-600">
        Machine-readable: <a className="underline underline-offset-4" href="/api/corrections">GET /api/corrections</a>
        {" · "}signature state{" "}
        <code data-testid="corrections-signature-state">{load.state === "reading" ? "reading…" : ledgerSignatureState(doc)}</code>
        {doc?.policy ? <> · {doc.policy}</> : null}
      </p>

      <nav aria-label="On this page" className="mt-4 text-sm">
        <a className="underline underline-offset-4" href="#ledgers">Ledgers and corrections</a>{" · "}
        <a className="underline underline-offset-4" href="#withdrawals">Withdrawals</a>{" · "}
        <a className="underline underline-offset-4" href="#claim-maintenance">Claim-maintenance schedule</a>{" · "}
        <a className="underline underline-offset-4" href="#verify">How to verify</a>{" · "}
        <a className="underline underline-offset-4" href="#entries">Entries</a>
      </nav>

      <LedgersPanel />

      <h2 id="entries" className="mt-12 scroll-mt-24 text-2xl font-bold tracking-tight text-slate-900">Entries, newest first</h2>

      {load.state === "failed" ? (
        <p className="mt-8 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="status">
          The ledger could not be read on this load ({load.reason}). It is served at{" "}
          <a className="underline" href="/api/corrections">/api/corrections</a>.
        </p>
      ) : null}

      <ol className="mt-4 space-y-4" aria-label="Corrections, newest first">
        {load.state === "reading" ? <li className="text-sm text-slate-500">Reading the ledger…</li> : null}
        {load.state === "ok" && rows.length === 0 ? <li className="text-sm text-slate-500">No entries read.</li> : null}
        {rows.map((c) => (
          <li key={c.id} id={c.id} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5" data-testid="correction-entry">
            <div className="flex flex-wrap items-center gap-2">
              <code className="font-semibold">{c.id}</code>
              <time className="text-xs text-slate-500" dateTime={c.date}>{c.date}</time>
              {/^WITHDRAWN/i.test(String(c.status ?? "")) ? (
                <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-white">Withdrawn</span>
              ) : null}
              <span className="text-xs text-slate-700">{c.status}</span>
            </div>
            <dl className="mt-2 space-y-1.5 text-sm">
              <div><dt className="inline font-medium">What was wrong: </dt><dd className="inline text-slate-700">{c.what_was_wrong}</dd></div>
              <div><dt className="inline font-medium">How it was caught: </dt><dd className="inline text-slate-700">{c.how_caught}</dd></div>
              <div><dt className="inline font-medium">Fix: </dt><dd className="inline text-slate-700">{c.fix}</dd></div>
            </dl>
          </li>
        ))}
      </ol>

      <p className="mt-10 text-sm text-slate-600">
        The ledger also appears beside the signed root and card checks on the{" "}
        <Link href="/dashboard?tab=attestations" className="underline underline-offset-4">attestations dashboard</Link>.
      </p>
    </div>
  );
}
