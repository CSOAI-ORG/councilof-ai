/**
 * AskHost — mounted once in App.tsx (every shell, including Council OS). It is small on purpose:
 * it listens for ⌘K / Ctrl-K and the launcher events, records the reader's recents, and loads the
 * palette and the Ask GSPC pane as separate chunks the first time they are opened.
 *
 * A page that owns ⌘K itself (DemoOS, marked data-own-cmdk) keeps it. If the viewer already
 * granted agent consent in this tab, the in-page agent bridge (window.councilUi) is installed.
 *
 * Entry routes show the page first on every width. A compact launcher opens Ask deliberately;
 * hydration and navigation never open it. Closing keeps the mounted conversation available.
 */
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { MessageSquareText } from "lucide-react";
import { ASK_MOBILE_QUERY, ASK_OPEN, PALETTE_OPEN, isAskEntryRoute, recordRecent, shouldAutoOpenAsk, type AskOpenDetail } from "@/components/ask/askBus";

const AskPane = lazy(() => import("@/components/ask/AskPane"));
const CommandPalette = lazy(() => import("@/components/ask/CommandPalette"));

export default function AskHost() {
  const [location] = useLocation();
  const search = useSearch();
  const [palette, setPalette] = useState(false);
  const [askMounted, setAskMounted] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState<{ text: string; n: number } | null>(null);
  const [entryRoute, setEntryRoute] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const enteredRoute = useRef<string | null>(null);

  // The launcher follows entry routes; opening remains user-initiated and never submits a
  // question or changes Watch, voice or agent consent.
  useEffect(() => {
    if ((window as Window & { __CSOAI_PRERENDER__?: boolean }).__CSOAI_PRERENDER__) return;
    const route = location + "?" + search;
    if (enteredRoute.current === route) return;
    enteredRoute.current = route;
    const mobile = Boolean(window.matchMedia?.(ASK_MOBILE_QUERY).matches);
    setEntryRoute(isAskEntryRoute(location, search));
    if (shouldAutoOpenAsk(location, search, mobile)) {
      setAskMounted(true);
      setAskOpen(true);
    }
  }, [location, search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k" || e.altKey || e.shiftKey) return;
      if (document.querySelector("[data-own-cmdk]")) return;
      e.preventDefault();
      setPalette((p) => !p);
    };
    const onPalette = () => setPalette(true);
    const onAsk = (e: Event) => {
      if (!returnFocusRef.current && document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
        returnFocusRef.current = document.activeElement;
      }
      const q = (e as CustomEvent<AskOpenDetail>).detail?.question;
      setAskMounted(true);
      setAskOpen(true);
      if (q) setQuestion((prev) => ({ text: q, n: (prev?.n ?? 0) + 1 }));
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(PALETTE_OPEN, onPalette);
    window.addEventListener(ASK_OPEN, onAsk);
    try {
      if (window.sessionStorage.getItem("coai:ui-agent-consent") === "1") void import("@/lib/uiActions").then((m) => m.installAgentBridge());
    } catch {
      /* storage blocked: no bridge */
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(PALETTE_OPEN, onPalette);
      window.removeEventListener(ASK_OPEN, onAsk);
    };
  }, []);

  // Recents: the page the reader landed on, with its breadcrumb when the navigation knows it.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const href = window.location.pathname + window.location.search;
      if (/^\/(login|signup|404)\b/.test(href)) return;
      void import("@/components/ask/paletteIndex").then(({ crumbFor }) => {
        const known = crumbFor(href);
        recordRecent({
          href,
          title: known?.title ?? (document.title.split("|")[0].trim() || href),
          crumb: known?.crumb ?? href.split("?")[0],
        });
      });
    }, 800);
    return () => window.clearTimeout(t);
  }, [location, search]);

  return (
    <>
      {palette ? (
        <Suspense fallback={null}>
          <CommandPalette onClose={() => setPalette(false)} />
        </Suspense>
      ) : null}
      {askMounted ? (
        <Suspense fallback={null}>
          <AskPane
            open={askOpen}
            onClose={() => {
              setAskOpen(false);
              const trigger = returnFocusRef.current;
              returnFocusRef.current = null;
              window.requestAnimationFrame(() => {
                if (trigger?.isConnected) trigger.focus();
                else launcherRef.current?.focus();
              });
            }}
            question={question}
          />
        </Suspense>
      ) : null}
      {entryRoute && !askOpen ? (
        <button
          ref={launcherRef}
          type="button"
          onClick={(event) => {
            returnFocusRef.current = event.currentTarget;
            setAskMounted(true);
            setAskOpen(true);
          }}
          aria-label="Open Council of AI chat"
          title="Open Council of AI chat"
          data-testid="ask-fab"
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[70] inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-800 text-white shadow-lg hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <MessageSquareText className="h-6 w-6" aria-hidden="true" />
        </button>
      ) : null}
    </>
  );
}
