import { useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import {
  Archive,
  ArrowRight,
  Compass,
  Search,
  Wrench,
} from "lucide-react";
import { ROUTE_MANIFEST } from "@/data/route-manifest";
import {
  classify,
  hasForbiddenBrand,
  isPrimaryPath,
  libraryItems,
  prettifyTitle,
} from "@/data/library-ia";
import {
  LOBBY_ROUTES,
  LOBBY_TABS,
  dashboardNavGroupOf,
  type LobbyRouteGroup,
} from "@/components/lobby/tabs";
import DashboardEmbeddedView from "@/components/DashboardEmbeddedView";
import {
  dashboardViewFromSearch,
  dashboardViewHref,
  dashboardViewLabel,
  normalizeDashboardView,
} from "@/lib/dashboardView";

type CatalogueKind = "workflow" | "surface" | "library";

export type DashboardCatalogueEntry = {
  id: string;
  label: string;
  description: string;
  group: string;
  kind: CatalogueKind;
  href: string;
  path?: string;
  auth?: boolean;
};

const ROUTE_GROUP_LABELS: Record<LobbyRouteGroup, string> = {
  product: "Products",
  audience: "Audiences",
  record: "Evidence records",
  receipts: "Method and receipts",
  analyst: "Analyst tools",
};

const INTERNAL_ROUTE =
  /^\/(?:404|admin|login|signup|register|settings|api-keys|bulk-import|widget|old-home|home-v\d|landing|demo|os-demo)(?:\/|$)/;
const CANONICAL_ALIAS_PATHS = new Set([
  "/ag-ui",
  "/agui",
  "/arena-scoreboard",
  "/assess",
  "/assessment",
  "/chat",
  "/coliseum",
  "/console",
  "/council-os",
  "/enter",
  "/gspc-arena",
  "/csoai-law",
  "/meok-law",
  "/os",
  "/readiness-assessment",
  "/sov-os",
  "/standards",
  "/try",
]);

export function buildDashboardCatalogue(): DashboardCatalogueEntry[] {
  const entries: DashboardCatalogueEntry[] = [];
  const seen = new Set<string>();
  const seenHrefs = new Set<string>();
  const add = (entry: DashboardCatalogueEntry) => {
    const key = entry.path || entry.id;
    if (seen.has(key) || seenHrefs.has(entry.href)) return;
    seen.add(key);
    seenHrefs.add(entry.href);
    entries.push(entry);
  };

  for (const tab of LOBBY_TABS) {
    if (["home", "software", "explore"].includes(tab.id)) continue;
    add({
      id: `tab:${tab.id}`,
      label: tab.label,
      description: tab.blurb,
      group:
        dashboardNavGroupOf(tab.id)?.label ||
        (tab.id === "play" ? "Practice" : "Workspace tools"),
      kind: "workflow",
      href: `/dashboard?tab=${tab.id}`,
      path: tab.path || undefined,
      auth: tab.auth === "required",
    });
  }

  for (const route of LOBBY_ROUTES) {
    const href = route.path.startsWith("/dashboard?")
      ? route.path
      : dashboardViewHref(route.path, route.label);
    add({
      id: `route:${route.path}`,
      label: route.label,
      description: route.blurb,
      group: ROUTE_GROUP_LABELS[route.group],
      kind: "surface",
      href,
      path: route.path,
    });
  }

  // Primary pages not already owned by a workflow remain searchable without
  // becoming permanent sidebar clutter.
  for (const route of ROUTE_MANIFEST) {
    if (
      route.comp === "Redirect" ||
      CANONICAL_ALIAS_PATHS.has(route.path) ||
      !isPrimaryPath(route.path) ||
      INTERNAL_ROUTE.test(route.path)
    )
      continue;
    if (
      route.path.includes(":") ||
      hasForbiddenBrand(`${route.path} ${route.title}`) ||
      !normalizeDashboardView(route.path)
    )
      continue;
    const label = prettifyTitle(route.title) || route.path;
    add({
      id: `primary:${route.path}`,
      label,
      description: "Current published Council of AI surface.",
      group: classify(route.path, label).title,
      kind: "surface",
      href: dashboardViewHref(route.path, label),
      path: route.path,
    });
  }

  // Older useful pages are retained as a dated reference library, not mixed
  // into the active workflow labels.
  for (const route of libraryItems()) {
    if (
      CANONICAL_ALIAS_PATHS.has(route.path) ||
      INTERNAL_ROUTE.test(route.path) ||
      !normalizeDashboardView(route.path)
    )
      continue;
    add({
      id: `library:${route.path}`,
      label: route.title || route.path,
      description: "Dated reference surface retained in the Council library.",
      group: `Library · ${classify(route.path, route.title).title}`,
      kind: "library",
      href: dashboardViewHref(route.path, route.title),
      path: route.path,
    });
  }

  return entries;
}

const KIND_FILTERS: { id: "all" | CatalogueKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "workflow", label: "Workflows" },
  { id: "surface", label: "Current pages" },
  { id: "library", label: "Library" },
];

