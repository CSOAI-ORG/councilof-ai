#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
/**
 * claim-events-changed-pages.mjs — which pages changed, by their dependency atoms, and nothing else.
 *
 *   node scripts/claims/claim-events-changed-pages.mjs \
 *     --feed public/claims/events/v0.1/events.jsonl \
 *     --deps scripts/claims/claim-events-page-deps.json \
 *     [--state STATE.json] [--write-state] [--out OUT.json]
 *
 * It reads the claim-event feed from the last cursor (state.cursor_seq, exclusive) and returns the pages
 * whose declared dependencies changed in the new lines, with a lastmod for each and an IndexNow-shaped
 * urlList. A page whose dependencies did NOT change is not listed — a CONFIRMED re-measurement is not a
 * change, so a daily run that confirms everything moves no subject page and pings nothing.
 *
 * IT DOES NOT PING. This file has no network code (a test holds that). Submitting the urlList is a
 * separate, owner-run step (the existing IndexNow submitter); `pinged` is always false here.
 *
 * Dependency patterns (scripts/claims/claim-events-page-deps.json):
 *   "feed"                         any new line (the feed endpoints themselves: their bytes changed)
 *   "<sealed_id>:atom:<ref>"       that atom's value changed (an atoms line lists it in atoms_changed)
 *   "<sealed_id>:atom:*"           any atom of the subject changed
 *   "<sealed_id>:claim:<ref>"      that claim's change_state is CORRECTED, QUARANTINED or WITHDRAWN, or its
 *                                  recorded_state differs from the last one the feed carried for it
 *   "<sealed_id>:*"                any of the above for the subject
 * <ref> is the ref the feed carries: a claim id / atom name for a DISCLOSED subject, c1../a1.. for a SEALED one.
 *
 * lastmod = the `at` of the newest line that changed one of the page's dependencies.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

// A withdrawal changes the public claim surface just as materially as a correction or
// quarantine. Keep all three as explicit dependency events even if recorded_state is unchanged.
const CHANGE_STATES = new Set(["CORRECTED", "QUARANTINED", "WITHDRAWN"]);

export function parseFeed(text) {
  if (!text) return [];
  return text.replace(/\n$/, "").split("\n").map((l) => JSON.parse(l));
}

/** The atoms each new line changed, as "<sid>:atom:<ref>" / "<sid>:claim:<ref>" keys, with the line's time. */
export function changedKeys(lines, cursorSeq, priorRecorded = {}) {
  const recorded = { ...priorRecorded };
  // Replay recorded_state from lines at or before the cursor, so a first change after the cursor is seen.
  for (const o of lines) if (o.seq <= cursorSeq && o.kind === "event" && o.recorded_state && o.claim !== "*")
    recorded[`${o.subject_sealed_id}:claim:${o.claim}`] = o.recorded_state;
  const out = []; // [{key, at, seq}]
  for (const o of lines) {
    if (o.seq <= cursorSeq) continue;
    out.push({ key: "feed", at: o.at, seq: o.seq });
    const sid = o.subject_sealed_id;
    if (o.kind === "atoms") {
      for (const ref of o.atoms_changed ?? []) out.push({ key: `${sid}:atom:${ref}`, at: o.at, seq: o.seq });
    } else if (o.kind === "event" && o.claim && o.claim !== "*") {
      const k = `${sid}:claim:${o.claim}`;
      const moved = o.recorded_state && recorded[k] !== undefined && recorded[k] !== o.recorded_state;
      if (CHANGE_STATES.has(o.change_state) || moved) out.push({ key: k, at: o.at, seq: o.seq });
      if (o.recorded_state) recorded[k] = o.recorded_state;
    } else if (o.kind === "event" && CHANGE_STATES.has(o.change_state)) {
      out.push({ key: `${sid}:claim:*`, at: o.at, seq: o.seq });
    }
  }
  return { changes: out, recorded };
}

export function matches(pattern, key) {
  if (pattern === key) return true;
  if (pattern === "feed") return false;
  if (pattern.endsWith(":*")) {
    const base = pattern.slice(0, -1); // "<sid>:" or "<sid>:atom:" or "<sid>:claim:"
    return key.startsWith(base) && key !== "feed";
  }
  return false;
}

export function changedPages(feedText, deps, state = {}) {
  const lines = parseFeed(feedText);
  const cursor = Number.isInteger(state.cursor_seq) ? state.cursor_seq : -1;
  const { changes, recorded } = changedKeys(lines, cursor, state.recorded ?? {});
  const pages = [];
  for (const p of deps.pages ?? []) {
    const hits = changes.filter((c) => (p.depends_on ?? []).some((pat) => matches(pat, c.key)));
    if (!hits.length) continue;
    const newest = hits.reduce((a, b) => (b.seq > a.seq ? b : a));
    pages.push({ url: p.url, lastmod: newest.at, because: [...new Set(hits.map((h) => h.key))].slice(0, 20), n_changes: hits.length });
  }
  const last = lines.length ? lines[lines.length - 1].seq : cursor;
  const host = deps.host ?? "councilof.ai";
  return {
    schema: "csoai.claim-events-changed-pages/0.1",
    from_seq_exclusive: cursor,
    to_seq: last,
    n_new_lines: lines.filter((o) => o.seq > cursor).length,
    pages,
    lastmod: Object.fromEntries(pages.map((p) => [p.url, p.lastmod])),
    indexnow: { host, urlList: pages.map((p) => p.url).filter((u) => new URL(u).host === host) },
    pinged: false,
    note: "Nothing was submitted. Pages whose dependencies did not change are not listed.",
    next_state: { cursor_seq: last, recorded },
  };
}

function main() {
  const a = process.argv.slice(2);
  const opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  const feedPath = opt("--feed") ?? "public/claims/events/v0.1/events.jsonl";
  const depsPath = opt("--deps") ?? "scripts/claims/claim-events-page-deps.json";
  const statePath = opt("--state");
  const state = statePath && existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : {};
  const r = changedPages(readFileSync(feedPath, "utf8"), JSON.parse(readFileSync(depsPath, "utf8")), state);
  const s = JSON.stringify(r, null, 1) + "\n";
  if (opt("--out")) writeFileSync(opt("--out"), s); else process.stdout.write(s);
  if (a.includes("--write-state")) {
    if (!statePath) { console.error("--write-state needs --state"); process.exit(2); }
    writeFileSync(statePath, JSON.stringify(r.next_state, null, 1) + "\n");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
