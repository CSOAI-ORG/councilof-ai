#!/usr/bin/env node
/**
 * produce-ruling.mjs — build, canonicalise and sign csoai.ruling/0.1 records, then re-sign the
 * read-only index that GET /api/rulings serves.
 *
 * Adopted by the owner on 2026-09-29 ("adopt the ruling records"). Design:
 * _alignment/COUNCIL-MECHANISM-MINED-2026-09-29.md section 4. A ruling decides WHICH rule applies
 * or WHETHER a rule's output is served; it never sets a measured state (ruling-lib.mjs checkRecord
 * refuses measured-state keys at any depth, and effect.writes_* are const false).
 *
 * SIGNING PATH. The same one every other producer uses: POST https://councilof.ai/api/board-sign
 * with the pod caller token, detached over a small attestation (see sign-corrections-ledger.mjs
 * for why detached). The token is read from a file or stdin and is never written or echoed. The
 * design note proposed a separate ruling key; none is minted, so records name the board key
 * they were actually signed under.
 *
 * APPEND-ONLY. An existing record is never rewritten. Re-running with the same input whose
 * content_id matches the stored record is a no-op for that record; a different body under an
 * existing ruling_id is refused (issue a new ruling with supersedes instead).
 *
 *   node scripts/rulings/produce-ruling.mjs --input scripts/rulings/backfill-20260929.json --dry-run
 *   node scripts/rulings/produce-ruling.mjs --input <f> --token-stdin < token
 *   node scripts/rulings/produce-ruling.mjs --input <f> --token-file <f>
 * Split-host (token elsewhere):
 *   --emit-payloads <dir>            write each attestation to <dir>/<id>.att.json (and index.att.json
 *                                    after records are signed); POST each as {"payload": <file>}
 *   --signatures <dir>               apply <dir>/<id>.sig.json responses to <dir>/<id>.att.json payloads
 */
import fs from "node:fs";
import path from "node:path";
import {
  BOARD_DID, BOARD_KEY_HEX, attestationPreimage, buildAttestation, buildIndex, buildIndexAttestation,
  checkRecord, checkSigned, contentId, sha256Hex, verifyRaw,
} from "./ruling-lib.mjs";

const SIGN_URL = process.env.BOARD_SIGN_URL || "https://councilof.ai/api/board-sign";
const DID_URL = "https://csoai.org/.well-known/did.json";
const argv = process.argv.slice(2);
const arg = (n, d = null) => { const i = argv.indexOf(n); return i < 0 ? d : argv[i + 1]; };
const has = (n) => argv.includes(n);
const nowZ = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

const OUT = arg("--out", "public/signed/rulings");
const DATA_MODULE = arg("--data-module", "functions/api/_rulings_data.ts");

const RECORD_NOTE =
  "Detached Ed25519 over signature.attestation (RFC 8785 JCS; identical to the board signer's " +
  "sorted-key form for this ASCII object), issued through POST /api/board-sign on the pod caller " +
  "token. The attestation commits to this record by content_id. The design note proposed a " +
  "separate ruling key; none is minted, so this names the board key it was signed under.";

async function liveKeyHex() {
  const doc = await (await fetch(DID_URL)).json();
  const vm = (doc.verificationMethod || []).find((v) => v.id === BOARD_DID || String(v.id).endsWith("#board-attestation-1"));
  if (!vm?.publicKeyJwk?.x) throw new Error(`no publicKeyJwk for ${BOARD_DID} in ${DID_URL}`);
  return Buffer.from(vm.publicKeyJwk.x, "base64url").toString("hex");
}

function readToken() {
  if (arg("--token-file")) return fs.readFileSync(arg("--token-file"), "utf8").trim();
  if (has("--token-stdin")) return fs.readFileSync(0, "utf8").trim();
  return null;
}

async function signLive(att, token) {
  const preimage = attestationPreimage(att);
  const r = await fetch(SIGN_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ payload: att }),
  });
  const resp = await r.json();
  return acceptResponse(att, preimage, resp);
}

