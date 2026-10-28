// functions/api/_hitl.ts — the human in the loop, for safe and for all.
//
// WHAT THIS IS
//
// The winning piece. Everything the Council of AI publishes is a measurement; a measurement says
// nothing about whether a thing should HAPPEN. Publishing a card, releasing a statement, sending
// a notice, approving a deployment — those are acts, and an act needs a human who is competent
// to perform it and accountable for it.
//
// So the shape is:
//
//   1. A STAFF MEMBER ESCALATES. Asked to publish/release/send/approve, a PAL does not comply
//      and does not ask a model whether it may. It raises a CHALLENGE and hands it to a human.
//   2. THE HUMAN IS BRIEFED AND TESTED. A COMPETENCY MODULE is derived from the LIVE board — the
//      axis's own record — so the material cannot drift from what the Council publishes. The
//      human answers it; the answer is checked against the live record at the moment they answer.
//   3. THE HUMAN DECIDES. APPROVED, HOLD or REJECTED — never anything else — and the decision
//      becomes a RECEIPT signed under the board's own attestation key.
//
// MEOK-COMPATIBLE, NOT MEOK-COUPLED
//
// This speaks the MEOK H.I.M vocabulary exactly: the same receipt schema
// (csoai.hitl-oversight-receipt/0.1), the same decision vocabulary (APPROVED | HOLD | REJECTED),
// the same policy line, and the same gate shape ({ ok, blocked_by_competency_gate, reason }).
// A reader of the MEOK surface reads this surface.
//
// It does NOT call the MEOK H.I.M. The MEOK HIM lives on a private LAN with no tunnel, so a
// Cloudflare Worker cannot reach it. Coupling the Council's approval path to a machine the
// Council cannot reach would make the human in the loop depend on the most fragile link in the
// chain. The two are interoperable by shape, which is what "through MEOK H.I.M" has to mean
// when "through" cannot mean "inside".
//
// WHAT THIS MODULE REFUSES TO DO
//
//   - It never certifies. The policy line is not decoration; it is the constant.
//   - It never asks the reader for a password, an API key, a token or a card. The estate's own
//     elicitation probe (scripts/hitl/hitl_probe.py) declines every elicitation and asserts that
//     form-mode elicitation never requests sensitive data. This module is the same rule, in the
//     place where it would otherwise be forgotten.
//   - It never lets a decision happen without a competency check, and it never lets a competency
//     check pass on a hand-written answer: the correct answer is re-derived from the live board
//     every time it is asked and every time it is signed.

import {
  BOARD_ATTESTATION_DID,
  canonicalBytes,
  sha256Hex,
  signPayload,
  verifyLeaf,
} from "../_lib/cardSign";

/** THE policy line. Byte-identical to the MEOK H.I.M. line, because it is the same rule. */
export const HITL_POLICY = "Measurement and Human-in-the-Loop Oversight — Never Certification";

/** The three decisions. No fourth verb, no synonyms. */
export const HITL_DECISIONS = ["APPROVED", "HOLD", "REJECTED"] as const;
export type HitlDecision = (typeof HITL_DECISIONS)[number];

export const HITL_RECEIPT_SCHEMA = "csoai.hitl-oversight-receipt/0.1";
export const HITL_CHALLENGE_SCHEMA = "csoai.hitl-challenge/0.1";
export const HITL_STATE_SCHEMA = "csoai.hitl-companion-state/0.1";
export const HITL_MODULE_SCHEMA = "csoai.hitl-competency-module/0.1";

// ---------------------------------------------------------------------------
// THE STORE
// ---------------------------------------------------------------------------

export interface HitlEnv {
  /** Preferred store for challenges, receipts and completed modules. */
  HITL_KV?: KVNamespace;
  /** Fallback store, so one binding turns persistence on without a code change. */
  PAL_MEMORY_KV?: KVNamespace;
  /** The operator secret required to record a decision. */
  HITL_DECIDE_TOKEN?: string;
  /** The board's Ed25519 signing key (PKCS8, base64). */
  BOARD_SIGN_KEY_PKCS8_B64?: string;
}

/**
 * The store, if there is one.
 *
 * HITL_KV is preferred; PAL_MEMORY_KV is the fallback, because the Council already has that
 * binding shape and requiring a second one to make the human in the loop persist would be a
 * reason for the human in the loop not to exist. Both are optional: with neither bound the
 * oversight path still works — it is just stateless, and the surface says so plainly rather
 * than showing an empty ledger as if nothing had ever been decided.
 */
