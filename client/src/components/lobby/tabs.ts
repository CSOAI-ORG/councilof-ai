/**
 * The Council Lobby's centre-pane destinations.
 *
 * Every entry points at a REAL route this app already serves. The lobby does not
 * reimplement any page — it frames the live one, so a page can never drift from
 * its lobby copy. `?embed=1` is appended by the centre pane; pages may later read
 * that flag to drop their own header/footer while inside the lobby. Nothing reads
 * it yet, so today a framed page still carries its own chrome.
 */

export type LobbyTabId =
  | "home"
  | "board"
  | "verify"
  | "space"
  | "measured"
  | "watchdog"
  | "academy";

export type LobbyTab = {
  id: LobbyTabId;
  label: string;
  /** One honest line about what the pane actually shows. */
  blurb: string;
  /** Same-origin route framed in the centre pane. */
  path: string;
  /** Deterministic phrases that switch to this tab from the chat bar. */
  cues: RegExp;
};

export const LOBBY_TABS: LobbyTab[] = [
  {
    id: "home",
    label: "Home",
    blurb: "The Council hub — every live surface in one launcher.",
    path: "/os",
    cues: /\b(home|hub|launcher|start|lobby home)\b/i,
  },
  {
    id: "board",
    label: "Live board",
    blurb: "The GSPC board — measured axes, and the ones that carry no number.",
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
