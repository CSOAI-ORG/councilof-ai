#!/usr/bin/env node
/**
 * custody-wording-guard.mjs — split-custody wording may not return without a ceremony record.
 *
 * WHY THIS EXISTS (C-2026-0925-01). Served text called the 2026-09-02 board freeze key
 * "3-party MPC" custody and a sign pane said "KEY is 2-of-3". On the host, all three shares of
 * that key sit in one directory: one failure domain. The split was never performed. The words
 * came from the signing PROTOCOL's name and nobody re-read them against where the shares live.
 * The owner ruled "both": correct the wording now, perform the real 2-of-3 split at the physical
 * root ceremony later. This guard holds the first half until the second half happens.
 *
 * RULE. On every served or producing surface (functions/, client/src/, public/, council-os/,
 * scripts/ — the places a public sentence is written or generated), a mention of
 * "3-party", "three-party", "2-of-3", "3-of-3" or "threshold key/custody/Ed25519/signing" FAILS
 * unless ONE of these holds:
 *   1. correction or planning context sits within CONTEXT_CHARS of it: the text itself says the
 *      shares are on one host / one failure domain, that the split is planned or not performed,
 *      that the stamp is UNCHECKABLE until the ceremony, or cites C-2026-0925-01; or
 *   2. the file is signed bytes that cannot be edited (PINNED, each with the document that
 *      carries its correction); or
 *   2b. the file is a captured, dated receipt (DATED_RECEIPTS, one named file per entry) and the
 *      correction it points to is still in place; or
 *   3. council-os/custody-ceremonies.json records a PERFORMED ceremony with shares in at least two
 *      distinct custody domains and a record file that exists. Then the wording is true, and the
 *      guard passes everything (and says why).
 *
 *   node scripts/custody-wording-guard.mjs          # scan the repo; exit 1 on any violation
 *   node scripts/custody-wording-guard.mjs --json   # machine-readable result
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const CLAIM_RE =
  /\b(?:3|three)[- ]party\b|(?<![\d.-])[23]-of-3(?![\d])|\bthreshold[- ](?:custody|key|keys|ed25519|signing|signer)\b/gi;

export const CONTEXT_RE = new RegExp(
  [
    "one host", "single host", "one machine", "one failure domain", "single failure domain",
    "one directory", "never (?:been )?performed", "not (?:been |yet )?performed",
    "has not (?:been )?(?:done|performed|happened)", "never (?:done|happened)", "planned",
    "UNCHECKABLE", "C-2026-0925-01", "CUSTODY_SEPARATION_OVERCLAIM", "claimed_in_signed_bytes",
  ].join("|"),
  "i",
);

export const CONTEXT_CHARS = 400;

// A line that asserts the phrase is ABSENT (a test or gate forbidding it) is not a claim.
// Absence-of-phrase guards match their own pattern; this keeps them from tripping this one.
export const ABSENCE_ASSERTION_RE = /doesNotMatch|not\.toMatch|not\.toContain|assert\.ok\(\s*!/;

export const SCAN_ROOTS = ["functions", "client/src", "public", "council-os", "scripts"];
const EXT = /\.(?:ts|tsx|js|mjs|cjs|json|jsonl|txt|md|html|tmpl|py|yml|yaml|xml)$/i;
const MAX_BYTES = 2 * 1024 * 1024;

// Directories that are not a surface this guard governs, each with its reason.
export const SKIP_DIRS = new Map([
  ["public/proofs", "per-card proof mirrors, not deployed (deploy-exclusions.json)"],
  ["scripts/ceremony", "the root-ceremony tooling itself: it implements the planned 2-of-3 split"],
  ["scripts/badger/_queue", "queued generator output, not served"],
  // A historical did.json the media compiler tests against (lane media-compiler bd5307576): it pins the
  // 2026-09-02 key note verbatim so the compiler can be shown to refuse stale bytes. Test input, never
  // served; the served did.json is public/.well-known/did.json, which this guard still scans.
  ["scripts/media/fixtures", "media-compiler test fixtures (historical did.json), not served"],
  ["node_modules", "dependencies"],
]);
const SKIP_DIR_NAMES = new Set(["node_modules", "mirrors", ".git"]);

// Signed bytes that cannot be edited without breaking their signature. Each names the document
// that carries its correction, which the guard checks is present.
export const PINNED = new Map([
  ["public/signed/gspc-board.signed.json", "public/signed/gspc-board.status.json"],
]);

// Captured, dated receipts: the verbatim output of a command run on the date in the path, kept as
// evidence of what that command printed then. Rewriting one to today's wording would falsify the
// receipt, so it is not edited. Each entry names the correction that supersedes the wording it
// captured, and the exemption holds only while that correction is in place: the pointer file must
// exist and still carry the corrected wording (`marks`). If it does not, the guard fails, as it does
// for a pinned file whose correction is missing. One named file per entry, never a directory: a new
// receipt that repeats old wording is a new capture and needs its own entry and its own correction.
export const DATED_RECEIPTS = new Map([
  // `helm template` output for packages/helm/llama-stack-csoai-eval, captured 30 Sep 2026 by lane
  // ecosystem-install-20260930. Line 125 embeds that day's did.json _gspcBoardKeyNote, which said
  // "3-party Coinbase cb-mpc". Superseded by the 6 Oct 2026 custody correction (owner approval
  // 26Y): public/.well-known/did.json _gspcBoardKeyNote now states single-key custody. The same
  // wording was first corrected elsewhere by C-2026-0925-01 (docs/corrections/2026-09-25-custody-wording.md).
  ["council-os/receipts/ecosystem-install-20260930/helm-rendered.yaml", {
    captured: "2026-09-30",
    superseded_by: "the 2026-10-06 custody correction of public/.well-known/did.json _gspcBoardKeyNote (after C-2026-0925-01)",
    correction: "public/.well-known/did.json",
    marks: "treat it as single-key custody",
  }],
]);

// Files that exist to describe this rule; they quote the forbidden phrasing on purpose.
export const SELF = new Set([
  "scripts/custody-wording-guard.mjs",
  "scripts/custody-wording-guard.node-test.mjs",
  "council-os/custody-ceremonies.json",
]);

// Tests and fixtures are not served surfaces.
const TEST_RE = /(?:\.test\.|\.node-test\.|(?:^|\/)test_[^/]*\.py$|__fixtures__)/;

export function ceremonyAllows(registry, repo = REPO) {
  const done = Array.isArray(registry?.performed) ? registry.performed : [];
  for (const c of done) {
    const domains = Number(c?.distinct_custody_domains);
    const rec = typeof c?.record === "string" ? path.join(repo, c.record) : null;
    if (c?.state === "PERFORMED" && Number.isInteger(domains) && domains >= 2 && rec && fs.existsSync(rec)) {
      return { allowed: true, why: `ceremony ${c.id ?? "(no id)"} PERFORMED with ${domains} custody domains, record ${c.record}` };
    }
  }
  return { allowed: false, why: "no PERFORMED ceremony with shares in >= 2 custody domains is recorded" };
}

export function scanText(text) {
  const hits = [];
  CLAIM_RE.lastIndex = 0;
  let m;
  while ((m = CLAIM_RE.exec(text)) !== null) {
    const lo = Math.max(0, m.index - CONTEXT_CHARS);
    const hi = Math.min(text.length, m.index + m[0].length + CONTEXT_CHARS);
    if (CONTEXT_RE.test(text.slice(lo, hi))) continue;
    const line = text.slice(0, m.index).split("\n").length;
    const ls = text.lastIndexOf("\n", m.index) + 1;
    const le = text.indexOf("\n", m.index);
    if (ABSENCE_ASSERTION_RE.test(text.slice(ls, le === -1 ? undefined : le))) continue;
    hits.push({ line, match: m[0], excerpt: text.slice(ls, le === -1 ? undefined : le).trim().slice(0, 220) });
  }
  return hits;
}

function* walk(abs, rel) {
  let entries;
  try { entries = fs.readdirSync(abs, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (SKIP_DIR_NAMES.has(e.name) || SKIP_DIRS.has(r)) continue;
      yield* walk(path.join(abs, e.name), r);
    } else if (EXT.test(e.name)) {
      yield r;
    }
  }
}

export function runGuard({ repo = REPO, roots = SCAN_ROOTS } = {}) {
  const regPath = path.join(repo, "council-os/custody-ceremonies.json");
  let registry = null;
  try { registry = JSON.parse(fs.readFileSync(regPath, "utf8")); } catch { registry = null; }
  const ceremony = ceremonyAllows(registry, repo);
  const violations = [];
  const pinnedMissingCorrection = [];
  const datedReceipts = [];
  const receiptsMissingCorrection = [];
  let scanned = 0;
  for (const root of roots) {
    for (const rel of walk(path.join(repo, root), root)) {
      if (SELF.has(rel) || TEST_RE.test(rel)) continue;
      const abs = path.join(repo, rel);
      let st;
      try { st = fs.statSync(abs); } catch { continue; }
      if (st.size > MAX_BYTES) continue;
      const text = fs.readFileSync(abs, "utf8");
      scanned++;
      const hits = scanText(text);
      if (!hits.length) continue;
      if (PINNED.has(rel)) {
        const corr = PINNED.get(rel);
        if (!fs.existsSync(path.join(repo, corr))) pinnedMissingCorrection.push({ file: rel, correction: corr });
        continue;
      }
      if (DATED_RECEIPTS.has(rel)) {
        const r = DATED_RECEIPTS.get(rel);
        let corrText = null;
        try { corrText = fs.readFileSync(path.join(repo, r.correction), "utf8"); } catch { corrText = null; }
        if (corrText === null || !corrText.includes(r.marks)) {
          receiptsMissingCorrection.push({ file: rel, correction: r.correction, marks: r.marks });
        } else {
          datedReceipts.push({ file: rel, captured: r.captured, mentions: hits.length, superseded_by: r.superseded_by });
        }
        continue;
      }
      for (const h of hits) violations.push({ file: rel, ...h });
    }
  }
  const fail = (!ceremony.allowed && violations.length > 0) || pinnedMissingCorrection.length > 0
    || receiptsMissingCorrection.length > 0;
  return {
    ok: !fail, scanned, ceremony, violations: ceremony.allowed ? [] : violations, pinnedMissingCorrection,
    datedReceipts, receiptsMissingCorrection,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const res = runGuard();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    for (const v of res.violations) console.error(`✖ ${v.file}:${v.line}  "${v.match}"  ${v.excerpt}`);
    for (const p of res.pinnedMissingCorrection) console.error(`✖ ${p.file} is pinned signed bytes but its correction ${p.correction} is missing`);
    for (const r of res.receiptsMissingCorrection) console.error(`✖ ${r.file} is a dated receipt but its correction ${r.correction} is missing or no longer says "${r.marks}"`);
    for (const r of res.datedReceipts) console.log(`· ${r.file}: captured ${r.captured}, ${r.mentions} mention(s) kept verbatim; superseded by ${r.superseded_by}`);
    console.log(
      res.ok
        ? `custody-wording-guard: PASS — ${res.scanned} files; ${res.ceremony.allowed ? res.ceremony.why : "no split-custody wording without correction context (C-2026-0925-01)"}`
        : `custody-wording-guard: FAIL — ${res.violations.length} mention(s) of split custody with no ceremony record and no correction context. ${res.ceremony.why}.`,
    );
  }
  process.exit(res.ok ? 0 : 1);
}
