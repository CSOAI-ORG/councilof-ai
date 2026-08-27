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
  { id: "home", label: "Home", blurb: "Council OS desktop — every live surface, one workspace.", path: "", kind: "local", cues: /\b(home|hub|launcher|start|lobby home|council os|the os)\b/i },
  { id: "board", label: "Live board", blurb: "GSPC leaderboard — every published axis, in-lane beside it.", path: "/gspc-scoreboard", kind: "local", surface: "measured", cues: /\b(board|scoreboard|score|axes|axis|gspc|leaderboard)\b/i },
  { id: "models", label: "Models", blurb: "Model rankings from measured axes — separated leads only.", path: "/gspc-scoreboard", kind: "local", surface: "measured", cues: /\b(models?|ranking|leader|human vs ai)\b/i },
  { id: "routes", label: "Routes", blurb: POSITIONING.router.blurb, path: "/instruments", kind: "local", surface: "measured", cues: /\b(routes?|eunomia|instruments|mcp|router)\b/i },
  { id: "tools", label: "MCP tools", blurb: "Instrument cards — try in AG-UI chat or open the catalog.", path: "/instruments", kind: "local", surface: "measured", cues: /\b(tools?|mcp|instrument|agui|agent)\b/i },
  { id: "verify", label: "Verify a card", blurb: "Recompute hash and check Ed25519 in your browser.", path: "/gspc-verify", kind: "local", surface: "measured", cues: /\b(verify|verification|signature|signed|check a (?:card|record)|hash)\b/i },
  { id: "east-west", label: "East-West", blurb: "One signed measurement mapped across EU, UK, Illinois, and China. Mapping is not a determination.", path: "/east-west", kind: "local", surface: "measured", cues: /\b(east-?west|cross-?border|cross-?jurisdiction|crosswalk v1|four regimes)\b/i },
  { id: "space", label: "Council Space", blurb: "The governed arena — rounds graded deterministically, never by a model jury.", path: "/gspc-arena", kind: "local", surface: "measured", cues: /\b(space|council space|towns|globe)\b/i },
  { id: "arena", label: "Arena", blurb: "LMArena-style compare — blind rounds on the GSPC board, not a model jury.", path: "/gspc-arena?view=arena", kind: "local", surface: "measured", cues: /\b(arena|compare|head.?to.?head|lmarena|coliseum|match|rounds)\b/i },
  { id: "ecosystem", label: "Ecosystem", blurb: "Regulators, enterprises, SMBs — the nameable market in one index.", path: "/intel", kind: "local", surface: "measured", cues: /\b(ecosystem|hive|intel|enterprises?|regulators?|smb|distribution)\b/i },
  { id: "workspace", label: "My systems", blurb: "Your org portfolio — batch assess, re-attest, keep current. Not certification.", path: "/workspace", kind: "local", surface: "measured", cues: /\b(workspace|my systems|portfolio|batch|reattest|our org)\b/i },
  { id: "fix", label: "Fix & train", blurb: "MEOK/AG-UI assist lane — close gaps, schedule re-measure. Council does not certify.", path: "/remediation-partners", kind: "local", surface: "measured", cues: /\b(fix|remediat|train|gap|meok|offline|assist)\b/i },
  { id: "measured", label: "Get measured", blurb: "Run an assessment against the rules that govern your system.", path: "/assess", kind: "local", surface: "measured", cues: /\b(assess|assessment|get measured|measure me|measure my|readiness)\b/i },
  { id: "watchdog", label: "Watchdog", blurb: "Reported incidents and the analyst surface that triages them.", path: "/watchdog", kind: "local", surface: "measured", cues: /\b(watchdog|incident|report(?:ed)?|complaint)\b/i },
  { id: "academy", label: "Academy", blurb: "Live training — verified outcome records, never certificates. Frozen academy rails stay linked.", path: "/live-training", kind: "local", surface: "measured", cues: /\b(academy|course|training|learn|teach)\b/i },
  { id: "software", label: "Software", blurb: "Signed-in dashboard (DSH) — the same destinations as this rail.", path: "/dashboard", kind: "local", surface: "measured", cues: /\b(dashboard|software|dsh|signed[- ]in)\b/i },
  { id: "play", label: "Council OS — local play", blurb: "The arenas, with honest playable / in-build states. Nothing here is deployed.", path: "", kind: "local", accent: "gold", surface: "play", cues: /\b(play|game|games|local play|duel|coliseum)\b/i },
];

export const DEFAULT_TAB: LobbyTabId = "home";
export function tabById(id: LobbyTabId): LobbyTab { return LOBBY_TABS.find((t) => t.id === id) ?? LOBBY_TABS[0]; }
export function matchTab(text: string): LobbyTab | null {
  const t = text.trim();
  if (!t) return null;
  if (!/\b(show|open|go|take me|switch|jump|load|view|bring up|let me)\b/i.test(t)) return null;
  return LOBBY_TABS.find((tab) => tab.cues.test(t)) ?? null;
}
export const DASHBOARD_TABS: LobbyTab[] = LOBBY_TABS.filter((t) => !["home", "software"].includes(t.id));
export const DASHBOARD_PLAY_TAB = tabById("play");
