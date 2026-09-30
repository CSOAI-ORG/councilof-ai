/**
 * CommandPalette — ⌘K / Ctrl-K. Search every destination the site's navigation promotes, each hit
 * with its location breadcrumb; pinned and recent pages first; and a last row that hands the query
 * to Ask GSPC (Shift+Enter from anywhere, or Enter when nothing matches). The Cloudflare pattern:
 * no query dead-ends. Search here is substring matching over the index; nothing is sent anywhere
 * until you choose Ask, and Ask is the deterministic talk router, not a model.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { navigate } from "wouter/use-browser-location";
import { ArrowRight, CornerDownLeft, MessageSquareText, Pin, PinOff, Search, X } from "lucide-react";
import { paletteIndex, search, type PaletteItem } from "@/components/ask/paletteIndex";
import { openAsk, readRecents, togglePin, type Recent } from "@/components/ask/askBus";
import CorpusChip from "@/components/CorpusChip";

type Row =
  | { kind: "item"; item: PaletteItem; key: string }
  | { kind: "recent"; recent: Recent; key: string }
  | { kind: "ask"; key: string };

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600";

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [recents, setRecents] = useState<Recent[]>(() => readRecents());
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const returnTo = useRef<Element | null>(typeof document !== "undefined" ? document.activeElement : null);

  useEffect(() => {
    input.current?.focus();
    const onRecents = () => setRecents(readRecents());
    window.addEventListener("council:recents", onRecents);
    return () => {
      window.removeEventListener("council:recents", onRecents);
      (returnTo.current as HTMLElement | null)?.focus?.();
    };
  }, []);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    if (!q.trim()) {
      const pinned = recents.filter((r) => r.pinned);
      const rest = recents.filter((r) => !r.pinned).slice(0, 6);
      for (const r of [...pinned, ...rest]) out.push({ kind: "recent", recent: r, key: `r:${r.href}` });
      if (!out.length) for (const it of paletteIndex().slice(0, 6)) out.push({ kind: "item", item: it, key: `i:${it.id}` });
      return out;
    }
    for (const it of search(q)) out.push({ kind: "item", item: it, key: `i:${it.id}` });
    out.push({ kind: "ask", key: "ask" });
    return out;
  }, [q, recents]);

  useEffect(() => setActive(0), [q]);

  const go = (href: string, external?: boolean) => {
    onClose();
    if (external || !href.startsWith("/")) window.location.assign(href);
    else navigate(href);
  };
  const ask = () => {
    const text = q.trim();
    onClose();
    openAsk(text || undefined);
  };
  const choose = (r: Row | undefined) => {
    if (!r) return;
    if (r.kind === "ask") ask();
    else if (r.kind === "recent") go(r.recent.href);
    else go(r.item.href, r.item.external);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(rows.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) ask();
      else choose(rows[active]);
    }
  };

  const hasHits = rows.some((r) => r.kind === "item");

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-slate-950/40 px-4 pt-[10vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Search pages and ask" className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-2xl" data-testid="command-palette">
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="palette-input" className="sr-only">
            Search pages, or ask
          </label>
          <input
            id="palette-input"
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            aria-controls={listId}
            aria-describedby={`${listId}-help`}
            autoComplete="off"
            placeholder="Search pages, or ask about the board, a card or a server"
            className="min-h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <button type="button" onClick={onClose} aria-label="Close" className={`inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted ${FOCUS}`}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 2xl:hidden">
          <span className="text-xs text-muted-foreground">Corpus in view</span>
          <CorpusChip className="inline-flex" />
        </div>
        <ul id={listId} aria-label="Results" aria-live="polite" className="max-h-[60vh] overflow-y-auto p-2">
          {!q.trim() ? (
            <li className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {recents.length ? "Pinned and recent (this browser only)" : "Start here"}
            </li>
          ) : null}
          {rows.map((r, i) => {
            const on = i === active;
            const base = `flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left ${on ? "bg-emerald-50 dark:bg-emerald-950" : ""}`;
            if (r.kind === "ask")
              return (
                <li key={r.key} className="border-t border-border pt-1">
                  <button type="button" onMouseEnter={() => setActive(i)} onClick={ask} className={`${base} ${FOCUS}`} data-testid="palette-ask" aria-current={on || undefined}>
                  <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800 dark:text-emerald-300" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      Ask GSPC: &ldquo;{q.trim()}&rdquo;
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {hasHits ? "Shift+Enter" : "Enter"} · answered from signed records, or &ldquo;not measured&rdquo;
                    </span>
                  </span>
                  <CornerDownLeft className="mt-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  </button>
                </li>
              );
            if (r.kind === "recent")
              return (
                <li key={r.key} onMouseEnter={() => setActive(i)} className={base}>
                  <button type="button" onClick={() => choose(r)} className={`min-w-0 flex-1 text-left ${FOCUS}`} aria-current={on || undefined}>
                    <span className="block text-xs text-muted-foreground">{r.recent.crumb}</span>
                    <span className="block truncate text-sm font-semibold">{r.recent.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      togglePin(r.recent.href);
                      setRecents(readRecents());
                    }}
                    aria-label={r.recent.pinned ? `Unpin ${r.recent.title}` : `Pin ${r.recent.title}`}
                    aria-pressed={Boolean(r.recent.pinned)}
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-muted ${FOCUS}`}
                    data-testid="palette-pin"
                  >
                    {r.recent.pinned ? <PinOff className="h-4 w-4" aria-hidden="true" /> : <Pin className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </li>
              );
            return (
              <li key={r.key}>
                <button type="button" onMouseEnter={() => setActive(i)} onClick={() => choose(r)} className={`${base} ${FOCUS}`} aria-current={on || undefined}>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted-foreground">{r.item.crumb}</span>
                  <span className="block text-sm font-semibold">{r.item.title}</span>
                  {r.item.description ? <span className="block truncate text-xs text-muted-foreground">{r.item.description}</span> : null}
                </span>
                <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </button>
              </li>
            );
          })}
          {q.trim() && !hasHits ? (
            <li className="px-2 py-2 text-xs text-muted-foreground" data-testid="palette-empty">
              No page title or description contains &ldquo;{q.trim()}&rdquo;. Ask GSPC can still answer it from the signed records, or say it
              is not measured.
            </li>
          ) : null}
        </ul>
        <p id={`${listId}-help`} className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
          ↑↓ to move · Enter to open · Shift+Enter to ask · Esc to close. Recents and pins stay in this browser.
        </p>
      </div>
    </div>
  );
}
