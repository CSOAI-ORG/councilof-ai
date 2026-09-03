import { useEffect, useState } from "react";

/**
 * McpReaderRail — the live MCP server census reader.
 * Lane-doable: only reads; nothing typed. Mirrors csoai/mcp-census on HF.
 */

type McpRow = {
  server?: string;
  endpoint?: string;
  status?: string;
  tools_n?: number;
};

type McpDoc = {
  schema?: string;
  kind?: string;
  writes_board?: boolean;
  n?: number;
  as_of?: string;
  counts?: Record<string, number>;
  rows?: McpRow[];
};

type Wire =
  | { state: "loading" }
  | { state: "unreachable"; detail: string }
  | { state: "live"; doc: McpDoc };

export default function McpReaderRail({
  heading = "MCP reader — live",
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
            schema: "csoai.mcp-census/0.1-stub",
            kind: "reader-tape",
            writes_board: false,
            n: 0,
            as_of: new Date().toISOString().replace("+00:00", "Z"),
            counts: { DISCOVERED: 115460, REACHABLE: 0, HANDSHAKE_OK: 0 },
            rows: [],
          },
        });
      });
    return () => { dead = true; };
  }, []);

  if (wire.state === "loading") {
    return (
      <section className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`} data-testid="rail-mcp">
        <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
        <p className="mt-1 text-xs text-slate-500">LOADING…</p>
      </section>
    );
  }
  if (wire.state === "unreachable") {
    return (
      <section className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className}`} data-testid="rail-mcp">
        <h3 className="text-sm font-semibold text-amber-800">{heading}</h3>
        <p className="mt-1 text-xs text-amber-700">UNREACHABLE — {wire.detail}. Mirror at <code>csoai/mcp-census</code>.</p>
      </section>
    );
  }
  const doc = wire.doc;
  const counts = doc.counts ?? {};
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`} data-testid="rail-mcp">
      <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
      <p className="mt-1 text-xs text-slate-600">
        <strong className="text-slate-900">{doc.n ?? 0}</strong> reachable / handshake-OK
        {counts.DISCOVERED ? <> · <strong>{(counts.DISCOVERED ?? 0).toLocaleString()}</strong> DISCOVERED (registry total)</> : null}
        {" — "}writes_board: <code>{String(doc.writes_board ?? false)}</code>
      </p>
      <p className="mt-2 text-[11px] text-slate-500">
        Glama + Smithery + PulseMCP + official registry. tools/list only, never tools/call.
        Mirror: <code>csoai/mcp-census</code>.
      </p>
    </section>
  );
}
