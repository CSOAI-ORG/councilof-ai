import { describe, expect, it } from "vitest";
import { looksLikeCardJson, matchRefusal, wantsBoardTotals } from "./lobbyRefuse";

describe("lobby refusals", () => {
  it("refuses certify, token, autosign, fortune fill", () => {
    expect(matchRefusal("make me certified")?.id).toBe("certify");
    expect(matchRefusal("tokenise this score")?.id).toBe("token");
    expect(matchRefusal("sign in the background")?.id).toBe("autosign");
    expect(matchRefusal("fill the fortune list")?.id).toBe("fortune");
    expect(matchRefusal("walk me through the live GSPC board")).toBeNull();
  });
});

describe("lobby free tools", () => {
  it("detects board_totals and a pasted card, not a greeting", () => {
    expect(wantsBoardTotals("Walk me through the live GSPC board")).toBe(true);
    expect(looksLikeCardJson('{"id":"abc","signature":"x","body":{}}')).toBe(true);
    expect(looksLikeCardJson("hello")).toBe(false);
  });
});
