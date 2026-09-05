#!/usr/bin/env node
// mine-hf-observation.mjs — absorb the HF reference-loop observation from
// codex/readiness-100, which was never merged and is not being merged.
//
// WHY THIS ONE IS DIFFERENT FROM THE HARNESS CARDS (#1365). Those 13 owem cards
// stated a score over n=0 and were quarantined. This artifact is the opposite
// shape and deserves the opposite treatment:
//
//   · it is a REAL graded run — n=30, hits=7, accuracy 0.233333;
//   · it was REPRODUCED — reproduction.json repeats the same n/hits/accuracy
//     at a later timestamp, in state REPRODUCED;
//   · it pins its subject by content, not by name: Qwen/Qwen3-0.6B at revision
//     c1899de289a04d12100db370d81485cdf75e47ca, with sha256 manifests over the
//     weights and the tokenizer;
//   · its Ed25519 seal actually VERIFIES over the sealed bytes.
//
// AND YET IT IS STILL NOT SIGNED BY US. The seal's key
// 48d8c4ea5f79e4d558242f325d0d5c9b799448ed6c34fc2f96e9c6185cba6aa0 is not one
// of the five keys published at /.well-known/did.json. The estate's own
// verifier draws exactly this line: a signature can be internally valid while
// its signer is untrusted, and those are different failures that must never be
// collapsed. So the signature is PRESERVED (unlike the harness cards, where it
// did not verify at all and was stripped) and labelled UNANCHORED_SIGNER.
//
// The observation therefore stages as evidence of a third-party model's
// behaviour on one axis. It is not a grade, it does not write the board, and
// accuracy 0.233 is a measurement of a 0.6B model on a governance bank — not a
// statement about that model's quality.
//
//   node scripts/mine-hf-observation.mjs --selftest  # prove the checks can fail
//   node scripts/mine-hf-observation.mjs --check     # re-derive, exit 1 on drift
//   node scripts/mine-hf-observation.mjs             # write

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createPublicKey, verify as edVerify } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const BRANCH = process.env.OBS_BRANCH ?? "codex/readiness-100";
const SRC = "evidence/hf-reference-loop";
const OUT_DIR = "public/interop/hf-observations-2026-09";
const OUT = `${OUT_DIR}/staged-qwen3-0.6b-governance.json`;
const DID_URL = "https://councilof.ai/.well-known/did.json";

const git = (...a) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 32 << 20 });
const gitBuf = (...a) => execFileSync("git", a, { maxBuffer: 32 << 20 });

/** Verify an Ed25519 seal over raw bytes. Returns {digest_ok, sig_valid}. */
export function verifySeal(seal, rawBytes) {
  const digest = createHash("sha256").update(rawBytes).digest("hex");
  const digest_ok = digest === seal.artifact_sha256;
  let sig_valid = false;
  try {
    const der = Buffer.from(seal.public_key, "hex");
    const key = createPublicKey({ key: der, format: "der", type: "spki" });
    sig_valid = edVerify(null, rawBytes, key, Buffer.from(seal.signature, "hex"));
  } catch {
    sig_valid = false;
  }
  return { digest_ok, sig_valid, computed_sha256: digest };
}

/** Raw 32-byte Ed25519 key from a DER SPKI hex string. */
export const rawKeyHex = (derHex) => Buffer.from(derHex, "hex").subarray(-32).toString("hex");

export function anchoredKeys(did) {
  const m = new Map();
  for (const vm of did.verificationMethod ?? []) {
    const x = vm.publicKeyJwk?.x;
    if (x) m.set(Buffer.from(x, "base64url").toString("hex"), vm.id);
  }
  return m;
}

function selftest() {
  // A seal over bytes that were altered must fail the digest check.
  const bytes = Buffer.from("hello");
  const fake = { artifact_sha256: createHash("sha256").update("goodbye").digest("hex"), public_key: "00", signature: "00" };
  const r = verifySeal(fake, bytes);
  if (r.digest_ok) throw new Error("selftest FAILED: a mismatched digest was accepted");
  if (r.sig_valid) throw new Error("selftest FAILED: a garbage key verified");
  // And an unanchored key must not be reported as anchored.
  const did = { verificationMethod: [{ id: "did:web:x#1", publicKeyJwk: { x: Buffer.alloc(32, 1).toString("base64url") } }] };
  if (anchoredKeys(did).has(Buffer.alloc(32, 2).toString("hex")))
    throw new Error("selftest FAILED: an unanchored key matched");
  console.log("mine-hf-observation selftest: OK (bad digest rejected, garbage sig rejected, unanchored key not matched)");
}

