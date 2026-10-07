/**
 * Paths Council OS must never iframe, and a framed child must break out of.
 *
 * These are other chrome branches of the same SPA (OS mounts, demo shells) or
 * the signed-in dashboard. Framing them strips Header/Footer on purpose
 * (`?embed=1`) and either nests OS inside OS or leaves a product UI with no
 * nav. Library / methodology / products are not in this set — they may still
 * frame.
 *
 * `coai:embed-nav` does not enforce this. Child and parent each check.
 */
export const UNFRAMEABLE = [
  "/",
  "/os",
  "/ag-ui",
  "/chat",
  "/console",
  "/sov-os",
  "/council-os",
  "/dashboard",
  "/demo",
  "/os-demo",
] as const;

const EMBED_PARAM = "embed";

/** Pathname only, trailing slash collapsed. Query and hash dropped. */
export function pathBare(path: string): string {
  return path.split("?")[0]?.split("#")[0]?.replace(/\/$/, "") || "/";
}

export function isUnframeable(path: string): boolean {
  return (UNFRAMEABLE as readonly string[]).includes(pathBare(path));
}

/**
 * Strip `embed=1` so a breakout lands as a top-level page with its own chrome.
 * Other query params (lobby, card, …) stay.
 */
export function withoutEmbed(href: string, base = "https://councilof.ai"): string {
  if (!href) return href;
  try {
    const url = new URL(href, base);
    url.searchParams.delete(EMBED_PARAM);
    if (/^https?:\/\//i.test(href)) return url.toString();
    return url.pathname + url.search + url.hash;
  } catch {
    return href;
  }
}

/**
 * Where a framed page actually landed, when that is a place Council OS must not frame.
 *
 * Withdrawn pages (/watchdog-hub, /jobs, /early-access, …) are 308'd by Pages Functions to
 * /os?lobby=home, and /enterprise to /dashboard. The redirect drops `embed=1`, so the child never
 * breaks out and Council OS rendered inside its own centre pane. The parent reads the landed
 * location after load (same origin, so it can) and replaces the frame when it is unframeable.
 * Returns null when the frame is fine, empty, or cannot be read (cross-origin throws).
 */
export function unframeableLanding(
  frame: { contentWindow?: { location?: { pathname?: string; search?: string; hash?: string } } | null } | null,
): { path: string; href: string } | null {
  try {
    const loc = frame?.contentWindow?.location;
    const path = loc?.pathname;
    if (!path || path === "blank" || path === "srcdoc") return null;
    if (!isUnframeable(path)) return null;
    return { path: pathBare(path), href: withoutEmbed(`${path}${loc?.search ?? ""}${loc?.hash ?? ""}`) };
  } catch {
    return null;
  }
}
