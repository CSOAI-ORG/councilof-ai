import { useEffect, useState } from "react";

/** SWIFT census quoted from GET /api/swift; no cached or typed bank list. */
type SwiftEntry = {
  id?: string;
  name?: string;
  status?: string;
  artifact_url?: string | null;
  event_date?: string | null;
};

type SwiftDoc = {
  schema?: string;
  kind?: string;
  writes_board?: boolean;
  n?: number;
  n_measured?: number;
  n_live?: number;
  n_committed?: number;
  n_discovered?: number;
  status_all?: string;
  as_of?: string;
  honesty?: string;
  swift_com_fetch?: string;
  rows?: SwiftEntry[];
};

type Wire =
  | { state: "loading" }
  | { state: "unreachable"; detail: string }
  | { state: "ready"; doc: SwiftDoc };

export default function SwiftReaderRail({
  heading = "SWIFT reader",
  className = "",
}: {
  heading?: string;
  className?: string;
}) {
  const [wire, setWire] = useState<Wire>({ state: "loading" });

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/swift", {
      signal: ac.signal,
      headers: { accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`GET /api/swift HTTP ${response.status}`);
        const doc = (await response.json()) as SwiftDoc;
        if (!Array.isArray(doc.rows))
          throw new Error("GET /api/swift returned no rows[]");
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
        data-testid="rail-swift"
      >
        <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
        <p className="mt-1 text-xs text-slate-500">
          LOADING — fetching GET /api/swift…
        </p>
      </section>
    );
  }

  if (wire.state === "unreachable") {
    return (
      <section
        className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className}`}
        data-testid="rail-swift"
      >
        <h3 className="text-sm font-semibold text-amber-800">{heading}</h3>
        <p
          className="mt-1 text-xs text-amber-700"
          data-testid="rail-swift-unreachable"
        >
          UNREACHABLE — {wire.detail}. No bank names are shown because none were
          read this load.
        </p>
      </section>
    );
  }

  const doc = wire.doc;
  const rows = doc.rows ?? [];
  const n = typeof doc.n === "number" ? doc.n : rows.length;
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}
      data-testid="rail-swift"
    >
      <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
      <p className="mt-1 text-xs text-slate-600" data-testid="rail-swift-facts">
        <strong className="text-slate-900">{n}</strong> named banks
        {typeof doc.n_live === "number" ? (
          <>
            {" "}
            · <strong className="text-emerald-700">{doc.n_live}</strong> LIVE
          </>
        ) : null}
        {typeof doc.n_committed === "number" ? (
          <>
            {" "}
            · <strong>{doc.n_committed}</strong> COMMITTED
          </>
        ) : null}
        {typeof doc.n_discovered === "number" ? (
          <>
            {" "}
            · <strong>{doc.n_discovered}</strong> DISCOVERED
          </>
        ) : null}
        {" · "}n_measured:{" "}
        <code>
          {typeof doc.n_measured === "number" ? doc.n_measured : "UNCHECKABLE"}
        </code>
        {" · "}writes_board:{" "}
        <code>
          {typeof doc.writes_board === "boolean"
            ? String(doc.writes_board)
            : "UNCHECKABLE"}
        </code>
        {" · "}as_of: <code>{doc.as_of ?? "UNCHECKABLE"}</code>
      </p>
      <ul className="mt-2 space-y-1" data-testid="rail-swift-rows">
        {rows.slice(0, 6).map((entry, index) => (
          <li
            key={entry.id ?? index}
            className="flex justify-between gap-2 text-xs text-slate-700"
          >
            <span className="truncate">{entry.name ?? "(unnamed)"}</span>
            <span className="shrink-0 font-mono text-[10px] text-slate-500">
              {entry.status ?? "UNCHECKABLE"}
            </span>
          </li>
        ))}
      </ul>
      {doc.swift_com_fetch ? (
        <p
          className="mt-2 text-[11px] text-amber-700"
          data-testid="rail-swift-source-state"
        >
          {doc.swift_com_fetch}
        </p>
      ) : null}
      {doc.honesty ? (
        <p className="mt-2 text-[11px] text-slate-500">{doc.honesty}</p>
      ) : null}
      <p className="mt-2 text-[11px] text-slate-500">
        Reader only — never a GSPC grade. GET /api/swift is the authority.
      </p>
    </section>
  );
}