function acceptResponse(att, preimage, resp) {
  if (!resp || !resp.sig_ed25519) throw new Error(`signer refused: ${JSON.stringify(resp)}`);
  const mine = sha256Hex(Buffer.from(preimage, "utf8"));
  if (resp.payload_sha256 !== mine)
    throw new Error(`preimage disagreement: signer hashed ${resp.payload_sha256}, we compute ${mine}`);
  if (resp.did !== BOARD_DID) throw new Error(`signer named ${resp.did}, expected ${BOARD_DID}`);
  if (!verifyRaw(preimage, resp.sig_ed25519, BOARD_KEY_HEX)) throw new Error("returned signature does not verify under the pinned key");
  return { sig_ed25519: resp.sig_ed25519, signer_auth: resp.signer_auth };
}

function loadExisting() {
  const out = new Map();
  if (!fs.existsSync(OUT)) return out;
  for (const f of fs.readdirSync(OUT)) {
    if (!/^R-\d{4}-\d{4}-\d{2}\.json$/.test(f)) continue;
    const r = JSON.parse(fs.readFileSync(path.join(OUT, f), "utf8"));
    out.set(r.ruling_id, r);
  }
  return out;
}

const pretty = (o) => JSON.stringify(o, null, 2) + "\n";

function writeDataModule(records, index) {
  const src =
    "// GENERATED by scripts/rulings/produce-ruling.mjs from public/signed/rulings/*.json. Do not edit:\n" +
    "// every record and the index carry a detached signature, and GET /api/rulings verifies them on\n" +
    "// every request, so a hand edit reads STALE or INVALID_SIGNATURE there.\n" +
    "/* eslint-disable */\n" +
    `export const RULINGS: Record<string, unknown>[] = ${JSON.stringify(records, null, 2)};\n\n` +
    `export const RULINGS_INDEX: Record<string, unknown> = ${JSON.stringify(index, null, 2)};\n`;
  fs.mkdirSync(path.dirname(DATA_MODULE), { recursive: true });
  fs.writeFileSync(DATA_MODULE, src);
}

