/**
 * Plugin snippet under the composer.
 * Four hosts, one HTTP MCP. Same two panes in Claude.
 */
import HomeUnderstand from "./HomeUnderstand";

const URL = "https://councilof.ai/mcp";

const HOSTS = [
  { name: "Claude", how: `Add gspc → ${URL}` },
  { name: "Cursor", how: `~/.cursor/mcp.json → ${URL}` },
  { name: "Kimi", how: `MCP settings → ${URL}` },
  { name: "Grok", how: `plugin install CSOAI-ORG/council-of-ai-grok → ${URL}` },
] as const;

export default function PluginBlock() {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-emerald-50/40 px-4 py-4 text-sm text-slate-700 shadow-[0_12px_28px_-24px_rgba(4,18,12,.4)]">
      <p className="font-semibold text-slate-900">Already in a tool?</p>
      <p className="mt-1 text-[13px] text-slate-600">
        One HTTP MCP. Ask for the live board from the editor you already use.
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
          "Paste a card in the desk above, or open /tools for the full snippet.",
          { kind: "usp", text: "The plugin reads the same public board a stranger sees. No private score." },
        ]}
      />
      <p className="mt-3">
        <code className="font-mono text-[12px]">https://councilof.ai/mcp</code>
        {" · "}
        <a href="/tools" className="font-medium text-emerald-800 hover:underline">
          /tools
        </a>
      </p>
    </div>
  );
}
