import { LOBBY_ROUTES, LOBBY_TABS, type LobbyTab } from "./tabs";
import { isPrimaryPath } from "@/data/library-ia";

/**
 * breadcrumbs — the route-derived trail for the Council OS pane header
 * and the Council software (DSH) header.
 *
 * The pattern is OpenRouter's inner-page chrome: a small clickable trail that
 * says WHERE the pane is, derived from the route the pane is actually showing —
 * never typed by hand, never decorative.
 *
 * HONESTY RULES, in order:
 *   1. Every crumb comes from the live pane state (the owning tab and the path
 *      the frame reported). Nothing is synthesised.
 *   2. A crumb is a LINK only when the OS can really open the thing it names:
 *      the trail root (Home), a rail tab, or a path this app registers as a
 *      pane, a lobby route, or a primary page. An intermediate path segment
 *      that is NOT a real destination renders as plain text — a breadcrumb
 *      that 404s inside the pane would be chrome lying about the router.
 *   3. The last crumb is where you are. It is never a link.
 */

export type Crumb = {
  /** What the crumb prints. Tabs print their label; path segments print the raw segment. */
  label: string;
  /** Set when following the crumb selects a rail tab. */
  tab?: LobbyTab;
  /** Set when following the crumb frames a route (and no tab owns it exactly). */
  route?: string;
  /** The trailing crumb — where the pane is now. Rendered as text with aria-current. */
  current: boolean;
};

const norm = (p: string): string =>
  (p ?? "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";

/** The rail tab whose path IS this path (exact, not prefix). */
const tabAt = (path: string): LobbyTab | undefined =>
  LOBBY_TABS.find((t) => Boolean(t.path) && norm(t.path) === path);

/** True when the OS can really open this path: a pane, a lobby route, or a primary page. */
export function isKnownDestination(path: string): boolean {
  const p = norm(path);
  if (tabAt(p)) return true;
  if (LOBBY_ROUTES.some((r) => norm(r.path) === p)) return true;
  return isPrimaryPath(p);
}

const HOME_LABEL = "Home";

/**
 * The trail for the OS pane header.
 *
 * @param tab       the selected rail tab (the pane's owner)
 * @param panePath  the path the frame actually reported ("" for native/local panes)
 * @param override  true when a play card / chat opened a route the rail does not own —
 *                  the tab is then NOT the pane's parent, so it gets no crumb.
 */
export function paneCrumbs(tab: LobbyTab, panePath: string, override = false): Crumb[] {
  const home = LOBBY_TABS.find((t) => t.id === "home");
  const path = panePath ? norm(panePath) : "";
  const crumbs: Crumb[] = [];

  // Root: the OS desktop. Current only when the desktop IS the pane.
  const onHome = !override && tab.id === "home";
  crumbs.push({ label: HOME_LABEL, tab: onHome ? undefined : home, current: onHome });
  if (onHome) return crumbs;

  // The owning tab — unless an override route bypassed the rail.
  if (!override) {
    const atTabRoot = !path || path === norm(tab.path);
    crumbs.push({ label: tab.label, tab: atTabRoot ? undefined : tab, current: atTabRoot });
    if (atTabRoot) return crumbs;
  }

  // The framed path, one segment at a time. Intermediates link only when the
  // accumulated path is a destination this app really registers.
  const segments = path.split("/").filter(Boolean);
  let acc = "";
  segments.forEach((seg, i) => {
    acc += `/${seg}`;
    const last = i === segments.length - 1;
    if (last) {
      crumbs.push({ label: seg, current: true });
      return;
    }
    if (isKnownDestination(acc)) {
      const owner = tabAt(acc);
      crumbs.push(owner ? { label: seg, tab: owner, current: false } : { label: seg, route: acc, current: false });
    } else {
      crumbs.push({ label: seg, current: false });
    }
  });
  return crumbs;
}

/**
 * The trail for the standalone Council software header (/dashboard family).
 * Root is the overview; deeper segments derive from the location. Same link
 * rule: only real destinations are clickable.
 */
export function dashboardCrumbs(location: string): Array<{ label: string; path?: string; current: boolean }> {
  const path = norm(location);
  const root = { label: "Council software", path: "/dashboard", current: path === "/dashboard" };
  if (path === "/dashboard") return [{ ...root, path: undefined }];
  const rest = path.startsWith("/dashboard/") ? path.slice("/dashboard".length) : path;
  const segments = rest.split("/").filter(Boolean);
  const crumbs: Array<{ label: string; path?: string; current: boolean }> = [root];
  let acc = path.startsWith("/dashboard/") ? "/dashboard" : "";
  segments.forEach((seg, i) => {
    acc += `/${seg}`;
    const last = i === segments.length - 1;
    crumbs.push({
      label: seg,
      path: !last && isKnownDestination(acc) ? acc : undefined,
      current: last,
    });
  });
  return crumbs;
}
