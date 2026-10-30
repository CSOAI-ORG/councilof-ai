#!/usr/bin/env node
// node-test-registry.mjs — fail when a node:test file is reachable by vitest but
// named in neither of the two lists that are supposed to account for it.
//
// WHY. The estate runs vitest over an explicit set of paths and node --test over an
// explicit list. A file written for node:test that is in NEITHER list is collected by
// vitest, which cannot run it, and vitest reports it as a FAILED SUITE — "No test
// suite found in file ..." — even when every test in it passes. Two pull requests were
// red on exactly this on 28 October 2026: #3570
// (scripts/review/pages-bind-missing-namespaces.test.mjs) and #3573
// (scripts/probe-zenodo-status.test.mjs). Each cost a full CI cycle, and the failure
// message reads like a broken test rather than a missing registration.
//
// The registry is maintained BY HAND in vitest.config.ts. A hand-maintained list is only
// as good as the next person remembering it. This script reads that list AND vitest's
// own exclude list out of the same file, so the two cannot disagree, and fails when a
// node:test file is reachable by vitest and is named in neither.
//
// It also fails when a path named in NODE_TEST_FILES does not exist: pr-gates.yml runs
// `node --test $files` over exactly that list, so a deleted or renamed entry breaks the
// step with a message about a missing file rather than about the registry.
//
// WHAT "REACHABLE BY VITEST" MEANS, AND WHY IT IS COMPUTED RATHER THAN ASSUMED.
// vitest.config.ts sets no `include`, so vitest's default include applies
// (**/*.{test,spec}.?(c|m)[jt]s?(x)) — the whole tree, not a set of roots. What narrows
// it is the path filters the workflows pass on the command line. vitest matches a
// filter as a CASE-INSENSITIVE SUBSTRING of the test file's path relative to the
// project root (vitest's own filterFiles(): testFile.includes(f.toLocaleLowerCase())).
// So `npx vitest run scripts` collects scripts/**, and `npx vitest run
// council-os/compose.lock.test.ts` collects that one file.
//
// The filters are therefore read out of the workflow files themselves rather than
// hard-coded here, so a workflow that starts collecting a new path is picked up
// automatically instead of silently escaping the check.
//
//   node scripts/node-test-registry.mjs            real check
//   node scripts/node-test-registry.mjs --selftest  prove it can fail
//
// No external deps (native fs walk). The selftest builds its own fixture, so it does
// not depend on any particular file existing in this branch.

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.dirname(HERE);
const CONFIG = path.join(REPO, "vitest.config.ts");
const WORKFLOW_DIR = path.join(REPO, ".github", "workflows");

// vitest's default `include`, verbatim from vitest's own defaults:
//   ['**/*.{test,spec}.?(c|m)[jt]s?(x)']
// Expressed as a regex because vitest's include uses picomatch's ?( ) and { } syntax.
const INCLUDE_RE = /(?:.*\/)?[^/]*\.(?:test|spec)\.(?:[cm])?[jt]s(?:x)?$/;

// vitest's defaultExclude, verbatim from vitest's own defaults. vitest.config.ts
// spreads `...defaultExclude` into its own exclude list, so these are always in force
// in addition to whatever the repo adds.
const DEFAULT_EXCLUDE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/cypress/**",
  "**/.{idea,git,cache,output,temp}/**",
  "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",
];

// Directories that are never walked. `node_modules` and `dist` are in vitest's own
// defaultExclude; the rest are build or VCS noise.
const IGNORE_DIRS = new Set([
  "node_modules", ".next", "dist", ".git", "coverage", "__pycache__",
  ".venv", "venv", ".pytest_cache", ".turbo", ".cache",
]);

// A file that imports node:test is a node:test file. This is the same signal the
// estate's own config comment describes: `import { test } from "node:test"`.
const NODE_TEST_RE = /from\s+['"]node:test['"]|require\(['"]node:test['"]\)/;

/** Read the two lists out of vitest.config.ts. */
export function readConfig(text) {
  const nodeTestFiles = new Set();
  const excludes = [...DEFAULT_EXCLUDE];

  const ntMatch = text.match(/export const NODE_TEST_FILES\s*=\s*\[([\s\S]*?)\]/);
  if (ntMatch) {
    for (const m of ntMatch[1].matchAll(/'([^']+)'/g)) nodeTestFiles.add(m[1]);
  }
  const exMatch = text.match(/exclude\s*:\s*\[\.\.\.defaultExclude\s*,\s*([\s\S]*?)\]/);
  if (exMatch) {
    for (const m of exMatch[1].matchAll(/'([^']+)'/g)) excludes.push(m[1]);
  }
  return { nodeTestFiles, excludes };
}

