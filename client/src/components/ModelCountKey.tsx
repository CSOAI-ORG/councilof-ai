import { useEffect, useState } from "react";
import { MODEL_COUNT_SOURCES, ROW_BUILDERS, type CountRow } from "@/lib/modelCountKey";

/**
 * ModelCountKey — "Which number do I quote?" beside every model count on the site.
 *
 * Five counts, five files, five different things. Each row reads its own source when the reader
 * opens the key (nothing is fetched until then), shows "not read" when its fetch fails, and is
 * never summed with another row. See lib/modelCountKey.ts.
 */
export default function ModelCountKey({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CountRow[] | null>(null);

  useEffect(() => {
    if (!open || rows) return;
    let alive = true;
    Promise.all(
      ROW_BUILDERS.map(([id, build]) =>
        fetch(MODEL_COUNT_SOURCES[id], { headers: { accept: "application/json" } })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
          .then((doc) => build(doc)),
      ),
    ).then((built) => alive && setRows(built));
    return () => {
      alive = false;
    };
  }, [open, rows]);

  const dark = tone === "dark";
  const box = dark ? "border-white/15 text-emerald-50/85" : "border-border text-muted-foreground";
  const strong = dark ? "text-white" : "text-foreground";
  return (
    <details
      className={`group rounded-xl border px-3 ${box} ${className}`}
      data-testid="model-count-key"
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className={`flex min-h-11 cursor-pointer list-none items-center text-sm font-medium hover:underline ${strong}`}>
        Which number do I quote?
      </summary>
      <div className="pb-3 text-[13px] leading-relaxed">
        <p>Each figure below reads its own file and counts a different thing. They are never added together.</p>
        {rows === null ? (
          <p className="mt-2" role="status">Reading the five files…</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {rows.map((r) => (
              <li key={r.id} data-testid={`model-count-${r.id}`}>
                <span className={`font-mono font-bold ${strong}`}>{r.value === null ? "not read" : r.value}</span>{" "}
                <a href={r.href} className="underline underline-offset-2">
                  {r.label}
                </a>
                {r.detail ? <span>: {r.detail}</span> : null}
                <span className="block font-mono text-[11px] opacity-75">{r.source}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
