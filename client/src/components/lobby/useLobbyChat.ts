import { useCallback, useEffect, useMemo, useState } from "react";
import {
  isExplicitNavigationCommand,
  LOBBY_TABS,
  matchRoute,
  matchTab,
  type LobbyTab,
} from "./tabs";
import { AXES, quotable } from "@/lib/gspcAxes";
import {
  looksLikeCardJson,
  matchRefusal,
  wantsBoardTotals,
} from "./lobbyRefuse";
import { fetchPinnedCardKey, verifyCard } from "@/lib/cardVerify";
import { callTool, type ToolResult } from "@/lib/sovTools";

const lobbyEnv = (
  import.meta as ImportMeta & {
    env?: Record<string, string | boolean | undefined>;
  }
).env;
const CHAT_ENDPOINT =
  (typeof lobbyEnv?.VITE_CHAT_ENDPOINT === "string" &&
    lobbyEnv.VITE_CHAT_ENDPOINT) ||
  (lobbyEnv?.DEV ? "https://councilof.ai/api/chat" : "/api/chat");

/**
 * useLobbyChat — the lobby's chat state, lifted out of the bar.
 *
 * WHY IT IS A HOOK AND NOT COMPONENT STATE. Two things need it: the chat bar
 * that writes the turns, and the right rail's "Chats" section that lists the
 * session's threads. Lifting it also means MINIMISING THE LOBBY CANNOT LOSE THE
 * THREAD — the overlay stays mounted while docked, so the state simply survives.
 *
 * LOCAL PAGE SESSION, AND THE UI SAYS SO. Threads are kept in sessionStorage so
 * a deployment refresh or accidental reload does not erase the work. Nothing
 * is sent to a transcript service or written to localStorage; the browser owns
 * the session lifetime and the Chats section exposes a clear-history control.
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
  provenance?: string;
  at: string;
};

export type Thread = {
  id: string;
  /** First question asked, trimmed — the thread's name in the Chats rail. */
  title: string;
  startedAt: string;
  turns: Turn[];
};

export const CHAT_SESSION_KEY = "coai.lobby.chat-session.v1";
const MAX_STORED_THREADS = 12;
const MAX_STORED_TURNS = 40;
const MAX_STORED_TEXT = 4_000;

type ChatSessionSnapshot = {
  threads: Thread[];
  activeId: string | null;
};

type SessionStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserSessionStore(): SessionStore | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

function parseStoredTurn(value: unknown): Turn | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (
    (candidate.role !== "user" && candidate.role !== "council") ||
    typeof candidate.text !== "string" ||
    typeof candidate.at !== "string"
  ) {
    return null;
  }
  return {
    role: candidate.role,
    text: candidate.text.slice(0, MAX_STORED_TEXT),
    at: candidate.at,
    state: optionalString(candidate.state),
    signature: optionalString(candidate.signature),
    provenance: optionalString(candidate.provenance),
  };
}

function parseStoredThread(value: unknown): Thread | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.startedAt !== "string" ||
    !Array.isArray(candidate.turns)
  ) {
    return null;
  }
  const turns = candidate.turns
    .map(parseStoredTurn)
    .filter((turn): turn is Turn => turn !== null)
    .slice(-MAX_STORED_TURNS);
  if (!turns.length) return null;
  return {
    id: candidate.id.slice(0, 120),
    title: candidate.title.slice(0, 64),
    startedAt: candidate.startedAt,
    turns,
  };
}

/** Read a bounded, schema-checked browser-session transcript. */
export function readChatSession(
  store: Pick<SessionStore, "getItem"> | null = browserSessionStore(),
): ChatSessionSnapshot {
  if (!store) return { threads: [], activeId: null };
  try {
    const raw = store.getItem(CHAT_SESSION_KEY);
    if (!raw) return { threads: [], activeId: null };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const threads = (Array.isArray(parsed.threads) ? parsed.threads : [])
      .map(parseStoredThread)
      .filter((thread): thread is Thread => thread !== null)
      .slice(-MAX_STORED_THREADS);
    const activeId =
      typeof parsed.activeId === "string" &&
      threads.some((thread) => thread.id === parsed.activeId)
        ? parsed.activeId
        : null;
    return { threads, activeId };
  } catch {
    return { threads: [], activeId: null };
  }
}

