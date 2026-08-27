import { useCallback, useMemo, useState } from "react";
import { matchRoute, matchTab, type LobbyTab } from "./tabs";

/**
 * useLobbyChat — the lobby's chat state, lifted out of the bar.
 *
 * WHY IT IS A HOOK AND NOT COMPONENT STATE. Two things need it: the chat bar
 * that writes the turns, and the right rail's "Chats" section that lists the
 * session's threads. Lifting it also means MINIMISING THE LOBBY CANNOT LOSE THE
 * THREAD — the overlay stays mounted while docked, so the state simply survives.
 *
 * IN MEMORY ONLY, AND THE UI SAYS SO. Threads live for this page session. There
 * is no server-side history, no localStorage of message text, nothing to
 * retrieve after a reload. The Chats section states that plainly rather than
 * implying a transcript exists somewhere.
 *
 * DETERMINISTIC FIRST. Two lanes, and the pill on every answer says which one
 * produced it:
 *   1. a local pane command ("show the board") — no network, no model;
 *   2. POST /api/chat, which answers from published measurement or refuses.
 * A non-200 or a network failure falls back to a short local help message that
 * is EXPLICITLY labelled deterministic. We never dress a local string up as a
 * live answer, and this lane never writes a compliance verdict.
 */

export type Turn = {
  role: "user" | "council";
  text: string;
  state?: string;
  signature?: string;
  at: string;
};

export type Thread = {
  id: string;
  /** First question asked, trimmed — the thread's name in the Chats rail. */
  title: string;
  startedAt: string;
  turns: Turn[];
};

/** Estate-wide state labels for council replies. */
export const STATE_LABEL: Record<string, string> = {
  live: "council · live specialist",
  grounded: "grounded in published measurement",
  ungrounded: "refused — no grounding available",
  unreachable: "endpoint unreachable",
  deterministic: "deterministic · local, no model",
};

const now = () => new Date().toISOString();

/** The offline help text. Deterministic, and it says so on its face. */
function offlineHelp(reason: string): string {
  return (
    `The Council endpoint did not answer — ${reason}. This reply is a local, deterministic ` +
    `help message, not an answer to your question: no measurement was read and none is implied.\n\n` +
    `What still works right now, with no network: say “show the board”, “verify a card”, ` +
    `“open Council Space”, “get measured” — each switches the pane on the ` +
    `left of this lobby. The pages themselves fetch their own live data and will tell you if ` +
    `they cannot reach it either.`
  );
}

export interface LobbyChat {
  threads: Thread[];
  activeId: string | null;
  active: Thread | null;
  busy: boolean;
  send: (
    question: string,
    onNavigate: (t: LobbyTab) => void,
    onOpenRoute?: (path: string, label: string) => void,
  ) => Promise<void>;
  startThread: () => void;
  selectThread: (id: string) => void;
  /** Total turns this session — quoted by the docked bar, computed never typed. */
  turnCount: number;
}

export function useLobbyChat(): LobbyChat {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const active = useMemo(
    () => threads.find((t) => t.id === activeId) ?? null,
    [threads, activeId],
  );

  const turnCount = useMemo(
    () => threads.reduce((n, t) => n + t.turns.length, 0),
    [threads],
  );

  const startThread = useCallback(() => setActiveId(null), []);
  const selectThread = useCallback((id: string) => setActiveId(id), []);

  const send = useCallback(
    async (raw: string, onNavigate: (t: LobbyTab) => void, onOpenRoute?: (path: string, label: string) => void) => {
      const question = raw.trim();
      if (!question || busy) return;

      // Open (or continue) a thread and record the user's turn.
      let id = activeId;
      const userTurn: Turn = { role: "user", text: question, at: now() };
      setThreads((prev) => {
        if (id && prev.some((t) => t.id === id)) {
          return prev.map((t) => (t.id === id ? { ...t, turns: [...t.turns, userTurn] } : t));
        }
        const fresh: Thread = {
          id: `t${Date.now().toString(36)}${prev.length}`,
          title: question.length > 64 ? question.slice(0, 63).trimEnd() + "…" : question,
          startedAt: now(),
          turns: [userTurn],
        };
        id = fresh.id;
        return [...prev, fresh];
      });
      // `id` was assigned synchronously inside the updater above when a thread
      // was created, so it is safe to adopt it here.
      const threadId = id!;
      setActiveId(threadId);

      const push = (t: Omit<Turn, "at">) =>
        setThreads((prev) =>
          prev.map((x) => (x.id === threadId ? { ...x, turns: [...x.turns, { ...t, at: now() }] } : x)),
        );

      // Lane 1 — deterministic command. Answered locally, labelled locally.
      const tab = matchTab(question);
      if (tab) {
        onNavigate(tab);
        push({
          role: "council",
          text:
            `Opened “${tab.label}” in the centre pane — ${tab.blurb}\n\n` +
            `That was a local pane switch, not a measurement. Whatever the pane shows, it fetched itself.`,
          state: "deterministic",
          signature: `local command · ${tab.path || "in-lobby pane"}`,
        });
        return;
      }
      const extra = matchRoute(question);
      if (extra && onOpenRoute) {
        onOpenRoute(extra.path, extra.label);
        push({
          role: "council",
          text:
            `Opened “${extra.label}” in the centre pane — ${extra.blurb}\n\n` +
            `That was a local pane switch, not a measurement. Whatever the pane shows, it fetched itself.`,
          state: "deterministic",
          signature: `local command · ${extra.path}`,
        });
        return;
      }

      // Lane 2 — the estate's honest endpoint.
      setBusy(true);
      try {
        const r = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: question }] }),
        });
        if (!r.ok) {
          push({
            role: "council",
            text: offlineHelp("HTTP " + r.status),
            state: "deterministic",
            signature: "local fallback · no measurement read",
          });
          return;
        }
        const j: any = await r.json();
        const answer = j?.answer ?? j?.reply;
        if (typeof answer !== "string" || !answer.trim()) {
          push({
            role: "council",
            text: offlineHelp("it returned an empty answer"),
            state: "deterministic",
            signature: "local fallback · no measurement read",
          });
          return;
        }
        push({ role: "council", text: answer, state: j.state, signature: j.signature });
        // The /os quest is called "Ask the Council one grounded question". It used to be
        // awarded for CLICKING it. It is awarded here instead — only once an answer has
        // actually come back grounded in published measurement. A refusal is not a
        // grounded answer and does not count.
        if (j.state === "grounded" || j.state === "live") {
          import("@/components/os/quests").then((q) => q.markQuest("ask")).catch(() => { /* local play only */ });
        }
      } catch (e: any) {
        push({
          role: "council",
          text: offlineHelp(String(e?.message ?? e)),
          state: "deterministic",
          signature: "local fallback · no measurement read",
        });
      } finally {
        setBusy(false);
      }
    },
    [activeId, busy],
  );

  return { threads, activeId, active, busy, send, startThread, selectThread, turnCount };
}
