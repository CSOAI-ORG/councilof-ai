#!/usr/bin/env node
/**
 * sweep-report.mjs — merge surface-sweep per-route results into
 *   e2e/tests/visual/report/sweep-report.json   (machine)
 *   docs/FRONTEND_CHECKLIST.md                  (human checklist)
 *
 * Usage: node scripts/sweep-report.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_DIR = path.join(ROOT, 'e2e/tests/visual/report');
const RESULTS_DIR = path.join(REPORT_DIR, 'results');
const OUT_JSON = path.join(REPORT_DIR, 'sweep-report.json');
const OUT_MD = path.join(ROOT, 'docs/FRONTEND_CHECKLIST.md');

if (!fs.existsSync(RESULTS_DIR)) {
  console.error('no results dir — run the sweep first: e2e/tests/surface-sweep.spec.ts');
  process.exit(1);
}

const results = fs.readdirSync(RESULTS_DIR)
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, f), 'utf8')))
  .sort((a, b) => a.route.localeCompare(b.route));

const classify = (r) => {
  if (r.navError) return 'NAV-FAIL';
  if (r.navStatus >= 400) return 'HTTP-' + r.navStatus;
  if (r.pageErrors.length) return 'JS-ERROR';
  if (r.failedRequests.length) return 'REQ-FAIL';
  if (r.consoleErrors.length) return 'CONSOLE-ERR';
  return 'OK';
};

const summary = { OK: 0, 'JS-ERROR': 0, 'REQ-FAIL': 0, 'CONSOLE-ERR': 0, 'NAV-FAIL': 0, HTTP: 0 };
for (const r of results) {
  r.verdict = classify(r);
  if (r.verdict.startsWith('HTTP-')) summary.HTTP++;
  else summary[r.verdict] = (summary[r.verdict] || 0) + 1;
}

let dynamic = { skipped: [] };
try { dynamic = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, 'dynamic-routes.json'), 'utf8')); } catch {}

const report = {
  generatedAt: new Date().toISOString(),
  baseURL: process.env.BASE_URL || 'http://localhost:4173',
  total: results.length,
  summary,
  dynamicRoutes: dynamic.skipped,
  results,
};
fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2));

const rows = results.map(r => {
  const issues = [];
  if (r.pageErrors.length) issues.push(r.pageErrors[0].slice(0, 80));
  if (r.failedRequests.length) issues.push(`${r.failedRequests.length} req>=400 (${r.failedRequests[0].status})`);
  if (r.consoleErrors.length && !r.pageErrors.length) issues.push(`${r.consoleErrors.length} console err`);
  if (r.navError) issues.push(r.navError.slice(0, 80));
  return `| \`${r.route}\` | ${r.verdict} | ${issues.join('; ') || '—'} | [shot](../e2e/tests/visual/report/${r.screenshot}) |`;
});

const md = `# Frontend Checklist — www.csoai.org surface sweep

Generated: ${report.generatedAt} · base: ${report.baseURL} · ${report.total} routes swept
(${dynamic.skipped.length} dynamic routes excluded — see sweep-report.json)

| Verdict | Count |
|---|---|
| OK | ${summary.OK} |
| JS-ERROR | ${summary['JS-ERROR']} |
| REQ-FAIL | ${summary['REQ-FAIL']} |
| CONSOLE-ERR | ${summary['CONSOLE-ERR']} |
| NAV-FAIL | ${summary['NAV-FAIL']} |
| HTTP>=400 | ${summary.HTTP} |

## Route checklist

| Route | Verdict | First issue | Screenshot |
|---|---|---|---|
${rows.join('\n')}

## Honesty columns (filled by audit — see plan Phase 0.3)

Data-source classification per visual component (REAL | STATIC | RANDOM) lives in
sweep-report.json \`results[*]\` + the manual audit table in the unification plan.
Math.random() audit: decorative-particle = keep; data-shaping = kill or label
"design simulation" (pattern set by commit 096f1f9).
`;
fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
fs.writeFileSync(OUT_MD, md);

console.log(`swept ${report.total} routes — OK:${summary.OK} JS:${summary['JS-ERROR']} REQ:${summary['REQ-FAIL']} CONSOLE:${summary['CONSOLE-ERR']} NAV:${summary['NAV-FAIL']} HTTP:${summary.HTTP}`);
console.log('→', path.relative(ROOT, OUT_JSON));
console.log('→', path.relative(ROOT, OUT_MD));
