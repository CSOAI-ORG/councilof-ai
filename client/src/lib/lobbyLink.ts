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
export const LOBBY_TASKS = {
  "read-the-board": { pane: "board", label: "Open the live board", prompt: () => "Walk me through the live GSPC board." },
  "browse-results": { pane: "results", label: "Open measured results", prompt: () => "Which measured results name a published artefact?" },
  "browse-workbench": { pane: "workbench", label: "Open the workbench", prompt: () => "What can the workbench run today?" },
  "browse-instrument": { pane: "home", route: "/instrument", label: "Open the instrument", prompt: () => "What do the four lenses run?" },
  "browse-system-card": { pane: "home", route: "/system-card", label: "Open the system card", prompt: () => "What does the system card attest?" },
  "browse-fleet": { pane: "home", route: "/mcp-fleet", label: "Open the MCP fleet", prompt: () => "What does the fleet manifest list?" },
  "browse-crosswalk": { pane: "home", route: "/crosswalk", label: "Open the crosswalk", prompt: () => "What does this crosswalk map?" },
  "regulation-feed": { pane: "home", route: "/feed", label: "Open the regulation feed", prompt: () => "What moved in the regulation feed?" },
  "browse-methodology": { pane: "home", route: "/methodology", label: "Open methodology", prompt: () => "How is a figure graded?" },
  "browse-hive": { pane: "home", route: "/hive", label: "Open the hive", prompt: () => "What frameworks are in the hive?" },
} as Record<LobbyTaskId, LobbyTask>;
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
  return s ? `${path}${path.includes("?") ? "&" : "?"}${s}` : path;
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
  for (const k of [LOBBY_PARAM, ASK_PARAM, CTX_PARAM, TASK_PARAM]) url.searchParams.delete(k);
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
}
function readSearch(search: string): LobbyIntent | null {
  const p = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (!p.has(LOBBY_PARAM) && !p.has(TASK_PARAM) && !p.has(ASK_PARAM)) return null;
  return resolveIntent({ pane: p.get(LOBBY_PARAM), prompt: p.get(ASK_PARAM), ctx: p.get(CTX_PARAM), task: p.get(TASK_PARAM) });
}
export function useLobbyDeepLink(): LobbyIntent | null {
  const search = useSearch();
  const [intent, setIntent] = useState<LobbyIntent | null>(null);
  const seen = useRef("");
  useEffect(() => { if (seen.current === search) return; seen.current = search; const found = readSearch(search); if (found) { clearLobbyParams(); setIntent(found); } }, [search]);
  useEffect(() => {
    const onOpen = (e: Event) => { const d = (e as CustomEvent).detail; if (d && isPane(d.pane)) setIntent(d as LobbyIntent); };
    window.addEventListener(LOBBY_EVENT, onOpen as EventListener);
    return () => window.removeEventListener(LOBBY_EVENT, onOpen as EventListener);
  }, []);
  return intent;
}
