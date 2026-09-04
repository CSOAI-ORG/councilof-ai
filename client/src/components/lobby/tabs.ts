import { isUnframeable, pathBare } from "@/lib/unframeable";

/**
 * The Council Lobby's centre-pane destinations.
 *
 * Most entries point at a REAL route this app already serves. The lobby does not
 * reimplement any page — it frames the live one, so a page can never drift from
 * its lobby copy. `?embed=1` is appended by the centre pane. The framed app
 * honours it: site chrome is dropped and same-origin navigation stays inside
 * the pane (see client/src/lib/embed.ts).
 *
 * Home is `kind: "local"`: DashboardWorkspace owns the chat-first canvas, so it
 * must not iframe /os and nest the workspace inside itself.
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
  | "explore"
  | "board"
  | "matrix"
  | "results"
  | "models"
  | "fabric"
  | "tools"
  | "verify"
  | "cards"
  | "state"
  | "archive"
  | "attestations"
  | "evidence"
  | "embed"
  | "art50"
  | "standards"
  | "products"
  | "space"
  | "measured"
  | "harness"
  | "watchdog"
  | "claimguard"
  | "ras"
  | "library"
  | "workbench"
  | "software"
  | "learn"
  | "play";

export type LobbyTab = {
  id: LobbyTabId;
  label: string;
  /** One honest line about what the pane actually shows. */
  blurb: string;
  /** Same-origin route framed in the centre pane. Empty for `kind: "local"` / `native`. */
  path: string;
  /**
   * Existing page routes that should hand navigation to this native pane.
   * Aliases are navigation ownership only: they are never used as iframe src.
   */
  pathAliases?: string[];
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

