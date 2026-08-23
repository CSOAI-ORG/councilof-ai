/**
 * The Council Lobby's centre-pane destinations.
 *
 * OpenRouter-style workspace: board / models / routes / tools / chat live in the
 * centre column. Surfaces with a `path` open the real route in the site main
 * column (footer stays visible) — never in an iframe.
 *
 * `kind: "local"` = native workspace pane. `kind: "route"` = navigate main site.
 */

export type LobbyTabId =
  | "home"
  | "board"
  | "models"
  | "routes"
  | "tools"
  | "verify"
  | "space"
  | "measured"
  | "watchdog"
  | "academy"
  | "software"
  | "play";

export type LobbyTab = {
  id: LobbyTabId;
  label: string;
  /** One honest line about what the pane actually shows. */
  blurb: string;
  /** Same-origin route framed in the centre pane. Empty for `kind: "local"` / `native`. */
  path: string;
  /** "route" frames a live page; "local" renders in-lobby content; "native" is in-process. */
  kind?: "route" | "local" | "native";
  /** Gold accent — reserved for the local-play surface, never for measurement. */
  accent?: "emerald" | "gold";
  /** Emerald = measured; gold = local play gallery. */
  surface?: "measured" | "play";
  /** Deterministic phrases that switch to this tab from the chat bar. */
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
    id: "models",
    label: "Models",
    blurb: "Model rankings from measured axes — separated leads only.",
    path: "/gspc-scoreboard",
    kind: "local",
    surface: "measured",
    cues: /\b(models?|ranking|leader|human vs ai)\b/i,
  },
  {
    id: "routes",
    label: "Routes",
    blurb: "Eunomia routing table — the OpenRouter of governance.",
    path: "/instruments",
    kind: "local",
    surface: "measured",
    cues: /\b(routes?|eunomia|instruments|mcp|router)\b/i,
  },
  {
    id: "tools",
    label: "MCP tools",
    blurb: "Instrument cards — try in AG-UI chat or open the catalog.",
    path: "/instruments",
    kind: "local",
    surface: "measured",
    cues: /\b(tools?|mcp|instrument|agui|agent)\b/i,
  },
  {
    id: "verify",
    label: "Verify a card",
    blurb: "Recompute hash and check Ed25519 in your browser.",
    path: "/gspc-verify",
    kind: "local",
    surface: "measured",
    cues: /\b(verify|verification|signature|signed|check a (?:card|record)|hash)\b/i,
  },
  {
    id: "space",
    label: "Council Space",
    blurb: "The governed arena — rounds graded deterministically, never by a model jury.",
    path: "/gspc-arena",
    kind: "route",
    surface: "measured",
    cues: /\b(arena|space|council space|rounds|match|towns|globe)\b/i,
  },
  {
    id: "measured",
    label: "Get measured",
    blurb: "Run an assessment against the rules that govern your system.",
    path: "/assess",
    kind: "route",
    surface: "measured",
    cues: /\b(assess|assessment|get measured|measure me|measure my|readiness)\b/i,
  },
  {
    id: "watchdog",
    label: "Watchdog",
    blurb: "Reported incidents and the analyst surface that triages them.",
    path: "/watchdog",
    kind: "route",
    surface: "measured",
    cues: /\b(watchdog|incident|report(?:ed)?|complaint)\b/i,
  },
  {
    id: "academy",
    label: "Academy",
    blurb: "Council Academy — training. Course completion attests training, not conformity.",
    path: "/academy",
    kind: "route",
    surface: "measured",
    cues: /\b(academy|course|training|learn|teach)\b/i,
  },
  {
    id: "software",
    label: "Software",
    blurb: "Signed-in dashboard (DSH) — the same destinations as this rail.",
    path: "/dashboard",
    kind: "route",
    surface: "measured",
    cues: /\b(dashboard|software|dsh|signed[- ]in)\b/i,
  },
  {
    id: "play",
    label: "Council OS — local play",
    blurb: "The arenas, with honest playable / in-build states. Nothing here is deployed.",
    path: "",
    kind: "local",
    accent: "gold",
    surface: "play",
    cues: /\b(play|game|games|local play|duel|coliseum)\b/i,
  },
];

export const DEFAULT_TAB: LobbyTabId = "home";

export function tabById(id: LobbyTabId): LobbyTab {
  return LOBBY_TABS.find((t) => t.id === id) ?? LOBBY_TABS[0];
}

/** Deterministic phrase -> tab. Returns null when nothing matches; never guesses. */
export function matchTab(text: string): LobbyTab | null {
  const t = text.trim();
  if (!t) return null;
  // Only treat it as a navigation command when the sentence reads like one.
  if (!/\b(show|open|go|take me|switch|jump|load|view|bring up|let me)\b/i.test(t)) return null;
  return LOBBY_TABS.find((tab) => tab.cues.test(t)) ?? null;
}

/** Dashboard sidebar: same destinations as OS, minus Home and Software (you are already in software). */
export const DASHBOARD_TABS: LobbyTab[] = LOBBY_TABS.filter(
  (t) => !["home", "software"].includes(t.id),
);

/** Local play tab — opens Council OS play pane, not a standalone route. */
export const DASHBOARD_PLAY_TAB = tabById("play");
