// State of the Agent Internet: the page, its published numbers and their signature stay one thing.
//   node --test scripts/state-report/state-report.node-test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash, createPublicKey, verify } from "node:crypto";

const ROOT = new URL("../../", import.meta.url).pathname;
const read = (p) => readFileSync(ROOT + p);
// did:web:csoai.org#board-attestation-1 (https://csoai.org/.well-known/did.json)
const BOARD_X = "k2fPWb6ctyu8l5at8FYgHsHFit_qoT-DssW3VNbCAXA";
const sha = (b) => createHash("sha256").update(b).digest("hex");
const canon = (v) => {
  const rec = (x) =>
    Array.isArray(x) ? x.map(rec) : x && typeof x === "object" ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, rec(x[k])])) : x;
  return Buffer.from(JSON.stringify(rec(v)), "utf8");
};

for (const ed of ["2026-09"]) {
  const pub = read(`public/state/${ed}/numbers.json`);
  const signed = JSON.parse(read(`public/state/${ed}/numbers.signed.json`));
  const doc = JSON.parse(pub);

  test(`${ed}: the page reads the published bytes`, () => {
    assert.ok(pub.equals(read(`client/src/data/state/${ed}-numbers.json`)), "client copy must be byte-identical to public numbers.json");
  });

  test(`${ed}: numbers.signed.json pins numbers.json and verifies under the board key`, () => {
    const p = signed.payload;
    assert.equal(p.artifact.sha256, sha(pub));
    assert.equal(sha(canon(p)), signed.signature.payload_sha256);
    const key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: BOARD_X }, format: "jwk" });
    assert.ok(verify(null, canon(p), key, Buffer.from(signed.signature.sig_ed25519, "hex")), "signature must verify");
    const flipped = Buffer.from(signed.signature.sig_ed25519, "hex");
    flipped[0] ^= 1;
    assert.ok(!verify(null, canon(p), key, flipped), "control: a flipped signature bit must be rejected");
    assert.equal(p.n_numbers, Object.keys(doc.numbers).length);
    assert.equal(p.measurement_index_root, doc.measurement_index.index_root);
  });

  test(`${ed}: numbers.json.ots is an OpenTimestamps proof over numbers.json`, () => {
    const ots = read(`public/state/${ed}/numbers.json.ots`);
    assert.ok(ots.subarray(0, 31).equals(Buffer.from("004f70656e54696d657374616d7073000050726f6f6600bf89e2e884e89294", "hex")), "OTS magic");
    assert.ok(ots.includes(Buffer.from(sha(pub), "hex")), "the proof commits to sha256(numbers.json)");
  });

  test(`${ed}: every number the page cites exists, and every number names a known source`, () => {
    const page = read(`client/src/pages/StateReport${ed.replace("-", "")}.tsx`).toString();
    const ids = [...page.matchAll(/(?:<N id=|v\()"([a-z0-9_.]+)"/gi)].map((m) => m[1]);
    assert.ok(ids.length > 100, `expected the page to cite its numbers by id (found ${ids.length})`);
    for (const id of ids) assert.ok(doc.numbers[id], `page cites ${id}, absent from numbers.json`);
    for (const [id, n] of Object.entries(doc.numbers)) assert.ok(doc.sources[n.source], `${id} names unknown source ${n.source}`);
    // No figure is typed into the page by hand: a 3+ digit or comma-grouped number in prose would bypass the signed file.
    const prose = page.replace(/\/\*[\s\S]*?\*\//g, "").replace(/https?:\/\/\S+/g, "");
    const hand = [...prose.matchAll(/>[^<{]*\b(\d{1,3}(?:,\d{3})+|\d{4,})\b[^<{]*</g)]
      .map((m) => m[1])
      .filter((x) => !/^(19|20)\d\d$/.test(x) && !["8785", "6962", "3090", "8004", "16939677"].includes(x));
    assert.deepEqual(hand, [], "hand-typed figures in the page");
  });
}
