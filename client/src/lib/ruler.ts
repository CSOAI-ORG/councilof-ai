/**
 * ruler — the deterministic rules of THE RULER (/games/ruler), GAMES_SLATE slot 2.
 *
 * WHAT THIS FILE IS ALLOWED TO DO. Pure functions over a frozen, public item set:
 * pick a round from a seed, seat a published model answer against a simulated seat,
 * and score. No network, no clock inside a score, no model judging anything. The only
 * side effect is the optional sessionStorage helpers at the bottom, and they take the
 * storage as an argument and swallow every failure.
 *
 * THE TWO SEATS. The slate's design is two players labelling one item and betting on which
 * of them is the model. Until human results may be collected (see rulerAdmission.ts) the
 * other seat cannot be a person, so it is a SIMULATED seat: a coin seeded by the round seed
 * and the item id. It is not a person and not a model, and the page says so on every reveal.
 * The model seat is only ever a published answer from signed per-item evidence; where that
 * evidence has no usable answer the bet is not offered.
 */

export type RulerLabel = "ESCAPE" | "BENIGN";
export const RULER_LABELS: readonly RulerLabel[] = ["ESCAPE", "BENIGN"] as const;

export interface RulerItem {
  id: string;
  line_sha256: string;
  code: string;
  gold: RulerLabel;
  note: string;
  classes: string[];
  /** model id → published label, or null where the signed evidence records no usable answer. */
  model_answers: Record<string, RulerLabel | null>;
}

export type Seat = "A" | "B";

export type BetSetup =
  | { kind: "unpublished"; reason: string }
  | { kind: "indistinguishable"; model: string; label: RulerLabel }
  | { kind: "bet"; model: string; modelSeat: Seat; seats: Record<Seat, RulerLabel> };

export type BetOutcome = "correct" | "wrong" | "unscored";

export interface RoundAnswer {
  label: RulerLabel;
  /** The seat the player named as the model's; null when the bet was not offered. */
  bet: Seat | null;
}

export const RULER_ROUND_SIZE = 10;
export const RULER_SEED_PATTERN = /^[0-9a-f]{8}$/;

