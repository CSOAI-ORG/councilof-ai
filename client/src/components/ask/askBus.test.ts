import { describe, expect, it } from "vitest";
import { ASK_MOBILE_QUERY, isAskEntryRoute, shouldAutoOpenAsk } from "./askBus";

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
