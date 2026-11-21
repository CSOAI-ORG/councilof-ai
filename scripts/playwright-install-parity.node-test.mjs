// A workflow must install the Playwright that package-lock.json pins, and only that one.
//
// From 18 to 20 November 2026 Claims E2E and Sov Stack E2E stopped at chromium.launch() on every
// run, before either checked anything. #4429 had moved the lockfile to Playwright 1.65.1, and both
// workflows still ran `npm i -D playwright@1.61.1` in the checkout. That left two copies: the
// `npx playwright install` CLI was the locked 1.65.1 and downloaded Chromium build 1255, while
// `require("playwright")` loaded the root 1.61.1, which launches build 1228. Nothing downloaded
// build 1228. Neither workflow runs on a pull request, so the split could only show after merge,
// and Claims E2E was already red for another reason, so it was not seen then either.
//
// This suite runs in the required gates job (scripts/ and package-lock.json are gated paths), so
// a lockfile bump that leaves a workflow's own pin behind fails on its own pull request.
// No network, no browser, no dependencies: node --test scripts/playwright-install-parity.node-test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (rel) => readFileSync(new URL(rel, root), "utf8");
const lock = JSON.parse(read("package-lock.json"));
const workflows = readdirSync(new URL(".github/workflows/", root))
  .filter((name) => /\.ya?ml$/.test(name))
  .sort();

const PACKAGES = ["playwright", "playwright-core", "@playwright/test"];
const PACKAGE_ARG = /^(@playwright\/test|playwright-core|playwright)(?:@(.+))?$/;
const NPM_INSTALL = /\bnpm\s+(?:-\S+\s+)*(?:i|install|add)(?:\s|$)/;

/** The version package-lock.json hoists to the checkout root, by package name. */
function lockedVersions(lockfile) {
  return Object.fromEntries(PACKAGES.map((name) => [name, lockfile.packages?.[`node_modules/${name}`]?.version]));
}

/**
 * A lockfile with two versions of `playwright` lets `.bin/playwright` (claimed by both
 * `playwright` and `@playwright/test`) run one copy while `require("playwright")` loads the other.
 */
function lockCopyProblems(lockfile) {
  const copies = Object.entries(lockfile.packages || {})
    .filter(([path]) => path === "node_modules/playwright" || path.endsWith("/node_modules/playwright"))
    .map(([path, meta]) => ({ path, version: meta.version }));
  const locked = lockedVersions(lockfile);
  const problems = [];
  if (!locked.playwright) problems.push("playwright is not at node_modules/playwright, where require(\"playwright\") looks");
  if (new Set(copies.map((copy) => copy.version)).size > 1) {
    problems.push(`more than one playwright: ${copies.map((copy) => `${copy.version} at ${copy.path}`).join("; ")}`);
  }
  if (locked.playwright && locked["@playwright/test"] && locked["@playwright/test"] !== locked.playwright) {
    problems.push(`@playwright/test ${locked["@playwright/test"]} and playwright ${locked.playwright} differ, so .bin/playwright may be either`);
  }
  return problems;
}

/** Shell lines with `\` continuations joined, each numbered by the line it starts on. */
function logicalLines(text) {
  const out = [];
  let buffer = "";
  let start = 0;
  text.split(/\r?\n/).forEach((line, index) => {
    if (!buffer) start = index + 1;
    if (/\\\s*$/.test(line)) {
      buffer += line.replace(/\\\s*$/, " ");
      return;
    }
    out.push({ line: start, text: buffer + line });
    buffer = "";
  });
  if (buffer) out.push({ line: start, text: buffer });
  return out;
}

/**
 * Playwright installs in one workflow that would not leave the checkout with the lockfile's copy:
 * an npm install that names a Playwright package at another version, at a range or at no version
 * (npm would pick the newest), or an npx run of a versioned Playwright CLI. Comment lines are
 * skipped. An install with --prefix builds a separate tree that must run its own CLI, so it is not
 * compared with the checkout's lockfile.
 */
