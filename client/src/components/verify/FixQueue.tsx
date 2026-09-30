/**
 * FixQueue — a server's signed capsules as a per-axis readiness checklist (the Cloudflare Agent
 * Readiness pattern: levels with n/m, and per row why / found / fix / copy agent prompt /
 * re-check). Every row is read from the capsules the lookup returned; nothing is scored.
 *
 * DOCTRINE. The progress figure is "n of m axes have a signed capsule", never a pass rate. A row's
 * state is the capsule's own measurement_state, verbatim. "Fix" is what would change the NEXT
 * observation; it never says the server is good or bad. An axis with no capsule is UNMEASURED and
 * says so. Re-check re-reads the published capsule and re-derives it in the browser; a new
 * observation only exists after the next probe run, and the page says that too.
 */
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CircleDashed, ClipboardCopy, RefreshCw, TriangleAlert } from "lucide-react";
import { STATE_MEANING, capsuleBody, verifyCapsuleText, type Check, type Lookup, type ShardCapsule } from "@/lib/serverLookup";

type Axis = { adapter: string; label: string; why: string; level: 1 | 2 | 3 };

/** The axes a server is measured on, grouped discoverable → verifiable → attested. */
export const SERVER_AXES: Axis[] = [
  { adapter: "tool_drift", level: 1, label: "Tool list is stable", why: "Agents that pinned your tool names break when they change without notice." },
  { adapter: "self_parity", level: 1, label: "Declared doors answer", why: "A door listed in public but not served (or the reverse) sends agents to nothing." },
  { adapter: "contract_parity", level: 2, label: "Descriptions match behaviour", why: "Agents plan from what your public descriptions declare; a mismatch makes them call the wrong thing." },
  { adapter: "a2a_card", level: 3, label: "Agent card signature verifies", why: "A signed card lets a caller check the card came from the key it names." },
];

const LEVELS: Record<1 | 2 | 3, string> = { 1: "Level 1 · Discoverable", 2: "Level 2 · Verifiable", 3: "Level 3 · Attested" };

const DIFF_STATES = new Set(["INCONSISTENT", "FAILED", "UNCHECKABLE", "NOT_DECLARED", "NOT_LISTED", "PARTIAL"]);

export function fixFor(state: string | null): string {
  switch (state) {
    case "INCONSISTENT":
      return "Make what you publish and what the server answers agree on this dimension (compare Declared and Observed), then ask for a re-check. Which side to change is your call.";
    case "FAILED":
      return "Re-sign the agent card with the key it references, publish the key where the card says it is, then ask for a re-check.";
    case "UNCHECKABLE":
      return "Make the surface readable to an anonymous GET (no auth wall, valid JSON, a stable URL), then ask for a re-check.";
    case "NOT_DECLARED":
      return "Declare this field on the surface the capsule names, if you intend callers to rely on it.";
    case "NOT_LISTED":
      return "List the door on the surface the capsule reads, or confirm it is intentionally unlisted.";
    case "PARTIAL":
      return "Read the capsule's limitations: they say which part did not complete. Fixing that part lets the next run complete.";
    case null:
    case undefined:
      return "No signed capsule yet. Ask for this server to be measured; until then it is UNMEASURED, which is not a finding.";
    default:
      return "Nothing recorded to change on this dimension at the time observed. The next run records its own state.";
  }
}

export function agentPrompt(endpoint: string, axis: Axis, c: ShardCapsule | null): string {
  const lookup = `https://councilof.ai/verify-server/?url=${encodeURIComponent(endpoint)}`;
  if (!c)
    return [
      `You maintain ${endpoint}. Council of AI holds no signed capsule about it on "${axis.label}" (${axis.adapter}): UNMEASURED, which is not a finding.`,
      `Check that the server answers an anonymous MCP initialize and tools/list, then ask for a measurement at https://councilof.ai/get-listed/.`,
      `Look it up again at ${lookup}. Do not describe the server as passing anything.`,
    ].join("\n");
  const body = capsuleBody(c);
  const dim = typeof c.claim?.dimension === "string" ? c.claim.dimension : axis.adapter;
  const lines = [
    `You maintain ${endpoint}. Council of AI's signed capsule ${c.capsule_id} recorded ${c.measurement_state ?? "no state"} on "${dim}" (${axis.adapter}) at ${c.observed_at ?? "an unrecorded time"}.`,
    `Meaning: ${STATE_MEANING[c.measurement_state ?? ""] ?? "see the capsule's limitations."}`,
  ];
  if (body) {
    lines.push(`Declared: ${JSON.stringify(body.declared).slice(0, 600)}`);
    lines.push(`Observed: ${JSON.stringify(body.observed).slice(0, 600)}`);
  }
  lines.push(`Task: ${fixFor(c.measurement_state)}`);
  lines.push(`Verify the capsule yourself (free): ${lookup}. The next observation records its own state; do not claim a pass.`);
  return lines.join("\n");
}

