#!/usr/bin/env node
/**
 * counter-lint — enforces SOV-Counter-Canon.md / counters.json (G3 law).
 *
 * Fails (exit 1) when shipping source contains a number that conflicts with the
 * canon: a rejected drift value for a canonical metric, or a register-retracted
 * claim. This is the enforcement half of the counter canon — the canon file is
 * the source of truth; any page that disagrees is wrong by definition.
 *
 * Usage: node scripts/counter-lint.mjs [scanDir=client/src]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_DIR = path.resolve(REPO, process.argv[2] || "client/src");
const canon = JSON.parse(fs.readFileSync(path.join(REPO, "counters.json"), "utf8")).counters;

const mcp = canon.governed_mcp_servers || {};
const mcpForbidden = (mcp.drift_rejected || [233, 293, 341, 378]).join("|");

// A rule flags a line when `pattern` matches. Keep patterns proximity-bound to
// avoid flagging unrelated numbers.
const RULES = [
  {
    id: "governed_mcp_servers",
    severity: "error", // numeric drift blocks the deploy gate
    // a rejected drift value directly qualifying an MCP count (either order, <=30 chars apart)
    pattern: new RegExp(
      `\\b(${mcpForbidden})\\b[^\\n]{0,30}(MCP|governed[^\\n]{0,12}(server|tool))|` +
        `(MCP|governed[^\\n]{0,12}(server|tool))[^\\n]{0,30}\\b(${mcpForbidden})\\b`,
      "i"
    ),
    message: `MCP-server count drift — canon is ${mcp.value || "291"} governed MCP servers (evidence/registry/mcp-servers-count.json).`,
  },
  {
    id: "retracted_33_agent_council",
    // WARN not error: DR-0007 retracted the 33-agent Byzantine council, but rebadge-vs-pull
    // is an open owner decision and the council feature is under active edit. Tracked debt,
    // does not block the deploy gate. Escalate to 'error' once the decision is made.
    severity: "warn",
    pattern: /33[\s-]?agent|byzantine\s+council/i,
    message: 'DR-0007-retracted "33-agent Byzantine council". Owner decision needed: badge DESIGNED/SIMULATED or pull. signed-agents canon is PENDING (candidate 19).',
  },
];

// Files this lint must not police (the canon + its evidence describe the drift on purpose).
const EXEMPT = new Set([
  "counters.json",
  "SOV-Counter-Canon.md",
  "scripts/counter-lint.mjs",
]);
const EXEMPT_DIR_RE = /(^|\/)(evidence|node_modules|dist|test-results|\.git)(\/|$)/;
const EXT = /\.(tsx?|jsx?|json|md|html)$/;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    const rel = path.relative(REPO, full);
    if (EXEMPT_DIR_RE.test("/" + rel)) continue;
    if (e.isDirectory()) walk(full, out);
    else if (EXT.test(e.name)) out.push(full);
  }
  return out;
}

const hits = { error: [], warn: [] };
for (const file of walk(SCAN_DIR)) {
  const rel = path.relative(REPO, file);
  if (EXEMPT.has(rel)) continue;
  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.pattern.test(line)) {
        hits[rule.severity].push({ rel, line: i + 1, rule: rule.id, message: rule.message, text: line.trim().slice(0, 120) });
      }
    }
  });
}

// Warnings: report the debt, count by rule, do not block.
if (hits.warn.length) {
  const byRule = {};
  for (const w of hits.warn) byRule[w.rule] = (byRule[w.rule] || 0) + 1;
  console.warn(`\n⚠ counter-lint: ${hits.warn.length} tracked-debt warning(s) (non-blocking):`);
  for (const [rule, n] of Object.entries(byRule)) {
    console.warn(`  · ${rule}: ${n} occurrence(s) — ${RULES.find((r) => r.id === rule).message}`);
  }
}

// Errors: block.
if (hits.error.length) {
  console.error(`\n✖ counter-lint: ${hits.error.length} BLOCKING canon violation(s)\n`);
  for (const v of hits.error) {
    console.error(`  ${v.rel}:${v.line}  [${v.rule}]`);
    console.error(`    ${v.message}`);
    console.error(`    > ${v.text}\n`);
  }
  process.exit(1);
}
console.log(`\n✓ counter-lint: no blocking canon violations in ${path.relative(REPO, SCAN_DIR)}` + (hits.warn.length ? ` (${hits.warn.length} tracked warnings above)` : ""));
