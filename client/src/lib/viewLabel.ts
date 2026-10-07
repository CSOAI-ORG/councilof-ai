/**
 * viewLabel — a plain name and description for a page framed inside Council OS
 * (/dashboard?tab=explore&view=<path>), so the workspace header never reads "/government" or
 * "/layer0" and the catalogue never repeats one boilerplate line under every page.
 *
 * Sources, in order, all already in the bundle and none typed here:
 *   1. the rail tab or lobby route that owns the path (components/lobby/tabs.ts);
 *   2. the page's own head (lib/seoHead.ts → data/seo-head.json, the one producer of titles and
 *      meta descriptions), with the site-name suffix removed.
 * A path none of them names gets "Published page", never the path itself.
 */
import { LOBBY_ROUTES, LOBBY_TABS } from "@/components/lobby/tabs";
import { resolveHead, SITE_NAME } from "@/lib/seoHead";

function bare(path: string): string {
  return path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
}

const ESCAPED_SITE = SITE_NAME.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
const SUFFIX = new RegExp("\\s*[|·—–-]\\s*(?:" + ESCAPED_SITE + "|CSOAI)\\s*$", "i");

/** The name a reader sees for a framed page. Never the raw path. */
export function labelForViewPath(path: string): string {
  const p = bare(path);
  const tab = LOBBY_TABS.find((t) => t.path && bare(t.path) === p);
  if (tab) return tab.label;
  const route = LOBBY_ROUTES.find((r) => bare(r.path) === p);
  if (route) return route.label;
  const head = resolveHead(p);
  const title = head.title.replace(SUFFIX, "").trim();
  return title && !title.startsWith("/") ? title : "Published page";
}

/**
 * The page's own description when its head names one (a hand-written route entry, a component
 * entry or a route family); null when the head would only derive a generic line.
 */
export function descriptionForViewPath(path: string): string | null {
  const head = resolveHead(bare(path));
  return head.source === "route" || head.source === "component" || head.source === "family" ? head.description : null;
}