export function hitlStore(env: HitlEnv): KVNamespace | null {
  return env.HITL_KV ?? env.PAL_MEMORY_KV ?? null;
}

export const HITL_PREFIX = "hitl:";

/** A short, content-derived id. Deterministic, so no store is needed to name a challenge. */
export function shortHash(value: string, len = 16): string {
  // A small, dependency-free FNV-1a over the canonical bytes. NOT a security hash: the
  // security hash is the sha256 below. This is only a readable handle.
  let h = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(value)) {
    h ^= byte;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0").slice(0, len);
}

// ---------------------------------------------------------------------------
// AXIS MATCHING — one vocabulary, shared with the PAL runtime
// ---------------------------------------------------------------------------

/**
 * The axes a question names.
 *
 * Longest first, so "effect-binding" is matched before "effect" if both ever appear. Shared
 * with _palRuntime.buildFacts on purpose: the PAL's facts block and the oversight module must
 * agree about which axis a question is about, or the human would be tested on one axis while
 * the staff member answered about another.
 */
export function matchAxes(axes: any[], question: string): any[] {
  const q = String(question ?? "").toLowerCase();
  if (!q) return [];
  return (axes ?? [])
    .filter((a: any) => typeof a?.axis === "string" && a.axis.length > 3)
    .sort((a: any, b: any) => String(b.axis).length - String(a.axis).length)
    .filter((a: any) => q.includes(String(a.axis).toLowerCase()));
}

// ---------------------------------------------------------------------------
// THE TWO REFUSALS
// ---------------------------------------------------------------------------

/**
 * Does this text ASK for sensitive data?
 *
 * The estate's rule, from scripts/hitl/hitl_probe.py: a form-mode elicitation never requests
 * passwords, API keys, tokens or payment credentials. This is that rule applied where it would
 * otherwise be forgotten — to a PAL's own reply, and to anything the Council asks a human to
 * type into a form.
 *
 * It is deliberately narrow. A refusal ("I will never ask for your API key") is NOT a request,
 * and a sentence that merely mentions a credential ("this deployment holds no credentials") is
 * NOT a request. Only an actual demand counts.
 */
