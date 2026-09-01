import {
  AGENT_TRAVEL_AGREED,
  AGENT_TRAVEL_BETTER,
  AGENT_TRAVEL_RULING,
  PLANTED_IDENTITY,
  TRAVEL_LANES,
} from "@/lib/signedAgentTravel";

export default function SignedAgentTravel() {
  return (
    <section className="mt-16 space-y-8" data-testid="signed-agent-travel" aria-labelledby="agent-travel-h">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-700">
          Signed agent · agreed, then better
        </p>
        <h2 id="agent-travel-h" className="mt-2 text-2xl font-black tracking-tight text-slate-900">
          {AGENT_TRAVEL_RULING}
        </h2>
        <p className="mt-3 text-sm text-slate-600">{AGENT_TRAVEL_AGREED}</p>
        <p className="mt-3 text-sm font-semibold text-emerald-950">{AGENT_TRAVEL_BETTER}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5" data-testid="planted-identity">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-600">
          Planted identity · do not invent a key
        </p>
        <p className="mt-2 font-mono text-sm text-slate-800">{PLANTED_IDENTITY.did}</p>
        <p className="mt-1 text-sm text-slate-700">
          Card pin {PLANTED_IDENTITY.card_pin}. MCP {PLANTED_IDENTITY.mcp}. Agent-card
          signed? {PLANTED_IDENTITY.agent_card_signed ? "yes" : "not yet"}. mcp.json
          signed? {PLANTED_IDENTITY.mcp_json_signed ? "yes" : "not yet"}. DID lists MCP?{" "}
          {PLANTED_IDENTITY.did_advertises_mcp ? "yes" : "no"}.
        </p>
        <p className="mt-2 text-[13px] text-slate-600">{PLANTED_IDENTITY.did_mcp_note}</p>
      </div>

      <ul className="grid gap-3 md:grid-cols-2">
        {TRAVEL_LANES.map((lane) => (
          <li
            key={lane.id}
            className="rounded-xl border border-slate-200 bg-white p-4"
            data-testid={`travel-${lane.id}`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold text-slate-900">{lane.title}</h3>
              <span className="font-mono text-[10px] uppercase text-emerald-800">
                {lane.auto ? "auto" : "gated"} · {lane.needs_permission ? "needs a cell" : "no per-site permit"}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{lane.does}</p>
            <p className="mt-1 text-[12px] text-slate-500">Never: {lane.never}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
