import { useCallback, useMemo, useState } from "react";
import {
  aguiAvailable,
  resumeAguiAfterConsent,
  runAguiSession,
  submitAguiConsent,
  type AguiHitl,
} from "./aguiStream";
import { matchTab, type LobbyTab } from "./tabs";

/**
 * useLobbyChat — the lobby's chat state, lifted out of the bar.
 *
 * Three network lanes (pill on every answer says which):
 *   1. local pane command — no network;
 *   2. AG-UI SSE via /api/agui when AGUI_WIRE_URL is set (streaming + HITL);
 *   3. POST /api/chat — published measurement or refuse.
 */

export type Turn = {
  role: "user" | "council";
  text: string;
  state?: string;
  signature?: string;
  at: string;
  streaming?: boolean;
  hitl?: AguiHitl;
  sessionId?: string;
};

export type Thread = {
  id: string;
  title: string;
  startedAt: string;
  turns: Turn[];
};

export const STATE_LABEL: Record<string, string> = {
  live: "council · live specialist",
  grounded: "grounded in published measurement",
  ungrounded: "refused — no grounding available",
  unreachable: "endpoint unreachable",
  deterministic: "deterministic · local, no model",
  agui: "council · AG-UI wire",
  "agui-hitl": "consent checkpoint · AG-UI",
  "agui-streaming": "council · AG-UI streaming",
};

const now = () => new Date().toISOString();

function offlineHelp(reason: string): string {
  return (
    `The Council endpoint did not answer — ${reason}. This reply is a local, deterministic ` +
    `help message, not an answer to your question: no measurement was read and none is implied.\n\n` +
    `What still works right now, with no network: say “show the board”, “verify a card”, ` +
    `“open Council Space”, “get measured”, “open the Academy” — each switches the pane on the ` +
    `left of this lobby. The pages themselves fetch their own live data and will tell you if ` +
    `they cannot reach it either.`
  );
}

export interface LobbyChat {
  threads: Thread[];
  activeId: string | null;
  active: Thread | null;
  busy: boolean;
  aguiWire: boolean | null;
  send: (
    question: string,
    onNavigate: (t: LobbyTab) => void,
    opts?: { aguiHandle?: string },
  ) => Promise<void>;
  submitHitl: (decision: "approve" | "deny") => Promise<void>;
  startThread: () => void;
  selectThread: (id: string) => void;
  turnCount: number;
}

export function useLobbyChat(): LobbyChat {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [aguiWire, setAguiWire] = useState<boolean | null>(null);

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

  const updateLastCouncilTurn = useCallback((threadId: string, patch: Partial<Turn>) => {
    setThreads((prev) =>
      prev.map((x) => {
        if (x.id !== threadId) return x;
        const turns = [...x.turns];
        const last = turns.length - 1;
        if (last < 0 || turns[last].role !== "council") return x;
        turns[last] = { ...turns[last], ...patch };
        return { ...x, turns };
      }),
    );
  }, []);

  const submitHitl = useCallback(
    async (decision: "approve" | "deny") => {
      const thread = threads.find((t) => t.id === activeId);
      const last = thread?.turns[thread.turns.length - 1];
      if (!last?.sessionId || !last.hitl) return;

      setBusy(true);
      try {
        const ok = await submitAguiConsent(last.sessionId, decision);
        if (!ok) {
          updateLastCouncilTurn(activeId!, {
            text: `${last.text}\n\n(Consent ${decision} failed — wire unreachable.)`,
            streaming: false,
            hitl: undefined,
            state: "unreachable",
          });
          return;
        }

        const extra = await resumeAguiAfterConsent(last.sessionId, {
          onDelta: (delta) => {
            setThreads((prev) =>
              prev.map((x) => {
                if (x.id !== activeId) return x;
                const turns = [...x.turns];
                const i = turns.length - 1;
                if (i < 0 || turns[i].role !== "council") return x;
                turns[i] = {
                  ...turns[i],
                  text: turns[i].text + delta,
                  streaming: true,
                  state: "agui-streaming",
                };
                return { ...x, turns };
              }),
            );
          },
        });

        updateLastCouncilTurn(activeId!, {
          text: extra ? `${last.text}\n\nAfter ${decision}: ${extra}` : `${last.text}\n\nConsent: ${decision}.`,
          streaming: false,
          hitl: undefined,
          state: "agui",
          signature: `${last.signature ?? ""} · consent ${decision}`,
        });
      } finally {
        setBusy(false);
      }
    },
    [activeId, threads, updateLastCouncilTurn],
  );

  const send = useCallback(
    async (raw: string, onNavigate: (t: LobbyTab) => void, opts?: { aguiHandle?: string }) => {
      const question = raw.trim();
      if (!question || busy) return;

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
      const threadId = id!;
      setActiveId(threadId);

      const push = (t: Omit<Turn, "at">) =>
        setThreads((prev) =>
          prev.map((x) => (x.id === threadId ? { ...x, turns: [...x.turns, { ...t, at: now() }] } : x)),
        );

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

      setBusy(true);
      try {
        const wireUp = await aguiAvailable();
        setAguiWire(wireUp);

        if (wireUp) {
          push({
            role: "council",
            text: "",
            state: "agui-streaming",
            signature: "agui · connecting…",
            streaming: true,
          });

          const agui = await runAguiSession(
            question,
            {
              onDelta: (delta) => {
              setThreads((prev) =>
                prev.map((x) => {
                  if (x.id !== threadId) return x;
                  const turns = [...x.turns];
                  const i = turns.length - 1;
                  if (i < 0 || turns[i].role !== "council") return x;
                  turns[i] = {
                    ...turns[i],
                    text: turns[i].text + delta,
                    streaming: true,
                    state: "agui-streaming",
                  };
                  return { ...x, turns };
                }),
              );
            },
          },
            opts?.aguiHandle ?? "lobby",
          );

          if (agui?.text) {
            updateLastCouncilTurn(threadId, {
              text: agui.text,
              state: agui.state,
              signature: agui.signature,
              streaming: false,
              hitl: agui.hitl,
              sessionId: agui.sessionId,
            });
            return;
          }

          // Wire failed mid-stream — remove empty streaming turn
          setThreads((prev) =>
            prev.map((x) => {
              if (x.id !== threadId) return x;
              const turns = x.turns.filter(
                (t, i) => !(i === x.turns.length - 1 && t.role === "council" && !t.text.trim()),
              );
              return { ...x, turns };
            }),
          );
        }

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
    [activeId, busy, updateLastCouncilTurn],
  );

  return {
    threads,
    activeId,
    active,
    busy,
    aguiWire,
    send,
    submitHitl,
    startThread,
    selectThread,
    turnCount,
  };
}
