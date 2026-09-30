/**
 * Plugin snippet under the composer.
 * Four hosts, one HTTP MCP, plus the same public state contracts the site uses.
 */
import HomeUnderstand from "./HomeUnderstand";

// The free door by default (audit 2026-09-28 #10).
const URL = "https://councilof.ai/mcp/free";
const MCP_SNIPPET = `{ "mcpServers": { "gspc": { "url": "${URL}" } } }`;

const HOSTS = [
  { name: "Claude", how: `Add gspc → ${URL}` },
  { name: "Cursor", how: `~/.cursor/mcp.json → paste the JSON` },
  { name: "Kimi", how: `MCP settings → ${URL}` },
  { name: "Grok", how: `plugin install CSOAI-ORG/council-of-ai-grok → ${URL}` },
] as const;

export default function PluginBlock() {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-emerald-50/40 px-4 py-4 text-sm text-slate-700 shadow-[0_12px_28px_-24px_rgba(4,18,12,.4)]">
      <p className="font-semibold text-slate-900">Already in a tool?</p>
      <p className="mt-1 text-[13px] text-slate-600">
        One HTTP MCP. The board, live state, Claim Maintenance register, claim-event chain and corrections remain public contracts — no private score.
      </p>
      <ol className="mt-3 space-y-1.5">
        {HOSTS.map((h) => (
          <li key={h.name} className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold text-slate-900">{h.name}</span>
            <code className="font-mono text-[12px] text-slate-600">{h.how}</code>
          </li>
        ))}
      </ol>
      <HomeUnderstand
        className="mt-4 border-t border-slate-200/80 pt-3"
        items={[
          "Ask: board totals. The answer is living GET /api/gspc — never a typed number.",
          "Operational state is GET /api/state; maintained claims are GET /api/claims/register; recheck event history is GET /api/claims/events; corrections are GET /api/corrections.",
          "Paste a card in the desk above, or open /tools for the full snippet.",
          { kind: "usp", text: "The plugin and site point at the same public authorities. No second ledger, no private score." },
        ]}
      />
      <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 px-3 py-2 font-mono text-[11px] text-emerald-100">
        <code>{MCP_SNIPPET}</code>
      </pre>
      <p className="mt-3">
        <code className="font-mono text-[12px]">{URL}</code>
        {" · "}
        <a href="/tools" className="font-medium text-emerald-800 hover:underline">/tools</a>
        {" · "}
        <a href="/api/state" className="font-medium text-emerald-800 hover:underline">/api/state</a>
        {" · "}
        <a href="/claim-maintenance/" className="font-medium text-emerald-800 hover:underline">/claim-maintenance</a>
        {" · "}
        <a href="/api/claims/events" className="font-medium text-emerald-800 hover:underline">/api/claims/events</a>
        {" · "}
        <a href="/api/corrections" className="font-medium text-emerald-800 hover:underline">/api/corrections</a>
      </p>
    </div>
  );
}
