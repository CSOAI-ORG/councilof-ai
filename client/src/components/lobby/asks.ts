/**
 * asks — the demographic + route question registry that feeds the lobby's chat bar.
 *
 * WHY THIS FILE EXISTS HERE. The brief for this redesign expected
 * `client/src/lib/askRegistry.ts` (`asksFor(pathname, audience)`, `AUDIENCES`) to
 * already be on master. It is not — `git log --all -S askRegistry` finds nothing.
 * Rather than ship an empty suggestion strip, this is a local stand-in with the
 * SAME public shape, living in the folder this change owns. If the shared
 * registry lands later, delete this file and re-point the two imports in
 * LobbyChatBar.tsx; no other call site knows about it.
 *
 * GRAMMAR (binding, inherited from client/src/lib/lobbyLink.ts). Every question
 * here is a request for PUBLISHED material — "what does the board publish",
 * "which axes carry no number" — never a prompt that implies a live expert is
 * standing by, and never a request for a compliance verdict. The lobby's chat
 * bar is deterministic-first and refuses rather than improvises; the questions it
 * suggests have to be answerable in that world.
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
  { id: "compliance", label: "Compliance & legal", who: "Counsel, DPOs, risk teams." },
  { id: "procurement", label: "Procurement", who: "Buyers assessing a vendor." },
  { id: "board", label: "Board & exec", who: "Accountable officers." },
  { id: "researcher", label: "Researcher", who: "Reading the method and the n." },
  { id: "press", label: "Press", who: "Checking a claim before quoting it." },
];

export const DEFAULT_AUDIENCE = "public";

/** Base questions per audience — asked anywhere on the site. 4 × 7 = 28. */
const BY_AUDIENCE: Record<string, string[]> = {
  public: [
    "In plain words, what does the Council of AI actually measure?",
    "What does it mean when an axis is published with no number at all?",
    "Who checks the Council's own numbers, and what happens when one is wrong?",
    "What is the difference between measuring a system and certifying it?",
  ],
  builder: [
    "Which endpoints can my system call to read the published board, and what shape do they return?",
    "How is a measurement card signed, and how do I verify one without trusting you?",
    "What does an assessment run against my system, and what does it explicitly not claim?",
    "Which axes have a published bank I can reproduce, and where do the items live?",
  ],
  compliance: [
    "Which EU AI Act provisions are crosswalked, and what is the frozen text they were measured against?",
    "What does the published regulation feed say is in force today versus deferred?",
    "What is the penalty exposure recorded against each deadline, and what is its legal basis?",
    "What does the Council refuse to state an opinion on, and why?",
  ],
  procurement: [
    "What can I rely on in a published measurement, and what is explicitly out of scope?",
    "How would I check a supplier's claim against the published board myself?",
    "What is published about the method — deterministic grading, gold labels, minimum n?",
    "Which figures are the Council's own measurement and which are reported third-party context?",
  ],
  board: [
    "What is the one-paragraph summary of what is measured and what is not?",
    "Where is the corrections ledger, and what has the Council got wrong so far?",
    "What obligations land next, and which of them apply to a system like ours?",
    "What would it take to have our system measured, and what would the result actually say?",
  ],
  researcher: [
    "What is the minimum n for a quotable figure, and what happens below it?",
    "How is statistical separation tested, and what counts as a tie?",
    "How are unparseable responses counted, and why are they not dropped?",
    "Which axis banks are public, and under what licence?",
  ],
  press: [
    "Which figures on the board are safe to quote today, and which are not?",
    "What was the most recent published correction, and what caused it?",
    "What does the Council explicitly not claim about the systems it measures?",
    "Who publishes these numbers, and what is the legal entity behind them?",
  ],
};

/**
 * Route-specific questions, keyed by a path test. These lead, because the pane
 * the reader is looking at is the strongest signal of what they want. 11 here,
 * 28 above — 39 in the registry.
 */
const BY_ROUTE: { test: RegExp; asks: string[] }[] = [
  {
    test: /^\/(gspc-scoreboard|gspc|board)/,
    asks: [
      "Walk me through this board: which axes carry a measured figure and which carry none?",
      "What does a TIE mean on this board, and why is a point lead not an advantage?",
      "When was this board last measured, and what is the signature attached to it?",
    ],
  },
  {
    test: /^\/gspc-verify/,
    asks: [
      "Take me through verifying a card — recompute the hash, then check the Ed25519 signature.",
      "Where is the public key published, and how do I fetch it without trusting this page?",
    ],
  },
  {
    test: /^\/gspc-arena|^\/coliseum/,
    asks: [
      "How is a round in Council Space graded — what exactly is deterministic about it?",
      "What is published about the rounds so far, and what is not yet deployed?",
    ],
  },
  {
    test: /^\/assess/,
    asks: [
      "What does the assessment actually run, and what does the result attest?",
      "What does a completed assessment explicitly NOT say about my system?",
    ],
  },
  {
    test: /^\/watchdog/,
    asks: ["What happens to an incident after it is reported, and who sees it?"],
  },
  {
    test: /^\/academy/,
    asks: ["What does Council Academy attest on completion, and what does it explicitly not attest?"],
  },
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
  const route = BY_ROUTE.find((r) => r.test.test(path))?.asks ?? [];
  const base = BY_AUDIENCE[audience] ?? BY_AUDIENCE[DEFAULT_AUDIENCE];
  const out: string[] = [];
  for (const q of [...route, ...base]) {
    if (!out.includes(q)) out.push(q);
    if (out.length >= limit) break;
  }
  return out;
}

/** Total questions in the registry — quoted in the UI, computed, never typed. */
export const ASK_COUNT =
  Object.values(BY_AUDIENCE).reduce((n, a) => n + a.length, 0) +
  BY_ROUTE.reduce((n, r) => n + r.asks.length, 0);
