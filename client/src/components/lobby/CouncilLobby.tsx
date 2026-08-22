import { useCallback, useEffect, useRef, useState } from "react";
import { isEmbedded, useEmbedNavigation } from "@/lib/embed";
import { useLobbyDeepLink } from "@/lib/lobbyLink";
import ErrorBoundary from "@/components/ErrorBoundary";
import LobbyOverlay from "./LobbyOverlay";

/**
 * CouncilLobby — the badge, and only the badge, until someone opens it.
 *
 * Mounted once globally. It IS the Council OS launcher — the old console
 * bubble was a second chat on the same corner and is no longer mounted.
 * The badge sits at `bottom-5 right-5`, one control, one workspace.
 *
 * The overlay used to be a second lazy chunk. A mid-deploy hash miss (or a
 * browser caching a failed dynamic import) then threw through the app
 * ErrorBoundary and replaced the whole site with "Something went wrong" —
 * including /assess, /watchdog and /gspc-verify after one badge click. The
 * overlay ships with this module now; a local boundary keeps a lobby fault
 * on the badge.
 *
 * The lobby frames real routes in same-origin iframes. Inside such a frame the
 * app boots again, so the badge would otherwise stack forever. `isEmbedded()`
 * suppresses this trigger there. Header, footer, cookie banner and the
 * skip links hide via `useSiteChromeHidden()` (embed or OS open).
 *
 * The overlay owns its own window state (open / minimised / expanded); this file
 * only owns the badge and the mount. Minimising does NOT unmount the overlay —
 * that is exactly how the pane and the chat thread survive a minimise.
 *
 * DEEP LINKS. `useLobbyDeepLink()` (client/src/lib/lobbyLink.ts) surfaces an
 * intent from `?lobby=`/`?task=`/`?ask=` on arrival, or from an in-page
 * `openLobby()` call. An intent opens the lobby and selects a pane; its seeded
 * prompt is TYPED into the chat bar and never sent. The params are stripped from
 * the URL as soon as they are read, so a refresh does not re-trigger.
 */

export default function CouncilLobby() {
  useEmbedNavigation();
  const [open, setOpen] = useState(false);
  const [embedded, setEmbedded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const intent = useLobbyDeepLink();

  useEffect(() => { setEmbedded(isEmbedded()); }, []);

  // A deep link opens the lobby. It does not ask the question — the user does.
  useEffect(() => { if (intent) setOpen(true); }, [intent]);

  // Return focus to the badge when the overlay closes (not on first mount).
  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  if (embedded) return null;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        aria-label="Open Council OS"
        aria-expanded={open}
        title="Council OS — every live surface in one workspace"
        className="fixed bottom-5 right-5 z-[70] flex h-12 w-12 items-center justify-center rounded-full bg-emerald-800 text-emerald-50 shadow-lg ring-1 ring-emerald-300/30 transition hover:bg-emerald-700 motion-safe:hover:scale-105 motion-reduce:transition-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 9a9 5 0 0 1 18 0" />
          <path d="M3 9v9" /><path d="M21 9v9" />
          <path d="M7.5 9.6v8.4" /><path d="M12 9.9v8.1" /><path d="M16.5 9.6v8.4" />
          <path d="M2.5 18h19" />
          <path d="M9.6 18v-3.2a2.4 2.4 0 0 1 4.8 0V18" />
        </svg>
      </button>

      {open && (
        <ErrorBoundary
          fallback={
            <div
              role="alertdialog"
              aria-label="Council OS failed to open"
              className="fixed inset-4 z-[80] flex max-h-[16rem] flex-col items-start justify-center gap-3 rounded-2xl border border-rose-200 bg-white p-6 shadow-xl sm:left-auto sm:right-5 sm:top-auto sm:bottom-24 sm:w-[22rem]"
            >
              <p className="text-sm font-semibold text-slate-900">Council OS did not open.</p>
              <p className="text-xs text-slate-600">The rest of the site is still here. Refresh, or use the pages in the header.</p>
              <button
                type="button"
                onClick={close}
                className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Dismiss
              </button>
            </div>
          }
        >
          <LobbyOverlay onClose={close} intent={intent} />
        </ErrorBoundary>
      )}
    </>
  );
}