type RowCheck = { running: boolean; result: Check | null; at: string | null };

export default function FixQueue({ result, onRelookup }: { result: Lookup; onRelookup?: (url: string) => void }) {
  const endpoint = result.endpoint ?? "";
  const [checks, setChecks] = useState<Record<string, RowCheck>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const byAdapter = new Map<string, ShardCapsule[]>();
  for (const c of result.capsules) byAdapter.set(c.adapter, [...(byAdapter.get(c.adapter) ?? []), c]);
  const known = new Set(SERVER_AXES.map((a) => a.adapter));
  const extra: Axis[] = [...byAdapter.keys()].filter((a) => !known.has(a)).map((a) => ({ adapter: a, level: 2, label: a, why: "A measurement adapter this page has no plain-language line for yet." }));
  const axes = [...SERVER_AXES, ...extra];

  // One row per capsule dimension; one UNMEASURED row per axis with no capsule.
  const rows = axes.flatMap((axis) => {
    const caps = byAdapter.get(axis.adapter) ?? [];
    return caps.length ? caps.map((c) => ({ axis, c, key: `${axis.adapter}:${c.capsule_id}` })) : [{ axis, c: null as ShardCapsule | null, key: `${axis.adapter}:none` }];
  });
  const measuredAxes = axes.filter((a) => (byAdapter.get(a.adapter) ?? []).length > 0).length;
  const differences = rows.filter((r) => r.c && DIFF_STATES.has(r.c.measurement_state ?? "")).length;

  const recheck = useCallback(async (key: string, c: ShardCapsule) => {
    setChecks((m) => ({ ...m, [key]: { running: true, result: m[key]?.result ?? null, at: m[key]?.at ?? null } }));
    let r: Check;
    try {
      r = c.capsule_json
        ? await verifyCapsuleText(window.location.origin, c.capsule_json, c.capsule_id)
        : { outcome: "UNCHECKABLE", state: "NO_BYTES", why: "This listing carries no capsule text to re-derive.", recomputed_id: null, claimed_id: c.capsule_id, leaf_index: null, tree_size: null, batch_root: null, recomputed_root: null, signature: null };
    } catch (e) {
      r = { outcome: "UNCHECKABLE", state: "ERROR", why: (e as Error).message, recomputed_id: null, claimed_id: c.capsule_id, leaf_index: null, tree_size: null, batch_root: null, recomputed_root: null, signature: null };
    }
    setChecks((m) => ({ ...m, [key]: { running: false, result: r, at: new Date().toISOString() } }));
  }, []);

  const recheckAll = useCallback(async () => {
    for (const r of rows) if (r.c) await recheck(r.key, r.c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, recheck]);

  // Watch mode (Ask GSPC → runVerify {kind:"server"}): re-check every row of this lookup.
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ tool: string; args: Record<string, unknown>; handled?: boolean }>).detail;
      if (d?.tool === "runVerify" && d.args?.kind === "server") {
        d.handled = true;
        void recheckAll();
      }
    };
    window.addEventListener("council:ui", on);
    return () => window.removeEventListener("council:ui", on);
  }, [recheckAll]);

  const copy = (key: string, text: string) => {
    void navigator.clipboard?.writeText(text).then(
      () => setCopied(key),
      () => setCopied(null),
    );
  };

  return (
    <section aria-labelledby="fixq-h" className="mt-6 rounded-lg border border-slate-300 bg-white p-4" data-ui-region="fix-queue" data-testid="fix-queue">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="fixq-h" className="text-lg font-bold text-slate-900">
          Readiness checklist
        </h3>
        <p className="text-sm text-slate-800" data-testid="fixq-progress">
          <strong>
            {measuredAxes} of {axes.length}
          </strong>{" "}
          axes have a signed capsule
          {differences ? ` · ${differences} row${differences === 1 ? "" : "s"} record a difference or an unreadable surface` : ""}
        </p>
      </div>
      <p className="mt-1 text-sm text-slate-700">
        One row per measured dimension. The state is the capsule&apos;s own, verbatim; nothing is added up into a mark. An axis with no
        capsule is UNMEASURED, which is not a finding.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void recheckAll()}
          disabled={!result.capsules.length}
          data-ui-action="verify-run"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-slate-900 px-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Re-check every capsule in my browser
        </button>
        {onRelookup && endpoint ? (
          <button type="button" onClick={() => onRelookup(endpoint)} className="inline-flex min-h-11 items-center rounded-md border border-slate-400 px-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900">
            Look up again
          </button>
        ) : null}
      </div>

      {([1, 2, 3] as const).map((level) => {
        const inLevel = rows.filter((r) => r.axis.level === level);
        if (!inLevel.length) return null;
        const lvAxes = axes.filter((a) => a.level === level);
        const lvMeasured = lvAxes.filter((a) => (byAdapter.get(a.adapter) ?? []).length > 0).length;
        return (
          <div key={level} className="mt-5">
            <h4 className="flex items-baseline justify-between gap-2 border-b border-slate-200 pb-1 text-sm font-bold uppercase tracking-wide text-slate-800">
              <span>{LEVELS[level]}</span>
              <span className="font-mono text-xs normal-case text-slate-700">
                {lvMeasured}/{lvAxes.length} measured
              </span>
            </h4>
            <ul className="mt-2 space-y-2">
              {inLevel.map(({ axis, c, key }) => {
                const state = c?.measurement_state ?? "UNMEASURED";
                const diff = c ? DIFF_STATES.has(state) : false;
                const chk = checks[key];
                const dim = c && typeof c.claim?.dimension === "string" ? c.claim.dimension : null;
                return (
                  <li key={key} className="rounded-md border border-slate-200" data-testid="fixq-row" data-state={state}>
                    <details>
                      <summary className="flex min-h-11 cursor-pointer list-none items-start gap-2 p-3">
                        {!c ? (
                          <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
                        ) : diff ? (
                          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" aria-hidden="true" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-900">
                            {axis.label}
                            {dim ? <span className="font-mono text-xs font-normal text-slate-700"> · {dim}</span> : null}
                          </span>
                          <span className="block text-xs text-slate-700">{axis.adapter}</span>
                        </span>
                        <span className="shrink-0 rounded bg-slate-200 px-2 py-0.5 font-mono text-xs font-semibold text-slate-900">{state}</span>
                      </summary>
                      <dl className="grid grid-cols-1 gap-x-3 gap-y-1 border-t border-slate-200 p-3 text-sm sm:grid-cols-[6rem_1fr]">
                        <dt className="font-semibold text-slate-900">Why</dt>
                        <dd className="text-slate-800">{axis.why}</dd>
                        <dt className="font-semibold text-slate-900">Found</dt>
                        <dd className="text-slate-800">
                          {c ? (
                            <>
                              {STATE_MEANING[state] ?? "The state as the capsule records it."} Observed{" "}
                              <span className="font-mono">{c.observed_at ?? "at an unrecorded time"}</span>.
                            </>
                          ) : (
                            "No signed capsule keyed to this URL on this axis."
                          )}
                        </dd>
                        <dt className="font-semibold text-slate-900">Fix</dt>
                        <dd className="text-slate-800">{fixFor(c ? state : null)}</dd>
                        <dt className="font-semibold text-slate-900">Re-check</dt>
                        <dd className="text-slate-800">
                          {c ? (
                            <>
                              <button
                                type="button"
                                onClick={() => void recheck(key, c)}
                                disabled={chk?.running}
                                className="inline-flex min-h-11 items-center gap-1 rounded-md border border-slate-900 px-3 text-sm font-semibold hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-60"
                              >
                                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> {chk?.running ? "Re-checking…" : "Re-check this capsule"}
                              </button>
                              <span className="block text-xs text-slate-700" aria-live="polite">
                                {chk?.result
                                  ? `${chk.result.outcome} (${chk.result.state}) at ${chk.at?.slice(11, 19)}Z: ${chk.result.why}`
                                  : "Re-derives the published capsule in your browser. A new observation appears only after the next probe run."}
                              </span>
                            </>
                          ) : (
                            <a href="/get-listed/" className="font-medium text-slate-900 underline underline-offset-4">
                              Ask for a measurement
                            </a>
                          )}
                        </dd>
                      </dl>
                      <div className="border-t border-slate-200 p-3">
                        <button
                          type="button"
                          onClick={() => copy(key, agentPrompt(endpoint, axis, c))}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                        >
                          <ClipboardCopy className="h-4 w-4" aria-hidden="true" /> {copied === key ? "Copied" : "Copy agent prompt"}
                        </button>
                        <span className="ml-2 text-xs text-slate-700">A plain-text brief your coding agent can act on; it names the capsule and the re-check link.</span>
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
