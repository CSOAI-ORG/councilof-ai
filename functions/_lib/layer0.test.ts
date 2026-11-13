import { describe, expect, it } from "vitest";
import {
  L0_KID_DEFAULT,
  anchor,
  decideGate,
  episodeHash,
  kid,
  l0Canon,
  l0CanonBytes,
  loadKey,
  makeEnvelope,
  verifyBytes,
} from "./layer0";
import { canonicalBytes } from "./cardSign";

const td = new TextDecoder();

describe("layer0 — the public gateway's rule, its canonical form, and its refusals", () => {
  it("the canonical form is the ONE canonical form the estate uses", () => {
    // layer0's canonical form and cardSign's canonicalBytes must agree for every JSON-safe
    // value, because a reader who can verify a card must be able to verify an envelope with
    // the same rule.
    const samples = [
      { a: 1, b: "x" },
      { z: 1, a: [1, 2, { y: null }] },
      { nested: { deep: { deeper: [true, false, 0.5, "ü"] } } },
      [],
      {},
      { 'key with "quotes"': "v", "key,with,commas": [1] },
    ];
    for (const s of samples) {
      expect(l0Canon(s)).toBe(td.decode(canonicalBytes(s)));
    }
  });

  it("the canonical form sorts keys at every depth", () => {
    expect(l0Canon({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it("a decision needs an identity", () => {
    const d = decideGate({ action: "evidence.collect" });
    expect(d.state).toBe("deny");
    expect(d.reason).toMatch(/no identity/);
  });

  it("the G-block floor is non-derogable", () => {
    const below = decideGate({ action: "x", identity: "did:csoai:a", g_score: 0.49 });
    const at = decideGate({ action: "x", identity: "did:csoai:a", g_score: 0.5 });
    expect(below.state).toBe("deny");
    expect(below.reason).toMatch(/G-Block/);
    expect(at.state).toBe("allow");
  });

  it("a statutory prohibition is denied and an Annex III domain escalates", () => {
    expect(decideGate({ action: "art5.social_scoring", identity: "did:csoai:a" }).state).toBe("deny");
    expect(decideGate({ action: "x", identity: "did:csoai:a", domain: "healthcare" }).state).toBe("escalate");
    expect(decideGate({ action: "evidence.collect", identity: "did:csoai:a" }).state).toBe("allow");
  });

  it("with no signing key the loader refuses and says why - it never generates one", async () => {
    const loaded = await loadKey({});
    expect(loaded.ok).toBe(false);
    expect(loaded.keys).toBeNull();
    expect(loaded.reason).toMatch(/LAYER0_SIGN_KEY_PKCS8_B64/);
  });

  it("an envelope signs and verifies, and a tampered envelope does not", async () => {
    // A throwaway key, generated here for the test only. It is never published and never reused.
    const kp = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
    const spki = await crypto.subtle.exportKey("spki", kp.publicKey);
    const pubB64 = btoa(String.fromCharCode(...new Uint8Array(spki)));

    const decision = decideGate({ action: "evidence.collect", identity: "did:csoai:a" });
    const env = await makeEnvelope({
      from: { endpoint: "tool://local", party: "did:csoai:a" },
      to: { endpoint: "csoai://ledger" },
      intent: "attestation",
      action: "evidence.collect",
      payload: { inputsHash: "sha256:abc" },
      decision,
      privateKey: kp.privateKey,
      signKid: L0_KID_DEFAULT,
      episodeAnchor: anchor({}),
      id: "00000000-0000-4000-8000-000000000000",
      now: "2026-10-29T00:00:00.000Z",
    });

    expect(env.sig.alg).toBe("Ed25519");
    expect(env.sig.kid).toBe(L0_KID_DEFAULT);
    expect(env.episode.hash).toMatch(/^sha256:[0-9a-f]{64}$/);

    const unsigned = { ...env };
    delete unsigned.sig;
    expect(await verifyBytes(l0CanonBytes(unsigned), env.sig.value, pubB64)).toBe(true);

    // The signature covers the envelope WITHOUT its sig field, so moving one byte breaks it.
    const tampered = { ...unsigned, payload: { inputsHash: "sha256:tampered" } };
    expect(await verifyBytes(l0CanonBytes(tampered), env.sig.value, pubB64)).toBe(false);
  });

  it("a PKCS8 secret loads, and the public half it publishes verifies its own signature", async () => {
    // The whole point of deriving the public key from the secret is that they cannot drift.
    const kp = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
    const pkcs8 = await crypto.subtle.exportKey("pkcs8", kp.privateKey);
    const pkcs8b64 = btoa(String.fromCharCode(...new Uint8Array(pkcs8)));

    const loaded = await loadKey({ LAYER0_SIGN_KEY_PKCS8_B64: pkcs8b64 });
    expect(loaded.ok).toBe(true);
    expect(loaded.keys).not.toBeNull();
    expect(loaded.keys!.publicKeyPem).toMatch(/^-----BEGIN PUBLIC KEY-----/);

    // The published public key must verify what the loaded private key signs.
    const decision = decideGate({ action: "evidence.collect", identity: "did:csoai:a" });
    const env = await makeEnvelope({
      from: { party: "did:csoai:a" },
      to: { endpoint: "csoai://ledger" },
      intent: "attestation",
      action: "evidence.collect",
      payload: { inputsHash: "sha256:abc" },
      decision,
      privateKey: loaded.keys!.privateKey,
      signKid: L0_KID_DEFAULT,
      episodeAnchor: anchor({}),
      id: "00000000-0000-4000-8000-000000000000",
      now: "2026-10-29T00:00:00.000Z",
    });
    const unsigned = { ...env };
    delete unsigned.sig;
    expect(await verifyBytes(l0CanonBytes(unsigned), env.sig.value, loaded.keys!.publicKeyB64)).toBe(true);
  });

  it("the episode hash separates different payloads and repeats the same one", async () => {
    const a = await episodeHash({ from: { a: 1 }, to: { b: 2 }, action: "x", payload: { h: "1" } });
    const b = await episodeHash({ from: { a: 1 }, to: { b: 2 }, action: "x", payload: { h: "2" } });
    const a2 = await episodeHash({ from: { a: 1 }, to: { b: 2 }, action: "x", payload: { h: "1" } });
    expect(a).not.toBe(b);
    expect(a).toBe(a2);
  });

  it("the kid and the anchor have defaults and can be set", () => {
    expect(kid({})).toBe(L0_KID_DEFAULT);
    expect(kid({ LAYER0_SIGN_KID: "did:x#k1" })).toBe("did:x#k1");
    expect(anchor({})).toBe("bitcoin:block/954857");
    expect(anchor({ SOV_ANCHOR: "bitcoin:block/1" })).toBe("bitcoin:block/1");
  });
});
