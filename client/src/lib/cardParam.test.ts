import { describe, expect, it } from "vitest";
import { resolveCardParam, verifyCardHref } from "./cardParam";

const O = "https://councilof.ai";

describe("resolveCardParam", () => {
  it("no parameter is none", () => {
    expect(resolveCardParam("", O)).toEqual({ state: "none" });
    expect(resolveCardParam("?card=", O)).toEqual({ state: "none" });
  });

  it("round-trips the link a board row builds", () => {
    const href = verifyCardHref("/signed/cards/abc123.json");
    expect(href).toBe("/gspc-verify/?card=%2Fsigned%2Fcards%2Fabc123.json");
    expect(resolveCardParam(href.split("?")[1] ? `?${href.split("?")[1]}` : "", O)).toEqual({
      state: "ok", url: "/signed/cards/abc123.json", href: "https://councilof.ai/signed/cards/abc123.json",
    });
  });

  it("a preview origin loads its own bytes by path", () => {
    const r = resolveCardParam("?card=/signed/cards/x.json", "https://abc.councilof-ai.pages.dev");
    expect(r).toMatchObject({ state: "ok", url: "/signed/cards/x.json" });
  });

  it("accepts an absolute councilof.ai URL from another origin", () => {
    const r = resolveCardParam(`?card=${encodeURIComponent("https://councilof.ai/signed/cards/x.json")}`, "http://localhost:4173");
    expect(r).toMatchObject({ state: "ok", url: "https://councilof.ai/signed/cards/x.json" });
  });

  it.each([
    ["https://evil.example/card.json", /only loaded from this site/],
    ["//evil.example/card.json", /only http\(s\)/],
    ["javascript:alert(1)", /only http\(s\)/],
    ["data:application/json,{}", /only http\(s\)/],
    ["https://user:pw@councilof.ai/x.json", /credentials/],
  ])("refuses %s with a reason", (raw, reason) => {
    const r = resolveCardParam(`?card=${encodeURIComponent(raw)}`, O);
    expect(r.state).toBe("refused");
    expect(r.state === "refused" && r.reason).toMatch(reason);
  });
});
