// Disclosure-completeness sets: page data, published records and their board signatures stay one thing.
//   node --test scripts/measurements/disclosure-completeness.node-test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash, createPublicKey, verify } from "node:crypto";

const ROOT = new URL("../../", import.meta.url).pathname;
const read = (p) => readFileSync(ROOT + p);
// did:web:csoai.org#board-attestation-1 (https://csoai.org/.well-known/did.json)
const BOARD_X = "k2fPWb6ctyu8l5at8FYgHsHFit_qoT-DssW3VNbCAXA";
const KEY = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: BOARD_X }, format: "jwk" });
const sha = (b) => createHash("sha256").update(b).digest("hex");
const canon = (v) => {
  const rec = (x) =>
    Array.isArray(x) ? x.map(rec) : x && typeof x === "object" ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, rec(x[k])])) : x;
  return Buffer.from(JSON.stringify(rec(v)), "utf8");
};
const OTS_MAGIC = Buffer.from("004f70656e54696d657374616d7073000050726f6f6600bf89e2e884e89294", "hex");
const ROUTE = "/measurements/disclosure-completeness";
const DATA = "client/src/data/measurements/disclosure-completeness/";

const SETS = JSON.parse(read(DATA + "sets.json")).sets;
const published = readdirSync(ROOT + "public/interop").filter((d) => /^disclosure-completeness-\d{4}-\d{2}-\d{2}$/.test(d)).sort();

test("sets.json lists exactly the published dated sets, oldest first", () => {
  assert.deepEqual(SETS.map((s) => s.set), published);
  for (const s of SETS) assert.equal(s.set, `disclosure-completeness-${s.date}`);
});

test("the page reads the newest set, byte for byte", () => {
  const newest = published[published.length - 1];
  assert.equal(sha(read(DATA + "latest.set.json")), sha(read(`public/interop/${newest}/set.json`)));
});

for (const dir of published) {
  const st = JSON.parse(read(`public/interop/${dir}/set.json`));
  test(`${dir}: method code pinned, and every record signed by the board key over its own bytes`, () => {
    assert.equal(sha(read(`public/interop/${dir}/method/adapters.py`)), st.method_code_sha256);
    assert.ok(existsSync(ROOT + `public/interop/${dir}/verify.py`));
    assert.equal(st.records.length, 4);
    for (const r of st.records) {
      const raw = read(`public/interop/${dir}/${r.path}`);
      assert.equal(sha(raw), r.sha256, `${r.record_id}: set.json pins the record bytes`);
      const signed = JSON.parse(read(`public/interop/${dir}/${r.signed}`));
      const p = signed.payload;
      assert.equal(p.artifact.sha256, sha(raw));
      assert.equal(p.artifact.path, `/interop/${dir}/${r.path}`);
      assert.equal(p.record_id, r.record_id);
      assert.equal(sha(canon(p)), signed.signature.payload_sha256);
      assert.ok(verify(null, canon(p), KEY, Buffer.from(signed.signature.sig_ed25519, "hex")), `${r.record_id}: signature verifies`);
      // controls: one flipped bit in the signature, and one byte appended to the record, are both rejected
      const bad = Buffer.from(signed.signature.sig_ed25519, "hex"); bad[0] ^= 1;
      assert.equal(verify(null, canon(p), KEY, bad), false);
      assert.notEqual(sha(Buffer.concat([raw, Buffer.from("\n")])), p.artifact.sha256);
      const ots = read(`public/interop/${dir}/${r.path}.ots`);
      assert.ok(ots.subarray(0, OTS_MAGIC.length).equals(OTS_MAGIC), "an OpenTimestamps proof");
      const rec = JSON.parse(raw);
      assert.equal(rec.recompute.code_sha256, st.method_code_sha256);
      assert.ok(!/\b(rank(ed|ing)?|winner|best model)\b/i.test(rec.answer), "the answer ranks nothing");
    }
  });
}

test("the page is wired: route, library, prerender, head, and linked from the benchmark index", () => {
  assert.ok(read("client/src/App.tsx").toString().includes(`<Route path="${ROUTE}" component={DisclosureCompleteness} />`));
  assert.ok(read("client/src/data/library-ia.ts").toString().includes(`"${ROUTE}",`));
  assert.ok(read("scripts/prerender.mjs").toString().includes(`"${ROUTE}",`));
  assert.ok(ROUTE in JSON.parse(read("client/src/data/seo-head.json")).routes || read("client/src/data/seo-head.json").toString().includes(`"${ROUTE}"`));
  assert.ok(read("client/src/pages/BenchmarkIndex.tsx").toString().includes(`href="${ROUTE}"`));
  const page = read("client/src/pages/DisclosureCompleteness.tsx").toString();
  assert.ok(page.includes('from "@/data/measurements/disclosure-completeness/latest.set.json"'), "figures come from the set, not typed");
  assert.ok(!/\bleader\b/i.test(page.replace(/\/\*[\s\S]*?\*\//g, "")), "the page names no leader");
});
