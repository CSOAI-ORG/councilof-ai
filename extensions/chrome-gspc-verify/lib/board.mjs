/**
 * board.mjs — read the ONE authority, GET https://councilof.ai/api/gspc, and lay its
 * axes out for display. Nothing here counts anything: `totals.lid` and
 * `totals.public_count` are printed verbatim from the payload. If the payload has no
 * lid, the popup says so rather than composing one.
 */
export const BOARD_URL = "https://councilof.ai/api/gspc";

/** The withheld-leader states the API publishes (state_enum.public_leader_state). */
export const WITHHELD = Object.freeze({
  EXCLUDED_OWN_MODEL: "withheld — own model excluded",
  NO_SIGNED_CARD: "withheld — no signed card",
});

/**
 * One display row per axis. Everything is copied from the axis object; the only
 * derivation is choosing WHICH published field to show as the leader cell.
 */
export function axisRow(a) {
  const row = {
    axis: String(a.axis ?? ""),
    family: a.family ?? null,
    kind: a.kind ?? null,
    status: typeof a.status === "string" ? a.status : "UNMEASURED", // absence of a field means UNMEASURED
    separation: a.separation ?? null,
    n: Number.isFinite(a.n) ? a.n : null,
    leader: null,
    leaderState: null,
    dataset: a.dataset ?? null,
    dataset_url: a.dataset_url ?? null,
  };
  if (typeof a.public_leader_state === "string") {
    row.leaderState = a.public_leader_state;
    row.leader = WITHHELD[a.public_leader_state] ?? `withheld — ${a.public_leader_state}`;
  } else if (a.kind === "deterministic-facts") {
    row.leader = "fact run — no leader, no accuracy";
  } else if (typeof a.leader === "string" && a.leader) {
    // TIE is TIE: a tied leader is shown with its separation word, never as a win.
    row.leader = a.separation === "TIE" ? `TIE — ${a.leader}` : a.leader;
  } else {
    row.leader = "no public leader";
  }
  return row;
}

export function boardView(payload) {
  const axes = Array.isArray(payload?.axes) ? payload.axes : [];
  const totals = payload?.totals && typeof payload.totals === "object" ? payload.totals : {};
  return {
    lid: typeof totals.lid === "string" ? totals.lid : null,
    public_count: typeof totals.public_count === "string" ? totals.public_count : null,
    measured_on: payload?.measured_on ?? null,
    rows: axes.map(axisRow),
    stateEnum: payload?.state_enum ?? null,
  };
}
