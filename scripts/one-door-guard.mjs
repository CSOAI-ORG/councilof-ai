#!/usr/bin/env node
/**
 * Source-level one-door guard. AG UI is Council OS (`/?lobby=home`).
 *
 * Fails if:
 *   · AgUiBridge iframes csoai-site.pages.dev (the #365 / #372 regression)
 *   · AgUiBridge or SovOS is not a Redirect to `/?lobby=home`
 *   · generate-redirects / public/_redirects send /ag-ui or /agui to /ag-ui,
 *     or /sov-os to /sov-os/, instead of the lobby
 *
 * A comment that names the iframe host is fine. An iframe src is not.
 *
 *   node scripts/one-door-guard.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let fails = 0;
const fail = (m) => { console.log(`  ✗ ${m}`); fails++; };
const pass = (m) => console.log(`  ✓ ${m}`);

function read(rel) {
  const p = join(ROOT, rel);
  if (!existsSync(p)) {
    fail(`missing ${rel}`);
    return "";
  }
  return readFileSync(p, "utf8");
}

console.log("ONE-DOOR-GUARD — source\n");

const agui = read("client/src/pages/AgUiBridge.tsx");
if (agui) {
  const iframeHost =
    /(?:IFRAME_SRC|src)\s*=\s*["'`]https?:\/\/csoai-site\.pages\.dev/i.test(agui) ||
    /<iframe[\s\S]{0,400}csoai-site\.pages\.dev/i.test(agui);
  if (iframeHost) fail("AgUiBridge iframes csoai-site.pages.dev — AG UI is Council OS");
  else pass("AgUiBridge does not iframe csoai-site");

  if (!/<Redirect to="\/\?lobby=home"\s*\/>/.test(agui)) {
    fail('AgUiBridge default export must be <Redirect to="/?lobby=home" />');
  } else pass("AgUiBridge Redirect → /?lobby=home");
}

const sov = read("client/src/pages/SovOS.tsx");
if (sov) {
  if (!/<Redirect to="\/\?lobby=home"\s*\/>/.test(sov)) {
    fail('SovOS must Redirect to /?lobby=home');
  } else pass("SovOS Redirect → /?lobby=home");
  const sovCode = sov.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  if (/dockview/i.test(sovCode)) fail("SovOS still ships a dockview OS");
  else pass("SovOS is not a second dock");
}

for (const rel of ["scripts/generate-redirects.mjs", "public/_redirects"]) {
  const src = read(rel);
  if (!src) continue;
  const badAg = /\/ag-ui\s+\/ag-ui\s+308/.test(src) || /\/agui\s+\/ag-ui\s+308/.test(src);
  const goodAg = /\/ag-ui\s+\/\?lobby=home\s+308/.test(src) && /\/agui\s+\/\?lobby=home\s+308/.test(src);
  if (badAg || !goodAg) fail(`${rel} must 308 /ag-ui and /agui to /?lobby=home`);
  else pass(`${rel} /ag-ui /agui → /?lobby=home`);

  const badSov = /\/sov-os\s+\/sov-os\/\s+308/.test(src);
  const goodSov = /\/sov-os\s+\/\?lobby=home\s+308/.test(src);
  if (badSov || !goodSov) fail(`${rel} must 308 /sov-os to /?lobby=home (not /sov-os/)`);
  else pass(`${rel} /sov-os → /?lobby=home`);

  if (!/\/chat\s+\/\?lobby=home\s+308/.test(src)) fail(`${rel} must 308 /chat to /?lobby=home`);
  else pass(`${rel} /chat → /?lobby=home`);

  if (!/\/enterprise\s+\/\?lobby=measured&task=enterprise-start\s+308/.test(src)) {
    fail(`${rel} must 308 /enterprise to /?lobby=measured&task=enterprise-start`);
  } else pass(`${rel} /enterprise → lobby get-measured`);
}

console.log("");
if (fails) {
  console.error(`ONE-DOOR-GUARD: FAIL — ${fails} check(s)`);
  process.exit(1);
}
console.log("ONE-DOOR-GUARD: PASS — one public Council OS door");
