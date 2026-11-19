#!/usr/bin/env node
/**
 * rebind-catalogue-live-state — the ONE producer of the master catalogue's LIVE STATE.
 *
 * WHAT. public/jewels/master-catalogue/{index.json,index.html} carry a live_state block: a
 * dated READ of the estate's live surfaces — the board, the public root, the corrections
 * ledger, the x402 catalogue, the agent skills, the mechanism coverage, the claim register,
 * the open-pull-request count. That read was taken on 2026-11-01. The board has moved since
 * (34 slots, 24 measured, 10 unmeasured), so a page published under the heading "Live
 * estate state, read today" was quoting a board that is no longer the live board, and a
 * root with 331 leaves when the root carries 428.
 *
 * WHY A GENERATOR, AND WHY A NEW EDITION RATHER THAN AN EDIT. A typed count on a published
 * page is the first thing to go stale. The estate's own ruling (client/src/data/facts.json
 * counts.historical_count_exemptions) is that a dated record is never edited and a live
 * surface must carry the live number. A new edition of the catalogue is a NEW dated read:
 * the old edition's bytes stay in git and in docs/GSPC-MASTER-CATALOG-OF-ALL-JEWELS-*.md.
 * So this tool does not edit a reading — it takes a new one and writes it. The 2026-11-02
 * edition quotes only the live board count, so it no longer needs the axis-count exemption
 * it used to hold, and the facts-gate can police it again: a catalogue that has gone stale
 * fails the gate instead of passing silently.
 *
 * THE BOARD ROW IS THIS COMMIT'S BOARD, NOT THE LIVE ONE. Same rule as
 * scripts/surface/rebind-board-cites.mjs and scripts/surface/commit-board.mjs: a number that
 * depends on which deployment happens to be live is not a property of the commit. The other
 * rows are live reads by nature — a root, a ledger, a catalogue, a PR count — and each
 * records the URL it read, the HTTP status it got and a digest of the content that produced
 * its count.
 *
 * A count with no source is null, never 0: an unreachable source stops the tool and writes
 * nothing. Measurement, not certification: this tool copies counts and names where they came
 * from. It decides nothing about anybody.
 *
 *   node scripts/surface/rebind-catalogue-live-state.mjs          # take the read, write it
 *   node scripts/surface/rebind-catalogue-live-state.mjs --check  # exit 1 if the page disagrees with a fresh read
 *
 * The --check form needs the network: it re-reads every source and compares. That is a
 * producer check, not a PR gate — a PR gate may not depend on a live third-party count.
 * The rules themselves are in catalogue-live-state-lib.mjs and are tested there.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { commitBoard } from "./commit-board.mjs";
import { assertBoardSentences, assertEditionIsOurs, assertLaneActivityNumbers, assertOneOpenPullRequestNumber, assertOneOpenPullRequestNumberInPage, countDigest, htmlRules, jsonRules, laneActivityRules, mergeWindowStart, normalise } from "./catalogue-live-state-lib.mjs";
import { readMergeWindow } from "./merge-window.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_SLUG = "CSOAI-ORG/councilof-ai";
const CHECK = process.argv.includes("--check");
const SITE = "https://councilof.ai";
const UA = "CSOAI-catalogue-read/0.1 (councilof.ai master catalogue live-state producer)";
const TIMEOUT_MS = 25000;
const MAX_READ_AGE_MS = 72 * 60 * 60 * 1000;

const JSON_FILE = "public/jewels/master-catalogue/index.json";
const HTML_FILE = "public/jewels/master-catalogue/index.html";

/** fetch a URL and return {status, text, json}; a non-200 throws with the status named. */
async function get(url) {
  const r = await fetch(url, {
    headers: { accept: "application/json", "user-agent": UA },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "error",
  });
  const raw = Buffer.from(await r.arrayBuffer());
  const sha256 = createHash("sha256").update(raw).digest("hex");
  if (!r.ok) throw new Error(`${url} answered HTTP ${r.status} — a count with no source is null, never 0`);
  const text = raw.toString("utf8");
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON: the caller decides */ }
  return { status: r.status, text, json, sha256 };
}

/** The GitHub open-PR count the catalogue publishes. Unauthenticated search; the count is a
 *  reading of one moment, so it carries the moment it was read. */
