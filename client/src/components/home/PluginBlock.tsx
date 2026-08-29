/**
 * Plugin snippet under the composer.
 * Same two panes in Claude: ask the board / show board.
 */
const SNIPPET = `{
  "mcpServers": {
    "gspc": {
      "url": "https://councilof.ai/mcp"
    }
  }
}`;

export default function PluginBlock() {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <p className="font-semibold text-slate-900">Already in Claude / Cursor / Kimi / Grok?</p>
      <p className="mt-1">
        Add <code className="rounded bg-white px-1 font-mono text-[13px]">gspc</code> — same
        board, same verify.{" "}
        <a href="/tools" className="font-medium text-emerald-800 hover:underline">
          Plugin snippet
        </a>
        {" · "}
        <code className="font-mono text-[12px]">https://councilof.ai/mcp</code>
      </p>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-white p-3 font-mono text-[12px] text-slate-800">
        {SNIPPET}
      </pre>
    </div>
  );
}
