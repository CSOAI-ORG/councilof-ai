/**
 * RoutesRankings — OpenRouter-style routing table (Eunomia instruments).
 */
import { useMemo, useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  allRouters,
  filterRouters,
  sortRouters,
  LAYER_META,
  ROUTER_STATS,
  type RouterLayer,
  type SortId,
} from "@/data/eunomia-router";
import { routerPath, openInstrumentInLobby } from "@/lib/instrument-routes";
import { openLobby } from "@/lib/lobbyLink";

const LAYERS: (RouterLayer | "all")[] = ["all", "framework", "regulation", "law", "benchmark", "compute"];

export default function RoutesRankings({ compact }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [layer, setLayer] = useState<RouterLayer | "all">("all");
  const [sort, setSort] = useState<SortId>("featured");

  const items = useMemo(() => {
    const all = allRouters();
    const filtered = filterRouters(all, { q: query, layer, capability: "all" });
    return sortRouters(filtered, sort);
  }, [query, layer, sort]);

  const shown = compact ? items.slice(0, 8) : items;

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${ROUTER_STATS.mcpServers}+ routes…`}
              className="pl-9"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="featured">Featured</option>
            <option value="name">Name</option>
            <option value="layer">Layer</option>
          </select>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500"
            onClick={() => openLobby({ task: "eunomia-router" })}
          >
            Open Council OS
          </Button>
        </div>
      )}

      {!compact && (
        <div className="flex flex-wrap gap-2">
          {LAYERS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLayer(l)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                layer === l
                  ? "bg-emerald-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {l === "all" ? "All layers" : LAYER_META[l].label}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[48rem] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="p-3">Route</th>
              <th className="p-3">Layer</th>
              <th className="p-3">Provider</th>
              <th className="p-3">Pricing</th>
              {!compact && <th className="p-3">Capabilities</th>}
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((item) => (
              <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate max-w-[16rem]">
                    {item.eunomiaUri}
                  </div>
                </td>
                <td className="p-3">
                  <Badge variant="outline" className="text-[10px]">
                    {LAYER_META[item.layer].label}
                  </Badge>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{item.provider}</td>
                <td className="p-3 text-xs uppercase">{item.pricing}</td>
                {!compact && (
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {item.capabilities.slice(0, 3).map((c) => (
                        <Badge key={c} variant="secondary" className="text-[9px]">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </td>
                )}
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-700"
                      onClick={() => openInstrumentInLobby(item)}
                    >
                      AG-UI
                    </Button>
                    {!compact && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={routerPath(item)}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!compact && (
        <p className="text-xs text-muted-foreground">
          {items.length} routes · governance routing table, not a model proxy. Layer-0 read paths are
          public — try any route in Council OS via AG-UI.
        </p>
      )}
    </div>
  );
}
