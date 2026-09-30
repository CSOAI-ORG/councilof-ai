// node --test scripts/pubbus/pubbus.node-test.mjs
// The publication bus, offline: a throwaway Ed25519 key, a fixture DID document and a fixture
// Hub. Nothing here touches the network or the real repository tree.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { generateKeyPairSync, sign as edSign, createHash } from "node:crypto";
import { run } from "./pubbus.mjs";
import { jsCanonical, numberTokens, foreignNumbers, otsStateOfBytes, visibleText, slugFor, parseJsonRaw, rawStringify } from "./lib.mjs";
import { renderVersionPage } from "./render.mjs";

const HF = "https://huggingface.co";
const sha = (b) => createHash("sha256").update(b).digest("hex");
const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const X = publicKey.export({ format: "jwk" }).x;
const DID = { id: "did:web:csoai.org", verificationMethod: [{ id: "did:web:csoai.org#board-attestation-1", publicKeyJwk: { kty: "OKP", crv: "Ed25519", x: X } }] };

const OTS_MAGIC = Buffer.from("004f70656e54696d657374616d7073000050726f6f6600bf89e2e884e89294", "hex");
const pendingProof = Buffer.concat([OTS_MAGIC, Buffer.from("01", "hex"), Buffer.alloc(32, 7), Buffer.from("83dfe30d2ef90c8e", "hex")]);
const bitcoinProof = Buffer.concat([OTS_MAGIC, Buffer.from("01", "hex"), Buffer.alloc(32, 7), Buffer.from("0588960d73d71901", "hex")]);

// A record written the way the Python producers write it: floats keep ".0".
function recordText({ n = 4144, extra = {} } = {}) {
  const body = {
    schema: "csoai.fixture-census/0.1",
    as_of: "2026-09-25T06:54:10Z",
    what_this_is: "A fixture census record.",
    probe: { limits: { budget_s: 3600.0, workers: 32 }, population_note: "counts are over what was attempted" },
    not_evidence_of: ["that any server is safe"],
    read_state_vocabulary: { PARTIAL: "not every planned endpoint was read" },
    ...extra,
  };
  // JSON.stringify drops the ".0"; restore it where Python would have written it.
  return JSON.stringify(body, null, 1).replace('"budget_s": 3600', '"budget_s": 3600.0').replace(/,\n/g, ",\n") + "\n";
}

function signedDoc(recText, { n = 4144, supersedes = null, tamper = false } = {}) {
  const payload = {
    schema: "csoai.signed-artifact/0.1",
    artifact: { path: "/interop/x/record.json", sha256: sha(Buffer.from(recText)), schema: "csoai.fixture-census/0.1", as_of: "2026-09-25T06:54:10Z" },
    signer: "did:web:csoai.org#board-attestation-1 via POST /api/board-sign",
    not_a_grade: "The signature proves these bytes were signed.",
    read_state: "PARTIAL",
    n_attempted: n,
    states: { RESPONDED: 2008, TIMEOUT: 62 },
    ...(supersedes ? { supersedes_sha256: supersedes } : {}),
  };
  const bytes = Buffer.from(jsCanonical(payload), "utf8");
  const sig = edSign(null, bytes, privateKey).toString("hex");
  const shown = tamper ? { ...payload, n_attempted: n + 1 } : payload;
  return JSON.stringify({
    schema: "csoai.signed-run/0.1",
    payload: shown,
    signature: { did: "did:web:csoai.org#board-attestation-1", alg: "Ed25519", sig_ed25519: sig, payload_sha256: sha(bytes), signed_at: "2026-09-25T08:05:36.586Z" },
  }, null, 2) + "\n";
}

