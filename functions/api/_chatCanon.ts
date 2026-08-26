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
 * SLOTS AND MEASUREMENTS ARE TWO NUMBERS AND THIS FUNCTION KEEPS THEM APART.
 * It used to collapse them: `quotable` read `totals.quotable_axes` first and was
 * then printed as though it were the board's size, so on 2026-08-26 the OS chat
 * answered "The GSPC board has 15 quotable axes. 15 measured of 15" while the
 * very same payload said `axes: 22, measured_axes: 15, unmeasured_axes: 7`. The
 * grammar the board actually ruled on — "the larger number counts slots, the
 * smaller counts measurements — quote both or quote the smaller" — was hidden
 * behind a tautology, and the seven declared slots vanished from the answer.
 *
 * `slots`, `measured` and `unmeasured` are now three separate fields, and
 * `countGrammar` carries the API's own published sentence so the chat repeats
 * the ruling instead of paraphrasing it.
 */
export function boardCanon(board: GspcBoard) {
  const axes = board.axes ?? [];
  const jail = board.jail_floor ?? axes.find(isJailAxis) ?? null;
  const measuredAxes = axes.filter(
    (a) => a.status === "MEASURED" && Number(a.n) > 0,
  );
  const int = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null;

  // The board's SIZE. totals.axes is the slot count; the array length is the
  // fallback. There is no typed literal here — an unreadable board yields null
  // and every sentence below drops the number rather than substituting one.
  const slots = int(board.totals.axes) ?? (axes.length || null);
  const measured = int(board.totals.measured_axes) ?? measuredAxes.length;
  const unmeasured = int(board.totals.unmeasured_axes) ?? (slots !== null ? slots - measured : null);
  /** How many rows carry a quotable figure. NOT the board's size. */
  const quotable = int(board.totals.quotable_axes) ?? measured;
  const publicCount =
    typeof board.totals.public_count === "string" && board.totals.public_count.trim()
      ? board.totals.public_count.trim()
      : slots !== null
        ? `${slots} axes · ${measured} measured`
        : `${measured} measured`;
  const countGrammar =
    typeof board.totals.count_grammar === "string" && board.totals.count_grammar.trim()
      ? board.totals.count_grammar.trim()
      : "";
  const sep = String(jail?.separation ?? "").toUpperCase() || "UNKNOWN";
  const jailNote = jail
    ? `**jail** is a measured containment floor on the board (status ${jail.status ?? "MEASURED"}; separation **${sep}**)` +
      (jail.n ? `; n=${jail.n}` : "") +
      (typeof jail.accuracy === "number" ? `; accuracy ${Number(jail.accuracy).toFixed(3)}` : "") +
      `. Cite live GET /api/gspc — do not freeze counts.`
    : `**jail** appears on the board only when GET /api/gspc publishes it. Cite live totals.`;
  return { slots, measured, unmeasured, quotable, publicCount, countGrammar, measuredAxes, jail, jailNote };
}

export type BoardCanon = ReturnType<typeof boardCanon>;

/**
 * ClaimGuard: refuse a count claim that CONTRADICTS THE LIVE BOARD.
 *
 * THE BUG THIS REPLACES. The old guard matched the literal strings 12/15/16 and
 * answered with a hardcoded "Quotable board = **14** slots. Never invent 22 axes."
 * By 2026-08-26 the live board published 22 slots and 15 measured, so the guard
 * fired on TRUE statements about the estate's own board and refused them citing
 * a number the API no longer served. Reproduced live:
 *
 *   Q: "Is it true that 15 axes carry a measurement?"
 *   A: "**Refused (ClaimGuard).** ... Quotable board = **14** slots."
 *
 * An honesty gate that refuses the truth and asserts a stale figure while doing
 * it is worse than no gate: it converts the estate's strongest surface into its
 * least reliable one.
 *
 * THE RULE NOW. Pull the integer the reader asserted, compare it to the live
 * totals, and refuse ONLY when it matches neither the slot count nor the
 * measured count nor the unmeasured count. The refusal quotes the live sentence,
 * so it can never be stale: if the board moves, the guard moves with it. When
 * the board could not be read at all, nothing is refused — an unreachable board
 * is not evidence that a reader is wrong.
 */
export function claimGuardRefuse(q: string, canon?: BoardCanon): string | null {
  if (!canon || canon.slots === null) return null;

  const WORDS: Record<string, number> = {
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
    sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
    "twenty-one": 21, "twenty-two": 22, "twenty-three": 23, "twenty-four": 24, "twenty-five": 25,
  };
  // "<number> axes", "<number> measured", "<number> ... axes" — the shapes a
  // count claim actually takes. Anything else is not a count claim.
  const re = /\b(\d{1,3}|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|twenty-[a-z]+)\b(?:\s+\w+){0,2}?\s+(?:axes|axis|measured|slots?)\b/gi;
  const claimed: number[] = [];
  for (const m of q.matchAll(re)) {
    const raw = m[1].toLowerCase();
    const n = /^\d+$/.test(raw) ? Number(raw) : WORDS[raw];
    if (typeof n === "number" && Number.isFinite(n)) claimed.push(n);
  }
  if (!claimed.length) return null;

  const truthful = new Set<number>([canon.slots, canon.measured, canon.quotable]);
  if (canon.unmeasured !== null) truthful.add(canon.unmeasured);
  const wrong = claimed.filter((n) => !truthful.has(n));
  if (!wrong.length) return null;

  return (
    `**Refused (ClaimGuard).** ${wrong.map((n) => `**${n}**`).join(" and ")} ` +
    `${wrong.length === 1 ? "does" : "do"} not match the published board.\n\n` +
    `Live now: **${canon.publicCount}**` +
    (canon.unmeasured !== null ? ` — ${canon.unmeasured} declared slots carry no run.` : ".") +
    `\n\n` +
    (canon.countGrammar ? `${canon.countGrammar}\n\n` : "") +
    `Canon lives in GET /api/gspc totals (axes, measured_axes, unmeasured_axes, public_count). ` +
    `Every number in this refusal was read from there just now; none is typed into the guard.\n\n` +
    `_Deterministic refuse against a count the live board does not carry — not a model opinion._`
  );
}

export const wilson = (acc: number, n: number): [number, number] => {
  if (!n) return [0, 0];
  const z = 1.959964, d = 1 + (z * z) / n;
  const c = acc + (z * z) / (2 * n);
  const m = z * Math.sqrt((acc * (1 - acc)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
};
