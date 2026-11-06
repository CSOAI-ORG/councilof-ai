import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, Clock3, Pin, PinOff, Search } from "lucide-react";
import {
  openPalette,
  readRecents,
  RECENTS_EVENT,
  RECENTS_KEY,
  togglePin,
} from "@/components/ask/askBus";

/** Reuses the global shortcut store. Tool inputs and response bodies are never saved here. */
export default function WorkspaceShortcuts() {
  const [items, setItems] = useState(readRecents);
  const [expanded, setExpanded] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const changed = () => setItems(readRecents());
    const storage = (event: StorageEvent) => {
      if (event.key === RECENTS_KEY || event.key === null) changed();
    };
    window.addEventListener(RECENTS_EVENT, changed);
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener(RECENTS_EVENT, changed);
      window.removeEventListener("storage", storage);
    };
  }, []);
  const relevant = items.filter(
    (item) => !/^\/dashboard\/?(?:\?tab=home)?$/.test(item.href),
  );
  const pinned = relevant.filter((item) => item.pinned);
  const recent = relevant.filter((item) => !item.pinned).slice(0, 4);
  const shown = [...pinned, ...recent];
  const visible = expanded ? shown : shown.slice(0, 6);
  return (
    <section
      aria-labelledby="workspace-shortcuts-h"
      data-testid="workspace-shortcuts"
      className="mt-6 rounded-2xl border border-emerald-950/15 bg-card p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
            Your workspace
          </p>
          <h2
            id="workspace-shortcuts-h"
            className="mt-1 text-lg font-semibold tracking-tight"
          >
            Pick up where you left off.
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Pin destinations from Search. Shortcuts stay in this browser and
            open without running a tool.
          </p>
        </div>
        <button
          type="button"
          onClick={openPalette}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Find tools and pages
          <kbd className="ml-2 hidden rounded border border-white/25 px-1.5 py-0.5 text-[10px] sm:inline">
            ⌘K / Ctrl K
          </kbd>
        </button>
      </div>
      {visible.length ? (
        <ul
          aria-label="Saved and recent workspace destinations"
          className="mt-4 grid list-none gap-2 p-0 sm:grid-cols-2 xl:grid-cols-3"
        >
          {visible.map((item) => (
            <li
              key={item.href}
              className="group flex min-w-0 items-center rounded-xl border border-border bg-background hover:border-emerald-800/35"
            >
              <Link
                href={item.href}
                className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-l-xl px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                {item.pinned ? (
                  <Pin
                    className="h-4 w-4 shrink-0 text-emerald-800"
                    aria-hidden="true"
                  />
                ) : (
                  <Clock3
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {item.crumb}
                  </span>
                  <span className="block truncate text-sm font-semibold">
                    {item.title}
                  </span>
                </span>
                <ArrowUpRight
                  className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </Link>
              <button
                type="button"
                aria-label={(item.pinned ? "Unpin " : "Pin ") + item.title}
                aria-pressed={Boolean(item.pinned)}
                onClick={() =>
                  setNotice(
                    togglePin(item.href)
                      ? item.pinned
                        ? "Shortcut unpinned."
                        : "Shortcut pinned in this browser."
                      : "This browser could not save the shortcut.",
                  )
                }
                className="mr-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                {item.pinned ? (
                  <PinOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Pin className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {shown.length > 6 ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-2 min-h-11 text-xs font-semibold text-emerald-800 underline underline-offset-4"
        >
          {expanded ? "Show fewer shortcuts" : "Show all saved shortcuts"}
        </button>
      ) : null}
      {notice ? (
        <p role="status" className="mt-2 text-xs text-emerald-900">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
