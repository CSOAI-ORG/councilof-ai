#!/usr/bin/env node
/**
 * sign-corrections-ledger.mjs — re-issue the /api/corrections signature over the CURRENT bytes.
 *
 * WHY THIS EXISTS. The ledger was signed once, on 2026-08-22, over a 15-entry body. Every append
 * since — 46 of them by 2026-09-22 — moved the bytes without re-issuing the signature, so the
 * endpoint has served `signature_state: STALE` for a month. The published note said the re-sign
 * was owner-supervised because "the key is not in this repository". That stopped being true on
 * 2026-09-22, when /api/board-sign began accepting the pod caller token beside GitHub OIDC. The
 * defect was never the label; it was that nothing re-signed.
 *
 * WHAT IS SIGNED. The canonical ledger body is ~87KB and /api/board-sign caps a payload at 3072
 * bytes, so the signature is DETACHED: Ed25519 over a small attestation object that carries the
 * SHA-256 of the canonical ledger body. A relying party checks two things, both from the served
 * bytes: that the digest still describes the ledger it just read, and that the signature verifies
 * over the attestation under did:web:csoai.org#board-attestation-1. Either one failing is a
 * failure. This is why signature.id alone can never be bumped to turn the flag green — the id is
 * inside the signed object now, not beside it.
 *
 * KEY CHANGE, STATED. The 2026-08-22 signature was issued under did:web:csoai.org#card-attestation-1
 * (d4cb0eaa…). That key is not reachable from any automation here. The re-issue is under
 * did:web:csoai.org#board-attestation-1 (9367cf59…), the key /api/board-sign holds. Both are
 * published in the same DID document; the new signature names which one it used.
 *
 * SPLIT-HOST RUN. The signing token lives only on the pod (mode 600) and node lives only on the
 * Mac, so the two halves can be run separately and the token never moves:
 *     node scripts/sign-corrections-ledger.mjs --emit-payload /tmp/att.json
 *     # on the pod: curl -sS -X POST https://councilof.ai/api/board-sign \
 *     #   -H "authorization: Bearer $(cat /workspace/secrets/board-sign-pod-token)" \
 *     #   -H 'content-type: application/json' \
 *     #   -d "{\"payload\": $(cat /tmp/att.json)}" > /tmp/att.sig.json
 *     node scripts/sign-corrections-ledger.mjs --signature /tmp/att.sig.json --write
 * Single-host run, where a token file is readable:
 *     node scripts/sign-corrections-ledger.mjs --token-file /workspace/secrets/board-sign-pod-token --write
 *
 * Nothing here edits a signed payload. The ledger body is untouched; only the detached signature
 * block beside it is replaced, which is what re-issuing a signature means.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash, createPublicKey, verify as edVerify } from "node:crypto";

const SRC = process.env.CORRECTIONS_TS || "functions/api/corrections.ts";
const BOARD_DID = "did:web:csoai.org#board-attestation-1";
const DID_URL = "https://csoai.org/.well-known/did.json";
const SIGN_URL = "https://councilof.ai/api/board-sign";
const CAP = 3072;

// The keys the HANDLER adds to the response at request time. They are computed from the ledger,
// never part of it, so a verifier strips exactly these before recomputing the digest. Kept in
// lockstep with UNSIGNED_WRAPPER_FIELDS in functions/api/corrections.ts.
const UNSIGNED = ["signature", "signature_state", "signature_check", "correction_latency", "note", "fix_requires"];

const NONASCII_G = new RegExp("[\\u0080-\\uffff]", "g");
const NONASCII = new RegExp("[\\u0080-\\uffff]");

/** The published content_id rule: Python json.dumps(sort_keys, (',',':'), ensure_ascii=True). */
export function canonJson(obj) {
  const j = (o) => {
    if (Array.isArray(o)) return "[" + o.map(j).join(",") + "]";
    if (o !== null && typeof o === "object")
      return "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + j(o[k])).join(",") + "}";
    return JSON.stringify(o);
  };
  return j(obj).replace(NONASCII_G, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}

/** The /api/board-sign preimage rule (functions/_lib/cardSign.ts canonicalBytes): ensure_ascii=false. */
function canonSigner(obj) {
  const rec = (v) => {
    if (Array.isArray(v)) return v.map(rec);
    if (v && typeof v === "object") {
      const out = {};
      for (const k of Object.keys(v).sort()) out[k] = rec(v[k]);
      return out;
    }
    return v;
  };
  return JSON.stringify(rec(obj));
}

const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");