/**
 * A small glob matcher for the pattern syntax vitest's exclude list actually uses:
 * `**`, `*`, `?`, and `{a,b}` alternatives. It is deliberately small — the exclude
 * list is a closed set of patterns, not a general glob language.
 */
export function globToRegExp(pattern) {
  let out = "";
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === "*") {
      if (pattern[i + 1] === "*") {
        if (pattern[i + 2] === "/") {
          out += "(?:.*/)?";
          i += 3;
        } else {
          out += ".*";
          i += 2;
        }
      } else {
        out += "[^/]*";
        i += 1;
      }
    } else if (ch === "?") {
      out += "[^/]";
      i += 1;
    } else if (ch === "{") {
      const close = pattern.indexOf("}", i);
      if (close !== -1) {
        const alts = pattern.slice(i + 1, close).split(",");
        out += "(?:" + alts.map((a) => a.replace(/[\\^$.|+()[\]{}]/g, "\\$&")).join("|") + ")";
        i = close + 1;
      } else {
        out += "\\{";
        i += 1;
      }
    } else if ("\\^$.|+()[]{}".includes(ch)) {
      out += "\\" + ch;
      i += 1;
    } else {
      out += ch;
      i += 1;
    }
  }
  return new RegExp("^" + out + "$");
}

export function isExcluded(relPath, excludes) {
  return excludes.some((pattern) => globToRegExp(pattern).test(relPath));
}

/**
 * The path filters the workflows pass to vitest, read out of the workflow files.
 * Handles YAML block scalars (`run: >-` and friends), where the command and its
 * arguments are split across lines.
 */
