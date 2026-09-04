import {
  ArrowRight,
  ClipboardCheck,
  FileCheck2,
  ScanSearch,
  ShieldAlert,
  WalletCards,
} from "lucide-react";
import { Link } from "wouter";
import { useSearch } from "wouter";
import ToolRunner from "./ToolRunner";

export const REQUEST_ATTESTATION_CONTRACT = {
  tool: "commission_card",
  route: "/api/request-attestation",
  requestState: "PAYMENT_REQUIRED",
  deliveredState: "DELIVERED",
  freshRunState: "UNMEASURED",
  verifyRoute: "/dashboard?tab=verify",
} as const;

const STEPS = [
  {
    number: "01",
    icon: ScanSearch,
    title: "Inspect what already exists",
    body: "Enter a subject and optional axis, then call without x_payment. The endpoint returns its current 402 challenge and free preview, including signed measurement cards already on file. A challenge is not a purchase or a delivery.",
  },
  {
    number: "02",
    icon: WalletCards,
    title: "Authorise outside this page",
    body: "If you choose to continue, your wallet signs against the exact accepts[] entry returned by that challenge. This workspace never asks for a seed phrase or private key and never constructs a payment on your behalf.",
  },
  {
    number: "03",
    icon: FileCheck2,
    title: "Re-call, inspect, then verify",
    body: "Paste the wallet-signed x_payment and call again. Treat a receipt as delivered only when the response says DELIVERED. Treat it as signed only when the returned card actually carries a verifiable signature.",
  },
] as const;

export default function DashboardRequestPane() {
  const search = useSearch();
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const initialArguments = {
    ...(params.get("subject") ? { subject: params.get("subject")! } : {}),
    ...(params.get("axis") ? { axis: params.get("axis")! } : {}),
  };
  return (
    <section
      className="mx-auto max-w-6xl px-5 py-7 sm:px-8"
      aria-labelledby="request-attestation-title"
    >
      <div className="rounded-2xl border border-emerald-900/10 bg-[linear-gradient(135deg,#04120c_0%,#073b2b_100%)] p-6 text-white shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
              Council of AI · Request Attestation Service
            </p>
            <h1
              id="request-attestation-title"
              className="mt-2 text-3xl font-semibold tracking-tight"
            >
              Request a receipt. Never mistake it for a fresh measurement.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-50/80">
              RAS commissions one card-v0 receipt for a named subject on the
              frozen bank. It can re-serve signed measurement cards already on
              file; payment never creates a MEASURED cell. A fresh run remains
              <strong className="mx-1 text-white">UNMEASURED</strong>
              until a published run actually exists.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/70">
              Canonical contract
            </p>
            <code className="mt-1 block text-xs text-white">
              {REQUEST_ATTESTATION_CONTRACT.tool}
            </code>
            <code className="mt-0.5 block text-[10px] text-emerald-100/70">
              {REQUEST_ATTESTATION_CONTRACT.route}
            </code>
          </div>
        </div>
      </div>

      <ol
        className="mt-5 grid gap-3 lg:grid-cols-3"
        aria-label="Request workflow"
      >
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <li
              key={step.number}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-mono text-[10px] font-bold text-muted-foreground">
                  {step.number}
                </span>
              </div>
              <h2 className="mt-3 text-sm font-semibold text-foreground">
                {step.title}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,.42fr)]">
        <div className="flex items-start gap-3 rounded-xl border border-emerald-800/15 bg-emerald-50/55 p-4">
          <ClipboardCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs font-semibold text-emerald-950">
              What the states mean
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-emerald-950/80">
              <strong>PAYMENT_REQUIRED</strong> means the challenge and preview
              were observed and nothing was charged. <strong>DELIVERED</strong>
              means the paid route returned a payload. Neither word alone proves
              a signature; inspect the returned card and verify it
              independently.
            </p>
          </div>
        </div>

        <Link
          href={REQUEST_ATTESTATION_CONTRACT.verifyRoute}
          className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-emerald-700/35 hover:shadow-sm"
        >
          <span>
            <span className="block text-xs font-semibold text-foreground">
              Verify without paying
            </span>
            <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
              Card verification remains a free, separate workflow.
            </span>
          </span>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-emerald-800 transition group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>

      <aside className="mt-5 flex items-start gap-3 rounded-xl border border-amber-800/20 bg-amber-50/70 p-4">
        <ShieldAlert
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-900"
          aria-hidden="true"
        />
        <div>
          <p className="text-xs font-semibold text-amber-950">
            The older assessment endpoint is not RAS.
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-950/80">
            <code className="font-mono text-[10px]">POST /api/assess</code> is a
            deterministic keyword classifier over submitted text and claimed
            controls. It does not fetch the system, execute a GSPC bank, or
            issue this commission receipt. Its output must not substitute for a
            measurement or the workflow below.
          </p>
        </div>
      </aside>

      <div className="mt-6">
        <ToolRunner
          initialToolName={REQUEST_ATTESTATION_CONTRACT.tool}
          initialArguments={initialArguments}
        />
      </div>
    </section>
  );
}
