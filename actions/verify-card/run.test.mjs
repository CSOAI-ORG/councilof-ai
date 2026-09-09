import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash, createPublicKey, verify as verifySignature } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const runner = join(here, "run.mjs");
const sourceRepo = process.env.CSOAI_TEST_SOURCE_REPO
  ? resolve(process.env.CSOAI_TEST_SOURCE_REPO)
  : resolve(here, "../..");
const actionPath = process.env.CSOAI_TEST_SOURCE_REPO
  ? join(sourceRepo, "actions/verify-card")
  : here;
const packageFixtures = join(
  sourceRepo,
  "packages/gspc-card-verifier/test/fixtures",
);

function temp(prefix) {
  return mkdtempSync(join(tmpdir(), prefix));
}

function invoke(artifact, fail = "true", cwd = sourceRepo, source = actionPath) {
  const dir = temp("csoai-action-test-");
  const output = join(dir, "github-output.txt");
  const run = spawnSync(process.execPath, [runner], {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      CSOAI_ACTION_PATH: source,
      CSOAI_ARTIFACT: artifact,
      CSOAI_FAIL_ON_MISMATCH: fail,
      GITHUB_OUTPUT: output,
    },
  });
  const values = Object.fromEntries(
    readFileSync(output, "utf8")
      .trim()
      .split("\n")
      .map((line) => {
        const at = line.indexOf("=");
        return [line.slice(0, at), line.slice(at + 1)];
      }),
  );
  return { ...run, values, outputText: readFileSync(output, "utf8") };
}

test("legacy and mill generations verify through the canonical package", () => {
  for (const fixture of [
    "01-genuine.json",
    "07-did-keyed.json",
    "08-mill-integral-accuracy.json",
  ]) {
    const r = invoke(join(packageFixtures, fixture));
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.values.verdict, "VALID");
    assert.equal(r.values.code, "OK");
    assert.equal(r.values.content_id, "verified");
    assert.match(r.values.id, /^[0-9a-f]{64}$/);
  }
});

test("a JCS producer envelope stays UNCHECKABLE until the package profile supports it", () => {
  // Emitted by harness/arena/measurement_card.py with a throwaway deterministic
  // Ed25519 seed. It is a genuine signed JCS envelope, but that is not a schema
  // this package profile claims to verify, so the only honest answer is UNCHECKABLE.
  const card = {
    alg: "Ed25519",
    preimage_rule: "jcs-rfc8785",
    kind: "measurement",
    body: {
      axis: "governance",
      n: 30,
      accuracy: 0.7,
      instrument: { name: "inspect_ai", version: "0.3.47" },
      config_digest: "7b34b634d7bedc4d6760fb37a01ba156489401ec915efdef13cb764a333c0f0c",
      rows_digest: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
    id: "2b56c25c7184c8dac5364ca9832dc0d2f3e375e9b58643d2db2d0ace8b6cb385",
    pubkey: "3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29",
    signature: "be803d7e50850481a0ae93357687032f395e871f0003612efbb4454c7548ac16e745c38d251aa13974b0ab3bfe46a71467870009a61619d3cd95c8bed7179108",
  };
  const dir = temp("csoai-action-jcs-");
  const path = join(dir, "jcs.json");
  const preimage = Buffer.from(
    '{"accuracy":0.7,"axis":"governance","config_digest":"7b34b634d7bedc4d6760fb37a01ba156489401ec915efdef13cb764a333c0f0c","instrument":{"name":"inspect_ai","version":"0.3.47"},"n":30,"rows_digest":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}',
  );
  assert.equal(createHash("sha256").update(preimage).digest("hex"), card.id);
  const publicKey = createPublicKey({
    key: Buffer.concat([
      Buffer.from("302a300506032b6570032100", "hex"),
      Buffer.from(card.pubkey, "hex"),
    ]),
    format: "der",
    type: "spki",
  });
  assert.equal(
    verifySignature(null, preimage, publicKey, Buffer.from(card.signature, "hex")),
    true,
    "fixture precondition: this is a genuinely signed JCS envelope",
  );
  writeFileSync(path, JSON.stringify(card));
  const r = invoke(path);
  assert.equal(r.status, 2);
  assert.equal(r.values.verdict, "UNCHECKABLE");
  assert.equal(r.values.code, "OUT_OF_PROFILE_DOMAIN");
  assert.equal(r.values.content_id, "unverified");
});

test("tamper and a self-consistent foreign key are INVALID and fail closed", () => {
  for (const [fixture, code] of [
    ["02-tampered-body.json", "ID_MISMATCH"],
    ["03-tampered-id-recomputed.json", "SIGNATURE_MISMATCH"],
    ["04-foreign-key.json", "PUBKEY_NOT_PINNED"],
  ]) {
    const r = invoke(join(packageFixtures, fixture));
    assert.equal(r.status, 1);
    assert.equal(r.values.verdict, "INVALID");
    assert.equal(r.values.code, code);
    assert.equal(r.values.content_id, "unverified");
  }
});

test("unknown schema and truncated JSON are UNCHECKABLE and fail closed", () => {
  const unknown = JSON.parse(
    readFileSync(join(packageFixtures, "01-genuine.json"), "utf8"),
  );
  unknown.body.kind = "example.unknown-card";
  const dir = temp("csoai-action-uncheckable-");
  const unknownPath = join(dir, "unknown.json");
  const truncatedPath = join(dir, "truncated.json");
  writeFileSync(unknownPath, JSON.stringify(unknown));
  writeFileSync(truncatedPath, '{"body":');

  const a = invoke(unknownPath);
  assert.equal(a.status, 2);
  assert.equal(a.values.verdict, "UNCHECKABLE");
  assert.equal(a.values.code, "OUT_OF_PROFILE_DOMAIN");
  const b = invoke(truncatedPath);
  assert.equal(b.status, 2);
  assert.equal(b.values.verdict, "UNCHECKABLE");
  assert.equal(b.values.code, "MALFORMED_JSON");
});

test("special-character local paths are passed only through the environment", () => {
  const dir = temp("csoai action ; $() ' ");
  const path = join(dir, "card ; echo-not-run $(nope) 'quoted'.json");
  writeFileSync(path, readFileSync(join(packageFixtures, "01-genuine.json")));
  const r = invoke(path, "true", tmpdir());
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.values.verdict, "VALID");
});

