import { describe, expect, it } from "vitest";
import { AXIS_SETS } from "@/data/axis-sets";
import { navigation, PRIMARY_LINKS } from "./HeaderNav";

describe("public Board navigation", () => {
  it("opens the already-prerendered Board URL, not a query-specific dashboard snapshot", () => {
    expect(PRIMARY_LINKS.find((link) => link.name === "Board")?.href).toBe("/board/");
    const measure = navigation.find((group) => group.name === "Measure");
    expect(measure?.href).toBe("/board/");
    expect(measure?.submenu.find((link) => link.name === "The GSPC board")?.href).toBe("/board/");
  });

  it("keeps the Board's selected public set sourced from the live GSPC endpoint", () => {
    expect(AXIS_SETS[0].id).toBe("board");
    expect(AXIS_SETS[0].fetchUrl).toBe("/api/gspc");
  });
});
