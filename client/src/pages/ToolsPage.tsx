import { useEffect, useState } from "react";
import HundredGate from "@/components/HundredGate";
import NSitesFlags from "@/components/NSitesFlags";
import SignedAgentTravel from "@/components/SignedAgentTravel";
import TwoSpeed from "@/components/TwoSpeed";
import WatchlistPane from "@/components/WatchlistPane";
import { setMetaDescription } from "@/lib/utils";

const MCP_URL = "https://councilof.ai/mcp";
const MCP_SNIPPET = `{
  "mcpServers": {
    "gspc": {
      "url": "${MCP_URL}"
    }
  }
}`;

const HOSTS = [
  { name: "Claude", how: "Add gspc → paste the JSON below, or the URL." },
  { name: "Cursor", how: "Paste the JSON into ~/.cursor/mcp.json" },
  { name: "Kimi", how: "MCP settings → same JSON / URL." },
  { name: "Grok", how: "Same URL, or grok plugin install CSOAI-ORG/council-of-ai-grok" },
] as const;

export default function ToolsPage() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    document.title = "Add gspc in your tool | councilof.ai";
    setMetaDescription(
      "Council OS for people already in Claude, Cursor, Kimi, or Grok. Four tools at https://councilof.ai/mcp. Measurement, never certification.",
    );
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16" data-testid="tools-mcp">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">
        Use this in Claude / Cursor / Kimi / Grok
      </h1>
      <p className="mt-3 text-slate-600">
        Ask: board totals. Paste a card to verify. Four tools:
        board_totals · get_axis · verify_card · list_cards · get_root · get_card · verify_inclusion. No 23rd axis.
      </p>
      <p className="mt-4 font-mono text-sm text-emerald-900">{MCP_URL}</p>
      <pre className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-[13px] text-emerald-100">
        <code>{MCP_SNIPPET}</code>
      </pre>
      <button
        type="button"
        data-testid="copy-mcp-snippet"
        className="mt-3 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(MCP_SNIPPET);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? "Copied" : "Copy the snippet"}
      </button>
      <ol className="mt-8 space-y-4">
        {HOSTS.map((h) => (
          <li key={h.name} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="font-semibold text-slate-900">{h.name}</div>
            <code className="mt-1 block text-[13px] text-slate-600">{h.how}</code>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-sm text-slate-500">
        Consent first. MCP stays off until you trust it. Extra MCP catalogues are not this
        product. Strangers with a PDF and no plugin:{" "}
        <a href="/gspc-verify" className="font-medium text-emerald-800 hover:underline">
          verify here
        </a>
        , free.
      </p>
      <HundredGate />
      <SignedAgentTravel />
      <TwoSpeed />
      <NSitesFlags />
      <WatchlistPane />
    </main>
  );
}
