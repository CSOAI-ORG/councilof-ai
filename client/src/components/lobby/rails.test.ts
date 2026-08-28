import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LEFT_DEFAULT, LEFT_KEY, RIGHT_DEFAULT, RIGHT_KEY, readOpen, writeOpen } from "./rails";

const store = new Map<string, string>();

describe("Council OS sidebars", () => {
  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens Destinations and the AG-UI control rail on a first visit", () => {
    expect(readOpen(LEFT_KEY, LEFT_DEFAULT)).toBe(true);
    expect(readOpen(RIGHT_KEY, RIGHT_DEFAULT)).toBe(true);
  });

  it("remembers a hide and a restore", () => {
    writeOpen(LEFT_KEY, false);
    writeOpen(RIGHT_KEY, true);
    expect(readOpen(LEFT_KEY, LEFT_DEFAULT)).toBe(false);
    expect(readOpen(RIGHT_KEY, RIGHT_DEFAULT)).toBe(true);
  });
});
