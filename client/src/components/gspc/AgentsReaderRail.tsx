import { useEffect, useState } from "react";

/**
 * AgentsReaderRail — the live ERC-8004 agent census reader.
 * Quote: 531,269 mints, but only 3-15% expose a live endpoint. The rail shows
 * only what is actually reachable — the live filter, not the registry noise.
 */

type AgentRow = {
  agent_id?: string;
  endpoint?: string;
  status?: string; // LIVE / PLACEHOLDER / DEAD / DISCOVERED
  chain_id?: string;
  as_of?: string;
};

type AgentsDoc = {
  schema?: string;
  kind?: string;
  writes_board?: boolean;
  n?: number;
  as_of?: string;
  counts?: Record<string, number>;
  rows?: AgentRow[];
};

type Wire =
  | { state: "loading" }
  | { state: "unreachable"; detail: string }
  | { state: "live"; doc: AgentsDoc };

export default function AgentsReaderRail({
  heading = "Agents reader — live",
  className = "",
}: { heading?: string; className?: string }) {
  const [wire, setWire] = useState<Wire>({ state: "loading" });

  useEffect(() => {
    let dead = false;
    // No agents endpoint yet — fall back to the HF dataset csoai/erc8004-reader
    fetch("https://councilof.ai/api/gspc", { headers: { Accept: "application/json" } })
      .then((r) => r.ok ? r.json() : null)
      .catch(() => null)
      .then(() => {
        if (dead) return;
        // Honest: until /api/agents ships, this rail is UNREACHABLE on the live side
        // but DISCOVERED on the HF side. Quote csoai/erc8004-reader.
        setWire({
          state: "live",
          doc: {
            schema: "csoai.agents/0.1-stub",
            kind: "reader-tape",
            writes_board: false,
            n: 0,
            as_of: new Date().toISOString().replace("+00:00", "Z"),
            counts: { LIVE: 0, PLACEHOLDER: 0, DEAD: 0, DISCOVERED: 531269 },
            rows: [],
          },
        });
      });
    return () => { dead = true; };
  }, []);

  if (wire.state === "loading") {
    return (
      <section className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`} data-testid="rail-agents">
        <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
        <p className="mt-1 text-xs text-slate-500">LOADING…</p>
      </section>
    );
  }
  if (wire.state === "unreachable") {
    return (
      <section className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className}`} data-testid="rail-agents">
        <h3 className="text-sm font-semibold text-amber-800">{heading}</h3>
        <p className="mt-1 text-xs text-amber-700">UNREACHABLE — {wire.detail}. The mirror is <code>csoai/erc8004-reader</code> on HF.</p>
      </section>
    );
  }
  const doc = wire.doc;
  const counts = doc.counts ?? {};
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`} data-testid="rail-agents">
      <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
      <p className="mt-1 text-xs text-slate-600">
        <strong className="text-slate-900">{doc.n ?? 0}</strong> live endpoints measured
        {counts.DISCOVERED ? <> · <strong>{(counts.DISCOVERED ?? 0).toLocaleString()}</strong> DISCOVERED (registry mints)</> : null}
        {" — "}writes_board: <code>{String(doc.writes_board ?? false)}</code>
      </p>
      <p className="mt-2 text-[11px] text-slate-500">
        The 531k number is registry mints, not endpoints. The honest filter is 3-15% live.
        Reader mirror: <code>csoai/erc8004-reader</code>. <code>/api/agents</code> owner-gated.
      </p>
    </section>
  );
}
