import { describe, expect, it } from "vitest";
import { legacyOsDestination, onRequest as redirectOs } from "./os";
import {
  onRequest as redirectScoreboard,
  scoreboardDestination,
} from "./gspc-scoreboard";
import { onRequest as redirectPricing } from "./pricing";
import { onRequest as redirectChat } from "./chat";
import { onRequest as redirectChatSlash } from "./chat/index";

describe("retired workspace doors", () => {
  it("preserves an old Council OS pane and unrelated context", () => {
    const request = new Request(
      "https://councilof.ai/os?lobby=verify&embed=1&ctx=case-7",
    );
    const destination = legacyOsDestination(request);
    expect(destination.pathname).toBe("/dashboard");
    expect(destination.searchParams.get("tab")).toBe("verify");
    expect(destination.searchParams.get("embed")).toBe("1");
    expect(destination.searchParams.get("ctx")).toBe("case-7");
    expect(destination.searchParams.has("lobby")).toBe(false);
    expect(redirectOs({ request }).status).toBe(308);
  });

  it("normalizes old request vocabulary", () => {
    expect(
      legacyOsDestination(
        new Request("https://councilof.ai/os?lobby=assessment"),
      ).searchParams.get("tab"),
    ).toBe("measured");
  });

  it("opens the board without discarding embed context", () => {
    const request = new Request(
      "https://councilof.ai/gspc-scoreboard?embed=1&tab=home",
    );
    const destination = scoreboardDestination(request);
    expect(destination.pathname).toBe("/dashboard");
    expect(destination.searchParams.get("tab")).toBe("board");
    expect(destination.searchParams.get("embed")).toBe("1");
    expect(redirectScoreboard({ request }).status).toBe(308);
  });

  it("sends pricing directly to its canonical dashboard pane", () => {
    const response = redirectPricing();
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "/dashboard/?tab=measured&task=pricing-overview",
    );
    expect(response.headers.get("location")).not.toContain("/os");
  });

  it("sends both chat doors directly to the canonical dashboard home", () => {
    for (const redirect of [redirectChat, redirectChatSlash]) {
      const response = redirect();
      expect(response.status).toBe(308);
      expect(response.headers.get("location")).toBe("/dashboard?tab=home");
      expect(response.headers.get("location")).not.toContain("/os");
    }
  });
});
