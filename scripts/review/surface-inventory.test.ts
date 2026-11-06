import { describe, expect, it } from "vitest";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  appRoutePaths,
  expandRouteFixtures,
  lobbyTabIds,
  nativePaneIds,
  literalCollection,
  classifySitemapURLs,
  rejectGenericNotFound,
  surfaceInventory,
} from "../../e2e/support/surfaceInventory.mjs";

describe("surface coverage is derived from declarations", () => {
  it("ignores commented examples and collects literal component and render routes plus catchall", () => {
    const source = `// <Route path="/comment" />\nconst Example = <><Route path="/one" component={One} />{/* <Route path="/hidden"/> */}<Route path="/two/:id">{() => <Two />}</Route><Route component={Missing}/></>;`;
    expect(appRoutePaths(source)).toMatchObject({
      paths: ["/one", "/two/:id"],
      catchalls: 1,
    });
  });

  it("rejects generic 404 fallthrough for known pages while preserving explicit terminal cases", () => {
    for (const surface of [
      { kind: "app" },
      { kind: "published-entity" },
      { kind: "sitemap-alias" },
      { kind: "app", publicationState: "withdrawn-notice" },
    ])
      expect(rejectGenericNotFound(surface)).toBe(true);
    for (const surface of [
      { kind: "unknown" },
      { state: "terminal-example" },
      { expectedTerminal: "declared-not-found" },
      { expectedTerminal: "published-html-tombstone" },
    ])
      expect(rejectGenericNotFound(surface)).toBe(false);
    const routes = appRoutePaths(
      '<><Route path="/404" component={NotFound}/><Route path="/retired" component={ContentReviewNotice}/><Route component={NotFound}/></>',
    );
    expect(routes.records[0].expectedTerminal).toBe("declared-not-found");
    expect(routes.records[1].publicationState).toBe("withdrawn-notice");
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

  it("derives finite TS collections without treating comments as published entities", () => {
    expect(
      literalCollection(
        '// slug: "fake"\nconst HIVE = [{slug:"one"},{slug:"two"}];',
        "HIVE",
        "slug",
      ),
    ).toEqual(["one", "two"]);
    expect(
      literalCollection(
        'const PERSONAS = {enterprise: {}, "sec-filer": {}};',
        "PERSONAS",
      ),
    ).toEqual(["enterprise", "sec-filer"]);
    expect(() =>
      literalCollection("const HIVE = [...dynamic];", "HIVE", "slug"),
    ).toThrow("Nonliteral");
  });

  it("keeps canonical HTML aliases and machine resources in their appropriate checks", () => {
    const classified = classifySitemapURLs(
      [
        "https://councilof.ai/about/",
        "https://councilof.ai/report/",
        "https://councilof.ai/agent-cards/",
        "https://councilof.ai/api/gspc",
        "https://councilof.ai/feed.json",
        "https://councilof.ai/llms.txt",
        "https://councilof.ai/edge-only/",
      ],
      ["/about"],
      ["/report.html", "/agent-cards/index.html"],
    );
    expect(classified.browser.map((item) => item.url)).toEqual([
      "/about/",
      "/report/",
      "/agent-cards/",
    ]);
    expect(classified.http.map((item) => item.classification)).toEqual([
      "function-machine-door",
      "machine-json",
      "machine-text",
      "unmapped-edge-or-asset",
    ]);
    expect(
      classified.http.every((item) => item.browserHeadingCheck === false),
    ).toBe(true);
    expect(() =>
      classifySitemapURLs(["https://external.example/about"], ["/about"], []),
    ).toThrow("unsupported origin");
  });

  it("includes every published JSON entity and approved blog while excluding unpublished model names", () => {
    const root = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../..",
    );
    const json = (file: string) =>
      JSON.parse(readFileSync(path.join(root, file), "utf8"));
    const inventory = surfaceInventory(root);
    const urls = new Set(inventory.cases.map((item) => item.url));
    const families: [string, string, string[]][] = [
      [
        "answers",
        "/answers/",
        json("client/src/data/answers.json").map((row: any) => row.slug),
      ],
      [
        "notes",
        "/notes/",
        json("client/src/data/evidence-notes.json").notes.map(
          (row: any) => row.id,
        ),
      ],
      [
        "mcpServers",
        "/mcps/",
        json("client/src/data/mcpRegistry.json").servers.map(
          (row: any) => row.slug,
        ),
      ],
      [
        "approvedBlogs",
        "/blog/",
        json("client/src/data/blog-published.json").published.map(
          (row: any) => row.slug,
        ),
      ],
    ];
    for (const [family, prefix, names] of families) {
      expect(inventory.publishedEntities[family].count).toBe(names.length);
      for (const name of names)
        expect(
          urls.has(prefix + encodeURIComponent(name)),
          `${family}:${name}`,
        ).toBe(true);
    }
    const models = json("public/signed/findings_index.json").models;
    for (const row of models)
      expect(urls.has("/model/" + encodeURIComponent(row.model))).toBe(
        row.name_published === true && row.n_findings > 0,
      );
    expect(
      inventory.cases.some((item) => item.state === "terminal-example"),
    ).toBe(true);
  });
});
