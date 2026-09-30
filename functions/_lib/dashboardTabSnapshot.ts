/**
 * Council OS deep-link snapshots (30 Sep 2026, lane council-os-watch).
 *
 * /dashboard/?tab=<pane> is one path with many panes; the static host has one /dashboard/index.html,
 * so a deep link painted the home pane first and its real content only after three JS waves (LCP
 * 3.5-4.8 s on a throttled phone). The prerender writes a snapshot of each common pane to
 * /_dashboard-tab/<pane>/index.html (scripts/prerender.mjs dashboardTabOut); the root middleware
 * serves it for EXACTLY GET/HEAD /dashboard/?tab=<pane> with no other query parameter. The browser
 * URL does not change and the app boots on top of the snapshot as on every prerendered page.
 * Anything else, or a missing snapshot, falls through to the ordinary /dashboard/ page.
 */
export const DASHBOARD_TAB_SNAPSHOTS: ReadonlySet<string> = new Set(["route", "board", "verify", "connect", "corrections", "cards"]);

/** The snapshot path for a request, or null when the request is not an exact snapshotted deep link. */
export function dashboardSnapshotPath(req: Request): string | null {
  if (req.method !== "GET" && req.method !== "HEAD") return null;
  const u = new URL(req.url);
  if (u.pathname !== "/dashboard/") return null;
  const keys = [...u.searchParams.keys()];
  if (keys.length !== 1 || keys[0] !== "tab") return null;
  const tab = u.searchParams.get("tab") ?? "";
  return DASHBOARD_TAB_SNAPSHOTS.has(tab) ? `/_dashboard-tab/${tab}/` : null;
}

/** A direct visit to a snapshot path goes to the URL it stands for (the snapshot is never a page of its own). */
export function snapshotDirectVisit(req: Request): Response | null {
  const u = new URL(req.url);
  const m = /^\/_dashboard-tab\/([a-z0-9-]{2,40})\/?(?:index\.html)?$/.exec(u.pathname);
  if (!m) return null;
  return new Response(null, { status: 308, headers: { location: `/dashboard/?tab=${m[1]}` } });
}

type Assets = { fetch: (input: Request | URL | string, init?: RequestInit) => Promise<Response> };

export async function serveDashboardSnapshot(req: Request, assets: Assets | undefined): Promise<Response | null> {
  const path = dashboardSnapshotPath(req);
  if (!path || !assets) return null;
  try {
    const r = await assets.fetch(new URL(path, req.url), { method: req.method });
    if (!r.ok || !(r.headers.get("content-type") ?? "").includes("text/html")) return null;
    const h = new Headers(r.headers);
    h.set("x-csoai-snapshot", `dashboard-tab:${path.split("/")[2]}`);
    return new Response(req.method === "HEAD" ? null : r.body, { status: 200, headers: h });
  } catch {
    return null;
  }
}
