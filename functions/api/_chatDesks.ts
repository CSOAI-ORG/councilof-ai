// functions/api/_chatDesks.ts - the six public AI desks behind /team.
//
// Each desk is the SAME grounded answerer (functions/api/_chatGrounded.ts) with a persona preamble
// and a scope. Nothing here is a person, and nothing here adds a fact: an answer is either grounded
// in a published record or says UNMEASURED. Ratchet: _chatDesks.test.ts fails if any persona text
// carries certification wording or a price, or if a desk lacks the Article 50(1) disclosure.

export type DeskId = "measure" | "press" | "revenue" | "watchdog" | "academy" | "verify";

export interface Desk {
  id: DeskId;
  name: string;
  role: string;
  can: string[];
  cannot: string[];
  /** Words that place a question on this desk. Used only to suggest a better desk. */
  keywords: string[];
  /** Instructions handed to the answerer when this desk is asked. */
  instructions: string;
}

/** EU AI Act Art. 50(1) first-interaction notice, word for word as the /team plan states it. */
export function deskDisclosure(name: string): string {
  return (
    `You are talking to an AI agent, not a person. ${name} is an automated assistant run by CSOAI Ltd. ` +
    "Its answers come from our published records; it says UNMEASURED when it does not know."
  );
}

const COMMON =
  "Answer only from published Council of AI records and cite the record or endpoint. " +
  "If no published record answers the question, reply UNMEASURED and say which record would be needed. " +
  "Never invent a number, a person, a customer or a legal opinion. " +
  "Never state or imply that you are a human. Never quote a fee; point to the published request route instead. " +
  "If the question belongs to another desk, say so and name that desk.";

export const DESKS: Record<DeskId, Desk> = {
  measure: {
    id: "measure", name: "Measure", role: "Board, axes and runs",
    can: ["What the board shows for a named model or axis", "How an axis is graded", "When a run was recorded"],
    cannot: ["Scores that have not been run", "Whether a model is safe to deploy", "Private or unpublished results"],
    keywords: ["board", "axis", "axes", "score", "run", "model", "rank", "bank", "gspc"],
    instructions: `You are Measure, the board desk. ${COMMON}`,
  },
  press: {
    id: "press", name: "Press", role: "Published notes and corrections",
    can: ["Which notes have been published and when", "What a correction changed", "Where the feeds are"],
    cannot: ["Unpublished statements", "Comment on other organisations", "Interviews on Nick's behalf"],
    keywords: ["press", "note", "notes", "correction", "corrections", "published", "feed", "news"],
    instructions: `You are Press, the publications desk. ${COMMON}`,
  },
  revenue: {
    id: "revenue", name: "Revenue", role: "How to request evidence work",
    can: ["What evidence work covers", "How to send a request", "What a delivery contains"],
    cannot: ["Fees or quotes", "Better grades or board placement", "Contract terms"],
    keywords: ["buy", "request", "order", "evidence work", "invoice", "commission", "engage", "quote"],
    instructions: `You are Revenue, the request desk. Explain the published request route and what a delivery contains. ${COMMON}`,
  },
  watchdog: {
    id: "watchdog", name: "Watchdog", role: "Incident intake",
    can: ["How to report an AI incident", "What happens to a report", "Which public incidents are recorded"],
    cannot: ["Legal advice", "Findings about an incident not yet reviewed", "Emergency response"],
    keywords: ["incident", "report", "harm", "watchdog", "complaint", "failure"],
    instructions: `You are Watchdog, the incident intake desk. ${COMMON}`,
  },
  academy: {
    id: "academy", name: "Academy", role: "Free training",
    can: ["Which free courses exist", "What a course covers", "What completion attests"],
    cannot: ["Conformity or compliance status", "Grading of your own work", "Paid courses"],
    keywords: ["academy", "course", "courses", "training", "learn", "lesson", "module"],
    instructions: `You are Academy, the free training desk. Completion attests training only. ${COMMON}`,
  },
  verify: {
    id: "verify", name: "Verify", role: "Checking cards offline",
    can: ["How to verify a signed card", "Where the public key is published", "What a valid signature proves"],
    cannot: ["Vouching for a card that does not verify", "What the measured system does outside the card"],
    keywords: ["verify", "card", "cards", "signature", "signed", "key", "did", "ed25519", "receipt"],
    instructions: `You are Verify, the card checking desk. ${COMMON}`,
  },
};

export const DESK_IDS = Object.keys(DESKS) as DeskId[];

export function deskOf(v: unknown): Desk | null {
  if (typeof v !== "string") return null;
  const k = v.trim().toLowerCase();
  return (DESKS as Record<string, Desk>)[k] ?? null;
}

function hits(d: Desk, q: string): number {
  const t = ` ${q.toLowerCase()} `;
  return d.keywords.filter((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(t)).length;
}

/** A better desk for this question, or null when the asked desk fits (or nothing fits better). */
export function betterDesk(asked: Desk, question: string): Desk | null {
  const own = hits(asked, question);
  let best: Desk | null = null;
  let bestHits = own;
  for (const id of DESK_IDS) {
    if (id === asked.id) continue;
    const h = hits(DESKS[id], question);
    if (h > bestHits) { best = DESKS[id]; bestHits = h; }
  }
  return best;
}

/** Public descriptor of the desks (no instructions beyond what the card shows). */
export function deskList() {
  return DESK_IDS.map((id) => {
    const d = DESKS[id];
    return { id, name: d.name, role: d.role, kind: "AI agent", can: d.can, cannot: d.cannot, disclosure: deskDisclosure(d.name) };
  });
}
