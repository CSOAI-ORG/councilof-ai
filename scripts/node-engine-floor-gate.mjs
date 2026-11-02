#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// node-engine-floor-gate — fail if source uses a runtime API newer than the DECLARED engine floor.
//
// WHY THIS EXISTS (2026-11-02). The estate declares engines.node >= 20.0.0 in package.json, and
// the CI runs its vitest step on Node 20. Nothing enforced the floor. On 2026-11-02 a door-contract
// test was rewritten to read `new Set(a).intersection(new Set(b))` — a Set method that shipped in
// Node 22. It passed on the author's machine (Node 22), passed the whole local battery (Node 22),
// and failed in CI (Node 20) with `TypeError: (intermediate value).intersection is not a function`.
// The green local run was not evidence: the local runtime and the gate runtime were different
// programs.
//
// This gate reads the floor instead of typing it. The floor is the LOWEST engines.node that
// applies to the file being read — the nearest ancestor package.json that declares one, else the
// root's. Raising a package's floor is GROWTH: the rules above that floor go inert on their own,
// and nothing here has to be edited to allow it.
//
// A RULE ONLY FIRES IF IT IS NEWER THAN THE FLOOR. A file under packages/gspc-cli (floor 18) is
// not judged by Node 20 rules.
//
// Usage:
//   node scripts/node-engine-floor-gate.mjs [--selftest]
//   node scripts/node-engine-floor-gate.mjs [file ...]      (default: the scanned source roots)
// Exit: 0 clean · 1 an API above the floor · 2 UNCHECKABLE (no readable floor, or nothing scanned)
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SELF = resolve(REPO, "scripts/node-engine-floor-gate.mjs");

/** The source roots that RUN ON NODE. public/ and spaces/ are browser/published output: the Node
 *  floor does not apply to them, and a browser bundle is not a Node program.
 *  client/src IS in scope even though it is browser code: the vitest step runs it under Node 20,
 *  so an API above the floor breaks the SUITE even when the browser would have run it fine. */
const SCAN_ROOTS = [
  "client/src",
  "functions",
  "scripts",
  "mcp",
  "council-os",
  "capabilities",
  "integrations",
  "tests",
  "actions",
  "packages",
  "api-server",
  "distribution/npm",
];
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", ".next"]);
const JS_EXT = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx"]);

/**
 * The rules. Each names an API that arrived in a given Node, and how it is SPOTTED.
 *
 * `static`  — a global call. Nothing else in the language is spelled this way, so it is safe to
 *              match on the bare name.
 * `set`     — a Set.prototype method. These are NOT matched on the bare method name: `.union(`
 *              and `.difference(` are ordinary method names that any class may define. A Set
 *              receiver is required, either inline (`new Set(x).union(`) or by a name that this
 *              file declares from `new Set(`.
 */
