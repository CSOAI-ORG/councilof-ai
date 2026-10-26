// functions/api/_palRegistry.ts — the PAL registry: CSOAI staff you can talk to, and staff you can build.
//
// WHY THIS EXISTS
//
// Tavus's central idea is that a persona is a REGISTRY RECORD, not a hand-written prompt: a
// reusable identity (name, role, tone, knowledge scope, objectives, guardrails) with its own
// memory and its own lifecycle (provision, list, revoke). One service serves all of them.
//
// The estate already had the prompt half and none of the rest. functions/api/_chatDesks.ts
// defines six desks — Measure, Press, Revenue, Watchdog, Academy, Verify — but they are
// compile-time constants: no identity, no memory, no revocation, no way for a reader to make
// their own, and NO MODEL IN THE PATH (the whole answerer is deterministic pattern matching, so
// "tell me a joke" returns a refusal rather than a reply).
//
// What this module adds, deliberately and in the estate's own idiom:
//
//   1. A PAL record with its own did:key, memory namespace, scope, objectives and guardrails.
//   2. The house staff (the six desks) expressed as PALs, so the existing /team surface and the
//      new PAL surface speak the same vocabulary.
//   3. A provision path, so a member of the public can build their own staff member.
//
// THE TWO RULES THIS MODULE NEVER BREAKS
//
// A. FACTS NEVER COME FROM A MODEL. A PAL may be asked "which model is best at governance" and
//    the answer is computed from GET /api/gspc, never generated. A small model asked to restate
//    an exact published number will paraphrase it, round it, or add a hedge — and a measurement
//    body that publishes a paraphrased number is not a measurement body. The model is used for
//    CONVERSATION; the board is the source of facts. This is the same split the MEOK HIM made
//    after its 1.7B model answered "governance is not applicable" about a MEASURED axis.
//
// B. NO PAL CLAIMS A CERTIFICATION, A PRICE, OR A HUMAN IDENTITY. A PAL is an AI agent and says
//    so (EU AI Act Art. 50(1) disclosure), it names the record its answer rests on, it says
//    UNMEASURED when no record answers the question, and it never quotes a fee.
//
// Every count here is derived at read time from the board, never typed.

import { DESKS, DESK_IDS, deskDisclosure, type DeskId } from "./_chatDesks";

export const PAL_SCHEMA = "csoai.pal/0.1";

export type PalStatus = "active" | "revoked";

/** A PAL's scope: what it is for, and what it must never do. */
export interface PalScope {
  /** Words that place a question on this PAL. Used only to SUGGEST a better PAL, never to answer. */
  keywords: string[];
  /** What this PAL can answer. */
  can: string[];
  /** What this PAL must never do. Read by the guard, not decoration. */
  cannot: string[];
  /** The instructions handed to the model when this PAL speaks. */
  instructions: string;
}

export interface PalObjective {
  id: string;
  /** What the PAL is for, in one line. */
  goal: string;
  /** How we would know it is doing its job. */
  success: string;
}

export interface PalGuardrail {
  id: string;
  /** A short, checkable rule. */
  rule: string;
  /** Why the estate holds it. */
  because: string;
}

export interface PalVoice {
  /** Preferred languages for browser speech synthesis, best first. */
  prefer_langs: string[];
  /** Speech rate, 0.5–1.5. */
  rate: number;
  /** Pitch, 0–2. */
  pitch: number;
}

export interface PalModel {
  /** The model family this PAL prefers. The runtime resolves it against a provider. */
  default: string;
  /** Used when the default is unreachable. */
  fallback: string;
}

export interface PalFace {
  /**
   * Which renderer draws this PAL's face. "orb" is the CSS face that works with no vendor and
   * no GPU. "phoenix-proxy" is the slot a video face would take, so the registry does not have to
   * be rewritten when one exists. Mirrors the MEOK HIM's face.adapter.
   */
  adapter: "orb" | "phoenix-proxy";
}

export interface Pal {
  schema: typeof PAL_SCHEMA;
  /** Stable id: <slug>-<6 hex>. */
  id: string;
  slug: string;
  name: string;
  /** One line: what this staff member is for. */
  one_line: string;
  /** Who owns it. "csoai" for house staff; "public" for a built one. */
  owner: string;
  created_at: string;
  status: PalStatus;
  /** did:key for this PAL. Every answer it gives can be signed by this key. */
  did: string;
  /** Where this PAL's memory lives. Namespaced so two PALs cannot read each other's memory. */
  memory_namespace: string;
  scope: PalScope;
  objectives: PalObjective[];
  guardrails: PalGuardrail[];
  voice: PalVoice;
  model: PalModel;
  face: PalFace;
  /** The disclosure this PAL must carry on first contact (EU AI Act Art. 50(1)). */
  disclosure: string;
}

