import { expect, it } from "vitest";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { defaultProfile } from "../packages/gspc-card-verifier/src/index.mjs";
import { preimageBytes } from "../packages/gspc-card-verifier/src/canonical.mjs";
import {
  EVIDENCE_STATES,
  admissionKeysFromEnvironment,
  admissionPreimage,
  classifyCardEvidence,
  isQuotableMatrixCell,
} from "./card-evidence-trust.mjs";

const CARD_KID = "did:web:issuer.example#card-1";
const ADJUDICATOR_KID = "did:web:adjudicator.example#measurement-1";
const cardKeys = generateKeyPairSync("ed25519");
const adjudicatorKeys = generateKeyPairSync("ed25519");

function rawPublicKeyHex(publicKey) {
  return Buffer.from(publicKey.export({ format: "jwk" }).x, "base64url").toString("hex");
}

const cardPublicKey = rawPublicKeyHex(cardKeys.publicKey);
const adjudicatorPublicKey = rawPublicKeyHex(adjudicatorKeys.publicKey);
const allowedAdmissionKeys = { [ADJUDICATOR_KID]: adjudicatorPublicKey };

function profileForTests() {
  const profile = defaultProfile();
  return {
    ...profile,
    pinnedKeyId: CARD_KID,
    pinnedPubkeyHex: cardPublicKey,
    pinnedKeys: { ...profile.pinnedKeys, [CARD_KID]: cardPublicKey },
  };
}

function effectiveProfile(profile, rule) {
  const perRule = profile.ruleProfiles?.[rule] ?? {};
  return {
    ...profile,
    ...perRule,
    numbers: { ...(profile.numbers ?? {}), ...(perRule.numbers ?? {}) },
  };
}

function makeCard(bodyOverrides = {}) {
  const profile = profileForTests();
  const preimageRule = "sha256(canonical body)";
  const body = {
    kind: "gspc.measurement-card",
    model: "fixture/model",
    axis: "fixture-axis",
    status: "MEASURED",
    n: 30,
    accuracy: 0.75,
    ...bodyOverrides,
  };
  const preimage = Buffer.from(preimageBytes(body, effectiveProfile(profile, preimageRule)));
  return {
    card: {
      alg: "Ed25519",
      body,
      did: CARD_KID,
      id: createHash("sha256").update(preimage).digest("hex"),
      preimage_rule: preimageRule,
      signature: sign(null, preimage, cardKeys.privateKey).toString("hex"),
    },
    profile,
  };
}

function addAdmission(card, overrides = {}, signer = adjudicatorKeys.privateKey) {
  const admission = {
    schema: "csoai.measurement-admission/0.1",
    body_sha256: card.id,
    evidence_bundle_sha256: "1".repeat(64),
    reproduction_receipt_sha256: "2".repeat(64),
    method_sha256: "3".repeat(64),
    reviewer: "fixture-reviewer",
    admitted_at: "2026-09-04T12:00:00Z",
    adjudicator: { kid: ADJUDICATOR_KID, alg: "Ed25519", signature: "" },
    ...overrides,
  };
  admission.adjudicator = {
    kid: ADJUDICATOR_KID,
    alg: "Ed25519",
    signature: "",
    ...(overrides.adjudicator ?? {}),
  };
  admission.adjudicator.signature = sign(
    null,
    Buffer.from(admissionPreimage(admission)),
    signer,
  ).toString("hex");
  return { ...card, admission };
}

it("a real published legacy card is cryptographically verified but never admitted or quotable", async () => {
  const directory = join(import.meta.dirname, "..", "public", "signed", "cards");
  const file = readdirSync(directory).filter((name) => name.endsWith(".json")).sort()[0];
  const card = JSON.parse(readFileSync(join(directory, file), "utf8"));
  const result = await classifyCardEvidence(card);

  expect(result.state).toBe(EVIDENCE_STATES.LEGACY_UNADJUDICATED);
  expect(result.signatureVerified).toBe(true);
  expect(result.admitted).toBe(false);
  expect(result.quotable).toBe(false);
  expect(result.cardVerification.state).toBe("VALID");
  expect(result.admissionVerification.code).toBe("LEGACY_NO_ADMISSION");
});

it("a non-empty forged signature is UNVERIFIED, not signed-by-presence", async () => {
  const { card, profile } = makeCard();
  card.signature = `${card.signature[0] === "0" ? "1" : "0"}${card.signature.slice(1)}`;
  const result = await classifyCardEvidence(card, { profile, allowedAdmissionKeys });

  expect(result.state).toBe(EVIDENCE_STATES.UNVERIFIED);
  expect(result.signatureVerified).toBe(false);
  expect(result.quotable).toBe(false);
  expect(result.cardVerification.code).toBe("SIGNATURE_MISMATCH");
});

it("a separately admitted MEASURED body passes both pinned Ed25519 checks", async () => {
  const { card, profile } = makeCard();
  const admitted = addAdmission(card);
  const result = await classifyCardEvidence(admitted, { profile, allowedAdmissionKeys });

  expect(result.state).toBe(EVIDENCE_STATES.ADMITTED_VERIFIED);
  expect(result.signatureVerified).toBe(true);
  expect(result.admitted).toBe(true);
  expect(result.quotable).toBe(true);
  expect(result.cardVerification.state).toBe("VALID");
  expect(result.admissionVerification.state).toBe("VALID");
});

