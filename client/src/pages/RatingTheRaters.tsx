import { useEffect, useState } from "react";
import { setMetaDescription } from "@/lib/utils";

/* /rating-the-raters — result 001, the ARC-AGI-2 human baseline recomputation.
 *
 * Renders /interop/rating-the-raters-001-arc.json. Every figure on this page is
 * read from that file; nothing is typed into the markup. The per-task rows the
 * headline is computed from are rendered in full so a reader can recheck the
 * arithmetic without trusting us.
 *
 * TONE RULE, load-bearing: this is a measurement instrument reporting a rule
 * mismatch, not a competitor scoring points. ARC never claimed otherwise, ARC's
 * transparency is what made the check possible at all, and both facts are
 * rendered above the finding rather than buried under it. A rater that audits
 * others must be visibly fair to them or its own results are worthless.
 *
 * The page confers no status on ARC. There is no certification here and no
 * approval — Council of AI recomputes published claims and reports what
 * reproduced.
 */

interface Result {
  macro_over_tasks_pct: number;
  macro_ci95_bootstrap_tasks: [number, number];
  macro_ci95_method: string;
  micro_over_attempts_pct: number;
  micro_numerator: number;
  micro_denominator: number;
  micro_ci95_wilson: [number, number];
  micro_ci95_method: string;
  macro_ci95_wilson_naive_DO_NOT_USE: [number, number];
  macro_ci95_wilson_naive_note: string;
}

interface TaskRow {
  task_id: string;
  attempts: number;
  distinct_sessions: number;
  test_pairs: number;
  rate_unlimited_pct: number;
  rate_within_2_pct: number;
  rate_within_1_pct: number;
}

interface Artifact {
  result_id: string;
  axis: string;
  axis_name: string;
  programme: string;
  programme_status: string;
  subject: string;
  measured_on: string;
  verdict: string;
  verdict_meaning: string;
  fairness_statement: string;
  criterion: {
    question: string;
    applies_to: string;
    procedure: string[];
    verdicts: Record<string, string>;
    constraints: string[];
    how_to_dispute: string;
  };
  finding: {
    arc_machine_scoring_rule: string;
    arc_machine_rule_source: string;
    human_figure_published_by_arc_pct: number;
    human_figure_recomputed_pct: number;
    human_figure_rule_matched_pct: number;
    human_figure_rule_matched_ci95: [number, number];
    gap_pp: number;
    attempts_using_more_than_2_submissions_pct: number;
    solved_attempts_needing_more_than_2_submissions_pct: number;
  };
  what_is_not_measured: {
    note: string;
    unmeasured: { organisation: string; status: string }[];
    also_not_measured_about_arc: string[];
  };
  limits: string[];
  source: {
    dataset: string;
    file: string;
    dataset_license: string;
    dataset_sha256: string;
    arc_agi_2_repo_commit: string;
    why_pinned: string;
    recompute_with: string;
  };
  n: { tasks: number; test_pairs: number; attempts: number; distinct_sessions: number; floor: number };
  calibration_claim: {
    arc_claim: string;
    pairs_tested: number;
    pairs_reproduced: number;
    verdict: string;
    note: string;
  };
  aggregation_search: {
    arc_published_figure_pct: number;
    arc_published_wording: string;
    candidates_under_unlimited_submissions: Record<string, number>;
    unique_reconciliation: string;
    note: string;
  };
  assumption_check: {
    assumption: string;
    why_it_matters: string;
    solved_attempts: number;
    solved_attempts_with_exactly_one_correct: number;
    submission_count_distribution_over_solved_attempts: number[];
    distribution_monotonically_decreasing: boolean;
    sensitivity_pass_at_2_if_anomalous_row_counted_as_solved_pct: number;
    how_arc_could_settle_this: string;
  };
  coverage: {
    public_eval_tasks_in_benchmark: number;
    public_eval_tasks_covered_by_published_rows: number;
    coverage_pct: number;
    tasks_not_covered: number;
    status_of_uncovered_tasks: string;
    note: string;
  };
  results_by_rule: Record<string, Result>;
  task_rows: TaskRow[];
  task_rows_note: string;
}

const CARD = "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm";
const H2 = "text-2xl font-black text-gray-900";
const LABEL = "text-xs font-bold uppercase tracking-[0.18em] text-slate-500";