/** A fixture Hub: {dataset: {rev, files: {path: Buffer|string}}}. Every other URL is 404. */
function hub(datasets, { didStatus = 200 } = {}) {
  return async (url) => {
    const ok = (b) => ({ status: 200, bytes: Buffer.isBuffer(b) ? b : Buffer.from(b) });
    if (url === "https://csoai.org/.well-known/did.json") return didStatus === 200 ? ok(JSON.stringify(DID)) : { status: didStatus, bytes: Buffer.alloc(0) };
    let m = /^https:\/\/huggingface\.co\/api\/datasets\/csoai\/([^/?]+)$/.exec(url);
    if (m && datasets[m[1]]) return ok(JSON.stringify({ sha: datasets[m[1]].rev }));
    m = /^https:\/\/huggingface\.co\/api\/datasets\/csoai\/([^/]+)\/tree\/([0-9a-f]{40})\?recursive=1$/.exec(url);
    if (m && datasets[m[1]]?.rev === m[2]) return ok(JSON.stringify(Object.keys(datasets[m[1]].files).map((p) => ({ path: p }))));
    m = /^https:\/\/huggingface\.co\/datasets\/csoai\/([^/]+)\/resolve\/([0-9a-f]{40})\/(.+)$/.exec(url);
    if (m && datasets[m[1]]?.rev === m[2] && datasets[m[1]].files[m[3]] !== undefined) return ok(datasets[m[1]].files[m[3]]);
    return { status: 404, bytes: Buffer.alloc(0) };
  };
}

const REV1 = "1".repeat(40);
const REV2 = "2".repeat(40);
function tmpRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pubbus-"));
}
const baseFiles = () => {
  const rec = recordText();
  return { "record.json": rec, "record.signed.json": signedDoc(rec), "record.json.ots": pendingProof };
};
const opts = (repo, fetcher) => ({ repo, fetcher, didDoc: undefined, datasets: ["fixture-census"], noLlms: true });

test("a verified record gets a page that shows only numbers the record already published", async () => {
  const repo = tmpRepo();
  const rep = await run(opts(repo, hub({ "fixture-census": { rev: REV1, files: baseFiles() } })));
  assert.deepEqual(rep.refused, []);
  assert.equal(rep.published.length, 1);
  const m = JSON.parse(fs.readFileSync(path.join(repo, "public/evidence/published-records.json"), "utf8"));
  const v = m.records[0].versions[0];
  assert.equal(m.records[0].slug, "fixture-census");
  assert.equal(v.state, "CURRENT");
  assert.equal(v.signature.state, "VERIFIED");
  assert.equal(v.ots.state, "PENDING_CALENDAR_COMMITMENT");
  const html = fs.readFileSync(path.join(repo, `public${v.page}index.html`), "utf8");
  const text = visibleText(html);
  for (const n of ["4144", "2008", "62", "3600.0", "32"]) assert.ok(numberTokens(text).has(n), `page lacks ${n}`);
  assert.ok(!numberTokens(text).has("3600"), "a Python float must not lose its .0 on the page");
  const files = baseFiles();
  assert.deepEqual(foreignNumbers(html, [files["record.json"], files["record.signed.json"], REV1]), []);
  assert.match(text, /curl -s -X POST https:\/\/councilof\.ai\/api\/verify/);
  assert.match(text, /never counted into it/);
  // The sitemap generator picks static index.html pages up by path; IndexNow list is written.
  const pending = fs.readFileSync(path.join(repo, "council-os/pubbus/indexnow-pending.txt"), "utf8");
  assert.match(pending, new RegExp(`https://councilof.ai${v.page}`));
});

test("idempotent: the same inputs a second time write nothing", async () => {
  const repo = tmpRepo();
  const f = hub({ "fixture-census": { rev: REV1, files: baseFiles() } });
  await run(opts(repo, f));
  const second = await run(opts(repo, f));
  assert.deepEqual(second.writes, []);
  assert.deepEqual(second.published, []);
  assert.equal(second.unchanged.length, 1);
  // Upstream moved to a new revision with the same bytes: still a no-op.
  const third = await run(opts(repo, hub({ "fixture-census": { rev: REV2, files: baseFiles() } })));
  assert.deepEqual(third.writes, []);
});

test("a bad signature is refused and nothing is published for it", async () => {
  const repo = tmpRepo();
  const rec = recordText();
  const files = { "record.json": rec, "record.signed.json": signedDoc(rec, { tamper: true }) };
  const rep = await run(opts(repo, hub({ "fixture-census": { rev: REV1, files } })));
  assert.equal(rep.published.length, 0);
  assert.equal(rep.refused[0].state, "REFUSED_SIGNATURE");
  assert.ok(!fs.existsSync(path.join(repo, "public/evidence/fixture-census")));
  const m = JSON.parse(fs.readFileSync(path.join(repo, "public/evidence/published-records.json"), "utf8"));
  assert.equal(m.records.length, 0);
  assert.equal(m.refused[0].state, "REFUSED_SIGNATURE", "a refusal is published, not hidden");
});

