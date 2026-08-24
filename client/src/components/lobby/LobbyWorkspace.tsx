/**
 * LobbyWorkspace — OpenRouter-style centre: board / models / routes / tools / home / play / verify.
 *
 * Web pages never render here — they open in the site main column with footer visible.
 */
import MeasurementHub from "@/components/hub/MeasurementHub";
import type { LobbyTab, LobbyTabId } from "./tabs";
import LobbyHome from "./LobbyHome";
import LobbyPlay from "./LobbyPlay";
import LobbyVerifyPane from "./LobbyVerifyPane";
import LobbyToolPane from "./LobbyToolPane";
import LobbyEcosystemPane from "./LobbyEcosystemPane";
import LobbyWorkspacePane from "./LobbyWorkspacePane";
import LobbyFixPane from "./LobbyFixPane";
import LobbyArenaPane from "./LobbyArenaPane";
import LobbySurfacePane from "./LobbySurfacePane";

export type HubView = "board" | "models" | "routes";

export default function LobbyWorkspace({
  tab,
  hubView,
  onSelect,
  onOpenRoute,
}: {
  tab: LobbyTab;
  hubView: HubView;
  onSelect: (t: LobbyTab) => void;
  onOpenRoute: (path: string, label: string) => void;
}) {
  switch (tab.id) {
    case "home":
      return <LobbyHome onSelect={onSelect} onOpenRoute={onOpenRoute} />;
    case "play":
      return <LobbyPlay onOpenRoute={onOpenRoute} />;
    case "verify":
      return <LobbyVerifyPane />;
    case "tools":
      return <LobbyToolPane />;
    case "ecosystem":
      return <LobbyEcosystemPane onOpenRoute={onOpenRoute} />;
    case "workspace":
      return <LobbyWorkspacePane onOpenRoute={onOpenRoute} />;
    case "fix":
      return <LobbyFixPane onOpenRoute={onOpenRoute} />;
    case "arena":
      return <LobbyArenaPane onOpenRoute={onOpenRoute} />;
    case "measured":
    case "academy":
    case "watchdog":
    case "software":
    case "east-west":
    case "space":
      return (
        <LobbySurfacePane
          tab={tab}
          onOpenRoute={onOpenRoute}
          task={
            tab.id === "measured"
              ? "get-measured"
              : tab.id === "academy"
                ? "academy"
                : tab.id === "watchdog"
                  ? "report-an-incident"
                  : tab.id === "space"
                    ? "arena"
                    : tab.id === "east-west"
                      ? "east-west"
                    : undefined
          }
        />
      );
    case "board":
    case "models":
    case "routes":
      return <MeasurementHub compact initialTab={hubView} />;
    default:
      return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
          <p className="text-sm font-semibold text-slate-900">Council OS workspace</p>
          <p className="mt-2 max-w-sm text-xs text-slate-600">
            {tab.path
              ? `Reading ${tab.path} in the site column. Use chat below for AG-UI / grounded answers.`
              : tab.blurb}
          </p>
        </div>
      );
  }
}

export function hubViewForTab(id: LobbyTabId): HubView {
  if (id === "models") return "models";
  if (id === "routes") return "routes";
  return "board";
}
