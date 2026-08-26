import { useEffect, useState } from "react";

/**
 * liveState — the Council OS header's reader for `GET /api/state`.
 *
 * WHY A READER AND NOT A CONSTANT. The header shows counts. A count typed into a
 * component is a claim nobody can retire: it survives the artifact it described,
 * and the next reader has no way to tell a current figure from a fossil. So no
 * number in this module is written down. Every value the header prints is read
 * out of the payload `/api/state` derives from committed artifacts, by field
 * name, and every one of them travels with the three things that make it
 * checkable: `kind` (how it was obtained), `source` (the file it came from) and
 * `as_of` (a timestamp read OUT of that file, never the clock).
 *
 * THE THREE OUTCOMES ARE KEPT APART. They are different facts about the world
 * and collapsing them is how a header starts lying:
 *
 *   phase "failed"   — we could not reach the endpoint. We do NOT know the count.
 *                      The header says the state is unreachable. It does not say
 *                      "unmeasured": a network failure here is our problem, not a
 *                      published finding about the estate.
 *   value present    — print it, with its kind and its as_of in reach.
 *   value absent, or
 *   kind "unmeasured"— print the WORD `unmeasured`. That is a first-class
 *                      published status on this estate, not a blank and not a
 *                      zero. `quote()` below is the only path to a printed value
 *                      and it has no branch that can invent one.
 *
 * `board.public_count` is quoted VERBATIM rather than recomposed from
 * `measured_axes` and `axis_slots`. The endpoint publishes it precisely because
 * it carries both numbers in one string ("22 axes · 15 measured"); rebuilding
 * that sentence here would put the grammar of the count back in a component's
 * hands, which is exactly the failure /api/state exists to end.
 */

export type FactKind = "measured" | "probed" | "catalogued" | "declared" | "unmeasured";

const KINDS: readonly FactKind[] = [
  "measured",
  "probed",
  "catalogued",
  "declared",
  "unmeasured",
] as const;

/** One published fact, exactly as /api/state shapes it. */
export interface StateFact {
  value: unknown;
  kind: FactKind | null;
  source: string | null;
  as_of: string | null;
  as_of_field: string | null;
  note: string | null;
}

/** The word this estate publishes for "it exists and we have not measured it". */
export const UNMEASURED = "unmeasured";

const obj = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

/** Read one fact block. Anything that is not shaped like a fact is not a fact. */
function readFact(raw: unknown): StateFact | null {
  const o = obj(raw);
  if (!o || !("value" in o) || !("kind" in o)) return null;
  const k = o.kind;
  return {
    value: o.value ?? null,
    kind: typeof k === "string" && (KINDS as readonly string[]).includes(k) ? (k as FactKind) : null,
    source: str(o.source),
    as_of: str(o.as_of),
    as_of_field: str(o.as_of_field),
    note: str(o.note),
  };
}

const fmt = new Intl.NumberFormat("en-GB");

/**
 * A fact's value as display text. THE ONLY WAY a value reaches the header.
 *
 * There is no fallback number and no empty string: a fact that cannot be quoted
 * comes back as the word `unmeasured`, which is a published status here rather
 * than a placeholder. A fact whose own `kind` is "unmeasured" returns that word
 * even when the payload carried a value, because the kind is the finding.
 */
export function quote(f: StateFact | null): string {
  if (!f || f.kind === "unmeasured") return UNMEASURED;
  if (typeof f.value === "number" && Number.isFinite(f.value)) return fmt.format(f.value);
  if (typeof f.value === "string" && f.value.trim()) return f.value.trim();
  return UNMEASURED;
}

/** True when `quote()` returned a real reading rather than the honest word. */
export const quotable = (f: StateFact | null): boolean => quote(f) !== UNMEASURED;

/**
 * The provenance line for a fact, for the control's `title`. Names the kind, the
 * file and the timestamp's own field, so a reader can open the artifact and check
 * the number without asking us anything.
 */
export function provenance(f: StateFact | null): string {
  if (!f) return "Not published by /api/state.";
  const bits = [
    f.kind ? `kind: ${f.kind}` : null,
    f.source ? `source: ${f.source}` : null,
    f.as_of ? `as_of: ${f.as_of}${f.as_of_field ? ` (${f.as_of_field})` : ""}` : "as_of: none in the artifact",
  ].filter(Boolean);
  return bits.join(" · ");
}

/** The slice of /api/state the header quotes. Nothing else is read. */
export interface LiveState {
  board: {
    /** "22 axes · 15 measured" — the endpoint's own sentence, carrying both numbers. */
    publicCount: StateFact | null;
    /** The long form, for the tooltip. */
    countGrammar: StateFact | null;
    measuredAxes: StateFact | null;
    axisSlots: StateFact | null;
  };
  fleet: {
    reachable: StateFact | null;
    catalogued: StateFact | null;
  };
  cards: {
    count: StateFact | null;
    signed: StateFact | null;
  };
}

export type LiveStateResult =
  | { phase: "loading" }
  | { phase: "ready"; state: LiveState }
  | { phase: "failed"; error: string };

export function readLiveState(payload: unknown): LiveState {
  const root = obj(payload) ?? {};
  const board = obj(root.board) ?? {};
  const fleet = obj(root.mcp_fleet) ?? {};
  const cards = obj(root.signed_cards) ?? {};
  return {
    board: {
      publicCount: readFact(board.public_count),
      countGrammar: readFact(board.count_grammar),
      measuredAxes: readFact(board.measured_axes),
      axisSlots: readFact(board.axis_slots),
    },
    fleet: {
      reachable: readFact(fleet.reachable_distinct_servers),
      catalogued: readFact(fleet.catalogued_not_probed),
    },
    cards: {
      count: readFact(cards.count),
      signed: readFact(cards.signed_entries),
    },
  };
}

export const STATE_ENDPOINT = "/api/state";

export async function fetchLiveState(signal?: AbortSignal): Promise<LiveState> {
  const r = await fetch(STATE_ENDPOINT, { signal, headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`GET ${STATE_ENDPOINT} → HTTP ${r.status}`);
  const ct = (r.headers.get("content-type") || "").toLowerCase();
  // A Pages deploy that has not built its functions serves index.html for
  // /api/*. Parsing that as JSON throws a syntax error that reads like a bug in
  // this file; saying what actually happened is more use to whoever debugs it.
  if (ct.includes("text/html")) throw new Error(`GET ${STATE_ENDPOINT} returned HTML, not JSON`);
  return readLiveState(await r.json());
}

/**
 * Read the live state once, when the OS opens. A failure is reported as a
 * failure — the header never falls back to a bundled snapshot, because a stale
 * count rendered in live chrome is indistinguishable from a current one.
 */
export function useLiveState(): LiveStateResult {
  const [state, setState] = useState<LiveStateResult>({ phase: "loading" });
  useEffect(() => {
    const ac = new AbortController();
    fetchLiveState(ac.signal)
      .then((s) => setState({ phase: "ready", state: s }))
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        setState({ phase: "failed", error: String((e as Error)?.message ?? e) });
      });
    return () => ac.abort();
  }, []);
  return state;
}
