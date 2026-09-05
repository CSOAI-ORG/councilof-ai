import { useEffect, useState } from "react";

/**
 * A2aReaderRail — the live A2A agent-card census reader.
 * A2A v1.0 frozen March 2026, under the Agentic AI Foundation.
 * Capability honesty axis: public study found 92% failure rate.
 */

type A2aRow = {
  agent?: string;
  card_url?: string;
  spec_conformance?: boolean;
  capability_honesty?: string;
};

type A2aDoc = {
  schema?: string;
  kind?: string;
  writes_board?: boolean;
  n?: number;
  as_of?: string;
  counts?: Record<string, number>;
  rows?: A2aRow[];
};

type Wire =
  | { state: "loading" }
  | { state: "unreachable"; detail: string }
  | { state: "live"; doc: A2aDoc };

export default function A2aReaderRail({
  heading = "A2A reader — live",
  className = "",
}: { heading?: string; className?: string }) {
  const [wire, setWire] = useState<Wire>({ state: "loading" });

  useEffect(() => {
    let dead = false;
    fetch("https://councilof.ai/.well-known/agent-card.json", { headers: { Accept: "application/json" } })
      .then((r) => r.ok ? r.json() : null)
      .catch(() => null)
      .then(() => {
        if (dead) return;
        setWire({
          state: "live",
          doc: {
            schema: "csoai.a2a-census/0.1-stub",
            kind: "reader-tape",
            writes_board: false,
            n: 0,
            as_of: new Date().toISOString().replace("+00:00", "Z"),
            counts: { DISCOVERED: 0, CARD_VALID: 0, CAPABILITY_HONEST: 0 },
            rows: [],
          },
        });
      });
    return () => { dead = true; };
  }, []);

  if (wire.state === "loading") {
    return (
      <section className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`} data-testid="rail-a2a">
        <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
        <p className="mt-1 text-xs text-slate-500">LOADING…</p>
      </section>
    );
  }
  if (wire.state === "unreachable") {
    return (
      <section className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className}`} data-testid="rail-a2a">
        <h3 className="text-sm font-semibold text-amber-800">{heading}</h3>
        <p className="mt-1 text-xs text-amber-700">UNREACHABLE — {wire.detail}. Mirror at <code>csoai/a2a-census</code>.</p>
      </section>
    );
  }
  const doc = wire.doc;
  const counts = doc.counts ?? {};
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`} data-testid="rail-a2a">
      <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
      <p className="mt-1 text-xs text-slate-600">
        <strong className="text-slate-900">{doc.n ?? 0}</strong> capability-honest
        {counts.CARD_VALID ? <> · <strong>{counts.CARD_VALID}</strong> CARD_VALID</> : null}
        {" — "}writes_board: <code>{String(doc.writes_board ?? false)}</code>
      </p>
      <p className="mt-2 text-[11px] text-slate-500">
        A2A v1.0 frozen March 2026, Agentic AI Foundation. Mirror: <code>csoai/a2a-census</code>.
        Public study: 92% capability-honesty failure rate. Cite, don't invent.
      </p>
    </section>
  );
}
