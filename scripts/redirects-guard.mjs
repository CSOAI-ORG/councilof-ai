#!/usr/bin/env node
/**
 * redirects-guard.mjs — fail the build if _redirects would be silently truncated
 * at the Cloudflare edge.
 *
 * WHY (2026-08-26 incident): `wrangler pages deploy` logged
 *   "Maximum number of dynamic rules supported is 100. Skipping remaining 53
 *    lines of file."
 * and the deploy went GREEN. The 53 skipped lines contained the SPA catch-all.
 * Nothing in the pipeline read that line, so a hard platform cap surfaced as a
 * warning in a log nobody greps. Same class of guard as pages-size-guard.mjs:
 * a constraint you cannot check is one you discover by breaking.
 *
 * This is a PORT of Cloudflare's own parser, not an approximation:
 *   wrangler/workers-shared/utils/configuration/parseRedirects.ts  (v4.126.0)
 *   wrangler/workers-shared/utils/configuration/validateURL.ts
 * Every rejection message below is copied from that source so the guard's output
 * matches what the edge will actually say.
 *
 * The counting rule that bit us, in full:
 *   `canCreateStaticRule` starts TRUE. A rule whose `from` has no splat and no
 *   :placeholder is billed to the 2000-rule STATIC budget *while that flag holds*.
 *   The first rule whose `from` DOES carry a splat flips the flag to FALSE and it
 *   is never restored — so every rule after it, splat or not, is billed to the
 *   100-rule DYNAMIC budget. One `/sov-space/*` on line 8 made all 147 rules
 *   dynamic. Order, not count, is the real constraint.
 *
 * Usage:
 *   node scripts/redirects-guard.mjs [path/to/_redirects]   # default public/_redirects
 *   node scripts/redirects-guard.mjs --selftest             # prove the guard bites
 */
import { readFileSync, existsSync } from "node:fs";

// ── constants, copied from workers-shared/utils/configuration/constants.ts ──
const MAX_LINE_LENGTH = 2000;
const MAX_DYNAMIC_REDIRECT_RULES = 100;
const MAX_STATIC_REDIRECT_RULES = 2000;
const PERMITTED_STATUS_CODES = new Set([200, 301, 302, 303, 307, 308]);
const SPLAT_REGEX = /\*/;
const PLACEHOLDER_REGEX = /:[A-Za-z]\w*/;
const URL_REGEX = /^https:\/\/+(?<host>[^/]+)\/?(?<path>.*)/;

const extractPathname = (path = "/", includeSearch, includeHash) => {
  if (!path.startsWith("/")) path = `/${path}`;
  const url = new URL(`//${path}`, "relative://");
  return `${url.pathname}${includeSearch ? url.search : ""}${includeHash ? url.hash : ""}`;
};
const urlHasHost = (u) => URL_REGEX.test(u);
const validateUrl = (token, onlyRelative, disallowPorts, includeSearch, includeHash) => {
  const host = URL_REGEX.exec(token);
  if (host?.groups?.host) {
    if (onlyRelative) return [undefined, `Only relative URLs are allowed. Skipping absolute URL ${token}.`];
    if (disallowPorts && /.*:\d+$/.test(host.groups.host))
      return [undefined, `Specifying ports is not supported. Skipping absolute URL ${token}.`];
    return [`https://${host.groups.host}${extractPathname(host.groups.path, includeSearch, includeHash)}`, undefined];
  }
  if (!token.startsWith("/") && onlyRelative) token = `/${token}`;
  if (/^\//.test(token)) {
    try { return [extractPathname(token, includeSearch, includeHash), undefined]; }
    catch { return [undefined, `Error parsing URL segment ${token}. Skipping.`]; }
  }
  return [undefined, onlyRelative ? "URLs should begin with a forward-slash." : "URLs should be relative or HTTPS."];
};

