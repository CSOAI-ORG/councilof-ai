/**
 * Effective independence of a multi-leg review council.
 *
 * DR-0007 withdrew the fault-tolerance claim for the 33-seat council because measured seat
 * independence was n_eff 1.21 against 3 nominal legs. The retraction was correct and the number is
 * the useful part: a quorum only tolerates faults to the extent its legs fail *independently*.
 * Correlated legs do not vote, they echo.
 *
 * For n legs with mean pairwise agreement correlation rho (intra-class correlation):
 *
 *     n_eff = n / (1 + (n - 1) * rho)
 *
 * rho = 0  -> n_eff = n     (fully independent; the quorum means what it says)
 * rho = 1  -> n_eff = 1     (one opinion wearing n hats)
 *
 * A council whose legs cannot disagree has rho = 1 by construction, so n_eff = 1 no matter how
 * many seats it has. That is the state a hardcoded verdict puts you in, and it is why seats are
 * not evidence.
 */

/** Effective number of independent legs. */
export function nEff(n, rho) {
  if (!Number.isInteger(n) || n < 1) throw new RangeError("n must be a positive integer");
  if (!(rho >= -1 / (n - 1 || 1) && rho <= 1)) throw new RangeError(`rho ${rho} out of range for n=${n}`);
  return n / (1 + (n - 1) * rho);
}

/** The rho implied by an observed n_eff — the inverse, for reading a published figure. */
export function rhoFromNEff(n, neff) {
  if (n < 2) throw new RangeError("n must be at least 2");
  return (n / neff - 1) / (n - 1);
}

/**
 * Mean pairwise phi correlation over binary verdict vectors.
 * @param legs  array of equal-length arrays of 0/1 verdicts, one per leg
 */
export function observedRho(legs) {
  if (!Array.isArray(legs) || legs.length < 2) throw new RangeError("need at least two legs");
  const m = legs[0].length;
  if (m === 0) throw new RangeError("legs carry no items");
  if (legs.some((l) => l.length !== m)) throw new RangeError("legs must score the same items");

  const phis = [];
  for (let a = 0; a < legs.length; a++) {
    for (let b = a + 1; b < legs.length; b++) {
      let n11 = 0, n10 = 0, n01 = 0, n00 = 0;
      for (let i = 0; i < m; i++) {
        const x = legs[a][i] ? 1 : 0, y = legs[b][i] ? 1 : 0;
        if (x && y) n11++; else if (x && !y) n10++; else if (!x && y) n01++; else n00++;
      }
      const den = Math.sqrt((n11 + n10) * (n01 + n00) * (n11 + n01) * (n10 + n00));
      // A leg that never varies has no correlation to measure — that is a finding, not a zero.
      phis.push(den === 0 ? null : (n11 * n00 - n10 * n01) / den);
    }
  }
  const usable = phis.filter((p) => p !== null);
  return {
    rho: usable.length ? usable.reduce((a, b) => a + b, 0) / usable.length : null,
    pairs: phis.length,
    degeneratePairs: phis.length - usable.length,
  };
}

/**
 * Assess a council. Returns what the quorum actually establishes — never a bare boolean.
 * `UNCHECKABLE` when independence could not be measured at all.
 */
export function assessCouncil(legs, quorum) {
  const n = legs.length;
  const constant = legs.filter((l) => new Set(l).size <= 1).length;

  if (constant === n) {
    return {
      state: "UNCHECKABLE",
      n, n_eff: 1, rho: 1, constantLegs: constant,
      why: "every leg returned the same verdict on every item; the council cannot disagree, so its " +
           "quorum carries no information and no fault tolerance is established",
    };
  }
  const { rho, pairs, degeneratePairs } = observedRho(legs);
  if (rho === null) {
    return { state: "UNCHECKABLE", n, n_eff: null, rho: null, constantLegs: constant,
             why: "no pair of legs varied enough to estimate a correlation" };
  }
  const eff = nEff(n, Math.max(0, rho));
  return {
    state: "MEASURED",
    n, rho: Number(rho.toFixed(4)), n_eff: Number(eff.toFixed(3)),
    constantLegs: constant, pairs, degeneratePairs,
    quorum: quorum ?? null,
    // A quorum of k out of n only means k out of n_eff independent opinions.
    effectiveQuorum: quorum ? Number((quorum * (eff / n)).toFixed(3)) : null,
    why: `${n} nominal legs behave like ${eff.toFixed(2)} independent ones at mean pairwise rho ${rho.toFixed(3)}`,
  };
}
