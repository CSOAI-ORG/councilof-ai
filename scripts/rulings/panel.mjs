// Reviewer panel for csoai.ruling/0.1 — INTERFACE ONLY. Nothing here calls a provider.
//
// The owner adopted ruling records on 2026-09-29; convening the panel is a later step. Until it
// is built, every ruling records reviewers: [], panel_state NOT_CONVENED, panel_n_eff UNMEASURED,
// and the owner's ruling alone binds.
//
// What a reviewer will do (design note section 4.D). It does not vote on the answer. It checks:
//   1. rule_preregistered  — the rule was committed before the result it decides on;
//   2. output_reproduces   — rule_output reproduces from the pinned bytes in evidence;
//   3. evidence_hash_match — every evidence sha256 matches the bytes at its uri;
//   4. sentence_within_output — the proposed public sentence says no more than the output.
// Each reviewer returns CONCUR, DISSENT or CANNOT_REPRODUCE with the sha256 of its rationale.
//
// Independence. panel_n_eff is computed by the existing council-independence method over the
// reviewers' verdict histories, never asserted. Below 2 the panel is ADVISORY. Fault-tolerance
// wording needs >= 4 effectively independent reviewers, each with its own authenticated key;
// ruling-lib.mjs checkRecord refuses the vocabulary until then.

/**
 * @typedef {{ provider: string, model: string, family?: string, key?: string }} ReviewerSpec
 * @typedef {{ provider: string, model: string, family?: string, verdict: "CONCUR"|"DISSENT"|"CANNOT_REPRODUCE",
 *             rationale_hash: string, key?: string, sig?: string }} ReviewerVerdict
 */

export const PANEL_NOT_CONVENED = Object.freeze({
  reviewers: [],
  panel_state: "NOT_CONVENED",
  panel_n_eff: "UNMEASURED",
  panel_note: "panel not yet convened",
});

export class PanelNotConvened extends Error {
  constructor() {
    super("reviewer panel not yet convened: no provider is called in csoai.ruling/0.1 (interface stub)");
    this.name = "PanelNotConvened";
  }
}

/**
 * Ask each reviewer to check an unsigned ruling. STUB: throws; makes no network call.
 * @param {object} _unsignedRuling
 * @param {ReviewerSpec[]} _reviewers
 * @returns {Promise<ReviewerVerdict[]>}
 */
export async function reviewRuling(_unsignedRuling, _reviewers) {
  throw new PanelNotConvened();
}

/**
 * Effective number of independent reviewers. STUB: returns UNMEASURED until the
 * council-independence method is wired to real verdict histories.
 * @param {ReviewerVerdict[]} _verdicts
 * @returns {"UNMEASURED" | string}
 */
export function measurePanelNEff(_verdicts) {
  return "UNMEASURED";
}
