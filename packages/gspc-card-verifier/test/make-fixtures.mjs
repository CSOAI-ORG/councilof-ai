#!/usr/bin/env node
/**
 * make-fixtures.mjs — regenerate test/fixtures/.
 *
 * The fixtures are COMMITTED so the test suite is offline and deterministic. This script
 * exists so they are reproducible and auditable rather than magic blobs. Run it only when
 * the profile or the fixture design changes:
 *
 *     node test/make-fixtures.mjs ../../public/signed/cards/<some-card>.json
 *
 * The foreign-key fixture is signed with a keypair generated HERE and thrown away. It is
 * fully self-consistent — its id is the hash of its body and its signature verifies under
 * the key it ships with. A verifier that skips the pinning step passes it. That is the point.
 */
import { generateKeyPairSync, sign as edSign, createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalise } from "../src/canonical.mjs";
import { defaultProfile } from "../src/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "fixtures");
mkdirSync(out, { recursive: true });
const profile = defaultProfile();
const write = (name, obj) => {
  writeFileSync(join(out, name), JSON.stringify(obj, null, 2) + "\n");
  process.stdout.write(`wrote fixtures/${name}\n`);
};
const pre = (body) => Buffer.from(canonicalise(body, profile), "utf8");
const sha = (b) => createHash("sha256").update(b).digest("hex");

const src = process.argv[2];
if (!src) { process.stderr.write("usage: make-fixtures.mjs <a-real-card.json>\n"); process.exit(2); }
const real = JSON.parse(readFileSync(src, "utf8"));

// 1. A genuine card, copied verbatim. The control: if this does not pass, nothing else means anything.
write("01-genuine.json", real);

// 2. Body altered, envelope untouched. The commonest tampering: edit the number, ship the old signature.
const t = structuredClone(real);
t.body.accuracy = 0.99;
write("02-tampered-body.json", t);

// 3. Body altered AND the id recomputed to match. Defeats any verifier that only checks
//    id == sha256(body) and treats that as proof. Only the signature catches this one.
const t2 = structuredClone(real);
t2.body.accuracy = 0.99;
t2.id = sha(pre(t2.body));
write("03-tampered-id-recomputed.json", t2);

// 4. A wholly self-consistent card signed by a key we generated seconds ago.
const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const rawPub = Buffer.from(publicKey.export({ format: "jwk" }).x, "base64url").toString("hex");
const forged = structuredClone(real);
forged.body.accuracy = 1.0;
forged.body.model = "attacker-supplied";
const fpre = pre(forged.body);
forged.id = sha(fpre);
forged.pubkey = rawPub;
forged.signature = edSign(null, fpre, privateKey).toString("hex");
write("04-foreign-key.json", forged);

// 5. Structurally broken: the signature is not 128 hex characters.
const bad = structuredClone(real);
bad.signature = "not-a-signature";
write("05-malformed.json", bad);

// 6. Valid JSON, not a card at all.
write("06-not-a-card.json", { name: "some-package", version: "1.0.0", dependencies: {} });

// 7. Outside the declared domain: an integral number in a field the profile does not classify.
//    JavaScript cannot tell whether the signer wrote 3 or 3.0, so there is no honest answer.
const dom = structuredClone(real);
dom.body.trials = 3;
dom.id = sha(Buffer.from("placeholder"));
write("07-out-of-domain-number.json", dom);

// 8. Outside the declared domain: the card declares a preimage rule this profile does not implement.
const jcs = structuredClone(real);
jcs.preimage_rule = "RFC 8785 JSON Canonicalization Scheme";
write("08-out-of-domain-preimage-rule.json", jcs);

// 9. Not parseable at all — truncated mid-object. Exercised through the CLI.
writeFileSync(join(out, "09-truncated.json"), '{"body": {"axis": "care-ref');
process.stdout.write("wrote fixtures/09-truncated.json\n");
