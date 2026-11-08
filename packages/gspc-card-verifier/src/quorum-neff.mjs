/**
 * Descriptive dependence of a review panel on one shared item set.
 *
 * n_eff = n / (1 + (n - 1) * rho) is an equicorrelation design-effect proxy.
 * It is NOT a count of Byzantine fault domains, a quorum certificate, or proof
 * of independent reviewers. Zero pairwise correlation does not imply independence.
 * Verdict agreement can reflect shared correct answers; correlated errors require
 * an independently established answer key and a separately specified evaluation.
 * Preserve DR-0007 and all historical signed observations unchanged.
 */

export function nEff(n, rho) {
  if (!Number.isSafeInteger(n) || n < 1) throw new RangeError("n must be a positive safe integer");
  if (typeof rho !== "number" || !Number.isFinite(rho) ||
      rho < -1 / (n - 1 || 1) || rho > 1) throw new RangeError("rho out of range");
  const denominator = 1 + (n - 1) * rho;
  if (denominator <= 0) throw new RangeError("singular design effect");
  const result = n / denominator;
  if (!Number.isFinite(result)) throw new RangeError("non-finite design effect");
  return result;
}

export function rhoFromNEff(n, neff) {
  if (!Number.isSafeInteger(n) || n < 2) throw new RangeError("n must be a safe integer at least 2");
  if (typeof neff !== "number" || !Number.isFinite(neff) || neff < 1)
    throw new RangeError("n_eff must be finite and at least 1");
  const rho = (n / neff - 1) / (n - 1);
  if (1 + (n - 1) * rho <= 0) throw new RangeError("singular inverse design effect");
  return rho;
}

function validateLegs(legs) {
  if (!Array.isArray(legs) || legs.length < 2) throw new RangeError("need at least two legs");
  if (!Array.isArray(legs[0]) || legs[0].length === 0) throw new RangeError("legs carry no items");
  const m = legs[0].length;
  for (let j = 0; j < legs.length; j++) {
    const leg = legs[j];
    if (!Array.isArray(leg) || leg.length !== m) throw new RangeError("legs must score the same items");
    for (let i = 0; i < m; i++) {
      if (leg[i] !== 0 && leg[i] !== 1) throw new TypeError("verdicts must be numeric 0 or 1; missing values cannot be coerced");
    }
  }
  return m;
}

/** Phi correlation of numeric binary verdict vectors, not authenticated votes. */
export function observedRho(legs) {
  const m = validateLegs(legs);
  const phis = [];
  for (let a = 0; a < legs.length; a++) {
    for (let b = a + 1; b < legs.length; b++) {
      let n11 = 0, n10 = 0, n01 = 0, n00 = 0;
      for (let i = 0; i < m; i++) {
        const x = legs[a][i], y = legs[b][i];
        if (x && y) n11++; else if (x && !y) n10++; else if (!x && y) n01++; else n00++;
      }
      const den = Math.sqrt((n11 + n10) * (n01 + n00) * (n11 + n01) * (n10 + n00));
      phis.push(den === 0 ? null : (n11 * n00 - n10 * n01) / den);
    }
  }
  const usable = phis.filter(p => p !== null);
  return {
    rho: usable.length ? usable.reduce((a, b) => a + b, 0) / usable.length : null,
    pairs: phis.length,
    degeneratePairs: phis.length - usable.length,
  };
}

/**
 * Assess descriptive panel dependence. Partial pair coverage cannot be scaled
 * to the full roster. No output authorizes an action or establishes BFT.
 * effectiveQuorum is retained as null for compatibility; a statistical design
 * effect cannot justify discounting an authenticated consensus threshold.
 */
export function assessCouncil(legs, quorum) {
  const items = validateLegs(legs), n = legs.length;
  if (quorum != null && (!Number.isSafeInteger(quorum) || quorum < 1 || quorum > n))
    throw new RangeError("quorum must be an integer within the configured roster");
  const constant = legs.filter(l => new Set(l).size === 1).length;
  const { rho, pairs, degeneratePairs } = observedRho(legs);
  const base = {
    n, items, constantLegs: constant, pairs, degeneratePairs,
    quorum: quorum ?? null, effectiveQuorum: null,
    statistic: "binary-verdict-phi/equicorrelation-design-effect",
    independence_established: false, bft_status: "NOT_DEMONSTRATED",
    execution_authorized: false,
  };
  if (rho === null) return {
    ...base, state: "UNCHECKABLE", n_eff: null, rho: null,
    why: "no pair varies enough to estimate correlation; constant verdicts do not establish rho or independence",
  };
  if (degeneratePairs) return {
    ...base, state: "PARTIAL", n_eff: null, rho: Number(rho.toFixed(4)),
    why: "correlation describes only varying pairs; a full-roster estimate is withheld because some pairs are uncheckable",
  };
  const eff = nEff(n, Math.max(0, rho));
  return {
    ...base, state: "MEASURED", rho: Number(rho.toFixed(4)),
    n_eff: Number(eff.toFixed(3)), rho_floor_for_proxy: 0,
    why: `descriptive verdict correlation on ${items} shared items; n_eff proxy ${eff.toFixed(2)}, not independent identities or fault tolerance`,
  };
}
