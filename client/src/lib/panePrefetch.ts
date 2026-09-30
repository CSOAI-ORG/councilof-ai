/**
 * panePrefetch — start a Council OS pane's chunk as soon as the main bundle runs, when the URL
 * already names it (/dashboard/?tab=route). Without this the pane chunk is requested only after
 * the dashboard chunks have loaded and DashboardLayout has rendered: one extra round trip on the
 * critical path of every deep link (measured 30 Sep 2026: ?tab=route LCP 3.5–4.8 s on a throttled
 * phone). The specifiers are the same ones DashboardPane.tsx lazy-loads, so they resolve to the same
 * chunks; a tab not listed here simply loads as before.
 */
const PANES: Record<string, () => Promise<unknown>> = {
  board: () => import("@/components/home/HomeGspcBoard"),
  results: () => import("@/components/home/HomeGspcBoard"),
  route: () => import("@/components/gspc/RoutePane"),
  connect: () => import("@/components/gspc/ConnectPane"),
  corrections: () => import("@/components/gspc/CorrectionsPane"),
  verify: () => import("@/components/lobby/LobbyVerifyPane"),
  cards: () => import("@/components/lobby/LobbyCardsPane"),
};

export function prefetchPaneFromUrl(): void {
  if (typeof window === "undefined") return;
  const p = window.location.pathname;
  if (p !== "/dashboard" && !p.startsWith("/dashboard/")) return;
  void import("@/pages/Dashboard").catch(() => undefined);
  const tab = new URLSearchParams(window.location.search).get("tab");
  const load = tab ? PANES[tab] : undefined;
  if (load) void load().catch(() => undefined);
}
