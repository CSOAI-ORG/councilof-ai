import { useEffect, useState } from "react";
import INDEX from "../../../../public/axis-specialists/index.json";

type Json = Record<string, unknown>;
const record = (value: unknown): Json | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Json)
    : null;

export type AxisSpecialistAudit = {
  schema: "csoai.axis-specialist-audit/1.0";
  axis: string;
  specialist: {
    id: string;
    cluster_id: string;
    cluster_state: "DECLARED_NOT_PROVISIONED";
    mission: string;
    reviewer_role: string;
    isolation: "LOGICAL_PER_AXIS";
    asi_claimed: false;
    rsi_mode: "RECOMMENDATION_ONLY";
  };
  source: {
    snapshot: string;
    axis_row_sha256: string;
    axis_row: { status: string; family: string; kind: string; n: number };
  };
  checks: Array<{ id: string; state: string; detail: string; evidence?: unknown }>;
  summary: {
    checks: number;
    passed: number;
    findings: number;
    audit_state: string;
  };
  negative_controls: Array<{ control: string; state: "SPECIFIED_NOT_RUN" }>;
  improvement_proposals: Array<{
    id: string;
    proposal: string;
    state: "PROPOSED_NOT_APPLIED";
    requires_human_approval: true;
  }>;
  interfaces: { mcp_read_tool: string; a2a_skill: string; api: string; human_gate: string };
  human_gate: {
    policy: string;
    decision: "HOLD";
    approval_required: true;
    may_apply: false;
    reviewer_role: string;
    receipt: null;
    note: string;
  };
  audit_sha256: string;
};

/** Fail closed at the UI boundary: a response for another axis, another logical
 * cluster, an open human gate or an applied proposal is not displayable evidence. */
export function validateAxisSpecialistAudit(value: unknown, axis: string): AxisSpecialistAudit {
  const audit = record(value);
  const specialist = record(audit?.specialist);
  const source = record(audit?.source);
  const axisRow = record(source?.axis_row);
  const summary = record(audit?.summary);
  const gate = record(audit?.human_gate);
  const proposals = audit?.improvement_proposals;
  const validProposals = Array.isArray(proposals) && proposals.length > 0 && proposals.every((item) => {
    const proposal = record(item);
    return proposal?.state === "PROPOSED_NOT_APPLIED" && proposal.requires_human_approval === true;
  });
  if (
    audit?.schema !== "csoai.axis-specialist-audit/1.0" ||
    audit.axis !== axis ||
    specialist?.id !== `meok-${axis}-specialist` ||
    specialist.cluster_id !== `meok-axis-${axis}` ||
    specialist.cluster_state !== "DECLARED_NOT_PROVISIONED" ||
    specialist.isolation !== "LOGICAL_PER_AXIS" ||
    specialist.asi_claimed !== false ||
    specialist.rsi_mode !== "RECOMMENDATION_ONLY" ||
    typeof specialist.mission !== "string" ||
    typeof source?.snapshot !== "string" ||
    axisRow?.axis !== axis ||
    !["MEASURED", "UNMEASURED"].includes(String(axisRow.status)) ||
    !summary ||
    !Array.isArray(audit.checks) ||
    !Array.isArray(audit.negative_controls) ||
    !validProposals ||
    gate?.decision !== "HOLD" ||
    gate.approval_required !== true ||
    gate.may_apply !== false ||
    gate.receipt !== null ||
    typeof audit.audit_sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(audit.audit_sha256)
  ) {
    throw new Error(`Unsafe or mismatched specialist audit for ${axis}`);
  }
  return audit as unknown as AxisSpecialistAudit;
}

/** Same-origin by construction. The axis must already exist in the generated,
 * exact 33-axis index; caller-provided URLs and path fragments are never fetched. */
export async function loadAxisSpecialist(
  axis: string,
  fetcher: typeof fetch = fetch,
): Promise<AxisSpecialistAudit> {
  if (!INDEX.specialists.some((item) => item.axis === axis)) {
    throw new Error("Choose an exact GSPC axis from the specialist index");
  }
  const response = await fetcher(`/api/axis-specialists/${axis}`, { credentials: "omit" });
  const body: unknown = await response.json();
  if (!response.ok) {
    const error = record(record(body)?.error);
    throw new Error(typeof error?.message === "string" ? error.message : `Specialist audit returned HTTP ${response.status}`);
  }
  return validateAxisSpecialistAudit(body, axis);
}

