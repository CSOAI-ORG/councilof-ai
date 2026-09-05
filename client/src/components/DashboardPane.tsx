import type React from "react";
/** Council OS panes rendered inside the canonical Dashboard shell.
 *
 *  Each tab in LOBBY_TABS (client/src/components/lobby/tabs.ts) MUST have a pane here
 *  unless it is intentionally `kind: "local"` (rendered by the chat-first workspace —
 *  `home`) or `kind: "route"` with a real path that frames a page (those
 *  open through the shared embedded-view contract). Unknown ids are explicit;
 *  the shell never silently substitutes the live board. */
import { lazy, Suspense } from "react";
import { Link } from "wouter";
import { LOBBY_TABS, normalizeLobbyTabId } from "@/components/lobby/tabs";
import DashboardEmbeddedView from "@/components/DashboardEmbeddedView";
const LobbyBoardPane = lazy(() => import("@/components/lobby/LobbyBoardPane"));
const CanonicalGspcBoard = lazy(
  () => import("@/components/board/CanonicalGspcBoard"),
);
const LobbyMatrixPane = lazy(
  () => import("@/components/lobby/LobbyMatrixPane"),
);
const DashboardArchivePane = lazy(
  () => import("@/components/DashboardArchivePane"),
);
const DashboardConsolePane = lazy(
  () => import("@/components/DashboardConsolePane"),
);
const Page_Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const LobbyVerifyPane = lazy(
  () => import("@/components/lobby/LobbyVerifyPane"),
);
const DashboardStatePane = lazy(
  () => import("@/components/DashboardStatePane"),
);
const DashboardAttestationsPane = lazy(
  () => import("@/components/DashboardAttestationsPane"),
);
const LobbyCardsPane = lazy(() => import("@/components/lobby/LobbyCardsPane"));
const LobbyEvidencePane = lazy(
  () => import("@/components/lobby/LobbyEvidencePane"),
);
const LobbyEmbedPane = lazy(() => import("@/components/lobby/LobbyEmbedPane"));
const LobbyPlay = lazy(() => import("@/components/lobby/LobbyPlay"));
const LobbyArt50Pane = lazy(() => import("@/components/lobby/LobbyArt50Pane"));
const DashboardCataloguePane = lazy(
  () => import("@/components/DashboardCataloguePane"),
);
const DashboardStandardsPane = lazy(
  () => import("@/components/DashboardStandardsPane"),
);
const DashboardToolsPane = lazy(
  () => import("@/components/DashboardToolsPane"),
);
const DashboardFabricPane = lazy(
  () => import("@/components/DashboardFabricPane"),
);
const DashboardRequestPane = lazy(
  () => import("@/components/DashboardRequestPane"),
);
const DashboardArenaPane = lazy(
  () => import("@/components/DashboardArenaPane"),
);
const DashboardLearningPane = lazy(
  () => import("@/components/DashboardLearningPane"),
);

const PANES: Record<string, React.LazyExoticComponent<any>> = {
  // home: DashboardWorkspace owns the chat-first landing — no separate pane.
  board: CanonicalGspcBoard, // one canonical GET /api/gspc board, shared with the home and terminal surfaces
  results: CanonicalGspcBoard, // Stale iframe and duplicate renderer retired: one native result surface.
  leaderboard: Page_Leaderboard, // the full model x axis table, in-shell
  terminal: LobbyBoardPane, // GSPC terminal
  console: DashboardConsolePane, // the ONE console — same file as /gspc-console.html and the HF Space
  matrix: LobbyMatrixPane, // industry × regulation grid, native
  archive: DashboardArchivePane, // provable archive: signed hourly history of permission-state leaves (GET /archive/index.json)
  verify: LobbyVerifyPane,
  state: DashboardStatePane, // tapes beside the board: estate doors + XRPL reader (#1099)
  attestations: DashboardAttestationsPane, // the one root, its witnesses (states verbatim), search, corrections ledger
  cards: LobbyCardsPane, // signed-cards browser, native
  evidence: LobbyEvidencePane, // GPAI evidence pack, native
  embed: LobbyEmbedPane, // white-label badge / self-verifying card, native
  explore: DashboardCataloguePane,
  standards: DashboardStandardsPane,
  fabric: DashboardFabricPane,
  tools: DashboardToolsPane,
  measured: DashboardRequestPane,
  space: DashboardArenaPane,
  learn: DashboardLearningPane,
  // software: signed-in dashboard at /dashboard, the layout redirects there
  play: LobbyPlay, // gold local-play gallery (local kind)
  art50: LobbyArt50Pane, // Article 50 marking evidence — native workflow pane, no standalone URL
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
  return normalizeLobbyTabId(id);
}

export function hasPane(id: string): boolean {
  const resolved = resolvePaneId(id);
  return (
    Object.prototype.hasOwnProperty.call(PANES, resolved) ||
    LOBBY_TABS.some((tab) => tab.id === resolved && Boolean(tab.path))
  );
}

/** Human label for a pane id — the rail tab's label, an extra pane's label, or null when nothing owns it. */
export function paneLabel(id: string): string | null {
  const r = resolvePaneId(id);
  const tab = LOBBY_TABS.find((t) => t.id === r);
  if (tab) return tab.label;
  return EXTRA_LABELS[r] ?? null;
}

/** Every tab id this shell renders natively — the door `/dashboard?tab=<id>` works for each. */
export const PANE_IDS: readonly string[] = [
  ...new Set([
    ...Object.keys(PANES),
    ...LOBBY_TABS.filter(
      (tab) => tab.id !== "home" && tab.id !== "software",
    ).map((tab) => tab.id),
  ]),
];

export default function DashboardPane({ id }: { id: string }) {
  const r = resolvePaneId(id);
  const C = PANES[r];
  const tab = LOBBY_TABS.find((candidate) => candidate.id === r);
  if (!C && tab?.path) {
    return (
      <div
        className="coai-pane h-full"
        data-testid={`dashboard-pane-${r}`}
        data-pane-known="yes"
      >
        <DashboardEmbeddedView path={tab.path} label={tab.label} />
      </div>
    );
  }
  if (!C) {
    return (
      <div
        className="mx-auto max-w-2xl px-6 py-16 text-center"
        data-testid="dashboard-pane-unknown"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
          Unknown workspace
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          No tool is named “{id}”.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing else was substituted. Use the master catalogue to choose a
          published workflow or page.
        </p>
        <Link
          href="/dashboard?tab=explore"
          className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Open all tools
        </Link>
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">Loading {r}…</div>
      }
    >
      <div
        className="coai-pane"
        data-testid={`dashboard-pane-${r}`}
        data-pane-known="yes"
      >
        <C />
      </div>
    </Suspense>
  );
}
