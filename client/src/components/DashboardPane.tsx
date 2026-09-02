import type React from "react";
/** Council OS panes, rendered inside the Dashboard shell. Generated map: tab id -> native pane
 *  (Board, Verify) or the product page mounted in-shell. Unknown ids fall back to the board.
 *
 *  Each tab in LOBBY_TABS (client/src/components/lobby/tabs.ts) MUST have a pane here
 *  unless it is intentionally `kind: "local"` (rendered by LobbyHome as the desktop —
 *  `home`, `play`) or `kind: "route"` with a real path that frames a page (those
 *  open the standalone URL when clicked). Falling back to LobbyBoardPane for any
 *  rail tab is the duplicate the OS audit flagged. */
import { lazy, Suspense } from "react";
const LobbyBoardPane = lazy(() => import("@/components/lobby/LobbyBoardPane"));
const HomeGspcBoard = lazy(() => import("@/components/home/HomeGspcBoard"));
const LobbyMatrixPane = lazy(() => import("@/components/lobby/LobbyMatrixPane"));
const Page_Benchmarks = lazy(() => import("@/pages/Benchmarks"));
const Page_ModelRegistry = lazy(() => import("@/pages/ModelRegistry"));
const Page_Tools = lazy(() => import("@/pages/ToolsPage"));
const LobbyVerifyPane = lazy(() => import("@/components/lobby/LobbyVerifyPane"));
const LobbyCardsPane = lazy(() => import("@/components/lobby/LobbyCardsPane"));
const DashboardStatePane = lazy(() => import("@/components/DashboardStatePane"));
const LobbyEvidencePane = lazy(() => import("@/components/lobby/LobbyEvidencePane"));
const LobbyEmbedPane = lazy(() => import("@/components/lobby/LobbyEmbedPane"));
const Page_Products = lazy(() => import("@/pages/Products"));
const Page_Harness = lazy(() => import("@/pages/Harness"));
const Page_CouncilSpace = lazy(() => import("@/pages/CouncilSpace"));
const Page_Assess = lazy(() => import("@/pages/AssessTool"));
const Page_IncidentReport = lazy(() => import("@/pages/IncidentReport"));
const Page_Honesty = lazy(() => import("@/pages/Honesty"));
const Page_Library = lazy(() => import("@/pages/Library"));
const Page_Workbench = lazy(() => import("@/pages/Workbench"));
const LobbyPlay = lazy(() => import("@/components/lobby/LobbyPlay"));
const LobbyArt50Pane = lazy(() => import("@/components/lobby/LobbyArt50Pane"));

const PANES: Record<string, React.LazyExoticComponent<any>> = {
  // home: LobbyHome is rendered by the layout (local kind) — no pane needed.
  board: HomeGspcBoard, // the living HF Space board + 22-axis strip, inside the shell (owner ruling 2 Sep)
  matrix: LobbyMatrixPane, // industry × regulation grid, native
  results: Page_Benchmarks,
  models: Page_ModelRegistry,
  tools: Page_Tools,
  verify: LobbyVerifyPane,
  cards: LobbyCardsPane, // signed-cards browser, native
  state: DashboardStatePane, // tapes beside the board: estate doors + XRPL reader (#1099)
  evidence: LobbyEvidencePane, // GPAI evidence pack, native
  embed: LobbyEmbedPane, // white-label badge / self-verifying card, native
  products: Page_Products,
  harness: Page_Harness,
  space: Page_CouncilSpace,
  measured: Page_Assess, // /assess, the assessment itself
  watchdog: Page_IncidentReport,
  claimguard: Page_Honesty,
  library: Page_Library,
  workbench: Page_Workbench, // auth-required (the layout shows the auth flag)
  // software: signed-in dashboard at /dashboard, the layout redirects there
  play: LobbyPlay, // gold local-play gallery (local kind)
  art50: LobbyArt50Pane, // Article 50 marking evidence — native workflow pane, no standalone URL
  // ras: legacy alias — route to the Assess tool until a dedicated RAS pane ships
  ras: Page_Assess,
};

export default function DashboardPane({ id }: { id: string }) {
  const C = PANES[id] ?? LobbyBoardPane;
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading {id}…</div>}>
      <div data-testid={`dashboard-pane-${id}`}><C /></div>
    </Suspense>
  );
}