/** Faithful port of parseRedirects(). Returns {rules, invalid, truncatedAtLine, staticCount, dynamicCount}. */
export function parseRedirects(input) {
  const lines = input.split("\n");
  const rules = [];
  const invalid = [];
  const seen = new Set();
  let staticCount = 0, dynamicCount = 0, canCreateStaticRule = true, truncatedAtLine = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const ln = i + 1;
    if (!line || line.startsWith("#")) continue;
    if (line.length > MAX_LINE_LENGTH) {
      invalid.push({ ln, line, message: `Ignoring line ${ln} as it exceeds the maximum allowed length of ${MAX_LINE_LENGTH}.` });
      continue;
    }
    const tokens = line.split(/\s+/);
    if (tokens.length < 2 || tokens.length > 3) {
      invalid.push({ ln, line, message: `Expected exactly 2 or 3 whitespace-separated tokens. Got ${tokens.length}.` });
      continue;
    }
    const [strFrom, strTo, strStatus = "302"] = tokens;
    const [from, fromErr] = validateUrl(strFrom, true, true, false, false);
    if (from === undefined) { invalid.push({ ln, line, message: fromErr }); continue; }

    const isDynamic = SPLAT_REGEX.test(from) || PLACEHOLDER_REGEX.test(from);
    if (canCreateStaticRule && !isDynamic) {
      staticCount += 1;
      if (staticCount > MAX_STATIC_REDIRECT_RULES) {
        invalid.push({ ln, line, message: `Maximum number of static rules supported is ${MAX_STATIC_REDIRECT_RULES}. Skipping line.` });
        continue;
      }
    } else {
      dynamicCount += 1;
      canCreateStaticRule = false;      // <- the flag that never comes back
      if (dynamicCount > MAX_DYNAMIC_REDIRECT_RULES) {
        invalid.push({ ln, line, message: `Maximum number of dynamic rules supported is ${MAX_DYNAMIC_REDIRECT_RULES}. Skipping remaining ${lines.length - i} lines of file.` });
        truncatedAtLine = ln;
        break;                          // <- the rest of the file never reaches the edge
      }
    }

    const [to, toErr] = validateUrl(strTo, false, false, true, true);
    if (to === undefined) { invalid.push({ ln, line, message: toErr }); continue; }
    const status = Number(strStatus);
    if (isNaN(status) || !PERMITTED_STATUS_CODES.has(status)) {
      invalid.push({ ln, line, message: `Valid status codes are 200, 301, 302 (default), 303, 307, or 308. Got ${strStatus}.` });
      continue;
    }
    if (/\/\*?$/.test(from) && /\/index(\.html)?$/.test(to) && !urlHasHost(to)) {
      invalid.push({ ln, line, kind: "infinite-loop", message: "Infinite loop detected in this rule and has been ignored." });
      continue;
    }
    if (seen.has(from)) { invalid.push({ ln, line, message: `Ignoring duplicate rule for path ${from}.` }); continue; }
    seen.add(from);
    if (status === 200 && urlHasHost(to)) {
      invalid.push({ ln, line, message: `Proxy (200) redirects can only point to relative paths. Got ${to}` });
      continue;
    }
    rules.push({ from, to, status, ln });
  }
  return { rules, invalid, truncatedAtLine, staticCount, dynamicCount };
}

// The SPA catch-all is rejected by Cloudflare's own infinite-loop check
// (`from` ends in /*, `to` ends in /index.html). VERIFIED against wrangler
// 4.126.0 `pages dev`, which logs the rejection and still serves index.html for
// unknown paths — Pages' built-in SPA fallback does that, but ONLY when the
// output has no 404.html. This build ships a 404.html, so unknown paths get the
// designed honest-404 page. Whether that is the wanted behaviour is an owner
// ruling, not a guard's call: this guard reports the fact, loudly, every run,
// and does not fail the build on it.
const ACKNOWLEDGED_INFINITE_LOOP = "/*";

export function check(text, { label = "_redirects" } = {}) {
  const r = parseRedirects(text);
  const errs = [];
  const warns = [];

  if (r.truncatedAtLine !== null)
    errs.push(`file TRUNCATED at line ${r.truncatedAtLine}: more than ${MAX_DYNAMIC_REDIRECT_RULES} dynamic rules. Everything below that line never reaches the edge.`);

  for (const iv of r.invalid) {
    const isAckedLoop = iv.kind === "infinite-loop" && iv.line.split(/\s+/)[0] === ACKNOWLEDGED_INFINITE_LOOP;
    (isAckedLoop ? warns : errs).push(`line ${iv.ln}: ${iv.message}\n      ${iv.line}`);
  }

  // The catch-all must be PARSED (inside the cap). Being parsed-then-ignored as
  // an infinite loop is a separate, reported condition.
  const catchAllLine = text.split("\n").findIndex((l) => /^\s*\/\*\s+\S/.test(l)) + 1;
  const catchAllParsed = r.rules.some((x) => x.from === "/*");
  const catchAllRejected = r.invalid.some((iv) => iv.line.split(/\s+/)[0] === "/*");
  if (!catchAllParsed && !catchAllRejected)
    errs.push(`SPA catch-all "/*" is not among the parsed rules (declared at line ${catchAllLine || "?"}). It fell outside the ${MAX_DYNAMIC_REDIRECT_RULES}-rule dynamic cap.`);

  // Ordering hygiene: any splat-free rule that appears AFTER the first splat rule
  // is silently billed to the dynamic budget. Warn before it becomes an error.
  const firstDynamic = r.rules.find((x) => SPLAT_REGEX.test(x.from) || PLACEHOLDER_REGEX.test(x.from));
  if (firstDynamic) {
    const misfiled = r.rules.filter((x) => x.ln > firstDynamic.ln && !SPLAT_REGEX.test(x.from) && !PLACEHOLDER_REGEX.test(x.from));
    if (misfiled.length)
      warns.push(`${misfiled.length} splat-free rule(s) sit AFTER the first splat rule (line ${firstDynamic.ln}) and are billed to the 100-rule dynamic budget. Move them above it. First: line ${misfiled[0].ln} "${misfiled[0].from}".`);
  }

  return { ...r, errs, warns, label, headroom: MAX_DYNAMIC_REDIRECT_RULES - r.dynamicCount };
}

