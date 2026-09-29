import { useEffect, useState } from "react";

/**
 * TRACE reader. GET /api/trace resolves ONE published card by exact SHA-256
 * (schema csoai.trace/0.3); it has no bare, sha-less form and answers a bare GET
 * with 400 INVALID_REQUEST. Until 28 Sep 2026 this rail sent that bare GET and
 * printed "UNREACHABLE — HTTP 400" on every load for a door that was up — the
 * rail asked the wrong question, the door did not fail.
 *
 * So the rail now asks a real one: it takes the newest leaf of the public root
 * read on this load (/root.json → card_sha256[], the last entry) and resolves it
 * through the trace door. Nothing here is typed: the leaf, both as_of stamps and
 * the source path are quoted from the two documents read on this load. The
 * GSPC board is never consulted and the clock never stands in for an as_of.
 */
type RootDoc = {
  as_of?: string;
  card_sha256?: unknown;
};

type TraceDoc = {
  schema?: string;
  state?: string;
  sha?: string;
  source?: string;
  card?: { as_of?: string; card?: { as_of?: string } };
  error?: string;
};

type Wire =
  | { state: "loading" }
  | { state: "uncheckable"; detail: string }
  | { state: "unreachable"; detail: string; leaf: string }
  | {
      state: "ready";
      http: number;
      doc: TraceDoc;
      leaf: string;
      index: number;
      total: number;
      rootAsOf: string | null;
    };

const HEX64 = /^[a-f0-9]{64}$/i;

/** The card body's own stamp — trace wraps the stored card, which may itself wrap `card`. */
export function traceCardAsOf(doc: TraceDoc): string | null {
  const inner = doc.card?.card?.as_of ?? doc.card?.as_of;
  return typeof inner === "string" && inner ? inner : null;
}

/** Newest leaf of the root, or null when the root carries none. */
export function newestLeaf(root: RootDoc | null): { leaf: string; index: number; total: number } | null {
  const leaves = Array.isArray(root?.card_sha256) ? (root!.card_sha256 as unknown[]) : [];
  for (let i = leaves.length - 1; i >= 0; i--) {
    const leaf = leaves[i];
    if (typeof leaf === "string" && HEX64.test(leaf)) return { leaf: leaf.toLowerCase(), index: i, total: leaves.length };
  }
  return null;
}

export default function TraceReaderRail({
  heading = "TRACE reader",
  className = "",
}: {
  heading?: string;
  className?: string;
}) {
  const [wire, setWire] = useState<Wire>({ state: "loading" });

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      let root: RootDoc | null = null;
      try {
        const r = await fetch("/root.json", { signal: ac.signal, headers: { accept: "application/json" } });
        if (!r.ok) throw new Error(`GET /root.json HTTP ${r.status}`);
        root = (await r.json()) as RootDoc;
      } catch (error: any) {
        if (ac.signal.aborted) return;
        setWire({ state: "uncheckable", detail: `${String(error?.message || error)} — no leaf to resolve` });
        return;
      }
      const pick = newestLeaf(root);
      if (!pick) {
        setWire({ state: "uncheckable", detail: "GET /root.json carries no 64-hex card_sha256[] leaf — nothing to resolve" });
        return;
      }
      try {
        const response = await fetch(`/api/trace?sha=${pick.leaf}`, {
          signal: ac.signal,
          headers: { accept: "application/json" },
        });
        // 200 FOUND and 404 NOT_FOUND are both answers from the door; anything else is not.
        if (response.status !== 200 && response.status !== 404)
          throw new Error(`GET /api/trace?sha=… HTTP ${response.status}`);
        const doc = (await response.json()) as TraceDoc;
        if (!doc || typeof doc.state !== "string")
          throw new Error("GET /api/trace returned no state");
        setWire({
          state: "ready",
          http: response.status,
          doc,
          leaf: pick.leaf,
          index: pick.index,
          total: pick.total,
          rootAsOf: typeof root?.as_of === "string" && root.as_of ? root.as_of : null,
        });
      } catch (error: any) {
        if (ac.signal.aborted) return;
        setWire({ state: "unreachable", detail: String(error?.message || error), leaf: pick.leaf });
      }
    })();
    return () => ac.abort();
  }, []);

  if (wire.state === "loading") {
    return (
      <section
        className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}
        data-testid="rail-trace"
      >
        <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
        <p className="mt-1 text-xs text-slate-500">
          LOADING — resolving the newest root leaf through GET /api/trace…
        </p>
      </section>
    );
  }

  if (wire.state === "uncheckable" || wire.state === "unreachable") {
    return (
      <section
        className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className}`}
        data-testid="rail-trace"
      >
        <h3 className="text-sm font-semibold text-amber-800">{heading}</h3>
        <p
          className="mt-1 text-xs text-amber-700"
          data-testid={`rail-trace-${wire.state}`}
        >
          {wire.state === "uncheckable" ? "UNCHECKABLE" : "UNREACHABLE"} — {wire.detail}.
        </p>
        {wire.state === "unreachable" ? (
          <p className="mt-2 text-[11px] text-amber-700">
            Asked for <a className="underline" href={`/api/trace?sha=${wire.leaf}`}><code>{wire.leaf.slice(0, 16)}…</code></a>, the newest leaf of{" "}
            <a className="underline" href="/root.json">/root.json</a>.
          </p>
        ) : null}
      </section>
    );
  }

  const { doc, leaf, index, total, rootAsOf, http } = wire;
  const found = http === 200 && doc.state === "FOUND";
  const cardAsOf = traceCardAsOf(doc);
  return (
    <section
      className={`rounded-lg border ${found ? "border-slate-200 bg-white" : "border-amber-200 bg-amber-50"} p-4 ${className}`}
      data-testid="rail-trace"
    >
      <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
      <p className="mt-1 text-xs text-slate-600" data-testid="rail-trace-facts">
        <strong className={found ? "text-slate-900" : "text-amber-800"}>{doc.state}</strong>
        {" · "}leaf {index + 1} of {total} in <a className="underline" href="/root.json">/root.json</a>
        {" · "}writes_board: <code>false</code>
      </p>
      <p className="mt-1 break-all font-mono text-[11px] text-slate-600">
        <a className="underline" href={`/api/trace?sha=${leaf}`}>GET /api/trace?sha={leaf.slice(0, 16)}…</a>
        {found && typeof doc.source === "string" && doc.source ? (
          <>
            {" → "}
            <a className="underline" href={doc.source}>{doc.source}</a>
          </>
        ) : null}
      </p>
      <p className="mt-1 text-[11px] text-slate-600" data-testid="rail-trace-as-of">
        card as_of: <code>{cardAsOf ?? "UNCHECKABLE"}</code> · root as_of:{" "}
        <code>{rootAsOf ?? "UNCHECKABLE"}</code>
      </p>
      <p className="mt-2 text-[11px] text-slate-500">
        {found
          ? "FOUND means the named card was retrieved, not that it verifies — use Verify a card for the hash and signature."
          : "The public root names a leaf this door did not resolve on this load — printed, never painted over."}
      </p>
    </section>
  );
}
