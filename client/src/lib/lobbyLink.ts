/**
 * lobbyLink — the AG-UI deep-link contract for the Council Lobby.
 *
 * ONE JOB: let any CTA anywhere on the site open the lobby on the right pane
 * with a first message already typed into the chat bar.
 *
 * THE PARAM CONTRACT (stable; anything may build these by hand)
 *   ?lobby=<paneId>   pane to open — one of LOBBY_TABS' ids (see components/lobby/tabs.ts)
 *   ?ask=<text>       the seeded first message, URI-encoded
 *   ?ctx=<text>       optional short subject the prompt is about (an axis name, a card id)
 *   ?task=<taskId>    a registry shortcut that expands to pane + prompt (LOBBY_TASKS)
 *
 * `task` is the ergonomic form; `lobby`/`ask` are the explicit form. When both
 * are present the explicit values win, so a link can take a registry task and
 * override just its wording.
 *
 * THE CONSENT LOCK IS NOT NEGOTIABLE. A seeded prompt is TYPED, never SENT. The
 * lobby fills the input, focuses it, and stops. The user presses Ask. Your click,
 * never mine — a deep link may choose the question, it may not ask it for you.
 *
 * HONESTY. The lobby's chat bar is deterministic-first: pane commands are
 * answered locally with no model at all, and everything else goes to the honest
 * /api/chat lane, which answers from published measurement or refuses. Prompts in
 * this registry are therefore written as requests for PUBLISHED material — never
 * as though a live expert is standing by. Nothing here implies a model answered.
 */
import { useEffect, useRef, useState } from "react";
import { useSearch } from "wouter";
import { LOBBY_TABS, type LobbyTabId } from "@/components/lobby/tabs";

export const LOBBY_PARAM = "lobby";
export const ASK_PARAM = "ask";
export const CTX_PARAM = "ctx";
export const TASK_PARAM = "task";

/** Fired by openLobby() for in-page CTAs that should not touch the URL at all. */
export const LOBBY_EVENT = "coai:lobby-open";

export type LobbyTaskId =
  | "read-the-board"
  | "explain-axis"
  | "verify-a-card"
  | "arena"
  | "get-measured"
  | "report-an-incident"
  | "human-vs-ai"
  | "academy"
  | "pricing-overview"
  | "honesty-audit"
  | "library-research"
  | "regulator-brief"
  | "insurer-evidence"
  | "enterprise-start"
  | "sector-brief";

export interface LobbyTask {
  pane: LobbyTabId;
  /** Label for a CTA that has none of its own. */
  label: string;
  /** The seeded first message. `ctx` is the subject the caller passed, if any. */
  prompt: (ctx?: string) => string;
}

/**
 * The task registry: task -> pane + seeded prompt.
 *
 * Add a task here rather than hand-rolling `?ask=` strings across the site, so
 * the wording of a seeded question stays reviewable in one place.
 */
