/**
 * uiTools — the AG-UI FRONTEND tools of Ask GSPC ("watch mode"), and the deterministic planner
 * that chooses them. Shared by the server (functions/_lib/aguiRun.ts emits the calls) and the
 * browser (client/src/lib/uiActions.ts executes them), so the two cannot disagree on a name.
 *
 * AG-UI (docs.ag-ui.com/concepts/tools): a client declares the tools it can run in
 * RunAgentInput.tools ({name, description, parameters}); the agent calls one with
 * TOOL_CALL_START / TOOL_CALL_ARGS / TOOL_CALL_END; the client runs it and returns the result as a
 * {role:"tool", toolCallId, content} message in the next run. Plan state travels as STATE_SNAPSHOT
 * and STATE_DELTA (RFC 6902 JSON Patch) under /watch.
 *
 * WHAT DECIDES THE STEPS. planUi() is keyword and entity matching over the question and the page
 * the reader is on. No model is in the path (Article 50: this is a rule-based surface; see
 * client/src/lib/ai-surfaces.ts). It moves the page; it never states a number. Numbers come only
 * from the data tools (talkRouter) and their signed records.
 *
 * WHAT NEVER RUNS WITHOUT A CLICK. A step whose effect is commit, pay or schedule carries
 * confirm: true. The browser stops at a visible Confirm before it; a headless caller is told the
 * same in the step's args. No step pays, signs or submits by itself.
 */

type Json = Record<string, unknown>;

export type FrontendToolName =
  | "navigate"
  | "openSubject"
  | "setFilter"
  | "highlight"
  | "fillForm"
  | "openPanel"
  | "runVerify"
  | "scroll"
  | "focus";

/** view = moves or marks the page; commit / pay / schedule = must stop at a visible Confirm. */
export type StepEffect = "view" | "commit" | "pay" | "schedule";

export const CONFIRM_EFFECTS: ReadonlySet<StepEffect> = new Set<StepEffect>(["commit", "pay", "schedule"]);

/** The AG-UI Tool definitions a browser declares in RunAgentInput.tools. */
export const FRONTEND_TOOLS: { name: FrontendToolName; description: string; parameters: Json }[] = [
  {
    name: "navigate",
    description: "Go to a same-origin path on councilof.ai (a page or a Council OS pane).",
    parameters: { type: "object", properties: { path: { type: "string", pattern: "^/" } }, required: ["path"] },
  },
  {
    name: "openSubject",
    description: "Open one subject: a signed card (64-hex id), a server URL, or a board axis.",
    parameters: {
      type: "object",
      properties: { kind: { enum: ["card", "server", "axis"] }, id: { type: "string" } },
      required: ["kind", "id"],
    },
  },
  {
    name: "setFilter",
    description: "Set a filter on the current view (written to the URL so it is shareable and undoable).",
    parameters: { type: "object", properties: { key: { type: "string" }, value: { type: "string" } }, required: ["key", "value"] },
  },
  {
    name: "highlight",
    description: "Draw a ring around the element matching a CSS selector, with a short label.",
    parameters: { type: "object", properties: { selector: { type: "string" }, label: { type: "string" } }, required: ["selector"] },
  },
  {
    name: "fillForm",
    description: "Type values into named fields of a form on the page. Never submits.",
    parameters: {
      type: "object",
      properties: { selector: { type: "string" }, values: { type: "object", additionalProperties: { type: "string" } } },
      required: ["values"],
    },
  },
  {
    name: "openPanel",
    description: "Open a Council OS pane by id (board, verify, cards, route, connect, corrections ...).",
    parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "runVerify",
    description: "Run the in-browser verification for a subject (a card signature or a server's capsules). Free; signs nothing.",
    parameters: { type: "object", properties: { kind: { enum: ["card", "server"] }, id: { type: "string" } }, required: ["kind", "id"] },
  },
  {
    name: "scroll",
    description: "Scroll an element matching a CSS selector into view.",
    parameters: { type: "object", properties: { selector: { type: "string" } }, required: ["selector"] },
  },
  {
    name: "focus",
    description: "Move keyboard focus to the element matching a CSS selector.",
    parameters: { type: "object", properties: { selector: { type: "string" } }, required: ["selector"] },
  },
];

export const FRONTEND_TOOL_NAMES: ReadonlySet<string> = new Set(FRONTEND_TOOLS.map((t) => t.name));

/** What the browser says about where the reader is. Every field optional; nothing here is trusted as a fact. */
export type PageContext = {
  path?: string;
  title?: string;
  /** The subject the page is about, if any: a card id, a server URL or an axis id. */
  subject?: string | null;
  subjectKind?: "card" | "server" | "axis" | null;
  tab?: string | null;
  headings?: string[];
};

