// csoai.completion-record/0.1 — shared primitives for the issuer and its tests. Zero dependencies.
//
//   JCS            RFC 8785 for the value space this profile allows (strings, booleans, null,
//                  integers, arrays, objects). A non-integer number is REFUSED rather than
//                  canonicalised, because JCS number formatting is the one place hand-rolled
//                  canonicalisers disagree (see public/signed/HOW-TO-VERIFY.md §3).
//   eddsa-jcs-2022 W3C VC Data Integrity EdDSA cryptosuite: hashData = SHA-256(JCS(proofConfig))
//                  || SHA-256(JCS(document without proof)); Ed25519 over hashData; proofValue is
//                  multibase base58btc ("z…").
//   did:key        Ed25519 (multicodec 0xed01), base58btc.
//   Bitstring      W3C Bitstring Status List v1.0: GZIP, base64url without padding, multibase
//   Status List    "u" prefix, minimum 131,072 entries, bit 0 = most significant bit of byte 0.

import { createHash, createHmac, sign as edSign, verify as edVerify, createPublicKey } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";

export const CONTEXT = [
  "https://www.w3.org/ns/credentials/v2",
  "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
];
export const SCHEMA_URL = "https://councilof.ai/schemas/csoai-completion-record-0.1.schema.json";
export const OB_SCHEMA_URL = "https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json";
export const ACHIEVEMENT_ID = "https://councilof.ai/academy/achievements/reproduced-measurement/v0.1";
export const STATUS_BASE = "https://councilof.ai/academy/status/";
export const STATUS_LIST_BITS = 131072;
export const COMPLETION_RULE = "reproduced-measurement: publishedResultSha256 == reproducedResultSha256";

export function jcs(v) {
  if (v === null || typeof v === "boolean" || typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number") {
    if (!Number.isSafeInteger(v)) throw new Error(`JCS: refusing non-integer or unsafe number ${v}`);
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) return "[" + v.map(jcs).join(",") + "]";
  if (typeof v === "object") {
    // Array.prototype.sort compares UTF-16 code units, which is exactly RFC 8785 §3.2.3.
    const keys = Object.keys(v).filter((k) => v[k] !== undefined).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + jcs(v[k])).join(",") + "}";
  }
  throw new Error(`JCS: unsupported value of type ${typeof v}`);
}

export const sha256 = (buf) => createHash("sha256").update(buf).digest();
export const sha256Hex = (buf) => createHash("sha256").update(buf).digest("hex");

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export function b58encode(bytes) {
  let n = 0n;
  for (const b of bytes) n = (n << 8n) | BigInt(b);
  let out = "";
  while (n > 0n) { out = B58[Number(n % 58n)] + out; n /= 58n; }
  for (const b of bytes) { if (b === 0) out = "1" + out; else break; }
  return out;
}
export function b58decode(s) {
  let n = 0n;
  for (const c of s) {
    const i = B58.indexOf(c);
    if (i < 0) throw new Error("base58: bad character");
    n = n * 58n + BigInt(i);
  }
  const bytes = [];
  while (n > 0n) { bytes.unshift(Number(n & 0xffn)); n >>= 8n; }
  for (const c of s) { if (c === "1") bytes.unshift(0); else break; }
  return Buffer.from(bytes);
}

export function rawPublicKey(keyObject) {
  const x = keyObject.export({ format: "jwk" }).x;
  return Buffer.from(x, "base64url");
}
export function didKeyFromRaw(raw) {
  return "did:key:z" + b58encode(Buffer.concat([Buffer.from([0xed, 0x01]), raw]));
}
export function rawFromDidKey(did) {
  const m = /^did:key:(z[1-9A-HJ-NP-Za-km-z]+)/.exec(did);
  if (!m) throw new Error("not a did:key");
  const bytes = b58decode(m[1].slice(1));
  if (bytes[0] !== 0xed || bytes[1] !== 0x01 || bytes.length !== 34) throw new Error("did:key is not Ed25519");
  return bytes.subarray(2);
}
export function publicKeyFromRaw(raw) {
  return createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: Buffer.from(raw).toString("base64url") }, format: "jwk" });
}

