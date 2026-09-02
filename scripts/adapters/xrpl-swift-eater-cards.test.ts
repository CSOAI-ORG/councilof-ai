// Gate for the staged XRPL/SWIFT eater cards (public/interop/xrpl-swift-eater-2026-09).
//
// Fails the build if any staged card: exceeds 3072 canonical bytes (payload or
// whole card), carries a verdict word, claims MEASURED, has a sha256 that is not
// sha256(canonical payload), carries a signature that does not verify under
// did:web:csoai.org#board-attestation-1, or drifts off card-v0 / public.notice.
// Canonical form = sorted keys, compact separators, UTF-8 (ensure_ascii=false),
// byte-identical to scripts/publish_public_root.py canonical_bytes.
import { createHash, createPublicKey, verify as edVerify } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "..", "..");
const DIR = path.join(ROOT, "public", "interop", "xrpl-swift-eater-2026-09");
const CAP = 3072;
const SCHEMA = "https://councilof.ai/schema/card-v0.json";
const STATES = new Set(["PROBED", "DISCOVERED", "UNMEASURED"]);
const VERDICT =
  /\b(hacked|broken|unsafe|non-?compliant|compliant|violat(?:ed|es|ion|ions)?|fined|certif(?:ied|ication|y)|approved)\b|(?<!UN)MEASURED/i;

function canonical(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + canonical(o[k])).join(",") + "}";
  }
  return JSON.stringify(v);
}
const bytes = (s: string) => Buffer.byteLength(s, "utf8");
const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

function boardKey() {
  const did = JSON.parse(readFileSync(path.join(ROOT, "public", ".well-known", "did.json"), "utf8"));
  const vm = did.verificationMethod.find((m: { id: string }) => m.id === "did:web:csoai.org#board-attestation-1");
  return createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: vm.publicKeyJwk.x }, format: "jwk" });
}

const files = readdirSync(DIR).filter((f) => /^card-.*-unsigned\.json$/.test(f)).sort();

describe("xrpl-swift eater staged cards", () => {
  it("stages at least the 16 XRPL rows, the 26 SWIFT rows and the issuer disclosure cards", () => {
    expect(files.filter((f) => f.startsWith("card-xrpl-")).length).toBe(16);
    expect(files.filter((f) => f.startsWith("card-swift-")).length).toBe(26);
    expect(files.filter((f) => f.startsWith("card-disclosure-")).length).toBeGreaterThanOrEqual(8);
  });

  it("keeps a skip log and an artefact manifest beside the cards", () => {
    const log = readFileSync(path.join(DIR, "SKIPLOG.txt"), "utf8");
    expect(log.split("\n").filter((l) => l && !l.startsWith("#")).length).toBeGreaterThan(0);
    const manifest = JSON.parse(readFileSync(path.join(DIR, "artefact-manifest.json"), "utf8"));
    expect(manifest.sig_ed25519).toBeNull();
    expect(manifest.writes_board).toBe(false);
  });

  for (const f of files) {
    describe(f, () => {
      const raw = readFileSync(path.join(DIR, f), "utf8");
      const card = JSON.parse(raw);

      it("is card-v0 on surface public.notice with https sources", () => {
        expect(card.schema).toBe(SCHEMA);
        expect(card.surface).toBe("public.notice");
        expect(typeof card.subject).toBe("string");
        expect(Array.isArray(card.source_urls) && card.source_urls.length > 0).toBe(true);
        for (const u of card.source_urls) expect(u.startsWith("https://")).toBe(true);
      });

      it("is <= 3072 bytes canonical (payload and whole card) and stored in canonical form", () => {
        expect(bytes(canonical(card.payload))).toBeLessThanOrEqual(CAP);
        expect(bytes(canonical(card))).toBeLessThanOrEqual(CAP);
        expect(raw).toBe(canonical(card));
      });

      it("carries no verdict word and never claims MEASURED", () => {
        expect(canonical(card)).not.toMatch(VERDICT);
        expect(STATES.has(card.payload.state)).toBe(true);
      });

      it("sha256 is the id of the canonical payload; signature is null or VALID under #board-attestation-1", () => {
        expect(card.sha256).toBe(sha256(canonical(card.payload)));
        if (card.sig_ed25519 === null || card.sig_ed25519 === undefined) {
          expect(card.did_intended).toBe("did:web:csoai.org#board-attestation-1");
          return;
        }
        const ok = edVerify(null, Buffer.from(canonical(card.payload), "utf8"), boardKey(), Buffer.from(card.sig_ed25519, "hex"));
        expect(ok).toBe(true);
      });

      it("records method_id, inputs hash, dated fetch and an unmeasured[] list", () => {
        expect(card.payload.method_id).toBe("csoai.eater.xrpl-swift/0.1");
        expect(card.payload.inputs_sha256).toMatch(/^[0-9a-f]{64}$/);
        expect(card.payload.fetched_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        expect(Array.isArray(card.unmeasured)).toBe(true);
        expect(card.payload.writes_board).toBe(false);
      });
    });
  }
});
