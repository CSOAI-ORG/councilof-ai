import { quotableWire, type WireAxis, type WireBoard } from "./boardWire";

/**
 * evidenceIndex — the Evidence-pack pane's artefact, as a PURE function.
 *
 * This deliberately does not live inside the component. The pane's whole claim is
 * that it cannot emit a number an axis has not earned, and that it cannot hide an
 * omission. A claim like that belongs in something a test can hold still and
 * interrogate, not in a branch buried in JSX that nobody can assert against.
 *
 * THE THREE INVARIANTS, ALL COVERED BY evidenceIndex.test.ts:
 *   1. A row carries `leader_accuracy` ONLY when `quotableWire()` passes. Every
 *      other row carries `no_score_reason` instead — never a zero, never a blank.
 *   2. Every axis on the board appears SOMEWHERE: included, not_included (the
 *      reader's own omission, named), or not_quotable_on_this_board. An index that
 *      quietly drops a losing axis is a misleading index.
 *   3. Every `*_count` equals the length of the array beside it. No count is typed.
 */

export const NO_SCORE_REASON = {
  untested:
    "MEASURED, but no separation determination has been run on this bank yet (UNTESTED)",
  unmeasured:
    "status is not MEASURED on the live board — UNMEASURED is the verdict, not an absence",
} as const;

export interface EvidenceInput {
  board: WireBoard;
  /** The axis the reader ticked. Must be a subset of `board.axes`. */
  included: WireAxis[];
  system: string;
  provider: string;
  /** Injected so the artefact is deterministic under test. */
  now: string;
}

export function noScoreReason(a: WireAxis): string {
  return a.status === "MEASURED" ? NO_SCORE_REASON.untested : NO_SCORE_REASON.unmeasured;
}

function evidenceRow(a: WireAxis): Record<string, unknown> {
  const row: Record<string, unknown> = {
    axis: a.axis,
    bench: a.bench,
    task: a.task,
    status: a.status,
    n: a.n,
    separation: a.separation,
  };
  if (a.n_note) row.n_note = a.n_note;
  if (typeof a.separation_p === "number") row.separation_p = a.separation_p;
  if (a.separation_basis) row.separation_basis = a.separation_basis;

  // ── invariant 1 ─────────────────────────────────────────────────────────
  if (quotableWire(a)) {
    row.leader = a.leader ?? "not published on this stamp";
    row.leader_accuracy = a.accuracy;
    if (a.accuracy_is) row.leader_accuracy_is = a.accuracy_is;
    row.leader_interval_95 =
      a.interval ?? "not published — n is not honestly independent on this bank";
    if (typeof a.fleet_mean === "number") row.fleet_mean = a.fleet_mean;
    if (a.fleet) row.fleet = a.fleet;
  } else {
    row.no_score_reason = noScoreReason(a);
  }

  // The bank is the frozen split a stranger recomputes from. NEVER construct the
  // URL from `bank`: the axis are `governance`/`safety` while the banks are
  // `gspc-gov`/`gspc-agi`, so a constructed link 401s. Report the absence instead
  // — /api/gspc resolves `dataset_url` itself, and until it does, saying so is the
  // honest answer.
  row.bank = a.dataset ?? "not published";
  row.bank_url = a.dataset_url ?? "no resolvable URL published for this axis — resolve the bank slug above at the publisher";
  if (a.note) row.note = a.note;
  return row;
}

export function composeEvidenceIndex(input: EvidenceInput): Record<string, unknown> {
  const { board, included, system, provider, now } = input;
  const inSet = new Set(included.map((a) => a.axis));
  const notIncluded = board.axes.filter((a) => !inSet.has(a.axis));
  const notQuotable = board.axes.filter((a) => !quotableWire(a) || a.separation === "UNTESTED");

  return {
    schema: "csoai.evidence-index/0.1",
    what_this_is:
      "An index of the PUBLISHED Council of AI measurements a reader can retrieve and recompute " +
      "for the named subject. Compiled on this device from GET /api/gspc — this index is not " +
      "itself signed. The signed objects are the per-axis cards; they verify against the " +
      "published key at /gspc-verify without contacting us.",
    what_this_is_not:
      "Not a certification, not a conformity assessment, not an accreditation, and not legal " +
      "advice. Council of AI is a measurement body. A determination of compliance stays with " +
      "the authorities.",
    compiled_on: now,
    compiled_on_note: "This device's clock. The measurement dates are the board's, below.",
    subject: {
      system: system.trim() || "UNNAMED — fill in the system this index is about",
      provider: provider.trim() || "UNNAMED",
    },
    board: {
      source: "GET https://councilof.ai/api/gspc",
      issuer: board.issuer,
      doi: board.doi,
      measured_on: board.measuredOn,
      public_count: board.publicCount,
      license: board.license,
    },
    // ── invariants 2 and 3 ────────────────────────────────────────────────
    included_count: included.length,
    included: included.map(evidenceRow),
    not_included_count: notIncluded.length,
    not_included: notIncluded.map((a) => ({
      axis: a.axis,
      reason: "left out by whoever compiled this index — named here so the omission is visible",
      status: a.status,
      separation: a.separation,
    })),
    not_quotable_on_this_board_count: notQuotable.length,
    not_quotable_on_this_board: notQuotable.map((a) => ({
      axis: a.axis,
      status: a.status,
      separation: a.separation,
      reason: noScoreReason(a),
    })),
    in_lane_not_board_rows: board.inLane.map((l) => ({
      axis: l.axis,
      status: l.status,
      note: "published beside the board, never counted in the board totals — do not quote as a board row",
    })),
    standing_limitations: board.limitations,
    verify: {
      in_browser: "https://councilof.ai/gspc-verify",
      published_key: "https://councilof.ai/.well-known/did.json",
      method: "https://councilof.ai/methodology",
      cost: "Verification is free for everyone, forever. A grade is never sold.",
    },
  };
}