async function main() {
  const input = arg("--input");
  const existing = loadExisting();
  const incoming = input ? [].concat(JSON.parse(fs.readFileSync(input, "utf8"))) : [];
  for (const r of incoming) checkRecord(r);

  const toSign = [];
  for (const r of incoming) {
    const prev = existing.get(r.ruling_id);
    if (prev) {
      if (contentId(prev).content_id !== contentId(r).content_id)
        throw new Error(`${r.ruling_id} exists with a different body; records are append-only (issue a new ruling that supersedes it)`);
      console.log(`${r.ruling_id}  unchanged  ${contentId(r).content_id.slice(0, 16)}`);
      continue;
    }
    toSign.push(r);
  }
  const signedAt = nowZ();
  const pending = toSign.map((r) => ({ r, att: buildAttestation(r, signedAt) }));
  for (const { r, att } of pending)
    console.log(`${r.ruling_id}  new  ${r.class.padEnd(12)} content_id ${att.content_id.slice(0, 16)}  att ${Buffer.byteLength(attestationPreimage(att))}B`);

  if (has("--dry-run")) { console.log(`\ndry run: ${pending.length} to sign, ${existing.size} on disk. Nothing written.`); return 0; }

  const emit = arg("--emit-payloads");
  const sigDir = arg("--signatures");
  const token = readToken();
  if (!emit && !sigDir && !token) { console.error("need --dry-run, --token-file <f>, --token-stdin, --emit-payloads <dir> or --signatures <dir>"); return 2; }
  if (emit) {
    fs.mkdirSync(emit, { recursive: true });
    for (const { r, att } of pending) fs.writeFileSync(path.join(emit, `${r.ruling_id}.att.json`), JSON.stringify(att) + "\n");
    console.log(`wrote ${pending.length} attestations to ${emit}; POST each as {"payload": ...} to ${SIGN_URL}, save responses as <id>.sig.json, rerun with --signatures ${emit}`);
    return 0;
  }

  const live = await liveKeyHex();
  if (live !== BOARD_KEY_HEX) throw new Error(`live DID key ${live} differs from the pinned ${BOARD_KEY_HEX}; refusing`);

  fs.mkdirSync(OUT, { recursive: true });
  const all = new Map(existing);
  for (const { r, att: built } of pending) {
    let att = built;
    let res;
    if (sigDir) {
      att = JSON.parse(fs.readFileSync(path.join(sigDir, `${r.ruling_id}.att.json`), "utf8"));
      if (att.content_id !== built.content_id) throw new Error(`${r.ruling_id}: signed payload commits to a different body`);
      res = acceptResponse(att, attestationPreimage(att), JSON.parse(fs.readFileSync(path.join(sigDir, `${r.ruling_id}.sig.json`), "utf8")));
    } else {
      res = await signLive(att, token);
    }
    const signed = {
      ...r,
      signature: {
        did: BOARD_DID,
        key_ed25519_hex: BOARD_KEY_HEX,
        attestation: att,
        sig_ed25519: res.sig_ed25519,
        signer_auth: res.signer_auth,
        note: RECORD_NOTE,
      },
    };
    checkRecord(signed);
    const chk = checkSigned(signed);
    if (chk.state !== "VALID") throw new Error(`${r.ruling_id}: round-trip check ${chk.state}`);
    fs.writeFileSync(path.join(OUT, `${r.ruling_id}.json`), pretty(signed));
    all.set(r.ruling_id, signed);
    console.log(`${r.ruling_id}  SIGNED (${res.signer_auth})  VALID`);
  }

  // The index: re-signed whenever its membership moves, never otherwise.
  const records = [...all.values()].sort((a, b) => (a.ruling_id < b.ruling_id ? -1 : 1));
  for (const r of records) if (checkSigned(r).state !== "VALID") throw new Error(`${r.ruling_id} on disk is not VALID; refusing to index it`);
  const indexPath = path.join(OUT, "index.json");
  let index = buildIndex(records);
  const prevIndex = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, "utf8")) : null;
  const moved = !prevIndex || checkSigned(prevIndex, { kind: "index" }).state !== "VALID" ||
    checkSigned({ ...index, signature: prevIndex.signature }, { kind: "index" }).state !== "VALID";
  if (moved) {
    const att = buildIndexAttestation(index, nowZ());
    let res;
    if (sigDir) {
      const f = path.join(sigDir, "index.att.json");
      if (!fs.existsSync(f)) {
        fs.writeFileSync(f, JSON.stringify(att) + "\n");
        console.log(`records applied; index attestation written to ${f}. Sign it as index.sig.json and rerun --signatures.`);
        writeDataModule(records, prevIndex || index);
        return 0;
      }
      const signedAtt = JSON.parse(fs.readFileSync(f, "utf8"));
      if (signedAtt.content_id !== att.content_id) throw new Error("index attestation on disk commits to a different index");
      res = acceptResponse(signedAtt, attestationPreimage(signedAtt), JSON.parse(fs.readFileSync(path.join(sigDir, "index.sig.json"), "utf8")));
      index = { ...index, signature: { did: BOARD_DID, key_ed25519_hex: BOARD_KEY_HEX, attestation: signedAtt, sig_ed25519: res.sig_ed25519, signer_auth: res.signer_auth } };
    } else {
      res = await signLive(att, token);
      index = { ...index, signature: { did: BOARD_DID, key_ed25519_hex: BOARD_KEY_HEX, attestation: att, sig_ed25519: res.sig_ed25519, signer_auth: res.signer_auth } };
    }
    if (checkSigned(index, { kind: "index" }).state !== "VALID") throw new Error("index round-trip check failed");
    fs.writeFileSync(indexPath, pretty(index));
    console.log(`index  ${index.count} rulings  SIGNED  VALID`);
  } else {
    index = prevIndex;
    console.log(`index  ${index.count} rulings  unchanged`);
  }
  writeDataModule(records, index);
  console.log(`wrote ${DATA_MODULE}`);
  return 0;
}

main().then((c) => process.exit(c)).catch((e) => { console.error(String(e.stack || e)); process.exit(1); });
