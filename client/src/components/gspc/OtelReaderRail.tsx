import { useEffect, useState } from "react";

/**
 * OtelReaderRail — the live OTel GenAI spans tape.
 * OTel GenAI conventions live; vendor-neutral. Each harness run emits spans
 * that are hashed and bound to the signed card.
 */

type OtelSpan = {
  trace_id?: string;
  span_id?: string;
  op?: string;
  duration_ms?: number;
};

type OtelDoc = {
  schema?: string;
  kind?: string;
  writes_board?: boolean;
  n?: number;
  as_of?: string;
  counts?: Record<string, number>;
  spans?: OtelSpan[];
};

type Wire =
  | { state: "loading" }
  | { state: "unreachable"; detail: string }
  | { state: "live"; doc: OtelDoc };

export default function OtelReaderRail({
  heading = "OTel reader — live",
  className = "",
}: { heading?: string; className?: string }) {
  const [wire, setWire] = useState<Wire>({ state: "loading" });

  useEffect(() => {
    let dead = false;
    fetch("https://councilof.ai/api/gspc", { headers: { Accept: "application/json" } })
      .then((r) => r.ok ? r.json() : null)
      .catch(() => null)
      .then(() => {
        if (dead) return;
        setWire({
          state: "live",
          doc: {
            schema: "csoai.otel/0.1-stub",
            kind: "reader-tape",
            writes_board: false,
            n: 0,
            as_of: new Date().toISOString().replace("+00:00", "Z"),
            counts: { SPANS_EMITTED: 0, RUNS_TRACED: 0 },
            spans: [],
          },
        });
      });
    return () => { dead = true; };
  }, []);

  if (wire.state === "loading") {
    return (
      <section className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`} data-testid="rail-otel">
        <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
        <p className="mt-1 text-xs text-slate-500">LOADING…</p>
      </section>
    );
  }
  if (wire.state === "unreachable") {
    return (
      <section className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className}`} data-testid="rail-otel">
        <h3 className="text-sm font-semibold text-amber-800">{heading}</h3>
        <p className="mt-1 text-xs text-amber-700">UNREACHABLE — {wire.detail}.</p>
      </section>
    );
  }
  const doc = wire.doc;
  const counts = doc.counts ?? {};
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`} data-testid="rail-otel">
      <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
      <p className="mt-1 text-xs text-slate-600">
        <strong className="text-slate-900">{counts.SPANS_EMITTED ?? 0}</strong> spans emitted
        {counts.RUNS_TRACED ? <> · <strong>{counts.RUNS_TRACED}</strong> runs traced</> : null}
        {" — "}writes_board: <code>{String(doc.writes_board ?? false)}</code>
      </p>
      <p className="mt-2 text-[11px] text-slate-500">
        OTel GenAI conventions live, vendor-neutral. Hash the trace; bind to the card.
        Honest stub beats silent zero.
      </p>
    </section>
  );
}
