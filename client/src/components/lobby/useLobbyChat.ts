import { useCallback, useMemo, useState } from "react";
import { LOBBY_TABS, matchRoute, matchTab, type LobbyTab } from "./tabs";
import { AXES, quotable } from "@/lib/gspcAxes";
import { looksLikeCardJson, matchRefusal, wantsBoardTotals } from "./lobbyRefuse";
import { fetchPinnedCardKey, verifyCard } from "@/lib/cardVerify";

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

/** The space pane from LOBBY_TABS — the existing contract for opening Council Space. */
const SPACE_TAB = LOBBY_TABS.find((t) => t.id === "space")!;

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

/**
 * Axis/Space open command detection.
 *
 * Returns an object describing what the user asked for:
 * - axis: the matching axis from the board (if found)
 * - isPractice: true if this is explicitly a practice/training request
 * - isSpace: true if the user asked for Council Space/arena generally
 */
function matchAxisOrSpace(text: string): {
  axis: typeof AXES[number] | null;
  isPractice: boolean;
  isSpace: boolean;
} {
  const t = text.toLowerCase();
  const isNavCommand = /\b(show|open|go|take me|switch|jump|load|view|bring up|let me|enter)\b/i.test(text);
  if (!isNavCommand) return { axis: null, isPractice: false, isSpace: false };

  const isPractice = /\b(practice|training|train|practice mode|unsigned|test run)\b/i.test(t);
  const isSpace = /\b(arena|space|council space|coliseum)\b/i.test(t);

  const axisNames = AXES.map((a) => a.axis.toLowerCase());
  const axisAliases: Record<string, string> = {
    gov: "governance",
    governing: "governance",
    "risk tier": "governance",
    safe: "safety",
    refusal: "safety",
    prov: "provenance",
    marking: "provenance",
    c2pa: "provenance",
    cont: "continuity",
    pqc: "continuity",
    mcp: "conformance",
    tool: "conformance",
    oss: "openness",
    licence: "openness",
    license: "openness",
    mach: "machinery-conformity",
    machinery: "machinery-conformity",
    xr: "cross-reality",
    immersive: "cross-reality",
    det: "detector-interop",
    watermark: "detector-interop",
    art5: "art5-safeguard",
    "article 5": "art5-safeguard",
    prohibited: "art5-safeguard",
    emotion: "affect",
    affective: "affect",
    multi: "swarm",
    coordination: "swarm",
  };

  let foundAxis: typeof AXES[number] | null = null;
  for (const [alias, canonical] of Object.entries(axisAliases)) {
    if (t.includes(alias)) {
      foundAxis = AXES.find((a) => a.axis === canonical) ?? null;
      if (foundAxis) break;
    }
  }
  if (!foundAxis) {
    for (const axisName of axisNames) {
      if (t.includes(axisName)) {
        foundAxis = AXES.find((a) => a.axis.toLowerCase() === axisName) ?? null;
        if (foundAxis) break;
      }
    }
  }

  return { axis: foundAxis, isPractice, isSpace };
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

      // Lane 1.5 — axis-specific navigation. Uses the existing space pane contract.
      // General "open arena" / "open space" already handled by matchTab above.
      // This lane handles individual axis names: MEASURED opens space, UNMEASURED refuses.
      const axisMatch = matchAxisOrSpace(question);
      if (axisMatch.isPractice) {
        onNavigate(SPACE_TAB);
        push({
          role: "council",
          text:
            `Opening Council Space in PRACTICE mode.\n\n` +
            `**Unsigned training. Never quoted. Not a measurement. Not legal advice. Not a conformity mark.**\n\n` +
            `Practice runs are for learning and testing only. They do not produce signed cards, ` +
            `are not recorded on the board, and must never be cited as evidence. ` +
            `When law actually changes, the living-law path is re-measure + delta card — the old card stays. ` +
            `The simulation is not that path.`,
          state: "deterministic",
          signature: "practice mode · unsigned",
        });
        return;
      }
      if (axisMatch.axis) {
        const axis = axisMatch.axis;
        const isMeasured = quotable(axis);
        if (isMeasured) {
          onNavigate(SPACE_TAB);
          push({
            role: "council",
            text:
              `Opened Council Space for the "${axis.axis}" axis.\n\n` +
              `This axis is **MEASURED** — accuracy ${(axis.accuracy! * 100).toFixed(1)}%, n=${axis.n}. ` +
              `The arena shows the measured rounds. Council Space fetches its own live data from GET /api/gspc.`,
            state: "deterministic",
            signature: `axis open · ${axis.axis} · measured`,
          });
        } else {
          push({
            role: "council",
            text:
              `The "${axis.axis}" axis is **UNMEASURED** — it is a declared slot on the board with no run behind it.\n\n` +
              `Council Space cannot open a floor for an axis that has no measurement. ` +
              `Empty cells stay empty. Check GET /api/gspc for the current board state.`,
            state: "deterministic",
            signature: `axis closed · ${axis.axis} · unmeasured`,
          });
        }
        return;
      }

      const refusal = matchRefusal(question);
      if (refusal) {
        push({
          role: "council",
          text: refusal.text,
          state: "ungrounded",
          signature: `refusal · ${refusal.id}`,
        });
        return;
      }

      if (wantsBoardTotals(question)) {
        setBusy(true);
        try {
          const r = await fetch("/api/gspc", { headers: { accept: "application/json" } });
          if (!r.ok) throw new Error("HTTP " + r.status);
          const j: any = await r.json();
          const t = j?.totals ?? {};
          const grammar = t.public_count || t.count_grammar || "live GET /api/gspc";
          push({
            role: "council",
            text:
              `Live board from GET /api/gspc — ${grammar}.\n` +
              `SEPARATED leads: ${t.separated_leads ?? "—"}. TIE: ${t.ties ?? "—"}. ` +
              `Empty cells stay empty. This is measurement, not a ranking.\n\n` +
              `Opened the native board pane. No fixture.`,
            state: "grounded",
            signature: "board_totals · GET /api/gspc",
          });
          onNavigate(LOBBY_TABS.find((x) => x.id === "board") ?? SPACE_TAB);
        } catch (e: any) {
          push({
            role: "council",
            text: offlineHelp(String(e?.message ?? e)),
            state: "deterministic",
            signature: "board_totals · failed",
          });
        } finally {
          setBusy(false);
        }
        return;
      }

      if (looksLikeCardJson(question)) {
        setBusy(true);
        try {
          const card = JSON.parse(question);
          const key = await fetchPinnedCardKey();
          const v = await verifyCard(card, key);
          push({
            role: "council",
            text:
              `verify_card (browser, nothing uploaded): **${v.state}**.\n` +
              `${v.reason ?? ""}\n\n` +
              `Three states only: VALID · INVALID · UNCHECKABLE. Same path as /gspc-verify.`,
            state: v.state === "VALID" ? "grounded" : "ungrounded",
            signature: `verify_card · ${v.state}`,
          });
        } catch (e: any) {
          push({
            role: "council",
            text: `UNCHECKABLE — could not parse or check that paste (${String(e?.message ?? e)}). Nothing was sent to a server.`,
            state: "ungrounded",
            signature: "verify_card · uncheckable",
          });
        } finally {
          setBusy(false);
        }
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
