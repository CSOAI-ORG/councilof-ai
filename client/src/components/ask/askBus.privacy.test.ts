// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RECENTS_EVENT,
  RECENTS_KEY,
  readRecents,
  recentDestination,
  recordRecent,
  setRecentPin,
  togglePin,
} from "./askBus";

const entry = {
  href: "/dashboard?tab=tools&tool=get_axis&axis=safety",
  title: "Safety test",
  crumb: "Council OS › Tests",
  at: 123,
  pinned: true,
};
beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("shortcut destination privacy", () => {
  it.each([
    "args",
    "arguments",
    "ask",
    "question",
    "q",
    "x_payment",
    "card",
    "payload",
    "unknown",
  ])("strips the %s query from public destinations", (key) => {
    const value = encodeURIComponent('{"secret":"private input"}');
    expect(
      recentDestination(
        `/dashboard?tab=tools&tool=get_axis&axis=safety&${key}=${value}#private-fragment`,
      ),
    ).toBe(entry.href);
    expect(recentDestination(`/verify?${key}=${value}#private-fragment`)).toBe(
      "/verify",
    );
  });

  it("retains public tool and axis metadata while discarding query bodies and invalid token values", () => {
    expect(
      recentDestination(
        "/dashboard/?axis=art5-safeguard&tool=get_axis&tab=tools&run=true",
      ),
    ).toBe("/dashboard?tab=tools&tool=get_axis&axis=art5-safeguard");
    expect(
      recentDestination(
        "/dashboard?tab=tools&tool=%7B%22private%22%3Atrue%7D&axis=private%20input",
      ),
    ).toBe("/dashboard?tab=tools");
    expect(
      recentDestination(
        "/dashboard?view=%2Fverify%3Fcard%3Dprivate%23secret&args=private",
      ),
    ).toBe("/dashboard?view=%2Fverify");
  });

  it.each([
    "https://other.example/dashboard",
    "//other.example/dashboard",
    "/\\other.example/dashboard",
    "/dashboard\n?tab=tools",
    "/dashboard\u0000",
    "/dashboard\u007f",
    "/%5cother.example/dashboard",
    "/%2f%2fother.example/dashboard",
    "/dashboard%0a",
    "/dashboard?view=%2F%2Fother.example%2Fprivate",
    "/dashboard?view=%2F%5Cother.example%2Fprivate",
    "/dashboard?view=%2Fverify%0a",
  ])("rejects unsafe destination %j", (href) => {
    expect(recentDestination(href)).toBeNull();
  });

  it("does not retain extra runtime fields when recording a valid destination", () => {
    expect(
      recordRecent({
        href:
          entry.href +
          "&args=private&ask=private&x_payment=private&card=private",
        title: entry.title,
        crumb: entry.crumb,
        arguments: { secret: "private raw arguments" },
        result: "private result",
        x_payment: "private payment",
        card: { body: "private card" },
      } as never),
    ).toBe(true);
    const raw = localStorage.getItem(RECENTS_KEY)!;
    const stored = JSON.parse(raw)[0];
    expect(Object.keys(stored).sort()).toEqual([
      "at",
      "crumb",
      "href",
      "pinned",
      "title",
    ]);
    expect(stored.href).toBe(entry.href);
    expect(raw).not.toContain("private");
  });
});

describe("defensive recents storage", () => {
  it("returns only valid metadata and drops malformed or duplicate records", () => {
    localStorage.setItem(
      RECENTS_KEY,
      JSON.stringify([
        null,
        [],
        42,
        {},
        { ...entry, at: "yesterday" },
        { ...entry, href: "//other.example" },
        { ...entry, title: null },
        { ...entry, crumb: {} },
        { ...entry, at: null },
        {
          ...entry,
          arguments: { secret: "raw args" },
          result: "raw result",
          x_payment: "payment",
          card: "card body",
        },
        { ...entry, href: entry.href + "&ask=private" },
      ]),
    );
    expect(readRecents()).toEqual([entry]);
    expect(JSON.stringify(readRecents())).not.toMatch(
      /secret|raw args|raw result|payment|card body|private/,
    );
  });

  it("reports blocked reads and writes without leaking an exception or claiming a successful mutation", () => {
    const before = JSON.stringify([entry]);
    localStorage.setItem(RECENTS_KEY, before);
    const get = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    expect(readRecents()).toEqual([]);
    expect(
      recordRecent({ href: "/verify", title: "Verify", crumb: "Evidence" }),
    ).toBe(false);
    expect(togglePin(entry.href)).toBe(false);
    get.mockRestore();
    expect(localStorage.getItem(RECENTS_KEY)).toBe(before);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(
      recordRecent({ href: "/verify", title: "Verify", crumb: "Evidence" }),
    ).toBe(false);
    expect(togglePin(entry.href)).toBe(false);
    expect(localStorage.getItem(RECENTS_KEY)).toBe(before);
  });

  it.each(["{broken", '{"not":"a list"}'])(
    "preserves an unreadable store rather than replacing it on save or pin: %s",
    (before) => {
      localStorage.setItem(RECENTS_KEY, before);
      expect(readRecents()).toEqual([]);
      expect(
        recordRecent({ href: "/verify", title: "Verify", crumb: "Evidence" }),
      ).toBe(false);
      expect(togglePin("/verify")).toBe(false);
      expect(localStorage.getItem(RECENTS_KEY)).toBe(before);
    },
  );

  it("does not announce a saved shortcut when a silent write cannot be confirmed", () => {
    localStorage.setItem(RECENTS_KEY, JSON.stringify([entry]));
    const changed = vi.fn();
    window.addEventListener(RECENTS_EVENT, changed);
    try {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(
        () => undefined,
      );
      expect(togglePin(entry.href)).toBe(false);
      expect(
        recordRecent({ href: "/verify", title: "Verify", crumb: "Evidence" }),
      ).toBe(false);
      expect(changed).not.toHaveBeenCalled();
      expect(readRecents()).toEqual([entry]);
    } finally {
      window.removeEventListener(RECENTS_EVENT, changed);
    }
  });

  it("reports a pin success only for an existing destination and emits metadata change after confirmed storage", () => {
    expect(togglePin("/not-yet-recorded")).toBe(false);
    const changed = vi.fn();
    window.addEventListener(RECENTS_EVENT, changed);
    try {
      expect(
        recordRecent({
          href: entry.href,
          title: entry.title,
          crumb: entry.crumb,
        }),
      ).toBe(true);
      expect(togglePin(entry.href)).toBe(true);
      expect(readRecents()[0].pinned).toBe(true);
      expect(changed).toHaveBeenCalledTimes(2);
    } finally {
      window.removeEventListener(RECENTS_EVENT, changed);
    }
  });

  it("pins the selected entity atomically and keeps its label when page tracking supplies a generic title", () => {
    expect(setRecentPin(entry, true)).toBe(true);
    expect(
      recordRecent({
        href: entry.href,
        title: "Council OS: the GSPC workspace",
        crumb: "/dashboard",
      }),
    ).toBe(true);
    expect(readRecents()[0]).toMatchObject({
      title: entry.title,
      crumb: entry.crumb,
      pinned: true,
    });
    expect(
      setRecentPin(
        { ...entry, title: "A deliberately renamed shortcut" },
        false,
      ),
    ).toBe(true);
    expect(readRecents()[0]).toMatchObject({
      title: "A deliberately renamed shortcut",
      pinned: false,
    });
  });
});
