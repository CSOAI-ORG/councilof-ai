/**
 * OpenRouter-style grouped sidebar for Council OS.
 *
 * Centre workspace = leaderboards, models, routes, MCP tools, chat.
 * Surfaces = real site routes opened in the main page (footer stays visible).
 */
import type { LobbyTabId } from "./tabs";

export type NavGroup = {
  title: string;
  items: LobbyTabId[];
};

/** Primary IA — OpenRouter Models/Rankings + LMArena compare + Moody's depth rail. */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Refinery",
    items: ["home"],
  },
  {
    title: "Measurement",
    items: ["board", "models", "routes", "arena"],
  },
  {
    title: "Ecosystem",
    items: ["ecosystem", "workspace", "fix"],
  },
  {
    title: "Tooling",
    items: ["tools", "verify"],
  },
  {
    title: "Surfaces",
    items: ["measured", "space", "watchdog", "academy", "software"],
  },
  {
    title: "Local play",
    items: ["play"],
  },
];

/** Centre-column panes — local workspace only (route tabs open the site column). */
export const WORKSPACE_TABS: LobbyTabId[] = [
  "home",
  "board",
  "models",
  "routes",
  "arena",
  "ecosystem",
  "workspace",
  "fix",
  "measured",
  "academy",
  "watchdog",
  "software",
  "space",
  "tools",
  "play",
  "verify",
];

export function isWorkspaceTab(id: LobbyTabId): boolean {
  return WORKSPACE_TABS.includes(id);
}
