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
import { dirname, join, relative, resolve } from "node:path";
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

export function auditJsonlEvidence(raw, label = "arena/rounds.jsonl") {
  const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  const issues = [];
  const controlOffsets = [];

  for (let offset = 0; offset < bytes.length; offset += 1) {
    const byte = bytes[offset];
    const allowedWhitespace = byte === 0x09 || byte === 0x0a || byte === 0x0d;
    if ((!allowedWhitespace && byte < 0x20) || byte === 0x7f) {
      controlOffsets.push(offset);
    }
  }
  if (controlOffsets.length) {
    issues.push(
      `${label}: ${controlOffsets.length} forbidden control byte(s); ` +
      `first at byte offset ${controlOffsets[0]}`,
    );
  }

  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    issues.push(`${label}: not valid UTF-8 (${error.message})`);
    return { issues, records: 0 };
  }

  const lines = text.split("\n");
  if (lines.at(-1) === "") lines.pop();
  if (!lines.length) issues.push(`${label}: no JSONL records`);

  let records = 0;
  let lineIssues = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const line = lines[index].endsWith("\r") ? lines[index].slice(0, -1) : lines[index];
    if (!line.trim()) {
      if (lineIssues < 5) issues.push(`${label}:${lineNumber}: blank JSONL record`);
      lineIssues += 1;
      continue;
    }
    try {
      const value = JSON.parse(line);
      if (value === null || typeof value !== "object" || Array.isArray(value)) {
        if (lineIssues < 5) issues.push(`${label}:${lineNumber}: record is not a JSON object`);
        lineIssues += 1;
        continue;
      }
      records += 1;
    } catch (error) {
      if (lineIssues < 5) issues.push(`${label}:${lineNumber}: invalid JSON (${error.message})`);
      lineIssues += 1;
    }
  }
  if (lineIssues > 5) issues.push(`${label}: ${lineIssues - 5} more invalid line(s)`);

  return { issues, records };
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

  assert.deepEqual(
    auditJsonlEvidence(Buffer.from('{"round":1}\n{"round":2}\n')).issues,
    [],
  );
  assert.ok(
    auditJsonlEvidence(Buffer.from('{"round":1}\n\0{"round":2}\n')).issues.some((issue) =>
      issue.includes("forbidden control byte"),
    ),
  );
  assert.ok(
    auditJsonlEvidence(Buffer.from('{"round":1}\nnot-json\n')).issues.some((issue) =>
      issue.includes(":2: invalid JSON"),
    ),
  );
  assert.ok(
    auditJsonlEvidence(Buffer.from('{"round":1}\n[]\n')).issues.some((issue) =>
      issue.includes(":2: record is not a JSON object"),
    ),
  );

  console.log("arena-route-truth-guard selftest: PASS");
}

function retiredHtmlFiles(publicDir) {
  const files = [];
  const standalone = join(publicDir, "arena.html");
  if (existsSync(standalone)) files.push("arena.html");

  const arenaDir = join(publicDir, "arena");
  if (existsSync(arenaDir)) {
    for (const name of readdirSync(arenaDir)) {
      if (name.endsWith(".html")) files.push(`arena/${name}`);
    }
  }
  return files.sort();
}

function argumentValue(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function main() {
  if (process.argv.includes("--selftest")) {
    selftest();
    return;
  }

  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const publicDir = resolve(root, argumentValue("--public-dir", "public"));
  const displayDir = relative(root, publicDir) || ".";
  const redirectsPath = join(publicDir, "_redirects");
  const artifacts = [
    "arena/east-west-market.json",
    "arena/elo_reference.json",
    "arena/rounds.jsonl",
  ];
  const issues = auditArenaRouteTruth({
    redirects: readFileSync(redirectsPath, "utf8"),
    retiredHtml: retiredHtmlFiles(publicDir),
  });
  for (const artifact of artifacts) {
    if (!existsSync(join(publicDir, artifact))) {
      issues.push(`${displayDir}/${artifact}: retained machine evidence asset is missing`);
    }
  }

  const roundsPath = join(publicDir, "arena/rounds.jsonl");
  let records = 0;
  if (existsSync(roundsPath)) {
    const audit = auditJsonlEvidence(readFileSync(roundsPath), `${displayDir}/arena/rounds.jsonl`);
    issues.push(...audit.issues);
    records = audit.records;
  }

  if (issues.length) {
    console.error("arena-route-truth-guard: FAIL");
    for (const issue of issues) console.error(`  - ${issue}`);
    process.exit(1);
  }

  console.log(
    `arena-route-truth-guard: PASS (${RETIRED_ARENA_ROUTES.length} human routes converge; ` +
    `${records} JSONL evidence records valid in ${displayDir})`,
  );
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) main();