/** FNV-1a, 32-bit. Stable across engines; the whole game's determinism rests on it. */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** mulberry32 — a tiny seeded PRNG returning floats in [0, 1). */
export function seededRandom(seed: string): () => number {
  let state = fnv1a(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fair seeded coin: the same (seed, key) always lands the same way. */
export function seededCoin(seed: string, key: string): boolean {
  return seededRandom(`${seed}:${key}`)() < 0.5;
}

/** Same seed, same items, same order. Never mutates the input. */
export function pickRound(items: readonly RulerItem[], seed: string, size = RULER_ROUND_SIZE): RulerItem[] {
  const pool = [...items].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const rand = seededRandom(`${seed}:order`);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.max(0, Math.min(size, pool.length)));
}

/** Models with a published, usable answer for this item, in a stable order. */
export function publishedModels(item: RulerItem): string[] {
  return Object.keys(item.model_answers)
    .sort()
    .filter((model) => item.model_answers[model] === "ESCAPE" || item.model_answers[model] === "BENIGN");
}

/**
 * Seat the two answers for the bet. The model seat is a published answer or nothing;
 * the simulated seat is a seeded coin. When both seats say the same thing there is
 * nothing to tell apart, so the bet is not scored rather than scored as a guess.
 */
export function betSetup(item: RulerItem, seed: string): BetSetup {
  const models = publishedModels(item);
  if (models.length === 0) {
    return {
      kind: "unpublished",
      reason: "The signed per-item evidence records no usable model answer for this item, so there is no model seat to bet on.",
    };
  }
  const model = models[Math.floor(seededRandom(`${seed}:model:${item.id}`)() * models.length)];
  const modelLabel = item.model_answers[model] as RulerLabel;
  const simulatedLabel: RulerLabel = seededCoin(seed, `sim:${item.id}`) ? "ESCAPE" : "BENIGN";
  if (simulatedLabel === modelLabel) return { kind: "indistinguishable", model, label: modelLabel };
  const modelSeat: Seat = seededCoin(seed, `seat:${item.id}`) ? "A" : "B";
  const otherSeat: Seat = modelSeat === "A" ? "B" : "A";
  return {
    kind: "bet",
    model,
    modelSeat,
    seats: { [modelSeat]: modelLabel, [otherSeat]: simulatedLabel } as Record<Seat, RulerLabel>,
  };
}

export function scoreLabel(label: RulerLabel, item: RulerItem): boolean {
  return label === item.gold;
}

export function scoreBet(pick: Seat | null, setup: BetSetup): BetOutcome {
  if (setup.kind !== "bet" || pick === null) return "unscored";
  return pick === setup.modelSeat ? "correct" : "wrong";
}

export interface ModelTally {
  model: string;
  answered: number;
  correct: number;
  noAnswer: number;
}

export interface RoundSummary {
  items: number;
  labelled: number;
  labelCorrect: number;
  betsScored: number;
  betsCorrect: number;
  betsUnscored: number;
  /** Published model answers on the SAME items, each model on its own line. Never merged with the player's tally. */
  models: ModelTally[];
  /** What answering ESCAPE on every item would have scored on these items. */
  alwaysEscapeCorrect: number;
}

/** A local practice tally. Deterministic in (round, answers, seed). */
export function summarizeRound(
  round: readonly RulerItem[],
  answers: Readonly<Record<string, RoundAnswer>>,
  seed: string,
): RoundSummary {
  const modelIds = [...new Set(round.flatMap((item) => Object.keys(item.model_answers)))].sort();
  const models: ModelTally[] = modelIds.map((model) => ({ model, answered: 0, correct: 0, noAnswer: 0 }));
  let labelled = 0;
  let labelCorrect = 0;
  let betsScored = 0;
  let betsCorrect = 0;
  let betsUnscored = 0;
  let alwaysEscapeCorrect = 0;
  for (const item of round) {
    if (item.gold === "ESCAPE") alwaysEscapeCorrect += 1;
    for (const tally of models) {
      const published = item.model_answers[tally.model];
      if (published === "ESCAPE" || published === "BENIGN") {
        tally.answered += 1;
        if (published === item.gold) tally.correct += 1;
      } else {
        tally.noAnswer += 1;
      }
    }
    const answer = answers[item.id];
    if (!answer) continue;
    labelled += 1;
    if (scoreLabel(answer.label, item)) labelCorrect += 1;
    const outcome = scoreBet(answer.bet, betSetup(item, seed));
    if (outcome === "unscored") betsUnscored += 1;
    else {
      betsScored += 1;
      if (outcome === "correct") betsCorrect += 1;
    }
  }
  return { items: round.length, labelled, labelCorrect, betsScored, betsCorrect, betsUnscored, models, alwaysEscapeCorrect };
}

// ── local session (sessionStorage at most) ────────────────────────────────────────────────

export const RULER_SESSION_KEY = "coai.ruler.session.v1";

export interface RulerSession {
  seed: string;
  answers: Record<string, RoundAnswer>;
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isLabel(value: unknown): value is RulerLabel {
  return value === "ESCAPE" || value === "BENIGN";
}

/** Reads a saved round. Anything malformed, or any storage failure, reads as no session. */
export function loadSession(storage: StorageLike | null | undefined): RulerSession | null {
  try {
    const raw = storage?.getItem(RULER_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const { seed, answers } = parsed as { seed?: unknown; answers?: unknown };
    if (typeof seed !== "string" || !RULER_SEED_PATTERN.test(seed) || !answers || typeof answers !== "object") return null;
    const clean: Record<string, RoundAnswer> = {};
    for (const [id, value] of Object.entries(answers as Record<string, unknown>)) {
      const v = value as { label?: unknown; bet?: unknown } | null;
      if (!v || !isLabel(v.label)) continue;
      clean[id] = { label: v.label, bet: v.bet === "A" || v.bet === "B" ? v.bet : null };
    }
    return { seed, answers: clean };
  } catch {
    return null;
  }
}

export function saveSession(storage: StorageLike | null | undefined, session: RulerSession): void {
  try {
    storage?.setItem(RULER_SESSION_KEY, JSON.stringify(session));
  } catch {
    /* private mode or blocked storage: the round simply is not remembered */
  }
}

export function clearSession(storage: StorageLike | null | undefined): void {
  try {
    storage?.removeItem(RULER_SESSION_KEY);
  } catch {
    /* nothing to clear */
  }
}

/** A fresh 8-hex round seed from the browser's CSPRNG (falls back to Math.random only where there is none). */
export function newSeed(): string {
  const bytes = new Uint8Array(4);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
