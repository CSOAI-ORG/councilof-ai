/**
 * CorrectionsPane — Corrections → Corrections ledger, inside the workspace. Read live from
 * GET /api/corrections (the same ledger /corrections/ renders), newest first as the ledger orders
 * it. The signature state is printed as the endpoint states it; the entry text is the entry's own.
 */
import { useState } from "react";
import { Link } from "wouter";
import { useLiveJson } from "./useLiveJson";
import NextSteps from "./NextSteps";

type Entry = {
  id?: string;
  date?: string;
  status?: string;
  detected_by?: string;
  what_was_wrong?: string;
  fix?: string;
  what_changed?: string;
  how_caught?: string;
};
type Ledger = { corrections?: Entry[]; signature_state?: string; signature_check?: { checked_at?: string } };

type WatchdogLedger = {
  schema?: string;
  as_of?: string;
  gspc_board_boundary?: {
    declared_slots?: number;
    measured_axes?: number;
    unmeasured_axes?: number;
    model_comparison_axes?: { total?: number; separated?: number; tie?: number; untested?: number };
    subject_family_measured_axes?: number;
    slot_34_gate_rule?: string;
  };
  evidence_planes?: { plane_id: string; name: string; authority: string; unit: string; separation_rule: string }[];
  data_provenance_records?: { order: number; record_type: string; description: string }[];
  case_governed_views?: { view_id: string; visibility: string; contents: string }[];
  feed_health_states?: string[];
  registered_sources?: {
    source_id: string;
    name: string;
    category: string;
    cadence: string;
    health_state: string;
    candidate_axes: string[];
    storage_target: string;
  }[];
  meok_human_qualification?: {
    enrolled_human_operator_keys?: number;
    specialist_taxonomy_slots?: number;
    initial_qualified_functions?: { function_id: string; title: string; scope: string }[];
    layer0_action_boundary?: string[];
  };
  wg_safe_crosswalk?: { states?: string[]; rule?: string };
  cloud_compute_and_storage_offload?: {
    local_operator_machine_policy?: string;
    surfaces?: { surface: string; repo?: string; space?: string; workflow?: string; capacity?: string; purpose?: string; sync_mechanism?: string }[];
  };
  execution_gates?: { gate: string; title: string; status: string }[];
  artifact_sha256?: string;
};

function clip(s: string | undefined, n: number): string {
  if (!s) return "";
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}