export const LOBBY_TASKS: Record<LobbyTaskId, LobbyTask> = {
  "read-the-board": {
    pane: "board",
    label: "Open the live board in the Council Lobby",
    prompt: () =>
      "Walk me through the live GSPC board: which axes carry a measured figure, which carry none, and what a TIE means.",
  },
  "explain-axis": {
    pane: "board",
    label: "Explain this axis",
    prompt: (ctx) =>
      ctx
        ? `Explain what the ${ctx} axis measures and how it is scored — the bench, the n, and whether its leader is statistically separated.`
        : "Explain what this axis measures and how it is scored.",
  },
  "verify-a-card": {
    pane: "verify",
    label: "Verify a measurement card",
    prompt: (ctx) =>
      ctx
        ? `Help me verify measurement card ${ctx} — recompute its hash and check the Ed25519 signature.`
        : "Help me verify a measurement card — recompute its hash and check the Ed25519 signature.",
  },
  arena: {
    pane: "space",
    label: "Open Council Space",
    prompt: () =>
      "Show me the latest arena rounds and how they are graded — the deterministic grader, not a model jury.",
  },
  "get-measured": {
    pane: "measured",
    label: "Get measured",
    prompt: (ctx) =>
      ctx
        ? `I want ${ctx} measured against the rules that govern it. What does the assessment actually run, and what does it not claim?`
        : "I want my system measured against the rules that govern it. What does the assessment actually run, and what does it not claim?",
  },
  "report-an-incident": {
    pane: "watchdog",
    label: "Report an incident",
    prompt: () =>
      "How does the Watchdog handle a reported incident, and what happens to my report after I file it?",
  },
  "human-vs-ai": {
    pane: "board",
    label: "Human vs AI, honestly",
    prompt: () =>
      "What is published about human baselines beside the measured AI figures, and which parts are REPORTED third-party context rather than our own measurement?",
  },
  academy: {
    pane: "academy",
    label: "Open the Academy",
    prompt: () =>
      "What does Council Academy actually attest on completion, and what does it explicitly not attest?",
  },
  "pricing-overview": {
    pane: "home",
    label: "Understand plans and pricing",
    prompt: () =>
      "What is published about plans and pricing — what is measured, what is free, and what is explicitly not promised?",
  },
  "honesty-audit": {
    pane: "home",
    label: "Read the honesty ledger",
    prompt: () =>
      "What does the honesty page publish about corrections, refusals, and what the Council got wrong?",
  },
  "library-research": {
    pane: "home",
    label: "Research the method",
    prompt: () =>
      "What is published in the library about the measurement method, the n, and which materials are reproducible?",
  },
  "regulator-brief": {
    pane: "home",
    label: "Regulator crosswalk",
    prompt: (ctx) =>
      ctx
        ? `What is published about ${ctx} crosswalked to frozen statute, and what does the Council refuse to certify?`
        : "What is published for regulators — crosswalks, frozen provisions, and what the Council does not decide?",
  },
  "insurer-evidence": {
    pane: "board",
    label: "Evidence for underwriting",
    prompt: () =>
      "What on the live board is safe for an insurer to rely on today, and which cells are explicitly empty?",
  },
  "enterprise-start": {
    pane: "measured",
    label: "Start enterprise measurement",
    prompt: () =>
      "We are an enterprise team — what does getting measured actually run, what does the result attest, and what does it not claim?",
  },
  "sector-brief": {
    pane: "home",
    label: "Sector-specific governance",
    prompt: (ctx) =>
      ctx
        ? `What is published for ${ctx} about AI governance — frameworks named, evidence signed, and gaps left empty?`
        : "What is published for this sector about AI governance and signed evidence?",
  },
};

export interface LobbyIntent {
  pane: LobbyTabId;
  /** Typed into the chat bar. Never sent. */
  prompt: string;
  ctx?: string;
  task?: LobbyTaskId;
  /** Bumps on every fresh intent so a repeat of the same request still lands. */
  nonce: number;
}

export interface LobbyLinkOptions {
  pane?: LobbyTabId;
  prompt?: string;
  ctx?: string;
  task?: LobbyTaskId;
  /** Path the link points at. Defaults to the current page — the lobby is global. */
  path?: string;
}

const isPane = (v: unknown): v is LobbyTabId =>
  typeof v === "string" && LOBBY_TABS.some((t) => t.id === v);

const isTask = (v: unknown): v is LobbyTaskId =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(LOBBY_TASKS, v);

function currentPath(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname || "/";
}

/**
 * Build an href that opens the lobby. Use it as a real `href` so the control is
 * copyable, middle-clickable and crawlable; pair it with `openLobby` on click to
 * open in place without a navigation.
 */
