import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const R = (p: string) => JSON.parse(readFileSync(resolve(__dirname, "../..", p), "utf8"));
const card = R("public/.well-known/agent-card.json");
const jwsInput = R("public/interop/agent-card-jws-input.json");

// RFC 8785 JCS for the shape this card actually has: objects, arrays, strings, booleans.
// Verified byte-identical against scripts/adapters/agent_card_jws.py's own JCS output before
// this test was trusted — a canonicaliser that disagrees with the signer is worse than none.
const sortDeep = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(sortDeep)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sortDeep((v as Record<string, unknown>)[k])]))
  : v;
const b64u = (s: string) => Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

describe("the agent card's signing input describes the card that is actually served", () => {
  it("payload_b64u is JCS(card minus signatures) of the CURRENT card", () => {
    // WHY THIS EXISTS. The card was edited and this input was never regenerated: on 2026-09-05
    // the served card advertised csoai-gspc-mcp@0.2.1 and "seven free readers plus four
    // x402-metered evidence tools" while the committed signing input still described 0.1.0 and
    // an older badge skill. Nothing called the generator, so nothing noticed. Signing that input
    // would have produced a signature over a card nobody serves — the worst possible outcome for
    // an artifact whose whole purpose is to let a stranger trust the card without asking us.
    const { signatures: _drop, ...payloadObj } = card as Record<string, unknown>;
    expect(b64u(JSON.stringify(sortDeep(payloadObj)))).toBe(jwsInput.payload_b64u);
  });

  it("signing_input_sha256 and byte length match the recomputed input", async () => {
    const { createHash } = await import("node:crypto");
    const { signatures: _drop, ...payloadObj } = card as Record<string, unknown>;
    const si = Buffer.from(`${jwsInput.protected_b64u}.${b64u(JSON.stringify(sortDeep(payloadObj)))}`, "utf8");
    expect(createHash("sha256").update(si).digest("hex")).toBe(jwsInput.signing_input_sha256);
    expect(si.length).toBe(jwsInput.signing_input_bytes);
  });

  it("nothing is claimed to be signed: the card carries no signature", () => {
    expect(card.signatures).toBeUndefined();
    expect(jwsInput.note).toMatch(/NO_LAPTOP_SIGN/);
    expect(jwsInput.alg).toBe("EdDSA");
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
});