function build() {
  const obs = JSON.parse(git("show", `${BRANCH}:${SRC}/observation.json`));
  const rep = JSON.parse(git("show", `${BRANCH}:${SRC}/reproduction.json`));
  const seal = JSON.parse(git("show", `${BRANCH}:${SRC}/reproduction.layer0-seal.json`));
  const sealInput = gitBuf("show", `${BRANCH}:${SRC}/reproduction.seal-input.txt`);
  const did = JSON.parse(execFileSync("curl", ["-s", "--max-time", "25", DID_URL], { encoding: "utf8" }));

  const v = verifySeal(seal, sealInput);
  const keyHex = rawKeyHex(seal.public_key);
  const anchor = anchoredKeys(did).get(keyHex) ?? null;

  const reproduced =
    rep.state === "REPRODUCED" && rep.n === obs.n && rep.hits === obs.hits && rep.accuracy === obs.accuracy;

  return {
    schema: "csoai.hf-observation-staged/0.1",
    as_of: new Date().toISOString(),
    mined_from: `${BRANCH}:${SRC}/`,
    state: "STAGED_UNANCHORED",
    writes_board: false,
    not_a_certification: true,
    not_a_grade: true,
    subject: {
      hub_model: obs.lineage?.hub_model,
      hub_revision: obs.lineage?.hub_revision,
      weight_manifest_sha256: obs.lineage?.weight_manifest_sha256,
      tokenizer_manifest_sha256: obs.lineage?.tokenizer_manifest_sha256,
      pinned_by: "content digests, not by name — the revision and manifest hashes fix the exact bytes measured",
    },
    measurement: {
      axis: obs.axis,
      n: obs.n,
      hits: obs.hits,
      accuracy: obs.accuracy,
      measured_at: obs.measured_at,
      reproduced,
      reproduced_at: rep.measured_at,
      reproduction_state: rep.state,
      what_it_is:
        `${obs.hits} of ${obs.n} on the ${obs.axis} bank. n=${obs.n} meets the estate's n>=30 floor, ` +
        `so the figure is quotable as an observation of THIS revision's behaviour on THIS bank.`,
      what_it_never_proves:
        "the model's quality, fitness, safety, or compliance. One axis, one bank, one revision, one fleet of one.",
    },
    seal: {
      alg: seal.alg,
      artifact: seal.artifact,
      artifact_sha256: seal.artifact_sha256,
      computed_sha256: v.computed_sha256,
      digest_matches: v.digest_ok,
      signature_verifies: v.sig_valid,
      public_key_raw: keyHex,
      signer_anchored_in_did: anchor,
      verdict: v.sig_valid && anchor ? "VALID_AND_ANCHORED" : v.sig_valid ? "VALID_BUT_UNANCHORED_SIGNER" : "INVALID",
      note:
        "The signature was re-verified here, not trusted from the seal's own `verification` field. " +
        "A valid signature from a key that is not published in did.json proves the bytes were signed " +
        "by SOMEONE; it does not make this an estate attestation. Internally-valid and trusted-signer " +
        "are different properties and are never collapsed.",
    },
  };
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--selftest")) return selftest();
  const doc = build();

  if (!doc.seal.digest_matches) throw new Error("refusing to stage: sealed digest does not match the bytes");
  if (!doc.measurement.reproduced) throw new Error("refusing to stage: reproduction does not match the observation");

  if (args.includes("--check")) {
    if (!existsSync(OUT)) { console.error(`✖ ${OUT} missing`); process.exit(1); }
    const cur = JSON.parse(readFileSync(OUT, "utf8"));
    const same =
      cur.measurement?.n === doc.measurement.n &&
      cur.measurement?.hits === doc.measurement.hits &&
      cur.measurement?.accuracy === doc.measurement.accuracy &&
      cur.seal?.verdict === doc.seal.verdict &&
      cur.subject?.hub_revision === doc.subject.hub_revision;
    if (!same) { console.error("✖ mine-hf-observation --check: staged doc drifted from the branch"); process.exit(1); }
    console.log(`✓ mine-hf-observation --check: n=${doc.measurement.n} acc=${doc.measurement.accuracy} seal=${doc.seal.verdict}`);
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT, JSON.stringify(doc, null, 2) + "\n");
  console.log(
    `staged ${doc.subject.hub_model}@${String(doc.subject.hub_revision).slice(0, 8)} ` +
      `· n=${doc.measurement.n} hits=${doc.measurement.hits} acc=${doc.measurement.accuracy} ` +
      `· reproduced=${doc.measurement.reproduced} · seal=${doc.seal.verdict}`,
  );
}

main();
