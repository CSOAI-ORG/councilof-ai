/**
 * Plugin snippet under the composer.
 * Four hosts, one HTTP MCP. Same two panes in Claude.
 */
const URL = "https://councilof.ai/mcp";

const HOSTS = [
  { name: "Claude", how: `Add gspc → ${URL}` },
  { name: "Cursor", how: `~/.cursor/mcp.json → ${URL}` },
  { name: "Kimi", how: `MCP settings → ${URL}` },
  { name: "Grok", how: `plugin install CSOAI-ORG/council-of-ai-grok → ${URL}` },
] as const;

export default function PluginBlock() {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <p className="font-semibold text-slate-900">Already in a tool?</p>
      <ol className="mt-2 space-y-1">
        {HOSTS.map((h) => (
          <li key={h.name}>
            <span className="font-semibold text-slate-900">{h.name}</span>
            {" — "}
            <code className="font-mono text-[12px] text-slate-600">{h.how}</code>
          </li>
        ))}
      </ol>
      <p className="mt-2">
        <code className="font-mono text-[12px]">https://councilof.ai/mcp</code>
        {" · "}
        <a href="/tools" className="font-medium text-emerald-800 hover:underline">
          /tools
        </a>
      </p>
    </div>
  );
}
