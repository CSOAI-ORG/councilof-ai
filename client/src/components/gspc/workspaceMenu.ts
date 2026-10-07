/**
 * The workspace's global menu, grouped (lane gspc-product-ui-b2, 30 Sep 2026; pattern from the
 * owner's console-navigation study: a grouped global menu, a support-and-resources menu, and a
 * per-viewer landing page). Groups hold the product sections; they add no section of their own.
 */
import type { DashboardNavGroupId } from "@/components/lobby/tabs";

export const MENU_GROUPS: { heading: string | null; sections: DashboardNavGroupId[] }[] = [
  // Owner brief (1 Oct 2026): task-named, in this order. Get results · My results · Check a result ·
  // Leaderboard · Connect · Learn. Everything else sits under "More".
  { heading: null, sections: ["ask", "mine", "verify", "board", "connect", "learn"] },
  { heading: "More", sections: ["sovx", "corrections"] },
];

/**
 * Support and resources: pages and machine files, never a section. Every href is served.
 *
 * Tools audit, 6 Oct 2026: a stranger opening "For agents" or "llms.txt" landed in a raw bot file
 * in the same tab. The two developer entries now sit under a "For developers" subheading with
 * labels that say who they are for, and every `external` link opens in a new tab.
 */
export type SupportLink = {
  label: string;
  href: string;
  /** A machine file or feed: opens in a new tab, so the workspace stays where it was. */
  external?: boolean;
  /** Rendered under the "For developers" subheading. */
  forDevelopers?: boolean;
};

export const SUPPORT_LINKS: SupportLink[] = [
  { label: "How a measurement is made", href: "/methodology/" },
  { label: "Install in Claude, Cursor or any client", href: "/connect/" },
  { label: "Dispute or ask for a correction", href: "/dispute/" },
  { label: "Corrections feed (RSS)", href: "/feeds/corrections.xml", external: true },
  { label: "Connect an AI agent (for developers)", href: "/agents/", forDevelopers: true },
  { label: "llms.txt (for AI crawlers)", href: "/llms.txt", external: true, forDevelopers: true },
];

/** The per-viewer start page (browser storage only; a convenience, never shared state). */
export const START_KEY = "coai:workspace-start-tab";

export function readStartTab(): string | null {
  try {
    const v = window.localStorage.getItem(START_KEY);
    return v && /^[a-z0-9-]{2,40}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

export function writeStartTab(tab: string | null): void {
  try {
    if (tab && tab !== "home") window.localStorage.setItem(START_KEY, tab);
    else window.localStorage.removeItem(START_KEY);
  } catch {
    /* storage blocked: the default start page stays */
  }
}
