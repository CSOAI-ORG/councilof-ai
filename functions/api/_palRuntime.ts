// functions/api/_palRuntime.ts — one PAL, one conversation.
//
// THE ORDER OF OPERATIONS, WHICH IS THE WHOLE DESIGN
//
//   0. THE HUMAN IN THE LOOP, FIRST. A question that asks the staff member to PERFORM a
//      consequential act — publish, release, send, deploy, approve — is not answered at all. It
//      is escalated: the staff member raises a challenge and hands it to a human. This happens
//      BEFORE the records and BEFORE the model, because the one thing that must never happen is
//      a language model being asked whether it may publish something. A refusal to disclose a
//      credential is answered the same way: deterministically, before the model is consulted.
//
//   1. THE RECORDS FIRST. The published records are consulted BEFORE anything else. If they
//      answer the question, that answer is returned and the model is never consulted. This is
//      the same deterministic answerer POST /api/chat uses (functions/api/_chatGrounded.ts), so
//      a PAL and the chat can never disagree about what a record says.
//
//   2. THE MODEL SECOND, for conversation only. If the records do not answer, the PAL asks its
//      model to speak — carrying the records' facts if there were any — and says honestly when
//      no model is configured.
//
//   3. THE GUARD LAST, always. Every reply is checked against the PAL's own guardrails, and
//      against the facts, before it leaves. A reply that trips one is refused rather than
//      returned.
//
// WHY FACTS NEVER COME FROM THE MODEL
//
// The MEOK HIM learned this the hard way: a small model asked to restate a published number
// produced "the best model at governance is not applicable, as measurement is not certification"
// — for an axis that is MEASURED with a TIE. A measurement body that lets a model paraphrase
// its own numbers is not a measurement body. So the split is structural, not a prompt request:
// the model is not given the authority to produce a number, and the facts block it receives
// says so.
//
// The guard enforces that structurally too: a measurement-shaped number in the reply that the
// facts do not carry is a violation, and the reply is withheld.

import { loadBoard, boardCanon } from "./_chatCanon";
import { grounded } from "./_chatGrounded";
import {
  askModel,
  isModelFailure,
  modelConfigured,
  palSystemPrompt,
  type PalModelEnv,
} from "./_palModel";
import { suggestPal, type Pal } from "./_palRegistry";
import {
  asksForSecret,
  buildChallenge,
  detectOversightAction,
  handlesSensitiveData,
  matchAxes,
  putChallenge,
  requestsSensitiveData,
  type HitlChallenge,
} from "./_hitl";

export interface PalChatEnv extends PalModelEnv {
  /** Optional: a shared secret required to talk to a provisioned (non-house) PAL. */
  PAL_CHAT_TOKEN?: string;
  /** Optional: the store that keeps raised challenges. Absent = stateless, and it says so. */
  HITL_KV?: KVNamespace;
  /** Optional: fallback store for raised challenges. */
  PAL_MEMORY_KV?: KVNamespace;
}

export interface PalChatResult {
  /** The reply text. */
  answer: string;
  /** Where the reply came from. Never hidden from the caller. */
  state: "grounded" | "model" | "ungrounded" | "refused" | "escalated";
  /** The PAL that answered. */
  pal: { id: string; name: string; did: string; owner: string };
  /** What the records said, when they said something. */
  facts: string | null;
  /** The record the answer rests on. */
  source: string | null;
  /** Which model spoke, when one did. */
  model: { provider: string; model: string } | null;
  /** A better-placed PAL, when the question belongs to one. */
  suggested_pal: { id: string; name: string } | null;
  /** Any guardrail the reply tripped. */
  guardrail: string | null;
  /** Whether a model is configured at all. Lets a surface say so honestly. */
  model_configured: boolean;
  /** The challenge, when the question was escalated to a human. */
  challenge: HitlChallenge | null;
}

/**
 * The facts a PAL is given about a question, built from the board.
 *
 * Reads the LIVE board (never a typed copy) and produces a compact block. Every count is the
 * board's OWN published string where the board publishes one, so a PAL cannot paraphrase a
 * total differently from the page that shows it. Only published fields, and only from
 * GET /api/gspc.
 */
