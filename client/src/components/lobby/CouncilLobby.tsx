import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { isEmbedded, useEmbedNavigation } from "@/lib/embed";
import { useLobbyDeepLink } from "@/lib/lobbyLink";

/**
 * CouncilLobby — the badge, and only the badge, until someone opens it.
 *
 * Mounted once globally next to CouncilConsole. The trigger sits directly ABOVE
 * the existing chat bubble (`bottom-20 right-5` against the bubble's
 * `bottom-5 right-5`) so the two form one vertical pair in the bottom-right
 * cluster. It does not replace the bubble and it is not a third floater.
 *
 * PERF: the overlay — three rails, the task rail's fetches, the chat bar — is a
 * separate lazy chunk. Until the badge is clicked the page pays for this file
 * and nothing else.
 *
 * The lobby frames real routes in same-origin iframes. Inside such a frame the
 * app boots again, so the badge would otherwise stack forever. `isEmbedded()`
 * suppresses this trigger there. Header, footer, cookie banner and the
 * console hide themselves via the same `isEmbedded()` check.
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

const LobbyOverlay = lazy(() => import("./LobbyOverlay"));

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
        aria-label="Open the Council Lobby"
        aria-expanded={open}
        title="Council Lobby — every live surface in one place"
        className="fixed bottom-20 right-5 z-[70] flex h-12 w-12 items-center justify-center rounded-full bg-emerald-800 text-emerald-50 shadow-lg ring-1 ring-emerald-300/30 transition hover:bg-emerald-700 motion-safe:hover:scale-105 motion-reduce:transition-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
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
        <Suspense fallback={null}>
          <LobbyOverlay onClose={close} intent={intent} />
        </Suspense>
      )}
    </>
  );
}
