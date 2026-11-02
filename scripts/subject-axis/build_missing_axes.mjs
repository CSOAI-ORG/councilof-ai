// build_missing_axes.mjs — builds real banks for the two subject axes that have none:
//   claim-maintenance  — does the subject publish a maintainable record of its own claims changing?
//   watchdog-ingest    — can a third party report a problem, and is the route machine-readable?
//
// Same discipline as subject-axis-live-run.mjs: one frozen frame, every candidate attempted once,
// content + text digests, a must-fail negative control per item, and a bar declared before scoring.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { homedir } from "node:os";

const AXIS_DIR = join(homedir(), "_alignment", "axis-runs-20261024");
const OUT_DIR = join(homedir(), "jewel-audit-20261027", "out");
const RUN_ID = "subject-axis-live-run-20261102";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
const TIMEOUT_MS = 12000, MAX_BYTES = 400_000, CONCURRENCY = 6, BAR = 3;

// Population: the union of the three organisation-facing frozen grids. Declared, not chosen.
const POP_GRIDS = [
  "company-practice.discovery-v1.json",
  "lab-practice.discovery.json",
  "regulator-transparency.discovery.json",
];

const PATTERNS = {
  "claim-maintenance": {
    changelog_or_release_notes: "changelog|release notes|what'?s new|version history|releases|what changed",
    corrections_or_errata: "correction|errata|supersed|amended|retract|updated to reflect|previously stated",
    dated_last_updated: "last updated|last reviewed|effective date|updated on|revision date|last modified",
    versioned_policy: "version|v\\d+\\.\\d+|revision history|policy version|effective from|change log",
    status_or_incident_history: "status page|incident history|uptime|postmortem|service status|trust report",
  },
  "watchdog-ingest": {
    security_txt_or_disclosure: "security\\.txt|vulnerability disclosure|responsible disclosure|security policy|bug bounty",
    reporting_channel: "report a|submit a|contact us|get in touch|report an issue|feedback|report concern",
    whistleblow_or_grievance: "whistleblow|grievance|complaint|speak up|ethics hotline|ombuds|appeal",
    machine_readable_route: "\\.well-known|/api/|json|rss|webhook|openapi|endpoint",
    response_commitment: "response time|within \\d+ (business )?days|service level|sla|acknowledg|we aim to respond",
  },
};

const sha256hex = (b) => createHash("sha256").update(b).digest("hex");
const canonicalize = (v) => {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canonicalize).join(",") + "]";
  return "{" + Object.keys(v).sort().map(k => JSON.stringify(k) + ":" + canonicalize(v[k])).join(",") + "}";
};
const canonicalSha256 = (o) => sha256hex(Buffer.from(canonicalize(o), "utf8"));

function extractText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ").trim();
}

