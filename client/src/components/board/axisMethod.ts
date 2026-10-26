/**
 * axisMethod — how much to trust the number on this row, read off GET /api/gspc.
 *
 * WHY THIS FILE EXISTS. A row that prints "58.7%" and nothing else is an aggregate with
 * no comparison signal — the failure Grafana's dashboard rules call a "service-engine-soon"
 * light: it tells a reader the value and nothing about WHY it should be believed. Three
 * mined patterns decide the shape of this file:
 *
 *  · Grafana, "aggregate is not summary": every headline figure carries a comparison
 *    signal beside it, so "compared to what?" is answerable without leaving the row. For
 *    this board the comparison signal is the MDE — the smallest lead the axis's own test
 *    could have detected — beside the fleet mean and the separation p.
 *  · OpenTelemetry GenAI semantic conventions: the thing that carries a figure carries its
 *    own attributes (gen_ai.request.max_tokens, gen_ai.response.finish_reasons, the
 *    reasoning-token channel). Method metadata belongs to the row, not to a page the
 *    reader must navigate to. OpenTelemetry also records a zero rather than dropping it;
 *    here absent stays absent, which is the same discipline from the other side.
 *  · Grafana, "overview first, zoom and filter, details on demand": the row shape stays
 *    constant and the detail opens in place.
 *
 * EVERY VALUE HERE IS READ, NEVER TYPED. An absent field is a labelled absence — never a
 * zero, never a number of our own, never a verdict of ours. Nothing in this file measures
 * anything, and nothing in it ranks anything.
 */

export interface AxisLike {
  mde?: unknown;
  separation_p?: unknown;
  separation_sentence?: unknown;
  separation_method?: unknown;
  measurement_time?: unknown;
  leader_card_state?: unknown;
  leader_card_note?: unknown;
  peritem_file_sha256?: unknown;
  [key: string]: unknown;
}

/* ── resolution: the smallest lead this axis could have detected ─────────── */

export interface MdeRead {
  /** The value exactly as the board serves it (0.138 stays "0.138"). */
  text: string;
  value: number;
  /** The board's own state for the MDE. "MEASURED" is not assumed. */
  state: string;
  unit: string | null;
  alpha: number | null;
  power: number | null;
}

const numOrNull = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/**
 * The axis's minimum detectable effect, or null when the board does not publish one.
 *
 * Accepts both shapes the wire has carried: a bare number, and the object with value /
 * state / unit / alpha / power. A number with no state is still read, but it is reported
 * with the state the board gave it — not one we invented.
 */
export function axisMde(a: AxisLike): MdeRead | null {
  const raw = a?.mde;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return { text: String(raw), value: raw, state: "MEASURED", unit: null, alpha: null, power: null };
  }
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const value = numOrNull(o.value);
  if (value === null) return null;
  const state = typeof o.state === "string" && o.state.trim() ? o.state.trim() : "MEASURED";
  return {
    text: String(o.value),
    value,
    state,
    unit: typeof o.unit === "string" && o.unit.trim() ? o.unit.trim() : null,
    alpha: numOrNull(o.alpha),
    power: numOrNull(o.power),
  };
}

/**
 * The resolution sentence, in words. It says what the axis COULD have detected, so a
 * reader can place a point lead against it without doing arithmetic of their own.
 */
export function mdeSentence(a: AxisLike): string | null {
  const mde = axisMde(a);
  if (!mde) return null;
  let sentence = `a lead of ${mde.text} or more is what this axis could detect`;
  if (mde.alpha !== null) sentence += `, at alpha ${mde.alpha}`;
  if (mde.power !== null) sentence += ` with power ${mde.power}`;
  if (mde.unit) sentence += ` — ${mde.unit}`;
  return `${sentence}.`;
}

/* ── the separation test and its p ───────────────────────────────────────── */

/** separation_p as served, or null. Never rounded into a verdict. */
export function separationP(a: AxisLike): number | null {
  return numOrNull(a?.separation_p);
}

/**
 * The board's own sentence about the separation — quoted verbatim. It already states the
 * test, the threshold and the p, so we never re-derive or paraphrase a determination.
 */
export function separationSentence(a: AxisLike): string | null {
  const s = a?.separation_sentence;
  return typeof s === "string" && s.trim() ? s.trim() : null;
}

/* ── when the measurement was made, and at what precision ────────────────── */

export interface MeasuredOnRead {
  observedOn: string;
  /** "day", "second" — whatever precision the source published. */
  precision: string | null;
  state: string | null;
  note: string | null;
}

/** When the run behind this axis was made, at the precision the source published. */
export function measuredOn(a: AxisLike): MeasuredOnRead | null {
  const raw = a?.measurement_time;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const observedOn = typeof o.observed_on === "string" && o.observed_on.trim() ? o.observed_on.trim() : null;
  if (!observedOn) return null;
  return {
    observedOn,
    precision: typeof o.precision === "string" && o.precision.trim() ? o.precision.trim() : null,
    state: typeof o.state === "string" && o.state.trim() ? o.state.trim() : null,
    note: typeof o.note === "string" && o.note.trim() ? o.note.trim() : null,
  };
}

/* ── the leader's card: does it back the number shown? ──────────────────── */

/**
 * What the leader's signed card does and does not support.
 *
 * This is the honesty load-bearer: a card can exist and still NOT back the figure on the
 * row. "CARD_RECORDS_A_DIFFERENT_MEASUREMENT" means the card records a different
 * measurement, so the number beside it is not carded. That state must be visible next to
 * the number, not three clicks away.
 */
export function leaderCardState(a: AxisLike): string | null {
  const s = a?.leader_card_state;
  if (typeof s !== "string" || !s.trim()) return null;
  const state = s.trim();
  if (state === "CARD_RECORDS_A_DIFFERENT_MEASUREMENT") {
    return "the signed card for this leader records a DIFFERENT measurement, so it does not back the number shown";
  }
  if (state === "NO_SIGNED_PER_MODEL_CARD") {
    return "no signed per-model card stands behind this leader";
  }
  // Unknown states print as served — never folded into a state we invented.
  return state;
}

/* ── the rows the number was computed from ───────────────────────────────── */

/** The per-item rows file sha, as served. Null when the board publishes none. */
export function peritemSha(a: AxisLike): string | null {
  const s = a?.peritem_file_sha256;
  return typeof s === "string" && s.trim() ? s.trim() : null;
}
