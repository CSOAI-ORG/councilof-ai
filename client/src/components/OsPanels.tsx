import { useEffect, useState } from "react";
import {
  a2aPanel,
  banksPanel,
  financePanel,
  swiftLadder,
  type SourcedNumber,
} from "@/lib/osPanels";

/**
 * OsPanels — the built-but-unwired reads, finally rendered.
 *
 * PHASE B. osPanels.ts landed with its tests and then sat there: measured
 * 2026-09-06, the only files importing it were osPanels.ts and its own test.
 * A derive layer nothing renders is itself built-but-unwired, which is the
 * condition this phase exists to clear.
 *
 * Every figure on this pane is a SourcedNumber: it carries the endpoint and the
 * field name it came from, and renders them beside itself. A figure whose
 * source did not answer renders its reason, never a zero — `value: null` is a
 * different fact from `value: 0`, and on a page about how much has been
 * measured, printing 0 for "we could not read it" is the worst available lie.
 *
 * Nothing here is added up across endpoints. The SWIFT ladder's rungs are
 * checked against that endpoint's OWN total and the panel says outright when
 * they disagree, rather than rendering a ladder that does not add up.
 */

const DOORS = {
  xrpl: "/api/xrpl",
  swift: "/api/swift",
  bank: "/api/bank-complete",
  card: "/.well-known/agent-card.json",
  a2a: "/api/a2a",
} as const;

type Docs = Partial<Record<keyof typeof DOORS, unknown>>;

function Figure({ n, label }: { n: SourcedNumber; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
      {n.value === null ? (
        <>
          <div className="mt-1 font-mono text-sm font-bold text-amber-700">UNREAD</div>
          <div className="mt-0.5 text-[11px] leading-snug text-amber-700">{n.unavailable}</div>
        </>
      ) : (
        <div className="mt-1 text-2xl font-bold text-slate-900">{n.value.toLocaleString()}</div>
      )}
      <div className="mt-1 font-mono text-[10px] text-slate-400">
        {n.endpoint} · {n.field}
      </div>
    </div>
  );
}

export default function OsPanels({ className = "" }: { className?: string }) {
  const [docs, setDocs] = useState<Docs>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    const read = (url: string) =>
      fetch(url, { headers: { accept: "application/json" } })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

    void Promise.all(
      (Object.keys(DOORS) as (keyof typeof DOORS)[]).map((k) =>
        read(DOORS[k]).then((doc) => [k, doc] as const),
      ),
    ).then((pairs) => {
      if (!alive) return;
      setDocs(Object.fromEntries(pairs) as Docs);
      setDone(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!done) {
    return (
      <section className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`} data-testid="os-panels">
        <p className="text-xs text-slate-500">Reading the estate doors…</p>
      </section>
    );
  }

  const finance = financePanel(docs.xrpl);
  const ladder = swiftLadder(docs.swift);
  const banks = banksPanel(docs.bank);
  const a2a = a2aPanel(docs.card, docs.a2a);

  return (
    <div className={`space-y-4 ${className}`} data-testid="os-panels">
      <section data-testid="panel-finance">
        <h3 className="text-sm font-semibold text-slate-800">Finance — tokenised assets</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Figure n={finance.assets} label="Assets on the reader" />
          <Figure n={finance.assetsListed} label="Assets listed" />
        </div>
        <p className="mt-2 text-[11px] leading-snug text-slate-500">
          <code>{finance.evidenceDoor.endpoint}</code> is{" "}
          <strong className="text-slate-700">{finance.evidenceDoor.state}</strong> —{" "}
          {finance.evidenceDoor.note}
        </p>
      </section>

      <section data-testid="panel-swift">
        <h3 className="text-sm font-semibold text-slate-800">SWIFT — the ladder</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Figure n={ladder.rungs.discovered} label="Discovered" />
          <Figure n={ladder.rungs.committed} label="Committed" />
          <Figure n={ladder.rungs.live} label="Live" />
          <Figure n={ladder.rungs.measured} label="Measured" />
        </div>
        <p className="mt-2 text-[11px] leading-snug text-slate-500">{ladder.legend}</p>
        <p className="mt-1 text-[11px]" data-testid="swift-consistency">
          {ladder.consistent === null ? (
            <span className="text-amber-700">
              The endpoint did not report every rung, so the ladder is not checked against its total.
            </span>
          ) : ladder.consistent ? (
            <span className="text-slate-500">
              discovered + committed + live = {ladder.rungSum}, which equals{" "}
              <code>{ladder.total.endpoint}</code> <code>n</code> = {ladder.total.value}. The rungs
              add up.
            </span>
          ) : (
            <span className="font-semibold text-amber-700">
              The rungs sum to {ladder.rungSum} but the endpoint reports n = {ladder.total.value}.
              They disagree, so this ladder is not a count you should quote.
            </span>
          )}
        </p>
      </section>

      <section data-testid="panel-banks">
        <h3 className="text-sm font-semibold text-slate-800">Banks</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Figure n={banks.banks} label="Banks (endpoint total)" />
          <Figure n={banks.banksListed} label="Banks actually listed" />
        </div>
        <p className="mt-2 text-[11px] leading-snug text-slate-500">
          Two different counts. They are shown side by side and never merged: a total the endpoint
          declares is not the same fact as the rows it actually shipped.
        </p>
      </section>

      <section data-testid="panel-a2a">
        <h3 className="text-sm font-semibold text-slate-800">A2A — the served card</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Figure n={a2a.skills} label="Skills on the served card" />
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-500">
              Protocol version
            </div>
            <div className="mt-1 font-mono text-sm text-slate-900">
              card {a2a.cardVersion ?? "—"} · route {a2a.routeVersion ?? "—"}
            </div>
            <div className="mt-1 font-mono text-[10px] text-slate-400">
              {DOORS.card} · {DOORS.a2a}
            </div>
          </div>
        </div>
        {a2a.versionMismatch ? (
          <p className="mt-2 text-[11px] font-semibold leading-snug text-amber-700" data-testid="a2a-mismatch">
            {a2a.mismatchNote ??
              "The served card and the route disagree about the protocol version."}
          </p>
        ) : null}
      </section>
    </div>
  );
}
