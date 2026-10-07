/**
 * asks — the demographic + route question registry that feeds the lobby's chat bar.
 *
 * WHY THIS FILE EXISTS HERE. The brief for this redesign expected
 * `client/src/lib/askRegistry.ts` (`asksFor(pathname, audience)`, `AUDIENCES`) to
 * already be on master. It is not — `git log --all -S askRegistry` finds nothing.
 * Rather than ship an empty suggestion strip, this is a local stand-in with the
 * SAME public shape, living in the folder this change owns. If the shared
 * registry lands later, delete this file and re-point the two imports in
 * LobbyComposer.tsx; no other call site knows about it.
 *
 * GRAMMAR (binding, inherited from client/src/lib/lobbyLink.ts). Every question
 * here is a request for PUBLISHED material — never a prompt that implies a live
 * expert is standing by, and never a request for a compliance verdict.
 *
 * ANSWERABLE, OR NOT OFFERED (tools audit, 6 Oct 2026). Every suggestion must be
 * one the deterministic router (functions/_lib/talkRouter.ts routeIntent) maps
 * onto a tool, in plain words. Most of the old ones ("which EU AI Act provisions
 * are crosswalked…", "how many axis are measured of the quotable set…") answered
 * "I could not match that question to a tool". None may start with a pane command
 * ("show …", "open …"), or the composer opens a pane instead of asking.
 * asks.test.ts runs every suggestion through routeIntent and the pane matcher.
 *
 * CONSENT LOCK. Nothing in this file sends anything. A selected question is
 * typed into the input and focused. The send is always the user's.
 */

export interface Audience {
  id: string;
  /** Chip label. */
  label: string;
  /** One line, shown to explain who the chip is for. */
  who: string;
}

/** The demographic segments the suggestions are cut by. */
export const AUDIENCES: Audience[] = [
  { id: "public", label: "Curious public", who: "No prior knowledge assumed." },
  { id: "builder", label: "Builder", who: "Engineers shipping an AI system." },
  { id: "insurer", label: "Insurer", who: "Underwriting and risk on AI systems." },
  { id: "regulator", label: "Regulator", who: "Supervisory and policy readers." },
  { id: "compliance", label: "Compliance & legal", who: "Counsel, DPOs, risk teams." },
  { id: "procurement", label: "Procurement", who: "Buyers assessing a vendor." },
  { id: "board", label: "Board & exec", who: "Accountable officers." },
  { id: "researcher", label: "Researcher", who: "Reading the method and the n." },
  { id: "press", label: "Press", who: "Checking a claim before quoting it." },
];

export const DEFAULT_AUDIENCE = "public";

/** Base questions per audience — asked anywhere on the site. ASK_COUNT below is
 *  derived from this object and the route table; no total is typed here, because
 *  the last one said "4 × 7 = 28" beside a list that had already grown past it.
 *  The comment after each names the tool routeIntent answers it with. */
const Q = {
  measure: "What does Council of AI measure?", // board_totals
  boardNow: "What does the board say right now?", // board_totals
  howMany: "How many tests on the board have results right now?", // board_totals
  which: "Which tests on the board have results?", // board_totals
  ties: "Which tests on the board ended in a tie?", // board_totals (separation line)
  wrong: "What has Council of AI got wrong so far? List the corrections.", // corrections_summary
  claims: "Which claims are under claim maintenance?", // claim_maintenance_register
  cards: "List the latest signed cards.", // list_cards
  root: "What does the signed public root contain?", // get_root
  index: "How many results are in the measurement index?", // measurement_index
  ourServer: "What is measured about councilof.ai/mcp?", // server_evidence
  github: "What is measured about github.com?", // server_evidence
  mcpCensus: "How many MCP servers answered a handshake?", // mcp_trust
  x402: "How many paid endpoints answered the x402 census?", // x402_trust
  art50: "What signed evidence is there for Article 50?", // evidence_bundle_preview
  art53: "What signed evidence is there for Article 53?", // evidence_bundle_preview
  dora: "What signed evidence is there for DORA?", // evidence_bundle_preview
  cra: "What signed evidence is there for the Cyber Resilience Act?", // evidence_bundle_preview
  safety: "How did the safety test measure?", // get_axis
  governance: "How did the governance test measure?", // get_axis
  conformance: "How did the conformance test measure?", // get_axis
  jail: "How did the jail (jailbreak) test measure?", // get_axis
  swarm: "How did the swarm test measure?", // get_axis
  reserve: "How did the reserve attestation test measure?", // get_axis
  custody: "How did the custody disclosure test measure?", // get_axis
} as const;

const BY_AUDIENCE: Record<string, string[]> = {
  public: [Q.measure, Q.howMany, Q.ties, Q.wrong],
  builder: [Q.ourServer, Q.cards, Q.conformance, Q.mcpCensus, Q.x402],
  compliance: [Q.art50, Q.dora, Q.cra, Q.governance],
  procurement: [Q.which, Q.github, Q.cards, Q.claims],
  board: [Q.boardNow, Q.wrong, Q.howMany, Q.claims],
  researcher: [Q.safety, Q.ties, Q.index, Q.jail],
  press: [Q.boardNow, Q.wrong, Q.ties, Q.root],
  // Underwriting AI risk: jailbreak and safety results first, then the financial-sector evidence
  // (tools audit retest, 6 Oct 2026: "Which tests have results?" was the same generic opener as
  // every other audience).
  insurer: [Q.jail, Q.safety, Q.dora, Q.reserve],
  regulator: [Q.art50, Q.governance, Q.wrong, Q.root],
};