/** Read the LEDGER object literal out of the TypeScript source. One ledger, one place. */
function readLedger(file) {
  const src = fs.readFileSync(file, "utf8");
  const start = src.indexOf("export const LEDGER = {");
  if (start < 0) throw new Error(`no "export const LEDGER = {" in ${file}`);
  const end = src.indexOf("\n};\n", start);
  if (end < 0) throw new Error(`LEDGER literal is not closed by a line "};" in ${file}`);
  const literal = src.slice(start + "export const LEDGER = ".length, end + 3).replace(/;\s*$/, "");
  return { src, start, end, ledger: eval("(" + literal + ")") };
}

function buildAttestation(ledger) {
  const body = { ...ledger };
  for (const k of UNSIGNED) delete body[k];
  const canonical = canonJson(body);
  const att = {
    artifact: String(ledger.schema),
    content_id: sha256(canonical),
    content_id_rule:
      "sha256(json.dumps(served body minus keys " + JSON.stringify(UNSIGNED) +
      ", sort_keys=True, separators=(',',':'), ensure_ascii=True))",
    entries: ledger.corrections.length,
    latest_entry_id: String(ledger.corrections[0]?.id ?? ""),
    ledger_canonical_bytes: Buffer.byteLength(canonical, "utf8"),
    note:
      "Detached. The Ed25519 signature covers THIS object; the ledger body is committed to by " +
      "content_id because it is larger than the signer's 3KB payload cap. Both must check: the " +
      "digest must still describe the body a reader just fetched, and this object must verify.",
    schema: "csoai.corrections-attestation/0.1",
    signed_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
  };
  if (NONASCII.test(JSON.stringify(att)))
    throw new Error("attestation must be ASCII-only so the two canonical rules cannot disagree");
  if (canonJson(att) !== canonSigner(att))
    throw new Error("the two canonical rules disagree on the attestation; refusing to sign");
  const bytes = Buffer.byteLength(canonSigner(att), "utf8");
  if (bytes > CAP) throw new Error(`attestation ${bytes} bytes exceeds the ${CAP} cap`);
  return { att, canonical, bytes };
}

async function boardKeyHex() {
  const doc = await (await fetch(DID_URL)).json();
  const vm = (doc.verificationMethod || []).find((v) => v.id === BOARD_DID || String(v.id).endsWith("#board-attestation-1"));
  if (!vm?.publicKeyJwk?.x) throw new Error(`no publicKeyJwk for ${BOARD_DID} in ${DID_URL}`);
  return Buffer.from(vm.publicKeyJwk.x, "base64url").toString("hex");
}

/** Ed25519 verify from a raw 32-byte public key, via a minimal SPKI wrapper. */
function verifyRaw(msg, sigHex, pubHex) {
  const spki = Buffer.concat([
    Buffer.from("302a300506032b6570032100", "hex"),
    Buffer.from(pubHex, "hex"),
  ]);
  const key = createPublicKey({ key: spki, format: "der", type: "spki" });
  return edVerify(null, Buffer.from(msg, "utf8"), key, Buffer.from(sigHex, "hex"));
}

