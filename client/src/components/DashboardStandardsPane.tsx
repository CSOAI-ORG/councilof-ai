import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BookOpenCheck, Search } from "lucide-react";
import { FRAMEWORKS } from "@/data/frameworks";
import { JOINED_SPECS } from "@/data/joinedSpecs";
import { dashboardViewHref } from "@/lib/dashboardView";

const ADAPTERS = [
  {
    name: "OWASP Agentic",
    description: "Security-risk mapping for agentic applications. A mapping is not an OWASP endorsement or a GSPC score.",
    href: dashboardViewHref("/findings", "OWASP Agentic mapping"),
  },
  {
    name: "OWASP MCP",
    description: "MCP security and tool-boundary mapping. Catalogue coverage does not mean a server has been exercised.",
    href: "/dashboard?tab=tools",
  },
  {
    name: "Microsoft agent safety",
    description: "Agent-safety controls mapped as reference material; no legal or conformity verdict is implied.",
    href: dashboardViewHref("/crosswalk", "Microsoft agent safety mapping"),
  },
  {
    name: "SCITT",
    description: "Receipt and transparency-service bindings. Current registry state is printed below rather than promoted to a pass.",
    href: "/dashboard?tab=attestations",
  },
  {
    name: "C2PA",
    description: "Content-provenance adapter and Article 50 evidence path. It is separate from a GSPC measurement.",
    href: "/dashboard?tab=art50",
  },
] as const;

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
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">Council of AI · Standards Lab</p>
      <h1 id="standards-lab-title" className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Mappings stay separate from measurements.</h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Standards Lab binds published frameworks and external receipt formats to Council workflows. Every item here is <strong className="text-foreground">CATALOGUED</strong> unless a more specific reproduced or measured state is shown elsewhere. Nothing on this page is a legal verdict, certification, or GSPC score.
      </p>

      <section className="mt-7" aria-labelledby="named-adapters-title">
        <div className="flex items-center justify-between gap-3">
          <h2 id="named-adapters-title" className="text-sm font-semibold">Named adapters</h2>
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

      <section className="mt-8" aria-labelledby="bindings-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="bindings-title" className="text-sm font-semibold">Receipt and provenance bindings</h2>
            <p className="mt-1 text-xs text-muted-foreground">Directly from the joined-spec registry; registry state is preserved verbatim.</p>
          </div>
          <span className="text-xs text-muted-foreground">{JOINED_SPECS.length} bindings</span>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
          <div className="divide-y divide-border">
            {JOINED_SPECS.map((spec) => (
              <div key={`${spec.name}-${spec.kind}`} className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(9rem,0.7fr)_minmax(12rem,1fr)_auto] sm:items-center">
                <div>
                  <p className="text-sm font-medium text-foreground">{spec.name}</p>
                  <code className="text-[10px] text-muted-foreground">{spec.preimage_rule}</code>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{spec.wire}</p>
                <span className="w-fit rounded-full border border-border bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground">registry: {spec.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

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
