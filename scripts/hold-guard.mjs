#!/usr/bin/env node
// hold-guard — a PR that says "do not merge" must not show green.
//
// WHY. Lanes self-merge with the shared token, and "hold" lived only in prose: a title prefix or a
// label that a human reads and a merge script does not. This turns the marker into a failing check,
// so a held PR is red until the marker is removed.
//
// FAILS when the PR has a label named (case-insensitive, -/_/space treated alike)
//     hold | do-not-merge | do not merge
// or its title contains (case-insensitive)
//     [HOLD] | HOLD: | DO NOT MERGE
// Otherwise it passes. "HOLD:" must start a word, so "threshold: 5" and "household:" do not match.
//
// Input is the event payload only (GITHUB_EVENT_PATH, i.e. github.event.pull_request.labels / title).
// No token, no network, no checkout beyond this file.
//
//   node scripts/hold-guard.mjs              read $GITHUB_EVENT_PATH, exit 1 on a hold marker
//   node scripts/hold-guard.mjs --event f    same, from a payload file
//   node scripts/hold-guard.mjs --selftest   fixed cases, exit 1 if any disagrees

import { readFileSync } from "node:fs";

const HOLD_LABELS = new Set(["hold", "do-not-merge"]);

const TITLE_MARKERS = [
  { name: "[HOLD]", re: /\[\s*hold\s*\]/i },
  { name: "HOLD:", re: /(?<![a-z0-9])hold\s*:/i },
  { name: "DO NOT MERGE", re: /(?<![a-z0-9])do[\s_-]+not[\s_-]+merge(?![a-z0-9])/i },
];

export function normLabel(name) {
  return String(name ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "-");
}

/** @returns {string[]} the reasons this PR is held; empty = not held */
export function holdReasons(pr) {
  const reasons = [];
  for (const l of pr?.labels ?? []) {
    const name = typeof l === "string" ? l : l?.name;
    if (HOLD_LABELS.has(normLabel(name))) reasons.push(`label "${name}"`);
  }
  const title = String(pr?.title ?? "");
  for (const m of TITLE_MARKERS) {
    if (m.re.test(title)) reasons.push(`title contains ${m.name}`);
  }
  return reasons;
}

function selftest() {
  const L = (...names) => names.map((name) => ({ name }));
  const cases = [
    // [expectHeld, title, labels]
    [true, "[HOLD] gates: tighten link gate", []],
    [true, "[hold] lowercase bracket", []],
    [true, "gates: [ Hold ] spaced bracket", []],
    [true, "HOLD: waiting on owner", []],
    [true, "hold: lowercase prefix", []],
    [true, "home: copy fix (HOLD: needs review)", []],
    [true, "DO NOT MERGE - experiment", []],
    [true, "experiment, do not merge", []],
    [true, "Do-Not-Merge: probe", []],
    [true, "normal title", L("hold")],
    [true, "normal title", L("HOLD")],
    [true, "normal title", L("do-not-merge")],
    [true, "normal title", L("DO NOT MERGE")],
    [true, "normal title", L("Do Not Merge")],
    [true, "normal title", L("documentation", "do_not_merge")],
    [true, "normal title", ["hold"]],
    [false, "home: stop upscaling the band photographs", []],
    [false, "household: pricing copy", []],
    [false, "threshold: raise the 150-row floor", []],
    [false, "threshold:5 and Household:3", []],
    [false, "gates: a threshold check for household data", []],
    [false, "holding page for /reach", []],
    [false, "withhold: nothing", []],
    [false, "placeholder: [HOLDER] text", []],
    [false, "hold the line on gates", []],
    [false, "do not mergeable list", []],
    [false, "normal title", L("documentation", "on-hold-review", "holdout", "threshold")],
    [false, "", []],
  ];
  let bad = 0;
  for (const [want, title, labels] of cases) {
    const got = holdReasons({ title, labels }).length > 0;
    const ok = got === want;
    if (!ok) bad++;
    const shown = labels.map((l) => (typeof l === "string" ? l : l.name)).join(",");
    console.log(`${ok ? "ok  " : "FAIL"} ${want ? "held" : "pass"}  title=${JSON.stringify(title)} labels=[${shown}]`);
  }
  console.log(`hold-guard selftest: ${cases.length - bad}/${cases.length} cases agree`);
  return bad === 0;
}

function main(argv) {
  if (argv.includes("--selftest")) return selftest() ? 0 : 1;
  const i = argv.indexOf("--event");
  const path = i >= 0 ? argv[i + 1] : process.env.GITHUB_EVENT_PATH;
  if (!path) {
    console.error("hold-guard: no event payload (set GITHUB_EVENT_PATH or pass --event FILE)");
    return 2;
  }
  const event = JSON.parse(readFileSync(path, "utf8"));
  const pr = event.pull_request;
  if (!pr) {
    console.log("hold-guard: not a pull_request event — nothing to hold");
    return 0;
  }
  const reasons = holdReasons(pr);
  const labels = (pr.labels ?? []).map((l) => l.name).join(", ") || "(none)";
  console.log(`PR #${pr.number}: ${JSON.stringify(pr.title)}`);
  console.log(`labels: ${labels}`);
  if (reasons.length) {
    for (const r of reasons) console.log(`::error title=hold-guard::PR is on hold: ${r}`);
    console.log("HELD — remove the label / title marker to clear this check.");
    return 1;
  }
  console.log("not held — no hold label or title marker.");
  return 0;
}

process.exitCode = main(process.argv.slice(2));
