#!/usr/bin/env node
// no-conflict-markers.mjs — FAIL the build if any committed source file contains
// unresolved git merge conflict markers in code files.
//
// A sibling lane pushed App.tsx with committed conflict markers (PR #415) and it
// broke every deploy at 'Build client' (vite:esbuild 'Expected identifier but found <').
// This guard hard-fails before the build, so a conflict can never reach production
// as a deploy-blocking break again. No external deps (native fs walk).
//
//   node scripts/no-conflict-markers.mjs            real check
//   node scripts/no-conflict-markers.mjs --selftest  prove it can fail
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const MARKER_RES = [/^(<<<<<<<|>>>>>>>)/m];
const EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".py", ".sh"];
const ROOTS = ["client", "functions", "scripts", "harness", "src"];
const IGNORE_DIRS = new Set(["node_modules", ".next", "dist", ".git", "coverage", "__pycache__"]);
const IGNORE_FILES = new Set([
  "scripts/no-conflict-markers.mjs",
  "scripts/resolve-app-tsx.mjs",
]);

function walk(dir, out) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!IGNORE_DIRS.has(e.name)) walk(p, out);
    } else if (EXTS.some((x) => e.name.endsWith(x))) {
      out.push(p);
    }
  }
}

function scan(root) {
  const files = [];
  if (!fs.existsSync(root)) return [];
  walk(root, files);
  const bad = [];
  for (const f of files) {
    const rel = path.relative(process.cwd(), f).replace(/\\/g, "/");
    if (IGNORE_FILES.has(rel)) continue;
    const body = fs.readFileSync(f, "utf8");
    for (const re of MARKER_RES) {
      if (re.test(body)) {
        const ln = body.split("\n").findIndex((l) => /^(<<<<<<<|>>>>>>>)/.test(l)) + 1;
        bad.push(`${rel}:${ln}  contains git conflict marker`);
        break;
      }
    }
  }
  return bad;
}

// --selftest: create a temp dir with a marker, assert the detector fires.
function selftest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cm-"));
  const marker = "<<<<<<< Updated upstream";
  fs.writeFileSync(path.join(tmp, "fixture.tsx"), `const a=1;\n${marker}\nconst b=2;\n`);
  const hits = scan(tmp);
  fs.rmSync(tmp, { recursive: true, force: true });
  if (hits.length) { console.log("SELFTEST: PASS — detector fired on fixture"); return 0; }
  console.log("SELFTEST: FAIL — detector did not fire on a conflicted fixture");
  return 1;
}

let bad = [];
for (const root of ROOTS) bad = bad.concat(scan(root));

if (process.argv.includes("--selftest")) {
  process.exit(selftest());
}
if (bad.length) {
  console.error("✗ Committed git conflict markers found — this breaks the build:");
  bad.forEach((b) => console.error("  " + b));
  process.exit(1);
}
console.log("✓ No git conflict markers in committed source.");
