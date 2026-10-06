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

describe("header mega-menu: no dead, login-walled or unlabelled raw-JSON links (tools audit, 6 Oct 2026)", () => {
  const items = navigation.flatMap((group) => group.submenu);

  it("drops links that 308 elsewhere or open a login wall", () => {
    // /watchdog-hub 308s to /os (functions/watchdog-hub.ts); /verify-certificate 308s to the card
    // verifier, not a training-record check; /workbench is behind RequireAuth.
    for (const href of ["/watchdog-hub", "/verify-certificate", "/workbench"])
      expect(items.map((item) => item.href), href).not.toContain(href);
  });

  it("puts every raw-JSON item under a section labelled for developers", () => {
    for (const group of navigation) {
      let section = "";
      for (const item of group.submenu) {
        if (item.section) section = item.section;
        if (/^\/(api\/|\.well-known\/)/.test(item.href))
          expect(section, `${group.name}: ${item.name}`).toBe("Machine-readable (for developers)");
      }
    }
  });

  it("names the Council OS items as the workspace sidebar names them", () => {
    const os = navigation.find((group) => group.name === "Council OS")!;
    const byHref = (href: string) => os.submenu.filter((item) => item.href === href).map((item) => item.name);
    expect(byHref("/dashboard?tab=home")).toEqual(["Get results"]);
    expect(byHref("/dashboard?tab=space")).toEqual(["Model arena"]);
    expect(byHref("/dashboard?tab=measured")).toEqual(["Request a fresh run"]);
    expect(os.submenu.map((item) => item.name)).not.toContain("Lobby home");
    expect(os.submenu.map((item) => item.name)).not.toContain("Council Space");
  });
});
