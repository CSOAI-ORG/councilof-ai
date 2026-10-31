import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Search, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { PaneHead } from "@/components/lobby/paneKit";

export function researchPlanUrl(hostname?: string): string {
  return hostname === "localhost" || hostname === "127.0.0.1"
    ? "https://councilof.ai/api/research-plan"
    : "/api/research-plan";
}

export function watchdogSourcesUrl(hostname?: string): string {
  return hostname === "localhost" || hostname === "127.0.0.1"
    ? "https://councilof.ai/api/watchdog-sources"
    : "/api/watchdog-sources";
}

type WatchdogSource = {
  id: string;
  publisher: string;
  title: string;
  source_role: string;
  url: string;
  rights_url: string;
  watch: boolean;
  coverage_note: string;
  reuse_note: string;
  ingestion_gate: string;
  availability_state: string;
  endpoint_http_status: number | null;
  endpoint_checked_at: string | null;
};
type WatchdogSourceReply = {
  schema?: string;
  state?: string;
  observed_at?: string | null;
  freshness_state?: string;
  summary?: {
    registered_sources: number;
    monitored_sources: number;
    reachable_source_pages: number;
    redirected_source_pages?: number;
  };
  sources?: WatchdogSource[];
};
type ResearchSource = {
  id: string;
  publisher: string;
  title: string;
  url: string;
  watch: boolean;
};
type ResearchPlan = {
  axis: string;
  research_state: string;
  candidate_state: string;
  candidate_is_measurement: boolean;
  measurement: {
    status?: string;
    kind?: string;
    task?: string;
    n?: number;
    accuracy?: number | null;
    separation?: string | null;
    measurement_time?: Record<string, string>;
    method_status?: string;
  };
  continuous_question: string;
  compound_semantics: string[];
  implementation: { present: string; missing: string };
  safe_autonomous_action: string;
  human_gate: string;
  sources: ResearchSource[];
};
type ResearchReply = {
  schema?: string;
  state?: string;
  measured_axis_count?: number;
  semantics_version?: string;
  watch?: { confirmation?: string; candidate_submission?: string };
  plans?: ResearchPlan[];
};

function endpointState(value?: string): string {
  return (value ?? "UNMEASURED").replaceAll("_", " ").toLowerCase();
}

function measuredWhen(value?: Record<string, string>): string {
  if (!value) return "measurement time not supplied";
  return value.observed_at ?? value.observed_on ?? value.not_after ?? value.state ?? "UNCHECKABLE";
}