export type LobbyRouteGroup =
  "product" | "audience" | "record" | "receipts" | "analyst";

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
    label: "Conversation",
    blurb:
      "Chat-first Council of AI workspace — ask, inspect evidence, and open tools without leaving the thread.",
    path: "",
    kind: "local",
    cues: /\b(home|hub|launcher|start|lobby home|council os|the os|ag[- ]?ui|chat)\b/i,
  },
  {
    id: "learn",
    label: "Learning arena",
    blurb:
      "Human-guided learning across every canonical GSPC axis: learn, play, explain, propose a fix, then require human review.",
    path: "",
    kind: "native",
    accent: "gold",
    cues: /\b(learn|learning|training arena|mooc|coach|learning path|fix lab)\b/i,
  },
  {
    id: "explore",
    label: "All tools",
    blurb:
      "The deduplicated master catalogue: workflows, current pages, industries and the dated library.",
    path: "",
    kind: "native",
    cues: /\b(all tools|everything|master catalogue|master catalog|all pages|find a tool|tool catalogue)\b/i,
  },
  {
    id: "board",
    label: "GSPC board",
    blurb:
      "The living GSPC board — every published axis, and in-lane beside it.",
    path: "/gspc-scoreboard",
    kind: "native",
    cues: /\b(board|scoreboard|score|axes|axis|gspc|leaderboard)\b/i,
  },
  {
    id: "matrix",
    label: "Regulation matrix",
    blurb:
      "Industry × regulation grid — living data from GET /api/gspc. Printer of the board, not a simulation.",
    path: "",
    kind: "native",
    cues: /\b(matrix|industry|sector|regulation|crosswalk|east.?west|compliance grid)\b/i,
  },
  {
    id: "results",
    label: "Benchmark results",
    blurb:
      "The canonical living GSPC board — current measurements, fact runs and withheld leaders from the same native source as the main board.",
    path: "",
    pathAliases: ["/benchmarks"],
    kind: "native",
    cues: /\b(benchmarkers?|benchmarks?|results|artefacts?|artifacts?|meta[- ]?benchmark)\b/i,
  },
  {
    id: "models",
    label: "Model registry",
    blurb:
      "The measured-axis grid from the live board — per-axis leaders where separation is measured, honest gaps where it is not.",
    path: "/models",
    cues: /\b(models?|model registry)\b/i,
  },
  {
    id: "fabric",
    label: "Connections",
    blurb:
      "The governed capability fabric — observed MCP, A2A, AG-UI, provider, compute, regulation and witness rails, with missing adapters kept explicit.",
    path: "",
    kind: "native",
    cues: /\b(connections?|capability fabric|protocol fabric|integrations?|ecosystem|provider router|a2a|a2ui|runpod|hugging face|oracle)\b/i,
  },
  {
    id: "tools",
    label: "MCP tools",
    blurb:
      "Published tooling and MCP servers — connect, run, verify. Not a marketplace.",
    path: "/tools",
    cues: /\b(tools?|tooling|tool commons|mcp tools)\b/i,
  },
  {
    id: "verify",
    label: "Verify a card",
    blurb:
      "Recompute a record's hash and check its Ed25519 signature in your browser.",
    path: "/gspc-verify",
    kind: "native",
    cues: /\b(verify|verifier|verification|signature|signed|check a (?:card|record)|hash)\b/i,
  },
  {
    id: "cards",
    label: "Signed cards",
    blurb:
      "Every card the published index declares — fetch one and check its hash and signature here.",
    path: "",
    kind: "native",
    cues: /\b(signed cards?|card index|published cards?|browse cards?|measurement cards?)\b/i,
  },
  {
    id: "state",
    label: "Estate state",
    blurb:
      "Every count the estate publishes, each with the kind that produced it and the date it was read from.",
    path: "",
    kind: "native",
    cues: /\b(estate state|state endpoint|which number|counts?|how many (?:of )?(?:everything|things)|derived state|api\/state)\b/i,
  },
  {
    id: "archive",
    label: "Provable archive",
    blurb:
      "The hourly signed history of on-chain permission-state leaves — each entry names its root, inclusion proof and third-party witnesses. Point-in-time. Not a rate.",
    path: "",
    kind: "native",
    cues: /\b(provable archive|permission[- ]state|permission[- ]events?|archive index|evm archive|signed history|eip[- ]?1186|getproof|proof of state)\b/i,
  },
  {
    id: "attestations",
    label: "Attestations",
    blurb:
      "The one signed root and its witnesses — Rekor, OpenTimestamps, EAS, XRPL — each state printed as the sidecar wrote it, plus the corrections ledger.",
    path: "",
    kind: "native",
    cues: /\b(attestations?|witness(?:es|ed)?|rekor|open\s?timestamps|\.ots|merkle|public root|root\.json|inclusion proofs?|corrections? ledger|corrections)\b/i,
  },
  {
    id: "evidence",
    label: "Evidence pack",
    blurb:
      "Compile the evidence index for one system — live rows, resolvable banks, omissions named.",
    path: "",
    kind: "native",
    cues: /\b(gpai evidence pack|evidence index|evidence pack|gpai evidence|gpai)\b/i,
  },
  {
    id: "embed",
    label: "Embed kit",
    blurb:
      "Build the white-label badge or the self-verifying card from what is actually on the board.",
    path: "",
    kind: "native",
    cues: /\b(white[- ]?label|embed kit|snippet|badge|embed)\b/i,
  },
  {
    id: "art50",
    label: "Article 50 marking evidence",
    blurb:
      "Measure whether one generative output carries a detectable machine-readable mark — C2PA recomputed by bytes, watermarks named UNCHECKABLE — and commission the signed pack.",
    path: "",
    kind: "native",
    cues: /\b(article ?50|art\.? ?50|marking evidence|content credentials|c2pa|watermark(?:s|ing)?)\b/i,
  },
  {
    id: "standards",
    label: "Standards Lab",
    blurb:
      "Framework and receipt-format mappings kept separate from GSPC measurements and legal verdicts.",
    path: "",
    kind: "native",
    cues: /\b(standards? lab|standards? mapping|owasp agentic|owasp mcp|scitt|microsoft agent safety)\b/i,
  },
  {
    id: "products",
    label: "Products",
    blurb:
      "The shipped product family, as published — what each one measures and what it will not claim.",
    path: "/products",
    cues: /\b(product family|catalogue|catalog|products?)\b/i,
  },
  {
    id: "harness",
    label: "Measurement harness",
    blurb:
      "The measurement machinery itself — how a run becomes a signed card, and which capabilities are not yet available.",
    path: "/harness",
    cues: /\b(harness|measurement harness|how (it|this) is measured|card factory|instrumentation)\b/i,
  },
  {
    id: "space",
    label: "Council Space",
    blurb:
      "The governed arena — rounds graded deterministically, never by a model jury.",
    path: "/gspc-arena",
    cues: /\b(arena|space|council space|rounds|match|towns|globe)\b/i,
  },
  {
    id: "measured",
    label: "Request attestation",
    blurb:
      "RAS intake: describe a system and request a scoped measurement whose admitted output can become a signed attestation.",
    path: "/assess",
    // NOT a bare "readiness": three destinations answer to that word (this
    // assessment, the guided Readiness assessment, and the CRA Readiness Kit), so
    // the bare cue silently swallowed the other two. Each now owns a phrase.
    cues: /\b(assess|assessment|get measured|measure me|measure my)\b|\b(ras|readiness assessment|booking|human.?rail)\b/i,
  },
  {
    id: "watchdog",
    label: "Watchdog evidence",
    blurb:
      "Read the current public Watchdog material. Durable report filing and signed acknowledgements are not live yet.",
    path: "/watchdog-hub",
    cues: /\b(watchdog|incident|report(?:ed)?|complaint|heat.?map)\b/i,
  },
  {
    id: "claimguard",
    label: "Honesty gate",
    blurb:
      "Where our own systems lose our own arena — the ladder, published. Measurement, never a badge.",
    path: "/honesty",
    cues: /\b(honesty|honest|claimguard|claim.?guard|claim check|verify claim|ladder)\b/i,
  },
  {
    id: "library",
    label: "Library",
    blurb:
      "The dated archive — every published page, by sector. Library, don't delete.",
    path: "/library",
    cues: /\b(library|archive|the archive)\b/i,
  },
  {
    id: "workbench",
    label: "Workbench",
    blurb:
      "The analyst desk — skills and signed artefacts. Needs an account; everything the Council measures is readable without one.",
    path: "/workbench",
    auth: "required",
    cues: /\b(workbench|analyst desk|skills palette)\b/i,
  },
  {
    id: "software",
    label: "Software",
    blurb:
      "Signed-in dashboard (DSH) — opens as its own page, not an iframe inside /os.",
    path: "/dashboard",
    cues: /\b(dashboard|software|dsh|signed[- ]in)\b/i,
  },
  {
    id: "play",
    label: "Play gallery",
    blurb:
      "Arena previews with honest in-build labels — measurement surfaces, not live multiplayer yet.",
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
    blurb:
      "The Cyber Resilience Act reporting runbook — 24h, 72h, 14-day, as published.",
    path: "/cra-readiness",
    group: "product",
    cues: /\b(cra readiness|readiness kit|cyber resilience|cra)\b/i,
  },
  {
    label: "Financial axis",
    blurb:
      "The financial slots of the canon — what is UNMEASURED is stated first.",
    path: "/financial-axes",
    group: "product",
    cues: /\b(financial axes|financial|finance)\b/i,
  },
  {
    label: "Distribution integrity",
    blurb:
      "Represented is not distributed — the published distinction, and how it is measured.",
    path: "/distribution-integrity",
    group: "product",
    cues: /\b(distribution integrity|distribution|represented)\b/i,
  },
  {
    label: "Legacy on-ramp",
    blurb:
      "In build — COBOL lineage toward signed evidence. Apex 522. SPEC only.",
    path: "/cobolbridge",
    group: "product",
    cues: /\b(legacy on[- ]?ramp|mainframe|cobol)\b/i,
  },
  // ── the audience doors ─────────────────────────────────────────────────
  // These were once a hard-coded home array, where "Enterprises" pointed
  // at /assess — a tile promising an audience page and delivering the assessment
  // form the Get-measured tab already owns. They are real routes now, each at its
  // own page, and the duplicate is gone.
  {
    label: "Regulators",
    blurb:
      "The regulator door — every verification free, forever, with no account.",
    path: "/regulators",
    group: "audience",
    cues: /\b(regulator door|regulators?)\b/i,
  },
  {
    label: "Insurers",
    blurb:
      "Pricing AI risk on signed evidence — what an underwriter is actually handed.",
    path: "/insurers",
    group: "audience",
    cues: /\b(underwrit\w*|insurance|insurers?)\b/i,
  },
  {
    label: "Enterprise",
    blurb:
      "The enterprise door. The assessment itself lives on the Get-measured pane.",
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
    label: "Signed cards",
    blurb:
      "Browse published card records and open the family-aware verifier.",
    path: "/dashboard?tab=cards",
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
    label: "Rating the raters",
    blurb:
      "The same deterministic predicates turned on the benchmarks themselves — including ours.",
    path: "/rating-the-raters",
    group: "analyst",
    cues: /\b(rating the raters?|rate the raters?|who rates)\b/i,
  },
  {
    label: "First-Fine Watch",
    blurb:
      "Signed coverage of the public AI enforcement record. REPORTED public record, never our own measurement.",
    path: "/first-fine-watch",
    group: "analyst",
    cues: /\b(first[- ]?fine|enforcement record|fines?|penalt\w*)\b/i,
  },
  {
    label: "Signed registers",
    blurb: "The published registers behind the specialist and coverage feeds.",
    path: "/registers",
    group: "record",
    cues: /\b(registers?|specialist feed|signed register)\b/i,
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
    label: "Tools",
    blurb: "Inspect published tool descriptions and runtime availability separately.",
    path: "/dashboard?tab=tools",
    group: "analyst",
    cues: /\b(mcp fleet|fleet manifest)\b/i,
  },
  {
    label: "MCP registry",
    blurb:
      "Named MCP servers as published. /mcp is the protocol proxy; this is the human registry.",
    path: "/mcps",
    group: "analyst",
    cues: /\b(mcp registry|mcp servers|browse mcp)\b/i,
  },
  {
    label: "Crosswalk",
    blurb:
      "An indicative map of frameworks onto frozen statute — not a signed score.",
    path: "/crosswalk",
    group: "analyst",
    cues: /\b(crosswalk)\b/i,
  },
  {
    label: "Regulation data",
    blurb: "Open the standards pane; current machine data comes from GET /api/regulation.",
    path: "/dashboard?tab=standards",
    group: "analyst",
    cues: /\b(regulation feed|reg feed)\b/i,
  },
];