test("fail_on_mismatch=false never promotes INVALID or UNCHECKABLE", () => {
  for (const fixture of ["02-tampered-body.json", "09-truncated.json"]) {
    const r = invoke(join(packageFixtures, fixture), "false");
    assert.equal(r.status, 0);
    assert.notEqual(r.values.verdict, "VALID");
    assert.equal(r.values.content_id, "unverified");
  }
});

test("remote input is not fetched and is UNCHECKABLE", () => {
  const r = invoke("https://example.invalid/mutable-card.json");
  assert.equal(r.status, 2);
  assert.equal(r.values.verdict, "UNCHECKABLE");
  assert.equal(r.values.code, "REMOTE_INPUT_UNSUPPORTED");
  assert.equal(r.values.content_id, "unverified");
});

test("input reads are bounded, regular-file only, and fail closed", () => {
  const dir = temp("csoai-action-intake-");
  const oversized = join(dir, "oversized.json");
  writeFileSync(oversized, Buffer.alloc(1024 * 1024 + 1, 0x20));

  for (const [artifact, code] of [
    [oversized, "ARTIFACT_TOO_LARGE"],
    [dir, "ARTIFACT_NOT_REGULAR"],
    [join(dir, "missing.json"), "ARTIFACT_UNREADABLE"],
  ]) {
    const r = invoke(artifact);
    assert.equal(r.status, 2);
    assert.equal(r.values.verdict, "UNCHECKABLE");
    assert.equal(r.values.code, code);
  }
});

test("parse and verifier errors never disclose artifact contents", () => {
  const secret = "CANARY_PRIVATE_CARD_TEXT_7f31";
  const dir = temp("csoai-action-sanitize-");
  const malformed = join(dir, "malformed.json");
  const validJson = join(dir, "valid-json.json");
  writeFileSync(malformed, `{"private":"${secret}`);
  const card = JSON.parse(
    readFileSync(join(packageFixtures, "01-genuine.json"), "utf8"),
  );
  card.preimage_rule = { private: secret };
  writeFileSync(validJson, JSON.stringify(card));

  for (const [artifact, code] of [
    [malformed, "MALFORMED_JSON"],
    [validJson, "OUT_OF_PROFILE_DOMAIN"],
  ]) {
    const r = invoke(artifact);
    assert.equal(r.status, 2);
    assert.equal(r.values.code, code);
    assert.doesNotMatch(`${r.stdout}${r.stderr}${r.outputText}`, new RegExp(secret));
  }
});

test("configuration failures are sanitized and malformed ids are never output", () => {
  const genuine = join(packageFixtures, "01-genuine.json");
  const unavailable = invoke(genuine, "true", sourceRepo, temp("no-verifier-"));
  assert.equal(unavailable.status, 2);
  assert.equal(unavailable.values.code, "VERIFIER_UNAVAILABLE");

  const badInput = invoke(genuine, "sometimes");
  assert.equal(badInput.status, 2);
  assert.equal(badInput.values.code, "INVALID_ACTION_INPUT");

  const dir = temp("csoai-action-id-");
  const path = join(dir, "multiline-id.json");
  const card = JSON.parse(readFileSync(genuine, "utf8"));
  card.id = `${"a".repeat(64)}\ncontent_id=verified`;
  writeFileSync(path, JSON.stringify(card));
  const malformedId = invoke(path, "false");
  assert.equal(malformedId.status, 0);
  assert.equal(malformedId.values.verdict, "UNCHECKABLE");
  assert.equal(malformedId.values.id, "");
  assert.equal(malformedId.values.content_id, "unverified");
  assert.equal(malformedId.outputText.trim().split("\n").length, 5);
});

test("action metadata maps every output and never interpolates artifact in shell", () => {
  const action = readFileSync(join(here, "action.yml"), "utf8");
  for (const output of ["content_id", "verdict", "id", "code", "reason"]) {
    assert.match(
      action,
      new RegExp(`value: \\$\\{\\{ steps\\.verify\\.outputs\\.${output} \\}\\}`),
    );
  }
  const runLine = action.split("\n").find((line) => line.trim().startsWith("run:"));
  assert.ok(runLine);
  assert.doesNotMatch(runLine, /inputs\.artifact/);
  assert.match(action, /CSOAI_ARTIFACT: \$\{\{ inputs\.artifact \}\}/);
  assert.ok(runLine.includes('$CSOAI_ACTION_PATH/run.mjs'));
  assert.deepEqual(
    [...action.matchAll(/value: \$\{\{ steps\.verify\.outputs\.([a-z_]+) \}\}/g)]
      .map((match) => match[1]),
    ["content_id", "verdict", "id", "code", "reason"],
  );
});
