import { describe, expect, it } from "vitest";
import { HOME_NAV } from "./homeNav";

describe("HOME_NAV", () => {
  it("is five items: Board, Check a record, Workspace, Evidence pack, Company", () => {
    expect(HOME_NAV.map((i) => i.name)).toEqual(["Board", "Check a record", "Workspace", "Evidence pack", "Company"]);
    expect(HOME_NAV).toHaveLength(5);
  });

  it("does not carry Sign in or Start free", () => {
    const blob = JSON.stringify(HOME_NAV).toLowerCase();
    expect(blob).not.toContain("sign in");
    expect(blob).not.toContain("start free");
    expect(blob).not.toContain("chat");
  });

  it("Workspace keeps the named lobby destination", () => {
    expect(HOME_NAV.find((i) => i.name === "Workspace")?.href).toBe("/dashboard?tab=home");
  });
});