/**
 * Art. 50(1) first-interaction notice.
 *
 * ONE sentence, one place. It lives in _chatDesks.ts because that is where the desk wording
 * already was, and /team already prints it. This module re-exports it rather than keeping a
 * second copy that could drift — a reader who meets the same agent on two surfaces must be told
 * the same thing on both.
 */
export function palDisclosure(name: string): string {
  return deskDisclosure(name);
}

/**
 * The house staff — the six desks, expressed as PALs.
 *
 * THE DESK DEFINITIONS ARE NOT COPIED HERE. DESKS in _chatDesks.ts stays the single source for
 * the /team surface AND for this registry: these records are BUILT from it, so the page and the
 * door cannot describe different staff members. There is one description of each desk, and the
 * PAL record is a different view of it — with an identity, a memory namespace, objectives and
 * guardrails added — not a second copy.
 */
export const HOUSE_PAL_SLUGS = DESK_IDS as DeskId[];
export type HousePalSlug = DeskId;

/**
 * Guardrails shared by every PAL, house or public. These are the estate's rules expressed as
 * checks a PAL's own text can be measured against.
 */
export const PAL_GUARDRAILS: PalGuardrail[] = [
  {
    id: "facts-from-records",
    rule: "Every number comes from a published record, and the record is named.",
    because:
      "A measurement body that publishes a number nobody can re-check has stopped being one. " +
      "The model frames; the board supplies the facts.",
  },
  {
    id: "no-certification",
    rule: "Never say a system is certified, compliant, approved or safe to deploy.",
    because:
      "Council of AI measures and never certifies. Verification is free forever; a grade is never sold.",
  },
  {
    id: "no-price",
    rule: "Never quote a fee. Point to the published request route instead.",
    because: "No price is published on a Council surface, and a PAL is a Council surface.",
  },
  {
    id: "not-a-person",
    rule: "Never state or imply that you are a human.",
    because: "EU AI Act Art. 50(1): the reader must know what they are talking to.",
  },
  {
    id: "empty-stays-empty",
    rule: "Say UNMEASURED when no record answers the question, and name the record that would.",
    because: "An empty cell is an answer. UNMEASURED is never 0, and never a guess.",
  },
];

/** The objectives a PAL is provisioned with when someone builds their own. */
export const DEFAULT_PAL_OBJECTIVES: PalObjective[] = [
  {
    id: "answer-from-records",
    goal: "Answer questions about published Council of AI measurement from the record that carries the answer.",
    success: "A reader can name the endpoint or card their answer came from.",
  },
  {
    id: "refuse-honestly",
    goal: "Refuse what no record covers, in one clause, and name what would be needed.",
    success: "It never invents a number, a customer, or a legal opinion.",
  },
  {
    id: "stay-in-scope",
    goal: "Stay inside the scope it was provisioned with, and hand off to a better-suited PAL.",
    success: "It names the other PAL rather than guessing.",
  },
];

/**
 * The word list that marks a question as asking for something a PAL may never do.
 *
 * This is a guard on the PAL's INSTRUCTIONS and on what it is asked to put in writing — a
 * check, not a moral instruction. It is deliberately small and specific: a wide net here would
 * refuse honest answers about regulation, which is the Council's actual subject.
 */
export const FORBIDDEN_PAL_CLAIMS = [
  "certified",
  "certification",
  "compliant with",
  "fully compliant",
  "approved for",
  "safe to deploy",
  "guaranteed",
  "risk-free",
  // A PAL is an AI agent, and Art. 50(1) disclosure is a property of the RECORD, not something
  // a persona gets to opt out of at first contact. So a description that claims a human
  // identity is refused at provisioning rather than corrected later.
  "i am a human",
  "i am human",
  "i'm human",
  "i am a person",
  "i'm a person",
  "i am not an ai",
  "i'm not an ai",
];

/**
 * Does this PAL's own text break a guardrail?
 *
 * Used when a PAL is provisioned and when its instructions are read back, so a public PAL
 * cannot smuggle a certification claim into its persona.
 */
export function palTextViolations(text: string): string[] {
  const t = String(text ?? "").toLowerCase();
  const out: string[] = [];
  for (const claim of FORBIDDEN_PAL_CLAIMS) {
    if (t.includes(claim)) out.push(claim);
  }
  // A price on a Council surface is banned everywhere; catch the obvious spellings.
  if (/[$£€]\s?\d/.test(String(text ?? ""))) out.push("price");
  return out;
}