export default function DashboardCataloguePane() {
  const search = useSearch();
  const embeddedPath = dashboardViewFromSearch(search);
  const embeddedLabel =
    dashboardViewLabel(search) || embeddedPath || "Published surface";
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | CatalogueKind>("workflow");
  const catalogue = useMemo(buildDashboardCatalogue, []);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalogue.filter((entry) => {
      if (kind !== "all" && entry.kind !== kind) return false;
      if (!needle) return true;
      return `${entry.label} ${entry.description} ${entry.group} ${entry.path || ""}`
        .toLowerCase()
        .includes(needle);
    });
  }, [catalogue, kind, query]);
  const groups = useMemo(() => {
    const map = new Map<string, DashboardCatalogueEntry[]>();
    for (const entry of filtered)
      map.set(entry.group, [...(map.get(entry.group) || []), entry]);
    return [...map.entries()];
  }, [filtered]);

  if (embeddedPath)
    return <DashboardEmbeddedView path={embeddedPath} label={embeddedLabel} />;

  const counts = KIND_FILTERS.slice(1).map((filter) => ({
    ...filter,
    count: catalogue.filter((entry) => entry.kind === filter.id).length,
  }));

  return (
    <section
      className="mx-auto max-w-6xl px-5 py-7 sm:px-8"
      aria-labelledby="dashboard-catalogue-title"
    >
      <div className="rounded-2xl border border-emerald-900/10 bg-[linear-gradient(135deg,#04120c_0%,#073b2b_100%)] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
              Council of AI · master workspace
            </p>
            <h1
              id="dashboard-catalogue-title"
              className="mt-2 text-3xl font-semibold tracking-tight"
            >
              Everything useful. One door.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-emerald-50/80">
              Search working instruments, current pages, sectors and the dated
              library. Core workflows open natively; supporting pages stay in
              this centre pane so the composer and workspace history remain
              available.
            </p>
          </div>
          <Link
            href="/dashboard?tab=home"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#04120c] hover:bg-emerald-300"
          >
            Start a conversation{" "}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-2 text-center sm:max-w-2xl sm:grid-cols-3">
          {counts.map(({ id, label, count }) => (
            <div
              key={id}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            >
              <dt className="text-[10px] uppercase tracking-wider text-emerald-100/65">
                {label}
              </dt>
              <dd className="mt-0.5 text-xl font-semibold">{count}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="sticky top-0 z-10 -mx-2 mt-5 border-b border-border bg-background/95 px-2 pb-4 pt-2 backdrop-blur">
        <label className="relative block">
          <span className="sr-only">
            Search every Council workspace destination
          </span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools, evidence, standards, sectors…"
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
          />
        </label>
        <div
          className="mt-2 flex flex-wrap gap-1.5"
          aria-label="Filter catalogue"
        >
          {KIND_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={kind === filter.id}
              onClick={() => setKind(filter.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${kind === filter.id ? "border-[#04624a] bg-[#04624a] text-white" : "border-border bg-card text-muted-foreground hover:border-emerald-700/40 hover:text-foreground"}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {groups.length ? (
        <div className="mt-5 space-y-8">
          {groups.map(([group, entries]) => (
            <section
              key={group}
              aria-labelledby={`catalogue-${group.replace(/\W+/g, "-").toLowerCase()}`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2
                  id={`catalogue-${group.replace(/\W+/g, "-").toLowerCase()}`}
                  className="text-sm font-semibold text-foreground"
                >
                  {group}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {entries.length}
                </span>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {entries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={entry.href}
                    className="group flex min-h-28 items-start gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-emerald-700/35 hover:shadow-sm"
                  >
                    <span className="mt-0.5 rounded-lg bg-emerald-50 p-2 text-emerald-800">
                      {entry.kind === "workflow" ? (
                        <Wrench className="h-4 w-4" />
                      ) : entry.kind === "library" ? (
                        <Archive className="h-4 w-4" />
                      ) : (
                        <Compass className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <strong className="text-sm text-foreground">
                          {entry.label}
                        </strong>
                        <ArrowRight
                          className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-emerald-700"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                        {entry.description}
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                        <span>
                          {entry.kind === "workflow"
                            ? "Workspace"
                            : entry.kind === "library"
                              ? "Reference"
                              : "In-frame page"}
                        </span>
                        {entry.auth ? (
                          <span className="text-amber-800">
                            Account required
                          </span>
                        ) : null}
                        {entry.path ? (
                          <code className="normal-case tracking-normal text-muted-foreground">
                            {entry.path}
                          </code>
                        ) : null}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div
          role="status"
          className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground"
        >
          No Council destination matches “{query}”.
        </div>
      )}
    </section>
  );
}
