/**
 * holm.ts — the Holm–Bonferroni family rule for the board's model-comparison axes.
 *
 * WHY. The board runs one exact McNemar test per model-comparison axis. Read together, those tests
 * are a family: at 14 axes, fourteen naive p<0.05 verdicts carry roughly a 51% chance that at least
 * one "separated leader" is a false positive under a true global null — so the FIRST separated
 * leader the board ever publishes must clear a family rule, and the rule must be published BEFORE
 * that verdict exists (docs/measurement/GSPC-MEOK-PRODUCT-QUALIFICATION-2026-10-30 #4 already says
 * "the current pairwise p-value is not a family-wide leadership test"; this file is that sentence
 * made computable).
 *
 * HOUSE RULES. Nothing here reads a payload and nothing here is a measurement: these are the
 * properties of a named statistical procedure, and the numbers below are the arithmetic of
 * Holm (1979) — reproducible by hand. The board keeps publishing TIE where it cannot separate;
 * this file only says what a separated verdict must clear, never that one exists.
 */

/** The family-wise false-leader risk if every axis is judged at the same naive α, under a true global null. */
export function naiveFamilyFalseLeaderOdds(m: number, alpha = 0.05): number {
  if (!Number.isInteger(m) || m < 1) return NaN;
  return 1 - Math.pow(1 - alpha, m);
}

/**
 * The Holm step-down threshold for the rank-th smallest p-value in a family of m tests.
 * rank is 1-based (rank 1 = smallest p): α/(m), α/(m−1), … α/1.
 */
export function holmThresholdAt(m: number, rank: number, alpha = 0.05): number {
  if (!Number.isInteger(m) || m < 1 || !Number.isInteger(rank) || rank < 1 || rank > m) return NaN;
  return alpha / (m - rank + 1);
}

/** Every step threshold for a family of m, smallest-p first. */
export function holmThresholds(m: number, alpha = 0.05): number[] {
  if (!Number.isInteger(m) || m < 1) return [];
  return Array.from({ length: m }, (_, i) => holmThresholdAt(m, i + 1, alpha));
}

export interface HolmVerdict {
  /** How many p-values the step-down procedure rejects, in rank order. */
  rejected: number;
  /** The threshold the (rejected+1)-th smallest p would have needed, or null when all reject. */
  firstFailureThreshold: number | null;
  /** The largest p that DID clear its step, or null when none did. */
  strongestClearedP: number | null;
}

/**
 * Holm's step-down verdict for a full set of family p-values.
 * Read order matters and is part of the procedure: stop at the first p that misses its step;
 * every p after it stays un-rejected, however small, because its step was conditioned on the
 * earlier ones passing. A p-value missing (null) is a row that cannot be judged here — it is
 * NOT treated as a pass or a failure, and it still occupies its rank in the family.
 */
export function holmVerdict(pValues: (number | null)[], alpha = 0.05): HolmVerdict {
  const judged = pValues
    .map((p, i) => ({ p, i }))
    .filter((x): x is { p: number; i: number } => typeof x.p === "number" && Number.isFinite(x.p));
  judged.sort((a, b) => a.p - b.p);
  let rejected = 0;
  let firstFailureThreshold: number | null = null;
  let strongestClearedP: number | null = null;
  for (let k = 0; k < judged.length; k++) {
    const threshold = holmThresholdAt(pValues.length, k + 1, alpha);
    if (judged[k].p <= threshold) {
      rejected++;
      strongestClearedP = judged[k].p;
    } else {
      firstFailureThreshold = threshold;
      break;
    }
  }
  return { rejected, firstFailureThreshold, strongestClearedP };
}

/**
 * Planning arithmetic for the explorer: how many PAIRED bank items a McNemar test needs to
 * separate a leader, given what fraction of items the two models disagree on (discordance) and
 * how one-sided those disagreements are (skew, 0.5 = coin-flip disagreements, 1 = all one way).
 *
 * This is the score-test sample-size form, stated so it can be checked by hand:
 *   n_discordant = ( z_{1−α/2}·√0.25 + z_{1−β}·√(s(1−s)) )² / (s − 0.5)²,   n_paired = n_discordant / d
 * where d is the discordance rate and s the skew. The board's own power module
 * (functions/api/_gspc_power.ts) already serves per-axis MDE as a GENERATED figure from the
 * hash-bound per-item rows; nothing here measures anything — the reader picks the inputs and
 * the output is labelled planning arithmetic, never a property of a real bank.
 */
export function mcnemarRequiredPairedN(
  discordanceRate: number,
  skew: number,
  alpha = 0.05,
  power = 0.8,
): number | null {
  const z = (p: number): number | null => {
    // Acklam's rational approximation to the normal quantile — fine to 1e-9, checked by table.
    if (!(p > 0 && p < 1)) return null;
    const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
    const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598876e2, 6.680131188771972e1, -1.328068155288572e1];
    const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
    const pl = 0.02425;
    let q: number, r: number;
    if (p < pl) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    if (p <= 1 - pl) {
      q = p - 0.5;
      r = q * q;
      return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    }
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  };
  if (!(discordanceRate > 0 && discordanceRate <= 1)) return null;
  if (!(skew > 0.5 && skew < 1)) return null;
  if (!(alpha > 0 && alpha < 1)) return null;
  if (!(power > 0 && power < 1)) return null;
  const zA = z(1 - alpha / 2);
  const zB = z(power);
  if (zA === null || zB === null) return null;
  const s = skew;
  const nDiscordant =
    Math.pow(zA * Math.sqrt(0.25) + zB * Math.sqrt(s * (1 - s)), 2) / Math.pow(s - 0.5, 2);
  const nPaired = nDiscordant / discordanceRate;
  return Number.isFinite(nPaired) ? Math.ceil(nPaired) : null;
}
