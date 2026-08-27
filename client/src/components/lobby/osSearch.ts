import { useCallback, useEffect, useMemo, useState } from "react";
import { LOBBY_ROUTES, LOBBY_TABS, type LobbyTab } from "./tabs";
import { fetchBoard, fetchSignalCards, type SignalCard, type WireAxis } from "./boardWire";

/**
 * osSearch — the header search index for Council OS.
 *
 * A SEARCH BOX THAT DOES NOTHING IS WORSE THAN NO SEARCH BOX. Everything this
 * index can return is a thing that exists and that selecting actually opens:
 *
 *   destinations — the rail's own panes (LOBBY_TABS) and the live pages the OS
 *                  frames (LOBBY_ROUTES). No fetch: these are the app's own
 *                  registry, so they are searchable from the first keystroke.
 *   board axes   — read from GET /api/gspc. The row itself carries the axis's
 *                  status and separation, so the RESULT answers the question in
 *                  many cases without opening anything.
 *   signed cards — read from /signals/_index.json: the cards actually published
 *                  under /signals, with the content id you would verify.
 *
 * THE TWO REMOTE SETS LOAD LAZILY, on first activation of the search, not on
 * every OS open — the destinations are useful immediately and nobody should pay
 * two requests for a search they did not use. Until they land, the listbox says
 * which sets are still loading rather than silently showing a short list as if
 * it were the whole one. If a set fails, the failure is named. An index that
 * quietly returns fewer things than it claims to cover is the same defect as a
 * count nobody can retire.
 *
 * NOTHING IS SYNTHESISED. An axis result prints the status the board published
 * for it — an UNMEASURED axis reads `unmeasured` in the list, and is not hidden
 * to make the board look fuller.
 */

export type OsHitKind = "destination" | "page" | "axis" | "card";

export interface OsHit {
  id: string;
  kind: OsHitKind;
  /** The heading this hit sits under in the listbox. */
  group: string;
  /** The noun a reader types toward. */
  label: string;
  /** One honest line: the destination's blurb, or the row's published state. */
  detail: string;
  /** Open this pane… */
  tab?: LobbyTab;
  /** …or frame this route in the centre pane. */
  route?: string;
}

const GROUP_ORDER: Record<OsHitKind, number> = { destination: 0, page: 1, axis: 2, card: 3 };

/** The pane a board row or a card result opens. Looked up, never assumed. */
const tabOf = (id: string): LobbyTab | undefined => LOBBY_TABS.find((t) => t.id === id);

export function destinationHits(): OsHit[] {
  const panes: OsHit[] = LOBBY_TABS.map((t) => ({
    id: `tab:${t.id}`,
    kind: "destination",
    group: "Destinations",
    label: t.label,
    detail: t.blurb,
    tab: t,
  }));
  const pages: OsHit[] = LOBBY_ROUTES.map((r) => ({
    id: `route:${r.path}`,
    kind: "page",
    group: "Pages",
    label: r.label,
    detail: r.blurb,
    route: r.path,
  }));
  return [...panes, ...pages];
}

/** An axis row, described by what the board actually published for it. */
export function axisHits(axes: WireAxis[]): OsHit[] {
  const board = tabOf("board");
  return axes.map((a) => {
    const state = a.status === "MEASURED" ? "measured" : a.status.toLowerCase();
    const sep =
      a.status !== "MEASURED"
        ? null
        : a.separation === "SEPARATED"
          ? `separated lead${a.leader ? `: ${a.leader}` : ""}`
          : a.separation === "TIE"
            ? "tie — no separated leader"
            : "separation untested";
    const detail = [state, sep, a.bench ? `bank ${a.bench}` : null].filter(Boolean).join(" · ");
    return {
      id: `axis:${a.axis}`,
      kind: "axis" as const,
      group: "Board axis",
      label: a.axis,
      detail,
      tab: board,
    };
  });
}

