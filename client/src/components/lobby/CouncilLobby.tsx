import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { isEmbedded, useEmbedNavigation } from "@/lib/embed";
import { useLobbyDeepLink } from "@/lib/lobbyLink";
import { isOsProductPath } from "@/lib/osChrome";
import ErrorBoundary from "@/components/ErrorBoundary";
import LobbyOverlay from "./LobbyOverlay";

export default function CouncilLobby() {
  useEmbedNavigation();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [embedded, setEmbedded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const intent = useLobbyDeepLink();

  useEffect(() => { setEmbedded(isEmbedded()); }, []);
  useEffect(() => { if (intent) setOpen(true); }, [intent]);
  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const close = useCallback(() => setOpen(false), []);
  if (embedded || isOsProductPath(location)) return null;

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
            <div role="alertdialog" aria-label="Council OS failed to open" className="fixed inset-4 z-[80] flex max-h-[16rem] flex-col items-start justify-center gap-3 rounded-2xl border border-rose-200 bg-white p-6 shadow-xl sm:left-auto sm:right-5 sm:top-auto sm:bottom-24 sm:w-[22rem]">
              <p className="text-sm font-semibold text-slate-900">Council OS did not open.</p>
              <p className="text-xs text-slate-600">The rest of the site is still here. Refresh, or use the pages in the header.</p>
              <button type="button" onClick={close} className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white">Dismiss</button>
            </div>
          }
        >
          <LobbyOverlay onClose={close} intent={intent} />
        </ErrorBoundary>
      )}
    </>
  );
}
