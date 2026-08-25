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
  { id: "insurer", label: "Insurer", who: "Underwriting and risk on AI systems." },
  { id: "regulator", label: "Regulator", who: "Supervisory and policy readers." },
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
    "What does the assessment actually run, and what does it explicitly not claim?",
    "Which axes have a published bank I can reproduce, and where do the items live?",
    "What models are published on the living board, and which cells are still empty?",
  ],
  compliance: [
    "Which EU AI Act provisions are crosswalked, and what is the frozen text they were measured against?",
    "What does the published regulation feed say is in force today versus deferred?",
    "Which axes are measured today, and which carry no number at all?",
    "What is the difference between measuring a system and certifying it?",
  ],
  procurement: [
    "Walk me through the board — which axes carry a measured figure?",
    "How would I check a supplier's claim against the published board myself?",
    "What is published about the method — deterministic grading, gold labels, minimum n?",
    "Which figures are the Council's own measurement and which are reported third-party context?",
  ],
  board: [
    "What is the one-paragraph summary of what is measured and what is not?",
    "Where is the corrections ledger, and what has the Council got wrong so far?",
    "How many axes are measured of the quotable set right now?",
    "How do we get measured, and what does the result actually say?",
  ],
  researcher: [
    "Why is nothing quoted below n >= 30, and what happens under it?",
    "What does a TIE mean on the board, and how is separation tested?",
    "How are unparseable responses counted, and why are they not dropped?",
    "Which axis banks are public, and under what licence?",
  ],
  press: [
    "Which figures on the board are safe to quote today, and which are not?",
    "Where is the corrections ledger, and what has the Council got wrong so far?",
    "What is the difference between measuring a system and certifying it?",
    "In plain words, who measures these numbers, and what do they refuse to decide?",
  ],
  insurer: [
    "Which board figures are safe to underwrite on today, and which cells are explicitly empty?",
    "How is a measurement card signed, and how do I verify one offline?",
    "What does the Council publish about bias, explainability, and oversight evidence?",
    "What is reported third-party context versus the Council's own measurement?",
  ],
  regulator: [
    "Which frameworks are crosswalked to frozen statute, and where is the text published?",
    "What does a published measurement card attest, and what does it explicitly not decide?",
    "What is in the corrections ledger, and how are refutations handled?",
    "What is the difference between measuring and certifying, for supervisory readers?",
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
    test: /^\/(assess|readiness-assessment)/,
    asks: [
      "What does the assessment actually run, and what does the result attest?",
      "What does a completed assessment explicitly NOT say about my system?",
    ],
  },
  {
    test: /^\/(watchdog|report)/,
    asks: ["What happens to a watchdog incident after it is reported, and who sees it?"],
  },
  {
    test: /^\/models/,
    asks: [
      "Which axes are measured on the live board, and who leads where?",
      "How many axes are measured of the quotable set right now?",
    ],
  },
  {
    test: /^\/tools/,
    asks: [
      "What MCP servers are in the published fleet, and what is not a marketplace listing?",
      "How do I connect a published tool without treating it as a certificate?",
    ],
  },
  {
    test: /^\/dashboard/,
    asks: [
      "How many axes are measured of the quotable set right now?",
      "Where do these dashboard numbers come from — what does GET /api/gspc publish?",
    ],
  },
  {
    test: /^\/compare/,
    asks: [
      "What is the difference between measurement and certification on this page?",
      "What can procurement rely on in a published measurement, and what is out of scope?",
    ],
  },
  {
    test: /^\/layer0/,
    asks: [
      "How is Layer 0 signed and verified — what is the public key and hash chain?",
      "What does Layer 0 publish that downstream measurement depends on?",
    ],
  },
  {
    test: /^\/for\//,
    asks: [
      "What is published for this sector — frameworks named, evidence signed, and gaps left empty?",
      "What should this audience do first for AI governance with signed evidence?",
    ],
  },
  {
    test: /^\/pricing|^\/plans/,
    asks: [
      "What is published about plans and pricing — what is measured, what is free?",
      "What is explicitly not promised in the published pricing material?",
    ],
  },
  {
    test: /^\/honesty/,
    asks: [
      "What does the honesty page publish about corrections and refusals?",
      "What has the Council got wrong so far, and where is it recorded?",
    ],
  },
  {
    test: /^\/library/,
    asks: [
      "What is published in the library about the measurement method and reproducibility?",
      "Which materials are under an open licence I can cite?",
    ],
  },
  {
    test: /^\/regulators/,
    asks: [
      "What is published for regulators — crosswalks and frozen provisions?",
      "What does the Council refuse to certify or decide for supervisory readers?",
    ],
  },
  {
    test: /^\/insurers/,
    asks: [
      "What on the live board is safe for an insurer to rely on today?",
      "Which cells are explicitly empty and must not be underwritten?",
    ],
  },
  {
    test: /^\/benchmarks/,
    asks: [
      "Which measured results on this page name a published artefact, and which are empty?",
      "What does a loss on this page mean, and where is it recorded?",
    ],
  },
  {
    test: /^\/instrument/,
    asks: [
      "What do the four lenses actually run, and what stays out of the verdict path?",
      "How does the instrument differ from the living board?",
    ],
  },
  {
    test: /^\/workbench/,
    asks: [
      "What can the workbench run today, and what does it explicitly not certify?",
      "Which artefacts on this desk are signed, and how do I verify one?",
    ],
  },
  {
    test: /^\/system-card/,
    asks: [
      "What does the system card attest, and what does it refuse to certify?",
      "How do I verify this card offline against the published key?",
    ],
  },
  {
    test: /^\/feed/,
    asks: [
      "What does the published regulation feed say moved, and what is its source?",
      "Which recorded deltas are in force versus deferred?",
    ],
  },
  {
    test: /^\/crosswalk/,
    asks: [
      "What does this crosswalk map, and why is it not a signed score?",
      "Which frameworks are named here, and which cells stay empty?",
    ],
  },
  {
    test: /^\/(mcp-fleet|mcp$)/,
    asks: [
      "What MCP servers are published here, and how do I connect one without treating it as a certificate?",
      "Where does the live count come from, and what is not a marketplace listing?",
    ],
  },
  {
    test: /^\/(start|enterprise)/,
    asks: [
      "What does enterprise measurement actually run, and what does the result attest?",
      "What does a completed assessment explicitly NOT say about our system?",
    ],
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
