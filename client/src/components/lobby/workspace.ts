import { useSyncExternalStore } from "react";
import { LEFT_KEY, RIGHT_KEY } from "./rails";
import type { LobbyTabId } from "./tabs";

/**
 * workspace — the Council OS account model, stated honestly.
 *
 * THERE IS NO AUTH BACKEND HERE AND THIS FILE DOES NOT PRETEND OTHERWISE.
 * OpenRouter's header ends in an account menu (Settings, Keys, Activity,
 * Credits) because OpenRouter has accounts. This OS has a browser. So the
 * equivalent surface is a LOCAL WORKSPACE: a name and the OS preferences,
 * kept in this browser's localStorage, sent nowhere, owned by whoever is
 * sitting at the keyboard. No sign-in button, no OAuth theatre.
 *
 * THE ACTIVITY LOG IS SESSION-ONLY, BY DESIGN. It records what the OS itself
 * did in this tab — panes opened, routes framed — in memory. Nothing is
 * persisted, nothing is transmitted, and the pane that shows it says so.
 */

// ── the workspace name ────────────────────────────────────────────────────────

export const WORKSPACE_KEY = "coai.lobby.workspace";
export const WORKSPACE_FALLBACK = "Local workspace";

export function readWorkspaceName(): string {
  try {
    const v = localStorage.getItem(WORKSPACE_KEY)?.trim();
    if (v) return v.slice(0, 40);
  } catch { /* private mode / storage disabled — the fallback is the truth */ }
  return WORKSPACE_FALLBACK;
}

export function writeWorkspaceName(name: string): void {
  try {
    const v = name.trim().slice(0, 40);
    if (v && v !== WORKSPACE_FALLBACK) localStorage.setItem(WORKSPACE_KEY, v);
    else localStorage.removeItem(WORKSPACE_KEY);
  } catch { /* ignore */ }
}

// ── stored preferences, and the one way to forget them ───────────────────────

/**
 * Every localStorage key the OS writes. Kept as ONE list so "forget this
 * browser's OS preferences" cannot silently miss a key another file added.
 * The rail keys come from rails.ts, which owns them.
 */
export const OS_PREF_KEYS = [
  WORKSPACE_KEY,
  "coai.lobby.alpha",
  "coai.lobby.tab",
  "coai.lobby.size",
  LEFT_KEY,
  RIGHT_KEY,
  "coai.lobby.audience",
] as const;

/** Remove every stored OS preference. Returns the keys it removed. */
export function forgetOsPreferences(): readonly string[] {
  try {
    OS_PREF_KEYS.forEach((k) => localStorage.removeItem(k));
    return OS_PREF_KEYS;
  } catch {
    return [];
  }
}

// ── the session activity log ──────────────────────────────────────────────────

export type ActivityEntry = {
  at: number;
  kind: "pane" | "route";
  label: string;
  path?: string;
  tabId?: LobbyTabId;
};

const MAX_ENTRIES = 50;

let entries: ActivityEntry[] = [];
const listeners = new Set<() => void>();

export function recordActivity(e: Omit<ActivityEntry, "at">): void {
  const last = entries[0];
  // The same destination twice in a row is one visit, not two events.
  if (last && last.kind === e.kind && last.label === e.label && last.path === e.path) return;
  entries = [{ ...e, at: Date.now() }, ...entries].slice(0, MAX_ENTRIES);
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const snapshot = () => entries;

/** The session's activity, newest first. Re-renders on each recorded event. */
export function useActivity(): ActivityEntry[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/** Test seams. */
export function clearActivityForTest(): void {
  entries = [];
  listeners.forEach((fn) => fn());
}
export function activitySnapshotForTest(): readonly ActivityEntry[] {
  return entries;
}
