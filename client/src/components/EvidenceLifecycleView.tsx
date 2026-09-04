import { ArrowDown, ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import type { CapabilityActionContractStatus } from "@/lib/capabilityFabric";
import {
  EVIDENCE_ADMISSION_STAGES,
  EVIDENCE_CANDIDATE_INTAKE,
  EVIDENCE_INTAKES,
  EVIDENCE_WITNESS_RULE,
} from "@/lib/evidenceLifecycle";

export default function EvidenceLifecycleView({
  actionContract,
}: {
  actionContract: CapabilityActionContractStatus;
}) {
  const contractObserved = actionContract.state === "DECLARED_DISABLED";

  return (
    <section
      className="rounded-2xl border border-border bg-card p-5"
      aria-labelledby="evidence-lifecycle-title"
      data-testid="evidence-lifecycle-view"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex max-w-3xl items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="evidence-lifecycle-title"
              className="text-base font-semibold"
            >
              From user activity to GSPC evidence
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Games and reports are two intake lanes. Neither trains a model,
              invokes a measurement executor, or writes GSPC automatically.
              Every arrow below is an evidence gate, not a frontend action.
            </p>
          </div>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.08em] ${
            contractObserved
              ? "border-slate-700/15 bg-slate-100 text-slate-800"
              : "border-amber-700/25 bg-amber-50 text-amber-950"
          }`}
        >
          {contractObserved
            ? `ACTION CONTRACT · ${actionContract.action_count} READ DEFINITIONS · EXECUTION DISABLED`
            : "ACTION CONTRACT UNCHECKABLE · EXECUTION DISABLED"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {EVIDENCE_INTAKES.map((intake) => (
          <Link
            key={intake.id}
            href={intake.href}
            className="group rounded-xl border border-sky-800/15 bg-sky-50/65 p-4 transition hover:border-sky-700/35"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-sky-950">
                {intake.label}
              </p>
              <span className="rounded-full border border-sky-800/20 bg-white px-2 py-0.5 font-mono text-[9px] font-bold text-sky-900">
                {intake.state}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-sky-950/75">
              {intake.detail}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-sky-900 group-hover:underline">
              Open intake <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mx-auto flex max-w-xl flex-col items-center py-3 text-center">
        <ArrowDown
          className="h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="mt-1 rounded-full border border-border bg-muted px-3 py-1 font-mono text-[9px] font-semibold text-muted-foreground">
          MANUAL BOUNDARY · OPT-IN OR TRIAGE · NO AUTOMATIC PROMOTION
        </p>
      </div>

      <div className="mb-3 rounded-xl border border-sky-800/15 bg-sky-50/45 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-[11px] font-semibold text-sky-950">
            Candidate intake contract
          </p>
          <code className="font-mono text-[10px] text-sky-900">
            {EVIDENCE_CANDIDATE_INTAKE.method}{" "}
            {EVIDENCE_CANDIDATE_INTAKE.endpoint}
          </code>
          <span className="rounded-full border border-sky-800/20 bg-white px-2 py-0.5 font-mono text-[9px] font-bold text-sky-900">
            {EVIDENCE_CANDIDATE_INTAKE.effect}
          </span>
        </div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-sky-950/75">
          {EVIDENCE_CANDIDATE_INTAKE.detail} Storage occurs only when its
          datastore is bound; board write, public release and model training
          remain false.
        </p>
      </div>

      <ol
        className="grid gap-2 md:grid-cols-5"
        aria-label="Evidence admission stages"
      >
        {EVIDENCE_ADMISSION_STAGES.map((stage, index) => (
          <li
            key={stage.state}
            className={`relative rounded-xl border p-3 ${
              stage.public_board === "PUBLISHED"
                ? "border-emerald-700/25 bg-emerald-50"
                : "border-border bg-background"
            }`}
          >
            <p className="font-mono text-[9px] font-bold tracking-[0.06em] text-emerald-800">
              {stage.state}
            </p>
            <p className="mt-1 text-xs font-semibold text-foreground">
              {stage.title}
            </p>
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
              {stage.gate}
            </p>
            {index < EVIDENCE_ADMISSION_STAGES.length - 1 ? (
              <ArrowRight
                className="absolute -right-3 top-1/2 z-10 hidden h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground md:block"
                aria-hidden="true"
              />
            ) : null}
          </li>
        ))}
      </ol>

      <div className="mt-4 rounded-xl border border-dashed border-amber-700/30 bg-amber-50/55 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-amber-950">
            Separate witness receipts
          </p>
          <span className="font-mono text-[9px] font-bold text-amber-900">
            {EVIDENCE_WITNESS_RULE.channels.join(" · ")}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-amber-950/80">
          {EVIDENCE_WITNESS_RULE.detail}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold">
        <Link
          href="/dashboard?tab=measured"
          className="text-emerald-800 hover:underline"
        >
          Request independent measurement
        </Link>
        <Link
          href="/dashboard?tab=board"
          className="text-emerald-800 hover:underline"
        >
          Read the GSPC board
        </Link>
        <Link
          href="/dashboard?tab=attestations"
          className="text-emerald-800 hover:underline"
        >
          Inspect roots and witness states
        </Link>
        <a
          href="/api/fabric"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-emerald-800 hover:underline"
        >
          Raw fabric contract{" "}
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>

      {actionContract.last_error ? (
        <p className="mt-3 text-[10px] leading-relaxed text-amber-900">
          Contract state: {actionContract.last_error}
        </p>
      ) : null}
    </section>
  );
}
