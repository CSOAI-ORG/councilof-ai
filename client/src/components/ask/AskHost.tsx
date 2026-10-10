/**
 * AskHost — mounted once in App.tsx (every shell, including Council OS). It is small on purpose:
 * it listens for ⌘K / Ctrl-K and the launcher events, records the reader's recents, and loads the
 * palette and the Ask GSPC pane as separate chunks the first time they are opened.
 *
 * A page that owns ⌘K itself (DemoOS, marked data-own-cmdk) keeps it. If the viewer already
 * granted agent consent in this tab, the in-page agent bridge (window.councilUi) is installed.
 */
import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useSearch } from "wouter";
import { ASK_OPEN, PALETTE_OPEN, recordRecent, type AskOpenDetail, type AskRequest } from "@/components/ask/askBus";

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
    </>
  );
}
