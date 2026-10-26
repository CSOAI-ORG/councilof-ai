/**
 * /corrections — the public corrections ledger as a page of its own.
 *
 * Until 2026-09-26 /corrections 308'd to /dashboard?tab=attestations, where the ledger is one
 * pane among five. A reader looking for "where were you wrong" had to guess a dashboard tab. This
 * page renders GET /api/corrections (functions/api/corrections.ts) and nothing else: every entry,
 * newest first, with what was wrong, how it was caught and what changed (the label each entry's own
 * fields earn: "Fix" only where it has a fix), its status and anything still open, plus the
 * ledger's own signature state printed verbatim (the endpoint earns it per request; this page
 * types none). Each entry is a <details id="C-…"> so /corrections/#C-… opens it.
 *
 * The ledger is read at runtime and also snapshotted: scripts/prerender.mjs renders this route
 * through its /api/ proxy (since 2026-09-30), so a reader without JavaScript, a crawler or an agent
 * gets the entries at build time; the browser re-reads GET /api/corrections on load. No count is
 * typed here.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import {
  caughtOf,
  latestCorrections,
  ledgerSignatureState,
  remedyOf,
  statusOf,
  type Correction,
  type CorrectionsDoc,
} from "@/lib/attestations";
import LedgersPanel from "@/components/LedgersPanel";

type Load = { state: "reading" } | { state: "ok"; doc: CorrectionsDoc } | { state: "failed"; reason: string };

/** detected_by as the entry records it, or the ledger's own word for an absent value. */
const detectedBy = (c: Correction) => (typeof c.detected_by === "string" && c.detected_by.trim() ? c.detected_by.trim() : "UNRECORDED");

/** The status word(s) before any qualifier: "CORRECTED - at the producers; …" → "CORRECTED". */
const statusHead = (c: Correction) => {
  const s = statusOf(c);
  return s.split(/;| - /)[0].trim();
};

/** The first sentence of what_was_wrong, for the one-line summary. */
const firstSentence = (t: string) => {
  const m = String(t ?? "").match(/^.*?[.!?](?=\s|$)/);
  const s = (m ? m[0] : String(t ?? "")).trim();
  return s.length > 220 ? `${s.slice(0, 217)}…` : s;
};