export type UiStep = {
  id: string;
  tool: FrontendToolName;
  args: Json;
  /** One plain sentence the pane shows and (if voice is on) speaks. */
  say: string;
  effect: StepEffect;
  confirm: boolean;
};

export type UiPlan = { intent: string; steps: UiStep[] };

/** Hard ceiling on steps per plan (the bounded-loop rule from the MEOK embed, kept). */
export const MAX_STEPS = 8;

/** Named destinations. Every path is served by councilof.ai (checked 30 Sep 2026). */
export const DESTINATIONS: { re: RegExp; path: string; label: string; panel?: string }[] = [
  { re: /\b(board|scoreboard|axes|axis list|leaderboard)\b/, path: "/dashboard/?tab=board", label: "the live board", panel: "board" },
  { re: /\bverify[- ]?server|check (a|my) server|server (check|lookup)\b/, path: "/verify-server/", label: "Verify a server" },
  { re: /\bverify (a )?card|card verif|gspc[- ]verify\b/, path: "/dashboard/?tab=verify", label: "Verify a card", panel: "verify" },
  { re: /\b(signed )?cards?\b/, path: "/dashboard/?tab=cards", label: "Signed cards", panel: "cards" },
  { re: /\broute\b|\brouting\b/, path: "/dashboard/?tab=route", label: "Route", panel: "route" },
  { re: /\bcorrections?\b/, path: "/dashboard/?tab=corrections", label: "Corrections", panel: "corrections" },
  { re: /\b(connect|install|mcp setup|set up (my|your|an) agent)\b/, path: "/connect/", label: "Connect" },
  { re: /\bagents?\b/, path: "/agents/", label: "For agents" },
  { re: /\bmethodology|how (is|are) (it|things|a measurement) (made|measured)\b/, path: "/methodology/", label: "Methodology" },
  { re: /\bquick ?start\b/, path: "/quickstart/", label: "Quickstart" },
  { re: /\bclaim[- ]maintenance\b/, path: "/claim-maintenance/", label: "Claim maintenance" },
  { re: /\bdispute\b/, path: "/dispute/", label: "Dispute or ask for a correction" },
  { re: /\bdemo\b/, path: "/demo/", label: "the guided demo" },
];

