/**
 * The Council Lobby's centre-pane destinations.
 */
export type LobbyTabId = "home" | "board" | "results" | "models" | "tools" | "verify" | "space" | "measured" | "watchdog" | "academy" | "library" | "workbench" | "software" | "play";
export type LobbyTab = { id: LobbyTabId; label: string; blurb: string; path: string; kind?: "route" | "local" | "native"; accent?: "emerald" | "gold"; cues: RegExp };
export type LobbyRouteGroup = "record" | "receipts" | "analyst";
export type LobbyRoute = { label: string; blurb: string; path: string; group: LobbyRouteGroup; cues: RegExp };
export const LOBBY_TABS: LobbyTab[] = [];
export const LOBBY_ROUTES: LobbyRoute[] = [];
export const DEFAULT_TAB: LobbyTabId = "home";
export function tabById(id: LobbyTabId): LobbyTab { return LOBBY_TABS.find((t) => t.id === id) ?? LOBBY_TABS[0]; }
function isNavCommand(text: string): boolean { return /\b(show|open|go|take me|switch|jump|load|view|bring up|let me)\b/i.test(text); }
export function matchTab(text: string): LobbyTab | null { const t = text.trim(); if (!t || !isNavCommand(t)) return null; return LOBBY_TABS.find((tab) => tab.cues.test(t)) ?? null; }
export function matchRoute(text: string): LobbyRoute | null { const t = text.trim(); if (!t || !isNavCommand(t)) return null; return LOBBY_ROUTES.find((r) => r.cues.test(t)) ?? null; }
export function routesIn(group: LobbyRouteGroup): LobbyRoute[] { return LOBBY_ROUTES.filter((r) => r.group === group); }
export function isDashboardTab(t: LobbyTab): boolean { return Boolean(t.path) && t.id !== "play" && t.id !== "software" && t.id !== "home"; }
export const DASHBOARD_TABS: LobbyTab[] = LOBBY_TABS.filter(isDashboardTab);
