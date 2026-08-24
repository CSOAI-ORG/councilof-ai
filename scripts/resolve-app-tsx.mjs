#!/usr/bin/env node
/**
 * Resolve leftover git conflict markers in client/src/App.tsx (keep "Updated upstream").
 * Also auth-gate /workbench and drop duplicate workbench route.
 * No-op when clean.
 */
import fs from "node:fs";

const path = "client/src/App.tsx";
let text = fs.readFileSync(path, "utf8");

if (text.includes("PLACEHOLDER_WILL_REPLACE") || text.trim() === "PLACEHOLDER_WILL_REPLACE") {
  console.error("[resolve-app-tsx] PLACEHOLDER App.tsx — refusing to build");
  process.exit(1);
}

if (text.includes("<<<<<<<")) {
  const re = /<<<<<<<[^\n]*\n([\s\S]*?)=======\n[\s\S]*?>>>>>>>[^\n]*\n/g;
  text = text.replace(re, "$1");
  if (text.includes("<<<<<<<") || text.includes(">>>>>>>")) {
    console.error("[resolve-app-tsx] markers remain after strip");
    process.exit(1);
  }
  console.log("[resolve-app-tsx] stripped conflict markers (kept upstream)");
}

const bare = '                  <Route path="/workbench" component={Workbench} />';
const authed =
  '                  <Route path="/workbench">{() => <RequireAuth><Workbench /></RequireAuth>}</Route>';
if (text.includes(bare)) {
  text = text.replace(bare, authed);
  console.log("[resolve-app-tsx] auth-gated /workbench");
}

const dup =
  '                  <Route path="/workbench">{() => <RequireAuth><Workbench /></RequireAuth>}</Route>\n';
const first = text.indexOf(dup);
if (first !== -1) {
  const second = text.indexOf(dup, first + 1);
  if (second !== -1) {
    text = text.slice(0, second) + text.slice(second + dup.length);
    console.log("[resolve-app-tsx] removed duplicate /workbench route");
  }
}

fs.writeFileSync(path, text);
console.log("[resolve-app-tsx] OK", path, text.length, "bytes");