export function lobbyHref(opts: LobbyLinkOptions = {}): string {
  const q = new URLSearchParams();
  const task = isTask(opts.task) ? opts.task : undefined;
  const pane = isPane(opts.pane) ? opts.pane : task ? LOBBY_TASKS[task].pane : undefined;

  if (task) q.set(TASK_PARAM, task);
  if (pane) q.set(LOBBY_PARAM, pane);
  if (opts.ctx) q.set(CTX_PARAM, opts.ctx);
  // An explicit prompt is written out; a task's prompt is left to the registry so
  // its wording can be corrected in one place without rewriting every link.
  if (opts.prompt) q.set(ASK_PARAM, opts.prompt);

  const s = q.toString();
  const path = opts.path ?? currentPath();
  if (!s) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${s}`;
}

/** Shorthand for a registry task. */
export function lobbyTaskHref(task: LobbyTaskId, opts: Omit<LobbyLinkOptions, "task"> = {}): string {
  return lobbyHref({ ...opts, task });
}

let nonce = 0;

/** Resolve a loose request into a complete intent, or null if it names nothing real. */
export function resolveIntent(input: {
  pane?: unknown;
  prompt?: unknown;
  ctx?: unknown;
  task?: unknown;
}): LobbyIntent | null {
  const task = isTask(input.task) ? input.task : undefined;
  const ctx = typeof input.ctx === "string" && input.ctx.trim() ? input.ctx.trim() : undefined;
  const pane = isPane(input.pane) ? input.pane : task ? LOBBY_TASKS[task].pane : undefined;
  const explicit = typeof input.prompt === "string" && input.prompt.trim() ? input.prompt.trim() : undefined;
  const prompt = explicit ?? (task ? LOBBY_TASKS[task].prompt(ctx) : undefined);

  if (!pane && !prompt) return null;
  return {
    pane: pane ?? "home",
    prompt: prompt ?? "",
    ctx,
    task,
    nonce: ++nonce,
  };
}

/** Open the lobby in place, without touching the URL. For in-page CTAs. */
export function openLobby(opts: Omit<LobbyLinkOptions, "path"> = {}): void {
  if (typeof window === "undefined") return;
  const intent = resolveIntent(opts);
  if (!intent) return;
  window.dispatchEvent(new CustomEvent(LOBBY_EVENT, { detail: intent }));
}

/** Strip the lobby params so a refresh does not re-open the lobby. */
function clearLobbyParams(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let touched = false;
  for (const k of [LOBBY_PARAM, ASK_PARAM, CTX_PARAM, TASK_PARAM]) {
    if (url.searchParams.has(k)) { url.searchParams.delete(k); touched = true; }
  }
  if (!touched) return;
  const q = url.searchParams.toString();
  window.history.replaceState(window.history.state, "", url.pathname + (q ? `?${q}` : "") + url.hash);
}

function readSearch(search: string): LobbyIntent | null {
  const p = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (!p.has(LOBBY_PARAM) && !p.has(TASK_PARAM) && !p.has(ASK_PARAM)) return null;
  return resolveIntent({
    pane: p.get(LOBBY_PARAM) ?? undefined,
    prompt: p.get(ASK_PARAM) ?? undefined,
    ctx: p.get(CTX_PARAM) ?? undefined,
    task: p.get(TASK_PARAM) ?? undefined,
  });
}

/**
 * The lobby's end of the contract. Returns the latest intent — from the URL on
 * arrival, or from an in-page openLobby() call — and clears the URL params the
 * moment it has read them, so a refresh does not re-trigger.
 *
 * Mounted once, inside CouncilLobby. It does not open anything itself; the lobby
 * decides what to do with the intent.
 */
export function useLobbyDeepLink(): LobbyIntent | null {
  const search = useSearch();
  const [intent, setIntent] = useState<LobbyIntent | null>(null);
  const seen = useRef<string>("");

  useEffect(() => {
    if (seen.current === search) return;
    seen.current = search;
    const found = readSearch(search);
    if (!found) return;
    clearLobbyParams();
    setIntent(found);
  }, [search]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail === "object" && isPane((detail as LobbyIntent).pane)) {
        setIntent(detail as LobbyIntent);
      }
    };
    window.addEventListener(LOBBY_EVENT, onOpen as EventListener);
    return () => window.removeEventListener(LOBBY_EVENT, onOpen as EventListener);
  }, []);

  return intent;
}
