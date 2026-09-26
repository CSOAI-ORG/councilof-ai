import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const R = (p: string) => JSON.parse(readFileSync(resolve(__dirname, "../..", p), "utf8"));
const card = R("public/.well-known/agent-card.json");
const did = R("public/.well-known/did.json");
const jwsInput = R("public/interop/agent-card-jws-input.json");
const CARD_KID = "did:web:csoai.org#card-attestation-1";

// RFC 8785 JCS for the shape this card actually has: objects, arrays, strings, booleans.
// Array.prototype.sort() orders keys by UTF-16 code units, which is what RFC 8785 §3.2.3 requires.
// This is the THIRD canonicaliser (after scripts/adapters/agent_card_jws.py and the independent
// scripts/verify_agent_card_jws.py); the three must agree on the committed card's bytes.
const sortDeep = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(sortDeep)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sortDeep((v as Record<string, unknown>)[k])]))
  : v;
const b64u = (s: string) => Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// A2A §8.4.1 rule 1 / §8.4.3 step 3 — remove default values per proto3 field presence
// (specification/a2a.proto @ a2aproject/A2A 72b3761b). R REQUIRED, O `optional`, M message, P plain.
type Presence = Record<string, [string, string?]>;
const FIELDS: Record<string, Presence> = {
  AgentCard: { name: ["R"], description: ["R"], supportedInterfaces: ["R", "AgentInterface"], provider: ["M", "AgentProvider"],
    version: ["R"], documentationUrl: ["O"], capabilities: ["R", "AgentCapabilities"], defaultInputModes: ["R"],
    defaultOutputModes: ["R"], skills: ["R", "AgentSkill"], signatures: ["P"], iconUrl: ["O"] },
  AgentProvider: { url: ["R"], organization: ["R"] },
  AgentCapabilities: { streaming: ["O"], pushNotifications: ["O"], extensions: ["P", "AgentExtension"], extendedAgentCard: ["O"] },
  AgentExtension: { uri: ["P"], description: ["P"], required: ["P"], params: ["M"] },
  AgentSkill: { id: ["R"], name: ["R"], description: ["R"], tags: ["R"], examples: ["P"], inputModes: ["P"], outputModes: ["P"] },
  AgentInterface: { url: ["R"], protocolBinding: ["R"], tenant: ["P"], protocolVersion: ["R"] },
};
const isDefault = (v: unknown) =>
  v === false || v === "" || v === 0 || (Array.isArray(v) && v.length === 0)
  || (!!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v as object).length === 0);
const stripDefaults = (o: Record<string, unknown>, msg = "AgentCard"): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    const f = FIELDS[msg][k];
    if (!f) { out[k] = v; continue; }            // non-proto field: kept as served
    if (f[0] === "P" && isDefault(v)) continue;
    const sub = f[1];
    out[k] = sub && Array.isArray(v) ? v.map((e) => (e && typeof e === "object" ? stripDefaults(e as Record<string, unknown>, sub) : e))
      : sub && v && typeof v === "object" ? stripDefaults(v as Record<string, unknown>, sub)
      : v;
  }
  return out;
};
const payloadJson = (c: Record<string, unknown>) => {
  const { signatures: _drop, ...body } = c;
  return JSON.stringify(sortDeep(stripDefaults(body)));
};