export default function RatingTheRaters() {
  const [a, setA] = useState<Artifact | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showRows, setShowRows] = useState(false);

  useEffect(() => {
    document.title = "Rating the Raters — result 001 | Council of AI";
    setMetaDescription(
      "We recomputed the ARC Prize project's published human baseline for ARC-AGI-2 from its own published rows. The figure reconciles exactly; under the benchmark's own two-trial rule the comparable human number is materially lower and is not published upstream.",
    );
    fetch("/interop/rating-the-raters-001-arc.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then(setA)
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto max-w-4xl px-6 py-14">
        <p className={LABEL}>Rating the Raters — measurement, not certification</p>
        <h1 className="mt-3 text-4xl font-black text-gray-900">
          Who measures the measurers?
        </h1>
        <p className="mt-4 max-w-3xl text-gray-600">
          Benchmark operators grade the whole field and are themselves graded by nobody. This
          programme recomputes what a rating organisation publishes, from the rows that
          organisation published, using deterministic arithmetic only. No model judges anything.
          Where our arithmetic confirms theirs, we say so — which, on this first result, is most
          of it.
        </p>

        {err && <p className="mt-8 text-red-600">Result fetch failed: {err}</p>}
        {!a && !err && <p className="mt-8 text-gray-600">Loading the measured result…</p>}

        {a && (
          <>
            {/* ---------------------------------------------- scope, before anything else */}
            <div className="mt-8 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                Read this before the number
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-amber-950">
                {a.programme_status}
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-amber-950">
                {a.what_is_not_measured.note}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {a.what_is_not_measured.unmeasured.map((u) => (
                  <span
                    key={u.organisation}
                    className="rounded-full border border-amber-400 bg-white px-3 py-1 text-xs font-bold text-amber-800"
                  >
                    {u.organisation} — {u.status.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* ---------------------------------------------- fairness, before the finding */}
            <div className="mt-6 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                What the ARC Prize project got right
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-emerald-950">
                {a.fairness_statement}
              </p>
              <div className="mt-4 rounded-xl bg-white/70 p-4">
                <p className="text-sm font-bold text-emerald-900">
                  Their calibration claim: {a.calibration_claim.verdict}
                </p>
                <p className="mt-1 text-sm text-emerald-900">
                  “{a.calibration_claim.arc_claim}” — reproduced on{" "}
                  {a.calibration_claim.pairs_reproduced} of {a.calibration_claim.pairs_tested}{" "}
                  test pairs. {a.calibration_claim.note}
                </p>
              </div>
              <div className="mt-3 rounded-xl bg-white/70 p-4">
                <p className="text-sm font-bold text-emerald-900">
                  Their headline figure reconciles exactly.
                </p>
                <p className="mt-1 text-sm text-emerald-900">
                  {a.aggregation_search.note} Their published wording:{" "}
                  “{a.aggregation_search.arc_published_wording}”
                </p>
              </div>
            </div>

            {/* ---------------------------------------------- the finding */}
            <h2 className={`mt-12 ${H2}`}>The finding — a rule mismatch</h2>
            <p className="mt-3 text-gray-600">
              The benchmark&apos;s own scoring rule, in its operator&apos;s words:{" "}
              <em>“{a.finding.arc_machine_scoring_rule}”</em>{" "}
              <span className="text-gray-600">({a.finding.arc_machine_rule_source})</span> The
              published human figure is computed under <strong>unlimited</strong> submissions. Under
              the two-trial rule the benchmark applies to machines, the comparable human number is
              lower:
            </p>

            <div className={`mt-6 ${CARD}`}>
              {/* Own scroller + min-width: at 375px this table had no overflow
                  container at all and crushed every header to one word per line. */}
              <div className="-mx-2 overflow-x-auto px-2">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-600">
                    <th className="pb-2">Scoring rule applied to humans</th>
                    <th className="pb-2 text-right">Human result</th>
                    <th className="pb-2 text-right">95% interval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3">
                      Unlimited submissions
                      <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        the operator&apos;s published basis
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold tabular-nums">
                      {a.results_by_rule.unlimited.macro_over_tasks_pct}%
                    </td>
                    <td className="py-3 text-right tabular-nums text-gray-600">
                      {a.results_by_rule.unlimited.macro_ci95_bootstrap_tasks.join(" – ")}
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-3">
                      Two trials
                      <span className="ml-2 rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-white">
                        the benchmark&apos;s own machine rule
                      </span>
                    </td>
                    <td className="py-3 text-right text-lg font-black tabular-nums text-slate-900">
                      {a.results_by_rule.pass_at_2.macro_over_tasks_pct}%
                    </td>
                    <td className="py-3 text-right tabular-nums text-gray-600">
                      {a.results_by_rule.pass_at_2.macro_ci95_bootstrap_tasks.join(" – ")}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 text-gray-600">One trial</td>
                    <td className="py-3 text-right font-bold tabular-nums text-gray-600">
                      {a.results_by_rule.pass_at_1.macro_over_tasks_pct}%
                    </td>
                    <td className="py-3 text-right tabular-nums text-gray-600">
                      {a.results_by_rule.pass_at_1.macro_ci95_bootstrap_tasks.join(" – ")}
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
              <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-600">
                Gap between the published figure and the rule-matched figure:{" "}
                <strong className="text-slate-900">{a.finding.gap_pp} percentage points.</strong>{" "}
                {a.finding.attempts_using_more_than_2_submissions_pct}% of human attempts used more
                than two submissions;{" "}
                {a.finding.solved_attempts_needing_more_than_2_submissions_pct}% of eventually
                correct attempts needed more than two.
              </p>
              <p className="mt-3 rounded-xl bg-slate-100 p-4 text-sm text-slate-800">
                <strong>Verdict — {a.verdict}.</strong> {a.verdict_meaning}
              </p>
            </div>

            {/* ---------------------------------------------- the criterion */}
            <h2 className={`mt-12 ${H2}`}>The criterion, stated so it can be argued with</h2>
            <div className={`mt-4 ${CARD}`}>
              <p className={LABEL}>
                {a.axis} — {a.axis_name}
              </p>
              <p className="mt-2 text-lg font-bold text-gray-900">{a.criterion.question}</p>
              <p className="mt-3 text-sm text-gray-600">
                <strong>Applies to:</strong> {a.criterion.applies_to}
              </p>
              <ol className="mt-4 space-y-1 text-sm text-gray-700">
                {a.criterion.procedure.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {Object.entries(a.criterion.verdicts).map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-black tracking-wide text-gray-900">{k}</p>
                    <p className="mt-1 text-xs text-gray-600">{v}</p>
                  </div>
                ))}
              </div>
              <ul className="mt-5 space-y-1 text-sm text-gray-600">
                {a.criterion.constraints.map((c) => (
                  <li key={c}>· {c}</li>
                ))}
              </ul>
              <p className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
                <strong>Disagree with this?</strong> {a.criterion.how_to_dispute}
              </p>
            </div>

            {/* ---------------------------------------------- the assumption */}
            <h2 className={`mt-12 ${H2}`}>The assumption this rests on</h2>
            <div className={`mt-4 ${CARD}`}>
              <p className="text-sm text-gray-700">
                <strong>{a.assumption_check.assumption}</strong>
              </p>
              <p className="mt-2 text-sm text-gray-600">{a.assumption_check.why_it_matters}</p>
              <p className="mt-3 text-sm text-gray-600">
                Evidence for it, computed from the same rows:{" "}
                <strong>{a.assumption_check.solved_attempts_with_exactly_one_correct}</strong> of{" "}
                <strong>{a.assumption_check.solved_attempts}</strong> solved attempts have exactly
                one correct submission, and the submission-count distribution over solved attempts
                is{" "}
                {a.assumption_check.distribution_monotonically_decreasing
                  ? "monotonically decreasing"
                  : "not monotonic"}{" "}
                ({a.assumption_check.submission_count_distribution_over_solved_attempts.join(", ")})
                — the shape produced by stopping at first success. Forcing the single anomalous row
                to count the other way moves the headline to{" "}
                {a.assumption_check.sensitivity_pass_at_2_if_anomalous_row_counted_as_solved_pct}%.
              </p>
              <p className="mt-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                It remains an assumption, not a fact. {a.assumption_check.how_arc_could_settle_this}
              </p>
            </div>

            {/* ---------------------------------------------- interval method */}
            <h2 className={`mt-12 ${H2}`}>Why the interval is a bootstrap and not Wilson</h2>
            <div className={`mt-4 ${CARD}`}>
              <p className="text-sm text-gray-600">
                Our house standard is the Wilson score interval, and it does not apply to this
                headline. The headline is a mean of per-task proportions, not a single binomial
                proportion. We publish all three so the difference is visible rather than asserted.
              </p>
              <div className="-mx-2 mt-4 overflow-x-auto px-2">
              <table className="w-full min-w-[30rem] text-left text-sm">
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2">Bootstrap over tasks — <strong>published</strong></td>
                    <td className="py-2 text-right tabular-nums">
                      {a.results_by_rule.pass_at_2.macro_ci95_bootstrap_tasks.join(" – ")}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600">
                      Wilson misapplied to the per-task mean — not used
                    </td>
                    <td className="py-2 text-right tabular-nums text-gray-600">
                      {a.results_by_rule.pass_at_2.macro_ci95_wilson_naive_DO_NOT_USE.join(" – ")}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2">
                      Attempt-level rate {a.results_by_rule.pass_at_2.micro_over_attempts_pct}% (
                      {a.results_by_rule.pass_at_2.micro_numerator}/
                      {a.results_by_rule.pass_at_2.micro_denominator}) — Wilson, where it is exact
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {a.results_by_rule.pass_at_2.micro_ci95_wilson.join(" – ")}
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
              <p className="mt-3 text-xs text-gray-600">
                {a.results_by_rule.pass_at_2.macro_ci95_method}.{" "}
                {a.results_by_rule.pass_at_2.micro_ci95_method}
              </p>
            </div>

            {/* ---------------------------------------------- limits */}
            <h2 className={`mt-12 ${H2}`}>What this does not measure</h2>
            <div className={`mt-4 ${CARD}`}>
              <ul className="space-y-3 text-sm text-gray-700">
                {a.limits.map((l) => (
                  <li key={l}>· {l}</li>
                ))}
              </ul>
              <p className="mt-5 text-sm font-bold text-gray-900">
                Also unmeasured, about this benchmark specifically:
              </p>
              <ul className="mt-2 space-y-2 text-sm text-gray-600">
                {a.what_is_not_measured.also_not_measured_about_arc.map((l) => (
                  <li key={l}>· {l}</li>
                ))}
              </ul>
              <p className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                <strong>Coverage.</strong> {a.coverage.note} Covered:{" "}
                {a.coverage.public_eval_tasks_covered_by_published_rows} of{" "}
                {a.coverage.public_eval_tasks_in_benchmark} public-eval tasks (
                {a.coverage.coverage_pct}%). The remaining {a.coverage.tasks_not_covered} are{" "}
                {a.coverage.status_of_uncovered_tasks}.
              </p>
            </div>

            {/* ---------------------------------------------- the rows */}
            <h2 className={`mt-12 ${H2}`}>The rows — recheck us</h2>
            <div className={`mt-4 ${CARD}`}>
              <p className="text-sm text-gray-600">
                {a.task_rows_note} Measured from{" "}
                <a
                  className="underline"
                  href={`https://huggingface.co/datasets/${a.source.dataset}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {a.source.dataset}
                </a>{" "}
                ({a.source.file}, {a.source.dataset_license}), SHA-256{" "}
                <code className="break-all text-xs">{a.source.dataset_sha256}</code>. Benchmark
                pinned to commit <code className="text-xs">{a.source.arc_agi_2_repo_commit}</code>.{" "}
                {a.source.why_pinned} Recompute with{" "}
                <code className="text-xs">{a.source.recompute_with}</code>.
              </p>
              <p className="mt-3 text-sm text-gray-600">
                n = {a.n.tasks} tasks · {a.n.test_pairs} test pairs · {a.n.attempts} attempts ·{" "}
                {a.n.distinct_sessions} sessions. Our floor for publication is {a.n.floor}.
              </p>
              <button
                className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                onClick={() => setShowRows((s) => !s)}
                aria-expanded={showRows}
                type="button"
              >
                {showRows ? "Hide" : "Show"} all {a.task_rows.length} task rows
              </button>
              {showRows && (
                <div className="mt-4 max-h-[28rem] overflow-auto rounded-xl border border-gray-200">
                  <table className="w-full min-w-[34rem] text-left text-xs">
                    <thead className="sticky top-0 bg-gray-50 text-gray-600">
                      <tr>
                        <th className="p-2">Task</th>
                        <th className="p-2 text-right">Attempts</th>
                        <th className="p-2 text-right">Sessions</th>
                        <th className="p-2 text-right">Unlimited</th>
                        <th className="p-2 text-right">≤2 trials</th>
                        <th className="p-2 text-right">≤1 trial</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {a.task_rows.map((r) => (
                        <tr key={r.task_id}>
                          <td className="p-2 font-mono">{r.task_id}</td>
                          <td className="p-2 text-right tabular-nums">{r.attempts}</td>
                          <td className="p-2 text-right tabular-nums">{r.distinct_sessions}</td>
                          <td className="p-2 text-right tabular-nums">{r.rate_unlimited_pct}%</td>
                          <td className="p-2 text-right font-bold tabular-nums">
                            {r.rate_within_2_pct}%
                          </td>
                          <td className="p-2 text-right tabular-nums text-gray-600">
                            {r.rate_within_1_pct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-4 text-xs text-gray-600">
                Result {a.result_id} · subject: {a.subject} · measured {a.measured_on}. Nothing on
                this page is signed, and it confers no status on the organisation measured. Council
                of AI recomputes published claims and reports what reproduced; it is not a
                certification body and issues no approval. Their semi-private results are cited
                where relevant and are never restated as measured by us.
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <p className="text-sm text-gray-700">
                <strong>A note on where this came from.</strong> An internal strategy draft once
                proposed publishing a figure for how many rating organisations keep a corrections
                record. That figure had never been measured and it is not published here. What is
                published is one recomputation, of one claim, by one organisation, with its rows
                attached — which is the only kind of thing this programme will ever publish.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