export default function DashboardResearchPane() {
  const [reply, setReply] = useState<ResearchReply | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sourceCoverage, setSourceCoverage] = useState<WatchdogSourceReply | null>(null);
  const [sourceCoverageError, setSourceCoverageError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(researchPlanUrl(window.location.hostname), {
      signal: controller.signal,
      headers: { accept: "application/json" },
    })
      .then(async (response) => {
        const value = (await response.json()) as ResearchReply;
        if (!response.ok || value.schema !== "csoai.gspc-research-plan/0.1" || value.state !== "READY" || !Array.isArray(value.plans)) {
          throw new Error("The research plan is unavailable; no remembered measurements are shown.");
        }
        setReply(value);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Research plan unavailable.");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(watchdogSourcesUrl(window.location.hostname), {
      signal: controller.signal,
      headers: { accept: "application/json" },
    })
      .then(async (response) => {
        const value = (await response.json()) as WatchdogSourceReply;
        if (!response.ok || value.schema !== "csoai.watchdog-source-coverage/0.1" || value.state !== "READY" || !Array.isArray(value.sources)) {
          throw new Error("Watchdog source status is unavailable; no case imports are assumed.");
        }
        setSourceCoverage(value);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setSourceCoverageError(reason instanceof Error ? reason.message : "Watchdog source status unavailable.");
      });
    return () => controller.abort();
  }, []);

  const plans = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return reply?.plans ?? [];
    return (reply?.plans ?? []).filter((plan) =>
      [plan.axis, plan.measurement.task, plan.continuous_question, ...plan.compound_semantics]
        .join(" ").toLowerCase().includes(needle),
    );
  }, [query, reply]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8">
      <PaneHead eyebrow="GSPC · continuous research" title="From a measured axis to its next review">
        Live measurements joined to explicit research semantics. Sources are watched for change; a person
        decides what changed and whether a fresh measurement is justified. Nothing here trains a model,
        fixes a system, signs a finding or promotes a candidate to the board.
      </PaneHead>

      <section aria-label="Continuous research controls" className="mt-6 rounded-2xl border border-emerald-800/15 bg-emerald-50/70 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-semibold text-emerald-950">Monitoring stops at an unsigned review request</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-emerald-950/80">
              {reply?.watch?.confirmation ?? "A change needs two successful observations before review."}
              {" "}Candidate submission: {reply?.watch?.candidate_submission ?? "NONE"}. A source change is not a measurement or legal conclusion.
            </p>
          </div>
        </div>
        <ol className="mt-4 grid gap-2 text-[12px] text-slate-700 sm:grid-cols-5">
          {["Watch source", "Confirm fingerprint", "Human impact review", "Authorised re-run", "Independent signing & admission"].map((step, index) => (
            <li key={step} className="rounded-lg bg-white/75 px-3 py-2"><strong className="mr-1 text-emerald-900">{index + 1}.</strong>{step}</li>
          ))}
        </ol>
      </section>

      <section aria-label="Public incident source coverage" className="mt-6 rounded-2xl border border-slate-900/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Public incident and threat source watch</h3>
            <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-slate-600">
              Seed coverage inventory. Checks public source pages with HTTP HEAD only; it does not read incidents,
              reports, snapshots or attachments. Page reachability does not mean the incident data is complete or current.
            </p>
          </div>
          {sourceCoverage && <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
            {sourceCoverage.freshness_state ?? "unmeasured"}
          </span>}
        </div>

        {sourceCoverageError && <div role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">{sourceCoverageError}</div>}
        {!sourceCoverage && !sourceCoverageError && <p role="status" className="mt-4 text-sm text-slate-600">Reading <code>GET /api/watchdog-sources</code>…</p>}
        {sourceCoverage && <>
          <p className="mt-3 text-[12px] text-slate-700" aria-live="polite">
            {sourceCoverage.summary?.reachable_source_pages ?? 0} direct 2xx ·
            {" "}{sourceCoverage.summary?.redirected_source_pages ?? 0} redirected ·
            {" "}{sourceCoverage.summary?.monitored_sources ?? 0} source pages checked ·
            {" "}{sourceCoverage.summary?.registered_sources ?? sourceCoverage.sources?.length ?? 0} sources listed ·
            {" "}observed {sourceCoverage.observed_at ?? "not recorded"}.
          </p>
          <p className="mt-1 text-[12px] text-amber-900">
            No incident records are collected or routed by this monitor. Reuse review is required before any incident record enters a case workflow or affects a GSPC score.
          </p>
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {sourceCoverage.sources?.map((source) => (
              <li key={source.id} className="rounded-xl border border-slate-900/10 bg-slate-50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-900 underline underline-offset-4">
                    {source.publisher}: {source.title}<ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase text-slate-700">
                    {endpointState(source.availability_state)}{source.endpoint_http_status ? " · " + source.endpoint_http_status : ""}
                  </span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-700">{source.coverage_note}</p>
                <details className="mt-2 text-[11px] text-slate-600">
                  <summary className="cursor-pointer font-semibold text-slate-800">Reuse gate and source terms</summary>
                  <p className="mt-2 leading-relaxed">{source.reuse_note}</p>
                  <p className="mt-1 font-medium">Ingestion: {endpointState(source.ingestion_gate)}</p>
                  <a href={source.rights_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-emerald-900 underline underline-offset-4">Read source terms or methodology</a>
                </details>
              </li>
            ))}
          </ul>
        </>}
      </section>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Measured-axis research registry</h3>
          <p className="mt-1 text-[12px] text-slate-600" aria-live="polite">
            {reply ? `${reply.measured_axis_count ?? reply.plans?.length ?? 0} measured axes · semantics ${reply.semantics_version ?? "unversioned"} · showing ${plans.length}` : "Reading the live research plan…"}
          </p>
        </div>
        <label className="relative block w-full max-w-sm">
          <span className="sr-only">Filter research axes</span>
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter axes or semantics" className="min-h-11 w-full rounded-xl border border-slate-900/15 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-700" />
        </label>
      </div>

      {error && <div role="alert" className="mt-5 rounded-xl border border-amber-700/25 bg-amber-50 p-4 text-sm text-amber-950">{error}</div>}
      {!reply && !error && <p role="status" className="mt-5 rounded-xl border bg-white p-4 text-sm text-slate-600">Reading <code>GET /api/research-plan</code>…</p>}

      <div className="mt-5 space-y-4">
        {plans.map((plan) => (
          <article key={plan.axis} className="rounded-2xl border border-slate-900/10 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="font-mono text-base font-semibold text-slate-950">{plan.axis}</h4>
                <p className="mt-1 max-w-3xl text-[13px] text-slate-600">{plan.measurement.task}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-900">{plan.measurement.status}</span>
                {plan.measurement.separation && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">separation {plan.measurement.separation}</span>}
              </div>
            </div>
            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-slate-600">
              <div><dt className="inline font-semibold">Rows: </dt><dd className="inline">{plan.measurement.n ?? "not applicable"}</dd></div>
              <div><dt className="inline font-semibold">Measured: </dt><dd className="inline">{measuredWhen(plan.measurement.measurement_time)}</dd></div>
              <div><dt className="inline font-semibold">Kind: </dt><dd className="inline">{plan.measurement.kind}</dd></div>
            </dl>
            <p className="mt-4 text-sm font-medium leading-relaxed text-slate-900">{plan.continuous_question}</p>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label={`${plan.axis} compound semantics`}>
              {plan.compound_semantics.map((semantic) => <li key={semantic} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-700">{semantic}</li>)}
            </ul>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <section className="rounded-xl bg-slate-50 p-3"><h5 className="text-xs font-semibold text-slate-900">Already implemented</h5><p className="mt-1 text-[12px] leading-relaxed text-slate-700">{plan.implementation.present}</p></section>
              <section className="rounded-xl bg-amber-50 p-3"><h5 className="text-xs font-semibold text-amber-950">Still needed</h5><p className="mt-1 text-[12px] leading-relaxed text-amber-950/85">{plan.implementation.missing}</p></section>
              <section className="rounded-xl bg-emerald-50 p-3"><h5 className="text-xs font-semibold text-emerald-950">Safe autonomous action</h5><p className="mt-1 text-[12px] leading-relaxed text-emerald-950/85">{plan.safe_autonomous_action}</p></section>
              <section className="rounded-xl border border-slate-200 p-3"><h5 className="text-xs font-semibold text-slate-900">Required human gate</h5><p className="mt-1 text-[12px] leading-relaxed text-slate-700">{plan.human_gate}</p></section>
            </div>
            <footer className="mt-4 border-t border-slate-100 pt-3">
              <h5 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Authoritative watch sources</h5>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                {plan.sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-900 underline underline-offset-4">{source.publisher}: {source.title}<ExternalLink className="h-3 w-3" aria-hidden="true" /></a></li>)}
              </ul>
            </footer>
          </article>
        ))}
      </div>
      {reply && plans.length === 0 && <p className="mt-5 rounded-xl border bg-white p-5 text-sm text-slate-600">No measured research axis matches this filter.</p>}
      <nav aria-label="Research context" className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/dashboard?tab=board" className="font-semibold text-emerald-900 underline underline-offset-4">Open the live board</Link>
        <Link href="/methodology" className="font-semibold text-emerald-900 underline underline-offset-4">Read the measurement methodology</Link>
      </nav>
    </div>
  );
}
