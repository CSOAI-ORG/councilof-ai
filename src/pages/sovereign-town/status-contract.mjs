// SPDX-License-Identifier: Apache-2.0
// Pure parser for a SOURCE-REPORTED legacy simulation status.
// Parsing valid numbers does not authenticate the source or independently verify any episode.
export function parseSovereignSimulationStatus(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("invalid status record");
  const episodes=value.cum_episodes, hypotheticalViolations=value.ungoverned_crimes;
  if (!Number.isSafeInteger(episodes) || episodes<0 ||
      !Number.isSafeInteger(hypotheticalViolations) || hypotheticalViolations<0) {
    throw Error("source totals missing, unsafe or negative");
  }
  return Object.freeze({episodes,hypotheticalViolations,evidence_state:"SOURCE_REPORTED_NOT_INDEPENDENTLY_VERIFIED"});
}
