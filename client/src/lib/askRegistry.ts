/**
 * askRegistry — the questions the Council Console offers when a visitor opens it.
 *
 * The console IS the assistant. Opening it should never present an empty box:
 * it presents the questions THIS visitor most likely has, chosen by (a) who they
 * are and (b) the page they opened it from.
 *
 * Doctrine encoded here:
 *  - A question is only listed if the estate can answer it from a signed API,
 *    a published document, or a deterministic check. No question implies a
 *    capability we do not have.
 *  - Selecting a question PRE-FILLS the chat bar. It never auto-sends — the
 *    visitor presses send. That is the consent lock ("your click, never mine").
 *  - `intent` routes the console to the deterministic handler where one exists,
 *    so the answer is a fetch of signed data, not a generated guess.
 */

export type Audience = "regulator" | "insurer" | "enterprise" | "developer" | "citizen";

export type Ask = {
  /** Shown on the chip. Keep it in the visitor's own words. */
  label: string;
  /** What gets pre-filled into the chat bar. */
  prompt: string;
  /** Deterministic intent the console can route to, when one exists. */
  intent?: "board" | "verify" | "arena" | "reported" | "statute" | "corrections" | "ask";
};

export const AUDIENCES: { id: Audience; label: string; blurb: string }[] = [
  { id: "regulator", label: "Regulator", blurb: "check behaviour against the law" },
  { id: "insurer", label: "Insurer", blurb: "price risk on evidence you can check" },
  { id: "enterprise", label: "Enterprise", blurb: "prove your AI before you ship" },
  { id: "developer", label: "Developer", blurb: "verify and measure from code" },
  { id: "citizen", label: "Just curious", blurb: "see what this actually is" },
];

/** Questions by audience — each answerable from published, checkable material. */
export const BY_AUDIENCE: Record<Audience, Ask[]> = {
  regulator: [
    { label: "What do you actually measure?", prompt: "Which axis do you measure, and which provision does each one map to?", intent: "board" },
    { label: "What is left unmeasured?", prompt: "Show me the axis that are UNMEASURED or untested, and say why.", intent: "board" },
    { label: "Can I check this without trusting you?", prompt: "Walk me through verifying one of your records myself, without an account.", intent: "verify" },
    { label: "What have you got wrong?", prompt: "Show me your corrections ledger, including anything you have retracted.", intent: "corrections" },
    { label: "Is this a certification?", prompt: "Is a measurement card a certification or conformity assessment? What is the difference?" },
  ],
  insurer: [
    { label: "What evidence prices this risk?", prompt: "What is in a measurement card that an underwriter could actually price on?", intent: "verify" },
    { label: "Measured or reported?", prompt: "Which figures here are MEASURED by you and which are REPORTED by third parties?", intent: "reported" },
    { label: "How current is it?", prompt: "How recent is this measurement, and what happens to it when the law changes?" },
    { label: "Where are the gaps?", prompt: "What does this evidence NOT cover? Show me the unmeasured cells.", intent: "board" },
    { label: "Who pays you?", prompt: "Do the parties you measure pay you? Explain your independence." },
  ],
  enterprise: [
    { label: "How do I get measured?", prompt: "How does my company get its AI measured, and what do we get back?" },
    { label: "What does procurement get?", prompt: "What can I hand to procurement or a customer as evidence?", intent: "verify" },
    { label: "Is this certification?", prompt: "Is this a certification we can claim? What can and cannot we say?" },
    { label: "What does it cost?", prompt: "What does measurement cost, and what is free?" },
    { label: "What if we score badly?", prompt: "What happens if our result is poor — can we suppress or buy a better one?" },
  ],
  developer: [
    { label: "Show me the API", prompt: "Which public endpoints can I call, and what do they return?", intent: "board" },
    { label: "Verify a card in code", prompt: "How do I verify a signed card myself in code, step by step?", intent: "verify" },
    { label: "What is in the card?", prompt: "What fields are in the 3KB signed card and how is it hash-chained?", intent: "verify" },
    { label: "How is grading done?", prompt: "How are results graded? Does a model ever judge another model?", intent: "arena" },
    { label: "Where is the trust root?", prompt: "Where is the public key published, and how do I resolve did:web:csoai.org?" },
  ],
  citizen: [
    { label: "What is this, plainly?", prompt: "Explain what Council of AI does in plain English, no jargon." },
    { label: "Can I check a claim myself?", prompt: "If a company claims its AI is safe, how can I check that myself for free?", intent: "verify" },
    { label: "Who pays for this?", prompt: "Who funds you, and do the companies you measure pay you?" },
    { label: "What if an AI harmed me?", prompt: "An AI system did something wrong. What can I do, and what can you do?" },
    { label: "Do you ever get it wrong?", prompt: "Have you ever published a mistake of your own?", intent: "corrections" },
  ],
};

/** Extra questions that make sense on specific routes. Longest prefix wins. */
export const BY_ROUTE: { match: string; asks: Ask[] }[] = [
  { match: "/gspc-scoreboard", asks: [
    { label: "Explain this axis", prompt: "Explain what this axis measures and how it is scored.", intent: "board" },
    { label: "Why is a cell empty?", prompt: "Why is a cell UNMEASURED rather than zero?", intent: "board" },
  ]},
  { match: "/gspc-verify", asks: [
    { label: "Verify this record", prompt: "Help me verify a measurement record right now.", intent: "verify" },
  ]},
  { match: "/gspc-arena", asks: [
    { label: "How is a round graded?", prompt: "How is an arena round graded, and why is it never one model judging another?", intent: "arena" },
  ]},
  { match: "/insurers", asks: [
    { label: "What would you underwrite on?", prompt: "Which parts of this evidence are loss-relevant for underwriting?", intent: "reported" },
  ]},
  { match: "/benchmark-index", asks: [
    { label: "Why not one ranking?", prompt: "Why do you keep MEASURED and REPORTED apart instead of merging them into one ranking?", intent: "reported" },
  ]},
  { match: "/honesty", asks: [
    { label: "What do you refuse to claim?", prompt: "What do you deliberately refuse to claim, and why?", intent: "corrections" },
  ]},
];

/** Resolve the chip set for a visitor: route-specific first, then audience. */
export function asksFor(pathname: string, audience?: Audience): Ask[] {
  const route = BY_ROUTE.filter((r) => pathname.startsWith(r.match))
    .sort((a, b) => b.match.length - a.match.length)[0];
  const base = audience ? BY_AUDIENCE[audience] : [];
  return [...(route?.asks ?? []), ...base].slice(0, 6);
}
