import { useEffect, useState } from "react";

/**
 * stateWire — the reader for GET /api/state, the estate's one derived-state surface.
 *
 * WHY A TAB EXISTS FOR THIS. /api/state was built because twelve lane reports in
 * one week published counts that did not agree — the axis count was reported as
 * 14, 15, 16, 22 and 25; the MCP fleet as 6, 216, 271, 291, 338, 348, 377 and
 * 378. The endpoint's job is to be the only place a count may come from, and it
 * carries `kind` and `as_of` on every single value so a reader can see what sort
 * of thing produced the number and when. It shipped with no human surface at
 * all: the estate's answer to its own worst failure mode was invisible in the
 * product. This reader, and the pane over it, are that surface.
 *
 * NOTHING IS INTERPRETED HERE. The pane renders `kind` and `as_of` verbatim
 * beside every figure. In particular:
 *
 *   · `as_of: null` is rendered as "no timestamp published", never as today.
 *     public/interop/rwa-registry.json genuinely carries no timestamp of any
 *     kind, and the endpoint says so rather than borrowing a neighbour's.
 *   · kinds are never merged. measured / probed / catalogued / declared /
 *     unmeasured are five different claims. Summing across them is exactly how
 *     6 reachable MCP servers became a published 378.
 *   · a failed fetch shows the failure and NO numbers. There is no bundled copy
 *     of this payload, deliberately: a state endpoint served from a stale
 *     snapshot is the defect it exists to prevent.
 */

export type FactKind = "measured" | "probed" | "catalogued" | "declared" | "unmeasured" | string;

export interface Fact {
  key: string;
  /** Whatever the endpoint published: a number, a string, an object, an array. */
  value: unknown;
  kind: FactKind;
  /** ISO date/timestamp read OUT of the artifact, or null when none exists. */
  as_of: string | null;
  /** The exact key `as_of` was read from, so a stranger can open the file and check. */
  as_of_field: string | null;
  note?: string;
}

export interface StateGroup {
  id: string;
  /** Prose fields on the group that are not facts — authority, live_endpoint, notes. */
  meta: { key: string; value: string }[];
  facts: Fact[];
}

export interface EstateState {
  title: string;
  groups: StateGroup[];
  /** The endpoint's own contract block — quoted, never paraphrased. */
  contract: { key: string; value: string }[];
  /** What this endpoint explicitly does NOT speak for. */
  notCovered: { key: string; value: string }[];
  doctrine: { key: string; value: string }[];
}

export type StateWire =
  | { phase: "loading" }
  | { phase: "ready"; state: EstateState }
  | { phase: "failed"; error: string };

/** Groups that are prose blocks about the endpoint, not measurement groups. */
const PROSE_GROUPS = new Set(["contract", "not_covered", "doctrine"]);

const isFact = (v: unknown): boolean =>
  !!v && typeof v === "object" && !Array.isArray(v) && "kind" in (v as object) && "value" in (v as object);

const asOf = (v: any): string | null => (typeof v?.as_of === "string" && v.as_of.trim() ? v.as_of : null);

function readProse(block: unknown): { key: string; value: string }[] {
  if (!block || typeof block !== "object") return [];
  return Object.entries(block as Record<string, unknown>)
    .filter(([, v]) => typeof v === "string")
    .map(([key, v]) => ({ key, value: v as string }));
}

export async function fetchEstateState(signal?: AbortSignal): Promise<EstateState> {
  const r = await fetch("/api/state", { signal, headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`GET /api/state → HTTP ${r.status}`);
  const ct = (r.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("text/html")) throw new Error("GET /api/state returned HTML, not JSON");
  const j: any = await r.json();
  if (!j || typeof j !== "object") throw new Error("GET /api/state carried no object");

  const groups: StateGroup[] = [];
  for (const [id, block] of Object.entries(j)) {
    if (PROSE_GROUPS.has(id) || !block || typeof block !== "object" || Array.isArray(block)) continue;
    const facts: Fact[] = [];
    const meta: { key: string; value: string }[] = [];
    for (const [key, v] of Object.entries(block as Record<string, unknown>)) {
      if (isFact(v)) {
        const f = v as any;
        facts.push({
          key,
          value: f.value,
          kind: typeof f.kind === "string" ? f.kind : "declared",
          as_of: asOf(f),
          as_of_field: typeof f.as_of_field === "string" ? f.as_of_field : null,
          note: typeof f.note === "string" ? f.note : undefined,
        });
      } else if (typeof v === "string") {
        meta.push({ key, value: v });
      }
    }
    if (facts.length || meta.length) groups.push({ id, meta, facts });
  }
  if (!groups.length) throw new Error("GET /api/state carried no state groups");

  return {
    title: typeof j.title === "string" ? j.title : "Estate state",
    groups,
    contract: readProse(j.contract),
    notCovered: readProse(j.not_covered),
    doctrine: readProse(j.doctrine),
  };
}

export function useEstateState(): StateWire {
  const [s, setS] = useState<StateWire>({ phase: "loading" });
  useEffect(() => {
    const ac = new AbortController();
    fetchEstateState(ac.signal)
      .then((state) => setS({ phase: "ready", state }))
      .catch((e: any) => {
        if (ac.signal.aborted) return;
        setS({ phase: "failed", error: String(e?.message ?? e) });
      });
    return () => ac.abort();
  }, []);
  return s;
}

/** Every count in the payload, flattened — derived from the arrays, never typed. */
export const factCount = (s: EstateState): number =>
  s.groups.reduce((n, g) => n + g.facts.length, 0);

/** How many facts of each kind. Used to show the kind mix without merging kinds. */
export function kindTally(s: EstateState): { kind: FactKind; n: number }[] {
  const m = new Map<FactKind, number>();
  for (const g of s.groups) for (const f of g.facts) m.set(f.kind, (m.get(f.kind) ?? 0) + 1);
  return [...m.entries()].map(([kind, n]) => ({ kind, n })).sort((a, b) => b.n - a.n);
}
