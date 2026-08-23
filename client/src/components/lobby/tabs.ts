import { POSITIONING } from "@/lib/positioning";
export type LobbyTabId = "home"|"board"|"models"|"routes"|"tools"|"verify"|"space"|"arena"|"ecosystem"|"workspace"|"fix"|"measured"|"watchdog"|"academy"|"software"|"play";
export type LobbyTab = { id: LobbyTabId; label: string; blurb: string; path: string; kind?: "route"|"local"|"native"; accent?: "emerald"|"gold"; surface?: "measured"|"play"; cues: RegExp };
export const LOBBY_TABS: LobbyTab[] = [{ id:"home",label:"Home",blurb:"Council OS desktop",path:"",kind:"local",cues:/\b(home|hub|council os)\b/i},{id:"routes",label:"Routes",blurb:POSITIONING.router.blurb,path:"/instruments",kind:"local",surface:"measured",cues:/\b(routes?|eunomia|instruments)\b/i}];
export const DEFAULT_TAB: LobbyTabId = "home";
export function tabById(id: LobbyTabId): LobbyTab { return LOBBY_TABS.find((t) => t.id === id) ?? LOBBY_TABS[0]; }
export function matchTab(text: string): LobbyTab | null { return null; }
export const DASHBOARD_TABS: LobbyTab[] = LOBBY_TABS;
export const DASHBOARD_PLAY_TAB = tabById("play");
