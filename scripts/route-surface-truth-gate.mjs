#!/usr/bin/env node

/**
 * Fail closed when the public route declarations disagree about what is live.
 *
 * This guard keeps three independent sources from silently drifting:
 *   1. App.tsx may declare a literal route only once.
 *   2. A route promoted as primary or emitted by Council OS navigation may not
 *      resolve to ContentReviewNotice.
 *   3. A cold-load edge redirect and an in-app Redirect must name the same
 *      owner. Slash-only canonicalisation is intentionally ignored.
 *
 * The parser is deliberately small and dependency-free. It handles the route
 * forms used in App.tsx; its selftest proves each failure class still bites.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function lineAt(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

function literalPaths(source) {
  return [...source.matchAll(/["'](\/[^"']*)["']/g)].map((match) => ({
    path: match[1],
    line: lineAt(source, match.index),
  }));
}

export function parseAppRoutes(source) {
  const routes = [];
  const routePattern =
    /<Route\b(?=[^>]*\bpath="([^"]+)")([^>]*?)(?:\/>|>([\s\S]*?)<\/Route>)/g;
  let match;
  while ((match = routePattern.exec(source)) !== null) {
    const [, path, attributes = "", children = ""] = match;
    const body = `${attributes}\n${children}`;
    const redirect = body.match(/<Redirect\s+to="([^"]+)"/);
    const component = attributes.match(/\bcomponent=\{([A-Za-z0-9_]+)\}/);
    routes.push({
      path,
      line: lineAt(source, match.index),
      kind: redirect ? "redirect" : component ? "component" : "render",
      target: redirect?.[1] ?? null,
      component: component?.[1] ?? null,
    });
  }
  return routes;
}

export function parsePrimaryNavigation(source) {
  const primaryBlock = source.match(
    /export const PRIMARY_PATHS[\s\S]*?new Set(?:<[^>]+>)?\s*\(\s*\[([\s\S]*?)\]\s*\);/,
  );
  const prefixBlock = source.match(
    /export const PRIMARY_PREFIXES[\s\S]*?=\s*\[([\s\S]*?)\]\s*;/,
  );
  return {
    paths: primaryBlock ? literalPaths(primaryBlock[1]) : [],
    prefixes: prefixBlock ? literalPaths(prefixBlock[1]) : [],
  };
}

function exportedArray(source, name) {
  const start = source.indexOf(`export const ${name}`);
  if (start < 0) return "";
  const next = source.indexOf("\nexport ", start + 1);
  return source.slice(start, next < 0 ? undefined : next);
}

export function parseLobbyNavigation(source) {
  const paths = [];
  for (const name of ["LOBBY_TABS", "LOBBY_ROUTES"]) {
    const block = exportedArray(source, name);
    for (const match of block.matchAll(/\bpath:\s*"([^"]+)"/g)) {
      if (!match[1].startsWith("/")) continue;
      paths.push({
        path: match[1],
        line: lineAt(source, source.indexOf(block) + match.index),
        source: name,
      });
    }
  }
  return paths;
}

export function parseCatalogueNavigation(source) {
  const paths = [];
  for (const match of source.matchAll(/\bpath:\s*"([^"]+)"/g)) {
    if (!match[1].startsWith("/")) continue;
    paths.push({
      path: match[1],
      line: lineAt(source, match.index),
      source: "catalogue literal",
    });
  }
  for (const match of source.matchAll(
    /\bconst\s+[A-Za-z0-9_]*path[A-Za-z0-9_]*\s*=\s*`(\/[^`]*)`/gi,
  )) {
    paths.push({
      path: match[1].replace(/\$\{[^}]+\}/g, ":dynamic"),
      line: lineAt(source, match.index),
      source: "catalogue template",
    });
  }
  return paths;
}

export function parseRedirects(source) {
  const redirects = new Map();
  source.split("\n").forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const [from, to, status = "302", ...rest] = line.split(/\s+/);
    if (!from || !to || rest.length || from.includes("*") || /:[A-Za-z]/.test(from))
      return;
    if (!redirects.has(from)) redirects.set(from, { to, status, line: index + 1 });
  });
  return redirects;
}

function routePath(value) {
  return value.split(/[?#]/, 1)[0] || "/";
}

function normalizedPath(value) {
  const path = routePath(value).replace(/\/+$/, "");
  return path || "/";
}

function normalizedTarget(value) {
  const url = new URL(value, "https://route-truth.invalid");
  const path = normalizedPath(url.pathname);
  const entries = [...url.searchParams.entries()].sort(([ak, av], [bk, bv]) =>
    ak === bk ? av.localeCompare(bv) : ak.localeCompare(bk),
  );
  const search = entries.length ? `?${new URLSearchParams(entries).toString()}` : "";
  return `${path}${search}${url.hash}`;
}

function pathSegments(value) {
  return normalizedPath(value).split("/").filter(Boolean);
}

function routePatternMatches(candidate, declaredPattern) {
  const candidateParts = pathSegments(candidate);
  const patternParts = pathSegments(declaredPattern);
  if (candidateParts.length !== patternParts.length) return false;
  return patternParts.every(
    (part, index) =>
      part.startsWith(":") ||
      candidateParts[index].startsWith(":") ||
      part === candidateParts[index],
  );
}

function issueOnce(issues, seen, key, message) {
  if (seen.has(key)) return;
  seen.add(key);
  issues.push(message);
}

export function auditRouteTruth({
  appSource,
  librarySource,
  catalogueSource,
  lobbySource,
  redirectsSource,
}) {
  const issues = [];
  const seenIssues = new Set();
  const routes = parseAppRoutes(appSource);
  const routesByPath = new Map();
  for (const route of routes) {
    const group = routesByPath.get(route.path) ?? [];
    group.push(route);
    routesByPath.set(route.path, group);
  }

  for (const [path, declarations] of routesByPath) {
    if (declarations.length < 2) continue;
    issues.push(
      `App.tsx:${declarations.map((route) => route.line).join(",")}: duplicate route ${path} ` +
        `(${declarations.map((route) => route.component || route.kind).join(" vs ")})`,
    );
  }

  const withdrawn = routes.filter(
    (route) => route.kind === "component" && route.component === "ContentReviewNotice",
  );
  const primary = parsePrimaryNavigation(librarySource);

  for (const entry of primary.paths) {
    const match = withdrawn.find((route) => routePatternMatches(entry.path, route.path));
    if (!match) continue;
    issueOnce(
      issues,
      seenIssues,
      `primary:${entry.path}`,
      `library-ia.ts: PRIMARY_PATHS promotes withdrawn route ${entry.path} ` +
        `(App.tsx:${match.line})`,
    );
  }

  for (const entry of primary.prefixes) {
    const prefix = entry.path.endsWith("/") ? entry.path : `${entry.path}/`;
    const match = withdrawn.find((route) => {
      const parameter = route.path.indexOf(":");
      if (parameter < 0) return false;
      return route.path.slice(0, parameter).startsWith(prefix);
    });
    if (!match) continue;
    issueOnce(
      issues,
      seenIssues,
      `prefix:${entry.path}`,
      `library-ia.ts: PRIMARY_PREFIXES promotes withdrawn family ${match.path} ` +
        `(App.tsx:${match.line})`,
    );
  }

  const activeNavigation = [
    ...parseLobbyNavigation(lobbySource),
    ...parseCatalogueNavigation(catalogueSource),
  ];
  for (const entry of activeNavigation) {
    const match = withdrawn.find((route) => routePatternMatches(entry.path, route.path));
    if (!match) continue;
    issueOnce(
      issues,
      seenIssues,
      `active:${entry.source}:${entry.path}`,
      `${entry.source}:${entry.line}: active navigation ${entry.path} resolves to withdrawn ` +
        `${match.path} (App.tsx:${match.line})`,
    );
  }

  const redirects = parseRedirects(redirectsSource);
  for (const route of routes) {
    const edge = redirects.get(route.path);
    if (!edge) continue;
    const slashOnlyCanonicalisation =
      normalizedPath(edge.to) === normalizedPath(route.path) &&
      !edge.to.includes("?") &&
      !edge.to.includes("#");
    if (slashOnlyCanonicalisation) continue;

    if (!route.target) {
      issueOnce(
        issues,
        seenIssues,
        `shadow:${route.path}`,
        `route ownership conflict ${route.path}: App.tsx:${route.line} renders ` +
          `${route.component || route.kind}, but _redirects:${edge.line} sends cold loads to ${edge.to}`,
      );
      continue;
    }
    if (normalizedTarget(route.target) !== normalizedTarget(edge.to)) {
      issueOnce(
        issues,
        seenIssues,
        `redirect:${route.path}`,
        `route ownership conflict ${route.path}: App.tsx:${route.line} redirects to ` +
          `${route.target}, but _redirects:${edge.line} redirects to ${edge.to}`,
      );
    }
  }

  return {
    issues,
    counts: {
      routes: routes.length,
      primaryPaths: primary.paths.length,
      primaryPrefixes: primary.prefixes.length,
      activeNavigation: activeNavigation.length,
      exactRedirects: redirects.size,
      withdrawnRoutes: withdrawn.length,
    },
  };
}

function fixtures(overrides = {}) {
  return {
    appSource: [
      '<Route path="/ok" component={Working} />',
      '<Route path="/gone" component={ContentReviewNotice} />',
    ].join("\n"),
    librarySource:
      'export const PRIMARY_PATHS = new Set<string>(["/ok"]);\n' +
      'export const PRIMARY_PREFIXES: readonly string[] = ["/working/"];',
    catalogueSource: "export function buildDashboardCatalogue() { return []; }",
    lobbySource:
      'export const LOBBY_TABS = [{ path: "/ok" }];\n' +
      "export const LOBBY_ROUTES = [];",
    redirectsSource: "/ok  /ok/  308",
    ...overrides,
  };
}

function selftest() {
  assert.deepEqual(auditRouteTruth(fixtures()).issues, []);

  const duplicate = auditRouteTruth(
    fixtures({
      appSource:
        '<Route path="/same" component={One} />\n' +
        '<Route path="/same">{() => <Redirect to="/other" />}</Route>',
    }),
  ).issues;
  assert.ok(duplicate.some((issue) => issue.includes("duplicate route /same")));

  const primaryWithdrawn = auditRouteTruth(
    fixtures({
      librarySource:
        'export const PRIMARY_PATHS = new Set<string>(["/gone"]);\n' +
        "export const PRIMARY_PREFIXES: readonly string[] = [];",
    }),
  ).issues;
  assert.ok(primaryWithdrawn.some((issue) => issue.includes("promotes withdrawn route /gone")));

  const dynamicWithdrawn = auditRouteTruth(
    fixtures({
      appSource: '<Route path="/industries/:slug" component={ContentReviewNotice} />',
      librarySource:
        "export const PRIMARY_PATHS = new Set<string>([]);\n" +
        'export const PRIMARY_PREFIXES: readonly string[] = ["/industries/"];',
      catalogueSource:
        "function addIndustries(industry) {\n" +
        "  const path = `/industries/${industry.slug}`;\n" +
        "  return path;\n" +
        "}",
      lobbySource: "export const LOBBY_TABS = [];\nexport const LOBBY_ROUTES = [];",
    }),
  ).issues;
  assert.ok(dynamicWithdrawn.some((issue) => issue.includes("PRIMARY_PREFIXES")));
  assert.ok(dynamicWithdrawn.some((issue) => issue.includes("catalogue template")));

  const redirectMismatch = auditRouteTruth(
    fixtures({
      appSource: '<Route path="/alias">{() => <Redirect to="/one" />}</Route>',
      redirectsSource: "/alias  /two  308",
    }),
  ).issues;
  assert.ok(redirectMismatch.some((issue) => issue.includes("redirects to /one")));

  const shadowedComponent = auditRouteTruth(
    fixtures({
      appSource: '<Route path="/plugin" component={Tools} />',
      redirectsSource: "/plugin  /tools  308",
    }),
  ).issues;
  assert.ok(shadowedComponent.some((issue) => issue.includes("renders Tools")));

  console.log("route-surface-truth-gate selftest: PASS");
}

function main() {
  if (process.argv.includes("--selftest")) {
    selftest();
    return;
  }

  const result = auditRouteTruth({
    appSource: readFileSync(join(ROOT, "client/src/App.tsx"), "utf8"),
    librarySource: readFileSync(join(ROOT, "client/src/data/library-ia.ts"), "utf8"),
    catalogueSource: readFileSync(
      join(ROOT, "client/src/components/DashboardCataloguePane.tsx"),
      "utf8",
    ),
    lobbySource: readFileSync(join(ROOT, "client/src/components/lobby/tabs.ts"), "utf8"),
    redirectsSource: readFileSync(join(ROOT, "public/_redirects"), "utf8"),
  });

  if (result.issues.length) {
    console.error("route-surface-truth-gate: FAIL");
    for (const issue of result.issues) console.error(`  - ${issue}`);
    process.exit(1);
  }

  const counts = result.counts;
  console.log(
    "route-surface-truth-gate: PASS " +
      `(${counts.routes} routes, ${counts.activeNavigation} active navigation entries, ` +
      `${counts.exactRedirects} exact redirects, ${counts.withdrawnRoutes} withdrawn routes checked)`,
  );
}

main();
