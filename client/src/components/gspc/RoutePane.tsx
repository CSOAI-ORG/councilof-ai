/**
 * RoutePane — GSPC Route in the workspace (Connect → Route). Decide-only.
 *
 * It calls the free MCP tool `route` through the same JSON-RPC door every client uses (POST /mcp,
 * tools/call), and renders the result's own fields: state, chosen id, choice_basis, separation,
 * the forbidden candidates with the policy that forbade them, and the unsigned route record.
 *
 * TIE HONESTY. The separation state is printed as the router wrote it. On TIE or UNTESTED the pane
 * says the choice came from the caller's tie-break rule, never that a candidate was better; the
 * router's own words exclude "best", "safest", "recommended", "compliant" and "certified"
 * (BANNED_ROUTE_WORDS in functions/_lib/route/route.ts). Nothing is executed and nothing is charged.
 */
import { useMemo, useState } from "react";
import { callTool } from "@/lib/sovTools";
import { useGspcBoard } from "@/components/board/useGspcBoard";

const PRESETS = ["read-only", "local-only", "eu-only", "no-unmeasured"] as const;
const TIE_BREAKS = ["cheapest_declared", "local_first", "lexical_id"] as const;

const EXAMPLE_CANDIDATES = `[
  {"id": "hosted-model-a", "kind": "model", "provider": "vendor-a", "region": "eu", "cost_declared": 3},
  {"id": "hosted-model-b", "kind": "model", "provider": "vendor-b", "region": "us", "cost_declared": 2},
  {"id": "my-local-gpu", "kind": "local_gpu", "endpoint": "local:ollama", "cost_declared": 0}
]`;

type Json = Record<string, unknown>;
type Phase =
  | { k: "idle" }
  | { k: "running" }
  | { k: "done"; result: Json; text: string }
  | { k: "error"; message: string };

const SEPARATION_TEXT: Record<string, string> = {
  SEPARATED:
    "SEPARATED: the board's top rows on this axis are statistically apart. The router may name a separated leader on this axis only.",
  TIE: "TIE: the board could not tell the top candidates apart on this axis. The choice below came from your tie-break rule, not from a measured difference.",
  UNTESTED:
    "UNTESTED: no separation test covers these candidates on this axis. The choice below came from your tie-break rule; an untested axis is not a tie and not a win.",
};

function rec(v: unknown): Json | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null;
}

