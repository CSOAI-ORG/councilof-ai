/**
 * CorpusChip — the card corpus in view, named in the header (the Cloudflare "scope in the header"
 * pattern). The site publishes THREE card corpora with zero identifier overlap
 * (council-os/CARD-CORPORA.md; GET /api/state → signed_cards.corpus_relation). A bare "cards"
 * count is ambiguous, so the chrome always says which one a reader is looking at.
 *
 * Counts are read from GET /api/state when the chip is opened, each with its kind and as_of as
 * the endpoint states them. Corpus 1 is not in /api/state, so no number is shown for it: it links
 * to its own file instead. The three are never added together. The choice is a per-viewer
 * convenience (localStorage) that other views may read; it changes no number.
 */
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Layers } from "lucide-react";

export type CorpusId = "signed-index" | "public-root" | "cards-bundle";

export const CORPORA: { id: CorpusId; n: number; name: string; what: string; href: string }[] = [
  {
    id: "signed-index",
    n: 3,
    name: "Signed card index",
    what: "Signed cards whose bodies are verified: the only one of the three behind which a check is run.",
    href: "/dashboard/?tab=cards",
  },
  {
    id: "public-root",
    n: 2,
    name: "Public root leaves",
    what: "Leaves under the signed Merkle root (root.json). Its timestamp proof covers root.json bytes only.",
    href: "/root.json",
  },
  {
    id: "cards-bundle",
    n: 1,
    name: "Cards bundle",
    what: "A build-time aggregate of card wrapper files. It signs nothing and measures nothing.",
    href: "/cards-bundle.json",
  },
];

const KEY = "coai:corpus";

export function readCorpus(): CorpusId {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "public-root" || v === "cards-bundle" ? v : "signed-index";
  } catch {
    return "signed-index";
  }
}

type Count = { value: number; kind: string; as_of: string | null } | null;
type Counts = { "signed-index": Count; "public-root": Count; overlap: number | null } | null;

function countOf(v: unknown): Count {
  const r = v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  return r && typeof r.value === "number" ? { value: r.value, kind: String(r.kind ?? ""), as_of: typeof r.as_of === "string" ? r.as_of : null } : null;
}

export default function CorpusChip({ className = "hidden lg:inline-flex" }: { className?: string }) {
  const [corpus, setCorpus] = useState<CorpusId>("signed-index");
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Counts>(null);
  const [err, setErr] = useState<string | null>(null);
  const panelId = useId();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => setCorpus(readCorpus()), []);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  useEffect(() => {
    if (!open || counts) return;
    fetch("/api/state", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: Record<string, any>) =>
        setCounts({
          "signed-index": countOf(d?.card_chain?.bodies_verified_valid),
          "public-root": countOf(d?.public_root?.card_count),
          overlap: typeof d?.signed_cards?.corpus_relation?.identifier_overlap === "number" ? d.signed_cards.corpus_relation.identifier_overlap : null,
        }),
      )
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)));
  }, [open, counts]);

  const pick = (id: CorpusId) => {
    setCorpus(id);
    try {
      window.localStorage.setItem(KEY, id);
    } catch {
      /* storage blocked: the choice lasts for this page */
    }
    window.dispatchEvent(new CustomEvent("council:corpus", { detail: id }));
  };
  const cur = CORPORA.find((c) => c.id === corpus)!;

  return (
    <div ref={wrap} className={`relative items-center ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-300 px-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
        data-testid="corpus-chip"
      >
        <Layers className="h-3.5 w-3.5" aria-hidden="true" />
        <span>
          <span className="sr-only">Card corpus in view: </span>
          {cur.name}
        </span>
        <span className="rounded bg-slate-100 px-1 font-mono text-xs text-slate-700">corpus {cur.n}</span>
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {open ? (
        <div
          id={panelId}
          role="group"
          aria-label="Card corpora"
          className="absolute right-0 top-full z-[60] mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl"
        >
          <p className="text-xs text-slate-700">
            Three separate card corpora. They are never added together
            {counts?.overlap === 0 ? "; identifier overlap is 0 (GET /api/state)" : ""}.
          </p>
          <ul className="mt-2 space-y-2">
            {CORPORA.map((c) => {
              const n = c.id === "cards-bundle" ? null : counts?.[c.id] ?? null;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => pick(c.id)}
                    aria-pressed={c.id === corpus}
                    className={`w-full rounded-lg border p-2 text-left text-sm hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${c.id === corpus ? "border-emerald-700 bg-emerald-50" : "border-slate-200"}`}
                  >
                    <span className="flex flex-wrap items-baseline justify-between gap-1">
                      <span className="font-semibold">
                        {c.name} <span className="font-mono text-xs text-slate-600">corpus {c.n}</span>
                      </span>
                      <span className="font-mono text-xs text-slate-700">
                        {c.id === "cards-bundle"
                          ? "not in /api/state"
                          : n
                            ? `${n.value} · ${n.kind}`
                            : err
                              ? "unread"
                              : counts
                                ? "not stated"
                                : "reading…"}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-700">{c.what}</span>
                  </button>
                  <a href={c.href} className="mt-1 inline-block text-xs font-medium text-emerald-800 underline underline-offset-2">
                    Open {c.href}
                  </a>
                </li>
              );
            })}
          </ul>
          {err ? <p className="mt-2 text-xs text-slate-700">GET /api/state failed ({err}); no count is shown in its place.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
