import { useEffect } from "react";
import { setMetaDescription } from "@/lib/utils";

const HOSTS = [
  { name: "Claude", how: "Add gspc → https://councilof.ai/mcp" },
  { name: "Cursor", how: "Add gspc in ~/.cursor/mcp.json with the URL below." },
  { name: "Kimi", how: "Add the same MCP URL in the tool’s MCP settings." },
  { name: "Grok", how: "Add the same MCP URL, or grok plugin install CSOAI-ORG/council-of-ai-grok" },
] as const;

export default function ToolsPage() {
  useEffect(() => {
    document.title = "Add gspc in your tool | councilof.ai";
    setMetaDescription(
      "Council OS for people already in Claude, Cursor, Kimi, or Grok. Four tools at https://councilof.ai/mcp. Measurement, never certification.",
    );
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16" data-testid="tools-mcp">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">
        Use this in Claude / Cursor / Kimi / Grok
      </h1>
      <p className="mt-3 text-slate-600">
        Ask: board totals. Paste a card to verify. Four tools. No 23rd axis.
      </p>
      <p className="mt-4 font-mono text-sm text-emerald-900">
        https://councilof.ai/mcp
      </p>
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
    </main>
  );
}