export function requestsSensitiveData(text: string): string | null {
  const raw = String(text ?? "");
  if (!raw.trim()) return null;

  const SENSITIVE =
    /\b(password|passphrases?|api[\s_-]?keys?|secret[\s_-]?keys?|private[\s_-]?keys?|seed phrases?|recovery phrases?|mnemonics?|credentials?|bearer tokens?|access tokens?|auth tokens?|api tokens?|refresh tokens?|session tokens?|card numbers?|cvv2?|cvc|social security numbers?|ssn|pin codes?|one[- ]time codes?|otp)\b/i;
  const ASK =
    /\b(provide|share|send|give|supply|disclose|paste|type|enter|reveal|tell me|what(?:'s| is)|need|request|upload|confirm your|verify your|forward)\b/i;
  const NEGATED = /\b(not|never|no|without|refuse|refuses|refused|cannot|won't|will not|does not|do not|don't)\b/i;

  for (const sentence of raw.split(/[.?!;\n]/)) {
    const m = sentence.match(SENSITIVE);
    if (!m || m.index === undefined) continue;
    const before = sentence.slice(0, m.index);
    // A refusal is not a request. "I will not ask for your password" must not trip this.
    if (NEGATED.test(before)) continue;
    if (ASK.test(before)) return m[0].toLowerCase();
    // "your password?" — a demand with no verb.
    if (/\byour\b[^.?!]{0,30}$/i.test(before)) return m[0].toLowerCase();
  }
  return null;
}

/**
 * Does this text involve HANDLING a credential?
 *
 * Distinct from requestsSensitiveData, which is about what the system asks the READER for. This
 * is about an act that would put a credential somewhere: publish it, send it, include it in a
 * card, attach it to a record. The Council publishes records; a credential must never become
 * one. This is the rule that stops "publish the api key with the card" from becoming a
 * published challenge.
 */
export function handlesSensitiveData(text: string): string | null {
  const raw = String(text ?? "");
  if (!raw.trim()) return null;

  const SENSITIVE =
    /\b(password|passphrases?|api[\s_-]?keys?|secret[\s_-]?keys?|private[\s_-]?keys?|seed phrases?|recovery phrases?|mnemonics?|credentials?|bearer tokens?|access tokens?|auth tokens?|api tokens?|refresh tokens?|session tokens?|card numbers?|cvv2?|cvc|social security numbers?|ssn|pin codes?|one[- ]time codes?|otp)\b/i;
  const HANDLING =
    /\b(publish|publishes|publishing|send|sends|sending|share|shares|sharing|email|post|posts|include|includes|including|attach|attaches|write|writes|writing|store|stores|log|logs|record|records|upload|uploads|paste|commit|commits|push|pushes|release|releases|append|appends)\b/i;

  const term = raw.match(SENSITIVE);
  if (!term || term.index === undefined) return null;
  const around = raw.slice(Math.max(0, term.index - 80), term.index + term[0].length + 80);
  if (!HANDLING.test(around)) return null;
  return term[0].toLowerCase();
}

/**
 * Is the READER asking the staff member for a secret?
 *
 * Distinct from requestsSensitiveData: that asks what the SYSTEM says to the reader; this asks
 * whether the reader is trying to make the staff member disclose a credential. The answer to
 * this is always a refusal, and it is a refusal before the model is consulted.
 */
export function asksForSecret(text: string): string | null {
  const t = String(text ?? "");
  const m = t.match(
    /\b(?:what(?:'s| is)|give me|show me|tell me|reveal|share|print|output)\s+(?:me\s+)?(?:the\s+|your\s+|our\s+|my\s+)?(api[\s_-]?keys?|passwords?|secrets?|tokens?|private[\s_-]?keys?|credentials?|signing keys?|signing key)\b/i,
  );
  return m ? m[1].toLowerCase() : null;
}

// ---------------------------------------------------------------------------
// ESCALATION — the act a staff member will not perform on its own
// ---------------------------------------------------------------------------

type VerbSpec = { re: RegExp; action: string; needsDeterminer?: boolean };

const DETERMINER = /\b(the|this|that|it|these|those|a|an|our|my|your|their|its|his|her|me|us|you|all|it)\b/i;

/**
 * The acts that need a human.
 *
 * "publish", "release", "send", "deploy", "execute", "merge", "approve", "certify",
 * "go live", "proceed". A staff member may DESCRIBE each of these; it may not PERFORM one.
 */
const OVERSIGHT_VERBS: VerbSpec[] = [
  { re: /\bpublish(es|ed|ing)?\b/gi, action: "publish" },
  { re: /\brelease(s|d|ing)?\b/gi, action: "release", needsDeterminer: true },
  { re: /\bpost(s|ed|ing)?\b/gi, action: "publish", needsDeterminer: true },
  { re: /\bannounce(d|s|ing)?\b/gi, action: "publish", needsDeterminer: true },
  { re: /\bsend(s|ing)?\b/gi, action: "send" },
  { re: /\bsent\b/gi, action: "send" },
  { re: /\bemail(s|ed|ing)?\b/gi, action: "send", needsDeterminer: true },
  { re: /\bdeploy(s|ed|ing)?\b/gi, action: "deploy" },
  { re: /\bexecute(s|d|ing)?\b/gi, action: "execute" },
  { re: /\bmerge(d|s|ing)?\b/gi, action: "merge", needsDeterminer: true },
  { re: /\bship(s|ped|ping)?\b/gi, action: "publish", needsDeterminer: true },
  { re: /\bapprove(s|d|ing)?\b/gi, action: "approve" },
  { re: /\bauthoris?e(s|d|ing)?\b/gi, action: "approve" },
  { re: /\bcertif(y|ies|ied|ying)\b/gi, action: "approve" },
  { re: /\bsign[\s-]?off\b/gi, action: "approve" },
  { re: /\bgo\s+live\b/gi, action: "publish" },
  { re: /\bproceed(s|ed|ing)?\b/gi, action: "approve" },
  { re: /\bgo\s+ahead\b/gi, action: "approve" },
  { re: /\bmake\s+it\s+so\b/gi, action: "approve" },
];

/** Words that make the verb a reference to something that already happened. */
const STATE_MARKERS = /\b(been|was|were|has|have|had|did|already|ever|still|yet|sent)\b/i;
/** Words that make the verb a request. */
const REQUEST_MARKERS =
  /\b(please|can you|could you|would you|will you|go ahead|i want (you )?to|i'd like you to|i need you to|your job is to|you should|you must|do it|make it so|proceed)\b/i;
/** A question about what the record says is not an instruction to act. */
const RECORD_QUESTION =
  /\b(what does the record|according to the record|what is the (published )?(record|status)|why (was|did|is|are)|explain|describe|tell me about|what happened|what does the board|is it|are they|was it|did they|has it)\b/i;

/**
 * Does this question ask the staff member to PERFORM a consequential act?
 *
 * The distinction that matters is tense and role, not vocabulary. "Publish the card" is an
 * instruction. "Has the card been published?" is a question about a record. "What does the
 * record say about publishing?" is a question about a record. Only the first escalates.
 *
 * Returns the action, or null when nothing consequential was asked.
 */
export function detectOversightAction(text: string): { action: string; verb: string } | null {
  const raw = String(text ?? "");
  if (!raw.trim()) return null;
  const lower = raw.toLowerCase();

  // The EARLIEST consequential word in the sentence is the act. "approve the deployment" is an
  // approval, not a deployment, even though both words are on the list — so the choice is made
  // by position, not by the order the verbs happen to be written in.
  let best: { at: number; action: string; verb: string } | null = null;

  for (const spec of OVERSIGHT_VERBS) {
    const re = new RegExp(spec.re.source, spec.re.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(lower)) !== null) {
      const at = m.index;
      const before = lower.slice(Math.max(0, at - 70), at);
      const after = lower.slice(at + m[0].length);

      // A past or perfect reference: a question about what happened, not an instruction.
      if (STATE_MARKERS.test(before)) continue;

      // A noun phrase is not an act. "the release notes" is a document; "release the statement"
      // is an instruction. The word IMMEDIATELY after the verb decides it — a determiner means
      // an object follows ("release THE statement"), anything else is a noun phrase. A verb at
      // the end of the clause ("please release") is an instruction, so no word means yes.
      if (spec.needsDeterminer) {
        const nextWord = after.match(/^\s*([a-z]+)/);
        if (nextWord && !DETERMINER.test(nextWord[1])) continue;
      }

      // A question about the record is not an instruction — unless it also asks for action.
      if (RECORD_QUESTION.test(lower) && !REQUEST_MARKERS.test(lower)) continue;

      if (!best || at < best.at) best = { at, action: spec.action, verb: m[0] };
      break;
    }
  }

  return best ? { action: best.action, verb: best.verb } : null;
}

// ---------------------------------------------------------------------------
// THE CHALLENGE
// ---------------------------------------------------------------------------

export type HitlChallenge = {
  schema: string;
  id: string;
  at: string;
  axis: string | null;
  subject: string;
  proposed_action: string;
  raised_by: string;
  source: string | null;
  facts: string | null;
  required_module: string | null;
  policy: string;
};

/**
 * The challenge payload, WITHOUT its id.
 *
 * The id is the sha256 of these bytes, so a challenge is self-verifying: the decision endpoint
 * recomputes it and refuses a challenge whose content was edited in transit.
 */
export function challengePayload(c: Omit<HitlChallenge, "id">): Record<string, unknown> {
  return {
    schema: c.schema,
    at: c.at,
    axis: c.axis,
    subject: c.subject,
    proposed_action: c.proposed_action,
    raised_by: c.raised_by,
    source: c.source,
    facts: c.facts,
    required_module: c.required_module,
    policy: c.policy,
  };
}

/** The content-derived challenge id. */
export async function challengeId(payload: Record<string, unknown>): Promise<string> {
  const digest = await sha256Hex(canonicalBytes(payload));
  return `chl_${digest.slice(0, 16)}`;
}

/** Build a challenge and stamp its id. */
export async function buildChallenge(
  input: Omit<HitlChallenge, "id" | "schema" | "policy"> & { schema?: string; policy?: string },
): Promise<HitlChallenge> {
  const payload = challengePayload({
    schema: input.schema ?? HITL_CHALLENGE_SCHEMA,
    at: input.at,
    axis: input.axis ?? null,
    subject: input.subject,
    proposed_action: input.proposed_action,
    raised_by: input.raised_by,
    source: input.source ?? null,
    facts: input.facts ?? null,
    required_module: input.required_module ?? null,
    policy: input.policy ?? HITL_POLICY,
  });
  const id = await challengeId(payload);
  return { ...(payload as unknown as Omit<HitlChallenge, "id">), id };
}

/** Recompute a challenge's id. A mismatch means the content was edited. */
export async function verifyChallenge(c: HitlChallenge): Promise<boolean> {
  if (!c || typeof c !== "object") return false;
  const { id, ...rest } = c as HitlChallenge;
  const expected = await challengeId(challengePayload(rest as Omit<HitlChallenge, "id">));
  return expected === id;
}

// ---------------------------------------------------------------------------
// THE COMPETENCY MODULE — derived from the LIVE board
// ---------------------------------------------------------------------------

export type HitlModuleOption = { id: string; text: string };

export type HitlModule = {
  schema: string;
  id: string;
  axis: string;
  title: string;
  briefing: string;
  question: string;
  options: HitlModuleOption[];
  /** INTERNAL. Never published by the module endpoints. */
  correct_option: string;
  explanation: string;
  policy: string;
};

/** The separation values the board uses, plus the absent case. */
const SEPARATION_UNIVERSE = ["SEPARATED", "TIE", "UNTESTED", "not published"];

/** How the record describes the separation of an axis. */
export function separationText(axis: any): string {
  const sep = axis?.separation;
  if (typeof sep === "string" && sep.trim()) return sep.trim();
  return "not published";
}

/** A stable pseudo-random integer from a string. Used to shuffle options deterministically. */
function stableIndex(seed: string, modulo: number): number {
  let h = 2166136261;
  for (const byte of new TextEncoder().encode(seed)) {
    h ^= byte;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % modulo;
}

/**
 * Derive the competency module for one axis FROM THE LIVE BOARD.
 *
 * The module is not hand-written, so it cannot drift from what the Council publishes, and it
 * cannot become a scenario about a record that no longer exists. The question asks for the
 * STATUS and the SEPARATION of the axis together; only one of the four options states both
 * correctly, and two of them state one correctly — so the module tests whether the human read
 * the record rather than whether they guessed.
 *
 * The option order is shuffled by a stable hash of the axis id, so the right answer does not
 * always land in the same place. A gate whose answer is always "B" is a gate that teaches
 * "always B".
 */
export function deriveModule(board: any, axisId: string): HitlModule | null {
  const axes: any[] = Array.isArray(board?.axes) ? board.axes : [];
  const axis = axes.find((a: any) => a?.axis === axisId);
  if (!axis) return null;

  const status = typeof axis.status === "string" && axis.status.trim() ? axis.status.trim() : "UNMEASURED";
  const flippedStatus = status === "MEASURED" ? "UNMEASURED" : "MEASURED";
  const sep = separationText(axis);
  const sepUniverse = SEPARATION_UNIVERSE.filter((s) => s !== sep);
  const flippedSep = sepUniverse[stableIndex(`sep:${axisId}`, sepUniverse.length)] ?? "TIE";

  const texts = [
    `It is ${status} and its separation is ${sep}.`,
    `It is ${flippedStatus} and its separation is ${sep}.`,
    `It is ${status} and its separation is ${flippedSep}.`,
    `It is ${flippedStatus} and its separation is ${flippedSep}.`,
  ];
  const correctText = texts[0];

  // Stable shuffle by a hash of the option text, so the order never changes for one axis.
  const ordered = texts
    .map((text, i) => ({ text, i }))
    .sort((a, b) => {
      const ka = shortHash(`opt:${axisId}:${a.text}`, 8);
      const kb = shortHash(`opt:${axisId}:${b.text}`, 8);
      return ka === kb ? a.i - b.i : ka < kb ? -1 : 1;
    })
    .map((o) => o.text);

  const options: HitlModuleOption[] = ordered.map((text, i) => ({
    id: String.fromCharCode(65 + i),
    text,
  }));
  const correct = options.find((o) => o.text === correctText)?.id ?? "A";

  const n = typeof axis.n === "number" ? axis.n : null;
  const leader = typeof axis.leader === "string" ? axis.leader : null;
  const observedOn = axis.measurement_time?.observed_on ?? null;

  const briefingParts = [
    `Axis: ${axis.axis}.`,
    `Published status: ${status}.`,
    `Published separation: ${sep}.`,
  ];
  if (n !== null) briefingParts.push(`Items in the published run: n ${n}.`);
  if (leader) briefingParts.push(`Point leader: ${leader} (a point leader is not a separated leader).`);
  if (axis.separation_sentence) briefingParts.push(String(axis.separation_sentence));
  if (observedOn) briefingParts.push(`Observed on: ${observedOn}.`);
  briefingParts.push(
    "A measurement is never a certification, and a point leader is never a separated leader. This module is a reading check on the published record, not an exam.",
  );

  return {
    schema: HITL_MODULE_SCHEMA,
    id: `GSPC-${axisId}`,
    axis: axisId,
    title: `Read the record for "${axisId}"`,
    briefing: briefingParts.join(" "),
    question: `According to the published record you were briefed on, which statement about the axis "${axisId}" is TRUE?`,
    options,
    correct_option: correct,
    explanation: `The published record for "${axisId}" reports status ${status} and separation ${sep}. That is a measurement. It is not a certification, and it does not rank anyone.`,
    policy: HITL_POLICY,
  };
}

/** Every module the live board supports. */
export function deriveModules(board: any): HitlModule[] {
  const axes: any[] = Array.isArray(board?.axes) ? board.axes : [];
  const out: HitlModule[] = [];
  for (const a of axes) {
    if (typeof a?.axis !== "string") continue;
    const mod = deriveModule(board, a.axis);
    if (mod) out.push(mod);
  }
  return out;
}

/** The module as it is published. The correct option is NOT published. */
export function publicModule(m: HitlModule, completed = false): Record<string, unknown> {
  return {
    schema: m.schema,
    id: m.id,
    axis: m.axis,
    title: m.title,
    briefing: m.briefing,
    question: m.question,
    options: m.options,
    policy: m.policy,
    completed,
  };
}

/**
 * The axis a module id names.
 *
 * Module ids are "GSPC-<axis>"; the curriculum is derived from the board, so the axis is
 * recovered from the id rather than trusted from the caller.
 */
export function moduleAxisId(moduleId: string): string {
  const raw = String(moduleId ?? "").trim();
  return raw.startsWith("GSPC-") ? raw.slice(5) : raw;
}

/**
 * Check an answer against the LIVE record.
 *
 * The module is re-derived from the board at the moment of the answer, so an answer checked
 * against a stale module — or against a module the caller supplied — cannot pass. This is what
 * makes the gate a gate rather than a checkbox.
 */
export function checkAnswer(
  board: any,
  moduleId: string,
  answer: string,
): { ok: boolean; correct: boolean; module: HitlModule | null; reason: string | null } {
  const axisId = moduleAxisId(moduleId);
  const module = deriveModule(board, axisId);
  if (!module) {
    return {
      ok: false,
      correct: false,
      module: null,
      reason: `No module for "${moduleId}" exists on the live board. The board's axes are the curriculum, so a module that is not there cannot be completed.`,
    };
  }
  const given = String(answer ?? "").trim().toUpperCase();
  const correct = given === module.correct_option;
  return {
    ok: true,
    correct,
    module,
    reason: correct ? null : "That is not what the published record says.",
  };
}

// ---------------------------------------------------------------------------
// THE RECEIPT
// ---------------------------------------------------------------------------

export type HitlReceipt = {
  schema: string;
  policy: string;
  at: string;
  operator: string;
  axis: string;
  decision: HitlDecision;
  note: string;
  competency_verified: boolean;
  completed_modules: string[];
  module_id: string;
  challenge: {
    id: string;
    subject: string;
    proposed_action: string;
    raised_by: string;
    source: string | null;
    facts: string | null;
  };
  signature: {
    alg: string;
    did: string | null;
    value_hex: string | null;
    value_b64: string | null;
    sha256: string;
    bytes: number;
    unsigned_reason: string | null;
  };
};

/** The receipt WITHOUT its signature block. This is what is signed. */
export function receiptPayload(r: HitlReceipt): Record<string, unknown> {
  return {
    schema: r.schema,
    policy: r.policy,
    at: r.at,
    operator: r.operator,
    axis: r.axis,
    decision: r.decision,
    note: r.note,
    competency_verified: r.competency_verified,
    completed_modules: r.completed_modules,
    module_id: r.module_id,
    challenge: r.challenge,
  };
}

function hexToB64(hex: string): string {
  const bytes = hex.match(/../g) ?? [];
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(parseInt(b, 16));
  return btoa(bin);
}

/**
 * Build and sign a receipt.
 *
 * The signature is the BOARD's attestation key — the same key that signs every published card
 * leaf — so a receipt verifies against the published DID document with the same verifier, and
 * is attributable to the Council rather than to an anonymous signer.
 *
 * When the key is absent the receipt is published UNSIGNED, with the reason. An unsigned
 * receipt is honest; a fabricated signature is not, and there is no third option.
 */
export async function buildReceipt(input: {
  operator: string;
  axis: string;
  decision: HitlDecision;
  note: string;
  competency_verified: boolean;
  completed_modules: string[];
  module_id: string;
  challenge: HitlChallenge;
  at?: string;
}): Promise<HitlReceipt> {
  const receipt: HitlReceipt = {
    schema: HITL_RECEIPT_SCHEMA,
    policy: HITL_POLICY,
    at: input.at ?? new Date().toISOString(),
    operator: input.operator,
    axis: input.axis,
    decision: input.decision,
    note: input.note,
    competency_verified: input.competency_verified,
    completed_modules: input.completed_modules,
    module_id: input.module_id,
    challenge: {
      id: input.challenge.id,
      subject: input.challenge.subject,
      proposed_action: input.challenge.proposed_action,
      raised_by: input.challenge.raised_by,
      source: input.challenge.source,
      facts: input.challenge.facts,
    },
    signature: {
      alg: "Ed25519",
      did: null,
      value_hex: null,
      value_b64: null,
      sha256: "",
      bytes: 0,
      unsigned_reason: null,
    },
  };

  const payload = receiptPayload(receipt);
  const leaf = await signPayload(payload, input.signingKey);

  receipt.signature = {
    alg: "Ed25519",
    did: leaf.did,
    value_hex: leaf.sig_ed25519,
    value_b64: leaf.sig_ed25519 ? hexToB64(leaf.sig_ed25519) : null,
    sha256: leaf.sha256,
    bytes: leaf.bytes,
    unsigned_reason: leaf.unsigned_reason,
  };
  return receipt;
}

/**
 * Verify a receipt against a raw 32-byte Ed25519 public key (hex).
 *
 * Recomputes the canonical bytes of the receipt MINUS its signature block, checks the sha256
 * matches, and checks the signature over those same bytes. The same rule the card verifier
 * applies to a card leaf, so one key and one DID document cover both.
 */
export async function verifyHitlReceipt(
  receipt: HitlReceipt,
  pubHex: string,
): Promise<{ sha_ok: boolean; sig_ok: boolean; verifiable: boolean }> {
  if (!receipt?.signature?.sha256) return { sha_ok: false, sig_ok: false, verifiable: false };
  if (!receipt.signature.value_hex) {
    // An unsigned receipt has nothing to verify. That is a state, not a failure.
    const bytes = canonicalBytes(receiptPayload(receipt));
    const sha_ok = (await sha256Hex(bytes)) === receipt.signature.sha256;
    return { sha_ok, sig_ok: false, verifiable: false };
  }
  const res = await verifyLeaf(
    receiptPayload(receipt) as Record<string, unknown>,
    receipt.signature.sha256,
    receipt.signature.value_hex,
    pubHex,
  );
  return { ...res, verifiable: true };
}

/** The DID the receipts are attributable to. */
export const HITL_SIGNING_DID = BOARD_ATTESTATION_DID;

// ---------------------------------------------------------------------------
// STORE HELPERS
// ---------------------------------------------------------------------------

export async function putChallenge(store: KVNamespace | null, c: HitlChallenge): Promise<void> {
  if (!store) return;
  try {
    await store.put(`${HITL_PREFIX}challenge:${c.id}`, JSON.stringify(c));
  } catch {
    /* a store that refuses the write leaves the path stateless, not broken */
  }
}

export async function listChallenges(store: KVNamespace | null, limit = 50): Promise<HitlChallenge[]> {
  if (!store) return [];
  const out: HitlChallenge[] = [];
  try {
    const list = await store.list({ prefix: `${HITL_PREFIX}challenge:` });
    for (const key of list.keys.slice(0, limit)) {
      const raw = await store.get(key.name);
      if (!raw) continue;
      try {
        const c = JSON.parse(raw) as HitlChallenge;
        if (c?.id) out.push(c);
      } catch {
        /* skip an unreadable record rather than fail the list */
      }
    }
  } catch {
    /* an unreachable store yields no challenges */
  }
  return out;
}

export async function putReceipt(store: KVNamespace | null, r: HitlReceipt): Promise<void> {
  if (!store) return;
  try {
    await store.put(`${HITL_PREFIX}receipt:${r.challenge.id}`, JSON.stringify(r));
  } catch {
    /* same rule as above */
  }
}

export async function listReceipts(store: KVNamespace | null, limit = 50): Promise<HitlReceipt[]> {
  if (!store) return [];
  const out: HitlReceipt[] = [];
  try {
    const list = await store.list({ prefix: `${HITL_PREFIX}receipt:` });
    for (const key of list.keys.slice(0, limit)) {
      const raw = await store.get(key.name);
      if (!raw) continue;
      try {
        const r = JSON.parse(raw) as HitlReceipt;
        if (r?.challenge?.id) out.push(r);
      } catch {
        /* skip */
      }
    }
  } catch {
    /* an unreachable store yields no receipts */
  }
  return out;
}

/** Record that a module was completed. Returns false when there is no store to record it in. */
export async function markModuleCompleted(
  store: KVNamespace | null,
  moduleId: string,
  record: Record<string, unknown>,
): Promise<boolean> {
  if (!store) return false;
  try {
    await store.put(`${HITL_PREFIX}module:${moduleId}`, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export async function listCompletedModules(store: KVNamespace | null): Promise<string[]> {
  if (!store) return [];
  const out: string[] = [];
  try {
    const list = await store.list({ prefix: `${HITL_PREFIX}module:` });
    for (const key of list.keys) {
      const raw = await store.get(key.name);
      if (!raw) continue;
      try {
        const rec = JSON.parse(raw) as Record<string, unknown>;
        if (rec?.module_id) out.push(String(rec.module_id));
      } catch {
        /* skip */
      }
    }
  } catch {
    /* an unreachable store yields no completions */
  }
  return out;
}

/**
 * The decision counts.
 *
 * PENDING / APPROVED / REJECTED / HOLD. Derived from the persisted ledger when there is one.
 * With no store bound these are the counts of an empty ledger — which is NOT the same as "no
 * decisions were ever made", and the surface says so rather than publishing a zero that reads
 * like a fact about the world.
 */
export function decisionCounts(challenges: HitlChallenge[], receipts: HitlReceipt[]): {
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
  HOLD: number;
} {
  const decided = new Set(receipts.map((r) => r.challenge?.id).filter(Boolean));
  const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0, HOLD: 0 };
  for (const c of challenges) {
    if (decided.has(c.id)) continue;
    counts.PENDING += 1;
  }
  for (const r of receipts) {
    if (r.decision === "APPROVED") counts.APPROVED += 1;
    else if (r.decision === "REJECTED") counts.REJECTED += 1;
    else if (r.decision === "HOLD") counts.HOLD += 1;
  }
  return counts;
}

/** Is the operator's token the one this deployment expects? */
export function operatorTokenOk(env: HitlEnv, presented: string | null | undefined): boolean {
  const expected = (env.HITL_DECIDE_TOKEN ?? "").trim();
  if (!expected) return false;
  const given = String(presented ?? "").trim();
  if (!given) return false;
  return given === expected;
}

/**
 * Is the decision path open?
 *
 * A public endpoint that accepts an APPROVE without a shared secret is not a human in the loop;
 * it is a stranger in the loop. So the decision path REQUIRES an operator token, and when it is
 * not configured the path is locked — the rest of the surface still works, and says plainly that
 * the decision cannot be taken yet.
 */
export function decisionPathOpen(env: HitlEnv): boolean {
  return (env.HITL_DECIDE_TOKEN ?? "").trim().length > 0;
}

/** Is the signing key present? */
export function signingKeyConfigured(env: HitlEnv): boolean {
  return (env.BOARD_SIGN_KEY_PKCS8_B64 ?? "").trim().length > 0;
}
