import {
  ArrowRight,
  ChevronDown,
  ClipboardCheck,
  FileCheck2,
  Mail,
  ScanSearch,
  ShieldAlert,
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useSearch } from "wouter";
import ToolRunner from "./ToolRunner";
import { BUYING_LINES, CONTACT_MAILBOX } from "@/lib/buying";
import ResultCard from "@/components/talk/ResultCard";
import { FRESH_RUN_DOCTRINE } from "@/lib/resultCard";
import { challengeOf, type Challenge } from "@/lib/aguiTalk";
import { callTool } from "@/lib/sovTools";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type TermsRead =
  | { state: "idle" }
  | { state: "reading" }
  | { state: "ok"; challenge: Challenge }
  | { state: "error"; text: string };

/**
 * A payment network in words. The challenge names it as a CAIP-2 id (eip155:8453) or a short
 * name (base); a stranger reads "Base". An id this table does not know is not shown on the card
 * face at all (it stays in the exact terms underneath), so no raw chain id reaches the face.
 */
const NETWORK_NAMES: Record<string, string> = {
  "eip155:8453": "Base",
  base: "Base",
  "eip155:84532": "Base Sepolia (a test network)",
  "base-sepolia": "Base Sepolia (a test network)",
  "eip155:1": "Ethereum",
  ethereum: "Ethereum",
  "eip155:137": "Polygon",
  polygon: "Polygon",
  solana: "Solana",
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": "Solana",
};

export function networkName(network: string | null | undefined): string | null {
  if (!network) return null;
  const key = network.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(NETWORK_NAMES, key) ? NETWORK_NAMES[key] : null;
}

/**
 * The plain card a stranger sees first: what a fresh run request is, what it buys, and that
 * nothing has been charged. "See the terms" asks commission_card on the MCP door WITHOUT a
 * payment: the tool fetches the same GET /api/request-attestation the page used to call, and
 * returns its 402 challenge (the terms) inside an ordinary 200 reply, so the browser does not log
 * a failed request (tools audit retest, 6 Oct 2026). Nothing is recorded or charged; this page
 * never pays. The card face names the network in words and states no amount: the exact terms
 * (network id, asset, amount in the challenge's own units) sit under "The exact terms".
 */
function FreshRunCard({ initialSubject }: { initialSubject: string }) {
  const [subject, setSubject] = useState(initialSubject);
  const [terms, setTerms] = useState<TermsRead>({ state: "idle" });
  const named = subject.trim();
  const readTerms = async () => {
    if (!named) return;
    setTerms({ state: "reading" });
    // No x_payment is ever passed from this page: the tool can only answer with its terms.
    const reply = await callTool(REQUEST_ATTESTATION_CONTRACT.tool, { subject: named.slice(0, 200) });
    const structured = reply.raw?.result?.structuredContent;
    const challenge = structured?.status === "PAYMENT_REQUIRED" ? challengeOf(structured) : null;
    setTerms(
      challenge
        ? { state: "ok", challenge }
        : { state: "error", text: "The terms could not be read just now. Nothing was charged; try again in a moment." },
    );
  };
  const first = terms.state === "ok" ? terms.challenge.accepts[0] : null;
  return (
    <ResultCard
      as="div"
      testId="fresh-run-card"
      title={named ? `A fresh run for ${named}` : "A fresh run"}
      tool={REQUEST_ATTESTATION_CONTRACT.tool}
      label={REQUEST_ATTESTATION_CONTRACT.requestState}
      tiles={[
        { key: "subject", label: "Subject", value: named || "Not named yet" },
        { key: "deliverable", label: "What you get", value: "Signed receipt", hint: "and a place in the queue" },
        { key: "charged", label: "Charged", value: "Nothing yet" },
      ]}
    >
      <div className="mt-4 space-y-3">
        <label className="block text-sm font-medium text-foreground" htmlFor="fresh-run-subject">
          What should we test? A model, or a server address
        </label>
        <input
          id="fresh-run-subject"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            setTerms({ state: "idle" });
          }}
          placeholder="e.g. qwen3:8b or example.com/mcp"
          autoComplete="off"
          spellCheck={false}
          maxLength={200}
          className={`min-h-11 w-full rounded-xl border border-border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground ${FOCUS}`}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={readTerms}
            disabled={!named || terms.state === "reading"}
            className={`inline-flex min-h-11 items-center rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50 dark:bg-emerald-600 ${FOCUS}`}
            data-testid="fresh-run-terms"
          >
            {terms.state === "reading" ? "Reading the terms…" : "See the terms (no payment)"}
          </button>
          <Link
            href="/dashboard"
            className={`inline-flex min-h-11 items-center text-sm font-semibold text-emerald-800 underline underline-offset-4 dark:text-emerald-300 ${FOCUS}`}
          >
            Check existing results (free)
          </Link>
        </div>
        {terms.state === "ok" ? (
          <div className="rounded-xl border border-amber-700/25 bg-amber-50/60 p-3 text-sm text-amber-950 dark:border-amber-400/30 dark:bg-amber-950/50 dark:text-amber-50" role="status" data-testid="fresh-run-terms-result">
            <p className="font-semibold">These are the terms. Nothing was charged.</p>
            <p className="mt-1" data-testid="fresh-run-terms-plain">
              If you go ahead, you pay from your own wallet{first?.symbol ? ` in ${first.symbol}` : ""}
              {networkName(first?.network) ? ` on ${networkName(first?.network)}` : ""}. Your wallet shows the exact amount before
              you approve it, and nothing is taken unless you do. This page never pays.
            </p>
            <details className="mt-2" data-testid="fresh-run-terms-exact">
              <summary className={`flex min-h-11 cursor-pointer items-center py-2 font-medium ${FOCUS}`}>The exact terms, as your wallet will see them</summary>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                {first?.network ? (
                  <>
                    <dt className="font-medium">Network</dt>
                    <dd className="break-all font-mono">{first.network}</dd>
                  </>
                ) : null}
                {first?.asset ? (
                  <>
                    <dt className="font-medium">Asset</dt>
                    <dd className="break-all font-mono">
                      {first.asset}
                      {first.symbol ? ` (${first.symbol})` : ""}
                    </dd>
                  </>
                ) : null}
                {first?.payTo ? (
                  <>
                    <dt className="font-medium">Pay to</dt>
                    <dd className="break-all font-mono">{first.payTo}</dd>
                  </>
                ) : null}
                {first?.amountAtomic ? (
                  <>
                    <dt className="font-medium">Amount</dt>
                    <dd className="break-all font-mono">{first.amountAtomic} (in the asset&apos;s smallest unit, as the terms state it)</dd>
                  </>
                ) : null}
              </dl>
              {terms.challenge.description ? <p className="mt-2 [overflow-wrap:anywhere]">{terms.challenge.description}</p> : null}
            </details>
          </div>
        ) : terms.state === "error" ? (
          <p className="text-sm text-rose-800 dark:text-rose-300" role="alert">
            {terms.text}
          </p>
        ) : null}
      </div>
    </ResultCard>
  );
}

