import { useId, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { dashboardViewHref } from "@/lib/dashboardView";

export const INDUSTRY_WORKFLOWS = [
  {
    id: "enterprise",
    label: "Enterprises",
    title: "Build an evidence trail for the AI you use.",
    description:
      "Start with your system, its intended use and jurisdiction. Keep what is measured separate from what still needs review.",
    limitation:
      "Scoping and evidence tools are available. Automatic deployment fixes and a legal compliance verdict are not.",
    prompt:
      "Help me scope the evidence for AI used in my enterprise. Ask about the system, intended use, jurisdiction and existing evidence before proposing checks.",
    steps: [
      {
        label: "Scope the request",
        kind: "Request form",
        href: "/dashboard?tab=measured",
      },
      {
        label: "Inspect the GPAI evidence",
        kind: "Evidence view",
        href: "/dashboard?tab=evidence",
      },
      {
        label: "Review marking evidence",
        kind: "Article 50 tool",
        href: "/dashboard?tab=art50",
      },
    ],
  },
  {
    id: "builders",
    label: "Model builders",
    title: "Follow a model from its identity to its evidence.",
    description:
      "Inspect model records, the measurement harness and published results. Pin the exact revision before comparing runs.",
    limitation:
      "Published records do not mean your own model has been run. A new run requires an available executor and an admitted result.",
    prompt:
      "Help me plan an evaluation of my model or agent harness. First establish the exact version, tools, evaluation scope and available published evidence.",
    steps: [
      {
        label: "Find the model",
        kind: "Model records",
        href: "/dashboard?tab=models",
      },
      {
        label: "Inspect the harness",
        kind: "Harness guide",
        href: "/dashboard?tab=harness",
      },
      {
        label: "Compare the evidence",
        kind: "GSPC table",
        href: "/dashboard?tab=board",
      },
    ],
  },
  {
    id: "insurers",
    label: "Insurers",
    title: "See the evidence behind an AI exposure.",
    description:
      "Separate measured results, missing evidence and third-party claims. Use the source and denominator, not a single blended rating.",
    limitation:
      "This is evidence support, not an underwriting decision, premium calculation or coverage recommendation.",
    prompt:
      "Help me inspect evidence for an AI insurance exposure. Separate measured facts, third-party claims and missing evidence. Do not infer a premium or coverage decision.",
    steps: [
      {
        label: "Open the insurer guide",
        kind: "Industry guide",
        href: dashboardViewHref("/insurers", "Insurance evidence"),
      },
      {
        label: "Read specialist registers",
        kind: "Published records",
        href: dashboardViewHref("/registers", "Specialist registers"),
      },
      {
        label: "Verify a supplied card",
        kind: "Browser verifier",
        href: "/dashboard?tab=verify",
      },
    ],
  },
  {
    id: "regulators",
    label: "Regulators",
    title: "Inspect the claim. Keep the authority with you.",
    description:
      "Review source-linked standards, inspect evidence and check signatures. Trace what supports a finding and what remains unknown.",
    limitation:
      "Mappings are research aids, not legal conclusions. No report is represented as filed with an authority by opening these tools.",
    prompt:
      "Help me review an AI claim as a regulator or assessor. Establish jurisdiction and scope, identify primary sources, and distinguish an observation from a legal conclusion.",
    steps: [
      {
        label: "Explore standards",
        kind: "Source-linked lab",
        href: "/dashboard?tab=standards",
      },
      {
        label: "Read watchdog evidence",
        kind: "Read-only records",
        href: "/dashboard?tab=watchdog",
      },
      {
        label: "Check the attestation",
        kind: "Evidence and witnesses",
        href: "/dashboard?tab=attestations",
      },
    ],
  },
  {
    id: "assets",
    label: "Bonds & ledgers",
    title: "Start with the instrument, not the ticker.",
    description:
      "Resolve issuer, chain, contract or ledger account before reading evidence. A reused symbol is not an authenticated identity.",
    limitation:
      "The RWA tool prepares evidence requests. It does not issue a bond, move funds, prove reserves or approve a smart contract.",
    prompt:
      "Help me inspect a tokenised bond, contract or ledger asset. Ask for its chain, issuer and exact address, then distinguish public observations from verified identity and legal status.",
    steps: [
      {
        label: "Read the instrument register",
        kind: "Published records",
        href: dashboardViewHref("/registers", "Instrument registers"),
      },
      {
        label: "Open the RWA tool",
        kind: "Metered tool form",
        href: "/dashboard?tab=tools&tool=rwa_evidence",
      },
      {
        label: "Inspect the public root",
        kind: "Free tool form",
        href: "/dashboard?tab=tools&tool=get_root",
      },
    ],
  },
  {
    id: "legacy",
    label: "COBOL & legacy",
    title: "Bring the mainframe evidence into the conversation.",
    description:
      "Start with a redacted copybook, record schema and transformation requirements. Map the evidence needed before a connector touches your estate.",
    limitation:
      "The legacy on-ramp is a guide. There is no live mainframe connection or automatic COBOL rewrite in this workspace.",
    prompt:
      "Help me scope a COBOL or legacy-system evidence workflow. Start with a redacted schema, data ownership and read-only boundaries. Do not assume a live connector is available.",
    steps: [
      {
        label: "Explore the legacy on-ramp",
        kind: "Integration guide",
        href: dashboardViewHref("/cobolbridge", "COBOL and legacy"),
      },
      {
        label: "Inspect specialist evidence",
        kind: "Published registers",
        href: dashboardViewHref("/registers", "Specialist registers"),
      },
      {
        label: "Define the request",
        kind: "Scope form",
        href: "/dashboard?tab=measured",
      },
    ],
  },
  {
    id: "public",
    label: "Everyone",
    title: "Make an AI claim easier to understand.",
    description:
      "Check a card, read public evidence or practise deciding when an AI system needs human oversight. No technical background needed.",
    limitation:
      "Practice stays local. Watchdog is read-only today; this workspace does not claim to submit a complaint on your behalf.",
    prompt:
      "Help me understand a problem I have encountered with AI. Ask what happened without requesting personal or sensitive details, explain the evidence and available next steps.",
    steps: [
      {
        label: "Check a card",
        kind: "Free browser verifier",
        href: "/dashboard?tab=verify",
      },
      {
        label: "Read public evidence",
        kind: "Watchdog records",
        href: "/dashboard?tab=watchdog",
      },
      {
        label: "Practise a decision",
        kind: "Local practice",
        href: "/dashboard?tab=play&game=boss-chair",
      },
    ],
  },
] as const;

export default function IndustryWorkflows() {
  const [selected, setSelected] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const workflow = INDUSTRY_WORKFLOWS[selected];
  return (
    <section aria-labelledby={`${id}-heading`}>
      <p className="font-mono text-[11px] uppercase tracking-[.18em] text-emerald-800">
        Tools for your world
      </p>
      <h2
        id={`${id}-heading`}
        className="mt-3 text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl"
      >
        What brings you to the Council?
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
        Choose your role to see a useful starting path. Each step says whether
        it is a working tool, evidence view or integration guide.
      </p>
      <div
        role="tablist"
        aria-label="Choose your role"
        className="mt-7 flex flex-wrap gap-2"
      >
        {INDUSTRY_WORKFLOWS.map((item, index) => (
          <button
            type="button"
            role="tab"
            key={item.id}
            id={`${id}-tab-${item.id}`}
            aria-selected={selected === index}
            aria-controls={`${id}-panel`}
            tabIndex={selected === index ? 0 : -1}
            ref={(element) => {
              tabs.current[index] = element;
            }}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => {
              let target: number | undefined;
              if (event.key === "ArrowRight")
                target = (index + 1) % INDUSTRY_WORKFLOWS.length;
              if (event.key === "ArrowLeft")
                target =
                  (index - 1 + INDUSTRY_WORKFLOWS.length) %
                  INDUSTRY_WORKFLOWS.length;
              if (event.key === "Home") target = 0;
              if (event.key === "End") target = INDUSTRY_WORKFLOWS.length - 1;
              if (target !== undefined) {
                event.preventDefault();
                setSelected(target);
                tabs.current[target]?.focus();
              }
            }}
            className={`rounded-full border px-4 py-2.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${selected === index ? "border-emerald-900 bg-emerald-900 text-white" : "border-emerald-900/15 bg-white text-slate-700 hover:border-emerald-700"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${workflow.id}`}
        tabIndex={0}
        className="mt-5 rounded-2xl border border-emerald-900/10 bg-white p-5 sm:p-8"
      >
        <h3 className="max-w-2xl text-2xl font-medium tracking-tight text-slate-900">
          {workflow.title}
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          {workflow.description}
        </p>
        <ol className="mt-6 grid gap-3 lg:grid-cols-3">
          {workflow.steps.map((step, index) => (
            <li key={step.href}>
              <Link
                href={step.href}
                className="flex h-full gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-700 hover:bg-emerald-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700"
              >
                <span className="font-mono text-xs text-emerald-800">
                  0{index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">
                    {step.label}
                  </span>
                  <span className="mt-2 block text-xs text-slate-600">
                    {step.kind}
                  </span>
                </span>
                <ArrowUpRight
                  size={16}
                  className="shrink-0 text-emerald-800"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ol>
        <p className="mt-5 max-w-3xl text-xs leading-relaxed text-slate-600">
          {workflow.limitation}
        </p>
        <Link
          href={`/dashboard?tab=home&ask=${encodeURIComponent(workflow.prompt)}`}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:underline"
        >
          Start with the Council <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <p className="mt-1 text-[11px] text-slate-500">
          Opens a prepared question. You review it before sending.
        </p>
      </div>
    </section>
  );
}
