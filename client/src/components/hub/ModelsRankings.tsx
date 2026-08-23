/**
 * ModelsRankings — OpenRouter-style model table derived from GET /api/gspc.
 *
 * Each row is a model that appears as a leader on at least one axis.
 * Separated leads count only when separation === SEPARATED — ties are not wins.
 */
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  hasFigure,
  orderedRows,
  pct,
  useGspcBoard,
  type GspcAxis,
} from "@/components/board/useGspcBoard";
import StatusChip, { chipFor } from "@/components/board/StatusChip";
import { openLobby } from "@/lib/lobbyLink";

type ModelRow = {
  name: string;
  separated: number;
  ties: number;
  pointLeads: number;
  bestAxis: string;
  bestAccuracy: number;
};

function aggregateModels(axes: GspcAxis[]): ModelRow[] {
  const map = new Map<string, ModelRow>();

  for (const a of axes) {
    if (!a.leader?.trim()) continue;
    const key = a.leader.trim();
    const row = map.get(key) ?? {
      name: key,
      separated: 0,
      ties: 0,
      pointLeads: 0,
      bestAxis: "",
      bestAccuracy: 0,
    };

    if (hasFigure(a)) {
      row.pointLeads += 1;
      if (a.separation === "SEPARATED") row.separated += 1;
      if (a.separation === "TIE") row.ties += 1;
      if ((a.accuracy as number) > row.bestAccuracy) {
        row.bestAccuracy = a.accuracy as number;
        row.bestAxis = a.axis;
      }
    }

    map.set(key, row);
  }

  return [...map.values()].sort((x, y) => {
    if (y.separated !== x.separated) return y.separated - x.separated;
    if (y.pointLeads !== x.pointLeads) return y.pointLeads - x.pointLeads;
    return y.bestAccuracy - x.bestAccuracy;
  });
}

export default function ModelsRankings({ compact }: { compact?: boolean }) {
  const { data, error, loading } = useGspcBoard();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const all = aggregateModels(orderedRows(data));
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((r) => r.name.toLowerCase().includes(q));
  }, [data, query]);

  const shown = compact ? rows.slice(0, 8) : rows;

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter models…"
              className="pl-9"
            />
          </div>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500"
            onClick={() => openLobby({ pane: "board", task: "human-vs-ai" })}
          >
            Open Council OS
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">
          Could not read /api/gspc — {error}. No figures shown.
        </p>
      )}

      {loading && !error && (
        <div className="space-y-2">
          {Array.from({ length: compact ? 4 : 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {data && !error && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[42rem] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="p-3">#</th>
                <th className="p-3">Model</th>
                <th className="p-3">Separated leads</th>
                <th className="p-3">Ties</th>
                <th className="p-3">Point leads</th>
                <th className="p-3">Best axis</th>
                {!compact && <th className="p-3 text-right">Try</th>}
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={r.name} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-mono text-muted-foreground">{i + 1}</td>
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3">
                    <span className="font-mono font-semibold text-emerald-700">{r.separated}</span>
                  </td>
                  <td className="p-3 font-mono text-amber-700">{r.ties}</td>
                  <td className="p-3 font-mono">{r.pointLeads}</td>
                  <td className="p-3">
                    <span className="text-xs text-muted-foreground">{r.bestAxis}</span>
                    {r.bestAccuracy > 0 && (
                      <span className="ml-2 font-mono text-xs">{pct(r.bestAccuracy)}</span>
                    )}
                  </td>
                  {!compact && (
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-700"
                        onClick={() =>
                          openLobby({
                            pane: "models",
                            prompt: `What is published about ${r.name} on the GSPC board — separated leads, ties, and empty cells?`,
                            ctx: r.name,
                          })
                        }
                      >
                        Try
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Separated leads are McNemar p&lt;0.05. Ties are point-estimate leads that are statistically
        indistinguishable — never counted as wins. All figures from GET /api/gspc.
      </p>
    </div>
  );
}

/** Compact axis leaders strip for dashboard overview. */
export function AxisLeadersStrip() {
  const { data, loading } = useGspcBoard();
  const axes = orderedRows(data).filter(hasFigure).slice(0, 6);

  if (loading) return <div className="h-24 animate-pulse rounded-lg bg-muted" />;
  if (!axes.length) return null;

  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {axes.map((a) => (
        <li
          key={a.axis}
          className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <span className="truncate font-medium">{a.axis}</span>
          <span className="flex items-center gap-2 shrink-0">
            <StatusChip kind={chipFor(a.status, a.separation)} />
            <span className="font-mono text-xs">{pct(a.accuracy as number)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
