import { wilson } from "./_chatCanon";

type AxisLike = Record<string, unknown>;

const finite = (value: unknown): number | null => {
  const n = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(n) ? n : null;
};

/** Format one named board row without manufacturing fields the row does not carry. */
export function formatAxisHit(hit: AxisLike): string {
  const axis = String(hit.axis ?? "unknown axis");
  const bench = String(hit.bench ?? "unnamed instrument");
  const status = String(hit.status ?? "UNMEASURED");
  const n = finite(hit.n) ?? 0;

  if (!(status === "MEASURED" && n > 0)) {
    return `**${axis}** (${bench}) is **${status}** — it carries no score. I will not invent one.`;
  }

  if (hit.kind === "deterministic-facts") {
    const unit = typeof hit.n_unit === "string" && hit.n_unit.trim() ? ` ${hit.n_unit.trim()}` : " observations";
    const evidence = typeof hit.evidence_url === "string" && hit.evidence_url.trim()
      ? ` Evidence: ${hit.evidence_url}.`
      : "";
    return (
      `**${axis}** (${bench}) is **MEASURED** as deterministic facts at n=${n}${unit}.\n\n` +
      `This row deliberately has no model accuracy, leader, or separation claim — measured is not the same as scored.` +
      evidence +
      `\n\n_Grounded in GET /api/gspc, not by a model._`
    );
  }

  const accuracy = finite(hit.accuracy);
  if (accuracy === null) {
    const fleetMean = finite(hit.fleet_mean);
    const publicState = typeof hit.public_leader_state === "string" ? hit.public_leader_state : "NO_PUBLIC_ACCURACY";
    return (
      `**${axis}** (${bench}) is **MEASURED** at n=${n}.\n\n` +
      `No public leader accuracy is published (${publicState}).` +
      (fleetMean === null ? "" : ` The measured fleet mean is **${fleetMean.toFixed(3)}**.`) +
      ` No missing score is converted to zero or UNMEASURED.` +
      `\n\n_Grounded in GET /api/gspc, not by a model._`
    );
  }

  const unparsed = finite(hit.unparsed_rate) ?? 0;
  const usable = n * (1 - unparsed);
  const publishedInterval = Array.isArray(hit.interval) && hit.interval.length === 2
    ? [finite(hit.interval[0]), finite(hit.interval[1])]
    : null;
  const [lo, hi] = publishedInterval?.every((v) => v !== null)
    ? (publishedInterval as [number, number])
    : wilson(accuracy, n);
  const macro = finite(hit.macro_f1);

  return (
    `**${axis}** (${bench}) is **MEASURED**.\n\n` +
    `Accuracy **${accuracy.toFixed(3)}**` +
    (usable >= 30
      ? `, Wilson 95% [${lo.toFixed(3)}, ${hi.toFixed(3)}], n=${n}.`
      : `, n=${n} — below the 30 usable-item floor, so no interval is reported.`) +
    (macro === null ? "" : `\nMacro F1 ${macro.toFixed(3)}.`) +
    ` Unparsed ${(100 * unparsed).toFixed(1)}% (counted incorrect).`
  );
}
