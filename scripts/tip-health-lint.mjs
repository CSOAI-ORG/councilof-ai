#!/usr/bin/env node
/**
 * Tip byte / stub guard — fail if pages contain corrupt MCP push stubs.
 * Never ship PLACEHOLDER_WILL_LOAD / LOAD_FROM_* / TRUNCATED_FOR_BREVITY.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const PAGES = join(root, "client/src/pages");
const BAD = /PLACEHOLDER_WILL_LOAD|LOAD_FROM_TMP|LOAD_FROM_DISK|^LOAD_ME$|TRUNCATED_FOR_BREVITY/;
const GUARDS = [
  { path: "client/src/pages/NewHome-v3.tsx", bytes: 35406 },
  { path: "client/src/AppMainRoutes.tsx", bytes: 847 },
  { path: "client/src/AppLazy.tsx", bytes: 24241 },
];

let failed = false;

for (const g of GUARDS) {
  const fp = join(root, g.path);
  const n = statSync(fp).size;
  if (n !== g.bytes) {
    console.error(`  FAIL  ${g.path} bytes=${n} expected=${g.bytes}`);
    failed = true;
  } else {
    console.log(`  PASS  ${g.path} ${n}`);
  }
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const fp = join(dir, name);
    const st = statSync(fp);
    if (st.isDirectory()) walk(fp);
    else if (/\.(tsx|ts|jsx|js)$/.test(name)) {
      const text = readFileSync(fp, "utf8");
      if (BAD.test(text) || st.size < 80) {
        console.error(`  FAIL  stub/corrupt ${fp.replace(root + "/", "")} bytes=${st.size}`);
        failed = true;
      }
    }
  }
}

walk(PAGES);
if (failed) {
  console.error("\ntip-health FAIL — restore full files before more tip writes");
  process.exit(1);
}
console.log("\ntip-health OK");
