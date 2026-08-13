import { useEffect, useState } from "react";
import { Link } from "wouter";

/**
 * /packs/mcp-scoreboard — model-side MCP conformance + tool-poisoning scoreboard.
 *
 * The open wedge: the official MCP conformance suite tests SERVERS and CLIENTS,
 * not models; competence leaderboards and safety papers exist but nobody runs a
 * maintained, live, SIGNED leaderboard scoring MODELS on conformance + tool-
 * poisoning safety together. This is the surface for that.
 *
 * Honesty first: the current board is UNMEASURED — the local fleet does not
 * separate (a 16-of-19 CI tie), so no ranking is quotable. We render that state
 * truthfully rather than a false leaderboard. Internal candidate models are
 * anonymised (no ranking is quotable, so identity adds nothing; and internal
 * codenames never appear on public surfaces).
 */

const BASE = "/packs/mcp-scoreboard";

interface Cell {
  n: number;
  correct: number;
  acc: number | null;
  ci: [number, number] | null;
  quotable: boolean;
}
interface Model {
  model: string;
  conformance: Cell;
  tool_poisoning: Cell;
  internal?: boolean;
}
interface Board {
  title: string;
  n_items: number;
  n_models: number;
  tool_poisoning_items: number;
  status: string;
  status_note: string;
  tie_set_size: number;
  design_note: string;
  method: string;
  naming_note: string;
  models: Model[];
}

function pct(x: number | null) {
  return x == null ? "—" : `${(x * 100).toFixed(0)}%`;
}
function ci(c: Cell) {
  return c.ci ? `[${(c.ci[0] * 100).toFixed(0)}, ${(c.ci[1] * 100).toFixed(0)}]` : "—";
}

export default function MCPScoreboard() {
  const [b, setB] = useState<Board | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE}/scoreboard.json`)
      .then((r) => r.json())
      .then(setB)
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-5 py-12">
        <nav className="text-sm text-zinc-500 mb-6">
          <Link href="/" className="hover:text-zinc-300">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-300">MCP scoreboard</span>
        </nav>

        <h1 className="text-3xl font-semibold tracking-tight mb-3">
          MCP scoreboard — model conformance &amp; tool-poisoning safety
        </h1>
        <p className="text-zinc-400 leading-relaxed mb-2">
          The official MCP conformance suite tests <strong className="text-zinc-200">servers and
          clients — not models</strong>. This board scores <strong className="text-zinc-200">models</strong> on
          two things at once: do they correctly judge whether an MCP tool conforms to its declared
          contract, and do they catch <strong className="text-zinc-200">tool poisoning</strong> — a tool
          annotated read-only that quietly mutates or exfiltrates.
        </p>
        <p className="text-zinc-500 text-sm mb-8">
          Every model is graded deterministically against a gold label (CONFORMS / VIOLATES). No model
          judges another. Nothing is quoted below the confidence floor.
        </p>

        {err && (
          <div className="rounded-lg border border-red-800 bg-red-950/40 p-4 mb-8 text-red-300 text-sm">
            Could not load the board: {err}
          </div>
        )}

        {b && (
          <>
            {/* Status banner — colour tracks the honest status */}
            {(() => {
              const measured = b.status === "MEASURED";
              const c = measured
                ? { border: "border-emerald-800/60", bg: "bg-emerald-950/20", chip: "text-emerald-400 border-emerald-700", note: "text-emerald-200/80" }
                : { border: "border-amber-800/60", bg: "bg-amber-950/20", chip: "text-amber-400 border-amber-700", note: "text-amber-200/80" };
              return (
                <section className={`rounded-xl border ${c.border} ${c.bg} p-5 mb-8`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-semibold uppercase tracking-wide border rounded px-2 py-0.5 ${c.chip}`}>
                      {b.status}
                    </span>
                    <span className="text-sm text-zinc-300">
                      {b.n_models} models · {b.n_items} items · {b.tool_poisoning_items} tool-poisoning cases
                    </span>
                  </div>
                  <p className={`${c.note} text-sm leading-relaxed`}>{b.status_note}</p>
                </section>
              );
            })()}

            {/* The board — rendered but clearly not-yet-quotable */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-1">The board</h2>
              <p className="text-zinc-500 text-xs mb-3">
                Accuracy shown with its 95% Wilson interval.{" "}
                {b.status === "MEASURED"
                  ? "Rows sorted by accuracy; where intervals do not overlap the ranking is genuine (models with overlapping intervals are statistically tied). Rows with no accuracy returned no usable responses and are not scored."
                  : "Because every interval overlaps, the order below is not a ranking — it is sorted by point estimate only, and the point estimates are statistically indistinguishable."}
              </p>
              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-900 text-zinc-400">
                    <tr>
                      <th className="text-left font-medium px-3 py-2">Model</th>
                      <th className="text-right font-medium px-3 py-2">Conformance</th>
                      <th className="text-right font-medium px-3 py-2">95% CI</th>
                      <th className="text-right font-medium px-3 py-2">Tool-poisoning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.models.map((m) => (
                      <tr key={m.model} className="border-t border-zinc-800/70">
                        <td className="px-3 py-2">
                          <span className={m.internal ? "text-zinc-500" : "text-zinc-200"}>
                            {m.model}
                          </span>
                          {m.internal && (
                            <span className="ml-2 text-[10px] uppercase tracking-wide text-zinc-600">
                              internal
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{pct(m.conformance.acc)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-zinc-500">{ci(m.conformance)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-zinc-400">
                          {m.tool_poisoning.correct}/{m.tool_poisoning.n}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-zinc-600 text-xs mt-2">{b.naming_note}</p>
            </section>

            {/* Design roadmap — two axes, honest about what's measured today */}
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 mb-8">
              <h2 className="text-lg font-semibold mb-2">Where this is going</h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-3">{b.design_note}</p>
              <p className="text-zinc-400 text-sm leading-relaxed">
                The scoreboard is the measurement surface of a governed multi-agent simulation
                (internally, Council City): any model can be cross-referenced against any protocol —
                MCP, and A2A next — through the same deterministic item banks and the same 13 governance
                axes. Every interaction is Ed25519-signed, and the signed rows are the training corpus.
                Measurement and data collection are one act.
              </p>
            </section>

            <section className="text-xs text-zinc-500 leading-relaxed border-t border-zinc-800 pt-6">
              <p className="mb-2">
                <strong className="text-zinc-400">Method:</strong> {b.method}
              </p>
              <p>
                This is an open, re-runnable measurement — not a certification. CSOAI issues
                measurements and signed attestations, never certificates of conformity. The
                &ldquo;no competitor&rdquo; framing rests on a bounded search and is held loosely:
                absence of evidence is not proof of absence.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
