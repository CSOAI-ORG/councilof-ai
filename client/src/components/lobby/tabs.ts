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
 * is the gold local-play gallery from play.ts; routes are preview-only until live.
 *
 * Software (DSH) is the signed-in dashboard at /dashboard. The same tab
 * ids and labels are the dashboard sidebar. When /dashboard is framed here
 * it drops its own rail so we do not get two tab lists.
 *
 * LOBBY_ROUTES are live pages eaten by the Home desktop and by chat commands
 * ("open the instrument") without adding another rail tab.
 */

export type LobbyTabId =
  | "home"
  | "board"
  | "results"
  | "models"
  | "tools"
  | "verify"
  | "space"
  | "measured"
  | "watchdog"
  | "claimguard"
  | "ras"
  | "library"
  | "workbench"
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
  /** Deterministic phrases that switch to this tab from the chat bar. */
  cues: RegExp;
};

export type LobbyRouteGroup = "record" | "receipts" | "analyst";

export type LobbyRoute = {
  label: string;
  blurb: string;
  path: string;
  group: LobbyRouteGroup;
  cues: RegExp;
};

export const LOBBY_TABS: LobbyTab[] = [
  {
    id: "home",
    label: "Home",
    blurb: "Council OS desktop — every live surface, one workspace.",
    path: "",
    kind: "local",
    cues: /\b(home|hub|launcher|start|lobby home|council os|the os|ag[- ]?ui|chat)\b/i,
  },
  {
    id: "board",
    label: "Live board",
    blurb: "The living GSPC board — every published axis, and in-lane beside it.",
    path: "/gspc-scoreboard",
    kind: "native",
    cues: /\b(board|scoreboard|score|axes|axis|gspc|leaderboard)\b/i,
  },
  {
    id: "results",
    label: "Benchmarkers",
    blurb: "Measured benchmark results — every figure traces to a published artefact, losses included.",
    path: "/benchmarks",
    cues: /\b(benchmarkers?|benchmarks?|results|artefacts?|artifacts?|meta[- ]?benchmark)\b/i,
  },
  {
    id: "models",
    label: "Models",
    blurb: "The measured-axis grid from the live board — per-axis leaders where separation is measured, honest gaps where it is not.",
    path: "/models",
    cues: /\b(models?|model registry)\b/i,
  },
  {
    id: "tools",
    label: "Tools",
    blurb: "Published tooling and MCP servers — connect, run, verify. Not a marketplace.",
    path: "/tools",
    cues: /\b(tools?|tooling|tool commons|mcp tools)\b/i,
  },
  {
    id: "verify",
    label: "Verify a card",
    blurb: "Recompute a record's hash and check its Ed25519 signature in your browser.",
    path: "/gspc-verify",
    kind: "native",
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
    label: "Report an incident",
    blurb: "Report an AI incident — a real form, filed to the record. No heat-map is claimed until one is measured.",
    path: "/report",
    cues: /\b(watchdog|incident|report(?:ed)?|complaint|heat.?map)\b/i,
  },
  {
    id: "claimguard",
    label: "Honesty gate",
    blurb: "Where our own systems lose our own arena — the ladder, published. Measurement, never a badge.",
    path: "/honesty",
    cues: /\b(honesty|honest|claimguard|claim.?guard|claim check|verify claim|ladder)\b/i,
  },
  {
    id: "ras",
    label: "Readiness assessment",
    blurb: "The guided readiness route — structured questions, human-readable output.",
    path: "/readiness-assessment",
    cues: /\b(ras|readiness assessment|booking|human.?rail)\b/i,
  },
  {
    id: "library",
    label: "Library",
    blurb: "The dated archive — every published page, by sector. Library, don't delete.",
    path: "/library",
    cues: /\b(library|archive|the archive)\b/i,
  },
  {
    id: "workbench",
    label: "Workbench",
    blurb: "The analyst desk — skills and signed artefacts. Not a live certification.",
    path: "/workbench",
    cues: /\b(workbench|analyst desk|skills palette)\b/i,
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
    label: "Play gallery",
    blurb: "Arena previews with honest in-build labels — measurement surfaces, not live multiplayer yet.",
    path: "",
    kind: "local",
    accent: "gold",
    cues: /\b(play|game|games|local play|duel|coliseum)\b/i,
  },
];

