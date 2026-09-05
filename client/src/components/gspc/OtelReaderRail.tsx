import { useEffect, useState } from "react";

type OtelDoc = {
  schema?: string;
  writes_board?: boolean;
  collector?: string;
  otlp?: string;
  gen_ai_spans?: string;
  otel_trace_id?: string | null;
  otel_trace_hash?: string | null;
  honesty?: string;
};

type Wire =
  | { state: "loading" }
  | { state: "unreachable"; detail: string }
  | { state: "ready"; doc: OtelDoc };

export default function OtelReaderRail({
  heading = "OTel reader",
  className = "",
}: {
  heading?: string;
  className?: string;
}) {
  const [wire, setWire] = useState<Wire>({ state: "loading" });

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/otel", {
      signal: ac.signal,
      headers: { accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`GET /api/otel HTTP ${response.status}`);
        const doc = (await response.json()) as OtelDoc;
        if (!doc || typeof doc !== "object")
          throw new Error("GET /api/otel returned no status document");
        setWire({ state: "ready", doc });
      })
      .catch((error) => {
        if (ac.signal.aborted) return;
        setWire({
          state: "unreachable",
          detail: String(error?.message || error),
        });
      });
    return () => ac.abort();
  }, []);

  if (wire.state === "loading") {
    return (
      <section
        className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}
        data-testid="rail-otel"
      >
        <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
        <p className="mt-1 text-xs text-slate-500">
          LOADING — fetching GET /api/otel…
        </p>
      </section>
    );
  }

  if (wire.state === "unreachable") {
    return (
      <section
        className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className}`}
        data-testid="rail-otel"
      >
        <h3 className="text-sm font-semibold text-amber-800">{heading}</h3>
        <p
          className="mt-1 text-xs text-amber-700"
          data-testid="rail-otel-unreachable"
        >
          UNREACHABLE — {wire.detail}.
        </p>
      </section>
    );
  }

  const doc = wire.doc;
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}
      data-testid="rail-otel"
    >
      <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
      <dl
        className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs"
        data-testid="rail-otel-facts"
      >
        <dt className="text-slate-500">collector</dt>
        <dd className="font-mono text-slate-800">
          {doc.collector ?? "UNCHECKABLE"}
        </dd>
        <dt className="text-slate-500">OTLP</dt>
        <dd className="font-mono text-slate-800">
          {doc.otlp ?? "UNCHECKABLE"}
        </dd>
        <dt className="text-slate-500">GenAI spans</dt>
        <dd className="font-mono text-slate-800">
          {doc.gen_ai_spans ?? "UNCHECKABLE"}
        </dd>
        <dt className="text-slate-500">trace id</dt>
        <dd className="font-mono text-slate-800">
          {doc.otel_trace_id ?? "UNCHECKABLE"}
        </dd>
        <dt className="text-slate-500">writes_board</dt>
        <dd className="font-mono text-slate-800">
          {typeof doc.writes_board === "boolean"
            ? String(doc.writes_board)
            : "UNCHECKABLE"}
        </dd>
      </dl>
      {doc.honesty ? (
        <p className="mt-2 text-[11px] text-slate-500">{doc.honesty}</p>
      ) : null}
    </section>
  );
}