/**
 * Marketing / DSH destinations `go()` and `loadPane` open as a full page.
 * The unframeable set (client/src/lib/unframeable.ts) is the breakout list —
 * OS chrome aliases, demo shells, `/dashboard`. SITE_DOORS are only pages
 * which must never be framed. Products and honesty are dashboard tools and
 * therefore use the shared `embed=1` chrome contract.
 */
export const SITE_DOORS = ["/", "/os", "/dashboard", "/pricing"] as const;

export function isSiteDoor(path: string): boolean {
  const bare = path.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  return (SITE_DOORS as readonly string[]).includes(bare);
}

/** Left rail of Council OS: instruments + Home + Play. Not the sitemap. */
export const OS_RAIL_IDS: LobbyTabId[] = [
  "home",
  "board",
  "verify",
  "cards",
  "evidence",
  "embed",
  "play",
];

export function isOsRailTab(id: LobbyTabId): boolean {
  return OS_RAIL_IDS.includes(id);
}

export const OS_RAIL_TABS: LobbyTab[] = LOBBY_TABS.filter((t) =>
  isOsRailTab(t.id),
);

/** Document pages that may still iframe. Everything else opens as a normal page. */
export const DOCUMENT_FRAMES = [
  "/library",
  "/methodology",
  "/cra-readiness",
] as const;