const HEX64 = /\b([0-9a-f]{64})\b/i;
const URL_RE = /\bhttps?:\/\/[^\s<>"'`)\]]+/i;
const DRIVE = /\b(show me|take me|go to|goto|open|navigate|bring up|walk me through|guide me|watch|drive|find|re-?check|recheck|verify this|check this)\b/;
const DEICTIC = /\b(this|here|current|that one|this page|this card|this server)\b/;

const trimUrl = (u: string) => u.replace(/[.,;:!?]+$/, "");

let seq = 0;
function step(tool: FrontendToolName, args: Json, say: string, effect: StepEffect = "view"): UiStep {
  return { id: `ui_${++seq}`, tool, args, say, effect, confirm: CONFIRM_EFFECTS.has(effect) };
}

/**
 * Deterministic UI plan. Pure: no I/O. Returns null when the question does not ask to move the
 * page (a plain data question gets the data tools only). `axis` is the canonical axis id the
 * talk router already extracted, passed in so the two agree.
 */
export function planUi(raw: string, page: PageContext = {}, opts: { axis?: string | null; watch?: boolean } = {}): UiPlan | null {
  seq = 0;
  const text = String(raw ?? "").trim();
  const t = text.toLowerCase().replace(/\s+/g, " ");
  if (!t) return null;
  const asked = DRIVE.test(t) || /\b(commission|order)\b.*\b(card|measurement|attestation)\b/.test(t) || Boolean(opts.watch);
  if (!asked) return null;

  const steps: UiStep[] = [];
  const hex = t.match(HEX64)?.[1] ?? (DEICTIC.test(t) && page.subjectKind === "card" ? page.subject ?? null : null);
  const urlHit = text.match(URL_RE)?.[0];
  const server = urlHit ? trimUrl(urlHit) : DEICTIC.test(t) && page.subjectKind === "server" ? page.subject ?? null : null;

  // Paid / committing asks: prepare the form, then stop at a Confirm. Never submitted here.
  if (/\b(commission|order)\b.*\b(card|measurement|attestation)\b/.test(t)) {
    const subject = server ?? hex ?? null;
    steps.push(step("openPanel", { id: "measured" }, "Opening Get measured."));
    if (subject) steps.push(step("fillForm", { selector: "form[data-ui-form='request']", values: { subject } }, `Typing ${subject} as the subject. Nothing is sent.`));
    steps.push(
      step(
        "highlight",
        { selector: "[data-ui-action='request-submit']", label: "Sending needs your Confirm" },
        "Sending a request is yours to do. I stop here; if you confirm, the paid tool answers with its 402 challenge and payment would come from your own wallet.",
        "pay",
      ),
    );
    return { intent: "prepare a paid request (stops at Confirm)", steps: steps.slice(0, MAX_STEPS) };
  }

  if (/\b(watch|remind|schedule|every (day|week|month)|monthly)\b.*\b(re-?check|recheck|claim|subject|server)\b/.test(t)) {
    steps.push(step("navigate", { path: "/claim-maintenance/" }, "Opening Claim maintenance."));
    steps.push(
      step(
        "highlight",
        { selector: "main h1", label: "Scheduling needs your Confirm" },
        "Asking for a monthly re-check is yours to send. I stop here; nothing is scheduled by me.",
        "schedule",
      ),
    );
    return { intent: "prepare a re-check schedule (stops at Confirm)", steps };
  }

  if (hex) {
    steps.push(step("openSubject", { kind: "card", id: hex }, `Opening card ${hex.slice(0, 12)}….`));
    steps.push(step("runVerify", { kind: "card", id: hex }, "Re-checking its signature in your browser. Free; nothing is signed."));
    steps.push(step("highlight", { selector: "[data-ui-region='verify-result']", label: "Result" }, "This is the result the check returned."));
    return { intent: "open and re-check a signed card", steps };
  }

  if (server) {
    steps.push(step("openSubject", { kind: "server", id: server }, `Looking up ${server} in the signed capsules.`));
    steps.push(step("runVerify", { kind: "server", id: server }, "Re-deriving each capsule in your browser."));
    steps.push(step("highlight", { selector: "[data-ui-region='fix-queue']", label: "Per-axis fix queue" }, "Each row says what was found and how to re-check it."));
    return { intent: "look up and re-check a server", steps };
  }

  if (opts.axis) {
    steps.push(step("openPanel", { id: "board" }, "Opening the live board."));
    steps.push(step("setFilter", { key: "axis", value: opts.axis }, `Filtering to the ${opts.axis} axis.`));
    steps.push(step("highlight", { selector: `[data-axis-row='${opts.axis}']`, label: opts.axis }, `This row is ${opts.axis}; its state comes from the signed board.`));
    return { intent: `show the ${opts.axis} axis`, steps };
  }

  if (/\b(walk me through|tour|guide me|show me around|how does (this|it) work)\b/.test(t)) {
    steps.push(step("openPanel", { id: "board" }, "First, the live board: every axis and whether it is measured."));
    steps.push(step("highlight", { selector: "[data-ui-region='board-totals']", label: "Totals from GET /api/gspc" }, "These totals are read from the signed board, never typed."));
    steps.push(step("openPanel", { id: "verify" }, "Second, verify a card: your browser checks the signature."));
    steps.push(step("navigate", { path: "/verify-server/?url=https%3A%2F%2Fcouncilof.ai%2Fmcp" }, "Third, look up a server: our own MCP door, measured like any other."));
    steps.push(step("highlight", { selector: "[data-ui-region='fix-queue']", label: "Fix queue" }, "Each row says what was found, how to fix it and how to re-check."));
    steps.push(step("openPanel", { id: "corrections" }, "Last, corrections: where we record what we got wrong."));
    return { intent: "guided tour", steps: steps.slice(0, MAX_STEPS) };
  }

  const dest = DESTINATIONS.find((d) => d.re.test(t));
  if (dest) {
    steps.push(dest.panel ? step("openPanel", { id: dest.panel }, `Opening ${dest.label}.`) : step("navigate", { path: dest.path }, `Opening ${dest.label}.`));
    steps.push(step("focus", { selector: "main h1, main h2, [data-ui-region='pane-title']" }, `You are on ${dest.label}.`));
    return { intent: `open ${dest.label}`, steps };
  }
  return null;
}

/**
 * A question that points at "this" is answered about the page's own subject. Returns the question
 * with the subject appended (so the data router's entity rules pick it up), or the question as is.
 */
export function withPageSubject(question: string, page: PageContext = {}): string {
  const q = String(question ?? "");
  if (!page.subject || !DEICTIC.test(q.toLowerCase())) return q;
  if (HEX64.test(q) || URL_RE.test(q)) return q;
  return `${q} ${page.subject}`;
}

/** Page context from forwardedProps, with every field type-checked and bounded. */
export function readPageContext(v: unknown): PageContext {
  const r = v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {};
  const s = (x: unknown, n: number) => (typeof x === "string" && x.trim() ? x.slice(0, n) : undefined);
  const kind = r.subjectKind === "card" || r.subjectKind === "server" || r.subjectKind === "axis" ? r.subjectKind : null;
  return {
    path: s(r.path, 300),
    title: s(r.title, 200),
    subject: s(r.subject, 300) ?? null,
    subjectKind: kind,
    tab: s(r.tab, 40) ?? null,
    headings: Array.isArray(r.headings) ? r.headings.filter((h): h is string => typeof h === "string").slice(0, 8).map((h) => h.slice(0, 80)) : undefined,
  };
}
