#!/usr/bin/env node

/**
 * Keep the retired hand-authored arena UI from reappearing beside Council OS.
 *
 * The machine-readable arena evidence remains at /arena/*.json{,l}. Only the
 * old human HTML routes move: every spelling resolves to the canonical play
 * pane, and no broad redirect is allowed to swallow evidence assets.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const CANONICAL_ARENA_ROUTE = "/dashboard?tab=play";
export const RETIRED_ARENA_AXES = [
  "governance",
  "safety",
  "conformance",
  "continuity",
  "openness",
  "provenance",
];

export const RETIRED_ARENA_ROUTES = [
  "/arena",
  "/arena/",
  "/arena.html",
  "/arena/index.html",
  ...RETIRED_ARENA_AXES.flatMap((axis) => [
    `/arena/${axis}`,
    `/arena/${axis}/`,
    `/arena/${axis}.html`,
  ]),
];

function firstRedirects(source) {
  const rules = new Map();
  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [from, to, status, ...rest] = line.split(/\s+/);
    if (!from || !to || !status || rest.length) continue;
    if (!rules.has(from)) rules.set(from, { to, status });
  }
  return rules;
}

export function auditArenaRouteTruth({ redirects, retiredHtml = [] }) {
  const issues = [];
  const rules = firstRedirects(redirects);

  for (const route of RETIRED_ARENA_ROUTES) {
    const rule = rules.get(route);
    if (!rule) {
      issues.push(`${route}: missing exact retirement redirect`);
      continue;
    }
    if (rule.to !== CANONICAL_ARENA_ROUTE || rule.status !== "308") {
      issues.push(
        `${route}: expected 308 to ${CANONICAL_ARENA_ROUTE}, got ${rule.status} to ${rule.to}`,
      );
    }
  }

  if (rules.has("/arena/*")) {
    issues.push(
      "/arena/*: broad arena rule is forbidden because it can hide JSON/JSONL evidence assets",
    );
  }

  for (const path of retiredHtml) {
    issues.push(`${path}: retired standalone arena HTML must not ship`);
  }

  return issues;
}

function expectedRedirectFixture() {
  return RETIRED_ARENA_ROUTES
    .map((route) => `${route}  ${CANONICAL_ARENA_ROUTE}  308`)
    .join("\n");
}

function selftest() {
  const safe = expectedRedirectFixture();
  assert.deepEqual(auditArenaRouteTruth({ redirects: safe }), []);

  const missing = safe
    .split("\n")
    .filter((line) => !line.startsWith("/arena/continuity.html "))
    .join("\n");
  assert.ok(
    auditArenaRouteTruth({ redirects: missing }).some((issue) =>
      issue.startsWith("/arena/continuity.html: missing"),
    ),
  );

  const wrongDestination = safe.replace(
    `/arena  ${CANONICAL_ARENA_ROUTE}  308`,
    "/arena  /arena/  308",
  );
  assert.ok(
    auditArenaRouteTruth({ redirects: wrongDestination }).some((issue) =>
      issue.startsWith("/arena: expected 308"),
    ),
  );

  assert.ok(
    auditArenaRouteTruth({
      redirects: `${safe}\n/arena/*  /arena/:splat  200`,
    }).some((issue) => issue.startsWith("/arena/*:")),
  );

  assert.ok(
    auditArenaRouteTruth({
      redirects: safe,
      retiredHtml: ["public/arena/index.html"],
    }).some((issue) => issue.includes("retired standalone arena HTML")),
  );

  console.log("arena-route-truth-guard selftest: PASS");
}

function retiredHtmlFiles(root) {
  const files = [];
  const standalone = join(root, "public/arena.html");
  if (existsSync(standalone)) files.push("public/arena.html");

  const arenaDir = join(root, "public/arena");
  if (existsSync(arenaDir)) {
    for (const name of readdirSync(arenaDir)) {
      if (name.endsWith(".html")) files.push(`public/arena/${name}`);
    }
  }
  return files.sort();
}

function main() {
  if (process.argv.includes("--selftest")) {
    selftest();
    return;
  }

  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const redirectsPath = join(root, "public/_redirects");
  const artifacts = [
    "public/arena/east-west-market.json",
    "public/arena/elo_reference.json",
    "public/arena/rounds.jsonl",
  ];
  const issues = auditArenaRouteTruth({
    redirects: readFileSync(redirectsPath, "utf8"),
    retiredHtml: retiredHtmlFiles(root),
  });
  for (const artifact of artifacts) {
    if (!existsSync(join(root, artifact))) {
      issues.push(`${artifact}: retained machine evidence asset is missing`);
    }
  }

  if (issues.length) {
    console.error("arena-route-truth-guard: FAIL");
    for (const issue of issues) console.error(`  - ${issue}`);
    process.exit(1);
  }

  console.log(
    `arena-route-truth-guard: PASS (${RETIRED_ARENA_ROUTES.length} human routes converge; machine evidence retained)`,
  );
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) main();
