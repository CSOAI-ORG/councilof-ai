/** Search published pages, workspace panes, board tests and free tools. */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { navigate } from "wouter/use-browser-location";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowRight,
  MessageSquareText,
  Pin,
  PinOff,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  PALETTE_INDEX_EVENT,
  loadBoardAxes,
  loadPaletteTools,
  paletteIndex,
  paletteKind,
  paletteToolSourceState,
  search,
  type PaletteKind,
} from "./paletteIndex";
import {
  RECENTS_EVENT,
  RECENTS_KEY,
  openAsk,
  readRecents,
  recentDestination,
  setRecentPin,
} from "./askBus";

type Scope = "all" | PaletteKind;
type Row = {
  key: string;
  title: string;
  crumb: string;
  description: string;
  href?: string;
  external?: boolean;
  ask?: boolean;
};
const SCOPES: { id: Scope; label: string }[] = [
  { id: "all", label: "All" },
  { id: "workspace", label: "Workspaces" },
  { id: "tool", label: "Free tools" },
  { id: "axis", label: "Tests" },
  { id: "page", label: "Pages" },
];
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600";

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [active, setActive] = useState(0);
  const [recents, setRecents] = useState(readRecents);
  const [version, setVersion] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const returnTo = useRef<Element | null>(
    typeof document !== "undefined" ? document.activeElement : null,
  );
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const changed = () => setRecents(readRecents());
    const storage = (e: StorageEvent) => {
      if (e.key === RECENTS_KEY || e.key === null) changed();
    };
    window.addEventListener(PALETTE_INDEX_EVENT, bump);
    window.addEventListener(RECENTS_EVENT, changed);
    window.addEventListener("storage", storage);
    void loadPaletteTools();
    return () => {
      window.removeEventListener(PALETTE_INDEX_EVENT, bump);
      window.removeEventListener(RECENTS_EVENT, changed);
      window.removeEventListener("storage", storage);
    };
  }, []);
  const matches = useMemo(() => {
    const items = paletteIndex().filter(
      (it) => scope === "all" || paletteKind(it) === scope,
    );
    return q.trim() ? search(q, items, 200) : items;
  }, [q, scope, version]);
  const rows: Row[] = useMemo(() => {
    const result: Row[] =
      !q.trim() && scope === "all" && recents.length
        ? [
            ...recents.filter((r) => r.pinned),
            ...recents.filter((r) => !r.pinned).slice(0, 6),
          ]
            .slice(0, 16)
            .map((r) => ({
              ...r,
              key: "recent:" + r.href,
              description: r.pinned
                ? "Pinned in this browser"
                : "Recently opened in this browser",
            }))
        : matches.slice(0, 12).map((it) => ({ ...it, key: it.id }));
    if (q.trim())
      result.push({
        key: "ask",
        title: "Ask GSPC: “" + q.trim() + "”",
        crumb: "Ask from published sources",
        description: "Shift+Enter · Your question is sent to the Council API.",
        ask: true,
      });
    return result;
  }, [matches, q, scope, recents]);
  const index = Math.max(0, Math.min(active, rows.length - 1));
  const selected = rows[index];
  const saved = selected?.href
    ? recents.find((r) => r.href === recentDestination(selected.href!))
    : null;
  useEffect(() => {
    setActive(0);
    setNotice("");
  }, [q, scope]);
  useEffect(() => {
    list.current
      ?.querySelector<HTMLElement>('[data-result-index="' + index + '"]')
      ?.scrollIntoView?.({ block: "nearest" });
  }, [index]);
  const ask = () => {
    const question = q.trim();
    onClose();
    openAsk(question || undefined);
  };
  const choose = (row?: Row) => {
    if (!row) return;
    if (row.ask) {
      ask();
      return;
    }
    if (!row.href) return;
    onClose();
    if (row.external || !row.href.startsWith("/"))
      window.location.assign(row.href);
    else navigate(row.href);
  };
  const pin = () => {
    if (
      !selected?.href ||
      selected.external ||
      !recentDestination(selected.href)
    )
      return;
    const ok = setRecentPin(
      { href: selected.href, title: selected.title, crumb: selected.crumb },
      !saved?.pinned,
    );
    setRecents(readRecents());
    setNotice(
      ok
        ? saved?.pinned
          ? "Shortcut unpinned."
          : "Shortcut pinned in this browser."
        : "This browser could not save the shortcut. You can still open it.",
    );
  };
  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        loadBoardAxes(fetch, true),
        loadPaletteTools(undefined, true),
      ]);
    } finally {
      setRefreshing(false);
      setVersion((v) => v + 1);
    }
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive(
        e.key === "ArrowDown"
          ? Math.min(rows.length - 1, index + 1)
          : Math.max(0, index - 1),
      );
    } else if ((e.key === "Home" || e.key === "End") && e.altKey) {
      e.preventDefault();
      setActive(e.key === "Home" ? 0 : rows.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) ask();
      else choose(selected);
    }
  };
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-slate-950/45 backdrop-blur-sm" />
        <Dialog.Content
          aria-label="Search pages and ask"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            input.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            (returnTo.current as HTMLElement | null)?.focus?.();
          }}
          className="fixed left-1/2 top-[6vh] z-[91] flex max-h-[88dvh] w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-2xl sm:top-[10vh] sm:max-h-[80dvh]"
          data-testid="command-palette"
        >
          <div className="flex shrink-0 items-start justify-between border-b border-border px-4 py-3">
            <div>
              <Dialog.Title className="text-sm font-semibold">
                Search Council OS and the website
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-muted-foreground">
                Find a workspace, published test, free tool or page.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className={
                "ml-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-xs font-semibold hover:bg-muted " +
                FOCUS
              }
            >
              Esc
            </Dialog.Close>
          </div>
          <div className="flex shrink-0 items-center gap-3 px-4">
            <Search
              className="h-5 w-5 shrink-0 text-emerald-800"
              aria-hidden="true"
            />
            <label htmlFor={id + "-input"} className="sr-only">
              Search pages, or ask
            </label>
            <input
              id={id + "-input"}
              ref={input}
              role="combobox"
              aria-expanded="true"
              aria-autocomplete="list"
              aria-controls={id}
              aria-activedescendant={
                selected ? id + "-row-" + index : undefined
              }
              aria-describedby={id + "-help"}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKey}
              autoComplete="off"
              placeholder="Try safety, verify_card or corrections"
              className="min-h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div
            className="flex shrink-0 flex-wrap items-center gap-1 border-y border-border bg-muted/30 px-3 py-2"
            aria-label="Search categories"
          >
            {SCOPES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={scope === s.id}
                onClick={() => setScope(s.id)}
                className={
                  "min-h-11 rounded-lg px-3 text-xs font-semibold " +
                  (scope === s.id
                    ? "bg-emerald-800 text-white "
                    : "text-muted-foreground hover:bg-muted ") +
                  FOCUS
                }
              >
                {s.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing}
              aria-label="Refresh tool and test catalogue"
              className={
                "ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50 " +
                FOCUS
              }
            >
              <RefreshCw
                className={
                  "h-3.5 w-3.5 " +
                  (refreshing ? "animate-spin motion-reduce:animate-none" : "")
                }
                aria-hidden="true"
              />
              Refresh
            </button>
          </div>
          <p
            className="shrink-0 px-4 pb-1 pt-3 text-xs font-medium text-muted-foreground"
            role="status"
          >
            {!q.trim() && scope === "all" && recents.length
              ? "Pinned and recent · this browser"
              : Math.min(matches.length, 12) +
                " of " +
                matches.length +
                " matching destinations"}
          </p>
          <ul
            ref={list}
            id={id}
            role="listbox"
            aria-label="Results"
            className="min-h-0 flex-1 overflow-y-auto p-2"
          >
            {rows.map((row, i) => (
              <li
                key={row.key}
                id={id + "-row-" + i}
                role="option"
                aria-selected={i === index}
                data-result-index={i}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(row)}
                className={
                  "flex min-h-16 cursor-pointer items-start gap-3 rounded-xl px-3 py-3 " +
                  (i === index
                    ? "bg-emerald-50 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100"
                    : "hover:bg-muted") +
                  (row.ask ? " mt-1 border-t border-border" : "")
                }
              >
                {row.ask ? (
                  <MessageSquareText
                    className="mt-1 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <ArrowRight
                    className="mt-1 h-4 w-4 shrink-0 text-emerald-700"
                    aria-hidden="true"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] text-muted-foreground">
                    {row.crumb}
                  </span>
                  <span className="block break-words text-sm font-semibold">
                    {row.title}
                  </span>
                  <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {row.description}
                  </span>
                </span>
              </li>
            ))}
            {!matches.length && q.trim() ? (
              <li
                role="presentation"
                className="px-3 py-2 text-xs text-muted-foreground"
                data-testid="palette-empty"
              >
                No matching destination in this category. Try All or choose Ask
                GSPC.
              </li>
            ) : null}
          </ul>
          <div className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2">
            <span className="text-xs text-muted-foreground">
              {paletteToolSourceState() === "read"
                ? "Free tool catalogue read · execution is a separate action"
                : paletteToolSourceState() === "unreachable"
                  ? "Free tool catalogue unreachable · page search still works"
                  : "Reading free tool catalogue…"}
            </span>
            {selected?.href && !selected.external ? (
              <button
                type="button"
                onClick={pin}
                aria-pressed={Boolean(saved?.pinned)}
                aria-label={
                  (saved?.pinned ? "Unpin " : "Pin ") + selected.title
                }
                data-testid="palette-pin"
                className={
                  "inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold hover:bg-muted " +
                  FOCUS
                }
              >
                {saved?.pinned ? (
                  <PinOff className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {saved?.pinned ? "Unpin shortcut" : "Pin shortcut"}
              </button>
            ) : null}
          </div>
          {notice ? (
            <p
              className="shrink-0 px-4 pb-2 text-xs text-emerald-900"
              role="status"
            >
              {notice}
            </p>
          ) : null}
          <p
            id={id + "-help"}
            className="shrink-0 border-t border-border px-4 py-2 text-[11px] leading-5 text-muted-foreground"
          >
            ↑↓ to move · Enter to open · Shift+Enter to ask · Esc to close.
            Shortcuts save destinations, not your tool inputs.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
