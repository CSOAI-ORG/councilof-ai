#!/usr/bin/env node
/**
 * Source-level one-door guard. AG UI is the canonical Council OS dashboard.
 *
 * 2026-08-28: hops go to /os?lobby=… not /?lobby=home. Lean homepage (832)
 * ate the lobby panes; /?lobby=home crashes. /os is the AG-UI host now.
 *
 * Fails if:
 *   · AgUiBridge iframes csoai-site.pages.dev (the #365 / #372 regression)
 *   · AgUiBridge or SovOS does not converge on `/dashboard?tab=home`
 *   · generate-redirects / public/_redirects send /ag-ui or /agui to /ag-ui,
 *     or /sov-os to /sov-os/, instead of the dashboard
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

// A MISSING FILE MUST FAIL, NOT SKIP. `read()` returns "" for an absent path, so the checks
// below — which all ask "does this content contain X" — passed vacuously when the file was
// gone. Verified 2026-09-05: deleting AgUiBridge.tsx entirely left this guard printing
// "PASS — one public Council OS door" and exiting 0, while it runs in deploy.yml. It could
// not detect the removal of the very file it exists to protect.
//
// SovOS below is the opposite case and is handled correctly: it is EXPECTED to be absent
// (retired 2 Sep 2026), so `missing` is a pass there. The distinction is deliberate.
const aguiRead = read("client/src/pages/AgUiBridge.tsx");
const agui = aguiRead.content;
if (!agui) {
  fail(
    aguiRead.missing
      ? "client/src/pages/AgUiBridge.tsx is MISSING — the one-door checks cannot run, and this guard must not pass on an absent file"
      : "client/src/pages/AgUiBridge.tsx is empty — the one-door checks would pass against nothing",
  );
} else {
  const iframeHost =
    /(?:IFRAME_SRC|src)\s*=\s*["'`]https?:\/\/csoai-site\.pages\.dev/i.test(agui) ||
    /<iframe[\s\S]{0,400}csoai-site\.pages\.dev/i.test(agui);
  if (iframeHost) fail("AgUiBridge iframes csoai-site.pages.dev — AG UI is Council OS");
  else pass("AgUiBridge does not iframe csoai-site");

  if (!/Redirect to=\{`\/dashboard\?\$\{params\.toString\(\)\}`\}/.test(agui)) {
    fail("AgUiBridge must redirect to the canonical /dashboard query contract");
  } else pass("AgUiBridge Redirect → canonical /dashboard contract");
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
    if (/['"]\/sov-os['"]/.test(app) && /DashboardDoor defaultTab="home"/.test(app)) {
      pass("/sov-os still converges on /dashboard?tab=home (via App.tsx)");
    } else {
      fail("/sov-os redirect missing from App.tsx — add it back to the if/else funnel");
    }
  }
}

for (const rel of ["scripts/generate-redirects.mjs", "public/_redirects"]) {
  const src = read(rel).content;
  if (!src) continue;
  const badAg = /\/ag-ui\s+\/ag-ui\s+308/.test(src) || /\/agui\s+\/ag-ui\s+308/.test(src);
  const goodAg = /\/ag-ui\s+\/dashboard\?tab=home\s+308/.test(src) && /\/agui\s+\/dashboard\?tab=home\s+308/.test(src);
  if (badAg || !goodAg) fail(`${rel} must 308 /ag-ui and /agui to /dashboard?tab=home`);
  else pass(`${rel} /ag-ui /agui → /dashboard?tab=home`);

  const badSov = /\/sov-os\s+\/sov-os\/\s+308/.test(src);
  const goodSov = /\/sov-os\s+\/dashboard\?tab=home\s+308/.test(src);
  if (badSov || !goodSov) fail(`${rel} must 308 /sov-os to /dashboard?tab=home (not /sov-os/)`);
  else pass(`${rel} /sov-os → /dashboard?tab=home`);

  if (!/\/chat\s+\/dashboard\?tab=home\s+308/.test(src)) fail(`${rel} must 308 /chat to /dashboard?tab=home`);
  else pass(`${rel} /chat → /dashboard?tab=home`);

  if (!/\/enterprise\s+\/dashboard\?tab=measured&task=enterprise-start\s+308/.test(src)) {
    fail(`${rel} must 308 /enterprise to /dashboard?tab=measured&task=enterprise-start`);
  } else pass(`${rel} /enterprise → canonical measured door`);
}

console.log("");
if (fails) {
  console.error(`ONE-DOOR-GUARD: FAIL — ${fails} check(s)`);
  process.exit(1);
}
console.log("ONE-DOOR-GUARD: PASS — one public Council OS door");