function writeBack(file, src, ledger, att, sigHex, keyHex) {
  const block =
    "  signature: {\n" +
    `    id: ${JSON.stringify(att.content_id)},\n` +
    `    signer: ${JSON.stringify(keyHex)},\n` +
    `    did: ${JSON.stringify(BOARD_DID)},\n` +
    `    signature: ${JSON.stringify(sigHex)},\n` +
    "    attestation: " + JSON.stringify(att, Object.keys(att).sort(), 6).replace(/\n/g, "\n    ") + ",\n" +
    '    sig_input:\n      "Ed25519 over json.dumps(signature.attestation, sort_keys=True, separators=(\',\',\':\'), ' +
    'ensure_ascii=False) - the attestation is ASCII-only, so ensure_ascii does not change its bytes. " +\n' +
    '      "The attestation names the digest of the ledger body and the rule that produces it.",\n' +
    `    key_source: "${DID_URL} (${BOARD_DID})",\n` +
    "    note:\n" +
    '      "RE-ISSUED over the current body through POST /api/board-sign; signature.attestation.signed_at records the issuance time. " +\n' +
    '      "The 2026-08-22 signature was under did:web:csoai.org#card-attestation-1 (d4cb0eaa) and covered a " +\n' +
    '      "15-entry ledger; 46 appends followed and none re-issued it, which is why this endpoint read STALE " +\n' +
    '      "for a month. Every append MUST re-issue: run scripts/sign-corrections-ledger.mjs. Bumping id alone " +\n' +
    '      "cannot green the flag any more - id is inside the signed attestation, and the handler verifies the " +\n' +
    '      "Ed25519 bytes at request time, not just a digest match.",\n' +
    "  },\n";
  const sigStart = src.indexOf("\n  signature: {", src.indexOf("export const LEDGER = {"));
  if (sigStart < 0) throw new Error("no signature block in the LEDGER literal");
  const sigEnd = src.indexOf("\n  },\n", sigStart);
  if (sigEnd < 0) throw new Error("signature block is not closed");
  const out = src.slice(0, sigStart + 1) + block + src.slice(sigEnd + "\n  },\n".length);
  fs.writeFileSync(file, out);
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (n) => { const i = argv.indexOf(n); return i < 0 ? null : argv[i + 1]; };
  const file = arg("--file") || SRC;
  const { src, ledger } = readLedger(file);
  let { att, bytes } = buildAttestation(ledger);

  // In the split-host run the signer covered the payload we emitted, not one rebuilt now:
  // signed_at alone would differ and the signature would cover bytes nobody can reproduce.
  // Load the exact signed object and re-derive nothing but the check that it still fits the
  // ledger on disk.
  const payloadFile = arg("--payload");
  if (payloadFile) {
    const signedAtt = JSON.parse(fs.readFileSync(payloadFile, "utf8"));
    if (signedAtt.content_id !== att.content_id)
      throw new Error(`the signed payload commits to ${signedAtt.content_id} but this ledger canonicalises to ${att.content_id}`);
    if (signedAtt.content_id_rule !== att.content_id_rule)
      throw new Error("the signed payload names a different content_id rule than this producer");
    att = signedAtt;
    bytes = Buffer.byteLength(canonSigner(att), "utf8");
  }

  console.log(`ledger      : ${file}`);
  console.log(`entries     : ${att.entries}  latest ${att.latest_entry_id}`);
  console.log(`body bytes  : ${att.ledger_canonical_bytes} (canonical)`);
  console.log(`content_id  : ${att.content_id}`);
  console.log(`embedded id : ${ledger.signature?.id ?? "(none)"}`);
  console.log(`attestation : ${bytes} bytes of ${CAP}`);

  const emit = arg("--emit-payload");
  if (emit) {
    fs.mkdirSync(path.dirname(path.resolve(emit)), { recursive: true });
    fs.writeFileSync(emit, JSON.stringify(att) + "\n");
    console.log(`\nwrote the payload to ${emit}. POST it as {"payload": <this object>} to ${SIGN_URL}`);
    return 0;
  }

  let resp;
  const sigFile = arg("--signature");
  const tokenFile = arg("--token-file");
  if (sigFile) {
    if (!payloadFile)
      throw new Error("--signature needs the --payload that was signed; a rebuilt payload has a new signed_at");
    resp = JSON.parse(fs.readFileSync(sigFile, "utf8"));
  } else if (tokenFile) {
    const token = fs.readFileSync(tokenFile, "utf8").trim();
    const r = await fetch(SIGN_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ payload: att }),
    });
    resp = await r.json();
  } else {
    console.error("\nneed one of --emit-payload <f>, --signature <f>, --token-file <f>");
    return 2;
  }
  if (!resp.sig_ed25519) {
    console.error(`\nsigner refused: ${JSON.stringify(resp)}`);
    return 1;
  }

  // The signer hashes the SAME bytes we are about to claim it signed. If its payload_sha256
  // disagrees with ours, the two sides canonicalised differently and the signature covers bytes
  // we cannot reproduce - exactly the 2026-09-20 site_attestation defect. Refuse.
  const preimage = canonSigner(att);
  const mine = sha256(preimage);
  if (resp.payload_sha256 !== mine)
    throw new Error(`preimage disagreement: signer hashed ${resp.payload_sha256}, we compute ${mine}`);

  const keyHex = await boardKeyHex();
  const ok = verifyRaw(preimage, resp.sig_ed25519, keyHex);
  console.log(`\nsigner_auth : ${resp.signer_auth}`);
  console.log(`did         : ${resp.did}`);
  console.log(`key (live)  : ${keyHex}`);
  console.log(`preimage    : sha256 ${mine} (agrees with the signer)`);
  console.log(`VERIFY      : ${ok ? "ok - signature verifies under " + BOARD_DID : "FAILED"}`);
  if (!ok) return 1;
  if (resp.did !== BOARD_DID) throw new Error(`signer named ${resp.did}, expected ${BOARD_DID}`);

  if (argv.includes("--write")) {
    writeBack(file, src, ledger, att, resp.sig_ed25519, keyHex);
    console.log(`\nwrote the re-issued signature block into ${file}`);
    const again = readLedger(file);
    const rebuilt = buildAttestation(again.ledger);
    if (rebuilt.att.content_id !== att.content_id)
      throw new Error("writing the signature changed the body digest - the block is inside the signed body");
    if (!verifyRaw(canonSigner(again.ledger.signature.attestation), again.ledger.signature.signature, keyHex))
      throw new Error("round-trip verify failed against the file just written");
    console.log("round-trip  : body digest unchanged and the written signature verifies");
  } else {
    console.log("\n(not written - pass --write)");
  }
  return 0;
}

main().then((c) => process.exit(c)).catch((e) => { console.error(String(e.stack || e)); process.exit(1); });
