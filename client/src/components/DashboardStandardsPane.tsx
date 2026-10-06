import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BookOpenCheck, Search } from "lucide-react";
import { FRAMEWORKS } from "@/data/frameworks";
import { dashboardViewHref } from "@/lib/dashboardView";

// One plain sentence each. The technical receipt-format registry (data/joinedSpecs.ts) is a
// developer reference and lives on its own page, not in this end-user pane.
const ADAPTERS = [
  {
    name: "OWASP Agentic",
    description: "A security checklist for AI agents. We map our tests to it; this is not an OWASP endorsement.",
    href: dashboardViewHref("/findings", "OWASP Agentic mapping"),
  },
  {
    name: "OWASP MCP",
    description: "A security checklist for the tool servers AI agents call. Being listed does not mean a server was tested.",
    href: "/dashboard?tab=tools",
  },
  {
    name: "Microsoft agent safety",
    description: "Microsoft's list of agent-safety controls, kept as a reference. It is not a legal or compliance verdict.",
    href: dashboardViewHref("/crosswalk", "Microsoft agent safety mapping"),
  },
  {
    name: "SCITT",
    description: "A standard format for public, tamper-evident receipts. We show where ours fit; nothing here is a pass.",
    href: "/dashboard?tab=attestations",
  },
  {
    name: "C2PA",
    description: "The standard for labelling AI-made images and media. We use it for AI-content marking evidence, separate from our test results.",
    href: "/dashboard?tab=art50",
  },
] as const;

/** Developer page that lists the receipt and provenance formats (JoinedSpecsFooter renders them). */
const RECEIPT_FORMATS_HREF = "/embed#joined-specs-title";

export default function DashboardStandardsPane() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return FRAMEWORKS;
    return FRAMEWORKS.filter((framework) =>
      `${framework.name} ${framework.region} ${framework.phaseLabel} ${framework.description} ${framework.cite}`
        .toLowerCase()
        .includes(needle),
    );
  }, [query]);

  return (
    <section className="mx-auto max-w-6xl px-5 py-7 sm:px-8" aria-labelledby="standards-lab-title">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">Council of AI · Standards</p>
      <h1 id="standards-lab-title" className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Standards we map our tests to</h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        How our tests line up with published standards and checklists. A mapping is not a test result, a legal verdict or a
        certification; every item here is listed (<span title="CATALOGUED: listed and mapped, not measured">catalogued</span>), not measured.
      </p>

      <section className="mt-7" aria-labelledby="named-adapters-title">
        <div className="flex items-center justify-between gap-3">
          <h2 id="named-adapters-title" className="text-sm font-semibold">Standards and checklists</h2>
          <span className="rounded-full border border-border bg-card px-2 py-1 text-[10px] font-semibold text-muted-foreground">CATALOGUED</span>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {ADAPTERS.map((adapter) => (
            <Link key={adapter.name} href={adapter.href} className="group rounded-xl border border-border bg-card p-4 transition hover:border-emerald-700/35 hover:shadow-sm">
              <span className="flex items-start justify-between gap-3">
                <strong className="text-sm text-foreground">{adapter.name}</strong>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-emerald-700" aria-hidden="true" />
              </span>
              <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">{adapter.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-4 text-sm">
        <a
          href={RECEIPT_FORMATS_HREF}
          className="inline-flex min-h-11 items-center font-semibold text-emerald-800 underline underline-offset-2"
          data-testid="standards-receipt-formats"
        >
          Technical: receipt formats
        </a>
      </p>

      <section className="mt-8" aria-labelledby="framework-library-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="framework-library-title" className="text-sm font-semibold">Framework library</h2>
            <p className="mt-1 text-xs text-muted-foreground">Reference pages open inside the centre workspace.</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search frameworks…"
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {filtered.map((framework) => (
            <Link
              key={framework.slug}
              href={dashboardViewHref(`/frameworks/${framework.slug}`, framework.name)}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-emerald-700/35 hover:shadow-sm"
            >
              <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <strong className="text-sm text-foreground">{framework.name}</strong>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">CATALOGUED</span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{framework.region} · {framework.phaseLabel} · {framework.description}</span>
              </span>
            </Link>
          ))}
        </div>
        {!filtered.length ? <p role="status" className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No framework matches “{query}”.</p> : null}
      </section>
    </section>
  );
}