test("a signature from a key that is not in the DID document is refused", async () => {
  const repo = tmpRepo();
  const other = generateKeyPairSync("ed25519").privateKey;
  const rec = recordText();
  const doc = JSON.parse(signedDoc(rec));
  doc.signature.sig_ed25519 = edSign(null, Buffer.from(jsCanonical(doc.payload)), other).toString("hex");
  const rep = await run(opts(repo, hub({ "fixture-census": { rev: REV1, files: { "record.json": rec, "record.signed.json": JSON.stringify(doc) } } })));
  assert.equal(rep.refused[0].state, "REFUSED_SIGNATURE");
  assert.match(rep.refused[0].reason, /Ed25519 verification returned false/);
});

test("record bytes that differ from the signed sha256 are refused", async () => {
  const repo = tmpRepo();
  const rec = recordText();
  const files = { "record.json": rec.replace("fixture census", "altered census"), "record.signed.json": signedDoc(rec) };
  const rep = await run(opts(repo, hub({ "fixture-census": { rev: REV1, files } })));
  assert.equal(rep.refused[0].state, "REFUSED_BINDING");
});

test("a changed record is a new dated version; the old one is marked SUPERSEDED, never deleted", async () => {
  const repo = tmpRepo();
  const r1 = recordText();
  await run(opts(repo, hub({ "fixture-census": { rev: REV1, files: { "record.json": r1, "record.signed.json": signedDoc(r1) } } })));
  const r2 = recordText({ extra: { record_version: "0.1.1", supersedes: { sha256: sha(Buffer.from(r1)) } } });
  const files2 = {
    "record.json": r1, "record.signed.json": signedDoc(r1),
    "record.v0.1.1.json": r2, "record.v0.1.1.signed.json": signedDoc(r2, { supersedes: sha(Buffer.from(r1)) }),
  };
  const rep = await run(opts(repo, hub({ "fixture-census": { rev: REV2, files: files2 } })));
  assert.equal(rep.published.length, 1);
  const m = JSON.parse(fs.readFileSync(path.join(repo, "public/evidence/published-records.json"), "utf8"));
  const [old, cur] = m.records[0].versions;
  assert.equal(old.state, "SUPERSEDED");
  assert.equal(old.superseded_by, cur.version);
  assert.match(old.superseded_reason, /correction/);
  assert.equal(cur.state, "CURRENT");
  const oldHtml = fs.readFileSync(path.join(repo, `public${old.page}index.html`), "utf8");
  assert.match(oldHtml, /data-state="SUPERSEDED"/);
  assert.ok(fs.existsSync(path.join(repo, `public${cur.page}index.html`)));
  assert.deepEqual((await run(opts(repo, hub({ "fixture-census": { rev: REV2, files: files2 } })))).writes, []);
});

test("timestamp state is read from proof bytes, and an upgraded proof updates the same version in place", async () => {
  assert.equal(otsStateOfBytes(pendingProof), "PENDING_CALENDAR_COMMITMENT");
  assert.equal(otsStateOfBytes(bitcoinProof), "BITCOIN_ATTESTATION_IN_PROOF");
  assert.equal(otsStateOfBytes(Buffer.from("not a proof")), "NOT_AN_OTS_PROOF");
  const repo = tmpRepo();
  await run(opts(repo, hub({ "fixture-census": { rev: REV1, files: baseFiles() } })));
  const receipt = JSON.stringify({ proofs: [{ target_file: "record.json", upgraded: "ots-upgraded/2026-09-25/record.json.ots", bitcoin: [{ height: 968537, result: "MATCHES_HEADER", header_source: "https://blockstream.info/api" }] }] });
  const files = { ...baseFiles(), "ots-upgraded/2026-09-25/OTS-UPGRADE.json": receipt, "ots-upgraded/2026-09-25/record.json.ots": bitcoinProof };
  const rep = await run(opts(repo, hub({ "fixture-census": { rev: REV2, files } })));
  assert.deepEqual(rep.refused, []);
  assert.equal(rep.ots_updated.length, 1);
  const m = JSON.parse(fs.readFileSync(path.join(repo, "public/evidence/published-records.json"), "utf8"));
  const v = m.records[0].versions[0];
  assert.equal(m.records[0].versions.length, 1, "same bytes, same version");
  assert.equal(v.ots.state, "BITCOIN_ATTESTATION_IN_PROOF");
  assert.equal(v.revision, REV1, "record and signature links stay pinned to the first revision");
  const html = fs.readFileSync(path.join(repo, `public${v.page}index.html`), "utf8");
  assert.match(visibleText(html), /block height 968537/);
});

