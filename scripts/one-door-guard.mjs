#!/usr/bin/env node
/**
 * Source-level one-door guard. AG UI is Council OS (`/os?lobby=home`).
 *
 * 2026-08-28: hops go to /os?lobby=… not /?lobby=home. Lean homepage (832)
 * ate the lobby panes; /?lobby=home crashes. /os is the AG-UI host now.
 *
 * Fails if:
 *   · AgUiBridge iframes csoai-site.pages.dev (the #365 / #372 regression)
 *   · AgUiBridge or SovOS is not a Redirect to `/os?lobby=home`
 *   · generate-redirects / public/_redirects send /ag-ui or /agui to /ag-ui,
 *     or /sov-os to /sov-os/, instead of the lobby at /os
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
    return { content: "", missing: true };
  }
  return { content: readFileSync(p, "utf8"), missing: false };
}

console.log("ONE-DOOR-GUARD — source\n");

const agui = read("client/src/pages/AgUiBridge.tsx").content;
if (agui) {
  const iframeHost =
    /(?:IFRAME_SRC|src)\s*=\s*["'`]https?:\/\/csoai-site\.pages\.dev/i.test(agui) ||
    /<iframe[\s\S]{0,400}csoai-site\.pages\.dev/i.test(agui);
  if (iframeHost) fail("AgUiBridge iframes csoai-site.pages.dev — AG UI is Council OS");
  else pass("AgUiBridge does not iframe csoai-site");

  if (!/<Redirect to="\/os\?lobby=home"\s*\/>/.test(agui)) {
    fail('AgUiBridge default export must be <Redirect to="/os?lobby=home" />');
  } else pass("AgUiBridge Redirect → /os?lobby=home");
}

const sov = read("client/src/pages/SovOS.tsx");
const sovContent = sov.content;
const sovMissing = sov.missing;
// SovOS was the 8-line stub that lived under /sov-os — retired 2 Sep 2026
// (best-version consolidation; SOV3/SovOS/Sovereign naming off the public surface).
// The /sov-os redirect now lives in client/src/App.tsx (the if/else
// that funnels /ag-ui /chat /console /sov-os → /os?lobby=home). The
// guard below therefore reads from App.tsx — NOT from a deleted file.
if (sovContent) {
  fail("SovOS.tsx must be retired (SOV naming off the public surface per Blueprint §2.2)");
} else if (sovMissing) {
  // SovOS retired: ensure the /sov-os redirect still exists in App.tsx
  const app = read("client/src/App.tsx").content;
  if (app) {
    if (/\/sov-os[^a-z].*\/os\?lobby=home/s.test(app) || /path\s*===\s*['"]\/sov-os['"]/.test(app)) {
      pass("/sov-os still redirects to /os?lobby=home (via App.tsx)");
    } else {
      fail("/sov-os redirect missing from App.tsx — add it back to the if/else funnel");
    }
  }
}

for (const rel of ["scripts/generate-redirects.mjs", "public/_redirects"]) {
  const src = read(rel).content;
  if (!src) continue;
  const badAg = /\/ag-ui\s+\/ag-ui\s+308/.test(src) || /\/agui\s+\/ag-ui\s+308/.test(src);
  const goodAg = /\/ag-ui\s+\/os\?lobby=home\s+308/.test(src) && /\/agui\s+\/os\?lobby=home\s+308/.test(src);
  if (badAg || !goodAg) fail(`${rel} must 308 /ag-ui and /agui to /os?lobby=home`);
  else pass(`${rel} /ag-ui /agui → /os?lobby=home`);

  const badSov = /\/sov-os\s+\/sov-os\/\s+308/.test(src);
  const goodSov = /\/sov-os\s+\/os\?lobby=home\s+308/.test(src);
  if (badSov || !goodSov) fail(`${rel} must 308 /sov-os to /os?lobby=home (not /sov-os/)`);
  else pass(`${rel} /sov-os → /os?lobby=home`);

  if (!/\/chat\s+\/os\?lobby=home\s+308/.test(src)) fail(`${rel} must 308 /chat to /os?lobby=home`);
  else pass(`${rel} /chat → /os?lobby=home`);

  if (!/\/enterprise\s+\/os\?lobby=assess&task=enterprise-start\s+308/.test(src)) {
    fail(`${rel} must 308 /enterprise to /os?lobby=assess&task=enterprise-start`);
  } else pass(`${rel} /enterprise → /os assess door`);
}

console.log("");
if (fails) {
  console.error(`ONE-DOOR-GUARD: FAIL — ${fails} check(s)`);
  process.exit(1);
}
console.log("ONE-DOOR-GUARD: PASS — one public Council OS door");
