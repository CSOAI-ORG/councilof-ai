/**
 * denominator.ts — the one reader of a measurement card's DENOMINATOR.
 *
 * WHY THIS FILE EXISTS. A pod card publishes `n` and, inside compute_evidence, the
 * attempts it threw away: `parse_errors_excluded` and `transport_errors_excluded`.
 * Every rendered and derived surface carried `n` alone, so a reader of
 * `"n": 235, "status": "MEASURED"` had no way to know that 237 items were put to the
 * model and 2 were dropped. The exclusions were signed into the bytes and silently
 * lost on the way out. Worse in the tail of the corpus: a card at n 77 sits on 122
 * excluded attempts, and one at n 2 on 39.
 *
 * VOCABULARY. The names are /api/worker's (functions/api/worker.ts), which has carried
 * attempted / correct / parse_errors_excluded / graded_n correctly all along. The estate
 * gets one vocabulary, not two.
 *
 * THE ARITHMETIC IS THE PRODUCER'S, INVERTED. scripts/runpod_gspc_worker.py computes
 *   graded_n = transport_ok - parse_errors      (transport_ok = attempted - transport_errors)
 * and writes `body.n = graded_n`. So the card's n is the GRADED denominator and
 *   attempted = n + parse_errors_excluded + transport_errors_excluded.
 * `attempted` is DERIVED here and the card body never carries it; it is null unless all
 * three components are integers on the bytes.
 *
 * ZERO AND ABSENT ARE DIFFERENT. A card that publishes `parse_errors_excluded: 0`
 * excluded nothing. A card that publishes no such field (real: the hub cards, and
 * signed-governan-3c96b82c7e64.json in the pod corpus) says nothing about its
 * exclusions, and gets null plus a state — never 0.
 *
 * Kept in step with the build-time index reader (scripts/surface/build-pod-cards-index.mjs
 * `denominatorFields`) by functions/_lib/denominator.parity.test.ts, which runs the same
 * table through both and requires identical output.
 */

export type ExclusionsState = "EXCLUSIONS_PUBLISHED" | "EXCLUSIONS_PARTIAL" | "EXCLUSIONS_ABSENT";

export type Denominator = {
  /** The card's own n, untouched. */
  n: number | null;
  /** n restated in the shared vocabulary — only when the card publishes both exclusion counts. */
  graded_n: number | null;
  parse_errors_excluded: number | null;
  transport_errors_excluded: number | null;
  /** DERIVED: graded_n + the two exclusions. null when any component is absent. */
  attempted: number | null;
  exclusions_state: ExclusionsState;
};

const int = (v: unknown): number | null => (Number.isInteger(v) ? (v as number) : null);

/** Read the denominator out of a measurement-card BODY (the signed bytes). */
export function readDenominator(body: unknown): Denominator {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const raw = b.compute_evidence;
  const ce = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const n = int(b.n);
  const parse_errors_excluded = int(ce.parse_errors_excluded);
  const transport_errors_excluded = int(ce.transport_errors_excluded);
  const present = (parse_errors_excluded !== null ? 1 : 0) + (transport_errors_excluded !== null ? 1 : 0);
  const exclusions_state: ExclusionsState =
    present === 2 ? "EXCLUSIONS_PUBLISHED" : present === 1 ? "EXCLUSIONS_PARTIAL" : "EXCLUSIONS_ABSENT";
  const complete = present === 2 && n !== null;
  return {
    n,
    graded_n: complete ? n : null,
    parse_errors_excluded,
    transport_errors_excluded,
    attempted: complete ? (n as number) + (parse_errors_excluded as number) + (transport_errors_excluded as number) : null,
    exclusions_state,
  };
}

/**
 * The same thing in words, for a reader who will not open the raw JSON. Returns null
 * when there is no n to talk about — the caller then renders nothing rather than a
 * sentence about an absent number.
 */
export function denominatorSentence(d: Denominator): string | null {
  if (d.n === null) return null;
  if (d.exclusions_state === "EXCLUSIONS_ABSENT") {
    return `${d.n} graded. This record publishes no excluded-attempt counts, so how many attempts stand behind it is unknown — unknown, not zero.`;
  }
  if (d.exclusions_state === "EXCLUSIONS_PARTIAL") {
    const known =
      d.parse_errors_excluded !== null
        ? `${d.parse_errors_excluded} excluded (parse errors)`
        : `${d.transport_errors_excluded} excluded (transport errors)`;
    return `${d.n} graded, ${known}. The other excluded-attempt count is absent, so the attempts behind this record cannot be completed.`;
  }
  const parts: string[] = [];
  if ((d.parse_errors_excluded as number) > 0) parts.push(`${d.parse_errors_excluded} excluded (parse errors)`);
  if ((d.transport_errors_excluded as number) > 0) parts.push(`${d.transport_errors_excluded} excluded (transport errors)`);
  if (parts.length === 0) return `${d.graded_n} graded of ${d.attempted} attempted — no attempts excluded.`;
  return `${d.graded_n} graded, ${parts.join(", ")} — ${d.attempted} attempted. The score's denominator is the graded count, not the attempts.`;
}

/** Said once, wherever the denominator is published, so no reader has to infer the rule. */
export const DENOMINATOR_RULE =
  "A card's n is graded_n: the attempts that produced a parseable label. attempted = graded_n + parse_errors_excluded + transport_errors_excluded, derived — the card body carries no `attempted`. A count the card does not publish is null with EXCLUSIONS_ABSENT, never 0.";

/**
 * The board and a card both publish something called n and they are not the same number.
 * Stated without figures on purpose: the figures move, the relation does not.
 */
export const BOARD_AXIS_N_IS_NOT_CARD_N =
  "/api/gspc publishes a per-axis n — the item count of that axis's public bank, i.e. the attempts. A card's n is ONE model's graded_n against that bank, so the two differ by exactly that card's excluded attempts. Read `attempted` here before concluding the two numbers disagree; neither is adjusted to match the other.";