test("a dataset with no signed document is refused as UNSIGNED and that refusal is published", async () => {
  const repo = tmpRepo();
  const rep = await run(opts(repo, hub({ "fixture-census": { rev: REV1, files: { "CORRECTION.md": "x", "manifest.json": "{}" } } })));
  assert.equal(rep.published.length, 0);
  const m = JSON.parse(fs.readFileSync(path.join(repo, "public/evidence/published-records.json"), "utf8"));
  assert.equal(m.refused[0].state, "REFUSED_UNSIGNED");
});

test("an unreachable DID document publishes nothing at all", async () => {
  const repo = tmpRepo();
  const rep = await run(opts(repo, hub({ "fixture-census": { rev: REV1, files: baseFiles() } }, { didStatus: 503 })));
  assert.match(rep.fatal, /UNMEASURED/);
  assert.deepEqual(rep.writes, []);
});

test("the page template itself carries no digits: every number comes from the record", () => {
  const empty = {
    slug: "s", dataset: "d", title: "t", page: "/evidence/s/v/", as_of: "x", version: "v",
    record: {}, payload: { artifact: {} }, verify: { state: "VERIFIED", did: "did:web:x#k", payload_sha256: "ab", signed_at: "x", tamper_control: "rejected" },
    artifact_path: "record.json", signed_path: "record.signed.json", record_url: "https://x/record.json", signed_url: "https://x/s.json",
    record_sha256: "ab", signed_sha256: "cd", revision: "ef", state: "CURRENT",
    ots: { state: "NO_PROOF_PUBLISHED", receipt_bitcoin: [] },
  };
  assert.deepEqual(foreignNumbers(renderVersionPage(empty), []), []);
});

test("number tokens: identifiers are not numbers, published figures are", () => {
  const t = numberTokens("Ed25519 sha256 SHA-256 2026-09-25T06:54:10Z 4,144 7.82 fd5c8a7a65 99e0e2f0 csoai/a2a-card-census");
  assert.deepEqual([...t].sort(), ["2026", "4,144", "54", "7.82"].sort());
  assert.deepEqual(foreignNumbers("<p>13 records</p>", ["n: 4144"]), ["13"]);
  assert.equal(rawStringify(parseJsonRaw('{"a": 3600.0, "b": [1, 2.50]}')), '{"a": 3600.0, "b": [1, 2.50]}');
});

test("slugs: record files take the dataset name; dated artifacts drop the date", () => {
  assert.equal(slugFor("mcp-remote-census", "record.v0.1.1.json"), "mcp-remote-census");
  assert.equal(slugFor("cross-ledger-supply", "interop/cross-ledger-benji-2026-09-25.json"), "cross-ledger-benji");
});

test("listing updates: the first run sets a baseline; a NEW paid door becomes a pending 402index row, never a call", async () => {
  const repo = tmpRepo();
  const capsPath = path.join(repo, "council-os/capabilities.json");
  fs.mkdirSync(path.dirname(capsPath), { recursive: true });
  const cap = (id, payment) => ({ id, kind: "http", path: `/api/${id}`, method: "GET", name: id, description: id, lifecycle: "LIVE", payment });
  fs.writeFileSync(capsPath, JSON.stringify({ capabilities: [cap("a", "free")] }));
  const f = hub({ "fixture-census": { rev: REV1, files: baseFiles() } });
  await run(opts(repo, f));
  let l = JSON.parse(fs.readFileSync(path.join(repo, "council-os/pubbus/listing-updates.json"), "utf8"));
  assert.deepEqual(l.pending["402index"], []);
  fs.writeFileSync(capsPath, JSON.stringify({ capabilities: [cap("a", "free"), cap("b", "x402")] }));
  await run(opts(repo, f));
  l = JSON.parse(fs.readFileSync(path.join(repo, "council-os/pubbus/listing-updates.json"), "utf8"));
  assert.equal(l.pending["402index"].length, 1);
  assert.equal(l.pending["402index"][0].url, "https://councilof.ai/api/b");
  assert.equal(l.pending.harness_x.length, 1);
});
