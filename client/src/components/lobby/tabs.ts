/**
 * The Council Lobby's centre-pane destinations — the master ONE OS menu.
 *
 * Most entries point at a REAL route this app already serves. The lobby does not
 * reimplement any page — it frames the live one, so a page can never drift from
 * its lobby copy. `?embed=1` is appended by the centre pane; pages may later read
 * that flag to drop their own header/footer while inside the lobby. Nothing reads
 * it yet, so today a framed page still carries its own chrome.
 *
 * ONE entry is `kind: "local"` — the Council OS local-play gallery, which has no
 * route because none of it is deployed. It renders in the centre pane from
 * play.ts and says so on its face.
 *
 * Every entry also carries an `icon` (a key for the icon map in LobbyPaneRail)
 * and a `group` (Measure / Explore / Tooling) so the rail renders as a unified,
 * grouped side-menu rather than one flat pile.
 */

export type LobbyTabId =
  | "home"
  | "board"
  | "verify"
  | "space"
  | "measured"
  | "watchdog"
  | "academy"
  | "play"
  | "models"
  | "tools"
  | "ecosystem"
  | "enterprise"
  | "intel"
  | "brief"
  | "meok";

/** Side-menu groups, in display order. `id` drives the group heading + collapse state. */
export type LobbyGroup =
  | "measure"
  | "explore"
  | "tooling";

export const LOBBY_GROUPS: { id: LobbyGroup; label: string }[] = [
  { id: "measure", label: "Measure" },
  { id: "explore", label: "Explore" },
  { id: "tooling", label: "Tooling" },
];

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
  /** Icon key -> inline SVG in LobbyPaneRail. */
  icon: string;
  /** Side-menu group. */
  group: LobbyGroup;
  /** Deterministic phrases that switch to this tab from the chat bar. */
  cues: RegExp;
};

export const LOBBY_TABS: LobbyTab[] = [
  {
    id: "home",
    label: "Home",
    blurb: "The Council hub — every live surface in one launcher.",
    path: "/os",
    icon: "home",
    group: "tooling",
    cues: /\b(home|hub|launcher|start|lobby home)\b/i,
  },
  {
    id: "board",
    label: "Live board",
    blurb: "The GSPC board — measured axes, and the ones that carry no number.",
    path: "/gspc-scoreboard",
    icon: "board",
    group: "measure",
    cues: /\b(board|scoreboard|score|axes|axis|gspc|leaderboard)\b/i,
  },
  {
    id: "verify",
    label: "Verify a card",
    blurb: "Recompute a record's hash and check its Ed25519 signature in your browser.",
    path: "/gspc-verify",
    icon: "verify",
    group: "measure",
    cues: /\b(verify|verification|signature|signed|check a (?:card|record)|hash)\b/i,
  },
  {
    id: "measured",
    label: "Get measured",
    blurb: "Run an assessment against the rules that govern your system.",
    path: "/assess",
    icon: "assess",
    group: "measure",
    cues: /\b(assess|assessment|get measured|measure me|measure my|readiness)\b/i,
  },
  {
    id: "watchdog",
    label: "Watchdog",
    blurb: "Reported incidents and the analyst surface that triages them.",
    path: "/watchdog",
    icon: "watchdog",
    group: "measure",
    cues: /\b(watchdog|incident|report(?:ed)?|complaint)\b/i,
  },
  {
    id: "space",
    label: "Council Space",
    blurb: "The governed arena — rounds graded deterministically, never by a model jury.",
    path: "/gspc-arena",
    icon: "space",
    group: "explore",
    cues: /\b(arena|space|council space|rounds|match|towns|globe)\b/i,
  },
  {
    id: "ecosystem",
    label: "Ecosystem",
    blurb: "Every public organisation in scope — regulators, enterprises and SMBs.",
    path: "/ecosystem",
    icon: "ecosystem",
    group: "explore",
    cues: /\b(ecosystem|organisations?|organizations?|regulators?|enterprises?|smbs?)\b/i,
  },
  {
    id: "enterprise",
    label: "Enterprise",
    blurb: "Enterprise assurance — portfolio + frameworks, in one pane.",
    path: "/enterprise",
    icon: "enterprise",
    group: "explore",
    cues: /\b(enterprise|portfolio|company|corporate|assurance)\b/i,
  },
  {
    id: "intel",
    label: "Intel",
    blurb: "Council intelligence — the news, feeds and signals that affect your posture.",
    path: "/intel",
    icon: "intel",
    group: "explore",
    cues: /\b(intel|intelligence|news|feed|signal|briefing)\b/i,
  },
  {
    id: "brief",
    label: "Brief",
    blurb: "The daily brief — what moved, what is measured, what to watch.",
    path: "/brief",
    icon: "brief",
    group: "tooling",
    cues: /\b(brief|daily|digest|summary|what moved)\b/i,
  },
  {
    id: "academy",
    label: "Academy",
    blurb: "Council Academy — training. Course completion attests training, not conformity.",
    path: "/academy",
    icon: "academy",
    group: "tooling",
    cues: /\b(academy|course|training|learn|teach)\b/i,
  },
  {
    id: "models",
    label: "Models",
    blurb: "The measured model catalogue — names, weights, fleet scores. A name is not a model.",
    path: "/models",
    icon: "models",
    group: "tooling",
    cues: /\b(models?|catalogue|catalog|weights|fleet scores)\b/i,
  },
  {
    id: "tools",
    label: "Tools",
    blurb: "The Council tooling — assess, verify, crosswalk, evidence, certificate check.",
    path: "/tools",
    icon: "tools",
    group: "tooling",
    cues: /\b(tools?|assess tool|verify tool|evidence|claimguard)\b/i,
  },
  {
    id: "meok",
    label: "MEOK",
    blurb: "MEOK on DSH — the West's OpenRouter. Run any brain, measured not trusted.",
    path: "/ag-ui",
    icon: "meok",
    group: "tooling",
    cues: /\b(meok|router|openrouter|run a brain|run brain|ask meok|chat)\b/i,
  },
  {
    id: "play",
    label: "Council OS — local play",
    blurb: "The arenas, with honest playable / in-build states. Nothing here is deployed.",
    path: "",
    kind: "local",
    accent: "gold",
    icon: "play",
    group: "explore",
    cues: /\b(play|game|games|local play|duel|coliseum|council os)\b/i,
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