export default function Corrections() {
  const [load, setLoad] = useState<Load>({ state: "reading" });
  const [filter, setFilter] = useState<string>("all");
  const [hash, setHash] = useState<string>(() => (typeof window !== "undefined" ? decodeURIComponent(window.location.hash.slice(1)) : ""));

  useEffect(() => {
    document.title = "Corrections ledger | Council of AI";
    setMetaDescription(
      "Every published thing Council of AI (CSOAI Ltd) got wrong: what was wrong, how it was caught and what changed, dated. Read live from GET /api/corrections.",
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
    const onHash = () => setHash(decodeURIComponent(window.location.hash.slice(1)));
    window.addEventListener("hashchange", onHash);
    return () => {
      ac.abort();
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  const doc = load.state === "ok" ? load.doc : null;
  const rows = useMemo(() => latestCorrections(doc), [doc]);
  const chips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of rows) counts.set(detectedBy(c), (counts.get(detectedBy(c)) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [rows]);
  const shown = filter === "all" ? rows : rows.filter((c) => detectedBy(c) === filter);

  // A link to /corrections/#C-… opens that entry and scrolls to it once the ledger has loaded
  // (the entry does not exist in the DOM before then, so the browser's own jump misses it).
  useEffect(() => {
    if (!hash || !rows.some((c) => c.id === hash)) return;
    if (filter !== "all" && !shown.some((c) => c.id === hash)) setFilter("all");
    requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: "start" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, rows]);

  return (
    <div data-testid="corrections-page" className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/">Home</Link> › <span>Corrections</span>
      </nav>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Corrections ledger</h1>
      <p className="mt-3 text-sm font-medium text-slate-800" data-testid="corrections-summary">
        {rows.length > 0 ? (
          <>
            {rows.length} corrections · newest {rows[0].date} · read live from{" "}
            <a className="underline underline-offset-4" href="/api/corrections">GET /api/corrections</a>
          </>
        ) : load.state === "reading" ? (
          "Reading the ledger…"
        ) : (
          <>
            No entries read · <a className="underline underline-offset-4" href="/api/corrections">GET /api/corrections</a>
          </>
        )}
      </p>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-700">
        Every entry is something we published and got wrong: what was wrong, how it was caught, and what changed, dated.
        The same body that publishes a number publishes when the number was wrong.
      </p>
      <p className="mt-3 max-w-3xl text-sm text-slate-600">
        Signature state{" "}
        <code data-testid="corrections-signature-state">{load.state === "reading" ? "reading…" : ledgerSignatureState(doc)}</code>
        {doc?.policy ? <> · {doc.policy}</> : null}
      </p>

      <nav aria-label="On this page" className="mt-4 text-sm">
        <a className="underline underline-offset-4" href="#entries">Entries</a>{" · "}
        <a className="underline underline-offset-4" href="#ledgers">Ledgers and corrections</a>{" · "}
        <a className="underline underline-offset-4" href="#withdrawals">Withdrawals</a>{" · "}
        <a className="underline underline-offset-4" href="#claim-maintenance">Claim-maintenance schedule</a>{" · "}
        <a className="underline underline-offset-4" href="#verify">How to verify</a>
      </nav>

      <h2 id="entries" className="mt-8 scroll-mt-24 text-2xl font-bold tracking-tight text-slate-900">Entries, newest first</h2>

      {chips.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by how the error was detected" data-testid="corrections-filters">
          {[["all", rows.length] as [string, number], ...chips].map(([value, n]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`min-h-[44px] rounded-full border px-3 py-1.5 text-sm ${
                filter === value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-800 hover:border-slate-500"
              }`}
            >
              {value === "all" ? "All" : value} · {n}
            </button>
          ))}
        </div>
      ) : null}

      {load.state === "failed" ? (
        <p className="mt-6 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="status">
          The ledger could not be read on this load ({load.reason}). It is served at{" "}
          <a className="underline" href="/api/corrections">/api/corrections</a>.
        </p>
      ) : null}

      <ol className="mt-4 space-y-3" aria-label="Corrections, newest first">
        {load.state === "reading" ? <li className="text-sm text-slate-500">Reading the ledger…</li> : null}
        {load.state === "ok" && rows.length === 0 ? <li className="text-sm text-slate-500">No entries read.</li> : null}
        {shown.map((c) => {
          const remedy = remedyOf(c);
          const open = Array.isArray(c.open_items) ? c.open_items.filter((x) => typeof x === "string" && x.trim()) : [];
          return (
            <li key={c.id} data-testid="correction-entry">
              <details
                id={c.id}
                open={hash === c.id}
                className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 open:shadow-sm sm:p-5"
              >
                <summary className="min-h-[44px] cursor-pointer list-none text-sm leading-relaxed text-slate-900 [&::-webkit-details-marker]:hidden">
                  <span aria-hidden="true" className="mr-1 text-slate-500">▸</span>
                  <code className="font-semibold">{c.id}</code>
                  {" · "}
                  <time dateTime={c.date}>{c.date}</time>
                  {" · "}
                  {/^WITHDRAWN/i.test(statusHead(c)) ? (
                    <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-white">Withdrawn</span>
                  ) : (
                    <span className="font-semibold">{statusHead(c)}</span>
                  )}
                  {" · "}
                  <span className="text-slate-700">{firstSentence(c.what_was_wrong)}</span>
                </summary>
                <dl className="mt-3 space-y-2 text-sm">
                  <div><dt className="inline font-medium">What was wrong: </dt><dd className="inline text-slate-700">{c.what_was_wrong}</dd></div>
                  <div><dt className="inline font-medium">How it was caught: </dt><dd className="inline text-slate-700">{caughtOf(c)}</dd></div>
                  <div><dt className="inline font-medium">{remedy.label}: </dt><dd className="inline text-slate-700">{remedy.text}</dd></div>
                  <div><dt className="inline font-medium">Status: </dt><dd className="inline text-slate-700">{statusOf(c)}</dd></div>
                  <div><dt className="inline font-medium">Detected by: </dt><dd className="inline text-slate-700">{detectedBy(c)}</dd></div>
                  {open.length > 0 ? (
                    <div>
                      <dt className="font-medium">Still open:</dt>
                      <dd>
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700">
                          {open.map((o, i) => (
                            <li key={i}>{o}</li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <p className="mt-2 text-xs">
                  <a className="underline underline-offset-4" href={`#${c.id}`}>Link to this entry</a>
                </p>
              </details>
            </li>
          );
        })}
      </ol>

      <LedgersPanel />

      <p className="mt-10 text-sm text-slate-600">
        The ledger also appears beside the signed root and card checks on the{" "}
        <Link href="/dashboard?tab=attestations" className="underline underline-offset-4">attestations dashboard</Link>.
      </p>
    </div>
  );
}
