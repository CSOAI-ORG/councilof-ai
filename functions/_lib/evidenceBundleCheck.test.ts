import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { checkEvidenceBundle, BUNDLE_CHECK_LIMITS, type BundleCheckInput } from "./evidenceBundleCheck";
import { canonicalBytes, sha256Hex, signPayload, cardV0 } from "./cardSign";
import { verifyCardV0, WHOLE_CARD_COVERS, CARD_ENVELOPE_KEYS } from "./cardV0Verify";

const encode = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));
const DID = "did:web:fixture.invalid#temporary-test-key";
const AS_OF = "2026-10-28T12:00:00Z";
const NOW = "2026-10-29T12:00:00Z";
const RESOURCE = "https://councilof.ai/api/evidence-bundle?obligation=article-50&bundle=1&subject=fixture";
const keys = (async () => {
  const pair = await webcrypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const pub = new Uint8Array(await webcrypto.subtle.exportKey("raw", pair.publicKey));
  const privateKey = Buffer.from(await webcrypto.subtle.exportKey("pkcs8", pair.privateKey)).toString("base64");
  return { pair, privateKey, anchors: [{ id: DID, hex: Array.from(pub, b => b.toString(16).padStart(2, "0")).join("") }] };
})();
async function signed(payload: Record<string, unknown>, surface = "art50.marking-evidence", whole = false): Promise<any> {
  const key = await keys;
  const leaf = { ...await signPayload(payload, key.privateKey), did: DID };
  const card = cardV0({ surface, subject: "fixture card", as_of: AS_OF, source_urls: ["https://fixture.invalid"], payload, leaf });
  if (!whole) return card;
  card.schema = "https://councilof.ai/schema/card-v1.json";
  card.digest_covers = WHOLE_CARD_COVERS;
  const { sha256: _digest, sig_ed25519: _sig, ...body } = card;
  card.sha256 = await sha256Hex(canonicalBytes(body));
  const envelope = Object.fromEntries(CARD_ENVELOPE_KEYS.map(k => [k, card[k]]));
  card.sig_ed25519 = Buffer.from(await webcrypto.subtle.sign("Ed25519", key.pair.privateKey, canonicalBytes(envelope))).toString("hex");
  return card;
}
async function fixture(count = 2, whole = false, supplied?: any[]) {
  const cards = supplied ?? await Promise.all(Array.from({ length: count }, (_, n) => signed({ n, result: "fixture observation" }, "art50.marking-evidence", whole)));
  cards.sort((a, b) => a.sha256.localeCompare(b.sha256));
  const ids = cards.map(c => c.sha256);
  const payload = { status: ids.length ? "ASSEMBLED" : "ASSEMBLED-EMPTY", obligation: "article-50", subject: "fixture", card_count: ids.length, card_sha256: ids.slice(0, 30).map(id => id.slice(0, 16)), relation: "relevant-to", determination: "NONE", settle: { transaction: "fixture-transaction" } };
  const bundle: any = {
    schema: "csoai.evidence-bundle/0.1", kind: "bundle", obligation: { id: "article-50" }, subject: "fixture",
    cards: Object.fromEntries(cards.map(c => [c.sha256, { card: c, proof: [] }])),
    manifest_card: await signed(payload, "evidence.bundle"),
    oscal: { "assessment-results": { results: [{ findings: [], observations: ids.map(id => ({ props: [{ name: "sha256", value: id }] })) }] } },
  };
  const input: BundleCheckInput = { responseBytes: encode(bundle), originalCards: Object.fromEntries(cards.map(c => [c.sha256, JSON.stringify({ card: c, proof: [] }, null, 2)])), expected: { obligation: "article-50", subject: "fixture", cardIds: ids, resourceUrl: RESOURCE } };
  const refresh = () => { input.responseBytes = encode(bundle); };
  return { input, cards, bundle, refresh };
}
async function inspect(input: BundleCheckInput, sourcePins = false) {
  const old = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = (() => { requests++; throw Error("Network is forbidden in this offline test"); }) as typeof fetch;
  try {
    const result = await checkEvidenceBundle(input, sourcePins ? {} : { anchors: (await keys).anchors });
    assert.equal(requests, 0);
    assert.equal(result.network_calls, 0);
    assert.equal(result.customer_acceptance, "NOT_RECORDED");
    assert.equal(result.measurement_freshness, "NOT_ESTABLISHED");
    assert.equal(result.applicability, "NOT_ESTABLISHED");
    assert.equal(result.payment_verified, false);
    assert.equal(result.root_inclusion_verified, false);
    assert.equal("state" in result, false);
    return result;
  } finally { globalThis.fetch = old; }
}