/** eddsa-jcs-2022 hashData for a document and its proof options (proofValue absent). */
export function hashData(unsecuredDocument, proofOptions) {
  const proofConfig = { ...proofOptions };
  delete proofConfig.proofValue;
  if (unsecuredDocument["@context"]) proofConfig["@context"] = unsecuredDocument["@context"];
  const doc = { ...unsecuredDocument };
  delete doc.proof;
  return Buffer.concat([sha256(Buffer.from(jcs(proofConfig), "utf8")), sha256(Buffer.from(jcs(doc), "utf8"))]);
}

/** Add a Data Integrity proof. `signer(bytes) -> 64-byte signature`; the key never enters this module. */
export function addProof(unsecuredDocument, { verificationMethod, created, signer }) {
  const proof = {
    type: "DataIntegrityProof",
    cryptosuite: "eddsa-jcs-2022",
    created,
    verificationMethod,
    proofPurpose: "assertionMethod",
  };
  if (unsecuredDocument["@context"]) proof["@context"] = unsecuredDocument["@context"];
  const sig = signer(hashData(unsecuredDocument, proof));
  if (!sig || sig.length !== 64) throw new Error("signer must return a 64-byte Ed25519 signature");
  return { ...unsecuredDocument, proof: { ...proof, proofValue: "z" + b58encode(sig) } };
}

export function verifyProof(secured, publicKeyObject) {
  const { proof, ...doc } = secured;
  if (!proof || proof.cryptosuite !== "eddsa-jcs-2022" || proof.type !== "DataIntegrityProof") return false;
  if (!String(proof.proofValue || "").startsWith("z")) return false;
  const options = { ...proof };
  delete options.proofValue;
  const sig = b58decode(proof.proofValue.slice(1));
  return edVerify(null, hashData(doc, options), publicKeyObject, sig);
}

export const ed25519Signer = (privateKeyObject) => (bytes) => edSign(null, bytes, privateKeyObject);

/** urn:csoai:pseudonym:<hex> = HMAC-SHA256(pepper, NFC(trimmed handle)). The pepper is never written anywhere. */
export function pseudonym(handle, pepper) {
  if (!pepper || pepper.length < 32) throw new Error("pseudonym pepper must be >= 32 bytes");
  const h = String(handle).normalize("NFC").trim();
  if (!h) throw new Error("empty subject handle");
  return "urn:csoai:pseudonym:" + createHmac("sha256", pepper).update(h, "utf8").digest("hex");
}

export function encodeStatusList(setIndexes = [], bits = STATUS_LIST_BITS) {
  if (bits < STATUS_LIST_BITS) throw new Error(`status list must have >= ${STATUS_LIST_BITS} entries`);
  const buf = Buffer.alloc(bits / 8);
  for (const i of setIndexes) {
    if (!Number.isSafeInteger(i) || i < 0 || i >= bits) throw new Error(`status index ${i} out of range`);
    buf[i >> 3] |= 0x80 >> (i & 7);
  }
  return "u" + gzipSync(buf).toString("base64url");
}
export function statusBit(encodedList, index) {
  if (!encodedList.startsWith("u")) throw new Error("encodedList must be multibase base64url (u…)");
  const buf = gunzipSync(Buffer.from(encodedList.slice(1), "base64url"));
  if (buf.length * 8 < STATUS_LIST_BITS) throw new Error("status list shorter than the 131,072-entry minimum");
  if (index >= buf.length * 8) throw new Error("status index beyond list");
  return (buf[index >> 3] >> (7 - (index & 7))) & 1;
}

const CERT_WORD = /certif/i;

