import { plainAnswer, statTiles } from "@/lib/resultCard";
import type { RunnerToolResult } from "./ToolRunner";

/** Present structured counts while retaining the original, potentially historical response. */
export function CensusToolOutput({ result }: { result: RunnerToolResult }) {
  const payload = result.structuredContent && typeof result.structuredContent === "object" && !Array.isArray(result.structuredContent)
    ? result.structuredContent as Record<string, unknown> : null;
  const state = typeof payload?.state === "string" ? payload.state.toUpperCase() : "";
  const readable = result.ok && result.state === "runtime_observed" && /^(VALID|LIVE|READ)$/.test(state);
  const summary = readable ? plainAnswer("x402_trust", payload) : null;
  const tiles = summary ? statTiles(payload, 4, "x402_trust") : [];
  return (
    <>
      <div className="bg-white px-4 py-4" data-testid="census-tool-summary">
        <p className="text-xs font-semibold text-slate-900">Snapshot counts</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-700">
          {summary ?? "Snapshot counts could not be summarized from the returned evidence."}
        </p>
        {tiles.length > 0 && (
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map((tile) => (
              <div key={tile.key}>
                <dt className="text-[11px] text-slate-600">{tile.label}</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-950">{tile.value}</dd>
                {tile.hint && <p className="mt-0.5 text-[10px] text-slate-600">{tile.hint}</p>}
              </div>
            ))}
          </dl>
        )}
      </div>
      <details className="bg-[#04120c]" data-testid="census-source-response">
        <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-emerald-50">
          Original machine response (unchanged)
        </summary>
        <p className="px-4 text-[11px] leading-relaxed text-emerald-100">
          Snapshot text is preserved as returned, including historical wording.
        </p>
        <pre className="max-h-[30rem] overflow-auto p-4 font-mono text-[11.5px] leading-relaxed text-emerald-50">
          <code>{result.text}</code>
        </pre>
      </details>
    </>
  );
}
