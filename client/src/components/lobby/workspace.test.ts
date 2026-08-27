import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  OS_PREF_KEYS, WORKSPACE_FALLBACK, WORKSPACE_KEY, activitySnapshotForTest, clearActivityForTest,
  forgetOsPreferences, readWorkspaceName, recordActivity, writeWorkspaceName,
} from "./workspace";

const store = new Map<string, string>();

describe("the local workspace", () => {
  beforeEach(() => {
    store.clear();
    clearActivityForTest();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("has an honest default name and no stored state until named", () => {
    expect(readWorkspaceName()).toBe(WORKSPACE_FALLBACK);
    expect(store.size).toBe(0);
  });

  it("keeps a chosen name in this browser only", () => {
    writeWorkspaceName("  Nick's desk  ");
    expect(store.get(WORKSPACE_KEY)).toBe("Nick's desk");
    expect(readWorkspaceName()).toBe("Nick's desk");
  });

  it("naming it back to the fallback removes the stored key", () => {
    writeWorkspaceName("Nick's desk");
    writeWorkspaceName(WORKSPACE_FALLBACK);
    expect(store.has(WORKSPACE_KEY)).toBe(false);
  });

  it("forgetOsPreferences removes every OS key and reports what it removed", () => {
    OS_PREF_KEYS.forEach((k) => store.set(k, "x"));
    const removed = forgetOsPreferences();
    expect(removed).toEqual(OS_PREF_KEYS);
    OS_PREF_KEYS.forEach((k) => expect(store.has(k)).toBe(false));
  });

  it("the activity log records events newest-first and never persists them", () => {
    recordActivity({ kind: "pane", label: "Live board", tabId: "board" });
    recordActivity({ kind: "route", label: "Methodology", path: "/methodology" });
    const log = activitySnapshotForTest();
    expect(log.map((e) => e.label)).toEqual(["Methodology", "Live board"]);
    // Session-only is a promise, not a caption: nothing about activity touches storage.
    expect(store.size).toBe(0);
  });

  it("the same destination twice in a row is one visit", () => {
    recordActivity({ kind: "pane", label: "Live board", tabId: "board" });
    recordActivity({ kind: "pane", label: "Live board", tabId: "board" });
    recordActivity({ kind: "route", label: "Methodology", path: "/methodology" });
    recordActivity({ kind: "route", label: "Methodology", path: "/methodology" });
    expect(activitySnapshotForTest().map((e) => e.label)).toEqual(["Methodology", "Live board"]);
  });
});
