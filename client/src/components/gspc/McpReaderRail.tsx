import { useEffect, useState } from "react";

/** MCP probe registry. Reachable and catalogued-not-probed remain separate. */
type McpServer = {
  id?: string;
  status?: string;
  alias_of?: string | null;
  last_probed?: string | null;
  tools_count?: number | null;
};

type McpDoc = {
  schema?: string;
  probe_method?: string;
  probe_started?: string | null;
  probe_finished?: string | null;
  reachable?: number | null;
  reachable_endpoints?: number | null;
  unreachable?: number | null;
  catalogued_not_probed?: number | null;
  tools_probed?: number | null;
  servers?: McpServer[];
  note?: string;
};

type Wire =
  | { state: "loading" }
  | { state: "unreachable"; detail: string }
  | { state: "ready"; doc: McpDoc };

const shown = (value: number | null | undefined) =>
  typeof value === "number" ? value.toLocaleString() : "UNCHECKABLE";

export default function McpReaderRail({
  heading = "MCP reader",
  className = "",
}: {
  heading?: string;
  className?: string;
}) {
  const [wire, setWire] = useState<Wire>({ state: "loading" });

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/mcp", {
      signal: ac.signal,
      headers: { accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`GET /api/mcp HTTP ${response.status}`);
        const doc = (await response.json()) as McpDoc;
        if (!Array.isArray(doc.servers))
          throw new Error("GET /api/mcp returned no servers[]");
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
        data-testid="rail-mcp"
      >
        <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
        <p className="mt-1 text-xs text-slate-500">
          LOADING — fetching GET /api/mcp…
        </p>
      </section>
    );
  }

  if (wire.state === "unreachable") {
    return (
      <section
        className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className}`}
        data-testid="rail-mcp"
      >
        <h3 className="text-sm font-semibold text-amber-800">{heading}</h3>
        <p
          className="mt-1 text-xs text-amber-700"
          data-testid="rail-mcp-unreachable"
        >
          UNREACHABLE — {wire.detail}. No cached registry is shown as current.
        </p>
      </section>
    );
  }

  const doc = wire.doc;
  const servers = doc.servers ?? [];
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}
      data-testid="rail-mcp"
    >
      <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
      <p className="mt-1 text-xs text-slate-600" data-testid="rail-mcp-facts">
        <strong className="text-slate-900">{shown(doc.reachable)}</strong>{" "}
        reachable distinct servers
        {" · "}
        <strong>{shown(doc.catalogued_not_probed)}</strong> CATALOGUED, not
        probed
        {" · "}
        <strong>{shown(doc.tools_probed)}</strong> tools probed
      </p>
      <p className="mt-1 font-mono text-[10px] text-slate-500">
        probe_started={doc.probe_started ?? "UNCHECKABLE"} · probe_finished=
        {doc.probe_finished ?? "UNCHECKABLE"}
      </p>
      <ul className="mt-2 space-y-1" data-testid="rail-mcp-servers">
        {servers.slice(0, 6).map((server, index) => (
          <li
            key={server.id ?? index}
            className="flex justify-between gap-2 text-xs text-slate-700"
          >
            <span className="truncate">{server.id ?? "(unnamed)"}</span>
            <span className="shrink-0 font-mono text-[10px] text-slate-500">
              {server.status ?? "UNCHECKABLE"}
            </span>
          </li>
        ))}
      </ul>
      {servers.length > 6 ? (
        <p className="mt-1 text-[10px] text-slate-500">
          +{servers.length - 6} more registry rows
        </p>
      ) : null}
      <p className="mt-2 text-[11px] text-slate-500">
        GET /api/mcp is the authority. A catalogue row is never counted as a
        reachable server.
      </p>
    </section>
  );
}