/** A published signed card, with the content id a verifier recomputes. */
export function cardHits(cards: SignalCard[]): OsHit[] {
  const verify = tabOf("verify");
  return cards.map((c) => ({
    id: `card:${c.slug}`,
    kind: "card" as const,
    group: "Signed cards",
    label: c.slug,
    detail: `${c.status.toLowerCase()} · content id ${c.contentId || "none published"} · ${c.path}`,
    tab: verify,
  }));
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Score one hit against a query. Higher wins; 0 means it does not match.
 *
 * The order is the order a reader expects: what they typed at the START of a
 * name beats it in the middle, a name beats a description, and a shorter name
 * beats a longer one when both matched the same way ("gov" should land on the
 * axis `gov`, not on `government-procurement`).
 */
export function score(query: string, hit: OsHit): number {
  const q = norm(query);
  if (!q) return 0;
  const label = norm(hit.label);
  const detail = norm(hit.detail);
  let s = 0;
  if (label === q) s = 120;
  else if (label.startsWith(q)) s = 100;
  else if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(label)) s = 80;
  else if (label.includes(q)) s = 60;
  else if (detail.includes(q)) s = 30;
  else return 0;
  // Shorter labels first among equals, and keep the group order stable.
  return s * 1000 - Math.min(label.length, 200) - GROUP_ORDER[hit.kind];
}

export const SEARCH_LIMIT = 12;

export function rank(query: string, hits: OsHit[], limit = SEARCH_LIMIT): OsHit[] {
  return hits
    .map((h) => ({ h, s: score(query, h) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.h);
}

// ── the hook ────────────────────────────────────────────────────────────────

type RemoteSet =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "ready"; hits: OsHit[] }
  | { phase: "failed"; error: string };

export interface OsSearchIndex {
  /** Ranked results for the current query. */
  results: OsHit[];
  /** Sets still on the wire, by name — printed so a short list is never mistaken for the whole one. */
  pending: string[];
  /** Sets that failed, with the reason. Named, never swallowed. */
  failures: string[];
  /** Call when the reader first touches the search. Loads the remote sets once. */
  activate: () => void;
}

export function useOsSearch(query: string): OsSearchIndex {
  const [axes, setAxes] = useState<RemoteSet>({ phase: "idle" });
  const [cards, setCards] = useState<RemoteSet>({ phase: "idle" });
  const [active, setActive] = useState(false);

  const activate = useCallback(() => setActive(true), []);

  useEffect(() => {
    if (!active) return;
    const ac = new AbortController();
    setAxes((s) => (s.phase === "idle" ? { phase: "loading" } : s));
    setCards((s) => (s.phase === "idle" ? { phase: "loading" } : s));
    fetchBoard(ac.signal)
      .then((b) => setAxes({ phase: "ready", hits: axisHits(b.axes) }))
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        setAxes({ phase: "failed", error: String((e as Error)?.message ?? e) });
      });
    fetchSignalCards(ac.signal)
      .then((c) => setCards({ phase: "ready", hits: cardHits(c) }))
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        setCards({ phase: "failed", error: String((e as Error)?.message ?? e) });
      });
    return () => ac.abort();
  }, [active]);

  const local = useMemo(destinationHits, []);

  const all = useMemo(() => {
    const out = [...local];
    if (axes.phase === "ready") out.push(...axes.hits);
    if (cards.phase === "ready") out.push(...cards.hits);
    return out;
  }, [local, axes, cards]);

  const results = useMemo(() => rank(query, all), [query, all]);

  const pending = [
    axes.phase === "loading" ? "board axis" : null,
    cards.phase === "loading" ? "signed cards" : null,
  ].filter((x): x is string => x !== null);

  const failures = [
    axes.phase === "failed" ? `board axis — ${axes.error}` : null,
    cards.phase === "failed" ? `signed cards — ${cards.error}` : null,
  ].filter((x): x is string => x !== null);

  return { results, pending, failures, activate };
}
