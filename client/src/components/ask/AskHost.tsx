/**
 * AskHost — mounted once in App.tsx (every shell, including Council OS). It is small on purpose:
 * it listens for ⌘K / Ctrl-K and the launcher events, records the reader's recents, and loads the
 * palette and the Ask GSPC pane as separate chunks the first time they are opened.
 *
 * A page that owns ⌘K itself (DemoOS, marked data-own-cmdk) keeps it. If the viewer already
 * granted agent consent in this tab, the in-page agent bridge (window.councilUi) is installed.
 *
 * Mobile (ASK_MOBILE_QUERY): the entry routes do not open Ask; the page shows first and a small
 * launcher opens it on tap. State starts closed on every width, so SSR/prerender and first paint
 * never show the pane; wider screens open it after mount as before.
 *
 * A question handed over while the pane is still loading is reserved, not dropped: the launcher
 * that asked for it is told synchronously whether the host accepted it, and a pane that fails to
 * load leaves the results already returned in place and can be opened again.
 */
import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useSearch } from "wouter";
import { MessageSquareText } from "lucide-react";
import { ASK_MOBILE_QUERY, ASK_OPEN, PALETTE_OPEN, isAskEntryRoute, recordRecent, shouldAutoOpenAsk, type AskOpenDetail, type AskRequest } from "@/components/ask/askBus";

import { createAskRequests } from "@/lib/askRequests";

const loadAskPane = () => import("@/components/ask/AskPane");
const CommandPalette = lazy(() => import("@/components/ask/CommandPalette"));

class AskLoadBoundary extends Component<{
  children: ReactNode; open: boolean; onError: (error: Error) => void; onRetry: () => void; onClose: () => void;
}, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { this.props.onError(error); }
  render() {
    if (!this.state.error) return this.props.children;
    if (!this.props.open) return null;
    return <aside role="alert" className="fixed bottom-4 right-4 z-[80] max-w-sm rounded-xl border border-border bg-background p-4 shadow-xl">
      <p className="font-semibold">Ask could not open.</p>
      <p className="mt-1 text-sm">Any results already returned are kept. Opening Ask again does not resend your question.</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={this.props.onRetry} className="min-h-11 rounded-lg border px-3">Open Ask again</button>
        <button type="button" onClick={this.props.onClose} className="min-h-11 rounded-lg border px-3">Close</button>
      </div>
    </aside>;
  }
}

export default function AskHost() {
  const [location] = useLocation();
  const search = useSearch();
  const [palette, setPalette] = useState(false);
  const [askMounted, setAskMounted] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState<AskRequest | null>(null);
  const [AskPane, setAskPane] = useState(() => lazy(loadAskPane));
  const [loadAttempt, setLoadAttempt] = useState(0);
  const loadFailed = useRef(false);
  const retryPane = () => {
    loadFailed.current = false;
    setAskPane(() => lazy(loadAskPane));
    setLoadAttempt((n) => n + 1);
  };
  const requests = useRef<ReturnType<typeof createAskRequests> | null>(null);
  if (!requests.current) requests.current = createAskRequests(() => {
    if (loadFailed.current) retryPane();
    setAskMounted(true); setAskOpen(true);
  }, setQuestion);
  const paneFailed = (error: Error) => {
    loadFailed.current = true;
    requests.current!.failed(error.message);
    setQuestion(null);
  };
  const cancelWaiting = () => {
    requests.current!.cancelPending();
    setQuestion(null);
    setAskOpen(false);
  };
  const [mobileEntry, setMobileEntry] = useState(false);
  const enteredRoute = useRef<string | null>(null);

  // Human entrypoints open the existing Ask conversation after hydration. A close lasts until
  // navigation; opening never submits a question or changes Watch, voice or agent consent.
  useEffect(() => {
    if ((window as Window & { __CSOAI_PRERENDER__?: boolean }).__CSOAI_PRERENDER__) return;
    const route = location + "?" + search;
    if (enteredRoute.current === route) return;
    enteredRoute.current = route;
    const mobile = Boolean(window.matchMedia?.(ASK_MOBILE_QUERY).matches);
    setMobileEntry(mobile && isAskEntryRoute(location, search));
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
      const detail = (e as CustomEvent<AskOpenDetail>).detail;
      if (detail) requests.current!.receive(detail);
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
        <AskLoadBoundary key={loadAttempt} open={askOpen} onError={paneFailed}
          onRetry={retryPane} onClose={() => setAskOpen(false)}>
          <Suspense fallback={askOpen ? <aside role="status" className="fixed bottom-4 right-4 z-[80] rounded-xl border border-border bg-background p-4 shadow-xl">
            <p>Opening Ask… Your question is kept while the panel loads.</p>
            <button type="button" onClick={cancelWaiting} className="mt-2 min-h-11 rounded-lg border px-3">Cancel question</button>
          </aside> : null}>
            <AskPane open={askOpen} onClose={() => setAskOpen(false)} question={question}
              onReady={requests.current!.attach} onQuestionTaken={requests.current!.taken} />
          </Suspense>
        </AskLoadBoundary>
      ) : null}
      {mobileEntry && !askOpen ? (
        <button
          type="button"
          onClick={() => {
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