it("a valid-looking admission without an independently configured pin fails closed", async () => {
  const { card, profile } = makeCard();
  const result = await classifyCardEvidence(addAdmission(card), {
    profile,
    allowedAdmissionKeys: {},
  });

  expect(result.state).toBe(EVIDENCE_STATES.UNVERIFIED);
  expect(result.signatureVerified).toBe(true);
  expect(result.admitted).toBe(false);
  expect(result.quotable).toBe(false);
  expect(result.admissionVerification.code).toBe("NO_PINNED_ADJUDICATOR_KEY");
});

it("admission cannot be replayed over a different canonical body", async () => {
  const first = makeCard();
  const second = makeCard({ accuracy: 0.5 });
  const admitted = addAdmission(second.card, { body_sha256: first.card.id });
  const result = await classifyCardEvidence(admitted, {
    profile: second.profile,
    allowedAdmissionKeys,
  });

  expect(result.state).toBe(EVIDENCE_STATES.UNVERIFIED);
  expect(result.admissionVerification.code).toBe("ADMISSION_BODY_MISMATCH");
});

it("admission metadata cannot be changed after the adjudicator signs it", async () => {
  const { card, profile } = makeCard();
  const admitted = addAdmission(card);
  admitted.admission.reviewer = "changed-after-signing";
  const result = await classifyCardEvidence(admitted, { profile, allowedAdmissionKeys });

  expect(result.state).toBe(EVIDENCE_STATES.UNVERIFIED);
  expect(result.admissionVerification.code).toBe("ADMISSION_SIGNATURE_MISMATCH");
  expect(result.quotable).toBe(false);
});

it("the adjudicator may not reuse the card signer key", async () => {
  const { card, profile } = makeCard();
  const admitted = addAdmission(card, {}, cardKeys.privateKey);
  const result = await classifyCardEvidence(admitted, {
    profile,
    allowedAdmissionKeys: { [ADJUDICATOR_KID]: cardPublicKey },
  });

  expect(result.state).toBe(EVIDENCE_STATES.UNVERIFIED);
  expect(result.admissionVerification.code).toBe("ADJUDICATOR_REUSES_CARD_SIGNER");
});

it("a generally pinned DID key is not automatically authorised to sign measurements", async () => {
  const { card, profile } = makeCard();
  const siteReleaseKid = "did:web:csoai.org#site-release-fixture";
  card.did = siteReleaseKid;
  profile.pinnedKeys[siteReleaseKid] = cardPublicKey;
  const result = await classifyCardEvidence(addAdmission(card), { profile, allowedAdmissionKeys });

  expect(result.state).toBe(EVIDENCE_STATES.UNVERIFIED);
  expect(result.signatureVerified).toBe(true);
  expect(result.cardVerification.state).toBe("VALID");
  expect(result.signerAuthorization.code).toBe("CARD_SIGNER_NOT_ALLOWED_FOR_MEASUREMENT");
});

it("even a valid admission cannot promote an UNMEASURED signed body", async () => {
  const { card, profile } = makeCard({ status: "UNMEASURED" });
  const result = await classifyCardEvidence(addAdmission(card), { profile, allowedAdmissionKeys });

  expect(result.state).toBe(EVIDENCE_STATES.UNVERIFIED);
  expect(result.admissionVerification.code).toBe("BODY_NOT_MEASURED");
  expect(result.quotable).toBe(false);
});

it("an admitted mill body without a valid sample count is not quotable", async () => {
  const { card, profile } = makeCard({ n: 0 });
  const result = await classifyCardEvidence(addAdmission(card), { profile, allowedAdmissionKeys });

  expect(result.state).toBe(EVIDENCE_STATES.UNVERIFIED);
  expect(result.admissionVerification.code).toBe("MALFORMED_MEASUREMENT_BODY");
  expect(result.quotable).toBe(false);
});

it("adjudicator environment pins are all-or-nothing and never card-declared", () => {
  expect(admissionKeysFromEnvironment({})).toEqual({});
  expect(
    admissionKeysFromEnvironment({
      MILL_ADJUDICATOR_KID: ADJUDICATOR_KID,
      MILL_ADJUDICATOR_PUBLIC_KEY_HEX: adjudicatorPublicKey.toUpperCase(),
    }),
  ).toEqual({ [ADJUDICATOR_KID]: adjudicatorPublicKey });
  expect(() => admissionKeysFromEnvironment({ MILL_ADJUDICATOR_KID: ADJUDICATOR_KID })).toThrow(
    /must be configured together/,
  );
});

it("the findings gate cannot be satisfied by a non-empty-signature compatibility flag", () => {
  expect(isQuotableMatrixCell({ signed: true, accuracy: 0.99 })).toBe(false);
  expect(
    isQuotableMatrixCell({
      evidence_state: EVIDENCE_STATES.LEGACY_UNADJUDICATED,
      signature_verified: true,
      admitted: false,
      quotable: false,
      signed: false,
      accuracy: null,
    }),
  ).toBe(false);
  expect(
    isQuotableMatrixCell({
      evidence_state: EVIDENCE_STATES.ADMITTED_VERIFIED,
      signature_verified: true,
      admitted: true,
      quotable: true,
      signed: true,
      accuracy: 0.75,
    }),
  ).toBe(true);
});
