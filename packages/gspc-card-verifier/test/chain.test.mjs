/**
 * chain.test.mjs — a chain manifest is a claim, and this proves the tool can reject one.
 *
 * The interesting assertion in here is the last group. A manifest that lists withheld
 * positions is a genuine improvement on publishing a subset: a withheld card becomes a
 * counted tombstone instead of an absence indistinguishable from a card that never existed.
 * But the manifest is unsigned, so a withheld position is only anchored where a PUBLISHED
 * body's `prev` names it — and `prev` is inside the signed body. Everything else in a run of
 * consecutive withheld positions is an unsigned assertion. The tool must count those two
 * kinds separately, or "the chain is complete" would claim more than the evidence carries.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, generateKeyPairSync, sign as edSign } from "node:crypto";
import { readFileSync, readdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyseChain, verifyCard, verifyChainEnvelope } from "../src/verify.mjs";
import { defaultProfile } from "../src/index.mjs";
import { canonicalise } from "../src/canonical.mjs";
import { verifyCard as verifyBundledCard, defaultProfile as defaultBundledProfile } from "../../../public/verifier/gspc-verify.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..", "..");
const profile = defaultProfile();
const cli = join(here, "..", "bin", "gspc-verify.mjs");
const bundleCli = join(repo, "public", "verifier", "gspc-verify.mjs");
const runEntry = (entry, args) => {
  try {
    return { code: 0, out: execFileSync(process.execPath, [entry, ...args], { encoding: "utf8" }) };
  } catch (error) {
    return { code: error.status, out: (error.stdout || "") + (error.stderr || "") };
  }
};
const runCli = (args) => runEntry(cli, args);
const ID = (n) => String(n).padStart(64, "0");
const link = (n, prev, extra = {}) => ({
  id: ID(n), prev, alg: "Ed25519", pubkey: profile.pinnedPubkeyHex,
  sig: "s".repeat(128), body_published: true, ...extra,
});
const card = (n, prev) => ({ id: ID(n), pubkey: profile.pinnedPubkeyHex, signature: "s".repeat(128), body: { prev } });

// head=3 -> 2 -> 1 -> genesis
const goodLinks = [link(3, ID(2)), link(2, ID(1)), link(1, "GSPC-CARD-FACTORY-GENESIS")];
const manifest = (links, over = {}) => {
  const bodiesPublished = links.filter((item) => item.body_published === true).length;
  const bodiesWithheld = links.filter((item) => item.body_published === false).length;
  return {
    kind: "gspc.card-chain", head: links[0].id, genesis_prev: "GSPC-CARD-FACTORY-GENESIS",
    length: links.length, bodies_published: bodiesPublished, bodies_withheld: bodiesWithheld,
    links, ...over,
  };
};

const signedChainCliFixture = (mutateChain = () => {}) => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const pubkey = Buffer.from(publicKey.export({ format: "jwk" }).x, "base64url").toString("hex");
  const signingProfile = structuredClone(profile);
  signingProfile.pinnedPubkeyHex = pubkey;
  signingProfile.pinnedKeyId = "test-chain-key";
  signingProfile.pinnedKeys = {};
  signingProfile.numbers.intFields = [
    ...new Set([...signingProfile.numbers.intFields, "bodies_published", "bodies_withheld", "length"]),
  ];
  const rule = signingProfile.preimageRules[0];
  const signBody = (body) => {
    const preimage = Buffer.from(canonicalise(body, signingProfile), "utf8");
    return {
      alg: "Ed25519",
      preimage_rule: rule,
      pubkey,
      id: createHash("sha256").update(preimage).digest("hex"),
      signature: edSign(null, preimage, privateKey).toString("hex"),
      body,
    };
  };
  const genesis = "GSPC-CARD-FACTORY-GENESIS";
  const first = signBody({ kind: "gspc.measurement-card", prev: genesis });
  const second = signBody({ kind: "gspc.measurement-card", prev: first.id });
  const chainBody = {
    kind: "gspc.card-chain",
    head: second.id,
    genesis_prev: genesis,
    length: 2,
    bodies_published: 2,
    bodies_withheld: 0,
    links: [
      { id: second.id, prev: first.id, alg: "Ed25519", pubkey, sig: second.signature, body_published: true },
      { id: first.id, prev: genesis, alg: "Ed25519", pubkey, sig: first.signature, body_published: true },
    ],
  };
  mutateChain(chainBody, { first, second, genesis });
  const chainEnvelope = signBody(chainBody);
  const temp = mkdtempSync(join(tmpdir(), "gspc-signed-chain-"));
  const firstPath = join(temp, "first.json");
  const secondPath = join(temp, "second.json");
  const chainPath = join(temp, "chain.json");
  const profilePath = join(temp, "profile.json");
  writeFileSync(firstPath, JSON.stringify(first));
  writeFileSync(secondPath, JSON.stringify(second));
  writeFileSync(chainPath, JSON.stringify(chainEnvelope));
  writeFileSync(profilePath, JSON.stringify(signingProfile));
  return {
    args: [firstPath, secondPath, "--chain", chainPath, "--profile", profilePath, "--quiet"],
    chainEnvelope,
    signingProfile,
  };
};

test("a well-formed manifest walks from head to genesis", () => {
  const r = analyseChain([card(3, ID(2)), card(2, ID(1)), card(1, "GSPC-CARD-FACTORY-GENESIS")], manifest(goodLinks), profile);
  assert.equal(r.ok, true);
  assert.equal(r.walkLength, 3);
  assert.equal(r.reachesGenesis, true);
  assert.equal(r.bodiesHeld, 3);
  assert.equal(r.withheld.total, 0);
});

test("a walk that does not reach genesis is CHAIN_WALK_BROKEN", () => {
  const broken = [link(3, ID(2)), link(2, ID(9))];
  const r = analyseChain([], manifest(broken), profile);
  assert.equal(r.ok, false);
  assert.ok(r.findings.some((f) => f.code === "CHAIN_WALK_BROKEN"));
});

test("a cycle is CHAIN_WALK_BROKEN, not an infinite loop", () => {
  const cyc = [link(3, ID(2)), link(2, ID(3))];
  const r = analyseChain([], manifest(cyc), profile);
  assert.equal(r.ok, false);
  assert.match(r.findings.find((f) => f.code === "CHAIN_WALK_BROKEN").detail, /cycle/);
});

test("a link listed but unreachable from head is CHAIN_ORPHAN_LINK", () => {
  const r = analyseChain([], manifest([...goodLinks, link(7, ID(6))], { length: 4 }), profile);
  assert.equal(r.ok, false);
  assert.ok(r.findings.some((f) => f.code === "CHAIN_ORPHAN_LINK"));
});

test("a declared length that disagrees with the listing is reported", () => {
  const r = analyseChain([], manifest(goodLinks, { length: 99 }), profile);
  assert.equal(r.ok, false);
  assert.ok(r.findings.some((f) => f.code === "CHAIN_LENGTH_MISMATCH"));
});

test("a duplicate position makes the exported report not ok", () => {
  const links = [...goodLinks, structuredClone(goodLinks[0])];
  const r = analyseChain([], manifest(links), profile);
  assert.equal(r.ok, false);
  assert.ok(r.findings.some((finding) => finding.code === "CHAIN_DUPLICATE_POSITION"));
});

test("a signed manifest requires boolean publication states and reconciled counts", () => {
  const malformedLinks = structuredClone(goodLinks);
  delete malformedLinks[0].body_published;
  const r = analyseChain(
    [],
    manifest(malformedLinks, { bodies_published: 99, bodies_withheld: 77 }),
    profile,
    { manifestSigned: true },
  );
  const codes = new Set(r.findings.map((finding) => finding.code));
  assert.equal(r.ok, false);
  assert.ok(codes.has("CHAIN_PUBLISH_STATE_MALFORMED"));
  assert.ok(codes.has("CHAIN_PUBLISH_COUNT_MISMATCH"));
});

test("a signed manifest cannot omit its publication count schema", () => {
  const document = manifest(goodLinks);
  delete document.bodies_published;
  delete document.bodies_withheld;
  delete document.length;
  const r = analyseChain([], document, profile, { manifestSigned: true });
  const codes = r.findings.map((finding) => finding.code);
  assert.equal(r.ok, false);
  assert.ok(codes.includes("CHAIN_LENGTH_MALFORMED"));
  assert.equal(codes.filter((code) => code === "CHAIN_PUBLISH_COUNT_MALFORMED").length, 2);
});

test("a manifest signature that differs from the card file is reported", () => {
  const c = card(1, "GSPC-CARD-FACTORY-GENESIS");
  c.signature = "a".repeat(128);
  const r = analyseChain([c], manifest([link(1, "GSPC-CARD-FACTORY-GENESIS")]), profile);
  assert.ok(r.findings.some((f) => f.code === "CHAIN_SIG_DIFFERS"));
});

test("a manifest order that contradicts a held signed body's prev is reported", () => {
  const held = card(3, ID(1));
  const r = analyseChain([held], manifest(goodLinks), profile, { manifestSigned: true });
  const finding = r.findings.find((f) => f.code === "CHAIN_PREV_DIFFERS");
  assert.ok(finding);
  assert.match(finding.detail, /signed card body names/);
});

test("holding a card the manifest does not list is CARD_NOT_IN_CHAIN", () => {
  const r = analyseChain([card(8, ID(7))], manifest(goodLinks), profile);
  assert.ok(r.findings.some((f) => f.code === "CARD_NOT_IN_CHAIN"));
});

test("holding fewer bodies than declared is BODY_NOT_HELD, and does not accuse the publisher", () => {
  const r = analyseChain([card(1, "GSPC-CARD-FACTORY-GENESIS")], manifest(goodLinks), profile);
  const f = r.findings.find((x) => x.code === "BODY_NOT_HELD");
  assert.ok(f);
  assert.match(f.detail, /which is fine/);
});

// ---------------------------------------------------------------- the one that matters
test("withheld positions are split into attested and merely asserted", () => {
  //   head 5 -> 4(withheld) -> 3(withheld) -> 2 -> 1 -> genesis
  // Card 5's SIGNED body names 4, so position 4 is attested by a signature.
  // Nothing signed names 3: it exists only because an unsigned file says so.
  const links = [
    link(5, ID(4)),
    link(4, ID(3), { body_published: false, withheld_reason: "internal identifier in the signed body" }),
    link(3, ID(2), { body_published: false, withheld_reason: "internal identifier in the signed body" }),
    link(2, ID(1)),
    link(1, "GSPC-CARD-FACTORY-GENESIS"),
  ];
  const cards = [card(5, ID(4)), card(2, ID(1)), card(1, "GSPC-CARD-FACTORY-GENESIS")];
  const r = analyseChain(cards, manifest(links), profile);

  assert.equal(r.withheld.total, 2);
  assert.equal(r.withheld.attestedBySignedPrev, 1, "position 4 is named inside a signed body");
  assert.equal(r.withheld.assertedOnly, 1, "position 3 is named by nothing signed");
  assert.ok(r.findings.some((f) => f.code === "WITHHELD_UNATTESTED"));
  assert.ok(r.findings.some((f) => f.code === "WITHHELD_BODY"));
  assert.ok(r.findings.some((f) => f.code === "CHAIN_UNSIGNED"));
});

test("a manifest whose every withheld position is signed for raises no WITHHELD_UNATTESTED", () => {
  const links = [link(3, ID(2)), link(2, ID(1), { body_published: false }), link(1, "GSPC-CARD-FACTORY-GENESIS")];
  const cards = [card(3, ID(2)), card(1, "GSPC-CARD-FACTORY-GENESIS")];
  // Card 3's prev is 2 — wait: 3's prev is ID(2), and 2 is the withheld one. So it IS attested.
  const r = analyseChain(cards, manifest(links), profile);
  assert.equal(r.withheld.attestedBySignedPrev, 1);
  assert.equal(r.withheld.assertedOnly, 0);
  assert.ok(!r.findings.some((f) => f.code === "WITHHELD_UNATTESTED"));
  // WITHHELD_BODY still fires: a body you were not given cannot have its signature checked.
  assert.ok(r.findings.some((f) => f.code === "WITHHELD_BODY"));
});

test("a malformed manifest is rejected rather than half-read", () => {
  for (const junk of [null, {}, { links: "nope" }]) {
    const r = analyseChain([], junk, profile);
    assert.equal(r.ok, false);
    assert.ok(r.findings.some((f) => f.code === "CHAIN_MANIFEST_MALFORMED"));
  }
});

// ------------------------------------------------------- signed envelope regression
test("the published chain envelope verifies before its manifest is walked", async () => {
  const document = JSON.parse(readFileSync(join(repo, "public", "signed", "chain.json"), "utf8"));
  const envelope = await verifyChainEnvelope(document, profile);
  assert.equal(envelope.state, "VALID", `${envelope.code}: ${envelope.reason ?? ""}`);

  const cardsDir = join(repo, "public", "signed", "cards");
  const cards = readdirSync(cardsDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(cardsDir, name), "utf8")));
  const report = analyseChain(cards, envelope.manifest, profile, { manifestSigned: true });

  assert.equal(report.ok, true);
  assert.equal(report.manifestSigned, true);
  assert.equal(report.positions, envelope.manifest.links.length);
  assert.equal(report.bodiesHeld, report.positions);
  assert.equal(report.bodiesDeclaredWithheld, 22, "the signed flag is retained as a historical declaration");
  assert.equal(report.bodiesDeclaredWithheldNowHeld, 22, "all historically withheld bodies are available now");
  assert.equal(report.withheld.total, 0, "a stale signed flag must not hide a body the verifier actually holds");
  assert.ok(report.findings.some((finding) => finding.code === "CHAIN_SIGNED"));
  assert.ok(!report.findings.some((finding) => finding.code === "CHAIN_UNSIGNED"));
});

test("a card cannot name both an inline key and a DID authority", async () => {
  const document = JSON.parse(readFileSync(join(repo, "public", "signed", "chain.json"), "utf8"));
  document.did = "did:web:csoai.org#board-attestation-1";
  const result = await verifyCard(document, profile);
  assert.equal(result.state, "UNCHECKABLE");
  assert.equal(result.code, "MALFORMED_CARD");
  assert.match(result.reason, /two key authorities/);
});

test("a present but malformed key identity cannot masquerade as absent", async () => {
  const inline = JSON.parse(readFileSync(join(here, "fixtures", "01-genuine.json"), "utf8"));
  const did = JSON.parse(readFileSync(join(here, "fixtures", "07-did-keyed.json"), "utf8"));
  for (const value of [null, 123, ""]) {
    const inlineCandidate = { ...inline, did: value };
    const inlineResult = await verifyCard(inlineCandidate, profile);
    assert.equal(inlineResult.state, "UNCHECKABLE");
    assert.equal(inlineResult.code, "MALFORMED_CARD");

    const didCandidate = { ...did, pubkey: value };
    const didResult = await verifyCard(didCandidate, profile);
    assert.equal(didResult.state, "UNCHECKABLE");
    assert.equal(didResult.code, "MALFORMED_CARD");
  }
});

test("a chain envelope cannot borrow authority from another pinned role key", async () => {
  const fixture = signedChainCliFixture();
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const secondary = publicKey.export({ format: "jwk" });
  const secondaryHex = Buffer.from(secondary.x, "base64url").toString("hex");
  const did = "did:example:secondary-role";
  const broadened = structuredClone(fixture.signingProfile);
  broadened.pinnedKeys[did] = secondaryHex;
  const preimage = Buffer.from(canonicalise(fixture.chainEnvelope.body, fixture.signingProfile), "utf8");
  const alternateEnvelope = {
    alg: "Ed25519",
    preimage_rule: fixture.chainEnvelope.preimage_rule,
    did,
    id: createHash("sha256").update(preimage).digest("hex"),
    signature: edSign(null, preimage, privateKey).toString("hex"),
    body: fixture.chainEnvelope.body,
  };
  const result = await verifyChainEnvelope(alternateEnvelope, broadened);
  assert.equal(result.state, "INVALID");
  assert.equal(result.code, "CHAIN_KEY_NOT_PRIMARY");

  const malformedEnvelope = { ...fixture.chainEnvelope, pubkey: null, did };
  const malformed = await verifyChainEnvelope(malformedEnvelope, broadened);
  assert.equal(malformed.state, "UNCHECKABLE");
  assert.equal(malformed.code, "MALFORMED_CARD");
});

test("tampering with the signed chain body is INVALID before any walk", async () => {
  const document = JSON.parse(readFileSync(join(repo, "public", "signed", "chain.json"), "utf8"));
  document.body.length += 1;
  const envelope = await verifyChainEnvelope(document, profile);
  assert.equal(envelope.state, "INVALID");
  assert.equal(envelope.code, "ID_MISMATCH");
});

test("chain integer fields remain in-domain under a rule-specific number profile", async () => {
  const document = JSON.parse(readFileSync(join(repo, "public", "signed", "chain.json"), "utf8"));
  document.preimage_rule = "sha256(canonical body)";
  const envelope = await verifyChainEnvelope(document, profile);
  assert.equal(envelope.state, "INVALID", "the changed rule invalidates the id, but remains checkable");
  assert.equal(envelope.code, "ID_MISMATCH");
});

test("a chain envelope must explicitly declare Ed25519 and its preimage rule", async () => {
  const document = JSON.parse(readFileSync(join(repo, "public", "signed", "chain.json"), "utf8"));
  delete document.alg;
  delete document.preimage_rule;
  const missing = await verifyChainEnvelope(document, profile);
  assert.equal(missing.state, "UNCHECKABLE");
  assert.equal(missing.code, "MALFORMED_CARD");

  const unsupportedProfile = structuredClone(profile);
  unsupportedProfile.alg = "RSA";
  const unsupportedDocument = JSON.parse(readFileSync(join(repo, "public", "signed", "chain.json"), "utf8"));
  unsupportedDocument.alg = "RSA";
  const unsupported = await verifyChainEnvelope(unsupportedDocument, unsupportedProfile);
  assert.equal(unsupported.state, "UNCHECKABLE");
  assert.equal(unsupported.code, "MALFORMED_PROFILE");
});

test("malformed base and rule-specific number profiles are UNCHECKABLE, never throws", async () => {
  const document = JSON.parse(readFileSync(join(repo, "public", "signed", "chain.json"), "utf8"));
  const malformedBase = structuredClone(profile);
  malformedBase.numbers.intFields = {};
  const baseResult = await verifyChainEnvelope(document, malformedBase);
  assert.equal(baseResult.state, "UNCHECKABLE");
  assert.equal(baseResult.code, "MALFORMED_PROFILE");

  const malformedRule = structuredClone(profile);
  malformedRule.ruleProfiles["sha256(canonical body)"].numbers.intFields = {};
  const ruleResult = await verifyChainEnvelope(document, malformedRule);
  assert.equal(ruleResult.state, "UNCHECKABLE");
  assert.equal(ruleResult.code, "MALFORMED_PROFILE");

  for (const mutate of [
    (candidate) => { candidate.ensureAscii = "false"; },
    (candidate) => { candidate.ruleProfiles["sha256(canonical body)"].ensureAscii = "false"; },
    (candidate) => { candidate.pinnedKeys = "not-an-object"; },
    (candidate) => { candidate.pinnedKeyId = 7; },
  ]) {
    const malformed = structuredClone(profile);
    mutate(malformed);
    const result = await verifyChainEnvelope(document, malformed);
    assert.equal(result.state, "UNCHECKABLE");
    assert.equal(result.code, "MALFORMED_PROFILE");
  }
});

test("a profile cannot report one primary key while resolving its primary DID to another", async () => {
  const card = JSON.parse(readFileSync(join(here, "fixtures", "07-did-keyed.json"), "utf8"));
  for (const [name, verifier, makeProfile] of [
    ["source", verifyCard, defaultProfile],
    ["bundle", verifyBundledCard, defaultBundledProfile],
  ]) {
    const contradictory = makeProfile();
    contradictory.pinnedPubkeyHex = "0".repeat(64);
    const result = await verifier(card, contradictory);
    assert.equal(result.state, "UNCHECKABLE", name);
    assert.equal(result.code, "MALFORMED_PROFILE", name);
    assert.match(result.reason, /different key/, name);
  }
});

test("the CLI returns exit 2 for a malformed custom profile", () => {
  const malformed = structuredClone(profile);
  malformed.numbers.intFields = {};
  const temp = mkdtempSync(join(tmpdir(), "gspc-chain-profile-"));
  const profilePath = join(temp, "profile.json");
  writeFileSync(profilePath, JSON.stringify(malformed));
  const result = runCli([
    join(here, "fixtures", "01-genuine.json"),
    "--chain", join(repo, "public", "signed", "chain.json"),
    "--profile", profilePath,
    "--quiet",
  ]);
  assert.equal(result.code, 2);
  assert.match(result.out, /UNCHECKABLE 1/);
  assert.match(result.out, /chain envelope: UNCHECKABLE MALFORMED_PROFILE/);
});

test("the CLI rejects a non-object profile with exit 2 in every renderer and override path", () => {
  const temp = mkdtempSync(join(tmpdir(), "gspc-null-profile-"));
  const profilePath = join(temp, "profile.json");
  writeFileSync(profilePath, "null\n");
  const cardPath = join(here, "fixtures", "01-genuine.json");
  for (const extra of [[], ["--json"], ["--pubkey", "0".repeat(64)]]) {
    const result = runCli([cardPath, "--profile", profilePath, ...extra]);
    assert.equal(result.code, 2);
    assert.match(result.out, /profile must be a JSON object/);
    assert.doesNotMatch(result.out, /TypeError/);
  }
});

test("an explicitly supplied malformed index can never be ignored with exit 0", () => {
  const temp = mkdtempSync(join(tmpdir(), "gspc-malformed-index-"));
  const cardPath = join(here, "fixtures", "01-genuine.json");
  const duplicate = "0".repeat(64);
  const malformed = [
    null,
    false,
    "index",
    [],
    {},
    { kind: "card_index", cards: null },
    { kind: "card_index", cards: [null] },
    { kind: "card_index", cards: [{ card: "not-an-id" }] },
    { kind: "card_index", cards: [{ card: duplicate }, { card: duplicate }] },
    { kind: "card_index", cards: [], n_cards: "0" },
    { kind: "card_index", cards: [], head: null },
    { kind: "something-else", cards: [] },
  ];
  for (const [position, value] of malformed.entries()) {
    const indexPath = join(temp, `index-${position}.json`);
    writeFileSync(indexPath, JSON.stringify(value));
    for (const entry of [cli, bundleCli]) {
      const result = runEntry(entry, [cardPath, "--index", indexPath, "--quiet"]);
      assert.equal(result.code, 2, `${entry} accepted malformed index ${position}`);
      assert.match(result.out, /gspc-verify: .*index/i);
    }
  }
});

test("explicit raw and DID-document key pins cannot be shadowed by bundled DID mappings", () => {
  const didCard = join(here, "fixtures", "07-did-keyed.json");
  const { publicKey } = generateKeyPairSync("ed25519");
  const wrongJwk = publicKey.export({ format: "jwk" });
  const wrongHex = Buffer.from(wrongJwk.x, "base64url").toString("hex");
  const temp = mkdtempSync(join(tmpdir(), "gspc-pin-override-"));
  const didPath = join(temp, "did.json");
  writeFileSync(didPath, JSON.stringify({
    verificationMethod: [{
      id: "did:web:csoai.org#board-attestation-1",
      publicKeyJwk: wrongJwk,
    }],
  }));

  for (const entry of [cli, bundleCli]) {
    const raw = runEntry(entry, [didCard, "--pubkey", wrongHex, "--quiet"]);
    assert.equal(raw.code, 1, `${entry} must use the explicit raw key`);
    assert.match(raw.out, /VALID 0 · INVALID 1/);

    const did = runEntry(entry, [
      didCard,
      "--did-document", didPath,
      "--key-id", "#board-attestation-1",
      "--quiet",
    ]);
    assert.equal(did.code, 1, `${entry} must use the explicit DID document key`);
    assert.match(did.out, /VALID 0 · INVALID 1/);
  }
});

test("a legacy raw chain manifest is explicitly UNCHECKABLE as an envelope", async () => {
  const envelope = await verifyChainEnvelope(manifest(goodLinks), profile);
  assert.equal(envelope.state, "UNCHECKABLE");
  assert.equal(envelope.code, "CHAIN_ENVELOPE_UNSIGNED");
  assert.equal(envelope.manifest.links.length, goodLinks.length);
});

test("the CLI accepts the signed chain envelope it publishes and does not crash", () => {
  const out = execFileSync(process.execPath, [
    cli,
    join(repo, "public", "signed", "cards"),
    "--chain",
    join(repo, "public", "signed", "chain.json"),
    "--quiet",
  ], { encoding: "utf8" });
  assert.match(out, /chain envelope: VALID OK/);
  assert.match(out, /335\/335 bodies held/);
  assert.match(out, /22 declared withheld at signing, 22 now held/);
  assert.match(out, /0 still unavailable/);
});

test("the CLI preserves INVALID and UNCHECKABLE exit codes for chain envelopes", () => {
  const document = JSON.parse(readFileSync(join(repo, "public", "signed", "chain.json"), "utf8"));
  const temp = mkdtempSync(join(tmpdir(), "gspc-chain-envelope-"));
  const card = join(here, "fixtures", "01-genuine.json");

  const tampered = join(temp, "tampered.json");
  writeFileSync(tampered, JSON.stringify({ ...document, body: { ...document.body, length: document.body.length + 1 } }));
  const invalid = runCli([card, "--chain", tampered, "--quiet"]);
  assert.equal(invalid.code, 1);
  assert.match(invalid.out, /chain envelope: INVALID ID_MISMATCH/);
  assert.doesNotMatch(invalid.out, /manifest:/, "an invalid envelope body must not be walked");

  const unsigned = join(temp, "unsigned.json");
  writeFileSync(unsigned, JSON.stringify(document.body));
  const uncheckable = runCli([card, "--chain", unsigned, "--quiet"]);
  assert.equal(uncheckable.code, 2);
  assert.match(uncheckable.out, /chain envelope: UNCHECKABLE CHAIN_ENVELOPE_UNSIGNED/);
  assert.match(uncheckable.out, /manifest:/, "legacy raw manifests remain inspectable after being labelled unsigned");
});

test("the CLI exits 3 for a valid but incomplete local copy of a signed chain", () => {
  const document = JSON.parse(readFileSync(join(repo, "public", "signed", "chain.json"), "utf8"));
  const oneCard = join(repo, "public", "signed", "cards", `${document.body.head}.json`);
  const result = runCli([oneCard, "--chain", join(repo, "public", "signed", "chain.json"), "--quiet"]);
  assert.equal(result.code, 3);
  assert.match(result.out, /BODY_NOT_HELD/);
  assert.match(result.out, /chain envelope: VALID OK/);
});

test("the CLI exits 3 for a validly signed but internally contradictory manifest", () => {
  const fixture = signedChainCliFixture((chainBody) => {
    chainBody.bodies_published = 99;
    chainBody.bodies_withheld = 77;
    delete chainBody.links[1].body_published;
  });
  const result = runCli(fixture.args);
  assert.equal(result.code, 3);
  assert.match(result.out, /chain envelope: VALID OK/);
  assert.match(result.out, /CHAIN_PUBLISH_STATE_MALFORMED/);
  assert.match(result.out, /CHAIN_PUBLISH_COUNT_MISMATCH/);
});

test("a signed topology cannot use non-string prev and genesis fields", () => {
  const fixture = signedChainCliFixture((chainBody) => {
    chainBody.genesis_prev = true;
    chainBody.links[1].prev = true;
  });
  const result = runCli(fixture.args);
  assert.equal(result.code, 3);
  assert.match(result.out, /chain envelope: VALID OK/);
  assert.match(result.out, /CHAIN_TOPOLOGY_MALFORMED/);
  assert.match(result.out, /CHAIN_WALK_BROKEN/);
});

test("every signed manifest link requires complete Ed25519 metadata", () => {
  const variants = [
    (link) => { delete link.sig; },
    (link) => { link.sig = null; },
    (link) => { delete link.pubkey; },
    (link) => { link.pubkey = null; },
    (link) => { delete link.alg; },
    (link) => { link.alg = "RSA"; },
  ];
  for (const mutate of variants) {
    const fixture = signedChainCliFixture((chainBody) => mutate(chainBody.links[0]));
    const result = runCli(fixture.args);
    assert.equal(result.code, 3);
    assert.match(result.out, /chain envelope: VALID OK/);
    assert.match(result.out, /CHAIN_LINK_METADATA_MALFORMED/);
  }
});

test("every signed manifest link is bound to the primary card-attestation key", () => {
  const fixture = signedChainCliFixture((chainBody) => {
    chainBody.links[0].pubkey = "0".repeat(64);
  });
  const result = runCli(fixture.args);
  assert.equal(result.code, 3);
  assert.match(result.out, /CHAIN_LINK_KEY_NOT_PINNED/);
  assert.match(result.out, /CHAIN_KEY_DIFFERS/);
});

test("a primary DID-only held card agrees with a link carrying its resolved key", () => {
  const held = JSON.parse(readFileSync(join(here, "fixtures", "01-genuine.json"), "utf8"));
  delete held.pubkey;
  held.did = profile.pinnedKeyId;
  const resolved = profile.pinnedPubkeyHex;
  const chain = manifest([{
    id: held.id,
    prev: held.body.prev,
    alg: "Ed25519",
    pubkey: resolved,
    sig: held.signature,
    body_published: true,
  }], {
    head: held.id,
    genesis_prev: held.body.prev,
  });
  const report = analyseChain([held], chain, profile, { manifestSigned: true });
  assert.equal(report.ok, true);
  assert.ok(!report.findings.some((finding) => finding.code === "CHAIN_KEY_DIFFERS"));
});

test("a signed walk must end at its own declared genesis, not a profile fallback", () => {
  const fixture = signedChainCliFixture((chainBody) => {
    chainBody.genesis_prev = "OTHER-GENESIS";
  });
  const result = runCli(fixture.args);
  assert.equal(result.code, 3);
  assert.match(result.out, /chain envelope: VALID OK/);
  assert.match(result.out, /CHAIN_WALK_BROKEN/);
});