export default function CouncilAxisSpecialistPane() {
  const [axis, setAxis] = useState(INDEX.specialists[0]?.axis ?? "governance");
  const [audit, setAudit] = useState<AxisSpecialistAudit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(null);
    loadAxisSpecialist(axis)
      .then((result) => {
        if (current) setAudit(result);
      })
      .catch((cause) => {
        if (current) {
          setAudit(null);
          setError(cause instanceof Error ? cause.message : "Specialist audit could not be read");
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [axis, attempt]);

  const selected = INDEX.specialists.find((item) => item.axis === axis);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8" data-testid="axis-specialists-pane">
      <header className="border-b border-border pb-6">
        <p className="t-kicker text-emerald-800">Council OS / MEOK Hive</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">One bounded specialist for every GSPC axis</h2>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
          Read each axis’s own deterministic audit, evidence checks and improvement queue. These are unsigned audits of the captured board, not new measurements. Every proposal remains human-reviewed and unapplied.
        </p>
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1 text-xs font-semibold text-foreground sm:max-w-md">
            GSPC axis
            <select
              value={axis}
              onChange={(event) => setAxis(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground"
              data-testid="axis-specialist-select"
            >
              {INDEX.specialists.map((item) => (
                <option key={item.axis} value={item.axis}>{item.axis} · {item.measurement_status}</option>
              ))}
            </select>
          </label>
          <output className="rounded-lg bg-emerald-50 px-3 py-2 font-mono text-[10px] font-bold text-emerald-900" aria-live="polite">
            {loading ? "READING" : error ? "READ_FAILED" : audit?.summary.audit_state}
          </output>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {INDEX.coverage.specialists} specialists · {INDEX.coverage.clusters} declared logical clusters · {INDEX.applied_proposals} applied proposals · source {INDEX.source_snapshot}
        </p>
      </header>

      {loading ? (
        <div role="status" aria-live="polite" className="mt-6 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          Reading the {axis} specialist audit…
        </div>
      ) : error ? (
        <div role="alert" className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-950">
          <p>{error} Nothing was substituted for this axis.</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-3 min-h-11 rounded-xl bg-emerald-800 px-4 text-sm font-bold text-white">
            Try again
          </button>
        </div>
      ) : audit ? (
        <>
          <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_18rem]" aria-labelledby="specialist-mission">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-900">{audit.source.axis_row.status}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-900">{audit.source.axis_row.family}</span>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-950">H.I.M. {audit.human_gate.decision}</span>
              </div>
              <h3 id="specialist-mission" className="mt-4 text-lg font-bold text-foreground">{audit.specialist.id}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{audit.specialist.mission}</p>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><dt className="text-xs text-muted-foreground">Checks</dt><dd className="mt-1 font-mono font-bold">{audit.summary.passed}/{audit.summary.checks}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Findings</dt><dd className="mt-1 font-mono font-bold">{audit.summary.findings}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Proposals</dt><dd className="mt-1 font-mono font-bold">{audit.improvement_proposals.length}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Observed n</dt><dd className="mt-1 font-mono font-bold">{audit.source.axis_row.n}</dd></div>
              </dl>
              {audit.source.axis_row.status === "UNMEASURED" ? <p className="mt-4 text-xs font-semibold text-amber-950">UNMEASURED stays visible. n=0 is not a score.</p> : null}
            </div>
            <aside className="rounded-2xl border border-border bg-slate-50 p-5 text-sm">
              <h3 className="font-bold text-foreground">Isolated logical cluster</h3>
              <code className="mt-3 block break-all text-xs text-emerald-900">{audit.specialist.cluster_id}</code>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{audit.specialist.cluster_state}. No shared writes or cross-axis credentials. No provisioned compute cluster is claimed.</p>
              <p className="mt-3 text-xs text-muted-foreground">Reviewer: <span className="font-semibold text-foreground">{audit.human_gate.reviewer_role}</span></p>
            </aside>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="axis-checks">
              <h3 id="axis-checks" className="text-base font-bold">Audit checks and findings</h3>
              <ol className="mt-3 space-y-2">
                {audit.checks.map((check) => (
                  <li key={check.id} className="rounded-xl border border-border bg-card p-4">
                    <p className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-bold">{check.id}</span>
                      <span className={`rounded-full px-2 py-1 font-semibold ${check.state === "PASS" ? "bg-emerald-50 text-emerald-900" : "bg-amber-100 text-amber-950"}`}>{check.state}</span>
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{check.detail}</p>
                  </li>
                ))}
              </ol>
            </section>

            <div className="space-y-6">
              <section aria-labelledby="axis-proposals">
                <h3 id="axis-proposals" className="text-base font-bold">Recommendation-only improvement queue</h3>
                <ol className="mt-3 space-y-2">
                  {audit.improvement_proposals.map((proposal) => (
                    <li key={proposal.id} className="rounded-xl border border-border bg-card p-4">
                      <p className="text-sm leading-relaxed">{proposal.proposal}</p>
                      <p className="mt-2 font-mono text-[10px] font-bold text-amber-950">{proposal.state} · HUMAN APPROVAL REQUIRED</p>
                    </li>
                  ))}
                </ol>
              </section>
              <section aria-labelledby="axis-controls">
                <h3 id="axis-controls" className="text-base font-bold">Negative controls</h3>
                <ul className="mt-3 space-y-2">
                  {audit.negative_controls.map((control) => (
                    <li key={control.control} className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                      {control.control}<span className="mt-2 block font-mono text-[10px] font-bold">{control.state}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          <footer className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
            <p className="font-bold">MEOK H.I.M. gate: {audit.human_gate.decision}</p>
            <p className="mt-2 leading-relaxed">{audit.human_gate.note}</p>
            <p className="mt-3 break-all font-mono text-[10px]">audit_sha256 {audit.audit_sha256}</p>
            <p className="mt-2 text-xs">Read live measurement through <code>{audit.interfaces.mcp_read_tool}</code>; this specialist audit is unsigned and carries no receipt.</p>
          </footer>
        </>
      ) : null}
      {selected ? <span className="sr-only">Selected specialist {selected.specialist_id}</span> : null}
    </div>
  );
}
