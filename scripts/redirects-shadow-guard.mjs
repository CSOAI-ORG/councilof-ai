#!/usr/bin/env node
/**
 * redirects-shadow-guard.mjs — a _redirects rule that a Pages Function owns never runs.
 *
 * WHY. On Cloudflare Pages, a Function at functions/<path>.ts (or
 * functions/<path>/index.ts) is matched BEFORE public/_redirects. So a rule for a
 * path that also has a Function is dead: it is in the file, it looks live, and it
 * never fires.
 *
 * This is not theoretical. Measured on master 2026-09-06:
 *
 *   functions/sov-space.ts  — "Route retired 17 Aug 2026. Do not restore. Do not
 *                              redirect." returns 410.
 *   _redirects:36           — /sov-space  /gspc-arena  308
 *
 * The file said redirect, the Function said do not redirect, and production
 * returned 410. Meanwhile /sovereign-space, which has NO Function, really does
 * 308 to /gspc-arena — so two synonymous retired paths behave differently, and
 * reading _redirects tells you the opposite of what the estate decided.
 *
 * 25 rules were shadowed this way when this guard was written.
 *
 * WHY THE EXISTING GUARD DOES NOT CATCH IT. scripts/redirects-guard.mjs checks
 * Cloudflare's rule-count budget (2000 static / 100 dynamic) and prints "every rule
 * reaches the edge". That sentence is about the budget. The file contains zero
 * mentions of "functions" and cannot see this class at all — so it passes while 25
 * rules are dead. A guard that passes on a defect it cannot see is worse than no
 * guard, because the pass is read as an assurance.
 *
 *   node scripts/redirects-shadow-guard.mjs             # report, exit 1 if any
 *   node scripts/redirects-shadow-guard.mjs --selftest  # prove it can fail
 *   node scripts/redirects-shadow-guard.mjs --allow-known  # only NEW shadows fail
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Every route a Pages Function claims, as a leading-slash path. */
export function functionRoutes(fnDir) {
  const out = new Set();
  if (!existsSync(fnDir)) return out;
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        // functions/foo/index.ts claims /foo
        if (existsSync(join(full, "index.ts")) || existsSync(join(full, "index.js"))) {
          out.add(`${prefix}/${entry}`);
        }
        walk(full, `${prefix}/${entry}`);
      } else if (/\.(ts|js|mjs)$/.test(entry) && !/\.test\./.test(entry)) {
        const base = entry.replace(/\.(ts|js|mjs)$/, "");
        if (base === "index" || base.startsWith("_")) continue;
        out.add(`${prefix}/${base}`);
      }
    }
  };
  walk(fnDir, "");
  return out;
}

/** Rules in a _redirects body, as {line, from, to, code}. */
export function parseRules(body) {
  const rules = [];
  body.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const [from, to, code] = line.split(/\s+/);
    if (!from || !from.startsWith("/") || !to) return;
    rules.push({ line: i + 1, from, to, code: code ?? "" });
  });
  return rules;
}

/** A rule is shadowed when a Function claims the same concrete path. */
export function findShadowed(rules, fnRoutes) {
  return rules
    .filter((r) => {
      const path = r.from.replace(/\/$/, "").replace(/\/\*$/, "");
      return path !== "" && fnRoutes.has(path);
    })
    .map((r) => ({ ...r, owner: `functions${r.from.replace(/\/$/, "").replace(/\/\*$/, "")}.ts` }));
}

function selftest() {
  const fake = new Set(["/gone", "/nested"]);
  const rules = parseRules(
    ["/gone      /somewhere   308", "/live      /elsewhere   308", "/nested/   /x  308"].join("\n"),
  );
  const hits = findShadowed(rules, fake);
  const got = hits.map((h) => h.from).sort();
  if (got.length !== 2) throw new Error(`selftest FAILED: expected 2 shadowed, got ${got.length}`);
  if (!got.includes("/gone")) throw new Error("selftest FAILED: missed a shadowed rule");
  if (got.includes("/live")) throw new Error("selftest FAILED: flagged an unshadowed rule");
  // and a file with no shadows must pass
  if (findShadowed(parseRules("/live /elsewhere 308"), fake).length !== 0)
    throw new Error("selftest FAILED: false positive on a clean file");
  console.log("redirects-shadow-guard selftest: OK (catches shadowed, ignores clean)");
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--selftest")) return selftest();

  const fnRoutes = functionRoutes(join(ROOT, "functions"));
  const rules = parseRules(readFileSync(join(ROOT, "public/_redirects"), "utf8"));
  const shadowed = findShadowed(rules, fnRoutes);

  if (!shadowed.length) {
    console.log(
      `✓ redirects-shadow-guard: no _redirects rule is shadowed by a Pages Function ` +
        `(${rules.length} rules, ${fnRoutes.size} function routes)`,
    );
    return;
  }

  console.error("✖ redirects-shadow-guard: these _redirects rules can never fire —");
  console.error("  a Pages Function owns the same path and is matched first.\n");
  for (const s of shadowed) {
    console.error(`  _redirects:${String(s.line).padStart(4)}  ${s.from} -> ${s.to} ${s.code}`);
    console.error(`  ${" ".repeat(16)}owned by ${s.owner}`);
  }
  console.error(
    `\n  ${shadowed.length} dead rule(s). Either delete the rule, or delete the Function — ` +
      `but do not leave the file claiming a redirect that production does not perform.`,
  );
  process.exit(1);
}

main();