/**
 * The house staff's scope, DERIVED from the desk it is the same person as.
 *
 * There is no second copy of a desk's can/cannot list here. A PAL record is the desk plus an
 * identity, a memory namespace, objectives and guardrails — not a paraphrase of the desk. If a
 * desk's scope changes, every PAL that names it changes with it, and the /team page and the
 * /api/pals registry cannot disagree.
 */
function houseScope(slug: HousePalSlug): { one_line: string; scope: PalScope } {
  const d = DESKS[slug];
  return {
    one_line: d.role,
    scope: {
      can: d.can,
      cannot: d.cannot,
      keywords: d.keywords,
      instructions: d.instructions,
    },
  };
}

/**
 * Build a PAL record. Pure: it takes its inputs and returns the record, so it can be tested
 * without a board, a clock or a network.
 *
 * The `did` is supplied, never invented here: a DID is an Ed25519 public key, and generating one
 * that claims to be someone's key without the private half would be exactly the forgery the
 * estate forbids. The caller provisions the keypair and passes the DID it actually holds.
 */
export function buildPal(input: {
  id: string;
  slug: string;
  name: string;
  one_line: string;
  owner: string;
  created_at: string;
  did: string;
  scope: PalScope;
  objectives?: PalObjective[];
  guardrails?: PalGuardrail[];
  voice?: Partial<PalVoice>;
  model?: Partial<PalModel>;
  face?: PalFace;
}): Pal {
  const scope = input.scope;
  return {
    schema: PAL_SCHEMA,
    id: input.id,
    slug: input.slug,
    name: input.name,
    one_line: input.one_line,
    owner: input.owner,
    created_at: input.created_at,
    status: "active",
    did: input.did,
    // The memory namespace is derived from the id, so two PALs can never share memory and a PAL
    // cannot be pointed at another's namespace by changing a field.
    memory_namespace: `pal:${input.id}`,
    scope,
    objectives: input.objectives ?? DEFAULT_PAL_OBJECTIVES,
    guardrails: input.guardrails ?? PAL_GUARDRAILS,
    voice: {
      prefer_langs: input.voice?.prefer_langs ?? ["en-GB", "en-US"],
      rate: input.voice?.rate ?? 1,
      pitch: input.voice?.pitch ?? 1,
    },
    model: {
      default: input.model?.default ?? "minimax/MiniMax-M3.1-Flash",
      fallback: input.model?.fallback ?? "minimax/MiniMax-M3",
    },
    face: input.face ?? { adapter: "orb" },
    disclosure: palDisclosure(input.name),
  };
}

/** The house staff, as PAL records. `did` is passed in because only the caller holds the key. */
export function housePals(didFor: (slug: HousePalSlug) => string, createdAt: string): Pal[] {
  return HOUSE_PAL_SLUGS.map((slug) => {
    const h = houseScope(slug);
    return buildPal({
      id: `${slug}-csoai`,
      slug,
      name: DESKS[slug].name,
      one_line: h.one_line,
      owner: "csoai",
      created_at: createdAt,
      did: didFor(slug),
      scope: h.scope,
    });
  });
}

/**
 * Which PAL should be suggested for this question?
 *
 * SUGGESTION ONLY. This never answers a question. It exists so a PAL can say "Measure is better
 * placed for that" — which is what a member of staff does when a colleague is the right desk.
 */
export function suggestPal(pals: Pal[], question: string): { pal: Pal | null; score: number } {
  const t = String(question ?? "").toLowerCase();
  if (!t) return { pal: null, score: 0 };
  let best: Pal | null = null;
  let bestScore = 0;
  for (const p of pals) {
    if (p.status !== "active") continue;
    let score = 0;
    for (const k of p.scope.keywords) {
      if (t.includes(k.toLowerCase())) score += k.length > 5 ? 2 : 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return { pal: best, score: bestScore };
}

/**
 * The public shape of a PAL. What a reader sees.
 *
 * The `did` IS included: it is the point. A PAL whose answers can be attributed and revoked is
 * worth trusting in a way an anonymous chatbot is not. The private key never leaves the key
 * store, so publishing a DID reveals nothing secret.
 */
export function publicPal(p: Pal) {
  return {
    schema: p.schema,
    id: p.id,
    slug: p.slug,
    name: p.name,
    one_line: p.one_line,
    owner: p.owner,
    status: p.status,
    did: p.did,
    can: p.scope.can,
    cannot: p.scope.cannot,
    objectives: p.objectives,
    guardrails: p.guardrails,
    voice: p.voice,
    model: p.model,
    face: p.face,
    disclosure: p.disclosure,
  };
}