export function buildFacts(board: Awaited<ReturnType<typeof loadBoard>>, question: string): {
  facts: string | null;
  source: string | null;
} {
  const canon = boardCanon(board);
  const axes = board.axes ?? [];
  if (!axes.length) return { facts: null, source: null };

  const q = String(question ?? "").toLowerCase();
  // An axis is "named" when the question contains its id. Longest first so "effect-binding" is
  // matched before "effect" if both ever appear. The matcher is shared with the oversight
  // module (functions/api/_hitl.ts) so the facts a PAL reads and the module a human is tested
  // on can never be about different axes.
  const named = matchAxes(axes, q).slice(0, 3);

  const parts: string[] = [];
  // The board's own count string. Not our paraphrase of it.
  parts.push(`Board count: ${canon.publicCount}.`);
  const separation = (board.totals as any)?.separation_public_count;
  if (typeof separation === "string" && separation.trim()) {
    parts.push(`Separation: ${separation.trim()}.`);
  }

  for (const a of named) {
    const status = a.status ?? "UNMEASURED";
    const n = typeof a.n === "number" ? a.n : null;
    const sep = a.separation ?? null;
    const leader = a.leader ?? null;
    const lines = [`Axis "${a.axis}": status ${status}`];
    if (n !== null) lines.push(`n ${n}`);
    if (sep) lines.push(`separation ${sep}`);
    if (leader) lines.push(`point leader ${leader} (a point leader is not a separated leader)`);
    if (a.measurement_time?.state) lines.push(`measurement_time ${a.measurement_time.state}`);
    parts.push(lines.join(", ") + ".");
  }

  return {
    facts: parts.join(" "),
    source: named.length
      ? `GET /api/gspc → axes[] (${named.map((a: any) => a.axis).join(", ")})`
      : "GET /api/gspc → totals",
  };
}

/**
 * The guard: does this reply break one of the PAL's own rules?
 *
 * Runs on the model's output only. The records' own answers are deterministic and already
 * obey the doctrine, so checking them again would be theatre.
 */
export function replyViolatesGuardrails(reply: string, pal: Pal): string | null {
  const t = String(reply ?? "").toLowerCase();
  for (const claim of [
    "certified",
    "fully compliant",
    "compliant with the",
    "approved for",
    "safe to deploy",
    "guaranteed",
  ]) {
    if (t.includes(claim)) return claim;
  }
  // A price on a Council surface. The doctrine is that no price is published here.
  if (/[$£€]\s?\d/.test(String(reply ?? ""))) return "price";
  // A PAL must not claim to be human.
  if (/\bi am (a|an) (human|person|real person)\b/.test(t)) return "not-a-person";
  // Nor may it sell a rank.
  if (/\b(best model|top model|the winner)\b/.test(t) && !t.includes("not a separated leader")) {
    // "the best model" is only allowed when the reply also says the lead was not separated.
    return "rank";
  }
  return null;
}

/**
 * Words that make a nearby number a MEASUREMENT rather than an incidental digit.
 *
 * The guard below only enforces the facts on numbers that claim to be measurements. "There are
 * two ways to do this" is not a measurement; "there are 2 models" is. Without this distinction
 * the guard would refuse honest prose, and a guard that refuses the truth is worse than no guard
 * — the ClaimGuard in _chatCanon.ts exists because of exactly that failure.
 */
const MEASUREMENT_WORDS =
  /\b(n|count|counts|score|scores|axis|axes|model|models|leader|leaders|rank|ranks|runs?|measured|measurement|total|totals|tally|percent|percentage|points?|accuracy)\b/i;

/**
 * The numbers in a text, split into the ones that claim to be measurements and the ones that do
 * not.
 *
 * Excluded on purpose:
 *   - YEARS (1900-2099). A date is not a measurement.
 *   - A number bound to a legal citation ("Article 50", "Art. 50"). The Council's own subject
 *     matter includes article numbers; refusing those would refuse honest answers about the
 *     EU AI Act.
 */
