#!/usr/bin/env node
/**
 * gspc-board-attest.mjs — freeze the live-board snapshot under #board-attestation-1.
 *
 * PRODUCER of public/signed/gspc-board.<YYYY-MM-DD>.signed.json (first: 2026-09-25).
 *
 * WHY THIS EXISTS. The preserved 2026-09-02 MPC freeze (public/signed/gspc-board.signed.json)
 * was signed through the MPC custody on oracle-micro-2 and said 22 axis · 22 measured.
 * The board became 23 · 23 on 2026-09-22 and the freeze could not follow: re-signing
 * it is an owner key ceremony. This script is the other honest path — a NEW file, a
 * DIFFERENT key, with that key's custody stated exactly as it is:
 *
 *   one Ed25519 key, did:web:csoai.org#board-attestation-1, held as the Cloudflare Pages
 *   secret BOARD_SIGN_KEY_PKCS8_B64 on project councilof-ai, used by POST /api/board-sign.
 *   Single key. Not MPC, not threshold. The caller is authenticated by a bearer token.
 *
 * WHAT IS SIGNED. /api/board-sign caps the payload at 3 KB, and a board is ~57 KB. So
 * the signed payload is a compact statement that PINS the snapshot by its content id:
 *
 *   snapshot_content_id = sha256( canonical( file minus `board_attestation` ) )
 *   canonical           = recursively key-sorted JSON, no whitespace, UTF-8, non-ASCII
 *                         literal (the same canonical() as functions/api/gspc.ts and
 *                         functions/_lib/cardSign.ts canonicalBytes)
 *
 * and repeats the board's own totals beside it, so a reader of the 3 KB payload alone
 * cannot be told a different count than the pinned body carries (the script refuses if
 * they differ). The signature covers canonical(payload); the payload covers the body.
 *
 * INPUT is the output of scripts/gspc-board-snapshot.mjs, which runs the REAL
 * onRequestGet of functions/api/gspc.ts with an empty env. Counts are therefore the
 * same derivation /api/gspc serves; nothing here recomputes or types a number.
 *
 *   node scripts/gspc-board-snapshot.mjs .gspc-work/gspc-board.snapshot.json
 *   node scripts/gspc-board-attest.mjs .gspc-work/gspc-board.snapshot.json \
 *        public/signed/gspc-board.2026-09-25.signed.json \
 *        --token ~/.secrets/board-sign-pod-token --commit <sha> \
 *        --supersedes public/signed/gspc-board.signed.json
 *
 * Nothing is written unless: the returned payload_sha256 equals the local one, the
 * signature verifies under the #board-attestation-1 key fetched from
 * https://csoai.org/.well-known/did.json, and every tamper control FAILS to verify.
 * A signature proves origin and integrity. It does not prove any number inside is true.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash, createPublicKey, verify as nodeVerify } from "node:crypto";
import { homedir } from "node:os";
import { basename } from "node:path";

const args = process.argv.slice(2);
const opt = (name, dflt = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
};
const [inPath, outPath] = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
if (!inPath || !outPath) {
  console.error("usage: gspc-board-attest.mjs <snapshot.json> <out.signed.json> --token <file> --commit <sha> [--supersedes <old.signed.json>]");
  process.exit(2);
}
const tokenPath = (opt("--token", "~/.secrets/board-sign-pod-token") || "").replace(/^~/, homedir());
const commit = opt("--commit");
const supersedesPath = opt("--supersedes");
const endpoint = opt("--endpoint", "https://councilof.ai/api/board-sign");
const didUrl = opt("--did-url", "https://csoai.org/.well-known/did.json");
if (!commit || !/^[0-9a-f]{40}$/.test(commit)) {
  console.error("gspc-board-attest: --commit <40-hex source commit> is required (the axis arrays the snapshot was derived from)");
  process.exit(2);
}
if (existsSync(outPath)) {
  // Signed bytes are superseded, never overwritten (memory: signed-bytes-never-edited).
  console.error(`gspc-board-attest: refusing to overwrite ${outPath} — supersede with a new dated file`);
  process.exit(2);
}

export const canonical = (o) => {
  if (o === null || typeof o !== "object") return JSON.stringify(o);
  if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
  return "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + canonical(o[k])).join(",") + "}";
};
const sha256 = (b) => createHash("sha256").update(b).digest("hex");

const body = JSON.parse(readFileSync(inPath, "utf8"));
for (const k of ["board_attestation", "custody_attestation", "site_attestation"]) {
  if (k in body) {
    console.error(`gspc-board-attest: input already carries ${k} — attest the raw snapshot, never a signed file`);
    process.exit(2);
  }
}
const t = body.totals ?? {};
if (!Array.isArray(body.axes) || t.axes !== body.axes.length) {
  console.error(`gspc-board-attest: totals.axes (${t.axes}) does not equal axes.length (${body.axes?.length}) — not a board snapshot`);
  process.exit(2);
}
const measuredFromArray = body.axes.filter((a) => a.status === "MEASURED").length;
if (t.measured_axes !== measuredFromArray || t.unmeasured_axes !== t.axes - measuredFromArray) {
  console.error("gspc-board-attest: totals do not derive from the axis array in the snapshot — refusing");
  process.exit(2);
}

const bodyBytes = Buffer.from(canonical(body), "utf8");
const snapshotContentId = sha256(bodyBytes);

let supersedes = null;
if (supersedesPath) {
  const oldBytes = readFileSync(supersedesPath);
  const old = JSON.parse(oldBytes.toString("utf8"));
  supersedes = {
    file: "/signed/" + basename(supersedesPath),
    sha256_file_bytes: sha256(oldBytes),
    content_id: old.custody_attestation?.content_id ?? null,
    signer: old.custody_attestation?.signer ?? null,
    public_count: old.totals?.public_count ?? null,
  };
}

const frozenAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const payload = {
  schema: "csoai.gspc-board-freeze/0.1",
  subject: "/signed/" + basename(outPath),
  snapshot_content_id: snapshotContentId,
  snapshot_canonical:
    "sha256 of canonical JSON (recursively sorted keys, no whitespace, UTF-8, non-ASCII literal) of the file with the board_attestation field removed",
  produced_by: "scripts/gspc-board-snapshot.mjs — runs onRequestGet of functions/api/gspc.ts with env {} (no signing key, so no site_attestation)",
  source_commit: commit,
  frozen_at: frozenAt,
  totals: {
    axes: t.axes,
    measured_axes: t.measured_axes,
    unmeasured_axes: t.unmeasured_axes,
    public_count: t.public_count,
  },
  measured_on: body.measured_on?.date ?? null,
  supersedes,
  signer: "did:web:csoai.org#board-attestation-1",
  custody:
    "Single Ed25519 key. Held as the Cloudflare Pages secret BOARD_SIGN_KEY_PKCS8_B64 on project councilof-ai and used only inside POST /api/board-sign; the private key is not on any estate machine. Caller authenticated by the pod bearer token. Not MPC. Not threshold.",
  attests:
    "Origin and integrity of the pinned snapshot bytes as produced from the committed axis arrays at source_commit. Not a re-measurement, and not a claim that any statement inside is true.",
};

const payloadBytes = Buffer.from(canonical(payload), "utf8");
if (payloadBytes.length > 3072) {
  console.error(`gspc-board-attest: payload is ${payloadBytes.length} bytes > 3072 cap`);
  process.exit(2);
}
const payloadSha = sha256(payloadBytes);

const token = readFileSync(tokenPath, "utf8").trim();
const res = await fetch(endpoint, {
  method: "POST",
  headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "user-agent": "csoai-board-attest/0.1" },
  body: JSON.stringify({ payload }),
});
const r = await res.json().catch(() => ({}));
if (!res.ok || !r.sig_ed25519) {
  console.error(`gspc-board-attest: signer refused (HTTP ${res.status}): ${JSON.stringify(r)}`);
  process.exit(1);
}
if (r.payload_sha256 !== payloadSha) {
  console.error(`gspc-board-attest: preimage mismatch — signer hashed ${r.payload_sha256}, local ${payloadSha}`);
  process.exit(1);
}

const did = await (await fetch(didUrl, { headers: { "user-agent": "Mozilla/5.0 csoai-board-attest" } })).json();
const vm = (did.verificationMethod ?? []).find((m) => String(m.id).endsWith("#board-attestation-1"));
if (!vm) {
  console.error("gspc-board-attest: #board-attestation-1 not in the DID document");
  process.exit(1);
}
const pubRaw = Buffer.from(vm.publicKeyJwk.x, "base64url");
const key = createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), pubRaw]), format: "der", type: "spki" });
const sig = Buffer.from(r.sig_ed25519, "hex");
if (!nodeVerify(null, payloadBytes, key, sig)) {
  console.error("gspc-board-attest: signature does NOT verify under the DID key — nothing written");
  process.exit(1);
}

// Tamper controls: each MUST fail, or the verification above proves nothing.
const controls = {};
const tamperedPayload = { ...payload, totals: { ...payload.totals, measured_axes: payload.totals.measured_axes - 1 } };
controls["payload totals.measured_axes - 1"] = nodeVerify(null, Buffer.from(canonical(tamperedPayload), "utf8"), key, sig)
  ? "VERIFIED (CONTROL FAILED)"
  : "rejected (control holds)";
controls["payload trailing byte"] = nodeVerify(null, Buffer.concat([payloadBytes, Buffer.from(" ")]), key, sig)
  ? "VERIFIED (CONTROL FAILED)"
  : "rejected (control holds)";
const tamperedBody = structuredClone(body);
tamperedBody.totals.measured_axes -= 1;
controls["body totals.measured_axes - 1 → content id"] =
  sha256(Buffer.from(canonical(tamperedBody), "utf8")) === snapshotContentId ? "MATCHED (CONTROL FAILED)" : "rejected (control holds)";
if (Object.values(controls).some((v) => v.includes("FAILED"))) {
  console.error("gspc-board-attest: a tamper control passed — refusing to write", controls);
  process.exit(3);
}

const out = {
  ...body,
  board_attestation: {
    payload,
    signature: {
      did: r.did,
      alg: "Ed25519",
      sig_ed25519: r.sig_ed25519,
      payload_sha256: r.payload_sha256,
      public_key_hex: pubRaw.toString("hex"),
      signer_auth: r.signer_auth ?? null,
      signed_at: r.signed_at ?? null,
      canonical: "canonical(payload): recursively key-sorted JSON, no whitespace, UTF-8 (functions/_lib/cardSign.ts canonicalBytes)",
    },
    verify:
      "node scripts/gspc-board-verify.mjs <this file> [--did did.json] — (1) sha256(canonical(file minus board_attestation)) must equal payload.snapshot_content_id; (2) sha256(canonical(payload)) must equal signature.payload_sha256; (3) Ed25519-verify sig_ed25519 (hex) over canonical(payload) with #board-attestation-1 publicKeyJwk.x in https://csoai.org/.well-known/did.json",
    local_verification: { did_document: didUrl, result: "VERIFIES", tamper_controls: controls },
    not_a_grade:
      "A signature proves these bytes came from the holder of the board key and have not changed since. It does not prove any number inside is correct.",
  },
};
writeFileSync(outPath, JSON.stringify(out, null, 1) + "\n");
const fileSha = sha256(readFileSync(outPath));
console.log(`gspc-board-attest -> ${outPath}`);
console.log(`  board          : ${t.public_count} (${t.axes} axes · ${t.measured_axes} measured · ${t.unmeasured_axes} unmeasured)`);
console.log(`  snapshot id    : ${snapshotContentId}`);
console.log(`  payload sha256 : ${payloadSha} (${payloadBytes.length} bytes)`);
console.log(`  signed_at      : ${r.signed_at} via ${r.signer_auth}`);
console.log(`  verify         : VERIFIES under #board-attestation-1 ${pubRaw.toString("hex")}`);
console.log(`  controls       : ${JSON.stringify(controls)}`);
console.log(`  file sha256    : ${fileSha}`);
