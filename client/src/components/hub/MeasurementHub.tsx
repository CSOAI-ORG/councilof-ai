/**
 * MeasurementHub — OpenRouter-style board / models / routes in Council software.
 */
import { useEffect, useState } from "react";
import { BarChart3, Cpu, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import LiveLeaderboard from "@/components/board/LiveLeaderboard";
import ModelsRankings from "./ModelsRankings";
import RoutesRankings from "./RoutesRankings";
import { openLobby } from "@/lib/lobbyLink";

type Tab = "board" | "models" | "routes";

const TABS: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
  { id: "board", label: "Live board", icon: BarChart3 },
  { id: "models", label: "Models", icon: Cpu },
  { id: "routes", label: "Routes", icon: Route },
];

export default function MeasurementHub({
  compact,
  initialTab = "board",
}: {
  compact?: boolean;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/30 p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  tab === t.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-500"
          onClick={() => openLobby({ pane: tab === "routes" ? "routes" : tab === "models" ? "models" : "board", task: tab === "routes" ? "eunomia-router" : "read-the-board" })}
        >
          Open Council OS
        </Button>
      </div>

      {tab === "board" && (
        compact ? (
          <LiveLeaderboard showHumanPanel={false} heading="GSPC board" className="!px-0" />
        ) : (
          <LiveLeaderboard showHumanPanel heading="GSPC board" className="!px-0" />
        )
      )}
      {tab === "models" && <ModelsRankings compact={compact} />}
      {tab === "routes" && <RoutesRankings compact={compact} />}
    </div>
  );
}