export function measurementNumbers(text: string): { measured: string[]; other: string[] } {
  const raw = String(text ?? "");
  const measured: string[] = [];
  const other: string[] = [];
  const re = /(\d+(?:[.,]\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const value = m[1];
    const start = m.index;
    const end = start + value.length;
    const before = raw.slice(Math.max(0, start - 40), start);
    const after = raw.slice(end, end + 40);
    // A year, or a number inside a legal citation, is not a measurement.
    if (/^(19|20)\d{2}$/.test(value)) {
      other.push(value);
      continue;
    }
    if (/\b(article|art|regulation|directive|paragraph|clause)\s*$/i.test(before)) {
      other.push(value);
      continue;
    }
    const window = `${before} ${after}`;
    if (MEASUREMENT_WORDS.test(window)) measured.push(value);
    else other.push(value);
  }
  return { measured, other };
}

/**
 * The measurement numbers in a reply that the facts do not carry.
 *
 * THIS IS THE ENFORCEMENT of "a number comes from a record". A model asked to restate a
 * published measurement will round it, re-scale it, or add one of its own; any measurement
 * number in the reply that the facts block does not contain is exactly that, and the reply is
 * withheld.
 *
 * A number the facts DO carry is fine — the facts block is where the model got it.
 */
export function numbersNotInFacts(reply: string, facts: string | null): string[] {
  if (!facts) return [];
  const factNumbers = new Set(measurementNumbers(facts).measured);
  const replyNumbers = measurementNumbers(reply).measured;
  const out: string[] = [];
  for (const value of replyNumbers) {
    if (factNumbers.has(value)) continue;
    if (!out.includes(value)) out.push(value);
  }
  return out;
}

/**
 * Does the reply contradict a status the facts carry?
 *
 * The facts say an axis is MEASURED; the reply says it is UNMEASURED. That is worse than a
 * missing number — it inverts a published record. Only axes the facts actually name are
 * checked, and only the status word is compared.
 */
export function contradictsFacts(reply: string, facts: string | null): string | null {
  if (!facts) return null;
  const t = String(reply ?? "");
  const lower = t.toLowerCase();
  for (const line of facts.split(". ")) {
    const m = line.match(/Axis "([^"]+)": status ([A-Z]+)/);
    if (!m) continue;
    const [, axis, status] = m;
    if (!lower.includes(axis.toLowerCase())) continue;
    const saidUnmeasured = /\bunmeasured\b|\bnot measured\b|\bno run\b/i.test(t);
    const saidMeasured = /\bmeasured\b/i.test(t);
    if (status === "MEASURED" && saidUnmeasured) return `axis ${axis} is ${status}`;
    if (status === "UNMEASURED" && saidMeasured && !/\bnot measured\b|\bno run\b/i.test(t)) {
      return `axis ${axis} is ${status}`;
    }
  }
  return null;
}

/**
 * Talk to one PAL.
 *
 * `pals` is the registry the caller holds. The PAL is chosen by id, or by suggestion when the
 * caller does not name one.
 */
