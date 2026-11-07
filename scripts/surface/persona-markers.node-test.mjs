#!/usr/bin/env node
/**
 * persona-markers.node-test.mjs — the LIVE persona gauntlet must not be able to drift away
 * from the tree without saying so.
 *
 * WHY. scripts/persona-gauntlet.mjs hits the live site every two hours and fails when a
 * persona's markers are missing. It is a gate over the DEPLOYED page, so nothing in a pull
 * request can see it go stale: on 2026-11-04 the /honesty page stopped carrying the markers
 * the gauntlet demanded, and the gauntlet went red on ten consecutive scheduled runs
 * (11-04T12:07Z through 11-07T01:55Z) with nobody reading them. The markers were not
 * "missing copy" — they were copy the estate forbids (public-copy.node-test.mjs asserts the
 * public copy does NOT contain them), so the gate was crying wolf on a correct tree.
 *
 * WHAT IT CHECKS. For every persona whose route is a rendered page (not a JSON endpoint):
 *   - every `must` marker must occur in client/src — the page source that gets built.
 *   - every `forbid` regex must NOT occur in client/src.
 * A copy change that invalidates the gauntlet therefore fails a pull request, instead of
 * being discovered by a schedule two hours later.
 *
 * JSON personas are excluded from the must-check on purpose: their markers are response
 * payload keys ("measured_axes", "doi"), not page copy, and they are not in client/src.
 *
 *   node --test scripts/surface/persona-markers.node-test.mjs
 *
 * No network, no deps.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.dirname(path.dirname(HERE));
const GAUNTLET = path.join(REPO, "scripts", "persona-gauntlet.mjs");
const SOURCE_ROOT = path.join(REPO, "client", "src");
const TEXT_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".html", ".css", ".json", ".md"]);

/**
 * Pull the PERSONAS table out of the gauntlet source WITHOUT executing it — the gauntlet
 * runs against the network on import, which a unit test must not do.
 */
export function extractPersonas(src) {
  const start = src.indexOf("const PERSONAS = [");
  assert.ok(start > -1, "persona-gauntlet.mjs must declare a PERSONAS table");
  const open = src.indexOf("[", start);
  const objs = [];
  let depth = 0;
  let begin = -1;
  let quote = null;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === "\\") { i++; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "{") { if (depth === 0) begin = i; depth++; continue; }
    if (ch === "}") {
      depth--;
      if (depth === 0 && begin > -1) { objs.push(src.slice(begin, i + 1)); begin = -1; }
      continue;
    }
    if (ch === "]" && depth === 0) break;
  }
  assert.ok(objs.length > 0, "persona-gauntlet.mjs must declare at least one persona");

  return objs.map((raw) => {
    const who = (raw.match(/who:\s*"([^"]+)"/) || [])[1] || "(unnamed)";
    const route = (raw.match(/path:\s*"([^"]+)"/) || [])[1] || "";
    const json = /\bjson:\s*true\b/.test(raw);
    const must = [];
    for (const m of raw.matchAll(/\bmust:\s*\[([^\]]*)\]/g)) {
      for (const s of m[1].matchAll(/"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g)) {
        must.push(s[1] !== undefined ? JSON.parse(`"${s[1]}"`) : s[2]);
      }
    }
    const forbid = [];
    for (const m of raw.matchAll(/\bforbid:\s*\[([^\]]*)\]/g)) {
      for (const s of m[1].matchAll(/\/((?:[^/\\\n]|\\.)+)\/([a-z]*)/g)) {
        forbid.push(new RegExp(s[1], s[2] || ""));
      }
    }
    return { who, route, json, must, forbid };
  });
}

/**
 * The audit itself: which markers the tree does not carry, and which forbidden patterns it
 * carries anyway. Returns data — it does not assert — so the same function can be run over
 * a fixture to prove it can fail.
 */