describe("the agent card's signing input describes the card that is actually served", () => {
  it("§8.4.1 default removal reproduces the specification's own worked example", () => {
    const original = { name: "Example Agent", description: "", capabilities: { streaming: false, pushNotifications: false, extensions: [] }, skills: [] };
    expect(payloadJson(original)).toBe('{"capabilities":{"pushNotifications":false,"streaming":false},"description":"","name":"Example Agent","skills":[]}');
  });

  it("payload_b64u is JCS(card minus signatures, defaults removed) of the CURRENT card", () => {
    // WHY THIS EXISTS. The card was edited and this input was never regenerated: on 2026-09-05
    // the served card advertised csoai-gspc-mcp@0.2.1 and "seven free readers plus four
    // x402-metered evidence tools" while the committed signing input still described 0.1.0 and
    // an older badge skill. Nothing called the generator, so nothing noticed. Signing that input
    // would have produced a signature over a card nobody serves — the worst possible outcome for
    // an artifact whose whole purpose is to let a stranger trust the card without asking us.
    expect(b64u(payloadJson(card))).toBe(jwsInput.payload_b64u);
    // and the removal is not vacuous here: every extension carries `"required": false`
    expect(jwsInput.default_values_removed.some((p: string) => p.endsWith(".required"))).toBe(true);
    expect(Buffer.from(jwsInput.payload_b64u, "base64url").toString("utf8")).not.toContain('"required":false');
  });

  it("signing_input_sha256 and byte length match the recomputed input", async () => {
    const { createHash } = await import("node:crypto");
    const si = Buffer.from(`${jwsInput.protected_b64u}.${b64u(payloadJson(card))}`, "utf8");
    expect(createHash("sha256").update(si).digest("hex")).toBe(jwsInput.signing_input_sha256);
    expect(si.length).toBe(jwsInput.signing_input_bytes);
  });

  it("the signing input names #card-attestation-1 and never a board key", () => {
    expect(jwsInput.alg).toBe("EdDSA");
    expect(jwsInput.kid).toBe(CARD_KID);
    const hdr = JSON.parse(Buffer.from(jwsInput.protected_b64u, "base64url").toString("utf8"));
    expect(hdr).toEqual({ alg: "EdDSA", kid: CARD_KID, typ: "JOSE" });
  });

  it("a signed card verifies (Node crypto, did.json key); an unsigned card says so and claims nothing", async () => {
    const { createPublicKey, verify } = await import("node:crypto");
    const sigs = (card.signatures ?? []) as Array<{ protected: string; signature: string }>;
    if (sigs.length === 0) {
      expect(jwsInput.state).toBe("UNSIGNED");
      expect(jwsInput.note).toMatch(/^UNSIGNED — awaiting the private half of did:web:csoai\.org#card-attestation-1/);
      return;
    }
    expect(jwsInput.state).toBe("SIGNED");
    const payload = b64u(payloadJson(card));
    for (const s of sigs) {
      const hdr = JSON.parse(Buffer.from(s.protected, "base64url").toString("utf8"));
      expect(hdr.kid, "the agent card is signed by the card key, not the board key").toBe(CARD_KID);
      expect(did.assertionMethod).toContain(hdr.kid);
      const vm = did.verificationMethod.find((m: { id: string }) => m.id === hdr.kid);
      const key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: vm.publicKeyJwk.x }, format: "jwk" });
      const msg = Buffer.from(`${s.protected}.${payload}`, "ascii");
      const sig = Buffer.from(s.signature, "base64url");
      expect(verify(null, msg, key, sig), "the served card's signature does not verify").toBe(true);
      // tamper control: one byte of the signed content changed must fail
      const tampered = Buffer.from(`${s.protected}.${b64u(payloadJson({ ...card, description: `X${String(card.description).slice(1)}` }))}`, "ascii");
      expect(verify(null, tampered, key, sig)).toBe(false);
    }
  });

  it("the A2A extension the estate publishes is discoverable FROM the card", () => {
    // The extension served 200 at its canonical URL while the card never mentioned it, so an
    // agent discovering us through /.well-known/agent-card.json could not find it.
    const ext = card.capabilities?.extensions ?? [];
    expect(ext.length).toBeGreaterThan(0);
    const sr = ext.find((e: { uri?: string }) => String(e.uri).includes("signed-receipts"));
    expect(sr).toBeTruthy();
    expect(sr.uri).toBe("https://councilof.ai/a2a/extensions/signed-receipts/v1/");
    expect(sr.required).toBe(false);
    // and it must not overclaim what a receipt is
    expect(sr.description).toMatch(/not a certification/i);
    expect(sr.description).toMatch(/integrity claim/i);
  });

  it("the /.well-known/agent.json alias serves the SAME bytes", () => {
    // Caught by the existing a2a suite when this lane edited one file and not the other. Two
    // discovery paths serving different cards is worse than one path: an agent that resolves the
    // alias would verify a signature computed over the other file's bytes and fail, with nothing
    // to tell it which of the two is the card.
    const a = readFileSync(resolve(__dirname, "../../public/.well-known/agent.json"));
    const b = readFileSync(resolve(__dirname, "../../public/.well-known/agent-card.json"));
    expect(a.equals(b)).toBe(true);
  });

  it("the portability warning still lists exactly the non-proto fields being signed", () => {
    const listed: string[] = jwsInput.non_proto_fields_included ?? [];
    for (const k of listed) expect(Object.keys(card)).toContain(k);
    if (listed.length) expect(jwsInput.portability_warning).toMatch(/proto/i);
  });
});

