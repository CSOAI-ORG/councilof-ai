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
 * `kind: "native"` is the working surface: a pane rendered IN PROCESS because the
 * product is a workflow, not a document. A native tab carries `path: ""` on
 * purpose — it has no standalone URL, so `tabForPath()` cannot bounce a framed
 * page back onto it (Live board and Verify keep their paths because the framed
 * route and the native pane are the same thing there; Evidence pack and Embed kit
 * are NOT the same thing as their explainer pages, and each pane links out to
 * its page as an ordinary in-pane route).
 *
 * ONE DESTINATION, ONE OWNER. A path appears EITHER as a tab or as a
 * LOBBY_ROUTE, never both — two doors onto /honesty (a tab and a route, sharing a
 * label) is exactly the duplicate the OS audit flagged. Where a native pane owns
 * a product, its explainer page is reached from inside the pane rather than
 * getting a second entry in the rail.
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
  | "evidence"
  | "embed"
  | "products"
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
  /**
   * Set where the framed route is behind RequireAuth (client/src/components/
   * RequireAuth.tsx), so a signed-out reader is REDIRECTED TO /login the moment
   * the pane opens. The rail said nothing about it: "Workbench — the analyst desk,
   * skills and signed artefacts" put a reader one click from a password box with
   * no warning, under a pane header that then read the site's own <title>. The OS
   * says so before the click now, and the pane says what happened after it.
   *
   * /assess is NOT flagged: RequireAuth exempts it explicitly ("Get measured is
   * free and needs no account"), and it was driven signed-out to confirm.
   */
  auth?: "required";
  /** Deterministic phrases that switch to this tab from the chat bar. */
  cues: RegExp;
};

