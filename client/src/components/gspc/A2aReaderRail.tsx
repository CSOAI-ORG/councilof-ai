import { useEffect, useState } from "react";

/**
 * A2A census reader. The site's own well-known agent card is discovery metadata
 * for one agent, so it must never be presented as a census response.
 */
type A2aRow = {
  agent?: string;
  card_url?: string;
  status?: string;
  spec_conformance?: boolean;
  capability_honesty?: string;
};

type A2aDoc = {
  schema?: string;
  kind?: string;
  status?: string;
  writes_board?: boolean;
  n?: number;
  as_of?: string | null;
  counts?: Record<string, number>;
  rows?: A2aRow[];
};

type Wire =
  | { state: "loading" }
  | { state: "uncheckable"; detail: string }
  | { state: "ready"; doc: A2aDoc };

export default function A2aReaderRail({
  heading = "A2A reader",
  className = "",
}: {
  heading?: string;
  className?: string;
}) {
  const [wire, setWire] = useState<Wire>({ state: "loading" });

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/a2a", {
      signal: ac.signal,
      headers: { accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`GET /api/a2a HTTP ${response.status}`);
        const doc = (await response.json()) as A2aDoc;
        if (!doc || typeof doc !== "object")
          throw new Error("GET /api/a2a returned no reader document");
        setWire({ state: "ready", doc });
      })
      .catch((error) => {
        if (ac.signal.aborted) return;
        setWire({
          state: "uncheckable",
          detail: String(error?.message || error),
        });
      });
    return () => ac.abort();
  }, []);

  if (wire.state === "loading") {
    return (
      <section
        className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}
        data-testid="rail-a2a"
      >
        <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
        <p className="mt-1 text-xs text-slate-500">
          LOADING — fetching GET /api/a2a…
        </p>
      </section>
    );
  }

  if (wire.state === "uncheckable") {
    return (
      <section
        className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className}`}
        data-testid="rail-a2a"
      >
        <h3 className="text-sm font-semibold text-amber-800">{heading}</h3>
        <p
          className="mt-1 text-xs text-amber-700"
          data-testid="rail-a2a-uncheckable"
        >
          UNCHECKABLE — {wire.detail}. No A2A census is shown.
        </p>
        <p className="mt-2 text-[11px] text-amber-700">
          <code>/.well-known/agent-card.json</code> describes this service; it
          is not a substitute for GET /api/a2a.
        </p>
      </section>
    );
  }

  const doc = wire.doc;
  const counts = Object.entries(doc.counts ?? {});
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}
      data-testid="rail-a2a"
    >
      <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
      <p className="mt-1 text-xs text-slate-600" data-testid="rail-a2a-facts">
        {doc.status ? (
          <>
            <strong className="text-slate-900">{doc.status}</strong> ·{" "}
          </>
        ) : null}
        census rows:{" "}
        <strong className="text-slate-900">
          {typeof doc.n === "number" ? doc.n.toLocaleString() : "UNCHECKABLE"}
        </strong>
        {" · "}writes_board:{" "}
        <code>
          {typeof doc.writes_board === "boolean"
            ? String(doc.writes_board)
            : "UNCHECKABLE"}
        </code>
        {" · "}as_of: <code>{doc.as_of ?? "UNCHECKABLE"}</code>
      </p>
      {counts.length > 0 ? (
        <p className="mt-2 text-[11px] text-slate-500">
          {counts
            .map(([status, count]) => `${status} ${count.toLocaleString()}`)
            .join(" · ")}
        </p>
      ) : null}
      <p className="mt-2 text-[11px] text-slate-500">
        Quoted from GET /api/a2a on this load. A reader, not a GSPC measurement.
      </p>
    </section>
  );
}
