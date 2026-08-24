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

/** Canon: prefer published totals. Jail = floor / UNTESTED. Never invent a slot count. */
export function boardCanon(board: GspcBoard) {
  const axes = board.axes ?? [];
  const jail = board.jail_floor ?? axes.find(isJailAxis) ?? null;
  const boardAxes = axes.filter((a) => !isJailAxis(a));
  const measuredAxes = boardAxes.filter(
    (a) => a.status === "MEASURED" && Number(a.n) > 0 && String(a.separation ?? "").toUpperCase() !== "UNTESTED",
  );
  const quotable =
    typeof board.totals.quotable_axes === "number" ? board.totals.quotable_axes
    : typeof board.totals.axes === "number" ? board.totals.axes
    : boardAxes.length + (jail ? 1 : 0);
  const measured =
    typeof board.totals.measured_axes === "number" ? board.totals.measured_axes : measuredAxes.length;
  const publicCount =
    typeof board.totals.public_count === "string" && board.totals.public_count.trim()
      ? board.totals.public_count
      : `${measured} measured of ${quotable} quotable`;
  const jailNote = jail
    ? `**jail** is a measured **floor** (not a board axis). Separation **UNTESTED**` +
      (jail.n ? `; n=${jail.n}` : "") +
      (typeof jail.accuracy === "number" ? `; accuracy ${Number(jail.accuracy).toFixed(3)}` : "") +
      `. Not counted in the ${measured} board-measured axes.`
    : `**jail** is the board floor: separation **UNTESTED**. Not counted among the ${measured} measured board axes.`;
  return { quotable, measured, publicCount, measuredAxes, jail, jailNote };
}

/** ClaimGuard refuse for false board-count claims (16 measured, 12 axes, 14-all-MEASURED variants) */
export function claimGuardRefuse(q: string): string | null {
  // Allow optional words between count and "axes" / "are MEASURED" so
  // "twelve GSPC axes", "all 14 axes are MEASURED", etc. refuse too.
  if (
    !/16\s+measured|(?:twelve|\b12)(?:\s+\w+){0,2}\s+axes|(?:all\s+)?14(?:\s+\w+){0,3}\s+are\s+MEASURED/i.test(
      q,
    )
  )
    return null;
  return (
    `**Refused (ClaimGuard).** That claim does not match the published board.\n\n` +
    `Canon lives in GET /api/gspc totals (public_count, measured_axes, quotable_axes) ` +
    `and is derived from the payload. Never invent a slot count. **jail** is a **floor**; separation **UNTESTED**.\n\n` +
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