/** Live pages framed from Home / chat without a dedicated rail tab. */
export const LOBBY_ROUTES: LobbyRoute[] = [
  {
    label: "Layer 0",
    blurb: "The signed trust layer the agent rail stands on.",
    path: "/layer0",
    group: "record",
    cues: /\b(layer[- ]?0|layer zero)\b/i,
  },
  {
    label: "Trust center",
    blurb: "Keys, receipts, and what we will not claim.",
    path: "/trust-center",
    group: "record",
    cues: /\b(trust center|trust centre)\b/i,
  },
  {
    label: "Network",
    blurb: "N sites and where the record lives.",
    path: "/network",
    group: "record",
    cues: /\b(the network|where the record)\b/i,
  },
  {
    label: "Hive",
    blurb: "Frameworks and groups, as published.",
    path: "/hive",
    group: "record",
    cues: /\b(hive)\b/i,
  },
  {
    label: "Intel",
    blurb: "Competitor and landscape notes.",
    path: "/intel",
    group: "record",
    cues: /\b(intel|landscape notes)\b/i,
  },
  {
    label: "System card",
    blurb: "The live signed system card — issue it, verify it offline. Not a certificate.",
    path: "/system-card",
    group: "record",
    cues: /\b(system card)\b/i,
  },
  {
    label: "Methodology",
    blurb: "How we grade — no model in the verdict.",
    path: "/methodology",
    group: "receipts",
    cues: /\b(methodology|how we grade)\b/i,
  },
  {
    label: "Honesty gate",
    blurb: "What we cannot yet measure, published.",
    path: "/honesty",
    group: "receipts",
    cues: /\b(honesty gate|honesty page)\b/i,
  },
  {
    label: "The instrument",
    blurb: "Four deterministic lenses over frozen provisions.",
    path: "/instrument",
    group: "receipts",
    cues: /\b(instrument|four lenses)\b/i,
  },
  {
    label: "Refutation ledger",
    blurb: "Killed hypotheses, with the artefacts that killed them.",
    path: "/refutation-ledger",
    group: "receipts",
    cues: /\b(refutation(?:s)? ledger|killed hypotheses)\b/i,
  },
  {
    label: "Firewall charter",
    blurb: "Measurement stays independent of remediation.",
    path: "/firewall-charter",
    group: "receipts",
    cues: /\b(firewall charter)\b/i,
  },
  {
    label: "Meta-benchmark index",
    blurb: "What other benchmarks report, beside what we measure.",
    path: "/benchmark-index",
    group: "analyst",
    cues: /\b(benchmark[- ]?index|meta[- ]?benchmark index)\b/i,
  },
  {
    label: "Benchmark quality",
    blurb: "Deterministic predicates on third-party AI benchmarks.",
    path: "/benchmark-quality",
    group: "analyst",
    cues: /\b(benchmark[- ]?quality|quality register)\b/i,
  },
  {
    label: "MCP fleet",
    blurb: "The published fleet manifest — not a marketplace.",
    path: "/mcp-fleet",
    group: "analyst",
    cues: /\b(mcp fleet|fleet manifest)\b/i,
  },
  {
    label: "MCP registry",
    blurb: "Named MCP servers as published. /mcp is the protocol proxy; this is the human registry.",
    path: "/mcps",
    group: "analyst",
    cues: /\b(mcp registry|mcp servers|browse mcp)\b/i,
  },
  {
    label: "Crosswalk",
    blurb: "An indicative map of frameworks onto frozen statute — not a signed score.",
    path: "/crosswalk",
    group: "analyst",
    cues: /\b(crosswalk)\b/i,
  },
  {
    label: "Regulation feed",
    blurb: "Published regulation deltas — what moved, as recorded.",
    path: "/feed",
    group: "analyst",
    cues: /\b(regulation feed|reg feed)\b/i,
  },
];

export const DEFAULT_TAB: LobbyTabId = "home";

export function tabById(id: LobbyTabId): LobbyTab {
  return LOBBY_TABS.find((t) => t.id === id) ?? LOBBY_TABS[0];
}

function isNavCommand(text: string): boolean {
  return /\b(show|open|go|take me|switch|jump|load|view|bring up|let me)\b/i.test(text);
}

/** Deterministic phrase -> tab. Returns null when nothing matches; never guesses. */
export function matchTab(text: string): LobbyTab | null {
  const t = text.trim();
  if (!t || !isNavCommand(t)) return null;
  return LOBBY_TABS.find((tab) => tab.cues.test(t)) ?? null;
}

/** Deterministic phrase -> a Home-desktop route (not a rail tab). */
export function matchRoute(text: string): LobbyRoute | null {
  const t = text.trim();
  if (!t || !isNavCommand(t)) return null;
  return LOBBY_ROUTES.find((r) => r.cues.test(t)) ?? null;
}

export function routesIn(group: LobbyRouteGroup): LobbyRoute[] {
  return LOBBY_ROUTES.filter((r) => r.group === group);
}

/** Same destinations as OS, minus Play, Home, and Software (this surface). */
export function isDashboardTab(t: LobbyTab): boolean {
  return Boolean(t.path) && t.id !== "play" && t.id !== "software" && t.id !== "home";
}

export const DASHBOARD_TABS: LobbyTab[] = LOBBY_TABS.filter(isDashboardTab);
