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
import { useLocation } from "wouter";
import RequireAuth from "@/components/RequireAuth";
import { LOBBY_TABS } from "@/components/lobby/tabs";
const LobbyBoardPane = lazy(() => import("@/components/lobby/LobbyBoardPane"));
const HomeGspcBoard = lazy(() => import("@/components/home/HomeGspcBoard"));
const LobbyMatrixPane = lazy(() => import("@/components/lobby/LobbyMatrixPane"));
const DashboardArchivePane = lazy(() => import("@/components/DashboardArchivePane"));
const DashboardConsolePane = lazy(() => import("@/components/DashboardConsolePane"));
const Page_Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const LobbyVerifyPane = lazy(() => import("@/components/lobby/LobbyVerifyPane"));
const DashboardStatePane = lazy(() => import("@/components/DashboardStatePane"));
const DashboardAttestationsPane = lazy(() => import("@/components/DashboardAttestationsPane"));
const Page_Benchmarks = lazy(() => import("@/pages/Benchmarks"));
const Page_ModelRegistry = lazy(() => import("@/pages/ModelRegistry"));
const Page_Tools = lazy(() => import("@/pages/ToolsPage"));
const LobbyCardsPane = lazy(() => import("@/components/lobby/LobbyCardsPane"));
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
  leaderboard: Page_Leaderboard, // the full model x axis table, in-shell
  terminal: LobbyBoardPane, // GSPC terminal
  console: DashboardConsolePane, // the ONE console — same file as /gspc-console.html and the HF Space
  matrix: LobbyMatrixPane, // industry × regulation grid, native
  archive: DashboardArchivePane, // provable archive: signed hourly history of permission-state leaves (GET /archive/index.json)
  verify: LobbyVerifyPane,
  state: DashboardStatePane, // tapes beside the board: estate doors + XRPL reader (#1099)
  attestations: DashboardAttestationsPane, // the one root, its witnesses (states verbatim), search, corrections ledger
  results: Page_Benchmarks,
  models: Page_ModelRegistry,
  tools: Page_Tools,
  cards: LobbyCardsPane, // signed-cards browser, native
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

/** Extra in-shell panes that are not sidebar tabs (they have no page of their own). */
const EXTRA_LABELS: Record<string, string> = {
  console: "GSPC console",
  leaderboard: "Leaderboard",
  terminal: "GSPC terminal",
  state: "Estate state",
};

export function resolvePaneId(id: string): string {
  // Master converged without a tab-id alias map (the 22 LOBBY_TABS ids are
  // direct pane ids — see the PANES constant). The earlier ALIASES map was
  // removed during the SOV3→Council / shell convergence; this function
  // remains so that callers (DashboardLayout, the test) can still resolve an
  // incoming id without a runtime ReferenceError on a stale build.
  return id;
}

export function hasPane(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(PANES, resolvePaneId(id));
}

/** Human label for a pane id — the rail tab's label, an extra pane's label, or null when nothing owns it. */
export function paneLabel(id: string): string | null {
  const r = resolvePaneId(id);
  const tab = LOBBY_TABS.find((t) => t.id === r);
  if (tab) return tab.label;
  return EXTRA_LABELS[r] ?? null;
}

/** Every tab id this shell renders natively — the door `/dashboard?tab=<id>` works for each. */
export const PANE_IDS: readonly string[] = Object.keys(PANES);

export default function DashboardPane({ id }: { id: string }) {
  const r = resolvePaneId(id);
  const C = PANES[r] ?? HomeGspcBoard;
  const unknown = !PANES[r];
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading {r}…</div>}>
      <div className="coai-pane" data-testid={`dashboard-pane-${r}`} data-pane-known={unknown ? "no" : "yes"}>
        {unknown && (
          <p className="px-6 pt-6 text-sm text-muted-foreground" data-testid="dashboard-pane-unknown">
            No pane is named “{id}” — showing the live board instead.
          </p>
        )}
        <C />
      </div>
    </Suspense>
  );
}