export type LobbyRouteGroup = "product" | "audience" | "record" | "receipts" | "analyst";

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
    id: "evidence",
    label: "Evidence pack",
    blurb: "Compile the evidence index for one system — live rows, resolvable banks, omissions named.",
    path: "",
    kind: "native",
    cues: /\b(gpai evidence pack|evidence index|evidence pack|gpai evidence|gpai)\b/i,
  },
  {
    id: "embed",
    label: "Embed kit",
    blurb: "Build the white-label badge or the self-verifying card from what is actually on the board.",
    path: "",
    kind: "native",
    cues: /\b(white[- ]?label|embed kit|snippet|badge|embed)\b/i,
  },
  {
    id: "products",
    label: "Products",
    blurb: "The shipped product family, as published — what each one measures and what it will not claim.",
    path: "/products",
    cues: /\b(product family|catalogue|catalog|products?)\b/i,
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
    // NOT a bare "readiness": three destinations answer to that word (this
    // assessment, the guided Readiness assessment, and the CRA Readiness Kit), so
    // the bare cue silently swallowed the other two. Each now owns a phrase.
    cues: /\b(assess|assessment|get measured|measure me|measure my)\b/i,
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
    blurb: "The analyst desk — skills and signed artefacts. Needs an account; everything the Council measures is readable without one.",
    path: "/workbench",
    auth: "required",
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
  // ── the shipped products the rail does not have a pane for ──────────────
  // Each is a live route the OS frames with ?embed=1, so in-pane navigation
  // stays inside the workspace. GPAI Evidence and Embed are absent HERE on
  // purpose: the native Evidence pack / Embed kit panes own them, and each pane
  // opens its own explainer page. One destination, one owner.
  {
    label: "CRA Readiness Kit",
    blurb: "The Cyber Resilience Act reporting runbook — 24h, 72h, 14-day, as published.",
    path: "/cra-readiness",
    group: "product",
    cues: /\b(cra readiness|readiness kit|cyber resilience|cra)\b/i,
  },
  {
    label: "Financial axes",
    blurb: "The financial slots of the canon — what is UNMEASURED is stated first.",
    path: "/financial-axes",
    group: "product",
    cues: /\b(financial axes|financial|finance)\b/i,
  },
  {
    label: "Distribution integrity",
    blurb: "Represented is not distributed — the published distinction, and how it is measured.",
    path: "/distribution-integrity",
    group: "product",
    cues: /\b(distribution integrity|distribution|represented)\b/i,
  },
  {
    label: "Legacy on-ramp",
    blurb: "The enterprise on-ramp from legacy systems to signed measurement evidence.",
    path: "/cobolbridge",
    group: "product",
    cues: /\b(legacy on[- ]?ramp|mainframe|cobol)\b/i,
  },
  // ── the audience doors ─────────────────────────────────────────────────
  // These were a hard-coded array inside LobbyHome, where "Enterprises" pointed
  // at /assess — a tile promising an audience page and delivering the assessment
  // form the Get-measured tab already owns. They are real routes now, each at its
  // own page, and the duplicate is gone.
  {
    label: "Regulators",
    blurb: "The regulator door — every verification free, forever, with no account.",
    path: "/regulators",
    group: "audience",
    cues: /\b(regulator door|regulators?)\b/i,
  },
  {
    label: "Insurers",
    blurb: "Pricing AI risk on signed evidence — what an underwriter is actually handed.",
    path: "/insurers",
    group: "audience",
    cues: /\b(underwrit\w*|insurance|insurers?)\b/i,
  },
  {
    label: "Enterprise",
    blurb: "The enterprise door. The assessment itself lives on the Get-measured pane.",
    path: "/enterprise",
    group: "audience",
    cues: /\b(enterprises?)\b/i,
  },
  {
    label: "Government",
    blurb: "The public-sector door, as published.",
    path: "/government",
    group: "audience",
    cues: /\b(public sector|government)\b/i,
  },
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
  // /honesty is NOT listed here. It was a second door onto the same page under
  // the same label as the Honesty-gate rail tab — the duplicate destination the
  // OS audit flagged. The tab owns it.
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

/**
 * THE MOST SPECIFIC DESTINATION WINS.
 *
 * Both matchers used to take the FIRST entry in array order whose cue matched,
 * which made the answer depend on list position rather than on what the reader
 * said. "show the financial axes" hit the Live-board tab, because its cue carries
 * a bare `axes` and the board happens to sit near the top of the rail. So the
 * reader asked for one destination by name and silently got another.
 *
 * The rule now: score every candidate by HOW MUCH OF THE SENTENCE its cue
 * matched, and let the longest literal match win — across tabs and routes
 * together, since they are one destination space. "financial axes" (15 chars)
 * beats "axes" (4). Nothing is guessed: a sentence no cue matches still returns
 * null, exactly as before.
 */
function bestCue<T extends { cues: RegExp }>(items: T[], t: string): { item: T; len: number } | null {
  let item: T | null = null;
  let len = 0;
  for (const c of items) {
    const m = t.match(c.cues);
    if (m && m[0].length > len) {
      item = c;
      len = m[0].length;
    }
  }
  return item ? { item, len } : null;
}

/** Deterministic phrase -> tab. Returns null when nothing matches; never guesses. */
export function matchTab(text: string): LobbyTab | null {
  const t = text.trim();
  if (!t || !isNavCommand(t)) return null;
  const tab = bestCue(LOBBY_TABS, t);
  if (!tab) return null;
  const route = bestCue(LOBBY_ROUTES, t);
  // A route that matched MORE of the sentence names itself more precisely than
  // this tab does — defer, and let matchRoute answer.
  if (route && route.len > tab.len) return null;
  return tab.item;
}

/** Deterministic phrase -> a Home-desktop route (not a rail tab). */
export function matchRoute(text: string): LobbyRoute | null {
  const t = text.trim();
  if (!t || !isNavCommand(t)) return null;
  const route = bestCue(LOBBY_ROUTES, t);
  if (!route) return null;
  const tab = bestCue(LOBBY_TABS, t);
  // Ties go to the rail tab: it is the surface with a permanent home.
  if (tab && tab.len >= route.len) return null;
  return route.item;
}

export function routesIn(group: LobbyRouteGroup): LobbyRoute[] {
  return LOBBY_ROUTES.filter((r) => r.group === group);
}

/**
 * The OS destinations that have a standalone URL — the DSH sidebar links to
 * `tab.path`, so a pane with no page of its own (Home, Play, and the native
 * workflow panes, which carry `path: ""`) cannot appear there. That is honest:
 * they exist only inside the OS. Software is excluded because it IS this surface.
 */
export function isDashboardTab(t: LobbyTab): boolean {
  return Boolean(t.path) && t.id !== "play" && t.id !== "software" && t.id !== "home";
}

export const DASHBOARD_TABS: LobbyTab[] = LOBBY_TABS.filter(isDashboardTab);
