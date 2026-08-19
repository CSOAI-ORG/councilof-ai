#!/usr/bin/env node
/**
 * reg-watch.mjs — the regulation-change detector (living-loop trigger, v0.1).
 *
 * Polls official, free sources for the instruments the GSPC board measures
 * against, fingerprints each, and compares to the committed state file. On
 * change it emits a provision-change event (JSON to stdout + reg-watch-events/)
 * and exits 2 so the workflow can raise the alarm (issue/notification).
 *
 * Honest v0.1 scope: DETECTION only. No pass exists yet, so nothing flips to
 * EXPIRED-REGULATION-CHANGED — the event is the primitive later stages consume
 * (pass issuer → Bitstring status flip). Fingerprints prefer stable metadata
 * (Last-Modified, consolidation dates) and fall back to a content hash of the
 * fetched body; a fetch failure is reported as UNREACHABLE, never as a change.
 *
 * Run: node scripts/reg-watch.mjs            (compare + emit)
 *      node scripts/reg-watch.mjs --init     (write initial state, no events)
 * State: reg-watch-state.json (committed — the memory between runs)
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

// The watchlist: instrument id → { url, note }. ELI/permanent URLs only.
const WATCH = {
  "eu-ai-act-2024-1689": {
    url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    note: "EU AI Act — the board's primary anchor (Art 4/5/50, Annex III)",
  },
  "eu-gdpr-2016-679": {
    url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    note: "GDPR — crosswalked provisions",
  },
  "eu-machinery-2023-1230": {
    url: "https://eur-lex.europa.eu/eli/reg/2023/1230/oj",
    note: "Machinery Regulation — MachBench axis anchor",
  },
  "uk-dpa-2018": {
    url: "https://www.legislation.gov.uk/ukpga/2018/12/data.xml",
    note: "UK Data Protection Act 2018 (legislation.gov.uk XML carries revision metadata)",
  },
  "uk-duaa-2025-changes": {
    url: "https://www.legislation.gov.uk/changes/affected/ukpga/2025?results-count=20&sort=affecting-year-number",
    note: "UK DUAA 2025 — changes-affecting feed (PECR/analytics posture depends on it)",
  },
};

const STATE_FILE = new URL("../reg-watch-state.json", import.meta.url).pathname;
const EVENTS_DIR = new URL("../reg-watch-events/", import.meta.url).pathname;
const INIT = process.argv.includes("--init");

const sha = (s) => createHash("sha256").update(s).digest("hex");

/** Fingerprint = stable headers if present, else body hash with volatile bits stripped. */
async function fingerprint(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "csoai-reg-watch/0.1 (+https://councilof.ai; measurement body change-detector)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const lastMod = res.headers.get("last-modified") || "";
  const etag = res.headers.get("etag") || "";
  let body = await res.text();
  // Strip volatile chrome: session tokens, dates-now, nonces (best-effort, conservative).
  body = body
    .replace(/name="__?[A-Za-z]*token"[^>]*>/gi, "")
    .replace(/nonce="[^"]*"/gi, "")
    .replace(/\b20\d\d-\d\d-\d\dT[\d:.]+Z?\b/g, (m) => (body.indexOf(m) < 2000 ? m : "")) // keep early dates (doc metadata), drop late ones (footers)
    .replace(/\s+/g, " ");
  return {
    method: lastMod || etag ? "headers+body" : "body",
    last_modified: lastMod,
    etag,
    body_sha256: sha(body),
  };
}

const state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, "utf8")) : { instruments: {} };
const now = new Date().toISOString();
const events = [];
let unreachable = 0;

for (const [id, { url, note }] of Object.entries(WATCH)) {
  process.stdout.write(`checking ${id} ... `);
  try {
    const fp = await fingerprint(url);
    const prev = state.instruments[id];
    if (!prev || INIT) {
      state.instruments[id] = { url, note, ...fp, first_seen: prev?.first_seen ?? now, checked: now };
      console.log(INIT ? "initialised" : "first-seen (baseline recorded)");
      continue;
    }
    const changed =
      (prev.last_modified && fp.last_modified && prev.last_modified !== fp.last_modified) ||
      prev.body_sha256 !== fp.body_sha256;
    if (changed) {
      const event = {
        schema: "csoai.provision-change-event/0.1",
        instrument: id,
        url,
        note,
        detected_at: now,
        previous: { last_modified: prev.last_modified, body_sha256: prev.body_sha256, checked: prev.checked },
        current: { last_modified: fp.last_modified, body_sha256: fp.body_sha256 },
        register:
          "A detected change in the published source of a legal instrument. Detection only — " +
          "not a legal interpretation of what changed. Later stages map the change to affected " +
          "provisions and flip dependent state records to EXPIRED-REGULATION-CHANGED.",
      };
      events.push(event);
      console.log("CHANGED");
    } else {
      console.log("unchanged");
    }
    state.instruments[id] = { url, note, ...fp, first_seen: prev.first_seen, checked: now };
  } catch (e) {
    unreachable++;
    console.log(`UNREACHABLE (${e.message}) — state kept, not treated as a change`);
    if (state.instruments[id]) state.instruments[id].last_error = `${now}: ${e.message}`;
  }
}

writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n");

if (events.length) {
  mkdirSync(EVENTS_DIR, { recursive: true });
  for (const ev of events) {
    const p = `${EVENTS_DIR}${ev.detected_at.slice(0, 10)}-${ev.instrument}.json`;
    writeFileSync(p, JSON.stringify(ev, null, 2) + "\n");
    console.log(`event written: ${p}`);
  }
  console.log(`\nREG-WATCH: ${events.length} provision-change event(s) detected.`);
  process.exit(2);
}
console.log(`\nREG-WATCH: no changes (${unreachable} unreachable).`);
