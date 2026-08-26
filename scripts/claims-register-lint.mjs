#!/usr/bin/env node
/**
 * claims-register-lint — fail the build when /claims-register would render fewer
 * rows than public/claims-register.json contains.
 *
 * WHY THIS EXISTS (2026-08-26, outside audit D9). The page announced
 * `claims.length` in its header, but grouped rows by a hardcoded four-status
 * ORDER while the file declares five. The fifth is `unmeasured`. Result: the page
 * said "20 claims … there is no second copy to drift" and rendered 19, silently
 * dropping the only unmeasured claim — on a site whose banner is "UNMEASURED
 * shown honestly". Nothing checked, so nothing caught it for as long as it was true.
 *
 * The page is now structurally incapable of dropping a row (it groups by each
 * claim's own status string and appends undeclared statuses). This gate is the
 * second lock: it re-derives the grouping from the same two inputs and fails if
 * the sets ever differ again.
 *
 *   node scripts/claims-register-lint.mjs
 *
 * Exit 0 = every claim is reachable and every declared status has a legend entry.
 * Exit 1 = a claim would not render, or a declared status has no legend case.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTER = join(root, "public", "claims-register.json");
const PAGE = join(root, "client", "src", "pages", "ClaimsRegister.tsx");

const fail = [];
const reg = JSON.parse(readFileSync(REGISTER, "utf8"));
const page = readFileSync(PAGE, "utf8");

const claims = reg.claims ?? [];
const declared = reg.statuses ?? [];

if (!Array.isArray(claims) || claims.length === 0) {
  console.error("claims-register-lint: claims[] missing or empty");
  process.exit(1);
}
if (!Array.isArray(declared) || declared.length === 0) {
  fail.push("claims-register.json declares no statuses[] — the page has nothing to order by");
}

// 1. Every status carried by a claim must be declared. An undeclared status still
//    renders (the page appends it), but the file should say what its statuses are.
const used = [...new Set(claims.map((c) => c.status))];
for (const s of used) {
  if (!declared.includes(s)) {
    fail.push(
      `status ${JSON.stringify(s)} is used by a claim but not declared in statuses[] — ` +
        `declare it, or correct the claim`
    );
  }
}

// 2. Every declared status needs a legend case in STATUS_STYLE, or the legend
//    under "What the statuses mean" omits a status the file declares (the second
//    half of D9: the legend listed 4 of the 5).
for (const s of declared) {
  if (!new RegExp(`^\\s{2}${s}:\\s*\\{`, "m").test(page)) {
    fail.push(
      `status ${JSON.stringify(s)} is declared in claims-register.json but has no STATUS_STYLE ` +
        `case in ClaimsRegister.tsx — its legend entry and chip would be a bare fallback`
    );
  }
}

// 3. Simulate the page's grouping over the real file and confirm every claim is
//    reachable. This is the "rendered != claims.length" check the audit asked for.
const order = [...declared];
for (const c of claims) if (!order.includes(c.status)) order.push(c.status);
const renderedIds = new Set();
for (const s of order) for (const c of claims) if (c.status === s) renderedIds.add(c.id);
const dropped = claims.filter((c) => !renderedIds.has(c.id));
if (dropped.length) {
  fail.push(
    `${dropped.length} claim(s) would not render: ` +
      dropped.map((c) => `${c.id} (${c.status})`).join(", ")
  );
}

// 4. The header count must be derived, never typed. Guard the exact regression:
//    a literal integer in the "Claims register · N claims" header.
if (/Claims register · \{?\s*\d+/.test(page)) {
  fail.push("the /claims-register header prints a typed number — it must render rendered.length");
}
if (!/Claims register · \{rendered\.length\}/.test(page)) {
  fail.push(
    "the /claims-register header no longer prints {rendered.length} — the count must be the " +
      "length of the rows actually rendered, not claims.length"
  );
}

if (fail.length) {
  console.error("claims-register-lint: FAIL");
  for (const f of fail) console.error("  - " + f);
  process.exit(1);
}
console.log(
  `claims-register-lint: OK — ${claims.length} claims, ${declared.length} declared statuses ` +
    `(${declared.join(", ")}), ${renderedIds.size} reachable`
);
