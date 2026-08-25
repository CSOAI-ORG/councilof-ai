import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ArrowRight,
  Layers,
  Scale,
  Gavel,
  BarChart3,
  Cpu,
  Route,
  ExternalLink,
} from "lucide-react";
import {
  allRouters,
  filterRouters,
  sortRouters,
  LAYER_META,
  ROUTER_STATS,
  EUNOMIA_EXAMPLE_ROUTE,
  KERNEL_ROUTERS,
  type RouterLayer,
  type SortId,
  CAPABILITY_LABELS,
  type RouterCapability,
} from "@/data/eunomia-router";
import { routerPath, openInstrumentInLobby } from "@/lib/instrument-routes";
import { StackHonestyBanner } from "@/components/StackHonestyBanner";
import { openLobby } from "@/lib/lobbyLink";
import CouncilOsPageShell from "@/components/os/CouncilOsPageShell";
import { POSITIONING, CTA_PRIMARY } from "@/lib/positioning";
import { BOND_MARKET_REPORTED_T } from "@/lib/stackHonesty";

const LAYER_ICONS: Record<RouterLayer, typeof Layers> = {
  framework: Layers,
  regulation: Scale,
  law: Gavel,
  benchmark: BarChart3,
  compute: Cpu,
};

const LAYERS: (RouterLayer | "all")[] = ["all", "framework", "regulation", "law", "benchmark", "compute"];

