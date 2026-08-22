/**
 * The Council Lobby's centre-pane destinations.
 *
 * Most entries point at a REAL route this app already serves. The lobby does not
 * reimplement any page — it frames the live one, so a page can never drift from
 * its lobby copy. `?embed=1` is appended by the centre pane. The framed app
 * honours it: site chrome is dropped and same-origin navigation stays inside
 * the pane (see client/src/lib/embed.ts).
 *
 * TWO entries are `kind: "local"`: Home is the native Council OS desktop
 * (LobbyHome) — it must not iframe /os, or the OS nests inside itself. Play
 * is the gold local-play gallery from play.ts; nothing there is deployed.
 *
 * Software (DSH) is the signed-in dashboard at /dashboard. The same tab
 * ids and labels are the dashboard sidebar. When /dashboard is framed here
 * it drops its own rail so we do not get two tab lists.
 */

export type LobbyTabId =
  | "home"
  | "board"
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
  /** Same-origin route framed in the centre pane. Empty for `kind: "local"`. */
  path: string;
  /** "route" frames a live page; "local" renders in-lobby content. */
  kind?: "route" | "local";
  /** Gold accent — reserved for the local-play surface, never for measurement. */
  accent?: "emerald" | "gold";
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
    blurb: "The living GSPC board — every published axis, and in-lane beside it.",
    path: "/gspc-scoreboard",
    cues: /\b(board|scoreboard|score|axes|axis|gspc|leaderboard)\b/i,
  },
  {
    id: "verify",
    label: "Verify a card",
    blurb: "Recompute a record's hash and check its Ed25519 signature in your browser.",
    path: "/gspc-verify",
    cues: /\b(verify|verification|signature|signed|check a (?:card|record)|hash)\b/i,
  },
  {
    id: "space",
    label: "Council Space",
    blurb: "The governed arena — rounds graded deterministically, never by a model jury.",
    path: "/gspc-arena",
    cues: /\b(arena|space|council space|rounds|match|towns|globe)\b/i,
  },
  {
    id: "measured",
    label: "Get measured",
    blurb: "Run an assessment against the rules that govern your system.",
    path: "/assess",
    cues: /\b(assess|assessment|get measured|measure me|measure my|readiness)\b/i,
  },
  {
    id: "watchdog",
    label: "Watchdog",
    blurb: "Reported incidents and the analyst surface that triages them.",
    path: "/watchdog",
    cues: /\b(watchdog|incident|report(?:ed)?|complaint)\b/i,
  },
  {
    id: "academy",
    label: "Academy",
    blurb: "Council Academy — training. Course completion attests training, not conformity.",
    path: "/academy",
    cues: /\b(academy|course|training|learn|teach)\b/i,
  },
  {
    id: "software",
    label: "Software",
    blurb: "Signed-in dashboard (DSH) — the same destinations as this rail.",
    path: "/dashboard",
    cues: /\b(dashboard|software|dsh|signed[- ]in)\b/i,
  },
  {
    id: "play",
    label: "Council OS — local play",
    blurb: "The arenas, with honest playable / in-build states. Nothing here is deployed.",
    path: "",
    kind: "local",
    accent: "gold",
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

/** Dashboard sidebar: same destinations as OS, minus Play, Home, and Software (this surface). */
export const DASHBOARD_TABS: LobbyTab[] = LOBBY_TABS.filter(
  (t) => t.kind === "route" && t.id !== "play" && t.id !== "software",
);