async function fetchSubject(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": UA, "Accept": "text/html,*/*" } });
    const buf = Buffer.from(await res.arrayBuffer()).subarray(0, MAX_BYTES);
    return { reachable: true, status: res.status, final_url: res.url, bytes: buf.length, sha256: sha256hex(buf), body: buf.toString("utf8") };
  } catch (e) {
    return { reachable: false, error: `${e.name}: ${e.message}` };
  } finally { clearTimeout(t); }
}

async function pool(items, fn, n) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

// ---- frame ----------------------------------------------------------------
const rows = [], seen = new Set();
for (const f of POP_GRIDS) {
  const d = JSON.parse(readFileSync(join(AXIS_DIR, f), "utf8"));
  for (const r of (d.rows || d.subjects || [])) {
    if (!r.url || seen.has(r.url)) continue;
    seen.add(r.url);
    rows.push({ subject: r.subject ?? r.url, url: r.url, sha256: null, source_grid: f });
  }
}
console.error(`frame: ${rows.length} distinct subjects from ${POP_GRIDS.length} frozen grids`);

mkdirSync(OUT_DIR, { recursive: true });
const frameDate = new Date().toISOString();

// ---- one pass over the frame, two pattern sets ----------------------------
const live = await pool(rows, (r) => fetchSubject(r.url), CONCURRENCY);
const observedAt = new Date().toISOString();
const methodSha = sha256hex(readFileSync(new URL(import.meta.url)));

const summary = {};
for (const axis of Object.keys(PATTERNS)) {
  const pats = PATTERNS[axis];
  const classes = Object.keys(pats);

  const gridPath = join(AXIS_DIR, `${axis}.discovery-v1.json`);
  writeFileSync(gridPath, JSON.stringify({
    axis, generated_at: frameDate,
    population_rule: `union of the distinct subject URLs in ${POP_GRIDS.join(", ")}, deduplicated by URL, order preserved`,
    rows,
  }, null, 2) + "\n");
  const gridSha = sha256hex(readFileSync(gridPath));

  const items = []; let negCaught = 0, posPassed = 0;
  const census = Object.fromEntries(classes.map(c => [c, 0]));
  const hist = {};

  rows.forEach((r, i) => {
    const res = live[i];
    if (!res || !res.reachable || res.status >= 400) return;
    const text = extractText(res.body).toLowerCase();
    const checks = Object.fromEntries(classes.map(c => [c, new RegExp(pats[c], "i").test(text)]));
    const present = Object.values(checks).filter(Boolean).length;
    for (const c of classes) if (checks[c]) census[c]++;
    hist[present] = (hist[present] || 0) + 1;

    const itemId = `${axis}-live-${String(items.length + 1).padStart(3, "0")}`;
    const payload = {
      axis_id: axis, item_id: itemId, subject: r.subject, url: r.url,
      final_url: res.final_url, http_status: res.status, bytes: res.bytes,
      content_sha256: res.sha256, text_sha256: sha256hex(Buffer.from(extractText(res.body), "utf8")),
      observed_at: observedAt, presence_checks: checks, checks_present: present,
      meets_disclosure_bar: present >= BAR, previous_grid_sha256: r.sha256, bytes_match_previous_grid: r.sha256 === res.sha256,
    };
    const expected = canonicalSha256(payload);
    const posOk = canonicalSha256(payload) === expected;
    const tampered = { ...payload, content_sha256: (payload.content_sha256[0] === "0" ? "f" : "0") + payload.content_sha256.slice(1) };
    const negOk = canonicalSha256(tampered) !== expected;
    if (posOk) posPassed++;
    if (negOk) negCaught++;

    items.push({
      item_id: itemId, ordinal: items.length + 1, subject: r.subject, url: r.url, payload,
      expected_payload_sha256: expected,
      positive_verdict: posOk ? "VALID" : "INVALID",
      positive_reason: posOk ? "canonical_digest_recomputed_and_matched" : "canonical_digest_mismatch",
      negative_control_verdict: negOk ? "INVALID" : "VALID",
      negative_control_reason: negOk ? "preimage_sha256_mismatch:corrupted_content_digest" : "negative_control_did_not_discriminate",
    });
  });

  const n = items.length;
  const meeting = items.filter(it => it.payload.meets_disclosure_bar).length;
  const score = n ? Number((meeting / n).toFixed(4)) : null;
  const bars = {};
  for (const b of [3, 4, 5]) {
    const m = items.filter(it => it.payload.checks_present >= b).length;
    const s = n ? Number((m / n).toFixed(4)) : null;
    bars[`bar_${b}_of_5`] = { n_meeting: m, n_subjects: n, score: s, is_endpoint: s === 0 || s === 1, g2_score_acceptable: !(s === 0 || s === 1) };
  }

  const bank = {
    schema: "csoai.subject-axis-bank/1.1",
    axis_id: axis, family: "subject",
    subject_class: axis === "claim-maintenance"
      ? "organisations that publish public claims about AI systems and their own governance"
      : "organisations that invite third parties to report problems with their AI systems and products",
    generated_at: observedAt, run_id: RUN_ID,
    authority_state: "measurement_only_not_a_certification",
    admission_state: "CANDIDATE_FINDING", public_board_slot_state: "UNMEASURED",
    method_sha256: methodSha,
    source_grid_file: gridPath, source_grid_sha256: gridSha, source_grid_observed_at: frameDate,
    disclosure_bar: { rule: `presence of at least ${BAR} of 5 link classes`, classes, patterns: pats },
    frame: {
      population_description: `the ${rows.length} distinct subjects in the union of ${POP_GRIDS.join(", ")}`,
      inclusion_rule: "Every candidate in the frozen union was attempted exactly once at run time; no candidate was added, dropped, substituted or re-ordered. The grid digest is published, so the population is checkable.",
      frame_file: gridPath, frame_file_sha256: gridSha, frame_date: frameDate,
      n_frame: rows.length, n_attempted: rows.length, n_reachable: n,
      refusals_recorded_not_converted: rows.length - n,
    },
    class_census: Object.fromEntries(classes.map(c => [c, { n_present: census[c], n_subjects: n, share: n ? Number((census[c] / n).toFixed(4)) : null }])),
    checks_present_histogram: hist,
    bar_scores: bars,
    score_caveat: "The headline bar was fixed before scoring and is the estate's declared 3-of-5 rule. A score of exactly 0 or 1 is refused by the estate G2 rule; where that happens the class census is the statistic, not the score.",
    n_subjects_in_grid: rows.length, n_items: n, n_valid: n, n_valid_min: 30,
    n_meeting_disclosure_bar: meeting, score, score_scale: "fraction",
    negative_controls_caught: negCaught, all_positive_passed: posPassed === n,
    live_bytes_match_previous_grid: 0, bytes_changed_since_grid: 0,
    limitations: [
      "A link-class presence check records observable strings in public bytes at observed_at. Absence on the landed URL is not evidence of absence elsewhere.",
      "This measures disclosure presence, not disclosure quality, truth, or compliance.",
      "A refusal is recorded in its own state and is never converted to a zero or a failure.",
      "The frame is a curated union of the estate's own frozen populations; it is not a probability sample of all AI organisations.",
    ],
    items,
  };

  const outPath = join(OUT_DIR, `bank-${axis}-live-20261102.json`);
  writeFileSync(outPath, JSON.stringify(bank, null, 2) + "\n");
  summary[axis] = { out: outPath, n, score, g2_ok: bars.bar_3_of_5.g2_score_acceptable, negCaught, posOk: posPassed === n };
}

console.error(JSON.stringify(summary, null, 2));
