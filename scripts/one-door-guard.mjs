#!/usr/bin/env node
/**
 * Source-level one-door guard. AG UI is the canonical Dashboard workspace.
 *
 * 2026-09-04: compatibility hops converge on /dashboard?tab=home.
 * ate the lobby panes; /?lobby=home crashes. /os is the AG-UI host now.
 *
 * Fails if:
 *   · AgUiBridge iframes csoai-site.pages.dev (the #365 / #372 regression)
 *   · AgUiBridge or the legacy aliases do not converge on `/dashboard?tab=home`
 *   · generate-redirects / public/_redirects send /ag-ui and /agui to the Dashboard,
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
const fail = (m) => {
  console.log(`  ✗ ${m}`);
  fails++;
};
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
    /(?:IFRAME_SRC|src)\s*=\s*["'`]https?:\/\/csoai-site\.pages\.dev/i.test(
      agui,
    ) || /<iframe[\s\S]{0,400}csoai-site\.pages\.dev/i.test(agui);
  if (iframeHost)
    fail("AgUiBridge iframes csoai-site.pages.dev — AG UI is Council OS");
  else pass("AgUiBridge does not iframe csoai-site");

  if (!/<Redirect to="\/dashboard\?tab=home"\s*\/>/.test(agui)) {
    fail(
      'AgUiBridge default export must be <Redirect to="/dashboard?tab=home" />',
    );
  } else pass("AgUiBridge Redirect → canonical Dashboard");
}

const sov = read("client/src/pages/SovOS.tsx");
const sovContent = sov.content;
const sovMissing = sov.missing;
// SovOS was the 8-line stub that lived under /sov-os — retired 2 Sep 2026
// (best-version consolidation; SOV3/SovOS/Sovereign naming off the public surface).
// The /sov-os redirect now lives in client/src/App.tsx (the if/else
// that funnels /ag-ui /chat /console /sov-os → /dashboard?tab=home). The
// guard below therefore reads from App.tsx — NOT from a deleted file.
if (sovContent) {
  fail(
    "SovOS.tsx must be retired (SOV naming off the public surface per Blueprint §2.2)",
  );
} else if (sovMissing) {
  // SovOS retired: ensure the /sov-os redirect still exists in App.tsx
  const app = read("client/src/App.tsx").content;
  if (app) {
    if (
      /['"]\/sov-os['"]/.test(app) &&
      /Redirect to="\/dashboard\?tab=home"/.test(app)
    ) {
      pass("/sov-os redirects to the canonical Dashboard (via App.tsx)");
    } else {
      fail(
        "/sov-os redirect missing from App.tsx — add it back to the if/else funnel",
      );
    }
  }
}

const app = read("client/src/App.tsx").content;
if (
  !/<Route path="\/integrations">[\s\S]{0,160}<Redirect to="\/dashboard\?tab=fabric"/.test(
    app,
  ) ||
  !/<Route path="\/ecosystem">[\s\S]{0,160}<Redirect to="\/dashboard\?tab=fabric"/.test(
    app,
  )
) {
  fail("App routes /integrations and /ecosystem must converge on Connections");
} else pass("legacy integration pages → Connections fabric");

for (const rel of ["scripts/generate-redirects.mjs", "public/_redirects"]) {
  const src = read(rel).content;
  if (!src) continue;
  const badAg =
    /\/ag-ui\s+\/ag-ui\s+308/.test(src) || /\/agui\s+\/ag-ui\s+308/.test(src);
  const goodAg =
    /\/ag-ui\s+\/dashboard\?tab=home\s+308/.test(src) &&
    /\/agui\s+\/dashboard\?tab=home\s+308/.test(src);
  if (badAg || !goodAg)
    fail(`${rel} must 308 /ag-ui and /agui to /dashboard?tab=home`);
  else pass(`${rel} /ag-ui /agui → canonical Dashboard`);

  const badSov = /\/sov-os\s+\/sov-os\/\s+308/.test(src);
  const goodSov = /\/sov-os\s+\/dashboard\?tab=home\s+308/.test(src);
  if (badSov || !goodSov)
    fail(`${rel} must 308 /sov-os to /dashboard?tab=home`);
  else pass(`${rel} /sov-os → canonical Dashboard`);

  if (!/\/chat\s+\/dashboard\?tab=home\s+308/.test(src))
    fail(`${rel} must 308 /chat to /dashboard?tab=home`);
  else pass(`${rel} /chat → canonical Dashboard`);

  if (
    !/\/enterprise\s+\/dashboard\?tab=measured&task=enterprise-start\s+308/.test(
      src,
    )
  ) {
    fail(`${rel} must 308 /enterprise to the Request attestation workspace`);
  } else pass(`${rel} /enterprise → Request attestation workspace`);

  if (
    !/\/integrations\s+\/dashboard\?tab=fabric\s+308/.test(src) ||
    !/\/ecosystem\s+\/dashboard\?tab=fabric\s+308/.test(src)
  ) {
    fail(`${rel} must 308 /integrations and /ecosystem to Connections`);
  } else pass(`${rel} /integrations /ecosystem → Connections`);
}

console.log("");
if (fails) {
  console.error(`ONE-DOOR-GUARD: FAIL — ${fails} check(s)`);
  process.exit(1);
}
console.log("ONE-DOOR-GUARD: PASS — one public Council OS door");
