import { useEffect, useRef, useState } from "react";
import { useSearch } from "wouter";
import { LOBBY_TABS, type LobbyTabId } from "@/components/lobby/tabs";
export const LOBBY_PARAM = "lobby";
export const ASK_PARAM = "ask";
export const CTX_PARAM = "ctx";
export const TASK_PARAM = "task";
export const LOBBY_EVENT = "coai:lobby-open";
export type LobbyTaskId = "read-the-board"|"explain-axis"|"verify-a-card"|"arena"|"get-measured"|"report-an-incident"|"human-vs-ai"|"academy"|"pricing-overview"|"honesty-audit"|"library-research"|"regulator-brief"|"insurer-evidence"|"enterprise-start"|"sector-brief"|"browse-models"|"browse-tools"|"browse-results"|"browse-workbench"|"browse-instrument"|"browse-system-card"|"browse-fleet"|"browse-crosswalk"|"regulation-feed"|"browse-methodology"|"browse-hive";
export interface LobbyTask { pane: LobbyTabId; route?: string; label: string; prompt: (ctx?: string) => string; }
export const LOBBY_TASKS: Record<LobbyTaskId, LobbyTask> = {
  "read-the-board": { pane: "board", label: "Open the live board in the Council Lobby", prompt: () => "Walk me through the live GSPC board: which axes carry a measured figure, which carry none, and what a TIE means." },
  "explain-axis": { pane: "board", label: "Explain this axis", prompt: (ctx) => ctx ? "Explain what the " + ctx + " axis measures and how it is scored." : "Explain what this axis measures and how it is scored." },
  "verify-a-card": { pane: "verify", label: "Verify a measurement card", prompt: (ctx) => ctx ? "Help me verify measurement card " + ctx : "Help me verify a measurement card." },
  arena: { pane: "space", label: "Open Council Space", prompt: () => "Show me the latest arena rounds and how they are graded." },
  "get-measured": { pane: "measured", label: "Get measured", prompt: (ctx) => ctx ? "I want " + ctx + " measured." : "I want my system measured." },
  "report-an-incident": { pane: "watchdog", label: "Report an incident", prompt: () => "How does the Watchdog handle a reported incident?" },
  "human-vs-ai": { pane: "board", label: "Human vs AI, honestly", prompt: () => "What is published about human baselines beside the measured AI figures?" },
  academy: { pane: "academy", label: "Open the Academy", prompt: () => "What does Council Academy attest on completion?" },
  "pricing-overview": { pane: "home", label: "Understand plans and pricing", prompt: () => "What is published about plans and pricing?" },
  "honesty-audit": { pane: "home", route: "/honesty", label: "Read the honesty ledger", prompt: () => "What does the honesty page publish about corrections?" },
  "library-research": { pane: "library", label: "Research the method", prompt: () => "What is published in the library about the measurement method?" },
  "regulator-brief": { pane: "home", label: "Regulator crosswalk", prompt: (ctx) => ctx ? "What is published about " + ctx + " crosswalked to frozen statute?" : "What is published for regulators?" },
  "insurer-evidence": { pane: "board", label: "Evidence for underwriting", prompt: () => "What on the live board is safe for an insurer to rely on today?" },
  "enterprise-start": { pane: "measured", label: "Start enterprise measurement", prompt: () => "What does getting measured actually run for an enterprise team?" },
  "sector-brief": { pane: "home", label: "Sector-specific governance", prompt: (ctx) => ctx ? "What is published for " + ctx + " about AI governance?" : "What is published for this sector?" },
  "browse-models": { pane: "models", label: "Open measured models", prompt: () => "What models are published on the living board?" },
  "browse-tools": { pane: "tools", label: "Open published tools", prompt: () => "What tooling is published?" },
  "browse-results": { pane: "results", label: "Open measured results", prompt: () => "Which measured results name a published artefact?" },
  "browse-workbench": { pane: "workbench", label: "Open the workbench", prompt: () => "What can the workbench run today?" },
  "browse-instrument": { pane: "home", route: "/instrument", label: "Open the instrument", prompt: () => "What do the four lenses actually run?" },
  "browse-system-card": { pane: "home", route: "/system-card", label: "Open the system card", prompt: () => "What does the system card attest?" },
  "browse-fleet": { pane: "home", route: "/mcp-fleet", label: "Open the MCP fleet", prompt: () => "What does the published fleet manifest list?" },
  "browse-crosswalk": { pane: "home", route: "/crosswalk", label: "Open the framework crosswalk", prompt: () => "What does this crosswalk map?" },
  "regulation-feed": { pane: "home", route: "/feed", label: "Open the regulation feed", prompt: () => "What does the published regulation feed say moved?" },
  "browse-methodology": { pane: "home", route: "/methodology", label: "Open the methodology", prompt: () => "How is a figure graded?" },
  "browse-hive": { pane: "home", route: "/hive", label: "Open the hive", prompt: () => "What frameworks and groups are published in the hive?" },
};
export interface LobbyIntent { pane: LobbyTabId; route?: string; prompt: string; ctx?: string; task?: LobbyTaskId; nonce: number; }
export interface LobbyLinkOptions { pane?: LobbyTabId; prompt?: string; ctx?: string; task?: LobbyTaskId; path?: string; }
const isPane = (v: unknown): v is LobbyTabId => typeof v === "string" && LOBBY_TABS.some((t) => t.id === v);
const isTask = (v: unknown): v is LobbyTaskId => typeof v === "string" && Object.prototype.hasOwnProperty.call(LOBBY_TASKS, v);
function currentPath(): string { return typeof window === "undefined" ? "/" : window.location.pathname || "/"; }
export function lobbyHref(opts: LobbyLinkOptions = {}): string {
  const q = new URLSearchParams();
  const task = isTask(opts.task) ? opts.task : undefined;
  const pane = isPane(opts.pane) ? opts.pane : task ? LOBBY_TASKS[task].pane : undefined;
  if (task) q.set(TASK_PARAM, task);
  if (pane) q.set(LOBBY_PARAM, pane);
  if (opts.ctx) q.set(CTX_PARAM, opts.ctx);
  if (opts.prompt) q.set(ASK_PARAM, opts.prompt);
  const s = q.toString();
  const path = opts.path ?? currentPath();
  return s ? path + (path.includes("?") ? "&" : "?") + s : path;
}
export function lobbyTaskHref(task: LobbyTaskId, opts: Omit<LobbyLinkOptions, "task"> = {}): string { return lobbyHref({ ...opts, task }); }
let nonce = 0;
export function resolveIntent(input: { pane?: unknown; prompt?: unknown; ctx?: unknown; task?: unknown; }): LobbyIntent | null {
  const task = isTask(input.task) ? input.task : undefined;
  const ctx = typeof input.ctx === "string" && input.ctx.trim() ? input.ctx.trim() : undefined;
  const pane = isPane(input.pane) ? input.pane : task ? LOBBY_TASKS[task].pane : undefined;
  const explicit = typeof input.prompt === "string" && input.prompt.trim() ? input.prompt.trim() : undefined;
  const prompt = explicit ?? (task ? LOBBY_TASKS[task].prompt(ctx) : undefined);
  if (!pane && !prompt) return null;
  const route = task && LOBBY_TASKS[task].route ? LOBBY_TASKS[task].route : undefined;
  return { pane: pane ?? "home", route, prompt: prompt ?? "", ctx, task, nonce: ++nonce };
}
export function openLobby(opts: Omit<LobbyLinkOptions, "path"> = {}): void {
  if (typeof window === "undefined") return;
  const intent = resolveIntent(opts);
  if (!intent) return;
  window.dispatchEvent(new CustomEvent(LOBBY_EVENT, { detail: intent }));
}
function clearLobbyParams(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let touched = false;
  for (const k of [LOBBY_PARAM, ASK_PARAM, CTX_PARAM, TASK_PARAM]) { if (url.searchParams.has(k)) { url.searchParams.delete(k); touched = true; } }
  if (!touched) return;
  const q = url.searchParams.toString();
  window.history.replaceState(window.history.state, "", url.pathname + (q ? "?" + q : "") + url.hash);
}
function readSearch(search: string): LobbyIntent | null {
  const p = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (!p.has(LOBBY_PARAM) && !p.has(TASK_PARAM) && !p.has(ASK_PARAM)) return null;
  return resolveIntent({ pane: p.get(LOBBY_PARAM) ?? undefined, prompt: p.get(ASK_PARAM) ?? undefined, ctx: p.get(CTX_PARAM) ?? undefined, task: p.get(TASK_PARAM) ?? undefined });
}
export function useLobbyDeepLink(): LobbyIntent | null {
  const search = useSearch();
  const [intent, setIntent] = useState<LobbyIntent | null>(null);
  const seen = useRef<string>("");
  useEffect(() => { if (seen.current === search) return; seen.current = search; const found = readSearch(search); if (!found) return; clearLobbyParams(); setIntent(found); }, [search]);
  useEffect(() => {
    const onOpen = (e: Event) => { const detail = (e as CustomEvent).detail; if (detail && typeof detail === "object" && isPane((detail as LobbyIntent).pane)) setIntent(detail as LobbyIntent); };
    window.addEventListener(LOBBY_EVENT, onOpen as EventListener);
    return () => window.removeEventListener(LOBBY_EVENT, onOpen as EventListener);
  }, []);
  return intent;
}