function report(res) {
  console.log(`  ${res.label}: ${res.rules.length} rules live at the edge`);
  console.log(`    static  ${res.staticCount}/${MAX_STATIC_REDIRECT_RULES}`);
  console.log(`    dynamic ${res.dynamicCount}/${MAX_DYNAMIC_REDIRECT_RULES}  (headroom ${res.headroom})`);
  for (const w of res.warns) console.log(`  ! ${w}`);
  for (const e of res.errs) console.error(`  x ${e}`);
}

// ── selftest: a guard that has stopped biting must fail loudly, not pass quietly ──
function selftest() {
  const cases = [];
  const spa = "/*  /index.html  200";

  // 1. GOOD — statics first, splats last, catch-all inside the cap.
  cases.push(["good: static-first ordering, 3 dynamic rules", false,
    [...Array(300)].map((_, i) => `/alias-${i}  /target-${i}  308`).concat(["/arena/*  /arena/:splat  200", "/packs/*  /packs/:splat  200", spa]).join("\n")]);

  // 2. BAD — the exact production shape: one early splat, then 150 exact rules.
  //    Everything after rule 100 is dropped, catch-all included.
  cases.push(["bad: early splat poisons the budget, catch-all truncated away", true,
    ["/sov-space/*  /gspc-arena  308", ...[...Array(150)].map((_, i) => `/alias-${i}  /target-${i}  308`), spa].join("\n")]);

  // 3. BAD — 101 genuinely dynamic rules with the catch-all last.
  cases.push(["bad: 101 splat rules, catch-all past the cap", true,
    [...[...Array(101)].map((_, i) => `/d${i}/*  /d${i}/:splat  200`), spa].join("\n")]);

  // 4. BAD — malformed rule (4 tokens) and an illegal status code.
  cases.push(["bad: malformed rule + illegal status", true,
    ["/a  /b  308  extra", "/c  /d  404", spa].join("\n")]);

  // 5. GOOD — exactly 100 dynamic rules INCLUDING the catch-all: the boundary.
  cases.push(["good: exactly 100 dynamic rules incl. catch-all (boundary)", false,
    [...[...Array(99)].map((_, i) => `/d${i}/*  /d${i}/:splat  200`), spa].join("\n")]);

  // 6. BAD — one more than the boundary.
  cases.push(["bad: 101st dynamic rule (boundary + 1)", true,
    [...[...Array(100)].map((_, i) => `/d${i}/*  /d${i}/:splat  200`), spa].join("\n")]);

  let failed = 0;
  for (const [name, shouldFail, body] of cases) {
    const res = check(body, { label: name });
    const didFail = res.errs.length > 0;
    const ok = didFail === shouldFail;
    if (!ok) failed++;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}`);
    console.log(`        expected ${shouldFail ? "REJECT" : "ACCEPT"}, guard ${didFail ? "REJECTED" : "ACCEPTED"} — static ${res.staticCount}, dynamic ${res.dynamicCount}, live rules ${res.rules.length}`);
    if (didFail) console.log(`        first error: ${res.errs[0].split("\n")[0]}`);
  }
  if (failed) { console.error(`\nx redirects-guard SELFTEST FAILED: ${failed}/${cases.length} case(s) wrong`); process.exit(1); }
  console.log(`\n✓ redirects-guard selftest: ${cases.length}/${cases.length} cases correct (guard rejects bad input, accepts good)`);
}

// Only act as a CLI when run directly — parseRedirects/check are importable.
const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (!isMain) { /* imported as a library */ }
else main();

function main() {
const arg = process.argv[2];
if (arg === "--selftest") { console.log("redirects-guard selftest"); selftest(); process.exit(0); }

const file = arg || "public/_redirects";
if (!existsSync(file)) { console.error(`x redirects-guard: ${file} not found`); process.exit(1); }
console.log(`redirects-guard: ${file}`);
const res = check(readFileSync(file, "utf8"), { label: file });
report(res);
if (res.errs.length) {
  console.error(`\nx redirects-guard: ${res.errs.length} blocking problem(s). The deploy would go GREEN with these rules silently absent from the edge.`);
  process.exit(1);
}
console.log(`✓ redirects-guard: every rule reaches the edge; ${res.headroom} dynamic rules of headroom`);
}