function installDrift(text, locked) {
  const findings = [];
  for (const { line, text: raw } of logicalLines(text)) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    for (const command of trimmed.split(/&&|\|\||;|\|/)) {
      if (/--prefix\b/.test(command)) continue;
      const npmInstall = NPM_INSTALL.test(command);
      if (!npmInstall && !/\bnpx\s/.test(command)) continue;
      for (const word of command.trim().split(/\s+/)) {
        const match = PACKAGE_ARG.exec(word.replace(/^["']+|["']+$/g, ""));
        if (!match) continue;
        const [, name, version] = match;
        if (!npmInstall && version === undefined) continue; // `npx playwright ...` runs the checkout's own CLI
        if (version !== locked[name]) findings.push({ line, name, version: version ?? "(no version)", locked: locked[name] });
      }
    }
  }
  return findings;
}

/** One step of a workflow, as the lines under its `- name:` line. */
function stepLines(text, name) {
  const lines = text.split(/\r?\n/);
  const at = lines.findIndex((line) => line.trim() === `- name: ${name}`);
  if (at < 0) return null;
  const indent = lines[at].indexOf("-");
  const body = [];
  for (const line of lines.slice(at + 1)) {
    if (line.trim() && line.search(/\S/) <= indent) break;
    body.push(line);
  }
  return body;
}

/** Why a step would not install exactly the lockfile's Playwright before fetching its browser. */
function lockfileInstallProblems(step) {
  if (!step) return ["there is no \"Install Playwright (chromium)\" step"];
  const commands = step.map((line) => line.trim()).filter((line) => line && !line.startsWith("#"));
  const ci = commands.findIndex((line) => /^npm ci(?:\s|$)/.test(line));
  const browser = commands.findIndex((line) => /^npx playwright install(?:\s|$)/.test(line));
  const problems = [];
  if (ci < 0) problems.push("it does not run npm ci, so the checkout's Playwright is not the lockfile's");
  if (browser < 0) problems.push("it does not run npx playwright install");
  if (ci >= 0 && browser >= 0 && browser < ci) problems.push("it runs npx playwright install before npm ci");
  for (const line of commands) {
    if (NPM_INSTALL.test(line)) problems.push(`it installs a package of its own: ${line}`);
  }
  return problems;
}

test("package-lock.json holds one playwright, at the root, with @playwright/test at the same version", () => {
  assert.deepEqual(lockCopyProblems(lock), []);
});

test("no workflow installs a Playwright into the checkout other than the lockfile's", () => {
  const locked = lockedVersions(lock);
  const drift = workflows.flatMap((name) =>
    installDrift(read(`.github/workflows/${name}`), locked).map(
      (f) => `${name}:${f.line} installs ${f.name}@${f.version}; package-lock.json has ${f.locked}`,
    ));
  assert.deepEqual(drift, []);
});

test("Claims E2E installs the lockfile, and nothing beside it, before it fetches the browser", () => {
  const step = stepLines(read(".github/workflows/claims-e2e.yml"), "Install Playwright (chromium)");
  assert.deepEqual(lockfileInstallProblems(step), []);
});

// Negative controls: each check above must be able to fail.
const LOCKED = { playwright: "1.65.1", "playwright-core": "1.65.1", "@playwright/test": "1.65.1" };
const STEP_18_NOV = [
  "    steps:",
  "      - name: Install Playwright (chromium)",
  "        run: |",
  "          npm init -y >/dev/null 2>&1 || true",
  "          npm i -D playwright@1.61.1 >/dev/null 2>&1",
  "          npx playwright install --with-deps chromium",
  "      - name: Run claims verification against live site + brain",
  "        run: node scripts/claims-e2e.mjs",
].join("\n");

test("the 18 November step fails both workflow checks", () => {
  assert.deepEqual(installDrift(STEP_18_NOV, LOCKED), [{ line: 5, name: "playwright", version: "1.61.1", locked: "1.65.1" }]);
  assert.deepEqual(lockfileInstallProblems(stepLines(STEP_18_NOV, "Install Playwright (chromium)")), [
    "it does not run npm ci, so the checkout's Playwright is not the lockfile's",
    "it installs a package of its own: npm i -D playwright@1.61.1 >/dev/null 2>&1",
  ]);
  // A pin that equals the lockfile today (master after #4441) is still a second install that
  // the next lockfile bump leaves behind, so the Claims step check rejects it too.
  assert.deepEqual(lockfileInstallProblems(stepLines(STEP_18_NOV.replace("1.61.1", "1.65.1"), "Install Playwright (chromium)")), [
    "it does not run npm ci, so the checkout's Playwright is not the lockfile's",
    "it installs a package of its own: npm i -D playwright@1.65.1 >/dev/null 2>&1",
  ]);
  assert.deepEqual(lockfileInstallProblems(stepLines(STEP_18_NOV, "Install Playwright")), ["there is no \"Install Playwright (chromium)\" step"]);
  const reversed = ["- name: Install Playwright (chromium)", "  run: |", "    npx playwright install --with-deps chromium", "    npm ci"].join("\n");
  assert.deepEqual(lockfileInstallProblems(stepLines(reversed, "Install Playwright (chromium)")), ["it runs npx playwright install before npm ci"]);
});

test("other ways to install a second Playwright are caught", () => {
  const drift = (text) => installDrift(text, LOCKED).map((f) => `${f.name}@${f.version}`);
  assert.deepEqual(drift("npx -y playwright@1.60.0 install chromium"), ["playwright@1.60.0"]);
  assert.deepEqual(drift("npm install --save-dev @playwright/test"), ["@playwright/test@(no version)"]);
  assert.deepEqual(drift("npm i -D playwright@^1.65.1"), ["playwright@^1.65.1"]);
  assert.deepEqual(drift("npm i -D 'playwright-core@1.50.0'"), ["playwright-core@1.50.0"]);
  assert.deepEqual(installDrift("npm install \\\n  playwright@1.0.0", LOCKED).map((f) => f.line), [1]);
});

test("installs that leave the checkout with the lockfile's copy are not reported", () => {
  for (const text of [
    "# npm i -D playwright@1.61.1",
    "npx playwright install --with-deps chromium",
    "npx --no-install playwright install --with-deps chromium",
    "npm ci --ignore-scripts --no-audit --no-fund && npx playwright install --with-deps chromium",
    "npm install && npx playwright test --config e2e/playwright.config.ts",
    "npm install --prefix /tmp/rehearsal-tests --ignore-scripts jsdom@26.1.0 @playwright/test@1.57.0",
    "npm i -D playwright@1.65.1",
  ]) {
    assert.deepEqual(installDrift(text, LOCKED), [], text);
  }
});

test("a lockfile with a second playwright is reported", () => {
  const split = {
    packages: {
      "node_modules/playwright": { version: "1.61.1" },
      "node_modules/@playwright/test": { version: "1.65.1" },
      "node_modules/@playwright/test/node_modules/playwright": { version: "1.65.1" },
    },
  };
  assert.deepEqual(lockCopyProblems(split), [
    "more than one playwright: 1.61.1 at node_modules/playwright; 1.65.1 at node_modules/@playwright/test/node_modules/playwright",
    "@playwright/test 1.65.1 and playwright 1.61.1 differ, so .bin/playwright may be either",
  ]);
  assert.deepEqual(lockCopyProblems({ packages: { "node_modules/@playwright/test": { version: "1.65.1" } } }), [
    "playwright is not at node_modules/playwright, where require(\"playwright\") looks",
  ]);
});
