/**
 * Decide whether a regulation fingerprint is a confirmed source change.
 *
 * Authoritative revision headers win when both observations expose the same
 * header type. Body-only fingerprints must repeat on two consecutive runs;
 * this suppresses CDN and rendering churn without silently accepting it as a
 * new baseline.
 */
export function assessFingerprint(previous, current, observedAt) {
  const firstSeen = previous.first_seen ?? observedAt;

  const stableNext = {
    ...previous,
    ...current,
    first_seen: firstSeen,
    checked: observedAt,
  };
  delete stableNext.pending_body_sha256;
  delete stableNext.pending_first_seen;
  delete stableNext.pending_seen;
  delete stableNext.last_error;

  if (previous.last_modified && current.last_modified) {
    return {
      changed: previous.last_modified !== current.last_modified,
      basis: "last-modified",
      confirmations: 1,
      next: stableNext,
    };
  }

  if (previous.etag && current.etag) {
    return {
      changed: previous.etag !== current.etag,
      basis: "etag",
      confirmations: 1,
      next: stableNext,
    };
  }

  if (previous.body_sha256 === current.body_sha256) {
    return {
      changed: false,
      basis: "body-stable",
      confirmations: 0,
      next: stableNext,
    };
  }

  if (previous.pending_body_sha256 === current.body_sha256) {
    return {
      changed: true,
      basis: "body-two-consecutive-observations",
      confirmations: 2,
      next: stableNext,
    };
  }

  return {
    changed: false,
    basis: "body-candidate-pending-confirmation",
    confirmations: 1,
    next: {
      ...previous,
      checked: observedAt,
      pending_body_sha256: current.body_sha256,
      pending_first_seen: observedAt,
      pending_seen: 1,
    },
  };
}