/** Persist only the bounded local page session; failure never blocks chat. */
export function writeChatSession(
  snapshot: ChatSessionSnapshot,
  store: Pick<SessionStore, "setItem"> | null = browserSessionStore(),
): void {
  if (!store) return;
  try {
    const threads = snapshot.threads.slice(-MAX_STORED_THREADS).map((thread) => ({
      ...thread,
      title: thread.title.slice(0, 64),
      turns: thread.turns.slice(-MAX_STORED_TURNS).map((turn) => ({
        ...turn,
        text: turn.text.slice(0, MAX_STORED_TEXT),
      })),
    }));
    const activeId = threads.some((thread) => thread.id === snapshot.activeId)
      ? snapshot.activeId
      : null;
    store.setItem(CHAT_SESSION_KEY, JSON.stringify({ threads, activeId }));
  } catch {
    // Storage may be disabled or full; the in-memory conversation still works.
  }
}

export function clearChatSession(
  store: Pick<SessionStore, "removeItem"> | null = browserSessionStore(),
): void {
  try {
    store?.removeItem(CHAT_SESSION_KEY);
  } catch {
    // Clearing is best effort when browser storage is disabled.
  }
}

/** Estate-wide state labels for council replies. */
export const STATE_LABEL: Record<string, string> = {
  model_response: "upstream model response · unsigned",
  grounded: "grounded in published measurement",
  runtime_observed: "runtime observed · MCP read",
  unchecked: "unchecked · MCP reply",
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
  axis: (typeof AXES)[number] | null;
  isPractice: boolean;
  isSpace: boolean;
} {
  const t = text.toLowerCase();
  if (!isExplicitNavigationCommand(text)) {
    return { axis: null, isPractice: false, isSpace: false };
  }

  const isPractice =
    /\b(practice|training|train|practice mode|unsigned|test run)\b/i.test(t);
  const isSpace = /\b(arena|space|council space|coliseum)\b/i.test(t);

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

  let foundAxis: (typeof AXES)[number] | null = null;
  for (const [alias, canonical] of Object.entries(axisAliases)) {
    if (mentionsAxisTerm(t, alias)) {
      foundAxis = AXES.find((a) => a.axis === canonical) ?? null;
      if (foundAxis) break;
    }
  }
  if (!foundAxis) {
    for (const axisName of AXES.map((a) => a.axis.toLowerCase())) {
      if (mentionsAxisTerm(t, axisName)) {
        foundAxis = AXES.find((a) => a.axis.toLowerCase() === axisName) ?? null;
        if (foundAxis) break;
      }
    }
  }

  return { axis: foundAxis, isPractice, isSpace };
}

