import {
  ArrowRight,
  ClipboardCheck,
  FileCheck2,
  ScanSearch,
  ShieldAlert,
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";
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

const JOB_CATALOG_ROUTE = "/api/x402";

type CatalogResource = {
  id?: string;
  resource?: string;
  deliverable?: string;
};

type CatalogTool = {
  name?: string;
  route?: string;
};

type JobCatalog = {
  rail?: {
    mode?: string;
    network?: string;
    asset?: { symbol?: string };
    amounts?: string;
  };
  resources?: CatalogResource[];
  free_forever?: string[];
  mcp?: { paid_tools?: CatalogTool[] };
};

export type ActualJob = {
  id: "verify" | "rwa" | "article50" | "provider-history" | "commission";
  title: string;
  state: string;
  outcome: string;
  href: string;
  action: string;
  payment: string;
};

function localHref(value: string): string | null {
  try {
    const url = new URL(value, "https://councilof.ai");
    if (url.origin !== "https://councilof.ai") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function article50Href(value: string): string | null {
  try {
    const url = new URL(value, "https://councilof.ai");
    if (url.origin !== "https://councilof.ai") return null;
    url.searchParams.set("obligation", "article-50");
    url.searchParams.set("bundle", "1");
    if (/[<>]/.test(url.searchParams.get("subject") || "")) {
      url.searchParams.delete("subject");
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

/**
 * Turn the live machine catalogue into the small set of jobs a person can
 * actually complete here. Missing catalogue entries disappear; the UI never
 * fills a gap with a guessed route, outcome, price or product.
 */
export function buildActualJobs(catalog: unknown): ActualJob[] {
  const body = (catalog || {}) as JobCatalog;
  const resources = Array.isArray(body.resources) ? body.resources : [];
  const free = Array.isArray(body.free_forever) ? body.free_forever : [];
  const paidTools = Array.isArray(body.mcp?.paid_tools)
    ? body.mcp!.paid_tools!
    : [];
  const resource = (id: string) => resources.find((entry) => entry.id === id);
  const tool = (name: string) => paidTools.find((entry) => entry.name === name);
  const paidDisclosure =
    body.rail?.asset?.symbol &&
    body.rail.network &&
    body.rail.mode &&
    body.rail.amounts
      ? `Pay-as-you-go x402 in ${body.rail.asset.symbol} on ${body.rail.network} · rail ${body.rail.mode} · ${body.rail.amounts}. Opening a route is not a charge; wallet authorisation and successful settlement are required.`
      : null;
  const jobs: ActualJob[] = [];

  const verify = free.find(
    (url) => localHref(url)?.split("?")[0] === "/gspc-verify",
  );
  if (verify) {
    jobs.push({
      id: "verify",
      title: "Verify existing evidence",
      state: "FREE",
      outcome:
        "Recompute a card's body hash and check its Ed25519 signature in your browser.",
      href: localHref(verify)!,
      action: "Open free verifier",
      payment: "Free forever. No wallet, account or purchase.",
    });
  }

  const rwa = resource("rwa_evidence");
  const rwaTool = tool("rwa_evidence");
  if (rwa?.deliverable && rwaTool?.route && paidDisclosure) {
    jobs.push({
      id: "rwa",
      title: "Retrieve RWA evidence",
      state: "EXISTING VERTICAL",
      outcome: rwa.deliverable,
      href: `/dashboard?tab=tools&tool=${encodeURIComponent(rwaTool.name!)}`,
      action: "Choose an XRPL asset",
      payment: paidDisclosure,
    });
  }

  const article50 = resource("evidence_bundle");
  const article50Route = article50?.resource
    ? article50Href(article50.resource)
    : null;
  if (article50?.deliverable && article50Route && paidDisclosure) {
    jobs.push({
      id: "article50",
      title: "Retrieve an Article 50 pack",
      state: "DEVELOPER API · EXISTING PACK",
      outcome:
        "An obligation-wide pack of existing Article 50 evidence. This link does not select or assess an individual model. Inspect the API challenge before authorising a purchase in your client.",
      href: article50Route,
      action: "Inspect Article 50 API",
      payment: paidDisclosure,
    });
  }

  const history = resource("provider_diff_feed");
  const historyRoute = history?.resource ? localHref(history.resource) : null;
  if (
    history?.deliverable &&
    historyRoute &&
    !/[<>]/.test(historyRoute) &&
    paidDisclosure
  ) {
    jobs.push({
      id: "provider-history",
      title: "Obtain provider change history",
      state: "DEVELOPER API · HISTORY",
      outcome: history.deliverable,
      href: historyRoute,
      action: "Inspect history API",
      payment: paidDisclosure,
    });
  }

  const commission = resource("issuance");
  const commissionTool = tool("commission_card");
  if (commission?.deliverable && commissionTool?.route && paidDisclosure) {
    jobs.push({
      id: "commission",
      title: "Request a scoped attestation",
      state: "COMMISSION",
      outcome: commission.deliverable,
      href: "#request-attestation-runner",
      action: "Name the subject and axis",
      payment: `${paidDisclosure} This commissions a receipt and re-serves evidence already on file; it does not trigger or promise an instant fresh measurement.`,
    });
  }

  return jobs;
}

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
    title: "Pay from the challenge",
    body: "If you choose to continue, the Pay button signs the exact accepts[] entry from that 402 in your wallet. This workspace never asks for a seed phrase or private key and never invents an amount.",
  },
  {
    number: "03",
    icon: FileCheck2,
    title: "Inspect the receipt, then verify",
    body: "Treat a receipt as delivered only when the response says DELIVERED. Treat it as signed only when the returned card actually carries a verifiable signature. Verify is free.",
  },
] as const;

export default function DashboardRequestPane() {
  const search = useSearch();
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const isPricingOverview = params.get("task") === "pricing-overview";
  const initialArguments = {
    ...(params.get("subject") ? { subject: params.get("subject")! } : {}),
    ...(params.get("axis") ? { axis: params.get("axis")! } : {}),
  };
  const [catalogState, setCatalogState] = useState<
    | { state: "loading" }
    | { state: "ready"; jobs: ActualJob[] }
    | { state: "unavailable" }
  >({ state: "loading" });

  useEffect(() => {
    let active = true;
    fetch(JOB_CATALOG_ROUTE, { headers: { accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((catalog) => {
        if (!active) return;
        const jobs = buildActualJobs(catalog);
        setCatalogState(
          jobs.length ? { state: "ready", jobs } : { state: "unavailable" },
        );
      })
      .catch(() => active && setCatalogState({ state: "unavailable" }));
    return () => {
      active = false;
    };
  }, []);
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
              {isPricingOverview
                ? "How the free rail works"
                : "Request a receipt. Never mistake it for a fresh measurement."}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-50/80">
              {isPricingOverview ? (
                <>
                  Verify is free forever. A grade is never sold. There are no
                  public prices and no SaaS tiers. Metered RAS work can re-serve
                  signed measurement cards already on file; payment never
                  creates a MEASURED cell. A fresh run remains{" "}
                  <strong className="text-white">UNMEASURED</strong> until a
                  published run actually exists.
                </>
              ) : (
                <>
                  RAS commissions one card-v0 receipt for a named subject on the
                  frozen bank. It can re-serve signed measurement cards already
                  on file; payment never creates a MEASURED cell. A fresh run
                  remains <strong className="text-white">UNMEASURED</strong>{" "}
                  until a published run actually exists.
                </>
              )}
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

      <section
        className="mt-5 rounded-2xl border border-border bg-card p-4 sm:p-5"
        aria-labelledby="actual-job-title"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
              Actual jobs · sourced from the live catalogue
            </p>
            <h2
              id="actual-job-title"
              className="mt-1 text-lg font-semibold text-foreground"
            >
              Choose the outcome you need.
            </h2>
          </div>
          <a
            href={JOB_CATALOG_ROUTE}
            className="font-mono text-[10px] text-muted-foreground underline underline-offset-2 hover:text-emerald-800"
          >
            GET {JOB_CATALOG_ROUTE}
          </a>
        </div>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Only jobs present in the current machine catalogue appear below. A
          conformance census or generic inspection is not a live purchase and is
          not presented as one.
        </p>

        {catalogState.state === "loading" ? (
          <p className="mt-4 text-xs text-muted-foreground" role="status">
            Reading the live job catalogue…
          </p>
        ) : catalogState.state === "unavailable" ? (
          <p
            className="mt-4 rounded-xl border border-amber-800/20 bg-amber-50/70 p-3 text-xs text-amber-950"
            role="status"
          >
            The live catalogue could not be read, so no paid job links are being
            guessed. Verification remains available above and below.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {catalogState.jobs.map((job) => (
              <li
                key={job.id}
                className="flex flex-col rounded-xl border border-border bg-background p-3.5"
              >
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-emerald-800">
                  {job.state}
                </p>
                <h3 className="mt-1.5 text-sm font-semibold text-foreground">
                  {job.title}
                </h3>
                <p className="mt-2 flex-1 text-[11px] leading-relaxed text-muted-foreground">
                  {job.outcome}
                </p>
                <p className="mt-3 border-t border-border pt-2.5 text-[10px] leading-relaxed text-muted-foreground">
                  {job.payment}
                </p>
                <a
                  href={job.href}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline"
                >
                  {job.action}{" "}
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

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

      <div className="mt-6" id="request-attestation-runner">
        <ToolRunner
          initialToolName={REQUEST_ATTESTATION_CONTRACT.tool}
          initialArguments={initialArguments}
        />
      </div>
    </section>
  );
}
