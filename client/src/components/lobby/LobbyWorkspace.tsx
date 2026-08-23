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
