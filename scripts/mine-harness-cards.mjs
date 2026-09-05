#!/usr/bin/env node
// mine-harness-cards.mjs — absorb the os-production harness cards, sorting each
// one into STAGED-UNSIGNED or QUARANTINE by what its own bytes say.
//
// WHY. `os-production` carries 48 harness cards that were never on master. The
// brief says mine them, never merge the branch. Two things decide where each
// card goes, and both are read from the card, not assumed:
//
//   1. IS THE SIGNER ANCHORED?  Every one of the 48 is signed, but by worker
//      keys — kid `csoai-measure-worker-*` and `csoai-rwa-attest-*`. Neither
//      key's BYTES appear in /.well-known/did.json (checked by decoding the
//      card's base64 pubkey and the DID's base64url JWK x, not by comparing
//      kid strings). Under the estate rule an unanchored signer is UNCHECKABLE,
//      so nothing here may be published as signed. Same precedent as the SWIFT
//      cards in C-2026-0905-02: stage it, strip the signature, say why.
//
//   2. DOES THE BODY CLAIM A NUMBER IT DID NOT MEASURE?  13 of the owem cards
//      carry a numeric `sov_score` with `n: 0` and `bench: "unavailable"` —
//      scores of 1.0, 0.6667, 0.5, 0.25 and 0.0 computed over zero
//      observations. Those cards state their own method as "UNMEASURED never
//      0" and then violate it. A signed score on n=0 is the estate's worst
//      failure mode, because the signature is what invites the trust. Those go
//      to QUARANTINE and are never staged.
//
//   The other 35 (rwa-attest) carry NO score at all: each says
//   `governance_measurement: "UNMEASURED (no GSPC bank for this issuer yet;
//   honest, never scored)"`. Those are census rows — a target, a chain, a
//   public address, sources — and they stage cleanly.
//
// This is a GENERATOR. Re-run it and the artifacts regenerate from the branch,
// so the claim lives in the producer and not only in the output.
//
//   node scripts/mine-harness-cards.mjs            # write
//   node scripts/mine-harness-cards.mjs --check    # verify, exit 1 on drift
//   node scripts/mine-harness-cards.mjs --selftest # prove the sorter can fail

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BRANCH = process.env.HARNESS_BRANCH ?? "os-production";
const STAGE_DIR = "public/interop/rwa-staged-2026-09";
const STAGE_INDEX = "public/interop/rwa-staged-index.json";
const QUARANTINE = "scripts/evidence-quarantine.json";
const DID_URL = "https://councilof.ai/.well-known/did.json";

const git = (...a) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 64 << 20 });
const sha256 = (s) =>
  execFileSync("shasum", ["-a", "256"], { input: s, encoding: "utf8" }).split(" ")[0];

/** Ed25519 key bytes from the card's signature block, as lowercase hex. */
export function cardKeyHex(card) {
  const sig = (card.card ?? card).signature;
  if (!sig) return null;
  if (typeof sig.pubkey === "string" && sig.pubkey)
    return Buffer.from(sig.pubkey, "base64").toString("hex");
  if (typeof sig.public_key === "string" && sig.public_key.startsWith("0x"))
    return sig.public_key.slice(2).toLowerCase();
  return null;
}

/** Anchored key bytes from a DID document, as lowercase hex. */
export function anchoredKeyHexes(did) {
  const out = new Map();
  for (const vm of did.verificationMethod ?? []) {
    const x = vm.publicKeyJwk?.x;
    if (!x) continue;
    out.set(Buffer.from(x, "base64url").toString("hex"), vm.id);
  }
  return out;
}

/**
 * The whole judgement, in one pure function so a test can drive it.
 * A card is QUARANTINE if it states a score without observations behind it.
 */
export function classify(card) {
  const c = card.card ?? card;
  const sv = c.body?.score_vector;
  const reasons = [];
  if (sv && typeof sv.sov_score === "number") {
    const n = sv.n;
    if (n === 0 || n === null || n === undefined) {
      reasons.push(
        `states sov_score=${sv.sov_score} with n=${JSON.stringify(n)} — a score over zero observations`,
      );
    }
    const bench = c.env_commitment?.bench;
    if (bench && bench !== "available") reasons.push(`env_commitment.bench=${bench}`);
  }
  return reasons.length ? { verdict: "QUARANTINE", reasons } : { verdict: "STAGE", reasons: [] };
}

function listCards() {
  const files = git("diff", "--name-only", `origin/master...${BRANCH}`)
    .split("\n")
    .filter((f) => /^harness\/.*\/cards\/.*\.json$/.test(f));
  return files.map((path) => {
    const raw = git("show", `${BRANCH}:${path}`);
    return { path, raw, card: JSON.parse(raw), sha256: sha256(raw) };
  });
}