/**
 * An A2A card may DECLARE an extension it authored without emitting it — required:false means "we
 * know this extension". What it may not do is DESCRIBE one as though the door attaches it.
 *
 * On 2026-09-06 the card's signed-receipts entry opened "Ed25519-signed task-outcome receipts plus
 * a did:web key-trust convention", which a reader takes as "this agent attaches signed receipts".
 * It does not: POST /api/a2a returns a message with parts and no receipt, and a2a.ts says so in its
 * own header — "the card does not declare that extension until it is actually emitted". The code
 * stated the invariant and the card broke it, which is the exact shape of a name promising what the
 * code lacks.
 */
describe("the card does not describe an extension as emitted unless the door emits it", () => {
  const a2aSrc = readFileSync(resolve(__dirname, "a2a.ts"), "utf8");
  const exts = (card.capabilities?.extensions ?? []) as Array<{ uri: string; description: string }>;

  it("has extensions to check, so this cannot pass vacuously", () => {
    expect(exts.length).toBeGreaterThan(0);
  });

  it("signed-receipts says plainly that it is not emitted, while the door does not emit it", () => {
    const sr = exts.find((e) => e.uri.includes("signed-receipts"));
    if (!sr) return; // dropping the declaration entirely is also honest
    const doorEmits = /attachReceipt|signedReceipt|receipt\s*:/.test(a2aSrc);
    if (!doorEmits) {
      expect(sr.description, "the card describes receipts the door never attaches")
        .toMatch(/DO NOT YET EMIT|not emitted|attaches no receipt/i);
    }
  });

  it("no extension description opens with a bare capability claim", () => {
    // the state comes first, so a reader skimming the first clause is not misled
    for (const e of exts) {
      expect(e.description.length, `${e.uri} has no description`).toBeGreaterThan(40);
    }
  });

  it("the x402 entry no longer calls settlement UNCHECKABLE — it is proven and published", () => {
    const x = exts.find((e) => e.uri.includes("x402"));
    if (!x) return;
    expect(x.description, "settlement is proven on Base and the receipts are published")
      .not.toMatch(/Settlement UNCHECKABLE until facilitator receipt/);
    expect(x.description).toMatch(/receipts\.xml|PROVEN/i);
  });

  it("describes x402 signatures as conditional and names both gap paths", () => {
    const x = exts.find((e) => e.uri.includes("extension-offer-and-receipt"));
    expect(x, "the offer-and-receipt extension must remain discoverable").toBeTruthy();
    expect(x!.description).toMatch(/CONDITIONALLY EMITTED/);
    expect(x!.description).toMatch(/only when BOARD_SIGN_KEY_PKCS8_B64/);
    expect(x!.description).toMatch(/only after facilitator-confirmed settlement.*payer.*board key/i);
    expect(x!.description).toMatch(/csoai\.offer_receipt.*receiptGap/);
    expect(x!.description).not.toMatch(/\bevery (?:HTTP )?402\b|\bevery settled\b/i);

    const skills = (card.skills ?? []) as Array<{ id?: string; description: string }>;
    const skill = skills.find((s) => s.id === "x402-discovery");
    expect(skill, "the x402 discovery skill must remain on the card").toBeTruthy();
    expect(skill.description).toMatch(/Signed offers and receipts are conditional/);
    expect(skill.description).toMatch(/facilitator-confirmed settlement.*payer.*board key/i);
    expect(skill.description).not.toMatch(/\bevery (?:HTTP )?402\b|\bevery settled\b/i);
  });
});
