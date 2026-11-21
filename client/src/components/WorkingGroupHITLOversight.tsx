import { useEffect, useState } from "react";

/**
 * Read-only companion for the seven PROPOSED Public Watchdog working groups.
 * It deliberately does not authenticate reviewers, accept decisions, publish
 * findings, grant execution rights, or turn HITL records into GSPC axis scores.
 *
 * Never synthesize a zero or a PASS when a source cannot be read.
 */
type Read<T> = { state: "READ"; data: T } | { state: "LOADING" | "UNCHECKABLE" };
type HITL = {
  module_count: number;
  review_queue_summary: Record<string, number>;
  store_bound: boolean;
  counts_are: string;
  assessment_scope: {
    operator_identity: string;
    human_presence: string;
    professional_competence: string;
    execution_authority: boolean;
  };
};
type GSPC = {
  axes: number;
  measured_axes: number;
  comparison_axes: number;
  separated_leads: number;
  ties: number;
  untested_separations: number;
};

function integer(x: unknown): x is number {
  return typeof x === "number" && Number.isSafeInteger(x) && x >= 0;
}

function hitlShape(value: unknown): HITL | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, any>;
  const a = v.assessment_scope;
  const q = v.review_queue_summary;
  if (
    v.schema !== "csoai.hitl-companion-state/0.1" ||
    !integer(v.module_count) ||
    !q || typeof q !== "object" || !integer(q.PENDING) ||
    typeof v.store_bound !== "boolean" ||
    typeof v.counts_are !== "string" || !v.counts_are.trim() ||
    !a || typeof a !== "object" ||
    typeof a.operator_identity !== "string" ||
    typeof a.human_presence !== "string" ||
    typeof a.professional_competence !== "string" ||
    typeof a.execution_authority !== "boolean"
  ) return null;
  return { module_count: v.module_count, review_queue_summary: q, store_bound: v.store_bound, counts_are: v.counts_are, assessment_scope: a };
}

function gspcShape(value: unknown): GSPC | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, any>;
  const t = v.totals;
  if (
    !String(v.schema ?? "").startsWith("csoai.gspc-axes/") || !t ||
    !["axes", "measured_axes", "comparison_axes", "separated_leads", "ties", "untested_separations"].every(
      (key) => integer(t[key]),
    )
  ) return null;
  return {
    axes: t.axes, measured_axes: t.measured_axes,
    comparison_axes: t.comparison_axes, separated_leads: t.separated_leads,
    ties: t.ties, untested_separations: t.untested_separations,
  };
}

const MEASURES = [
  {
    name: "Scope-bound authority",
    denominator: "Authorised action attempts in a declared fixture set",
    observable: "Exact proposal and scope digests, actor authority epoch, time window and attempted effect",
    negative: "Changed scope, expired/revoked approval or wrong principal must never silently execute",
  },
  {
    name: "Independent review",
    denominator: "Cases requiring an independent reviewer",
    observable: "Accepted role, competence, disclosed conflict, separate decision and signed revision",
    negative: "Reviewer of their own/client work or unverifiable identity is HOLD / UNCHECKABLE",
  },
  {
    name: "Effect and revocation",
    denominator: "Invocations plus explicit negative/timeout controls",
    observable: "Invocation receipt distinct from observed external effect; last action and quiescence times",
    negative: "Lost acknowledgement is not execution failure; unobserved effect is UNKNOWN",
  },
  {
    name: "Challenge and correction",
    denominator: "Published findings actually challenged during a declared window",
    observable: "Response, second review, dissent, disposition, elapsed time and superseding reference",
    negative: "Open, unstaffed or unreviewed disputes remain unresolved, never auto-PASS",
  },
] as const;