function selftest() {
  const bad = { card: { body: { score_vector: { sov_score: 1.0, n: 0 } }, env_commitment: { bench: "unavailable" } } };
  const good = { card: { body: { governance_measurement: "UNMEASURED" } } };
  const a = classify(bad).verdict;
  const b = classify(good).verdict;
  if (a !== "QUARANTINE") throw new Error(`selftest FAILED: a 1.0 score on n=0 classified ${a}`);
  if (b !== "STAGE") throw new Error(`selftest FAILED: an honest census card classified ${b}`);
  // and the sorter must not pass a score that merely looks small
  if (classify({ card: { body: { score_vector: { sov_score: 0.0, n: 0 } } } }).verdict !== "QUARANTINE")
    throw new Error("selftest FAILED: 0.0 on n=0 is still a score over zero observations");
  console.log("mine-harness-cards selftest: OK (score-on-n=0 quarantines, honest census stages)");
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--selftest")) return selftest();
  const check = args.includes("--check");

  const did = JSON.parse(execFileSync("curl", ["-s", "--max-time", "25", DID_URL], { encoding: "utf8" }));
  const anchored = anchoredKeyHexes(did);
  const cards = listCards();
  if (cards.length === 0) throw new Error(`no harness cards found on ${BRANCH} — refusing to write an empty index`);

  const staged = [];
  const quarantined = [];
  for (const c of cards) {
    const keyHex = cardKeyHex(c.card);
    const anchor = keyHex ? anchored.get(keyHex) : null;
    const { verdict, reasons } = classify(c.card);
    if (verdict === "QUARANTINE") {
      quarantined.push({
        path: `${BRANCH}:${c.path}`,
        rows: 1,
        sha256: c.sha256,
        reason: `signed-score-without-observations — ${reasons.join("; ")}`,
      });
      continue;
    }
    const body = (c.card.card ?? c.card).body ?? {};
    staged.push({
      file: `staged-rwa-${(body.target ?? "unknown").replace(/[^a-z0-9-]/gi, "-").toLowerCase()}.json`,
      doc: {
        schema: "csoai.rwa-staged/0.1",
        as_of: new Date().toISOString(),
        mined_from: `${BRANCH}:${c.path}`,
        source_sha256: c.sha256,
        sig_ed25519: null,
        sig_algo: "UNSIGNED",
        signed_at: null,
        signature_note:
          `The source card carried an Ed25519 signature from kid ` +
          `${((c.card.card ?? c.card).signature ?? {}).kid ?? "unknown"}, whose key bytes are NOT in ` +
          `${DID_URL} (${anchor ? `anchored as ${anchor}` : "no anchored key matches"}). An unanchored ` +
          `signer is UNCHECKABLE, so the signature is dropped rather than republished. ` +
          `The OIDC board-sign path is the only signer.`,
        not_a_grade: true,
        not_measured: true,
        payload: body,
      },
    });
  }

  const index = {
    schema: "csoai.rwa-staged-index/0.1",
    as_of: new Date().toISOString(),
    algo: "UNSIGNED (source signers are not anchored in did.json; OIDC board-sign is the only signer)",
    total_signed: 0,
    total_staged_unsigned: staged.length,
    total_quarantined: quarantined.length,
    mined_from: BRANCH,
    note:
      `Mined from ${BRANCH}, which was never merged. Every source card was signed by an ` +
      `unanchored worker key, so nothing here is signed or MEASURED. ${quarantined.length} cards were ` +
      `QUARANTINED, not staged: they state a numeric sov_score with n=0 and bench unavailable — ` +
      `a score over zero observations, against those cards' own stated method ("UNMEASURED never 0").`,
    files: staged.map((s) => s.file).sort(),
  };

  if (check) {
    const cur = existsSync(STAGE_INDEX) ? JSON.parse(readFileSync(STAGE_INDEX, "utf8")) : null;
    const drift =
      !cur ||
      cur.total_staged_unsigned !== index.total_staged_unsigned ||
      cur.total_quarantined !== index.total_quarantined ||
      JSON.stringify(cur.files) !== JSON.stringify(index.files);
    if (drift) {
      console.error("✖ mine-harness-cards --check: staged index does not match the branch");
      console.error(`  expected ${index.total_staged_unsigned} staged / ${index.total_quarantined} quarantined`);
      process.exit(1);
    }
    console.log(`✓ mine-harness-cards --check: ${index.total_staged_unsigned} staged, ${index.total_quarantined} quarantined`);
    return;
  }

  mkdirSync(STAGE_DIR, { recursive: true });
  for (const s of staged) writeFileSync(join(STAGE_DIR, s.file), JSON.stringify(s.doc, null, 2) + "\n");
  writeFileSync(STAGE_INDEX, JSON.stringify(index, null, 2) + "\n");

  const q = JSON.parse(readFileSync(QUARANTINE, "utf8"));
  const seen = new Set(q.quarantined_files.map((e) => e.sha256));
  let added = 0;
  for (const e of quarantined) if (!seen.has(e.sha256)) { q.quarantined_files.push(e); added++; }
  q.harness_card_incident_note =
    `${quarantined.length} os-production harness cards state a numeric sov_score over n=0 with ` +
    `bench unavailable. Regenerate with: node scripts/mine-harness-cards.mjs`;
  writeFileSync(QUARANTINE, JSON.stringify(q, null, 2) + "\n");

  console.log(`staged ${staged.length} · quarantined ${quarantined.length} (${added} new manifest rows)`);
}

main();
