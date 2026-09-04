/**
 * Coverage rule for Attested Staged Release v0.1 (David S. Rose, CC BY 4.0), made executable.
 *
 * ASR specifies the construct and deliberately leaves the attestation wire format,
 * canonicalisation, signature scheme and identity registry to the deployment (§3.6). This is that
 * layer, plus the one decision the whole construct rests on:
 *
 *   §2 — an attestation COVERS a hold window when BOTH legs hold:
 *          (a) its signing time is at or after the window's close, AND
 *          (b) its attested position is at or beyond the window's staged record.
 *        An attestation signed before the window closed, or positioned behind the staged record,
 *        does not cover it — whatever else it attests.
 *
 * Absent coverage the hold MUST degrade to a gate (§3.2.4), and degradation is one-way: a
 * late-arriving attestation does not rescue a degraded hold. Release is never a default.
 *
 * The verdict is deliberately not a boolean. COVERED / NOT_COVERED / UNCHECKABLE, because "nobody
 * was watching" and "someone objected" are different facts, exactly as "unverifiable" and "forged"
 * are — and a reader who cannot tell them apart has lost the one that matters.
 */

export const COVERAGE = Object.freeze({
  COVERED: "COVERED",         // both legs hold; silence is evidence of no-objection
  NOT_COVERED: "NOT_COVERED", // a leg failed; the hold degrades to a gate
  UNCHECKABLE: "UNCHECKABLE", // the question could not be evaluated at all
});

const t = (v) => { const n = Date.parse(v); return Number.isNaN(n) ? null : n; };

/**
 * @param att    MonitorAttestation predicate
 * @param window { closesAt: RFC3339, stagedPosition: int, streamId?: string }
 * @param opts   { minNEff?: number, proposerId?: string }
 */
export function coversWindow(att, window, opts = {}) {
  const no = (state, why, detail) => ({ state, why, ...(detail ? { detail } : {}) });

  if (!att || typeof att !== "object") return no(COVERAGE.UNCHECKABLE, "no attestation supplied");
  if (!window || typeof window !== "object") return no(COVERAGE.UNCHECKABLE, "no window supplied");
  if (att.schemaVersion !== "councilof.ai/monitor-attestation/1")
    return no(COVERAGE.UNCHECKABLE, `unknown attestation schemaVersion: ${att.schemaVersion}`);

  const signedAt = t(att.signedAt), closesAt = t(window.closesAt);
  if (signedAt === null) return no(COVERAGE.UNCHECKABLE, "attestation signedAt is not a timestamp");
  if (closesAt === null) return no(COVERAGE.UNCHECKABLE, "window closesAt is not a timestamp");

  const pos = att.lastProcessed?.position;
  const staged = window.stagedPosition;
  if (!Number.isInteger(pos)) return no(COVERAGE.UNCHECKABLE, "attested position is not an integer");
  if (!Number.isInteger(staged)) return no(COVERAGE.UNCHECKABLE, "window stagedPosition is not an integer");

  // A position from a different stream is not a lagging position — it is an unanswered question.
  if (window.streamId && att.lastProcessed?.streamId && window.streamId !== att.lastProcessed.streamId)
    return no(COVERAGE.UNCHECKABLE, `attestation is for stream ${att.lastProcessed.streamId}, window is ${window.streamId}`);

  // §2 leg one: signed at or after the close.
  if (signedAt < closesAt)
    return no(COVERAGE.NOT_COVERED, "attestation was signed before the window closed",
      `signedAt ${att.signedAt} < closesAt ${window.closesAt}`);

  // §2 leg two: position at or beyond the staged record.
  if (pos < staged)
    return no(COVERAGE.NOT_COVERED, "attested position lags the staged record",
      `position ${pos} < stagedPosition ${staged}`);

  // §4: consumption without evaluation. Perfect attendance and zero interventions over a rolling
  // window is the documented signature of a monitor that reads and does not think.
  const iv = att.interventions;
  const flags = [];
  if (iv && Number.isInteger(iv.count) && iv.count === 0 && Number.isInteger(iv.windowSeconds))
    flags.push(`dysfunction alert: no intervention in ${iv.windowSeconds}s of attested consumption`);
  if (iv && Number.isInteger(iv.drillsSeen) && iv.drillsSeen > 0 && (iv.drillsFlagged ?? 0) === 0)
    flags.push(`failed every drill: ${iv.drillsSeen} seen, 0 flagged`);

  // Measured decorrelation, where the deployment states a floor. ASR §2 asks for a different model
  // lineage; measurement across three lineages returned rho 1.000, so lineage alone does not
  // deliver the property and a floor on n_eff is the checkable form of it.
  const ind = att.independence;
  if (typeof opts.minNEff === "number") {
    if (!ind || typeof ind.nEff !== "number")
      return no(COVERAGE.UNCHECKABLE, "a minimum n_eff was required but the attestation carries no measured independence");
    if (ind.nEff < opts.minNEff)
      return no(COVERAGE.NOT_COVERED, "measured monitor independence is below the deployment floor",
        `n_eff ${ind.nEff} < ${opts.minNEff}`);
  }

  return { state: COVERAGE.COVERED, why: "signed at or after the close, and positioned at or beyond the staged record",
           ...(flags.length ? { warnings: flags } : {}) };
}

/** ASR §3.2: resolve a hold. Release requires coverage; absence degrades to a gate, never to release. */
export function resolveHold(att, window, { objection = false, reversibility = "consequential", minNEff } = {}) {
  if (objection) return { state: "suspended", why: "monitor objected within the window; awaits the principal" };
  // §3.2: for a critical action the window exists for the monitor's benefit only — expiry never releases.
  if (reversibility === "critical")
    return { state: "staged-gated", why: "critical actions execute only on explicit principal approval, whatever the attestation state" };
  const c = coversWindow(att, window, { minNEff });
  if (c.state === COVERAGE.COVERED)
    return { state: "released", why: "attested expiry", coverage: c, ...(c.warnings ? { warnings: c.warnings } : {}) };
  return { state: "degraded-to-gate", why: `no attestation covers the window (${c.why})`, coverage: c };
}