export function extractVitestFilters(workflowText) {
  const filters = new Set();
  const lines = workflowText.split("\n");

  // Flatten YAML block scalars: a `run:` whose value starts with `>` or `|` continues
  // on the following, more-indented lines.
  const flat = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const blockStart = line.match(/^(\s*)run:\s*[>|]/);
    if (blockStart) {
      const indent = blockStart[1].length;
      const parts = [line.replace(/^(\s*)run:\s*[>|]-?\s*/, "")];
      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j];
        if (next.trim() === "") { j += 1; continue; }
        const nextIndent = next.length - next.trimStart().length;
        if (nextIndent <= indent) break;
        parts.push(next.trim());
        j += 1;
      }
      flat.push(parts.join(" "));
      i = j - 1;
      continue;
    }
    flat.push(line);
  }

  for (const line of flat) {
    const m = line.match(/vitest\s+run\b(.*)$/);
    if (!m) continue;
    for (const token of m[1].split(/\s+/)) {
      if (!token) continue;
      if (token.startsWith("-")) continue; // a flag, not a path filter
      filters.add(token.replace(/^["']|["']$/g, ""));
    }
  }
  return [...filters];
}

/** Every path filter any workflow passes to vitest. */
export function collectWorkflowFilters(repo) {
  let dirents;
  try {
    dirents = fs.readdirSync(WORKFLOW_DIR, { withFileTypes: true });
  } catch {
    return [];
  }
  const filters = new Set();
  for (const ent of dirents) {
    if (!ent.isFile()) continue;
    if (!/\.(yml|yaml)$/.test(ent.name)) continue;
    const text = fs.readFileSync(path.join(WORKFLOW_DIR, ent.name), "utf8");
    for (const f of extractVitestFilters(text)) filters.add(f);
  }
  return [...filters];
}

/** vitest's own rule: a filter matches a file when its lowercased path contains the filter. */
export function isCollected(relPath, filters) {
  const lower = relPath.toLocaleLowerCase();
  return filters.some((f) => lower.includes(f.toLocaleLowerCase()));
}

/** Every file under the repo that vitest's include would pick up. */
export function collectCandidates(repo) {
  const found = [];
  const walk = (rel) => {
    const abs = path.join(repo, rel);
    let ents;
    try {
      ents = fs.readdirSync(abs, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of ents) {
      if (ent.name.startsWith(".") && ent.name !== ".well-known") continue;
      if (IGNORE_DIRS.has(ent.name)) continue;
      const child = rel ? `${rel}/${ent.name}` : ent.name;
      if (ent.isDirectory()) walk(child);
      else if (INCLUDE_RE.test(ent.name)) found.push(child);
    }
  };
  walk("");
  return found;
}

/** The files that are node:test files but are named in neither list. */
export function findViolations(repo, nodeTestFiles, excludes, filters) {
  const violations = [];
  for (const rel of collectCandidates(repo)) {
    if (isExcluded(rel, excludes)) continue;
    if (nodeTestFiles.has(rel)) continue;
    if (filters && filters.length && !isCollected(rel, filters)) continue;
    let body = "";
    try {
      body = fs.readFileSync(path.join(repo, rel), "utf8").slice(0, 4000);
    } catch {
      continue;
    }
    if (!NODE_TEST_RE.test(body)) continue;
    violations.push(rel);
  }
  return violations;
}

/** Paths named in NODE_TEST_FILES that are not on disk. */
export function findMissingEntries(repo, nodeTestFiles) {
  const missing = [];
  for (const rel of nodeTestFiles) {
    if (!fs.existsSync(path.join(repo, rel))) missing.push(rel);
  }
  return missing;
}

function runCheck() {
  const text = fs.readFileSync(CONFIG, "utf8");
  const { nodeTestFiles, excludes } = readConfig(text);
  const filters = collectWorkflowFilters(REPO);
  const problems = [];

  if (!filters.length) {
    // No vitest invocation found in any workflow: the check cannot say what is
    // collectable, and a check that cannot say anything must not report success.
    problems.push(
      "no `vitest run` invocation was found in .github/workflows/, so the collectable set\n" +
        "cannot be determined. This is a failure of the check itself, not of the registry."
    );
  }

  const violations = findViolations(REPO, nodeTestFiles, excludes, filters);
  if (violations.length) {
    problems.push(
      `${violations.length} node:test file(s) are reachable by vitest but are named in neither ` +
        `vitest.config.ts NODE_TEST_FILES nor its exclude list:\n` +
        violations.map((v) => `  ${v}`).join("\n")
    );
  }

  const missing = findMissingEntries(REPO, nodeTestFiles);
  if (missing.length) {
    problems.push(
      `${missing.length} path(s) named in NODE_TEST_FILES do not exist:\n` +
        missing.map((m) => `  ${m}`).join("\n")
    );
  }

  if (problems.length) {
    console.error("node-test-registry: FAIL");
    for (const p of problems) console.error(`\n${p}\n`);
    console.error(
      "vitest cannot collect a node:test file and reports it as a FAILED SUITE\n" +
        '("No test suite found in file ..."), even when every test in it passes.\n'
    );
    console.error(
      "Fix: add the path to NODE_TEST_FILES in vitest.config.ts. pr-gates.yml\n" +
        "reads that same list and runs it under `node --test`, so naming it there\n" +
        "both removes it from vitest and keeps it covered."
    );
    return 1;
  }
  console.log(
    `node-test-registry: PASS (${nodeTestFiles.size} registered, ${violations.length} violations, ` +
      `${missing.length} missing, ${filters.length} vitest path filter(s))`
  );
  return 0;
}

/**
 * The selftest builds its own fixture on disk, so it proves the instrument works
 * without depending on any particular file existing in this branch.
 */
function selftest() {
  const failures = [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "node-test-registry-"));

  try {
    // --- the fixture ------------------------------------------------------
    fs.mkdirSync(path.join(tmp, "scripts", "review"), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, "scripts", "sample.test.mjs"),
      "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\n" +
        "test('a', () => { assert.equal(1, 1); });\n"
    );
    fs.writeFileSync(
      path.join(tmp, "scripts", "plain.test.mjs"),
      "import { describe, it, expect } from 'vitest';\n" +
        "describe('a', () => { it('b', () => { expect(1).toBe(1); }); });\n"
    );
    fs.writeFileSync(
      path.join(tmp, "scripts", "review", "nested.test.mjs"),
      "const { test } = require('node:test');\ntest('a', () => {});\n"
    );
    fs.writeFileSync(
      path.join(tmp, "scripts", "helper.test.mjs.txt"),
      "import { test } from 'node:test';\n"
    );

    // 1. An unregistered node:test file in a collected path IS a violation, and a
    //    vitest-style file is not, and a nested one is found too.
    let v = findViolations(tmp, new Set(), [], ["scripts"]);
    const want = ["scripts/sample.test.mjs", "scripts/review/nested.test.mjs"];
    for (const p of want) {
      if (!v.includes(p)) failures.push(`expected ${p} to be a violation, got ${JSON.stringify(v)}`);
    }
    if (v.includes("scripts/plain.test.mjs")) {
      failures.push("a vitest-style file was reported as a node:test violation");
    }
    if (v.includes("scripts/helper.test.mjs.txt")) {
      failures.push("a file that does not match vitest's include was collected");
    }

    // 2. Naming it in NODE_TEST_FILES clears it.
    v = findViolations(tmp, new Set(["scripts/sample.test.mjs", "scripts/review/nested.test.mjs"]), [], ["scripts"]);
    if (v.includes("scripts/sample.test.mjs")) {
      failures.push("registering the file in NODE_TEST_FILES did not clear the violation");
    }

    // 3. Excluding it clears it too.
    v = findViolations(tmp, new Set(), ["scripts/sample.test.mjs"], ["scripts"]);
    if (v.includes("scripts/sample.test.mjs")) {
      failures.push("excluding the file did not clear the violation");
    }

    // 4. A file outside every path filter is not collected, so it cannot fail vitest.
    v = findViolations(tmp, new Set(), [], ["client/src"]);
    if (v.length !== 0) {
      failures.push(`a file outside the vitest path filters was reported: ${JSON.stringify(v)}`);
    }

    // 5. The path filter is a case-insensitive substring of the path, as vitest's own
    //    filterFiles() is: testFile.includes(f.toLocaleLowerCase()).
    if (!isCollected("scripts/Surface/Deep.test.mjs", ["surface"])) {
      failures.push("isCollected did not match a path by substring");
    }
    if (isCollected("scripts/deep.test.mjs", ["surface"])) {
      failures.push("isCollected matched a path that does not contain the filter");
    }

    // 6. The glob matcher handles the patterns vitest's exclude list uses.
    const cases = [
      ["packages/**", "packages/gspc-cli/test/check.test.mjs", true],
      ["packages/**", "scripts/x.test.mjs", false],
      ["docs/**/*.test.mjs", "docs/incidents/register.test.mjs", true],
      ["docs/**/*.test.mjs", "docs/register.test.mjs", true],
      ["docs/**/*.test.mjs", "docs/notes.md", false],
      ["**/dist/**", "packages/a/dist/x.test.mjs", true],
      ["e2e/**", "e2e/tests/dashboard-shell.spec.ts", true],
      ["council-os/planned-ready.lock.test.mjs", "council-os/planned-ready.lock.test.mjs", true],
      ["**/.{idea,git,cache,output,temp}/**", "x/.git/config.test.mjs", true],
      ["**/{karma,rollup,vite}.config.*", "vite.config.test.mjs", true],
      ["**/{karma,rollup,vite}.config.*", "other.config.test.mjs", false],
    ];
    for (const [pattern, candidate, expected] of cases) {
      const got = isExcluded(candidate, [pattern]);
      if (got !== expected) {
        failures.push(`glob ${pattern} against ${candidate}: expected ${expected}, got ${got}`);
      }
    }

    // 7. The path filters are read out of the workflow files, including a YAML
    //    block scalar where the command and its arguments are on separate lines.
    const wf = [
      "jobs:",
      "  a:",
      "    steps:",
      "      - name: one",
      "        run: npx vitest run client/src functions scripts",
      "      - name: two",
      "        run: >-",
      "          npm exec -- vitest run",
      "          functions/api/a2a.test.ts",
      "          functions/api/agent-card-jws.test.ts",
      "      - name: three",
      "        run: npx vitest run council-os --maxWorkers=1",
    ].join("\n");
    const got = extractVitestFilters(wf).sort();
    // Each CLI argument is its own filter, exactly as vitest treats them: a filter
    // matches when the file's path CONTAINS it.
    const expectedFilters = [
      "client/src", "council-os", "functions", "functions/api/a2a.test.ts",
      "functions/api/agent-card-jws.test.ts", "scripts",
    ].sort();
    if (JSON.stringify(got) !== JSON.stringify(expectedFilters)) {
      failures.push(`workflow filters: expected ${JSON.stringify(expectedFilters)}, got ${JSON.stringify(got)}`);
    }

    // 8. A missing NODE_TEST_FILES entry is reported, and an existing one is not.
    const missing = findMissingEntries(tmp, new Set(["scripts/sample.test.mjs", "scripts/gone.test.mjs"]));
    if (missing.length !== 1 || missing[0] !== "scripts/gone.test.mjs") {
      failures.push(`expected exactly scripts/gone.test.mjs to be missing, got ${JSON.stringify(missing)}`);
    }

    // 9. This repository's own config parses, and both lists come out of it.
    const { nodeTestFiles, excludes } = readConfig(fs.readFileSync(CONFIG, "utf8"));
    if (nodeTestFiles.size === 0) failures.push("NODE_TEST_FILES parsed as empty");
    if (!excludes.includes("packages/**")) failures.push("the exclude list did not parse");
    if (!excludes.includes("**/node_modules/**")) failures.push("the default exclude list is missing");

    // 10. This repository's own workflows yield at least one path filter.
    const repoFilters = collectWorkflowFilters(REPO);
    if (!repoFilters.length) failures.push("no vitest path filter was found in .github/workflows/");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  if (failures.length) {
    console.error("node-test-registry --selftest FAILED:");
    for (const f of failures) console.error(`  - ${f}`);
    return 1;
  }
  console.log("node-test-registry --selftest: PASS");
  return 0;
}

const selftestMode = process.argv.includes("--selftest");
process.exit(selftestMode ? selftest() : runCheck());
