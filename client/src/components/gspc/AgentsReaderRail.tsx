import { useEffect, useState } from "react";

/**
 * Reads the ERC-8004 agent census only from its own API. A catalogue mirror is
 * not substituted for a missing reader, and a successful unrelated request is
 * never used to imply that this census is reachable.
 */
type AgentRow = {
  agent_id?: string;
  endpoint?: string;
  status?: string;
  chain_id?: string;
  as_of?: string;
};

type AgentsDoc = {
  schema?: string;
  kind?: string;
  status?: string;
  writes_board?: boolean;
  n?: number;
  as_of?: string | null;
  counts?: Record<string, number>;
  rows?: AgentRow[];
};

type Wire =
  | { state: "loading" }
  | { state: "unreachable"; detail: string }
  | { state: "ready"; doc: AgentsDoc };

export default function AgentsReaderRail({
  heading = "Agents reader",
  className = "",
}: {
  heading?: string;
  className?: string;
}) {
  const [wire, setWire] = useState<Wire>({ state: "loading" });

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/agents", {
      signal: ac.signal,
      headers: { accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`GET /api/agents HTTP ${response.status}`);
        const doc = (await response.json()) as AgentsDoc;
        if (!doc || typeof doc !== "object")
          throw new Error("GET /api/agents returned no reader document");
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
        data-testid="rail-agents"
      >
        <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
        <p className="mt-1 text-xs text-slate-500">
          LOADING — fetching GET /api/agents…
        </p>
      </section>
    );
  }

  if (wire.state === "unreachable") {
    return (
      <section
        className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className}`}
        data-testid="rail-agents"
      >
        <h3 className="text-sm font-semibold text-amber-800">{heading}</h3>
        <p
          className="mt-1 text-xs text-amber-700"
          data-testid="rail-agents-unreachable"
        >
          UNREACHABLE — {wire.detail}. No agent count is shown because no census
          was read this load.
        </p>
        <p className="mt-2 text-[11px] text-amber-700">
          <code>csoai/erc8004-reader</code> is a separate catalogue mirror; it
          does not stand in for GET /api/agents.
        </p>
      </section>
    );
  }

  const doc = wire.doc;
  const counts = Object.entries(doc.counts ?? {});
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}
      data-testid="rail-agents"
    >
      <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
      <p
        className="mt-1 text-xs text-slate-600"
        data-testid="rail-agents-facts"
      >
        {doc.status ? (
          <>
            <strong className="text-slate-900">{doc.status}</strong> ·{" "}
          </>
        ) : null}
        endpoints:{" "}
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
        Quoted from GET /api/agents on this load. A reader, not a GSPC
        measurement.
      </p>
    </section>
  );
}