export function auditPersonas(personas, corpus) {
  const missing = [];
  const forbidden = [];
  for (const p of personas) {
    // A JSON persona checks a SERVED payload (the agent card, the board API). Its markers are
    // response keys, and its forbids are rules about that payload — the a2a-agent forbids the
    // old org name in the card, while client/src legitimately NAMES that org in a factual
    // sentence about who publishes from which account. Reading a payload rule against the
    // page source would be a category error, so JSON personas are out of scope here and the
    // gauntlet keeps checking them against the live payload it actually fetches.
    if (p.json) continue;
    for (const marker of p.must) {
      if (!corpus.includes(marker)) missing.push({ who: p.who, route: p.route, marker });
    }
    for (const re of p.forbid) {
      if (re.test(corpus)) forbidden.push({ who: p.who, route: p.route, pattern: String(re) });
    }
  }
  return { missing, forbidden };
}

/** One corpus of the page source, so a marker is found wherever it lives. */
export function readCorpus(root) {
  const parts = [];
  const walk = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (!e.isFile() || !TEXT_EXT.has(path.extname(e.name))) continue;
      try { parts.push(fs.readFileSync(full, "utf8")); } catch { /* unreadable file is not a marker */ }
    }
  };
  walk(root);
  return parts.join("\n");
}

test("the gauntlet's PERSONAS table parses into 8 personas with markers", () => {
  const personas = extractPersonas(fs.readFileSync(GAUNTLET, "utf8"));
  assert.equal(personas.length, 8, "the estate ships 8 personas; a parse that finds fewer is a broken parse, not a quiet pass");
  const auditor = personas.find((p) => p.who === "auditor");
  assert.ok(auditor, "the auditor persona must exist");
  assert.ok(auditor.must.length > 0, "the auditor persona must still demand markers — an empty list would pass everything");
  assert.ok(auditor.forbid.length > 0, "the auditor persona must forbid the retired copy, not merely stop demanding it");
});

test("every live marker the gauntlet demands is in the page source, and none of its forbids are", () => {
  const personas = extractPersonas(fs.readFileSync(GAUNTLET, "utf8"));
  const corpus = readCorpus(SOURCE_ROOT);
  const { missing, forbidden } = auditPersonas(personas, corpus);
  assert.deepEqual(missing, [], `gauntlet markers absent from client/src: ${JSON.stringify(missing, null, 2)}`);
  assert.deepEqual(forbidden, [], `gauntlet forbids present in client/src: ${JSON.stringify(forbidden, null, 2)}`);
});

test("the audit covers the page personas and skips the JSON ones, on purpose", () => {
  const personas = extractPersonas(fs.readFileSync(GAUNTLET, "utf8"));
  const jsonPersonas = personas.filter((p) => p.json);
  assert.equal(jsonPersonas.length, 2, "the api-agent and a2a-agent read served payloads, not the page source");
  const { missing } = auditPersonas(jsonPersonas, "");
  assert.deepEqual(missing, [], "a JSON persona must not be audited against the page source");
});

test("CONTROL: the audit reports a marker the tree does not carry", () => {
  const personas = [{ who: "x", route: "/x", json: false, must: ["a string no page carries"], forbid: [] }];
  const { missing } = auditPersonas(personas, "some other text");
  assert.equal(missing.length, 1);
  assert.equal(missing[0].marker, "a string no page carries");
});

test("CONTROL: the audit reports a forbidden pattern the tree does carry", () => {
  const personas = [{ who: "x", route: "/x", json: false, must: [], forbid: [/retired copy/i] }];
  const { forbidden } = auditPersonas(personas, "this page still carries the Retired Copy line");
  assert.equal(forbidden.length, 1);
  assert.match(forbidden[0].pattern, /retired copy/i);
});

test("CONTROL: the parse is not vacuous — a persona with no markers is still counted", () => {
  const personas = extractPersonas('const PERSONAS = [{ who: "a", path: "/a", must: [] }];');
  assert.equal(personas.length, 1);
  assert.deepEqual(personas[0].must, []);
});
