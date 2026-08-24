#!/usr/bin/env node
// no-conflict-markers.mjs — FAIL the build if any committed source file contains
// unresolved git merge conflict markers (<<<<<<<, >>>>>>>) in code files.
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

const MARKERS = ["<<<<<<<", ">>>>>>>"];   // git conflict markers (======= is too common in md)
const EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".py", ".sh"];
const ROOTS = ["client", "functions", "scripts", "harness", "src"];
const IGNORE_DIRS = new Set(["node_modules", ".next", "dist", ".git", "coverage", "__pycache__"]);

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
    const body = fs.readFileSync(f, "utf8");
    for (const m of MARKERS) {
      if (body.includes(m)) {
        const ln = body.split("\n").findIndex((l) => l.includes(m)) + 1;
        bad.push(`${f}:${ln}  contains '${m}'`);
        break;
      }
    }
  }
  return bad;
}

// --selftest: create a temp dir with a marker, assert the detector fires.
function selftest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cm-"));
  fs.writeFileSync(path.join(tmp, "fixture.tsx"), "const a=1;\n<<<<<<< Updated upstream\nconst b=2;\n");
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
