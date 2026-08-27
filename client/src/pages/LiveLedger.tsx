/**
 * /live-ledger — the live, queryable refutation ledger.
 *
 * Pulls from the D1-backed Worker (csoai-gspc-api). The static
 * RefutationLedger page renders the full story; this page renders the
 * machine-readable, signed, queryable subset for verification and reuse.
 *
 * Same-origin proxy through the Pages Function at /api/worker/*.
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { DeckPage } from "@/components/scrollworld";
import {
  LIVING_LEDGER_HERO,
  LIVING_LEDGER_SLIDES,
  LIVING_LEDGER_NOT_CLAIMED,
  LIVING_LEDGER_RELATED,
} from "@/data/deckWorlds/livingLedger";

type DecisionRecord = {
  id: string;
  claim: string;
  verdict: string;
  evidence: string;
  tag: string;
  sigil_link: string;
  decided_on: string;
};

type Stats = {
  total: number;
  by_kind: { kind: string; count: number }[];
  by_verdict: { verdict: string; count: number }[];
  by_tag: { tag: string; count: number }[];
};

function LiveLedgerTool() {
  const [records, setRecords] = useState<DecisionRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Deep-link target from ?record=<id> (e.g. linked from arena measured badges).
  const [wanted, setWanted] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("record");
    if (id) setWanted(id);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/worker/ledger").then((r) => r.json()),
      fetch("/api/worker/ledger/stats").then((r) => r.json()),
    ])
      .then(([ledger, statsData]) => {
        setRecords(ledger.records || []);
        setStats(statsData || null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!wanted || loading || error) return;
    if (records.some((r) => r.id === wanted)) {
      setHighlight(wanted);
      setNotFound(false);
      // Wait a tick for the article to render before scrolling.
      requestAnimationFrame(() => {
        document
          .getElementById(`rec-${wanted}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } else {
      setNotFound(true);
    }
  }, [wanted, loading, error, records]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 py-16">
      <div className="mx-auto max-w-5xl px-6">
        <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
          Live · signed · queryable
        </span>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-4xl">
          Live Refutation Ledger
        </h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          The same nine refutations rendered by the /refutation-ledger page, here
          fetched live from the D1-backed Worker. Every row carries a signed record link,
          a decided-on timestamp, and the tag it travels with.{" "}
          <Link href="/refutation-ledger" className="text-emerald-400 underline">
            Read the full story
          </Link>
          .
        </p>

        {loading && <p className="mt-12 text-slate-400">Loading from D1…</p>}
        {error && (
          <div className="mt-12 rounded border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
            <strong>Upstream unavailable:</strong> {error}. The static ledger on{" "}
            <Link href="/refutation-ledger" className="underline">/refutation-ledger</Link>{" "}
            is the same eight rows, served unconditionally.
          </div>
        )}

        {stats && (
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Records" value={stats.total} color="text-white" />
            {stats.by_verdict.map((v) => (
              <Stat
                key={v.verdict}
                label={v.verdict}
                value={v.count}
                color={
                  v.verdict === "REFUTED"
                    ? "text-rose-400"
                    : v.verdict === "CONFIRMED" || v.verdict === "SETTLED"
                      ? "text-emerald-400"
                      : "text-amber-400"
                }
              />
            ))}
            {stats.by_kind.slice(0, 3).map((k) => (
              <Stat key={k.kind} label={k.kind} value={k.count} color="text-slate-300" />
            ))}
          </div>
        )}

        {notFound && wanted && (
          <div className="mt-8 rounded border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
            Record <code>{wanted}</code> is not in the signed, queryable subset
            served by this Worker. The full ledger story, including records not
            yet mirrored to D1, is on{" "}
            <Link href="/refutation-ledger" className="underline">
              /refutation-ledger
            </Link>
            .
          </div>
        )}

        <div className="mt-8 space-y-3">
          {records.map((r) => (
            <article
              key={r.id}
              id={`rec-${r.id}`}
              className={`rounded-lg border bg-slate-900/50 p-5 ${
                highlight === r.id
                  ? "border-emerald-400 ring-2 ring-emerald-400/60"
                  : "border-slate-800"
              }`}
            >
              <header className="flex items-center justify-between">
                <code className="text-xs text-emerald-400">{r.id}</code>
                <div className="flex gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      r.tag === "REFUTED"
                        ? "bg-rose-500/20 text-rose-300"
                        : r.tag === "MEASURED"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {r.tag}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      r.verdict === "OPEN"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {r.verdict}
                  </span>
                </div>
              </header>
              <h2 className="mt-2 text-base font-semibold text-white">{r.claim}</h2>
              <p className="mt-1 text-sm text-slate-400">{r.evidence}</p>
              <footer className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{r.decided_on}</span>
                <code className="text-emerald-400/70">{r.sigil_link}</code>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900/50 p-3 text-center">
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}

/**
 * /live-ledger — UPGRADED (not duplicated): the owner's "Living Ledger" deck is now the
 * scroll-world story that leads into the live, queryable ledger tool that already lived
 * here. The tool below is unchanged; the story above it is the fact-checked deck.
 * See client/src/data/deckWorlds/livingLedger.ts for the corrections log.
 */
export default function LiveLedger() {
  return (
    <DeckPage
      title="The living ledger | Council of AI"
      description="A certificate is out of date the day after it is printed. Council of AI measures against frozen statutory text, watches the law daily, and issues a signed delta card when a provision changes — the original is preserved, the history is append-only."
      hero={LIVING_LEDGER_HERO}
      slides={LIVING_LEDGER_SLIDES}
      notClaimed={LIVING_LEDGER_NOT_CLAIMED}
      related={LIVING_LEDGER_RELATED}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "The living ledger — measurement that stays current as the law moves",
        publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai", identifier: "UK Companies House 16939677" },
        about: "Continuous, signed AI measurement anchored to frozen statutory provisions.",
      }}
    >
      <div id="records">
        <LiveLedgerTool />
      </div>
    </DeckPage>
  );
}
