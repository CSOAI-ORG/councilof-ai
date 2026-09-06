import { useEffect, useState } from "react";

type TraceClaim = { status?: string };
type TraceDoc = {
  schema?: string;
  kind?: string;
  writes_board?: boolean;
  claims?: Record<string, TraceClaim>;
  honesty?: string;
  emitter?: string;
};

type Wire =
  | { state: "loading" }
  | { state: "unreachable"; detail: string }
  | { state: "ready"; doc: TraceDoc };

export default function TraceReaderRail({
  heading = "TRACE reader",
  className = "",
}: {
  heading?: string;
  className?: string;
}) {
  const [wire, setWire] = useState<Wire>({ state: "loading" });

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/trace", {
      signal: ac.signal,
      headers: { accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`GET /api/trace HTTP ${response.status}`);
        const doc = (await response.json()) as TraceDoc;
        if (!doc.claims || typeof doc.claims !== "object")
          throw new Error("GET /api/trace returned no claims object");
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
        data-testid="rail-trace"
      >
        <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
        <p className="mt-1 text-xs text-slate-500">
          LOADING — fetching GET /api/trace…
        </p>
      </section>
    );
  }

  if (wire.state === "unreachable") {
    return (
      <section
        className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className}`}
        data-testid="rail-trace"
      >
        <h3 className="text-sm font-semibold text-amber-800">{heading}</h3>
        <p
          className="mt-1 text-xs text-amber-700"
          data-testid="rail-trace-unreachable"
        >
          UNREACHABLE — {wire.detail}.
        </p>
      </section>
    );
  }

  const doc = wire.doc;
  const claims = Object.entries(doc.claims ?? {});
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}
      data-testid="rail-trace"
    >
      <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
      <p className="mt-1 text-xs text-slate-600">
        kind: <code>{doc.kind ?? "UNCHECKABLE"}</code> · writes_board:{" "}
        <code>
          {typeof doc.writes_board === "boolean"
            ? String(doc.writes_board)
            : "UNCHECKABLE"}
        </code>
      </p>
      <ul
        className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1"
        data-testid="rail-trace-claims"
      >
        {claims.map(([name, claim]) => (
          <li
            key={name}
            className="flex justify-between gap-2 text-xs text-slate-700"
          >
            <span>{name}</span>
            <strong className="font-mono text-[10px] text-amber-700">
              {claim.status ?? "UNCHECKABLE"}
            </strong>
          </li>
        ))}
      </ul>
      {doc.honesty ? (
        <p className="mt-2 text-[11px] text-slate-500">{doc.honesty}</p>
      ) : null}
    </section>
  );
}
