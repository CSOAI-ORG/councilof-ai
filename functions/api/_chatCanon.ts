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

/** Canon: prefer published totals. Never invent a slot count. Cite live public_count. */
export function boardCanon(board: GspcBoard) {
  const axes = board.axes ?? [];
  const jail = board.jail_floor ?? axes.find(isJailAxis) ?? null;
  const measuredAxes = axes.filter(
    (a) => a.status === "MEASURED" && Number(a.n) > 0,
  );
  const quotable =
    typeof board.totals.quotable_axes === "number" ? board.totals.quotable_axes
    : typeof board.totals.axes === "number" ? board.totals.axes
    : axes.length || 14;
  const measured =
    typeof board.totals.measured_axes === "number" ? board.totals.measured_axes : measuredAxes.length;
  const publicCount =
    typeof board.totals.public_count === "string" && board.totals.public_count.trim()
      ? board.totals.public_count
      : `${measured} measured of ${quotable} quotable`;
  const sep = String(jail?.separation ?? "").toUpperCase() || "UNKNOWN";
  const jailNote = jail
    ? `**jail** is a measured containment floor on the ${quotable}-slot board (status ${jail.status ?? "MEASURED"}; separation **${sep}**)` +
      (jail.n ? `; n=${jail.n}` : "") +
      (typeof jail.accuracy === "number" ? `; accuracy ${Number(jail.accuracy).toFixed(3)}` : "") +
      `. Cite live GET /api/gspc — do not freeze counts.`
    : `**jail** is one of the ${quotable} quotable board slots when present on GET /api/gspc. Cite live totals.`;
  return { quotable, measured, publicCount, measuredAxes, jail, jailNote };
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
