#!/usr/bin/env node
/**
 * board-render-guard.mjs — re-run, after the fact, the check prerender.mjs already makes before it
 * writes its report: the separation figures on every prerendered page equal the board payload the
 * render served (prerender-board-reference.json, board_base64).
 *
 *   node scripts/board-render-guard.mjs dist/client
 *   node scripts/board-render-guard.mjs dist/client --board-reference prerender-board-reference.json --report prerender-report.json
 *
 * Exit 0 = every checked page agrees. Exit 1 = a page prints a number the payload does not carry.
 * Exit 2 = the guard could not run (no reference, no report) — an unread build is not a clean one.
 */
import { readFileSync, existsSync } from "node:fs";
import { guardRenderedBoard } from "./surface/board-render-guard.mjs";

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const dist = args.find((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--"))) ?? "dist/client";
const refPath = arg("board-reference", "prerender-board-reference.json");
const reportPath = arg("report", "prerender-report.json");
if (!existsSync(refPath) || !existsSync(reportPath)) {
  console.error(`board-render-guard: cannot run — need ${refPath} and ${reportPath} from a completed prerender`);
  process.exit(2);
}
const ref = JSON.parse(readFileSync(refPath, "utf8"));
if (typeof ref.board_base64 !== "string") { console.error("board-render-guard: reference carries no board bytes"); process.exit(2); }
const raw = Buffer.from(ref.board_base64, "base64");
const { checked, expected, violations } = guardRenderedBoard(dist, JSON.parse(readFileSync(reportPath, "utf8")), raw);
console.log(`board-render-guard: ${checked} prerendered pages checked against the served board (${ref.served_from ?? "served_from not recorded"}): ` +
  `${expected.separated} separated · ${expected.ties} TIE · ${expected.untested} UNTESTED of ${expected.comparison}`);
if (!checked) { console.error("board-render-guard: no prerendered page found — nothing was checked"); process.exit(2); }
if (violations.length) {
  for (const v of violations.slice(0, 40)) console.error(`  ${v.route}  [${v.rule}] "${v.found}"  (${v.mismatch})`);
  console.error(`board-render-guard FAILED: ${violations.length} figure(s) on ${new Set(violations.map((v) => v.route)).size} page(s) disagree with the board payload`);
  process.exit(1);
}
console.log("board-render-guard OK");
