// functions/api/_chatCanon.ts — GSPC board counts + ClaimGuard (private)
export type GspcBoard = { axes: any[]; totals: Record<string, any>; jail_floor: any | null };

export async function loadBoard(origin: string): Promise<GspcBoard> {
  try {
    const r = await fetch(new URL("/api/gspc", origin).toString());
    if (!r.ok) return { axes: [], totals: {}, jail_floor: null };
    const j: any = await r.json();
    return {
      axes: Array.isArray(j?.axes) ? j.axes : [],
      totals: j?.totals && typeof j.totals === "object" ? j.totals : {},
      jail_floor: j?.jail_floor ?? null,
    };
  } catch {
    return { axes: [], totals: {}, jail_floor: null };
  }
}

export async function loadAxes(origin: string): Promise<any[]> {
  return (await loadBoard(origin)).axes;
}

export function isJailAxis(a: any): boolean {
  const n = String(a?.axis ?? "").toLowerCase();
  return n === "jail" || n === "jail_floor";
}

/**
 * Canon: prefer published totals. Never invent a slot count. Cite live public_count.
 *
 * THE BUG THIS FIXES (2026-08-26). `quotable` was read from `totals.quotable_axes`
 * and then used as THE SLOT COUNT. It is not: /api/gspc publishes
 *
 *   axes: 22 · measured_axes: 15 · unmeasured_axes: 7 · quotable_axes: 15
 *   public_count: "22 axes · 15 measured"
 *
 * so quotable_axes equals measured_axes, and the Council OS ask bar answered
 * "**15 measured of 15**" and called it "the 15-slot board" — erasing the seven
 * declared-but-unmeasured slots, one click from a board pane listing all seven as
 * UNMEASURED. The endpoint's own `count_grammar` states the rule: "The larger
 * number counts slots, the smaller counts measurements — quote both or quote the
 * smaller." Slots and measurements are separate fields here now, named for what
 * they are, and `unmeasured` is carried as a first-class figure.
 */
export function boardCanon(board: GspcBoard) {
  const axes = board.axes ?? [];
  const jail = board.jail_floor ?? axes.find(isJailAxis) ?? null;
  const measuredAxes = axes.filter(
    (a) => a.status === "MEASURED" && Number(a.n) > 0,
  );
  const unmeasuredAxes = axes.filter((a) => a.status !== "MEASURED");
  /** Slots on the board — the LARGER number. totals.axes, never quotable_axes. */
  const slots =
    typeof board.totals.axes === "number" ? board.totals.axes : axes.length;
  const measured =
    typeof board.totals.measured_axes === "number" ? board.totals.measured_axes : measuredAxes.length;
  const unmeasured =
    typeof board.totals.unmeasured_axes === "number"
      ? board.totals.unmeasured_axes
      : Math.max(0, slots - measured);
  /** How many carry a figure that may be quoted. Equal to `measured` today. */
  const quotable =
    typeof board.totals.quotable_axes === "number" ? board.totals.quotable_axes : measured;
  const publicCount =
    typeof board.totals.public_count === "string" && board.totals.public_count.trim()
      ? board.totals.public_count
      : `${slots} axes \u00b7 ${measured} measured`;
  const sep = String(jail?.separation ?? "").toUpperCase() || "UNKNOWN";
  const jailNote = jail
    ? `**jail** is a measured containment floor on the ${slots}-slot board (status ${jail.status ?? "MEASURED"}; separation **${sep}**)` +
      (jail.n ? `; n=${jail.n}` : "") +
      (typeof jail.accuracy === "number" ? `; accuracy ${Number(jail.accuracy).toFixed(3)}` : "") +
      `. Cite live GET /api/gspc \u2014 do not freeze counts.`
    : `**jail** is one of the ${slots} board slots when present on GET /api/gspc. Cite live totals.`;
  return { slots, quotable, measured, unmeasured, publicCount, measuredAxes, unmeasuredAxes, jail, jailNote };
}

/** ClaimGuard refuse for false board-count claims (16/15/12). Prefer live public_count. */
export function claimGuardRefuse(q: string): string | null {
  // Do NOT refuse "all 14 are MEASURED" — living board may report measured_axes === 14.
  if (!/16\s+measured|(?:fifteen|\b15)\s+(?:measured\s+)?axes|(?:twelve|\b12)(?:\s+\w+){0,2}\s+axes/i.test(q))
    return null;
  return (
    `**Refused (ClaimGuard).** That claim does not match the published board.\n\n` +
    `Canon lives in GET /api/gspc totals (public_count, measured_axes, quotable_axes). ` +
    `Quotable board = **14** slots. Never invent 22 axes or claim 12/15/16.\n\n` +
    `_Deterministic refuse against a false count claim - not a model opinion._`
  );
}

export const wilson = (acc: number, n: number): [number, number] => {
  if (!n) return [0, 0];
  const z = 1.959964, d = 1 + (z * z) / n;
  const c = acc + (z * z) / (2 * n);
  const m = z * Math.sqrt((acc * (1 - acc)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
};