export default function InstrumentsCatalog() {
  useEffect(() => {
    document.title = `Eunomia Router — ${ROUTER_STATS.mcpServers}+ routing rules | Council of AI`;
  }, []);

  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const [query, setQuery] = useState(params.get("q") || "");
  const [layer, setLayer] = useState<RouterLayer | "all">(
    (params.get("layer") as RouterLayer) || "all",
  );
  const [sort, setSort] = useState<SortId>("featured");

  const items = useMemo(() => {
    const all = allRouters();
    const filtered = filterRouters(all, { q: query, layer, capability: "all" });
    return sortRouters(filtered, sort);
  }, [query, layer, sort]);

  return (
    <CouncilOsPageShell
      title="Routes"
      subtitle={POSITIONING.router.blurb}
      className="min-h-screen bg-[#04070d] text-slate-200"
    >
      {/* Hero */}
      <header className="border-b border-white/8 bg-[#080c14]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-emerald-400 text-xs uppercase tracking-[0.2em] mb-4">
            <Route className="h-4 w-4" />
            Eunomia Router
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            {POSITIONING.router.name} — route governance, not models
          </h1>
          <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-slate-400">
            {ROUTER_STATS.mcpServers} MCP servers · {ROUTER_STATS.hiveFrameworks} hive frameworks.{" "}
            {POSITIONING.router.blurb}{" "}
            Signed proof lives on GET /api/gspc.{" "}
            <Link href="/arena-harness" className="text-emerald-400 hover:underline">
              {POSITIONING.harness.cta} →
            </Link>
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {Object.entries(LAYER_META).map(([key, meta]) => {
              const Icon = LAYER_ICONS[key as RouterLayer];
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs"
                >
                  <Icon className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium text-white">{meta.label}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              className={CTA_PRIMARY}
              onClick={() => openLobby({ pane: "routes", task: "eunomia-router" })}
            >
              {POSITIONING.os.cta}
            </button>
            <Link href="/arena-harness" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-white/5">
              {POSITIONING.harness.cta}
            </Link>
            <Link href="/assess" className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-4 py-2.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-900/50">
              Get measured →
            </Link>
          </div>

          <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-950/30 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-amber-400/80 mb-1">Bond market venturi</p>
            <p className="text-sm text-slate-400">
              ${BOND_MARKET_REPORTED_T}T fixed income (REPORTED) · COBOL batch → A2A atomic settlement (SPEC).{" "}
              <Link href="/venturi">
                <a className="text-amber-300 hover:underline">Seven openings →</a>
              </Link>
              {" · "}
              <Link href="/engine-axis">
                <a className="text-amber-300 hover:underline">Engine axis →</a>
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <StackHonestyBanner showStats />
          </div>

          <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-950/30 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-emerald-400/80 mb-1">Example route</p>
            <code className="text-sm text-emerald-200 break-all">{EUNOMIA_EXAMPLE_ROUTE}</code>
            <p className="mt-2 text-xs text-slate-500">
              Returns: MCP pack · verified model · compliance proof · C2PA attestation · execution cost
            </p>
          </div>
        </div>
      </header>

      {/* Kernel routers */}
      <section className="border-b border-white/8 bg-[#0a0f18]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
            Five kernel layers — catalogued MCP fleet
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {KERNEL_ROUTERS.map((r) => (
              <Link key={r.id} href={routerPath(r)}>
                <a className="block h-full rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-emerald-500/40 hover:bg-white/8">
                  <Badge variant="outline" className="mb-2 text-[10px] border-white/20 text-slate-400">
                    {LAYER_META[r.layer].label}
                  </Badge>
                  <p className="font-semibold text-white text-sm">{r.name}</p>
                  <p className="mt-1 text-[11px] text-emerald-400/90 font-mono truncate">{r.eunomiaUri}</p>
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2">{r.blurb}</p>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Browse */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${allRouters().length} routing rules…`}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300"
          >
            <option value="featured">Featured</option>
            <option value="name">Name A–Z</option>
            <option value="layer">Layer</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {LAYERS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLayer(l)}
              className={
                `rounded-full px-3 py-1 text-xs font-medium transition ` +
                (layer === l
                  ? "bg-emerald-600 text-white"
                  : "border border-white/10 text-slate-400 hover:text-white")
              }
            >
              {l === "all" ? `All (${allRouters().length})` : LAYER_META[l].label}
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Showing {items.length} of {allRouters().length} routes · agent API at{" "}
          <a href="/api/instruments" className="text-emerald-400 hover:underline">
            GET /api/instruments
          </a>
        </p>

        <ul className="divide-y divide-white/8 rounded-xl border border-white/10 overflow-hidden">
          {items.slice(0, 200).map((r) => (
            <li key={r.id}>
              <Link href={routerPath(r)}>
                <a className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-4 hover:bg-white/5 transition">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">{r.name}</span>
                      <Badge variant="outline" className="text-[10px] border-white/15 text-slate-500">
                        {LAYER_META[r.layer].label}
                      </Badge>
                      {r.featured && (
                        <Badge className="text-[10px] bg-amber-500/20 text-amber-300 border-amber-500/30">
                          featured
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-emerald-400/80 mt-0.5 truncate">{r.eunomiaUri}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{r.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-600">{r.pricing}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 border-emerald-500/30 px-2 text-[10px] text-emerald-400 hover:bg-emerald-500/10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openInstrumentInLobby(r);
                      }}
                    >
                      Council OS
                    </Button>
                    <ArrowRight className="h-4 w-4 text-slate-600" />
                  </div>
                </a>
              </Link>
            </li>
          ))}
        </ul>

        {items.length > 200 && (
          <p className="mt-4 text-center text-xs text-slate-500">
            First 200 shown — narrow your search or use the API for the full index.
          </p>
        )}

        <div className="mt-12 grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 p-6">
            <h3 className="font-semibold text-white mb-2">Router layer vs measurement harness</h3>
            <ul className="text-xs text-slate-400 space-y-2">
              <li>• LLM routers (Stripe/OpenRouter): route models at scale — we do not compete here</li>
              <li>• {POSITIONING.router.name}: {ROUTER_STATS.mcpServers} governance MCP rules — SHIPPED</li>
              <li>• {POSITIONING.harness.short}: signed GSPC board + arena traces — MEASURED path</li>
              <li>• Token pricing vs signed trace + benchmark data (DESIGN revenue thesis)</li>
            </ul>
            <Link href="/arena-harness" className="mt-3 inline-block text-xs text-emerald-400 hover:underline">
              {POSITIONING.harness.cta} →
            </Link>
          </div>
          <div className="rounded-xl border border-white/10 p-6">
            <h3 className="font-semibold text-white mb-2">Try it in the Council Lobby</h3>
            <p className="text-xs text-slate-400 mb-4">
              Route a request through the live workspace — consent lock on every ask.
            </p>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() =>
                openLobby({
                  prompt:
                    "Route a logistics request through UK haulage compliance, care ethics probe, and agent identity verification — what does each layer return?",
                })
              }
            >
              Open playground
            </Button>
            <a
              href="https://github.com/CSOAI-ORG"
              target="_blank"
              rel="noreferrer"
              className="ml-3 inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
            >
              CSOAI-ORG <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </CouncilOsPageShell>
  );
}
