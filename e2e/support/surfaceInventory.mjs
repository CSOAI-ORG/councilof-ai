import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { createHash } from "node:crypto";

export function appRoutePaths(source) {
  const file = ts.createSourceFile(
    "App.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const paths = [];
  const records = [];
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
        const componentAttr = node.attributes.properties.find(
          (item) =>
            ts.isJsxAttribute(item) && item.name.getText(file) === "component",
        );
        const expression =
          componentAttr?.initializer &&
          ts.isJsxExpression(componentAttr.initializer)
            ? componentAttr.initializer.expression
            : null;
        const component =
          expression && ts.isIdentifier(expression) ? expression.text : null;
        records.push({
          path: literal.text,
          component,
          expectedTerminal:
            component === "NotFound"
              ? "declared-not-found"
              : component === "Gone"
                ? "declared-gone"
                : null,
          publicationState:
            component === "ContentReviewNotice"
              ? "withdrawn-notice"
              : "declared-route",
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (new Set(paths).size !== paths.length)
    throw new Error("Duplicate route paths in App.tsx");
  return { paths, catchalls, records };
}

export function rejectGenericNotFound(surface) {
  return (
    surface.kind !== "unknown" &&
    surface.state !== "terminal-example" &&
    !surface.expectedTerminal
  );
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

/** Read catalogued identifiers without executing TS initializers or reading comments as rows. */
export function literalCollection(source, name, field) {
  const file = ts.createSourceFile(
    "catalog.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let value;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === name)
      value = node.initializer;
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (!value) throw new Error(`Missing source collection: ${name}`);
  while (
    ts.isAsExpression(value) ||
    ts.isParenthesizedExpression(value) ||
    ts.isSatisfiesExpression(value)
  )
    value = value.expression;
  const names =
    !field && ts.isObjectLiteralExpression(value)
      ? value.properties.map((item) => {
          if (
            !ts.isPropertyAssignment(item) ||
            (!ts.isIdentifier(item.name) && !ts.isStringLiteral(item.name))
          )
            throw new Error(`Nonliteral collection key: ${name}`);
          return item.name.text;
        })
      : ts.isArrayLiteralExpression(value)
        ? value.elements.map((item) => {
            if (!ts.isObjectLiteralExpression(item))
              throw new Error(`Nonliteral collection entry: ${name}`);
            const prop = item.properties.find(
              (p) =>
                ts.isPropertyAssignment(p) &&
                (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) &&
                p.name.text === field,
            );
            if (!prop || !ts.isStringLiteral(prop.initializer))
              throw new Error(`Nonliteral ${name}.${field}`);
            return prop.initializer.text;
          })
        : null;
  if (!names || !names.length || new Set(names).size !== names.length)
    throw new Error(`Empty or duplicate source collection: ${name}`);
  return names;
}

export function publishedEntityCases(root) {
  const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
  const json = (file) => JSON.parse(read(file));
  const families = {};
  const cases = [];
  const add = (family, prefix, names, source) => {
    const ids = [...new Set(names)];
    if (
      ids.length !== names.length ||
      !ids.length ||
      ids.some((id) => typeof id !== "string" || !id.trim())
    )
      throw new Error(`Invalid published entity family: ${family}`);
    families[family] = { count: ids.length, source };
    cases.push(
      ...ids.map((name) => ({
        id: `entity:${family}:${encodeURIComponent(name)}`,
        kind: "published-entity",
        family,
        entityName: name,
        url: prefix + encodeURIComponent(name),
        state: "published-example",
        source,
      })),
    );
  };
  add(
    "answers",
    "/answers/",
    json("client/src/data/answers.json").map((row) => row.slug),
    "client/src/data/answers.json",
  );
  add(
    "notes",
    "/notes/",
    json("client/src/data/evidence-notes.json").notes.map((row) => row.id),
    "client/src/data/evidence-notes.json",
  );
  add(
    "mcpServers",
    "/mcps/",
    json("client/src/data/mcpRegistry.json").servers.map((row) => row.slug),
    "client/src/data/mcpRegistry.json",
  );
  add(
    "hiveFrameworks",
    "/hive/",
    literalCollection(
      read("client/src/data/hive-frameworks.ts"),
      "HIVE",
      "slug",
    ),
    "client/src/data/hive-frameworks.ts:HIVE",
  );
  add(
    "librarySectors",
    "/library/",
    literalCollection(read("client/src/data/library-ia.ts"), "SECTORS", "id"),
    "client/src/data/library-ia.ts:SECTORS",
  );
  add(
    "personas",
    "/for/",
    literalCollection(read("client/src/pages/PersonaRouter.tsx"), "PERSONAS"),
    "client/src/pages/PersonaRouter.tsx:PERSONAS",
  );
  add(
    "comparisonExplainers",
    "/vs/",
    literalCollection(read("client/src/pages/Compare.tsx"), "FOCUS"),
    "client/src/pages/Compare.tsx:FOCUS",
  );
  const findings = json("public/signed/findings_index.json");
  const publicModels = findings.models.filter(
    (row) => row.name_published === true && row.n_findings > 0,
  );
  add(
    "modelsWithPublicNames",
    "/model/",
    publicModels.map((row) => row.model),
    "public/signed/findings_index.json:models[name_published=true,n_findings>0]",
  );
  const approved = json("client/src/data/blog-published.json").published;
  const blog = json("client/src/data/blog-index.json").posts;
  for (const row of approved)
    if (!blog.some((post) => post.slug === row.slug))
      throw new Error(
        `Approved blog has no published index record: ${row.slug}`,
      );
  add(
    "approvedBlogs",
    "/blog/",
    approved.map((row) => row.slug),
    "client/src/data/blog-published.json + blog-index.json",
  );
  // Read the axis arrays actually imported by the serving module, not a second axis list.
  const board = ts.createSourceFile(
    "gspc.ts",
    read("functions/api/gspc.ts"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const axes = [];
  const hiddenAxes = new Set();
  for (const item of board.statements) {
    if (
      !ts.isImportDeclaration(item) ||
      !ts.isStringLiteral(item.moduleSpecifier) ||
      !item.moduleSpecifier.text.startsWith("./_gspc_axes_")
    )
      continue;
    const bindings = item.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings))
      throw new Error("Cannot discover served board axis imports");
    const module = `functions/api/${item.moduleSpecifier.text.slice(2)}.ts`;
    const axisFile = ts.createSourceFile(
      module,
      read(module),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const hidden = (node) => {
      if (ts.isObjectLiteralExpression(node)) {
        const value = (key) =>
          node.properties.find(
            (p) =>
              ts.isPropertyAssignment(p) &&
              (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) &&
              p.name.text === key,
          )?.initializer;
        const flag = value("public_pages"),
          axis = value("axis");
        if (
          flag &&
          ts.isStringLiteral(flag) &&
          flag.text === "HIDDEN_PENDING_OWNER_GO" &&
          axis &&
          ts.isStringLiteral(axis)
        )
          hiddenAxes.add(axis.text);
      }
      ts.forEachChild(node, hidden);
    };
    hidden(axisFile);
    for (const binding of bindings.elements)
      axes.push(
        ...literalCollection(
          read(module),
          (binding.propertyName ?? binding.name).text,
          "axis",
        ),
      );
  }
  add(
    "publicBoardAxisDetails",
    "/gspc/",
    axes.filter((axis) => !hiddenAxes.has(axis)),
    "functions/api/gspc.ts imports AXES_* arrays; labels only",
  );
  const answers = json("client/src/data/answers.json");
  const notes = json("client/src/data/evidence-notes.json").notes;
  const servers = json("client/src/data/mcpRegistry.json").servers;
  const hiveNames = literalCollection(
    read("client/src/data/hive-frameworks.ts"),
    "HIVE",
    "name",
  );
  const hiveSlugs = literalCollection(
    read("client/src/data/hive-frameworks.ts"),
    "HIVE",
    "slug",
  );
  const sectorTitles = literalCollection(
    read("client/src/data/library-ia.ts"),
    "SECTORS",
    "title",
  );
  const sectorIds = literalCollection(
    read("client/src/data/library-ia.ts"),
    "SECTORS",
    "id",
  );
  for (const item of cases) {
    const name = item.entityName;
    if (item.family === "answers")
      item.expected = {
        heading: answers.find((row) => row.slug === name).title,
      };
    if (item.family === "notes")
      item.expected = { heading: notes.find((row) => row.id === name).title };
    if (item.family === "mcpServers")
      item.expected = {
        heading: servers.find((row) => row.slug === name).name,
      };
    if (item.family === "hiveFrameworks")
      item.expected = { heading: hiveNames[hiveSlugs.indexOf(name)] };
    if (item.family === "librarySectors")
      item.expected = {
        heading: sectorTitles[sectorIds.indexOf(name)],
        headingLevel: 2,
      };
    if (item.family === "approvedBlogs")
      item.expected = {
        heading: blog.find((row) => row.slug === name).headline,
      };
    if (item.family === "publicBoardAxisDetails")
      item.expected =
        name === "jail"
          ? { heading: "Jail folder", jailFolder: true }
          : { axis: name };
    if (item.family === "modelsWithPublicNames") {
      const rows = findings.findings.filter((row) => row.model === name);
      if (!rows.length)
        throw new Error(`Published model has no supporting findings: ${name}`);
      item.expected = {
        heading: name,
        model: name,
        findingLinks: rows.map((row) => row.measurement.card_url),
      };
    }
  }
  return {
    cases,
    families,
    limits: {
      modelsNotPubliclyNamedOrWithoutFindings:
        findings.models.length - publicModels.length,
      boardAxisLabelsAreNotNewMeasurements: true,
      declaredBoardAxisLabels: axes.length,
      ownerGatedAxisDetails: [...hiddenAxes],
    },
  };
}

export function classifySitemapURLs(urls, appPaths, htmlPaths) {
  const bare = (value) => value.replace(/\/+$/, "") || "/";
  const htmlOwners = new Map();
  for (const file of htmlPaths) {
    htmlOwners.set(bare(file), file);
    htmlOwners.set(
      bare(
        file.endsWith("/index.html") ? file.slice(0, -10) : file.slice(0, -5),
      ),
      file,
    );
  }
  const patterns = appPaths.map(
    (template) =>
      new RegExp(
        "^" +
          bare(template)
            .split("/")
            .map((part) =>
              part.startsWith(":")
                ? "[^/]+"
                : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            )
            .join("/") +
          "$",
      ),
  );
  const browser = [];
  const http = [];
  for (const raw of urls) {
    const url = new URL(raw);
    if (url.origin !== "https://councilof.ai" || url.username || url.password)
      throw new Error(`Sitemap names an unsupported origin: ${raw}`);
    const requested = url.pathname + url.search;
    const pathname = bare(url.pathname);
    const extension = path.posix.extname(pathname).toLowerCase();
    const machine =
      /^\/api(?:\/|$)/.test(pathname) ||
      /^\/mcp(?:\/|$)/.test(pathname) ||
      [".json", ".xml", ".txt", ".md", ".yaml", ".yml"].includes(extension);
    const owner = htmlOwners.get(pathname);
    const app = patterns.some((pattern) => pattern.test(pathname));
    if (!machine && (owner || app))
      browser.push({
        id: `sitemap:${requested}`,
        kind: "sitemap-alias",
        url: requested,
        source: owner ? `public${owner}` : "client/src/App.tsx",
        state: "published-sitemap-url",
      });
    else
      http.push({
        url: raw,
        path: requested,
        classification:
          extension === ".json"
            ? "machine-json"
            : extension === ".xml"
              ? "machine-xml"
              : [".txt", ".md", ".yaml", ".yml"].includes(extension)
                ? "machine-text"
                : machine
                  ? "function-machine-door"
                  : "unmapped-edge-or-asset",
        source: "public/sitemap.xml",
        browserHeadingCheck: false,
      });
  }
  return { browser, http };
}

export function sitemapSurfaceInventory(root, appPaths, htmlPaths) {
  const source = fs.readFileSync(path.join(root, "public/sitemap.xml"), "utf8");
  const urls = [...source.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    match[1]
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">"),
  );
  if (!urls.length || new Set(urls).size !== urls.length)
    throw new Error("Sitemap is empty or contains duplicate URLs");
  return {
    total: urls.length,
    ...classifySitemapURLs(urls, appPaths, htmlPaths),
  };
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
  const entities = publishedEntityCases(root);
  const sitemap = sitemapSurfaceInventory(root, app.paths, html);
  const cases = [
    ...expandRouteFixtures(app.paths, dynamicFixtures(root)).map((item) => ({
      ...item,
      ...app.records.find((record) => record.path === item.template),
    })),
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
  const covered = new Set(cases.map((item) => item.url));
  const extraEntities = entities.cases.filter((item) => !covered.has(item.url));
  cases.push(...extraEntities);
  for (const item of extraEntities) covered.add(item.url);
  const sitemapAliases = sitemap.browser.filter(
    (item) => !covered.has(item.url),
  );
  cases.push(...sitemapAliases);
  for (const item of cases) {
    const pathname =
      new URL(item.url, "https://councilof.ai").pathname.replace(/\/+$/, "") ||
      "/";
    const entity = entities.cases.find(
      (row) =>
        (new URL(row.url, "https://councilof.ai").pathname.replace(
          /\/+$/,
          "",
        ) || "/") === pathname,
    );
    if (entity?.expected) item.expected = entity.expected;
    const route = app.records.find((record) => record.path === pathname);
    if (route?.expectedTerminal) item.expectedTerminal = route.expectedTerminal;
    if (route?.publicationState === "withdrawn-notice")
      item.publicationState = route.publicationState;
    const file =
      item.kind === "public-html"
        ? `public${item.url}`
        : item.source?.startsWith("public/") && item.source.endsWith(".html")
          ? item.source
          : null;
    if (file) {
      const htmlSource = fs.readFileSync(path.join(root, file), "utf8");
      const heading = htmlSource
        .match(/<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/i)?.[1]
        .replace(/<[^>]*>/g, "")
        .trim();
      if (
        /(?:^|\/)404\.html$/.test(file) ||
        (heading &&
          /^(?:404(?:\s.*)?|Page not found|Not found|410(?:\s.*)?|Gone)[.!]?$/i.test(
            heading,
          ))
      )
        item.expectedTerminal = "published-html-tombstone";
      if (/^public\/interop\/.*\/mirrors\/.*\.html$/.test(file)) {
        item.execution = "artifact-read";
        item.artifact = {
          source: file,
          sha256: createHash("sha256")
            .update(fs.readFileSync(path.join(root, file)))
            .digest("hex"),
          classification:
            item.expectedTerminal === "published-html-tombstone"
              ? "source-declared-tombstone"
              : "frozen-http-capture",
        };
      }
    }
  }
  return {
    appPaths: app.paths.length,
    catchalls: app.catchalls,
    dynamicTemplates: app.paths.filter((p) => p.includes(":")).length,
    tabs: workspaceIds.length,
    declaredTabs: tabs.length,
    extraNativePanes: workspaceIds.filter((id) => !tabs.includes(id)),
    publicHtml: html.length,
    publishedEntities: entities.families,
    publishedEntityURLs: entities.cases.length,
    additionalEntityCases: extraEntities.length,
    entityLimits: entities.limits,
    sitemapURLs: sitemap.total,
    sitemapBrowserURLs: sitemap.browser.length,
    additionalSitemapAliasCases: sitemapAliases.length,
    httpResources: sitemap.http,
    artifactReads: cases.filter((item) => item.execution === "artifact-read")
      .length,
    cases,
  };
}