export async function talkToPal(
  env: PalChatEnv,
  args: {
    pal: Pal;
    question: string;
    /** Every PAL, so a better-placed one can be suggested. */
    all: Pal[];
    origin: string;
    /** Conversation turns so far, for context. */
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  },
): Promise<PalChatResult> {
  const pal = args.pal;
  const base = {
    pal: { id: pal.id, name: pal.name, did: pal.did, owner: pal.owner },
    model_configured: modelConfigured(env),
  };

  if (pal.status !== "active") {
    return {
      ...base,
      answer: `This staff member has been revoked and cannot answer.`,
      state: "refused",
      facts: null,
      source: null,
      model: null,
      suggested_pal: null,
      guardrail: "revoked",
      challenge: null,
    };
  }

  // 0a. A CREDENTIAL IS NEVER DISCLOSED. Deterministic, before any model is consulted.
  const secret = asksForSecret(args.question);
  if (secret) {
    return {
      ...base,
      answer:
        "I do not hold credentials for you and I will not publish one. " +
        "The Council of AI publishes measurements and the records behind them; secrets are not " +
        "among them, and neither am I.",
      state: "refused",
      facts: null,
      source: null,
      model: null,
      suggested_pal: null,
      guardrail: "secret-request",
      challenge: null,
    };
  }

  // 0b. THE BOARD, read live. Needed for the facts AND for the axis an escalation concerns.
  const board = await loadBoard(args.origin);

  // 0c. THE ESCALATION. Asked to PERFORM a consequential act, the staff member does not comply
  //     and does not ask a model whether it may. It raises a challenge for a human.
  const oversight = detectOversightAction(args.question);
  if (oversight) {
    // A challenge is a PUBLISHED record. It must not carry a credential into it, so a request
    // that would is refused here rather than escalated.
    const sensitive = requestsSensitiveData(args.question) ?? handlesSensitiveData(args.question);
    if (sensitive) {
      return {
        ...base,
        answer:
          "I will not act on that, and I will not write it down. A challenge is a published " +
          "record, and a published record carries no password, API key, token or card.",
        state: "refused",
        facts: null,
        source: null,
        model: null,
        suggested_pal: null,
        guardrail: `sensitive data: ${sensitive}`,
        challenge: null,
      };
    }
    const { facts } = buildFacts(board, args.question);
    const named = matchAxes(board.axes ?? [], args.question);
    const axisId = named.length ? String(named[0].axis) : null;
    const challenge = await buildChallenge({
      at: new Date().toISOString(),
      axis: axisId,
      subject: `${oversight.action} — ${axisId ? `the ${axisId} axis` : "an unclassified subject"}`,
      proposed_action: String(args.question ?? "").slice(0, 1200),
      raised_by: `${pal.name} (${pal.id})`,
      source: `POST /api/pals/${pal.id}/chat`,
      facts,
      required_module: axisId ? `GSPC-${axisId}` : null,
    });
    await putChallenge(env.HITL_KV ?? env.PAL_MEMORY_KV ?? null, challenge);
    return {
      ...base,
      answer:
        "I am not the one who decides this, and I will not do it on my own. " +
        "A measurement says what was observed; it never says what should happen. " +
        "I have raised this as a challenge for a human who is competent to decide it" +
        (axisId ? `, and who has read the published record for "${axisId}".` : ".") +
        " The challenge id is on this reply.",
      state: "escalated",
      facts,
      source: facts ? "GET /api/gspc → totals" : null,
      model: null,
      suggested_pal: null,
      guardrail: null,
      challenge,
    };
  }

  // 1. FACTS. The board, read live. These are what the model is handed, and what the guard
  //    measures the reply against.
  const { facts, source } = buildFacts(board, args.question);

  // 2. A better-placed PAL, if one exists. Suggestion only.
  const suggestion = suggestPal(args.all, args.question);
  const suggested =
    suggestion.pal && suggestion.pal.id !== pal.id ? suggestion.pal : null;

  // 3. THE RECORDS. The same deterministic answerer the chat uses. If a published record
  //    answers, that answer is returned and the model is never consulted.
  let recordAnswer: string | null = null;
  try {
    recordAnswer = await grounded(args.question, args.origin);
  } catch {
    // An unreachable record service is not evidence that the reader is wrong. Carry on to the
    // model with the facts we do have.
    recordAnswer = null;
  }

  if (recordAnswer) {
    return {
      ...base,
      answer: recordAnswer,
      state: "grounded",
      facts,
      source,
      model: null,
      suggested_pal: suggested ? { id: suggested.id, name: suggested.name } : null,
      guardrail: null,
      challenge: null,
    };
  }

  // 4. THE MODEL, for conversation. Facts are handed to it as authoritative.
  const system = palSystemPrompt({
    name: pal.name,
    one_line: pal.one_line,
    instructions: pal.scope.instructions,
    can: pal.scope.can,
    cannot: pal.scope.cannot,
    objectives: pal.objectives,
    guardrails: pal.guardrails,
    facts,
  });

  const conversation = [
    ...(args.history ?? []).slice(-6).map((h) => `${h.role === "user" ? "Reader" : pal.name}: ${h.content}`),
    `Reader: ${args.question}`,
  ].join("\n");

  const result = await askModel(env, { system, user: conversation });

  if (isModelFailure(result)) {
    // No model, or an unreachable one. This is NOT a failure to hide: the answer says what
    // happened and names the record that would answer the question.
    const record = facts
      ? "Here is what the published records say. "
      : "No published record answers that. ";
    const reason =
      result.reason === "unconfigured"
        ? "No language model is configured for this deployment, so I can only report records."
        : `The language model is unreachable (${result.reason}), so I can only report records.`;
    return {
      ...base,
      answer:
        record +
        (facts ? facts : "") +
        (facts ? " " : "") +
        reason +
        " I will not invent an answer.",
      state: facts ? "grounded" : "ungrounded",
      facts,
      source,
      model: null,
      suggested_pal: suggested ? { id: suggested.id, name: suggested.name } : null,
      guardrail: null,
      challenge: null,
    };
  }

  // 5. THE GUARD. Always last.
  const violation =
    replyViolatesGuardrails(result.content, pal) ??
    (requestsSensitiveData(result.content)
      ? `asks for sensitive data: ${requestsSensitiveData(result.content)}`
      : null) ??
    contradictsFacts(result.content, facts) ??
    (numbersNotInFacts(result.content, facts).length
      ? `number not in facts: ${numbersNotInFacts(result.content, facts).join(", ")}`
      : null);
  if (violation) {
    return {
      ...base,
      answer:
        "That reply was withheld: it broke a rule this staff member holds. " +
        (facts ? "Here is what the published records say instead. " + facts : "No published record answers that."),
      state: "refused",
      facts,
      source,
      model: null,
      suggested_pal: suggested ? { id: suggested.id, name: suggested.name } : null,
      guardrail: violation,
      challenge: null,
    };
  }

  return {
    ...base,
    answer: result.content,
    state: "model",
    facts,
    source,
    model: { provider: result.provider, model: result.model },
    suggested_pal: suggested ? { id: suggested.id, name: suggested.name } : null,
    guardrail: null,
    challenge: null,
  };
}
