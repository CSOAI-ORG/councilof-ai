/**
 * CorpusCount — a signed-card count that always names its corpus (pattern P6, the CARD-CORPORA rule).
 * The corpora have zero overlap and are never added: the signed card index (kind measured: every body
 * verifies) and the public-root leaves (catalogued). The living registry (GET /api/cards) is a third
 * corpus whose count /api/state does not carry, so it is not offered here. The reader picks one; the
 * value, its kind, its source and its as_of come from GET /api/state, never typed.
 */
import { useState } from "react";
import { useLiveJson } from "./useLiveJson";

type Obj = Record<string, unknown>;
const rec = (v: unknown): Obj | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null);

export const CORPORA = [
  { id: "index", label: "Signed card index, verified", path: ["card_chain", "bodies_verified_valid"] },
  { id: "root", label: "Public-root leaves", path: ["public_root", "card_count"] },
] as const;

export function corpusFact(state: unknown, path: readonly string[]): { value: number; kind: string | null; source: string | null; as_of: string | null } | null {
  let cur: unknown = state;
  for (const k of path) cur = rec(cur)?.[k];
  const f = rec(cur);
  const v = f?.value;
  if (typeof v !== "number" || !Number.isSafeInteger(v)) return null;
  const s = (x: unknown) => (typeof x === "string" && x ? x : null);
  return { value: v, kind: s(f?.kind), source: s(f?.source), as_of: s(f?.as_of) };
}

export default function CorpusCount() {
  const state = useLiveJson("/api/state");
  const [id, setId] = useState<(typeof CORPORA)[number]["id"]>("index");
  const corpus = CORPORA.find((c) => c.id === id)!;
  const fact = state.state === "ok" ? corpusFact(state.data, corpus.path) : null;
  return (
    <div className="mt-4 rounded-2xl border border-border bg-background p-3" data-testid="ws-corpus">
      <label htmlFor="ws-corpus-select" className="text-xs font-bold text-muted-foreground">
        Signed cards, in one corpus at a time
      </label>
      <select
        id="ws-corpus-select"
        value={id}
        onChange={(e) => setId(e.target.value as typeof id)}
        className="mt-1 min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
      >
        {CORPORA.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      {state.state === "loading" ? (
        <p role="status" className="mt-2 text-xs text-muted-foreground">
          Reading /api/state…
        </p>
      ) : fact ? (
        <p className="mt-2 text-[13px] text-muted-foreground" data-testid="ws-corpus-value">
          <span className="font-mono text-base font-black text-foreground">{fact.value}</span> {fact.kind ? `(${fact.kind})` : ""}
          <span className="block truncate font-mono text-xs" title={fact.source ?? undefined}>
            /api/state → {corpus.path.join(".")}
            {fact.as_of ? ` · ${fact.as_of}` : ""}
          </span>
        </p>
      ) : (
        <p className="mt-2 text-xs text-amber-900">Not in the payload; nothing is shown in its place.</p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">Separate corpora with no overlap; never added together.</p>
    </div>
  );
}
