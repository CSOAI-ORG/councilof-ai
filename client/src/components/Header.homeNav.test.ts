import { describe, expect, it } from "vitest";
import { HOME_NAV } from "./homeNav";

describe("HOME_NAV", () => {
  it("is five items: Board, Verify, OS, Pack, Company", () => {
    expect(HOME_NAV.map((i) => i.name)).toEqual(["Board", "Verify", "OS", "Pack", "Company"]);
    expect(HOME_NAV).toHaveLength(5);
  });

  it("does not carry Sign in or Start free", () => {
    const blob = JSON.stringify(HOME_NAV).toLowerCase();
    expect(blob).not.toContain("sign in");
    expect(blob).not.toContain("start free");
    expect(blob).not.toContain("chat");
  });

  it("OS is a named lobby, not a raw /os iframe target", () => {
    expect(HOME_NAV.find((i) => i.name === "OS")?.href).toBe("/dashboard?tab=home");
  });
});