describe("offline evidence bundle checks using the existing signer and verifier", () => {
  it("checks a signed retained bundle without asserting customer acceptance", async () => {
    const f = await fixture();
    f.input.expectedResponseSha256 = await sha256Hex(f.input.responseBytes);
    const r = await inspect(f.input);
    assert.equal(r.input.state, "MATCH");
    assert.equal(r.response.retained_pin.state, "MATCH");
    assert.equal(r.inventory.state, "MATCH");
    assert.equal(r.scope.authenticated_by_manifest, true);
    assert.equal(r.scope.outer_metadata_authenticated, false);
    assert.equal(r.manifest.binding.state, "MATCH");
    assert.equal(r.manifest.signature.state, "VALID");
    assert.ok(r.cards.every(c => c.content.state === "MATCH" && c.signature.state === "VALID"));
    assert.ok(r.cards.every(c => !c.outer_metadata_authenticated && c.timestamp.age_policy === "NOT_CHECKED"));
    assert.equal(r.delivery_record.comparison.state, "NOT_CHECKED");
  });
  it("never trusts a test key through production pins", async () => {
    const r = await inspect((await fixture()).input, true);
    assert.equal(r.trust_anchors, "SOURCE_PINNED");
    assert.equal(r.manifest.signature.state, "UNCHECKABLE");
    assert.equal(r.scope.authenticated_by_manifest, false);
    assert.ok(r.cards.every(c => c.signature.reasons.includes("key_not_pinned")));
  });
  it("keeps absent original bytes unknown instead of reconstructing them", async () => {
    const f = await fixture(); delete f.input.originalCards[f.cards[0].sha256];
    const r = await inspect(f.input), card = r.cards.find(c => c.id === f.cards[0].sha256)!;
    assert.equal(card.content.state, "UNCHECKABLE"); assert.equal(card.signature.state, "UNCHECKABLE");
    assert.equal(card.original_sha256, null); assert.equal(r.cards[1].signature.state, "VALID");
  });
  it("detects response reformatting against an exact retained byte pin", async () => {
    const f = await fixture(); f.input.expectedResponseSha256 = await sha256Hex(f.input.responseBytes);
    f.input.responseBytes = new TextEncoder().encode(JSON.stringify(f.bundle, null, 2));
    assert.equal((await inspect(f.input)).response.retained_pin.state, "MISMATCH");
  });
  it("detects delivered-card edits even when the original signature remains valid", async () => {
    const f = await fixture(); f.bundle.cards[f.cards[0].sha256].card = { ...f.cards[0], subject: "altered outer field" }; f.refresh();
    const r = await inspect(f.input);
    assert.equal(r.cards[0].content.state, "MISMATCH"); assert.equal(r.cards[0].signature.state, "VALID");
  });
  it("does not authenticate delivered whole-card metadata when only the saved original verifies", async () => {
    const f = await fixture(1, true);
    f.bundle.cards[f.cards[0].sha256].card = { ...f.cards[0], as_of: NOW, subject: "changed delivered subject" }; f.refresh();
    const r = await inspect(f.input);
    assert.equal(r.cards[0].signature.state, "VALID"); assert.equal(r.cards[0].content.state, "MISMATCH");
    assert.equal(r.cards[0].outer_metadata_authenticated, false); assert.equal(r.cards[0].timestamp.authenticated, false);
  });
  it("snapshots caller scope, pins, original text and policy before asynchronous hashing", async () => {
    const f = await fixture(), anchors = (await keys).anchors.map(a => ({ ...a }));
    f.input.timestampPolicy = { now: NOW, maxAgeSeconds: 86_400 };
    f.input.expectedResponseSha256 = await sha256Hex(f.input.responseBytes);
    f.input.deliveryRecord = { schema: "csoai.x402.delivery-record/0.1", signed: false, resource: RESOURCE, transaction: "fixture-transaction", response_sha256: f.input.expectedResponseSha256, response_bytes: f.input.responseBytes.length };
    const pending = checkEvidenceBundle(f.input, { anchors });
    f.input.expected.subject = "mutated"; f.input.expected.obligation = "other"; f.input.expected.resourceUrl = "https://other.invalid";
    f.input.expected.cardIds.length = 0; f.input.originalCards[f.cards[0].sha256] = "{}";
    f.input.timestampPolicy.maxAgeSeconds = 0; f.input.timestampPolicy.now = "2099-01-01T00:00:00Z";
    f.input.expectedResponseSha256 = "0".repeat(64); (f.input.deliveryRecord as any).transaction = "mutated";
    anchors[0].hex = "0".repeat(64); f.input.responseBytes.fill(0);
    const r = await pending;
    assert.equal(r.scope.comparison.state, "MATCH"); assert.equal(r.scope.authenticated_by_manifest, true);
    assert.equal(r.response.retained_pin.state, "MATCH"); assert.equal(r.delivery_record.comparison.state, "MATCH");
    assert.equal(r.cards.length, 2); assert.ok(r.cards.every(c => c.content.state === "MATCH" && c.signature.state === "VALID" && c.timestamp.age_policy === "WITHIN_WINDOW"));
    assert.equal(r.customer_acceptance, "NOT_RECORDED");
  });
  it("rejects tampered signed content in both retained and delivered cards", async () => {
    const f = await fixture(); f.cards[0].payload.n = 99; f.input.originalCards[f.cards[0].sha256] = JSON.stringify(f.cards[0]); f.refresh();
    assert.equal((await inspect(f.input)).cards[0].signature.state, "INVALID");
  });
  it("does not treat a malformed or absent signature as verified", async () => {
    for (const sig of [null, "not-a-signature", 7]) {
      const f = await fixture(); f.cards[0].sig_ed25519 = sig; f.input.originalCards[f.cards[0].sha256] = JSON.stringify(f.cards[0]); f.refresh();
      assert.equal((await inspect(f.input)).cards[0].signature.state, "UNCHECKABLE");
    }
  });
  it("reports a cryptographically incorrect signature as INVALID", async () => {
    const f = await fixture(); f.cards[0].sig_ed25519 = "0".repeat(128); f.input.originalCards[f.cards[0].sha256] = JSON.stringify(f.cards[0]); f.refresh();
    assert.equal((await inspect(f.input)).cards[0].signature.state, "INVALID");
  });
  for (const field of ["obligation", "subject"] as const) {
    it("compares caller " + field + " independently of response claims", async () => {
      const f = await fixture(); f.input.expected[field] = "different"; delete f.input.expected.resourceUrl;
      const r = await inspect(f.input);
      assert.equal(r.scope.comparison.state, "MISMATCH"); assert.equal(r.scope.authenticated_by_manifest, false);
    });
  }
  it("detects a signed manifest scope that disagrees with its outer response", async () => {
    const f = await fixture(); f.bundle.manifest_card = await signed({ ...f.bundle.manifest_card.payload, subject: "other" }, "evidence.bundle"); f.refresh();
    const r = await inspect(f.input);
    assert.equal(r.manifest.signature.state, "VALID"); assert.equal(r.scope.comparison.state, "MISMATCH");
  });
  for (const mutate of [
    (f: any) => { delete f.bundle.cards[f.cards[0].sha256]; },
    (f: any) => { f.bundle.cards["0".repeat(64)] = f.bundle.cards[f.cards[0].sha256]; },
  ]) it("detects missing or additional full delivered IDs", async () => {
    const f = await fixture(); mutate(f); f.refresh();
    assert.equal((await inspect(f.input)).inventory.state, "MISMATCH");
  });
  for (const field of ["card_count", "status", "card_sha256"] as const) {
    it("detects signed manifest " + field + " inconsistencies", async () => {
      const f = await fixture();
      const changed = field === "card_count" ? 99 : field === "status" ? "ASSEMBLED-EMPTY" : ["0".repeat(16)];
      f.bundle.manifest_card = await signed({ ...f.bundle.manifest_card.payload, [field]: changed }, "evidence.bundle"); f.refresh();
      const r = await inspect(f.input);
      assert.equal(r.manifest.signature.state, "VALID"); assert.equal(r.manifest.binding.state, "MISMATCH");
    });
  }
  it("checks OSCAL full-ID inventory independently of card inventory", async () => {
    const f = await fixture(); f.bundle.oscal["assessment-results"].results[0].observations[0].props[0].value = f.cards[1].sha256; f.refresh();
    assert.equal((await inspect(f.input)).manifest.binding.state, "MISMATCH");
  });
  it("does not accept findings or a signed determination in an observation-only bundle", async () => {
    for (const mode of ["relation", "determination", "findings"]) {
      const f = await fixture();
      if (mode === "findings") f.bundle.oscal["assessment-results"].results[0].findings = [{ satisfied: true }];
      else f.bundle.manifest_card = await signed({ ...f.bundle.manifest_card.payload, [mode]: "compliant" }, "evidence.bundle");
      f.refresh();
      assert.equal((await inspect(f.input)).manifest.binding.state, "MISMATCH");
    }
  });
  it("never upgrades an unsigned manifest into authenticated scope", async () => {
    const f = await fixture(); f.bundle.manifest_card.sig_ed25519 = null; f.refresh();
    const r = await inspect(f.input);
    assert.equal(r.scope.comparison.state, "MATCH"); assert.equal(r.scope.authenticated_by_manifest, false);
    assert.equal(r.manifest.signature.state, "UNCHECKABLE");
  });
  it("checks a caller-selected empty bundle without inferring acceptance", async () => {
    const r = await inspect((await fixture(0)).input);
    assert.equal(r.manifest.binding.state, "MATCH"); assert.equal(r.cards.length, 0);
  });
  it("states the truncated manifest limit even when 31 full IDs match", async () => {
    const r = await inspect((await fixture(31)).input);
    assert.equal(r.inventory.state, "MATCH"); assert.equal(r.manifest.binding.state, "MATCH");
    assert.match(r.manifest.identifier_coverage, /FIRST_30_PREFIXES_ONLY/);
  });
  it("checks declared age only when the caller supplies a policy", async () => {
    const f = await fixture(); f.input.timestampPolicy = { now: NOW, maxAgeSeconds: 86_400 };
    const r = await inspect(f.input);
    assert.ok(r.cards.every(c => c.timestamp.age_policy === "WITHIN_WINDOW" && !c.timestamp.authenticated));
    assert.equal(r.manifest.timestamp.authenticated, false);
    f.input.timestampPolicy.maxAgeSeconds--;
    assert.ok((await inspect(f.input)).cards.every(c => c.timestamp.age_policy === "STALE"));
  });
  it("a valid whole-card timestamp is still not measurement freshness", async () => {
    const f = await fixture(1, true); f.input.timestampPolicy = { now: NOW, maxAgeSeconds: 86_400 };
    const r = await inspect(f.input);
    assert.equal(r.cards[0].signature.state, "VALID"); assert.equal(r.cards[0].timestamp.authenticated, true);
    assert.equal(r.cards[0].timestamp.age_policy, "WITHIN_WINDOW");
  });
  it("refuses a raw unsafe-integer alias instead of authenticating altered delivered content", async () => {
    const original = await signed({ n: 9_007_199_254_740_992 }, "art50.marking-evidence", true);
    const f = await fixture(1, true, [original]);
    const retained = f.input.originalCards[original.sha256];
    assert.equal((await verifyCardV0(original, retained, (await keys).anchors)).state, "VALID");
    const wire = new TextDecoder().decode(f.input.responseBytes);
    assert.ok(wire.includes("9007199254740992"));
    f.input.responseBytes = new TextEncoder().encode(wire.replace("9007199254740992", "9007199254740993"));
    assert.equal(f.input.originalCards[original.sha256], retained);
    const r = await inspect(f.input);
    assert.equal(r.input.state, "UNCHECKABLE"); assert.equal(r.scope.authenticated_by_manifest, false);
    assert.equal(r.cards.length, 0); assert.match(r.input.reason, /unsafe integer/);
  });
  it("keeps the safe-integer boundary supported with the existing verifier", async () => {
    const card = await signed({ n: Number.MAX_SAFE_INTEGER }, "art50.marking-evidence", true);
    const r = await inspect((await fixture(1, true, [card])).input);
    assert.equal(r.cards[0].content.state, "MATCH"); assert.equal(r.cards[0].signature.state, "VALID");
    assert.equal(r.cards[0].outer_metadata_authenticated, true);
  });
  for (const [date, state] of [["2026-11-01T00:00:00Z", "FUTURE"], ["2026-02-30T00:00:00Z", "UNCHECKABLE"], ["not-a-date", "UNCHECKABLE"]]) {
    it("labels the retained timestamp " + date + " without authenticating payload-only metadata", async () => {
      const f = await fixture(); f.cards[0].as_of = date; f.input.originalCards[f.cards[0].sha256] = JSON.stringify(f.cards[0]); f.refresh();
      f.input.timestampPolicy = { now: NOW, maxAgeSeconds: 86_400 };
      const r = await inspect(f.input);
      assert.equal(r.cards[0].signature.state, "VALID"); assert.equal(r.cards[0].timestamp.authenticated, false);
      assert.equal(r.cards[0].timestamp.age_policy, state);
    });
  }
  it("matches an unsigned delivery row without authenticating it", async () => {
    const f = await fixture();
    f.input.deliveryRecord = { schema: "csoai.x402.delivery-record/0.1", signed: false, resource: RESOURCE, transaction: "fixture-transaction", response_sha256: await sha256Hex(f.input.responseBytes), response_bytes: f.input.responseBytes.length };
    const r = await inspect(f.input);
    assert.equal(r.delivery_record.comparison.state, "MATCH"); assert.equal(r.delivery_record.authenticated, false);
    (f.input.deliveryRecord as any).transaction = "other";
    assert.equal((await inspect(f.input)).delivery_record.comparison.state, "MISMATCH");
  });
  it("does not infer full-query binding from a queryless resource", async () => {
    const f = await fixture();
    f.input.deliveryRecord = { schema: "csoai.x402.delivery-record/0.1", signed: false, resource: RESOURCE.split("?")[0], transaction: "fixture-transaction", response_sha256: await sha256Hex(f.input.responseBytes), response_bytes: f.input.responseBytes.length };
    assert.equal((await inspect(f.input)).delivery_record.comparison.state, "MISMATCH");
    delete f.input.expected.resourceUrl;
    assert.equal((await inspect(f.input)).delivery_record.comparison.state, "UNCHECKABLE");
  });
  for (const mutate of [
    (f: any) => { f.input.responseBytes = new Uint8Array(BUNDLE_CHECK_LIMITS.responseBytes + 1); },
    (f: any) => { f.input.responseBytes = new Uint8Array([0xff]); },
    (f: any) => { f.input.responseBytes = new TextEncoder().encode("{"); },
    (f: any) => { f.input.expected.cardIds = [f.cards[0].sha256, f.cards[0].sha256]; },
    (f: any) => { f.input.expected.cardIds = ["short-id"]; },
    (f: any) => { f.input.originalCards[f.cards[0].sha256] = "x".repeat(BUNDLE_CHECK_LIMITS.cardBytes + 1); },
    (f: any) => { f.input.timestampPolicy = { now: NOW, maxAgeSeconds: -1 }; },
    (f: any) => { f.input.responseBytes = new TextEncoder().encode('{"schema":1,"schema":2}'); },
    (f: any) => { f.input.responseBytes = new TextEncoder().encode("[".repeat(41) + "0" + "]".repeat(41)); },
  ]) it("refuses malformed or unbounded inputs without producing verification success", async () => {
    const f = await fixture(); mutate(f);
    const r = await inspect(f.input);
    assert.equal(r.input.state, "UNCHECKABLE"); assert.equal(r.scope.authenticated_by_manifest, false);
  });
  it("keeps malformed original JSON unknown while inspecting remaining cards", async () => {
    const f = await fixture(); f.input.originalCards[f.cards[0].sha256] = '{"payload":{},"payload":{},"sha256":"x"}';
    const r = await inspect(f.input);
    assert.equal(r.cards[0].content.state, "UNCHECKABLE"); assert.equal(r.cards[1].signature.state, "VALID");
  });
  it("rejects a bounded unterminated escaped-quote string before scanning tokens", async () => {
    const f = await fixture();
    f.input.responseBytes = new TextEncoder().encode('"' + String.fromCharCode(92, 34).repeat(32_768));
    assert.equal(f.input.responseBytes.length, 65_537);
    const original = String.prototype.matchAll;
    let tokenScans = 0;
    String.prototype.matchAll = function (pattern: RegExp) {
      tokenScans++;
      return original.call(this, pattern);
    };
    try {
      assert.equal((await inspect(f.input)).input.state, "UNCHECKABLE");
      assert.equal(tokenScans, 0, "Malformed JSON must be rejected by the native parser first");
    } finally { String.prototype.matchAll = original; }
  });
});
