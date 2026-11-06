import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

export function appRoutePaths(source) {
  const file = ts.createSourceFile(
    "App.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const paths = [];
  let catchalls = 0;
  const visit = (node) => {
    if (
      (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
      node.tagName.getText(file) === "Route"
    ) {
      const attr = node.attributes.properties.find(
        (item) => ts.isJsxAttribute(item) && item.name.getText(file) === "path",
      );
      if (!attr) catchalls++;
      else {
        const value = attr.initializer;
        const literal =
          value &&
          (ts.isStringLiteral(value)
            ? value
            : ts.isJsxExpression(value) &&
                value.expression &&
                ts.isStringLiteral(value.expression)
              ? value.expression
              : null);
        if (!literal)
          throw new Error(
            "Route path is not a literal: add explicit surface discovery support",
          );
        paths.push(literal.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (new Set(paths).size !== paths.length)
    throw new Error("Duplicate route paths in App.tsx");
  return { paths, catchalls };
}

export function lobbyTabIds(source) {
  const file = ts.createSourceFile(
    "tabs.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  let array;
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(file) === "LOBBY_TABS"
    )
      array = node.initializer;
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (!array || !ts.isArrayLiteralExpression(array))
    throw new Error("Cannot discover LOBBY_TABS");
  return array.elements.map((node) => {
    if (!ts.isObjectLiteralExpression(node))
      throw new Error(
        "Nonliteral lobby tab requires explicit discovery support",
      );
    const prop = node.properties.find(
      (p) => ts.isPropertyAssignment(p) && p.name.getText(file) === "id",
    );
    if (!prop || !ts.isStringLiteral(prop.initializer))
      throw new Error("Lobby tab has no literal id");
    return prop.initializer.text;
  });
}

export function publicHtmlPaths(root) {
  const found = [];
  const walk = (folder) => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile() && entry.name.endsWith(".html"))
        found.push("/" + path.relative(root, file).split(path.sep).join("/"));
    }
  };
  walk(root);
  return found.sort();
}

/** Native pane ownership can include direct IDs that are absent from the navigation tabs. */
export function nativePaneIds(source) {
  const file = ts.createSourceFile(
    "DashboardPane.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let object;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === "PANES")
      object = node.initializer;
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (!object || !ts.isObjectLiteralExpression(object))
    throw new Error("Cannot discover native PANES");
  return object.properties.map((property) => {
    if (
      !ts.isPropertyAssignment(property) ||
      (!ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name))
    )
      throw new Error(
        "Nonliteral native pane requires explicit discovery support",
      );
    return property.name.text;
  });
}

/** Terminal fixtures are deliberate no-record / withdrawn states, never invented records. */
export function dynamicFixtures(root) {
  const json = (file) =>
    JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
  const answers = json("client/src/data/answers.json");
  const notes = json("client/src/data/evidence-notes.json").notes;
  const mcps = json("client/src/data/mcpRegistry.json").servers;
  const positive = (url, source) => ({
    url,
    state: "published-example",
    source,
  });
  const terminal = (url, reason) => ({
    url,
    state: "terminal-example",
    reason,
  });
  return {
    "/answers/:slug": positive(
      `/answers/${answers[0].slug}`,
      "client/src/data/answers.json[0]",
    ),
    "/notes/:slug": positive(
      `/notes/${notes[0].id}`,
      "client/src/data/evidence-notes.json.notes[0]",
    ),
    "/mcps/:slug": positive(
      `/mcps/${mcps[0].slug}`,
      "client/src/data/mcpRegistry.json.servers[0]",
    ),
    "/hive/:slug": positive(
      "/hive/eu-ai-act",
      "client/src/data/hive-frameworks.ts",
    ),
    "/library/:sector": positive(
      "/library/regulation",
      "client/src/data/library-ia.ts",
    ),
    "/gspc/:axis": positive(
      "/gspc/safety",
      "Published safety axis; availability is separate from measurement",
    ),
    "/model/:id": terminal(
      "/model/surface-audit-unknown",
      "Explicit no-signed-findings state",
    ),
    "/for/:persona": positive(
      "/for/enterprise",
      "client/src/pages/PersonaRouter.tsx",
    ),
    "/vs/:slug": positive(
      "/vs/onetrust",
      "Retained comparison explainer; no competitor score asserted",
    ),
    "/courses/:id": terminal(
      "/courses/999999999",
      "Retired enrollment door opens public Council OS learn; no course claimed",
    ),
    "/scorecard/:systemId": terminal(
      "/scorecard/999999999",
      "No private system requested; API unavailable in offline build",
    ),
    ...Object.fromEntries(
      [
        ["/verify/:certificateNumber", "/verify/surface-audit-unknown"],
        ["/regulator/:id", "/regulator/surface-audit-unknown"],
        ["/frameworks/:slug", "/frameworks/surface-audit-unknown"],
        ["/sectors/:slug", "/sectors/surface-audit-unknown"],
        ["/industries/:slug", "/industries/surface-audit-unknown"],
        ["/blog/:slug", "/blog/surface-audit-unknown"],
        ["/courses/:id/learn", "/courses/999999999/learn"],
        ["/free-course/:courseId", "/free-course/surface-audit-unknown"],
        [
          "/verify-certificate/:id",
          "/verify-certificate/surface-audit-unknown",
        ],
        ["/charter/article/:id", "/charter/article/surface-audit-unknown"],
      ].map(([template, url]) => [
        template,
        terminal(
          url,
          "Withdrawn route / content-review terminal; no record invented",
        ),
      ]),
    ),
  };
}

export function expandRouteFixtures(paths, fixtures) {
  const dynamic = new Set(paths.filter((item) => item.includes(":")));
  for (const template of dynamic)
    if (!fixtures[template])
      throw new Error(`Missing dynamic fixture: ${template}`);
  for (const template of Object.keys(fixtures))
    if (!dynamic.has(template))
      throw new Error(`Stale dynamic fixture: ${template}`);
  return paths.map((template) => {
    const fixture = fixtures[template];
    const url = fixture?.url ?? template;
    if (!url.startsWith("/") || url.startsWith("//") || /[:<>]/.test(url))
      throw new Error(`Invalid concrete fixture: ${template}`);
    const pattern = template
      .split("/")
      .map((segment) =>
        segment.startsWith(":")
          ? "[^/]+"
          : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      )
      .join("/");
    if (
      !new RegExp(`^${pattern}$`).test(
        new URL(url, "https://councilof.ai").pathname,
      )
    )
      throw new Error(`Fixture does not match its route: ${template}`);
    return {
      id: `app:${template}`,
      kind: fixture ? "dynamic" : "app",
      url,
      template,
      ...(fixture ?? {}),
    };
  });
}

export function surfaceInventory(root) {
  const app = appRoutePaths(
    fs.readFileSync(path.join(root, "client/src/App.tsx"), "utf8"),
  );
  if (app.catchalls !== 1)
    throw new Error(`Expected one App catchall, found ${app.catchalls}`);
  const tabs = lobbyTabIds(
    fs.readFileSync(
      path.join(root, "client/src/components/lobby/tabs.ts"),
      "utf8",
    ),
  );
  const panes = nativePaneIds(
    fs.readFileSync(
      path.join(root, "client/src/components/DashboardPane.tsx"),
      "utf8",
    ),
  );
  const workspaceIds = [...new Set([...tabs, ...panes])];
  const html = publicHtmlPaths(path.join(root, "public"));
  const cases = [
    ...expandRouteFixtures(app.paths, dynamicFixtures(root)),
    ...workspaceIds.map((id) => ({
      id: `tab:${id}`,
      kind: "tab",
      url: `/dashboard?tab=${encodeURIComponent(id)}`,
    })),
    {
      id: "workspace:company",
      kind: "company-signed-out",
      url: "/dashboard/?workspace=company",
      state: "signed-out-only",
    },
    ...html.map((url) => ({ id: `html:${url}`, kind: "public-html", url })),
    {
      id: "fallback:unknown",
      kind: "unknown",
      url: "/surface-audit-unknown-route",
    },
  ];
  return {
    appPaths: app.paths.length,
    catchalls: app.catchalls,
    dynamicTemplates: app.paths.filter((p) => p.includes(":")).length,
    tabs: workspaceIds.length,
    declaredTabs: tabs.length,
    extraNativePanes: workspaceIds.filter((id) => !tabs.includes(id)),
    publicHtml: html.length,
    cases,
  };
}