/** Build an unsigned record. Throws on anything the profile forbids — the issuer never "fixes" input. */
export function buildRecord(o) {
  const hex64 = /^[0-9a-f]{64}$/;
  if (!hex64.test(o.publishedResultSha256 || "") || !hex64.test(o.reproducedResultSha256 || ""))
    throw new Error("published and reproduced result sha256 must both be 64 lowercase hex");
  if (o.publishedResultSha256 !== o.reproducedResultSha256)
    throw new Error("REFUSED: reproduced result does not match the published result — nothing was completed");
  if (!/^https:\/\/councilof\.ai\//.test(o.measurementRef || "")) throw new Error("measurementRef must be a councilof.ai URL");
  if (!/^(urn:csoai:pseudonym:[0-9a-f]{64}|did:key:z6Mk[1-9A-HJ-NP-Za-km-z]{44})$/.test(o.subjectId || ""))
    throw new Error("subject must be a pseudonym URN or a did:key — never a name or an email");
  const test = o.test === true;
  const name = (test ? "TEST " : "") + "Completion record: reproduced a published measurement";
  if (CERT_WORD.test(name)) throw new Error("name may not say certif*");
  const statusList = STATUS_BASE + (test ? "test-" : "") + String(o.statusList ?? 0) + ".json";
  return {
    "@context": CONTEXT,
    id: o.id,
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    issuer: { id: o.issuerId, type: ["Profile"], name: "CSOAI Ltd (Council of AI)", url: "https://councilof.ai/" },
    validFrom: o.validFrom,
    name,
    description: (test ? "TEST RECORD. NOT ISSUED, NOT PUBLISHED. " : "") +
      "The subject re-ran a measurement Council of AI published and obtained the published result exactly. " +
      "This records that one reproduction. It is free, it is not a certification, and it says nothing about " +
      "the subject's conformity or competence, or about any system.",
    credentialSubject: {
      id: o.subjectId,
      type: ["AchievementSubject"],
      achievement: {
        id: ACHIEVEMENT_ID,
        type: ["Achievement"],
        achievementType: "Assignment",
        name: "Reproduced a published measurement",
        description: "Re-run one measurement published by Council of AI from its public inputs and public method, and obtain the published result.",
        criteria: {
          narrative: "Completed means reproduced: the subject's result for the named measurement has the same sha256 as the published result. Reading, watching, attending or passing a quiz is not completion.",
        },
      },
    },
    evidence: [{
      id: o.measurementRef,
      type: ["Evidence"],
      name: "Reproduced measurement",
      narrative: o.narrative,
      genre: "reproduced-measurement",
      measurementRef: o.measurementRef,
      publishedResultSha256: o.publishedResultSha256,
      reproducedResultSha256: o.reproducedResultSha256,
      reproductionMethod: o.reproductionMethod,
      reproducedAt: o.reproducedAt,
    }],
    credentialStatus: {
      id: statusList + "#" + String(o.statusIndex),
      type: "BitstringStatusListEntry",
      statusPurpose: "revocation",
      statusListIndex: String(o.statusIndex),
      statusListCredential: statusList,
    },
    credentialSchema: [
      { id: OB_SCHEMA_URL, type: "1EdTechJsonSchemaValidator2019" },
      { id: SCHEMA_URL, type: "JsonSchema" },
    ],
    csoaiRecord: {
      schema: "csoai.completion-record/0.1",
      test,
      free: true,
      non_certification: true,
      non_promotion: true,
      writes_board: false,
      completion_rule: COMPLETION_RULE,
    },
  };
}

export function buildStatusListCredential({ url, issuerId, validFrom, revoked = [] }) {
  return {
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    id: url,
    type: ["VerifiableCredential", "BitstringStatusListCredential"],
    issuer: issuerId,
    validFrom,
    credentialSubject: {
      id: url + "#list",
      type: "BitstringStatusList",
      statusPurpose: "revocation",
      encodedList: encodeStatusList(revoked),
    },
  };
}
