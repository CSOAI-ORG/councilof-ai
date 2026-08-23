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
    <div className="min-h-screen bg-[#04070d] text-slate-200">
      <header className="border-b border-white/8 bg-[#080c14]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-emerald-400 text-xs uppercase tracking-[0.2em] mb-4">
            <Route className="h-4 w-4" />
            Eunomia Router
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            The OpenRouter of governance
          </h1>
          <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-slate-400">
            {ROUTER_STATS.mcpServers} MCP servers · {ROUTER_STATS.hiveFrameworks} hive frameworks. Not compliance tools — routing table entries.
            Each rule says: when intent X arrives, verify Y, route through Z, attest W, bill V.
          </p>
          <div className="mt-6">
            <StackHonestyBanner showStats />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-xs text-slate-500 mb-4">
          Showing {items.length} of {allRouters().length} routes
        </p>
        <ul className="divide-y divide-white/8 rounded-xl border border-white/10 overflow-hidden">
          {items.slice(0, 200).map((r) => (
            <li key={r.id}>
              <Link href={routerPath(r)}>
                <a className="flex px-4 py-4 hover:bg-white/5 transition">
                  <span className="font-medium text-white">{r.name}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
