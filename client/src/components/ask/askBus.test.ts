// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { ASK_MOBILE_QUERY, ASK_OPEN, isAskEntryRoute, openAsk, shouldAutoOpenAsk } from "./askBus";

describe("Ask entry routes keep opening user-initiated on every width", () => {
  const entries: [string, string][] = [["/", ""], ["/tools", ""], ["/tools/", ""], ["/dashboard", ""], ["/dashboard/", "?tab=home"]];
  const others: [string, string][] = [["/dashboard", "?tab=board"], ["/dashboard", "?tab=measured"], ["/dashboard", "?view=x"], ["/assess/", ""], ["/blog/x", ""]];

  it("keeps the #3057 entry routes", () => {
    for (const [l, s] of entries) expect(isAskEntryRoute(l, s), l + s).toBe(true);
    for (const [l, s] of others) expect(isAskEntryRoute(l, s), l + s).toBe(false);
  });

  it("never auto-opens desktop entry routes or tool pages", () => {
    for (const [l, s] of [...entries, ...others]) expect(shouldAutoOpenAsk(l, s, false), l + s).toBe(false);
  });

  it("never auto-opens on mobile", () => {
    for (const [l, s] of [...entries, ...others]) expect(shouldAutoOpenAsk(l, s, true), l + s).toBe(false);
  });

  it("uses the pane's own sm breakpoint", () => {
    expect(ASK_MOBILE_QUERY).toBe("(max-width: 640px)");
  });
});

describe("Ask bus preserves one selected conversation", () => {
  it("carries an explicit thread id when a history thread is selected", () => {
    let received: unknown;
    const listener = (event: Event) => { received = (event as CustomEvent).detail; };
    window.addEventListener(ASK_OPEN, listener);
    try { openAsk("continue this", "server-thread-7"); } finally { window.removeEventListener(ASK_OPEN, listener); }
    expect(received).toEqual({ question: "continue this", threadId: "server-thread-7" });
  });

  it("does not overwrite the selected thread when a header button only opens Ask", () => {
    let received: unknown;
    const listener = (event: Event) => { received = (event as CustomEvent).detail; };
    window.addEventListener(ASK_OPEN, listener);
    try { openAsk(); } finally { window.removeEventListener(ASK_OPEN, listener); }
    expect(received).toEqual({ question: undefined });
  });
});
