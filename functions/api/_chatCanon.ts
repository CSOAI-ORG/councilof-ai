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
export type BoardCanon = ReturnType<typeof boardCanon>;

export function boardCanon(board: GspcBoard) {
  const axes = board.axes ?? [];
  const jail = board.jail_floor ?? axes.find(isJailAxis) ?? null;
  const measuredAxes = axes.filter(
    (a) => a.status === "MEASURED" && Number(a.n) > 0,
  );
  const unmeasuredAxes = axes.filter((a) => a.status !== "MEASURED");
  const int = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  /**
   * Slots on the board — the LARGER number. totals.axes, never quotable_axes.
   * An UNREADABLE board yields null, and every sentence below drops the number
   * rather than substituting one: a board we could not reach is not evidence of
   * any particular size, and a fallback here is how a typed literal gets born.
   */
  const slots = int(board.totals.axes) ?? (axes.length || null);
  const measured = int(board.totals.measured_axes) ?? measuredAxes.length;
  const unmeasured =
    int(board.totals.unmeasured_axes) ?? (slots !== null ? Math.max(0, slots - measured) : null);
  /** How many carry a figure that may be quoted. Equal to `measured` today. */
  const quotable = int(board.totals.quotable_axes) ?? measured;
  /**
   * The endpoint publishes the rule for quoting these two numbers in its own words
   * (`totals.count_grammar`). Carried verbatim from lane/os-tools-real: the chat
   * repeating the published ruling is strictly better than the chat paraphrasing it,
   * because a paraphrase is a second place the grammar can drift.
   */
  const countGrammar =
    typeof board.totals.count_grammar === "string" && board.totals.count_grammar.trim()
      ? board.totals.count_grammar.trim()
      : null;
  const publicCount =
    typeof board.totals.public_count === "string" && board.totals.public_count.trim()
      ? board.totals.public_count.trim()
      : slots !== null
        ? `${slots} axes \u00b7 ${measured} measured`
        : `${measured} measured`;
  const sep = String(jail?.separation ?? "").toUpperCase() || "UNKNOWN";
  const jailNote = jail
    ? `**jail** is a measured containment floor on the board (status ${jail.status ?? "MEASURED"}; separation **${sep}**)` +
      (jail.n ? `; n=${jail.n}` : "") +
      (typeof jail.accuracy === "number" ? `; accuracy ${Number(jail.accuracy).toFixed(3)}` : "") +
      `. Cite live GET /api/gspc \u2014 do not freeze counts.`
    : `**jail** appears on the board only when GET /api/gspc publishes it. Cite live totals.`;
  return { slots, quotable, measured, unmeasured, publicCount, countGrammar, measuredAxes, unmeasuredAxes, jail, jailNote };
}

/**
 * ClaimGuard — refuse a count the LIVE board contradicts, and nothing else.
 *
 * THE REGRESSION THIS CLOSES (2026-08-26, lane/os-tools-real). The old guard matched
 * "15 axes" / "12 axes" / "16 measured" with a hardcoded regex and answered with a
 * hardcoded sentence: "Quotable board = **14** slots. Never invent 22 axes." By then
 * the board published 22 axes and 15 measured — so the honesty gate REFUSED THE TRUTH
 * and asserted a stale figure while doing it. A gate that refuses the truth is worse
 * than no gate. Every number below is read from the board that was just fetched;
 * none is typed into this function, so it cannot go stale again.
 */
export function claimGuardRefuse(q: string, canon?: BoardCanon): string | null {
  // An unreachable board is not evidence that a reader is wrong. Refuse nothing.
  if (!canon || canon.slots === null) return null;

  const WORDS: Record<string, number> = {
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
    sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
    "twenty-one": 21, "twenty-two": 22, "twenty-three": 23, "twenty-four": 24, "twenty-five": 25,
  };
  // "<number> axes", "<number> measured", "<number> ... slots" — the shapes a count
  // claim actually takes. Anything else is not a count claim and is not this gate's business.
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
    (canon.unmeasured !== null ? ` \u2014 ${canon.unmeasured} declared slots carry no run.` : ".") +
    `\n\n` +
    (canon.countGrammar ? `${canon.countGrammar}\n\n` : "") +
    `Canon lives in GET /api/gspc totals (axes, measured_axes, unmeasured_axes, public_count). ` +
    `Every number in this refusal was read from there just now; none is typed into the guard.\n\n` +
    `_Deterministic refuse against a count the live board does not carry \u2014 not a model opinion._`
  );
}

export const wilson = (acc: number, n: number): [number, number] => {
  if (!n) return [0, 0];
  const z = 1.959964, d = 1 + (z * z) / n;
  const c = acc + (z * z) / (2 * n);
  const m = z * Math.sqrt((acc * (1 - acc)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
};