export default function CorrectionsPane() {
  const read = useLiveJson<Ledger>("/api/corrections");
  const watchdog = useLiveJson<WatchdogLedger>("/interop/watchdog-signal-ledger-v1.json");
  const [shown, setShown] = useState(8);
  const [windowDays, setWindowDays] = useState<number | null>(null);
  const [by, setBy] = useState<string | null>(null);
  const all = read.state === "ok" && Array.isArray(read.data.corrections) ? read.data.corrections : [];
  const byValues = [...new Set(all.map((e) => e.detected_by).filter((x): x is string => Boolean(x)))].slice(0, 4);
  const cutoff = windowDays === null ? null : Date.now() - windowDays * 86_400_000;
  const entries = all.filter(
    (e) => (by === null || e.detected_by === by) && (cutoff === null || (e.date ? Date.parse(e.date) >= cutoff : false)),
  );
  const chip = (on: boolean) =>
    `inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-semibold ${on ? "border-emerald-800 bg-emerald-800 text-white" : "border-border bg-card text-foreground hover:border-emerald-700/50"}`;
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-8" data-testid="corrections-pane">
      <p className="t-kicker text-emerald-800">Corrections</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">What we got wrong, and what changed</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Every entry says what was wrong, how it was caught and what changed. Signed records are superseded, never edited.
      </p>

      {read.state === "loading" ? (
        <div role="status" aria-live="polite" className="mt-6 space-y-3" data-testid="corrections-loading">
          {[0, 1, 2].map((i) => (
            <span key={i} className="block h-20 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" aria-hidden="true" />
          ))}
          <span className="sr-only">Reading the corrections ledger</span>
        </div>
      ) : read.state === "error" ? (
        <div role="alert" className="mt-6 rounded-2xl border border-amber-500/60 bg-amber-50 p-4 text-sm text-amber-950" data-testid="corrections-error">
          <p>
            The ledger is unread right now ({read.error}). Nothing is shown in its place.{" "}
            <a className="font-bold underline underline-offset-2" href="/api/corrections">
              Read GET /api/corrections directly
            </a>
            .
          </p>
          <button type="button" onClick={read.retry} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-emerald-800 px-4 text-sm font-bold text-white hover:bg-emerald-900">
            Try again
          </button>
        </div>
      ) : entries.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">The ledger answered with no entries.</p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="Filter the ledger" data-testid="corrections-filters">
            {([null, 7, 30] as const).map((d) => (
              <button key={String(d)} type="button" aria-pressed={windowDays === d} onClick={() => setWindowDays(d)} className={chip(windowDays === d)}>
                {d === null ? "All time" : `Last ${d} days`}
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
            <button type="button" aria-pressed={by === null} onClick={() => setBy(null)} className={chip(by === null)}>
              Anyone
            </button>
            {byValues.map((b) => (
              <button key={b} type="button" aria-pressed={by === b} onClick={() => setBy(b)} className={chip(by === b)}>
                {b}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground" data-testid="corrections-summary">
            <span className="font-mono text-base font-black text-foreground">{entries.length}</span> of {all.length} entries · ledger signature{" "}
            <span className="font-mono font-bold text-foreground">{read.data.signature_state ?? "not stated"}</span>
            {read.data.signature_check?.checked_at ? ` (checked ${read.data.signature_check.checked_at})` : ""} · source GET /api/corrections
          </p>
          <ol className="mt-4 list-none space-y-3 p-0">
            {entries.slice(0, shown).map((e, i) => (
              <li key={e.id ?? i} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                <p className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-foreground">{e.id}</span>
                  {e.date ? <span className="text-muted-foreground">{e.date}</span> : null}
                  {e.status ? <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-900">{e.status}</span> : null}
                  {e.detected_by ? <span className="text-muted-foreground">caught by {e.detected_by}</span> : null}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  <span className="font-semibold">Wrong: </span>
                  {clip(e.what_was_wrong, 320)}
                </p>
                {e.fix || e.what_changed ? (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Changed: </span>
                    {clip(e.what_changed ?? e.fix, 260)}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {shown < entries.length ? (
              <button
                type="button"
                onClick={() => setShown((n) => n + 12)}
                className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:border-emerald-600/50"
              >
                Show more ({entries.length - shown} older)
              </button>
            ) : null}
            <Link href="/corrections/" className="inline-flex min-h-11 items-center text-sm font-bold text-emerald-800 underline underline-offset-4">
              The full ledger page →
            </Link>
            <a href="/feeds/corrections.xml" className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-800 underline underline-offset-4">
              RSS feed
            </a>
          </div>
        </>
      )}
      {watchdog.state === "ok" && watchdog.data ? (
        <section
          className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6"
          aria-labelledby="watchdog-signal-ledger-heading"
          data-testid="watchdog-signal-ledger-section"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="t-kicker text-emerald-800">Watchdog Signal Registry &amp; Coverage Ledger</p>
              <h3 id="watchdog-signal-ledger-heading" className="mt-1 text-xl font-black tracking-tight text-foreground">
                3 Separated Evidence Planes · 5 Provenance Records · Cloud Offload
              </h3>
            </div>
            <a
              href="/interop/watchdog-signal-ledger-v1.json"
              className="font-mono text-xs font-semibold text-emerald-800 underline underline-offset-4"
            >
              GET /interop/watchdog-signal-ledger-v1.json
            </a>
          </div>

          {watchdog.data.gspc_board_boundary ? (
            <div className="rounded-xl border border-border/80 bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">
                Canonical GSPC Board Boundary (<span className="font-mono">GET /api/gspc</span>):{" "}
                <span className="font-mono">
                  {watchdog.data.gspc_board_boundary.declared_slots} declared slots ·{" "}
                  {watchdog.data.gspc_board_boundary.measured_axes} MEASURED ·{" "}
                  {watchdog.data.gspc_board_boundary.unmeasured_axes} UNMEASURED
                </span>{" "}
                (never summed) ·{" "}
                <span className="font-mono">
                  {watchdog.data.gspc_board_boundary.model_comparison_axes?.total} model-comparison axes (
                  {watchdog.data.gspc_board_boundary.model_comparison_axes?.separated} SEPARATED ·{" "}
                  {watchdog.data.gspc_board_boundary.model_comparison_axes?.tie} TIE ·{" "}
                  {watchdog.data.gspc_board_boundary.model_comparison_axes?.untested} UNTESTED)
                </span>
              </p>
              <p className="mt-1">{watchdog.data.gspc_board_boundary.slot_34_gate_rule}</p>
            </div>
          ) : null}

          {Array.isArray(watchdog.data.evidence_planes) ? (
            <div>
              <h4 className="text-sm font-bold text-foreground">1. Three Distinct Evidence Planes</h4>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {watchdog.data.evidence_planes.map((p) => (
                  <div key={p.plane_id} className="rounded-xl border border-border p-3 text-xs">
                    <p className="font-bold text-foreground">{p.name}</p>
                    <p className="mt-1 font-mono text-[11px] text-emerald-800">{p.authority}</p>
                    <p className="mt-1 text-muted-foreground">{p.unit}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{p.separation_rule}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {Array.isArray(watchdog.data.data_provenance_records) ? (
            <div>
              <h4 className="text-sm font-bold text-foreground">2. Five-Record Provenance Chain &amp; Three Governed Case Views</h4>
              <ol className="mt-2 grid gap-2 sm:grid-cols-5">
                {watchdog.data.data_provenance_records.map((r) => (
                  <li key={r.order} className="rounded-xl border border-border p-3 text-xs">
                    <p className="font-mono font-bold text-emerald-800">
                      {r.order}. {r.record_type}
                    </p>
                    <p className="mt-1 text-muted-foreground">{r.description}</p>
                  </li>
                ))}
              </ol>
              {Array.isArray(watchdog.data.case_governed_views) ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {watchdog.data.case_governed_views.map((v) => (
                    <div key={v.view_id} className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs">
                      <span className="font-mono font-bold text-foreground">{v.view_id}</span>{" "}
                      <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-900">
                        {v.visibility}
                      </span>
                      <p className="mt-1 text-muted-foreground">{v.contents}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {Array.isArray(watchdog.data.registered_sources) ? (
            <div>
              <h4 className="text-sm font-bold text-foreground">
                3. Registered Sources &amp; Seven Feed-Health States (
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  {(watchdog.data.feed_health_states ?? []).join(" · ")}
                </span>
                )
              </h4>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {watchdog.data.registered_sources.map((s) => (
                  <div key={s.source_id} className="rounded-xl border border-border p-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-foreground">{s.name}</span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-900">
                        {s.health_state}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {s.category} · cadence: <span className="font-mono">{s.cadence}</span> · axes:{" "}
                      <span className="font-mono">{s.candidate_axes.join(", ")}</span>
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">vault: {s.storage_target}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {watchdog.data.meok_human_qualification && watchdog.data.wg_safe_crosswalk ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-3 text-xs">
                <h4 className="font-bold text-foreground">
                  4. MEOK 3-Function Human Qualification (enrolled keys:{" "}
                  <span className="font-mono">{watchdog.data.meok_human_qualification.enrolled_human_operator_keys}</span>)
                </h4>
                <ul className="mt-2 space-y-1.5 text-muted-foreground">
                  {(watchdog.data.meok_human_qualification.initial_qualified_functions ?? []).map((fn) => (
                    <li key={fn.function_id}>
                      <span className="font-semibold text-foreground">{fn.title}:</span> {fn.scope}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border p-3 text-xs">
                <h4 className="font-bold text-foreground">5. WG-SAFE 6-State Crosswalk &amp; Layer-0 Boundary</h4>
                <p className="mt-1 font-mono text-[11px] text-emerald-800">
                  {(watchdog.data.wg_safe_crosswalk.states ?? []).join(" → ")}
                </p>
                <p className="mt-1 text-muted-foreground">{watchdog.data.wg_safe_crosswalk.rule}</p>
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                  {(watchdog.data.meok_human_qualification.layer0_action_boundary ?? []).join(" · ")}
                </p>
              </div>
            </div>
          ) : null}

          {watchdog.data.cloud_compute_and_storage_offload ? (
            <div>
              <h4 className="text-sm font-bold text-foreground">
                6. Hugging Face (10 TB Public + 1 TB Private), Kaggle &amp; RunPod Offload
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {watchdog.data.cloud_compute_and_storage_offload.local_operator_machine_policy}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {(watchdog.data.cloud_compute_and_storage_offload.surfaces ?? []).map((sf) => (
                  <div key={sf.surface} className="rounded-xl border border-border p-3 text-xs">
                    <p className="font-bold text-foreground">{sf.surface}</p>
                    {sf.capacity ? <p className="mt-0.5 font-mono text-[11px] text-emerald-800">{sf.capacity}</p> : null}
                    {sf.repo ? (
                      <p className="mt-0.5">
                        <a href={sf.repo} target="_blank" rel="noreferrer noopener" className="font-mono text-[11px] underline">
                          {sf.repo}
                        </a>
                      </p>
                    ) : null}
                    {sf.sync_mechanism ? <p className="mt-1 text-muted-foreground">{sf.sync_mechanism}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {read.state === "loading" ? null : (
      <NextSteps
        testId="corrections-next"
        steps={[
          { href: "/dashboard?tab=claims", title: "See what we keep re-checking", body: "Claim maintenance: the claims re-read on a schedule, and what changed." },
          { href: "/dispute/", title: "Ask for a correction", body: "Contest anything we published; a dispute is answered by re-measuring." },
          { href: "/dashboard?tab=verify", title: "Check a record yourself", body: "A superseded record still verifies; its replacement is named." },
        ]}
      />
      )}
    </div>
  );
}
