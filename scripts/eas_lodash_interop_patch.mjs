#!/usr/bin/env node
// lodash ESM/CJS interop repair for @ethereum-attestation-service/eas-sdk.
//
// Why this exists: eas-sdk ships an ESM build that does
//     import { isEqual } from 'lodash';
// lodash is CommonJS and assigns its properties at runtime, so Node's static
// cjs-module-lexer finds no named exports and the import throws
//   SyntaxError: Named export 'isEqual' not found.
// That crash took down the whole public-root publish in run 37717488561
// (2026-10-08) the first time the attester key was present. This script rewrites
// any such named import in the installed package to a default-import
// destructure, which is the documented-correct way to consume lodash from ESM.
//
// It is idempotent (a rewritten file no longer matches), fails closed when the
// package directory is missing, and reports exactly how many files changed so
// the workflow log shows whether the patch had anything to do.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] ||
  "node_modules/@ethereum-attestation-service/eas-sdk";

let st;
try { st = statSync(root); } catch {
  console.error(`eas-lodash-interop: missing ${root} (npm install did not produce it)`);
  process.exit(1);
}
if (!st.isDirectory()) {
  console.error(`eas-lodash-interop: ${root} is not a directory`);
  process.exit(1);
}

// Named import from a single-quoted lodash specifier, single line.
const RE = /import\s*\{([^}]*)\}\s*from\s*(['"])lodash\2;/g;

let files = 0, patched = 0;
function walk(dir) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) { walk(p); continue; }
    if (!ent.name.endsWith(".js")) continue;
    files++;
    const src = readFileSync(p, "utf8");
    const out = src.replace(RE, (_m, names) => {
      const list = names.replace(/\s+/g, " ").trim();
      return `import __lodash from "lodash"; const { ${list} } = __lodash;`;
    });
    if (out !== src) { writeFileSync(p, out); patched++; }
  }
}
walk(root);
console.log(`eas-lodash-interop: scanned ${files} file(s), patched ${patched}`);
// 0 patched is a legitimate state: a future eas-sdk may already be ESM-clean or
// already patched. The functional import check that follows in the workflow is
// the authority; this script only removes the known defect.
