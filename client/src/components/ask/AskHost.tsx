/**
 * AskHost — mounted once in App.tsx (every shell, including Council OS). It is small on purpose:
 * it listens for ⌘K / Ctrl-K and the launcher events, records the reader's recents, and loads the
 * palette and the Ask GSPC pane as separate chunks the first time they are opened.
 *
 * A page that owns ⌘K itself (DemoOS, marked data-own-cmdk) keeps it. If the viewer already
 * granted agent consent in this tab, the in-page agent bridge (window.councilUi) is installed.
 */
import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ASK_OPEN, PALETTE_OPEN, recordRecent, type AskOpenDetail } from "@/components/ask/askBus";

const AskPane = lazy(() => import("@/components/ask/AskPane"));
const CommandPalette = lazy(() => import("@/components/ask/CommandPalette"));

export default function AskHost() {
  const [location] = useLocation();
  const search = useSearch();
  const [palette, setPalette] = useState(false);
  const [askMounted, setAskMounted] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState<{ text: string; n: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k" || e.altKey || e.shiftKey) return;
      if (document.querySelector("[data-own-cmdk]")) return;
      e.preventDefault();
      setPalette((p) => !p);
    };
    const onPalette = () => setPalette(true);
    const onAsk = (e: Event) => {
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
          <AskPane open={askOpen} onClose={() => setAskOpen(false)} question={question} />
        </Suspense>
      ) : null}
    </>
  );
}
