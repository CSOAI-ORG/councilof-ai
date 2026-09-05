/**
 * board-attestation.test.mjs — the board's own signature, actually checked.
 *
 * CLAUDE.md records the board as "Stamp SIGNED (did:web:csoai.org#board-attestation-1)" and
 * BoardAttestation.tsx opened with "site_attestation (Ed25519, did:web:csoai.org#board-
 * attestation-1) verifies." Nothing in the estate was checking that. This does.
 *
 * WHAT IS TRUE, verified 2026-09-05:
 *   - /.well-known/did.json resolves on BOTH csoai.org and councilof.ai, id did:web:csoai.org,
 *     and carries #board-attestation-1 among five verification methods.
 *   - site_attestation.public_key_x EQUALS the DID's publicKeyJwk.x exactly. The key is right.
 *   - sig is 128 hex chars → 64 bytes, well formed.
 *   - The payload is STABLE: two fetches produce byte-identical canonical bodies and the same
 *     signature, so this is not a moving target.
 *
 * WHAT DOES NOT HOLD: the signature does not verify over the payload it documents. Twelve
 * readings were tried, including the one `sig_input` itself specifies — canonical JSON, keys
 * sorted by code point, separators ',' and ':', ensure_ascii FALSE, ECMAScript number
 * rendering (checked explicitly: this payload contains no integral floats, so that rule
 * changes nothing here) — plus ensure_ascii TRUE, unsorted, spaced, the body with
 * site_attestation-minus-sig included, and each of those as a SHA-256 digest and as a hex
 * digest string. None verified.
 *
 * THE LIKELY CAUSE, and it is a pattern this estate already knows. GET /api/corrections says
 * of its own ledger: "Signature is stale because the ledger was appended after signing. A
 * stale signature is a published defect, never a silent edit." The board has been swept since
 * (the payload's own totals.sweep_note records 8 financial axes added under ADR-001 on
 * 2026-08-26). Bytes that changed after signing produce exactly this.
 *
 * WHAT THE PRODUCT DOES, and it is the honest thing: BoardAttestation renders the signature
 * bytes and the algorithm and tells the reader how to verify. It does NOT assert a verdict,
 * so no user is told this verifies. The false claim lived only in the source comment, which
 * this change corrects.
 *
 * THIS TEST DOES NOT ASSERT THE SIGNATURE IS BROKEN. It asserts the state that was MEASURED,
 * and it fails either way — if a re-sign lands and it starts verifying, that is good news and
 * this file must be updated to expect it. Re-signing needs the estate key and is an owner
 * action; nothing here attempts it.
 *
 * Offline by default. LIVE_ATTESTATION=1 fetches and verifies for real.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash, createPublicKey, verify as edVerify } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");

/** Canonical JSON exactly as sig_input specifies, including ECMAScript number rendering. */
function canonical(o) {
  if (o === null) return "null";
  if (typeof o === "boolean") return o ? "true" : "false";
  if (typeof o === "number") {
    if (!Number.isFinite(o)) return "null";
    return String(o); // ECMAScript Number::toString — an integral float renders without .0
  }
  if (typeof o === "string") return JSON.stringify(o);
  if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
  const keys = Object.keys(o).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonical(o[k])).join(",") + "}";
}

function ed25519KeyFromJwkX(x) {
  const raw = Buffer.from(x.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  // SPKI prefix for Ed25519 public keys.
  const spki = Buffer.concat([
    Buffer.from("302a300506032b6570032100", "hex"),
    raw,
  ]);
  return createPublicKey({ key: spki, format: "der", type: "spki" });
}

describe("the board's site_attestation", () => {
  it("the source no longer claims the signature verifies", () => {
    // It was stated as fact in the component's own header and nothing checked it.
    const src = readFileSync(
      path.join(repo, "client/src/components/board/BoardAttestation.tsx"),
      "utf8",
    );
    assert.ok(
      !/site_attestation \(Ed25519, did:web:csoai\.org#board-attestation-1\) verifies\./.test(src),
      "BoardAttestation.tsx again asserts the site_attestation verifies. Measured 2026-09-05 " +
        "it does not, under twelve readings including its own documented sig_input. If a " +
        "re-sign has landed, prove it with this suite before restating the claim.",
    );
  });

  it("live: the DID resolves and carries the board key", async () => {
    if (!process.env.LIVE_ATTESTATION) {
      console.log("      (offline: LIVE_ATTESTATION unset — DID NOT fetched)");
      return;
    }
    const did = await (await fetch("https://councilof.ai/.well-known/did.json")).json();
    assert.equal(did.id, "did:web:csoai.org");
    const vm = did.verificationMethod.find((m) => m.id.endsWith("#board-attestation-1"));
    assert.ok(vm, "#board-attestation-1 is gone from the DID document");
    assert.ok(vm.publicKeyJwk?.x, "the board key has no publicKeyJwk.x");
  });

  it("live: the payload's key matches the DID, and the signature is well formed", async () => {
    if (!process.env.LIVE_ATTESTATION) {
      console.log("      (offline: LIVE_ATTESTATION unset — board NOT fetched)");
      return;
    }
    const board = await (await fetch("https://councilof.ai/api/gspc")).json();
    const did = await (await fetch("https://councilof.ai/.well-known/did.json")).json();
    const vm = did.verificationMethod.find((m) => m.id.endsWith("#board-attestation-1"));
    const att = board.site_attestation;
    assert.ok(att, "the board no longer carries site_attestation at all");
    assert.equal(
      att.public_key_x,
      vm.publicKeyJwk.x,
      "the board's public_key_x no longer matches the DID. That is a key rotation or a " +
        "mismatch, and it must be resolved before any verdict is drawn from the signature.",
    );
    assert.equal(att.alg, "Ed25519");
    assert.equal(Buffer.from(att.sig, "hex").length, 64, "sig is not 64 bytes");
  });

  it("live: the signature's verification state is the one recorded here", async () => {
    if (!process.env.LIVE_ATTESTATION) {
      console.log("      (offline: LIVE_ATTESTATION unset — signature NOT verified)");
      return;
    }
    const board = await (await fetch("https://councilof.ai/api/gspc")).json();
    const did = await (await fetch("https://councilof.ai/.well-known/did.json")).json();
    const vm = did.verificationMethod.find((m) => m.id.endsWith("#board-attestation-1"));
    const key = ed25519KeyFromJwkX(vm.publicKeyJwk.x);

    const { site_attestation: att, ...body } = board;
    const sig = Buffer.from(att.sig, "hex");

    const documented = Buffer.from(canonical(body), "utf8");
    const candidates = {
      "documented canonical(body)": documented,
      "sha256(documented)": createHash("sha256").update(documented).digest(),
      "hex sha256(documented)": Buffer.from(
        createHash("sha256").update(documented).digest("hex"),
        "utf8",
      ),
      "JSON.stringify(body) unsorted": Buffer.from(JSON.stringify(body), "utf8"),
    };

    const verified = Object.entries(candidates)
      .filter(([, msg]) => {
        try {
          return edVerify(null, msg, key, sig);
        } catch {
          return false;
        }
      })
      .map(([name]) => name);

    assert.deepEqual(
      verified,
      [],
      `the board signature now VERIFIES under: ${verified.join(", ")}. That is good news and ` +
        `this expectation is now stale — update this file and BoardAttestation.tsx to state ` +
        `that it verifies, and say which reading worked.`,
    );
  });
});
