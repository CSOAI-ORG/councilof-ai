import { describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  appRoutePaths,
  expandRouteFixtures,
  lobbyTabIds,
  nativePaneIds,
  surfaceInventory,
} from "../../e2e/support/surfaceInventory.mjs";

describe("surface coverage is derived from declarations", () => {
  it("ignores commented examples and collects literal component and render routes plus catchall", () => {
    const source = `// <Route path="/comment" />\nconst Example = <><Route path="/one" component={One} />{/* <Route path="/hidden"/> */}<Route path="/two/:id">{() => <Two />}</Route><Route component={Missing}/></>;`;
    expect(appRoutePaths(source)).toEqual({
      paths: ["/one", "/two/:id"],
      catchalls: 1,
    });
  });

  it("rejects route omissions, duplicate routes, nonliteral routes and stale concrete fixtures", () => {
    expect(() => expandRouteFixtures(["/new/:id"], {})).toThrow(
      "Missing dynamic fixture",
    );
    expect(() =>
      expandRouteFixtures(["/"], { "/old/:id": { url: "/old/1" } }),
    ).toThrow("Stale dynamic fixture");
    expect(() =>
      appRoutePaths('<><Route path="/x"/><Route path="/x"/></>'),
    ).toThrow("Duplicate");
    expect(() => appRoutePaths("<Route path={computed}/>")).toThrow(
      "not a literal",
    );
    expect(() =>
      expandRouteFixtures(["/x/:id"], {
        "/x/:id": { url: "//external.example" },
      }),
    ).toThrow("Invalid concrete");
    expect(() =>
      expandRouteFixtures(["/x/:id"], { "/x/:id": { url: "/different/1" } }),
    ).toThrow("does not match its route");
  });

  it("discovers the actual lobby array and ignores example IDs in comments", () => {
    expect(
      lobbyTabIds(
        '// id: "fake"\nexport const LOBBY_TABS: Tab[] = [{id:"home"}, {id:"tools"}];',
      ),
    ).toEqual(["home", "tools"]);
    expect(() => lobbyTabIds("export const LOBBY_TABS = [other]")).toThrow(
      "Nonliteral",
    );
    expect(
      nativePaneIds(
        '// hidden: Fake\nconst PANES = {console: Console, "terminal": Terminal};',
      ),
    ).toEqual(["console", "terminal"]);
  });

  it("covers every current App path, all tabs, every public HTML document and the unknown fallback", () => {
    const root = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../..",
    );
    const inventory = surfaceInventory(root);
    expect(inventory.appPaths).toBeGreaterThan(500);
    expect(inventory.dynamicTemplates).toBeGreaterThan(0);
    expect(
      inventory.cases.filter((item) => item.kind === "dynamic"),
    ).toHaveLength(inventory.dynamicTemplates);
    expect(
      inventory.cases.filter((item) => item.id.startsWith("app:")),
    ).toHaveLength(inventory.appPaths);
    expect(inventory.cases.filter((item) => item.kind === "tab")).toHaveLength(
      inventory.tabs,
    );
    expect(
      inventory.cases.filter((item) => item.kind === "public-html"),
    ).toHaveLength(inventory.publicHtml);
    expect(
      inventory.cases.filter((item) => item.kind === "unknown"),
    ).toHaveLength(1);
    expect(
      inventory.cases.filter((item) => item.kind === "company-signed-out"),
    ).toHaveLength(1);
    expect(new Set(inventory.cases.map((item) => item.id)).size).toBe(
      inventory.cases.length,
    );
    expect(
      inventory.cases
        .filter((item) => item.kind === "dynamic")
        .every(
          (item) =>
            item.state === "published-example" ||
            item.state === "terminal-example",
        ),
    ).toBe(true);
  });
});
