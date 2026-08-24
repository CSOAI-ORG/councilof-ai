/**
 * The Council Lobby's centre-pane destinations.
 *
 * Council OS workspace: board / models / routes / tools / chat live in the
 * centre column. Surfaces with a `path` open the real route in the site main
 * column (footer stays visible) — never in an iframe.
 *
 * `kind: "local"` = native workspace pane. `kind: "route"` = navigate main site.
 */

import { POSITIONING } from "@/lib/positioning";

export type LobbyTabId =
  | "home"
  | "board"
  | "models"
  | "routes"
  | "tools"
  | "verify"
  | "east-west"
  | "space"
  | "arena"
  | "ecosystem"
  | "workspace"
  | "fix"
  | "measured"
  | "watchdog"
  | "academy"
  | "software"
  | "play";

export type LobbyTab = {
  id: LobbyTabId;
  label: string;
  blurb: string;
  path: string;
  kind?: "route" | "local" | "native";
  accent?: "emerald" | "gold";
  surface?: "measured" | "play";
  cues: RegExp;
};

export const LOBBY_TABS: LobbyTab[] = [
  {
    id: "home",
    label: "Home",
    blurb: "Council OS desktop — every live surface, one workspace.",
    path: "",
    kind: "local",
    cues: /\b(home|hub|launcher|start|lobby home|council os|the os)\b/i,
  },
  {
    id: "board",
    label: "Live board",
    blurb: "GSPC leaderboard — every published axis, in-lane beside it.",
    path: "/gspc-scoreboard",
    kind: "local",
    surface: "measured",
    cues: /\b(board|scoreboard|score|axes|axis|gspc|leaderboard)\b/i,
  },
  {
    id: "east-west",
    label: "East-West",
    blurb: "One signed measurement mapped across EU, UK, Illinois, and China. Mapping is not a determination.",
    path: "/east-west",
    kind: "local",
    surface: "measured",
    cues: /\b(east-?west|cross-?border|cross-?jurisdiction|crosswalk v1|four regimes)\b/i,
  },
];

export const DEFAULT_TAB: LobbyTabId = "home";

export function tabById(id: LobbyTabId): LobbyTab {
  return LOBBY_TABS.find((t) => t.id === id) ?? LOBBY_TABS[0];
}

export function matchTab(text: string): LobbyTab | null {
  const t = text.trim();
  if (!t) return null;
  if (!/\b(show|open|go|take me|switch|jump|load|view|bring up|let me)\b/i.test(t)) return null;
  return LOBBY_TABS.find((tab) => tab.cues.test(t)) ?? null;
}

export const DASHBOARD_TABS: LobbyTab[] = LOBBY_TABS.filter(
  (t) => !["home", "software"].includes(t.id),
);

export const DASHBOARD_PLAY_TAB = tabById("play");