export const REQUEST_ATTESTATION_CONTRACT = {
  tool: "commission_card",
  route: "/api/request-attestation",
  requestState: "PAYMENT_REQUIRED",
  deliveredState: "DELIVERED",
  freshRunState: "UNMEASURED",
  verifyRoute: "/dashboard?tab=verify",
} as const;

const JOB_CATALOG_ROUTE = "/api/x402";

/**
 * The invoice path for a fresh run, stated as it is: there is no invoice form or invoice endpoint
 * for commission_card (request-attestation has no `invoice=gbp` branch), and lib/buying.ts says
 * booking a fresh run is not live. So the only route is an email the reader sends to the one
 * mailbox (CONTACT_MAILBOX). The mailto link opens the reader's own mail app; nothing is sent or
 * recorded from here.
 */
export function invoiceMailto(subject: string | null): string {
  const what = subject ? `a fresh run for ${subject}` : "a fresh run";
  const body =
    `I would like to ask about ${what}, paid by invoice.\n\n` +
    `Model or subject: ${subject ?? ""}\n` +
    `Organisation (legal name):\n` +
    `Billing address:\n\n` +
    `(Written from councilof.ai. The site records nothing for this request: this email is the request.)`;
  return `mailto:${CONTACT_MAILBOX}?subject=${encodeURIComponent(`Invoice enquiry: ${what}`)}&body=${encodeURIComponent(body)}`;
}

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
      ? `Pay per run from your own wallet, in ${body.rail.asset.symbol} on ${body.rail.network} · ${body.rail.amounts}. Opening this is not a charge: you approve the payment in your wallet, and nothing is taken unless it goes through. Amounts are set per request in the payment challenge and can change; your wallet signs exactly the amount shown and nothing more.`
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
      action: "Open the machine terms (JSON)",
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
      action: "Open the machine terms (JSON)",
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
    title: "See the terms first",
    body: "Enter the model and press “Check terms · no payment”. You see the exact amount, what you would get, and a free preview of results already on file. Nothing is bought or delivered by looking.",
    hint: "Calls commission_card without x_payment: the route answers with its x402 402 challenge and a free preview.",
  },
  {
    number: "02",
    icon: WalletCards,
    title: "Pay, if you choose to",
    body: "“Review payment” asks your own wallet to approve exactly those terms. This page never asks for a seed phrase or private key, and never makes up an amount.",
    hint: "The Pay button signs the exact accepts[] entry from that 402 challenge in your wallet.",
  },
  {
    number: "03",
    icon: FileCheck2,
    title: "Keep the receipt, then check",
    body: "The reply carries your signed receipt. This browser does not save it for you yet, so copy its id: My results finds it by that id. A result counts only once it is published, and checking it is free.",
    hint: "Treat a receipt as delivered only when the response says DELIVERED, and as signed only when the returned card carries a verifiable signature.",
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
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
            Council of AI · Get results
          </p>
          <h1
            id="request-attestation-title"
            className="mt-2 text-3xl font-semibold tracking-tight"
          >
            {isPricingOverview ? "How the free rail works" : "Request a fresh run"}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-emerald-50/90" data-testid="fresh-run-doctrine">
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
              FRESH_RUN_DOCTRINE
            )}
          </p>
          <Link href="/dashboard/?tab=art50" data-testid="request-pane-art50" className="mt-4 flex w-fit text-sm font-semibold text-emerald-200 underline underline-offset-4 hover:text-white">
            Looking for an Article 50 marking check? Check an AI output for a mark →
          </Link>
          {/* The one buying statement (lib/buying.ts): what can be ordered today and how an invoice works. */}
          <details className="mt-4 max-w-2xl rounded-xl border border-white/15 bg-white/5 px-4 py-3" data-testid="request-pane-buying">
            <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-emerald-100">How to buy, and how invoices work</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-emerald-50/85">
              {BUYING_LINES.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </details>
        </div>
      </div>

      <div className="mt-5">
        <FreshRunCard initialSubject={params.get("subject") ?? ""} />
      </div>

      {!isPricingOverview ? (
        <section
          className="mt-5 grid gap-3 md:grid-cols-2"
          aria-label="Two ways to pay"
          data-testid="request-pay-ways"
        >
          <div
            className="rounded-2xl border border-border bg-card p-4"
            title="x402 v2: USDC on Base, signed in your own wallet."
          >
            <p className="flex items-center gap-2 text-base font-bold text-foreground">
              <WalletCards className="h-4 w-4 text-emerald-800" aria-hidden="true" />
              From your own wallet
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              “See the terms (no payment)” above shows the exact amount and
              who is paid. Nothing is paid until you approve it in your
              wallet; this page never pays.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4" data-testid="request-invoice">
            <p className="flex items-center gap-2 text-base font-bold text-foreground">
              <Mail className="h-4 w-4 text-emerald-800" aria-hidden="true" />
              By invoice, on request
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              There is no invoice form for a fresh run, and booking one by
              invoice is not live yet. You can ask by email: write to{" "}
              <span className="font-semibold text-foreground">{CONTACT_MAILBOX}</span>{" "}
              with the model and your organisation&apos;s legal name. This
              site records nothing for the request, and no amount is ever
              shown here.
            </p>
            <a
              href={invoiceMailto(params.get("subject"))}
              className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-emerald-800 underline underline-offset-4"
            >
              Write the email
            </a>
            <span className="ml-1 text-xs text-muted-foreground">
              (opens your mail app; nothing is sent from here)
            </span>
          </div>
        </section>
      ) : null}

      <details className="group mt-6 rounded-2xl border border-border bg-card" data-testid="fresh-run-developers">
        <summary className={`flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-sm font-semibold text-foreground ${FOCUS}`}>
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
          For developers: the contract, the job catalogue and the tool runner
        </summary>
        <div className="border-t border-border p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-5 rounded-xl border border-border bg-background p-4">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          RAS commissions one card-v0 receipt for a named subject on the
          frozen bank. It can re-serve signed measurement cards already on
          file; payment never creates a MEASURED cell. A fresh run remains{" "}
          <strong className="text-foreground">UNMEASURED</strong> until a
          published run actually exists.
        </p>
        <div className="rounded-xl border border-border bg-muted px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Canonical contract
          </p>
          <code className="mt-1 block text-xs text-foreground">
            {REQUEST_ATTESTATION_CONTRACT.tool}
          </code>
          <code className="mt-0.5 block text-xs text-muted-foreground">
            {REQUEST_ATTESTATION_CONTRACT.route}
          </code>
        </div>
      </div>


      <section
        className="mt-5 rounded-2xl border border-border bg-card p-4 sm:p-5"
        aria-labelledby="actual-job-title"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
              Other things you can get here · read from the live catalogue
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
              title={step.hint}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-mono text-[10px] font-bold text-muted-foreground">
                  {step.number}
                </span>
              </div>
              <h2 className="mt-3 text-base font-semibold text-foreground">
                {step.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
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

      <div className="mt-6 scroll-mt-4" id="request-attestation-runner">
        <h2 className="text-lg font-bold text-foreground">Check the terms for your fresh run</h2>
        <p className="mb-3 mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          This form uses the same public interface agents use, so it shows
          technical names. Fill in the model (subject) and press “Check terms ·
          no payment”: you see the amount and what you would get. Nothing is
          paid unless you then approve it in your wallet.
        </p>
        <ToolRunner
          initialToolName={REQUEST_ATTESTATION_CONTRACT.tool}
          initialArguments={initialArguments}
        />
      </div>
        </div>
      </details>
    </section>
  );
}