/**
 * Route-specific questions, keyed by a path test. These lead, because the pane
 * the reader is looking at is the strongest signal of what they want. The total
 * is ASK_COUNT, derived at the bottom of this file — never typed in this comment,
 * which is where the last stale count lived.
 *
 * `asks` may be a FUNCTION of the path where the route carries a segment worth
 * naming (the `/for/:persona` doors), so a suggestion can say "for a regulator"
 * instead of "for this sector".
 */
const BY_ROUTE: { test: RegExp; asks: string[] | ((path: string) => string[]) }[] = [
  { test: /^\/(gspc-scoreboard|gspc|board)/, asks: ["Which tests on this board have results, and which ended in a tie?", Q.boardNow] },
  { test: /^\/gspc-verify/, asks: [Q.cards, Q.root] },
  { test: /^\/gspc-arena|^\/coliseum/, asks: [Q.ties, Q.swarm] },
  { test: /^\/(assess|readiness-assessment)/, asks: [Q.ourServer, Q.which] },
  { test: /^\/(watchdog|report)/, asks: [Q.wrong] },
  { test: /^\/models/, asks: [Q.howMany, Q.safety] },
  { test: /^\/tools/, asks: [Q.mcpCensus, Q.ourServer] },
  { test: /^\/dashboard/, asks: [Q.howMany, Q.boardNow] },
  { test: /^\/compare/, asks: ["Which tests on the board have a measurement right now?", Q.cards] },
  { test: /^\/layer0/, asks: [Q.root, Q.cards] },
  {
    // /for/:persona is a real route (App.tsx -> PersonaRouter) covering regulator,
    // enterprise, finance, healthcare, startup and sec-filer. The persona is read off
    // the path, so a regulator is not called "this sector".
    test: /^\/for\//,
    asks: (path) => {
      const seg = path.split("/").filter(Boolean)[1] ?? "";
      const who = seg ? seg.replace(/[-_]+/g, " ") : "this reader";
      return [`What is measured on the board for ${who}?`, Q.art50, Q.wrong];
    },
  },
  { test: /^\/pricing|^\/plans/, asks: [Q.x402, Q.ourServer] },
  { test: /^\/honesty/, asks: [Q.wrong, Q.claims] },
  { test: /^\/library/, asks: [Q.index, Q.cards] },
  { test: /^\/regulators/, asks: [Q.art50, Q.art53] },
  { test: /^\/insurers/, asks: [Q.which, Q.reserve] },
  { test: /^\/benchmarks/, asks: [Q.which, Q.ties] },
  { test: /^\/instrument/, asks: [Q.index, Q.boardNow] },
  { test: /^\/workbench/, asks: [Q.cards, Q.ourServer] },
  { test: /^\/dashboard\?tab=cards/, asks: [Q.cards, Q.root] },
  { test: /^\/dashboard\?tab=standards/, asks: [Q.dora, Q.cra] },
  { test: /^\/crosswalk/, asks: [Q.art50, Q.governance] },
  { test: /^\/(dashboard\?tab=tools|mcp$)/, asks: [Q.mcpCensus, Q.ourServer] },
  { test: /^\/(start|enterprise)/, asks: [Q.ourServer, Q.which] },
];

/**
 * The registry's one function. Route-specific questions first, then the
 * audience's base set, de-duplicated, capped.
 *
 * @param pathname the route the reader is looking at (the lobby passes the
 *                 active pane's path, which is what is actually on screen).
 * @param audience an id from AUDIENCES; anything unknown falls back to `public`.
 */
export function asksFor(pathname: string, audience: string, limit = 4): string[] {
  const path = (pathname || "/").split("?")[0];
  const rule = BY_ROUTE.find((r) => r.test.test(path));
  const route = !rule ? [] : typeof rule.asks === "function" ? rule.asks(path) : rule.asks;
  const base = BY_AUDIENCE[audience] ?? BY_AUDIENCE[DEFAULT_AUDIENCE];
  // Route questions lead, but the audience must always show through: with the
  // old [...route, ...base] order, any pane with `limit` route questions made the
  // audience chips a placebo — you could switch from Insurer to Regulator and the
  // list would not move. At most half the slots go to the route; the audience's
  // own questions take the rest, then any remaining route questions backfill.
  const routeLead = route.slice(0, Math.floor(limit / 2));
  const out: string[] = [];
  for (const q of [...routeLead, ...base, ...route]) {
    if (!out.includes(q)) out.push(q);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * The real doors that exist for an audience — a lobby chip may point at one, and
 * only at one that answers. /for/regulator is a live PersonaRouter page and
 * /insurers is a live route; no other audience has a door today, so no other
 * audience gets a link (an unmapped audience renders no door, not a dead one).
 */
export const AUDIENCE_DOORS: Record<string, { href: string; label: string }> = {
  regulator: { href: "/for/regulator", label: "Open the page for regulators" },
  insurer: { href: "/insurers", label: "See what insurers can rely on" },
};

/** Total questions in the registry — quoted in the UI, computed, never typed. */
export const ASK_COUNT =
  Object.values(BY_AUDIENCE).reduce((n, a) => n + a.length, 0) +
  BY_ROUTE.reduce((n, r) => n + (typeof r.asks === "function" ? r.asks("/for/regulator").length : r.asks.length), 0);

/** Every question the registry can suggest (persona doors expanded for each published persona),
 *  de-duplicated. asks.test.ts runs each through the router. */
export function allAsks(): string[] {
  const out = new Set<string>();
  for (const list of Object.values(BY_AUDIENCE)) list.forEach((q) => out.add(q));
  for (const r of BY_ROUTE) {
    const lists =
      typeof r.asks === "function"
        ? ["regulator", "enterprise", "finance", "healthcare", "startup", "sec-filer"].map((p) => (r.asks as (path: string) => string[])(`/for/${p}`))
        : [r.asks];
    for (const list of lists) list.forEach((q) => out.add(q));
  }
  return [...out];
}
