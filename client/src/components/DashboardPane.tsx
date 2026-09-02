import type React from "react";
/** Council OS panes, rendered inside the Dashboard shell. Generated map: tab id -> native pane
 *  (Board, Verify) or the product page mounted in-shell. Unknown ids fall back to the board. */
import { lazy, Suspense } from "react";
const LobbyBoardPane = lazy(() => import("@/components/lobby/LobbyBoardPane"));
const HomeGspcBoard = lazy(() => import("@/components/home/HomeGspcBoard"));
const Page_Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const LobbyVerifyPane = lazy(() => import("@/components/lobby/LobbyVerifyPane"));
const Page_Benchmarks = lazy(() => import("@/pages/Benchmarks"));
const Page_ModelRegistry = lazy(() => import("@/pages/ModelRegistry"));
const Page_Products = lazy(() => import("@/pages/Products"));
const Page_Harness = lazy(() => import("@/pages/Harness"));
const Page_CouncilSpace = lazy(() => import("@/pages/CouncilSpace"));
const Page_IncidentReport = lazy(() => import("@/pages/IncidentReport"));
const Page_Honesty = lazy(() => import("@/pages/Honesty"));
const Page_Library = lazy(() => import("@/pages/Library"));

const PANES: Record<string, React.LazyExoticComponent<any>> = {
  board: HomeGspcBoard, // the living HF Space board + 22-axis strip, inside the shell (owner ruling 2 Sep)
  leaderboard: Page_Leaderboard, // the full model × axis table, in-shell
  terminal: LobbyBoardPane,
  verify: LobbyVerifyPane,
  results: Page_Benchmarks,
  models: Page_ModelRegistry,
  products: Page_Products,
  harness: Page_Harness,
  space: Page_CouncilSpace,
  watchdog: Page_IncidentReport,
  claimguard: Page_Honesty,
  library: Page_Library,
};

export default function DashboardPane({ id }: { id: string }) {
  const C = PANES[id] ?? LobbyBoardPane;
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading {id}…</div>}>
      <div data-testid={`dashboard-pane-${id}`}><C /></div>
    </Suspense>
  );
}
