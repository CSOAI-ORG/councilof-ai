// Measurement pages: each page, its published record and the record's board signature stay one thing.
//   node --test scripts/measurements/measurement-pages.node-test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash, createPublicKey, verify } from "node:crypto";
import { gunzipSync } from "node:zlib";

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
const KEY = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: BOARD_X }, format: "jwk" });
const OTS_MAGIC = Buffer.from("004f70656e54696d657374616d7073000050726f6f6600bf89e2e884e89294", "hex");

function checkSigned(recordPath, signedPath, otsPath, artifactPath) {
  const raw = read(recordPath);
  const signed = JSON.parse(read(signedPath));
  const p = signed.payload;
  assert.equal(p.artifact.sha256, sha(raw), "payload pins the record bytes");
  assert.equal(p.artifact.path, artifactPath);
  assert.equal(sha(canon(p)), signed.signature.payload_sha256);
  const sig = Buffer.from(signed.signature.sig_ed25519, "hex");
  assert.ok(verify(null, canon(p), KEY, sig), "signature verifies under #board-attestation-1");
  const flipped = Buffer.from(sig); flipped[0] ^= 1;
  assert.ok(!verify(null, canon(p), KEY, flipped), "control: a flipped signature bit is rejected");
  const alt = { ...p, artifact: { ...p.artifact, sha256: "0".repeat(64) } };
  assert.ok(!verify(null, canon(alt), KEY, sig), "control: an altered artifact hash is rejected");
  const ots = read(otsPath);
  assert.ok(ots.subarray(0, 31).equals(OTS_MAGIC), "OTS magic");
  assert.ok(ots.includes(Buffer.from(sha(raw), "hex")), "the OTS proof commits to sha256(record)");
  return JSON.parse(raw);
}

function noHandTypedFigures(pagePath) {
  const page = read(pagePath).toString();
  const prose = page.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "").replace(/https?:\/\/\S+/g, "");
  const hand = [...prose.matchAll(/>[^<{]*\b(\d{1,3}(?:,\d{3})+|\d{3,})\b[^<{]*</g)]
    .map((m) => m[1])
    .filter((x) => !/^(19|20)\d\d$/.test(x) && !["402", "8785", "16939677"].includes(x));
  assert.deepEqual(hand, [], "hand-typed figures in the page");
}

const CASES = [
  {
    name: "x402-activity",
    day: "2026-09-25",
    run() {
      const d = this.day;
      const base = `public/measurements/x402-activity/${d}/x402-activity-${d}`;
      test("x402-activity: the page reads the published record and context bytes", () => {
        assert.ok(read(`${base}.json`).equals(read("client/src/data/measurements/x402-activity/record.json")));
        assert.ok(read("public/measurements/x402-activity/context.json").equals(read("client/src/data/measurements/x402-activity/context.json")));
      });
      test("x402-activity: record and context are board-signed and timestamped", () => {
        checkSigned(`${base}.json`, `${base}.signed.json`, `${base}.json.ots`, `measurements/x402-activity/${d}/x402-activity-${d}.json`);
        checkSigned("public/measurements/x402-activity/context.json", "public/measurements/x402-activity/context.signed.json",
          "public/measurements/x402-activity/context.json.ots", "measurements/x402-activity/context.json");
      });
      test("x402-activity: the record agrees with its own rows and payees files", () => {
        const rec = JSON.parse(read(`${base}.json`));
        const gz = read(`public/measurements/x402-activity/${d}/${rec.rows_file.path}`);
        assert.equal(sha(gz), rec.rows_file.sha256);
        const rows = gunzipSync(gz).toString().split("\n").filter(Boolean).map((l) => JSON.parse(l));
        assert.equal(rows.length, rec.rows_file.rows);
        assert.equal(rows.length, rec.headline.settlements);
        for (const [c, a] of Object.entries(rec.by_class)) {
          const rs = rows.filter((r) => r.class === c);
          assert.equal(rs.length, a.settlements, `${c} settlements`);
          assert.equal(rs.reduce((s, r) => s + r.value, 0), a.usdc_atomic, `${c} usdc`);
          assert.equal(new Set(rs.map((r) => r.from)).size, a.distinct_payers, `${c} payers`);
        }
        const ext = rows.filter((r) => r.class === "EXTERNAL");
        assert.equal(new Set(ext.map((r) => r.from)).size, rec.headline.distinct_external_payers);
        assert.equal(rows.filter((r) => r.high_frequency_pair).length, rec.flags.high_frequency_pair.all.settlements);
        const pg = read(`public/measurements/x402-activity/${d}/${rec.population.payees_file.path}`);
        assert.equal(sha(pg), rec.population.payees_file.sha256);
        assert.equal(gunzipSync(pg).toString().split("\n").filter(Boolean).length, rec.population.listed_base_usdc_payees);
        assert.equal(rec.partial, false);
      });
      test("x402-activity: code named in the record is the committed producer", () => {
        const rec = JSON.parse(read(`${base}.json`));
        assert.equal(sha(read("scripts/measurements/x402-activity/flywheel_x402_activity.py")), rec.method.code.sha256);
      });
      test("x402-activity: no hand-typed figures in the page", () => noHandTypedFigures("client/src/pages/X402Activity.tsx"));
    },
  },
];

for (const c of CASES) c.run();
