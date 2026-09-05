import { describe, expect, it } from "vitest";
import { playCardHref } from "./LobbyPlay";

describe("LobbyPlay destination routing", () => {
  it("keeps a canonical dashboard pane route instead of nesting the dashboard", () => {
    expect(playCardHref("/dashboard?tab=space", "The Coliseum")).toBe(
      "/dashboard?tab=space",
    );
  });

  it("frames a non-dashboard route through the validated explore pane", () => {
    const href = playCardHref("/gspc-quests.html", "GSPC Quests");
    const url = new URL(href, "https://councilof.ai");

    expect(url.pathname).toBe("/dashboard");
    expect(url.searchParams.get("tab")).toBe("explore");
    expect(url.searchParams.get("view")).toBe("/gspc-quests.html");
    expect(url.searchParams.get("label")).toBe("GSPC Quests");
  });

  it("falls back safely for a non-local destination", () => {
    expect(playCardHref("https://example.com/game", "External")).toBe(
      "/dashboard?tab=explore",
    );
  });
});