export const RULES = [
  { id: "object-groupby", since: 21, kind: "static", api: "Object.groupBy",
    re: /\bObject\s*\.\s*groupBy\s*\(/g,
    why: "Object.groupBy landed in Node 21." },
  { id: "map-groupby", since: 21, kind: "static", api: "Map.groupBy",
    re: /\bMap\s*\.\s*groupBy\s*\(/g,
    why: "Map.groupBy landed in Node 21." },
  { id: "arraybuffer-transfer", since: 21, kind: "static", api: "ArrayBuffer.prototype.transfer",
    re: /\b(?:ArrayBuffer\s*\.\s*prototype\s*\.\s*transfer|ArrayBuffer\s*\.\s*transferToFixedLength)\s*\(/g,
    why: "ArrayBuffer transfer landed in Node 21." },
  { id: "promise-withresolvers", since: 22, kind: "static", api: "Promise.withResolvers",
    re: /\bPromise\s*\.\s*withResolvers\s*\(/g,
    why: "Promise.withResolvers landed in Node 22." },
  { id: "array-fromasync", since: 22, kind: "static", api: "Array.fromAsync",
    re: /\bArray\s*\.\s*fromAsync\s*\(/g,
    why: "Array.fromAsync landed in Node 22." },
  { id: "regexp-escape", since: 24, kind: "static", api: "RegExp.escape",
    re: /\bRegExp\s*\.\s*escape\s*\(/g,
    why: "RegExp.escape landed in Node 24." },
  { id: "iterator-from", since: 22, kind: "static", api: "Iterator.from",
    re: /\bIterator\s*\.\s*from\s*\(/g,
    why: "Iterator.from and the iterator helpers landed in Node 22." },
  { id: "set-methods", since: 22, kind: "set", api: "Set.prototype.{union,intersection,...}",
    methods: ["union", "intersection", "difference", "symmetricDifference", "isSubsetOf", "isSupersetOf", "isDisjointFrom"],
    why: "The Set methods landed in Node 22." },
];

/**
 * Blank COMMENTS while keeping string literals and every byte offset intact.
 *
 * A comment is not a path, and a comment is not an API call: a doc comment that NAMES an API must
 * not make this gate red. Offsets are preserved so a finding can still be reported by line.
 * String literals are kept, so a URL in a string ("https://...") does not swallow the rest of the
 * line — which would hide a real call.
 */
export function blankComments(text) {
  const out = [];
  let i = 0;
  const n = text.length;
  const quotes = new Set(["'", '"', "`"]);
  while (i < n) {
    const c = text[i];
    const d = text[i + 1];
    if (c === "/" && d === "/") {
      while (i < n && text[i] !== "\n") { out.push(" "); i++; }
      continue;
    }
    if (c === "/" && d === "*") {
      out.push("  "); i += 2;
      while (i < n && !(text[i] === "*" && text[i + 1] === "/")) { out.push(text[i] === "\n" ? "\n" : " "); i++; }
      if (i < n) { out.push("  "); i += 2; }
      continue;
    }
    if (quotes.has(c)) {
      const q = c;
      out.push(c); i++;
      while (i < n) {
        if (text[i] === "\\") { out.push(text[i] ?? " ", text[i + 1] ?? " "); i += 2; continue; }
        out.push(text[i]);
        if (text[i] === q) { i++; break; }
        i++;
      }
      continue;
    }
    out.push(c); i++;
  }
  return out.join("");
}

/** The floor for a file: the nearest ancestor package.json that declares engines.node, else the root's. */
export function floorFor(filePath, readPkg) {
  let dir = dirname(filePath);
  const root = resolve(REPO);
  for (;;) {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = readPkg(pkgPath);
      const declared = pkg?.engines?.node;
      if (declared) return { floor: minVersion(declared), declared, from: pkgPath };
    }
    if (resolve(dir) === root) break;
    const next = dirname(dir);
    if (next === dir) break;
    dir = next;
  }
  const rootPkg = readPkg(join(root, "package.json"));
  const declared = rootPkg?.engines?.node;
  if (!declared) return { error: "package.json declares no engines.node: the floor is unknown, and an unknown floor is not a clean scan" };
  return { floor: minVersion(declared), declared, from: join(root, "package.json") };
}

/**
 * The floor of a declared range is its LOWEST bound: ">=20.0.0" is 20, "^20 || >=22" is 20,
 * ">=18" is 18. A range's upper bound never raises the floor, so this takes the minimum version
 * number the declaration contains. That is derived from the declaration, never typed here.
 */
export function minVersion(declared) {
  const nums = [...String(declared).matchAll(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/g)]
    .map((m) => {
      const major = Number(m[1]);
      const minor = m[2] ? Number(m[2]) : 0;
      const patch = m[3] ? Number(m[3]) : 0;
      // Compared as a number, not as a dotted string: Number("20.0.0") is NaN, and a NaN floor
      // makes every comparison false, so every rule goes inert and the gate passes VACUOUSLY.
      // That is how this gate first reported "0 APIs above the floor" while knowing nothing.
      return major + minor / 1000 + patch / 1e6;
    })
    .filter((n) => Number.isFinite(n));
  if (!nums.length) return null;
  return Math.floor(Math.min(...nums));
}

/** The identifiers this file builds a Set from, so a Set method can be told from any other method. */
export function setNames(source) {
  const names = new Set();
  for (const m of source.matchAll(/\b(?:const|let|var)?\s*([A-Za-z_$][\w$]*)\s*=\s*new\s+Set\s*\(/g)) names.add(m[1]);
  return names;
}

/** Every occurrence of a rule's API in one file, with the line it is on. */
export function findInSource(source, rule) {
  const hits = [];
  const lineOf = (offset) => source.slice(0, offset).split("\n").length;
  if (rule.kind === "static") {
    rule.re.lastIndex = 0;
    for (const m of source.matchAll(rule.re)) hits.push({ offset: m.index, line: lineOf(m.index), text: m[0] });
    return hits;
  }
  // Set methods: an inline `new Set(...)` receiver, or a name this file declares from `new Set(`.
  const names = setNames(source);
  const receiver = new RegExp(
    `(?:new\\s+Set\\s*\\([^()]*\\)|\\b(?:${[...names].map(escapeRe).join("|") || " "})\\s*)\\s*\\.\\s*(${rule.methods.join("|")})\\s*\\(`,
    "g",
  );
  for (const m of source.matchAll(receiver)) hits.push({ offset: m.index, line: lineOf(m.index), text: m[0] });
  return hits;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function* walk(dir) {
  let st;
  try { st = statSync(dir); } catch { return; }
  if (st.isDirectory()) {
    for (const e of readdirSync(dir)) {
      if (SKIP_DIRS.has(e)) continue;
      yield* walk(join(dir, e));
    }
  } else if (st.isFile()) {
    yield dir;
  }
}

export function collectFiles(roots) {
  const files = [];
  for (const r of roots) {
    const abs = resolve(REPO, r);
    if (!existsSync(abs)) continue;
    for (const f of walk(abs)) {
      const dot = f.lastIndexOf(".");
      if (dot < 0) continue;
      if (!JS_EXT.has(f.slice(dot))) continue;
      if (resolve(f) === SELF) continue; // the file that NAMES the APIs must not be flagged by naming them
      files.push(f);
    }
  }
  return files;
}

export function scanFile(filePath, readPkg) {
  const f = floorFor(filePath, readPkg);
  if (f.error) return { error: f.error };
  if (f.floor === null) return { error: `engines.node "${f.declared}" states no version` };
  const raw = readFileSync(filePath, "utf8");
  const source = blankComments(raw);
  const findings = [];
  for (const rule of RULES) {
    if (rule.since <= f.floor) continue; // the floor permits it
    for (const h of findInSource(source, rule)) {
      findings.push({ rule: rule.id, api: rule.api, since: rule.since, floor: f.floor, line: h.line, text: h.text.trim() });
    }
  }
  return { floor: f.floor, declared: f.declared, findings };
}

const readPkg = (p) => {
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; }
};

function selftest() {
  let bad = 0;
  const ok = (name, cond) => { console.log(`${cond ? "ok  " : "FAIL"} ${name}`); if (!cond) bad++; };

  // 1. The floor is DERIVED from the declaration, never typed.
  ok("floor of '>=20.0.0' is 20", minVersion(">=20.0.0") === 20);
  ok("floor of '>=18' is 18", minVersion(">=18") === 18);
  ok("floor of '^20 || >=22' is 20", minVersion("^20 || >=22") === 20);
  ok("a declaration with no version has no floor", minVersion("whatever") === null);

  // 2. A comment is not an API call. The estate already learned this about PATHS.
  const commented = blankComments("// Promise.withResolvers() is Node 22\nconst x = 1;\n");
  ok("a commented API does not fire", findInSource(commented, RULES.find((r) => r.id === "promise-withresolvers")).length === 0);
  const blockCommented = blankComments("/* Object.groupBy(x) */\nconst y = 2;\n");
  ok("a block-commented API does not fire", findInSource(blockCommented, RULES.find((r) => r.id === "object-groupby")).length === 0);

  // 3. A URL in a string does not swallow the rest of the line.
  const url = blankComments('const u = "https://example.com/x"; Promise.withResolvers();\n');
  ok("a URL in a string does not hide a later call",
    findInSource(url, RULES.find((r) => r.id === "promise-withresolvers")).length === 1);

  // 4. The defect that actually happened: a Set method on an inline Set.
  const inline = blankComments("expect(new Set(a).intersection(new Set(b)).size).toBe(0);\n");
  const setRule = RULES.find((r) => r.id === "set-methods");
  ok("the Node-22 Set method on an inline Set is caught",
    findInSource(inline, setRule).length === 1);

  // 5. The same method on a name declared from new Set(...) is caught.
  const named = blankComments("const paid = new Set(doorPaid);\nconst dup = paid.intersection(doorFree);\n");
  ok("the Node-22 Set method on a Set-valued name is caught",
    findInSource(named, setRule).length === 1);

  // 6. A near miss: an ordinary class with its own union() method is NOT a Set method.
  const nearMiss = blankComments("const bag = new Bag();\nbag.union(other);\n");
  ok("an ordinary .union() on a non-Set is not flagged",
    findInSource(nearMiss, setRule).length === 0);

  // 7. The floor decides whether a rule applies at all.
  const file = "/tmp/does-not-matter/x.js";
  const pkg20 = () => ({ engines: { node: ">=20" } });
  const pkg22 = () => ({ engines: { node: ">=22" } });
  const r20 = scanFileAt(file, "const s = new Set(a);\ns.intersection(b);\n", pkg20);
  const r22 = scanFileAt(file, "const s = new Set(a);\ns.intersection(b);\n", pkg22);
  ok("on a Node-20 floor the Set method is a finding", r20.findings.length === 1);
  ok("on a Node-22 floor the same code is allowed", r22.findings.length === 0);

  // 8. A file with no readable floor is UNCHECKABLE, not clean.
  const noFloor = scanFileAt(file, "const x = 1;\n", () => ({}));
  ok("no declared floor is UNCHECKABLE", Boolean(noFloor.error));

  // 9. The scan is not vacuous: the repository's own roots are found and read.
  const files = collectFiles(SCAN_ROOTS);
  ok(`the scan finds source files (${files.length})`, files.length > 0);

  console.log(bad ? `selftest FAILED (${bad})` : "selftest ok");
  return bad ? 1 : 0;
}

/** scanFile with an injected floor lookup, so the selftest can exercise both floors. */
function scanFileAt(filePath, source, readPkgFn) {
  const f = floorFor(filePath, readPkgFn);
  if (f.error) return { error: f.error };
  if (f.floor === null) return { error: `engines.node "${f.declared}" states no version` };
  const findings = [];
  for (const rule of RULES) {
    if (rule.since <= f.floor) continue;
    for (const h of findInSource(source, rule)) {
      findings.push({ rule: rule.id, line: h.line });
    }
  }
  return { floor: f.floor, findings };
}

function main(argv) {
  if (argv.includes("--selftest")) return selftest();
  const explicit = argv.filter((a) => !a.startsWith("--"));
  const roots = explicit.length ? explicit : SCAN_ROOTS;
  const files = collectFiles(roots);
  if (!files.length) {
    console.error("node-engine-floor-gate UNCHECKABLE: no source files were read; an empty scan is not a clean scan");
    return 2;
  }
  const findings = [];
  let checked = 0;
  let floors = new Set();
  for (const f of files) {
    const r = scanFile(f, readPkg);
    if (r.error) { console.error(`node-engine-floor-gate UNCHECKABLE: ${relative(REPO, f)}: ${r.error}`); return 2; }
    checked++;
    floors.add(r.floor);
    for (const x of r.findings) findings.push({ file: relative(REPO, f), ...x });
  }
  if (findings.length) {
    console.error(`node-engine-floor-gate FAIL: ${findings.length} use(s) of a runtime API newer than the declared engine floor`);
    for (const f of findings.slice(0, 30)) {
      console.error(`  FILE ${f.file}:${f.line}  ${f.api} (Node ${f.since}, floor ${f.floor})  ${f.text}`);
    }
    console.error("  The declared floor is what the estate promises to run on. Raise the floor deliberately,");
    console.error("  or write the call the way the floor allows.");
    return 1;
  }
  console.log(`node-engine-floor-gate OK: ${checked} file(s) scanned, floors {${[...floors].sort().join(", ")}}, 0 APIs above the floor`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