function mentionsAxisTerm(text: string, term: string): boolean {
  const escaped = term
    .split(/[-\s]+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[-\\s]+");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

/**
 * A question about a named axis is an evidence request, not a pane command.
 * Keep the user in the conversation and read the authoritative live row.
 */
export function matchAxisFactQuestion(
  text: string,
): (typeof AXES)[number] | null {
  if (isExplicitNavigationCommand(text)) return null;
  if (
    !/\b(what|which|how|tell me|explain|measurement|measured|score|result|rate|status|evidence|show)\b/i.test(
      text,
    )
  ) {
    return null;
  }

  const t = text.toLowerCase();
  return (
    AXES.find((axis) => mentionsAxisTerm(t, axis.axis.toLowerCase())) ?? null
  );
}

export type SafeMcpReadIntent =
  | { name: "board_totals"; args: Record<string, never> }
  | { name: "get_axis"; args: { axis: string } }
  | { name: "list_cards"; args: { limit: number } }
  | { name: "get_root"; args: Record<string, never> };

/**
 * Natural-language routing for the small, read-only part of the existing MCP
 * registry. This is deliberately not a capability registry of its own: the
 * definitions and execution contract remain functions/mcp/gspc-tools.json and
 * POST /mcp. These four names are the only calls chat may start automatically.
 */
export function matchSafeMcpReadIntent(
  text: string,
): SafeMcpReadIntent | null {
  const readCommand =
    /^(?:please\s+)?(?:(?:(?:can|could|would|will)\s+you|i\s+(?:want|need)\s+you\s+to|i(?:'d|\s+would)\s+like\s+you\s+to)\s+(?:please\s+)?)?(?:call|invoke|run|read|fetch|get|show|list|inspect)\b/i.test(
      text.trim(),
    );

  if (readCommand && /\bboard_totals\b/i.test(text)) {
    return { name: "board_totals", args: {} };
  }
  if (readCommand && /\blist_cards\b/i.test(text)) {
    return { name: "list_cards", args: { limit: 5 } };
  }
  if (readCommand && /\bget_root\b/i.test(text)) {
    return { name: "get_root", args: {} };
  }
  if (readCommand && /\bget_axis\b/i.test(text)) {
    const named = AXES.find((candidate) =>
      mentionsAxisTerm(text.toLowerCase(), candidate.axis.toLowerCase()),
    );
    if (named) return { name: "get_axis", args: { axis: named.axis } };
  }
  // A verb that asks for mutation, payment, signing or external effects can
  // mention a read tool by name without turning into a read. The review matcher
  // gets the next turn in the hook.
  if (matchGuardedActionIntent(text)) return null;

  const axis = matchAxisFactQuestion(text);
  if (axis) return { name: "get_axis", args: { axis: axis.axis } };
  if (wantsBoardTotals(text)) return { name: "board_totals", args: {} };
  if (
    /\b(list|read|fetch|which|what|how many|latest|recent)\b[^?\n]{0,48}\b(?:signed |published |measurement )?cards?\b/i.test(
      text,
    ) || /\bcard index\b/i.test(text)
  ) {
    return { name: "list_cards", args: { limit: 5 } };
  }
  if (
    /\b(?:what|read|fetch|get|current|latest|show|inspect)\b[^?\n]{0,56}\b(?:public[- ]root|root\.json|merkle root|root head)\b/i.test(
      text,
    ) || /^\s*(?:public[- ]root|root\.json|merkle root)\s*[?!.]*\s*$/i.test(text)
  ) {
    return { name: "get_root", args: {} };
  }
  return null;
}

type GuardedActionIntent = {
  tab: LobbyTab;
  reason: string;
};

/**
 * Anything capable of changing state, spending, signing, or contacting another
 * system stops at the review surface. This matcher never executes a tool.
 */
export function matchGuardedActionIntent(
  text: string,
): GuardedActionIntent | null {
  const t = text.trim();
  const action =
    /^(?:please\s+)?(?:(?:(?:can|could|would|will)\s+you|i\s+(?:want|need)\s+you\s+to|i(?:'d|\s+would)\s+like\s+you\s+to)\s+(?:please\s+)?)?(?:go ahead and\s+)?(?:fix|apply|deploy|publish|release|send|email|message|contact|notify|post|submit|upload|pay|purchase|charge|sign|witness|commission|create|delete|remove|write|change|update|call|invoke|execute|run)\b/i;
  if (!action.test(t)) return null;

  const isMeasurementRequest =
    /\b(?:commission(?:_card)?|request (?:an? )?(?:measurement|attestation)|measure (?:me|my|this))\b/i.test(
      t,
    );
  const tabId = isMeasurementRequest ? "measured" : "tools";
  return {
    tab: LOBBY_TABS.find((candidate) => candidate.id === tabId)!,
    reason: isMeasurementRequest
      ? "measurement or attestation request"
      : "state-changing, paid, signed, or external action",
  };
}

export type SafeMcpReadReply = Pick<Turn, "text" | "state" | "signature">;

/**
 * Execute one already-parsed read through the same MCP runtime as ToolRunner.
 * The wrapper labels the execution state; it never promotes the returned
 * artefact to MEASURED or SIGNED.
 */
export async function runSafeMcpRead(
  intent: SafeMcpReadIntent,
  invoke: typeof callTool = callTool,
): Promise<SafeMcpReadReply> {
  const result: ToolResult = await invoke(intent.name, intent.args);
  const state = result.state ?? (result.ok ? "runtime_observed" : "unreachable");
  const executionState = state.toUpperCase();
  const provenance = `POST /mcp · tools/call · ${intent.name}`;
  if (!result.ok) {
    return {
      text:
        `**${executionState}** — the ${intent.name} MCP read did not complete.\n\n` +
        `${result.text}\n\nNo cached value was substituted and no write, payment, signature, or external message was attempted.`,
      state,
      signature: `${provenance} · ${executionState}`,
    };
  }
  return {
    text:
      `**RUNTIME_OBSERVED** — ${intent.name} completed through the public MCP door. ` +
      `That state describes this tool execution only; the returned record keeps its own evidence state.\n\n` +
      `${result.text}\n\nSource: ${provenance}. This chat did not write to the board, spend, sign, or contact an external party.`,
    state: "runtime_observed",
    signature: `${provenance} · RUNTIME_OBSERVED`,
  };
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
  clearHistory: () => void;
  /** Total turns this session — quoted by the docked bar, computed never typed. */
  turnCount: number;
}

export function useLobbyChat(): LobbyChat {
  const [initialSession] = useState(readChatSession);
  const [threads, setThreads] = useState<Thread[]>(initialSession.threads);
  const [activeId, setActiveId] = useState<string | null>(
    initialSession.activeId,
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    writeChatSession({ threads, activeId });
  }, [activeId, threads]);

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
  const clearHistory = useCallback(() => {
    clearChatSession();
    setThreads([]);
    setActiveId(null);
  }, []);

  const send = useCallback(
    async (
      raw: string,
      onNavigate: (t: LobbyTab) => void,
      onOpenRoute?: (path: string, label: string) => void,
    ) => {
      const question = raw.trim();
      if (!question || busy) return;

      // Open (or continue) a thread and record the user's turn.
      let id = activeId;
      const userTurn: Turn = { role: "user", text: question, at: now() };
      setThreads((prev) => {
        if (id && prev.some((t) => t.id === id)) {
          return prev.map((t) =>
            t.id === id ? { ...t, turns: [...t.turns, userTurn] } : t,
          );
        }
        const fresh: Thread = {
          id: `t${Date.now().toString(36)}${prev.length}`,
          title:
            question.length > 64
              ? question.slice(0, 63).trimEnd() + "…"
              : question,
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
          prev.map((x) =>
            x.id === threadId
              ? { ...x, turns: [...x.turns, { ...t, at: now() }] }
              : x,
          ),
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
            `The planned living-law path is detect, approve, re-measure, then publish a scoped delta; ` +
            `that automation is not implemented, and the simulation is not that path.`,
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

      const mcpRead = matchSafeMcpReadIntent(question);
      if (mcpRead) {
        setBusy(true);
        try {
          const reply = await runSafeMcpRead(mcpRead);
          push({ role: "council", ...reply });
          if (mcpRead.name === "board_totals") {
            onNavigate(
              LOBBY_TABS.find((candidate) => candidate.id === "board") ??
                SPACE_TAB,
            );
          }
        } finally {
          setBusy(false);
        }
        return;
      }

      const guardedAction = matchGuardedActionIntent(question);
      if (guardedAction) {
        onNavigate(guardedAction.tab);
        push({
          role: "council",
          text:
            `I did not execute that ${guardedAction.reason}. Opened “${guardedAction.tab.label}” so you can inspect the exact inputs and review boundary first.\n\n` +
            `Nothing ran: no tools/call, mutation, x402 payment, signature, deployment, or external communication.`,
          state: "deterministic",
          signature: "review boundary · no execution",
        });
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
        const r = await fetch(CHAT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: question }],
          }),
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
        push({
          role: "council",
          text: answer,
          state: j.state,
          signature: j.signature ?? j.provenance,
        });
        // The /os quest is called "Ask the Council one grounded question". It used to be
        // awarded for CLICKING it. It is awarded here instead — only once an answer has
        // actually come back grounded in published measurement. A refusal is not a
        // grounded answer and does not count.
        if (j.state === "grounded") {
          import("@/components/os/quests")
            .then((q) => q.markQuest("ask"))
            .catch(() => {
              /* local play only */
            });
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

  return {
    threads,
    activeId,
    active,
    busy,
    send,
    startThread,
    selectThread,
    clearHistory,
    turnCount,
  };
}
