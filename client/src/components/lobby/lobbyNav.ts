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

/** Primary IA — measurement hub first, like OpenRouter Models/Rankings. */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Workspace",
    items: ["home"],
  },
  {
    title: "Measurement",
    items: ["board", "models", "routes"],
  },
  {
    title: "Tooling",
    items: ["tools"],
  },
  {
    title: "Surfaces",
    items: ["verify", "measured", "space", "watchdog", "academy", "software"],
  },
  {
    title: "Local play",
    items: ["play"],
  },
];

export const WORKSPACE_TABS: LobbyTabId[] = [
  "home",
  "board",
  "models",
  "routes",
  "tools",
  "play",
  "verify",
];

export function isWorkspaceTab(id: LobbyTabId): boolean {
  return WORKSPACE_TABS.includes(id);
}