export default function RoutePane() {
  const board = useGspcBoard();
  const axes = useMemo(
    () =>
      (board.data?.axes ?? [])
        .filter((a) => a.kind === "model-comparison" && typeof a.axis === "string")
        .map((a) => a.axis),
    [board.data],
  );
  const [task, setTask] = useState("Summarise a supplier contract and list its termination clauses.");
  const [axis, setAxis] = useState("");
  const [presets, setPresets] = useState<string[]>([]);
  const [tieBreak, setTieBreak] = useState<string>("cheapest_declared");
  const [ownCandidates, setOwnCandidates] = useState(true);
  const [candidates, setCandidates] = useState(EXAMPLE_CANDIDATES);
  const [phase, setPhase] = useState<Phase>({ k: "idle" });

  async function decide() {
    let parsed: unknown = undefined;
    if (ownCandidates) {
      try {
        parsed = JSON.parse(candidates);
      } catch {
        setPhase({ k: "error", message: "The candidates are not valid JSON. Nothing was sent." });
        return;
      }
    }
    const args: Json = {
      task,
      objective: { ...(axis ? { quality_axis: axis } : {}), tie_break: [tieBreak, ...TIE_BREAKS.filter((t) => t !== tieBreak)] },
      ...(presets.length ? { policy: { presets } } : {}),
      ...(ownCandidates ? { candidates: parsed } : {}),
    };
    setPhase({ k: "running" });
    const r = await callTool("route", args);
    const sc = rec(r.raw?.result?.structuredContent);
    if (!sc) {
      setPhase({ k: "error", message: r.text || "The route tool returned no structured result." });
      return;
    }
    setPhase({ k: "done", result: sc, text: r.text });
  }

  const result = phase.k === "done" ? phase.result : null;
  const chosen = rec(result?.chosen);
  const separation = typeof result?.separation === "string" ? result.separation : null;
  const forbidden = Array.isArray(result?.forbidden) ? (result!.forbidden as Json[]) : [];
  const considered = (rec(rec(result?.record)?.observed)?.considered ?? []) as Json[];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-8" data-testid="route-pane">
      <p className="t-kicker text-emerald-800">Connect · Route</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">GSPC Route, decide-only</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Give it a task, your candidates and your policy. It applies your policy to our published measurements and returns a
        decision with an unsigned route record. Routing is not ranking: a tie is printed as TIE and untested as UNTESTED.
        Nothing is executed and nothing is charged. The same tool is <code className="font-mono">route</code> on{" "}
        <code className="font-mono">/mcp/free</code> and the A2A skill <code className="font-mono">gspc-route</code>.
      </p>

      <form
        className="mt-6 grid gap-5 rounded-3xl border border-emerald-950/10 bg-card p-5 shadow-[0_1px_2px_rgba(6,21,15,0.04)] sm:p-6 lg:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void decide();
        }}
        aria-label="Route a task"
      >
        <div className="lg:col-span-2">
          <label htmlFor="route-task" className="text-sm font-bold text-foreground">
            Task <span className="font-normal text-muted-foreground">(hashed with SHA-256; the text is never stored or echoed)</span>
          </label>
          <textarea
            id="route-task"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            rows={2}
            maxLength={20000}
            className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          />
        </div>
        <div>
          <label htmlFor="route-axis" className="text-sm font-bold text-foreground">
            Quality axis
          </label>
          <select
            id="route-axis"
            value={axis}
            onChange={(e) => setAxis(e.target.value)}
            className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <option value="">None (policy and tie-break only)</option>
            {axes.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            {board.error ? `The board is unread (${board.error}); axes cannot be listed.` : axes.length ? "Model-comparison axes read live from GET /api/gspc." : "Reading the board…"}
          </p>
        </div>
        <div>
          <label htmlFor="route-tie" className="text-sm font-bold text-foreground">
            Tie-break rule (yours, and recorded)
          </label>
          <select
            id="route-tie"
            value={tieBreak}
            onChange={(e) => setTieBreak(e.target.value)}
            className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            {TIE_BREAKS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <fieldset className="lg:col-span-2">
          <legend className="text-sm font-bold text-foreground">Policy presets</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const on = presets.includes(p);
              return (
                <label
                  key={p}
                  className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm ${on ? "border-emerald-700 bg-emerald-50 font-semibold text-emerald-950" : "border-border bg-background text-foreground"}`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-emerald-700"
                    checked={on}
                    onChange={() => setPresets((x) => (on ? x.filter((y) => y !== p) : [...x, p]))}
                  />
                  {p}
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="lg:col-span-2">
          <label className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-foreground">
            <input type="checkbox" className="h-4 w-4 accent-emerald-700" checked={ownCandidates} onChange={(e) => setOwnCandidates(e.target.checked)} />
            Route among my own candidates
          </label>
          <p className="text-xs text-muted-foreground">Off: the router chooses among the GSPC MCP tools themselves.</p>
          {ownCandidates ? (
            <>
              <label htmlFor="route-cands" className="sr-only">
                Candidates as JSON
              </label>
              <textarea
                id="route-cands"
                value={candidates}
                onChange={(e) => setCandidates(e.target.value)}
                rows={6}
                spellCheck={false}
                className="mt-2 w-full rounded-xl border border-border bg-background p-3 font-mono text-xs leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              />
              <p className="text-xs text-muted-foreground">
                A field the router does not know makes that candidate UNCHECKABLE, never permitted. Sponsor or placement fields are ignored.
              </p>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
          <button
            type="submit"
            disabled={phase.k === "running" || !task.trim()}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-800 px-6 text-base font-black text-white transition hover:bg-emerald-900 disabled:opacity-60 motion-reduce:transition-none"
            data-testid="route-decide"
          >
            Decide the route
          </button>
          <span className="text-xs text-muted-foreground">Calls tools/call route on /mcp. Free, read-only, decide-only.</span>
        </div>
      </form>

      <div className="mt-6" aria-live="polite">
        {phase.k === "running" ? (
          <div role="status" className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground" data-testid="route-running">
            Asking the router…
          </div>
        ) : phase.k === "error" ? (
          <div role="alert" className="rounded-3xl border border-amber-500/60 bg-amber-50 p-5 text-sm text-amber-950" data-testid="route-error">
            {phase.message}
          </div>
        ) : result ? (
          <section className="rounded-3xl border border-emerald-950/10 bg-card p-5 shadow-[0_24px_50px_-38px_rgba(4,18,12,.45)] sm:p-6" data-testid="route-card" aria-label="Route decision">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#04120c] px-3 py-1 font-mono text-xs font-bold uppercase tracking-wide text-emerald-200">{String(result.state)}</span>
              {separation ? (
                <span
                  className={`rounded-full px-3 py-1 font-mono text-xs font-bold uppercase tracking-wide ${separation === "SEPARATED" ? "bg-emerald-800 text-white" : separation === "TIE" ? "bg-sky-100 text-sky-950" : "bg-slate-100 text-slate-900"}`}
                  data-testid="route-separation"
                >
                  {separation}
                </span>
              ) : null}
              <span className="rounded-full border border-border px-3 py-1 font-mono text-xs font-bold uppercase tracking-wide text-muted-foreground">unsigned preview</span>
            </div>
            {chosen ? (
              <p className="mt-4 text-lg text-foreground" data-testid="route-chosen">
                Routed to <span className="font-mono font-black">{String(chosen.id)}</span>
                <span className="block text-sm text-muted-foreground">
                  basis <code className="font-mono">{String(chosen.choice_basis)}</code>
                </span>
              </p>
            ) : (
              <p className="mt-4 text-lg text-foreground">No candidate was permitted by the policy.</p>
            )}
            {separation && SEPARATION_TEXT[separation] ? (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground" data-testid="route-honesty">
                {SEPARATION_TEXT[separation]}
              </p>
            ) : null}
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">considered</dt>
                <dd className="font-mono text-lg font-black">{String(result.considered ?? "—")}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">permitted</dt>
                <dd className="font-mono text-lg font-black">{String(result.permitted ?? "—")}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">forbidden</dt>
                <dd className="font-mono text-lg font-black">{forbidden.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">mode</dt>
                <dd className="font-mono text-sm font-bold">{String(result.mode ?? "decide_only")}</dd>
              </div>
            </dl>
            {considered.length ? (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <caption className="sr-only">Candidates considered and why</caption>
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="py-2 pr-3 font-semibold">candidate</th>
                      <th className="py-2 pr-3 font-semibold">permit</th>
                      <th className="py-2 pr-3 font-semibold">forbidden by</th>
                      <th className="py-2 font-semibold">measurement on the axis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {considered.map((c, i) => {
                      const m = (Array.isArray(c.measurements) ? c.measurements : [])[0] as Json | undefined;
                      return (
                        <tr key={i} className="border-b border-border/60 align-top">
                          <td className="py-2 pr-3 font-mono text-xs">{String(c.id)}</td>
                          <td className="py-2 pr-3">{c.permit ? "yes" : "no"}</td>
                          <td className="py-2 pr-3 font-mono text-xs">{c.forbid_policy ? String(c.forbid_policy) : "—"}</td>
                          <td className="py-2 font-mono text-xs">{m ? `${String(m.axis)}: ${String(m.state)}` : "none requested"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{String(result.note ?? "")}</p>
            <details className="mt-3 rounded-xl border border-border bg-background">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">The route record (csoai.route-evidence/0.1, unsigned)</summary>
              <pre className="max-h-96 overflow-auto border-t border-border p-4 font-mono text-xs leading-relaxed">{JSON.stringify(result.record, null, 2)}</pre>
            </details>
          </section>
        ) : (
          <p className="rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground" data-testid="route-idle">
            No route decided yet. The decision appears here with its separation state and the record behind it.
          </p>
        )}
      </div>
    </div>
  );
}