export default function WorkingGroupHITLOversight() {
  const [hitl, setHitl] = useState<Read<HITL>>({ state: "LOADING" });
  const [gspc, setGspc] = useState<Read<GSPC>>({ state: "LOADING" });

  useEffect(() => {
    let active = true;
    const abort = new AbortController();
    async function load<T>(
      path: string,
      validate: (v: unknown) => T | null,
      setter: (r: Read<T>) => void,
    ) {
      try {
        const response = await fetch(path, {
          signal: abort.signal,
          headers: { accept: "application/json" },
        });
        if (!response.ok) throw new Error("source unavailable");
        const value = validate(await response.json());
        if (!value) throw new Error("source schema incompatible");
        if (active) setter({ state: "READ", data: value });
      } catch {
        if (active) setter({ state: "UNCHECKABLE" });
      }
    }
    void load("/api/hitl", hitlShape, setHitl);
    void load("/api/gspc", gspcShape, setGspc);
    return () => { active = false; abort.abort(); };
  }, []);

  return (
    <section aria-labelledby="human-oversight-title" data-testid="wg-hitl-oversight" className="rounded-xl border border-border p-5 space-y-5">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Charter overlay · candidate, not adopted</p>
        <h3 id="human-oversight-title" className="mt-1 text-xl font-semibold">Human review that can be measured and challenged</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Applies to all seven forming working groups. Agents may collect and test public evidence; only a separately
          authenticated, authorised human may approve a specified consequential action. An independent reviewer
          handles contested findings. No human appointment, coverage guarantee, certificate or regulatory authority is inferred.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2" aria-label="Distinct live source readings">
        <div className="rounded-lg border border-border p-4" data-testid="wg-hitl-live">
          <p className="text-xs font-semibold uppercase tracking-wide">HITL source · /api/hitl</p>
          {hitl.state === "READ" ? (
            <>
              <p className="mt-2 text-sm">{hitl.data.module_count} board-reading modules. {hitl.data.store_bound ? `${hitl.data.review_queue_summary.PENDING} pending challenges in the recorded queue.` : "Queue count unavailable: no decision store is bound."}</p>
              <p className="mt-2 text-xs text-muted-foreground">Queue qualification: {hitl.data.counts_are}.</p>
              <p className="mt-2 text-xs text-muted-foreground">Operator identity: {hitl.data.assessment_scope.operator_identity}. Human presence: {hitl.data.assessment_scope.human_presence}. Professional competence: {hitl.data.assessment_scope.professional_competence}. Execution authority: {String(hitl.data.assessment_scope.execution_authority)}.</p>
            </>
          ) : (
            <p className="mt-2 text-sm" role="status">{hitl.state === "LOADING" ? "Reading current HITL state…" : "UNCHECKABLE — HITL source was not readable; no human involvement is inferred."}</p>
          )}
          <a className="mt-2 inline-block text-sm underline underline-offset-4" href="/api/hitl/record">Inspect public decision records</a>
        </div>
        <div className="rounded-lg border border-border p-4" data-testid="wg-gspc-live">
          <p className="text-xs font-semibold uppercase tracking-wide">GSPC source · /api/gspc</p>
          {gspc.state === "READ" ? (
            <>
              <p className="mt-2 text-sm">{gspc.data.measured_axes} measured axes of {gspc.data.axes} declared, according to the public board.</p>
              <p className="mt-2 text-xs text-muted-foreground">Model-comparison axes: {gspc.data.comparison_axes}. Statistically separated leads: {gspc.data.separated_leads}. Ties: {gspc.data.ties}. Untested separation: {gspc.data.untested_separations}. These are not human-review scores.</p>
            </>
          ) : (
            <p className="mt-2 text-sm" role="status">{gspc.state === "LOADING" ? "Reading current GSPC board…" : "UNCHECKABLE — GSPC source was not readable; no count or score is inferred."}</p>
          )}
          <a className="mt-2 inline-block text-sm underline underline-offset-4" href="/board/">Open the source board</a>
        </div>
      </div>

      <div>
        <h4 className="font-semibold">Reusable workflow: one case, one accountable decision trail</h4>
        <p className="mt-2 text-sm text-muted-foreground">Capture source and case revision → run a frozen GSPC-relevant instrument → classify missing evidence → resolve competence and conflicts → record a scoped human decision → observe any separately authorised effect → independently verify, challenge and correct. Record every UNKNOWN; do not turn missing evidence into a PASS.</p>
        <p className="mt-2 text-sm text-muted-foreground"><strong>Measurement status:</strong> Candidate human-oversight measures below are NOT_TESTED as a unified GSPC instrument. Existing HITL exercise answers and decision records are not authenticated independent human assessments. This panel does not create a new GSPC axis.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <caption className="mb-2 text-left font-semibold">Candidate measurement protocol · not yet benchmarked</caption>
          <thead><tr className="border-b border-border"><th scope="col" className="p-2">Control</th><th scope="col" className="p-2">Denominator</th><th scope="col" className="p-2">Required evidence and negative control</th></tr></thead>
          <tbody>{MEASURES.map(m => (
            <tr key={m.name} className="border-b border-border align-top">
              <th scope="row" className="p-2 font-medium">{m.name}</th>
              <td className="p-2">{m.denominator}</td>
              <td className="p-2">{m.observable}. <span className="text-muted-foreground">Must reject or preserve uncertainty: {m.negative}.</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Oversight evidence and participation routes">
        <a className="underline underline-offset-4" href="/him/">How H.I.M. establishes authority</a>
        <a className="underline underline-offset-4" href="/gspc-verify/">Verify a signed record</a>
        <a className="underline underline-offset-4" href="/dispute/">Challenge a finding</a>
        <a className="underline underline-offset-4" href="/corrections/">Corrections history</a>
        <a className="underline underline-offset-4" href="https://github.com/OpenSecureAIAlliance/wg-safe/issues/13">SAFE approval-to-effect discussion (external)</a>
      </nav>
    </section>
  );
}
