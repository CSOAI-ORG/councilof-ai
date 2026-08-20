import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";

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
 * app boots again, so the badge would otherwise stack forever; `?embed=1`
 * suppresses this trigger there. That is the ONLY thing reading the flag today —
 * no page hides its own chrome yet.
 */

const LobbyOverlay = lazy(() => import("./LobbyOverlay"));

function isEmbedded(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get("embed") === "1") return true;
    return window.self !== window.top;
  } catch {
    // Cross-origin frame access threw — treat as embedded and stay quiet.
    return true;
  }
}

export default function CouncilLobby() {
  const [open, setOpen] = useState(false);
  const [embedded, setEmbedded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => { setEmbedded(isEmbedded()); }, []);

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
        className="fixed bottom-20 right-5 z-[70] flex h-12 w-12 items-center justify-center rounded-full bg-emerald-800 text-emerald-50 shadow-lg ring-1 ring-emerald-300/30 transition hover:scale-105 hover:bg-emerald-700"
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
          <LobbyOverlay onClose={close} />
        </Suspense>
      )}
    </>
  );
}
