/**
 * fill-7 chrome honesty — temporary Surface overlay until Measure restores GET.
 *
 * Live GET https://councilof.ai/api/gspc currently stamps all 22 axes MEASURED
 * (fill-7). CEO lock: Surface chrome must present 22·15·7 honesty —
 * 15 MEASURED + 7 empty/UNMEASURED financial slots — and must NOT render those
 * seven financial cells as MEASURED scores. This module never invents scores
 * and does not change the signed stamp / API writer (Measure owns GET restore).
 *
 * When GET returns honest 15/7 (the seven slots already UNMEASURED), this is a
 * no-op. Remove once Measure restores the wire.
 */
export const FILL7_EMPTY_FINANCIAL_AXES = [
  "reserve-attestation",
  "regulatory-framework",
  "distribution-integrity",
  "custody-disclosure",
  "ai-adoption-components",
  "labour-components",
  "humanoid-labour-index",
] as const;

/** Historical / alternate names that resolve onto the live empty-slot ids. */
const AXIS_ALIASES: Record<string, string> = {
  "ai-economy-index": "ai-adoption-components",
  "human-labour-index": "labour-components",
  "human-labour": "labour-components",
  "humanoid-labour": "humanoid-labour-index",
};

export const FILL7_PUBLIC_COUNT = "22 axis · 15 measured · 7 empty";
export const FILL7_HONEST_MEASURED = 15;
export const FILL7_HONEST_UNMEASURED = 7;

export function canonFill7AxisId(id: string): string {
  const k = String(id || "").trim().toLowerCase();
  return AXIS_ALIASES[k] ?? k;
}

export function isFill7EmptyFinancialAxis(id: string): boolean {
  const c = canonFill7AxisId(id);
  return (FILL7_EMPTY_FINANCIAL_AXES as readonly string[]).includes(c);
}

/**
 * fill-7 stamp: board reports 22 measured / 0 unmeasured AND the known seven
 * financial empty slots are present as MEASURED.
 */
export function isFill7Stamp(payload: any): boolean {
  const axes = Array.isArray(payload?.axes) ? payload.axes : [];
  if (axes.length !== 22) return false;
  const t = payload?.totals;
  const measuredFromAxes = axes.filter(
    (a: any) => String(a?.status || "").toUpperCase() === "MEASURED",
  ).length;
  const measured =
    typeof t?.measured_axes === "number" ? t.measured_axes : measuredFromAxes;
  const unmeasured =
    typeof t?.unmeasured_axes === "number" ? t.unmeasured_axes : axes.length - measured;
  if (!(measured === 22 && unmeasured === 0)) return false;

  let hit = 0;
  for (const a of axes) {
    const id = String(a?.axis ?? "");
    if (
      isFill7EmptyFinancialAxis(id) &&
      String(a?.status || "").toUpperCase() === "MEASURED"
    ) {
      hit += 1;
    }
  }
  return hit >= 7;
}

function emptyFinancialChromeRow(a: any): any {
  // Drop score-like fields so chrome cannot paint FACTS / MEASURED cells.
  const {
    accuracy: _accuracy,
    coverage: _coverage,
    evidence_url: _evidence,
    leader: _leader,
    separation: _separation,
    fleet_mean: _fleet,
    interval: _interval,
    ...rest
  } = a;
  return {
    ...rest,
    status: "UNMEASURED",
    kind: "declared-slot",
    n: 0,
    note:
      typeof rest.note === "string" && rest.note.trim()
        ? rest.note
        : "Chrome honesty (fill-7): empty financial slot until GET restored. Not a MEASURED score.",
  };
}

/**
 * Apply chrome honesty to a GET /api/gspc-shaped payload. Idempotent. Never
 * invents a score; only clears the seven known empty financial slots and
 * rewrites the quotable count line while fill-7 is on the wire.
 */
export function applyFill7ChromeHonesty<T>(payload: T): T {
  if (!payload || typeof payload !== "object") return payload;
  if (!isFill7Stamp(payload)) return payload;

  const p: any = payload;
  const axes = Array.isArray(p.axes)
    ? p.axes.map((a: any) => {
        if (!a || typeof a !== "object") return a;
        if (!isFill7EmptyFinancialAxis(String(a.axis ?? ""))) return a;
        return emptyFinancialChromeRow(a);
      })
    : p.axes;

  const prevTotals = p.totals && typeof p.totals === "object" ? p.totals : {};
  const byFamily =
    prevTotals.by_family && typeof prevTotals.by_family === "object"
      ? {
          ...prevTotals.by_family,
          financial: {
            ...(prevTotals.by_family.financial || {}),
            axes: 8,
            measured: 1,
            note:
              "Chrome honesty (fill-7): 1 MEASURED (provenance-controls) + 7 empty until GET restored. Measure owns the wire.",
          },
        }
      : prevTotals.by_family;

  const totals = {
    ...prevTotals,
    axes: 22,
    measured_axes: FILL7_HONEST_MEASURED,
    unmeasured_axes: FILL7_HONEST_UNMEASURED,
    quotable_axes: FILL7_HONEST_MEASURED,
    public_count: FILL7_PUBLIC_COUNT,
    count_grammar:
      "22 axis are on the board; 15 of them carry a measurement and 7 are declared financial slots with no run behind them (chrome honesty while GET fill-7 is restored). Quote both counts — never stamp the 7 empty slots MEASURED.",
    by_family: byFamily,
  };

  return {
    ...p,
    axes,
    totals,
    chrome_honesty: "fill-7→22·15·7",
  };
}
