/**
 * verify.test.mjs — the extension's verify path against the repo's OWN fixtures and
 * published bytes. Every negative case asserts its exact state; the verifier must be
 * shown failing, or it is indistinguishable from `return "VALID"`.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyOffline, prepare, collapse, parseInput, anchorForDid, STATES } from "../lib/gspcVerify.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "../../..");
const FX = path.join(REPO, "packages/gspc-card-verifier/test/fixtures");
const CARDS = path.join(REPO, "public/signed/cards");
const MILL = path.join(REPO, "public/interop/mill-cards-signed");
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const fx = (n) => readJson(path.join(FX, n));

describe("three states from the repo's verifier fixtures", () => {
  it("01-genuine -> VALID under card-attestation-1", async () => {
    const v = await verifyOffline(fx("01-genuine.json"));
    expect(v.state).toBe(STATES.VALID);
    expect(v.family).toBe("gspc.measurement-card");
    expect(v.pinnedBy).toBe("did:web:csoai.org#card-attestation-1");
    expect(v.axis).toBe("care-refusal-protect");
  });
  it("02-tampered-body -> INVALID (preimage mismatch), stated as such", async () => {
    const v = await verifyOffline(fx("02-tampered-body.json"));
    expect(v.state).toBe(STATES.INVALID);
    expect(v.reason).toMatch(/MISMATCH|hashes to/);
  });
  it("03-tampered-id-recomputed -> INVALID (signature), not fooled by a matching hash", async () => {
    const v = await verifyOffline(fx("03-tampered-id-recomputed.json"));
    expect(v.state).toBe(STATES.INVALID);
    expect(v.reason).toMatch(/signature/i);
  });
  it("04-foreign-key -> INVALID (untrusted signer): a self-consistent card under a stranger's key proves nothing", async () => {
    const v = await verifyOffline(fx("04-foreign-key.json"));
    expect(v.state).toBe(STATES.INVALID);
    expect(v.reason).toMatch(/NOT among the keys published/);
  });
  it("05-malformed / 06-not-a-card -> UNCHECKABLE, never INVALID", async () => {
    for (const n of ["05-malformed.json", "06-not-a-card.json"]) {
      const v = await verifyOffline(fx(n));
      expect(v.state, n).toBe(STATES.UNCHECKABLE);
    }
  });
  it("09-truncated (a string, not an object) -> UNCHECKABLE", async () => {
    let raw = readFileSync(path.join(FX, "09-truncated.json"), "utf8");
    const p = parseInput(raw);
    if (p.error) expect(p.error).toMatch(/Not valid JSON/);
    else expect((await verifyOffline(p.value)).state).toBe(STATES.UNCHECKABLE);
  });
  it("garbage text is UNCHECKABLE at parse time — nothing was checked", () => {
    expect(parseInput("not json").error).toMatch(/nothing was checked/);
  });
});

describe("published corpus", () => {
  const files = readdirSync(CARDS).filter((f) => f.endsWith(".json"));
  it("has a corpus", () => expect(files.length).toBeGreaterThan(100));
  it("every 9th published card verifies VALID (integral-accuracy cards included)", async () => {
    const sample = files.filter((_, i) => i % 9 === 0);
    let integral = 0;
    for (const f of sample) {
      const card = readJson(path.join(CARDS, f));
      if (Number.isInteger(card.body?.accuracy)) integral++;
      const v = await verifyOffline(card);
      expect(v.state, f).toBe(STATES.VALID);
    }
    expect(integral, "the 0.0-vs-0 rule must actually be exercised").toBeGreaterThan(0);
  });
});

describe("DID-anchored mill cards (no pubkey; `did` names board-attestation-1)", () => {
  const files = readdirSync(MILL).filter((f) => f.startsWith("signed-") && f.endsWith(".json"));
  it("resolves the DID from the pinned table, never the network", () => {
    expect(anchorForDid("did:web:csoai.org#board-attestation-1")?.hex).toBe("9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170");
    expect(anchorForDid("did:web:example.org#nope")).toBeNull();
  });
  it("every signed mill card in public/interop/mill-cards-signed/ is VALID under that pinned key", async () => {
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const v = await verifyOffline(readJson(path.join(MILL, f)));
      expect(v.state, f).toBe(STATES.VALID);
      expect(v.pinnedBy).toBe("did:web:csoai.org#board-attestation-1");
      expect(v.notes.join(" ")).toMatch(/PINNED in this verifier/);
    }
  });
  it("the signed body's own status is surfaced (bytes decide, not the index)", async () => {
    const v = await verifyOffline(readJson(path.join(MILL, files[0])));
    expect(typeof v.bodyStatus).toBe("string");
  });
  it("a mill card naming an unpinned DID is UNCHECKABLE, not INVALID", async () => {
    const c = { ...readJson(path.join(MILL, files[0])), did: "did:web:csoai.org#unknown-9" };
    const v = await verifyOffline(c);
    expect(v.state).toBe(STATES.UNCHECKABLE);
  });
  it("a tampered mill body is INVALID", async () => {
    const c = readJson(path.join(MILL, files[0]));
    c.body = { ...c.body, accuracy: 0.99 };
    expect((await verifyOffline(c)).state).toBe(STATES.INVALID);
  });
  it("non-ASCII in a DID-anchored body stops rather than guesses (ensure_ascii=False rule)", async () => {
    const c = readJson(path.join(MILL, files[0]));
    c.body = { ...c.body, brand: "Council of AI — é" };
    const v = await verifyOffline(c);
    expect(v.state).toBe(STATES.UNCHECKABLE);
    expect(v.reason).toMatch(/ensure_ascii=False/);
  });
});

describe("shapes that are not measurement cards", () => {
  it("a public-root card wrapper is unwrapped; its inner card-v0 is UNCHECKABLE here (family not implemented), never INVALID", async () => {
    const root = readJson(path.join(REPO, "public/root.json"));
    const leaf = root.card_sha256[0];
    const wrapper = readJson(path.join(REPO, "public/cards", `${leaf.slice(0, 16)}.json`));
    const v = await verifyOffline(wrapper);
    expect(v.state).toBe(STATES.UNCHECKABLE);
    expect(v.notes[0]).toMatch(/Unwrapped/);
  });
  it("an unsigned estate envelope is UNCHECKABLE (hash only, nothing to verify against)", async () => {
    const v = await verifyOffline({ content_id: "00".repeat(32), kind: "x" });
    expect(v.state).toBe(STATES.UNCHECKABLE);
    expect(v.reason).toMatch(/no signature/);
  });
  it("collapse() never turns an ed25519 gap into INVALID", () => {
    const c = collapse({ family: "gspc.measurement-card", valid: false, reasons: ["ed25519_unsupported"], checks: [{ code: "ed25519_unsupported", ok: null, label: "Signature", detail: "no Ed25519" }] });
    expect(c.state).toBe(STATES.UNCHECKABLE);
  });
  it("prepare() leaves an ordinary card untouched", () => {
    const card = fx("01-genuine.json");
    const p = prepare(card);
    expect(p.rec).toEqual(card);
    expect(p.notes).toEqual([]);
  });
});

describe("captions", () => {
  it("an untrusted signer is never captioned with the pinned key it failed to match", async () => {
    const v = await verifyOffline(JSON.parse(readFileSync(path.join(FX, "04-foreign-key.json"), "utf8")));
    expect(v.state).toBe(STATES.INVALID);
    expect(v.pinnedBy).toBeNull();
  });
});