export function isDocumentFrame(path: string): boolean {
  const bare = path.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  return (DOCUMENT_FRAMES as readonly string[]).includes(bare);
}

/**
 * Overlay centre-pane loader. Native tabs never call this. Everything else
 * either leaves the workspace or (documents only) iframes. Unframeable paths
 * (`/`, `/os`, `/dashboard`, OS chrome aliases) are always navigate — never
 * an iframe src. Software is `/dashboard` → full page.
 */
export type PaneLoad =
  { action: "navigate"; path: string } | { action: "iframe"; path: string };

export function paneLoadFor(path: string): PaneLoad {
  if (isUnframeable(path) || isSiteDoor(path) || !isDocumentFrame(path)) {
    return { action: "navigate", path };
  }
  return { action: "iframe", path };
}

export const DEFAULT_TAB: LobbyTabId = "board";

export function tabById(id: LobbyTabId): LobbyTab {
  return LOBBY_TABS.find((t) => t.id === id) ?? LOBBY_TABS[0];
}

/** Software is DSH — a full page, never a framed `/dashboard`. */
export const SOFTWARE_HREF = "/dashboard";

export function softwareLeavesOs(t: Pick<LobbyTab, "id" | "path">): boolean {
  return (
    t.id === "software" || (t.path ? pathBare(t.path) === SOFTWARE_HREF : false)
  );
}

/**
 * Only treat an utterance as navigation when it starts like a command.
 *
 * A loose word search made ordinary questions such as “What does the safety
 * measurement show?” jump to Council Space instead of reaching the chat
 * endpoint. These prefixes cover direct, polite and first-person requests,
 * while leaving descriptive questions alone.
 */
export function isExplicitNavigationCommand(text: string): boolean {
  const command =
    "(?:show(?:\\s+me)?|open|go(?:\\s+to)?|take\\s+me(?:\\s+to)?|switch(?:\\s+to)?|jump(?:\\s+to)?|load|view|bring\\s+up|let\\s+me(?:\\s+(?:see|view|open))?|enter|verify|check|get\\s+measured|measure\\s+(?:me|my))";
  const direct = new RegExp(`^(?:please\\s+)?${command}\\b`, "i");
  const polite = new RegExp(
    `^(?:can|could|would|will)\\s+you\\s+(?:please\\s+)?${command}\\b`,
    "i",
  );
  const firstPerson = new RegExp(
    `^i(?:\\s+would|'d)?\\s+(?:like|want)\\s+to\\s+${command}\\b`,
    "i",
  );
  const t = text.trim();
  return direct.test(t) || polite.test(t) || firstPerson.test(t);
}