async function openPullRequests() {
  const q = encodeURIComponent(`repo:${REPO_SLUG} is:pr is:open`);
  const r = await fetch(`https://api.github.com/search/issues?q=${q}&per_page=1`, {
    headers: { accept: "application/vnd.github+json", "user-agent": UA, ...(process.env.GITHUB_TOKEN || process.env.GH_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN || process.env.GH_TOKEN}` } : {}) },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!r.ok) throw new Error(`GitHub search answered HTTP ${r.status} — the PR count stays unknown, never 0`);
  const j = await r.json();
  if (typeof j.total_count !== "number") throw new Error("GitHub search returned no total_count");
  return j.total_count;
}

// ---------------------------------------------------------------- the read
const c = await commitBoard(REPO);
if (c.status !== 200) throw new Error(`commit /api/gspc answered HTTP ${c.status}`);
const board = JSON.parse(c.raw.toString("utf8"));
const t = board.totals || {};
for (const k of ["axes", "measured_axes", "unmeasured_axes", "public_count", "separation_public_count"]) {
  if (t[k] === undefined || t[k] === null) throw new Error(`commit board totals.${k} missing — absent is not zero`);
}
const boardSha = createHash("sha256").update(c.raw).digest("hex");

const root = await get(`${SITE}/root.json`);
const corr = await get(`${SITE}/api/corrections`);
const x402 = await get(`${SITE}/api/x402`);
const skills = await get(`${SITE}/.well-known/agent-skills/index.json`);
const mech = await get(`${SITE}/mechanism/coverage.json`);
const reg = await get(`${SITE}/spec/claim-maintenance/register.json`);
const prs = await openPullRequests();

const cardCount = root.json?.card_count;
const corrCount = Array.isArray(corr.json?.corrections) ? corr.json.corrections.length : null;
const resCount = Array.isArray(x402.json?.resources) ? x402.json.resources.length : null;
const skillList = Array.isArray(skills.json?.skills) ? skills.json.skills : null;
const mechTotals = mech.json?.totals || null;
const regTotals = reg.json?.totals || null;
for (const [k, v] of Object.entries({ cardCount, corrCount, resCount, skillList, mechTotals, regTotals })) {
  if (v === null || v === undefined) throw new Error(`a source answered without its count: ${k}`);
}

const unmeasuredAxes = (board.axes || [])
  .filter((a) => a.status !== "MEASURED")
  .map((a) => ({ axis: a.axis, family: a.family, kind: a.kind, status: a.status, n: a.n ?? 0, accuracy: a.accuracy ?? null }));

const readAt = new Date().toISOString();
const edition = readAt.slice(0, 10);

// ---------------------------------------------------------------- index.json
const jPath = path.join(REPO, JSON_FILE);
const jBefore = fs.readFileSync(jPath, "utf8");
const jDoc = JSON.parse(jBefore);
if (!jDoc.live_state || !jDoc.live_state.board) throw new Error("index.json has no live_state.board — the shape moved");
// Another lane may already have published an edition of this catalogue for today. This
// producer does not overwrite one it did not write: the collision is refused and named.
try {
  assertEditionIsOurs(jDoc, edition);
} catch (e) {
  console.error(`\nrefused to publish: ${e.message}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------- the merge window
// The window is the edition this one supersedes. On a new day that is yesterday's edition;
// on a same-day re-read it is the edition the published one already supersedes. Either way
// the window is named, so a reader can see exactly what the list covers.
const { startDate: windowStartDate, windowStart, source: windowStartSource } = mergeWindowStart(jDoc, edition);
const { merged } = await readMergeWindow(windowStart, windowStartDate);
const laneActivity = {
  window_start: windowStart,
  window_end: readAt,
  window_start_source: windowStartSource,
  merged,
  open_pull_requests_now: prs,
};

const live_state = {
  read_at: readAt,
  board: {
    url: `${SITE}/api/gspc`,
    http: 200,
    axes: t.axes,
    measured_axes: t.measured_axes,
    unmeasured_axes: t.unmeasured_axes,
    public_count: t.public_count,
    separation: t.separation_public_count,
    board_count_source:
      `derived from this commit's /api/gspc (functions/api/gspc.ts, computed offline by scripts/surface/commit-board.mjs; sha256 ${boardSha}) by scripts/surface/rebind-catalogue-live-state.mjs`,
  },
  unmeasured_axes: unmeasuredAxes,
  public_root: {
    url: `${SITE}/root.json`,
    http: root.status,
    card_count: cardCount,
    as_of: root.json.as_of,
    merkle_root: root.json.merkle_root,
    count_digest: countDigest({ card_count: cardCount, as_of: root.json.as_of, merkle_root: root.json.merkle_root }),
  },
  corrections_ledger: {
    url: `${SITE}/api/corrections`,
    http: corr.status,
    entries: corrCount,
    count_digest: countDigest(corr.json.corrections.map((c) => c.id).sort()),
  },
  x402_catalogue: {
    url: `${SITE}/api/x402`,
    http: x402.status,
    resources: resCount,
    count_digest: countDigest(x402.json.resources),
  },
  agent_skills: {
    url: `${SITE}/.well-known/agent-skills/index.json`,
    http: skills.status,
    published: skillList.length,
    names: skillList.map((s) => s.name).sort(),
    count_digest: countDigest(skillList.map((s) => s.name).sort()),
  },
  mechanism_coverage: {
    url: `${SITE}/mechanism/coverage.json`,
    http: mech.status,
    totals: mechTotals,
    count_digest: countDigest(mechTotals),
  },
  claim_maintenance_register: {
    url: `${SITE}/spec/claim-maintenance/register.json`,
    http: reg.status,
    as_of: reg.json.as_of,
    subjects: regTotals.subjects,
    claims: regTotals.claims,
    by_state: regTotals.by_state,
    count_digest: countDigest({ subjects: regTotals.subjects, claims: regTotals.claims, by_state: regTotals.by_state, as_of: reg.json.as_of }),
  },
  open_pull_requests: prs,
};

const v = {
  board: {
    public_count: t.public_count,
    separation_public_count: t.separation_public_count,
    axes: t.axes,
    measured_axes: t.measured_axes,
    unmeasured_axes: t.unmeasured_axes,
  },
  root: { card_count: cardCount, as_of: root.json.as_of },
  corrections: { entries: corrCount },
  x402: { resources: resCount },
  skills: { published: skillList.length },
  mechanism: { totals: mechTotals },
  register: { subjects: regTotals.subjects, claims: regTotals.claims, as_of: reg.json.as_of },
  prs,
  readAt,
  edition,
  unmeasuredAxes,
  laneActivity,
};

// ---------------------------------------------------------------- index.json
const jNext = laneActivityRules(jsonRules(jDoc, live_state, readAt, edition), laneActivity);
const indent = (jBefore.match(/\n( +)"/) || [, "  "])[1].length;
const jAfter = JSON.stringify(jNext, null, indent) + (jBefore.endsWith("\n") ? "\n" : "");
v.supersedes = jNext.supersedes_edition;

// ---------------------------------------------------------------- index.html
const hPath = path.join(REPO, HTML_FILE);
const hBefore = fs.readFileSync(hPath, "utf8");
const hAfter = htmlRules(hBefore, v);

// ---------------------------------------------------------------- guard, then write
assertBoardSentences(hAfter, v.board, "index.html");
assertBoardSentences(jAfter, v.board, "index.json");
// One document, one open-pull-request number: the live count and the reconciliation
// block's count are the same number, and the document may not disagree with itself.
assertOneOpenPullRequestNumberInPage(hAfter, prs, "index.html");
assertOneOpenPullRequestNumber(jAfter, prs, "index.json");
assertLaneActivityNumbers(jNext, prs, "index.json");
// The frozen block is replaced, not kept beside the live one: a stale copy of a block
// next to a live copy is itself a false claim.
if (jAfter.includes("lane_activity_since_2026_11_01")) {
  throw new Error("index.json still carries the frozen lane-activity block beside the live one");
}

const results = [
  { file: JSON_FILE, before: jBefore, after: jAfter },
  { file: HTML_FILE, before: hBefore, after: hAfter },
];
let drift = 0;
for (const r of results) {
  if (CHECK) {
    // In check mode nothing is written, and the comparison is normalised: a re-read always
    // stamps a new moment, so comparing the bytes of two reads would report drift forever.
    if (normalise(r.before) === normalise(r.after)) { console.log(`ok   ${r.file}`); continue; }
    drift++;
    console.error(`DRIFT ${r.file}`);
    continue;
  }
  // In write mode the read moment always advances, even when no count moved: the read_at is
  // part of the record, and a producer that leaves it standing would make the freshness rule
  // below flag a page it has just re-read.
  fs.writeFileSync(path.join(REPO, r.file), r.after);
  console.log(`wrote ${r.file} (${t.public_count})`);
}
// A dated read is not a standing claim: a page whose published read is older than
// MAX_READ_AGE_MS has gone stale even when every number in it still agrees.
const publishedReadAt = jDoc.live_state?.read_at;
if (CHECK && publishedReadAt) {
  const age = Date.now() - Date.parse(publishedReadAt);
  if (!Number.isFinite(age) || age > MAX_READ_AGE_MS) {
    drift++;
    console.error(`STALE ${JSON_FILE}: the published read is ${publishedReadAt} — a dated read is not a standing claim`);
  } else {
    console.log(`ok   ${JSON_FILE} read_at ${publishedReadAt} is ${Math.round(age / 3600000)}h old`);
  }
}
console.log(`read at ${readAt} · edition ${edition} · board ${t.public_count} · root ${cardCount} leaves · x402 ${resCount} · PRs ${prs}`);
if (drift) {
  console.error(`\nThe published catalogue disagrees with a fresh read (${drift} problem(s)). Re-run without --check to publish it.`);
  process.exit(1);
}