/**
 * THE MOST SPECIFIC DESTINATION WINS.
 *
 * Both matchers used to take the FIRST entry in array order whose cue matched,
 * which made the answer depend on list position rather than on what the reader
 * said. "show the financial axis" hit the Live-board tab, because its cue carries
 * a bare `axis` and the board happens to sit near the top of the rail. So the
 * reader asked for one destination by name and silently got another.
 *
 * The rule now: score every candidate by HOW MUCH OF THE SENTENCE its cue
 * matched, and let the longest literal match win — across tabs and routes
 * together, since they are one destination space. "financial axis" (15 chars)
 * beats "axis" (4). Nothing is guessed: a sentence no cue matches still returns
 * null, exactly as before.
 */
function bestCue<T extends { cues: RegExp }>(
  items: T[],
  t: string,
): { item: T; len: number } | null {
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
  if (!t || !isExplicitNavigationCommand(t)) return null;
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
  if (!t || !isExplicitNavigationCommand(t)) return null;
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
export type DashboardNavGroupId =
  "start" | "work" | "govern";

export type DashboardNavGroup = {
  id: DashboardNavGroupId;
  label: string;
  tabs: LobbyTab[];
};

const DASHBOARD_NAV_DEFINITION: {
  id: DashboardNavGroupId;
  label: string;
  tabs: { id: LobbyTabId; label: string }[];
}[] = [
  {
    id: "start",
    label: "Start",
    tabs: [
      { id: "home", label: "Ask" },
      { id: "measured", label: "Requests" },
      { id: "verify", label: "Verify" },
    ],
  },
  {
    id: "work",
    label: "Work",
    tabs: [
      { id: "board", label: "GSPC board" },
      { id: "evidence", label: "Evidence" },
      { id: "tools", label: "Improve" },
      { id: "learn", label: "Learning" },
      { id: "watchdog", label: "Watchdog" },
    ],
  },
  {
    id: "govern",
    label: "Govern",
    tabs: [
      { id: "standards", label: "Standards" },
      { id: "fabric", label: "Connections" },
    ],
  },
];

export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] =
  DASHBOARD_NAV_DEFINITION.map((group) => ({
    id: group.id,
    label: group.label,
    tabs: group.tabs
      .map(({ id, label }) => {
        const tab = LOBBY_TABS.find((candidate) => candidate.id === id);
        return tab ? { ...tab, label } : null;
      })
      .filter((tab): tab is LobbyTab => Boolean(tab)),
  }));

/** The intentionally small permanent rail. Every other destination remains in All tools. */
export const DASHBOARD_TABS: LobbyTab[] = DASHBOARD_NAV_GROUPS.flatMap(
  (group) => group.tabs,
);

export function isDashboardTab(tab: LobbyTab): boolean {
  return DASHBOARD_TABS.some((candidate) => candidate.id === tab.id);
}

const DASHBOARD_HIDDEN_GROUPS: Record<string, DashboardNavGroupId> = {
  archive: "work",
  state: "work",
  embed: "work",
  cards: "work",
  attestations: "work",
  claimguard: "work",
  results: "work",
  models: "work",
  matrix: "govern",
  art50: "govern",
  leaderboard: "work",
  ras: "work",
  terminal: "work",
  console: "work",
  harness: "work",
  space: "work",
  play: "work",
  explore: "work",
  products: "work",
  library: "work",
  workbench: "work",
};

export function dashboardNavGroupOf(id: string): DashboardNavGroup | null {
  const direct = DASHBOARD_NAV_GROUPS.find((group) =>
    group.tabs.some((tab) => tab.id === id),
  );
  if (direct) return direct;
  const hidden = DASHBOARD_HIDDEN_GROUPS[id as LobbyTabId];
  return hidden
    ? DASHBOARD_NAV_GROUPS.find((group) => group.id === hidden) || null
    : null;
}

/** One compatibility choke point for old launcher and edge redirect vocabulary. */
export function normalizeLobbyTabId(id: string): string {
  const value = id.trim().toLowerCase();
  const aliases: Record<string, string> = {
    assess: "measured",
    assessment: "measured",
    "get-measured": "measured",
    ras: "measured",
    rankings: "leaderboard",
    scoreboard: "board",
    chat: "home",
    "ag-ui": "home",
  };
  return aliases[value] || value || "home";
}
